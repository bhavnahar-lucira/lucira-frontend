require('dotenv').config({ path: '.env.local' });

const SHOP_DOMAIN = "luciraonline.myshopify.com";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.SHOPIFY_ADMIN_TOKEN;

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

async function countCollections() {
    const query = `
      query {
        collectionsCount {
          count
        }
      }
    `;
    const response = await shopifyAdminFetch(query);
    console.log(`Total collections: ${response.collectionsCount.count}`);
}

countCollections();
