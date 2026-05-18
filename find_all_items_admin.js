require('dotenv').config({ path: '.env.local' });
const SHOP_DOMAIN = "luciraonline.myshopify.com";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.SHOPIFY_ADMIN_TOKEN;

async function debug() {
    const query = `{
      menus(first: 50) {
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
    const res = await fetch(`https://${SHOP_DOMAIN}/admin/api/2024-10/graphql.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': ADMIN_TOKEN },
        body: JSON.stringify({ query })
    });
    const data = await res.json();
    
    if (!data.data?.menus) {
        console.log("No menus found or error:", data);
        return;
    }

    data.data.menus.edges.forEach(edge => {
        const handle = edge.node.handle;
        function check(items) {
            if (!items) return;
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
