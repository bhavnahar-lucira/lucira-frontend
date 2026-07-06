"use client";

import React, { useState, useEffect } from "react";
import { Lock, Unlock, CheckCircle, Loader2, Pencil, Copy, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { login, setAvatar } from "@/redux/features/user/userSlice";
import { mergeCart } from "@/redux/features/cart/cartSlice";
import { mergeGuestWishlist } from "@/redux/features/wishlist/wishlistSlice";
import { pushLogin, pushSignup, pushPromoClick } from "@/lib/gtm";
import { apiFetch, sendOtpApi, verifyOtpApi, registerCustomer } from "@/lib/api";

const generateSessionId = () => {
  return "session_" + Math.random().toString(36).substring(2, 15);
};

export default function UnlockCoupon({ user, dispatch, toast, currentPrice, productId }) {
  const [mobile, setMobile] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", ""]);
  const [step, setStep] = useState(user ? "unlocked" : "input");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const COUPONS = [
    {
      code: "GRAND250",
      title: "Flat ₹250 off*",
      condition: "On Purchase below ₹15000/-"
    },
    {
      code: "GRAND500",
      title: "Flat ₹500 off*",
      condition: "On Purchase ₹15001 - ₹30000/-"
    },
    {
      code: "GRAND750",
      title: "Flat ₹750 off*",
      condition: "On Purchase ₹30001 - ₹50000/-"
    },
    {
      code: "GRAND1000",
      title: "Flat ₹1000 off*",
      condition: "On Purchase ₹50001 - ₹100000/-"
    },
    {
      code: "GRAND1500",
      title: "Flat ₹1500 off*",
      condition: "On Purchase ₹1 Lakh & Above"
    }
  ];

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied!`);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const [claimed, setClaimed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("isSilverPendantClaimed") === "true";
    }
    return false;
  });

  // Keep claimed state in sync with localStorage updates
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleStorageChange = () => {
        setClaimed(localStorage.getItem("isSilverPendantClaimed") === "true");
      };
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }, []);

  // Track responsive screen size for drawer presentation
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 640);
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Sync step if user logs in via another flow (e.g. main login)
  const [prevUser, setPrevUser] = useState(user);
  if (user !== prevUser) {
    setPrevUser(user);
    setStep(user ? "unlocked" : "input");
    if (!user) {
      setMobile("");
      setOtpValues(["", "", "", ""]);
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
      return toast.error("Please enter a valid 10-digit mobile number");
    }
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

    try {
      if (isSignup) {
        pushSignup({
          id: userId,
          mobile: mobile,
          email: `${mobile}@gmail.com`,
          name: "User Customer"
        });
      } else {
        pushLogin({
          id: userId,
          mobile: mobile,
          email: customer?.email,
          name: customer?.first_name ? `${customer.first_name} ${customer.last_name || ""}`.trim() : "User"
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
        promo_name: mobile || "",
      });
    } catch (error) {
      console.error("Error pushing to dataLayer:", error);
    }

    dispatch(
      login({
        user: {
          id: userId,
          mobile: mobile,
          email: customer?.email || `${mobile}@gmail.com`,
          first_name: customer?.first_name || "User",
          last_name: customer?.last_name || "Customer",
          party_id: null,
          name: customer?.first_name && customer?.last_name 
            ? `${customer.first_name} ${customer.last_name}` 
            : "User Customer",
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

    // Auto-claim the offer upon verification
    localStorage.setItem("isSilverPendantClaimed", "true");
    setClaimed(true);

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
          firstName: "User",
          lastName: "Customer",
          email: `${mobile}@gmail.com`,
          mobile: mobile,
          sessionId,
          tags: "pdp-offers-lead",
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

  const handleClaimOffer = () => {
    localStorage.setItem("isSilverPendantClaimed", "true");
    setClaimed(true);
    window.dispatchEvent(new Event("storage"));
    toast.success("Free Silver Pendant worth ₹10,000 has been claimed and added to your order benefits!");
  };

  const handleViewAllOffers = () => {
    window.location.href = "/collections/pendants";
  };

  const parsePrice = (price) => {
    if (price === undefined || price === null) return 0;
    if (typeof price === "number") return price;
    const clean = String(price).replace(/[^0-9.]/g, "");
    return parseFloat(clean) || 0;
  };

  const getCouponIndexForPrice = (price) => {
    const numericPrice = parsePrice(price);
    if (numericPrice <= 15000) return 0;
    if (numericPrice <= 30000) return 1;
    if (numericPrice <= 50000) return 2;
    if (numericPrice <= 100000) return 3;
    return 4;
  };

  const activeIndex = getCouponIndexForPrice(currentPrice);
  const visibleCoupons = COUPONS.slice(activeIndex, activeIndex + 3);

  const isUnlocked = step === "unlocked";
  const priceValue = parsePrice(currentPrice);

  return (
    <div
      className="relative bg-[#FFF8F6] rounded flex flex-col sm:flex-row gap-4 items-center select-none w-full mt-0 p-[12px]"
    >

      {/* Right Column: Dynamic Steps */}
      {step === "unlocked" && (
        <div className="flex-1 min-w-0 w-full space-y-3">
          <div className="flex items-center justify-between w-full">
            <h3
              className="text-[#4E3629] font-figtree font-semibold text-[13px] sm:text-[var(--text-lg)] leading-[1.4] tracking-normal uppercase"
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

          {/* Swiper Slider for Coupons */}
          <Swiper
            slidesPerView="auto"
            spaceBetween={12}
            className="w-full pt-1"
          >
            {visibleCoupons.map((coupon, idx) => (
              <SwiperSlide key={idx} className="!w-auto">
                <CouponCard
                  coupon={coupon}
                  onCopy={handleCopyCode}
                  copiedCode={copiedCode}
                  isMini={true}
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
              Unlock Your Welcome Offer
            </h3>
          </div>

          <div className="relative w-full">
            <Input
              id="mobile-input"
              type="tel"
              maxLength={15}
              value={mobile}
              onChange={(e) => {
                let cleaned = e.target.value.replace(/\D/g, "");
                if (cleaned.length > 10) {
                  if (cleaned.startsWith("91")) {
                    cleaned = cleaned.slice(2);
                  } else if (cleaned.startsWith("0")) {
                    cleaned = cleaned.slice(1);
                  }
                }
                setMobile(cleaned.slice(0, 10));
              }}
              placeholder="Enter Phone Number"
              className="w-full h-[3.0625rem] bg-white border-gray-200 rounded font-figtree font-medium text-xs leading-[1.4] tracking-normal text-black placeholder:text-black pl-3.5 pr-32 md:pr-36 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <button
              onClick={handleSendOtp}
              disabled={mobile.length < 10 || loading}
              className={`h-[2.4375rem] md:h-10.5 text-xs md:text-sm px-4 md:px-6 font-figtree font-semibold leading-[1.4] tracking-normal uppercase rounded absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center justify-center gap-2 transition-all duration-200 select-none shrink-0 ${
                mobile.length === 10 
                  ? "text-white bg-[#5A413F] hover:bg-[#5A413F]/90 cursor-pointer" 
                  : "text-white/80 bg-[#A3908C] cursor-not-allowed"
              }`}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : mobile.length === 10 ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.66667 6.66668V4.66668C4.6667 3.93293 4.90884 3.21969 5.35553 2.63757C5.80222 2.05546 6.42851 1.63699 7.13726 1.44708C7.84601 1.25717 8.59762 1.30642 9.27553 1.5872C9.95344 1.86797 10.5198 2.36459 10.8867 3.00002M8.66667 10.6667C8.66667 11.0349 8.36819 11.3334 8 11.3334C7.63181 11.3334 7.33333 11.0349 7.33333 10.6667C7.33333 10.2985 7.63181 10 8 10C8.36819 10 8.66667 10.2985 8.66667 10.6667ZM3.33333 6.66668H12.6667C13.403 6.66668 14 7.26364 14 8.00002V13.3334C14 14.0697 13.403 14.6667 12.6667 14.6667H3.33333C2.59695 14.6667 2 14.0697 2 13.3334V8.00002C2 7.26364 2.59695 6.66668 3.33333 6.66668Z" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  UNLOCK NOW
                </>
              ) : (
                <>
                  <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.29167 5.95833V3.95833C3.29167 3.07428 3.64286 2.22643 4.26798 1.60131C4.8931 0.976189 5.74095 0.625 6.625 0.625C7.50906 0.625 8.3569 0.976189 8.98202 1.60131C9.60714 2.22643 9.95833 3.07428 9.95833 3.95833V5.95833M7.29167 9.95833C7.29167 10.3265 6.99319 10.625 6.625 10.625C6.25681 10.625 5.95833 10.3265 6.625 9.95833C6.625 9.59014 6.25681 9.29167 6.625 9.95833ZM1.95833 5.95833H11.2917C12.028 5.95833 12.625 6.55529 12.625 7.29167V12.625C12.625 13.3614 12.028 13.9583 11.2917 13.9583H1.95833C1.22195 13.9583 0.625 13.3614 0.625 12.625V7.29167C0.625 6.55529 1.22195 5.95833 1.95833 5.95833Z" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  LOCKED
                </>
              )}
            </button>
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
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-[999] flex justify-center sm:justify-end items-end sm:items-stretch">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setIsDrawerOpen(false)}
            />

            {/* Drawer Body */}
            <motion.div
              initial={isMobile ? { y: "100%", x: 0 } : { x: "100%", y: 0 }}
              animate={isMobile ? { y: 0, x: 0 } : { x: 0, y: 0 }}
              exit={isMobile ? { y: "100%", x: 0 } : { x: "100%", y: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
              className="relative w-full sm:max-w-[380px] h-[85vh] sm:h-full rounded-t-3xl sm:rounded-none bg-[#FFF8F6] shadow-2xl flex flex-col z-10"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#FBE3DC] flex flex-col bg-white rounded-t-3xl sm:rounded-none shrink-0">
                {/* Drag Handle for Mobile */}
                <div className="flex justify-center pb-3.5 sm:hidden">
                  <div className="w-12 h-1 bg-zinc-200 rounded-full" />
                </div>
                <div className="flex items-center justify-between w-full">
                  <h3
                    className="text-base font-figtree font-semibold text-[#5C3E35] tracking-wide uppercase"
                  >
                    Available Coupons
                  </h3>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 hover:bg-[#FFF8F6] rounded-full transition-colors text-zinc-500 hover:text-zinc-900 cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Coupon List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {COUPONS.map((coupon, idx) => (
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
                  *This coupons applicable for Diamond products
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CouponCard({ coupon, onCopy, copiedCode, className = "w-[280px]", isMini = false }) {
  const isCopied = copiedCode === coupon.code;

  return (
    <div className={`flex ${isMini ? 'h-24 md:h-28' : 'h-30 sm:h-30 min-[1500px]:h-30'} rounded-lg overflow-hidden relative shrink-0 shadow-xs bg-transparent ${className}`}>
      {/* Left Discount Vertical Tab (No border around it) */}
      <div className={`${isMini ? 'w-[32px] md:w-[38px]' : 'w-[40px]'} bg-[#5C3E35] flex items-center justify-center relative shrink-0 rounded-l`}>
        {/* Left Ticket Cutout/Notch (clean bite, no border) */}
        <div className={`absolute ${isMini ? '-left-[5px] w-2.5 h-2.5 md:-left-[6px] md:w-3.5 md:h-3.5' : '-left-[7px] w-3.5 h-3.5'} bg-[#FFF8F6] rounded-full z-20 top-1/2 -translate-y-1/2`} />
        
        <span
          className={`font-figtree font-semibold ${isMini ? 'text-[9px] md:text-[11px] tracking-wider' : 'text-[0.75rem] sm:text-[0.875rem] tracking-widest'} leading-[1.4] text-white uppercase [writing-mode:vertical-lr] rotate-180 align-middle`}
        >
          DISCOUNT
        </span>
      </div>

      {/* Vertical Dashed Divider */}
      <div className="border-l border-dashed border-[#FBE3DC] h-full z-10" />

      {/* Right Content Area (With border on top, right, bottom) */}
      <div className={`flex-1 ${isMini ? 'p-2 md:p-3' : 'p-3'} flex flex-col justify-between min-w-0 bg-white rounded-r border-y border-r border-[#FBE3DC] relative`}>
        {/* Top Info & Vertical Capsule Logo */}
        <div className="flex justify-between items-start gap-1">
          <div className="min-w-0">
            <h4 
              className={`${isMini ? 'text-[0.8rem] md:text-[0.95rem] font-semibold' : 'text-[1rem] sm:text-[1.1rem] font-semibold'} text-[#4E3629] tracking-normal mt-0.5 leading-[1.4] font-figtree`}
            >
              {coupon.title}
            </h4>
            <span 
              className={`${isMini ? 'text-[0.625rem] md:text-[0.725rem] font-normal md:font-medium' : 'text-[0.7rem] sm:text-[0.75rem] font-medium'} text-black block truncate mt-[2px] font-figtree leading-[1.4] tracking-normal`}
            >
              {coupon.condition}
            </span>
          </div>
          
          {/* Vertical Capsule Logo */}
          <img
            src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/lucira-logo-small.png?v=1782455718"
            alt="Lucira Logo"
            className={`${isMini ? 'w-[18px] h-[28px] md:w-[22px] md:h-[32px]' : 'w-[24px] h-[36px]'} object-contain shrink-0 mt-0.5`}
          />
        </div>

        {/* Copy Coupon Action Button Box */}
        <button
          onClick={() => onCopy(coupon.code)}
          className={`w-full ${isMini ? 'h-7 md:h-8 text-[0.75rem] md:text-[0.85rem] px-[8px] md:px-[12px]' : 'h-8 text-[0.875rem] px-[12px]'} flex items-center justify-center gap-1.5 rounded border transition-all cursor-pointer font-semibold uppercase tracking-normal font-figtree leading-[1.4] ${
            isCopied 
              ? "bg-emerald-50/50 border-emerald-200 text-emerald-600" 
              : "bg-white border-[#EBEBEB] text-[#1A1A1A] hover:bg-[#FFF8F6] hover:border-[#FBE3DC]"
          }`}
        >
          {isCopied ? (
            <>
              <span className="lowercase first-letter:uppercase">copied</span>
              <CheckCircle className={`${isMini ? 'w-2.5 h-2.5 md:w-3.5 md:h-3.5' : 'w-3.5 h-3.5'} text-emerald-600 animate-scale-in shrink-0`} />
            </>
          ) : (
            <>
              <span className="normal-case">Copy Coupon Code</span>
              <Copy className={`${isMini ? 'w-2.5 h-2.5 md:w-3 md:h-3' : 'w-3 h-3'} text-[#5C3E35] ml-1 shrink-0`} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
