# Dependency & Dead-Code Cleanup — 2026-08-04

Source: an audit report listing candidate dead dependencies and files. Every
claim was independently re-verified against the current codebase (content
read via `git show`, importers checked via `grep`/`glob`) before anything was
deleted — the report was a lead, not ground truth. Two items needed
correction from the report; both are called out below.

---

## Root one-off scripts (18 files)

All of these were ad-hoc Node scripts run manually from the terminal
(`node script.js`) while debugging Shopify's menu/collection GraphQL API or
the local Mongo data — never imported by app code, never wired into any npm
script, CI workflow, or `vercel.json` (neither of the latter two exist in
this repo).

| File | What it actually did | Why it's safe to delete |
|---|---|---|
| `count_collections.js` | One-off Admin API GraphQL call to count Shopify collections. | Scratch query, output was read once in a terminal; nothing depends on it. |
| `debug_menu_titles.js` | Storefront API call to dump menu item titles for a hardcoded handle. | Same — throwaway debug print. |
| `debug_menu_urls.js` | Storefront API call to dump menu item URLs. | Same. |
| `debug_other_menus.js` | Looped over 3 hardcoded menu handles (`menu-fs`, `shop-all`, `main-menu`) printing their nested item titles. | Was for manually comparing menu handles during the megamenu build-out; not referenced anywhere. |
| `debug_raw_menu.js` | Dumped raw nested `title`/`url` tree for `main-menu-official` and `menu-fs`. | Same category — console-only debug dump. |
| `debug_reviews_api.js` | Hit `localhost:3000/api/reviews/list` and printed the JSON response. | Manual local API smoke test; not part of any test suite. |
| `find_all_items.js` | Storefront API: listed all menus (first 20) with 3 levels of nested items. | Exploratory query to find a specific menu structure; superseded by the real menu code in `src/`. |
| `find_all_items_admin.js` | Same query via the **Admin** API instead of Storefront. | Same — exploratory, admin-token variant. |
| `find_menu_image.js` | Queried collection metafields (`namespace`/`key`) across 50 collections to locate where menu icon images were stored. | One-time discovery script; the answer it found is now hardcoded into the real menu-rendering code. |
| `introspect_metafields.js` | Same metafield introspection, capped at 5 collections. | Earlier/smaller version of the above; superseded. |
| `introspect_metafields_deep.js` | Same again, capped at 20 collections. | Iterative debug pass; superseded. |
| `list_menus.js` | Listed all menu `id`/`title`/`handle` pairs. | Reference lookup script, answer already baked into app config. |
| `test_menu.js` | Fetched `main-menu-official` items via Storefront API by handle. | Ad-hoc verification during menu integration; not a real test (no assertions, no test runner). |
| `test_menu_admin.js` | Same lookup via Admin API `menus(query: "handle:...")`. | Same. |
| `test_menu_id.js` | Fetched a menu by raw `ID` instead of handle, including `resource { ... on Collection }`. | Exploratory — checking whether menu items resolve to Shopify collection resources. |
| `test_menu_resource.js` | Fetched menu items with `resource { __typename, ... on Collection { menuIcon: metafield(...) } }`. | Follow-up to `find_menu_image.js` — confirming the metafield path resolves through the menu resource. |
| `test_menu_sf.js` | Storefront API fetch of `main-menu-official`, 2 levels deep. | Yet another handle/API-variant smoke test. |
| `tmp_styled_videos.js` | A full React client component (`StyledVideosDashboard`) — search, save, reorder styled-video-to-product mappings. `tmp_` prefix and a stray `import './dashboard.css'` before `"use client"` (which is invalid placement in a real route). | Never routed/imported anywhere; the broken import ordering confirms it was scratch work, not a working component. |

**Kept, not deleted:** `generate_menu_json.js` — matches the same root-script
shape as the above, and the source report's own glob pattern would have swept
it in. It's wired to `package.json`'s `"generate-menu": "node
generate_menu_json.js"` script and is actively runnable — deliberately
excluded.

**Also left alone (out of scope):** `update-colors.js` — not mentioned in
the source report, not verified either way, so left untouched pending its
own review.

---

## Duplicate / superseded components

| File | What it actually did | Why it's safe to delete |
|---|---|---|
| `src/components/common/StoreCollectionBanner.jsx` | A full duplicate implementation of the store-locator banner (store hours, phone, map pin, ratings) — 22 KB, ~650 lines. | Every real usage (`CollectionPageClient.js`) imports from `@/components/collections/StoreCollectionBanner` instead — a *different* file with the same component name. This `common/` copy was an orphaned earlier version; 0 importers found. |
| `src/components/common/Header.jsx` | Empty file (0 bytes). | The live header is `src/components/header/Header.jsx`; this was a leftover stub from an earlier folder layout. |

---

## Empty redux/lib stub files (0 bytes each)

| File | Why it's safe to delete |
|---|---|
| `src/lib/axiosInstance.js` | 0 bytes, 0 importers. Axios isn't even a dependency in this project (fetch is used directly) — this was scaffolding that was never filled in. |
| `src/redux/api/shopifyApi.js` | 0 bytes, 0 importers. |
| `src/redux/features/cart/cartTypes.js` | 0 bytes, 0 importers. Cart state lives entirely in `cartSlice.js`. |
| `src/redux/features/product/productSelectors.js` | 0 bytes, 0 importers. |
| `src/redux/features/product/productSlice.js` | 0 bytes, 0 importers — product state is handled elsewhere (not via a dedicated Redux slice). |
| `src/redux/features/wishlist/wishlistSelectors.js` | 0 bytes, 0 importers. |

