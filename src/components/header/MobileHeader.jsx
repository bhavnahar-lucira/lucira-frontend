"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Menu, Search, Heart, ShoppingBag, Home, X, ChevronRight, ChevronLeft, User as UserIcon, LogOut, MessageCircle, Package, Video, Store, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { clearCart } from "@/redux/features/cart/cartSlice";
import { restoreGuestWishlist } from "@/redux/features/wishlist/wishlistSlice";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { useMenu } from "@/hooks/useMenu";
import { MEGA_MENU as STATIC_MENU } from "@/data/megaMenu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { pushLogout, pushViewCart, getStandardCartItem, pushPromoClick } from "@/lib/gtm";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LuciraLogo from "./LuciraLogo";
import { AnimatePresence, motion } from "framer-motion";
import { Sheet as MobileSheet } from "react-modal-sheet";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { apiFetch, fetchSearchResults, fetchCollectionProducts } from "@/lib/api";

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const GOLDCOIN_VARIANT_ID = "gid://shopify/ProductVariant/47661824082138";

const CATEGORY_IMAGES = {
  "BEST SELLERS": "/images/menu/engagement-ring.jpg",
  "BESTSELLERS": "/images/menu/engagement-ring.jpg",
  "ENGAGEMENT RINGS": "/images/menu/engagement-ring.jpg",
  "ENGAGEMENT & BRIDAL": "/images/menu/engagement-ring.jpg",
  "RINGS": "/images/menu/wedding-ring.jpg",
  "EARRINGS": "/images/menu/earring.jpg",
  "MORE JEWELRY": "/images/menu/more-jewellery.jpg",
  "SOLITAIRE": "/images/menu/earring.jpg",
  "SOLITAIRES": "/images/menu/earring.jpg",
  "COLLECTIONS": "/images/menu/hexa.jpg",
  "GIFTING": "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Untitled_design_38_2.png?v=1778047861",
  "9KT COLLECTION": "/images/menu/candy.jpg",
};

const MENU_SLIDER_BANNERS = [
  {
    href: "/collections/bestsellers",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Best_Seller_V3.jpg_1.jpg?v=1776596789",
    alt: "Best Sellers"
  },
  {
    href: "/collections/hexa",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Hexa_V2.jpg?v=1762843077",
    alt: "Hexa Collection"
  },
  {
    href: "/collections/sports-collection",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Bezel_67fedcb7-1524-4b30-95c5-27986e403f21.jpg?v=1762841804",
    alt: "Sports Collection"
  },
  {
    href: "/collections/cotton-candy",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Cotton_Candy_Menu_bAr_v2.jpg?v=1766136159",
    alt: "Cotton Candy"
  }
];

const METAL_COLORS = {
  "Yellow Gold": "linear-gradient(147.45deg, #c59922 17.98%, #ead59e 48.14%, #c59922 83.84%)",
  "White Gold": "linear-gradient(143.06deg, #dfdfdf 29.61%, #f3f3f3 48.83%, #dfdfdf 66.43%)",
  "Rose Gold": "linear-gradient(154.36deg, #f2b5b5 10.36%, #f8dbdb 68.09%)",
  "Platinum": "linear-gradient(154.03deg, #DDDDDD 27.25%, #FFFFFF 47.58%, #DDDDDD 74.61%)",
  "Silver": "linear-gradient(143.06deg, #dfdfdf 29.61%, #f3f3f3 48.83%, #dfdfdf 66.43%)",
};

const SEARCH_PLACEHOLDERS = [
  "Engagement Rings",
  "Solitaire Rings",
  "Diamond Earrings",
  "Gold Necklaces",
  "Silver Bracelets"
];

function SafeImage({ src, alt, fallback = null, ...props }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => {
        if (!hasError && fallback) {
          setHasError(true);
          setImgSrc(fallback);
        }
      }}
    />
  );
}

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.16667 15.8333C12.8486 15.8333 15.8333 12.8486 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333Z" stroke="black" strokeWidth="1.17914" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M17.499 17.5L13.874 13.875" stroke="black" strokeWidth="1.17914" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const HeartIcon = () => (
  <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.6019 2.8079C15.477 2.8079 17.0019 4.37215 17.0019 6.29564C17.0019 10.3667 12.2903 14.0916 9.77686 15.907C7.26341 14.0916 2.55186 10.3667 2.55186 6.29564C2.55186 4.37215 4.07676 2.8079 5.95186 2.8079C6.49782 2.80916 7.03549 2.94494 7.51964 3.2038C8.00378 3.46267 8.42022 3.83704 8.73391 4.29542L9.77686 5.81869L10.8198 4.29629C11.1334 3.83775 11.5498 3.46321 12.0339 3.20419C12.5181 2.94517 13.0558 2.80926 13.6019 2.8079ZM13.6019 1.5C12.851 1.49989 12.1113 1.68562 11.4454 2.04143C10.7795 2.39724 10.2071 2.91262 9.77686 3.54381C9.3466 2.91262 8.77423 2.39724 8.10834 2.04143C7.44244 1.68562 6.70268 1.49989 5.95186 1.5C4.71197 1.5 3.52286 2.00525 2.64613 2.90461C1.7694 3.80397 1.27686 5.02376 1.27686 6.29564C1.27686 11.2822 6.80186 15.3969 9.77686 17.5C12.7519 15.3969 18.2769 11.2822 18.2769 6.29564C18.2769 5.66587 18.1559 5.04226 17.921 4.46043C17.6861 3.87859 17.3417 3.34993 16.9076 2.90461C16.4735 2.45929 15.9581 2.10605 15.3909 1.86505C14.8237 1.62404 14.2158 1.5 13.6019 1.5Z" fill="black"></path>
  </svg>
);

const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 16 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.22112 5.35692C4.22112 5.35692 3.81759 0.589355 7.85288 0.589355C11.8882 0.589355 11.4846 5.35692 11.4846 5.35692M0.589355 17.2758L1.33747 4.90168C1.37058 4.35392 1.82446 3.92665 2.37322 3.92665H13.3371C13.884 3.92665 14.3369 4.34892 14.3722 4.89468C14.654 9.25047 15.1164 16.5686 15.1164 17.2758C15.1164 18.0386 14.5784 18.2294 14.3094 18.2294C10.2741 18.2294 2.04206 18.2294 1.39641 18.2294C0.750767 18.2294 0.589355 17.5937 0.589355 17.2758Z" stroke="black" strokeWidth="1.17914" strokeLinecap="round"></path>
  </svg>
);

