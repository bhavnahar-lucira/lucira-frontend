"use client";
import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import SearchPopup from "./SearchPopup";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { pushLogout, pushViewCart, getStandardCartItem } from "@/lib/gtm";
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

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const GOLDCOIN_VARIANT_ID = "gid://shopify/ProductVariant/47753346973914";


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
  "Silver Bracelets"
];

export default function MainHeader() {
  const router = useRouter();
  const { user, logout: authLogout, openLogin } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const dispatch = useDispatch();
  const { totalQuantity, totalAmount, items, loading: cartLoading } = useSelector((state) => state.cart);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const guestWishlistItems = useSelector((state) => state.wishlist.guestItems);

  // Filter out non-product items (Insurance, Free Gold Coins) to match Cart Page count
  const displayItems = (items || []).filter(
    (item) =>
      item.variantId !== INSURANCE_VARIANT_ID &&
      !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift)
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

      const filteredItems = items.filter(
        (item) =>
          item.variantId !== INSURANCE_VARIANT_ID &&
          !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift)
      );

      pushViewCart({
        currency: "INR",
        cart_total: Number(totalAmount),
        grand_total: Number(totalAmount),
        discount_amount: 0,
        total_quantity: totalQuantity,
        total_product: items.length,
        coupon_code: "",
        items: items.map((item, idx) => getStandardCartItem(item, idx))
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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchQuery.trim().length > 0) {
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
      await apiFetch("/api/auth/logout", { method: "POST" });
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
      <div className="container-main grid grid-cols-[1fr_2fr_1fr] items-center py-4 border-b border-[#f2f2f2]">

        {/* Logo */}
        <Link href="/" prefetch={false} className="flex items-center">
          <Image
            src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/logo.svg"
            alt="Lucira Jewelry"
            width={100}
            height={40}
            className="w-[85px] h-[30px] lg:w-[100px] lg:h-[40px]"
            priority
          />
        </Link>

        {/* Search Input and Dropdown Wrapper */}
        <div className={`flex justify-center relative ${showSearch ? "z-[1001] overflow-visible" : "z-10"}`}>
          <div className="relative w-full max-w-137.5">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 pointer-events-none z-30">
              <SearchIcon />
            </div>
            <div className="relative w-full">
              <input
                type="text"
                placeholder=""
                className="w-full h-[40px] pl-[45px] pr-[10px] py-[8px] rounded-sm bg-[#F9F9F9] text-base font-medium outline-none focus:bg-white focus:ring-1 focus:ring-gray-200 transition-all relative z-20"
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  setTimeout(() => setIsFocused(false), 200);
                }}
                onClick={() => setIsFocused(true)}
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
              />
              
              {/* Animated Placeholder Ticker */}
              {!isFocused && !searchQuery && (
                <div className="absolute inset-0 flex items-center pointer-events-none z-30 overflow-hidden pl-[45px]">
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
        <div className="flex items-center justify-end lg:gap-3 xl:gap-6 text-sm">

           <Link href="/pages/store-locator" prefetch={false} className="hidden lg:flex items-center justify-center gap-[6px] cursor-pointer transition-colors hover:text-primary text-sm leading-[130%] tracking-normal font-normal text-black">
            <StoreIcon />
            <span>Find a Store</span>
          </Link>

          {user ? (
            <div className="relative group flex items-center">
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
