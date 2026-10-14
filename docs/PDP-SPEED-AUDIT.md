# PDP Speed Audit — 13 Oct 2026

Branch: `sumit-1310-pdp-speed` (clean, identical to `master` at the time of the audit).
Scope: `/products/[handle]` on www.lucirajewelry.com — the server page, `ProductPageClient`, the gallery, and everything the root/frontend layouts add to the page.

## 1. Measured baseline

Real-user data (Chrome UX Report, last 28 days, mobile, this URL):

| Metric | Value | Target |
|---|---|---|
| Largest Contentful Paint | 5.3 s | < 2.5 s |
| Interaction to Next Paint | 302 ms | < 200 ms |
| First Contentful Paint | 3.0 s | < 1.8 s |
| Time to First Byte | 1.0 s | < 0.8 s |
| Cumulative Layout Shift | 0.06 | < 0.1 |

Core Web Vitals assessment: **Failed**. The PageSpeed Insights lab run timed out (`RPC::DEADLINE_EXCEEDED`), which by itself says the page is too heavy to finish inside Lighthouse's budget.

What the browser actually downloads for one PDP (measured with curl against production, `marquise-cut-with-side-diamonds-accent-engagement-ring`):

| Asset | Size |
|---|---|
| HTML document | 957 KB raw / 135 KB on the wire |
| of which RSC payload (`self.__next_f.push`) | 939 KB |
| JavaScript, 33 chunks | 2.80 MB raw / ~774 KB gzipped |
| Largest JS chunk (menu JSON + shared code) | 652 KB raw / 118 KB gzipped |
| PDP-specific chunk | 331 KB raw / 91 KB gzipped |
| Preloaded fonts | 4 woff2 files (the engraving fonts) |

Inside the RSC payload (decoded, 847 KB):

| Prop | Bytes | Note |
|---|---|---|
| `menuData` | 189 KB | sent on every page, also bundled in JS |
| `product` | 145 KB | 84 variants = 139 KB; raw `variant_config` strings alone = 63 KB |
| `storePages` | 19 KB × 3 | the same object is serialised three times |

## 2. Root causes, ranked by impact

### 2.1 The page has no server-rendered HTML at all

The `<body>` of the production response is just `<div hidden><!--$--><!--/$--></div>`, the GTM noscript and the toast container. Zero `<h1>`, zero `<img>`, zero `<header>`. Header, gallery, price, footer: everything paints only after ~775 KB of JS downloads, parses and hydrates. That is the direct cause of FCP 3.0 s and LCP 5.3 s.

Two independent things cause it. Both must be fixed:

1. `ProductPageClient` calls `useSearchParams()` with no `<Suspense>` boundary of its own. Next bails out to client rendering up to the nearest boundary, which is the `<Suspense fallback={null}>` in `src/app/layout.js` that wraps the entire app. Fix: wrap only the part that needs `?variant=` in its own small boundary (or read `searchParams` in `page.js` and pass `variantIdFromUrl` as a prop, which removes the hook entirely).
2. `src/redux/provider.js` wraps everything in `<PersistGate loading={null}>`. PersistGate renders `loading` until rehydration finishes, and rehydration never happens on the server, so SSR output is `null` regardless of point 1. Fix: drop PersistGate and rehydrate in an effect, or render children immediately and gate only the cart/wishlist UI on a `rehydrated` flag.

Expected effect: FCP moves from "after JS" to "first byte"; LCP image can be discovered from HTML; `generateStaticParams` + ISR finally produces real cached HTML instead of an empty shell.

### 2.2 The 811 KB menu JSON ships to every visitor twice

`src/lib/menus.js` does `import menuData from "@/data/menu-data.json"`. `Navbar.jsx` and `MobileHeader.jsx` import `transformMenuData` from that module, so Turbopack bundles the whole JSON into the client chunk (`8d6d1125…js`, 652 KB raw, 118 KB gz — the single biggest file on the page). The server layout also calls `getMenu()` and passes the result to `<Header menuData>`, so a second 189 KB copy travels in the RSC payload.

Fix: move `transformMenuData`/`withChunkyRings` into a separate module that does not import the JSON; transform on the server in `(frontend)/layout.js` and pass only the slimmed menu tree (titles, hrefs, images) to the client. Target: under 20 KB in the payload, 0 KB in JS.

