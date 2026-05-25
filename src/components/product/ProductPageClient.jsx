"use client";

import { useState, useEffect, useLayoutEffect, useRef, Suspense, useCallback } from "react";
import Image from "next/image";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Play, Info, Heart, Video, Store, ChevronRight, Share2, Check, Copy, Loader2, X, ArrowRight, MapPin, Phone, Package, Coins } from "lucide-react";
import { BadgeCheck } from "lucide-react";
import PriceSavingsDetails from "@/components/product/PriceSavingsDetails";
import ProductAccordion from "@/components/product/ProductAccordion";
import LuxuryMarquee from "@/components/product/LuxuryMarquee";
import ProductStory from "@/components/product/ProductStory";
import OurProcess from "@/components/product/OurProcess";
import CategorySlider from "@/components/product/CategorySlider";
import CustomerReviews from "@/components/product/CustomerReviews";
import FAQSection from "@/components/product/FAQSection";
import DiamondComparison from "@/components/product/DiamondComparison";
import { FindLuciraStore } from "@/components/product/FindLuciraStore";
import { JoinLuciraCommunity } from "@/components/product/JoinLuciraCommunity";
import { ProductSlider } from "@/components/product/ProductSlider";
import ExploreOtherRings from "@/components/product/ExploreOtherRings";
import WearThisWith from "@/components/product/WearThisWith";
import ProductCard from "@/components/product/ProductCard";
import { Separator } from "@/components/ui/separator";
import ProductGallery from "@/components/product/ProductGallery";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { toast } from 'react-toastify';
import { apiFetch, fetchVariantPricing } from "@/lib/api";
import { shopifyStorefrontFetch } from "@/lib/shopify-client";
import 'react-toastify/dist/ReactToastify.css';
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { calculateDistance } from "@/utils/distance";
import { getEstimatedDispatchDate } from "@/lib/utils";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SizeGuideSheet } from "@/components/product/SizeGuideSheet";
import { ProductCustomizerMobile } from "@/components/product/ProductCustomizerMobile";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "@/redux/features/cart/cartSlice";
import { selectUser, setPincode, selectPincode } from "@/redux/features/user/userSlice";
import {
  addWishlistItem,
  removeWishlistItem,
  addGuestWishlistItem,
  removeGuestWishlistItem,
  fetchWishlist,
} from "@/redux/features/wishlist/wishlistSlice";
import { addRecentlyViewed, selectRecentlyViewed } from "@/redux/features/recentlyViewed/recentlyViewedSlice";
import AtcBar from "@/components/AtcBar";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { pushProductView, pushAddToCart, pushAddToWishlist, pushRemoveFromWishlist, pushPromoClick, formatGtmPrice, getNumericId, getStandardWishlistPayload, pushToDataLayer } from "@/lib/gtm";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import StyledByLucira from "../home/StyledByLucira";
import PdpInfoSheet from "@/components/product/PdpInfoSheet";
import { loadNectorReviews } from "@/lib/nector";

import { Sheet as MobileSheet } from "react-modal-sheet";

import { Lobster, Yellowtail, Satisfy, ABeeZee } from "next/font/google";
import ExploreRange from "../home/ExploreRange";

const lobster = Lobster({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-lobster",
  display: "swap",
});

const yellowtail = Yellowtail({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-yellowtail",
  display: "swap",
});

const satisfy = Satisfy({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-satisfy",
  display: "swap",
});

const abeezee = ABeeZee({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-abeezee",
  display: "swap",
});

const USER_PINCODE_COOKIE = "user_pincode";

function getCookieValue(name) {
  if (typeof document === "undefined") return "";

  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return value ? decodeURIComponent(value.split("=").slice(1).join("=")) : "";
}

const handleSafeScroll = (elementRef) => {
  if (!elementRef.current) return;  
  const isDesktop = window.innerWidth >= 768;  
  const bodyRect = document.body.getBoundingClientRect().top;
  const elementRect = elementRef.current.getBoundingClientRect().top;
  const absoluteElementTop = elementRect - bodyRect;
  const offset = isDesktop ? 80 : 20; 
  const targetPosition = absoluteElementTop - offset;
  
  window.scrollTo({
    top: targetPosition,
    behavior: "smooth",
  });
  
  if (isDesktop) {
    setTimeout(() => {
      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
    }, 300);
  }
};

// Force en-IN formatting to be consistent across environments
const formatPrice = (num) => {
  if (num === null || num === undefined) return "0";
  // Convert to absolute integer to avoid any .00 trailing
  const val = Math.round(Number(num));
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(val);
};

// Helper to ensure image src is a valid string URL
const getValidSrc = (src, fallback = "/images/product/1.jpg") => {
  if (typeof src === 'string' && src.trim() !== '') return src;
  if (src && typeof src === 'object' && src.url) return src.url;
  return fallback;
};

const getBaseColor = (color = "") => {
  const normalized = String(color).toLowerCase();
  if (normalized.includes("rose")) return "rose";
  if (normalized.includes("white") || normalized.includes("silver") || normalized.includes("platinum")) return "white";
  if (normalized.includes("yellow") || normalized.includes("gold")) return "yellow";
  return "";
};

const getColorSpecificImage = (product, colorName) => {
  if (!product?.media || product.media.length === 0) return null;
  const baseColor = getBaseColor(colorName);
  if (!baseColor) return null;
  
  const colorTerms = ["yellow", "white", "rose"];
  
  // Logic similar to ProductGallery: find image matching color base and not mentioning others
  return product.media.find(m => {
    if (m.type !== "IMAGE") return false;
    const alt = (m.alt || "").toLowerCase();
    const mentionsOtherColor = colorTerms.some(c => c !== baseColor && alt.includes(c));
    return alt.includes(baseColor) || !mentionsOtherColor;
  });
};

const getVariantSelection = (variant) => {
  if (variant?.metafields?.metal_purity && variant?.metafields?.metal_color) {
    return {
      karat: variant.metafields.metal_purity,
      color: variant.metafields.metal_color,
    };
  }

  const fallback = {
    karat: variant?.metafields?.metal_purity || "14KT",
    color: "Yellow Gold",
  };

  if (!variant?.color) {
    return fallback;
  }

  const parts = String(variant.color).trim().split(" ");
  if (parts.length < 2) {
    return {
      karat: fallback.karat,
      color: variant.color || fallback.color,
    };
  }

  return {
    karat: parts[0] || fallback.karat,
    color: parts.slice(1).join(" ") || fallback.color,
  };
};

const parseOrnaverseComponent = (val) => {
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch (e) {
    return null;
  }
};

const mapShapeCode = (code) => {
  if (!code || code === "NA") return null;
  const maps = {
    "PR": "Princess",
    "RD": "Round",
    "MQ": "Marquise",
    "OV": "Oval",
    "PE": "Pear",
    "EM": "Emerald",
    "CU": "Cushion",
    "HE": "Heart",
    "RA": "Radiant",
    "AS": "Asscher"
  };
  return maps[code.toUpperCase()] || code;
};

