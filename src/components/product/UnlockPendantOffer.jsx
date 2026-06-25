"use client";

import React, { useState, useEffect } from "react";
import { Lock, Unlock, CheckCircle, Loader2, Pencil, Copy, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { login, setAvatar } from "@/redux/features/user/userSlice";
import { mergeCart } from "@/redux/features/cart/cartSlice";
import { mergeGuestWishlist } from "@/redux/features/wishlist/wishlistSlice";
import { pushLogin, pushSignup } from "@/lib/gtm";
import { apiFetch, sendOtpApi, verifyOtpApi, registerCustomer } from "@/lib/api";

export default function UnlockPendantOffer({ user, dispatch, toast, currentPrice }) {
  const [mobile, setMobile] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", ""]);
  const [step, setStep] = useState(user ? "unlocked" : "input");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const COUPONS = [
    {
      code: "GRAND250",
      title: "Flat ₹250 off",
      condition: "On Purchase below ₹15000/-"
    },
    {
      code: "GRAND500",
      title: "Flat ₹500 off",
      condition: "On Purchase ₹15001 - ₹30000/-"
    },
    {
      code: "GRAND750",
      title: "Flat ₹750 off",
      condition: "On Purchase ₹30001 - ₹50000/-"
    },
    {
      code: "GRAND1000",
      title: "Flat ₹1000 off",
      condition: "On Purchase ₹50001 - ₹100000/-"
    },
    {
      code: "GRAND1500",
      title: "Flat ₹1500 off",
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

  // Sync step if user logs in via another flow (e.g. main login)
  useEffect(() => {
    if (user) {
      setStep("unlocked");
    } else {
      setStep("input");
      setMobile("");
      setOtpValues(["", "", "", ""]);
    }
  }, [user]);

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

  // Trigger auto-verification when all 4 digits are entered
  useEffect(() => {
    const joined = otpValues.join("");
    if (joined.length === 4 && step === "otp" && !loading) {
      handleVerifyOtp(joined);
    }
  }, [otpValues]);

  const handleVerifyOtp = async (overrideOtp) => {
    const code = overrideOtp || otpValues.join("");
    if (code.length !== 4) {
      return toast.error("Please enter a 4-digit OTP");
    }
    setLoading(true);
    try {
      const sessionId = "session_" + Math.random().toString(36).substring(2, 15);
      const data = await verifyOtpApi(mobile, code, sessionId);

      if (data.status === "REGISTER_REQUIRED" || data.status === "REGISTER" || data.type === "register") {
        const regData = await registerCustomer({
          firstName: "User",
          lastName: "Customer",
          email: `${mobile}@gmail.com`,
          mobile: mobile,
          sessionId,
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
  };

  const handleLoginSuccess = async (data, isSignup = false) => {
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
  };

  const handleClaimOffer = () => {
    localStorage.setItem("isSilverPendantClaimed", "true");
    setClaimed(true);
    window.dispatchEvent(new Event("storage"));
    toast.success("Free Silver Pendant worth ₹10,000 has been claimed and added to your order benefits!");
  };

  const handleViewAllOffers = () => {
    window.location.href = "/collections/pendants";
  };

  const isUnlocked = step === "unlocked";

  return (
    <div
      className={`relative bg-[#FFF8F6] border border-[#FBE3DC] rounded-xl flex flex-col sm:flex-row gap-4 items-center select-none w-full mt-0 ${
        isUnlocked
          ? "p-5 sm:p-5"
          : "pt-14 pb-5 px-5 sm:py-5 sm:pl-[125px] sm:pr-6"
      }`}
      style={isUnlocked ? {} : { paddingLeft: "75px" }}
    >
      {/* Absolute Pendant Image */}
      {!isUnlocked && (
        <img
          src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Free_Diamond_Pendant.png?v=1782378443"
          alt="Free Pendant"
          className="absolute top-0 left-1/2 -translate-x-1/2 sm:left-5 sm:translate-x-0 w-auto h-[85px] sm:h-[95px] object-contain z-10 drop-shadow-md"
          style={{ paddingLeft: "4px" }}
        />
      )}

      {/* Right Column: Dynamic Steps */}
      {step === "unlocked" && (
        <div className="flex-1 min-w-0 w-full space-y-3">
          <div className="flex items-center justify-between w-full">
            <h3
              className="text-[#4E3629] font-bold text-sm sm:text-base tracking-wide uppercase leading-tight"
              style={{
                fontFamily: "Figtree",
                fontWeight: 600,
                fontSize: "var(--text-lg)",
                lineHeight: "140%",
                letterSpacing: "0%",
                textTransform: "uppercase"
              }}
            >
              HURRAY! OFFERS ARE UNLOCKED
            </h3>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="text-xs font-bold text-[#5C3E35] hover:text-[#4E322A] underline transition-all cursor-pointer bg-transparent border-none py-1 px-2 font-sans"
            >
              View All
            </button>
          </div>

          {/* Swiper Slider for Coupons */}
          <Swiper
            slidesPerView="auto"
            spaceBetween={16}
            className="w-full pt-1"
          >
            {COUPONS.slice(0, 3).map((coupon, idx) => (
              <SwiperSlide key={idx} className="!w-auto pb-2">
                <CouponCard
                  coupon={coupon}
                  onCopy={handleCopyCode}
                  copiedCode={copiedCode}
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
              className="text-[#4E3629] font-bold text-sm sm:text-base tracking-wide uppercase leading-tight text-center sm:text-left"
              style={{
                fontFamily: "Figtree",
                fontWeight: 600,
                fontSize: "var(--text-lg)",
                lineHeight: "140%",
                letterSpacing: "0%",
                verticalAlign: "middle",
                textTransform: "uppercase"
              }}
            >
              UNLOCK FREE DIAMOND PENDANT
            </h3>
            <p
              className="text-[#8B6E60] font-semibold text-xs sm:text-sm mt-0.5 text-center sm:text-left"
              style={{
                fontFamily: "Figtree",
                fontWeight: 400,
                lineHeight: "130%",
                letterSpacing: "0%",
                verticalAlign: "middle",
                marginTop: "4px",
                marginBottom: "10px",
                display: "block"
              }}
            >
              Worth ₹10000/-
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <input
              id="mobile-input"
              type="tel"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="Enter Phone Number to Unlock Offer"
              className="flex-1 h-11 bg-white border border-[#EBEBEB] text-zinc-900 placeholder:text-zinc-400 text-sm px-4 rounded-md focus:outline-none focus:border-[#5C3E35] focus:ring-1 focus:ring-[#5C3E35] transition-all font-medium"
            />
            <button
              onClick={handleSendOtp}
              disabled={mobile.length < 10 || loading}
              className={`h-11 px-5 rounded-md flex items-center justify-center font-bold text-xs uppercase tracking-wider transition-all duration-200 select-none ${
                mobile.length === 10 ? "text-white hover:bg-[#4E322A] cursor-pointer" : "text-white/80 cursor-not-allowed"
              }`}
              style={{
                width: "auto",
                fontFamily: "Figtree",
                fontWeight: 700,
                fontSize: "12px",
                lineHeight: "140%",
                letterSpacing: "0%",
                textTransform: "uppercase",
                background: mobile.length === 10 ? "#5C3E35" : "#A3908C",
                borderRadius: "4px"
              }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Lock size={14} className="mr-1.5" />
                  {mobile.length === 10 ? "UNLOCK NOW" : "LOCKED"}
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
              className="text-[#4E3629] font-bold text-sm sm:text-base tracking-wide uppercase leading-tight text-center sm:text-left"
              style={{
                fontFamily: "Figtree",
                fontWeight: 600,
                fontSize: "var(--text-lg)",
                lineHeight: "140%",
                letterSpacing: "0%",
                verticalAlign: "middle",
                textTransform: "uppercase"
              }}
            >
              UNLOCK FREE DIAMOND PENDANT
            </h3>
            <p
              className="text-[#8B6E60] font-semibold text-xs sm:text-sm mt-0.5 text-center sm:text-left"
              style={{
                fontFamily: "Figtree",
                fontWeight: 400,
                lineHeight: "130%",
                letterSpacing: "0%",
                verticalAlign: "middle",
                marginTop: "4px",
                marginBottom: "10px",
                display: "block"
              }}
            >
              Worth ₹10000/-
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full">
            {/* 4 OTP Digit boxes */}
            <div className="flex gap-2 justify-center w-full sm:w-auto">
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
                  className="w-11 h-11 bg-white border border-[#EBEBEB] text-center text-lg font-bold rounded-md text-zinc-900 focus:outline-none focus:border-[#5C3E35] focus:ring-1 focus:ring-[#5C3E35] transition-all"
                  placeholder="-"
                />
              ))}
            </div>

            <button
              onClick={() => handleVerifyOtp()}
              disabled={otpValues.some((v) => v === "") || loading}
              className={`h-11 px-5 rounded-md flex items-center justify-center font-bold text-xs uppercase tracking-wider transition-all duration-200 w-full sm:w-auto shrink-0 ${
                !otpValues.some((v) => v === "") ? "text-white hover:bg-[#4E322A] cursor-pointer" : "text-white/80 cursor-not-allowed"
              }`}
              style={{
                width: "auto",
                fontFamily: "Figtree",
                fontWeight: 700,
                fontSize: "12px",
                lineHeight: "140%",
                letterSpacing: "0%",
                textTransform: "uppercase",
                background: !otpValues.some((v) => v === "") ? "#5C3E35" : "#A3908C",
                borderRadius: "4px"
              }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "VERIFY TO UNLOCK"
              )}
            </button>
          </div>

          <div className="flex flex-row xs:flex-row items-center justify-between text-xs font-semibold px-0.5 text-zinc-500 mt-2 gap-2">
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
                  className="text-[#5C3E35] hover:underline cursor-pointer font-bold"
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
          <div className="fixed inset-0 z-[999] flex justify-end">
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
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-[380px] h-full bg-[#FFF8F6] shadow-2xl flex flex-col z-10"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#FBE3DC] flex items-center justify-between bg-white shrink-0">
                <h3
                  className="text-base font-bold text-[#5C3E35] tracking-wide uppercase"
                  style={{ fontFamily: "Figtree" }}
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

              {/* Coupon List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {COUPONS.map((coupon, idx) => (
                  <div key={idx} className="flex justify-center">
                    <CouponCard
                      coupon={coupon}
                      onCopy={handleCopyCode}
                      copiedCode={copiedCode}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CouponCard({ coupon, onCopy, copiedCode }) {
  const isCopied = copiedCode === coupon.code;

  return (
    <div className="flex h-[120px] w-[280px] rounded-lg overflow-hidden relative shrink-0 shadow-xs bg-transparent">
      {/* Left Discount Vertical Tab (No border around it) */}
      <div className="w-[40px] bg-[#5C3E35] flex items-center justify-center relative shrink-0 rounded-l-lg">
        {/* Left Ticket Cutout/Notch (clean bite, no border) */}
        <div className="absolute -left-[7px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#FFF8F6] rounded-full z-20" />
        
        <span
          className="text-[9px] font-extrabold tracking-widest text-white uppercase"
          style={{
            writingMode: "vertical-lr",
            transform: "rotate(180deg)",
            fontFamily: "Figtree"
          }}
        >
          DISCOUNT
        </span>
      </div>

      {/* Vertical Dashed Divider */}
      <div className="border-l border-dashed border-[#FBE3DC] h-full z-10" />

      {/* Right Content Area (With border on top, right, bottom) */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0 bg-white rounded-r-lg border-y border-r border-[#FBE3DC] relative">
        {/* Right Ticket Cutout/Notch (border curves inward) */}
        <div className="absolute -right-[7px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#FFF8F6] rounded-full border border-[#FBE3DC] z-20" />

        {/* Top Info & Vertical Capsule Logo */}
        <div className="flex justify-between items-start gap-1">
          <div className="min-w-0">
            <span 
              className="text-[10px] font-bold text-[#8B6E60] block truncate"
              style={{ fontFamily: "Figtree" }}
            >
              {coupon.title}
            </span>
            <h4 
              className="text-[16px] font-extrabold text-[#4E3629] tracking-wide mt-0.5 leading-none"
              style={{ fontFamily: "Figtree" }}
            >
              {coupon.code}
            </h4>
            <span 
              className="text-[9px] font-medium text-zinc-500 block truncate mt-1.5"
              style={{ fontFamily: "Figtree" }}
            >
              {coupon.condition}
            </span>
          </div>
          
          {/* Vertical Capsule 'L' badge */}
          <div className="w-[24px] h-[36px] rounded-full border border-[#FBE3DC] flex flex-col items-center justify-center shrink-0 bg-white mt-0.5 shadow-3xs">
            <span className="font-serif text-[13px] italic font-extrabold text-[#8B6E60] leading-none">L</span>
            <span className="text-[5px] text-[#8B6E60] leading-none mt-0.5">♦</span>
          </div>
        </div>

        {/* Copy Coupon Action Button Box */}
        <button
          onClick={() => onCopy(coupon.code)}
          className={`w-full h-8 flex items-center justify-center gap-1.5 rounded border transition-all cursor-pointer font-bold text-[10px] uppercase tracking-wider ${
            isCopied 
              ? "bg-emerald-50/50 border-emerald-200 text-emerald-600" 
              : "bg-white border-[#EBEBEB] text-[#5C3E35] hover:bg-[#FFF8F6] hover:border-[#FBE3DC]"
          }`}
          style={{ fontFamily: "Figtree" }}
        >
          {isCopied ? (
            <>
              <span className="lowercase first-letter:uppercase">copied</span>
              <CheckCircle size={12} className="text-emerald-600 animate-scale-in" />
            </>
          ) : (
            <>
              <span className="normal-case">Copy Coupon Code</span>
              <Copy size={11} className="text-[#5C3E35]" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
