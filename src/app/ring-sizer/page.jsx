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

export default function RingSizerPage() {
  return <RingSizerFlow />;
}
