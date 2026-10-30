// Single source of truth for the "X min read" label so the blog listing card
// and the article page always agree.
//
// Priority:
//   1. the `custom.read_time` metafield (the only signal available for the
//      section-based articles whose body Shopify hides from every API), and
//   2. a word count of whatever body text we do have, falling back to
//   3. a sane default.
//
// Both the listing query and the single-article query fetch `read_time`, so as
// long as an article has that metafield set the two views can't diverge.

const WORDS_PER_MINUTE = 220;
const DEFAULT_LABEL = "5 min read";

function label(minutes) {
  return `${minutes} min read`;
}

function minutesFromMetafield(article) {
  const raw = article?.read_time?.value ?? article?.read_time;
  if (raw == null) return null;
  const n = parseInt(String(raw).match(/\d+/)?.[0] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function minutesFromBody(article = {}) {
  // Only trust the real article body. The listing query returns an empty body
  // for section-based articles (Shopify hides it) — computing from the short
  // excerpt there would wrongly say "1 min read", so we fall through to the
  // metafield / default instead.
  const text =
    article.content ||
    (article.contentHtml ? article.contentHtml.replace(/<[^>]*>?/gm, " ") : "");
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 60) return null;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function getReadingTimeLabel(article) {
  const minutes = minutesFromMetafield(article) ?? minutesFromBody(article);
  return minutes ? label(minutes) : DEFAULT_LABEL;
}
