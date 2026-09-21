/**
 * Canonical Phone Normalization & Validation Utility
 *
 * WebEngage and CRM standard format: E.164 (+91XXXXXXXXXX)
 * Indian mobile numbers: 10 digits starting with 6, 7, 8, or 9
 */

/**
 * Normalizes any Indian or international phone number to E.164.
 *
 * Indian numbers (+91, 91, 0, or bare 10-digits) are canonicalized to:
 *   +91XXXXXXXXXX
 *
 * Rejects numbers that do not have 10 valid digits starting with 6-9 for India,
 * preventing malformed rows (+0..., +91+0..., etc.) from entering WebEngage as CUID.
 *
 * Preserves legitimate international E.164 numbers (+1..., +971..., etc.).
 *
 * @param {string|number} phone - Raw input phone number
 * @returns {string} Canonical E.164 string (e.g. "+919967337489") or "" if invalid.
 */
export function toE164(phone) {
  if (!phone) return "";
  const str = String(phone).trim();
  if (!str) return "";

  // Check for legitimate international E.164 (starts with '+', not '+91' or '+0')
  if (str.startsWith("+") && !str.startsWith("+91") && !str.startsWith("+0")) {
    const clean = str.replace(/[^\d]/g, "");
    if (clean.length >= 8 && clean.length <= 15) {
      return `+${clean}`;
    }
  }

  // Strip all non-digit characters
  let digits = str.replace(/\D/g, "");

  // If starts with 91 and has 12 digits (e.g., 919876543210)
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  // Strip all leading zeros (e.g., 09967337489 -> 9967337489)
  while (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // If there were nested prefixes like 9109967337489 (+91+0...)
  if (digits.length > 10 && digits.startsWith("91")) {
    digits = digits.slice(2);
    while (digits.startsWith("0")) {
      digits = digits.slice(1);
    }
  }

  // Exactly 10 digits starting with 6-9
  if (/^[6-9]\d{9}$/.test(digits)) {
    return `+91${digits}`;
  }

  // Fallback for valid international numbers that had a leading '+'
  const allDigits = str.replace(/\D/g, "");
  if (str.startsWith("+") && allDigits.length >= 10 && allDigits.length <= 15 && !allDigits.startsWith("0")) {
    return `+${allDigits}`;
  }

  return "";
}

/**
 * Returns the bare 10-digit Indian mobile number for form fields
 * that render a static "+91" prefix beside the input.
 *
 * @param {string|number} phone - Raw input phone number
 * @returns {string} 10-digit string or sanitized digits
 */
export function toTenDigit(phone) {
  if (!phone) return "";
  const e164 = toE164(phone);
  if (e164.startsWith("+91") && e164.length === 13) {
    return e164.slice(3);
  }
  let digits = String(phone).replace(/\D/g, "");
  while (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }
  return digits.slice(-10);
}

/**
 * Sanitizer for `<input onChange>` handlers in phone inputs.
 * Strips non-digits, strips leading zeros, strips leading 91 if 12 digits,
 * and caps at 10 digits.
 *
 * @param {string} value - Raw input value from event target
 * @returns {string} Cleaned up to 10 digits
 */
export function cleanPhoneInput(value) {
  let val = String(value || "").replace(/\D/g, "");
  while (val.startsWith("0")) {
    val = val.slice(1);
  }
  if (val.length === 12 && val.startsWith("91")) {
    val = val.slice(2);
  }
  return val.slice(0, 10);
}

/**
 * Checks whether a phone number is valid according to toE164.
 *
 * @param {string|number} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  return toE164(phone).length > 0;
}
