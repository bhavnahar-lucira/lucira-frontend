# Deployment — `website-issues-live`

## 1. Completed Updates & File Specific Explanations

This section outlines the logical changes grouped by feature, mapping directly to the source
files altered in this release.

### Discounts & Cart Enhancements

Coupons and Lucira Coins are now strictly mutually exclusive across the application state.

**File:** `src/redux/features/cart/cartSlice.js`
**Change:** Enforced Mutually Exclusive Discounts.
**Explanation:** Modified the application state manager to guarantee only one discount can be
active. The `applyCoupon` action now explicitly clears `nectorPoints`, and conversely,
`applyPoints` clears the `appliedCoupon`.

**File:** `src/components/cart/CartSummary.jsx`
**Change:** Updated Manual Coupon Application.
**Explanation:** Added logic so that when a user manually enters and applies a coupon code, the
component intercepts it to automatically remove any active Lucira Coins, accompanied by a
notification toast alerting the user of the substitution.

**File:** `src/components/cart/CheckoutSummary.jsx`
**Change:** Updated Eterna Banner Application & Fixed Missing Coins.
**Explanation:**
- Clicking the Eterna Collection banner's "Apply Now" button safely clears applied Lucira
  Coins, notifies the user, and then applies the 3% discount.
- **UI Fix:** Removed a rogue `lg:hidden` Tailwind class that was unintentionally masking the
  "Lucira Coins / Redeemed coins" line item in the desktop price breakdown.

### Navigation Menus

