// FAQPage structured data for a blog article, read out of the article's own
// body so it is added automatically for every new post with an FAQ section and
// can never drift from the questions the reader actually sees.
//
// Editors write that section in Shopify one of two ways, and both are handled:
//
//   A. <h2>FAQs</h2>
//      <h3>Question?</h3>
//      <p>Answer…</p>
//
//   B. <h2>Frequently asked questions</h2>
//      <p><strong>Q. Question?</strong><br>Answer…</p>
//      (the answer sometimes follows in the next <p> instead)
//
// Anything else in the section — an illustration, a divider, a product card —
// is skipped, and a question is only taken if it reads as one (has a "?"), so a
// sub-heading that happens to sit under the FAQ heading is not published as a
// question.

const ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", hellip: "…",
};

function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

function toText(html) {
  return decodeEntities(
    String(html || "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(p|li)>/gi, " ")
      .replace(/<[^>]*>/g, "")
  )
    .replace(/\s+/g, " ")
    .trim();
}

// "Q. What is…", "Q: What is…", "Q1. What is…", "4. What is…" → "What is…"
const stripQuestionPrefix = (q) => q.replace(/^(q\s*\d*|\d+)\s*[.:)-]\s*/i, "").trim();

const isQuestion = (q) => q.length > 3 && q.includes("?");

/** The HTML between the FAQ heading and the next heading at its level or above. */
function faqSection(html) {
  const heading = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = heading.exec(html))) {
    if (!/^(faqs?\b|frequently asked questions)/i.test(toText(match[2]))) continue;
    const level = Number(match[1]);
    const rest = html.slice(match.index + match[0].length);
    const end = rest.search(new RegExp(`<h[1-${level}]\\b`, "i"));
    return end === -1 ? rest : rest.slice(0, end);
  }
  return "";
}

/** Top-level answer blocks: paragraphs and lists, in order. */
const blocks = (html) => html.match(/<(p|ul|ol)\b[^>]*>[\s\S]*?<\/\1>/gi) || [];

// Pattern A: each sub-heading is a question, and the blocks under it until the
// next sub-heading are its answer.
function fromSubHeadings(section) {
  const parts = section.split(/(<h[3-6]\b[^>]*>[\s\S]*?<\/h[3-6]>)/i);
  const faqs = [];
  for (let i = 1; i < parts.length; i += 2) {
    const question = stripQuestionPrefix(toText(parts[i]));
    const answer = blocks(parts[i + 1] || "").map(toText).filter(Boolean).join(" ");
    if (isQuestion(question) && answer) faqs.push({ question, answer });
  }
  return faqs;
}

// Pattern B: a paragraph that opens with bold text is a question. Its answer is
// whatever follows the bold in the same paragraph, or the paragraphs after it
// up to the next question when the paragraph holds nothing else.
function fromBoldParagraphs(section) {
  const faqs = [];
  let current = null;
  for (const block of blocks(section)) {
    // Leading images and empty wrappers are decoration, not text.
    const body = block
      .replace(/^<(p|ul|ol)\b[^>]*>/i, "")
      .replace(/<img\b[^>]*>/gi, "")
      .replace(/^(\s|<\/?span\b[^>]*>)*/i, "");
    const lead = body.match(/^((?:\s*<(strong|b)\b[^>]*>[\s\S]*?<\/\2>\s*(?:<\/?span\b[^>]*>\s*)*)+)/i);
    const question = lead ? stripQuestionPrefix(toText(lead[1])) : "";

    if (lead && isQuestion(question)) {
      if (current?.answer) faqs.push(current);
      current = { question, answer: toText(body.slice(lead[0].length)) };
    } else if (current) {
      const more = toText(block);
      if (more) current.answer = current.answer ? `${current.answer} ${more}` : more;
    }
  }
  if (current?.answer) faqs.push(current);
  return faqs;
}

/** `[{ question, answer }]` from an article's body HTML; empty when it has no FAQ section. */
export function extractArticleFaqs(html) {
  const section = faqSection(String(html || ""));
  if (!section) return [];
  const bySubHeading = fromSubHeadings(section);
  return bySubHeading.length > 0 ? bySubHeading : fromBoldParagraphs(section);
}

/** FAQPage JSON-LD for the article, or null when it has no FAQ section. */
export function getArticleFaqSchema(html) {
  const faqs = extractArticleFaqs(html);
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(({ question, answer }) => ({
      "@type": "Question",
      "name": question,
      "acceptedAnswer": { "@type": "Answer", "text": answer },
    })),
  };
}
