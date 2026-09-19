import { getStorePages } from "@/lib/storeContent";
import PopularSearchesClient from "./PopularSearchesClient";

/**
 * Server wrapper for the footer "Popular Searches" block.
 *
 * Owns its own store data so the layout doesn't have to know about it: the
 * "Visit our stores:" links come from Dashboard → Stores via `getStorePages`.
 * That fetch is `force-cache` and Next dedupes identical fetches within a
 * render, so this costs nothing extra when the page already loaded the stores.
 */
export default async function PopularSearches() {
  const storePages = await getStorePages();
  return <PopularSearchesClient storePages={storePages} />;
}
