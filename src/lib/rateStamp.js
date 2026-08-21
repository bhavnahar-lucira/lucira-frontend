// Shared IST date/time stamp for the rate pages.
//
// Asia/Kolkata is pinned deliberately: the production server clock runs in UTC,
// so without it the stamp would show the previous day's date until 05:30 IST
// every morning.
//
// Used by both the <title> tag and the on-page H1 so the two can't drift apart
// and show a different time for the same render.

export function istRateStamp(now = new Date()) {
  const ist = (opts) =>
    new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...opts }).format(now);

  const fullDate = ist({ day: "numeric", month: "short", year: "numeric" }); // "18 Aug 2026"
  const time = ist({ hour: "numeric", hour12: true }).toUpperCase();         // "11 AM"

  return { fullDate, time, stamp: `${fullDate}, ${time}` };
}

// Hero titles come from a Shopify metaobject the marketing team edits, so skip
// the stamp when a date has already been written into one by hand rather than
// ending up with two. Covers both long ("August 2026") and short ("Aug 2026")
// month forms, since the title tag and the H1 use different ones.
export const ALREADY_DATED =
  /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{4}\b/i;
