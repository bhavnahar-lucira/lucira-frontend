import StoreLocatorClient from "./StoreLocatorClient";

// ISR: Store locator page is cached for 1 year.
// This ensures high performance and minimal Vercel costs for static content.
export const revalidate = 31536000; // 1 year

export default function StoreLocatorPage() {
  return <StoreLocatorClient />;
}
