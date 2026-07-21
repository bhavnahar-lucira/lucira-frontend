import { shopifyStorefrontFetch } from "@/lib/shopify";
import { RingSizerFlow } from "@/components/ring-sizer/RingSizerFlow";

/**
 * Standalone full-screen ring sizer.
 *
 * Deliberately sits OUTSIDE the (frontend) route group so it does not inherit
 * the site header and footer - the tool needs the whole viewport, and any
 * surrounding chrome competes with a flow the user is meant to follow one
 * step at a time.
 */
export const metadata = {
  title: "Ring Sizer | Lucira",
  description: "Find your ring size in under a minute using your phone.",
  robots: { index: false, follow: false },
};

/**
 * Route-scoped viewport lock. Pinch-zoom changes the physical size of a CSS
 * pixel, which is the one thing this page cannot tolerate.
 *
 * This is scoped to this route only and must NOT be lifted to the root layout:
 * disabling zoom site-wide is an accessibility regression. iOS Safari ignores
 * it regardless, which is why RingSizerFlow also watches visualViewport.scale
 * at runtime.
 */
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FAEFE9",
};

// Matches the collection pages: cached for 24h, refreshed by the same webhooks.
export const revalidate = 86400;

const RINGS_QUERY = `
  query RingSizerRecommendations {
    collectionByHandle(handle: "rings") {
      products(first: 24, sortKey: BEST_SELLING) {
        nodes {
          id
          title
          handle
          tags
          featuredImage { url altText width height }
          options { name values }
        }
      }
    }
  }
`;

/**
 * Recommended rings for the result screen.
 *
 * Fetched server-side so the carousel has real product imagery on first paint
 * rather than a client round-trip after the user has already seen their size.
 *
 * Size values in Shopify are ZERO-PADDED two-character strings ("05", "12"),
 * while the size chart stores plain integers - normalised here so the result
 * screen can filter cleanly. Getting this wrong silently matches nothing.
 */
async function getRecommendedRings() {
  try {
    const data = await shopifyStorefrontFetch(RINGS_QUERY, {}, { cache: "force-cache" });
    const nodes = data?.collectionByHandle?.products?.nodes ?? [];

    return nodes
      // Same rule the collection pages use: `hidden` products are not sale-ready.
      .filter((p) => !p.tags?.some((t) => t?.toLowerCase() === "hidden"))
      .filter((p) => p.featuredImage?.url)
      .map((p) => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        image: p.featuredImage.url,
        // Not featuredImage.altText - on this store that field holds the metal
        // colour ("White", "Yellow"), which describes the variant rather than
        // the product and reads as nonsense to a screen reader.
        alt: p.title,
        sizes: p.options?.find((o) => o.name?.toLowerCase() === "size")?.values ?? [],
      }))
      .slice(0, 12);
  } catch (error) {
    // A failed product fetch must never block someone from getting their size -
    // the carousel falls back to a neutral glyph.
    console.warn("[ring-sizer] recommended rings fetch failed:", error?.message);
    return [];
  }
}

export default async function RingSizerPage() {
  const products = await getRecommendedRings();
  return <RingSizerFlow products={products} />;
}
