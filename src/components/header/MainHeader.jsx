"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { LogOut } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import SearchPopup from "./SearchPopup";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { pushLogout, pushViewCart, getStandardCartItem, pushPromoClick } from "@/lib/gtm";
import { useAuth } from "@/hooks/useAuth";
import { useDispatch, useSelector } from "react-redux";
import { setAvatar } from "@/redux/features/user/userSlice";
import { fetchCart, clearCart } from "@/redux/features/cart/cartSlice";
import {
  mergeGuestWishlist,
  restoreGuestWishlist,
  clearWishlist,
} from "@/redux/features/wishlist/wishlistSlice";
import { useDebounce } from "@/hooks/useDebounce";
import { apiFetch, fetchSearchResults } from "@/lib/api";
import PincodePicker from "./PincodePicker";

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const GOLDCOIN_VARIANT_ID = "gid://shopify/ProductVariant/47661824082138";


const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

// Custom SVG Icons
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.16667 15.8333C12.8486 15.8333 15.8333 12.8486 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333Z" stroke="black" strokeWidth="1.17914" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M17.499 17.5L13.874 13.875" stroke="black" strokeWidth="1.17914" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const UserIconCustom = () => (
  <svg width="20" height="20" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.3474 16.2092C15.9328 13.7635 13.6651 12.0936 11.0379 11.4916C15.1859 9.79213 15.9387 4.23958 12.3929 1.49701C8.84712 -1.24556 3.66208 0.878761 3.05984 5.3208C2.7035 7.94905 4.16824 10.486 6.62255 11.4916C3.9987 12.091 1.72767 13.7635 0.312981 16.2092C0.190761 16.4429 0.367305 16.7212 0.630763 16.7102C0.742782 16.7055 0.845425 16.6464 0.905569 16.5517C2.57888 13.6564 5.54355 11.9275 8.83021 11.9275C12.1169 11.9275 15.0815 13.6564 16.7548 16.5517C16.816 16.6576 16.9289 16.7229 17.0511 16.723C17.1113 16.7232 17.1705 16.7072 17.2224 16.6768C17.3859 16.5821 17.4418 16.3729 17.3474 16.2092ZM3.69212 6.1043C3.69212 2.149 7.97386 -0.323059 11.3993 1.65459C14.8246 3.63224 14.8246 8.57637 11.3993 10.554C10.6182 11.005 9.73213 11.2424 8.83021 11.2424C5.9939 11.2391 3.69543 8.94062 3.69212 6.1043Z" fill="black" stroke="black" strokeWidth="0.5459"></path>
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

const SEARCH_PLACEHOLDERS = [
  "Engagement Rings",
  "Solitaire Rings",
  "Diamond Earrings",
  "Gold Necklaces",
  "Tennis Necklaces",
];

export default function MainHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout: authLogout, openLogin } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Derive page type for Find a Store datalayer location_id
  const getFindStoreLocationId = () => {
    if (!pathname || pathname === "/") return "homepage";
    if (pathname.startsWith("/products/")) return "pdp";
    if (pathname.startsWith("/collections/")) return "plp";
    return "internal page";
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const dispatch = useDispatch();
  const { totalQuantity, totalAmount, items, loading: cartLoading } = useSelector((state) => state.cart);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const guestWishlistItems = useSelector((state) => state.wishlist.guestItems);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  //GTM begain
  const handleCartClick = () => {
    if (items && items.length > 0) {
      const getNumericId = (gid) => {
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
    // Skip auto-fetch if cart is currently loading (mergeCart triggered by login is in progress).
    // Reading cartLoading via a ref avoids adding it to deps (which would cause infinite loops).
    // mergeCart will call fetchCart itself when complete, so we don't need to race it.
    if (cartLoading) return;
    dispatch(fetchCart({ userId: user?.id }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, user?.id]);

  useEffect(() => {
    // Handle Wishlist Sync
    if (user?.id) {
      if (wishlistItems.length === 0) {
        dispatch(mergeGuestWishlist());
      }
    } else {
      if (guestWishlistItems.length > 0) {
        if (wishlistItems.length !== guestWishlistItems.length) {
          dispatch(restoreGuestWishlist());
        }
      } else if (wishlistItems.length > 0) {
        dispatch(clearWishlist());
      }
    }
  }, [dispatch, user?.id, guestWishlistItems.length]);

  useEffect(() => {
    // Fetch avatar if user is logged in but avatar is not in state
    const fetchUserAvatar = async () => {
      try {
        const data = await apiFetch("/api/customer/profile/avatar");
        if (data.avatar) {
          dispatch(setAvatar(data.avatar));
        }
      } catch (err) {
        console.error("Header avatar fetch error:", err);
      }
    };

    if (user?.id && !user.avatar) {
      fetchUserAvatar();
    }

    // Listen for profile updates to refresh avatar
    const handleProfileUpdate = () => {
      if (user?.id) {
        fetchUserAvatar();
      }
    };

    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, [dispatch, user?.id, user?.avatar]);

  // The header persists across client-side navigations, so the typed term would
  // otherwise follow the shopper onto the next page. /search is the exception —
  // there the term is what the page is showing.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (pathname !== "/search") {
      setSearchQuery("");
      setSearchResults([]);
      setIsSearchOpen(false);
      setIsFocused(false);
    }
  }

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchQuery.trim().length >= 3) {
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

  // --- Track what users actually search (the typed term, not just the bar click) ---
  // A longer debounce so we capture the settled term the user finished typing,
  // instead of every intermediate keystroke prefix.
  const trackedSearchQuery = useDebounce(searchQuery, 1200);
  const lastTrackedSearchRef = useRef("");

  const trackSearchTerm = (term) => {
    const cleaned = (term || "").trim();
    if (cleaned.length < 2) return;
    // Avoid pushing the same term twice in a row
    if (cleaned.toLowerCase() === lastTrackedSearchRef.current.toLowerCase()) return;
    lastTrackedSearchRef.current = cleaned;

    pushPromoClick({
      creative_name: "Search Bar Term",
      location_id: getFindStoreLocationId(),
      promo_id: cleaned,
      promo_name: cleaned,
    });

    // Save to Recent Searches
    try {
      const stored = localStorage.getItem("@recent_searches");
      let searches = stored ? JSON.parse(stored) : [];
      searches = searches.filter(s => s.toLowerCase() !== cleaned.toLowerCase());
      searches.unshift(cleaned);
      if (searches.length > 10) searches = searches.slice(0, 10);
      localStorage.setItem("@recent_searches", JSON.stringify(searches));
    } catch (e) {
      console.log("Failed to save recent search", e);
    }
  };

  useEffect(() => {
    trackSearchTerm(trackedSearchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackedSearchQuery]);

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
      setIsFocused(false);
    }
  };

  const handleLogout = async () => {
    try {
      //gtm
      pushLogout({
        id: user?.id || "",
        mobile: user?.mobile || "",
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        email: user?.email || ""
      });
      //gtm
      const sourcePage = typeof window !== 'undefined' ? window.location.pathname : '/';
      await apiFetch("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({
          email: user?.email,
          mobile: user?.mobile,
          firstName: user?.first_name,
          lastName: user?.last_name,
          sourcePage
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

  const showSearch = isSearchOpen || isFocused;

  return (
    <div className="bg-white relative">
      <div className="container-main flex items-center py-4 border-b border-[#f2f2f2]">

        {/* Logo */}
        <div className="flex items-center mr-8 lg:mr-16 shrink-0">
          <Link href="/" prefetch={false}>
            <Image
              src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/logo.svg"
              alt="Lucira Jewelry"
              width={100}
              height={40}
              className="w-21.25 h-7.5 lg:w-25 lg:h-10"
              priority
            />
          </Link>
        </div>

        {/* Search Input and Dropdown Wrapper */}
        <div className={`flex-1 max-w-137.5 relative ${showSearch ? "z-1001 overflow-visible" : "z-10"}`}>
          <div className="relative w-full">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 pointer-events-none z-30">
              <SearchIcon />
            </div>
            <div className="relative w-full bg-[#F9F9F9] focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-200 rounded-sm transition-all h-10">
              <input
                type="text"
                placeholder=""
                className="w-full h-full pl-11.25 pr-2.5 py-2 bg-transparent text-base font-medium outline-none relative z-20"
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  setTimeout(() => setIsFocused(false), 200);
                }}
                onClick={() => {
                  pushPromoClick({
                    creative_name: "Search Bar clicked",
                    location_id: pathname === "/" ? "homepage" : pathname.startsWith("/products/") ? "pdp" : pathname.startsWith("/collections/") ? "plp" : "inner pages",
                    promo_id: searchQuery || "",
                    promo_name: window.location.pathname
                  });
                  setIsFocused(true);
                }}
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
              />

              {/* Autocomplete Ghost Suggestion */}
              {isFocused && searchQuery && suggestionSuffix && (
                <div className="absolute inset-0 flex items-center pointer-events-none z-10 pl-11.25 pr-2.5 py-2 text-base font-medium whitespace-pre">
                  <span className="text-transparent">{searchQuery}</span>
                  <span className="text-gray-400 select-none">{suggestionSuffix}</span>
                </div>
              )}

              {/* Animated Placeholder Ticker */}
              {!isFocused && !searchQuery && (
                <div className="absolute inset-0 flex items-center pointer-events-none z-30 overflow-hidden pl-11.25">
                  <span className="text-base text-gray-500 font-medium whitespace-nowrap">Search for&nbsp;</span>
                  <div className="relative h-full flex items-center overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={placeholderIndex}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="text-base text-gray-500 font-medium whitespace-nowrap"
                      >
                        {SEARCH_PLACEHOLDERS[placeholderIndex]}...
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            <AnimatePresence>
              {showSearch && (
                <SearchPopup
                  onClose={() => setIsFocused(false)}
                  searchQuery={searchQuery}
                  searchResults={searchResults}
                  isSearching={isSearching}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Icons */}
        <div className="flex items-center justify-end ml-auto lg:gap-3 xl:gap-6 text-sm">

          {!pathname?.startsWith("/build-your-jewelry") && (
            <Link
              href="/build-your-jewelry"
              prefetch={false}
              onClick={() => {
                pushPromoClick({
                  creative_name: "BYJ icon header",
                  location_id: getFindStoreLocationId(),
                });
              }}
              className="hidden lg:inline-flex btn-shimmer-container bg-[#FEF5F1] hover:bg-[#5A413F] transition-colors duration-200 px-[14px] xl:px-[18px] py-[6px] xl:py-[8px] gap-1.5 shrink-0 group"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 transition-colors duration-200 z-10 relative icon-rotate-zoom">
                <path d="M12 6C9.99602 6 6 9.99602 6 12C6 9.99602 2.00398 6 0 6C2.00398 6 6 2.00398 6 0C6 1.99205 9.99602 6 12 6Z" fill="currentColor"/>
              </svg>
              <span className="font-figtree font-semibold text-sm leading-[130%] tracking-normal capitalize z-10 relative">
                Build Your Jewelry
              </span>
            </Link>
          )}

          <Link
            href="/schemes"
            prefetch={false}
            onClick={() => {
              pushPromoClick({
                creative_name: "scheme icon header",
                location_id: getFindStoreLocationId(),
              });
            }}
            className="hidden lg:flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shrink-0"
          >
            <img
              src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Frame_1437257664.png?v=1781505570"
              alt="9+1 Scheme"
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Pincode + nearest store. Replaces the old "Find a Store" link and
              absorbs its job — the store-locator link now lives in the panel. */}
          <PincodePicker locationId={getFindStoreLocationId()} />

          {user ? (
            <div className="relative group flex items-center" id="nitro-login">
              <Link href="/admin" prefetch={false}>
                <Avatar className="h-9 w-9 cursor-pointer border border-gray-100">
                  {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                  <AvatarFallback className="bg-[#5a413f] text-white font-bold text-xs">{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
              </Link>

              <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-64 bg-white shadow-xl rounded-lg opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50">
                <div className="px-4 py-3">
                  <p className="text-sm font-semibold">Hi, {user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>

                <Link
                  href="/admin"
                  prefetch={false}
                  className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50"
                >
                  <UserIconCustom /> My Account
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-50"
                >
                  <LogOut size={19} /> Logout
                </button>
              </div>
            </div>
          ) : (
            <div
              className="cursor-pointer"
              id="nitro-login"
              onClick={() => {
                const path = window.location.pathname;
                if (path !== "/login" && path !== "/register") {
                  openLogin();
                }
              }}
            >
              <UserIconCustom />
            </div>
          )}

          {user ? (
            <Link href="/admin/wishlist" prefetch={false} className="relative group p-1">
              <HeartIcon />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                const path = window.location.pathname;
                if (path !== "/login" && path !== "/register") {
                  openLogin();
                }
              }}
              className="relative group p-1"
            >
              <HeartIcon />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
            </button>
          )}
          <Link
            href="/checkout/cart"
            prefetch={false}
            className="relative group p-1"
            onClick={handleCartClick}
          >
            <CartIcon />
            {displayQuantity > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                {displayQuantity}
              </span>
            )}
          </Link>
        </div>
      </div>

    </div>
  );
}
