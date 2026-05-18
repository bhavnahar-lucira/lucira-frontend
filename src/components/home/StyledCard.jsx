"use client";

import { forwardRef, useState, useEffect, useRef } from "react";
import { Play, ShoppingBag } from "lucide-react";

const StyledVideoCard = forwardRef(({ video, onClick }, ref) => {
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setHasBeenInView(true);
        } else {
          setIsInView(false);
          if (videoRef.current) {
            videoRef.current.pause();
          }
        }
      },
      { threshold: 0.1 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isInView && videoRef.current) {
      videoRef.current.play().catch(() => {
          // Auto-play might be blocked by browser
      });
    }
  }, [isInView]);

  return (
    <div 
      onClick={onClick}
      className="relative rounded-lg overflow-hidden group/card cursor-pointer shadow-md bg-gray-200 w-full"
    >
      <video
        ref={(node) => {
          videoRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        // Only set src when it has been in view at least once to prevent early loading
        // Once set, we keep it to avoid re-fetching
        src={hasBeenInView ? video : undefined}
        muted
        loop
        playsInline
        preload="none"
        className="w-full h-135 object-cover"
      />

      {/* Loader placeholder while video is loading after entering view */}
      {!hasBeenInView && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
             <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
      )}

      {/* Shopping Bag Icon */}
      <div className="absolute top-4 right-4 z-10 transition-transform duration-300 group-hover/card:scale-110">
        <div className="w-10 h-10 bg-white/95 rounded-full flex items-center justify-center shadow-lg">
          <ShoppingBag size={18} className="text-[#333]" />
        </div>
      </div>

      {/* Play Button Overlay - Appears ONLY on specific card hover */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
        <div className="w-16 h-16 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 shadow-2xl scale-75 group-hover/card:scale-100 transition-transform duration-300">
          <Play size={30} fill="white" className="text-white ml-1 opacity-90" />
        </div>
      </div>
    </div>
  );
});

StyledVideoCard.displayName = "StyledVideoCard";

export default StyledVideoCard;