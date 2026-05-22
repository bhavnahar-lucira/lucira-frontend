"use client";

import { useState, useEffect } from "react";
import CollectionSection from "./CollectionSection";
import CollectionSlider from "./CollectionSlider";
import { apiFetch } from "@/lib/api";

export default function BestsellerSection() {
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBestsellers() {
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
            "Pendants": "Charms & Pendants"
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
