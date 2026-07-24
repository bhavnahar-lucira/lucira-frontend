/**
 * Pure geometry + size-resolution for the online ring sizer.
 *
 * No React, no DOM, no side effects - everything here is a plain function so
 * the math can be unit-tested independently of the UI. All physical constants
 * live at the top.
 *
 * The whole tool rests on one idea: we cannot know how big a CSS pixel is in
 * real millimetres, so we make the user tell us by matching an on-screen
 * outline to a real-world object of known size. That gives `pxPerMm`, and
 * every later measurement is just a division.
 */

import { RING_SIZES, SIZER_TABLE } from "@/data/ringSizes";

/* -------------------------------------------------------------------------
 * Physical constants
 * ---------------------------------------------------------------------- */

/**
 * ISO/IEC 7810 ID-1. Every debit/credit card in the world is this size, which
 * is exactly why it is the standard calibration target for tools like this.
 */
export const CARD_LONG_MM = 85.6;
export const CARD_SHORT_MM = 53.98;
export const CARD_RADIUS_MM = 3.18;

/** Indian ₹10 bimetallic coin. Small-screen fallback - see pickCalibrationTarget(). */
export const COIN_10_MM = 27.0;

export const CALIBRATION_TARGETS = {
  card: {
    id: "card",
    label: "Debit / Credit Card",
    // We match the SHORT edge. See pickCalibrationTarget() for why the long
    // edge is unusable.
    referenceMm: CARD_SHORT_MM,
    longEdgeMm: CARD_LONG_MM,
    radiusMm: CARD_RADIUS_MM,
  },
  coin: {
    id: "coin",
    label: "₹10 Coin",
    referenceMm: COIN_10_MM,
  },
};

/**
 * Paper-strip correction, in mm of DIAMETER, subtracted from the strip result.
 *
 * Deliberately 0. When a user wraps a strip and marks the overlap they are
 * measuring the inner circumference, which is what we want, so paper thickness
 * mostly cancels out. The real error is that people pull the strip tight and
 * compress the finger, which biases the reading SMALL, not large.
 *
 * The honest value is whatever falls out of measuring real fingers against
 * real ring mandrels on real devices. Until that testing happens this stays 0
 * rather than shipping a guessed fudge factor that silently skews every
 * result. Set it from the phase-6 test data.
 */
export const PAPER_STRIP_CORRECTION_MM = 0;

/**
 * Bounds on a believable pxPerMm. Used to reject a calibration that is
 * obviously wrong (user dragged to an extreme, cached value from a different
 * device, browser zoom in play).
 *
 * Real phones land roughly 3.5-7 CSS px/mm:
 *   iPhone SE      375 css px / 58.4 mm = 6.4
 *   iPhone 15      393 css px / 65.1 mm = 6.0
 *   Pixel 7        412 css px / 64.5 mm = 6.4
 * Desktop monitors sit near 3.8. The window is intentionally generous.
 */
export const MIN_PX_PER_MM = 2.0;
export const MAX_PX_PER_MM = 12.0;

/* -------------------------------------------------------------------------
 * Calibration
 * ---------------------------------------------------------------------- */

/**
 * Convert a matched on-screen length into a pixels-per-millimetre ratio.
 *
 * @param {number} measuredPx  on-screen length the user matched, in CSS px
 * @param {number} referenceMm true size of the physical object, in mm
 */
export function computePxPerMm(measuredPx, referenceMm) {
  if (!(measuredPx > 0) || !(referenceMm > 0)) return null;
  return measuredPx / referenceMm;
}

export function isPlausiblePxPerMm(pxPerMm) {
  return (
    typeof pxPerMm === "number" &&
    Number.isFinite(pxPerMm) &&
    pxPerMm >= MIN_PX_PER_MM &&
    pxPerMm <= MAX_PX_PER_MM
  );
}

/**
 * Decide which calibration object the device can actually display at 1:1.
 *
 * This is the constraint that shapes the whole calibration screen. A card's
 * LONG edge is 85.6mm and NO phone can render that at true size in portrait:
 *
 *   iPhone 13 mini  1080px @ 476ppi -> 57.6 mm of physical screen width
 *   iPhone SE       750px  @ 326ppi -> 58.4 mm
 *   Galaxy S23      1080px @ 425ppi -> 64.5 mm
 *   iPhone 15       1179px @ 460ppi -> 65.1 mm
 *   15 Pro Max      1290px @ 460ppi -> 71.2 mm  <- widest mainstream phone
 *
 * 71.2mm is the ceiling, and 85.6mm is well past it. The short edge (53.98mm)
 * clears every device above, though only by ~2mm on an SE / 13 mini - hence
 * the coin fallback for anything narrower.
 *
 * @param {number} viewportPx  usable width in CSS px
 * @param {number} estPxPerMm  rough px/mm estimate (pre-calibration guess is fine)
 */
export function pickCalibrationTarget(viewportPx, estPxPerMm) {
  if (!(viewportPx > 0) || !isPlausiblePxPerMm(estPxPerMm)) {
    return CALIBRATION_TARGETS.card;
  }
  const availableMm = viewportPx / estPxPerMm;
  // Need the reference to fit with a little breathing room either side.
  const fitsCard = availableMm >= CARD_SHORT_MM + 4;
  return fitsCard ? CALIBRATION_TARGETS.card : CALIBRATION_TARGETS.coin;
}

/* -------------------------------------------------------------------------
 * Measurement -> millimetres
 * ---------------------------------------------------------------------- */

