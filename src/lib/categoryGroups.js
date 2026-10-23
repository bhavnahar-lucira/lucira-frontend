/**
 * "Shop by …" category groups for the PLP, built from the site menu.
 *
 * Pure helpers only (no React, no browser APIs, no menu import), moved verbatim
 * from components/collection/CategoryCarousel.jsx so the server page can build
 * the groups and hand them to the client as a prop. That keeps `@/lib/menus`
 * (and the 811 KB menu JSON it imports) out of the browser bundle.
 */

/* Resolve a tile image from a menu node's metafields / resource.
   Prefer `menu_links_image_icon` (the dedicated "Shop by Style" tile art every
   sibling uses) over `mega_menu_image` (the desktop mega-menu asset) — otherwise
   a tile like Casual that has a stray mega_menu_image line-icon overrides its
   proper photo tile. */
function tileImage(node) {
  const nodes = node?.resource?.metafields?.nodes || [];
  for (const key of ["menu_image", "menu_links_image_icon", "mega_menu_image"]) {
    const f = nodes.find((m) => m.namespace === "custom" && m.key === key);
    const url =
      f?.reference?.image?.url ||
      (typeof f?.value === "string" && f.value.startsWith("http") ? f.value : null);
    if (url) return url;
  }
  return node?.resource?.image?.url || null;
}

/* Collection handle from a menu url (e.g. "/collections/solitaire-rings"). */
function handleFromUrl(url = "") {
  const path = String(url).replace(/https:\/\/[^/]+/, "");
  return path.split("/collections/")[1]?.split(/[/?#]/)[0] || "";
}

/* Turn a group's sub-items into premium tiles (needs an image + a collection). */
function tilesFromGroup(group) {
  const tiles = [];
  const seen = new Set();
  (group?.items || []).forEach((sub) => {
    const handle = handleFromUrl(sub.url);
    if (!handle || seen.has(handle)) return;
    const image = tileImage(sub);
    if (!image) return;
    seen.add(handle);
    tiles.push({
      handle,
      title: sub.title,
      href: `/collections/${handle}`,
      image,
      count: sub.resource?.productsCount?.count || 0,
    });
  });
  return tiles;
}

/* The non-"featured" menu groups for the category that owns this collection. */
function categoryGroupsFor(items, currentHandle) {
  for (const category of items || []) {
    const groups = (category.items || []).filter(
      (g) => !(g.title || "").toLowerCase().includes("featured")
    );
    const owns = groups.some((g) =>
      (g.items || []).some((sub) => handleFromUrl(sub.url) === currentHandle)
    );
    if (owns || handleFromUrl(category.url) === currentHandle) return groups;
  }
  return null;
}

/**
 * Build the list of category groups to show for a collection.
 * Returns [{ key, heading, tiles }]. Empty when the category has no groups.
 */
export function buildCategoryGroups(items, currentHandle) {
  const groups = categoryGroupsFor(items, currentHandle);
  if (!groups) return [];

  const out = [];
  groups.forEach((g) => {
    // Business rule: never surface "Shop By Material" as a carousel.
    if ((g.title || "").toLowerCase().includes("material")) return;
    const tiles = tilesFromGroup(g).filter((t) => t.handle !== currentHandle);
    if (tiles.length >= 2) {
      out.push({
        key: (g.title || "group").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        heading: g.title || "",
        tiles: tiles.slice(0, 12),
      });
    }
  });
  return out;
}