These read as placeholder files created when the Redux folder structure was
first scaffolded, then never implemented because the functionality landed
somewhere else.

---

## Unreferenced route/page variants

| File | What it actually did | Why it's safe to delete |
|---|---|---|
| `src/app/(frontend)/products/[handle]/page-newdesign.js` | A full alternate product-detail page (breadcrumbs, `framer-motion` animations, etc.) | Next.js only routes files literally named `page.js` inside a route folder — `page-newdesign.js` was never reachable as a route, and nothing imports it as a component either. Looks like an abandoned redesign experiment left next to the real `page.js`. |
| `src/app/(frontend)/products/test-route.js` | A Next.js Route Handler (`export async function GET`) that took a `?handle=` query param and looked up a product. | Same reasoning — not named `route.js`, so Next.js never registers it as an endpoint; it's dead API-testing scaffolding. |

---

## Debug leftover

| File | What it actually did | Why it's safe to delete |
|---|---|---|
| `src/app/(frontend)/brain/.../scratch/check_tags.js` | Connected directly to a local MongoDB instance (`mongodb://admin:password123@localhost:27017/...`) to inspect whether `articles`/`blogs` documents had a `tags` field populated. | One-off local data-shape check sitting in a folder literally named `scratch`. Bonus: also removes a plaintext local-dev DB credential from the tree. |

---

## Hand-rolled duplicates

| File | What it actually did | Why it's safe to delete |
|---|---|---|
| `src/utils/utils.js` | A second definition of the same `cn()` helper (`twMerge(clsx(inputs))`) that also lives in `src/lib/utils.js`. | All 37 call sites in the codebase import `cn` from `@/lib/utils`; grep found zero imports of `@/utils/utils`. Pure duplicate, never wired in. |
| `src/utils/nector.js` | Re-exported `fetchNectorReviews`/`loadNectorReviews` from `@/lib/nector` under the same names, adding nothing. | **Correction to the source report:** it described this as a wrapper whose callers should be "pointed at the lib" before deleting it. Re-verification found **zero** files actually import `@/utils/nector` — every real caller (`WriteReviewForm.jsx`, `ProductCard.jsx`, `CustomerReviews.jsx`, etc.) already imports `@/lib/nector` directly. There were no callers to migrate, so it was deleted outright rather than performing an unnecessary redirect. |

---

## Dependencies removed (`package.json`)

| Package | Why removed |
|---|---|
| `motion` | Dead. Every animation import in the codebase (22 files) uses `framer-motion`; `motion` (the newer standalone package) had 0 imports — likely an accidental duplicate install. |
| `embla-carousel-react` | 0 imports anywhere. All carousel/slider UI in this repo is built on `swiper` (31 imports). |
| `masonry-layout` | 0 imports anywhere — no masonry grid layout exists in the current UI. |
| `imagesloaded` | 0 imports anywhere — commonly paired with `masonry-layout`, same fate. |
| `@shopify/shopify-api` | 0 imports anywhere. This is a heavy server-side SDK; the app talks to Shopify by hitting the GraphQL endpoints directly via `fetch` in `lib/shopify.js`, so the SDK was never actually used. |

Ran `npm install` after editing `package.json` — removed **19 packages**
total (5 direct + their transitive dependencies).

### Kept despite being flagged "yagni" in the source report

| Package | Why kept |
|---|---|
| `@tanstack/react-table` | 1 use, but it's live: `src/components/ui/DataTable.jsx` imports and uses it directly. Removing it breaks that component. |
| `jspdf` | 1 use, but it's live: `src/lib/receiptPdf.js` uses it to generate receipt PDFs. Removing it breaks receipt generation. |

The source report itself flagged these as "verify before cutting," not as
blind deletes — verification showed both are real, functioning call sites,
so they stay.

### Not touched (report marked "worth a look," not a blind cut)

- `react-fast-marquee` (used in `LuxuryMarquee.jsx`, `FeaturedIn.jsx`) vs. a
  hand-rolled CSS `@keyframes` marquee — a legitimate potential dependency
  removal, but swapping it changes visual behavior and needs a UX check
  first.
- `vaul` + `react-modal-sheet` coexisting (drawer vs. bottom-sheet
  components) — consolidating to one is a real bundle-size win, but which
  one to standardize on is a UX decision, not a mechanical dedupe.

---

## `next.config.mjs` change

Added `compiler.removeConsole` instead of hand-editing the ~53
`console.log` call sites scattered through `src/`:

```js
compiler: {
  removeConsole: process.env.NODE_ENV === 'production'
    ? { exclude: ['error', 'warn'] }
    : false,
},
```

At build time, Next's compiler strips `console.log` / `.info` / `.debug`
calls from the **production** client bundle (smaller bundle, no log noise in
the browser console for real users). `console.error`/`.warn` are excluded so
real error reporting still works. Dev builds (`next dev`) are untouched —
the flag only activates when `NODE_ENV === 'production'`.

---

## Net effect

- **-31 files** removed: 18 root scratch scripts, 2 duplicate/superseded
  components, 6 empty stub files, 2 unreferenced route variants, 1 debug
  leftover, 2 hand-rolled duplicates (18+2+6+2+1+2 = 31)
- **-5 direct dependencies**, **-19 packages** total after `npm install`
- 2 corrections made to the source report (kept `generate_menu_json.js`
  since it's live; deleted `utils/nector.js` outright since it had no
  callers to redirect)
- 2 dependencies deliberately left in place pending UX review
  (`react-fast-marquee`, `vaul`/`react-modal-sheet` overlap)
- Verified with a full `npm run build` after all changes
