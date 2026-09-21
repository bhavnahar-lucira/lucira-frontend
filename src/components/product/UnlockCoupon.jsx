"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Pencil } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import CouponCard from "@/components/coupons/CouponCard";
import CouponDrawer from "@/components/coupons/CouponDrawer";
import { COUPONS, COUPON_DISCLAIMER, parsePrice, getCouponIndexForPrice, getOfferCategory, OFFER_CATEGORY } from "@/lib/coupons";
import { login, setAvatar } from "@/redux/features/user/userSlice";
import { mergeCart } from "@/redux/features/cart/cartSlice";
import { mergeGuestWishlist } from "@/redux/features/wishlist/wishlistSlice";
import { pushLogin, pushSignup, pushPromoClick } from "@/lib/gtm";
import { toE164, cleanPhoneInput } from "@/lib/phone";
import { apiFetch, sendOtpApi, verifyOtpApi, registerCustomer } from "@/lib/api";

const generateSessionId = () => {
  return "session_" + Math.random().toString(36).substring(2, 15);
};

function getCouponDiscount(coupon, price) {
  if (!coupon) return 0;
  if (coupon.discountType === "percentage" || coupon.valueType === "PERCENTAGE") {
    const pct = Number(coupon.discountValue ?? coupon.value ?? 0);
    return (price * pct) / 100;
  }
  if (coupon.discountValue !== undefined && coupon.discountValue !== null) {
    return Number(coupon.discountValue);
  }
  if (coupon.value !== undefined && coupon.value !== null) {
    return Number(coupon.value);
  }
  const titleMatch = String(coupon.title || "").match(/₹\s*([0-9,]+)/);
  if (titleMatch) {
    return parseFloat(titleMatch[1].replace(/,/g, "")) || 0;
  }
  const codeMatch = String(coupon.code || "").match(/([0-9]+)/);
  if (codeMatch) {
    return parseFloat(codeMatch[1]) || 0;
  }
  return 0;
}

function formatUnlockHeading(offer) {
  if (!offer) return "Unlock upto ₹250 Off";
  if (offer.isBankOffer) {
    if (offer.discountType === "percentage") {
      return `Unlock upto ${offer.discountValue}% Off`;
    }
    const clean = String(offer.title || "").replace(/\*/g, "").trim();
    if (clean) {
      const match = clean.match(/₹\s*([0-9,]+)/);
      if (match) return `Unlock upto ₹${match[1]} Off`;
      const pctMatch = clean.match(/([0-9.]+)%/);
      if (pctMatch) return `Unlock upto ${pctMatch[1]}% Off`;
      const formatted = clean.replace(/\boff\b/i, "Off");
      return formatted.toLowerCase().endsWith("off") ? `Unlock upto ${formatted}` : `Unlock upto ${formatted} Off`;
    }
  }
  const rawTitle = String(offer.title || "").replace(/\*/g, "").trim();
  if (rawTitle) {
    const match = rawTitle.match(/₹\s*([0-9,]+)/);
    if (match) {
      return `Unlock upto ₹${match[1]} Off`;
    }
    const pctMatch = rawTitle.match(/([0-9.]+)%/);
    if (pctMatch) {
      return `Unlock upto ${pctMatch[1]}% Off`;
    }
    const formatted = rawTitle.replace(/\boff\b/i, "Off");
    return formatted.toLowerCase().endsWith("off") ? `Unlock upto ${formatted}` : `Unlock upto ${formatted} Off`;
  }
  if (offer.discountValue) {
    if (offer.discountType === "percentage") {
      return `Unlock upto ${offer.discountValue}% Off`;
    }
    return `Unlock upto ₹${Number(offer.discountValue).toLocaleString("en-IN")} Off`;
  }
  return "Unlock upto ₹250 Off";
}


