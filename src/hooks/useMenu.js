import { useState, useEffect } from "react";

export function useMenu(handle) {
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch("/api/menus", { cache: "no-store" });
        const data = await res.json();
        
        if (data.success) {
          const mainMenu = data.menus.find(m => m.handle === handle);
          if (mainMenu) {
            setMenuData(transformMenu(mainMenu));
          } else {
            setError("Menu not found");
          }
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMenu();
  }, [handle]);

  return { menuData, loading, error };
}

function transformMenu(shopifyMenu) {
  return shopifyMenu.items.map(item => {
    const resource = item.resource || {};
    const metafields = resource.metafields?.nodes || [];
    
    // Check if "Featured" should be disabled for this specific label
    const disabledLabels = ["more jewellery", "solitaire", "collections", "gifting", "9kt collection"];
    const isFeaturedDisabled = disabledLabels.includes(item.title.toLowerCase().trim());

    // Get menu configuration
    const menuType = getMetafield(metafields, "custom", "menu_type")?.value || (item.items?.length > 0 ? "mega" : "link");
    const layout = getMetafield(metafields, "custom", "layout")?.value || "5-col-featured";
    
    let transformedItem = {
      label: item.title,
      href: item.url.replace(/https:\/\/[^/]+/, ""), // Strip domain
      type: menuType,
      layout: layout,
      mobileBanner: getFileUrl(getMetafield(metafields, "custom", "mobile_menu_banner_image")),
      menuIcon: getFileUrl(getMetafield(metafields, "custom", "menu_links_image_icon")) || resource.image?.url || resource.featuredImage?.url,
    };

    if (menuType === "mega") {
        const children = item.items || [];
        
        // 1. Detect Featured Groups
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
                    transformedItem.featured.items = featuredGroup.items.map(f => {
                        const fResource = f.resource || {};
                        const fMeta = fResource.metafields?.nodes || [];
                        return {
                            label: f.title,
                            href: f.url.replace(/https:\/\/[^/]+/, ""),
                            icon: getFileUrl(getMetafield(fMeta, "custom", "icon")),
                            megaMenuImage: getFileUrl(getMetafield(fMeta, "custom", "mega_menu_image")),
                            menuIcon: getFileUrl(getMetafield(fMeta, "custom", "menu_links_image_icon")) || fResource.image?.url || fResource.featuredImage?.url,
                        };
                    });
                }

                if (featuredInGroup) {
                  transformedItem.featured.featuredIn = {
                      title: featuredInGroup.title,
                      items: featuredInGroup.items.map(f => {
                          const fResource = f.resource || {};
                          const fMeta = fResource.metafields?.nodes || [];
                          return {
                              label: f.title,
                              href: f.url.replace(/https:\/\/[^/]+/, ""),
                              icon: getFileUrl(getMetafield(fMeta, "custom", "icon")),
                              megaMenuImage: getFileUrl(getMetafield(fMeta, "custom", "mega_menu_image")),
                              menuIcon: getFileUrl(getMetafield(fMeta, "custom", "menu_links_image_icon")) || fResource.image?.url || fResource.featuredImage?.url,
                          };
                      })
                  };
                }
            }
        }

        // 2. Separate remaining items into Columns or Cards (Banners)
        // Filter out any group that was treated as "Featured" or "Featured In"
        const remainingItems = children.filter(c => {
            const title = c.title.toLowerCase();
            const isFeatured = title.includes("featured") && !title.includes("in");
            const isFeaturedIn = title.includes("featured in");
            return !isFeatured && !isFeaturedIn;
        });
        
        const columns = [];
        const cards = [];

        remainingItems.forEach(child => {
            const childResource = child.resource || {};
            const childMetafields = childResource.metafields?.nodes || [];
            const menuImage = getFileUrl(getMetafield(childMetafields, "custom", "menu_image"));

            if (menuImage) {
                cards.push({
                    title: child.title,
                    image: menuImage,
                    subtitle: getMetafield(childMetafields, "custom", "menu_subtitle")?.value || `${childResource.productsCount?.count || 0} Products`,
                    href: child.url.replace(/https:\/\/[^/]+/, "")
                });
            } else {
                const isMetal = child.title.toLowerCase().includes("metal") || child.title.toLowerCase().includes("material");
                const isIcon = child.title.toLowerCase().includes("style") || child.title.toLowerCase().includes("shape");

                const processedItems = (() => {
                    const seen = new Set();
                    // Filter out duplicates and items that match the parent title
                    return (child.items || [])
                        .filter(sub => {
                            const label = sub.title.toLowerCase().trim();
                            if (label === child.title.toLowerCase().trim() || seen.has(label)) {
                                return false;
                            }
                            seen.add(label);
                            return true;
                        })
                        .map(sub => {
                            const subResource = sub.resource || {};
                            const subMeta = subResource.metafields?.nodes || [];
                            return {
                                label: sub.title,
                                href: sub.url.replace(/https:\/\/[^/]+/, ""),
                                icon: getFileUrl(getMetafield(subMeta, "custom", "icon")),
                                megaMenuImage: getFileUrl(getMetafield(subMeta, "custom", "mega_menu_image")),
                                menuIcon: getFileUrl(getMetafield(subMeta, "custom", "menu_links_image_icon")) || subResource.image?.url || subResource.featuredImage?.url,
                                };                        });
                })();

                const explicitType = getMetafield(childMetafields, "custom", "column_type")?.value;
                const hasIcons = processedItems.some(item => item.icon || item.megaMenuImage || item.menuIcon);
                const isText = (child.title.toLowerCase().includes("price") || child.title.toLowerCase().includes("occasion") || child.title.toLowerCase().includes("shop for")) && !hasIcons;
                const finalType = isMetal ? "metal" : (explicitType || (!isText ? "icon" : "text"));

                columns.push({
                    title: child.title,
                    type: finalType,
                    items: processedItems
                });
            }
        });

        transformedItem.columns = columns;
        transformedItem.cards = cards;

        // Parent-level banner (fallback)
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
        // ... (existing image-grid logic remains the same)
        transformedItem.items = item.items?.map(sub => {
            const subResource = sub.resource || {};
            const subMeta = subResource.metafields?.nodes || [];
            const gridImageMeta = getMetafield(subMeta, "custom", "menu_image") || getMetafield(subMeta, "custom", "image");
            return {
                title: sub.title,
                description: getMetafield(subMeta, "custom", "menu_subtitle")?.value || `${subResource.productsCount?.count || 0} Products`,
                image: getFileUrl(gridImageMeta) || subResource.image?.url || subResource.featuredImage?.url,
                href: sub.url.replace(/https:\/\/[^/]+/, "")
            };
        });
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
