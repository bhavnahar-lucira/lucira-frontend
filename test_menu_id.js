require('dotenv').config({ path: '.env.local' });

async function test() {
  const query = `
    query getMenu($id: ID!) {
      menu(id: $id) {
        items {
          title
          url
          resource {
            ... on Collection {
              handle
              productsCount { count }
            }
          }
          items {
            title
            url
            resource {
              ... on Collection {
                handle
                productsCount { count }
              }
            }
          }
        }
      }
    }
  `;

  const SHOP_DOMAIN = "luciraonline.myshopify.com";
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.SHOPIFY_ADMIN_TOKEN;

  try {
      const res = await fetch(`https://${SHOP_DOMAIN}/admin/api/2024-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': ADMIN_TOKEN
        },
        body: JSON.stringify({ 
          query, 
          variables: { id: "gid://shopify/Menu/255520997594" } 
        })
      });

      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
  } catch (e) {
      console.error(e);
  }
}

test();
