# Project Instructions

- **Contextual Precedence:** Always check this file and the `MEMORY.md` index before starting any task.
- **Architecture:** This project is a frontend-only Next.js application. All product, collection, and search data must be fetched directly from the Shopify Storefront API with a 1-hour cache (`revalidate: 3600`).
- **Database:** MongoDB Atlas is used strictly for transactional/user data: Cart, Wishlist, Orders, Pincodes, Stores, Announcements, Styled Videos, and Curated Looks. Products and collections are NOT stored in the database.
- **Surgical Updates:** Strictly avoid changing or updating any existing working code or logic unless it is the direct cause of a bug or explicitly requested. 
- **Preservation:** All additions should be purely to handle specific edge cases or new requirements without disrupting the established codebase architecture.
- **Shopify GIDs:** Specific handling for Shopify GID resolution (e.g., Pages, Metaobjects) should be implemented in the relevant API routes to ensure clean data delivery to the frontend.

- **note:** search and do only on two folder lucira-headless and backend so any operation wil happen work only these two folder only and third is for referance earlier my project was like theat so we are
   migrating in default way direct hitting shopify api and some of the service is using mongodb atlas. So keep in mind from now