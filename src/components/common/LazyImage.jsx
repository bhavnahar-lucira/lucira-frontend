"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

const LazyImage = ({ src, alt, className, fill, width, height, priority, sizes, ...props }) => {
  const [loaded, setLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // If priority is set, load immediately
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // Once in view, we keep it loaded
        }
      },
      { 
        rootMargin: "200px", // Start loading 200px before it enters viewport for better UX
        threshold: 0.01 
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${fill ? "w-full h-full" : "inline-block"}`}
      style={!fill && !width ? { minWidth: '1px', minHeight: '1px' } : {}}
    >
      {(!loaded || !isInView) && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#fafafa] z-[5]">
          <Image 
            src="/images/loader.gif" 
            alt="Loading..." 
            width={24} 
            height={24} 
            className="object-contain" 
            unoptimized
          />
        </div>
      )}
      
      {isInView && (
        <Image
          src={src}
          alt={alt || "Lucira Image"}
          fill={fill}
          width={width}
          height={height}
          priority={priority}
          sizes={sizes}
          onLoad={() => setLoaded(true)}
          unoptimized={String(src).includes("cdn.shopify.com") || String(src).includes("myshopify.com")}
          className={`${className} transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImage;
