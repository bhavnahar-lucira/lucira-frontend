import { shopifyStorefrontFetch } from "@/lib/shopify-client";

/**
 * Blog article + page search.
 *
 * The product backend (/api/products/search) only indexes products and
 * collections, so editorial content never showed up in search. These come
 * straight from the Shopify Storefront API instead.
 */
const CONTENT_SEARCH_QUERY = `
  query SearchContent($q: String!, $limit: Int!) {
    articles(first: $limit, query: $q) {
      edges {
        node {
          id
          title
          handle
          excerpt
          tags
          image { url altText }
          blog { handle }
        }
      }
    }
    pages(first: $limit, query: $q) {
      edges {
        node {
          id
          title
          handle
          bodySummary
        }
      }
    }
  }
`;

/* Shopify's `query:` on articles/pages is fuzzy and happily returns items that
   share no word with the term, so results are re-checked here: every word the
   shopper typed (2+ chars) must appear somewhere in the item's text. */
function matchesQuery(haystack, words) {
  const text = String(haystack || "").toLowerCase();
  return words.every((w) => text.includes(w));
}

/**
 * @param {string} query   raw search term
 * @param {number} limit   max items returned per type
 * @returns {Promise<Array<{id, type: 'article'|'page', title, url, image, excerpt}>>}
 */
export async function searchContent(query, limit = 4) {
  const term = String(query || "").trim();
  if (term.length < 2) return [];

  const words = term
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);

  try {
    // Ask for extra rows because the relevance re-check below drops some.
    const data = await shopifyStorefrontFetch(CONTENT_SEARCH_QUERY, {
      q: term,
      limit: Math.min(limit * 3, 20),
    });
    if (!data) return [];

    const articles = (data.articles?.edges || [])
      .map((e) => e.node)
      .filter((a) =>
        matchesQuery(
          `${a.title} ${a.excerpt || ""} ${(a.tags || []).join(" ")} ${a.handle}`,
          words
        )
      )
      .slice(0, limit)
      .map((a) => ({
        id: a.id,
        type: "article",
        title: a.title,
        // Articles live at /blogs/<blogHandle>/<articleHandle> — a single-segment
        // /blogs/<handle> would land on the blog listing, not the article.
        url: `/blogs/${a.blog?.handle || "stories"}/${a.handle}`,
        image: a.image?.url || "",
        excerpt: a.excerpt || "",
      }));

    const pages = (data.pages?.edges || [])
      .map((p) => p.node)
      .filter((p) => matchesQuery(`${p.title} ${p.bodySummary || ""} ${p.handle}`, words))
      .slice(0, limit)
      .map((p) => ({
        id: p.id,
        type: "page",
        title: p.title,
        url: `/pages/${p.handle}`,
        image: "",
        excerpt: p.bodySummary || "",
      }));

    return [...articles, ...pages];
  } catch (err) {
    console.error("[searchContent] Error:", err);
    return [];
  }
}
