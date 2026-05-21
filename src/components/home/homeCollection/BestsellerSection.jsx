"use client";

import { useState, useEffect } from "react";
import CollectionSection from "./CollectionSection";
import CollectionSlider from "./CollectionSlider";

export default function BestsellerSection({ initialProducts = [] }) {
  const [products, setProducts] = useState(initialProducts);
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted && activeTab === "All") return;

    async function fetchBestsellers() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/bestsellers?tab=${activeTab}`);
        const data = await res.json();
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
        "Pendants",
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
      />
    </CollectionSection>
  );
}
