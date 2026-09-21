"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { motion, useAnimation } from "framer-motion";
import {
  apiFetch,
  registerCustomer,
  checkCustomerApi,
  sendOtpApi,
  verifyOtpApi,
} from "@/lib/api";
import { login, setAvatar } from "@/redux/features/user/userSlice";
import { pushSignup } from "@/lib/gtm";
import { toE164, cleanPhoneInput } from "@/lib/phone";
import { mergeGuestWishlist } from "@/redux/features/wishlist/wishlistSlice";
import { mergeCart } from "@/redux/features/cart/cartSlice";

const SPIN_PRIZES = [
  { label: "₹1,500 OFF", value: "1500_off", chance: 33.33 },
  { label: "₹1,000 OFF", value: "1000_off", chance: 33.33 },
  { label: "₹750 OFF", value: "750_off", chance: 33.34 },
  { label: "Diamond Pendant", value: "diamond_pendant", chance: 0 },
  { label: "₹5,000 OFF", value: "5000_off", chance: 0 },
  { label: "₹10,000 OFF", value: "10000_off", chance: 0 },
];

const WHEEL_SEGMENTS = [
  { value: "diamond_pendant", label: "Diamond Pendant", centerAngle: 0 },
  { value: "1500_off", label: "₹1,500 OFF", centerAngle: 60 },
  { value: "10000_off", label: "₹10,000 OFF", centerAngle: 120 },
  { value: "1000_off", label: "₹1,000 OFF", centerAngle: 180 },
  { value: "5000_off", label: "₹5,000 OFF", centerAngle: 240 },
  { value: "750_off", label: "₹750 OFF", centerAngle: 300 },
];

const COUPON_MAP = {
  "750_off": "GRAND750",
  "1000_off": "GRAND1000",
  "1500_off": "GRAND1500",
};

import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

// ... (keep SPIN_PRIZES, WHEEL_SEGMENTS, COUPON_MAP)

