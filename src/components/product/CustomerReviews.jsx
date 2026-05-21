"use client";

import { Star, CheckCircle, ChevronDown, ChevronRight, X, Loader2, Copy, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation, Scrollbar } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/scrollbar";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import ReviewDetailedPopup from "@/components/review/ReviewDetailedPopup";
import WriteReviewForm from "@/components/review/WriteReviewForm";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadNectorReviews } from "@/lib/nector";

// Helper to ensure image src is a valid string URL
const getValidSrc = (src, fallback = null) => {
  if (typeof src === "string" && src.trim() !== "") return src;
  if (src && typeof src === "object" && src.url) return src.url;
  return fallback;
};

export default function CustomerReviews({
  productId,
  productTitle,
  productImage,
  productHandle,
}) {
  const [popupState, setPopupState] = useState({ isOpen: false, index: 0 });
  const [data, setData] = useState({
    count: 0,
    average: 0,
    stats: { breakdown: {} },
    list: [],
  });
  const [gallery, setGallery] = useState([]);
  const [isGlobal, setIsGlobal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [usedFallback, setUsedFallback] = useState(false);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    async function initReviews() {
      setLoading(true);
      try {
        let result = await loadNectorReviews(productId);
        let fallbackUsed = false;

        // Fallback logic: if no reviews for this product, fetch all reviews
        if (productId && (!result || result.count === 0 || !result.items || result.items.length === 0)) {
          const globalResult = await loadNectorReviews(null);
          if (globalResult && globalResult.count > 0) {
            result = globalResult;
            fallbackUsed = true;
          }
        }

        const breakdown = {};
        if (Array.isArray(result.stats)) {
          result.stats.forEach((s) => {
            breakdown[s.rating] = s.count;
          });
        } else if (result.stats?.breakdown) {
          Object.assign(breakdown, result.stats.breakdown);
        }

        let average = result.average || 0;
        if (!average && result.items?.length > 0) {
          const sum = result.items.reduce((s, r) => s + (parseFloat(r.rating) || 0), 0);
          average = (sum / result.items.length).toFixed(1);
        }

        setData({
          count: result.count,
          average: average,
          stats: { breakdown },
          list: result.items,
        });

        const galleryItems = [];
        result.items.forEach((r) => {
          const uploads = Array.isArray(r.uploads) ? r.uploads : r.uploads?.uploads || [];
          uploads.forEach((u) => {
            if (u?.link && u.type === "image") {
              galleryItems.push({
                url: u.link,
                reviewId: r.id || r._id || r.review_id || r.nector_review_id,
              });
            }
          });
        });
        setGallery(galleryItems);
        setIsGlobal(!result.isProductView);
        setUsedFallback(fallbackUsed);
      } catch (error) {
        console.error("Error loading reviews:", error);
      } finally {
        setLoading(false);
      }
    }
    initReviews();
  }, [productId, refreshTrigger]);

  const filteredAndSortedReviews = useMemo(() => {
    let result = [...(data.list || [])];
    if (filterRating !== "all") {
      result = result.filter((r) => Math.round(r.rating) === parseInt(filterRating));
    }
    result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.date) - new Date(a.date);
      if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
      if (sortBy === "highest") return b.rating - a.rating;
      if (sortBy === "lowest") return a.rating - b.rating;
      return 0;
    });
    return result;
  }, [data.list, filterRating, sortBy, isGlobal]);

  const mappedReviews = useMemo(() => {
    return filteredAndSortedReviews?.map((r) => {
      const uploads = Array.isArray(r.uploads) ? r.uploads : r.uploads?.uploads || [];
      const images = uploads.filter((u) => u?.link && (u.type === "image" || !u.type)).map((u) => u.link);
      
      const feedback = r.text || r.description || r.body || "";

      return {
        ...r,
        id: r.id || r._id || r.review_id || r.nector_review_id || Math.random().toString(),
        personName: (r.name || "Verified Buyer").trim(),
        review: feedback,
        images: images,
        verified: r.is_verified === true || r.verified === true,
        date: r.posted_at || r.created_at || r.date
      };
    }) || [];
  }, [filteredAndSortedReviews]);

  if (loading && data.list.length === 0)
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-[#FEF5F1]">
        <div className="w-8 h-8 border-4 border-[#5A413F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  if (data.count === 0)
    return (
      <section className="w-full md:py-20 py-15 bg-[#FEF5F1] mt-15" id="reviews">
        <div className="container-main text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 font-abhaya text-[#1A1A1A]">Customer Reviews</h2>
          <div className="py-20 bg-white/30 rounded-3xl border-2 border-dashed border-gray-200 max-w-2xl mx-auto">
            <p className="text-gray-400 font-bold uppercase tracking-widest mb-6">Be the first to review this product.</p>
            <button onClick={() => setIsWriteReviewOpen(true)} className="px-10 py-4 bg-[#5A413F] text-white font-bold text-xs uppercase tracking-[0.2em] rounded-sm shadow-lg hover:bg-[#4a3533] transition-all">Write a review</button>
          </div>
        </div>
        <WriteReviewForm isOpen={isWriteReviewOpen} onClose={() => setIsWriteReviewOpen(false)} productId={productId} onSuccess={() => setRefreshTrigger((prev) => prev + 1)} productTitle={productTitle} productImage={productImage} productHandle={productHandle} />
      </section>
    );

  return (
    <section className="w-full md:py-20 py-15 bg-[#FEF5F1] mt-15" id="reviews">
      <div className="container-main">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 font-abhaya capitalize text-[#1A1A1A]">Customer Reviews</h2>

        <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-24 mb-12">
          <div className="flex flex-col items-center">
            <span className="text-6xl font-medium text-[#1A1A1A] mb-4">{data.average}</span>
            <div className="flex gap-1 mb-4 text-[#D4A373]">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={`summary-star-${i}`} size={18} fill={i <= Math.round(data.average) ? "currentColor" : "none"} className={i <= Math.round(data.average) ? "" : "text-zinc-200"} />
              ))}
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">{data.count} reviews</span>
          </div>

          <div className="flex-grow max-w-lg w-full space-y-2">
            {[5, 4, 3, 2, 1].map((num) => {
              const count = data.list?.filter((r) => Math.round(r.rating) === num).length || 0;
              const percent = data.count ? Math.round((count / data.count) * 100) : 0;
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
            <span className="text-5xl font-medium text-[#1A1A1A] mb-2">{usedFallback ? '97' : Math.round(((data.stats.breakdown[5] || 0) + (data.stats.breakdown[4] || 0)) / data.count * 100) || 97}%</span>
            <p className="text-[10px] text-gray-500 max-w-[120px] uppercase tracking-widest leading-relaxed text-center font-figtree">Would recommend this product</p>
          </div>
        </div>

        {/* Fallback Banner */}
        {usedFallback && (
          <div className="bg-[#f3f7fb] border-l-4 border-blue-400 p-4 mb-10 flex items-center gap-3 rounded-r-lg shadow-sm max-w-5xl mx-auto">
            <Info className="text-blue-500 shrink-0" size={20} />
            <p className="text-sm text-gray-600 font-medium font-figtree">
              No reviews yet for this product. Showing reviews from other products instead.
            </p>
          </div>
        )}

        {/* Filter & Sort Bar */}
        <div className="flex flex-row flex-wrap md:flex-nowrap justify-between items-center gap-6 mb-8 border-b border-gray-200 pb-6">
          <div className="flex items-center gap-2 md:gap-3 order-1 md:order-0">
            <span className="text-sm font-semibold text-gray-600 font-figtree">Rating:</span>
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-auto min-w-20 border-none bg-transparent font-bold text-sm uppercase focus:ring-0 p-0 h-auto cursor-pointer gap-1 font-figtree">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-100 shadow-xl font-figtree">
                <SelectItem value="all" className="font-bold text-xs uppercase tracking-widest">ALL RATINGS</SelectItem>
                <SelectItem value="5" className="font-bold text-xs uppercase tracking-widest">5 STARS</SelectItem>
                <SelectItem value="4" className="font-bold text-xs uppercase tracking-widest">4 STARS</SelectItem>
                <SelectItem value="3" className="font-bold text-xs uppercase tracking-widest">3 STARS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-center order-0 md:order-1 basis-full lg:basis-auto">
            <span className="text-lg font-bold text-black uppercase tracking-[0.2em] font-figtree">{data.count} VERIFIED REVIEWS</span>
          </div>

          <div className="flex items-center gap-2 md:gap-3 order-2">
            <span className="text-sm font-semibold text-gray-600 font-figtree">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-auto min-w-20 border-none bg-transparent font-bold text-sm uppercase focus:ring-0 p-0 h-auto cursor-pointer gap-1 font-figtree">
                <SelectValue placeholder="Featured" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-100 shadow-xl font-figtree">
                <SelectItem value="featured" className="font-bold text-xs uppercase tracking-widest">FEATURED</SelectItem>
                <SelectItem value="newest" className="font-bold text-xs uppercase tracking-widest">NEWEST FIRST</SelectItem>
                <SelectItem value="oldest" className="font-bold text-xs uppercase tracking-widest">OLDEST FIRST</SelectItem>
                <SelectItem value="highest" className="font-bold text-xs uppercase tracking-widest">HIGHEST RATED</SelectItem>
                <SelectItem value="lowest" className="font-bold text-xs uppercase tracking-widest">LOWEST RATED</SelectItem>
                <SelectItem value="images" className="font-bold text-xs uppercase tracking-widest">IMAGES FIRST</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
          {mappedReviews.slice(0, visibleCount).map((review, idx) => (
            <ReviewCard key={review.id} review={review} onClick={() => setPopupState({ isOpen: true, index: idx })} />
          ))}
        </div>

        <div className="mt-15 md:mt-20 text-center flex flex-col items-center gap-6">
           <button onClick={() => setIsWriteReviewOpen(true)} className="text-xs font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-gray-500 hover:border-gray-500 transition-colors font-figtree">Write a Review</button>
           <Link href="/reviews" target="_blank" className="w-full md:w-auto px-10 py-4 text-sm font-bold uppercase bg-[#5A413F] hover:bg-[#4A3934] text-white transition-colors font-figtree tracking-widest">View All Reviews</Link>
        </div>
      </div>

      <ReviewDetailedPopup isOpen={popupState.isOpen} onClose={() => setPopupState({ ...popupState, isOpen: false })} reviews={mappedReviews} activeIndex={popupState.index} onIndexChange={(index) => setPopupState({ ...popupState, index })} />
      <WriteReviewForm isOpen={isWriteReviewOpen} onClose={() => setIsWriteReviewOpen(false)} productId={productId} onSuccess={() => setRefreshTrigger((prev) => prev + 1)} productTitle={productTitle} productImage={productImage} productHandle={productHandle} />
      <style jsx global>{` .product-review-scrollbar .swiper-scrollbar-drag { background: #5a413f !important; } `}</style>
    </section>
  );
}

function ReviewCard({ review, onClick }) {
  const name = review.personName;
  const rating = parseFloat(review.rating) || 0;
  const text = review.review;
  
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();
    } catch (e) { return dateStr; }
  };

  return (
    <div onClick={onClick} className="bg-white p-6 sm:p-8 rounded-xl flex flex-col gap-5 border border-gray-100 shadow-[0_4px_25px_-10px_rgba(0,0,0,0.06)] hover:shadow-md transition-all group cursor-pointer h-full font-figtree">
      <div className="flex justify-between items-start w-full">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#5A413F] flex items-center justify-center text-white font-bold text-lg uppercase shrink-0">
            {name.charAt(0)}
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-base capitalize tracking-tight leading-tight">{name}</span>
              {(review.is_verified || review.verified) && (
                <div className="flex items-center gap-1 text-[#B17A5D] font-bold uppercase text-[8px] tracking-[0.1em] shrink-0 border border-[#B17A5D]/30 px-1.5 py-0.5 rounded-full">
                  <CheckCircle size={10} className="fill-[#B17A5D] text-white" />
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
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-1 whitespace-nowrap">{formatDate(review.date)}</span>
      </div>

      <div className="flex-grow mt-1">
        <p className="text-gray-600 leading-relaxed text-[13px] italic line-clamp-6">
          &quot;{text}&quot;
        </p>
      </div>

      {review.images?.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-2">
          {review.images.slice(0, 4).map((img, idx) => (
            <div key={idx} className="aspect-square relative rounded-lg overflow-hidden border border-gray-100">
              <Image src={getValidSrc(img)} alt="Review" fill className="object-cover" unoptimized={true} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
