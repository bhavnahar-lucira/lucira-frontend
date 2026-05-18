"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Heart, ShoppingCart, Trash2, Star, ChevronRight, Video, Play, Copy, X, Loader2, ShieldCheck, Eye, ArrowRight, MapPin, Phone, Package, Coins, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import { getValidSrc } from "@/lib/utils";
import { formatPrice } from "@/utils/formatPrice";
import { 
  Drawer, 
  DrawerClose, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerTrigger 
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchWishlist, removeWishlistItem } from "@/redux/features/wishlist/wishlistSlice";
import { addToCart, openCart } from "@/redux/features/cart/cartSlice";
import { getEstimatedDispatchDate } from "@/lib/utils";

export default function WishlistPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { items: reduxWishlist, loading } = useSelector((state) => state.wishlist);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [removingId, setRemovingId] = useState(null);
  const [movingToCartId, setMovingToCartId] = useState(null);
  const [showSimilar, setShowSimilar] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [activeSimilarHandle, setActiveSimilarHandle] = useState(null);
  
  // Video Popup State
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [activeVideoMedia, setActiveVideoMedia] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  const loadWishlist = async () => {
    try {
      const res = await dispatch(fetchWishlist()).unwrap();
      setWishlistItems(res);
    } catch (err) {
      console.error("Failed to load wishlist", err);
    }
  };

  const handleVideoClick = async (item) => {
    setShowVideoPopup(true);
    setLoadingVideo(true);
    try {
      // 1. Fetch full product details to find variants
      const res = await fetch(`/api/products/details?handle=${item.productHandle}`);
      if (!res.ok) throw new Error("Failed to fetch product details");
      const { product } = await res.json();
      
      const videoMedia = product.media?.find(m => m.type === "VIDEO" || m.type === "EXTERNAL_VIDEO");
      if (videoMedia) {
        setActiveVideoMedia(videoMedia);
      } else {
        toast.info("No video found for this product");
        setShowVideoPopup(false);
      }
    } catch (err) {
      console.error("Video fetch failed", err);
      toast.error("Could not load video");
      setShowVideoPopup(false);
    } finally {
      setLoadingVideo(false);
    }
  };

  const handleRemove = async (productId, variantId = "", silent = false) => {
    const key = variantId ? `${productId}-${variantId}` : productId;
    setRemovingId(key);
    try {
      const q = new URLSearchParams();
      q.set("productId", productId);
      if (variantId) q.set("variantId", variantId);
      
      const { user } = useSelector((state) => state.user);
      const { sessionId } = useSelector((state) => state.cart);
      if (user?.id) q.set("userId", user.id);
      if (sessionId) q.set("sessionId", sessionId);

      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
      const res = await fetch(`${baseUrl}/api/wishlist?${q.toString()}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove item");
      
      setWishlistItems((items) => items.filter((item) => {
        if (variantId) {
          return !(item.productId === productId && item.variantId === variantId);
        }
        return item.productId !== productId;
      }));
      
      dispatch(removeWishlistItem({ productId, variantId }));
      
      if (!silent) {
        toast.error("Removed from wishlist", {
          icon: <Check className="w-4 h-4" />
        });
      }
    } catch (err) {
      console.error("Remove wishlist item failed", err);
      toast.error(err.message || "Unable to remove item");
    } finally {
      setRemovingId(null);
    }
  };

  const handleMoveToCart = async (item) => {
    const itemKey = item.variantId ? `${item.productId}-${item.variantId}` : item.productId;
    setMovingToCartId(itemKey);
    try {
      // 1. Fetch full product details to find variants
      const res = await fetch(`/api/products/details?handle=${item.productHandle}`);
      if (!res.ok) throw new Error("Failed to fetch product details");
      const { product } = await res.json();

      if (!product || !product.variants?.length) {
        throw new Error("Product variants not found");
      }

      // 2. Prioritize the saved variant from wishlist
      let selectedVariant = product.variants.find(v => (v.id === item.variantId || v.shopifyId === item.variantId));
      
      if (!selectedVariant) {
        // Fallback: In-store available first, then first in-stock, then default
        selectedVariant = product.variants.find(v => v.metafields?.in_store_available === "true" || v.metafields?.in_store_available === true);
      }
      
      if (!selectedVariant) {
        selectedVariant = product.variants.find(v => v.inStock);
      }
      
      if (!selectedVariant) {
        selectedVariant = product.variants[0];
      }

      // 3. Add to cart
      const cartProduct = {
        id: product.id || product.shopifyId,
        shopifyId: product.id || product.shopifyId,
        variantId: selectedVariant.id || selectedVariant.shopifyId,
        title: product.title,
        handle: product.handle,
        quantity: 1,
        price: selectedVariant.price || product.price,
        image: getValidSrc(selectedVariant.image || product.image || item.image),
        variantTitle: selectedVariant.title,
        color: selectedVariant.color || product.color,
        karat: selectedVariant.karat || selectedVariant.purity || product.karat || product.purity || "",
        size: String(selectedVariant.size || ""),
        inStock: Boolean(selectedVariant.inStock),
        
        // Technical pricing fields required for CartSummary and GTM
        goldPricePerGram: selectedVariant.price_breakup?.metal?.rate_per_gram || 0,
        goldWeight: selectedVariant.price_breakup?.metal?.weight || 0,
        goldPrice: selectedVariant.price_breakup?.metal?.cost || 0,
        makingCharges: selectedVariant.price_breakup?.making_charges?.final || 0,
        diamondCharges: selectedVariant.price_breakup?.diamond?.final || 0,
        gst: selectedVariant.price_breakup?.gst?.amount || 0,
        finalPrice: selectedVariant.price_breakup?.total || selectedVariant.price,
        diamondTotalPcs: selectedVariant.price_breakup?.diamond?.pcs || 0,
         shippingDate: (() => {
           const date = new Date();
           date.setDate(date.getDate() + 10);
           const d = String(date.getDate()).padStart(2, "0");
           const m = String(date.getMonth() + 1).padStart(2, "0");
           const y = date.getFullYear();
           return `${d}/${m}/${y}`;
         })(), // Mock or dynamic if available

        hasVideo: Boolean(product.media?.some((m) => m.type === "VIDEO" || m.type === "EXTERNAL_VIDEO")),
        hasSimilar: Boolean(product.handle),
        reviews: product.reviews || null,
        comparePrice: selectedVariant?.compare_price || product.compare_price || "",
        estDelivery: getEstimatedDispatchDate(Boolean(selectedVariant.inStock), product.productMetafields?.lead_time),
        variantOptions: Array.from(new Map(product.variants.map(v => [v.size, {
          variantId: v.id || v.shopifyId,
          size: v.size,
          price: v.price,
          inStock: v.inStock,
          variantTitle: v.title
        }])).values())
      };

      await dispatch(addToCart({ userId: user?.id, product: cartProduct })).unwrap();
      
      // 4. Remove from wishlist after moving (silent)
      await handleRemove(item.productId, item.variantId, true);
      
      toast.error("Moved to cart!", {
        icon: <Check className="w-4 h-4" />
      });
      dispatch(openCart());
    } catch (err) {
      console.error("Move to cart failed", err);
      toast.error(err.message || "Failed to move to cart");
    } finally {
      setMovingToCartId(null);
    }
  };

  const fetchSimilar = async (handle) => {
    if (activeSimilarHandle === handle && similarProducts.length > 0) {
      setShowSimilar(true);
      return;
    }
    
    setActiveSimilarHandle(handle);
    setLoadingSimilar(true);
    setShowSimilar(true);
    try {
      const res = await fetch(`/api/products/similar?handle=${handle}`);
      const data = await res.json();
      setSimilarProducts(data.products || []);
    } catch (e) {
      console.error("Failed to fetch similar products", e);
    } finally {
      setLoadingSimilar(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const recentlyViewedState = {}; // Placeholder if needed

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-figtree text-xl md:text-2xl font-bold text-zinc-900 tracking-tight mb-1">My Wishlist</h2>
          <p className="font-figtree text-sm md:text-base text-zinc-500 font-medium leading-relaxed">Save your favorite pieces and return to them later.</p>
        </div>
        <button
          onClick={loadWishlist}
          className="font-figtree px-6 py-3 bg-primary text-white text-xs font-semibold uppercase tracking-[0.15em] rounded-2xl hover:opacity-90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 w-fit"
        >
          <ShoppingCart size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-x-8 gap-y-12">
        {loading ? (
          <div className="col-span-full py-20 text-center text-zinc-500">Loading your wishlist...</div>
        ) : wishlistItems.length > 0 ? (
          wishlistItems.map((item, index) => {
            const priceNum = Number(item.price);
            const comparePriceNum = Number(item.comparePrice);
            const discount = comparePriceNum && priceNum ? Math.round(((comparePriceNum - priceNum) / comparePriceNum) * 100) : 0;
            const itemKey = item.variantId ? `${item.productId}-${item.variantId}` : (item.productId || index);
            
            return (
              <div key={itemKey} className="group space-y-4">
                {/* Product Image and Icons Container */}
                <div className="relative aspect-square w-full bg-[#fafafa] overflow-hidden rounded-2xl border border-zinc-100 transition-all duration-300 group-hover:shadow-md">
                  <Link href={`/products/${item.productHandle || item.productId}${item.variantId ? `?variant=${item.variantId}` : ""}`} className="block w-full h-full mix-blend-multiply relative">
                    {item.image ? (
                      <Image
                        src={getValidSrc(item.image)}
                        alt={item.title}
                        fill
                        className="object-contain p-6 grayscale-[0.2] group-hover:grayscale-0 transition-all"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">No Image</div>
                    )}
                  </Link>

                  {/* Video Play Button */}
                  {item.hasVideo && (
                    <button 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        handleVideoClick(item); 
                      }}
                      className="absolute bottom-4 left-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-zinc-200 text-zinc-900 shadow-sm hover:bg-black hover:text-white transition-all duration-300"
                    >
                      <Play size={16} fill="currentColor" />
                    </button>
                  )}

                  {/* View Similar Button */}
                  {item.hasSimilar && (
                    <button 
                      onClick={(e) => { e.preventDefault(); fetchSimilar(item.productHandle); }}
                      className="absolute bottom-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-zinc-200 text-zinc-900 shadow-sm hover:bg-black hover:text-white transition-all duration-300"
                    >
                      <Copy size={16} />
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(item.productId, item.variantId)}
                    disabled={removingId === itemKey}
                    className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-zinc-200 text-rose-500 shadow-sm hover:bg-rose-500 hover:text-white transition-all duration-300"
                  >
                    {removingId === itemKey ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>

                {/* Product Info */}
                <div className="flex flex-col gap-3 px-1">
                  <Link href={`/products/${item.productHandle || item.productId}${item.variantId ? `?variant=${item.variantId}` : ""}`}>
                    <h3 className="font-figtree text-base md:text-lg font-bold hover:underline underline-offset-4 decoration-1 leading-snug hover:text-primary transition-colors truncate">
                      {item.title}
                    </h3>
                  </Link>

                  {/* Variant Details */}
                  {(item.size || item.karat || item.color) && (
                    <div className="flex flex-wrap gap-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      {item.karat && <span>{item.karat}</span>}
                      {item.color && <span>{item.color}</span>}
                      {item.size && <span>Size: {item.size}</span>}
                    </div>
                  )}

                  {item.reviews?.count > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={`star-${itemKey}-${i}`}
                            size={12}
                            fill={i < Math.floor(item.reviews.average) ? "currentColor" : "none"}
                            className={i < Math.floor(item.reviews.average) ? "" : "text-zinc-200"}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-black mt-0.5">({item.reviews.count})</span>
                    </div>
                  )}

                  {/* Offer Badge */}
                  <div className="flex items-center gap-1.5 bg-[#F0F9F4] text-[#108548] px-3 py-1 rounded-full w-fit">
                    <ShieldCheck size={14} />
                    <span className="text-xs font-semibold">25% OFF on Making Charges</span>
                  </div>

                  {/* Price Section */}
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-bold text-primary">₹ {formatPrice(priceNum)}</p>
                    {comparePriceNum > priceNum && (
                      <p className="text-base text-zinc-400 line-through">₹ {formatPrice(comparePriceNum)}</p>
                    )}
                    {discount > 0 && (
                      <span className="bg-[#E5E7EB] text-black px-2 py-0.5 rounded-full text-xs font-bold">
                        {discount}% OFF
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleMoveToCart(item)}
                      disabled={movingToCartId === itemKey}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-white text-[11px] font-bold uppercase tracking-wider py-3 rounded-xl hover:opacity-90 transition-all shadow-md shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {movingToCartId === itemKey ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Moving...</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={14} />
                          <span>Move to Cart</span>
                        </>
                      )}
                    </button>
                    <Link
                      href={`/products/${item.productHandle || item.productId}${item.variantId ? `?variant=${item.variantId}` : ""}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-zinc-100 text-zinc-900 text-[11px] font-bold uppercase tracking-wider py-3 rounded-xl hover:bg-zinc-200 transition-colors"
                    >
                      <Eye size={14} />
                      <span>View Details</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center space-y-6 bg-white rounded-[3rem] border-2 border-dashed border-zinc-100">
            <div className="size-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Heart size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="font-figtree text-2xl font-black text-primary">Your wishlist is empty</h3>
              <p className="font-figtree text-zinc-500 font-medium max-w-sm mx-auto">Start adding items you love to your wishlist and they’ll appear here.</p>
            </div>
            <Link href="/collections/all" className="font-figtree inline-block px-10 py-4 bg-primary text-white text-sm font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 transition-transform">
              Browse Collections
            </Link>
          </div>
        )}
      </div>

      {/* Similar Products Drawer */}
      <Drawer open={showSimilar} onOpenChange={setShowSimilar}>
        <DrawerContent className="max-h-[90vh] h-[90vh] bg-white rounded-t-[20px] flex flex-col">
          <div className="mx-auto w-full flex flex-col h-full overflow-hidden">
            <DrawerHeader className="px-10 py-6 flex flex-row items-center justify-between border-b border-zinc-100 !text-left !flex-row shrink-0">
              <DrawerTitle className="text-xl font-medium text-black uppercase">VIEW SIMILAR</DrawerTitle>
              <DrawerClose asChild>
                <button className="text-zinc-400 hover:text-black transition-colors hover:cursor-pointer p-1">
                  <X size={22} strokeWidth={1.5} />
                </button>
              </DrawerClose>
            </DrawerHeader>
            
            <div className="sm:px-10 sm:py-10 px-5 py-5 overflow-y-auto flex-1">
              {loadingSimilar ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 w-full">
                  <Loader2 className="animate-spin text-zinc-400" size={40} />
                  <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">Searching matching designs...</p>
                </div>
              ) : similarProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 sm:gap-x-8 gap-x-4 sm:gap-y-12 gap-y-6 pb-10">
                  {similarProducts.slice(0, 10).map((item) => (
                    <div key={item.shopifyId || item._id || item.id} className="space-y-4">
                      <Link href={`/products/${item.handle}`} onClick={() => setShowSimilar(false)} className="block space-y-4 group">
                        <div className="aspect-square relative rounded-md bg-[#F9F9F9] overflow-hidden transition-all duration-300 group-hover:bg-[#f3f3f3]">
                          <Image
                            src={getValidSrc(item.image)}
                            alt={item.title}
                            fill
                            className="object-contain p-4 mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="space-y-2 px-0">
                          <h4 className="text-[13px] font-normal text-zinc-900 line-clamp-1 leading-relaxed tracking-tight">{item.title}</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <p className="text-[14px] font-bold text-black tracking-tight">₹{formatPrice(item.price)}</p>
                              {(item.compare_price || item.compareAtPrice) > item.price && (
                                <p className="text-[12px] text-zinc-400 line-through font-medium">₹{formatPrice(item.compare_price || item.compareAtPrice)}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 group/link">
                              <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest border-b border-zinc-200 pb-0.5 group-hover/link:border-black transition-colors">
                                VIEW DETAILS
                              </span>
                              <ChevronRight size={10} className="text-zinc-900" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4 w-full">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center">
                    <Copy className="text-zinc-300" size={30} />
                  </div>
                  <p className="font-bold text-zinc-500 uppercase tracking-widest text-sm">No similar items found for this design.</p>
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Video Popup Modal */}
      <Dialog open={showVideoPopup} onOpenChange={(open) => { setShowVideoPopup(open); if(!open) setActiveVideoMedia(null); }}>
        <DialogContent className="max-w-2xl aspect-square bg-black border-none p-0 overflow-hidden shadow-2xl rounded-3xl" showCloseButton={false}>
          <DialogTitle className="sr-only">Product Video</DialogTitle>
          <DialogDescription className="sr-only">Video preview of the product</DialogDescription>
          
          <button 
            onClick={() => { setShowVideoPopup(false); setActiveVideoMedia(null); }}
            className="absolute top-4 right-4 z-[210] p-2 bg-black/50 hover:bg-black text-white rounded-full transition-all duration-300 shadow-lg border border-white/10"
          >
            <X size={24} />
          </button>
          
          <div className="w-full h-full flex items-center justify-center">
            {loadingVideo ? (
              <div className="flex flex-col items-center gap-4 text-white">
                <Loader2 className="animate-spin" size={40} />
                <p className="text-sm font-bold uppercase tracking-widest opacity-70">Loading video...</p>
              </div>
            ) : activeVideoMedia ? (
              <video 
                autoPlay 
                muted 
                loop 
                playsInline
                controls
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                disablePictureInPicture
                className="w-full h-full object-contain"
                poster={activeVideoMedia.preview}
              >
                {activeVideoMedia.sources && activeVideoMedia.sources.length > 0 ? (
                  <>
                    {activeVideoMedia.sources.filter(s => s.format === 'mp4').map((source, sIdx) => (
                      <source key={`video-source-mp4-${sIdx}`} src={source.url} type={source.mimeType} />
                    ))}
                    {activeVideoMedia.sources.filter(s => s.format !== 'mp4').map((source, sIdx) => (
                      <source key={`video-source-other-${sIdx}`} src={source.url} type={source.mimeType} />
                    ))}
                  </>
                ) : (
                  <source src={activeVideoMedia.url} type={activeVideoMedia.mimeType || "video/mp4"} />
                )}
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="text-white opacity-50">No video available</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
