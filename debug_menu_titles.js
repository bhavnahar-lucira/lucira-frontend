require('dotenv').config({ path: '.env.local' });

const SHOP_DOMAIN = "luciraonline.myshopify.com";
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

async function debugMenu() {
    const query = `
      query getMenu {
        menu(handle: "main-menu-official") {
          items {
            title
            items {
              title
              items {
                title
                items {
                  title
                }
              }
            }
          }
        }
      }
    `;
    const response = await shopifyStorefrontFetch(query);
    
    const titles = new Set();
    function collectTitles(items) {
        items.forEach(item => {
            titles.add(item.title);
            if (item.items) collectTitles(item.items);
        });
    }

    collectTitles(response.menu.items);
    Array.from(titles).sort().forEach(t => console.log(t));
}

debugMenu();
