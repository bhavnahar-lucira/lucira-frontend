import { pushPromoClick } from "@/lib/gtm";

// Mobile signup-popup: 100% scratch card rollout on mobile; desktop always gets the wheel.
export const SIGNUP_EXPERIMENT_ID = "signup_popup_mobile_v1";
export const VARIANT_SPIN = "spin_wheel";
export const VARIANT_SCRATCH = "scratch_card";

const STORAGE_KEY = "lucira_signup_exp_v1";

// 0 = kill switch (everyone on the wheel), 100 = full rollout (default: 100% scratch card on mobile).
const SCRATCH_PERCENT = (() => {
  const envVal = process.env.NEXT_PUBLIC_SCRATCH_CARD_PERCENT;
  const n = envVal !== undefined && envVal !== "" ? Number(envVal) : 100;
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 100;
})();

/**
 * Mobile signup variant: 100% Scratch Card.
 * `?signup_variant=spin_wheel|scratch_card` can still be used for QA.
 * Any legacy "spin_wheel" stored in localStorage from earlier tests is automatically updated.
 */
export function getSignupVariant() {
  if (typeof window === "undefined") return VARIANT_SCRATCH;
  try {
    const forced = new URLSearchParams(window.location.search).get("signup_variant");
    if (forced === VARIANT_SPIN) {
      localStorage.setItem(STORAGE_KEY, forced);
      return forced;
    }
    if (forced === VARIANT_SCRATCH) {
      localStorage.setItem(STORAGE_KEY, forced);
      return forced;
    }
    if (SCRATCH_PERCENT <= 0) return VARIANT_SPIN;
    // 100% rollout: always assign and return scratch_card on mobile
    localStorage.setItem(STORAGE_KEY, VARIANT_SCRATCH);
    return VARIANT_SCRATCH;
  } catch {
    return VARIANT_SCRATCH;
  }
}

/**
 * The A/B test's success metric: ONE `promoClick` when a customer logs in or
 * signs up successfully through the auto popup, in the site's standard
 * 5-field promoClick shape:
 *   creative_name  "Signup Popup - Login Success"
 *   promo_id       which popup: "scratch_card" | "spin_wheel"
 *   promo_position reward value: "750_off" | "1000_off" | "1500_off" | "none"
 *   promo_name     "New User" (account created) | "Existing User" (logged in)
 *   location_id    page path the popup was on
 * Desktop always gets the wheel — filter GA4's device category to mobile.
 */
export function trackSignupSuccess({ variant, isNewUser, rewardValue } = {}) {
  if (!variant) return;
  pushPromoClick({
    creative_name: "Signup Popup - Login Success",
    promo_id: variant,
    promo_position: rewardValue || "none",
    promo_name: isNewUser ? "New User" : "Existing User",
    location_id: typeof window !== "undefined" ? window.location.pathname : "",
  });
}
