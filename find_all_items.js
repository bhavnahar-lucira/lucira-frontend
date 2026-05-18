require('dotenv').config({ path: '.env.local' });
const SHOP_DOMAIN = "luciraonline.myshopify.com";
const STOREFRONT_TOKEN = process.env.STOREFRONT_TOKEN || process.env.SHOPIFY_STOREFRONT_TOKEN;

async function debug() {
    const query = `{
      menus(first: 20) {
        edges {
          node {
            handle
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
      }
    }`;
    const res = await fetch(`https://${SHOP_DOMAIN}/api/2024-10/graphql.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN },
        body: JSON.stringify({ query })
    });
    const data = await res.json();
    
    data.data.menus.edges.forEach(edge => {
        const handle = edge.node.handle;
        function check(items) {
            items.forEach(item => {
                if (item.title.toLowerCase().includes("all items")) {
                    console.log(`Found "all items" in menu: ${handle}`);
                }
                if (item.items) check(item.items);
            });
        }
        check(edge.node.items);
    });
}
debug();
