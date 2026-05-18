"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login, setAvatar } from "@/redux/features/user/userSlice";
import { pushLogin, pushSignup } from "@/lib/gtm";
import { mergeGuestWishlist } from "@/redux/features/wishlist/wishlistSlice";
import { mergeCart } from "@/redux/features/cart/cartSlice";
import {
  sendOtpApi,
  verifyOtpApi,
  registerCustomer,
} from "@/lib/api";

export function LoginForm({ onSuccess, initialMobile = "", initialStep = "login" }) {
  const router = useRouter();
  const dispatch = useDispatch();

  const [step, setStep] = useState(initialStep);
  const [mobile, setMobile] = useState(initialMobile || "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef();

  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [timer]);

  useEffect(() => {
    let timerInterval;
    if (step === "success" && countdown > 0) {
      timerInterval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (step === "success" && countdown === 0) {
      router.replace("/admin");
    }
    return () => clearInterval(timerInterval);
  }, [step, countdown, router]);

  const mobileRef = useRef();
  const otpRef = useRef();
  const firstNameRef = useRef();

  const validMobileNum = (num) => /^[6-9]\d{9}$/.test(String(num || "").trim());
  const validMobile = () => validMobileNum(mobile);

  useEffect(() => {
    if (initialMobile && validMobileNum(initialMobile)) {
      setMobile(String(initialMobile).trim());
    }
  }, [initialMobile]);

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  useEffect(() => {
    if (step === "login") {
      setTimeout(() => mobileRef.current?.focus(), 100);
    } else if (step === "otp-login") {
      setTimeout(() => otpRef.current?.focus(), 100);
    } else if (step === "register") {
      setTimeout(() => firstNameRef.current?.focus(), 100);
    }
  }, [step]);

  // WebOTP API listener
  useEffect(() => {
    if ("OTPCredential" in window && step === "otp-login") {
      const ac = new AbortController();
      navigator.credentials
        .get({
          otp: { transport: ["sms"] },
          signal: ac.signal,
        })
        .then((otpData) => {
          if (otpData && otpData.code) {
            const cleanCode = otpData.code.replace(/\D/g, "").slice(0, 4);
            if (cleanCode.length === 4) {
              setOtp(cleanCode);
              verifyLoginOtp(cleanCode);
            }
          }
        })
        .catch((err) => console.log("WebOTP Error:", err));
      return () => ac.abort();
    }
  }, [step]);

  const loginSuccess = async (data, isSignup = false) => {
    const user = data.user || data.customer;
    const userId = user?.id;
    
    if (!isSignup) {
      pushLogin({
        id: userId,
        mobile: mobile,
        email: user?.email,
        name: user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : "User"
      });
    }

    dispatch(
      login({
        id: userId,
        mobile,
        email: user?.email,
        first_name: user?.first_name,
        last_name: user?.last_name,
        name:
          user?.first_name && user?.last_name
            ? `${user.first_name} ${user.last_name}`
            : "User",
      })
    );

    // Fetch avatar immediately after login
    try {
      const avRes = await fetch("/api/customer/profile/avatar");
      if (avRes.ok) {
        const avData = await avRes.json();
        if (avData.avatar) {
          dispatch(setAvatar(avData.avatar));
        }
      }
    } catch (err) {
      console.error("Avatar fetch error on login:", err);
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

    toast.success("Login Successful");
    if (onSuccess) onSuccess();
    else router.push("/admin");
    router.refresh();
  };

  const sendLoginOtp = async () => {
    if (!validMobile()) return toast.error("Enter valid mobile");

    try {
      setLoading(true);
      await sendOtpApi(mobile);
      toast.success("OTP Sent");
      setStep("otp-login");
      setTimer(30);
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyLoginOtp = async (overrideOtp) => {
    const otpValue = typeof overrideOtp === "string" ? overrideOtp : otp;
    if (otpValue.length < 4) return toast.error("Invalid OTP");

    try {
      setLoading(true);
      const data = await verifyOtpApi(mobile, otpValue);

      if (data.status === "REGISTER_REQUIRED" || data.type === "register") {
        setStep("register");
        return;
      }

      if (data.status === "LOGIN" || data.type === "success") {
        loginSuccess(data);
      }
    } catch (err) {
      toast.error(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async () => {
    if (!firstName.trim() || !lastName.trim())
      return toast.error("Enter full name");

    if (!email.trim()) return toast.error("Enter email");

    try {
      setLoading(true);
      const data = await registerCustomer({
        firstName,
        lastName,
        email,
        mobile,
      });

      if (data.status === "REGISTER_SUCCESS" || data.type === "success") {
        // Track signup in GTM
        pushSignup({
          id: data.user?.id || data.customer?.id,
          mobile: mobile,
          email: email,
          name: `${firstName} ${lastName}`.trim()
        });

        loginSuccess(data, true);
      }
    } catch (err) {
      toast.error(err.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === "login" && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Phone Number <span className="text-red-500">*</span></label>
            <div className="flex items-center border border-gray-200 rounded-md h-11 px-3 bg-white focus-within:border-black transition-all">
              <span className="text-sm text-gray-500 mr-2 border-r border-gray-200 pr-2">+91</span>
              <input
                ref={mobileRef}
                type="tel"
                placeholder="Mobile Number"
                maxLength="10"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                className="w-full h-full text-sm outline-none bg-transparent"
              />
            </div>
          </div>

          <Button
            onClick={sendLoginOtp}
            disabled={loading}
            className="h-12 w-full bg-[#5f4745] hover:bg-[#4a3634] text-white font-semibold transition-colors mt-4"
          >
            {loading ? "Sending..." : "REQUEST OTP"}
          </Button>

          <p
            className="text-center text-sm text-gray-600 mt-4"
          >
            New user?{" "}
            <span 
              className="text-[#5a413f] font-bold underline cursor-pointer"
              onClick={() => router.push("/register")}
            >
              Register
            </span>
          </p>
        </>
      )}

      {step === "otp-login" && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Enter OTP <span className="text-red-500">*</span></label>
            <Input
              ref={otpRef}
              placeholder="Enter 4-digit OTP"
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                setOtp(val);
                if (val.length === 4) {
                  verifyLoginOtp(val);
                }
              }}
              className="h-11 border-gray-200 focus:border-black transition-all"
            />
          </div>
          <Button
            onClick={verifyLoginOtp}
            disabled={loading}
            className="h-12 w-full bg-[#5f4745] hover:bg-[#4a3634] text-white font-semibold transition-colors mt-2"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>
          
          <p className="text-center text-sm text-gray-600 mt-2">
            {timer > 0 ? (
              `Resend OTP in 00:${timer < 10 ? `0${timer}` : timer}`
            ) : (
              <span 
                className="text-[#b77766] font-bold underline cursor-pointer" 
                onClick={sendLoginOtp}
              >
                Resend OTP
              </span>
            )}
          </p>
        </>
      )}

      {step === "register" && (
        <>
          {/* ... existing register fields ... */}
          <p
            className="text-center text-sm text-gray-600 mt-4"
          >
            Already registered?{" "}
            <span 
              className="text-[#5a413f] font-bold underline cursor-pointer"
              onClick={() => router.push("/login")}
            >
              Login
            </span>
          </p>
        </>
      )}
    </div>
  );
}