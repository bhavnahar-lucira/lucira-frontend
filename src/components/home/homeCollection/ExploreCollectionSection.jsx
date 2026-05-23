"use client";

import { useState, useEffect } from "react";
import CollectionSection from "./CollectionSection";
import CollectionSlider from "./CollectionSlider";
import { apiFetch } from "@/lib/api";

const COLLECTION_HANDLE_MAP = {
  "On The Move": "sports-collection",
  "Cotton Candy": "cotton-candy",
  Hexa: "hexa",
  "9KT Collection": "9kt-collection",
};

export default function ExploreCollectionSection() {
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("On The Move");
  const [loading, setLoading] = useState(true);

  const activeHandle = COLLECTION_HANDLE_MAP[activeTab] || "sports-collection";

  useEffect(() => {
    async function fetchCollectionProducts() {
      setLoading(true);
      try {
        const data = await apiFetch(`/api/collection?handle=${encodeURIComponent(activeHandle)}&limit=15`);
        if (data.products) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Failed to fetch collection products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCollectionProducts();
  }, [activeHandle]);

  return (
    <CollectionSection 
      title="Explore By Collections"
      tabs={Object.keys(COLLECTION_HANDLE_MAP)}
      page="home"
      colCat="shop all collections"
      colLink="/collections/all"
      onTabChange={(tab) => setActiveTab(tab)}
      loading={loading}
    >        
      <CollectionSlider 
        products={products.length > 0 ? products : (loading ? [] : null)} 
        loading={loading}
        collectionHandle={activeHandle}
      />
    </CollectionSection>
  );
}