const StoreIcon = () => (
  <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.8744 16.625V12.6667C11.8744 12.4567 11.791 12.2553 11.6426 12.1069C11.4941 11.9584 11.2927 11.875 11.0828 11.875H7.9161C7.70614 11.875 7.50477 11.9584 7.35631 12.1069C7.20784 12.2553 7.12443 12.4567 7.12443 12.6667V16.625M14.0705 8.16209C13.9055 8.00411 13.6858 7.91592 13.4574 7.91592C13.2289 7.91592 13.0093 8.00411 12.8442 8.16209C12.4761 8.51321 11.9869 8.7091 11.4782 8.7091C10.9695 8.7091 10.4803 8.51321 10.1122 8.16209C9.94719 8.00434 9.72771 7.9163 9.49943 7.9163C9.27116 7.9163 9.05168 8.00434 8.88668 8.16209C8.51852 8.51344 8.02917 8.70948 7.52027 8.70948C7.01136 8.70948 6.52201 8.51344 6.15385 8.16209C5.98882 8.00411 5.76917 7.91592 5.5407 7.91592C5.31224 7.91592 5.09259 8.00411 4.92756 8.16209C4.57198 8.50141 4.10286 8.69628 3.61151 8.70878C3.12017 8.72127 2.64175 8.55049 2.26938 8.22968C1.89702 7.90887 1.65734 7.46099 1.597 6.9732C1.53667 6.48542 1.66 5.99263 1.94298 5.59076L4.2301 2.27843C4.37522 2.06429 4.57059 1.88897 4.79913 1.7678C5.02767 1.64663 5.28242 1.5833 5.5411 1.58334H13.4578C13.7157 1.58324 13.9697 1.64616 14.1978 1.7666C14.4259 1.88705 14.6211 2.0614 14.7664 2.27447L17.0583 5.59314C17.3413 5.99532 17.4645 6.48848 17.4038 6.97652C17.3431 7.46456 17.1028 7.91252 16.7299 8.2331C16.3569 8.55368 15.8779 8.72392 15.3863 8.71065C14.8947 8.69737 14.4256 8.50154 14.0705 8.1613" stroke="black" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M3.16602 8.66876V15.0417C3.16602 15.4616 3.33283 15.8643 3.62976 16.1613C3.9267 16.4582 4.32942 16.625 4.74935 16.625H14.2493C14.6693 16.625 15.072 16.4582 15.3689 16.1613C15.6659 15.8643 15.8327 15.4616 15.8327 15.0417V8.66876" stroke="black" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const UserIconCustom = () => (
  <svg width="20" height="20" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.3474 16.2092C15.9328 13.7635 13.6651 12.0936 11.0379 11.4916C15.1859 9.79213 15.9387 4.23958 12.3929 1.49701C8.84712 -1.24556 3.66208 0.878761 3.05984 5.3208C2.7035 7.94905 4.16824 10.486 6.62255 11.4916C3.9987 12.091 1.72767 13.7635 0.312981 16.2092C0.190761 16.4429 0.367305 16.7212 0.630763 16.7102C0.742782 16.7055 0.845425 16.6464 0.905569 16.5517C2.57888 13.6564 5.54355 11.9275 8.83021 11.9275C12.1169 11.9275 15.0815 13.6564 16.7548 16.5517C16.816 16.6576 16.9289 16.7229 17.0511 16.723C17.1113 16.7232 17.1705 16.7072 17.2224 16.6768C17.3859 16.5821 17.4418 16.3729 17.3474 16.2092ZM3.69212 6.1043C3.69212 2.149 7.97386 -0.323059 11.3993 1.65459C14.8246 3.63224 14.8246 8.57637 11.3993 10.554C10.6182 11.005 9.73213 11.2424 8.83021 11.2424C5.9939 11.2391 3.69543 8.94062 3.69212 6.1043Z" fill="black" stroke="black" strokeWidth="0.5459"></path>
  </svg>
);

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

const HighlightMatch = ({ text, query, reverse = false }) => {
  if (!query) return <span className="text-[#1A1A1A]">{text}</span>;
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return (
    <span className="text-[#1A1A1A]">
      {parts.map((part, i) => {
        const isMatch = part.toLowerCase() === query.toLowerCase();
        if (reverse) {
          return isMatch ? (
            part
          ) : (
            <strong key={i} className="font-bold text-black">
              {part}
            </strong>
          );
        } else {
          return isMatch ? (
            <strong key={i} className="font-semibold text-black">
              {part}
            </strong>
          ) : (
            part
          );
        }
      })}
    </span>
  );
};

const MOCK_CATEGORIES = [
  { title: "Solitaire Rings", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Lucira_product_33902_jpg.jpg?v=1780118511", href: "/collections/solitaire-rings" },
  { title: "Solitaire Earrings", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Lucira_product_34170_jpg.jpg?v=1780118511", href: "/collections/solitaire-earrings" },
  { title: "Solitaire Pendant", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Lucira_product_34015_jpg.jpg?v=1780118511", href: "/collections/solitaire-pendants" },
  { title: "Solitaire Bracelets", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/BR0058_jpg.jpg?v=1780118511", href: "/collections/solitaire-bracelets" },
  { title: "Men's Solitaire", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/search_men_solitairea.jpg?v=1780382143", href: "/collections/solitaires-for-men" },
  { title: "Solitaire Necklaces", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/search_necklace.jpg?v=1780382136", href: "/collections/solitaire-necklaces" },
];
import { transformMenuData } from "@/lib/menus";

export default function MobileHeader({ menuData }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const isProductPage = pathname.startsWith('/products/');
  const isBYJPage = pathname.startsWith('/build-your-jewelry');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [bestsellers, setBestsellers] = useState([]);
  const [isLoadingBestsellers, setIsLoadingBestsellers] = useState(false);
  const searchInputRef = useRef(null);

  const MEGA_MENU = useMemo(() => transformMenuData(menuData || []), [menuData]);

  const { user, logout: authLogout, openLogin } = useAuth();
  const { totalQuantity, items, totalAmount } = useSelector((state) => state.cart);
  const wishlistItems = useSelector((state) => state.wishlist.items);

  // Filter out non-product items (Insurance, Free Gold Coins, BYJ charms) to match Cart Page count
  const displayItems = (items || []).filter(
    (item) =>
      item.variantId !== INSURANCE_VARIANT_ID &&
      !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift) &&
      !item.properties?.['_byj_parent'] &&
      !item.properties?.[' _byj_parent'] &&
      !(item.properties?.['_byj_group_id'] && !item.properties?.['_byj_preview'])
  );

  const displayQuantity = displayItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const [activeMenuPath, setActiveMenuPath] = useState([]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [menuDirection, setMenuDirection] = useState(1);

  // Fetch Bestsellers
  useEffect(() => {
    const getBestsellers = async () => {
      if (showSearch && searchQuery.length === 0 && bestsellers.length === 0) {
        setIsLoadingBestsellers(true);
        try {
          const data = await fetchCollectionProducts({ handle: "bestseller", limit: 3 });
          const formatPrice = (num) => {
            if (!num && num !== 0) return "";
            return "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(Number(num)));
          };
          const mapped = (data.products || []).map(p => ({
            id: p.shopifyId || p.id,
            title: p.title,
            url: `/products/${p.handle}`,
            image: p.image || p.variants?.[0]?.image || "",
            price: formatPrice(p.price_breakup?.total || p.price),
          }));
          setBestsellers(mapped.slice(0, 3));
        } catch (err) {
          console.error("Error fetching bestsellers:", err);
        } finally {
          setIsLoadingBestsellers(false);
        }
      }
    };
    getBestsellers();
  }, [showSearch, searchQuery, bestsellers.length]);

  //GTM begain
  const handleCartClick = () => {
    if (items && items.length > 0) {
      const getNumericIdLocal = (gid) => {
        if (!gid) return 0;
        if (typeof gid === 'number') return gid;
        const match = String(gid).match(/\d+$/);
        return match ? Number(match[0]) : 0;
      };

      const filteredItemsForGtm = items.filter(
        (item) =>
          item.variantId !== INSURANCE_VARIANT_ID &&
          !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift) &&
          !item.properties?.['_byj_parent'] &&
          !item.properties?.[' _byj_parent'] &&
          !(item.properties?.['_byj_group_id'] && !item.properties?.['_byj_preview'])
      );

      pushViewCart({
        currency: "INR",
        cart_total: Number(totalAmount),
        grand_total: Number(totalAmount),
        discount_amount: 0,
        total_quantity: displayQuantity,
        total_product: filteredItemsForGtm.length,
        coupon_code: "",
        items: filteredItemsForGtm.map((item, idx) => getStandardCartItem(item, idx))
      });
    }
  };
  //GTM end

  useEffect(() => {
    if (!isMenuOpen) {
      setActiveMenuPath([]);
      setMenuDirection(1);
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchQuery.length > 1) {
        setIsSearching(true);
        try {
          const data = await fetchSearchResults(debouncedSearchQuery);
          setSearchResults(data.results || []);
        } catch (err) {
          console.error("Search error:", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    };

    performSearch();
  }, [debouncedSearchQuery]);

  const suggestionData = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const getAutocompleteSuggestion = (title, query) => {
      const titleLower = title.toLowerCase();
      const queryLower = query.toLowerCase();

      if (titleLower.startsWith(queryLower)) {
        return {
          suffix: title.slice(query.length),
          completeText: title
        };
      }

      const words = title.split(" ");
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (word.toLowerCase().startsWith(queryLower)) {
          const suffixOfWord = word.slice(query.length);
          const remainingWords = words.slice(i + 1).join(" ");
          const suffix = suffixOfWord + (remainingWords ? " " + remainingWords : "");
          return {
            suffix: suffix,
            completeText: title
          };
        }
      }
      return null;
    };

    // 1. Try matched collections
    const matchedCol = searchResults.find(item => item.isCollection);
    if (matchedCol) {
      const match = getAutocompleteSuggestion(matchedCol.title, searchQuery);
      if (match) return match;
    }

    // 2. Try predefined placeholders
    for (const p of SEARCH_PLACEHOLDERS) {
      const match = getAutocompleteSuggestion(p, searchQuery);
      if (match) return match;
    }

    // 3. Try products
    const matchedProd = searchResults.find(item => !item.isCollection);
    if (matchedProd) {
      const match = getAutocompleteSuggestion(matchedProd.title, searchQuery);
      if (match) return match;
    }

    return null;
  }, [searchQuery, searchResults]);

  const suggestionSuffix = suggestionData ? suggestionData.suffix : "";

  // --- Track what users actually search (the typed term, not just the bar tap) ---
  const trackedSearchQuery = useDebounce(searchQuery, 1200);
  const lastTrackedSearchRef = useRef("");

  const trackSearchTerm = (term) => {
    const cleaned = (term || "").trim();
    if (cleaned.length < 2) return;
    if (cleaned.toLowerCase() === lastTrackedSearchRef.current.toLowerCase()) return;
    lastTrackedSearchRef.current = cleaned;

    pushPromoClick({
      creative_name: "Search Bar Term",
      location_id: pathname === "/" ? "homepage" : pathname.startsWith("/products/") ? "pdp" : pathname.startsWith("/collections/") ? "plp" : "inner pages",
      promo_id: cleaned,
      promo_name: cleaned,
    });
  };

  useEffect(() => {
    trackSearchTerm(trackedSearchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackedSearchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (e) => {
    if ((e.key === "Tab" || e.key === "ArrowRight") && suggestionSuffix) {
      e.preventDefault();
      setSearchQuery(searchQuery + suggestionSuffix);
    } else if (e.key === "Enter" && searchQuery.trim().length > 0) {
      trackSearchTerm(searchQuery);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
    }
  };

  const handleResultClick = (href) => {
    if (!href) return;
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    router.push(href);
  };

  const renderSearchContent = () => {
    const productsOnly = searchResults.filter(item => !item.isCollection);
    const matchedCollections = searchResults
      .filter(item => item.isCollection)
      .sort((a, b) => {
        const aExact = a.title.toLowerCase() === searchQuery.toLowerCase();
        const bExact = b.title.toLowerCase() === searchQuery.toLowerCase();
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      });

    return (
      <div className="flex flex-col h-full bg-white px-4">
        <div className="flex items-center gap-3 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <button onClick={() => setShowSearch(false)} className="p-1">
            <ChevronLeft size={24} />
          </button>
          <div className="relative flex-grow bg-gray-50 focus-within:ring-1 focus-within:ring-gray-200 rounded-full h-11">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-30">
              <SearchIcon />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for jewelry..."
              className="w-full h-full bg-transparent pl-10 pr-10 rounded-full text-sm outline-none relative z-20"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            {/* Autocomplete Ghost Suggestion */}
            {searchQuery && suggestionSuffix && (
              <div className="absolute inset-0 flex items-center pointer-events-none z-10 pl-10 pr-10 py-2 text-sm font-medium whitespace-pre">
                <span className="text-transparent">{searchQuery}</span>
                <span className="text-gray-400 select-none">{suggestionSuffix}</span>
              </div>
            )}
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 z-30"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="grow overflow-y-auto py-4 pb-20">
          {searchQuery.length > 0 ? (
            <div className="space-y-8">
              {isSearching ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-4 animate-pulse px-2">
                      <div className="w-14 h-14 bg-gray-100 rounded-lg" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                        <div className="h-2.5 bg-gray-100 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (matchedCollections.length > 0 || productsOnly.length > 0) ? (
                <>
                  {/* Collections Section */}
                  {matchedCollections.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Collections</h3>
                      <div className="space-y-2">
                        {matchedCollections.slice(0, 6).map((col) => (
                          <div
                            key={col.id}
                            onClick={() => handleResultClick(col.url)}
                            className="group block p-3 bg-zinc-50 rounded-lg border border-zinc-100 active:bg-white transition-all duration-300"
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-gray-900">
                                <HighlightMatch text={col.title} query={searchQuery} reverse={true} />
                              </h4>
                              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mt-1">
                                Collection
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Products Section */}
                  {productsOnly.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Products</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {productsOnly.slice(0, 6).map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleResultClick(item.url)}
                            className="flex items-center gap-3 p-2 rounded-md active:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors"
                          >
                            <div className="w-16 h-16 relative rounded-md overflow-hidden shrink-0 bg-transparent">
                              <Image
                                src={item.image || "/images/product/1.jpg"}
                                alt={item.title}
                                fill
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div className="grow min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                <HighlightMatch text={item.title} query={searchQuery} />
                              </h4>
                              <p className="text-xs text-gray-500 font-bold mt-1">{item.price}</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-300" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleResultClick(`/search?q=${encodeURIComponent(searchQuery.trim())}`)}
                      className="w-full text-center text-primary font-bold text-sm py-3 uppercase tracking-widest hover:underline decoration-primary/30 underline-offset-4"
                    >
                      View All Results for "{searchQuery}"
                    </button>
                  </div>
                </>
              ) : searchQuery.length > 1 && (
                <div className="text-center py-20">
                  <p className="text-gray-500">No results found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Categories</h3>
                <div className="grid grid-cols-3 gap-3">
                  {MOCK_CATEGORIES.map((cat, i) => (
                    <div
                      key={i}
                      onClick={() => handleResultClick(cat.href)}
                      className="group flex flex-col items-center"
                    >
                      <div className="aspect-square w-full relative rounded-md overflow-hidden mb-2 bg-transparent border border-transparent hover:border-gray-100 transition-all">
                        <Image
                          src={cat.image}
                          alt={cat.title}
                          fill
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-400"
                        />
                      </div>
                      <p className="text-[10px] font-bold text-gray-700 text-center uppercase tracking-tight leading-tight">
                        {cat.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bestsellers Section */}
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Bestseller Products</h3>
                {isLoadingBestsellers ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-4 animate-pulse px-1">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg" />
                        <div className="flex-1 space-y-2 py-2">
                          <div className="h-3 bg-gray-100 rounded w-3/4" />
                          <div className="h-2.5 bg-gray-100 rounded w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : bestsellers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {bestsellers.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleResultClick(item.url)}
                        className="flex items-center gap-3 p-2 rounded-md active:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors"
                      >
                        <div className="w-16 h-16 relative rounded-md overflow-hidden shrink-0 bg-transparent">
                          <Image
                            src={item.image || "/images/product/1.jpg"}
                            alt={item.title}
                            fill
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="grow min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {item.title}
                          </h4>
                          <p className="text-xs text-gray-500 font-bold mt-1">{item.price}</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-300" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic px-1">No bestsellers available</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleLogout = async () => {
    try {
      pushLogout({
        id: user?.id || "",
        mobile: user?.mobile || "",
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        email: user?.email || ""
      });
      await apiFetch("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({
          email: user?.email,
          mobile: user?.mobile,
          firstName: user?.first_name,
          lastName: user?.last_name
        })
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      authLogout();
      dispatch(clearCart());
      dispatch(restoreGuestWishlist());
      const currentPath = window.location.pathname;
      if (currentPath.startsWith("/admin") || currentPath.startsWith("/dashboard")) {
        router.push("/login");
      } else {
        router.refresh();
      }
    }
  };

  const getCurrentMenu = () => {
    let current = MEGA_MENU;
    for (const index of activeMenuPath) {
      const item = current[index];
      if (item.columns) {
        current = item.columns;
      } else if (item.items) {
        current = item.items;
      } else if (item.featured) {
        current = item.featured;
      }
    }
    return current;
  };

  const getActiveItem = () => {
    if (activeMenuPath.length === 0) return null;
    let current = MEGA_MENU;
    let item = null;
    for (let i = 0; i < activeMenuPath.length; i++) {
      item = current[activeMenuPath[i]];
      if (i < activeMenuPath.length - 1) {
        if (item.columns) current = item.columns;
        else if (item.items) current = item.items;
        else if (item.featured) current = item.featured;
      }
    }
    return item;
  };

  const getMenuTitle = () => {
    const activeItem = getActiveItem();
    return activeItem ? (activeItem.label || activeItem.title) : <LuciraLogo className="w-6" />;
  };

  const handleBack = () => {
    setMenuDirection(-1);
    setActiveMenuPath(prev => prev.slice(0, -1));
  };

  const handleItemClick = (item, index) => {
    if (item.columns || item.items || (item.featured && Array.isArray(item.featured))) {
      setMenuDirection(1);
      setActiveMenuPath(prev => [...prev, index]);
    } else if (item.href) {
      setIsMenuOpen(false);
      router.push(item.href);
    }
  };

  const renderSubMenu = (activeItem) => {
    return (
      <div className="flex flex-col px-4 py-2">
        <Accordion type="multiple" className="w-full" defaultValue={activeItem.columns?.map((_, i) => `item-${i}`)}>
          {activeItem.columns?.map((col, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`} className="border-none">
              <AccordionTrigger className="text-sm font-semibold capitalize font-figtree tracking-widest hover:no-underline py-4">
                {col.title}
              </AccordionTrigger>
              <AccordionContent>
                {(col.type === "icon" || col.type === "metal") && (
                  <div className="grid grid-cols-3 gap-y-6 gap-x-2 pt-2">
                    {col.items.map((item, i) => {
                      const titleLower = col.title.toLowerCase();
                      const isShape = titleLower.includes("shape");
                      const isMetal = titleLower.includes("metal") || titleLower.includes("material") || col.type === "metal";

                      if (isMetal) {
                        return (
                          <Link
                            key={i}
                            href={item.href || "#"}
                            prefetch={false}
                            onClick={() => setIsMenuOpen(false)}
                            className="flex flex-col items-center gap-2"
                          >
                            <div
                              className="w-12 h-12 rounded-full border border-gray-100"
                              style={{ background: METAL_COLORS[item.label] || "#eee" }}
                            />
                            <span className="text-[13px] font-figtree text-center font-normal leading-tight">{item.label}</span>
                          </Link>
                        );
                      }

                      const iconPath = item.menuIcon || item.megaMenuImage || item.icon;
                      const isBlogOrPage = item.href?.includes("/blogs/") || item.href?.includes("/pages/");
                      return (
                        <Link
                          key={i}
                          href={item.href || "#"}
                          prefetch={false}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex flex-col items-center gap-2"
                        >
                          <div className={cn(
                            "relative flex items-center justify-center overflow-hidden",
                            isBlogOrPage ? "w-20 h-20 rounded-lg" : "w-20 h-20"
                          )}>
                            <SafeImage
                              src={iconPath}
                              alt={item.label}
                              className={cn(
                                "w-full h-full",
                                isBlogOrPage ? "object-cover" : "object-contain"
                              )}
                            />
                          </div>
                          <span className="text-[13px] font-figtree text-center font-normal leading-tight">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
                {col.type === "text" && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {col.items.map((item, i) => (
                      <Link
                        key={i}
                        href={item.href || "#"}
                        prefetch={false}
                        onClick={() => setIsMenuOpen(false)}
                        className="bg-gray-50 px-3 py-2 text-[11px] font-medium text-center rounded-sm"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}

          {activeItem.featured && (Array.isArray(activeItem.featured) ? activeItem.featured.length > 0 : activeItem.featured.items?.length > 0) && (
            <>
              <AccordionItem value="featured" className="border-none">
                <AccordionTrigger className="text-sm font-bold uppercase tracking-widest hover:no-underline py-4">
                  {activeItem.featured.title || "Featured"}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col space-y-3 pt-2">
                    {(Array.isArray(activeItem.featured) ? activeItem.featured : activeItem.featured.items).map((f, i) => {
                      const fIcon = f.menuIcon || f.icon || f.megaMenuImage;
                      const isBlogOrPage = f.href?.includes("/blogs/") || f.href?.includes("/pages/");
                      return (
                        <Link key={i} href={f.href || "#"} prefetch={false} onClick={() => setIsMenuOpen(false)} className="text-sm font-medium text-gray-900 flex items-center gap-3">
                          {fIcon && (
                            <div className={cn(
                              "relative flex items-center justify-center bg-gray-50 overflow-hidden shrink-0",
                              isBlogOrPage ? "w-10 h-10 rounded-lg" : "w-8 h-8 rounded-full"
                            )}>
                              <SafeImage
                                src={fIcon}
                                alt={f.label}
                                className={cn(
                                  "w-full h-full",
                                  isBlogOrPage ? "object-cover" : "object-contain p-1"
                                )}
                              />
                            </div>
                          )}
                          {f.label}
                        </Link>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {!Array.isArray(activeItem.featured) && activeItem.featured.featuredIn && activeItem.featured.featuredIn.items?.length > 0 && (
                <AccordionItem value="featuredIn" className="border-none">
                  <AccordionTrigger className="text-sm font-bold uppercase tracking-widest hover:no-underline py-4">
                    {activeItem.featured.featuredIn.title || "Featured In"}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col space-y-3 pt-2">
                      {activeItem.featured.featuredIn.items.map((f, i) => {
                        const fIcon = f.menuIcon || f.icon || f.megaMenuImage;
                        return (
                          <Link key={i} href={f.href || "#"} prefetch={false} onClick={() => setIsMenuOpen(false)} className="text-sm font-medium text-gray-900 flex items-center gap-3">
                            {fIcon && (
                              <div className="w-8 h-8 relative flex items-center justify-center bg-gray-50 rounded-full overflow-hidden shrink-0">
                                <SafeImage
                                  src={fIcon}
                                  alt={f.label}
                                  className="w-6 h-6 object-contain"
                                />
                              </div>
                            )}
                            {f.label}
                          </Link>
                        )
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </>
          )}
        </Accordion>
      </div>
    );
  };

  const isAuthPage = pathname === "/login" || pathname === "/register";

  const handleAuthTrigger = () => {
    if (isAuthPage) return;
    openLogin();
  };

  const renderCollectionsGrid = (activeItem) => {
    const items = activeItem.items || activeItem.cards || [];
    return (
      <div className="flex flex-col pb-8">
        <div className="grid grid-cols-2 gap-3 px-4 py-4">
          {items.map((item, index) => {
            const label = item.title || item.label;
            const image = item.image || CATEGORY_IMAGES[label] || "/images/menu/engagement-ring.jpg";
            return (
              <Link
                key={index}
                href={item.href || "#"}
                prefetch={false}
                onClick={() => setIsMenuOpen(false)}
                className="relative aspect-4/4 overflow-hidden rounded-lg group bg-zinc-100"
              >
                <Image
                  src={image}
                  alt={label}
                  fill
                  className="object-cover transition-transform group-active:scale-105"
                />
                <div className="drawer-menu-image absolute inset-0 bg-black/10 group-active:bg-black/20 transition-colors" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="absolute bottom-0 left-0 text-white text-sm leading-none tracking-normal font-medium capitalize font-figtree sm:static sm:text-base sm:leading-normal sm:tracking-wide">
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMainMenu = () => {
    return (
      <div className="flex flex-col pb-8">
        {/* Horizontal Banner Slider */}
        <div className="flex px-4 pt-4 pb-2 overflow-x-auto snap-x snap-mandatory scroll-smooth gap-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
          {MENU_SLIDER_BANNERS.map((banner, index) => (
            <Link
              key={index}
              href={banner.href}
              prefetch={false}
              onClick={() => setIsMenuOpen(false)}
              className="shrink-0 snap-center rounded-xl overflow-hidden relative"
              style={{ width: 'calc(100% - 32px)', height: '165px' }}
            >
              <Image
                src={banner.image}
                alt={banner.alt}
                fill
                priority={index === 0}
                className="object-cover rounded-xl block transition-opacity duration-300"
              />
            </Link>
          ))}
        </div>

        {/* Text Category Links Grid */}
        <div className="grid grid-cols-2 gap-2.5 px-4 py-4">
          {MEGA_MENU.map((item, index) => {
            const label = item.label || item.title;
            const is9kt = label.toLowerCase().includes('9kt');
            const isLuciraExpress = label.toLowerCase().includes('lucira express');
            const icon = item.menuIcon ||
              (label.toUpperCase() === "GIFTING" ? CATEGORY_IMAGES["GIFTING"] :
                (isLuciraExpress ? "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/luciraExpress.png?v=1780129196" : null));

            return (
              <button
                key={index}
                onClick={() => handleItemClick(item, index)}
                className="bg-[#f8f8f8] rounded-xl p-2 text-left flex items-center gap-2 active:bg-gray-200 transition-all border border-gray-50/50"
              >
                <div className={cn(
                  "relative shrink-0 overflow-hidden rounded-lg flex items-center justify-center p-1",
                  isLuciraExpress ? "w-10 h-10" : "w-11 h-11"
                )}>
                  {icon && (
                    <Image
                      src={icon}
                      alt={label}
                      fill
                      className={cn(
                        "object-contain",
                        isLuciraExpress ? "p-2" : "p-0.5"
                      )}
                    />
                  )}
                </div>
                <div className="flex flex-col grow min-w-0">
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="text-[13px] font-semibold leading-tight font-figtree text-gray-900 line-clamp-2">
                      {label}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-6">
          <div className="px-4">
            <Link
              href="/build-your-jewelry"
              onClick={() => {
                pushPromoClick({
                  creative_name: "BYJ icon header",
                  location_id: pathname === "/" ? "homepage" : pathname.startsWith("/products/") ? "pdp" : pathname.startsWith("/collections/") ? "plp" : "inner pages",
                });
                setIsMenuOpen(false);
              }}
              className="block w-full"
            >
              <img
                src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Build_Your_Jewelry_Mobile_Menu_Bar_Upscale_jpg.jpg?v=1783416048"
                alt="Build Your Jewelry"
                className="w-full h-auto rounded-[4px] object-cover"
              />
            </Link>
          </div>
          <div className="bg-[#FAF6F3] mx-4 p-4 space-y-4 rounded-lg">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                if (!user) {
                  handleAuthTrigger();
                } else {
                  router.push("/admin/orders");
                }
              }}
              className="w-full text-left block tracking-wider border-b border-gray-200 pb-3 font-figtree font-medium text-sm leading-none align-middle capitalize text-black"
            >
              Track Your Order
            </button>
            <Link href="/pages/contact-us" prefetch={false} onClick={() => setIsMenuOpen(false)} className="block tracking-wider border-b border-gray-200 pb-3 font-figtree font-medium text-sm leading-none align-middle capitalize text-black">
              Contact Us
            </Link>
            <Link href="/pages/faqs" prefetch={false} onClick={() => setIsMenuOpen(false)} className="block text-[16px] tracking-wider font-figtree font-medium text-sm leading-none align-middle capitalize text-black">
              FAQs
            </Link>
          </div>

          <div className="px-4 space-y-1">
            <a href="https://api.whatsapp.com/send/?phone=%2B919004435760&text=I+want+to+know+more+about+Lucira+Jewelry" target="_blank" className="flex items-center justify-between p-4 border border-gray-100 rounded-lg group active:bg-gray-50 bg-[#FBF7F2]">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_1043_46659)">
                      <path d="M0.427148 9.88041C0.42668 11.5608 0.86918 13.2016 1.71059 14.6478L0.34668 19.589L5.44293 18.2631C6.85249 19.0245 8.43179 19.4235 10.0367 19.4236H10.0409C15.3389 19.4236 19.6517 15.1458 19.6539 9.88793C19.655 7.3401 18.6559 4.94428 16.8407 3.1418C15.0259 1.33948 12.6122 0.346378 10.0405 0.345215C4.74184 0.345215 0.429414 4.62273 0.427227 9.88041" fill="url(#paint0_linear_1043_46659)"></path>
                      <path d="M0.0835938 9.87721C0.0830469 11.6181 0.541406 13.3175 1.41281 14.8155L0 19.9339L5.27898 18.5605C6.73352 19.3474 8.37117 19.7622 10.0376 19.7629H10.0419C15.53 19.7629 19.9977 15.3312 20 9.88512C20.0009 7.24574 18.9659 4.7638 17.0859 2.89674C15.2057 1.02992 12.7057 0.00108527 10.0419 0C4.55281 0 0.0857813 4.43101 0.0835938 9.87721ZM3.22742 14.5575L3.03031 14.2471C2.20172 12.9398 1.76437 11.4291 1.765 9.87783C1.76672 5.35109 5.47953 1.66822 10.045 1.66822C12.2559 1.66915 14.3337 2.52434 15.8966 4.07597C17.4593 5.62775 18.3192 7.69054 18.3187 9.8845C18.3166 14.4112 14.6037 18.0946 10.0419 18.0946H10.0386C8.5532 18.0938 7.09641 17.698 5.82594 16.95L5.52359 16.7721L2.39094 17.5871L3.22742 14.5575Z" fill="url(#paint1_linear_1043_46659)"></path>
                      <path d="M7.55254 5.74776C7.36613 5.33668 7.16996 5.32838 6.9927 5.32117C6.84754 5.31497 6.6816 5.31544 6.51582 5.31544C6.34988 5.31544 6.08027 5.37738 5.85238 5.62427C5.62426 5.87141 4.98145 6.46862 4.98145 7.68327C4.98145 8.89792 5.87309 10.0719 5.99738 10.2368C6.12184 10.4013 7.71871 12.9737 10.2478 13.9633C12.3496 14.7857 12.7774 14.6222 13.2336 14.5809C13.6898 14.5399 14.7057 13.9839 14.913 13.4074C15.1204 12.8309 15.1204 12.3368 15.0582 12.2336C14.9961 12.1307 14.8301 12.0689 14.5813 11.9455C14.3325 11.8221 13.1091 11.2247 12.8811 11.1423C12.6529 11.06 12.4871 11.0189 12.3211 11.2661C12.1552 11.513 11.6787 12.0689 11.5335 12.2336C11.3884 12.3986 11.2432 12.4192 10.9944 12.2957C10.7454 12.1718 9.9441 11.9114 8.9934 11.0704C8.25371 10.416 7.75434 9.60784 7.60918 9.36063C7.46402 9.11381 7.59363 8.98001 7.7184 8.85699C7.8302 8.74637 7.9673 8.56869 8.09184 8.42459C8.2159 8.2804 8.2573 8.17753 8.34027 8.01288C8.42332 7.84807 8.38176 7.70389 8.31965 7.5804C8.2573 7.45691 7.77379 6.2359 7.55254 5.74776Z" fill="white"></path>
                    </g>
                    <defs>
                      <linearGradient id="paint0_linear_1043_46659" x1="965.71" y1="1924.73" x2="965.71" y2="0.345215" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#1FAF38"></stop>
                        <stop offset="1" stopColor="#60D669"></stop>
                      </linearGradient>
                      <linearGradient id="paint1_linear_1043_46659" x1="1000" y1="1993.39" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F9F9F9"></stop>
                        <stop offset="1" stopColor="white"></stop>
                      </linearGradient>
                      <clipPath id="clip0_1043_46659">
                        <rect width="20" height="20" fill="white"></rect>
                      </clipPath>
                    </defs>
                  </svg>
                </div>
                <div>
                  <h4 className="block mb-2 font-figtree font-semibold text-sm leading-none align-middle text-black">WhatsApp Us</h4>
                  <p className="mt-3 font-figtree font-normal text-[12px] leading-[1.4] align-middle text-black">Chat with us instantly for product details, styling tips, or quick assistance.</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-black" />
            </a>

            <Link
              href="/schemes"
              prefetch={false}
              onClick={() => {
                pushPromoClick({
                  creative_name: "scheme icon header",
                  location_id: pathname === "/" ? "homepage" : pathname.startsWith("/products/") ? "pdp" : pathname.startsWith("/collections/") ? "plp" : "inner pages",
                });
                setIsMenuOpen(false);
              }}
              className="flex items-center justify-between p-4 border border-gray-100 rounded-lg group active:bg-gray-50 bg-[#FBF7F2]"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="black" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M7.5 8C7.77614 8 8 7.77614 8 7.5C8 7.22386 7.77614 7 7.5 7C7.22386 7 7 7.22386 7 7.5C7 7.77614 7.22386 8 7.5 8Z" fill="black" stroke="black" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M7.90039 7.8999L10.6004 10.5999" stroke="black" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M16.5 8C16.7761 8 17 7.77614 17 7.5C17 7.22386 16.7761 7 16.5 7C16.2239 7 16 7.22386 16 7.5C16 7.77614 16.2239 8 16.5 8Z" fill="black" stroke="black" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M13.4004 10.5999L16.1004 7.8999" stroke="black" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M7.5 17C7.77614 17 8 16.7761 8 16.5C8 16.2239 7.77614 16 7.5 16C7.22386 16 7 16.2239 7 16.5C7 16.7761 7.22386 17 7.5 17Z" fill="black" stroke="black" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M7.90039 16.0999L10.6004 13.3999" stroke="black" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M16.5 17C16.7761 17 17 16.7761 17 16.5C17 16.2239 16.7761 16 16.5 16C16.2239 16 16 16.2239 16 16.5C16 16.7761 16.2239 17 16.5 17Z" fill="black" stroke="black" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M13.4004 13.3999L16.1004 16.0999" stroke="black" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="black" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="block mb-2 font-figtree font-semibold text-sm leading-none align-middle text-black">Vault Of Dreams</h4>
                  <p className="mt-3 font-figtree font-normal text-[12px] leading-[1.4] align-middle text-black">Pay for 9 months, and get the 10th month free, your smart jewellery savings plan.</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-black" />
            </Link>

            <Link href="/pages/video-call" prefetch={false} onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between p-4 bg-[#FBF7F2] border border-gray-100 rounded-lg group active:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.334 10.8334L17.6865 13.7351C17.7492 13.7768 17.8221 13.8008 17.8974 13.8044C17.9727 13.8044C18.0475 13.7911 18.114 13.7555C18.1804 13.7199 18.236 13.667 18.2747 13.6024C18.3135 13.5377 18.3339 13.4638 18.334 13.3884V6.55839C18.334 6.48508 18.3147 6.41306 18.278 6.3496C18.2413 6.28614 18.1884 6.23349 18.1249 6.19697C18.0613 6.16045 17.9892 6.14136 17.9159 6.1416C17.8426 6.14185 17.7706 6.16144 17.7073 6.19839L13.334 8.75006" stroke="black" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M11.667 5H3.33366C2.41318 5 1.66699 5.74619 1.66699 6.66667V13.3333C1.66699 14.2538 2.41318 15 3.33366 15H11.667C12.5875 15 13.3337 14.2538 13.3337 13.3333V6.66667C13.3337 5.74619 12.5875 5 11.667 5Z" stroke="black" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="block mb-2 font-figtree font-semibold text-sm leading-none align-middle text-black">Video Call</h4>
                  <p className="mt-3 font-figtree font-normal text-[12px] leading-[1.4] align-middle text-black">Explore and shop jewellery live with our experts over a video call.</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>

            <Link
              href="/pages/store-locator"
              prefetch={false}
              onClick={() => {
                setIsMenuOpen(false);
                // Derive page type for Find a Store datalayer location_id
                const loc = !pathname || pathname === "/" ? "homepage"
                  : pathname.startsWith("/products/") ? "pdp"
                    : pathname.startsWith("/collections/") ? "plp"
                      : "internal page";
                pushPromoClick({
                  creative_name: "Find a store cta header",
                  location_id: loc,
                });
              }}
              className="flex items-center justify-between p-4 bg-[#FBF7F2] border border-gray-100 rounded-lg group active:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.6636 8.85083V15.8333C16.6636 16.2754 16.488 16.6993 16.1755 17.0118C15.8629 17.3244 15.439 17.5 14.9969 17.5H5.00361C4.56173 17.4998 4.13802 17.3241 3.82564 17.0115C3.51326 16.699 3.33778 16.2752 3.33778 15.8333V8.85083M6.25194 7.29167L6.66861 2.5M6.25194 7.29167C6.25194 9.71 10.0003 9.71 10.0003 7.29167M6.25194 7.29167C6.25194 9.93833 1.95611 9.39167 2.55778 7.085L3.42861 3.74583C3.52168 3.38919 3.73034 3.07346 4.02196 2.84804C4.31358 2.62262 4.67169 2.50022 5.04028 2.5H14.9603C15.3289 2.50022 15.687 2.62262 15.9786 2.84804C16.2702 3.07346 16.4789 3.38919 16.5719 3.74583L17.4428 7.085C18.0444 9.3925 13.7486 9.93833 13.7486 7.29167M10.0003 7.29167V2.5M10.0003 7.29167C10.0003 9.71 13.7486 9.71 13.7486 7.29167M13.7486 7.29167L13.3319 2.5" stroke="black" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="block mb-2 font-figtree font-semibold text-sm leading-none align-middle text-black">Visit Store</h4>
                  <p className="mt-3 font-figtree font-normal text-[12px] leading-[1.4] align-middle text-black">Visit our stores to explore and try your favorite designs in person.</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>
          </div>

          <div className="px-4 pb-8">
            {user ? (
              <button onClick={handleLogout} className="w-full bg-[#4E3E3E] text-white py-4 rounded font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                <LogOut size={20} /> Logout
              </button>
            ) : (
              <button onClick={() => { setIsMenuOpen(false); handleAuthTrigger(); }} className="w-full bg-[#4E3E3E] text-white py-4 rounded font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                <UserIcon size={20} /> Log In / Sign Up
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const activeItem = getActiveItem();

  return (
    <div className="bg-white border-b border-gray-200 lg:hidden">
      <div className={cn("flex items-center justify-between px-4 py-3", isProductPage && "gap-3")}>
        <div className={cn("flex items-center shrink-0", isProductPage ? "gap-2.5" : "gap-4")}>
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <button className="p-1">
                <Menu size={24} strokeWidth={1.5} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full p-0 border-none" showCloseButton={false}>
              <div className="flex flex-col h-screen bg-white overflow-hidden">
                <SheetHeader className="px-4 py-4 border-b border-gray-200 flex flex-row items-center justify-between sticky top-0 bg-white z-10 shrink-0">
                  <div className="flex items-center gap-2">
                    {activeMenuPath.length > 0 ? (
                      <>
                        <button onClick={handleBack} className="p-1 mr-1">
                          <ChevronLeft size={20} />
                        </button>
                        <SheetTitle className="text-sm capitalize font-figtree tracking-widest font-figtree font-semibold leading-none align-middle">
                          {getMenuTitle()}
                        </SheetTitle>
                      </>
                    ) : (
                      <SheetTitle className="flex items-center">
                        <Image
                          src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/logo.svg"
                          alt="Lucira Jewelry"
                          width={100}
                          height={40}
                        />
                      </SheetTitle>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {user ? (
                      <Link href="/admin" prefetch={false} onClick={() => setIsMenuOpen(false)} className="p-1">
                        <Avatar className="h-7 w-7 cursor-pointer border border-gray-100">
                          {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                          <AvatarFallback className="bg-[#5a413f] text-white font-bold text-[10px]">{getInitials(user?.name)}</AvatarFallback>
                        </Avatar>
                      </Link>
                    ) : (
                      <button onClick={() => { setIsMenuOpen(false); handleAuthTrigger(); }} className="p-1">
                        <UserIconCustom />
                      </button>
                    )}
                    <Link href="/checkout/cart" prefetch={false} onClick={() => { setIsMenuOpen(false); handleCartClick(); }} className="relative p-1">
                      <CartIcon />
                      {displayQuantity > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                          {displayQuantity}
                        </span>
                      )}
                    </Link>
                    <SheetClose asChild>
                      <button className="p-1">
                        <X size={24} />
                      </button>
                    </SheetClose>
                  </div>
                </SheetHeader>

                <ScrollArea className="grow h-full overflow-y-auto overflow-x-hidden">
                  <AnimatePresence mode="wait" initial={false} custom={menuDirection}>
                    <motion.div
                      key={activeMenuPath.join('-') || 'root'}
                      custom={menuDirection}
                      variants={{
                        initial: (dir) => ({ x: dir === 1 ? '100%' : '-100%', opacity: 0.5 }),
                        animate: { x: 0, opacity: 1 },
                        exit: (dir) => ({ x: dir === 1 ? '-30%' : '100%', opacity: 0 }),
                      }}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
                    >
                      {activeMenuPath.length === 0 ? renderMainMenu() : (
                        (activeItem?.type === 'image-grid' || (activeItem?.label || activeItem?.title || '').toLowerCase().trim() === 'collections')
                          ? renderCollectionsGrid(activeItem)
                          : renderSubMenu(activeItem)
                      )}
                    </motion.div>
                  </AnimatePresence>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" prefetch={false} className="flex items-center shrink-0">
            {isProductPage ? (
              <img
                src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/lucira-logo-small.png?v=1782455718"
                alt="Lucira Logo"
                className="w-[24px] h-[36px] object-contain"
              />
            ) : (
              <Image
                src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/logo.svg"
                alt="Lucira Jewelry"
                width={80}
                height={32}
                priority
              />
            )}
          </Link>
        </div>

        {isProductPage && (
          <div
            onClick={() => {
              pushPromoClick({
                creative_name: "Search Bar clicked",
                location_id: "pdp",
                promo_id: searchQuery || "",
                promo_name: window.location.pathname
              });
              setShowSearch(true);
            }}
            className="grow bg-[#f5f5f5] h-10 px-3 rounded-md flex items-center cursor-pointer overflow-hidden gap-2.5"
          >
            <div className="text-gray-500 shrink-0 flex items-center justify-center">
              <SearchIcon />
            </div>
            <span className="text-[14px] text-gray-500 font-medium whitespace-nowrap">
              Search here
            </span>
          </div>
        )}

        <div className={cn("flex items-center shrink-0", isProductPage ? "gap-3" : "gap-4")}>
          {!isProductPage && (
            <>
              <Link
                href="/schemes"
                prefetch={false}
                onClick={() => {
                  pushPromoClick({
                    creative_name: "scheme icon header",
                    location_id: pathname === "/" ? "homepage" : pathname.startsWith("/products/") ? "pdp" : pathname.startsWith("/collections/") ? "plp" : "inner pages",
                  });
                }}
                className="relative w-8 h-8 flex items-center justify-center shrink-0"
              >
                <img
                  src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/m507t0003_16june22_icon_safe_box_04_1.jpg?v=1781505691"
                  alt="Scheme"
                  className="w-full h-full object-contain"
                />
              </Link>

              {user ? (
                <Link href="/admin" prefetch={false} className="p-1" id="nitro-login">
                  <Avatar className="h-7 w-7 cursor-pointer border border-gray-100">
                    {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                    <AvatarFallback className="bg-[#5a413f] text-white font-bold text-[10px]">{getInitials(user?.name)}</AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <button onClick={handleAuthTrigger} className="p-1" id="nitro-login">
                  <UserIconCustom />
                </button>
              )}
            </>
          )}

          <Link href={user ? "/admin/wishlist" : "#"} prefetch={false} onClick={!user ? handleAuthTrigger : undefined} className="relative p-1">
            <HeartIcon />
            {wishlistItems.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                {wishlistItems.length}
              </span>
            )}
          </Link>
          <Link href="/checkout/cart" prefetch={false} onClick={handleCartClick} className="relative p-1">
            <CartIcon />
            {displayQuantity > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                {displayQuantity}
              </span>
            )}
          </Link>
        </div>
      </div>

      {!isProductPage && !isBYJPage && (
        <div className="px-4 py-2 bg-white">
          <div
            onClick={() => {
              pushPromoClick({
                creative_name: "Search Bar clicked",
                location_id: pathname === "/" ? "homepage" : pathname.startsWith("/products/") ? "pdp" : pathname.startsWith("/collections/") ? "plp" : "inner pages",
                promo_id: searchQuery || "",
                promo_name: window.location.pathname
              });
              setShowSearch(true);
            }}
            className="relative w-full bg-[#f9f9f9] h-10 pl-10 pr-4 rounded-sm flex items-center cursor-pointer border border-transparent transition-all overflow-hidden"
          >
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
              <SearchIcon />
            </div>
            <div className="relative h-full w-full flex items-center overflow-hidden ml-0.5">
              <span className="text-[14px] text-gray-500 font-medium whitespace-nowrap">Search for&nbsp;</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={placeholderIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="text-[14px] text-gray-500 font-medium whitespace-nowrap"
                >
                  {SEARCH_PLACEHOLDERS[placeholderIndex]}...
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      <MobileSheet
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        detents={[1]}
      >
        <MobileSheet.Container>
          <MobileSheet.Header />
          <MobileSheet.Content>
            {renderSearchContent()}
          </MobileSheet.Content>
        </MobileSheet.Container>
        <MobileSheet.Backdrop />
      </MobileSheet>
    </div>
  );
}