**File:** `src/data/menu-data.json`
**Change:** Added new mega menu / mobile drawer entries.
**Explanation:** Injected entries for Gold Rings (after Men's Rings) and Gold Earrings (after
Men's Earrings). Since this JSON file directly feeds `getMenu()`, modifying it instantly
updates both the desktop mega menu and the mobile drawer. It reuses existing
`custom.menu_links_image_icon` metafields.

### Product Listing Page (PLP)

**File:** `src/app/(frontend)/collections/[handle]/CollectionPageClient.js`
**Change:** Banner capping and "Styled By Lucira" rendering fixes.
**Explanation:**
- **Banner Capping:** The promo banner previously looped infinitely at intervals (6, 16,
  26...). It is now strictly capped to the first two slots (products 6 and 16).
- **New User Rendering:** The "Styled By Lucira" video row was previously tied to the Recently
  Viewed history. It now correctly falls back to render in the empty Recently Viewed slot for
  first-time visitors with no history.
- **Reward Banner Type Scale:** The "Free ₹500 on completing your profile" label and its "Claim
  Now" CTA are now `text-xs` on mobile (`lg:text-base` unchanged).

### Checkout

**Files:** `src/app/(checkout-flow)/checkout/cart/page.js`, `src/components/cart/CartSummary.jsx`,
`src/components/cart/CheckoutSummary.jsx`
**Change:** "View Summary" scroll target.
**Explanation:** Added an optional `breakdownRef` so the button scrolls to the price breakdown
instead of the top of the summary column, with `scroll-mt-20` to clear the sticky 64px header.
See Known Issues — this is currently wired on the cart page only.

### UI, Layering, and Misc Fixes

**Files:** `src/components/ui/dialog.jsx`, `src/components/home/VideoPopup.jsx`
**Change:** Z-Index Layering Fix.
**Explanation:** Elevated modal components to `z-[600]`. Previously, the Sort/Filter bar
(`z-[500]`) and the WhatsApp/support FAB (`z-[499]`) were bleeding through and rendering on top
of these open dialogs.

**Files:** `src/components/product/ProductCard.jsx`, `src/components/AtcBar.jsx`
**Change:** Mobile UI Scaling.
**Explanation:** Downscaled the "View Details" button to `text-xs` with reduced padding on
mobile. Scaled the Mobile Add to Cart bar text from `text-base` to `text-sm`.

**File:** `src/components/common/TabTitleAnimator.jsx`
**Change:** Tab title animation delay.
**Explanation:** Introduced a 5-second buffer after a tab loses focus before the title cycling
begins, updating the cycle interval from 1.5s to 3s for better UX.

---

## 2. Deploy Instructions

Standard Next.js build procedure. There are no secondary systems to coordinate.

```bash
npm ci
npm run build
# deploy per usual pipeline
```

- **Backend:** `lucira-backend` is untouched.
- **Env vars:** None added or changed.
- **Shopify:** Editing "Main Menu - Official" in the Shopify admin has no effect. Menu is
  entirely driven by the committed JSON.

---

## 3. Post-Deploy Verification QA

Perform these tests primarily on a real mobile viewport (unless desktop is specified).

| # | Scenario | Expected Result |
|---|----------|-----------------|
| 1 | Cart: apply a coupon while Lucira Coins are applied. | Coins removed + toast shown; only one discount in the summary. |
| 2 | Checkout: click Eterna banner "Apply Now" with coins applied. | Coins removed + toast, then 3% applied. |
| 3 | Checkout summary on desktop. | "Redeemed N coins" line is visible in the breakdown. |
| 4 | Mega menu › Rings › Shop By Style. | "Gold Rings" appears after Men's Rings, with icon, linking correctly. |
| 5 | Mega menu › Earrings › Shop By Style. | "Gold Earrings" appears after Men's Earrings, with icon, linking correctly. |
| 6 | Mobile drawer. | Both new entries (Gold Rings/Earrings) are present. |
| 7 | PLP, scroll to ~60 products. | Promo banner appears twice only (products 6 and 16). |
| 8 | PLP in a fresh/incognito session. | "Styled By Lucira" video row renders where Recently Viewed would be. |
| 9 | PLP: open a product video popup. | Sort/Filter bar and WhatsApp/FAB are behind the popup. |
| 10 | Cart: tap "View Order Summary". | Scrolls to the summary breakdown, not hidden behind the sticky header. |
| 11 | Switch browser tab away for >5s. | Title starts cycling after 5s, ~3s per message; restores on return. |

> Note: this release was verified by code inspection, timer/grid simulation, and live Shopify
> queries — **not** by loading the running site. The QA pass above is the first real-browser check.

---

## 4. Rollback Strategy

All changes are frontend and self-contained; revert the branch merge and redeploy. The only
non-code artifact is `src/data/menu-data.json`, which is a plain committed file — reverting it
removes the two new menu entries. No data migration or cache purge is required.

---

## 5. Known Issues (Read Before Shipping)

- **Collection filter count is wrong:** With multiple store filters selected, the header shows
  the largest single filter's count instead of the true union (e.g. `685 items` for
  Chembur+Pune+Borivali, where the Shopify theme correctly shows `925 Of 2593 Products`). The
  fallback heuristic responsible lives in `CollectionPageClient.js` and **ships with this
  release**. Root cause is the backend's filtered-count query returning `0`. A verified fix
  exists (summing the Availability facet — reproduces 925 / 2593 exactly at no extra API cost)
  but requires a backend deploy and is reverted from this release.
- **"View Summary" scroll:** The improved scrolling target (`breakdownRef`) is only fixed on the
  cart page. `checkout/shipping` and `checkout/payment` screens still scroll to the top of the
  summary column.
- **Sheet / Drawer overlays tie with Sort/Filter bar:** Overlays remain at `z-[500]`, so the bar
  can still bleed through an open Sort/Filter panel on mobile.
- **`menu-data.json` is a stale snapshot:** Product counts have drifted from live Shopify data
  (e.g. Gold Rings records `15`; the live collection has `88`). The counts drive the "N Products"
  subtitle on image-grids but not the new text links.
- **`removeCoupon()` called without `dispatch`:** In `CheckoutSummary.jsx`, making it a no-op.
  Currently harmless because the `applyPoints` reducer clears the coupon natively, but the logic
  relies on that secondary reducer step.
