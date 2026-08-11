"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { Edit2, Loader2, CheckCircle2 } from "lucide-react";
import {
  sendOtpApi,
  verifyOtpApi,
  registerCustomer,
} from "@/lib/api";
import { login, setAvatar } from "@/redux/features/user/userSlice";
import { mergeGuestWishlist } from "@/redux/features/wishlist/wishlistSlice";
import { mergeCart, getSessionId } from "@/redux/features/cart/cartSlice";
import { pushLogin, pushSignup } from "@/lib/gtm";
import { Button } from "@/components/ui/button";

const NITRO_ORG_ID = process.env.NEXT_PUBLIC_NITRO_ORG_ID;

// Single "Full Name" field is split into firstName/lastName
function splitFullName(value) {
  const parts = String(value ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || "", lastName: "" };
  const lastName = parts.pop();
  return { firstName: parts.join(" "), lastName };
}

function nitroEnrich({ email, phone, name, isConsented }) {
  if (typeof window === "undefined" || typeof window.nitro?.identify !== "function") return;
  if (!phone) return;
  try {
    window.nitro.identify(
      email || "",
      phone,
      name || "",
      { source: "checkout", org_token: NITRO_ORG_ID, is_consented: !!isConsented },
      function () {
        try {
          if (isConsented) window.nitro.pushEvent("is_consented", { phone });
          window.nitro.pushEvent("otp_verified", { phone });
        } catch (_) { }
      }
    );
  } catch (_) { }
}

