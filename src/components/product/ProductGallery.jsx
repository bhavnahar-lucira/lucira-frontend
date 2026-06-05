"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import LazyImage from "../common/LazyImage";
import { Play, Copy, X, ChevronLeft, ChevronRight, Maximize2, Share2, ZoomIn, ZoomOut, Eye, BookCopy, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductGallerySkeleton from "./ProductGallerySkeleton";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation, Thumbs } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";

import TryOnButton from "../common/TryOnButton";
import { useMediaQuery } from "@/hooks/useMediaQuery";

function formatCdnUrl(url) {
  if (!url || typeof url !== 'string') return url;
  return url.replace("https://www.lucirajewelry.com", "https://luciraonline.myshopify.com").replace("http://www.lucirajewelry.com", "https://luciraonline.myshopify.com");
}

export default function ProductGallery({ media = [], title = "", activeColor = "", onViewSimilar, hasSimilar = false, product, activeVariant }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [mounted, setMounted] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  

  const displayLabels = useMemo(() => {
    const labels = [];
    if (product.label) labels.push(product.label);
    
    const tags = Array.isArray(product.tags) ? product.tags : [];
    const lowerTags = tags.map(t => String(t).toLowerCase());
    
    // Priority order: Fast Shipping > Best Seller > New Arrival > Trending
    if (lowerTags.some(t => t.includes("fast shipping") || t.includes("fastshipping"))) labels.push("Fast Shipping");
    if (lowerTags.some(t => t.includes("best seller") || t.includes("bestseller"))) labels.push("Best Seller");
    if (lowerTags.some(t => t.includes("new arrival") || t === "new" || t.includes("newarrival"))) labels.push("New Arrival");
    if (lowerTags.some(t => t.includes("trending"))) labels.push("Trending");
    
    return [...new Set(labels)].slice(0, 2);
  }, [product.label, product.tags]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeVariant?.id, activeVariant?.shopifyId, activeColor]);

  const sortedMedia = useMemo(() => {
    if (!media || media.length === 0) return [];

    const COLOR_TOKENS = ["white", "yellow", "rose", "plt", "platinum"];
    const ALWAYS_SHOW_CODES = ["mv", "mq-ai", "mq", "mh-ai", "mh", "ci-ai", "ci", "360v", "360°"];

    const formattedMedia = media.map(m => {
      const newM = { ...m };
      if (newM.url) newM.url = formatCdnUrl(newM.url);
      if (newM.preview) newM.preview = formatCdnUrl(newM.preview);
      if (newM.previewImage?.url) {
        newM.previewImage = { ...newM.previewImage, url: formatCdnUrl(newM.previewImage.url) };
      }
      if (newM.sources) {
        newM.sources = newM.sources.map(s => ({ ...s, url: formatCdnUrl(s.url) }));
      }
      return newM;
    });

    const getColorFromAlt = (text) => {
      const lower = (text || "").toLowerCase();
      const match = lower.match(/(yellow|white|rose|plt|platinum)[\s-]?(yellow|white|rose|plt|platinum)?/);
      if (match && match[1]) {
        const firstColor = match[1];
        if (firstColor === "platinum") return "plt";
        return firstColor;
      }
      return "";
    };

    const targetColor = getColorFromAlt(activeColor) || (activeColor.toLowerCase().includes("plt") ? "plt" : activeColor.toLowerCase());

    const buckets = {
      color: [],
      codes: { mv: [], "mq-ai": [], mq: [], "mh-ai": [], mh: [], "ci-ai": [], ci: [], v360: [] },
      cert: [],
      extras: []
    };

    formattedMedia.forEach(item => {
      const alt = (item.alt || "").toLowerCase();
      const itemColor = getColorFromAlt(alt);
      const isAnyColor = COLOR_TOKENS.some(c => alt.includes(c));

      if (alt.includes("cert")) {
        buckets.cert.push(item);
        return;
      }

      const isCodeMatch = ALWAYS_SHOW_CODES.some(code => alt.includes(code));
      
      if (itemColor === targetColor || (!isAnyColor && isCodeMatch)) {
        if (alt.includes("mv")) buckets.codes.mv.push(item);
        else if (alt.includes("mq-ai")) buckets.codes["mq-ai"].push(item);
        else if (alt.includes("mq")) buckets.codes.mq.push(item);
        else if (alt.includes("mh-ai")) buckets.codes["mh-ai"].push(item);
        else if (alt.includes("mh")) buckets.codes.mh.push(item);
        else if (alt.includes("ci-ai")) buckets.codes["ci-ai"].push(item);
        else if (alt.includes("ci")) buckets.codes.ci.push(item);
        else if (alt.includes("360v") || alt.includes("360°")) buckets.codes.v360.push(item);
        else if (itemColor === targetColor) buckets.color.push(item);
        else buckets.extras.push(item);
      } else if (itemColor === "" && !isAnyColor) {
         // Fallback for items with no color tokens at all
         buckets.extras.push(item);
      }
    });

    // Prioritize Shopify variant image if it exists in color bucket
    if (activeVariant?.image) {
      const getCompareUrl = (url) => formatCdnUrl(url).split('?')[0].split('&')[0];
      const variantImgUrl = getCompareUrl(activeVariant.image);
      const idx = buckets.color.findIndex(m => {
        const mUrl = m.url || m.previewImage?.url;
        return mUrl && getCompareUrl(mUrl) === variantImgUrl;
      });
      if (idx !== -1) {
        const vImg = buckets.color.splice(idx, 1)[0];
        buckets.color.unshift(vImg);
      }
    }

    const takeColor = () => buckets.color.shift() || null;
    const takeCode = () => {
      for (const key of ["mv", "mq-ai", "mq", "mh-ai", "mh", "ci-ai", "ci", "360v"]) {
        const k = key === "360v" ? "v360" : key;
        if (buckets.codes[k]?.length) return buckets.codes[k].shift();
      }
      return null;
    };

    const slotPattern = [
      "color", "code", "code",
      "color", "color", "code", "code",
      "color", "color", "code", "code",
      "color"
    ];

    const result = [];

    for (const slot of slotPattern) {
      let node = slot === "color" ? takeColor() : takeCode();
      if (node) result.push(node);
    }

    // Append remaining
    Object.values(buckets.codes).forEach(arr => {
      arr.forEach(node => { if (!result.includes(node)) result.push(node); });
    });

    buckets.color.forEach(node => {
      if (!result.includes(node)) result.push(node);
    });

    buckets.extras.forEach(node => {
      if (!result.includes(node)) result.push(node);
    });

    buckets.cert.forEach(node => {
      if (!result.includes(node)) result.push(node);
    });

    if (result.length === 0 && formattedMedia.length > 0) return [formattedMedia[0]];

    return result;
  }, [media, activeColor, activeVariant]);

  useEffect(() => {
    if (sortedMedia.length > 0) {
      console.log(`[Gallery Debug] Active Color: ${activeColor}`);
      console.log(`[Gallery Debug] Sorted Media Alt Texts:`, sortedMedia.map(m => m.alt || "NO ALT"));
    }
  }, [sortedMedia, activeColor]);

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setIsLightboxOpen(true);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % sortedMedia.length);
    setZoomLevel(1);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + sortedMedia.length) % sortedMedia.length);
    setZoomLevel(1);
  };

  const toggleZoom = () => {
    setZoomLevel((prev) => (prev === 1 ? 2 : 1));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: title,
      text: `Check out this ${title}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(window.location.href);
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return;
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, currentIndex]);

  if (!sortedMedia.length) {
    return <ProductGallerySkeleton />;
  }

  return (
    <>
      {/* Desktop Gallery */}
      <div className="hidden lg:grid grid-cols-2 gap-4 sticky top-20">
        {sortedMedia.map((item, index) => {
          const isVideo = item.mediaContentType === "VIDEO" || item.mediaContentType === "EXTERNAL_VIDEO" || item.type === "VIDEO" || item.type === "EXTERNAL_VIDEO";
          const isFirst = index === 0;

          return (
            <div 
              key={`${item.url}-${index}`}
              onClick={() => openLightbox(index)}
              className={`relative aspect-square rounded-lg overflow-hidden bg-[#F7F7F7] cursor-zoom-in group ${isFirst ? "col-span-1" : ""}`}
            >
              {isVideo ? (
                <video 
                  poster={item.previewImage?.url || item.preview || null}
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  controlsList="nodownload"
                  onContextMenu={(e) => e.preventDefault()}
                  disablePictureInPicture
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                >
                  {item.sources && item.sources.length > 0 ? (
                    <>
                      {item.sources.filter(s => s.format === 'mp4').map((source, sIdx) => (
                        <source key={sIdx} src={source.url} type={source.mimeType} />
                      ))}
                      {item.sources.filter(s => s.format !== 'mp4').map((source, sIdx) => (
                        <source key={sIdx} src={source.url} type={source.mimeType} />
                      ))}
                    </>
                  ) : (
                    <source src={item.url || null} type={item.mimeType || "video/mp4"} />
                  )}
                </video>
              ) : (
                <LazyImage 
                  src={item.url || "/images/product/1.jpg"} 
                  alt={item.alt || title} 
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              )}
              
              {isFirst && (
                <>
                  <div className="absolute top-4 left-4 flex flex-row gap-2 z-10">
                    {displayLabels.map((label, index) => (
                      <span key={index} className="bg-[#F1E4D1] px-3 py-1.5 text-[10px] font-semibold uppercase w-fit">{label}</span>
                    ))}
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    {mounted && isDesktop && (
                      <TryOnButton 
                        sku={activeVariant?.sku || product?.variants?.[0]?.sku}
                        productTitle={product?.title}
                        isAvailable={activeVariant ? activeVariant.inStock : product?.available}
                        id="tryonbutton-desktop"
                        className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-gray-100 hover:bg-gray-50 btn-peek-animation px-2.5 py-2.5 z-30"
                      />
                    )}
                  </div>
                </>
              )}

              {isVideo && (
                <div className="absolute bottom-4 left-4 bg-white/90 p-2 rounded-full">
                  <Play size={14} fill="black" />
                </div>
              )}

              {((index === 1) || (index === 0 && sortedMedia.length === 1)) && hasSimilar && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewSimilar();
                  }}
                  className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-gray-100 hover:bg-gray-50 z-10 btn-peek-animation px-2.5 py-2.5"
                >
                  <span className="w-[24px] h-[24px] shrink-0 flex items-center justify-center">
                    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <path d="M11.4322 10.4118C11.4293 10.2235 11.5012 10.0417 11.6321 9.90627C11.763 9.77087 11.9422 9.69288 12.1305 9.6894L21.4657 9.52505C21.6544 9.5214 21.8368 9.59284 21.9728 9.72366C22.1088 9.85448 22.1872 10.034 22.1909 10.2226L22.4232 23.5881C22.4262 23.7767 22.3542 23.9588 22.223 24.0943C22.0917 24.2299 21.9121 24.3078 21.7234 24.3109L12.3883 24.4752C12.1998 24.4785 12.0177 24.4068 11.882 24.2759C11.7463 24.1451 11.668 23.9657 11.6645 23.7772L11.4322 10.4118Z" stroke="currentColor" strokeWidth="1.17241" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M11.5349 11.5293L6.05123 12.9986C5.89057 13.0417 5.75356 13.1468 5.67029 13.2908C5.58702 13.4348 5.56428 13.606 5.60707 13.7667L8.65801 25.1594C8.70135 25.3201 8.80674 25.457 8.95101 25.5401C9.09527 25.6231 9.26661 25.6455 9.42735 25.6022L13.8263 24.4235" stroke="currentColor" strokeWidth="1.17241" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22.4632 11.5293L27.9468 12.9986C28.1075 13.0417 28.2445 13.1468 28.3278 13.2908C28.411 13.4348 28.4338 13.606 28.391 13.7667L25.34 25.1594C25.2967 25.3201 25.1913 25.457 25.047 25.5401C24.9028 25.6231 24.7314 25.6455 24.5707 25.6022L19.8192 24.3291" stroke="currentColor" strokeWidth="1.17241" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span className="btn-text text-xs font-bold uppercase tracking-wider">Similar Items</span>
                </button>
              )}
              {index === 1 && product.tags?.includes("Only Pendant") && (
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-gray-100 px-2.5 py-2.5 z-10 btn-peek-animation">
                  <span className="w-[24px] h-[24px] shrink-0 flex items-center justify-center">
                    <Info size={16} />
                  </span>
                  <span className="btn-text text-xs font-bold uppercase tracking-wider">Chain is not included in the purchase</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Gallery */}
      <div className="lg:hidden flex flex-col gap-3">
        <div className="relative aspect-square rounded-xl overflow-hidden bg-[#F7F7F7]">
          <Swiper
            spaceBetween={0}
            thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
            modules={[FreeMode, Thumbs]}
            onSlideChange={(swiper) => setCurrentIndex(swiper.activeIndex)}
            className="w-full h-full"
          >
            {sortedMedia.map((item, index) => {
              const isVideo = item.type === "VIDEO" || item.type === "EXTERNAL_VIDEO";
              return (
                <SwiperSlide key={index} onClick={() => openLightbox(index)}>
                  <div className="w-full h-full relative">
                    {isVideo ? (
                      <video 
                        poster={item.preview || null}
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                        className="w-full h-full object-cover"
                      >
                         {item.sources && item.sources.length > 0 ? (
                            <>
                              {item.sources.filter(s => s.format === 'mp4').map((source, sIdx) => (
                                <source key={sIdx} src={source.url} type={source.mimeType} />
                              ))}
                            </>
                          ) : (
                            <source src={item.url || null} type={item.mimeType || "video/mp4"} />
                          )}
                      </video>
                    ) : (
                      <LazyImage 
                        src={item.url || "/images/product/1.jpg"} 
                        alt={item.alt || title} 
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Badges Overlay */}
          <div className="absolute top-4 left-2 flex flex-row gap-2 z-10 pointer-events-none">
            {displayLabels.map((label, index) => (
              <span key={index} className="bg-[#F1E4D1] text-black px-3 py-1.5 text-[10px] font-semibold uppercase w-fit">{label}</span>
            ))}
          </div>
          {product.tags?.includes("Only Pendant") && (
            <div className="absolute top-4 right-2 bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-gray-100 px-2.5 py-2.5 z-10 btn-peek-animation">
              <span className="w-[24px] h-[24px] shrink-0 flex items-center justify-center">
                <Info size={16} />
              </span>
              <span className="btn-text text-xs font-bold uppercase tracking-wider">Chain is not included in the purchase</span>
            </div>
          )}

          {/* Action Buttons Overlay */}
          <div className="absolute bottom-4 left-2 right-2 flex justify-between items-center z-10">
             <div onClick={(e) => e.stopPropagation()} className="data-no-swiping">
               {mounted && !isDesktop && (
                 <TryOnButton 
                   sku={activeVariant?.sku || product?.variants?.[0]?.sku}
                   productTitle={product?.title}
                   isAvailable={activeVariant ? activeVariant.inStock : product?.available}
                   id="tryonbutton-mobile"
                   className="bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-gray-100 hover:bg-gray-50 btn-peek-animation px-2.5 py-2.5 z-30"
                 />
               )}
             </div>
             {hasSimilar && (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onViewSimilar();
                }}
                className="bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-gray-100 hover:bg-gray-50 z-10 btn-peek-animation px-2.5 py-2.5"
              >
                <span className="w-[24px] h-[24px] shrink-0 flex items-center justify-center pointer-events-none">
                  <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path d="M11.4322 10.4118C11.4293 10.2235 11.5012 10.0417 11.6321 9.90627C11.763 9.77087 11.9422 9.69288 12.1305 9.6894L21.4657 9.52505C21.6544 9.5214 21.8368 9.59284 21.9728 9.72366C22.1088 9.85448 22.1872 10.034 22.1909 10.2226L22.4232 23.5881C22.4262 23.7767 22.3542 23.9588 22.223 24.0943C22.0917 24.2299 21.9121 24.3078 21.7234 24.3109L12.3883 24.4752C12.1998 24.4785 12.0177 24.4068 11.882 24.2759C11.7463 24.1451 11.668 23.9657 11.6645 23.7772L11.4322 10.4118Z" stroke="currentColor" strokeWidth="1.17241" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11.5349 11.5293L6.05123 12.9986C5.89057 13.0417 5.75356 13.1468 5.67029 13.2908C5.58702 13.4348 5.56428 13.606 5.60707 13.7667L8.65801 25.1594C8.70135 25.3201 8.80674 25.457 8.95101 25.5401C9.09527 25.6231 9.26661 25.6455 9.42735 25.6022L13.8263 24.4235" stroke="currentColor" strokeWidth="1.17241" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22.4632 11.5293L27.9468 12.9986C28.1075 13.0417 28.2445 13.1468 28.3278 13.2908C28.411 13.4348 28.4338 13.606 28.391 13.7667L25.34 25.1594C25.2967 25.3201 25.1913 25.457 25.047 25.5401C24.9028 25.6231 24.7314 25.6455 24.5707 25.6022L19.8192 24.3291" stroke="currentColor" strokeWidth="1.17241" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className="btn-text text-xs font-bold uppercase tracking-wider">Similar Items</span>
              </button>
              )}
          </div>
        </div>

        {/* Thumbnail Slider */}
        <Swiper
          onSwiper={setThumbsSwiper}
          spaceBetween={10}
          slidesPerView="auto"
          freeMode={true}
          watchSlidesProgress={true}
          modules={[FreeMode, Thumbs]}
          className="w-full thumbnails-swiper"
        >
          {sortedMedia.map((item, index) => {
             const isVideo = item.type === "VIDEO" || item.type === "EXTERNAL_VIDEO";
             return (
               <SwiperSlide key={index} className="!w-[70px]">
                 <div className={`aspect-square relative rounded-lg overflow-hidden bg-[#F7F7F7] border-2 transition-colors ${currentIndex === index ? 'border-black' : 'border-transparent'}`}>
                    {isVideo ? (
                      <div className="w-full h-full relative">
                        <LazyImage src={item.preview || item.url} alt={item.alt} fill className="object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play size={12} fill="black" className="opacity-70" />
                        </div>
                      </div>
                    ) : (
                      <LazyImage src={item.url} alt={item.alt} fill className="object-cover" />
                    )}
                 </div>
               </SwiperSlide>
             );
          })}
        </Swiper>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/95 flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-8 py-6 text-white z-[2001] static md:absolute w-full">
              <div className="text-xl font-medium tracking-wider">
                {currentIndex + 1} / {sortedMedia.length}
              </div>
              <div className="flex items-center gap-8">
                <button 
                  onClick={toggleFullscreen}
                  className="hover:text-gray-300 transition-colors p-1"
                >
                  <Maximize2 size={24} />
                </button>
                <button 
                  onClick={handleShare}
                  className="hover:text-gray-300 transition-colors p-1"
                >
                  <Share2 size={24} />
                </button>
                <button 
                  onClick={toggleZoom}
                  className="hover:text-gray-300 transition-colors p-1"
                >
                  {zoomLevel === 1 ? <ZoomIn size={24} /> : <ZoomOut size={24} />}
                </button>
                <button 
                  onClick={() => setIsLightboxOpen(false)}
                  className="hover:text-gray-300 transition-colors p-1"
                >
                  <X size={36} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden px-4 md:px-24">
              <button 
                onClick={prevSlide}
                className="absolute left-4 md:left-8 z-[2001] bg-black/20 hover:bg-black/40 border border-white/10 p-3 rounded-full text-white transition-all backdrop-blur-sm"
              >
                <ChevronLeft size={24} strokeWidth={2.5} />
              </button>
              
                  <div className="w-full h-full flex items-center justify-center">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: zoomLevel, cursor: zoomLevel > 1 ? "grab" : "grab", }}
                  transition={{ type: "spring", damping: 30, stiffness: 300, }}
                  drag
                  dragDirectionLock
                  dragConstraints={
                    zoomLevel > 1
                      ? { left: -300, right: 300, top: -300, bottom: 300, }
                      : { left: 0, right: 0, }
                  }
                  dragElastic={zoomLevel > 1 ? 0.08 : 0.18}
                  whileDrag={{ cursor: "grabbing", }}
                  onDragEnd={(e, info) => {
                    if (zoomLevel > 1) return;
                    const offsetX = info.offset.x;
                    const velocityX = info.velocity.x;
                    const swipe = Math.abs(offsetX) * velocityX;
                    if (swipe < -8000) {
                      nextSlide();
                    }
                    else if (swipe > 8000) {
                      prevSlide();
                    }
                  }}
                  onClick={() => {
                    if (zoomLevel === 1) {
                      setZoomLevel(2);
                    } else {
                      setZoomLevel(1);
                    }
                  }}
                  className="relative w-full h-full flex items-center justify-center max-w-[85vh] mx-auto select-none touch-pan-y"
                >
                  {sortedMedia[currentIndex].type === "VIDEO" ||
                  sortedMedia[currentIndex].type === "EXTERNAL_VIDEO" ? (
                    <video
                      src={sortedMedia[currentIndex].url || null}
                      controls
                      autoPlay
                      className="max-w-full max-h-full object-contain shadow-2xl"
                    />
                  ) : (
                    <LazyImage
                      src={sortedMedia[currentIndex].url || "/images/product/1.jpg"}
                      alt={sortedMedia[currentIndex].alt || title}
                      fill
                      draggable={false}
                      className="object-contain shadow-2xl pointer-events-none"
                    />
                  )}
                </motion.div>
              </div>

              <button 
                onClick={nextSlide}
                className="absolute right-4 md:right-8 z-[2001] bg-black/20 hover:bg-black/40 border border-white/10 p-3 rounded-full text-white transition-all backdrop-blur-sm"
              >
                <ChevronRight size={24} strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
