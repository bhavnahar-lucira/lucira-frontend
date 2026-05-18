"use client";

import { useState } from "react"; // Added for play/pause state
import { X, ChevronLeft, ChevronRight, Play, Send, MessageCircle, Headset } from "lucide-react";
import LazyImage from "../common/LazyImage";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import Link from "next/link";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function VideoPopup({ isOpen, onClose, videoData, initialIndex }) {
  const isMobile = useMediaQuery("(max-width: 768px)");

    
  // 1. Manage play state to toggle UI overlays and native video controls
  const [isPlaying, setIsPlaying] = useState(true);

  if (!isOpen) return null;

  // 2. Centralized Product Logger
  const logProductClick = (product) => {
    console.log("Product Interaction Tracked:", {
      title: product.title,
      price: product.price,
      timestamp: new Date().toISOString()
    });
  };

  // 3. Play/Pause Toggle Logic
  const togglePlay = (videoElement) => {
    if (videoElement.paused) {
      videoElement.play();
      setIsPlaying(true);
    } else {
      videoElement.pause();
      setIsPlaying(false);
    }
  };

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[500] bg-black flex flex-col outline-none overflow-hidden">
          <Swiper
            direction="vertical"
            modules={[Pagination]}
            pagination={{
              type: 'fraction',
              el: '.custom-pagination',
            }}
            initialSlide={initialIndex}
            loop={true}
            slidesPerView={1}
            className="w-full h-full"
            onSlideChange={(swiper) => {
                const allVideos = swiper.el.querySelectorAll("video");
                allVideos.forEach((v) => v.pause());
                setIsPlaying(true);
                const activeSlide = swiper.slides[swiper.activeIndex];
                const activeVideo = activeSlide.querySelector("video");
                if (activeVideo) {
                    activeVideo.currentTime = 0;
                    activeVideo.play().catch(() => {});
                }
            }}
          >
            {videoData.map((item, idx) => (
              <SwiperSlide key={`popup-mob-${idx}`}>
                <div className="relative w-full h-full bg-black">
                   {/* Full Screen Video */}
                   <video
                     src={item.video}
                     autoPlay
                     muted
                     loop
                     playsInline
                     className="w-full h-full object-cover"
                     // Condition: Show native options only when playing
                     controls={isPlaying} 
                     onClick={(e) => togglePlay(e.currentTarget)}

                   />

                   {/* UI OVERLAYS */}
                   
                   {/* 1. Close Button */}
                   <button 
                     onClick={onClose}
                     className="absolute top-12 right-6 z-[520] w-10 h-10 bg-black/20 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/20 active:scale-90 transition-all shadow-lg"
                   >
                     <X size={24} strokeWidth={2} />
                   </button>

                  {/* Play Indicator - only shows when paused */}
                   {!isPlaying && (
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[515]">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                           <Play size={28} fill="white" className="text-white ml-1" />
                        </div>
                     </div>
                   )}


                   {/* 2. Swipe Up Indicator (Left Side) */}
                   <div className="absolute left-6 top-1/2 -translate-y-1/2 z-[510] flex flex-col items-center gap-3 pointer-events-none">
                      <div className="h-28 w-[1.5px] bg-white/20 relative overflow-hidden rounded-full">
                         <div className="absolute top-0 left-0 w-full h-8 bg-white rounded-full animate-swipe-up" />
                      </div>
                      <span className="text-[9px] font-bold text-white/50 uppercase tracking-[0.4em] vertical-text">
                         Swipe Up
                      </span>
                   </div>

                   {/* 4. Bottom Product Scroll */}
                   <div className="absolute bottom-14 left-0 w-full z-[510]">
                      <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-4">
                         {item.products.map((product, pIdx) => (
                           <Link href={product.url} key={pIdx} className="min-w-[85vw] bg-white rounded-[20px] p-4 flex gap-4 shadow-2xl relative items-center">
                              <div className="w-18 h-18 bg-zinc-50 rounded-xl overflow-hidden shrink-0 relative border border-zinc-100">
                                 <LazyImage src={product.image} alt={product.title} fill className="object-cover" />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                 <h4 className="text-[13px] font-bold text-zinc-800 leading-tight mb-1 line-clamp-1">{product.title}</h4>
                                 <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[15px] font-black text-zinc-900">{product.price}</span>
                                    <span className="text-[11px] text-zinc-400 line-through">{product.originalPrice}</span>
                                 </div>
                                 <div>
                                    <span className="text-[10px] font-bold bg-[#F5F5F5] text-zinc-600 px-3 py-1 rounded-full uppercase">
                                       {product.discount}
                                    </span>
                                 </div>
                              </div>
                           </Link>
                         ))}
                      </div>
                      
                      {/* Pagination indicator */}
                      <div className="custom-pagination text-center text-[11px] font-medium text-white/30 tracking-widest mt-2" />
                   </div>

                   {/* Dark Gradient Overlay */}
                   <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <style jsx>{`
            .vertical-text {
               writing-mode: vertical-lr;
               transform: rotate(180deg);
            }
            @keyframes swipe-up {
               0% { transform: translateY(100%); }
               100% { transform: translateY(-100%); }
            }
            .animate-swipe-up {
               animation: swipe-up 2s infinite linear;
            }
          `}</style>
      </div>
    );
  }


  // Desktop remains the same
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-10">
      <div className="relative w-full max-w-5xl">
        <button className="popup-prev absolute -left-12 md:-left-20 top-1/2 -translate-y-1/2 z-[110] text-white hover:text-gray-300 transition-colors cursor-pointer outline-none">
          <ChevronLeft size={56} strokeWidth={1} />
        </button>
        <button className="popup-next absolute -right-12 md:-right-20 top-1/2 -translate-y-1/2 z-[110] text-white hover:text-gray-300 transition-colors cursor-pointer outline-none">
          <ChevronRight size={56} strokeWidth={1} />
        </button>

        <Swiper
          modules={[Navigation]}
          navigation={{
            prevEl: ".popup-prev",
            nextEl: ".popup-next",
          }}
          initialSlide={initialIndex}
          loop={true}
          slidesPerView={1}
          className="w-full bg-white rounded-md shadow-2xl overflow-hidden"
          onSlideChange={(swiper) => {
            const allVideos = swiper.el.querySelectorAll("video");
            allVideos.forEach((v) => v.pause());
            setIsPlaying(true);
            const activeSlide = swiper.slides[swiper.activeIndex];
            const activeVideo = activeSlide.querySelector("video");
            if (activeVideo) {
              activeVideo.currentTime = 0;
              activeVideo.play().catch(() => {});
            }
          }}
        >
          {videoData.map((item, idx) => (
            <SwiperSlide key={`popup-${idx}`}>
              <div className="flex flex-col md:flex-row min-h-[500px] md:h-[600px]">
                <div className="w-full md:w-[42%] relative bg-black flex items-center justify-center group">
                  <video
                    src={item.video}
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                    controls={isPlaying}
                    onClick={(e) => {
                       togglePlay(e.currentTarget);
                    }}
                  />
                   {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300">
                       <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-lg">
                          <Play size={28} fill="white" className="text-white ml-1" />
                       </div>
                    </div>
                  )}
                </div>

                <div className="w-full md:w-[58%] p-6 md:p-12 bg-white relative flex flex-col h-full">
                  <button
                      onClick={onClose}
                      className="absolute top-6 right-6 z-[120] text-gray-400 hover:text-black transition-colors cursor-pointer p-1"
                  >
                      <X size={28} />
                  </button>

                  <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-8 mt-4 md:mt-0">
                        {item.products && item.products.map((product, pIdx) => (
                        <Link href={product.url} key={pIdx} className="flex items-center gap-6 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                            <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 relative">
                            <LazyImage src={product.image} alt={product.title} fill className="object-cover" />
                            </div>
                            <div className="flex-grow min-w-0">
                            <h3 className="text-sm md:text-base font-bold text-gray-800 leading-snug mb-2 pr-4">
                                {product.title}
                            </h3>
                            <div className="flex items-center gap-3">
                                <span className="text-base md:text-lg font-extrabold text-gray-900">{product.price}</span>
                                {product.originalPrice && <span className="text-sm text-gray-400 line-through font-medium">{product.originalPrice}</span>}
                                {product.discount && <span className="text-[10px] md:text-xs font-bold bg-[#F5E6E4] text-[#8B4513] px-2 py-1 rounded tracking-wide uppercase">{product.discount}</span>}
                            </div>
                            </div>
                        </Link>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #fff;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #888;
        }
      `}</style>
    </div>
  );
}
