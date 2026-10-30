// Pure menu helpers shared by the server layouts and the client header.
//
// This module must stay free of any import of `@/data/menu-data.json`: the
// client header imports `withChunkyRings` from here, and a JSON import in the
// same module would drag the whole 811 KB menu file into the browser bundle.
// `getMenu` (which does read the JSON) lives in `@/lib/menus` and is server-only.

// Display-name overrides for top-level menu items, keyed by the lowercase
// Shopify menu title. The Shopify menu (and its collection handle) keeps the
// original name; only what the shopper sees changes. Matchers in MobileHeader
// accept both names.
export const MENU_LABEL_OVERRIDES = {
  "lucira express": "Fast Shipping",
};

// Same idea for the links inside a mega-menu column (Shop By Style etc.),
// keyed by the lowercase Shopify title. Keeps the display name even after
// `npm run generate-menu` refreshes menu-data.json from Shopify.
export const MENU_ITEM_LABEL_OVERRIDES = {
  // Earrings → Shop By Style. Renamed 21 Oct 2026; collection handle unchanged.
  "dangles": "Danglers",
};

// Small collection tiles rendered beside the image cards in the desktop
// Collections menu and below the image cards in the mobile menu.
//
// Desktop flows this list, in order, into 2x4 blocks of DESKTOP_QUICK_LINK_BLOCK
// tiles (one grid column per block): 16 tiles, two full blocks. Mobile renders
// the same order as one flat list. Cotton Candy and Hexa are desktop-only
// tiles: on mobile they stay as cards in the image grid, and on desktop a
// desktop-only tile replaces the menu's image card of the same href.
export const DESKTOP_QUICK_LINK_BLOCK = 8;

