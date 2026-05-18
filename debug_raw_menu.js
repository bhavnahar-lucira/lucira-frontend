require('dotenv').config({ path: '.env.local' });
const SHOP_DOMAIN = "luciraonline.myshopify.com";
const STOREFRONT_TOKEN = process.env.STOREFRONT_TOKEN || process.env.SHOPIFY_STOREFRONT_TOKEN;

async function debug() {
    const handles = ["main-menu-official", "menu-fs"];
    for (const handle of handles) {
        const query = `{
          menu(handle: "${handle}") {
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
        }`;
        const res = await fetch(`https://${SHOP_DOMAIN}/api/2024-10/graphql.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN },
            body: JSON.stringify({ query })
        });
        const data = await res.json();
        const raw = JSON.stringify(data);
        console.log(`Menu ${handle} includes 'all items':`, raw.toLowerCase().includes("all items"));
    }
}
debug();
