// Shared XML builders for the distributed sitemap (sitemap.xml index + per-type
// child sitemaps under src/app/sitemap-*.xml/route.js). Next.js's built-in
// MetadataRoute.Sitemap convention only emits a flat <urlset>, so a real
// <sitemapindex> requires hand-rolled XML — this keeps that XML in one place.

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  }[c]));
}

function toIsoDate(value) {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

export function buildUrlset(entries) {
  const body = entries
    .map(
      ({ url, lastModified, changeFrequency, priority }) => `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${toIsoDate(lastModified)}</lastmod>
    <changefreq>${changeFrequency}</changefreq>
    <priority>${priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

export function buildSitemapIndex(sitemaps) {
  const body = sitemaps
    .map(
      ({ url, lastModified }) => `  <sitemap>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${toIsoDate(lastModified)}</lastmod>
  </sitemap>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>`;
}

export function xmlResponse(xml) {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

// A URL can be produced by more than one source (e.g. a static route and a
// Shopify page handle both resolving to "/pages/store-locator"). Duplicate
// <loc> entries are invalid in a sitemap — keep the first occurrence.
export function dedupeByUrl(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
