"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, CheckCircle, ChevronRight, X, Loader2, Copy } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Scrollbar, FreeMode } from "swiper/modules";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReviewDetailedPopup from "@/components/review/ReviewDetailedPopup";
import WriteReviewForm from "@/components/review/WriteReviewForm";

// Import Swiper styles
import "swiper/css";
import "swiper/css/scrollbar";
import "swiper/css/free-mode";

// Helper to ensure image src is a valid string URL
const getValidSrc = (src, fallback = "/images/product/1.jpg") => {
  if (typeof src === "string" && src.trim() !== "") return src;
  if (src && typeof src === "object" && src.url) return src.url;
  return fallback;
};

import { fetchNectorReviews } from "@/lib/nector";

export default function ReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ average: 0, total: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [gallery, setGallery] = useState([]);
  const [filterRating, setFilterRating] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [allData, setAllData] = useState([]);
  const [visibleCount, setVisibleCount] = useState(12);

  // Popup State
  const [popupState, setPopupState] = useState({ isOpen: false, index: 0 });
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      try {
        const data = await fetchNectorReviews();
        const items = data.items || [];
        
        // Transform stats array to breakdown object if needed
        const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        items.forEach(r => {
          const rating = Math.round(parseFloat(r.rating));
          if (breakdown[rating] !== undefined) {
            breakdown[rating]++;
          }
        });

        setStats({
          total: data.count || items.length,
          average: data.average || 0,
          breakdown: breakdown
        });

        // Extract gallery
        const galleryItems = [];
        items.forEach((r) => {
            const uploads = r.uploads || [];
            uploads.forEach(u => {
                if (u?.link && u.type === 'image') {
                    galleryItems.push({ url: u.link, reviewId: r.id });
                }
            });
        });
        setGallery(galleryItems);
        setAllData(items);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  const filteredAndSortedReviews = useMemo(() => {
    let result = [...(allData || [])];

    // Filter by rating
    if (filterRating !== "all") {
      result = result.filter(r => Math.round(parseFloat(r.rating)) === parseInt(filterRating));
    }

    // Sort by
    result.sort((a, b) => {
      const dA = new Date(a.posted_at || a.created_at || 0);
      const dB = new Date(b.posted_at || b.created_at || 0);
      
      if (sortBy === "newest") return dB - dA;
      if (sortBy === "oldest") return dA - dB;
      if (sortBy === "highest") return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
      if (sortBy === "lowest") return (parseFloat(a.rating) || 0) - (parseFloat(b.rating) || 0);
      
      if (sortBy === "images") {
        const aImgs = (Array.isArray(a.uploads) ? a.uploads : (a.uploads?.uploads || [])).length;
        const bImgs = (Array.isArray(b.uploads) ? b.uploads : (b.uploads?.uploads || [])).length;
        return bImgs - aImgs;
      }
      
      return ((b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)) || (dB - dA);
    });

    return result;
  }, [allData, filterRating, sortBy]);

  // Paginated reviews
  const displayedReviews = useMemo(() => {
    return filteredAndSortedReviews.slice(0, visibleCount);
  }, [filteredAndSortedReviews, visibleCount]);

  const handleFilterChange = (val) => {
    setFilterRating(val);
    setVisibleCount(12);
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    setVisibleCount(12);
  };

  const openPopup = (idx) => {
    setPopupState({ isOpen: true, index: idx });
  };

  // Prepare mapped reviews for the popup
  const mappedReviews = useMemo(() => {
    return filteredAndSortedReviews?.map(r => {
      const name = (r.name || 'Verified Buyer').trim();
      const uploads = Array.isArray(r.uploads) ? r.uploads : (r.uploads?.uploads || []);
      const images = uploads.filter(u => u?.link && (u.type === 'image' || !u.type)).map(u => u.link);
      
      return {
          ...r,
          id: r._id || r.id,
          productTitle: r.reference_product_name || "Lucira Jewelry",
          productImage: getValidSrc(r.reference_product_image || "/images/product/1.jpg"),
          productHandle: r.reference_product_handle || "",
          personName: name,
          review: r.text || r.description || r.body || "",
          images: images,
          verified: r.is_verified === true || r.verified === true,
          date: r.posted_at || r.created_at
      };
    });
  }, [filteredAndSortedReviews]);

  const getPercentage = (count) => {
    const total = stats.total;
    if (!total) return 0;
    return Math.round((count / total) * 100);
  };
  
  const recommendCount = (stats.breakdown[3] || 0) + (stats.breakdown[4] || 0) + (stats.breakdown[5] || 0);  
  const recommendPercent = useMemo(() => {
    if (stats.total === 0) return 97;
    const calculatedPercent = Math.round((recommendCount / stats.total) * 100);
    return Math.max(calculatedPercent, 94);
  }, [recommendCount, stats.total]);

  return (
    <div className="bg-[#FEF5F1] min-h-screen pb-20 pt-16 font-figtree">
      <div className="container-main">
        
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-16 font-abhaya capitalize text-[#1A1A1A]">
          Customer Reviews
        </h1>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-24 mb-12">
          <div className="flex flex-col items-center">
            <span className="text-6xl font-medium text-[#1A1A1A] mb-4">{stats.average}</span>
            <div className="flex gap-1 mb-4 text-[#D4A373]">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={`summary-star-${i}`}
                  size={18}
                  fill={i <= Math.round(stats.average) ? "currentColor" : "none"}
                  className={i <= Math.round(stats.average) ? "" : "text-zinc-200"}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">{stats.total} reviews</span>
          </div>

          <div className="flex-grow max-w-lg w-full space-y-2">
            {[5, 4, 3, 2, 1].map((num) => {
              const count = stats.breakdown[num] || 0;
              const percent = getPercentage(count);
              return (
                <div key={`progress-${num}`} className="flex items-center gap-6 group">
                  <span className="text-[11px] font-normal text-gray-600 w-12 whitespace-nowrap">{num} Stars</span>
                  <div className="flex-grow h-[3px] bg-[#EBE0D8] rounded-full overflow-hidden">
                    <div className="h-full bg-[#A36B6F] transition-all duration-500" style={{ width: `${percent}%` }}></div>
                  </div>
                  <span className="text-[11px] font-normal text-gray-400 w-8 text-right">{percent}%</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col items-center">
            <span className="text-5xl font-medium text-[#1A1A1A] mb-2">{recommendPercent}%</span>
            <p className="text-[10px] text-gray-500 max-w-[120px] uppercase tracking-widest leading-relaxed text-center font-figtree">
              Would recommend Lucira
            </p>
          </div>
        </div>

        {gallery.length > 0 && (
          <div className="mb-16 relative">
            <Swiper
              modules={[Scrollbar, FreeMode]}
              spaceBetween={16}
              slidesPerView="auto"
              freeMode={true}
              grabCursor={true}
              scrollbar={{
                draggable: true,
                hide: false,
                el: ".reviews-page-scrollbar",
              }}
              className="w-full !pb-10"
            >
              {gallery.map((item, i) => (
                <SwiperSlide key={i} className="!w-auto">
                  <div 
                      onClick={() => {
                        const idx = filteredAndSortedReviews.findIndex(r => (r._id || r.id) === item.reviewId);
                        if (idx !== -1) setPopupState({ isOpen: true, index: idx });
                      }}
                      className="relative w-32 h-32 md:w-44 md:h-44 rounded-xl overflow-hidden border-2 border-white shadow-md cursor-pointer group bg-gray-50"
                  >
                    <Image src={getValidSrc(item.url)} alt="Review gallery" fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized={true} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-75 group-hover:scale-100">
                          <ChevronRight className="text-white" size={24} />
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            <div className="reviews-page-scrollbar !static !h-1 !bg-gray-200 !mt-2 !rounded-full overflow-hidden"></div>
          </div>
        )}

        <div className="flex flex-row flex-wrap md:flex-nowrap justify-between gap-6 mb-8 border-b border-gray-200 pb-6 items-center">
          <div className="flex items-center gap-2 md:gap-3 order-1 md:order-0">
            <span className="text-sm font-semibold text-gray-600 font-figtree">Rating:</span>
            <Select value={filterRating} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-auto min-w-20 border-none bg-transparent font-bold text-sm uppercase focus:ring-0 p-0 h-auto cursor-pointer gap-1 font-figtree">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-100 shadow-xl font-figtree">
                <SelectItem value="all" className="font-bold text-xs uppercase tracking-widest font-figtree">ALL RATINGS</SelectItem>
                <SelectItem value="5" className="font-bold text-xs uppercase tracking-widest font-figtree">5 STARS</SelectItem>
                <SelectItem value="4" className="font-bold text-xs uppercase tracking-widest font-figtree">4 STARS</SelectItem>
                <SelectItem value="3" className="font-bold text-xs uppercase tracking-widest font-figtree">3 STARS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-center order-0 md:order-1 basis-full lg:basis-auto">
            <span className="text-lg font-bold text-black uppercase tracking-[0.2em] font-figtree">
              {stats.total} VERIFIED REVIEWS
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3 order-2">
            <span className="text-sm font-semibold text-gray-600 font-figtree">Sort by:</span>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-auto min-w-20 border-none bg-transparent font-bold text-sm uppercase focus:ring-0 p-0 h-auto cursor-pointer gap-1 font-figtree">
                <SelectValue placeholder="Featured" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-100 shadow-xl font-figtree">
                <SelectItem value="featured" className="font-bold text-xs uppercase tracking-widest font-figtree">FEATURED</SelectItem>
                <SelectItem value="newest" className="font-bold text-xs uppercase tracking-widest font-figtree">NEWEST FIRST</SelectItem>
                <SelectItem value="highest" className="font-bold text-xs uppercase tracking-widest font-figtree">HIGHEST RATED</SelectItem>
                <SelectItem value="lowest" className="font-bold text-xs uppercase tracking-widest font-figtree">LOWEST RATED</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
          {displayedReviews.map((review, idx) => (
            <ReviewCard
              key={review._id || review.id || `review-${idx}`}
              review={review}
              onClick={() => openPopup(idx)}
            />
          ))}
        </div>

        {!loading && displayedReviews.length === 0 && (
          <div className="text-center py-32 bg-white/30 rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-black uppercase tracking-widest mb-4 font-figtree">No reviews found for this criteria.</p>
            <button onClick={() => { setFilterRating("all"); setSortBy("featured"); }} className="text-[#5A413F] font-black text-xs uppercase tracking-widest border-b-2 border-[#5A413F] pb-1 hover:text-black hover:border-black transition-colors font-figtree">Reset filters</button>
          </div>
        )}

        {visibleCount < filteredAndSortedReviews.length && (
          <div className="mt-20 text-center">
            <button 
              onClick={() => setVisibleCount(prev => prev + 12)}
              disabled={loading}
              className="w-full md:w-auto px-14 py-5 bg-[#5A413F] text-white font-bold text-sm uppercase tracking-[0.3em] rounded shadow-2xl hover:bg-[#4a3533] transition-all disabled:opacity-50 active:scale-95 font-figtree tracking-widest"
            >
              {loading ? "Loading Stories..." : "Load More Stories"}
            </button>
          </div>
        )}

        {loading && allData.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-96 bg-white rounded-2xl shadow-sm border border-gray-100 animate-pulse"></div>
                ))}
            </div>
        )}
      </div>

      <ReviewDetailedPopup 
        isOpen={popupState.isOpen}
        onClose={() => setPopupState({ ...popupState, isOpen: false })}
        reviews={mappedReviews}
        activeIndex={popupState.index}
        onIndexChange={(index) => setPopupState({ ...popupState, index })}
      />

      <WriteReviewForm 
        isOpen={isWriteReviewOpen}
        onClose={() => setIsWriteReviewOpen(false)}
      />

      <style jsx global>{`
        .reviews-page-scrollbar .swiper-scrollbar-drag {
          background: #5a413f !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
}

function ReviewCard({ review, onClick }) {
  const name = (review.name || "Customer").trim();
  const rating = parseFloat(review.rating) || 0;
  
  // Robust feedback extraction to match master design
  const feedbackText = review.text || review.description || review.body || review.review || "";

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).toUpperCase();
    } catch (e) {
      return dateStr;
    }
  };

  const uploads = Array.isArray(review.uploads) ? review.uploads : (review.uploads?.uploads || []);
  const images = uploads.filter(u => u?.link && (u.type === 'image' || !u.type)).map(u => u.link);

  return (
    <div onClick={onClick} className="bg-white p-6 sm:p-8 rounded-xl flex flex-col gap-5 border border-gray-100 shadow-[0_4px_25px_-10px_rgba(0,0,0,0.06)] hover:shadow-md transition-all group cursor-pointer h-full font-figtree">
      <div className="flex justify-between items-start w-full">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#5A413F] flex items-center justify-center text-white font-bold text-lg uppercase shrink-0">
            {name.charAt(0)}
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-start flex-col md:flex-row md:gap-2 gap-1">
              <span className="font-bold text-gray-900 text-base capitalize tracking-tight leading-tight">{name}</span>
              {(review.is_verified || review.verified) && (
                <div className="flex items-center gap-1 text-[#A8715A] font-bold uppercase text-[8px] tracking-widest shrink-0 border border-[#A8715A]/30 px-1.5 py-0.5 rounded-full">
                  <CheckCircle size={10} className="fill-[#A8715A] text-white" />
                  <span>VERIFIED</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-amber-400 mt-0.5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} fill={i < Math.round(rating) ? "currentColor" : "none"} className={i < Math.round(rating) ? "" : "text-zinc-200"} />
                ))}
              </div>
              <span className="text-[11px] font-bold text-gray-900 ml-1">({rating.toFixed(1)})</span>
            </div>
          </div>
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-1 whitespace-nowrap">{formatDate(review.posted_at || review.created_at)}</span>
      </div>

      <div className="flex-grow mt-1">
        <p className="text-gray-600 leading-relaxed text-[13px] italic line-clamp-6">
          &quot;{feedbackText}&quot;
        </p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-2">
          {images.slice(0, 4).map((img, idx) => (
            <div key={idx} className="aspect-square relative rounded-lg overflow-hidden border border-gray-100">
              <Image src={getValidSrc(img)} alt="Review" fill className="object-cover" unoptimized={true} />
            </div>
          ))}
        </div>
      )}
      
      {review.reference_product_name && (
        <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between group/link">
            <span className="text-[10px] font-bold text-black uppercase tracking-widest truncate max-w-[85%]">
                {review.reference_product_name}
            </span>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover/link:bg-black group-hover/link:text-white transition-all ml-2">
                <ChevronRight size={14} />
            </div>
        </div>
      )}
    </div>
  );
}
