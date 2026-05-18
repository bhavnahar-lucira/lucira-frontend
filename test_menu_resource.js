require('dotenv').config({ path: '.env.local' });

async function test() {
  const query = `
    query getMenu {
      menu(handle: "main-menu-official") {
        items {
          title
          url
          resource {
            __typename
            ... on Collection {
              handle
              menuIcon: metafield(namespace: "custom", key: "menu_links_image_icon") {
                value
                reference { ... on MediaImage { image { url } } }
              }
            }
          }
        }
      }
    }
  `;

  const SHOP_DOMAIN = "luciraonline.myshopify.com";
  const TOKEN = process.env.STOREFRONT_TOKEN;

  try {
      const res = await fetch(`https://${SHOP_DOMAIN}/api/2024-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': TOKEN
        },
        body: JSON.stringify({ query })
      });

      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
  } catch (e) {
      console.error(e);
  }
}

test();
