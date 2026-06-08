"use client";

import { X, ChevronLeft, ChevronRight, Star, BadgeCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Helper to ensure image src is a valid string URL
const getValidSrc = (src, fallback = null) => {
  if (typeof src === 'string' && src.trim() !== '') return src;
  if (src && typeof src === 'object' && src.url) return src.url;
  return fallback;
};

export default function ReviewDetailedPopup({ isOpen, onClose, reviews, activeIndex, onIndexChange }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setCurrentImageIndex(0);
      setIsLoaded(false);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, activeIndex]);

  if (!isOpen || !reviews || reviews.length === 0) return null;

  const review = reviews[activeIndex];
  if (!review) return null;

  const handlePrev = () => {
    const nextIndex = (activeIndex - 1 + reviews.length) % reviews.length;
    onIndexChange(nextIndex);
  };

  const handleNext = () => {
    const nextIndex = (activeIndex + 1) % reviews.length;
    onIndexChange(nextIndex);
  };

  const currentImageRaw = review.images && review.images.length > 0 
    ? review.images[currentImageIndex] 
    : review.personImage;
    
  const currentImage = getValidSrc(currentImageRaw);

  return (
    <div className="fixed inset-0 z-[499] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-10 transition-all duration-300">
      
      {/* Navigation */}
      <button 
        onClick={handlePrev}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-[500] text-white hover:text-gray-300 transition-colors cursor-pointer outline-none bg-black/20 hover:bg-black/40 rounded-full p-2 hidden md:block"
      >
        <ChevronLeft size={36} strokeWidth={1} />
      </button>
      <button 
        onClick={handleNext}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-[500] text-white hover:text-gray-300 transition-colors cursor-pointer outline-none bg-black/20 hover:bg-black/40 rounded-full p-2 hidden md:block"
      >
        <ChevronRight size={36} strokeWidth={1} />
      </button>

      {/* Main Container */}
      <div className={`relative w-full h-[calc(90vh-64px)] md:h-auto ${currentImage ? 'max-w-5xl' : 'max-w-2xl'} bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300`}>
        
        {/* Close Button */}
        <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[10010] text-gray-500 hover:text-black transition-colors cursor-pointer bg-white/80 hover:bg-white rounded-full p-1 shadow-sm"
        >
            <X size={24} />
        </button>

        <div className="flex flex-col md:flex-row h-full min-h-[400px] md:h-[600px]">
          
          {/* Left Side: Image Gallery */}
          {currentImage && (
            <div className="w-full md:w-1/2 relative bg-gray-50 flex items-center justify-center overflow-hidden border-r border-gray-100 group/gallery">
              {review.images && review.images.length > 1 ? (
                <Swiper
                  key={`review-swiper-${review.id || activeIndex}`}
                  modules={[Navigation, Pagination]}
                  navigation={{
                    nextEl: '.swiper-button-next-custom',
                    prevEl: '.swiper-button-prev-custom',
                  }}
                  pagination={{
                    clickable: true,
                  }}
                  onSlideChange={(swiper) => setCurrentImageIndex(swiper.activeIndex)}
                  className="w-full h-full review-swiper"
                >
                  {review.images.map((img, i) => (
                    <SwiperSlide key={`review-slide-${i}`}>
                      <div className="relative w-full h-full aspect-square md:aspect-auto">
                        {!isLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center z-[5]">
                                <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/loader.gif" alt="Loading..." width={64} height={64} className="object-contain" unoptimized />
                            </div>
                        )}
                        <Image
                          src={getValidSrc(img)}
                          alt={review.personName}
                          fill
                          onLoad={() => setIsLoaded(true)}
                          className={`object-cover transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}
                          unoptimized={true}
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                  
                  {/* Custom Navigation Arrows */}
                  <button className="swiper-button-prev-custom absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-black shadow-lg rounded-full p-2 transition-all opacity-0 group-hover/gallery:opacity-100 hidden md:flex items-center justify-center cursor-pointer">
                    <ChevronLeft size={20} />
                  </button>
                  <button className="swiper-button-next-custom absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-black shadow-lg rounded-full p-2 transition-all opacity-0 group-hover/gallery:opacity-100 hidden md:flex items-center justify-center cursor-pointer">
                    <ChevronRight size={20} />
                  </button>
                  
                  {/* Mobile Image Navigation Arrows */}
                  <button className="swiper-button-prev-custom absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/30 text-white rounded-full p-2 flex md:hidden items-center justify-center cursor-pointer">
                    <ChevronLeft size={18} />
                  </button>
                  <button className="swiper-button-next-custom absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/30 text-white rounded-full p-2 flex md:hidden items-center justify-center cursor-pointer">
                    <ChevronRight size={18} />
                  </button>
                </Swiper>
              ) : (
                <div className="relative w-full h-full aspect-square md:aspect-auto">
                  {!isLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center z-[5]">
                          <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/loader.gif" alt="Loading..." width={64} height={64} className="object-contain" unoptimized />
                      </div>
                  )}
                  <Image
                      src={currentImage}
                      alt={review.personName}
                      fill
                      onLoad={() => setIsLoaded(true)}
                      className={`object-cover transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}
                      priority
                      unoptimized={true}
                  />
                </div>
              )}
            </div>
          )}

          {/* Right Side: Review Content */}
          <div className={`w-full ${currentImage ? 'md:w-1/2' : 'md:w-full'} p-6 md:p-10 flex flex-col bg-white overflow-y-auto custom-scrollbar font-figtree`}>
            
            {/* User Info */}
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#5A413F] text-white flex items-center justify-center font-bold text-2xl uppercase border-4 border-white shadow-md relative overflow-hidden flex-shrink-0">
                  {review.personImage ? (
                      <Image src={getValidSrc(review.personImage)} alt={review.personName} fill className="object-cover" unoptimized={true} />
                  ) : (
                      (review.personName || "C").charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xl leading-tight mb-1 capitalize tracking-wide">{review.personName}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#A8715A] font-bold uppercase">
                      <BadgeCheck size={16} className="fill-[#A8715A] text-white" />
                      Verified Customer
                  </div>
                </div>
              </div>

              {/* Mobile Review Navigation Arrows */}
              <div className="flex md:hidden items-center gap-1">
                <button 
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-black transition-colors shadow-sm"
                  aria-label="Previous review"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-black transition-colors shadow-sm"
                  aria-label="Next review"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Rating & Date */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                        key={`popup-star-${i}`} 
                        size={18} 
                        fill={i < Math.round(review.rating) ? "currentColor" : "none"}
                        className={i < Math.round(review.rating) ? "" : "text-zinc-200"} 
                    />
                    ))}
                </div>
                {review.date && (
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                        {new Date(review.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                )}
            </div>

            {/* Review Text */}
            <div className="mb-8 flex-grow">
              <p className="text-gray-600 leading-relaxed text-lg italic">
                "{review.review}"
              </p>
            </div>

            {/* Product Card */}
            {review.productHandle && (
              <Link prefetch={false} 
                  href={`/products/${review.productHandle}`} 
                  onClick={onClose}
                  className="mt-auto p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between group hover:bg-gray-100 transition-all"
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-1">Reviewed product</span>
                  <h4 className="text-sm font-bold text-black truncate group-hover:text-primary transition-colors">
                    {review.productTitle}
                  </h4>
                </div>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-300 group-hover:bg-black group-hover:text-white transition-all ml-2">
                  <ChevronRight size={16} />
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f9f9f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ddd;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ccc;
        }

        .review-swiper .swiper-pagination-bullet {
          background: white !important;
          opacity: 0.5 !important;
          width: 8px !important;
          height: 8px !important;
          transition: all 0.3s ease !important;
        }
        .review-swiper .swiper-pagination-bullet-active {
          opacity: 1 !important;
          width: 24px !important;
          border-radius: 4px !important;
        }
      `}</style>
    </div>
  );
}
