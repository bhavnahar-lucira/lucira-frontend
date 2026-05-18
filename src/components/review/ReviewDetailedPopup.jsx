"use client";

import { X, ChevronLeft, ChevronRight, Star, BadgeCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// Helper to ensure image src is a valid string URL
const getValidSrc = (src, fallback = "/images/product/1.jpg") => {
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
    : (review.personImage || "/images/review/1.jpg");
    
  const currentImage = getValidSrc(currentImageRaw);

  return (
    <div className="fixed inset-0 z-[499] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-10 transition-all duration-300">
      
      {/* Navigation */}
      <button 
        onClick={handlePrev}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-[500] text-white hover:text-gray-300 transition-colors cursor-pointer outline-none bg-black/20 hover:bg-black/40 rounded-full p-2"
      >
        <ChevronLeft size={36} strokeWidth={1} />
      </button>
      <button 
        onClick={handleNext}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-[500] text-white hover:text-gray-300 transition-colors cursor-pointer outline-none bg-black/20 hover:bg-black/40 rounded-full p-2"
      >
        <ChevronRight size={36} strokeWidth={1} />
      </button>

      {/* Main Container */}
      <div className="relative w-full h-[calc(90vh-64px)] md:h-auto max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Close Button */}
        <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[10010] text-gray-500 hover:text-black transition-colors cursor-pointer bg-white/80 hover:bg-white rounded-full p-1 shadow-sm"
        >
            <X size={24} />
        </button>

        <div className="flex flex-col md:flex-row h-full min-h-[400px] md:h-[600px]">
          
          {/* Left Side: Image Gallery */}
          <div className="w-full md:w-1/2 relative bg-gray-50 flex items-center justify-center overflow-hidden border-r border-gray-100">
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center z-[5]">
                    <Image src="/images/loader.gif" alt="Loading..." width={64} height={64} className="object-contain" unoptimized />
                </div>
            )}
            <div className="relative w-full h-full aspect-square md:aspect-auto">
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

            {/* Multiple Images Dots */}
            {review.images && review.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {review.images.map((_, i) => (
                        <button 
                            key={`popup-dot-${i}`} 
                            onClick={() => { setCurrentImageIndex(i); setIsLoaded(false); }}
                            className={`w-2 h-2 rounded-full transition-all ${currentImageIndex === i ? "bg-white w-6" : "bg-white/50"}`}
                        />
                    ))}
                </div>
            )}
          </div>

          {/* Right Side: Review Content */}
          <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col bg-white overflow-y-auto custom-scrollbar font-figtree">
            
            {/* User Info */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-[#5A413F] text-white flex items-center justify-center font-bold text-2xl uppercase border-4 border-white shadow-md relative overflow-hidden flex-shrink-0">
                {review.personImage ? (
                    <Image src={getValidSrc(review.personImage)} alt={review.personName} fill className="object-cover" unoptimized={true} />
                ) : (
                    (review.personName || "C").charAt(0)
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-xl leading-tight mb-1 capitalize tracking-widest">{review.personName}</h3>
                <div className="flex items-center gap-1.5 text-xs text-[#A8715A] font-bold uppercase tracking-wide">
                    <BadgeCheck size={16} className="fill-[#A8715A] text-white" />
                    Verified Customer
                </div>
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
              <Link 
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
      `}</style>
    </div>
  );
}
