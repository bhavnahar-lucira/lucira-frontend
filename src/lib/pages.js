import { shopifyStorefrontFetch } from "./shopify";

export async function getAllPages() {
    const query = `
      query {
        pages(first: 250) {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
      }
    `;
    const data = await shopifyStorefrontFetch(query);
    return data?.pages?.edges.map(e => e.node) || [];
}

export async function getPageByHandle(handle) {
    const query = `
      query getPage($handle: String!) {
        page(handle: $handle) {
          id
          title
          handle
          body
          seo { title description }
        }
      }
    `;
    const data = await shopifyStorefrontFetch(query, { handle }, {
      next: { revalidate: 86400 } // ✅ 6 hours cache
    });
    return data?.page;
}

export async function getPageByHandleStorefront(handle) {
    return getPageByHandle(handle);
}

