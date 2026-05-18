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
    const response = await shopifyStorefrontFetch(query);
    const items = response.menu.items;

    function printItems(items, indent = "") {
        items.forEach(item => {
            console.log(`${indent}${item.title} -> ${item.url}`);
            if (item.items) printItems(item.items, indent + "  ");
        });
    }

    printItems(items);
}

debugMenu();
