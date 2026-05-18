import { NextResponse } from "next/server";
import { shopifyStorefrontFetch, shopifyAdminFetch } from "@/lib/shopify";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Fetch the basic menu structure from Storefront API (Fast and reliable)
    const menuQuery = `
      query getMenu {
        menu(handle: "main-menu-official") {
          items {
            title
            url
            items {
              title
              url
              items {
                title
                url
              }
            }
          }
        }
      }
    `;

    const menuResponse = await shopifyStorefrontFetch(menuQuery, {}, { next: { revalidate: 3600 } });
    const menuItems = menuResponse?.menu?.items || [];

    if (!menuItems.length) {
      return NextResponse.json({ success: true, menus: [{ handle: "main-menu-official", items: [] }] });
    }

    // 2. Fetch ALL collection data (including image and custom metafields) in bulk from Admin API
    const collectionsQuery = `
      query getCollections {
        collections(first: 250) {
          edges {
            node {
              handle
              productsCount { count }
              image { url }
              metafields(first: 20) {
                edges {
                  node {
                    namespace
                    key
                    value
                    reference {
                      ... on MediaImage {
                        image {
                          url
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const collectionsResponse = await shopifyAdminFetch(collectionsQuery, {}, { next: { revalidate: 3600 } });
    const collectionsMap = {};
    collectionsResponse?.collections?.edges?.forEach(({ node }) => {
      collectionsMap[node.handle] = {
        productsCount: node.productsCount,
        image: node.image,
        metafields: node.metafields?.edges?.map(e => e.node) || []
      };
    });

    // 3. Recursive function to merge Shopify menu items with our collection metadata
    const transformItems = (items) => {
      return items.map(item => {
        // Extract the handle from the URL (e.g., /collections/rings -> rings)
        let handle = "";
        try {
            const path = new URL(item.url, "https://www.lucirajewelry.com").pathname;
            const segments = path.split("/").filter(Boolean);
            if (path.includes("/collections/")) {
                handle = segments[segments.indexOf("collections") + 1] || "";
            } else {
                handle = segments[segments.length - 1] || "";
            }
        } catch(e) {}

        const collectionData = collectionsMap[handle] || null;

        return {
          title: item.title,
          url: item.url,
          resource: collectionData ? {
            __typename: "Collection",
            handle: handle,
            productsCount: collectionData.productsCount,
            image: collectionData.image,
            metafields: {
                nodes: collectionData.metafields
            }
          } : null,
          items: item.items && item.items.length > 0 ? transformItems(item.items) : []
        };
      });
    };

    const formattedMenu = transformItems(menuItems);

    return NextResponse.json({
      success: true, 
      menus: [{ handle: "main-menu-official", items: formattedMenu }]
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
      }
    });

  } catch (error) {
    console.error("Fetch Menus Error:", error);
    return NextResponse.json({ 
        success: false, 
        error: "Internal Server Error",
        menus: [{ handle: "main-menu-official", items: [] }] 
    }, { status: 500 });
  }
}
