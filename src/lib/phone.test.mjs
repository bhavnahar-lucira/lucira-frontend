/**
 * Run: node src/lib/phone.test.mjs
 *
 * Cases are the eight CUID formats found in the WebEngage audit (Sep 2026),
 * all of which belong to the same shopper.
 */
import assert from "node:assert/strict";
import { toE164, toLocal } from "./phone.js";

const CANON = "+919967337489";

// Every real-world spelling collapses to one identifier.
for (const input of [
  "9967337489",            // bare 10-digit  (GTM login push)
  "919967337489",          // 91, no plus    (send-otp / register)
  "+919967337489",         // already E.164  (Shopify, rewards sync)
  "09967337489",           // leading zero
  "+09967337489",          // leading zero behind a plus
  "+91+09967337489",       // double prefix
  "+91 99673-37489",       // spaces and dashes
  "(+91) 9967337489",      // brackets
  " 9967337489 ",          // stray whitespace
]) {
  assert.equal(toE164(input), CANON, `toE164(${JSON.stringify(input)})`);
}

// Junk is rejected outright, never forwarded as a half-formed identifier.
for (const input of ["", null, undefined, "abc", "12345", "1234567890", "5967337489"]) {
  assert.equal(toE164(input), "", `toE164(${JSON.stringify(input)}) should be ""`);
}

// A genuine foreign number keeps its own country code instead of being
// mangled into a fake Indian one by the last-10-digits rule.
assert.equal(toE164("+971501234567"), "+971501234567");
assert.equal(toE164("+14155552671"), "+14155552671");
assert.equal(toLocal("+971501234567"), "");

assert.equal(toLocal("919967337489"), "9967337489");
assert.equal(toLocal("garbage"), "");

console.log("phone.js: all assertions passed");
