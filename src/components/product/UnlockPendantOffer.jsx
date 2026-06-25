"use client";

import React, { useState, useEffect } from "react";
import { Lock, Unlock, CheckCircle, Loader2 } from "lucide-react";
import { login, setAvatar } from "@/redux/features/user/userSlice";
import { mergeCart } from "@/redux/features/cart/cartSlice";
import { mergeGuestWishlist } from "@/redux/features/wishlist/wishlistSlice";
import { pushLogin, pushSignup } from "@/lib/gtm";
import { apiFetch, sendOtpApi, verifyOtpApi, registerCustomer } from "@/lib/api";

export default function UnlockPendantOffer({ user, dispatch, toast, currentPrice }) {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(user ? "unlocked" : "input");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  // Sync step if user logs in via another flow (e.g. main login)
  useEffect(() => {
    if (user) {
      setStep("unlocked");
    } else {
      setStep("input");
      setMobile("");
      setOtp("");
    }
  }, [user]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async () => {
    if (mobile.length !== 10) {
      return toast.error("Please enter a valid 10-digit mobile number");
    }
    setLoading(true);
    try {
      await sendOtpApi(mobile);
      toast.success("OTP Sent successfully");
      setStep("otp");
      setTimer(30);
    } catch (err) {
      toast.error(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setOtp(val);
    if (val.length === 4) {
      handleVerifyOtp(val);
    }
  };

  const handleVerifyOtp = async (overrideOtp) => {
    const code = overrideOtp || otp;
    if (code.length !== 4) {
      return toast.error("Please enter a 4-digit OTP");
    }
    setLoading(true);
    try {
      const sessionId = "session_" + Math.random().toString(36).substring(2, 15);
      const data = await verifyOtpApi(mobile, code, sessionId);

      if (data.status === "REGISTER_REQUIRED" || data.status === "REGISTER" || data.type === "register") {
        // Auto register with User Customer dummy data as requested
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

    // GTM Analytics
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

    // Update Redux state
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

    // Side effects (Avatar, Cart Merge, Wishlist Merge)
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
  };

  return (
    <div className="bg-[#FFF5F2] border border-[#FBE3DC] rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4 select-none">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center p-2 shrink-0 border border-[#FDF0EC]">
        <img
          src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/necklace_8ab6afc5-2f06-4bf9-b04d-1bd0b3343d87.png"
          alt="Free Pendant"
          className="w-full h-full object-contain"
        />
      </div>

      {step === "unlocked" && (
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-[#4E3629] leading-tight uppercase">
            FREE DIAMOND PENDANT UNLOCKED
          </h3>
          <p className="text-sm font-semibold text-[#8B6E60] mt-0.5">
            Worth ₹10,000/- has been added to your benefits!
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 w-fit px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
            <CheckCircle size={14} className="text-emerald-500" />
            <span>Offer Unlocked</span>
          </div>
        </div>
      )}

      {step === "input" && (
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#4E3629] leading-tight uppercase tracking-tight">
              UNLOCK FREE DIAMOND PENDANT
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-[#8B6E60] mt-0.5">
              Worth ₹10000/-
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="tel"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Enter Phone Number to Unlock Offer"
                className="w-full h-11 bg-white border border-[#EBEBEB] text-zinc-900 placeholder:text-zinc-400 text-sm px-4 rounded-md focus:outline-none focus:border-[#4E3629] transition-all font-medium"
              />
            </div>
            <button
              onClick={handleSendOtp}
              disabled={mobile.length < 10 || loading}
              className={`h-11 px-5 rounded-md flex items-center justify-center font-bold text-xs uppercase tracking-wider transition-all duration-200 select-none ${
                mobile.length === 10
                  ? "bg-[#5C3E35] text-white hover:bg-[#4E322A] cursor-pointer"
                  : "bg-[#A3908C] text-white/80 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {mobile.length === 10 ? <Unlock size={14} className="mr-1.5" /> : <Lock size={14} className="mr-1.5" />}
                  {mobile.length === 10 ? "UNLOCK NOW" : "LOCKED"}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === "otp" && (
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#4E3629] leading-tight uppercase tracking-tight">
              ENTER OTP TO UNLOCK OFFER
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-[#8B6E60] mt-0.5">
              Sent to +91 {mobile}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="tel"
                maxLength={4}
                value={otp}
                onChange={handleOtpChange}
                placeholder="Enter 4-Digit OTP"
                className="w-full h-11 bg-white border border-[#EBEBEB] text-zinc-900 placeholder:text-zinc-400 text-sm px-4 rounded-md focus:outline-none focus:border-[#4E3629] transition-all font-semibold tracking-widest text-center"
              />
            </div>
            <button
              onClick={() => handleVerifyOtp()}
              disabled={otp.length < 4 || loading}
              className={`h-11 px-5 rounded-md flex items-center justify-center font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                otp.length === 4
                  ? "bg-[#5C3E35] text-white hover:bg-[#4E322A] cursor-pointer"
                  : "bg-[#A3908C] text-white/80 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "VERIFY"
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold px-1">
            <button
              onClick={handleSendOtp}
              disabled={timer > 0 || loading}
              className={`hover:underline cursor-pointer ${timer > 0 ? "text-zinc-400" : "text-[#5C3E35]"}`}
            >
              {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
            </button>
            <button
              onClick={() => {
                setStep("input");
                setOtp("");
              }}
              className="text-zinc-500 hover:text-[#5C3E35] hover:underline cursor-pointer"
            >
              Change Number
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
