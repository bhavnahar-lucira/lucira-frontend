# Project Instructions: Lucira Restructured Architecture

- **Contextual Precedence:** Always check this file and the `MEMORY.md` index before starting any task.

## 1. Overall Architecture
The project is split into a **Next.js Frontend (`lucira-frontend`)** and a **Standalone Fastify Backend (`lucira-backend`)**.
- **Frontend**: Hosted on Vercel, optimized for zero/low function invocations via ISR/SSG.
- **Backend**: Fixed-cost Node.js server handling heavy logic, proxying Shopify Admin API, and managing MongoDB data.

## 2. Frontend Caching Strategy (ISR & SSG)
To minimize Vercel serverless costs:
- **Homepage**: Incremental Static Regeneration (ISR) with a 6-hour window (`revalidate: 21600`).
- **Blogs, Static Pages, & Menus**: Fully Static Site Generation (SSG, `revalidate: false`). These only update on redeploy or manual revalidation.
- **Product Pages**: Use standard Next.js fetching, aiming for ISR where possible.

## 3. Data Fetching Rules
- **Shopify Storefront API (Maximized)**:
  - **Cart**: Managed 100% client-side via Storefront API. No MongoDB dependency for active carts.
  - **Customer Account**: Profile, Orders, and Addresses are fetched directly from the client using `customerAccessToken`.
  - **Fetching Utilities**: Use `src/lib/shopify-client.js` for browser-side calls and `src/lib/shopify.js` for server-side calls.
- **Fastify Backend (`lucira-backend`)**:
  - All logic from the (now removed) `app/api` folder lives here.
  - Frontend components must use `apiFetch` from `src/lib/api.js`, which automatically prefixes calls with `NEXT_PUBLIC_BACKEND_URL` for externalized routes.
  - Managed routes include: Search, Collections, Filters, Variant Pricing (Price Engine), Metal Rates, and Pincode checking.
- **Reviews (Nector)**:
  - Fetched 100% client-side via `src/lib/nector.js` using public API keys.

## 4. Engineering Standards
- **Zero app/api**: Do NOT add new API routes to the Next.js `app/api` folder. All server-side logic must go to `lucira-backend`.
- **GIDs**: Maintain consistency with Shopify Global IDs (GIDs) throughout the stack.
- **UI/UX Parity**: Any changes to data flow must maintain identical UI behavior and styling.

## 5. Helpful Commands
- `lucira-frontend`: `npm run dev` (Frontend)
- `lucira-backend`: `npm run dev` (Backend)
- `lucira-frontend`: `npm run generate-menu` (Updates static menu data if needed)