/** Mode A: user scaled a circle to the inside of an existing ring. */
export function pxToDiameterMm(diameterPx, pxPerMm) {
  if (!isPlausiblePxPerMm(pxPerMm) || !(diameterPx > 0)) return null;
  return diameterPx / pxPerMm;
}

/** Mode B: user scaled a line to a marked paper strip. */
export function pxToCircumferenceMm(lengthPx, pxPerMm) {
  if (!isPlausiblePxPerMm(pxPerMm) || !(lengthPx > 0)) return null;
  return lengthPx / pxPerMm;
}

export function circumferenceToDiameter(
  circumferenceMm,
  correctionMm = PAPER_STRIP_CORRECTION_MM
) {
  if (!(circumferenceMm > 0)) return null;
  return circumferenceMm / Math.PI - correctionMm;
}

export const diameterToCircumference = (diameterMm) =>
  diameterMm > 0 ? diameterMm * Math.PI : null;

/* -------------------------------------------------------------------------
 * Millimetres -> ring size
 * ---------------------------------------------------------------------- */

/**
 * How far into the gap between two sizes a reading must fall before we round
 * up to the larger one. 0.5 would be plain nearest-neighbour; 0.35 tilts
 * toward the larger size.
 *
 * The asymmetry is deliberate and matches how jewellers size by hand: a
 * slightly loose ring is wearable and can be resized down later, while a
 * slightly tight one will not pass the knuckle at all. Erring large is the
 * cheaper mistake for both the customer and the returns desk.
 */
export const ROUND_UP_THRESHOLD = 0.35;

/**
 * Resolve an inner diameter to a ring size.
 *
 * Works on the bracketing pair rather than a global nearest-match, because
 * the chart's step is not constant (it alternates ~0.3mm and ~0.4mm), so
 * "how far between two sizes am I" has to be measured against the local gap.
 *
 * @returns {{
 *   size: object|null,
 *   alternativeSize: object|null,  // the other side of the bracket, when ambiguous
 *   measuredMm: number,
 *   status: 'ok'|'below_range'|'above_range',
 *   deltaMm: number|null,          // measured minus matched size
 *   confidence: 'high'|'medium'|'low'
 * }}
 */
export function diameterToRingSize(diameterMm, options = {}) {
  const { table = SIZER_TABLE, threshold = ROUND_UP_THRESHOLD } = options;

  const miss = (status, size = null) => ({
    size,
    alternativeSize: null,
    measuredMm: diameterMm,
    status,
    deltaMm: null,
    confidence: "low",
  });

  if (!(diameterMm > 0) || !table.length) return miss("below_range");

  const smallest = table[0];
  const largest = table[table.length - 1];

  // Half a step of slack at each end, so a reading a hair outside the stocked
  // range still resolves instead of dead-ending the user.
  if (diameterMm < smallest.diameterMm - 0.15) return miss("below_range", smallest);
  if (diameterMm > largest.diameterMm + 0.15) return miss("above_range", largest);

  // Clamp into the table, then find the bracketing pair.
  let lowIdx = 0;
  for (let i = 0; i < table.length - 1; i++) {
    if (diameterMm >= table[i].diameterMm) lowIdx = i;
    else break;
  }

  const low = table[lowIdx];
  const high = table[lowIdx + 1] ?? low;
  const gap = high.diameterMm - low.diameterMm;

  // frac = 0 sits exactly on `low`, frac = 1 sits exactly on `high`.
  const frac = gap > 0 ? (diameterMm - low.diameterMm) / gap : 0;
  const roundedUp = frac >= threshold;

  const size = roundedUp ? high : low;
  const other = roundedUp ? low : high;
  const deltaMm = diameterMm - size.diameterMm;

  // How ambiguous was the call? Sitting on a size is a clean read; sitting in
  // the middle of a gap means we genuinely cannot tell the two apart.
  const distanceFromNearest = Math.min(frac, 1 - frac);
  const confidence =
    distanceFromNearest <= 0.15 ? "high" : distanceFromNearest <= 0.3 ? "medium" : "low";

  return {
    size,
    // Only worth showing the alternative when the reading was genuinely
    // between two sizes.
    alternativeSize: confidence === "low" && other !== size ? other : null,
    measuredMm: diameterMm,
    status: "ok",
    deltaMm,
    confidence,
  };
}

export function circumferenceToRingSize(circumferenceMm, options = {}) {
  const diameterMm = circumferenceToDiameter(
    circumferenceMm,
    options.correctionMm ?? PAPER_STRIP_CORRECTION_MM
  );
  if (diameterMm === null) {
    return { size: null, measuredMm: null, status: "below_range", deltaMm: null, confidence: "low" };
  }
  return { ...diameterToRingSize(diameterMm, options), circumferenceMm };
}

/* -------------------------------------------------------------------------
 * Display helpers
 * ---------------------------------------------------------------------- */

/**
 * The chart stores diameter at 1 decimal place, so never render more than
 * that - showing "16.53 mm" implies precision the underlying data does not
 * have.
 */
export const formatMm = (mm) => (mm > 0 ? `${mm.toFixed(1)} mm` : "--");

/**
 * Wide bands sit against more of the finger and need roughly half a size
 * more room. Surfaced as a suggestion on the result screen, never applied
 * silently.
 */
export function suggestWideBandAdjustment(sizeEntry, table = SIZER_TABLE) {
  if (!sizeEntry) return null;
  const idx = table.findIndex((s) => s.ind === sizeEntry.ind);
  if (idx === -1 || idx + 1 >= table.length) return null;
  return table[idx + 1];
}
