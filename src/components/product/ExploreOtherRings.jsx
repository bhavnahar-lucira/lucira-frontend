"use client";

import { useState, useId, useEffect } from 'react';
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";

const SHAPES = [
  { 
    id: "round", 
    label: "Round", 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4L18.4 5.6" />
      </svg>
    )
  },
  { 
    id: "princess", 
    label: "Princess", 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <rect x="4" y="4" width="16" height="16" rx="1" />
        <path d="M4 4l16 16M4 20L20 4M12 4v16M4 12h16" />
      </svg>
    )
  },
  { 
    id: "oval", 
    label: "Oval", 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <ellipse cx="12" cy="12" rx="7" ry="10" />
        <path d="M12 2v20M5 12h14" />
      </svg>
    )
  },
  { 
    id: "cushion", 
    label: "Cushion", 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <rect x="4" y="4" width="16" height="16" rx="5" />
        <path d="M4 4l16 16M4 20L20 4" />
      </svg>
    )
  },
  { 
    id: "emerald", 
    label: "Emerald", 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M7 3h10l4 4v10l-4 4H7l-4-4V7l4-4z" />
        <path d="M7 3v18M17 3v18M3 7h18M3 17h18" />
      </svg>
    )
  },
  { 
    id: "pear", 
    label: "Pear", 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M12 3c0 0-7 8-7 13a7 7 0 0014 0c0-5-7-13-7-13z" />
        <path d="M12 3v17" />
      </svg>
    )
  },
  { 
    id: "marquise", 
    label: "Marquise", 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M3 12c0 0 4-7 9-7s9 7 9 7-4 7-9 7-9-7-9-7z" />
        <path d="M3 12h18M12 5v14" />
      </svg>
    )
  },
  { 
    id: "heart", 
    label: "Heart", 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    )
  },
];

const STATIC_PRODUCTS = [
  {
    id: "1",
    handle: "brilliant-round-six-prong-solitaire-stud-earrings-1",
    title: "3.60cts Brilliant Round Six-Prong Solitaire Stud Earrings",
    label: "NEW",
    colors: ["white", "yellow", "rose"],
    price: 147773,
    compare_at_price: 184853,
    description: "3.60cts • six-prong setting • VVS-VS, EF • 3.50 g",
    images: [{ url: "/images/product/1.jpg", altText: "white" }],
    variants: [
      { id: "v1", color: "white", price: 147773, compare_price: 184853, inStock: true },
      { id: "v2", color: "yellow", price: 147773, compare_price: 184853, inStock: true },
      { id: "v3", color: "rose", price: 147773, compare_price: 184853, inStock: true }
    ]
  },
  {
    id: "2",
    handle: "brilliant-round-six-prong-solitaire-stud-earrings-2",
    title: "3.60cts Brilliant Round Six-Prong Solitaire Stud Earrings",
    colors: ["white", "yellow", "rose"],
    price: 147773,
    compare_at_price: 184853,
    description: "3.60cts • six-prong setting • VVS-VS, EF • 3.50 g",
    images: [{ url: "/images/product/2.jpg", altText: "white" }],
    variants: [
      { id: "v1", color: "white", price: 147773, compare_price: 184853, inStock: true }
    ]
  },
  {
    id: "3",
    handle: "brilliant-round-six-prong-solitaire-stud-earrings-3",
    title: "3.60cts Brilliant Round Six-Prong Solitaire Stud Earrings",
    label: "Best Seller",
    colors: ["white", "yellow", "rose"],
    price: 147773,
    compare_at_price: 184853,
    description: "3.60cts • six-prong setting • VVS-VS, EF • 3.50 g",
    images: [{ url: "/images/product/3.jpg", altText: "white" }],
    variants: [
      { id: "v1", color: "white", price: 147773, compare_price: 184853, inStock: true }
    ]
  },
  {
    id: "4",
    handle: "brilliant-round-six-prong-solitaire-stud-earrings-4",
    title: "3.60cts Brilliant Round Six-Prong Solitaire Stud Earrings",
    colors: ["white", "yellow", "rose"],
    price: 147773,
    compare_at_price: 184853,
    description: "3.60cts • six-prong setting • VVS-VS, EF • 3.50 g",
    images: [{ url: "/images/product/4.jpg", altText: "white" }],
    variants: [
      { id: "v1", color: "white", price: 147773, compare_price: 184853, inStock: true }
    ]
  }
];

// Generate 8 mock products for the grid
const GRID_PRODUCTS = [...STATIC_PRODUCTS, ...STATIC_PRODUCTS.map(p => ({...p, id: `extra-${p.id}`}))].slice(0, 8);

export default function ExploreOtherRings() {
  const [activeTab, setActiveTab] = useState('shape');
  const [activeShape, setActiveShape] = useState('round');
  const [isLoading, setIsLoading] = useState(false);

  const simulateLoading = (callback) => {
    setIsLoading(true);
    // 800ms loading time to feel realistic
    setTimeout(() => {
      callback();
      setIsLoading(false);
    }, 800);
  };

  const handleTabChange = (tab) => {
    if (activeTab === tab) return;
    simulateLoading(() => setActiveTab(tab));
  };

  const handleShapeChange = (shapeId) => {
    if (activeShape === shapeId) return;
    simulateLoading(() => setActiveShape(shapeId));
  };

  return (
    <section className="w-full mt-15 bg-white overflow-hidden">
      <div className="max-w-480 mx-auto px-5 md:px-17 min-[1440px]:px-17">
        <h2 className="text-28px font-bold text-center mb-5">Explore Other Rings</h2>

        {/* Toggle Tabs */}
        <div className="flex justify-center mb-8.5">
          <div className="flex bg-[#F8F8F8] p-1 rounded-md border border-gray-100">
            <button 
              className={`px-10 py-2.5 rounded-md text-base font-semibold transition-all hover:cursor-pointer ${activeTab === 'shape' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:text-black'}`}
              onClick={() => handleTabChange('shape')}
            >
              By Shape
            </button>
            <button 
              className={`px-10 py-2.5 rounded-md text-base font-semibold transition-all hover:cursor-pointer ${activeTab === 'style' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:text-black'}`}
              onClick={() => handleTabChange('style')}
            >
              By Style
            </button>
          </div>
        </div>

        {/* Shape Filters */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8">
          {SHAPES.map((shape) => (
            <button
              key={shape.id}
              onClick={() => handleShapeChange(shape.id)}
              className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full border transition-all hover:cursor-pointer ${
                activeShape === shape.id 
                ? 'border-black bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-black' 
                : 'border-transparent bg-[#F9F9F9] hover:bg-gray-100 text-gray-900'
              }`}
            >
              <span className={activeShape === shape.id ? 'text-black' : 'text-gray-500'}>
                {shape.icon}
              </span>
              <span className="text-base font-semibold">{shape.label}</span>
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
          {isLoading ? (
            // Show 8 skeletons
            Array.from({ length: 8 }).map((_, idx) => (
              <ProductCardSkeleton key={`skeleton-${idx}`} />
            ))
          ) : (
            // Show 8 products
            GRID_PRODUCTS.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx + 1} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