### 2.3 The product object sent to the client is far larger than the UI needs

`page.js` queries `images(first: 100)` and `media(first: 100)` (same pictures twice), `variants(first: 250)` with ~60 metafields each, and then forwards the raw `components` and `variant_config` JSON strings in every variant's `metafields` even though the server already derived `diamonds`, `gemstones`, `metal_weight`, etc. from them. The client re-parses `variant_config` in `additionalItemInfo` and `handleAddToCart`.

Fix list:
- Derive `additional_item_*` and `diamond_charges` on the server, then stop forwarding `components` and `variant_config` (saves ~63 KB per page).
- Drop `images` and keep `media` (recently-viewed/wishlist can use `media[0]`).
- Trim the per-variant metafield list to what the mapper actually reads once the `components` path succeeds; the 60+ `custom.*` fallbacks are mostly dead for current catalogue data.
- Pass `storePages` once (it is currently serialised for the PDP, the root layout schema and the store sections).
- Side bug: `description: product.descriptionHtml || product.description` runs after `delete product.descriptionHtml`, so the HTML description is never used.

### 2.4 The LCP image is lazy-loaded behind hydration

Every gallery image, including the first one, goes through `LazyImage`, which only renders the `<Image>` after an `IntersectionObserver` fires in an effect. There is no `priority`, no `fetchpriority="high"`, and no `<link rel="preload">`. Combined with 2.1, the hero image cannot even start downloading until the JS has hydrated and the observer has run.

Fix: render the first media item with `next/image` `priority` (or a plain `<img fetchpriority="high">` through `shopifyLoader`), keep `LazyImage` for index ≥ 1, and add a preload link for the first image URL in `generateMetadata`/page head. The desktop grid and the mobile swiper both render the full media list into the DOM (`hidden lg:grid` / `lg:hidden`), so each image appears twice in markup; render only the active layout.

### 2.5 Around twenty network requests fire on mount, plus two per product card

Fired from `ProductPageClient` and its children on first render, before the shopper does anything:

| # | Request | Where |
|---|---|---|
| 1 | `/api/styled-videos-collection` | PPC `checkStyledCollections` |
| 2 | Shopify `productRecommendations` | PPC `fetchComplementary` |
| 3 | Shopify metafield recommendations query (sequential after 2) | PPC `fetchComplementary` |
| 4 | `/api/products/related` | PPC |
| 5 | `/api/settings/gold-coin` | PPC |
| 6 | `/api/reviews?productId=` | PPC + CustomerReviews (deduped by cache) |
| 7 | `/api/reviews` global fallback when count is 0 | CustomerReviews |
| 8 | `/api/track` product_view POST | PPC |
| 9 | `/api/stores` | PPC |
| 10 | `/api/pincodes/check` when a pincode cookie exists | PPC |
| 11 | `/api/products/social-proof` POST | PPC |
| 12 | `/api/products/track-view` POST | PPC |
| 13 | `/api/products/pricing` | PPC `fetchVariantPricing` |
| 14 | Shopify live variant price | PPC |
| 15 | `/api/settings/dispatch` | `useDispatchInfo` |
| 16 | `/api/cart/coupons/active` | UnlockCoupon |
| 17 | `/api/styled-videos` (`cache: no-store`) | StyledByLucira |
| 18 | `/api/styled-videos-collection?collection=` (second hit on the same endpoint) | StyledByLuciraCollection |
| 19 | `/api/announcements` | TopBar (every page) |
| 20 | `fetchCart` | MainHeader (every page) |
| + | wishlist, avatar, ProductView webhook | logged-in users |
| + | 1 Shopify price call + 1 reviews call **per ProductCard** | "From the Same Collection", "Recently Viewed" |

Most of these go cross-origin to the Render backend, so POST/JSON calls also pay a CORS preflight. A page with 8 recommendation cards makes 35+ requests before it is idle, which is what drives INP to 302 ms (main thread busy with fetch callbacks and state updates while the user tries to tap).

