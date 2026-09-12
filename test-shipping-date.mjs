// The `_Shipping Date` that lands on a Shopify order must be the same date the
// storefront was showing at that moment — order #2861 recorded a same-day
// dispatch for an order placed at 7pm, because the value was snapshotted at
// add-to-cart. Run from the lucira-frontend folder:  node test-shipping-date.mjs
import assert from "node:assert";
import fs from "node:fs";

// utils.js is ESM in a CJS package; its three top imports aren't used by the
// dispatch code, so drop them and load the rest straight from memory.
const src = fs.readFileSync("src/lib/utils.js", "utf8").replace(/^import .*$/gm, "");
const { getShippingDateValue, formatDispatchMessage } = await import(
  "data:text/javascript," + encodeURIComponent(src)
);

// 11 Sept 2026 (Friday) in IST — defaults: in-stock cutoff 12:00, 0 days
// before it, 1 day after.
const at = (hhmm) => new Date(`2026-09-11T${hhmm}:00+05:30`);

assert.equal(getShippingDateValue(null, { inStock: true, now: at("10:00") }), "11/09/2026");
// The order that started this: paid at 19:04, so dispatch is tomorrow.
assert.equal(getShippingDateValue(null, { inStock: true, now: at("19:04") }), "12/09/2026");
// Made to order: lead_time + buffer, never same-day.
assert.equal(getShippingDateValue(null, { inStock: false, leadTime: 12, now: at("10:00") }), "26/09/2026");

// And it has to agree with the line the shopper is reading in the cart.
for (const t of ["10:00", "19:04"]) {
  const info = formatDispatchMessage(null, { inStock: true, now: at(t), allowTimer: false });
  const shown = `${String(info.date.getUTCDate()).padStart(2, "0")}/${String(info.date.getUTCMonth() + 1).padStart(2, "0")}/${info.date.getUTCFullYear()}`;
  assert.equal(getShippingDateValue(null, { inStock: true, now: at(t) }), shown);
}

console.log("ok");