export default function ProductPageClient({
  product,
  complementaryProducts: initialComplementaryProducts = [],
  matchingProducts: initialMatchingProducts = [],
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const variantIdFromUrl = searchParams.get("variant");
  const collectionContext = useSelector((state) => state.user.collectionContext);
  const dispatch = useDispatch();  

  useEffect(() => {
    window.__LUCIRA_PRODUCT__ = product;
    return () => {
      delete window.__LUCIRA_PRODUCT__;
    };
  }, [product]);

  const user = useSelector(selectUser);
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showTopAtc, setShowTopAtc] = useState(false);
  const [showBottomAtc, setShowBottomAtc] = useState(true);
  const mainAtcRef = useRef(null);
  const productDetailsRef = useRef(null);
  const reviewsRef = useRef(null);

  const [engraving, setEngraving] = useState("");
  const [engravingFont, setEngravingFont] = useState("Lobster");
  const [isEngravingDrawerOpen, setIsEngravingDrawerOpen] = useState(false);
  const [savedEngraving, setSavedEngraving] = useState({ text: "", font: "" });
  const engravingInputRef = useRef(null);

  const [giftText, setGiftText] = useState("");
  const [activePromoSlide, setActivePromoSlide] = useState(1);
  const [showSimilar, setShowSimilar] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [complementaryProducts, setComplementaryProducts] = useState(initialComplementaryProducts);
  const [matchingProducts, setMatchingProducts] = useState(initialMatchingProducts);
  const [youMayAlsoLikeProducts, setYouMayAlsoLikeProducts] = useState([]);

  const [activeInfoSheet, setActiveInfoSheet] = useState(null);
  const [allStores, setAllStores] = useState([]);
  const [availableStores, setAvailableStores] = useState([]);
  const [nearestStore, setNearestStore] = useState(null);
  const [availableStoreCount, setAvailableStoreCount] = useState(0);
  const [isStoreDrawerOpen, setIsStoreDrawerOpen] = useState(false);

  const [reviewStats, setReviewStats] = useState({
    average: product.reviews?.average || product.reviewStats?.average || 0,
    count: product.reviews?.count || product.reviewStats?.count || 0,
  });

  const [goldCoinConfig, setGoldCoinConfig] = useState({ enabled: false, threshold: 20000, message: "" });

  useEffect(() => {
    if (!product.shopifyId) return;

    const fetchComplementary = async () => {
      if (!product.shopifyId && !product.id) return;
      
      const gid = product.shopifyId?.startsWith("gid://") ? product.shopifyId : `gid://shopify/Product/${product.shopifyId || product.id}`;
      console.log("[fetchComplementary] Starting fetch for GID:", gid);
      
      const PRODUCT_FIELDS = `
        fragment ProductFields on Product {
          id
          title
          handle
          productType
          featuredImage { url altText }
          images(first: 5) { edges { node { url altText } } }
          variants(first: 20) {
            edges {
              node {
                id
                title
                sku
                availableForSale
                price { amount currencyCode }
                compareAtPrice { amount currencyCode }
                selectedOptions { name value }
                image { url altText }
                metal_purity: metafield(namespace: "ornaverse", key: "metal_purity") { value }
                metal_color: metafield(namespace: "ornaverse", key: "metal_color") { value }
              }
            }
          }
          productMetafields: metafields(identifiers: [
            {namespace: "ornaverse", key: "bestsellers"}
          ]) {
            key
            value
          }
        }
      `;

      // 1. Try productRecommendations (intent: COMPLEMENTARY)
      const RECOMMENDATIONS_QUERY = `
        query getRecommendations($id: ID!) {
          productRecommendations(productId: $id, intent: COMPLEMENTARY) {
            ...ProductFields
          }
        }
        ${PRODUCT_FIELDS}
      `;

      // 2. Try direct metafield fetch with multiple identifiers and types
      const METAFIELD_QUERY = `
        query getMetafieldRecommendations($id: ID!) {
          product(id: $id) {
            # Try multiple common patterns via identifiers
            metafields(identifiers: [
              {namespace: "shopify", key: "complementary_products"},
              {namespace: "shopify", key: "complementary-products"},
              {namespace: "shopify", key: "discovery--product_recommendation.complementary_products"},
              {namespace: "shopify--discovery--product_recommendation", key: "complementary_products"},
              {namespace: "custom", key: "complementary_products"},
              {namespace: "custom", key: "complementary-products"},
              {namespace: "custom", key: "matching_product"},
              {namespace: "custom", key: "matching_products"}
            ]) {
              namespace
              key
              value
              type
              references(first: 20) {
                edges {
                  node {
                    ... on Product {
                      ...ProductFields
                    }
                  }
                }
              }
            }
          }
        }
        ${PRODUCT_FIELDS}
      `;

      try {
        // Try productRecommendations first
        const result = await shopifyStorefrontFetch(RECOMMENDATIONS_QUERY, { id: gid });
        let rawProducts = result?.productRecommendations || [];
        console.log("[fetchComplementary] Recommendations result:", rawProducts.length);

        const mapProduct = (p) => {
          if (!p || !p.id) return null;
          
          const variants = (p.variants?.edges || []).map(({ node: v }) => {
            const options = {};
            v.selectedOptions?.forEach(o => { options[o.name.toLowerCase()] = o.value; });
            
            return {
              id: v.id.split("/").pop(),
              shopifyId: v.id,
              title: v.title,
              sku: v.sku,
              price: Number(v.price.amount),
              compare_price: v.compareAtPrice ? Number(v.compareAtPrice.amount) : null,
              inStock: v.availableForSale === true,
              image: v.image?.url,
              size: options.size || null,
              color: options.color || options.metal || options["metal color"] || null,
              metafields: {
                metal_purity: v.metal_purity?.value,
                metal_color: v.metal_color?.value
              }
            };
          });

          const images = (p.images?.edges || []).map(({ node: img }) => ({
            url: img.url,
            alt: img.altText || ""
          }));

          const productMetafields = {};
          p.productMetafields?.forEach(m => { if (m) productMetafields[m.key] = m.value; });

          return {
            ...p,
            id: p.id.split("/").pop(),
            shopifyId: p.id,
            type: p.productType,
            image: p.featuredImage?.url,
            images,
            variants,
            productMetafields
          };
        };

        // If recommendations has products, map them to complementary
        if (rawProducts.length > 0) {
          const mapped = rawProducts.map(mapProduct).filter(Boolean);
          const uniqueMapped = Array.from(new Map(mapped.map(p => [p.id, p])).values());
          setComplementaryProducts(uniqueMapped);
        }

        // Always fetch metafields to check for matching_product even if recommendations had results
        const metaResult = await shopifyStorefrontFetch(METAFIELD_QUERY, { id: gid });
        const metafields = metaResult?.product?.metafields || [];
        
        console.log("[fetchComplementary] Metafields found:", metafields.length);
        
        const complementaryFromMeta = [];
        const matchingFromMeta = [];

        metafields.forEach(m => {
          if (m?.references?.edges) {
            const refs = m.references.edges.map(e => e.node).filter(Boolean).map(mapProduct).filter(Boolean);
            if (m.key.includes('matching')) {
              matchingFromMeta.push(...refs);
            } else {
              complementaryFromMeta.push(...refs);
            }
          }
        });

        if (complementaryFromMeta.length > 0 && rawProducts.length === 0) {
          const uniqueMapped = Array.from(new Map(complementaryFromMeta.map(p => [p.id, p])).values());
          setComplementaryProducts(uniqueMapped);
        }

        if (matchingFromMeta.length > 0) {
          const uniqueMapped = Array.from(new Map(matchingFromMeta.map(p => [p.id, p])).values());
          console.log("[fetchComplementary] Setting youMayAlsoLikeProducts:", uniqueMapped.length);
          setYouMayAlsoLikeProducts(uniqueMapped);
        }

        return (rawProducts.length > 0 || complementaryFromMeta.length > 0 || matchingFromMeta.length > 0);
      } catch (err) {
        console.error("Error fetching complementary products:", err);
      }
      return false;
    };

    fetchComplementary();
  }, [product.shopifyId, product.id]);

  useEffect(() => {
    if (!product.handle) return;

    let ignore = false;

    apiFetch(`/api/products/related?handle=${encodeURIComponent(product.handle)}`)
      .then((data) => {
        if (ignore) return;
        // Only set complementary if they haven't been set by the metafield fetch
        // Note: this is a simple race-condition prone check, but given the user request, 
        // we want the metafield to be the primary source.
        setComplementaryProducts(prev => {
          if (prev && prev.length > 0) return prev;
          return data.complementaryProducts || [];
        });
        setMatchingProducts(data.matchingProducts || []);
      })
      .catch((error) => {
        console.error("Error fetching related products:", error);
      });

    return () => {
      ignore = true;
    };
  }, [product.handle]);

  useEffect(() => {
    apiFetch("/api/settings/gold-coin")
      .then((data) => {
        setGoldCoinConfig({
          enabled: data.enabled ?? false,
          threshold: data.threshold || 20000,
          message: data.message || ""
        });
      })
      .catch((err) => console.error("Error fetching gold coin setting:", err));
  }, []);

  useEffect(() => {
    async function fetchReviewStats() {
      if (reviewStats.count === 0) {
        try {
          const result = await loadNectorReviews(product.shopifyId);
          let average = result.average || 0;
          if (!average && result.items?.length > 0) {
            const sum = result.items.reduce(
              (s, r) => s + (parseFloat(r.rating) || 0),
              0,
            );
            average = (sum / result.items.length).toFixed(1);
          }
          setReviewStats({
            average: average,
            count: result.count,
          });
        } catch (error) {
          console.error("Error fetching review stats:", error);
        }
      }
    }
    fetchReviewStats();
  }, [product.shopifyId]);


  // Initialize with priority for URL variant, then 9KT only if it's exclusively/primarily in the 9kt-collection
  const initialVariant = (() => {
    // 1. Check URL variant first
    if (variantIdFromUrl) {
      const urlVariant = product.variants?.find(v => String(v.id) === String(variantIdFromUrl) || String(v.shopifyId) === String(variantIdFromUrl));
      if (urlVariant) return urlVariant;
    }

    const handles = product.collectionHandles || [];
    // Only apply 9KT priority if the user context is specifically from the 9kt-collection
    const isStrict9kt = collectionContext === "9kt-collection";

    if (isStrict9kt) {
      const nineKT = product.variants?.find(v => String(v.color || v.title).includes("9KT"));
      if (nineKT) return nineKT;
    }
    return product.variants?.find(v => v.inStock) || (product.variants && product.variants.length > 0 ? product.variants[0] : null);
  })();

  // Robust variant lookup helper
  const findMatchingVariant = useCallback((metal, karat, size) => {
    return product.variants?.find(v => {
      const vKarat = String(v.metafields?.metal_purity || "").toLowerCase().trim();
      const vMetal = String(v.metafields?.metal_color || "").toLowerCase().trim();
      
      const targetKarat = String(karat || "").toLowerCase().trim();
      const targetMetal = String(metal || "").toLowerCase().trim();
      
      // If metafields are present, use them for strict matching
      if (vKarat && vMetal) {
          return vKarat === targetKarat && vMetal === targetMetal && String(v.size) === String(size);
      }

      // Fallback to color string matching
      const vColor = String(v.color || "").toLowerCase().trim();
      const targetColorFull = `${karat} ${metal}`.toLowerCase().trim();
      const targetColorSimple = `${metal}`.toLowerCase().trim();
      
      const sizeMatch = String(v.size) === String(size);
      const colorMatch = vColor === targetColorFull || vColor === targetColorSimple;
      
      return colorMatch && sizeMatch;
    });
  }, [product.variants]);

  const initialSelection = getVariantSelection(initialVariant);
  const initialColor = initialSelection.color;
  const initialKarat = initialSelection.karat;
  const initialSize = initialVariant ? initialVariant.size : "12";

  const [activeColor, setActiveColor] = useState(initialColor);
  const [activeKarat, setActiveKarat] = useState(initialKarat);
  const [selectedSize, setSelectedSize] = useState(initialSize);
  const [activeVariant, setActiveVariant] = useState(initialVariant);
  const [priceBreakup, setPriceBreakup] = useState(null);
  const [isSchemeOpen, setIsSchemeOpen] = useState(false);
  const schemeTimeoutRef = useRef(null);
  const shouldToastVariantChange = useRef(false);

  const calculateScheme = useCallback((price) => {
    if (!price) return null;
    const priceRupees = Math.floor(price);
    const rawMonthly = Math.floor(priceRupees / 10);
    const remainder = rawMonthly % 500;
    const monthly = rawMonthly - remainder;

    // Use base URL with amount only as requested
    const schemeUrl = `https://schemes.lucirajewelry.com/?amount=${monthly}`;

    return {
      monthly,
      pay9: monthly * 9,
      saveAmount: monthly,
      totalRedeemable: monthly * 10,
      schemeUrl,
      productPrice: priceRupees
    };
  }, []);

  const schemeData = activeVariant?.price > 20000 ? calculateScheme(activeVariant.price) : null;

  // Pincode & Dispatch Logic
  const globalPincode = useSelector(selectPincode);
  const [localPincode, setLocalPincode] = useState(globalPincode || "");
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({
    status: "idle", // idle, loading, deliverable, undeliverable
    message: "",
    coords: null
  });

useEffect(() => {
  if (
    globalPincode &&
    !localPincode
  ) {
    setLocalPincode(globalPincode);
  }
}, [globalPincode]);

useEffect(() => {
  const savedPincode = String(
    getCookieValue(USER_PINCODE_COOKIE) || ""
  )
    .replace(/\D/g, "")
    .slice(0, 6);

  if (savedPincode) {
    setLocalPincode(savedPincode);

    dispatch(setPincode(savedPincode));
  }
}, [dispatch]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const data = await apiFetch("/api/stores");
        setAllStores(data.stores || []);
      } catch (err) {
        console.error("Error fetching stores:", err);
      }
    };
    fetchStores();
  }, []);

  const calculateDispatchDate = useCallback(() => {
    // 1. Check if product is in stock or made to order
    const isInStock = activeVariant?.inStock === true || activeVariant?.inStock === "true";
    const leadTime = product.productMetafields?.lead_time;
    return getEstimatedDispatchDate(isInStock, leadTime);
  }, [activeVariant, product.productMetafields]);

  const handlePincodeCheck = useCallback(async (val) => {
    // If val is a string (like from useEffect), use it. 
    // Otherwise (from button click/event), use the current 'localPincode' state.
      const pincodeToCheck = String(
      typeof val === "string" ? val : localPincode
    ).trim();

    if (pincodeToCheck.length !== 6) {
      if (pincodeToCheck) toast.error("Please enter a valid 6-digit pincode");
      return;
    }

    setCheckingPincode(true);
    setDeliveryInfo({ status: "loading", message: "Checking..." });

    try {
      const data = await apiFetch(`/api/pincodes/check?pincode=${pincodeToCheck}`);

      // GTM tracking for pincode entry
      handlePromoClick('pincodeEntered', pincodeToCheck, {}, true);
      if (data.success && data.deliverable) {
        const dispatchMsg = calculateDispatchDate();
        setDeliveryInfo({
          status: "deliverable",
          message: dispatchMsg,
          coords: data.data?.latitude && data.data?.longitude ? { lat: data.data.latitude, lng: data.data.longitude } : null
        });
        // Store in global Redux for persistence
        document.cookie = `${USER_PINCODE_COOKIE}=${pincodeToCheck}; path=/; max-age=31536000; SameSite=Lax`;
        window.dispatchEvent(
          new CustomEvent("lucira:user-pincode", {
            detail: {
              pincode: pincodeToCheck,
            },
          })
        );
        dispatch(setPincode(pincodeToCheck));
      } else {
        setDeliveryInfo({
          status: "undeliverable",
          message: "Sorry, we do not deliver to this pincode yet.",
          coords: null
        });
      }
    } catch (err) {
      console.error("Pincode check error:", err);
      setDeliveryInfo({ status: "idle", message: "" });
      // Don't show toast on initial mount load
      if (typeof val !== 'string') toast.error("Error checking pincode. Please try again.");
    } finally {
      setCheckingPincode(false);
    }
  }, [localPincode, calculateDispatchDate, dispatch]);

  // Initial check for persisted pincode - ONLY ON MOUNT
  useEffect(() => {
    if (globalPincode && globalPincode.length === 6) {
      handlePincodeCheck(globalPincode);
    }
    // We only want this to run once when the page loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
  const applyPincode = (value) => {
    const cookiePincode = String(value || "")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (cookiePincode === localPincode) return;

    setLocalPincode(cookiePincode);

    if (cookiePincode.length === 6) {
      handlePincodeCheck(cookiePincode);
    }
  };

  const handleUserPincode = (event) => {
    applyPincode(event.detail?.pincode);
  };

  window.addEventListener(
    "lucira:user-pincode",
    handleUserPincode
  );

  return () =>
    window.removeEventListener(
      "lucira:user-pincode",
      handleUserPincode
    );
}, [handlePincodeCheck, localPincode]);

  // Update dispatch message when variant changes (size/color)
  useEffect(() => {
    if (deliveryInfo.status === "deliverable") {
      const dispatchMsg = calculateDispatchDate();
      setDeliveryInfo(prev => ({
        ...prev,
        message: dispatchMsg
      }));
    }
  }, [activeVariant, calculateDispatchDate, deliveryInfo.status]);

  // Handle Nearest Store Logic
  useEffect(() => {
    if (!allStores.length || !activeVariant) return;

    const tagMapping = {
      "Malad": ["divinecarat", "malad", "goregaon"],
      "Chembur": ["chembur", "cs1"],
      "Pune": ["pune", "ps1"],
      "Borivali": ["borivali", "bo1"],
      "Noida": ["noida", "nos18"]
    };

    const inStoreTags = activeVariant.metafields?.in_store_available || [];

    // 1. Identify which stores actually have stock
    const stockStoreIds = allStores.filter(store => {
      if (inStoreTags.includes(store.shopifyId)) return true;
      const storeNumericId = store.shopifyId.split("/").pop();
      if (inStoreTags.some(tag => String(tag).includes(storeNumericId))) return true;

      const storeNameLower = store.name.toLowerCase();
      const storeCityLower = (store.city || "").toLowerCase();
      
      return inStoreTags.some(tag => {
        const tagLower = String(tag).toLowerCase();
        if (tagLower.includes("gid://")) return false;
        const searchTerms = tagMapping[tag] || [tagLower];
        return searchTerms.some(term => storeNameLower.includes(term) || storeCityLower.includes(term));
      });
    }).map(s => s.shopifyId);

    setAvailableStoreCount(stockStoreIds.length);

    // 2. Prepare ALL stores with distance and stock status for the Side Sheet
    const storesWithData = allStores.map(store => {
      let distance = null;
      if (deliveryInfo.coords && (store.latitude || store.lat) && (store.longitude || store.lng)) {
        distance = calculateDistance(
          deliveryInfo.coords.lat,
          deliveryInfo.coords.lng,
          store.latitude || store.lat,
          store.longitude || store.lng
        );
      }
      return {
        ...store,
        distance,
        isInStock: stockStoreIds.includes(store.shopifyId)
      };
    });

    // Sort: Distance priority if coords exist, then stock status, then alphabetical
    storesWithData.sort((a, b) => {
      // 1. Distance priority if coords exist
      if (deliveryInfo.coords) {
        if (a.distance !== null && b.distance !== null) {
          if (a.distance !== b.distance) return a.distance - b.distance;
        } else if (a.distance !== null) {
          return -1;
        } else if (b.distance !== null) {
          return 1;
        }
      }

      // 2. Stock status priority
      if (a.isInStock && !b.isInStock) return -1;
      if (!a.isInStock && b.isInStock) return 1;

      // 3. Alphabetical fallback
      return a.name.localeCompare(b.name);
    });

    setAvailableStores(storesWithData);

    // 3. Find the nearest store for the main display (Absolute nearest)
    setNearestStore(storesWithData.length > 0 ? storesWithData[0] : null);
  }, [allStores, activeVariant, deliveryInfo.coords]);

  const rawTags = product.tags || [];
  const tags = Array.isArray(rawTags) ? rawTags : (typeof rawTags === 'string' ? rawTags.split(',').map(t => t.trim()) : []);

  const hasEngraving = tags?.some(tag => tag.toLowerCase() === "engraving available");
  const isGoldCoin = tags?.some(tag => tag.toLowerCase() === "gold coin");

  const slugify = (text) => text?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') || "";

  const productId = product.shopifyId || product.id || product.handle;
  const activeVariantId = activeVariant?.id || activeVariant?.shopifyId || "";
  const currentWishlistKey = `${getNumericId(productId)}-${getNumericId(activeVariantId)}`;
  const isWishlisted = productId ? wishlistItems.some((item) => `${getNumericId(item.productId)}-${getNumericId(item.variantId || "")}` === currentWishlistKey) : false;
  const recentlyViewedState = useSelector(selectRecentlyViewed);

  const handleSaveEngraving = () => {
    setSavedEngraving({ text: engraving, font: engravingFont });
    setIsEngravingDrawerOpen(false);
    handlePromoClick('Add Engraving Clicked', null, { location_id: getNumericId(activeVariant?.id) }, true);
  };

  const insertSymbol = (symbol) => {
    if (!engravingInputRef.current) return;

    const input = engravingInputRef.current;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const text = engraving;

    if (text.length >= 8) return;

    const newText = text.substring(0, start) + symbol + text.substring(end);
    setEngraving(newText.substring(0, 8));

    // Focus back and set cursor
    setTimeout(() => {
      input.focus();
      const newPos = start + symbol.length;
      input.setSelectionRange(newPos, newPos);
    }, 0);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mainAtcRef.current) return;

      console.log("Attaching Observer - Desktop Mode:", !isMobile);

      const observer = new IntersectionObserver(
        ([entry]) => {
          console.log("Observer Triggered!", entry.isIntersecting);
          const isPastPoint = entry.boundingClientRect.top < 0;

          if (isMobile) {
            setShowBottomAtc(!entry.isIntersecting);
          } else {
            if (entry.isIntersecting) {
              setShowTopAtc(false);
              setShowBottomAtc(false);
            } else if (isPastPoint) {
              setShowTopAtc(true);
              setShowBottomAtc(false);
            } else {
              setShowTopAtc(false);
              setShowBottomAtc(true);

            }
          }
        },
        { threshold: 0, rootMargin: "-10% 0px 0px 0px" }
      );

      observer.observe(mainAtcRef.current);

      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timer);
  }, [isMobile, product.id]);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchWishlist());
    }
  }, [user?.id, dispatch]);

  useEffect(() => {
    if (!product) return;

    dispatch(
      addRecentlyViewed({
        id: product.id,
        shopifyId: product.shopifyId,
        handle: product.handle,
        title: product.title,
        label: product.label,
        colors: product.colors,
        price: product.price,
        compare_price: product.compare_price || product.compareAtPrice,
        compareAtPrice: product.compare_price || product.compareAtPrice,
        description: product.description,
        tags: product.tags,
        images: product.images || (product.featuredImage ? [{ url: product.featuredImage, altText: product.title }] : []),
        variants: product.variants || [],
        media: product.media || [],
        reviews: product.reviews,
        reviewStats: reviewStats, // Use state which might be updated
        matchingProductIds: product.matchingProductIds,
        hasSimilar: true,
        diamondDiscount: product.diamondDiscount,
        makingDiscount: product.makingDiscount,
        productMetafields: product.productMetafields,
      })
    );
  }, [product, dispatch, reviewStats]);

  const hasSimilarItems = product.hasSimilar || (product.matchingProductIds && product.matchingProductIds.length > 0);

  const getStoreDisplayName = (name) => {
    if (!name) return "";
    if (name.includes("Divinecarat")) return "Malad";
    if (name === "BO1") return "Borivali";
    if (name === "CS1") return "Chembur";
    if (name === "PS1") return "Pune";
    if (name === "NOS18") return "Noida";
    return name;
  };

  const handleAddToCart = async () => {
    if (!activeVariant) {
      toast.error("Please select a variant");
      return;
    }

    setAddingToCart(true);
    try {
      // Calculate robust diamondCharges
      let finalDiamondCharges = priceBreakup?.raw_breakup?.diamond?.final || 0;
      
      // Fallback: Calculate from variant_config if priceBreakup is not ready
      if (finalDiamondCharges === 0) {
        try {
          const config = JSON.parse(activeVariant?.metafields?.variant_config || "{}");
          if (config.advanced_stone_config) {
            // This is a simplified calculation, but enough to trigger the > 0 check
            finalDiamondCharges = config.advanced_stone_config.reduce((acc, s) => acc + (s.stone_weight * 50000), 0);
          } else if (config.diamond_charges) {
            finalDiamondCharges = config.diamond_charges;
          }
        } catch(e) {}
      }

      // Calculate fallbacks from metafields
      const fallbackWeight = activeVariant?.metafields?.metal_weight || "0";
      const fallbackDiamondPcs = activeVariant?.metafields?.diamonds?.reduce((acc, d) => acc + (parseInt(d.pieces) || 0), 0) || 0;

      // Extract technical data from the breakup
      const raw = priceBreakup || {};

      const variantOptions = (product.variants || [])
        .filter((variant) => {
          if (!variant?.size || !variant?.color) return false;
          const vColor = String(variant.color).toLowerCase().trim();
          const targetColor = `${activeKarat} ${activeColor}`.toLowerCase().trim();
          return vColor === targetColor;
        })
        .map((variant) => ({
          variantId: variant.id,
          variantTitle: variant.title,
          size: variant.size,
          price: variant.price,
          inStock: Boolean(variant.inStock),
          sku: variant.sku || "",
          image: getValidSrc(variant.image || getColorSpecificImage(product, variant.color) || product.featuredImage),
        }))
        .sort((a, b) => Number(a.size) - Number(b.size));

      const productData = {
        id: product.id,
        shopifyId: product.shopifyId,
        handle: product.handle,
        title: product.title,
        variantId: activeVariant.id,
        variantTitle: activeVariant.title,
        sku: activeVariant.sku || "",
        price: activeVariant.price,
        image: getValidSrc(activeVariant.image || getColorSpecificImage(product, activeColor) || product.featuredImage || (product.media && product.media[0]?.url)),
        quantity: 1,
        inStock: Boolean(activeVariant.inStock),
        color: activeColor,
        karat: activeKarat,
        size: selectedSize,
        availableSizes: availableSizes,
        variantOptions,
        engraving: savedEngraving.text,
        // Requested technical fields
        engravingText: savedEngraving.text,
        engravingFont: savedEngraving.font,
        giftText: giftText,
        shippingDate: (() => {
          const date = new Date();
          date.setDate(date.getDate() + 10);
          const d = String(date.getDate()).padStart(2, "0");
          const m = String(date.getMonth() + 1).padStart(2, "0");
          const y = date.getFullYear();
          return `${d}/${m}/${y}`;
        })(),
        goldPricePerGram: raw?.raw_breakup?.metal?.rate_per_gram || 0,
        goldWeight: raw?.raw_breakup?.metal?.weight || parseFloat(fallbackWeight),
        goldPrice: raw?.raw_breakup?.metal?.cost || 0,
        makingCharges: raw?.raw_breakup?.making_charges?.final || 0,
        diamondCharges: finalDiamondCharges,
        gst: raw?.raw_breakup?.gst?.amount || 0,
        finalPrice: raw?.raw_breakup?.total || activeVariant.price,
        diamondTotalPcs: raw?.raw_breakup?.diamond?.pcs || fallbackDiamondPcs,
        metafields: activeVariant.metafields || {},
        hasVideo: Boolean(product.media?.some((m) => m.type === "VIDEO" || m.type === "EXTERNAL_VIDEO")),
        hasSimilar: Boolean(product.handle),
        reviews: product.reviews || null,
        comparePrice: activeVariant?.compare_price || product.compare_price || "",
        estDelivery: calculateDispatchDate(),
      };

      await dispatch(addToCart({ userId: user?.id, product: productData })).unwrap();

      //gtm            
      // Helper to extract numeric ID from Shopify GID
      const getNumericId = (gid) => {
        if (!gid) return 0;
        if (typeof gid === 'number') return gid;
        const match = String(gid).match(/\d+$/);
        return match ? Number(match[0]) : 0;
      };

      const productImageUrl = getValidSrc(activeVariant?.image || getColorSpecificImage(product, activeColor) || product.images?.[0]);
      const currentUrl = typeof window !== 'undefined' ? window.location.origin + `/products/${product.handle}` : "";

      const sellingPrice = Number(activeVariant?.price || product.price || 0);
      const originalPrice = Number(activeVariant?.compare_price || activeVariant?.compareAtPrice || product.compare_price || product.compareAtPrice || sellingPrice);

      pushAddToCart({
        eventId: `atc_${Date.now()}`,
        products: {
          productId: String(getNumericId(product.shopifyId || product.id)),
          variantId: getNumericId(activeVariant?.id || activeVariant?.shopifyId),
          sku: activeVariant?.sku || product?.sku || activeVariant?.variantSku || product?.variantSku || (product?.variants && product?.variants[0]?.sku) || "",
          productName: product.title,
          productType: product.type || "",
          vendor: product.vendor || "Lucira Jewelry",
          offerPrice: String(originalPrice.toFixed(2)),
          productUrl: currentUrl,
          image: productImageUrl,
          price: Number(sellingPrice),
          category: "",
          subCategory: "",
          productPersona: ""
        }
      });
      //gtm

      toast.success("Added to cart!");
      router.push("/checkout/cart");
    } catch (err) {
      console.error("Add to cart failed:", err);
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!productId) {
      toast.error("Unable to save this product");
      return;
    }

    setWishlistLoading(true);
    try {
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : "";
      const thumbnailImage = getValidSrc(activeVariant?.image || getColorSpecificImage(product, activeColor) || product.images?.[0]?.url || product.featuredImage || (product.media && product.media[0]?.url));
      const commonTrackingData = getStandardWishlistPayload(product, activeVariant, currentOrigin, thumbnailImage);

      if (isWishlisted) {
        if (user?.id) {
          await dispatch(removeWishlistItem({ productId, variantId: activeVariantId })).unwrap();
        } else {
          dispatch(removeGuestWishlistItem({ productId, variantId: activeVariantId }));
        }
        pushRemoveFromWishlist(commonTrackingData);
        toast.error("Removed from wishlist", {
          icon: <Check className="w-4 h-4" />
        });
      } else {
        const payload = {
          productId,
          variantId: activeVariantId,
          variantTitle: activeVariant?.title || "",
          size: selectedSize || "",
          color: activeColor || "",
          karat: activeKarat || "",
          productHandle: product.handle || "",
          title: product.title,
          image: thumbnailImage,
          price: activeVariant?.price || product.price || "",
          comparePrice: activeVariant?.compare_price || product.compare_price || "",
          reviews: product.reviews || null,
          hasVideo: Boolean(product.media?.some((m) => m.type === "VIDEO" || m.type === "EXTERNAL_VIDEO")),
          hasSimilar: Boolean(product.handle),
        };

        if (user?.id) {
          await dispatch(addWishlistItem(payload)).unwrap();
        } else {
          dispatch(addGuestWishlistItem(payload));
        }

        pushAddToWishlist(commonTrackingData);
        toast.success("Saved to wishlist");
      }
    } catch (err) {
      console.error("Wishlist update failed:", err);
      toast.error(err.message || "Wishlist update failed");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handlePromoClick = useCallback((creativeName, promoPosition = 'Product Details Section', extraData = {}, isMinimal = false) => {
    if (isMinimal) {
      const promoData = {
        promo_id: activeVariant?.sku || product?.sku || "",
        promo_name: product.title,
        creative_name: creativeName,
        ...extraData
      };

      // If promoPosition is provided and it's not the default, add it to promoData
      if (promoPosition && promoPosition !== 'Product Details Section') {
        promoData.promo_position = promoPosition;
      }

      pushPromoClick(promoData);
      return;
    }

    const raw = priceBreakup?.raw_breakup || {};

    const promoData = {
      // Promotion Info
      creative_name: creativeName,
      promo_id: activeVariant?.sku || product?.sku || "",
      promo_name: product.title,
      promo_position: promoPosition,

      // Product Info
      product_id: getNumericId(product.shopifyId || product.id),
      product_name: product.title,
      sku: activeVariant?.sku || "",
      variant_id: getNumericId(activeVariant?.id),
      location_id: getNumericId(activeVariant?.id),

      // URL & Image
      product_url: typeof window !== 'undefined' ? window.location.href : "",
      product_image: getValidSrc(activeVariant?.image || getColorSpecificImage(product, activeColor) || product.featuredImage || (product.media && product.media[0]?.url)),

      // Pricing
      // price: Number(activeVariant?.compare_price || activeVariant?.compareAtPrice || product.compare_price || product.compareAtPrice || activeVariant?.price || product.price || 0),
      price: Number(activeVariant?.price || product.price || 0),
      offer_price: Number(raw?.original_total || activeVariant?.compare_price || activeVariant?.price || 0),

      // Price Breakup Values
      metal_label: (activeVariant?.metafields?.metal_purity || activeKarat) + ' ' + (activeVariant?.metafields?.metal_color || activeColor),
      gold_rate_per_g: (raw?.metal?.rate_per_gram || 0),
      metal_price: (raw?.metal?.cost || 0),

      diamond_price_original: (raw?.diamond?.original || 0),
      diamond_price_final: (raw?.diamond?.final || 0),
      diamond_discount_percent: raw?.diamond?.discount_percent || 0,
      diamond_pcs: raw?.diamond?.pcs || 0,

      making_charges_original: (raw?.making_charges?.original || 0),
      making_charges_final: (raw?.making_charges?.final || 0),
      making_charges_discount_pct: raw?.making_charges?.discount_percent || 0,

      gst_percent: raw?.gst?.percent || 0,
      gst_amount: (raw?.gst?.amount || 0),

      gemstone_price_original: (raw?.gemstone?.original || 0),
      gemstone_price_final: (raw?.gemstone?.final || 0),
      gemstone_pcs: raw?.gemstone?.pcs || 0,

      grand_total: (raw?.total || activeVariant?.price || product.price),

      // Savings (only for savings tab)
      savings_amount: (extraData.savings_amount || 0),

      // Optional
      email: '',
      phone: '',

      ...extraData
    };

    pushPromoClick(promoData);
  }, [product, activeVariant, activeColor, activeKarat, priceBreakup]);

  // Update active variant when selection changes
  useEffect(() => {
    const variant = findMatchingVariant(activeColor, activeKarat, selectedSize);
    if (variant) setActiveVariant(variant);
  }, [activeColor, activeKarat, selectedSize, findMatchingVariant]);

  // Fetch variant pricing when active variant changes
  useEffect(() => {
    if (!activeVariant?.id) return;

    const vid = getNumericId(activeVariant.id);
    const pid = getNumericId(product.shopifyId || product.id);
    // Capture the variantId at the time of fetch to tag the result
    const snapshotId = String(activeVariant.id);

    fetchVariantPricing(vid, pid)
      .then((data) => {
        // Tag the response with the activeVariant.id so comparison is reliable
        setPriceBreakup({ ...data, variantId: snapshotId });
      })
      .catch((err) => {
        console.error("Pricing fetch failed", err);
      });
  }, [activeVariant, product.shopifyId, product.id]);

  // Toast notification on price update
  useEffect(() => {
    if (activeVariant && shouldToastVariantChange.current) {
      shouldToastVariantChange.current = false;
      toast.info(`Price updated: ₹${formatPrice(activeVariant.price)}${activeVariant.compare_price ? ` (was ₹${formatPrice(activeVariant.compare_price)})` : ''}`, {
        position: "bottom-center",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        theme: "light",
      });
    }
  }, [activeVariant]);

  // Product View GTM Trigger
  useEffect(() => {
    if (activeVariant || product) {
      const getNumericId = (gid) => {
        if (!gid) return 0;
        if (typeof gid === 'number') return gid;
        const match = String(gid).match(/\d+$/);
        return match ? Number(match[0]) : 0;
      };

      const productImageUrl = getValidSrc(activeVariant?.image || getColorSpecificImage(product, activeColor) || product.images?.[0]);
      const currentUrl = typeof window !== 'undefined' ? window.location.origin + `/products/${product.handle}` : "";

      const sellingPrice = Number(activeVariant?.price || product.price || 0);
      const originalPrice = Number(activeVariant?.compare_price || activeVariant?.compareAtPrice || product.compare_price || product.compareAtPrice || sellingPrice);

      pushProductView({
        productId: getNumericId(product.shopifyId || product.id),
        sku: activeVariant?.sku || "",
        variantId: getNumericId(activeVariant?.id || activeVariant?.shopifyId),
        vendorCode: product.vendor || "Lucira Jewelry",
        productName: product.title,
        productType: product.type || "",
        category: product.type || "",
        productUrl: currentUrl,
        productUrlw: `/products/${product.handle}`,
        thumbnailImage: productImageUrl,
        image: productImageUrl,
        price: sellingPrice,
        offerPrice: originalPrice,
      });
    }
  }, [activeVariant, product]);

  // Scroll to top on mount/refresh
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  const fetchSimilar = async () => {
    if (similarProducts.length > 0) {
      setShowSimilar(true);
      return;
    }

    setLoadingSimilar(true);
    setShowSimilar(true);
    try {
      const data = await apiFetch(`/api/products/related?handle=${product.handle}`);
      const relatedProducts = data.products || data.matchingProducts || data.complementaryProducts || [];
      const validProducts = relatedProducts.filter(p => p.handle !== product.handle);
      setSimilarProducts(validProducts);
    } catch (e) {
      console.error("Failed to fetch similar products", e);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const handleGoldSelection = (metal, karat) => {
    if (metal === activeColor && karat === activeKarat) return;

    shouldToastVariantChange.current = true;
    setActiveColor(metal);
    setActiveKarat(karat);

    let variant = findMatchingVariant(metal, karat, selectedSize);
    
    // If exact match with current size isn't found, pick the first available variant for this color
    if (!variant) {
      variant = product.variants?.find(v => {
        const vColor = String(v.color || "").toLowerCase().trim();
        const vKarat = String(v.metafields?.metal_purity || "").toLowerCase().trim();
        const vMetal = String(v.metafields?.metal_color || "").toLowerCase().trim();
        
        const targetKarat = String(karat || "").toLowerCase().trim();
        const targetMetal = String(metal || "").toLowerCase().trim();
        const targetColorFull = `${karat} ${metal}`.toLowerCase().trim();
        const targetColorSimple = `${metal}`.toLowerCase().trim();

        const metaMatch = vKarat && vMetal ? (vKarat === targetKarat && vMetal === targetMetal) : false;
        const colorMatch = vColor === targetColorFull || vColor === targetColorSimple;

        return (metaMatch || colorMatch) && v.inStock;
      }) || product.variants?.find(v => {
        const vColor = String(v.color || "").toLowerCase().trim();
        const vKarat = String(v.metafields?.metal_purity || "").toLowerCase().trim();
        const vMetal = String(v.metafields?.metal_color || "").toLowerCase().trim();
        
        const targetKarat = String(karat || "").toLowerCase().trim();
        const targetMetal = String(metal || "").toLowerCase().trim();
        const targetColorFull = `${karat} ${metal}`.toLowerCase().trim();
        const targetColorSimple = `${metal}`.toLowerCase().trim();

        const metaMatch = vKarat && vMetal ? (vKarat === targetKarat && vMetal === targetMetal) : false;
        const colorMatch = vColor === targetColorFull || vColor === targetColorSimple;

        return metaMatch || colorMatch;
      });
    }

    if (variant) {
      setActiveVariant(variant);
      if (variant.size && variant.size !== selectedSize) {
        setSelectedSize(variant.size);
      }
    }
  };

  const handleSizeSelection = (size) => {
    if (size === selectedSize) return;

    shouldToastVariantChange.current = true;
    setSelectedSize(size);

    const variant = findMatchingVariant(activeColor, activeKarat, size);
    if (variant) setActiveVariant(variant);
  };

  // Helper to check if a specific color/karat combo is in stock (for any size)
  const isColorInStock = (metal, karat) => {
    return product.variants?.some(v => {
      const vColor = String(v.color || "").toLowerCase().trim();
      const targetColor = `${karat} ${metal}`.toLowerCase().trim();
      return vColor === targetColor && v.inStock;
    });
  };

  // Helper to check if a specific size is in stock (for current color/karat)
  const isSizeInStock = (size) => {
    return product.variants?.some(v => {
      const vColor = String(v.color || "").toLowerCase().trim();
      const targetColor = `${activeKarat} ${activeColor}`.toLowerCase().trim();
      return vColor === targetColor && String(v.size) === String(size) && v.inStock;
    });
  };

  // Extract unique sizes from variants and sort them numerically
  const availableSizes = Array.from(new Set(product.variants?.map(v => v.size) || []))
    .sort((a, b) => Number(a) - Number(b));

  // Get current display price from active variant or product, prioritized by dynamic breakup API if available
  const currentPrice = (priceBreakup && String(priceBreakup.variantId) === String(activeVariant?.id))
    ? priceBreakup.price
    : (activeVariant ? activeVariant.price : product.price);

  const currentComparePrice = (priceBreakup && String(priceBreakup.variantId) === String(activeVariant?.id))
    ? (priceBreakup.raw_breakup?.original_total || (activeVariant ? activeVariant.compare_price : product.compare_price))
    : (activeVariant ? activeVariant.compare_price : product.compare_price);
  // const mounted = useMounted();
  const isMobileView = useMediaQuery("(max-width: 1023px)");
  // if (!mounted) return null;

  const renderEngravingContent = () => (
    <div className="flex-1 overflow-y-auto">
      {/* Ring Preview */}
      <div className="relative w-full aspect-[16/9] bg-[#F9F9F9] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/engraving_bg.jpg"
          alt="Ring band preview"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {engraving && (
            <div
              style={{
                fontFamily: `var(--font-${engravingFont.toLowerCase()})`,
                textShadow: "1px 1px 1.5px rgba(255,255,255,0.8), -0.5px -0.5px 1px rgba(0,0,0,0.15)"
              }}
              className="text-gray-800 text-xl sm:text-2xl tracking-[0.15em] opacity-80 italic -translate-y-9 sm:-translate-y-9"
            >
              {engraving}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-medium text-black leading-relaxed">
            <span className="font-bold text-gray-900">Note:</span> Text can only contain up to 8 English/alphanumeric characters (A-Z, a-z, 0-9) and special characters (heart and infinity).
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="text-base font-bold text-gray-900">Choose a Font <span className="text-rose-500">*</span></h4>
          <div className="grid grid-cols-2 gap-3">
            {["Lobster", "Yellowtail", "Satisfy", "ABeeZee"].map((font) => (
              <button
                key={font}
                onClick={() => setEngravingFont(font)}
                className={`px-2 py-3 rounded-sm border text-lg transition-all duration-300 ${engravingFont === font
                  ? "border-black bg-zinc-900 text-white shadow-md scale-[1.02]"
                  : "border-gray-200 text-gray-600 hover:border-gray-400 bg-white"
                  }`}
              >
                <span style={{ fontFamily: `var(--font-${font.toLowerCase()})` }} className="text-base">Aa - {font}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-base font-bold text-gray-900">Inner Engraving <span className="text-rose-500">*</span></h4>
            <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
              {engraving.length}/8 Characters
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Input
                ref={engravingInputRef}
                value={engraving}
                maxLength={8}
                onChange={(e) => setEngraving(e.target.value)}
                placeholder="Type your text here"
                className="h-14 border-gray-300 pr-4 text-lg focus-visible:ring-2 rounded-sm"
                style={{ fontFamily: `var(--font-${engravingFont.toLowerCase()})` }}
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => insertSymbol("♥")}
                className="w-12 h-12 flex items-center justify-center border-2 border-zinc-100 rounded-sm hover:border-black hover:bg-zinc-50 transition-all active:scale-95"
                title="Insert Heart"
              >
                <span className="text-2xl text-black">♥</span>
              </button>
              <button
                onClick={() => insertSymbol("∞")}
                className="w-12 h-12 flex items-center justify-center border-2 border-zinc-100 rounded-sm hover:border-black hover:bg-zinc-50 transition-all active:scale-95"
                title="Insert Infinity"
              >
                <span className="text-2xl text-black">∞</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`w-full ${lobster.variable} ${yellowtail.variable} ${satisfy.variable} ${abeezee.variable}`}>
      <AtcBar
        isTopVisible={showTopAtc}
        isBottomVisible={showBottomAtc}
        product={product}
        activeVariant={activeVariant}
        schemeData={schemeData}
        onAddToCart={handleAddToCart}
        addingToCart={addingToCart}
        onToggleWishlist={handleToggleWishlist}
        isWishlisted={isWishlisted}
        wishlistLoading={wishlistLoading}
      />
      <div className="w-[91%] lg:w-full lg:max-w-480 mx-auto lg:px-17">
        {/* Breadcrumb */}
        <Breadcrumb className="py-5">
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem>
              <BreadcrumbLink href="/collections" className="text-sm font-medium text-black">Collections</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator><ChevronRight size={14} /></BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/collections/${slugify(product.type)}`} className="text-sm font-medium text-black whitespace-nowrap">{product.type}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator><ChevronRight size={14} /></BreadcrumbSeparator>
            <BreadcrumbItem className="text-sm font-medium text-gray-400 truncate line-clamp-1">
              {product.title}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_420px] 2xl:grid-cols-[1fr_530px] gap-10 items-start">
          {/* Left: Product Gallery */}
          <ProductGallery
            media={product.media || []}
            title={product.title}
            activeColor={activeColor}
            onViewSimilar={fetchSimilar}
            hasSimilar={true}
            product={product}
            activeVariant={activeVariant}
          />
          {/* Right: Product Info */}
          <div className="w-full">
            <div className="space-y-4">
              {/* Title */}
              <div className="w-full">
                <div className="space-y-3">
                  <h1 className="text-xl font-bold leading-[1.2] tracking-tight">
                    {product.title}
                  </h1>
                  <div className="flex justify-between gap-2 items-center">
                    {(() => {
                      const variantMeta = activeVariant?.metafields;
                      const prodMeta = product.productMetafields;
                      const pricingDiamond = priceBreakup?.diamond_info;
                      const ornaverseComp = parseOrnaverseComponent(variantMeta?.components || prodMeta?.components);

                      // Find the first diamond component for summary display
                      const firstDiamond = ornaverseComp?.components?.find(c =>
                        (c.item_group_name === "Diamond" || (c.quality_code && c.quality_code !== "NA")) && (parseFloat(c.weight) > 0 || parseInt(c.pieces) > 0)
                      );

                      const variantDiamonds = variantMeta?.diamonds?.filter(d => parseFloat(d.weight) > 0 || parseInt(d.pieces) > 0) || [];
                      const isDiamondProduct = !!firstDiamond || variantDiamonds.length > 0 || (!!pricingDiamond && (parseFloat(pricingDiamond.carat) > 0 || parseInt(pricingDiamond.pcs) > 0));

                      const parts = [];

                      if (isDiamondProduct) {
                        // 1. Diamond Quality
                        const quality = (firstDiamond?.quality_code && firstDiamond?.stone_color_code && firstDiamond.quality_code !== "NA" && firstDiamond.stone_color_code !== "NA")
                          ? `${firstDiamond.quality_code}, ${firstDiamond.stone_color_code}`
                          : (firstDiamond?.purity || variantDiamonds[0]?.quality || (pricingDiamond?.color && pricingDiamond?.clarity ? `${pricingDiamond.clarity}, ${pricingDiamond.color}` : pricingDiamond?.title) || prodMeta?.quality);

                        // 2. Diamond Carat
                        const carat = variantDiamonds[0]?.weight
                          ? `${variantDiamonds[0].weight}ct`
                          : (firstDiamond?.weight ? `${firstDiamond.weight}ct` : (pricingDiamond?.carat ? `${pricingDiamond.carat}ct` : prodMeta?.carat_range));

                        if (quality && quality !== "NA") parts.push(quality);
                        if (carat && carat !== "NA" && !String(carat).startsWith("0ct")) parts.push(carat);
                      }

                      // If no diamond parts were added, or it's not a diamond product, show metal purity
                      if (parts.length === 0) {
                        const metalPurity = variantMeta?.metal_purity || activeKarat;
                        if (metalPurity) parts.push(metalPurity);
                      }

                      // 3. Metal Weight
                      const weightVal = variantMeta?.metal_weight || prodMeta?.weight;
                      const weight = weightVal ? `${weightVal}${String(weightVal).toLowerCase().includes('g') ? '' : 'g'}` : null;
                      if (weight) parts.push(weight);

                      if (parts.length === 0) return null;

                      return (
                        <p className="font-figtree text-[10px] lg:text-sm font-medium text-gray-800 uppercase tracking-tight">
                          {parts.join(" · ")}
                        </p>
                      );
                    })()}
                    {/* Rating */}
                    {(reviewStats.count > 0) && (
                      <div
                        className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleSafeScroll(reviewsRef)}
                      >
                        <Star
                          size={14}
                          fill="currentColor"
                          className="text-amber-400"
                        />
                        <span className="font-figtree text-[10px] lg:text-sm font-semibold text-gray-800 uppercase tracking-tight">
                          {parseFloat(reviewStats.average).toFixed(1)} ({reviewStats.count})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="w-full">
                <div className="flex flex-row flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <span className="text-lg sm:text-xl md:text-2xl font-bold">&#8377;{formatPrice(currentPrice)}</span>
                    {currentComparePrice > currentPrice && (
                      <span className="text-sm sm:text-base md:text-lg text-gray-500 line-through font-medium">
                        &#8377;{formatPrice(currentComparePrice)}
                      </span>
                    )}
                    {currentComparePrice > currentPrice && (
                      <span className="shrink-0 bg-gray-100 text-black text-xs sm:text-sm md:text-base font-semibold px-2.5 sm:px-3 py-1 rounded-full">
                        {Math.round((1 - currentPrice / currentComparePrice) * 100)}% OFF
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleSafeScroll(productDetailsRef)}
                    className="text-xs sm:text-sm font-semibold underline underline-offset-4 decoration-gray-300 hover:cursor-pointer sm:ml-auto whitespace-nowrap">
                    See Savings Breakup
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-gray-400 font-medium tracking-tight mt-2">
                  Inclusive of all taxes.
                </p>
              </div>

              {/* Savings Banners Slider */}
              {(() => {
                const raw = priceBreakup?.raw_breakup;
                const diamondDiscount = raw?.diamond?.discount_percent || 0;
                const mcDiscount = raw?.making_charges?.discount_percent || 0;
                const isDiamondJewelry = (raw?.diamond?.final || 0) > 0;
                const currentTotalPrice = activeVariant?.price || 0;
                const isGoldCoinEligible = isDiamondJewelry && currentTotalPrice >= goldCoinConfig.threshold;

                const slides = [];
                if (diamondDiscount > 0) {
                  slides.push({
                    icon: "💎",
                    text: <>You&apos;re saving flat <span className="font-extrabold text-black">{diamondDiscount}% OFF</span> on diamond prices.</>
                  });
                }
                if (mcDiscount > 0) {
                  slides.push({
                    icon: "⚒️",
                    text: <>You&apos;re saving flat <span className="font-extrabold text-black">{mcDiscount}% OFF</span> on making charges.</>
                  });
                }
                if (isGoldCoinEligible && goldCoinConfig.enabled) {
                  slides.push({
                    icon: "🪙",
                    text: <>{goldCoinConfig.message || "Complimentary Gold Coin available on this order"}</>
                  });
                }

                if (slides.length === 0) return null;

                return (
                  <div className="w-full">
                    <Swiper
                      modules={[Autoplay]}
                      spaceBetween={16}
                      slidesPerView={'auto'}
                      speed={1800}
                      loopPreventsSliding
                      autoplay={{ delay: 3000, disableOnInteraction: false }}
                      loop={slides.length > 2}
                      className="w-full"
                    >
                      {slides.map((slide, idx) => (
                        <SwiperSlide key={`promo-slide-${idx}`} style={{ width: 'auto', display: 'flex' }}>
                          <div className="border border-dashed border-gray-400 rounded-lg px-3 py-3 flex items-center gap-2 bg-secondary/50 h-full w-fit whitespace-nowrap">
                            <span className="text-base shrink-0">{slide.icon}</span>
                            <p className="text-sm font-semibold text-black whitespace-normal md:whitespace-nowrap">
                              {slide.text}
                            </p>
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                );
              })()}
              <Separator />
            </div>

            <div className="space-y-6 mt-4">
              {/* Mobile Customizer */}
              <ProductCustomizerMobile
                activeColor={activeColor}
                activeKarat={activeKarat}
                selectedSize={selectedSize}
                handleGoldSelection={handleGoldSelection}
                handleSizeSelection={handleSizeSelection}
                availableSizes={availableSizes}
                product={product}
                isColorInStock={isColorInStock}
                isSizeInStock={isSizeInStock}
                nearestStore={nearestStore}
                availableStores={availableStores}
                availableStoreCount={availableStoreCount}
                deliveryInfo={deliveryInfo}
                getStoreDisplayName={getStoreDisplayName}
              />

              {/* Desktop Selection Blocks */}
              <div className="hidden lg:block space-y-6">
                {/* Gold Selection */}
                <div className="space-y-3">
                  <div className="text-base font-bold">
                    Select Gold Color & Karat: <span className="text-gray-500 font-medium ml-1">{activeKarat} {activeColor}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(() => {
                      const combinations = [];
                      product.variants?.forEach(v => {
                        const karat = v.metafields?.metal_purity || String(v.color || v.title || "").split(" ")[0];
                        const metal = v.metafields?.metal_color || String(v.color || v.title || "").split(" ").slice(1).join(" ");
                        
                        if (karat && metal && !combinations.find(c => c.karat === karat && c.metal === metal)) {
                           combinations.push({ karat, metal });
                        }
                      });

                      // Sort combinations based on collection context
                      const handles = product.collectionHandles || [];
                      const isStrict9kt = collectionContext === "9kt-collection" &&
                        handles.includes("9kt-collection") &&
                        !handles.some(h => h !== "9kt-collection" && h !== "all" && h !== product.type?.toLowerCase() &&
                          ["sports-collection", "cotton-candy", "hexa-collection", "solitaire-collection"].includes(h));

                      const karatOrder = ["9KT", "14KT", "18KT"];
                      const metalOrder = ["Yellow Gold", "Rose Gold", "White Gold"];

                      combinations.sort((a, b) => {
                        const aKaratVal = parseInt(String(a.karat).replace(/\D/g, ""), 10) || 0;
                        const bKaratVal = parseInt(String(b.karat).replace(/\D/g, ""), 10) || 0;

                        if (aKaratVal !== bKaratVal) return aKaratVal - bKaratVal;

                        const aMetalIdx = metalOrder.findIndex(m => a.metal.toLowerCase().includes(m.split(" ")[0].toLowerCase()));
                        const bMetalIdx = metalOrder.findIndex(m => b.metal.toLowerCase().includes(m.split(" ")[0].toLowerCase()));
                        
                        return (aMetalIdx === -1 ? 99 : aMetalIdx) - (bMetalIdx === -1 ? 99 : bMetalIdx);
                      });
                      const colorMap = {
                        yellow: "linear-gradient(147.45deg, #c59922 17.98%, #ead59e 48.14%, #c59922 83.84%)",
                        rose: "linear-gradient(154.36deg, #f2b5b5 10.36%, #f8dbdb 68.09%)",
                        white: "linear-gradient(143.06deg, #dfdfdf 29.61%, #f3f3f3 48.83%, #dfdfdf 66.43%)",
                      };

                      return combinations.map(({ karat, metal }) => {
                        let colorClass = colorMap.yellow;
                        if (metal.includes("White")) colorClass = colorMap.white;
                        if (metal.includes("Rose")) colorClass = colorMap.rose;

                        return (
                          <GoldOption
                            key={`${karat}-${metal}`}
                            metal={metal}
                            karat={karat}
                            onClick={handleGoldSelection}
                            active={activeColor === metal && activeKarat === karat}
                            color={colorClass}
                            inStock={isColorInStock(metal, karat)}
                          />
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Ring Size */}
                <div className="space-y-4">
                  {availableSizes.length > 0 && availableSizes[0] !== null && availableSizes[0] !== undefined && (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-base">Select {(product.type || "").replace(/s$/, "")} Size: <span className="font-medium ml-1">{selectedSize} IND</span></span>
                        {String(product.type || "").toLowerCase().includes("ring") && (
                          <SizeGuideSheet>
                            <button
                              className="text-sm font-medium underline underline-offset-4 decoration-gray-300 hover:cursor-pointer"
                              onClick={() => handlePromoClick('Size Guide Clicked', null, {}, true)}
                            >
                              Size Guide
                            </button>
                          </SizeGuideSheet>
                        )}
                      </div>

                      {String(product.type || "").toLowerCase().includes("ring") && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="bg-[#F8F9FA] rounded-lg flex items-center gap-4 px-4 py-2.5 border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                              <div className="bg-white rounded-lg shadow-sm">
                                <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Sizing_A_ring_thumb_fead0dba-6cb0-4c0c-95d1-e0b673d42401.jpg" alt="Video Icon" aspect-ratio="3/4" width={60} height={25} />
                                {/* <Video size={16} fill="black" /> */}
                              </div>
                              <span className="text-base text-black">
                                Watch this quick video to measure your ring right.
                              </span>
                            </div>
                          </DialogTrigger>

                          <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden border-none bg-transparent shadow-none">
                            <DialogHeader className="sr-only">
                              <DialogTitle>Ring Measurement Tutorial</DialogTitle>
                            </DialogHeader>

                            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                              <video
                                src="https://cdn.shopify.com/videos/c/o/v/b6bd45e165384f7bb50a9598b5986822.mp4"
                                className="w-full h-full"
                                autoPlay
                                muted
                                playsInline
                                controls
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      <div className={product.type === "Bracelets" ? 'grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-4' : "grid grid-cols-7 gap-4"}>
                        {availableSizes.map(sizeStr => {
                          const inStock = isSizeInStock(sizeStr);
                          return (
                            <button
                              key={`size-${sizeStr}`}
                              onClick={() => handleSizeSelection(sizeStr)}
                              className={`relative border rounded-md h-10 px-0.5 flex items-center justify-center text-sm transition-all ${sizeStr === selectedSize
                                ? "border-primary bg-white ring-1 ring-primary font-bold"
                                : "border-gray-200 hover:border-primary font-normal"
                                }`}
                            >
                              {sizeStr}
                              {inStock && <span className="absolute top-1 left-1 w-1.5 h-1.5 bg-[#2DB36F] rounded-full"></span>}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-sm text-black font-medium">Didn&apos;t get the size right? We&apos;ll exchange it.</p>
                    </>
                  )}
                  {activeVariant?.inStock ? (
                    <div className="bg-[#ECF7F2] border border-[#B3E1CD] text-black rounded-lg px-4 py-3 flex items-center gap-1 xl:flex-nowrap lg:flex-wrap">
                      <span className="w-2.5 h-2.5 bg-[#189351] rounded-full"></span>
                      <span className="font-semibold xl:basis-auto lg:basis-full">This combination is in-stock. {calculateDispatchDate()}</span>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 text-black rounded-lg px-4 py-3 flex items-center gap-1 xl:flex-nowrap lg:flex-wrap">
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                      <span className="font-semibold xl:basis-auto lg:basis-full">This combination will be made to order. {calculateDispatchDate()}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />
            </div>

            {/* Engraving */}
            {hasEngraving && (
              <div className="mt-4 mb-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-base">Complimentary Engraving (optional)</h3>
                  <p className="text-sm text-black leading-relaxed font-medium">
                    Personalise your ring with a custom engraving. Your chosen message will
                    be carefully laser-engraved on the inner band.
                  </p>
                </div>

                <div className="flex gap-4 items-center mt-4 group cursor-pointer" onClick={() => {
                  setIsEngravingDrawerOpen(true);
                }}>
                  <div className="relative flex-1">
                    <div className="h-12 bg-white border border-gray-300 rounded-md px-4 flex items-center text-gray-400 text-sm group-hover:border-primary transition-colors">
                      {savedEngraving.text ? (
                        <span style={{ fontFamily: `var(--font-${savedEngraving.font.toLowerCase()})` }} className="text-black text-base">
                          {savedEngraving.text}
                        </span>
                      ) : (
                        "Type your text here"
                      )}
                    </div>
                    <Button variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 group-hover:text-primary">
                      ENGRAVE
                    </Button>
                  </div>
                </div>

                {isMobile ? (
                  <MobileSheet
                    isOpen={isEngravingDrawerOpen}
                    onClose={() => setIsEngravingDrawerOpen(false)}
                    detents={[0.9]}
                  >
                    <MobileSheet.Container className={`z-[499] ${lobster.variable} ${yellowtail.variable} ${satisfy.variable} ${abeezee.variable}`}>
                      <MobileSheet.Header />
                      <MobileSheet.Content>
                        <div className="flex flex-col h-full">
                          <div className="flex items-center justify-between px-4 pb-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold">Engraving</h2>
                            <button onClick={() => setIsEngravingDrawerOpen(false)} className="p-2">
                              <X size={20} className="text-gray-400" />
                            </button>
                          </div>
                          {renderEngravingContent()}
                          <div className="p-3 border-t border-gray-100">
                            <Button
                              onClick={handleSaveEngraving}
                              className="w-full h-12 font-bold rounded-sm bg-tertiary uppercase tracking-wider disabled:opacity-50"
                              disabled={!engraving}
                            >
                              SAVE
                            </Button>
                          </div>
                        </div>
                      </MobileSheet.Content>
                    </MobileSheet.Container>
                    <MobileSheet.Backdrop />
                  </MobileSheet>
                ) : (
                  <Sheet open={isEngravingDrawerOpen} onOpenChange={setIsEngravingDrawerOpen}>
                    <SheetContent showCloseButton={false} side="right" className={`w-full sm:max-w-[450px] p-0 flex flex-col ${lobster.variable} ${yellowtail.variable} ${satisfy.variable} ${abeezee.variable}`}>
                      <SheetHeader className="p-6 border-b border-gray-100 flex flex-row items-center justify-between space-y-0">
                        <SheetTitle className="text-lg font-bold">Engraving</SheetTitle>
                        <SheetClose asChild>
                          <button className="text-zinc-400 hover:text-black transition-colors hover:cursor-pointer p-1">
                            <X size={22} strokeWidth={1.5} />
                          </button>
                        </SheetClose>
                      </SheetHeader>

                      {renderEngravingContent()}

                      <div className="p-6 border-t border-gray-100">
                        <Button
                          onClick={handleSaveEngraving}
                          className="w-full h-12 font-bold rounded-sm bg-tertiary uppercase tracking-wider disabled:opacity-50"
                          disabled={!engraving}
                        >
                          SAVE
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                )}

                {savedEngraving.text && (
                  <div className="mt-3 flex items-center gap-2 text-primary font-semibold text-sm bg-primary/5 w-fit px-3 py-1.5 rounded-full border border-primary/10">
                    <Check size={14} />
                    Engraving Saved:
                    <span style={{ fontFamily: `var(--font-${savedEngraving.font.toLowerCase()})` }} className="ml-1 text-base underline decoration-dotted">
                      {savedEngraving.text}
                    </span>
                    <button
                      onClick={() => {
                        setSavedEngraving({ text: "", font: "" });
                        setEngraving("");
                      }}
                      className="ml-2 p-1 hover:bg-primary/10 rounded-sm transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2 mb-4">
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
                                    alt={item.title || "Similar product"}
                                    fill
                                    unoptimized={String(item.image).includes("cdn.shopify.com") || String(item.image).includes("myshopify.com")}
                                    className="w-full h-full object-contain p-4 mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
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
            </div>

            <div ref={mainAtcRef} className="space-y-2 mb-4">
              <div className="flex gap-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="flex-1 h-14 text-[14px] sm:text-base lg:text-lg font-bold rounded-md hover:cursor-pointer tracking-wider"
                >
                  {addingToCart ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ADDING...
                    </>
                  ) : "ADD TO CART"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleWishlist}
                  disabled={wishlistLoading}
                  className={`h-14 w-14 shrink-0 rounded-md bg-gray-50 hover:cursor-pointer ${isWishlisted ? "text-rose-500" : "text-black"}`}
                >
                  <Heart
                    size={24}
                    fill={isWishlisted ? "currentColor" : "none"}
                    className={`${isWishlisted ? "text-rose-500" : "text-black"}`}
                  />
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Button asChild variant="outline" className={`h-14 flex items-center justify-center bg-gray-50 hover:cursor-pointer hover:bg-primary hover:text-white transition-all group px-0 shrink-0 ${schemeData ? 'w-14 rounded-md' : 'flex-1 gap-2 rounded-md'}`}>
                  <a href={`https://api.whatsapp.com/send/?phone=+919004435760&text=Hi%2C+I+want+to+get+more+information+about+this+product%3A+${encodeURIComponent(product?.title || '')}&type=phone_number&app_absent=0`} target="_blank" rel="noopener noreferrer">
                    <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/whatsapp_5.png" alt="Whatsapp icon" width={24} height={24} />
                    <span className={`${schemeData ? 'hidden' : 'inline'} text-[14px] sm:text-base uppercase font-bold tracking-wider`}>Whatsapp Us</span>
                  </a>
                </Button>
                {schemeData && (
                  <div
                    className="relative flex-1"
                    onMouseEnter={() => {
                      if (schemeTimeoutRef.current) clearTimeout(schemeTimeoutRef.current);
                      if (typeof window !== 'undefined' && window.innerWidth > 1023) setIsSchemeOpen(true)
                    }}
                    onMouseLeave={() => {
                      if (typeof window !== 'undefined' && window.innerWidth > 1023) {
                        schemeTimeoutRef.current = setTimeout(() => {
                          setIsSchemeOpen(false);
                        }, 150);
                      }
                    }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsSchemeOpen((prev) => !prev);
                      }}
                      className={`w-full h-14 px-1.5 sm:px-3 font-medium flex items-center justify-between gap-1 sm:gap-2 bg-gray-50 hover:cursor-pointer group hover:bg-tertiary hover:text-white transition-all duration-150 active:scale-[0.98] rounded-md ${isSchemeOpen ? 'bg-tertiary text-white border-primary shadow-[0_5px_20px_rgba(163,110,110,0.4)]' : 'border-gray-200'}`}
                    >
                      <div className="w-6 sm:w-8 flex justify-start shrink-0">
                        <div className={`p-1 rounded-full transition-colors duration-150 flex items-center justify-center ${isSchemeOpen ? 'bg-white/20' : 'bg-primary/10'}`}>
                          <Coins size={16} className={`sm:w-6 sm:h-[18px] ${isSchemeOpen ? 'text-white' : 'text-primary'} group-hover:text-white transition-all`} />
                        </div>
                      </div>

                      <span className="flex-1 text-center text-[12px] sm:text-[13px] lg:text-[14px] xl:text-[15px] uppercase tracking-tight leading-tight font-bold">
                        SAVE <span className="font-extrabold mx-0.5">₹{formatPrice(schemeData.saveAmount)}</span> WITH SCHEME
                      </span>

                      <div className="w-6 sm:w-8 flex justify-end shrink-0">
                        <ChevronRight size={16} className={`transition-transform duration-200 ${isSchemeOpen ? 'rotate-90' : ''}`} />
                      </div>
                    </Button>

                    {isSchemeOpen && (
                      <div className="absolute top-full right-0 w-[calc(100vw-32px)] sm:w-[350px] lg:w-full pt-2 z-[100] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 ease-out origin-top-right">
                        <div className="bg-white border border-primary/10 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                          <div className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5">

                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                              <h4 className="text-[12px] sm:text-sm font-bold text-black uppercase tracking-[0.12em]">9 + 1 Scheme Breakdown</h4>
                              <BadgeCheck size={18} className="text-[#2DB36F]" />
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                              <div className="flex justify-between items-center text-[12px] sm:text-[13px]">
                                <span className="text-gray-500 font-medium">Product Price</span>
                                <span className="font-semibold text-black">₹{formatPrice(schemeData.productPrice)}</span>
                              </div>
                              <div className="flex justify-between items-center text-[12px] sm:text-[13px]">
                                <span className="text-gray-500 font-medium">Monthly Installment</span>
                                <div className="text-right">
                                  <span className="font-bold text-primary">₹{formatPrice(schemeData.monthly)}</span>
                                  <span className="text-gray-600 ml-1">x 9 Months</span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-[12px] sm:text-[13px]">
                                <span className="text-gray-500 font-medium">You Pay (9 Months)</span>
                                <span className="font-semibold text-black">₹{formatPrice(schemeData.pay9)}</span>
                              </div>
                              <div className="flex justify-between items-center text-[12px] sm:text-[13px]">
                                <span className="text-gray-500 font-medium">10th Month We Pay</span>
                                <span className="font-bold text-[#2DB36F]">₹{formatPrice(schemeData.monthly)}</span>
                              </div>

                              <div className="bg-[#FAFAFA] rounded-xl p-4 border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-bold text-gray-900">Total Redeemable</span>
                                  <span className="text-lg font-extrabold text-black">₹{formatPrice(schemeData.totalRedeemable)}</span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1.5 leading-tight font-medium">
                                  You can redeem this amount after 10 months.
                                </p>
                              </div>
                            </div>

                            <Button className="w-full h-12 font-bold uppercase tracking-widest bg-tertiary hover:bg-accent text-white rounded-sm shadow-lg shadow-primary/20 transition-all duration-200 active:scale-[0.97]" asChild>
                              <a href={schemeData.schemeUrl} target="_blank" rel="noopener noreferrer">
                                ENROLL NOW <ArrowRight size={16} className="ml-2" />
                              </a>
                            </Button>

                            <div className="flex items-center justify-center gap-2 pt-1">
                              <div className="w-1 h-1 bg-[#2DB36F] rounded-full animate-pulse"></div>
                              <p className="text-[9px] sm:text-[10px] text-gray-700 font-bold uppercase tracking-widest">
                                Secure & Instant Enrollment
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-2 gap-y-4 gap-x-6 lg:gap-x-6 text-xs sm:text-sm font-medium text-black">
                <Feature
                  icon={
                    <svg width="22" height="22" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.125 18.9583C21.125 19.6766 20.8397 20.3655 20.3317 20.8734C19.8238 21.3813 19.135 21.6667 18.4167 21.6667C17.6984 21.6667 17.0095 21.3813 16.5016 20.8734C15.9937 20.3655 15.7083 19.6766 15.7083 18.9583C15.7083 18.24 15.9937 17.5512 16.5016 17.0433C17.0095 16.5353 17.6984 16.25 18.4167 16.25C19.135 16.25 19.8238 16.5353 20.3317 17.0433C20.8397 17.5512 21.125 18.24 21.125 18.9583ZM10.2917 18.9583C10.2917 19.6766 10.0063 20.3655 9.49841 20.8734C8.9905 21.3813 8.30163 21.6667 7.58333 21.6667C6.86504 21.6667 6.17616 21.3813 5.66825 20.8734C5.16034 20.3655 4.875 19.6766 4.875 18.9583C4.875 18.24 5.16034 17.5512 5.66825 17.0433C6.17616 16.5353 6.86504 16.25 7.58333 16.25C8.30163 16.25 8.9905 16.5353 9.49841 17.0433C10.0063 17.5512 10.2917 18.24 10.2917 18.9583Z" stroke="#5A413F" strokeWidth="2"/>
                      <path d="M15.7084 18.9585H10.2917M21.1251 18.9585H21.9517C22.19 18.9585 22.3092 18.9585 22.4088 18.9455C22.7675 18.9008 23.101 18.7379 23.3566 18.4824C23.6123 18.227 23.7755 17.8936 23.8204 17.535C23.8334 17.4342 23.8334 17.3151 23.8334 17.0767V14.0835C23.8334 12.2159 23.0915 10.4249 21.771 9.10429C20.4504 7.78372 18.6593 7.04183 16.7917 7.04183M16.2501 16.7918V7.5835C16.2501 6.05166 16.2501 5.28575 15.7734 4.81016C15.2989 4.3335 14.533 4.3335 13.0001 4.3335H5.41675C3.88491 4.3335 3.119 4.3335 2.64341 4.81016C2.16675 5.28466 2.16675 6.05058 2.16675 7.5835V16.2502C2.16675 17.2631 2.16675 17.769 2.3845 18.146C2.52712 18.393 2.73224 18.5981 2.97925 18.7407C3.35625 18.9585 3.86216 18.9585 4.87508 18.9585" stroke="#5A413F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  }
                  text="Free and secure shipping"
                />
                <Feature
                  icon={
                    <svg width="22" height="22" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath="url(#clip0_2_68952)">
                        <path d="M0.8125 15.4375V25.1875M0.8125 23.5625H18.6875C18.6875 22.7005 18.3451 21.8739 17.7356 21.2644C17.1261 20.6549 16.2995 20.3125 15.4375 20.3125H11.375M11.375 20.3125C11.375 19.4505 11.0326 18.6239 10.4231 18.0144C9.8136 17.4049 8.98695 17.0625 8.125 17.0625H0.8125M11.375 20.3125H7.3125M7.1825 0.8125H23.6925C24.0929 0.81821 24.4747 0.982005 24.7548 1.26816C25.0349 1.55431 25.1904 1.93961 25.1875 2.34V11.7433C25.1904 12.1437 25.0349 12.529 24.7548 12.8152C24.4747 13.1013 24.0929 13.2651 23.6925 13.2708H7.1825C6.78214 13.2651 6.40028 13.1013 6.12021 12.8152C5.84015 12.529 5.6846 12.1437 5.6875 11.7433V2.34C5.6846 1.93961 5.84015 1.55431 6.12021 1.26816C6.40028 0.982005 6.78214 0.81821 7.1825 0.8125Z" stroke="#5A413F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8.66663 4.3335H10.2916M20.5833 9.75016H22.2083M13 7.04183C13 7.68829 13.2568 8.30828 13.7139 8.7654C14.171 9.22252 14.791 9.47933 15.4375 9.47933C16.0839 9.47933 16.7039 9.22252 17.161 8.7654C17.6182 8.30828 17.875 7.68829 17.875 7.04183C17.875 6.39536 17.6182 5.77538 17.161 5.31826C16.7039 4.86114 16.0839 4.60433 15.4375 4.60433C14.791 4.60433 14.171 4.86114 13.7139 5.31826C13.2568 5.77538 13 6.39536 13 7.04183Z" stroke="#5A413F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </g>
                      <defs>
                        <clipPath id="clip0_2_68952">
                          <rect width="26" height="26" fill="white"/>
                        </clipPath>
                      </defs>
                    </svg>
                  }
                  text="15-day free returns"
                />
                <Feature
                  icon={
                    <svg width="22" height="22" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.3917 21.1248C20.2953 19.8642 21.6962 17.9755 22.3501 15.788C23.004 13.6005 22.8694 11.2529 21.9699 9.15437C21.0704 7.05588 19.463 5.33961 17.4279 4.30473C15.3927 3.26984 13.0589 2.98199 10.8333 3.49135M22.2083 21.1248H18.3917V17.3331M7.58333 4.89209C5.68631 6.15733 4.29275 8.04743 3.64498 10.2337C2.99721 12.42 3.13622 14.7642 4.03782 16.8586C4.93942 18.9531 6.54659 20.6652 8.57984 21.6974C10.6131 22.7296 12.9438 23.0165 15.1667 22.5082M3.79167 4.89209H7.58333V8.66643" stroke="#5A413F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  }
                  text="Lifetime exchange and 100% value guarantee"
                />
                <Feature
                  icon={
                    <svg width="22" height="22" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M7.07957 3.521C6.76741 3.5211 6.4601 3.59828 6.18494 3.74569C5.90977 3.8931 5.67527 4.10618 5.50224 4.366L1.61416 10.1965C1.37691 10.554 1.34874 11.0112 1.54049 11.3947C3.66944 15.6493 6.6262 19.4362 10.2375 22.5335L12.1333 24.1596C12.3748 24.3666 12.6824 24.4804 13.0005 24.4804C13.3186 24.4804 13.6262 24.3666 13.8677 24.1596L15.7636 22.5346C19.3754 19.4371 22.3325 15.6498 24.4617 11.3947C24.6534 11.0112 24.6242 10.554 24.3869 10.1965L20.4967 4.366C20.3236 4.10653 20.0892 3.89376 19.8143 3.74655C19.5393 3.59934 19.2323 3.52224 18.9204 3.52208L7.07957 3.521ZM6.85424 5.26625C6.87901 5.22922 6.91253 5.19887 6.95184 5.17789C6.99115 5.15691 7.03502 5.14596 7.07957 5.146H9.61457L7.53999 10.125C7.49389 10.2394 7.45765 10.3576 7.43166 10.4782C6.6687 10.4213 5.90667 10.3526 5.14582 10.2723L3.62374 10.1131L6.85424 5.26625ZM3.55332 11.7392C5.49823 15.3049 8.06409 18.4948 11.1302 21.1587L7.74474 12.1302C6.82109 12.0667 5.89866 11.9866 4.97791 11.8897L3.55332 11.7392ZM9.51816 12.231L13 21.5195L16.4829 12.231C14.1622 12.3362 11.8378 12.3362 9.51707 12.231M18.2563 12.1302L14.8709 21.1587C17.937 18.4948 20.5028 15.3049 22.4477 11.7392L21.0232 11.8897C20.1023 11.9858 19.18 12.066 18.2563 12.1302ZM22.3762 10.1131L20.8531 10.2734C20.0922 10.3537 19.3302 10.4223 18.5672 10.4792C18.5417 10.3583 18.5058 10.2398 18.46 10.125L16.3854 5.146H18.9204C18.965 5.14596 19.0088 5.15691 19.0481 5.17789C19.0874 5.19887 19.121 5.22922 19.1457 5.26625L22.3762 10.1131ZM16.8913 10.5843C14.2978 10.7187 11.7036 10.7187 9.10866 10.5843L11.375 5.146H14.625L16.8913 10.5843Z" fill="#5A413F"/>
                    </svg>
                  }
                  text="IGI and Hallmark certified"
                />
              </div>

              <Separator />

              {/* Lucira Coins */}
              <div className="flex gap-4 items-center bg-gray-50 border border-gray-100 rounded-xl p-4">
                <div className="bg-gradient-to-br from-[#f9e8b8] to-[#e8c97a] shadow-[0_2px_10px_rgba(184,146,74,0.25),inset_0_1px_2px_rgba(255,255,255,0.6)] w-12 h-12 rounded-lg flex items-center justify-center">
                  <Coins size={24} className="text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold leading-tight">
                    Earn {Math.floor(currentPrice * 0.04)} Lucira Coins worth ₹{formatPrice(Math.floor(currentPrice * 0.04))} with this order
                  </p>
                  <p className="text-sm font-medium text-black">
                    1 Lucira Coin = ₹1
                  </p>
                </div>
              </div>

              <Separator />
            </div>

            <div className="space-y-4 mt-4">
              {/* Pincode & Delivery */}
              <div className="space-y-3 pt-2">
                <div className="relative">
                  <Input
                    placeholder="Enter Pincode"
                    value={localPincode}
                    onChange={(e) => {const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setLocalPincode(value);
                      dispatch(setPincode(value));
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handlePincodeCheck(localPincode)}
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="h-14 bg-white border-gray-200 rounded-md text-sm font-medium pr-40"
                  />
                  <Button
                    onClick={() => handlePincodeCheck(localPincode)}
                    disabled={checkingPincode}
                    className="h-12 px-10 font-bold rounded-md absolute right-1 top-1/2 transform -translate-y-1/2 bg-tertiary hover:cursor-pointer"
                  >
                    {checkingPincode ? <Loader2 className="animate-spin" size={18} /> : "CHECK"}
                  </Button>
                </div>
                {deliveryInfo.status !== "idle" && (
                  <div className={`text-sm flex items-center gap-2 ${deliveryInfo.status === "undeliverable" ? "text-red-500" : "text-black"}`}>
                    {deliveryInfo.status === "undeliverable" ? (
                      <X size={16} />
                    ) : (
                      <Info size={16} className={deliveryInfo.status === "loading" ? "animate-pulse" : "text-black"} />
                    )}
                    <span className={deliveryInfo.status === "deliverable" ? "font-normal" : "font-medium"}>
                      {deliveryInfo.message}
                    </span>
                  </div>
                )}
              </div>

              {/* Nearest Store */}
              <div className="border border-gray-200 rounded-md p-4 space-y-2.5 bg-gray-50">
                {availableStoreCount > 0 && (
                  <>
                    <div className="flex items-center gap-2">
                      <Store size={20} className="text-black" strokeWidth={1.2} />
                      <span className="text-base font-bold">
                        {nearestStore ? (
                          <>Nearest Store - <span className="italic font-semibold text-black">{getStoreDisplayName(nearestStore.name)}{nearestStore.distance !== null ? ` (${Math.round(nearestStore.distance)}Km)` : ""}</span></>
                        ) : (
                          <>Available in <span className="italic font-semibold text-black">{availableStoreCount} stores</span></>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#E3F5E0] text-black px-3 py-1.5 rounded-full w-fit">
                      <div className="w-3.5 h-3.5 bg-[#76D168] rounded-full flex items-center justify-center">
                        <Check size={9} className="text-white" strokeWidth={4} />
                      </div>
                      <span className="text-12px font-semibold tracking-tight">Design Available</span>
                    </div>
                  </>
                )}
                {availableStoreCount > 1 && (
                  <p className="text-sm text-black">
                    Also available in <button onClick={() => setIsStoreDrawerOpen(true)} className="underline underline-offset-2 font-bold">{availableStoreCount - 1} other stores</button>
                  </p>
                )}
                <Button
                  onClick={() => setIsStoreDrawerOpen(true)}
                  className="w-full h-12 font-bold rounded-md mt-1 text-sm bg-tertiary uppercase tracking-widest"
                >
                  {availableStoreCount > 0 ? "FIND IN STORE" : "FIND STORE"}
                </Button>
              </div>
              <Separator />
            </div>

            {/* Promo Cards Slider */}
            {(() => {
              const raw = priceBreakup?.raw_breakup;
              const isDiamondJewelry = (raw?.diamond?.final || 0) > 0;
              const currentTotalPrice = activeVariant?.price || 0;

              const isGoldCoinEligible =
                isDiamondJewelry &&
                currentTotalPrice >= goldCoinConfig.threshold &&
                goldCoinConfig.enabled;

              const slides = [];

              if (isGoldCoinEligible) {
                slides.push({
                  img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/PDPGoldCoin.png",
                  title: "Complimentary Gold Coin",
                  desc: goldCoinConfig.message || "Receive a free gold coin with this ring, making your order even more special."
                });
              }

              slides.push(
                {
                  img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/PDPOldGoldExchange.jpg",
                  title: "Old Gold Exchange",
                  desc: "Exchange your old gold at the best value and upgrade to new Lucira Jewelry with ease."
                },
                {
                  img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/PDPScheme.png",
                  title: "9 + 1 Scheme",
                  desc: "Complete 9 monthly payments and enjoy an extra month benefit from Lucira Jewelry."
                }
              );

              return (
                <div className="space-y-4 mt-4">
                  <div className="overflow-hidden">
                    <Swiper
                      spaceBetween={12}
                      slidesPerView={1.1}
                      onSlideChange={(swiper) =>
                        setActivePromoSlide(swiper.activeIndex + 1)
                      }
                      className="w-full overflow-visible!"
                    >
                      {slides.map((item, i) => (
                        <SwiperSlide key={`promo-${i}`}>
                          <div className="bg-[#F9F9F9] border border-gray-100 rounded-xl p-2 md:p-5 flex items-stretch gap-2.5 md:gap-5 h-full">
                            <div className="relative w-18 h-18 rounded-lg overflow-hidden shrink-0">
                              <Image
                                src={item.img}
                                alt={item.title}
                                fill
                                className="object-cover"
                              />
                            </div>

                            <div className="space-y-2">
                              <p className="text-base md:text-lg font-semibold italic leading-tight">
                                {item.title}
                              </p>

                              <p className="text-xs md:text-sm leading-relaxed">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                    <div className="flex items-center gap-5 mt-4">
                      <div className="flex-1 h-0.75 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-black rounded-full transition-all duration-300"
                          style={{ width: `${(activePromoSlide / slides.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-[12px] font-bold tracking-tight text-black">{activePromoSlide}/{slides.length}</span>
                    </div>
                  </div>
                  <Separator />
                </div>
                
              );
            })()}
            {/* Explore Section */}
            <div className="space-y-4 mt-4">
              <h3 className="text-base font-semibold">More Ways To Explore:</h3>
              <ExploreCard
                key="visit-store"
                title="Visit Our Store"
                description="Explore and try your favorite designs in person, with expert guidance from our in-store team."
                action="BOOK APPOINTMENT"
                img="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/store_5f7eef5f-e3ba-4088-8fc0-c2b42ce7624e.jpg"
                url="https://wa.me/919004435760?text=Hi,%20I%20want%20to%20book%20an%20appointment"
                onClick={() => pushToDataLayer({
                  event: 'promoClick',
                  promoClick: {
                    promo_id: getNumericId(product.shopifyId || product.id),
                    creative_name: 'Visit Store Button clicked',
                    location_id: 'Pdp',
                  }
                })}
              />
              <ExploreCard
                key="try-at-home"
                title="Try At Home"
                description="Try your selected pieces from the comfort of your home. Available in all major cities"
                action="BOOK HOME TRIAL"
                img="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/subscribe-2_6402a239-1346-40d1-9ea4-bd006e45e7b7.jpg"
                url="https://wa.me/919004435760?text=Hi,%20I%20want%20to%20try%20this%20at%20home"
                onClick={() => pushToDataLayer({
                  event: 'promoClick',
                  promoClick: {
                    promo_id: activeVariant?.sku || product.id,
                    promo_name: product.title,
                    creative_name: 'Try at Home Section',
                    location_id: 'PDP',
                  }
                })}
              />
              <Separator />
            </div>

            {/* Product Details Section */}
            <div className="space-y-4 mt-6">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold tracking-tight uppercase">Product Details</h2>
                {activeVariant?.sku && (
                  <div
                    className="flex items-center gap-1.5 cursor-pointer group"
                    title="Click to copy SKU"
                    onClick={() => {
                      navigator.clipboard.writeText(activeVariant.sku);
                      toast.success("SKU Copied!", {
                        position: "bottom-center",
                        autoClose: 1500,
                        hideProgressBar: true,
                        theme: "light"
                      });
                    }}
                  >
                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest group-hover:text-gray-600 transition-colors">
                      SKU: {activeVariant.sku}
                    </span>
                    <Copy size={12} className="text-gray-700 group-hover:text-gray-600 transition-colors" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-4 [&>*:last-child:nth-child(odd)]:col-span-2">
                {/* Metal Card */}
                <div className="bg-[#F9F9F9] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 font-bold text-sm uppercase text-gray-900">
                    <Image src="/images/icons/metal.svg" alt="Metal" width={18} height={18} />
                    Metal <Info size={14} className="text-gray-400 cursor-pointer ml-auto" onClick={() => setActiveInfoSheet("metal")} />
                  </div>
                  <div className="space-y-2">
                    {activeVariant?.metafields?.metal_purity && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Purity</span>
                        <span className="font-medium">{activeVariant.metafields.metal_purity}</span>
                      </div>
                    )}
                    {activeVariant?.metafields?.metal_color && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Color</span>
                        <span className="font-medium">{activeVariant.metafields.metal_color}</span>
                      </div>
                    )}
                    {activeVariant?.metafields?.metal_weight && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Net Wt</span>
                        <span className="font-medium">{activeVariant.metafields.metal_weight} g</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dimensions Card */}
                <div className="bg-[#F9F9F9] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 font-bold text-sm uppercase text-gray-900">
                    <Image src="/images/icons/dimension.svg" alt="Dimensions" width={18} height={18} />
                    Dimension <Info size={14} className="text-gray-400 cursor-pointer ml-auto" onClick={() => setActiveInfoSheet("dimension")} />
                  </div>
                  <div className="space-y-2">
                    {activeVariant?.metafields?.top_height && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Height</span>
                        <span className="font-medium">{activeVariant.metafields.top_height} mm</span>
                      </div>
                    )}
                    {activeVariant?.metafields?.top_width && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Width</span>
                        <span className="font-medium">{activeVariant.metafields.top_width} mm</span>
                      </div>
                    )}
                    {activeVariant?.metafields?.gross_weight && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Gross Wt</span>
                        <span className="font-medium">{activeVariant.metafields.gross_weight} g</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Single Diamond Card */}
                {!isGoldCoin && activeVariant?.metafields?.diamonds && activeVariant.metafields.diamonds.length === 1 && (
                  <div className="bg-[#F9F9F9] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2 font-bold text-sm uppercase text-gray-900">
                      <Image src="/images/icons/diamond.svg" alt="Diamond" width={18} height={18} />
                      Diamond <Info size={14} className="text-gray-400 cursor-pointer ml-auto" onClick={() => setActiveInfoSheet("diamond")} />
                    </div>
                    <div className="space-y-2.5">
                      {activeVariant.metafields.diamonds[0].quality && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Quality</span>
                          <span className="font-medium">{activeVariant.metafields.diamonds[0].quality}</span>
                        </div>
                      )}
                      {activeVariant.metafields.diamonds[0].shape && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Shape</span>
                          <span className="font-medium uppercase">{mapShapeCode(activeVariant.metafields.diamonds[0].shape) || activeVariant.metafields.diamonds[0].shape}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Quantity</span>
                        <span className="font-medium">{activeVariant.metafields.diamonds[0].pieces || "1"}pcs</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Carat</span>
                        <span className="font-medium">{activeVariant.metafields.diamonds[0].weight}ct</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Single Gemstone Card */}
                {activeVariant?.metafields?.gemstones && activeVariant.metafields.gemstones.length === 1 && (
                  <div className="bg-[#F9F9F9] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2 font-bold text-sm uppercase text-gray-900">
                      <Image src="/images/icons/gemstone.svg" alt="Gemstone" width={18} height={18} className="grayscale opacity-70" />
                      Gemstone <Info size={14} className="text-gray-400 cursor-pointer ml-auto" onClick={() => setActiveInfoSheet("gemstone")} />
                    </div>
                    <div className="space-y-2.5">
                      {activeVariant.metafields.gemstones[0].color && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Color</span>
                          <span className="font-medium uppercase">{activeVariant.metafields.gemstones[0].color}</span>
                        </div>
                      )}
                      {activeVariant.metafields.gemstones[0].shape && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Shape</span>
                          <span className="font-medium uppercase">{mapShapeCode(activeVariant.metafields.gemstones[0].shape) || activeVariant.metafields.gemstones[0].shape}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Quantity</span>
                        <span className="font-medium">{activeVariant.metafields.gemstones[0].pieces || "1"}pcs</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Carat</span>
                        <span className="font-medium">{activeVariant.metafields.gemstones[0].weight || "0"}ct</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Multiple Diamond Card - Full Width */}
              {!isGoldCoin && activeVariant?.metafields?.diamonds && activeVariant.metafields.diamonds.length > 1 && (
                <div className="bg-[#F9F9F9] rounded-2xl p-5 space-y-5">
                  <div className="flex items-center gap-2 font-bold text-sm uppercase text-gray-900">
                    <Image src="/images/icons/diamond.svg" alt="Diamond" width={18} height={18} />
                    Diamond <Info size={14} className="text-gray-400 cursor-pointer ml-auto" onClick={() => setActiveInfoSheet("diamond")} />
                  </div>

                  <div className="flex gap-4 md:gap-6 overflow-x-auto pb-2 scrollbar-hide">
                    {/* Labels Column */}
                    <div className="space-y-1 shrink-0">
                      <div className="text-sm text-gray-500 font-medium h-5 flex items-center">Quality :</div>
                      <div className="text-sm text-gray-500 font-medium h-5 flex items-center">Shape :</div>
                      <div className="text-sm text-gray-500 font-medium h-5 flex items-center">Quantity :</div>
                      <div className="text-sm text-gray-500 font-medium h-5 flex items-center">Carat :</div>
                    </div>

                    {/* Values Columns */}
                    {activeVariant.metafields.diamonds.map((d, i) => (
                      <div key={`dia-col-${i}`} className="space-y-1 shrink-0">
                        <div className="text-sm font-semibold h-5 flex items-center text-gray-900 whitespace-nowrap">{d.quality || "VVS-VS, EF"}</div>
                        <div className="text-sm font-semibold h-5 flex items-center uppercase text-gray-900 whitespace-nowrap">{mapShapeCode(d.shape) || d.shape || "-"}</div>
                        <div className="text-sm font-semibold h-5 flex items-center text-gray-900 whitespace-nowrap">{d.pieces || "1"}pcs</div>
                        <div className="text-sm font-semibold h-5 flex items-center text-gray-900 whitespace-nowrap">{d.weight}ct</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Multiple Gemstone Card - Full Width */}
              {activeVariant?.metafields?.gemstones && activeVariant.metafields.gemstones.length > 1 && (
                <div className="bg-[#F9F9F9] rounded-2xl p-5 space-y-5">
                  <div className="flex items-center gap-2 font-bold text-sm uppercase text-gray-900">
                    <Image src="/images/icons/diamond.svg" alt="Gemstone" width={18} height={18} className="grayscale opacity-70" />
                    Gemstone <Info size={14} className="text-gray-400 cursor-pointer ml-auto" />
                  </div>

                  <div className="flex gap-10 md:gap-16 overflow-x-auto pb-2 scrollbar-hide">
                    {/* Labels Column */}
                    <div className="space-y-3 shrink-0">
                      <div className="text-sm text-gray-500 font-medium h-5 flex items-center">Color :</div>
                      <div className="text-sm text-gray-500 font-medium h-5 flex items-center">Shape :</div>
                      <div className="text-sm text-gray-500 font-medium h-5 flex items-center">Quantity :</div>
                      <div className="text-sm text-gray-500 font-medium h-5 flex items-center">Carat :</div>
                    </div>

                    {/* Values Columns */}
                    {activeVariant.metafields.gemstones.map((g, i) => (
                      <div key={`gem-col-${i}`} className="space-y-3 shrink-0">
                        <div className="text-sm font-semibold h-5 flex items-center text-gray-900 whitespace-nowrap uppercase">{g.color || "-"}</div>
                        <div className="text-sm font-semibold h-5 flex items-center uppercase text-gray-900 whitespace-nowrap">{mapShapeCode(g.shape) || g.shape || "-"}</div>
                        <div className="text-sm font-semibold h-5 flex items-center text-gray-900 whitespace-nowrap">{g.pieces || "1"}pcs</div>
                        <div className="text-sm font-semibold h-5 flex items-center text-gray-900 whitespace-nowrap">{g.weight || "0"}ct</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div ref={productDetailsRef} className="mt-8">
                <PriceSavingsDetails
                  priceBreakup={priceBreakup?.price_breakup}
                  onTabChange={(tab) => {
                    if (tab === 'price') {
                      const totalSavingsAmount = priceBreakup?.raw_breakup?.total_savings || 0;
                      handlePromoClick('priceBreakup', 'Product Details Section', { savings_amount: totalSavingsAmount });
                    } else if (tab === 'comparison') {
                      const savingsStr = priceBreakup?.price_breakup?.comparison?.savings || '₹0';
                      const savingsAmount = parseFloat(savingsStr.replace(/[^\d.]/g, '')) || 0;
                      handlePromoClick('yourSavings', savingsAmount, { savings_amount: savingsAmount });
                    }
                  }}
                />
              </div>

              <p className="text-xs leading-relaxed text-gray-900 italic mt-6">
                * Our products are handcrafted and personalised for your delight, hence a weight variance is expected.
              </p>
            </div>

            {priceBreakup && String(priceBreakup.variantId) === String(activeVariant?.id) && priceBreakup?.price_breakup?.total_savings && priceBreakup?.price_breakup?.total_savings !== "₹0" && (
              <div className="mt-4 flex justify-between items-center bg-success/8 border border-success rounded-md px-5 py-4">
                <span className="text-base font-bold text-gray-900 uppercase tracking-tight">Save on this jewelry</span>
                <span className="text-lg font-bold text-success">{priceBreakup.price_breakup.total_savings}</span>
              </div>
            )}

            {/* Certification */}
            {!isGoldCoin && (
              <div className="pt-6">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-base font-semibold text-black mb-4">
                    Certified Quality Guaranteed.
                  </div>
                  <div className="flex items-start justify-between gap-4 xl:flex-nowrap flex-wrap">
                    <Button variant="link" className="text-sm font-semibold underline underline-offset-[6px] decoration-black mt-1 whitespace-nowrap p-0 h-auto" asChild>
                      <a href="/images/certificate/SampleCertificate.jpg" alt="Sample Certificate" download>
                        See Sample Certificate
                      </a>
                    </Button>
                    <div className="flex items-center gap-7">
                      <div className="w-14 h-14 relative">
                        <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/IGI.png" alt="IGI" fill className="object-contain" />
                      </div>
                      <div className="w-14 h-14 relative">
                        <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/SGL_528e2e93-e563-40b6-a8a6-c098475a6de9.png" alt="SGL" fill className="object-contain" />
                      </div>
                      <div className="w-14 h-14 relative">
                        <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/BIS.png" alt="BIS Hallmark" fill className="object-contain" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center flex-col mt-5">
                    <p className="text-sm text-black text-center"><strong>Note:</strong> Our products are handcrafted and personalized for you, hence weight variance may occur.</p>
                    {product.tags?.includes("Only Pendant") && (
                      <p className="text-sm text-black text-center mt-1">Chain is not included in the purchase.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <ProductAccordion />
            {/* Wear This With Slider */}
            {complementaryProducts.length > 0 && <WearThisWith products={complementaryProducts} />}
          </div>
        </div>
      </div>
      <LuxuryMarquee prop={["bg-tertiary", "text-white", "mt-10", "text-md", "font-semibold"]} />
      <ProductStory description={product.description} />
      <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
        <StyledByLucira />
      </Suspense>
      <OurProcess />
      <div ref={reviewsRef}>
        <CustomerReviews
          reviews={product.reviews}
          productId={product.shopifyId}
          productTitle={product.title}
          productImage={getValidSrc(product.image)}
          productHandle={product.handle}
        />
      </div>
      {matchingProducts.length > 0 && (
        <ProductSlider
          title="From the Same Collection"
          subtitle="Discover matching pieces that perfectly complement one another"
          products={matchingProducts}
        />
      )}
      <FAQSection />
      <ProductSlider
        title={recentlyViewedState?.title || "Recently Viewed"}
        products={Array.isArray(recentlyViewedState?.products) && recentlyViewedState.products.length > 0 ? recentlyViewedState.products.slice(0, 12) : undefined}
        preservePriceOnColorChange={true}
      />
      {youMayAlsoLikeProducts.length > 0 && (
        <section className="w-full bg-white mt-10 md:mt-15 overflow-hidden">
          <div className="max-w-480 mx-auto px-5 md:px-17">
            <div className="text-center mb-10 md:mb-12">
              <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">You May Also Like</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-8 md:gap-y-12">
              {youMayAlsoLikeProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
      {!isGoldCoin && <DiamondComparison />}
      {/* <ExploreOtherRings /> */}
      {isMobile ? (<ExploreRange />) : (<CategorySlider />)}
      <FindLuciraStore
        pincode={localPincode}
        setPincode={setLocalPincode}
        handlePincodeCheck={handlePincodeCheck}
        checkingPincode={checkingPincode}
        deliveryInfo={deliveryInfo}
        availableStores={availableStores}
        product={product}
        activeVariant={activeVariant}
      />
      <JoinLuciraCommunity />

      {isMobileView ? (
        <MobileSheet
          isOpen={isStoreDrawerOpen}
          onClose={() => setIsStoreDrawerOpen(false)}
          detents={[0.9, 0.5]}
        >
          <MobileSheet.Container className="z-[499]">
            <MobileSheet.Header />
            <MobileSheet.Content>
              <div className="h-[100dvh]">
                <div className="flex items-center justify-between px-4 pb-6 border-b border-gray-100">
                  <h2 className="text-lg font-bold">Store Availability</h2>
                  <button onClick={() => setIsStoreDrawerOpen(false)} className="p-2">
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>

                <div className="space-y-6  overflow-y-auto h-full">
                  {availableStores.length > 0 ? (
                    availableStores.map((store) => (
                      <div key={store.id || store.shopifyId} className="border border-gray-100 rounded-xl p-5 space-y-4 bg-gray-50/50">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="font-bold text-lg">{getStoreDisplayName(store.name)}</h3>
                            {store.distance !== null && (
                              <div className="flex items-center gap-1.5 text-primary font-semibold text-sm">
                                <MapPin size={14} />
                                {Math.round(store.distance)} Km away
                              </div>
                            )}
                          </div>
                          {store.isInStock ? (
                            <div className="bg-[#E3F5E0] text-black px-3 py-1 rounded-full flex items-center gap-1.5">
                              <div className="w-2 h-2 bg-[#76D168] rounded-full"></div>
                              <span className="text-xs font-bold uppercase">In Stock</span>
                            </div>
                          ) : (
                            <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full flex items-center gap-1.5 border border-amber-100">
                              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                              <span className="text-xs font-bold uppercase">Ships to Store</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3 pt-2">
                          <div className="flex items-start gap-3 text-sm text-gray-600">
                            <MapPin size={18} className="shrink-0 text-gray-400 mt-0.5" />
                            <p className="leading-relaxed font-medium">{store.address1 || store.address}, {store.city}</p>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Phone size={18} className="shrink-0 text-gray-400" />
                            <p className="font-medium">{store.phone || "+91 91724 99912"}</p>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Package size={18} className="shrink-0 text-gray-400" />
                            <p className="font-medium">Ready for pickup in 2-4 hours</p>
                          </div>
                        </div>

                        <div className="flex flex-1 gap-3 pt-2">
                          <a
                            href={`https://wa.me/919172499912?text=${encodeURIComponent(
                              `Hi, I would like to check the availability for ${getStoreDisplayName(store.name)} store.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-11 aspect-square bg-[#29a319] shadow-sm border-gray-200 rounded-sm flex items-center justify-center shrink-0"
                          >
                            <div className="relative w-7 h-7">
                              <Image src="/images/icons/whatsapp_white.png" alt="WhatsApp" fill className="object-contain" />
                            </div>
                          </a>
                          <Button variant="outline" className="flex-1 font-bold h-11 rounded-sm border-gray-200" asChild>
                            <a href={`tel:${store.phone || "+919172499912"}`}>CALL STORE</a>
                          </Button>
                          <Button className="flex-1 font-bold h-11 rounded-sm bg-tertiary" asChild>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              DIRECTIONS
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                        <Store className="text-gray-300" size={32} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-gray-900">No Stores with Stock</p>
                        <p className="text-sm text-gray-500">This design is currently not available in any nearby stores.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </MobileSheet.Content>
          </MobileSheet.Container>
          <MobileSheet.Backdrop />
        </MobileSheet>
      ) : (
        <Sheet open={isStoreDrawerOpen} onOpenChange={setIsStoreDrawerOpen}>
          <SheetContent side="right" className="w-full sm:max-w-[450px] p-0 flex flex-col">
            <SheetHeader className="p-6 border-b border-gray-100 flex flex-row items-center justify-between">
              <SheetTitle className="text-lg font-bold">Store Availability</SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {availableStores.length > 0 ? (
                  availableStores.map((store) => (
                    <div key={store.id || store.shopifyId} className="border border-gray-100 rounded-xl p-5 space-y-4 bg-gray-50/50">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="font-bold text-lg">{getStoreDisplayName(store.name)}</h3>
                          {store.distance !== null && (
                            <div className="flex items-center gap-1.5 text-primary font-semibold text-sm">
                              <MapPin size={14} />
                              {Math.round(store.distance)} Km away
                            </div>
                          )}
                        </div>
                        {store.isInStock ? (
                          <div className="bg-[#E3F5E0] text-black px-3 py-1 rounded-full flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-[#76D168] rounded-full"></div>
                            <span className="text-xs font-bold uppercase">In Stock</span>
                          </div>
                        ) : (
                          <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full flex items-center gap-1.5 border border-amber-100">
                            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                            <span className="text-xs font-bold uppercase">Ships to Store</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-start gap-3 text-sm text-gray-600">
                          <MapPin size={18} className="shrink-0 text-gray-400 mt-0.5" />
                          <p className="leading-relaxed font-medium">{store.address1 || store.address}, {store.city}</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Phone size={18} className="shrink-0 text-gray-400" />
                          <p className="font-medium">{store.phone || "+91 91724 99912"}</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Package size={18} className="shrink-0 text-gray-400" />
                          <p className="font-medium">Ready for pickup in 2-4 hours</p>
                        </div>
                      </div>

                      <div className="flex flex-1 gap-3 pt-2">
                        <a
                            href={`https://wa.me/919172499912?text=${encodeURIComponent(
                              `Hi, I would like to check the availability for ${getStoreDisplayName(store.name)} store.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-11 aspect-square bg-[#29a319] shadow-sm border-gray-200 rounded-sm flex items-center justify-center shrink-0"
                          >
                            <div className="relative w-7 h-7">
                              <Image src="/images/icons/whatsapp_white.png" alt="WhatsApp" fill className="object-contain" />
                            </div>
                        </a>
                        <Button variant="outline" className="flex-1 font-bold h-11 rounded-sm border-gray-200" asChild>
                          <a href={`tel:${store.phone || "+919172499912"}`}>CALL STORE</a>
                        </Button>
                        <Button className="flex-1 font-bold h-11 rounded-sm bg-tertiary" asChild>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            DIRECTIONS
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                      <Store className="text-gray-300" size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-gray-900">No Stores with Stock</p>
                      <p className="text-sm text-gray-500">This design is currently not available in any nearby stores.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      <PdpInfoSheet
        type={activeInfoSheet}
        isOpen={!!activeInfoSheet}
        onOpenChange={(open) => !open && setActiveInfoSheet(null)}
      />
    </div>
  );
}

function DiamondDetail({ img, shape, pcs, carat, quality }) {
  return (
    <div className="flex-1 ps-6 pe-6 first:ps-0 last:pe-0 flex flex-col items-start">
      <div className="flex justify-start w-full mb-5">
        <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center overflow-hidden bg-white">
          <Image src={getValidSrc(img)} alt={`${shape} diamond shape`} width={40} height={40} className="object-cover" />
        </div>
      </div>
      <div className="space-y-2 text-12px w-full">
        {quality && <div className="flex justify-between"><span className="w-18">Quality:</span><span className="font-medium">{quality}</span></div>}
        <div className="flex justify-between"><span className="w-18">Shape:</span><span className="font-medium">{shape}</span></div>
        <div className="flex justify-between"><span className="w-18">No. of Pcs:</span><span className="font-medium">{pcs}</span></div>
        <div className="flex justify-between"><span className="w-18">Carat:</span><span className="font-medium">{carat}</span></div>
      </div>
    </div>
  );
}

function ExploreCard({ title, description, action, img, url, onClick }) {
  return (
    <div className="bg-[#F9F9F9] border border-gray-100 rounded-lg p-3 md:p-4 flex items-start gap-3 md:gap-4">
      <div className="w-20 sm:w-24 md:w-24 shrink-0 self-stretch rounded-sm bg-gray-200 relative overflow-hidden shadow-sm">
        {img && (<Image src={getValidSrc(img)} alt={title} fill className="object-cover" />)}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <p className="text-sm md:text-base font-semibold leading-tight"> {title} </p>
        <p className="text-xs md:text-sm font-medium leading-[1.5] text-gray-900"> {description} </p>
        <Button variant="link" className=" p-0 m-0 h-auto w-fit text-sm font-bold underline underline-offset-4 justify-start" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer" onClick={onClick}>
            {action}
          </a>
        </Button>
      </div>
    </div>
  );
}

function Feature({ icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0">{icon}</div>
      <span className="leading-tight tracking-tight">{text}</span>
    </div>
  );
}

function GoldOption({ metal, karat, color, active, onClick, inStock }) {
  return (
    <div
      onClick={() => onClick(metal, karat)}
      className={`border rounded-lg py-2 px-4 cursor-pointer relative flex flex-col items-center gap-3 transition-all ${active ? "border-primary bg-white ring-1 ring-primary shadow-sm" : "border-gray-200 bg-[#F9F9F9] hover:border-gray-300"}`}
    >
      {inStock && <span className={`absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-[#2DB36F]`}></span>}
      <div className={`w-7 h-7 rounded-full border border-gray-100 shadow-inner`} style={{ background: color }}></div>
      <div className={`text-sm text-center text-black leading-tight uppercase tracking-tight flex flex-col gap-1 ${active ? "font-semibold" : "font-normal"}`}>
        <span>{parseInt(String(karat).replace(/\D/g, ""), 10)}KT</span>
        <span>{metal}</span>
      </div>
    </div>
  );
}
