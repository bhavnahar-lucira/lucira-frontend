import menuData from "@/data/menu-data.json";

// Small collection tiles rendered beside the image cards in the desktop
// Collections menu and below the 2x2 grid in the mobile menu. Cotton Candy is
// desktop-only: on mobile it stays as a card in the image grid.
export const COLLECTION_QUICK_LINKS = [
  { label: "Cotton Candy", href: "/collections/cotton-candy", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Ellipse_2966.png?v=1785231957", desktopOnly: true },
  { label: "Evil Eye", href: "/collections/evil-eye", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/evil_eye.png?v=1785231427" },
  { label: "Pearl", href: "/collections/pearl", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/pearl_030670d5-2823-41f2-8f9c-0e3edc770719.png?v=1785231427" },
  { label: "Nakshatra", href: "/collections/nakshatra", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Nakshatra.png?v=1785231427" },
  { label: "Peacock", href: "/collections/peacock", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Peacock.png?v=1785231427" },
  { label: "Hexa Moving Diamond", href: "/collections/hexa-moving-diamond", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Hexa_Moving_Diamond.png?v=1785231427" },
  { label: "Petalique", href: "/collections/petalique", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Petalique.png?v=1785231427" },
  // mobileOnly keeps the desktop Collections grid an even 2x4; drop the flag
  // once Infinity should appear on desktop too.
  { label: "Infinity Collection", href: "/collections/infinity", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Infinity_collection_icon_91329834-7874-40aa-9871-bc03dc51ac8b.png?v=1787825093", mobileOnly: true },
  { label: "Butterfly Collection", href: "/collections/butterfly-collection", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Butterfly_Collection.png?v=1787824137" },
];

export async function getMenu(handle = "main-menu-official") {
  try {
    if (menuData.success && menuData.menus) {
        const found = menuData.menus.find(m => m.handle === handle);
        if (found) return found.items;
    }
    return [];
  } catch (error) {
    console.error("getMenu Error:", error);
    return [];
  }
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
      label: item.title,
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
