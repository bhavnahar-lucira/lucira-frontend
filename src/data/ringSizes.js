/**
 * Single source of truth for ring sizing.
 *
 * Transcribed from the master conversion chart supplied by the Lucira team
 * (WhatsApp reference, Dec 2025). This supersedes BOTH charts previously in
 * the codebase:
 *
 *   - `sizeData` in SizeGuideSheet.jsx / SizeGuideMobile.jsx - stored at 0.01in
 *     precision (= 0.254mm, nearly a full size step), unusable for measurement.
 *   - `ringSizeChart1/2` in pages/size-guide-1/page.jsx - mm-native but coarser
 *     (0.3-0.4mm steps, whole IND only) and it disagrees with this chart in
 *     places, e.g. IND 16 = 17.8mm there vs 17.9mm here.
 *
 * Those three should all be refactored onto this file.
 *
 * Steps are a uniform 0.2mm of diameter. `ind` is numeric so it can be
 * compared and sorted; `indLabel` is the display string ("12 1/2"). Half sizes
 * are retained for the reference tables but are NOT offered as sizer results -
 * see SIZER_TABLE below.
 *
 * Sanity check holds throughout: circumferenceMm ~= diameterMm * PI
 */

// prettier-ignore
const RAW = [
  // dia,  circ,  ind,   indLabel, us,        uk,        jp,   swiss
  [11.6, 36.5,  null, null,     "0",       null,      null, null],
  [11.8, 37.2,  null, null,     "1/4",     null,      null, null],
  [12.0, 37.8,  null, null,     "1/2",     "A",       null, null],
  [12.2, 38.4,  null, null,     "3/4",     "A 1/2",   null, null],
  [12.4, 39.1,  null, null,     "1",       "B",       1,    null],
  [12.6, 39.7,  0.5,  "1/2",    "1 1/4",   "B 1/2",   null, null],
  [12.9, 40.4,  0.75, "3/4",    "1 1/2",   "C",       null, null],
  [13.1, 41.0,  1,    "1",      "1 3/4",   "C 1/2",   null, null],
  [13.3, 41.6,  2,    "2",      "2",       "D",       2,    1.50],
  [13.5, 42.3,  2.5,  "2 1/2",  "2 1/4",   "D 1/2",   null, null],
  [13.7, 42.9,  3,    "3",      "2 1/2",   "E",       3,    2.75],
  [13.9, 43.5,  4,    "4",      "2 3/4",   "E 1/2",   null, null],
  [14.1, 44.2,  4.5,  "4 1/2",  "3",       "F",       4,    4.00],
  [14.3, 44.8,  5,    "5",      "3 1/4",   "F 1/2",   5,    5.25],
  [14.5, 45.5,  5.5,  "5 1/2",  "3 1/2",   "G",       null, null],
  [14.7, 46.1,  6,    "6",      "3 3/4",   "G 1/2",   6,    6.50],
  [14.9, 46.7,  6.5,  "6 1/2",  "4",       "H",       7,    null],
  [15.1, 47.4,  7,    "7",      "4 1/4",   "H 1/2",   null, 7.75],
  [15.3, 48.0,  8,    "8",      "4 1/2",   "I",       8,    null],
  [15.5, 48.7,  9,    "9",      "4 3/4",   "J",       null, 9.00],
  [15.7, 49.3,  9.5,  "9 1/2",  "5",       "J 1/2",   9,    null],
  [15.9, 49.9,  10,   "10",     "5 1/4",   "K",       null, 10.00],
  [16.1, 50.6,  10.5, "10 1/2", "5 1/2",   "K 1/2",   10,   null],
  [16.3, 51.2,  11,   "11",     "5 3/4",   "L",       null, 11.75],
  [16.5, 51.8,  12,   "12",     "6",       "L 1/2",   11,   12.75],
  [16.7, 52.5,  12.5, "12 1/2", "6 1/4",   "M",       12,   null],
  [16.9, 53.1,  13,   "13",     "6 1/2",   "M 1/2",   13,   14.00],
  [17.1, 53.8,  13.5, "13 1/2", "6 3/4",   "N",       null, null],
  [17.3, 54.4,  14,   "14",     "7",       "N 1/2",   14,   15.25],
  [17.5, 55.0,  15,   "15",     "7 1/4",   "O",       null, null],
  [17.7, 55.7,  15.5, "15 1/2", "7 1/2",   "O 1/2",   15,   16.50],
  [17.9, 56.3,  16,   "16",     "7 3/4",   "P",       null, null],
  [18.1, 56.9,  17,   "17",     "8",       "P 1/2",   16,   17.75],
  [18.3, 57.6,  17.5, "17 1/2", "8 1/4",   "Q",       null, null],
  [18.5, 58.2,  18,   "18",     "8 1/2",   "Q 1/2",   17,   null],
  [18.7, 58.9,  19,   "19",     "8 3/4",   "R",       null, 19],
  [18.9, 59.5,  19.5, "19 1/2", "9",       "R 1/2",   18,   null],
  [19.2, 60.1,  20,   "20",     "9 1/4",   "S",       null, 20.25],
  [19.4, 60.8,  21,   "21",     "9 1/2",   "S 1/2",   19,   null],
  [19.6, 61.4,  21.5, "21 1/2", "9 3/4",   "T",       null, 21.5],
  [19.8, 62.1,  22,   "22",     "10",      "T 1/2",   20,   null],
  [20.0, 62.7,  23,   "23",     "10 1/4",  "U",       21,   null],
  [20.2, 63.3,  23.5, "23 1/2", "10 1/2",  "U 1/2",   22,   22.75],
  [20.4, 64.0,  24,   "24",     "10 3/4",  "V",       null, null],
  [20.6, 64.6,  25,   "25",     "11",      "V 1/2",   23,   null],
  [20.8, 65.2,  25.5, "25 1/2", "11 1/4",  "W",       null, 25],
  [21.0, 65.9,  26,   "26",     "11 1/2",  "W 1/2",   24,   null],
  [21.2, 66.5,  26.5, "26 1/2", "11 3/4",  "X",       null, null],
  [21.4, 67.2,  27,   "27",     "12",      "X 1/2",   25,   27.50],
  [21.6, 67.8,  28,   "28",     "12 1/4",  "Y",       null, null],
  [21.8, 68.4,  28.5, "28 1/2", "12 1/2",  "Z",       26,   28.75],
  [22.0, 69.1,  29,   "29",     "12 3/4",  "Z 1/2",   null, null],
  [22.2, 69.7,  30,   "30",     "13",      null,      27,   null],
  [22.4, 70.3,  30.5, "30 1/2", "13 1/4",  "Z1",      null, null],
  [22.6, 71.0,  31,   "31",     "13 1/2",  null,      null, null],
  [22.8, 71.6,  32,   "32",     "13 3/4",  "Z2",      null, null],
  [23.0, 72.3,  32.5, "32 1/2", "14",      "Z3",      null, null],
  [23.2, 72.9,  33,   "33",     "14 1/4",  null,      null, null],
  [23.4, 73.5,  33.5, "33 1/2", "14 1/2",  "Z4",      null, null],
  [23.6, 74.2,  34,   "34",     "14 3/4",  null,      null, null],
  [23.8, 74.8,  35,   "35",     "15",      null,      null, null],
  [24.0, 75.4,  35.5, "35 1/2", "15 1/4",  null,      null, null],
  [24.2, 76.1,  36,   "36",     "15 1/2",  null,      null, null],
  [24.4, 76.7,  36.5, "36 1/2", "15 3/4",  null,      null, null],
  [24.6, 77.4,  37,   "37",     "16",      null,      null, null],
];