export const COLLECTION_QUICK_LINKS = [
  // Added 15 Oct 2026. Row-major reading of the marketing sheet, except that
  // the two model-photo tiles (Cotton Candy, Hexa) are stacked in the first
  // column, so Cotton Candy leads and everything else shifts one slot:
  // Cotton Candy, Portuguese / Hexa, Religious / Infinity, Paperclip / Heart,
  // Twisted // Chrome, Evil Eye / Pearl, Nakshatra / ... Cotton Candy and Hexa
  // use dedicated product icons (17 Oct 2026); `fit: "cover"` is available for
  // a photo icon that should fill the circle.
  { label: "Cotton Candy", href: "/collections/cotton-candy", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Cotton_candy_collection_icon_7b791fd5-efe8-4028-aace-2c47930f07db.png?v=1792216734", desktopOnly: true },
  { label: "Portuguese", href: "/collections/portuguese", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Portuguese_collection_icon_ce3defeb-01bd-47fd-a99d-ce53e70f7908.png?v=1792048808" },
  { label: "Hexa", href: "/collections/hexa", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Hexa_collection_icon_2a5a6dd9-13e3-4efa-b35f-c962471f5f47.png?v=1792216734", desktopOnly: true },
  { label: "Religious", href: "/collections/religious", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Religious_collection_icon_24db892e-9654-420e-b6d9-14abbc259e7b.png?v=1792048808" },
  { label: "Infinity", href: "/collections/infinity", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Infinity_collection_icon_0a12ace4-072c-40d4-ad57-4dfd52175cd7.png?v=1792048808" },
  { label: "Paperclip", href: "/collections/paperclip-collection", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Paperclip_collection_icon_d2ac7f37-c789-4cd6-be92-677e3af7a3e5.png?v=1792048808" },
  { label: "Heart", href: "/collections/heart", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Heart_collection_icon_52aa005e-e0e8-43b2-acad-7c54941208f7.png?v=1792048808" },
  { label: "Twisted", href: "/collections/twisted", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Twisted_collection_icon_78078319-ab50-4ab2-8b81-c35f3e3808ef.png?v=1792048808" },
  { label: "Chrome", href: "/collections/chrome", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Chrome_collection_icon_7acdaecf-484c-473b-9ea4-51500b359101.png?v=1792048808" },
  // The original tiles (Cotton Candy moved to the top, above).
  { label: "Evil Eye", href: "/collections/evil-eye", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/evil_eye.png?v=1785231427" },
  { label: "Pearl", href: "/collections/pearl", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/pearl_030670d5-2823-41f2-8f9c-0e3edc770719.png?v=1785231427" },
  { label: "Nakshatra", href: "/collections/nakshatra", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Nakshatra.png?v=1785231427" },
  { label: "Peacock", href: "/collections/peacock", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Peacock.png?v=1785231427" },
  { label: "Hexa Moving Diamond", href: "/collections/hexa-moving-diamond", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Hexa_Moving_Diamond.png?v=1785231427" },
  { label: "Petalique", href: "/collections/petalique", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Petalique.png?v=1785231427" },
  { label: "Butterfly Collection", href: "/collections/butterfly-collection", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Butterfly_collection_icon_868489d6-0006-419f-84c4-f87091b052db.png?v=1789973142" },
];

// Quick links split into consecutive desktop blocks; only the last block can
// be short, so any empty slot sits at the very end.
export function chunkQuickLinks(quickLinks, size = DESKTOP_QUICK_LINK_BLOCK) {
  const blocks = [];
  for (let i = 0; i < (quickLinks || []).length; i += size) {
    blocks.push(quickLinks.slice(i, i + size));
  }
  return blocks;
}

export function transformMenuData(shopifyMenuItems) {
  if (!shopifyMenuItems) return [];

  return shopifyMenuItems.map(item => {
    const resource = item.resource || {};
    const metafields = resource.metafields?.nodes || [];
    
    const disabledLabels = ["more jewellery", "solitaire", "collections", "gifting", "9kt collection"];
    const isFeaturedDisabled = disabledLabels.includes(item.title.toLowerCase().trim());

    const menuType = getMetafield(metafields, "custom", "menu_type")?.value || (item.items?.length > 0 ? "mega" : "link");
    const layout = getMetafield(metafields, "custom", "layout")?.value || "5-col-featured";
    
    const menuIcon = getFileUrl(getMetafield(metafields, "custom", "menu_links_image_icon")) || resource.image?.url;

    let href = item.url.replace(/https:\/\/[^/]+/, "");
    const label = item.title.trim();
    if (label === "Engagement & Bridal") {
      href = "/collections/engagement-bridal-rings";
    } else if (label === "Rings") {
      href = "/collections/rings";
    } else if (label === "Collections") {
      // Hover-only menu: keep the dropdown, but make the top-level item non-clickable
      href = "#";
    }
    
    let transformedItem = {
      label: MENU_LABEL_OVERRIDES[label.toLowerCase()] || item.title,
      href: href,
      type: menuType,
      layout: layout,
      mobileBanner: getFileUrl(getMetafield(metafields, "custom", "mobile_menu_banner_image")),
      menuIcon: menuIcon,
    };

    if (menuType === "mega") {
        const children = item.items || [];
        
        if (!isFeaturedDisabled) {
            const featuredGroup = children.find(c => {
                const title = c.title.toLowerCase();
                return title.includes("featured") && !title.includes("in");
            });
            const featuredInGroup = children.find(c => c.title.toLowerCase().includes("featured in"));

            if (featuredGroup || featuredInGroup) {
                transformedItem.featured = {};
                if (featuredGroup) {
                    transformedItem.featured.title = featuredGroup.title;
                    transformedItem.featured.items = (featuredGroup.items || []).map(f => ({
                        label: f.title,
                        href: f.url.replace(/https:\/\/[^/]+/, ""),
                        icon: getFileUrl(getMetafield(f.resource?.metafields?.nodes || [], "custom", "icon")),
                        megaMenuImage: getFileUrl(getMetafield(f.resource?.metafields?.nodes || [], "custom", "mega_menu_image")),
                        menuIcon: getFileUrl(getMetafield(f.resource?.metafields?.nodes || [], "custom", "menu_links_image_icon")) || f.resource?.image?.url,
                    }));
                }
                if (featuredInGroup) {
                  transformedItem.featured.featuredIn = {
                      title: featuredInGroup.title,
                      items: (featuredInGroup.items || []).map(f => ({
                          label: f.title,
                          href: f.url.replace(/https:\/\/[^/]+/, ""),
                          icon: getFileUrl(getMetafield(f.resource?.metafields?.nodes || [], "custom", "icon")),
                          megaMenuImage: getFileUrl(getMetafield(f.resource?.metafields?.nodes || [], "custom", "mega_menu_image")),
                          menuIcon: getFileUrl(getMetafield(f.resource?.metafields?.nodes || [], "custom", "menu_links_image_icon")) || f.resource?.image?.url,
                      }))
                  };
                }
            }
        }

        const remainingItems = children.filter(c => {
            const title = c.title.toLowerCase();
            return !(title.includes("featured") && !title.includes("in")) && !title.includes("featured in");
        });
        
        const columns = [];
        const cards = [];

        remainingItems.forEach(child => {
            const childMetafields = child.resource?.metafields?.nodes || [];
            const menuImage = getFileUrl(getMetafield(childMetafields, "custom", "menu_image"));

            if (menuImage) {
                cards.push({
                    title: child.title,
                    image: menuImage,
                    subtitle: getMetafield(childMetafields, "custom", "menu_subtitle")?.value || `${child.resource?.productsCount?.count || 0} Products`,
                    href: child.url.replace(/https:\/\/[^/]+/, "")
                });
            } else {
                const isMetal = child.title.toLowerCase().includes("metal") || child.title.toLowerCase().includes("material");
                const processedItems = (child.items || []).map(sub => ({
                    label: MENU_ITEM_LABEL_OVERRIDES[(sub.title || "").toLowerCase().trim()] || sub.title,
                    href: sub.url.replace(/https:\/\/[^/]+/, ""),
                    icon: getFileUrl(getMetafield(sub.resource?.metafields?.nodes || [], "custom", "icon")),
                    megaMenuImage: getFileUrl(getMetafield(sub.resource?.metafields?.nodes || [], "custom", "mega_menu_image")),
                    menuIcon: getFileUrl(getMetafield(sub.resource?.metafields?.nodes || [], "custom", "menu_links_image_icon")) || sub.resource?.image?.url,
                }));

                const explicitType = getMetafield(childMetafields, "custom", "column_type")?.value;
                const hasIcons = processedItems.some(item => item.icon || item.megaMenuImage || item.menuIcon);
                const isText = (child.title.toLowerCase().includes("price") || child.title.toLowerCase().includes("occasion") || child.title.toLowerCase().includes("shop for")) && !hasIcons;
                const finalType = isMetal ? "metal" : (explicitType || (!isText ? "icon" : "text"));

                columns.push({ title: child.title, type: finalType, items: processedItems });
            }
        });

        transformedItem.columns = columns;
        transformedItem.cards = cards;

        const parentBannerMeta = getMetafield(metafields, "custom", "menu_image") || getMetafield(metafields, "custom", "banner_image");
        const parentBannerImage = getFileUrl(parentBannerMeta) || resource.image?.url;
        if (parentBannerImage && cards.length === 0) {
            transformedItem.banner = {
                image: parentBannerImage,
                title: getMetafield(metafields, "custom", "banner_title")?.value || item.title,
                subtitle: getMetafield(metafields, "custom", "menu_subtitle")?.value || `${resource.productsCount?.count || 0} Products`,
                href: transformedItem.href
            };
        }
    } else if (menuType === "image-grid") {
        transformedItem.items = (item.items || []).map(sub => ({
            title: sub.title,
            description: getMetafield(sub.resource?.metafields?.nodes || [], "custom", "menu_subtitle")?.value || `${sub.resource?.productsCount?.count || 0} Products`,
            image: getFileUrl(getMetafield(sub.resource?.metafields?.nodes || [], "custom", "menu_image") || getMetafield(sub.resource?.metafields?.nodes || [], "custom", "image")) || sub.resource?.image?.url,
            href: sub.url.replace(/https:\/\/[^/]+/, "")
        }));
    }

    // The Collections menu renders as an image grid (whether it arrives as
    // "image-grid" or as a "mega" whose children all have menu_image cards),
    // so the quick-link tiles are attached independent of menu type.
    if ((item.title || "").toLowerCase().trim() === "collections") {
        transformedItem.quickLinks = COLLECTION_QUICK_LINKS;
    }

    return transformedItem;
  });
}

function getMetafield(metafields, namespace, key) {
  return (metafields || []).find(m => m.namespace === namespace && m.key === key);
}

function getFileUrl(metafield) {
    if (!metafield) return null;
    if (metafield.reference?.image?.url) return metafield.reference.image.url;
    if (metafield.reference?.url) return metafield.reference.url;
    if (typeof metafield.value === 'string' && (metafield.value.startsWith('http') || metafield.value.startsWith('/'))) return metafield.value;
    return null;
}

// Menu extras that aren't in the Shopify menu (yet), keyed by the lowercase
// top-level label. They're appended at render time and shared by the desktop
// mega menu (Navbar) and the mobile drawer (MobileHeader) so the two can't
// drift apart or get different icons.
//
// `style`: items appended to the "Shop By Style" column. `styleOrder` then
// sorts that column: both the desktop grid (3 columns via `gridCols`) and the
// mobile icon grid (3 columns) flow row by row, so it is the row-major reading
// of the marketing sheet's three columns and reproduces the sheet on both.
// `category`: items appended to the end of "Shop By Category" (no reorder).
// `material`: items appended to "Shop By Material"; one with a `menuIcon`
// renders that icon in place of the CSS metal swatch.
// `dropCards`: drop the menu's Shopify image card on desktop so the
// three-column Style grid has room (the mobile drawer never showed it).
const PEARL_ICON = 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Pearl_material_icon_11caf282-5b57-4376-9384-a4177ab53282.png?v=1792055816';

export const CHUNKY_RINGS_ITEM = {
  label: 'Chunky Rings',
  href: '/collections/chunky-rings',
  menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/chunky_rings.png?v=1787210554',
};

// ---------------------------------------------------------------------------
// Necklaces tab (23 Oct 2026).
//
// The Shopify menu has no top-level Necklaces item yet: necklaces live as a
// column inside More Jewelry. On desktop the Navbar lifts that column out into
// its own tab (between Earrings and More Jewelry), adds the marketing sheet's
// new necklace/pendant styles, and gives it the same Shop By Shape / Material /
// Price columns as Earrings. The mobile drawer keeps its own Necklaces tile
// (built from the More Jewelry column in MobileHeader) and picks up the same
// five new pendants through MENU_EXTRAS.necklaces below.
//
// Display-name overrides that apply on desktop only. The mobile grid keeps the
// full name because its icon map and matchers key on it.
export const DESKTOP_MENU_LABEL_OVERRIDES = {
  // Shortened so the Necklaces tab fits on one line beside OFFERS.
  "9kt collection": "9KT",
};

// Marketing sheet (24 Oct 2026), two Shop By Style columns read row by row:
//   Statement Necklaces | Infinity Necklaces
//   Chain Necklaces     | Heart Pendants
//   Pendant Necklaces   | Butterfly Pendants
//   Tennis Necklaces    | Evil Eye Pendants
//   Gold Necklaces      | Kids Pendants
// The first column comes from the CMS (More Jewelry > Necklaces, plus Gold
// Necklaces from Plain Gold); the second is appended here. The pendant icons
// are the white-background product shots uploaded to Shopify Files on
// 17 Oct 2026 (same style as the CMS necklace icons). No Kids Pendants icon was
// supplied, so it borrows the More Jewelry > Pendants icon until one arrives.
export const NECKLACE_STYLE_EXTRAS = [
  { label: 'Infinity Necklaces', href: '/collections/infinity-necklaces', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Infinity_pendant_icon_6dbb24c1-f58a-47fa-90c8-870c44b6cde8.png?v=1792219203' },
  { label: 'Heart Pendants', href: '/collections/heart-pendants', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Heart_pendant_icon_ef395e2f-66b9-4e02-8e7d-57696bd1de50.png?v=1792219203' },
  { label: 'Butterfly Pendants', href: '/collections/butterfly-pendants', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Butterfly_pendant_icon_ee655fc2-f89d-4efb-b91c-fca07f90866a.png?v=1792219203' },
  { label: 'Evil Eye Pendants', href: '/collections/evil-eye-pendants', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Evil_eye_pendant_icon_fdc9374c-ca2d-448e-9d05-f82caa5ef7c8.png?v=1792219203' },
  { label: 'Kids Pendants', href: '/collections/kids-pendants', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Pendants_More_Jewelry_F2.png?v=1777357190' },
];

export const NECKLACE_STYLE_ORDER = [
  'statement necklaces', 'infinity necklaces',
  'chain necklaces', 'heart pendants',
  'pendant necklaces', 'butterfly pendants',
  'tennis necklaces', 'evil eye pendants',
  'gold necklaces', 'kids pendants',
];

// Same shape icons the Rings / Earrings tabs use (the shared Shop By Shape
// set), plus Heart, which only the necklaces sheet lists. The collection
// handles are copied from the sheet verbatim: every shape except Round is
// spelled "neckalces" in Shopify, and that misspelled handle is the one that
// resolves (the correctly spelled URL falls through to the generic page).
// If the handles are ever corrected in Shopify, update them here too.
export const NECKLACE_SHAPE_ITEMS = [
  { label: 'Round', href: '/collections/round-lab-grown-diamond-necklaces', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Round_Shop_by_Shape_Engagement_Ring_F2.png?v=1777697896' },
  { label: 'Emerald', href: '/collections/emerald-cut-lab-grown-diamond-neckalces', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Emerald_Shop_by_Shape_Engagement_Ring_F2.png?v=1777697823' },
  { label: 'Marquise', href: '/collections/marquise-lab-grown-diamond-neckalces', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Marquise_Shop_by_Shape_Engagement_Ring_F2.png?v=1777697835' },
  { label: 'Cushion', href: '/collections/cushion-lab-grown-diamond-neckalces', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Cushion_Shop_by_Shape_Engagement_Ring_F2.png?v=1777697929' },
  { label: 'Oval', href: '/collections/oval-lab-grown-diamond-neckalces', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Oval_Shop_by_Shape_Engagement_Ring_F2.png?v=1777697847' },
  { label: 'Pear', href: '/collections/pear-lab-grown-diamond-neckalces', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Pear_Shop_by_Shape_Engagement_Ring_F2.png?v=1777697857' },
  { label: 'Princess', href: '/collections/princess-lab-grown-diamond-neckalces', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Princess_Shop_by_Shape_Engagement_Ring_F2.png?v=1777697884' },
  { label: 'Heart', href: '/collections/heart-lab-grown-diamond-neckalces', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Heart_Shop_by_Shape_Engagement_Ring_F2.png?v=1777697936' },
  { label: 'Special Cuts', href: '/collections/special-cuts-lab-grown-diamond-neckalces', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Hexa_1.png?v=1777724104' },
];

// Gold swatches are drawn in CSS from the label (see Navbar). Necklaces have
// no Platinum or Pearl range, so only the three golds are listed.
export const NECKLACE_MATERIAL_ITEMS = [
  { label: 'Yellow Gold', href: '/collections/yellow-gold-necklaces' },
  { label: 'Rose Gold', href: '/collections/rose-gold-necklaces' },
  { label: 'White Gold', href: '/collections/white-gold-necklaces' },
];

// Necklace price bands start higher and run further than the Rings / Earrings
// ones (sheet of 24 Oct 2026).
export const NECKLACE_PRICE_ITEMS = [
  { label: 'Below 50k', href: '/collections/necklaces-below-50k' },
  { label: '50k - 75k', href: '/collections/necklaces-between-50k-75k' },
  { label: '75k - 100k', href: '/collections/necklaces-between-75k-100k' },
  { label: '100k - 150k', href: '/collections/necklaces-between-100k-150k' },
  { label: '150k - 200k', href: '/collections/necklaces-between-150k-200k' },
  { label: '200k - 300k', href: '/collections/necklaces-between-200k-300k' },
  { label: '300k - 500k', href: '/collections/necklaces-between-300k-500k' },
  { label: '500k and above', href: '/collections/necklaces-above-500k' },
];

// The Shape / Material / Price columns, shared by the desktop Necklaces tab
// (buildNecklacesMenu) and the mobile Necklaces drawer (MobileHeader), so the
// two can't drift apart.
export const NECKLACE_FILTER_COLUMNS = [
  { title: 'Shop By Shape', type: 'icon', items: NECKLACE_SHAPE_ITEMS },
  { title: 'Shop By Material', type: 'metal', items: NECKLACE_MATERIAL_ITEMS },
  { title: 'Shop By Price', type: 'text', items: NECKLACE_PRICE_ITEMS },
];

// ---------------------------------------------------------------------------
// More Jewelry > Bracelets (27 Oct 2026 sheet).
//
// The sheet lists the five CMS bracelets in one column and seven new styles
// in a second one:
//   Chain Bracelets   | Infinity Bracelet
//   Cuff Bracelets    | Heart Bracelet
//   Tennis Bracelets  | Butterfly Bracelet
//   Men's Bracelet    | Evil Eye Bracelet
//   Gold Bracelet     | Kids Bracelet
//                     | Initials Bracelets
//                     | Love Bracelet
// The icons are the white-background product shots uploaded to Shopify Files
// on 27 Oct 2026. The sheet wrote the handles in the singular (infinity-bracelet
// etc.), but only the plural handles exist on the store (checked via the
// Storefront API, 27 Oct 2026; initials-bracelets is plural on the sheet too),
// so those are used. No Butterfly Bracelet icon was supplied, so it borrows the
// Butterfly Pendants icon until one arrives.
export const BRACELET_STYLE_EXTRAS = [
  { label: 'Infinity Bracelet', href: '/collections/infinity-bracelets', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Infinity_bracelet_icon_cafb063d-faa7-42b3-a0db-60ad30de912a.png?v=1793081897' },
  { label: 'Heart Bracelet', href: '/collections/heart-bracelets', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Heart_bracelet_icon_998be630-454b-4f64-ab48-6fa74a0690a2.png?v=1793081901' },
  { label: 'Butterfly Bracelet', href: '/collections/butterfly-bracelets', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Butterfly_pendant_icon_ee655fc2-f89d-4efb-b91c-fca07f90866a.png?v=1792219203' },
  { label: 'Evil Eye Bracelet', href: '/collections/evil-eye-bracelets', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Evil_eye_bracelet_icon_aeb0ca3d-3899-45bc-82e4-178b8248095d.png?v=1793081904' },
  { label: 'Kids Bracelet', href: '/collections/kids-bracelets', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Kids_bracelet_icon_4f4e4ee2-db30-4656-bdc5-d993b3dd8ac2.png?v=1793081908' },
  { label: 'Initials Bracelets', href: '/collections/initials-bracelets', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Initials_bracelet_icon_67b0f174-a2e9-4634-a66b-78b2ea9aa598.png?v=1793081911' },
  { label: 'Love Bracelet', href: '/collections/love-bracelets', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Love_bracelet_icon_e18971e1-7550-45b1-bbeb-5e4b4c19fb6f.png?v=1793081915' },
];

// Desktop only: the Bracelets column becomes a two-column grid that flows row
// by row, so this is the row-major reading of the sheet's two columns. With
// twelve items the grid is six rows, the same height as Plain Gold. (Initials
// lands in the first column of the last row; row-major can't do 5 + 7.)
// Mobile keeps the natural order (CMS items, then the new styles) in its own
// three-column grid.
export const BRACELET_DESKTOP_ORDER = [
  'chain bracelets', 'infinity bracelet',
  'cuff bracelets', 'heart bracelet',
  'tennis bracelets', 'butterfly bracelet',
  "men's bracelets", 'evil eye bracelet',
  'gold bracelets', 'kids bracelet',
  'initials bracelets', 'love bracelet',
];

export const MENU_EXTRAS = {
  // 15 Oct 2026 sheet:
  //   Engagement | Solitaire | Infinity Ring
  //   Eternity   | Stackable | Heart Ring
  //   Casual     | Gemstone  | Butterfly Ring
  //   Men's      | Gold      | Evil Eye Ring
  //   Chunky     | Vanki     | Promise Ring
  rings: {
    style: [
      CHUNKY_RINGS_ITEM,
      { label: 'Infinity Ring', href: '/collections/infinity-rings', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Infinity_ring_icon_6c3f75c7-7f62-4e52-b1fb-fc66c669e1c7.png?v=1792055707' },
      { label: 'Heart Ring', href: '/collections/heart-rings', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Heart_ring_icon_b182dd76-7ff2-44d5-89ef-babd8bba9bf3.png?v=1792055707' },
      { label: 'Butterfly Ring', href: '/collections/butterfly-rings', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Butterfly_ring_icon_dcbbb3a1-6bc4-46a8-8b09-0c4ff2db5586.png?v=1792055707' },
      { label: 'Evil Eye Ring', href: '/collections/evil-eye-rings', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Evil_eye_ring_icon_f35df599-7cef-4328-99fe-20f1e05dedfe.png?v=1792055706' },
      // No Vanki icon was supplied, so this is the Classic Vanki Ring product shot.
      { label: 'Vanki', href: '/collections/vanki-rings', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/LJ-R00696YG_1_827510e7-4091-4feb-b52f-a14e9e1953fe.jpg?v=1785412233' },
      { label: 'Promise Ring', href: '/collections/promise-rings', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Promise_ring_icon_ff6651a8-3183-4875-b4b9-af964e2fa43b.png?v=1792055707' },
    ],
    styleOrder: [
      'engagement', 'solitaire', 'infinity ring',
      'eternity', 'stackable', 'heart ring',
      'casual', 'gemstone', 'butterfly ring',
      "men's rings", 'gold rings', 'evil eye ring',
      'chunky rings', 'vanki', 'promise ring',
    ],
    material: [{ label: 'Pearl', href: '/collections/pearl-rings', menuIcon: PEARL_ICON }],
    dropCards: true,
  },
  // 15 Oct 2026 sheet (14 items, so the last grid slot stays empty):
  //   Hoops      | Studs          | Infinity Earrings
  //   Sui Dhagas | Danglers       | Heart Earrings
  //   Solitaire  | Halo           | Butterfly Earrings
  //   Gemstone   | Men's Earrings | Evil Eye Earrings
  //   Gold       | Kids Earrings  |
  earrings: {
    style: [
      { label: 'Infinity Earrings', href: '/collections/infinity-earrings', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Infinity_earring_icon_d4ee59ce-8570-4397-9734-80326b0c764c.png?v=1792056586' },
      { label: 'Heart Earrings', href: '/collections/heart-earrings', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Heart_earring_icon_963f3711-835b-4db3-9bdd-7743cea26881.png?v=1792056586' },
      { label: 'Butterfly Earrings', href: '/collections/butterfly-earrings', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Butterfly_earring_icon_a7dfd45b-33ee-4602-ba86-ab93722fbb06.png?v=1792056586' },
      { label: 'Evil Eye Earrings', href: '/collections/evil-eye-earrings', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Evil_eye_earring_icon_78e3459f-6400-4d4a-91ff-9e32702837fe.png?v=1792056586' },
      { label: 'Kids Earrings', href: '/collections/kids-earrings', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Kids_earring_icon_c9d8bb7e-707d-4b3a-afd2-e2a417b7b69a.png?v=1792056586' },
    ],
    styleOrder: [
      'hoops', 'studs', 'infinity earrings',
      'sui dhagas', 'danglers', 'heart earrings',
      'solitaire', 'halo', 'butterfly earrings',
      'gemstone', "men's earrings", 'evil eye earrings',
      'gold earrings', 'kids earrings',
    ],
    material: [{ label: 'Pearl', href: '/collections/pearl-earrings', menuIcon: PEARL_ICON }],
    dropCards: true,
  },
  // 15 Oct 2026 sheet: Solitaire Essentials below Men's Solitaires. Icon
  // replaced with a dedicated earrings + pendant set icon on 17 Oct 2026.
  solitaires: {
    category: [
      { label: 'Solitaire Essentials', href: '/collections/solitaire-essential', menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Solitaire_essentials_icon_v2.png?v=1792216734' },
    ],
  },
  // 23 Oct 2026 sheet. Desktop builds its Necklaces tab in buildNecklacesMenu
  // (two sheet columns); here the same five pendants reach the mobile
  // Necklaces drawer, whose 3-column grid reads the CMS styles first and then
  // the new pendants in sheet order.
  necklaces: {
    style: NECKLACE_STYLE_EXTRAS,
  },
  // 27 Oct 2026 sheet. `columns` appends to a column by its lowercase title:
  // the Bracelets column of the desktop More Jewelry menu and of the mobile
  // More Jewelry drawer. The mobile Bracelets tile (MobileHeader builds it
  // from the same column as a "Shop by Style" drawer) picks the same seven up
  // through the `bracelets` entry below.
  'more jewelry': {
    columns: { bracelets: BRACELET_STYLE_EXTRAS },
  },
  'more jewellery': {
    columns: { bracelets: BRACELET_STYLE_EXTRAS },
  },
  bracelets: {
    style: BRACELET_STYLE_EXTRAS,
  },
};

const norm = (s) => (s || '').toLowerCase().trim();

// Idempotent: the CMS may add an item for real later.
function appendMissing(items, extras) {
  const have = new Set((items || []).map((i) => norm(i.label)));
  return [...(items || []), ...extras.filter((e) => !have.has(norm(e.label)))];
}

function sortByOrder(items, order) {
  const rank = (it) => {
    const i = order.indexOf(norm(it.label));
    return i === -1 ? order.length : i;
  };
  return items
    .map((it, i) => ({ it, i }))
    .sort((a, b) => rank(a.it) - rank(b.it) || a.i - b.i)
    .map(({ it }) => it);
}

export function withMenuExtras(menus) {
  return withSizedMenuImages((menus || []).map((menu) => {
    const extras = MENU_EXTRAS[norm(menu.label || menu.title)];
    if (!extras) return menu;

    const columns = (menu.columns || []).map((col) => {
      const title = norm(col.title);
      if (title.includes('style') && extras.style) {
        const items = sortByOrder(appendMissing(col.items, extras.style), extras.styleOrder || []);
        return { ...col, items, gridCols: col.gridCols || 3 };
      }
      if (title.includes('category') && extras.category) {
        return { ...col, items: appendMissing(col.items, extras.category) };
      }
      if ((title.includes('material') || title.includes('metal')) && extras.material) {
        return { ...col, items: appendMissing(col.items, extras.material) };
      }
      if (extras.columns?.[title]) {
        return { ...col, items: appendMissing(col.items, extras.columns[title]) };
      }
      return col;
    });

    return extras.dropCards ? { ...menu, columns, cards: [] } : { ...menu, columns };
  }));
}

// ---------------------------------------------------------------------------
// Image sizing (24 Oct 2026).
//
// Menu images come straight from Shopify Files at whatever size marketing
// uploaded (one Gifting icon was 6.6 MB) and are rendered through
// `unoptimized` <Image> / plain <img>, so the browser downloaded the original
// for a 64-80 px circle. The Shopify CDN resizes on request through a `width`
// query param (the same thing `utils/shopifyLoader` does for product shots),
// so every menu image is rewritten here to the largest size it is ever drawn
// at. SVGs are left alone (the CDN doesn't resize them) and so is any URL that
// already carries a width.
//
// Rendered sizes: icons are at most 80 px (mobile style tiles) -> 240 covers
// 3x phones; desktop image cards and the mobile category grid are ~300 px
// squares -> 640; mobile menu banners span the 375-430 px drawer -> 828.
export const MENU_IMAGE_WIDTHS = { icon: 240, card: 640, banner: 828 };

export function sizedMenuImage(url, width) {
  if (typeof url !== 'string' || !url.includes('cdn.shopify.com')) return url;
  if (/\.svg(\?|$)/i.test(url) || /[?&]width=/.test(url)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}width=${width}`;
}

const sizeIconFields = (item) =>
  item && (item.menuIcon || item.icon || item.megaMenuImage)
    ? {
        ...item,
        menuIcon: sizedMenuImage(item.menuIcon, MENU_IMAGE_WIDTHS.icon),
        icon: sizedMenuImage(item.icon, MENU_IMAGE_WIDTHS.icon),
        megaMenuImage: sizedMenuImage(item.megaMenuImage, MENU_IMAGE_WIDTHS.icon),
      }
    : item;

const sizeImageField = (entry, width) =>
  entry && entry.image ? { ...entry, image: sizedMenuImage(entry.image, width) } : entry;

export function withSizedMenuImages(menus) {
  return (menus || []).map((menu) => {
    const out = sizeIconFields(menu);
    if (menu.mobileBanner) out.mobileBanner = sizedMenuImage(menu.mobileBanner, MENU_IMAGE_WIDTHS.banner);
    if (menu.columns) out.columns = menu.columns.map((col) => ({ ...col, items: (col.items || []).map(sizeIconFields) }));
    if (menu.featured) {
      out.featured = { ...menu.featured };
      if (menu.featured.items) out.featured.items = menu.featured.items.map(sizeIconFields);
      if (menu.featured.featuredIn?.items) {
        out.featured.featuredIn = { ...menu.featured.featuredIn, items: menu.featured.featuredIn.items.map(sizeIconFields) };
      }
    }
    if (menu.cards) out.cards = menu.cards.map((c) => sizeImageField(c, MENU_IMAGE_WIDTHS.card));
    if (menu.items) out.items = menu.items.map((c) => sizeImageField(c, MENU_IMAGE_WIDTHS.card));
    if (menu.quickLinks) out.quickLinks = menu.quickLinks.map((q) => sizeImageField(q, MENU_IMAGE_WIDTHS.icon));
    if (menu.banner) out.banner = sizeImageField(menu.banner, MENU_IMAGE_WIDTHS.card);
    return out;
  });
}

const isMoreJewelry = (menu) => {
  const l = norm(menu.label || menu.title);
  return l.includes('more jewelry') || l.includes('more jewellery');
};

// The Necklaces mega menu assembled from the More Jewelry columns of an
// already-transformed menu list. Returns null when More Jewelry has no
// Necklaces column (nothing to lift out).
export function buildNecklacesMenu(menus) {
  const moreJewelry = (menus || []).find(isMoreJewelry);
  const necklaceCol = moreJewelry?.columns?.find((c) => norm(c.title) === 'necklaces');
  if (!necklaceCol?.items?.length) return null;

  const plainGold = moreJewelry.columns.find((c) => norm(c.title).includes('plain gold'));
  const goldNecklaces = plainGold?.items?.find((i) => i.label === 'Gold Necklaces');
  const cmsItems = goldNecklaces
    ? appendMissing(necklaceCol.items, [goldNecklaces])
    : necklaceCol.items;

  const styleItems = sortByOrder(appendMissing(cmsItems, NECKLACE_STYLE_EXTRAS), NECKLACE_STYLE_ORDER);

  return {
    label: 'Necklaces',
    href: '/collections/necklaces',
    type: 'mega',
    layout: '5-col-featured',
    columns: [
      { title: 'Shop By Style', type: 'icon', items: styleItems, gridCols: 2 },
      ...NECKLACE_FILTER_COLUMNS,
    ],
    cards: [],
  };
}

// Desktop menu list: top-level labels shortened per DESKTOP_MENU_LABEL_OVERRIDES,
// the Necklaces column dropped from More Jewelry, and the Necklaces tab inserted
// right after Earrings (or before More Jewelry if Earrings is missing).
export function withDesktopNecklaces(menus) {
  const necklaces = buildNecklacesMenu(menus);
  const list = (menus || []).map((menu) => {
    const label = DESKTOP_MENU_LABEL_OVERRIDES[norm(menu.label || menu.title)] || menu.label;
    const renamed = label === menu.label ? menu : { ...menu, label };
    if (!necklaces || !isMoreJewelry(renamed)) return renamed;
    return {
      ...renamed,
      columns: (renamed.columns || []).filter((c) => norm(c.title) !== 'necklaces'),
    };
  });
  if (!necklaces) return list;

  let at = list.findIndex((m) => norm(m.label || m.title) === 'earrings');
  if (at === -1) at = list.findIndex(isMoreJewelry) - 1;
  const insertAt = at === -1 ? list.length : at + 1;
  return [...list.slice(0, insertAt), necklaces, ...list.slice(insertAt)];
}

// Desktop menu list, after withMenuExtras: the More Jewelry Bracelets column
// (CMS items, Gold Bracelets from Plain Gold, and BRACELET_STYLE_EXTRAS) laid
// out as a two-column grid in BRACELET_DESKTOP_ORDER. The Navbar treats any
// column with `gridCols` as a grid, like Shop By Style.
export function withDesktopBracelets(menus) {
  return (menus || []).map((menu) => {
    if (!isMoreJewelry(menu)) return menu;
    return {
      ...menu,
      columns: (menu.columns || []).map((col) =>
        norm(col.title) === 'bracelets'
          ? { ...col, items: sortByOrder(col.items, BRACELET_DESKTOP_ORDER), gridCols: 2 }
          : col
      ),
    };
  });
}
