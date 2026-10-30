"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login, setAvatar } from "@/redux/features/user/userSlice";
import { pushLogin, pushSignup } from "@/lib/gtm";
import { toE164, cleanPhoneInput } from "@/lib/phone";
import { mergeGuestWishlist } from "@/redux/features/wishlist/wishlistSlice";
import { mergeCart } from "@/redux/features/cart/cartSlice";
import {
  apiFetch,
  sendOtpApi,
  verifyOtpApi,
  registerCustomer,
  fetchOrnaverseCustomer,
  createOrnaverseCustomer,
} from "@/lib/api";

export function LoginForm({ onSuccess, initialMobile = "", initialStep = "login" }) {
  const router = useRouter();
  const pathname = usePathname();
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
  const [otpVerified, setOtpVerified] = useState(false);
  const timerRef = useRef();

  const isSchemeFlow = pathname?.startsWith("/schemes") || 
                       (typeof window !== "undefined" && localStorage.getItem("auth_redirect_path")?.startsWith("/schemes"));

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

  const loginSuccess = async (data, isSignup = false, ornaUser = null) => {
    const user = data.user || data.customer;
    const userId = user?.id;
    const canonicalPhone = toE164(mobile || user?.mobile || user?.phone);
    
    if (!isSignup) {
      pushLogin({
        id: userId,
        mobile: canonicalPhone || mobile,
        phone: canonicalPhone || mobile,
        email: user?.email,
        name: user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : (canonicalPhone || mobile || "")
      });
    }

    dispatch(
      login({
        user: {
          id: userId,
          mobile: canonicalPhone || mobile,
          phone: canonicalPhone || mobile,
          email: user?.email,
          first_name: user?.first_name,
          last_name: user?.last_name,
          party_id: ornaUser?.party_id || null,
          name:
            user?.first_name
              ? `${user.first_name} ${user.last_name || ""}`.trim()
              : (canonicalPhone || mobile || ""),
        },
        accessToken: data.accessToken,
      })
    );

    // Fetch avatar immediately after login
    try {
      const avData = await apiFetch("/api/customer/profile/avatar");
      if (avData.avatar) {
        dispatch(setAvatar(avData.avatar));
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
        setOtpVerified(true);
        setStep("register");
        return;
      }

      if (data.status === "LOGIN" || data.type === "success") {
        setOtpVerified(true);
        
        // 🔍 Ornaverse: Check customer (ONLY during Scheme flow)
        let ornaUser = null;
        if (isSchemeFlow) {
          try {
            const ornaData = await fetchOrnaverseCustomer(mobile);
            ornaUser = ornaData?.Entities?.[0];
          } catch (error) {
            console.error("[Ornaverse] Fetch error:", error);
          }
        }

        await loginSuccess(data, false, ornaUser);
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

      // 1. Create in Ornaverse first (ONLY during Scheme flow)
      let ornaUser = null;
      if (isSchemeFlow) {
        try {
          const checkOrna = await fetchOrnaverseCustomer(mobile);
          ornaUser = checkOrna?.Entities?.[0];

          if (!ornaUser?.party_id) {
            const createOrna = await createOrnaverseCustomer({
              first_name: firstName,
              last_name: lastName,
              phone: mobile,
              email: email,
            });
            ornaUser = { party_id: createOrna?.EntityId };
          }
        } catch (error) {
          console.error("[Ornaverse] Registration link error:", error);
        }
      }

      // 2. Create in Shopify
      const data = await registerCustomer({
        firstName,
        lastName,
        email,
        mobile,
      });

      if (data.status === "REGISTER_SUCCESS" || data.type === "success") {
        const canonicalPhone = toE164(mobile || data.user?.mobile || data.customer?.phone);
        // Track signup in GTM
        pushSignup({
          id: data.user?.id || data.customer?.id,
          mobile: canonicalPhone || mobile,
          phone: canonicalPhone || mobile,
          email: email,
          name: `${firstName} ${lastName}`.trim()
        });

        await loginSuccess(data, true, ornaUser);
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
          <div className="text-center mb-6">
            <img src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/logo.svg" width="120" height="49" alt="lucira jewelry logo" className="mx-auto" />
          </div>
          <p className="mb-[14px] text-center text-[14px] leading-tight font-normal text-[#030000] mx-auto mt-[14px] cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis px-2 max-w-full">
            Login to access your rewards & exclusive benefits
          </p>

          <div className="flex flex-col mb-[14px]">
            <div className="flex items-center border border-[#e2e2e2] h-[45px] px-4 rounded-sm bg-white">
              <span className="text-sm md:text-base font-normal mr-2.5 pr-3 border-r border-[#d0d0d0]">+91</span>
              <input
                ref={mobileRef}
                type="tel"
                placeholder="Phone Number *"
                maxLength="10"
                value={mobile}
                onChange={(e) => setMobile(cleanPhoneInput(e.target.value))}
                className="w-full h-full text-sm md:text-base border-none outline-none font-normal bg-transparent tracking-[0.3px]"
              />
            </div>
          </div>

          <Button
            onClick={sendLoginOtp}
            disabled={loading}
            className="text-white h-[45px] w-full font-normal text-sm md:text-base cursor-pointer transition-opacity uppercase tracking-[0.3px] border-none mt-0 mb-[4px] bg-[#5a413f] rounded-lg disabled:opacity-50 shadow-md"
          >
            {loading ? "Sending..." : "REQUEST OTP"}
          </Button>

          <div className="flex items-center justify-center gap-2 text-[12px] text-black mt-[8px]">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path d="M16.6668 10.8333C16.6668 15 13.7502 17.0833 10.2835 18.2916C10.102 18.3531 9.90478 18.3502 9.72516 18.2833C6.25016 17.0833 3.3335 15 3.3335 10.8333V4.99997C3.3335 4.77895 3.42129 4.56699 3.57757 4.41071C3.73385 4.25443 3.94582 4.16663 4.16683 4.16663C5.8335 4.16663 7.91683 3.16663 9.36683 1.89997C9.54337 1.74913 9.76796 1.66626 10.0002 1.66626C10.2324 1.66626 10.4569 1.74913 10.6335 1.89997C12.0918 3.17497 14.1668 4.16663 15.8335 4.16663C16.0545 4.16663 16.2665 4.25443 16.4228 4.41071C16.579 4.56699 16.6668 4.77895 16.6668 4.99997V10.8333Z" stroke="#008000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M7.5 9.99992L9.16667 11.6666L12.5 8.33325" stroke="#008000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>100% Secured & Spam Free</span>
          </div>

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
              autoFocus
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
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">First Name <span className="text-red-500">*</span></label>
              <Input
                ref={firstNameRef}
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-11 border-gray-200 focus:border-black transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Last Name <span className="text-red-500">*</span></label>
              <Input
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-11 border-gray-200 focus:border-black transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Email Address <span className="text-red-500">*</span></label>
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 border-gray-200 focus:border-black transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Phone Number</label>
            <div className="flex items-center border border-gray-200 rounded-md h-11 px-3 bg-gray-50">
              <span className="text-sm text-gray-500 mr-2 border-r border-gray-200 pr-2">+91</span>
              <input
                type="tel"
                disabled
                value={mobile}
                className="w-full h-full text-sm outline-none bg-transparent text-gray-500"
              />
            </div>
          </div>
          <Button
            onClick={registerUser}
            disabled={loading}
            className="h-12 w-full bg-[#5f4745] hover:bg-[#4a3634] text-white font-semibold transition-colors mt-2"
          >
            {loading ? "Registering..." : "COMPLETE REGISTRATION"}
          </Button>
          <p
            className="text-center text-sm text-gray-600 mt-4"
          >
            Already registered?{" "}
            <span 
              className="text-[#5a413f] font-bold underline cursor-pointer"
              onClick={() => setStep("login")}
            >
              Login
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