export const RING_SIZES = RAW.map(
  ([diameterMm, circumferenceMm, ind, indLabel, us, uk, jp, swiss]) => ({
    diameterMm,
    circumferenceMm,
    ind,
    indLabel,
    us,
    uk,
    jp,
    swiss,
  })
);

/**
 * The sizer only ever returns WHOLE Indian sizes, per the merchandising
 * requirement - Lucira manufactures on whole sizes, so resolving to "12 1/2"
 * would hand the customer a size that cannot be ordered.
 *
 * Note the resulting gaps are uneven (0.2mm between IND 11 and 12, but 0.4mm
 * between 12 and 13, since 12 1/2 is dropped). diameterToRingSize() brackets
 * against the local gap rather than assuming a fixed step, so this is handled
 * correctly.
 */
export const WHOLE_IND_SIZES = RING_SIZES.filter(
  (s) => s.ind !== null && Number.isInteger(s.ind)
);

/**
 * The IND range the sizer is allowed to return.
 *
 * The chart spans 1-37 but Lucira does not stock all of it. Readings outside
 * this window resolve to an "out of range" result so the user is routed to the
 * store / custom-order path instead of being given an unfulfillable size.
 *
 * TODO: confirm the real stocked range with merchandising.
 */
export const SIZER_MIN_IND = 5;
export const SIZER_MAX_IND = 26;

/** The table diameterToRingSize() matches against by default. */
export const SIZER_TABLE = WHOLE_IND_SIZES.filter(
  (s) => s.ind >= SIZER_MIN_IND && s.ind <= SIZER_MAX_IND
);

export const getSizeByInd = (ind) =>
  RING_SIZES.find((s) => s.ind === ind) ?? null;
