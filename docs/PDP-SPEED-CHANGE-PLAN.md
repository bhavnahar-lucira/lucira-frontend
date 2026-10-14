# PDP Speed Change Plan — safe changes vs system-affecting changes

Date: 14 Oct 2026. Branch: `sumit-1310-pdp-speed`. Companion to `PDP-SPEED-AUDIT.md` (baseline numbers and root causes).

Everything below was checked against the code on this branch, the live site (`www.lucirajewelry.com`), the Next.js 16 docs, and two competitor storefronts. Each change states what it touches, which conditions were traced, and how to verify it did not break anything.

---

## 0. What good PDP delivery looks like (competitor check)

| Site | HTML bytes | `<h1>` in HTML | `<img>` in HTML | Hero preload | `fetchpriority="high"` | TTFB |
|---|---|---|---|---|---|---|
| Lucira PDP (current) | 957 KB (135 KB wire) | 0 | 0 | 0 | 0 | 0.09 s cached |
| CaratLane PDP | 123 KB | 1 | 27 | 1 | 1 | 0.58 s |
| BlueStone category page | 93 KB | 2 | 98 | 3 | 1 | 0.40 s |

CaratLane and BlueStone are not fast sites (CaratLane's homepage scores 43 in Lighthouse mobile with a 12.4 s lab LCP), but they follow the standard delivery pattern: the server sends the product HTML, the hero image is declared in the HTML with a preload hint and high fetch priority, and JavaScript enhances afterwards. Lucira ships an empty body and the hero image is discovered only after hydration. That gap, not the JS size alone, is why Lucira's real-user LCP is 5.3 s.

The rest of this document is about reaching that pattern without disturbing what already works.

---

## Track A — safe now

These do not change caching, data freshness, API contracts, or what the shopper sees. They only change how bytes are packaged and when work runs. All can ship together in one PR.

### A1. Take the 811 KB menu JSON out of the client bundle
- **What:** `src/lib/menus.js` imports `@/data/menu-data.json` and also exports `transformMenuData` / `withChunkyRings`. `Navbar.jsx` and `MobileHeader.jsx` import those helpers, so Turbopack bundles the JSON into the client. Split the helpers into `src/lib/menuTransform.js` (no JSON import); keep `getMenu` in `menus.js` (server only).
- **Verified conditions:** the transform code uses no `window`/`document`; `MobileHeader` imports `useMenu` but never calls it (dead import, remove); the server still passes the same `menuData` prop, so the rendered menu is byte-identical.
- **Effect:** the largest JS chunk shrinks from 118 KB gz to roughly 10 KB gz on every page, not only the PDP.
- **Verify:** `grep -c main-menu-official` over `.next/static/chunks/*.js` returns 0; menus render identically on desktop and mobile.

### A1b. Transform the menu on the server (still safe)
- **What:** call `transformMenuData` in `(frontend)/layout.js` and pass the slim tree (label, href, image, children) to `Header`; delete the client-side `useMemo` transforms.
- **Verified conditions:** transform is pure, so output is the same whether it runs on server or client.
- **Effect:** RSC payload drops ~170 KB per page.

### A2. Stop preloading the engraving fonts
- **What:** the four `next/font/google` declarations (Lobster, Yellowtail, Satisfy, ABeeZee) in `ProductPageClient.jsx` add four `<link rel="preload">` to every PDP although they only appear inside the engraving sheet. Set `preload: false` on all four, or move the declarations into the engraving sheet component.
- **Verified conditions:** `display: "swap"` is already set, so the fonts still load when the sheet opens; CSS variables `--font-lobster` etc. are unchanged.
- **Effect:** four fewer render-blocking-priority requests on first paint.

### A3. Self-host Figtree as woff2 and preload it
- **What:** `globals.css` loads Figtree as a variable **TTF** from `cdn.shopify.com` via `@font-face`, cross-origin and not preloaded. Convert both files to woff2, serve from `/public/fonts` through `next/font/local`, keep the family name `Figtree` and the `--font-figtree` variable.
- **Verified conditions:** nothing else references the Shopify-hosted TTF URL; the admin app has its own styles.
- **Effect:** body text paints with the right font earlier; font bytes roughly halve.

### A4. Make the hero image a priority image with a preload hint
- **What:** in `ProductGallery.jsx`, render `sortedMedia[0]` with `next/image` `priority`, an explicit `sizes` (e.g. `(max-width: 1023px) 100vw, 50vw`) and `fetchPriority="high"`, keep `LazyImage` for every other item. In `page.js` (server component) call React's `preload(firstImageUrl, { as: "image", fetchPriority: "high" })` from `react-dom` with the same width the Shopify loader will request, so the hint lands in the HTML head even before Track B.
- **Verified conditions:** `LazyImage` with `priority` already short-circuits its IntersectionObserver; when the first media item is a video, skip the preload; the loader URL must match exactly (same `width` param) or the browser downloads two images.
- **Effect:** the LCP image starts downloading at HTML parse time instead of after hydration. Until Track B1 ships, this is the single biggest LCP lever available.

### A5. Run the two recommendation queries in parallel
- **What:** `fetchComplementary` awaits the Shopify `productRecommendations` query, then awaits the metafield query. Run both with `Promise.all` and keep the existing merge logic after both resolve.
- **Verified conditions:** the merge logic reads `rawProducts.length` only after both results exist; output is unchanged.
- **Effect:** ~300–600 ms less before "From the Same Collection" appears.

### A6. Fetch styled-videos-collection once
- **What:** `ProductPageClient` fetches `/api/styled-videos-collection` to find a matching tag; `StyledByLuciraCollection` then fetches `/api/styled-videos-collection?collection=<tag>`. Pass the already-fetched list down and filter client-side.
- **Condition to confirm before merging:** the backend's `collection` filter must match on the same `collectionHandle` field the client would filter on. Check `routes/settings.js` or wherever that route lives; if it applies extra rules (published flag, ordering), replicate them.

### A7. Batch the per-card live price lookups
- **What:** each `ProductCard` fires its own Shopify Storefront `node(id)` query. Replace with one `nodes(ids: [...])` query per slider that fills `clientShopifyPriceCache` before the cards mount.
- **Verified conditions:** same data source (Shopify Storefront) and same freshness as today, so the "never show a stale price" guarantee is intact.
- **Effect:** 8–12 requests fewer per PDP.

### A8. Defer analytics beacons until idle
- **What:** `/api/track`, `/api/products/track-view`, `trackSearchProductView` and the ProductView webhook fire inside mount effects. Wrap them in `requestIdleCallback` with a 2 s `setTimeout` fallback. Keep using `apiFetch`; do **not** switch to `navigator.sendBeacon` (it cannot send the `Authorization` header `apiFetch` adds, so the logged-in webhook would 401).
- **Verified conditions:** the GTM `pushProductView` call stays synchronous, so dataLayer ordering is unchanged; `hasFiredProductView` logic untouched.
- **Known trade-off:** visitors who bounce within ~2 s are no longer counted by the first-party view beacon that feeds the recommendation engine. Small undercount, state it to whoever reads that data.

### A9. Load geolocation later, not never
- **What:** `VisitorTracking` asks for geolocation and calls Nominatim on first visit during load. Move it to `requestIdleCallback` after the first user interaction.
- **Verified conditions:** the PDP listens for the `lucira:user-pincode` event, so a late-arriving pincode still triggers the delivery check exactly as today.

### A10. Code-split overlays and below-the-fold sections (no render deferral)
- **What:** `next/dynamic` for the engraving sheet body, size guide, store-availability sheet, "view similar" drawer, share sheet, `PdpInfoSheet`, the `UnlockCoupon` OTP step, `CustomerReviews`, `FindLuciraStore`, `StyledByLucira*`, `OurProcess`, `FAQSection`, `DiamondComparison`, `JoinLuciraCommunity`. Keep SSR on (default) so nothing disappears from the HTML later; this only moves code into separate chunks that load when needed.
- **Verified conditions:** every overlay is closed by default, so first render is unchanged; `useShareIntent` is a hook and stays; remove the invalid `{ suspense: true }` option from the two existing `dynamic()` calls.
- **Effect:** PDP chunk 91 KB gz → roughly 45 KB gz.

### A11. Cleanup (no runtime change)
- Delete `src/components/product/AddToCartButton.jsx` (0 bytes), `src/data/sample.js` (246 KB, unreferenced), root `test-*.js`, `test-page.html`, `update-colors.js`; remove the `ExploreOtherRings` import (component is commented out).
- Deduplicate: `getNumericId` (redefined twice in `ProductPageClient`), `getStoreDisplayName` and `fetchPincodeFromCoordinates` (two copies each), the six copies of the karat/colour `normalize` matcher, the second `react-toastify` CSS import.
- `next.config.mjs`: reorder `images.formats` to `['image/avif', 'image/webp']`; drop `experimental.cpus: 1` / `workerThreads: false` unless they were added to fix a Vercel build memory error.
- Compress or remove `public/images/faq.jpg` (20 MB) and the 1 MB+ hero JPGs; they deploy with every build.
- Replace `src/app/loading.js` (spinner + random quote) with a PDP-shaped skeleton so the transition does not shift layout.

### What Track A buys on its own
Roughly 150 KB gz less JavaScript, 170 KB less payload, 10–15 fewer requests, and an LCP image that starts at parse time. Honest expectation: LCP from 5.3 s to around 4 s, INP noticeably better. The page is still client-rendered until Track B1, so FCP barely moves. Track A is worth shipping first because every item is reversible and it makes Track B smaller to test.

---

## Track B — changes that touch caching, data flow, or site-wide behaviour

Each item lists the exact conditions that were traced. None of these should be done "quickly".

### B1. Server-render the PDP (the fix that moves FCP and LCP)

Two independent blockers; both must go.

#### B1a. Isolate `useSearchParams`
Options evaluated:
- **Rejected:** read `searchParams` in `page.js`. That makes the route dynamic. ISR and the Vercel CDN HTML cache are lost, every view becomes a function invocation plus a Shopify query, TTFB gets worse, and cost goes up.
- **Rejected:** `await connection()` for the same reason.
- **Chosen:** remove the hook from `ProductPageClient`. Add a 10-line client component `VariantFromUrl` inside its own `<Suspense fallback={null}>` that reads `?variant=` and reports it. `ProductPageClient` computes the initial variant without the URL and applies the URL variant in a `useLayoutEffect` (before paint).

Conditions traced:
1. Who sends `?variant=` links: the wishlist page, cart item links, admin order pages, the ring-shank landing page, and the share sheet. Product cards and PLP links do not. So the correction path only runs for a minority of visits.
2. Hard load with `?variant=`: the HTML shows the default variant until hydration, then switches before the next paint. GTM `product_view` runs in a passive effect, which React runs after layout effects, so it reports the URL variant once. Confirm in GTM preview with a wishlist link.
3. The 9KT rule (`collectionContext === "9kt-collection"`) reads persisted Redux; see B1b for the hydration note.
4. Build: Next fails the build for a static page using `useSearchParams` without Suspense. Today the root-layout boundary satisfies it; after the change the small boundary does. The Next docs confirm: "calling `useSearchParams` will cause the Client Component tree up to the closest Suspense boundary to be client-side rendered."

#### B1b. Replace `PersistGate` gating
`src/redux/provider.js` wraps the whole app in `<PersistGate loading={null}>`. PersistGate renders `loading` until rehydration completes and rehydration never runs on the server, so SSR output is `null` for every route, not only the PDP.

Conditions traced:
1. redux-persist rehydrates from localStorage asynchronously but usually before React's hydration render. Any component that renders persisted state on first paint will then mismatch the server HTML (cart badge "3" vs "0"). React 19 recovers by re-rendering the nearest Suspense subtree on the client and logging an error. Functional, but wasteful and it can flash.
2. Components that render persisted state on first paint (verified by grep): `MainHeader` (cart count, avatar), `MobileHeader`, `ProductPageClient` (recently-viewed slider, pincode, wishlist heart, 9KT initial variant), `ProductCard` (wishlist heart), `CollectionPageClient`, `CartItem`, `CartSummary`, `StoreFootfallModal`, `useBookingFlow`. Each needs a `useHydrated()` guard (a `useSyncExternalStore` whose server snapshot is `false`) around the persisted-dependent bit, not around the whole component.
3. `apiFetch` reads the token straight from localStorage, unaffected. `useAtcLoginGate` reads auth state at click time, unaffected.
4. `MainHeader`'s `fetchCart` effect is keyed on `user?.id`; without the gate it runs once with `undefined` and again after rehydrate for logged-in users. Add the hydrated check to avoid a double cart fetch.
5. Safest rollout: keep `PersistGate` only inside the `(checkout-flow)` layout where cart state is the whole page, and use the hydrated-guard approach for `(frontend)` routes. This is a site-wide change: test PLP, home, cart, checkout, account, not only the PDP.

#### B1c. Side effects of SSR existing for the first time
1. `isMobile` from `useMediaQuery` is `false` on the server, so mobile users get desktop HTML then flip after hydration. See B4; above-the-fold must be CSS-responsive before B1 ships, or mobile CLS gets worse than today.
2. Any `window` access during render now throws on the server. `productPageUrl` is already guarded; re-audit every `typeof window` in the PDP tree before enabling.
3. Hydration-sensitive values: the dispatch countdown uses `useSyncExternalStore` with a `null` server snapshot (safe); `loading.js` picks its quote in an effect (safe); `Intl.NumberFormat("en-IN")` matches between Node and browsers (safe).
4. Caching consequence: the CDN now caches HTML that contains a price. For up to 24 h (or until the product webhook revalidates) the HTML price can lag Shopify. The live-price fetch already corrects it client-side within ~1 s. Today the shopper sees nothing for 3 s; after B1 they see the cached price for ~1 s then the live one. Accept, but tell the merchandising team so a "wrong price flashed" report is understood.
5. SEO: Googlebot will finally see content in HTML (positive). It also means any placeholder or test copy in the PDP tree becomes indexable immediately; review the sections once before shipping.
6. Expected result: FCP ~1.2 s, LCP ~2.5 s on the same connection class.

### B2. Store-wide settings on the server — do not do it the naive way
The audit suggested moving gold-coin, dispatch, stores, coupons and styled-videos to the server page. Conditions make the obvious implementations wrong:
1. `fetch(url, { cache: "force-cache" })` freezes those settings until ISR (24 h) or `revalidatePath`. `/api/revalidate` is only called by Shopify product/collection webhooks (it revalidates `/`, `/products/<handle>`, `/collections/...` and pings the backend `clear-cache`). Dashboard saves never call it, so a dispatch-copy edit would stop appearing for a day. The dashboard promises editors "within about a minute".
2. `fetch(url, { next: { revalidate: 60 } })` is worse. The Next docs: "Individual fetch requests can set a lower revalidate than the route's default revalidate to increase the revalidation frequency of the entire route." The PDP's 24 h ISR window would silently become 60 s for every product, multiplying Shopify Storefront calls and Vercel invocations.
3. The correct server-side tool is `unstable_cache` with its own `revalidate` and a tag, plus a `revalidateTag("settings")` call wired into the backend dashboard save handlers. That is new backend-to-frontend wiring and needs the same care the product webhook got.
4. **Recommended instead, zero caching change:** one backend endpoint `GET /api/pdp/bootstrap` returning gold-coin, dispatch, Shopify stores, active coupons and the styled-videos list in one response. Same freshness as today, six requests become one. `useDispatchInfo`'s module cache can be primed from it. Backend change only, in `lucira-backend/routes/settings.js`.
5. Do not merge `/api/stores` (Shopify locations, used for in-store stock) with `getStorePages()` (dashboard store content). They are different datasets that happen to share names.

### B3. Slim the product payload
1. `metafields.variant_config` is read from **cart items** by `components/cart/GoldCoinOption.jsx` and `lib/coupons.js` (cart items copy `activeVariant.metafields` at add-to-cart). Removing it from the PDP payload would silently break gold-coin eligibility and coupon-category fallbacks for dynamically priced items. Fix path: compute `diamond_charges` and `additional_item_*` on the server into two small fields, update those two readers, then drop the raw string.
2. `product.images` is used by `ProductCard` (recently-viewed slider) and `recentlyViewedSlice`. Keep `images` or derive it from `media` in the server mapper.
3. The 60 `custom.*` fallback metafields are data-dependent: products without `ornaverse.components` rely on them. Before removing any, run a one-off script over all handles counting how often each fallback is actually hit.
4. Caching: the GraphQL query string is part of the fetch Data Cache key, so a changed query automatically misses the old entries. No manual purge, but the first visit per product after deploy pays one Shopify call (same as any deploy).
5. The `descriptionHtml` bug (`delete` before use) means fixing it switches the description from plain text to HTML. Visible change; decide separately.

### B4. Mobile vs desktop markup after SSR
1. Static HTML is one layout for all devices. UA sniffing via `headers()` would make the route dynamic (rejected, same reason as B1a).
2. Rule: above the fold must be CSS-responsive (the gallery already renders both layouts and hides one with `lg:hidden`). The three `isMobile` branches in `ProductPageClient` (`PdpSubHeader` gate, engraving sheet vs mobile sheet, `ExploreRange` vs `CategorySlider`) are overlays or below the fold, so a post-mount flip there is harmless.
3. Replace `useMediaQuery`'s `useState(false)` + effect with `useSyncExternalStore` so the flip happens in one synchronous pass instead of a second render.

### B5. Render-deferral of below-the-fold sections
Once SSR exists, FAQ, description, accordion details and the reviews summary are crawlable. Deferring them behind an in-view trigger removes them from the HTML again. Rule: defer only non-content sections (store locator carousel, styled videos, product sliders, process, community form). Keep the content sections server-rendered. No caching impact; SEO impact only if the rule is ignored.

### B6. ISR window and static-params changes
1. Product webhook revalidation has been suspected broken since the 16 Sep inventory-webhook change. Do not raise `revalidate` above 24 h until a product edit is confirmed to flush `/products/<handle>`. Live price covers the headline price, but compare-at prices, badges and stock flags in the cached HTML would be stale for longer.
2. Raising `generateStaticParams` from 250 to 1,000 handles multiplies build-time Shopify queries by four under the cost governor and lengthens every build. Only worth it after B3 shrinks the query.

### B7. Batched reviews endpoint
`/api/reviews?ids=` is a backend route addition in `routes/reviews.js`. The Nector proxy cache is keyed per product; a batched route should fill the same per-product cache so single lookups elsewhere stay warm.

### B8. Rejected ideas, for the record
- `navigator.sendBeacon` for tracking: cannot carry the Bearer token.
- `dynamic = "force-dynamic"` or reading `searchParams` on the page: loses ISR.
- Per-fetch `revalidate` inside the PDP: lowers the whole route's window.
- Increasing `revalidate` before the webhook path is verified.

---

## Order of work

| Step | Scope | Risk | Measure |
|---|---|---|---|
| 1 | Track A, one PR | none to caching or behaviour | JS gz total, request count, LCP lab |
| 2 | B4 (CSS-responsive above the fold) + B1c audit of `window` reads | low, prepares SSR | no console errors on mobile emulation |
| 3 | B1a + B1b on a Vercel preview deployment | medium, site-wide | HTML contains `<h1>` and hero `<img>`; zero hydration errors on PDP, PLP, home, cart, checkout, account |
| 4 | B2 bootstrap endpoint (backend) | low | dashboard edits still visible within 1 min |
| 5 | B3 payload slimming with the cart readers updated | medium | gold-coin + coupon flows on a dynamic-priced item |
| 6 | B5, B7 | low | FAQ and description present in HTML |
| 7 | B6 only after webhook revalidation is proven | caching | product edit flushes the page within minutes |

## Regression checklist to run after steps 3 and 5

- `curl --compressed <pdp-url> | grep -c '<h1'` returns 1, and the first gallery `<img>` is present.
- No hydration warnings in the console for: guest, logged-in, `?variant=` link from wishlist, visitor with a pincode cookie, mobile emulation.
- Add to cart with engraving on a dynamic-priced item; cart shows diamond charges; gold-coin option and coupon category behave as before.
- Dispatch-settings edit in the dashboard appears on the PDP within a minute.
- Shopify price edit shows via the live-price fetch within one page load.
- GTM preview shows one `product_view` with the correct variant id.
- Share sheet URL still carries `?variant=`.
- PageSpeed Insights mobile lab run completes (today it times out); re-check the 28-day field numbers a month after step 3.

---

## Implementation log — Track A (14 Oct 2026, branch `sumit-1310-pdp-speed`)

All Track A items are implemented and verified on a local production build (`next build` + `next start`) and in the dev server against the local backend.

| Measurement (PDP, same handle) | Live site 13 Oct | Local build 14 Oct |
|---|---|---|
| JavaScript referenced by the page | 33 chunks, 2.80 MB raw / 774 KB gz | 32 chunks, 1.97 MB raw / 609 KB gz |
| Chunks containing the 811 KB menu JSON | 1 (652 KB raw) | 0 |
| RSC payload (decoded) | 847 KB | 319 KB |
| `menuData` in the payload | 189 KB | ~37 KB |
| HTML document | 957 KB raw / 135 KB gz | 376 KB raw / 32 KB gz |
| Hero image preload in HTML head | none | `<link rel="preload" as="image" fetchpriority="high">` with the exact srcset the gallery `<img>` uses (verified: one download, both `<img>` served from cache) |
| Figtree body font | cross-origin, not preloaded | self-hosted `/fonts/*.woff2` (same bytes the Shopify CDN served), preloaded |
| Engraving font preloads | 4 | 0 |
| Shopify Storefront calls for recommendation cards | 1 per card | 1 `nodes()` query per tick for all cards |
| `/api/styled-videos-collection` | 2 | 1 |

What changed, file by file:
- `src/lib/menuTransform.js` (new): `transformMenuData`, `withChunkyRings`, `COLLECTION_QUICK_LINKS`, `CHUNKY_RINGS_ITEM` moved here verbatim; no JSON import. `src/lib/menus.js` keeps `getMenu` (server) and adds `getHeaderMenu()` which returns the transformed tree. The four `<Header menuData>` call sites (`(frontend)/layout`, `schemes/layout`, `not-found`, `admin/layout`) use `getHeaderMenu`; `Navbar` and `MobileHeader` consume the transformed tree directly and import `withChunkyRings` from `menuTransform`. Both menus verified in the browser (desktop Rings dropdown incl. Chunky Rings; mobile drawer incl. Bracelets/Necklaces sub-drawers).
- `ProductPageClient.jsx`: `preload: false` on the four engraving fonts; below-the-fold sections and closed-by-default sheets are `next/dynamic` (SSR kept); the two existing `dynamic()` calls lose the invalid `suspense: true`; the two recommendation queries run in `Promise.all`; the styled-videos list is fetched once and passed to `StyledByLuciraCollection`; the three analytics beacons run through `runWhenIdle`; `standardizeKarat` / `getVariantSelection` moved verbatim to `src/lib/variantSelection.js`; the two local `getNumericId` copies and the duplicate toastify CSS import are gone; the dead `ExploreOtherRings` import is gone.
- `ProductGallery.jsx`: the media ordering and `formatCdnUrl` moved verbatim to `src/lib/galleryMedia.js` (`sortGalleryMedia`, `HERO_IMAGE_SIZES`); the first item in both the desktop grid and the mobile swiper gets `priority`, `fetchPriority="high"` and `sizes`.
- `src/app/(frontend)/products/[handle]/page.js`: `preloadHeroImage()` picks the same initial variant and ordering as the client and emits the preload via `react-dom` `preload()` + `next/image` `getImageProps()`.
- `LazyImage.jsx`: a `priority` image renders on the first pass instead of after the observer effect.
- `ProductCard.jsx` + `src/lib/livePriceBatch.js` (new): per-card live price lookups are coalesced into one Storefront `nodes(ids)` query per tick; per-variant promise cache semantics unchanged.
- `VisitorTracking.jsx`: geolocation + Nominatim run after the first interaction or 6 s, not during load.
- `StyledByLuciraCollection.jsx`: accepts `videos`; filters client-side when given (same match as the backend `?collection=` filter), otherwise fetches as before.
- `globals.css` + `app/layout.js`: Figtree `@font-face` points at `/public/fonts/*.woff2` with a preload link.
- `next.config.mjs`: `images.formats` is now AVIF first.
- Removed: `AddToCartButton.jsx` (empty), `src/data/sample.js` (unreferenced), `public/images/faq.jpg` (20 MB, unreferenced).

Not changed on purpose (needs its own decision or a backend change):
- `src/components/collection/CategoryCarousel.jsx` and `(protected)/admin/layout.js` are client components that still import the menu JSON, so the PLP and admin bundles still carry it. The PDP no longer does. Fix later by building the category groups in the collection page's server component.
- Per-card review lookups (`/api/reviews?productId=`) still go one per card; batching needs a backend route.
- The sticky add-to-cart bar's 48 px thumbnail is a raw `<img>` that downloads the full 1600 px product image (~35 KB); switch it to the Shopify loader with `width=96`.
- `experimental.cpus: 1` left as is.
- Root `test-*.js` / `update-colors.js` scripts left as is (unclear whether they are still used).

Verified in the browser (dev server + local backend): PDP renders, no console errors introduced, desktop mega menu and mobile drawer work, hero preload URL equals the hero `<img>` URL, Figtree loads from `/fonts`, styled-videos endpoint called once, one batched Storefront price query for all cards. Dev StrictMode double-invokes effects, so every mount-time request shows as 2 in dev; production fires each once.

One observation to confirm on a real phone after deploy: in the emulated 375 px viewport the preload fetched the 750 px candidate while the `<img>` requested 828 px even though both carry the identical srcset and sizes. On desktop both picked the same file. If a phone shows the same, the cost is one extra ~15 KB image, not a broken page.
