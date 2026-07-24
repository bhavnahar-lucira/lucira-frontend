import { pushPromoClick } from "@/lib/gtm";

/**
 * promoClick tracking for the ring sizer.
 *
 * Mirrors the "minimal" shape ProductPageClient uses for in-page CTAs
 * (see handlePromoClick(..., isMinimal = true)): promo_id, promo_name,
 * creative_name, plus whatever context the CTA carries.
 *
 * Kept in one module because these events fire from three different places -
 * the PDP size-guide drawer, the sizer flow, and the result screen - and the
 * funnel is only readable if the naming stays consistent across all of them.
 */

/** Every creative_name the sizer emits, in the order a shopper meets them. */
export const RING_SIZER_CREATIVE = {
  // Entry points, fired from the PDP size-guide drawer
  MEASURE_NOW: "Ring Sizer - Measure Now",
  SCAN_QR: "Ring Sizer - Scan QR Opened",

  // Flow progression
  STARTED: "Ring Sizer - Started",
  FLAT_SURFACE_NEXT: "Ring Sizer - Flat Surface Next",
  CALIBRATION_COMPLETED: "Ring Sizer - Calibration Completed",
  CALIBRATION_TARGET_CHANGED: "Ring Sizer - Calibration Target Changed",
  METHOD_RING: "Ring Sizer - Method Ring Selected",
  METHOD_PAPER: "Ring Sizer - Method Paper Strip Selected",
  PAPER_TOOLS_NEXT: "Ring Sizer - Paper Tools Next",
  SIZE_MEASURED: "Ring Sizer - Size Measured",

  // Result screen
  RESULT_USE_SIZE: "Ring Sizer - Use This Size",
  RESULT_BROWSE_RINGS: "Ring Sizer - Browse All Rings",
  RESULT_VISIT_STORE: "Ring Sizer - Visit Our Store",
  RESULT_PRODUCT_CLICKED: "Ring Sizer - Recommended Product Clicked",

  // Exit
  EXITED: "Ring Sizer - Exited",
};

/**
 * @param {string} creativeName one of RING_SIZER_CREATIVE
 * @param {object} extra        step, method, size, pxPerMm... whatever the CTA knows
 */
export function trackRingSizer(creativeName, extra = {}) {
  pushPromoClick({
    promo_id: "ring_sizer",
    promo_name: "Ring Sizer",
    creative_name: creativeName,
    promo_position: "Ring Sizer",
    ...extra,
  });
}

/**
 * Entry-point variant, fired from the PDP where a real product is in scope -
 * so these rows can be attributed to the product that drove the click, the
 * same way the other size-guide CTAs are.
 */
export function trackRingSizerEntry(creativeName, product, extra = {}) {
  pushPromoClick({
    promo_id: product?.sku || "ring_sizer",
    promo_name: product?.title || "Ring Sizer",
    creative_name: creativeName,
    location_id: "pdp",
    ...extra,
  });
}