Fix list:
- Move the store-wide, slow-changing data to the server page with ISR: gold-coin setting, dispatch settings, stores list, active coupons, styled-videos lists. They are already dashboard-managed and cached elsewhere; fetch them in `page.js` (or a shared `unstable_cache`) and pass as props.
- Collapse the three recommendation fetches (2, 3, 4) into one backend endpoint that returns complementary + matching + same-collection in one response; the backend already computes `from_the_same_collection_headless`.
- Merge 1 and 18 (same endpoint, called twice).
- Batch the per-card price and review lookups into one request per slider (`/api/products/pricing?ids=` and `/api/reviews?ids=`), or pass prices/review stats from the recommendation response and set `disableLivePricing`/`disableReviews` on PDP sliders.
- Defer analytics beacons (8, 12, webhook) to `requestIdleCallback` and use `navigator.sendBeacon` so they never compete with rendering.
- Make the `fetchComplementary` metafield query conditional on the first query returning nothing, instead of always running both.

### 2.6 Fonts

- Four Google fonts (Lobster, Yellowtail, Satisfy, ABeeZee) are declared with `next/font/google` inside `ProductPageClient`, so they are preloaded on every PDP although they only appear inside the engraving sheet. Set `preload: false` on all four, or move the declarations into the engraving sheet component that loads on demand.
- The body font Figtree is a variable **TTF** from the Shopify CDN loaded through `@font-face` in `globals.css`. It is not preloaded, is cross-origin, and TTF is ~2× the size of woff2. Convert to woff2, self-host under `/public/fonts` (or `next/font/local`), and preload it. This directly affects FCP and text CLS.

### 2.7 One 4,522-line client component does everything eagerly

`ProductPageClient.jsx` has 23 effects, 37 `useState`s and statically imports every sheet, dialog and drawer: engraving sheet, size guide, store-availability sheet, "view similar" drawer, share-intent sheet, `PdpInfoSheet`, `UnlockCoupon` (691 lines, its own OTP flow), `CustomerReviews` (484 lines), `FindLuciraStore` (463 lines), three `react-modal-sheet` instances, Radix Dialog/Drawer/Sheet, Swiper with four module sets, framer-motion. All of it is in the 91 KB gz PDP chunk and all of it hydrates before the first interaction.

Fix list:
- Split the below-the-fold sections (`FindLuciraStore`, `StoreLocatorSection`, `CustomerReviews`, `StyledByLucira*`, `OurProcess`, `FAQSection`, `DiamondComparison`, `JoinLuciraCommunity`, product sliders) into `next/dynamic` imports rendered behind an in-view trigger, not just code-split and rendered immediately as `OnTheMoveStory`/`StoreLocatorSection` are now. Also remove the `{ suspense: true }` option; it is not a valid `next/dynamic` option.
- Lazy-load the overlays (engraving, size guide, store sheet, similar drawer, share sheet, info sheet, `UnlockCoupon` OTP step) on first open.
- Convert the static parts (breadcrumb, title block, accordion content, marquee, `ProductStory`, FAQ, process) to server components so they ship HTML, not JS.
- Keep the interactive core (gallery, variant picker, price, ATC, pincode) as the only client island above the fold.

### 2.8 Mobile renders desktop first, then flips

`useMediaQuery` starts at `false`, so every mobile visitor's first client render is the desktop layout; the effect then flips `isMobile` and the whole 4.5k-line tree re-renders. That is a second full render on the slowest devices and the likely source of the remaining CLS. Fix: initialise from `window.matchMedia` with `useSyncExternalStore` (server snapshot = a UA-based guess from `headers()` passed as a prop), or make the layout CSS-driven so no JS flip is needed.

### 2.9 Global layout work that runs on every PDP

- `VisitorTracking` requests browser geolocation and calls `nominatim.openstreetmap.org` on first visit without a pincode cookie. That is a permission prompt plus a third-party fetch during load. Move it behind the pincode input or the "Locate me" button.
- `WebEngageRegistration` registers a service worker on `load`; harmless but keep it after idle.
- `ZohoSalesIQ` is already lazy (interaction or 5 s). Good. `FloatingActionButton` polls for the Zoho DOM; fine.
- `TabTitleAnimator` runs an interval on every page; cheap.
- `proxy.js` (middleware) runs on every request including static HTML; it only lowercases paths. Keep, but exclude `/products/` handles that are already lowercase via the matcher to save the edge invocation.
- `src/app/loading.js` is a full-screen spinner with a random quote. Once SSR works, replace it with a skeleton that matches the PDP layout so the switch does not shift content.

