"use client";

import { useState, useEffect, useRef } from "react";
import CollectionSection from "./CollectionSection";
import CollectionSlider from "./CollectionSlider";
import { apiFetch } from "@/lib/api";

const SHOPIFY_FILES = "https://cdn.shopify.com/s/files/1/0739/8516/3482/files";

// Editorial image pinned beside the cards (tablet/desktop), one per tab.
const TAB_LEAD_IMAGES = {
  All: `${SHOPIFY_FILES}/All.jpg?v=1790684560`,
  Rings: `${SHOPIFY_FILES}/Rings_1.jpg?v=1790684559`,
  Earrings: `${SHOPIFY_FILES}/Earrings_1_5e9c08e3-74c5-4f96-9153-59d23606b040.jpg?v=1790684561`,
  Bracelets: `${SHOPIFY_FILES}/Bracelets_bc1c5692-0068-4672-bc55-25c085391398.jpg?v=1790684561`,
  Necklaces: `${SHOPIFY_FILES}/Necklaces_1.jpg?v=1790684561`,
};

// Landscape versions for mobile, where the image sits above the cards.
const TAB_LEAD_IMAGES_MOBILE = {
  All: `${SHOPIFY_FILES}/All_1.jpg?v=1790845202`,
  Rings: `${SHOPIFY_FILES}/Rings_2.jpg?v=1790845202`,
  Earrings: `${SHOPIFY_FILES}/Earrings_2.jpg?v=1790845202`,
  Bracelets: `${SHOPIFY_FILES}/Bracelets_1_0bd5d226-a111-4022-9356-5970ea92183a.jpg?v=1790845202`,
  Necklaces: `${SHOPIFY_FILES}/Necklaces_2.jpg?v=1790845202`,
};

// `surface` only tags the GA promo-click payload, so a rail reused on another
// page does not report itself as the homepage. Everything else is unchanged.
export default function BestsellerSection({ initialData, surface = "homepage" }) {
  const [products, setProducts] = useState(() => initialData?.products || []);
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(!initialData);
  const isFirstRender = useRef(true);

  useEffect(() => {
    async function fetchBestsellers() {
      if (isFirstRender.current && initialData && activeTab === "All") {
        isFirstRender.current = false;
        return;
      }
      isFirstRender.current = false;

      setLoading(true);
      try {
        let apiUrl = `/api/collection?handle=bestsellers&limit=15`;
        if (activeTab !== "All") {
          // Map plural tabs to singular if needed, or send as is if Shopify handles it
          // Most Shopify product types are singular (Ring, Earring)
          const typeMap = {
            "Rings": "Rings",
            "Earrings": "Earrings",
            "Bracelets": "Bracelets",
            "Necklaces": "Necklaces",
          };
          const productType = typeMap[activeTab] || activeTab;
          const filters = [{ productType: productType }];
          apiUrl += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
        }
        
        const data = await apiFetch(apiUrl);
        if (data.products) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error("Failed to fetch bestsellers:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBestsellers();
  }, [activeTab]);

  return (
    <CollectionSection 
      title="Shop Bestsellers"
      tabs={[
        "All",
        "Rings",
        "Earrings",
        "Bracelets",
        "Necklaces",
      ]}
      page="home"
      colCat="Shop All Bestsellers"
      colLink="/collections/bestsellers"
      onTabChange={(tab) => setActiveTab(tab)}
      loading={loading}
    >        
      <CollectionSlider
        products={products.length > 0 ? products : (loading ? [] : undefined)}
        loading={loading}
        priorityCount={4}
        leadImage={{
          src: TAB_LEAD_IMAGES[activeTab],
          mobileSrc: TAB_LEAD_IMAGES_MOBILE[activeTab],
          alt: activeTab === "All" ? "Shop bestsellers" : `Shop bestseller ${activeTab.toLowerCase()}`,
        }}
        promoClickMeta={{
          creative_name: `shop bestseller section ${surface}`,
          location_id: surface,
          promo_id: activeTab,
        }}
      />
    </CollectionSection>
  );
}
