import StoreLocatorClient from "./StoreLocatorClient";
import { getStorePages } from "@/lib/storeContent";

// ISR: Store locator page is cached for 1 year.
// This ensures high performance and minimal Vercel costs for static content.
// Saving a store in Dashboard → Stores revalidates this path explicitly, so the
// long window never holds a new store back.
export const revalidate = 31536000; // 1 year

export default async function StoreLocatorPage() {
  const storePages = await getStorePages();
  return <StoreLocatorClient storePages={storePages} />;
}
