import menuData from "@/data/menu-data.json";

import { transformMenuData } from "./menuTransform";

// Server-only: reads the generated menu JSON. The pure transform helpers live in
// `./menuTransform` so client components can import them without bundling the
// JSON. They are re-exported here for existing server-side importers.
export { COLLECTION_QUICK_LINKS, transformMenuData, withRingsMenuExtras } from "./menuTransform";

export async function getMenu(handle = "main-menu-official") {
  try {
    if (menuData.success && menuData.menus) {
        const found = menuData.menus.find(m => m.handle === handle);
        if (found) return found.items;
    }
    return [];
  } catch (error) {
    console.error("getMenu Error:", error);
    return [];
  }
}

/**
 * The menu already run through `transformMenuData`, ready for `<Header menuData>`.
 * Doing the transform here (server) means the RSC payload carries the slim
 * tree (labels, hrefs, icons) instead of the raw Shopify menu with every
 * resource's metafields, and the client no longer repeats the transform.
 */
export async function getHeaderMenu(handle = "main-menu-official") {
  return transformMenuData(await getMenu(handle));
}
