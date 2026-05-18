"use client";

import { X, ChevronUp, ChevronDown, Volume2, VolumeX } from "lucide-react";
import LazyImage from "../common/LazyImage";
import { useEffect, useRef, useState, useLayoutEffect } from "react";

export default function InstaPopup({ isOpen, onClose, data, activeIndex }) {
  const scrollContainerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(activeIndex);
  const [isMuted, setIsMuted] = useState(false); // Unmuted by default as requested
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setCurrentIndex(activeIndex);
      // Brief delay to ensure position is set before revealing
      const timer = setTimeout(() => setIsReady(true), 50);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = "unset";
      setIsReady(false);
    }
  }, [isOpen, activeIndex]);

  // Use useLayoutEffect for instant scrolling before paint
  useLayoutEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      const height = scrollContainerRef.current.clientHeight;
      if (height > 0) {
        scrollContainerRef.current.scrollTop = activeIndex * height;
      } else {
        const element = scrollContainerRef.current.children[activeIndex];
        if (element) {
          element.scrollIntoView({ behavior: "instant", block: "start" });
        }
      }
    }
  }, [isOpen, activeIndex]);

  if (!isOpen || !data || data.length === 0) return null;

  const handleScroll = (e) => {
    const container = e.target;
    const scrollPos = container.scrollTop;
    const height = container.clientHeight;
    if (height === 0) return;

    const newIndex = Math.round(scrollPos / height);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < data.length) {
      setCurrentIndex(newIndex);
    }
  };

  const scrollToNext = () => {
    if (currentIndex < data.length - 1 && scrollContainerRef.current) {
      scrollContainerRef.current.children[currentIndex + 1].scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToPrev = () => {
    if (currentIndex > 0 && scrollContainerRef.current) {
      scrollContainerRef.current.children[currentIndex - 1].scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className={`fixed inset-0 z-[99999] flex items-center justify-center bg-black transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Custom Controls Bar (Mute and Close) */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-[140]">
        {/* Mute/Unmute Button (Top Left) */}
        <button
            onClick={toggleMute}
            className="text-white hover:scale-110 transition-all cursor-pointer bg-black/40 hover:bg-black/60 rounded-full p-2.5 backdrop-blur-md border border-white/20"
        >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>

        {/* Close Button (Top Right) */}
        <button
            onClick={onClose}
            className="text-white hover:scale-110 transition-all cursor-pointer bg-black/40 hover:bg-black/60 rounded-full p-2.5 backdrop-blur-md border border-white/20"
        >
            <X size={24} />
        </button>
      </div>

      {/* Desktop Navigation Arrows */}
      <div className="hidden md:flex absolute right-10 top-1/2 -translate-y-1/2 flex-col gap-4 z-[130]">
        <button 
          onClick={scrollToPrev}
          disabled={currentIndex === 0}
          className="text-white/50 hover:text-white transition-all bg-white/10 hover:bg-white/20 rounded-full p-3 backdrop-blur-md disabled:opacity-20"
        >
          <ChevronUp size={32} />
        </button>
        <button 
          onClick={scrollToNext}
          disabled={currentIndex === data.length - 1}
          className="text-white/50 hover:text-white transition-all bg-white/10 hover:bg-white/20 rounded-full p-3 backdrop-blur-md disabled:opacity-20"
        >
          <ChevronDown size={32} />
        </button>
      </div>

      {/* Vertical Scroll Container */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
      >
        {data.map((item, idx) => (
          <div key={item.id} className="w-full h-full snap-start flex items-center justify-center relative bg-black">
            
            {/* Media Content */}
            <div className="w-full h-full md:max-w-4xl md:h-[90vh] md:rounded-3xl overflow-hidden bg-black relative flex items-center justify-center">
              {item.isVideo ? (
                  <video 
                      src={item.mediaUrl} 
                      className="w-full h-full object-contain"
                      autoPlay={idx === currentIndex}
                      loop
                      muted={idx !== currentIndex || isMuted}
                      playsInline
                      preload="auto"
                      key={`video-${item.id}-${idx === currentIndex}-${isMuted}`}
                  />
              ) : (
                  <div className="relative w-full h-full">
                      <LazyImage
                          src={item.image}
                          alt="Instagram Media"
                          fill
                          className="object-contain"
                          priority={idx === currentIndex}
                      />
                  </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
