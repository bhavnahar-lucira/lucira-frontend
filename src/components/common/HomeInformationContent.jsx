import { getStorePages } from "@/lib/storeContent";
import HomeInformationContentClient from "./HomeInformationContentClient";

/**
 * Server wrapper for the "Lucira's Experience Stores" block above the homepage
 * footer copy. Fetches the dashboard-managed stores itself (deduped by Next
 * against any other `getStorePages` call in the same render) and hands them to
 * the client component, which only renders on "/".
 */
export default async function HomeInformationContent() {
  const storePages = await getStorePages();
  return <HomeInformationContentClient storePages={storePages} />;
}