export default function UnlockCoupon({ user, dispatch, toast, currentPrice, productId, productCategory }) {
  const [mobile, setMobile] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", ""]);
  const [step, setStep] = useState(user ? "unlocked" : "input");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [hasError, setHasError] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [dynamicCoupons, setDynamicCoupons] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/cart/coupons/active", { suppressErrorLog: true })
      .then(res => {
        if (!cancelled && res?.coupons) {
          setDynamicCoupons(res.coupons);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied!`);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };



  // Sync step if user logs in via another flow (e.g. main login)
  const [prevUser, setPrevUser] = useState(user);
  if (user !== prevUser) {
    setPrevUser(user);
    setStep(user ? "unlocked" : "input");
    if (!user) {
      setMobile("");
      setOtpValues(["", "", "", ""]);
      setHasError(false);
    }
  }

  // Countdown timer for OTP resend (180s = 3 minutes)
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Auto-focus first OTP input when transitioning to the OTP step
  useEffect(() => {
    if (step === "otp") {
      const firstInput = document.getElementById("otp-input-0");
      if (firstInput) {
        firstInput.focus();
      } else {
        const timeoutId = setTimeout(() => {
          const retryInput = document.getElementById("otp-input-0");
          if (retryInput) retryInput.focus();
        }, 50);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [step]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleSendOtp = async () => {
    if (mobile.length !== 10) {
      setHasError(true);
      const inputEl = document.getElementById("mobile-input");
      if (inputEl) inputEl.focus();
      return toast.error("Please enter a valid 10-digit mobile number");
    }
    setHasError(false);
    setLoading(true);
    try {
      await sendOtpApi(mobile);
      toast.success("OTP Sent successfully");
      setStep("otp");
      setOtpValues(["", "", "", ""]);
      setTimer(180); // 3 minutes countdown
      // Focus the first input box
      setTimeout(() => {
        const firstInput = document.getElementById("otp-input-0");
        if (firstInput) {
          firstInput.focus();
        }
      }, 50);
    } catch (err) {
      toast.error(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index, val) => {
    const cleanVal = val.replace(/\D/g, "");
    if (!cleanVal) {
      const newOtp = [...otpValues];
      newOtp[index] = "";
      setOtpValues(newOtp);
      return;
    }

    const newOtp = [...otpValues];
    newOtp[index] = cleanVal[cleanVal.length - 1]; // Use last entered character
    setOtpValues(newOtp);

    // Auto-focus next input field
    if (index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otpValues[index] === "" && index > 0) {
        const newOtp = [...otpValues];
        newOtp[index - 1] = "";
        setOtpValues(newOtp);
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        if (prevInput) {
          prevInput.focus();
        }
      } else {
        const newOtp = [...otpValues];
        newOtp[index] = "";
        setOtpValues(newOtp);
      }
    }
  };

  const handleDigitPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pastedData.length > 0) {
      const newOtp = [...otpValues];
      for (let i = 0; i < pastedData.length; i++) {
        if (i < 4) newOtp[i] = pastedData[i];
      }
      setOtpValues(newOtp);

      const focusIndex = Math.min(pastedData.length, 3);
      const targetInput = document.getElementById(`otp-input-${focusIndex}`);
      if (targetInput) targetInput.focus();
    }
  };



  async function handleLoginSuccess(data, isSignup = false) {
    const customer = data.user || data.customer;
    const userId = customer?.id;
    const canonicalPhone = toE164(mobile || customer?.mobile || customer?.phone);

    try {
      if (isSignup) {
        pushSignup({
          id: userId,
          mobile: canonicalPhone || mobile,
          phone: canonicalPhone || mobile,
          email: customer?.email || "",
          name: canonicalPhone || mobile || ""
        });
      } else {
        pushLogin({
          id: userId,
          mobile: canonicalPhone || mobile,
          phone: canonicalPhone || mobile,
          email: customer?.email,
          name: customer?.first_name ? `${customer.first_name} ${customer.last_name || ""}`.trim() : (canonicalPhone || mobile || "")
        });
      }
    } catch (err) {
      console.warn("[GTM] Event push failed:", err);
    }

    // Fire dataLayer promoClick event on successful OTP verification
    try {
      pushPromoClick({
        creative_name: "unlock coupons - pdp",
        location_id: typeof window !== "undefined" ? window.location.href : "",
        promo_id: String(productId || ""),
        promo_name: canonicalPhone || mobile || "",
      });
    } catch (error) {
      console.error("Error pushing to dataLayer:", error);
    }

    dispatch(
      login({
        user: {
          id: userId,
          mobile: canonicalPhone || mobile,
          phone: canonicalPhone || mobile,
          email: customer?.email || "",
          first_name: customer?.first_name || canonicalPhone || mobile || "",
          last_name: customer?.last_name || "",
          party_id: null,
          name: customer?.first_name 
            ? `${customer.first_name} ${customer.last_name || ""}`.trim() 
            : (canonicalPhone || mobile || ""),
        },
        accessToken: data.accessToken,
      })
    );

    try {
      const avData = await apiFetch("/api/customer/profile/avatar");
      if (avData?.avatar) {
        dispatch(setAvatar(avData.avatar));
      }
    } catch (err) {
      console.error("Avatar fetch error:", err);
    }

    try {
      await dispatch(mergeCart({ userId })).unwrap();
    } catch (err) {
      console.error("Cart merge failed:", err);
    }

    try {
      await dispatch(mergeGuestWishlist()).unwrap();
    } catch (err) {
      console.error("Wishlist merge failed:", err);
    }



    toast.success("Offer Unlocked Successfully!");
    setStep("unlocked");
  }

  async function handleVerifyOtp(overrideOtp) {
    const code = overrideOtp || otpValues.join("");
    if (code.length !== 4) {
      return toast.error("Please enter a 4-digit OTP");
    }
    setLoading(true);
    try {
      const sessionId = generateSessionId();
      const data = await verifyOtpApi(mobile, code, sessionId);

      if (data.status === "REGISTER_REQUIRED" || data.status === "REGISTER" || data.type === "register") {
        const regData = await registerCustomer({
          firstName: mobile,
          lastName: "",
          email: "",
          mobile: mobile,
          sessionId,
          tags: "pdp-offers-lead",
          sourcePage: "Cart Drawer",
        });

        if (regData.status === "REGISTER_SUCCESS" || regData.status === "SUCCESS" || regData.type === "success") {
          await handleLoginSuccess(regData, true);
        } else {
          toast.error("Auto-registration failed. Please contact support.");
        }
      } else if (data.status === "LOGIN" || data.type === "success" || data.status === "SUCCESS") {
        await handleLoginSuccess(data, false);
      } else {
        toast.error("Verification failed");
      }
    } catch (err) {
      toast.error(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  // Trigger auto-verification when all 4 digits are entered
  useEffect(() => {
    const joined = otpValues.join("");
    if (joined.length === 4 && step === "otp" && !loading) {
      setTimeout(() => {
        handleVerifyOtp(joined);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpValues]);



  const handleViewAllOffers = () => {
    window.location.href = "/collections/pendants";
  };

  // /api/cart/coupons/active now also includes featured-only rules (not
  // toggled "Show in Saving Zone drawer") for the cart's FeaturedOfferBanner
  // — filter back down to drawer-only here, same as the cart's drawer list.
  const couponsList = dynamicCoupons ? dynamicCoupons.filter((c) => c.showInDrawer) : COUPONS;
  const isDynamicCouponsList = !!dynamicCoupons;
  const priceValue = parsePrice(currentPrice);

  // The metal-split "additional % off" offers (e.g. 5% on Diamond / 3% on Gold).
  // 5% is only above ₹25,000, so only include if currentPrice meets the minimum spend requirement.
  const bankOffers = (dynamicCoupons || [])
    .filter((c) => c.isFeatured)
    .filter((c) => {
      const category = getOfferCategory(c);
      if (category === OFFER_CATEGORY.ALL || !productCategory) return true;
      return category === productCategory;
    })
    .filter((c) => {
      const min = Number(c.minAmount || c.minRequirementValue || 0);
      return priceValue >= min;
    });

  let visibleCoupons = [];
  if (isDynamicCouponsList) {
    const applicable = couponsList.filter((c) => priceValue >= Number(c.minAmount || 0));
    const listToUse = applicable.length > 0 ? applicable : couponsList;
    visibleCoupons = [...listToUse].sort((a, b) => {
      return getCouponDiscount(b, priceValue) - getCouponDiscount(a, priceValue);
    });
  } else {
    const activeIndex = getCouponIndexForPrice(currentPrice);
    const applicable = COUPONS.slice(0, activeIndex + 1).reverse();
    visibleCoupons = applicable.length > 0 ? applicable : [COUPONS[0]];
  }

  // Combined cards strictly sorted from HIGH TO LOW by discount value
  const allCards = [
    ...bankOffers.map((o) => ({ ...o, isBankOffer: true })),
    ...visibleCoupons.map((c) => ({ ...c, isBankOffer: false })),
  ].sort((a, b) => {
    return getCouponDiscount(b, priceValue) - getCouponDiscount(a, priceValue);
  });

  // Dynamic heading showing the highest applicable coupon
  const highestOffer = allCards[0] || null;
  const unlockHeading = formatUnlockHeading(highestOffer);

  const isUnlocked = step === "unlocked";

  return (
    <div
      className="relative bg-[#FFF8F6] rounded flex flex-col sm:flex-row gap-4 items-center select-none w-full mt-0 py-[10px] px-3"
    >

      {/* Right Column: Dynamic Steps */}
      {step === "unlocked" && (
        <div className="flex-1 min-w-0 w-full space-y-3">
          <div className="flex items-center justify-between w-full">
            <h3
              className="text-black font-figtree font-medium text-[0.85rem] leading-[1.4] tracking-[0.3px] uppercase"
            >
              HURRAY! OFFERS ARE UNLOCKED
            </h3>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="text-xs font-figtree font-semibold text-[11px] leading-[1.4] tracking-normal align-middle underline text-[#5C3E35] hover:text-[#4E322A] transition-all cursor-pointer bg-transparent border-none py-1 px-2"
            >
              View All
            </button>
          </div>

          {/* Swiper Slider for Coupons: sorted High to Low */}
          <Swiper
            slidesPerView="auto"
            spaceBetween={12}
            className="w-full pt-1"
          >
            {allCards.map((card, idx) => (
              <SwiperSlide key={card.id || card.code || idx} className="!w-auto">
                <CouponCard
                  coupon={card}
                  onCopy={handleCopyCode}
                  copiedCode={copiedCode}
                  isMini={true}
                  isBankOffer={card.isBankOffer}
                  className="w-[230px] md:w-[270px]"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {step === "input" && (
        <div className="flex-1 min-w-0 w-full space-y-3">
          <div>
            <h3
              className="text-[#4E3629] font-figtree font-semibold text-base sm:text-[var(--text-lg)] leading-[1.4] tracking-normal align-middle text-left sm:text-left"
            >
              {unlockHeading}
            </h3>
          </div>

          <div className="w-full">
            <div
              className={`relative flex items-center w-full h-[3.0625rem] bg-white rounded transition-colors border shadow-none ${
                hasError ? "border-red-500" : "border-gray-200"
              }`}
            >
              <div 
                className="flex items-center px-[10px] shrink-0 select-none cursor-pointer"
                style={{ padding: "0 10px" }}
                onClick={() => document.getElementById("mobile-input")?.focus()}
              >
                <span className="font-figtree font-medium text-xs md:text-sm text-neutral-800 tracking-normal">+91</span>
                <span className="h-4 w-[1px] bg-[#d0d0d0] ml-2.5" />
              </div>
              <input
                id="mobile-input"
                type="tel"
                maxLength={10}
                value={mobile}
                onChange={(e) => {
                  if (hasError) setHasError(false);
                  setMobile(cleanPhoneInput(e.target.value));
                }}
                placeholder="Enter Phone Number"
                className="w-full h-full bg-transparent font-figtree font-medium text-xs md:text-sm leading-[1.4] tracking-normal text-black placeholder:text-zinc-500 pl-2.5 pr-32 md:pr-36 border-none outline-none focus:ring-0 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="h-[2.4375rem] md:h-10.5 text-xs md:text-sm px-4 md:px-6 font-figtree font-semibold leading-[1.4] tracking-normal uppercase rounded absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center justify-center gap-2 transition-all duration-200 select-none shrink-0 text-white bg-[#5A413F] hover:bg-[#4E322A] cursor-pointer shadow-sm disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.66667 6.66668V4.66668C4.6667 3.93293 4.90884 3.21969 5.35553 2.63757C5.80222 2.05546 6.42851 1.63699 7.13726 1.44708C7.84601 1.25717 8.59762 1.30642 9.27553 1.5872C9.95344 1.86797 10.5198 2.36459 10.8867 3.00002M8.66667 10.6667C8.66667 11.0349 8.36819 11.3334 8 11.3334C7.63181 11.3334 7.33333 11.0349 7.33333 10.6667C7.33333 10.2985 7.63181 10 8 10C8.36819 10 8.66667 10.2985 8.66667 10.6667ZM3.33333 6.66668H12.6667C13.403 6.66668 14 7.26364 14 8.00002V13.3334C14 14.0697 13.403 14.6667 12.6667 14.6667H3.33333C2.59695 14.6667 2 14.0697 2 13.3334V8.00002C2 7.26364 2.59695 6.66668 3.33333 6.66668Z" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    UNLOCK NOW
                  </>
                )}
              </button>
            </div>
            {hasError && (
              <p className="text-red-500 text-[11px] font-medium mt-1">
                Please enter a valid 10-digit mobile number
              </p>
            )}
          </div>
        </div>
      )}

      {step === "otp" && (
        <div className="flex-1 min-w-0 w-full space-y-3">
          <div>
            <h3
              className="text-[#4E3629] font-figtree font-semibold text-[13px] sm:text-[var(--text-lg)] leading-[1.4] tracking-normal align-middle text-center sm:text-left"
            >
              Unlock Exclusive Free Coupons
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {/* 4 OTP Digit boxes */}
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              {otpValues.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                  onPaste={handleDigitPaste}
                  className="w-full sm:w-10 h-10 bg-white border border-[#EBEBEB] text-center text-lg font-semibold rounded text-zinc-900 focus:outline-none focus:border-[#5C3E35] focus:ring-1 focus:ring-[#5C3E35] transition-all"
                  placeholder="-"
                />
              ))}
            </div>

            <button
              onClick={() => handleVerifyOtp()}
              disabled={otpValues.some((v) => v === "") || loading}
              className={`w-full sm:w-auto sm:flex-1 h-[2.4375rem] md:h-10.5 text-xs md:text-sm px-4 md:px-6 font-figtree font-semibold leading-[1.4] tracking-normal uppercase rounded flex items-center justify-center whitespace-nowrap transition-all duration-200 select-none ${
                !otpValues.some((v) => v === "") 
                  ? "text-white bg-[#5A413F] hover:bg-[#5A413F]/90 cursor-pointer" 
                  : "text-white/80 bg-[#A3908C] cursor-not-allowed"
              }`}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "VERIFY TO UNLOCK"
              )}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-semibold px-0.5 text-zinc-500 mt-2 gap-2">
            <div className="flex items-center gap-1.5">
              <span>OTP Sent to +91 {mobile}</span>
              <button
                onClick={() => {
                  setStep("input");
                  setOtpValues(["", "", "", ""]);
                  setTimeout(() => {
                    const mobileInput = document.getElementById("mobile-input");
                    if (mobileInput) mobileInput.focus();
                  }, 50);
                }}
                className="text-[#5C3E35] hover:text-[#4E322A] transition-colors"
                title="Edit phone number"
              >
                <Pencil size={13} className="inline" />
              </button>
            </div>

            <div>
              {timer > 0 ? (
                <span className="text-[#8B6E60]">Resend OTP in {formatTime(timer)}</span>
              ) : (
                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-[#5C3E35] hover:underline cursor-pointer font-semibold"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Side Drawer for All Coupons */}
      <CouponDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Available Coupons"
      >
        {bankOffers.map((offer) => (
          <div key={`bank-${offer.code}`} className="w-full">
            <CouponCard
              coupon={offer}
              onCopy={handleCopyCode}
              copiedCode={copiedCode}
              isBankOffer
              className="w-full"
            />
          </div>
        ))}

        {couponsList.map((coupon, idx) => (
          <div key={idx} className="w-full">
            <CouponCard
              coupon={coupon}
              onCopy={handleCopyCode}
              copiedCode={copiedCode}
              className="w-full"
            />
          </div>
        ))}

        {/* Disclaimer Footnote */}
        <p className="text-[11px] text-zinc-500 font-figtree font-medium text-center pt-2 leading-relaxed">
          {COUPON_DISCLAIMER}
        </p>
      </CouponDrawer>
    </div>
  );
}
