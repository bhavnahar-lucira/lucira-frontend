"use client";

import { useState, useEffect } from "react";
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

export default function GemstoneSection() {
  const [products, setProducts] = useState([]);
  const [tabs, setTabs] = useState(DEFAULT_TABS);
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [tabsLoading, setTabsLoading] = useState(true);

  useEffect(() => {
    async function fetchGemstoneCategories() {
      setTabsLoading(true);
      try {
        const data = await apiFetch(`/api/products/filters?q=gemstone`);
        const categories = (data["Product Category"] || [])
          .map((option) => option.label || option.value)
          .filter(Boolean);

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
      setLoading(true);
      try {
        const filterParam = activeTab !== "All" ? `&filter.p.product_type=${encodeURIComponent(activeTab)}` : "";
        const data = await apiFetch(`/api/products/search?q=gemstone&limit=20${filterParam}`);
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
      colLink="/collections/gemstone-jewellery"
      onTabChange={(tab) => setActiveTab(tab)}
      loading={loading || tabsLoading}
    >
      <CollectionSlider
        products={products.length > 0 ? products : (loading ? [] : null)}
        loading={loading}
      />
    </CollectionSection>
  );
}