export function CheckoutAuthForm({ onSuccess, initialMobile = "", initialStep = "login" }) {
  const router = useRouter();
  const dispatch = useDispatch();

  const [step, setStep] = useState(initialStep); // login, otp, register
  const [mobile, setMobile] = useState(initialMobile);

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [fullName, setFullName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const otpRefs = [useRef(), useRef(), useRef(), useRef()];
  const mobileRef = useRef();
  const firstNameRef = useRef();
  const timerRef = useRef();

  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [timer]);

  // Focus management
  useEffect(() => {
    if (step === "otp") {
      const timerId = setTimeout(() => {
        otpRefs[0]?.current?.focus();
      }, 100);
      return () => clearTimeout(timerId);
    } else if (step === "login") {
      const timerId = setTimeout(() => {
        mobileRef.current?.focus();
      }, 100);
      return () => clearTimeout(timerId);
    } else if (step === "register") {
      const timerId = setTimeout(() => {
        firstNameRef.current?.focus();
      }, 100);
      return () => clearTimeout(timerId);
    }
  }, [step]);

  const loginSuccess = async (data, isSignup = false) => {
    const user = data.user || data.customer;
    const userId = user?.id;

    if (isSignup) {
      pushSignup({
        id: userId,
        mobile: mobile,
        email: user?.email,
        name: user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : "User"
      });
    } else {
      pushLogin({
        id: userId,
        mobile: mobile,
        email: user?.email,
        name: user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : "User"
      });
    }

    dispatch(
      login({
        user: {
          id: userId,
          mobile,
          email: user?.email,
          first_name: user?.first_name,
          last_name: user?.last_name,
          name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : "User",
        },
        accessToken: data.accessToken,
      })
    );

    nitroEnrich({
      email: email || user?.email || "",
      phone: mobile,
      name: [user?.first_name || firstName, user?.last_name || lastName].filter(Boolean).join(" ").trim(),
      isConsented: true,
    });

    try {
      const avData = await apiFetch("/api/customer/profile/avatar");
      if (avData.avatar) dispatch(setAvatar(avData.avatar));
    } catch (err) { }

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

    if (onSuccess) onSuccess();
  };

  const handleSendOtp = async () => {
    if (mobile.length !== 10) return toast.error("Please enter a valid 10-digit mobile number");
    if (!/^[6-9]/.test(mobile)) return toast.error("Please enter a valid Indian mobile number");

    setLoading(true);
    try {
      await sendOtpApi(mobile);
      toast.success("OTP Sent");
      setStep("otp");
      setTimer(118); // 01:58 as in figma (approx 120s)
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (overrideOtp) => {
    if (loading) return;
    const otpValue = typeof overrideOtp === "string" ? overrideOtp : otp.join("");
    if (otpValue.length !== 4) return toast.error("Enter 4-digit OTP");

    setLoading(true);
    try {
      const sessionId = getSessionId();
      const data = await verifyOtpApi(mobile, otpValue, sessionId);

      if (data.status === "REGISTER_REQUIRED" || data.status === "REGISTER" || data.type === "register") {
        setStep("register");
      } else if (data.status === "LOGIN" || data.type === "success") {
        await loginSuccess(data, false);
      }
    } catch (err) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length === 4 && /^\d+$/.test(value)) {
      const newOtp = value.split("");
      setOtp(newOtp);
      setTimeout(() => handleVerifyOtp(value), 50);
      return;
    }

    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 3) {
      otpRefs[index + 1].current.focus();
    }

    if (index === 3 && value) {
      const finalOtp = [...newOtp];
      finalOtp[3] = value.slice(-1);
      if (finalOtp.every(d => d !== "")) {
        setTimeout(() => handleVerifyOtp(finalOtp.join("")), 50);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const handleRegister = async () => {
    if (!firstName || !email || !mobile) return toast.error("Please fill all fields");
    setLoading(true);
    try {
      const sessionId = getSessionId();
      const regData = await registerCustomer({
        firstName,
        lastName,
        email,
        mobile,
        sessionId,
      });
      if (regData.status === "REGISTER_SUCCESS" || regData.status === "SUCCESS" || regData.type === "success") {
        await loginSuccess(regData, true);
      }
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // Format timer for display (e.g. 01:58)
  const formatTimer = () => {
    const mins = Math.floor(timer / 60);
    const secs = timer % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full flex flex-col bg-white h-auto">

      {step === "login" && (
        <div className="flex flex-col space-y-4">
          <div>
            <h2 className="text-[20px] md:text-[22px] font-bold text-zinc-900 leading-none">Checkout Securely</h2>
            <p className="text-[13px] text-zinc-500 mt-2 font-medium">Login / Signup to proceed checkout</p>
          </div>

          <div className="flex items-center border border-zinc-200 rounded-[4px] h-[50px] px-4">
            <span className="text-[15px] font-medium mr-3 pr-3 border-r border-zinc-200 text-zinc-700">+91</span>
            <input
              ref={mobileRef}
              type="tel"
              placeholder="Enter Mobile Number"
              maxLength="10"
              className="w-full h-full text-[15px] font-medium border-none outline-none bg-transparent placeholder:font-normal placeholder:text-zinc-400"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
            />
          </div>

          <p className="text-[11px] text-zinc-500 font-medium">
            By proceeding you accept Lucira&apos;s <span className="font-bold underline cursor-pointer text-zinc-700">Terms & Conditions</span> & <span className="font-bold underline cursor-pointer text-zinc-700">Privacy Policy</span>
          </p>

          <Button
            onClick={handleSendOtp}
            disabled={loading}
            className="w-full bg-[#5A413F] hover:bg-[#4A312F] text-white h-[45px] rounded-[4px] uppercase font-bold tracking-wide mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "CONTINUE"}
          </Button>
        </div>
      )}

      {step === "otp" && (
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] md:text-[20px] font-bold text-zinc-900 leading-none">+91 {mobile}</h2>
            <button onClick={() => setStep("login")} className="text-zinc-600 hover:text-black">
              <Edit2 className="w-[14px] h-[14px]" />
            </button>
          </div>
          <p className="text-[13px] text-zinc-500 font-medium leading-none">Enter OTP sent to given Number</p>

          <div className="flex justify-between gap-3 mt-4 mb-2 px-1">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={otpRefs[i]}
                type="tel"
                inputMode="numeric"
                autoComplete="off"
                maxLength="1"
                className="flex-1 aspect-[1.2] max-h-[60px] text-center text-[22px] border border-zinc-200 rounded-[4px] focus:border-black outline-none font-semibold bg-white text-zinc-800"
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
              />
            ))}
          </div>

          <p className="text-center text-[12px] text-zinc-500 font-medium">
            {timer > 0 ? (
              <>Resend OTP in <span className="font-bold text-zinc-800">{formatTimer()}</span></>
            ) : (
              <span className="cursor-pointer font-bold text-zinc-800 underline hover:text-black" onClick={handleSendOtp}>
                Resend OTP
              </span>
            )}
          </p>

          <Button
            onClick={() => handleVerifyOtp()}
            disabled={loading}
            className="w-full bg-[#5A413F] hover:bg-[#4A312F] text-white h-[45px] rounded-[4px] uppercase font-bold tracking-wide mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "VERIFY"}
          </Button>
        </div>
      )}

      {step === "register" && (
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-2 text-[#00A63E]">
            <CheckCircle2 className="w-[20px] h-[20px]" />
            <h2 className="text-[18px] md:text-[20px] font-bold leading-none">Verified Successfully</h2>
          </div>
          <p className="text-[13px] text-zinc-800 font-medium">Welcome to Lucira Jewelry</p>

          <div className="space-y-3 mt-2">
            <input
              ref={firstNameRef}
              type="text"
              placeholder="Enter Your Full Name"
              className="w-full h-[45px] px-4 text-[14px] font-medium border border-zinc-200 rounded-[4px] outline-none bg-white placeholder:text-zinc-400 placeholder:font-normal"
              value={fullName}
              onChange={(e) => {
                const value = e.target.value;
                setFullName(value);
                const { firstName: fn, lastName: ln } = splitFullName(value);
                setFirstName(fn);
                setLastName(ln);
              }}
            />

            <input
              type="email"
              placeholder="Enter Your Mail Id"
              className="w-full h-[45px] px-4 text-[14px] font-medium border border-zinc-200 rounded-[4px] outline-none bg-white placeholder:text-zinc-400 placeholder:font-normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
            />
          </div>

          <Button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-[#5A413F] hover:bg-[#4A312F] text-white h-[45px] rounded-[4px] uppercase font-bold tracking-wide mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "VERIFY"}
          </Button>
        </div>
      )}

    </div>
  );
}