export function RegisterForm({ initialMobile = "" }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const controls = useAnimation();
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const [mobile, setMobile] = useState(initialMobile);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [wonPrize, setWonPrize] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [consent, setConsent] = useState(true);
  const [step, setStep] = useState("register"); // register, verify-otp, success
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(0);

  const otpRef = useRef();
  const timerRef = useRef();

  const [isMobilePreFilled] = useState(!!initialMobile);

  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [timer]);

  useEffect(() => {
    if (initialMobile) {
      setMobile(initialMobile);
    }
  }, [initialMobile]);

  useEffect(() => {
    if (step === "verify-otp") {
      const timerId = setTimeout(() => {
        otpRef.current?.focus();
      }, 100);
      return () => clearTimeout(timerId);
    }
  }, [step]);

  useEffect(() => {
    let timer;
    if (step === "success" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (step === "success" && countdown === 0) {
      router.replace("/admin");
    }
    return () => clearInterval(timer);
  }, [step, countdown, router]);

  const loginSuccess = async (data) => {
    const user = data.user || data.customer;
    const userId = user?.id;
    const canonicalPhone = toE164(mobile || user?.mobile || user?.phone);

    // Track Signup in GTM
    pushSignup({
      id: userId,
      mobile: canonicalPhone || mobile,
      phone: canonicalPhone || mobile,
      email: email,
      name: `${firstName} ${lastName}`.trim()
    });
    
    dispatch(
      login({
        user: {
          id: userId,
          mobile: canonicalPhone || mobile,
          phone: canonicalPhone || mobile,
          email: user?.email || email,
          first_name: user?.first_name || firstName,
          last_name: user?.last_name || lastName,
          name:
            (user?.first_name || firstName)
              ? `${user?.first_name || firstName} ${user?.last_name || lastName || ""}`.trim()
              : (canonicalPhone || mobile || ""),
        },
        accessToken: data.accessToken,
      })
    );

    try {
      const avData = await apiFetch("/api/customer/profile/avatar");
      if (avData.avatar) dispatch(setAvatar(avData.avatar));
    } catch (err) {}

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

    toast.success("Registration Successful");
  };

  const handleSpinAndRegister = async () => {
    if (!firstName || !lastName || !email || !mobile) return toast.error("Please fill all fields");
    if (mobile.length !== 10) return toast.error("Enter valid 10-digit mobile");
    if (!/^[6-9]/.test(mobile)) return toast.error("Please enter a valid Indian mobile number starting with 6, 7, 8 or 9");
    if (!consent) return toast.error("Please accept T&Cs");

    try {
      setLoading(true);
      const res = await checkCustomerApi({ mobile });
      if (res.exists) {
         toast.info("You already have an account! Please verify OTP to login.");
         await sendOtpApi(mobile);
         setStep("verify-otp");
         setTimer(30);
         setLoading(false);
         return;
      }
    } catch(e) {
      console.error(e);
    }
    setLoading(false);

    if (isMobile) {
      setIsDrawerOpen(true);
      // Small delay to ensure drawer is open before animation
      setTimeout(() => startSpinning(), 500);
    } else {
      startSpinning();
    }
  };

  const verifyExistingOtp = async (overrideOtp) => {
    const otpValue = typeof overrideOtp === "string" ? overrideOtp : otp;
    if (otpValue.length < 4) return toast.error("Invalid OTP");

    try {
      setLoading(true);
      const data = await verifyOtpApi(mobile, otpValue);

      if (data.status === "LOGIN" || data.type === "success") {
        await loginSuccess(data);
        router.push("/admin");
      }
    } catch (err) {
      toast.error(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const startSpinning = async () => {
    setIsSpinning(true);
    const prize = getWeightedPrize();
    setWonPrize(prize);

    const segment = WHEEL_SEGMENTS.find((s) => s.value === prize.value) || WHEEL_SEGMENTS[0];
    const extraSpins = 360 * 5;
    const targetRotation = -segment.centerAngle;
    const finalRotation = -(extraSpins + Math.abs(targetRotation));

    // Snappier spin on mobile (2.5s) with smooth iOS-friendly easing
    const spinDuration = typeof window !== "undefined" && window.innerWidth < 768 ? 2.5 : 3.0;

    await controls.start({
      rotate: finalRotation,
      z: 0,
      transition: { duration: spinDuration, ease: [0.2, 0.8, 0.2, 1] },
    });

    setTimeout(async () => {
      try {
        setLoading(true);
        const data = await registerCustomer({
          firstName,
          lastName,
          email,
          mobile,
          wonPrize: prize.value,
          prizeLabel: prize.label,
        });

        if (data.status === "REGISTER_SUCCESS" || data.type === "success") {
          await loginSuccess(data);
          setStep("success");
          setIsDrawerOpen(false);
        }
      } catch (err) {
        toast.error(err.message || "Registration failed");
        setIsSpinning(false);
        setIsDrawerOpen(false);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  // ... (keep copyCoupon, getWeightedPrize)

  const SpinWheelContent = () => (
    <div 
      className="relative w-full max-w-[350px] aspect-square mx-auto"
      style={{
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
        WebkitPerspective: 1000,
        perspective: 1000,
      }}
    >
      <motion.img
        src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Below_Banner_Trust_Icon_Strip_1_1.png?v=1770784760"
        alt="Spin the Wheel"
        className="w-full h-full object-contain absolute inset-0 m-auto z-[1]"
        style={{
          transformOrigin: "50% 50%",
          WebkitTransformOrigin: "50% 50%",
          willChange: "transform",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
          WebkitTransform: "translate3d(0, 0, 0)",
          transform: "translate3d(0, 0, 0)",
        }}
        animate={controls}
        initial={{ rotate: 0, z: 0 }}
      />
      <img
        src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Spin_The_Wheel_Spinner_1.png?v=1769229971"
        alt="Spin CTA"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none w-full max-w-[400px] h-auto"
        style={{
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
        }}
      />
    </div>
  );

  if (step === "success") {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-[500px] mx-auto w-full border border-gray-100">
        <div className="text-4xl mb-4 animate-bounce">🎉</div>
        <h2 className="text-2xl font-bold mb-4 font-serif">Account Created Successfully!</h2>
        <p className="text-gray-600 mb-6">Your reward is ready. Apply this at checkout.</p>
        <div className="flex items-center justify-between gap-2 mx-auto my-3 p-3 pl-5 rounded-lg border border-dashed border-green-600 bg-green-50 max-w-[250px] font-semibold text-black">
          <span className="text-lg">{COUPON_MAP[wonPrize?.value] || "LUCIRA10"}</span>
          <button className="border-none bg-transparent cursor-pointer text-xl p-1" onClick={copyCoupon}>
            📋
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-6">
          Redirecting to My Account in <span className="font-bold text-[#5f4745]">{countdown}s</span>...
        </p>
        <button 
          className="btn-primary mt-4 max-w-[250px] mx-auto bg-[#5f4745] text-white py-2 px-6 rounded-md uppercase text-sm font-semibold tracking-wider hover:bg-[#4a3634] transition-all" 
          onClick={() => router.push("/admin")}
        >
          CONTINUE SHOPPING
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row items-stretch bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-[1000px] mx-auto min-h-[550px]">
        {/* Left Side: Spin Wheel (Desktop Only) */}
        {!isMobile && (
          <div className="hidden md:flex flex-col items-center justify-center relative w-full md:w-[50%] bg-center bg-cover bg-no-repeat" style={{ backgroundImage: "url('https://cdn.shopify.com/s/files/1/0739/8516/3482/files/BG_1_1.png?v=1770198650')" }}>
            <SpinWheelContent />
          </div>
        )}

        {/* Right Side: Form */}
        <div className="w-full md:w-[50%] p-6 md:p-12 flex flex-col justify-center">
          <div className="text-center mb-6">
            <img src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/logo.svg" width="120" height="49" alt="lucira jewelry logo" className="mx-auto" />
          </div>
          
          <p className="mb-2 text-center text-lg md:text-xl leading-tight font-medium text-black uppercase mx-auto mt-0 cursor-pointer" onClick={() => firstNameRef.current?.focus()}>REGISTER & UNLOCK YOUR REWARDS</p>
          <p className="text-sm md:text-base font-medium text-[#5B5B5B] text-center mb-[18px] tracking-wider leading-relaxed max-w-[100%] mx-auto cursor-pointer" onClick={() => firstNameRef.current?.focus()}>Get ₹500 Assured + Spin the Wheel for More!</p>

          <div className="space-y-4">
            {step === "register" && (
              <>
                <div className="flex flex-col mb-[8px]">
                  <input
                    ref={firstNameRef}
                    type="text"
                    placeholder="Full Name *"
                    className="w-full h-[45px] px-4 text-sm md:text-base border border-[#e2e2e2] rounded-sm outline-none bg-white placeholder-[#666]"
                    value={firstName + (lastName ? " " + lastName : "")}
                    onChange={(e) => {
                      const parts = e.target.value.split(" ");
                      setFirstName(parts[0] || "");
                      setLastName(parts.slice(1).join(" ") || "");
                    }}
                  />
                </div>

                <div className="flex flex-col mb-[8px]">
                  <input
                    type="email"
                    placeholder="Email Address *"
                    className="w-full h-[45px] px-4 text-sm md:text-base border border-[#e2e2e2] rounded-sm outline-none bg-white placeholder-[#666]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="flex flex-col mb-[14px]">
                  <div className="flex items-center border border-[#e2e2e2] h-[45px] px-4 rounded-sm bg-white">
                    <span className="text-sm md:text-base font-normal mr-2.5 pr-3 border-r border-[#d0d0d0]">+91</span>
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      maxLength="10"
                      className="w-full h-full text-sm md:text-base border-none outline-none font-normal bg-transparent tracking-[0.3px] disabled:opacity-50 placeholder-[#666]"
                      value={mobile}
                      onChange={(e) => setMobile(cleanPhoneInput(e.target.value))}
                      disabled={isMobilePreFilled && mobile.length === 10}
                    />
                  </div>
                </div>

                <div className="my-3 max-w-full">
                  <label htmlFor="consent-reg" className="flex items-start gap-2 text-xs leading-tight cursor-pointer text-[#000]">
                    <input type="checkbox" id="consent-reg" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[#5a413f]" />
                    <span>I accept that I have read & understood Privacy Policy and T&Cs.</span>
                  </label>
                </div>

                <button
                  className="text-white h-[45px] w-full font-normal text-sm md:text-base cursor-pointer transition-opacity uppercase tracking-[0.3px] border-none mt-0 mb-[4px] bg-[#5a413f] rounded-lg disabled:opacity-50 shadow-md"
                  onClick={handleSpinAndRegister}
                  disabled={isSpinning || loading}
                >
                  {isSpinning ? "SPINNING..." : "SPIN & CREATE ACCOUNT"}
                </button>
                <div className="flex items-center justify-center gap-2 text-[12px] text-black mt-[8px]">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                    <path d="M16.6668 10.8333C16.6668 15 13.7502 17.0833 10.2835 18.2916C10.102 18.3531 9.90478 18.3502 9.72516 18.2833C6.25016 17.0833 3.3335 15 3.3335 10.8333V4.99997C3.3335 4.77895 3.42129 4.56699 3.57757 4.41071C3.73385 4.25443 3.94582 4.16663 4.16683 4.16663C5.8335 4.16663 7.91683 3.16663 9.36683 1.89997C9.54337 1.74913 9.76796 1.66626 10.0002 1.66626C10.2324 1.66626 10.4569 1.74913 10.6335 1.89997C12.0918 3.17497 14.1668 4.16663 15.8335 4.16663C16.0545 4.16663 16.2665 4.25443 16.4228 4.41071C16.579 4.56699 16.6668 4.77895 16.6668 4.99997V10.8333Z" stroke="#008000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M7.5 9.99992L9.16667 11.6666L12.5 8.33325" stroke="#008000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  <span>100% Secured & Spam Free</span>
                </div>

                <p className="text-center text-[13px] text-gray-600 mt-4">
                  Already registered?{" "}
                  <span className="text-[#5a413f] font-bold underline cursor-pointer" onClick={() => router.push("/login")}>
                    Login
                  </span>
                </p>
              </>
            )}

            {step === "verify-otp" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Enter OTP <span className="text-red-500">*</span></label>
                  <input
                    ref={otpRef}
                    autoFocus
                    placeholder="Enter 4-digit OTP"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setOtp(val);
                      if (val.length === 4) {
                        verifyExistingOtp(val);
                      }
                    }}
                    className="w-full h-11 px-3 text-sm border border-gray-200 rounded focus:border-black outline-none transition-all"
                  />
                </div>
                <button
                  onClick={() => verifyExistingOtp(otp)}
                  disabled={loading}
                  className="w-full h-11 bg-[#5f4745] hover:bg-[#4a3634] text-white text-sm font-semibold rounded transition-colors uppercase tracking-wider mt-2 shadow-md"
                >
                  {loading ? "VERIFYING..." : "VERIFY OTP"}
                </button>
                
                <p className="text-center text-[13px] text-gray-600 mt-2">
                  {timer > 0 ? (
                    `Resend OTP in 00:${timer < 10 ? `0${timer}` : timer}`
                  ) : (
                    <span 
                      className="text-[#b77766] font-bold underline cursor-pointer" 
                      onClick={async () => {
                        setTimer(30);
                        await sendOtpApi(mobile);
                        toast.success("OTP resent!");
                      }}
                    >
                      Resend OTP
                    </span>
                  )}
                </p>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-1 text-[11px] text-gray-400 mt-6 uppercase tracking-widest">
            <span>100% Secured & Spam Free</span>
          </div>
        </div>
      </div>

      {/* Mobile Spin Wheel Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="p-6">
          <DrawerHeader>
            <DrawerTitle className="text-center font-serif uppercase tracking-widest text-lg">Spin to Win Rewards</DrawerTitle>
          </DrawerHeader>
          <div className="py-8 flex items-center justify-center bg-cover rounded-lg" style={{ backgroundImage: "url('https://cdn.shopify.com/s/files/1/0739/8516/3482/files/BG_1_1.png?v=1770198650')" }}>
            <SpinWheelContent />
          </div>
          <p className="text-center text-sm text-gray-500 mt-4 italic">Good luck! Your reward is waiting...</p>
        </DrawerContent>
      </Drawer>
    </>
  );
}
