import { pushPromoClick } from "@/lib/gtm";

// Mobile signup-popup A/B test: scratch card vs spin the wheel.
// Only the auto popup (AutoAuthPopup) on mobile is bucketed; desktop always
// gets the wheel and is reported as device_type "desktop" so it can be
// filtered out of the comparison.
export const SIGNUP_EXPERIMENT_ID = "signup_popup_mobile_v1";
export const VARIANT_SPIN = "spin_wheel";
export const VARIANT_SCRATCH = "scratch_card";

const STORAGE_KEY = "lucira_signup_exp_v1";

// 0 = kill switch (everyone on the wheel), 50 = even split, 100 = full rollout.
const SCRATCH_PERCENT = (() => {
  const n = Number(process.env.NEXT_PUBLIC_SCRATCH_CARD_PERCENT);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 50;
})();

/**
 * Sticky per-device bucket. `?signup_variant=scratch_card|spin_wheel` forces a
 * variant (for QA) and is remembered like a normal assignment.
 */
export function getSignupVariant() {
  if (typeof window === "undefined") return VARIANT_SPIN;
  try {
    const forced = new URLSearchParams(window.location.search).get("signup_variant");
    if (forced === VARIANT_SCRATCH || forced === VARIANT_SPIN) {
      localStorage.setItem(STORAGE_KEY, forced);
      return forced;
    }
    if (SCRATCH_PERCENT <= 0) return VARIANT_SPIN;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === VARIANT_SCRATCH || stored === VARIANT_SPIN) return stored;
    const assigned = Math.random() * 100 < SCRATCH_PERCENT ? VARIANT_SCRATCH : VARIANT_SPIN;
    localStorage.setItem(STORAGE_KEY, assigned);
    return assigned;
  } catch {
    return VARIANT_SPIN;
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
