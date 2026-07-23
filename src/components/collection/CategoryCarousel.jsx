"use client";

/**
 * CategoryCarousel — a premium, mobile-only "shop by …" row for the PLP.
 *
 * The PLP renders ONE carousel per menu group that exists for the current
 * collection's category (e.g. "Shop By Style", "Shop By Shape", "Gifts",
 * "Shop For"), distributed individually through the product grid. Categories
 * whose menu has no such groups get none.
 *
 * `loadCategoryGroups(handle)` reads the site menu and returns the list of
 * groups (heading + image tiles). This component renders a single group.
 */

import Link from "next/link";
import Image from "next/image";
import { getMenu } from "@/lib/menus";

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

/** Fetch the menu and build the category groups for a collection. */
export async function loadCategoryGroups(currentHandle) {
  const items = await getMenu("main-menu-official");
  return buildCategoryGroups(items, currentHandle);
}

export default function CategoryCarousel({ heading, tiles }) {
  if (!tiles?.length) return null;

  return (
    <section className="rounded-[14px] bg-gradient-to-b from-[#FBF1F1] to-[#F7ECEC] px-4 pb-4 pt-4">
      <h3 className="mb-3 font-figtree text-[13px] font-semibold uppercase tracking-[0.08em] text-[#3d2a1e]">
        {heading}
      </h3>

      <div
        className="flex snap-x gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {tiles.map((t) => (
          <Link
            key={t.handle}
            href={t.href}
            prefetch={false}
            className="w-[142px] shrink-0 snap-start overflow-hidden rounded-[8px] bg-white/70 shadow-[0_2px_10px_rgba(90,65,63,0.08)] transition-transform active:scale-[0.98]"
          >
            {/* Image plate — a skewed box behind + a bordered card in front */}
            <div className="p-5 pb-2">
              <div className="relative">
                {/* skewed box on the back */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -rotate-[6deg] rounded-[8px] border border-[#D8BBB4] bg-[#FBF1F1]"
                />
                {/* bordered card in front */}
                <div className="relative rounded-[8px] border border-[#E7D5D1] bg-white px-6 pb-[38px] pt-[18px]">
                  <div className="relative aspect-square">
                    <Image
                      src={t.image}
                      alt={t.title}
                      fill
                      sizes="142px"
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  {t.count > 0 && (
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#f4f0f0] px-2.5 py-1 text-[10px] font-semibold text-[#5A413F] shadow-sm">
                      {t.count}+ Designs
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Name bar */}
            <div className="mt-2.5 bg-[#5A413F] px-3 py-2.5">
              <p className="truncate text-center font-figtree text-xs font-semibold text-white">
                {t.title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
