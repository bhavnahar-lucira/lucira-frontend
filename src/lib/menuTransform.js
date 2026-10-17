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
                    label: sub.title,
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
  //   Sui Dhagas | Dangles        | Heart Earrings
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
      'sui dhagas', 'dangles', 'heart earrings',
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
  return (menus || []).map((menu) => {
    const extras = MENU_EXTRAS[norm(menu.label || menu.title)];
    if (!extras) return menu;

    const columns = (menu.columns || []).map((col) => {
      const title = norm(col.title);
      if (title.includes('style') && extras.style) {
        const items = sortByOrder(appendMissing(col.items, extras.style), extras.styleOrder || []);
        return { ...col, items, gridCols: 3 };
      }
      if (title.includes('category') && extras.category) {
        return { ...col, items: appendMissing(col.items, extras.category) };
      }
      if ((title.includes('material') || title.includes('metal')) && extras.material) {
        return { ...col, items: appendMissing(col.items, extras.material) };
      }
      return col;
    });

    return extras.dropCards ? { ...menu, columns, cards: [] } : { ...menu, columns };
  });
}
