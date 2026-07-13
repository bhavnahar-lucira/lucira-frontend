"use client";

import { useState, useEffect, useRef } from "react";
import CollectionSection from "./CollectionSection";
import CollectionSlider from "./CollectionSlider";
import { apiFetch } from "@/lib/api";

const DEFAULT_TABS = [
  "All",
  "Bracelets",
  "Charms & Pendants",
  "Earrings",
  "Necklaces",
  "Rings"
];

export default function GemstoneSection({ initialProducts, initialCategories }) {
  const [products, setProducts] = useState(() => initialProducts?.products || []);
  const [tabs, setTabs] = useState(() => {
    if (initialCategories) {
      const categories = (initialCategories["Product Category"] || [])
        .map((option) => option.label || option.value)
        .filter(Boolean)
        .filter(cat => cat.toLowerCase() !== "pendants");
      if (categories.length > 0) {
        const preferredOrder = ["Bracelets", "Charms & Pendants", "Earrings", "Necklaces", "Rings"];
        return ["All", ...preferredOrder.filter((cat) => categories.includes(cat)), ...categories.filter((cat) => !preferredOrder.includes(cat))];
      }
    }
    return DEFAULT_TABS;
  });
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(!initialProducts);
  const [tabsLoading, setTabsLoading] = useState(!initialCategories);
  const isFirstRenderTabs = useRef(true);
  const isFirstRenderProducts = useRef(true);

  useEffect(() => {
    async function fetchGemstoneCategories() {
      if (isFirstRenderTabs.current && initialCategories) {
        isFirstRenderTabs.current = false;
        return;
      }
      isFirstRenderTabs.current = false;

      setTabsLoading(true);
      try {
        const data = await apiFetch(`/api/products/filters?q=gemstone`);
        const categories = (data["Product Category"] || [])
          .map((option) => option.label || option.value)
          .filter(Boolean)
          .filter(cat => cat.toLowerCase() !== "pendants");

        if (categories.length > 0) {
          const preferredOrder = [
            "Bracelets",
            "Charms & Pendants",
            "Earrings",
            "Necklaces",
            "Rings"
          ];

          const orderedCategories = [
            ...preferredOrder.filter((cat) => categories.includes(cat)),
            ...categories.filter((cat) => !preferredOrder.includes(cat))
          ];

          setTabs(["All", ...orderedCategories]);
        }
      } catch (error) {
        console.error("Failed to fetch gemstone categories:", error);
      } finally {
        setTabsLoading(false);
      }
    }
    fetchGemstoneCategories();
  }, []);

  useEffect(() => {
    async function fetchGemstoneProducts() {
      if (isFirstRenderProducts.current && initialProducts && activeTab === "All") {
        isFirstRenderProducts.current = false;
        return;
      }
      isFirstRenderProducts.current = false;

      setLoading(true);
      try {
        let apiUrl = `/api/collection?handle=gemstone-jewelry&limit=15`;
        if (activeTab !== "All") {
          const filters = [{ productType: activeTab }];
          apiUrl += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
        }
        
        const data = await apiFetch(apiUrl);
        if (data.products) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Failed to fetch gemstone products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchGemstoneProducts();
  }, [activeTab]);

  return (
    <CollectionSection
      title="Beyond Diamonds, The Gemstone Edit"
      tabs={tabs}
      page="home"
      colCat="shop all gemstone"
      colLink="/collections/gemstone-jewelry"
      onTabChange={(tab) => setActiveTab(tab)}
      loading={loading || tabsLoading}
    >
      <CollectionSlider
        products={products.length > 0 ? products : (loading ? [] : null)}
        loading={loading}
        priorityCount={2}
        promoClickMeta={{
          creative_name: "gemstone edits section homepage",
          location_id: "homepage",
          promo_id: activeTab,
        }}
      />
    </CollectionSection>
  );
}
