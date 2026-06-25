"use client";

import React, { useState, useEffect } from "react";
import { Lock, Unlock, CheckCircle, Loader2, Pencil } from "lucide-react";
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

  return (
    <div
      className="relative bg-[#FFF8F6] border border-[#FBE3DC] rounded-xl pt-14 pb-5 px-5 sm:py-5 sm:pl-[125px] sm:pr-6 flex flex-col sm:flex-row gap-4 items-center select-none w-full mt-0"
      style={{ paddingLeft: "75px" }}
    >
      {/* Absolute Pendant Image */}
      <img
        src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Free_Diamond_Pendant.png?v=1782378443"
        alt="Free Pendant"
        className="absolute top-0 left-1/2 -translate-x-1/2 sm:left-5 sm:translate-x-0 w-auto h-[85px] sm:h-[95px] object-contain z-10 drop-shadow-md"
        style={{ paddingLeft: "4px" }}
      />

      {/* Right Column: Dynamic Steps */}
      {step === "unlocked" && (
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
              HURRAY! OFFER IS UNLOCKED
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

          <div className="flex flex-col sm:flex-row gap-2.5 w-full">
            <button
              onClick={handleClaimOffer}
              disabled={claimed}
              className={`h-11 px-5 rounded-md flex items-center justify-center font-bold text-xs uppercase tracking-wider transition-all duration-200 select-none ${
                claimed ? "text-white cursor-not-allowed" : "text-white hover:bg-[#4E322A] cursor-pointer"
              }`}
              style={{
                width: "auto",
                fontFamily: "Figtree",
                fontWeight: 700,
                fontSize: "12px",
                lineHeight: "140%",
                letterSpacing: "0%",
                textTransform: "uppercase",
                background: "#5A413F",
                borderRadius: "4px"
              }}
            >
              {claimed ? "CLAIMED" : "CLAIM THIS OFFER"}
            </button>
            <button
              onClick={handleViewAllOffers}
              className="h-11 px-5 rounded-md bg-white border border-[#5C3E35] text-[#5C3E35] hover:bg-[#FFF8F6] transition-all duration-200 font-bold text-xs uppercase tracking-wider cursor-pointer"
              style={{
                width: "100%",
                fontFamily: "Figtree",
                fontWeight: 700,
                fontSize: "12px",
                lineHeight: "140%",
                letterSpacing: "0%",
                textTransform: "uppercase",
                background: "#ffffff",
                borderRadius: "4px"
              }}
            >
              VIEW ALL OFFERS
            </button>
          </div>
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
    </div>
  );
}