### 2.10 TTFB

`X-Vercel-Cache: HIT` with `Age: 8687` on the sampled page, so cached handles are fast. The 1.0 s p75 comes from the ~2,600 handles outside the 250 pre-rendered bestsellers: their first hit runs the 84-variant × 60-metafield Shopify query plus `getStorePages` inside the function, and the `revalidate = 86400` ISR window means each handle pays that once a day. After 2.3 shrinks the query, consider raising `generateStaticParams` to the top ~1,000 handles by traffic and setting `revalidate` to 7 days with webhook revalidation (already wired) doing the real refresh.

## 3. Code-quality and cleanup list

Safe to do on this branch without changing behaviour:

- Dead code: `src/components/product/AddToCartButton.jsx` is an empty 0-byte file; `WearThisWith` and `ExploreOtherRings` are commented out in the render but `ExploreOtherRings` is still imported; `src/data/sample.js` (246 KB) is not imported anywhere; root-level `test-gold-meta.mjs`, `test-mapping.js`, `test-page.html`, `test_filters.js`, `update-colors.js` are scratch files.
- `getNumericId` is imported from `@/lib/gtm` and then redefined locally twice inside `handleAddToCart` and the product-view effect.
- The `normalize` helper and the karat/colour matching logic are copy-pasted into `findMatchingVariant`, `handleGoldSelection` (twice), `isColorInStock`, `isSizeInStock`, `variantMatchesActiveCombo` and the ATC `variantOptions` filter. One `variantMatches(v, karat, metal, size?)` helper replaces all of them.
- `getStoreDisplayName` exists in both `ProductPageClient` and `FindLuciraStore`.
- `fetchPincodeFromCoordinates` exists in both `ProductPageClient` and `VisitorTracking`.
- `react-toastify/dist/ReactToastify.css` is imported in `ProductPageClient` and again in `ToastProvider`.
- Four `console.log` calls in `ProductPageClient` and the `[Gallery Debug]` logs in `ProductGallery` run on every render in dev; `removeConsole` strips them in prod but they still cost in dev profiling.
- `images.formats` in `next.config.mjs` lists webp before avif, so `next/image` never serves AVIF for the few non-Shopify images; reorder to `['image/avif', 'image/webp']`.
- `public/images/faq.jpg` is 20 MB and `public/images` is 47 MB in total. Not referenced by PDP components, but anything in `/public` is deployed and crawlable; compress or delete.
- `experimental: { cpus: 1, workerThreads: false }` slows builds; only keep it if it was added to fix a Vercel memory error.
- Raw `<img>` tags: 15 in `PdpInfoSheet`, 3 in `ProductPageClient`; convert to `next/image` with the Shopify loader so they get width params.

## 4. Suggested order of work

| Phase | Change | Expected gain |
|---|---|---|
| 1 | Fix 2.1 (Suspense around `useSearchParams`, remove PersistGate gating) and 2.4 (priority hero image) | FCP 3.0 s → ~1.2 s, LCP 5.3 s → ~2.5 s. Biggest single win, two small diffs. |
| 2 | Fix 2.2 (menu JSON out of the client bundle) and 2.6 (fonts) | ~120 KB gz less JS on every page, body text paints earlier |
| 3 | Fix 2.3 (slim product payload) | HTML 135 KB → ~60 KB on the wire, faster hydration |
| 4 | Fix 2.5 (server-fetch settings, merge recommendations, batch card lookups, defer beacons) | 35+ requests → ~8; INP under 200 ms |
| 5 | Fix 2.7 and 2.8 (split the component, lazy overlays, no desktop-first flip) | PDP chunk 91 KB → ~40 KB gz, removes the double render |
| 6 | Cleanup list in section 3 | maintainability; no user-visible change |

Re-measure after each phase with the same URL on PageSpeed Insights (mobile) and compare the field numbers after 28 days. For quick checks:

```bash
curl -s -o /dev/null -w 'ttfb=%{time_starttransfer} size=%{size_download}\n' --compressed https://www.lucirajewelry.com/products/marquise-cut-with-side-diamonds-accent-engagement-ring
```

A healthy result after phase 1 is an HTML body that contains `<h1>` and the first gallery `<img>`.
