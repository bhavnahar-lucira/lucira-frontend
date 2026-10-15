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
// tiles (one grid column per block); with 15 tiles the only empty slot is the
// last one of the last block. Mobile renders the same order as one flat list.
// Cotton Candy is desktop-only: on mobile it stays as a card in the image grid.
export const DESKTOP_QUICK_LINK_BLOCK = 8;

export const COLLECTION_QUICK_LINKS = [
  // Added 15 Oct 2026. Order is the row-major reading of the marketing sheet:
  // Portuguese, Religious / Infinity, Paperclip / Heart, Twisted / Chrome.
  // Icons were uploaded to Shopify Files the same day.
  { label: "Portuguese", href: "/collections/portuguese", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Portuguese_collection_icon_ce3defeb-01bd-47fd-a99d-ce53e70f7908.png?v=1792048808" },
  { label: "Religious", href: "/collections/religious", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Religious_collection_icon_24db892e-9654-420e-b6d9-14abbc259e7b.png?v=1792048808" },
  { label: "Infinity", href: "/collections/infinity", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Infinity_collection_icon_0a12ace4-072c-40d4-ad57-4dfd52175cd7.png?v=1792048808" },
  { label: "Paperclip", href: "/collections/paperclip-collection", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Paperclip_collection_icon_d2ac7f37-c789-4cd6-be92-677e3af7a3e5.png?v=1792048808" },
  { label: "Heart", href: "/collections/heart", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Heart_collection_icon_52aa005e-e0e8-43b2-acad-7c54941208f7.png?v=1792048808" },
  { label: "Twisted", href: "/collections/twisted", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Twisted_collection_icon_78078319-ab50-4ab2-8b81-c35f3e3808ef.png?v=1792048808" },
  { label: "Chrome", href: "/collections/chrome", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Chrome_collection_icon_7acdaecf-484c-473b-9ea4-51500b359101.png?v=1792048808" },
  // The original tiles.
  { label: "Cotton Candy", href: "/collections/cotton-candy", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Ellipse_2966.png?v=1785231957", desktopOnly: true },
  { label: "Evil Eye", href: "/collections/evil-eye", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/evil_eye.png?v=1785231427" },
  { label: "Pearl", href: "/collections/pearl", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/pearl_030670d5-2823-41f2-8f9c-0e3edc770719.png?v=1785231427" },
  { label: "Nakshatra", href: "/collections/nakshatra", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Nakshatra.png?v=1785231427" },
  { label: "Peacock", href: "/collections/peacock", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Peacock.png?v=1785231427" },
  { label: "Hexa Moving Diamond", href: "/collections/hexa-moving-diamond", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Hexa_Moving_Diamond.png?v=1785231427" },
  { label: "Petalique", href: "/collections/petalique", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Petalique.png?v=1785231427" },
  { label: "Butterfly Collection", href: "/collections/butterfly-collection", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Butterfly_collection_icon_868489d6-0006-419f-84c4-f87091b052db.png?v=1789973142" },
];

// Image cards from the Shopify Collections menu that the DESKTOP mega menu
// drops to make room for the quick-link blocks. Mobile keeps them.
export const DESKTOP_HIDDEN_COLLECTION_CARDS = ["/collections/hexa"];

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

// Chunky Rings isn't in the Shopify menu yet, so it's appended to the RINGS
// "Shop by Style" column at render time. Shared by the desktop mega menu
// (Navbar) and the mobile drawer (MobileHeader) so the two can't drift apart
// or end up with different icons.
export const CHUNKY_RINGS_ITEM = {
  label: 'Chunky Rings',
  href: '/collections/chunky-rings',
  menuIcon: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/chunky_rings.png?v=1787210554',
};

export function withChunkyRings(menus) {
  return (menus || []).map((menu) => {
    const label = (menu.label || menu.title || '').toLowerCase().trim();
    if (label !== 'rings') return menu;

    let injected = false;
    const columns = (menu.columns || []).map((col) => {
      if (injected) return col;
      if (!(col.title || '').toLowerCase().includes('shop by style')) return col;
      const items = col.items || [];
      // Idempotent: the CMS may add the item for real later.
      if (items.some((i) => (i.label || '').toLowerCase().trim() === 'chunky rings')) {
        injected = true;
        return col;
      }
      injected = true;
      return { ...col, items: [...items, CHUNKY_RINGS_ITEM] };
    });

    return injected ? { ...menu, columns } : menu;
  });
}
