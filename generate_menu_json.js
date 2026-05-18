require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const SHOP_DOMAIN = "luciraonline.myshopify.com";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.SHOPIFY_ADMIN_TOKEN;
const STOREFRONT_TOKEN = process.env.STOREFRONT_TOKEN || process.env.SHOPIFY_STOREFRONT_TOKEN;

async function shopifyStorefrontFetch(query, variables = {}) {
    const res = await fetch(`https://${SHOP_DOMAIN}/api/2024-10/graphql.json`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
        },
        body: JSON.stringify({ query, variables }),
    });
    const data = await res.json();
    return data.data;
}

async function shopifyAdminFetch(query, variables = {}) {
    const res = await fetch(`https://${SHOP_DOMAIN}/admin/api/2024-10/graphql.json`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": ADMIN_TOKEN,
        },
        body: JSON.stringify({ query, variables }),
    });
    const data = await res.json();
    return data.data;
}

async function generateMenu() {
    console.log("Starting menu generation...");
    try {
        // 1. Fetch basic menu structure
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
                    items {
                      title
                      url
                    }
                  }
                }
              }
            }
          }
        `;
        const menuResponse = await shopifyStorefrontFetch(menuQuery);
        const menuItems = menuResponse?.menu?.items || [];

        if (!menuItems || !menuItems.length) {
            console.error("No menu items found.");
            return;
        }

        // 2. Fetch ALL collection data with pagination
        console.log("Fetching all collections...");
        let allCollections = [];
        let hasNextPage = true;
        let cursor = null;

        while (hasNextPage) {
            const collectionsQuery = `
              query getCollections($cursor: String) {
                collections(first: 250, after: $cursor) {
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
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
            const response = await shopifyAdminFetch(collectionsQuery, { cursor });
            const collections = response?.collections?.edges || [];
            allCollections = allCollections.concat(collections);
            hasNextPage = response?.collections?.pageInfo?.hasNextPage;
            cursor = response?.collections?.pageInfo?.endCursor;
            console.log(`Fetched ${allCollections.length} collections so far...`);
        }

        const collectionsMap = {};
        allCollections.forEach(({ node }) => {
            collectionsMap[node.handle] = {
                productsCount: node.productsCount,
                image: node.image,
                metafields: node.metafields?.edges?.map(e => e.node) || []
            };
        });

        // 3. Fetch Pages as well (some menu items link to pages)
        console.log("Fetching all pages...");
        let allPages = [];
        hasNextPage = true;
        cursor = null;

        while (hasNextPage) {
            const pagesQuery = `
              query getPages($cursor: String) {
                pages(first: 250, after: $cursor) {
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                  edges {
                    node {
                      handle
                      title
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
            const response = await shopifyAdminFetch(pagesQuery, { cursor });
            const pages = response?.pages?.edges || [];
            allPages = allPages.concat(pages);
            hasNextPage = response?.pages?.pageInfo?.hasNextPage;
            cursor = response?.pages?.pageInfo?.endCursor;
        }

        const pagesMap = {};
        allPages.forEach(({ node }) => {
            pagesMap[node.handle] = {
                title: node.title,
                metafields: node.metafields?.edges?.map(e => e.node) || []
            };
        });

        // 4. Transform
        const transformItems = (items) => {
            return items.map(item => {
                let handle = "";
                let type = "";
                try {
                    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.lucirajewelry.com";
                    const url = new URL(item.url, baseUrl);
                    const pathName = url.pathname;
                    const segments = pathName.split("/").filter(Boolean);
                    
                    if (pathName.includes("/collections/")) {
                        handle = segments[segments.indexOf("collections") + 1] || "";
                        type = "Collection";
                    } else if (pathName.includes("/pages/")) {
                        handle = segments[segments.indexOf("pages") + 1] || "";
                        type = "Page";
                    } else {
                        handle = segments[segments.length - 1] || "";
                    }
                } catch (e) { }

                const collectionData = collectionsMap[handle];
                const pageData = pagesMap[handle];

                let resource = null;
                if (collectionData) {
                    resource = {
                        __typename: "Collection",
                        handle: handle,
                        productsCount: collectionData.productsCount,
                        image: collectionData.image,
                        metafields: {
                            nodes: collectionData.metafields
                        }
                    };
                } else if (pageData) {
                    resource = {
                        __typename: "Page",
                        handle: handle,
                        title: pageData.title,
                        metafields: {
                            nodes: pageData.metafields
                        }
                    };
                }

                return {
                    title: item.title,
                    url: item.url,
                    resource: resource,
                    items: item.items && item.items.length > 0 ? transformItems(item.items) : []
                };
            });
        };

        const formattedMenu = transformItems(menuItems);
        const output = {
            success: true,
            menus: [{ handle: "main-menu-official", items: formattedMenu }],
            updatedAt: new Date().toISOString()
        };

        const outputPath = path.join(__dirname, 'src', 'data', 'menu-data.json');
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        console.log(`Menu data successfully saved to ${outputPath}`);

    } catch (error) {
        console.error("Error generating menu:", error);
    }
}

generateMenu();
