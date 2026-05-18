import { NextResponse } from "next/server";
import { shopifyStorefrontFetch, shopifyAdminFetch } from "@/lib/shopify";
import menuData from "@/data/menu-data.json";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Priority: Use pre-generated JSON data for maximum performance
    // This avoids the 2MB Next.js cache limit and resolves the reported error.
    if (menuData && menuData.success && menuData.menus?.length > 0) {
      return NextResponse.json(menuData, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59',
          'X-Menu-Source': 'static-json'
        }
      });
    }

    // 2. Fallback: Fetch dynamically from Shopify if JSON is missing or invalid
    console.warn("Menu JSON data not found or invalid, falling back to live fetch.");
    
    // Fetch the basic menu structure from Storefront API
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

    // Fetch ALL collection data in bulk from Admin API
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

    // Recursive function to merge Shopify menu items with our collection metadata
    const transformItems = (items) => {
      return items.map(item => {
        let handle = "";
        try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.lucirajewelry.com";
            const path = new URL(item.url, baseUrl).pathname;
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
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59',
        'X-Menu-Source': 'live-fetch'
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
