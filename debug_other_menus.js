require('dotenv').config({ path: '.env.local' });
const SHOP_DOMAIN = "luciraonline.myshopify.com";
const STOREFRONT_TOKEN = process.env.STOREFRONT_TOKEN || process.env.SHOPIFY_STOREFRONT_TOKEN;

async function debug() {
    const handles = ['menu-fs', 'shop-all', 'main-menu'];
    for (const handle of handles) {
        const query = `query { menu(handle: "${handle}") { items { title items { title items { title } } } } }`;
        const res = await fetch(`https://${SHOP_DOMAIN}/api/2024-10/graphql.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN },
            body: JSON.stringify({ query })
        });
        const data = await res.json();
        console.log(`Menu: ${handle}`);
        if (data.data?.menu) {
            data.data.menu.items.forEach(i => {
                console.log(` - ${i.title}`);
                if (i.items) i.items.forEach(ii => {
                    console.log(`   -- ${ii.title}`);
                    if (ii.items) ii.items.forEach(iii => console.log(`      --- ${iii.title}`));
                });
            });
        }
    }
}
debug();
