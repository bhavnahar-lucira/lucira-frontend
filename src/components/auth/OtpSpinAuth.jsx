"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import {
  sendOtpApi,
  verifyOtpApi,
  registerCustomer,
  checkCustomerApi,
} from "@/lib/api";
import { login, setAvatar } from "@/redux/features/user/userSlice";
import { mergeGuestWishlist } from "@/redux/features/wishlist/wishlistSlice";
import { mergeCart } from "@/redux/features/cart/cartSlice";
import { pushLogin, pushSignup } from "@/lib/gtm";

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

export function OtpSpinAuth({ 
  onSuccess, 
  onClose, 
  initialMobile = "", 
  initialStep = "login", 
  onStepChange,
  forceShowWheel = false,
  overrideHeading = "",
  overrideSubtext = "",
  showCloseButton = true,
  isPopup = false
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const controls = useAnimation();
  const authRedirectPath = useSelector((state) => state.user.authRedirectPath);
  const redirectTargetRef = useRef(null);

  useEffect(() => {
    // Priority: Redux > localStorage > Current Path
    const storedPath = localStorage.getItem("auth_redirect_path");
    if (authRedirectPath) {
      redirectTargetRef.current = authRedirectPath;
    } else if (storedPath) {
      redirectTargetRef.current = storedPath;
    }
  }, [authRedirectPath]);

  const [step, setStep] = useState(initialStep); // login, otp, register, success
  const [mobile, setMobile] = useState(initialMobile);

  const handleStepChange = (newStep) => {
    if (onStepChange) onStepChange(newStep);
    else setStep(newStep);
  };

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  useEffect(() => {
    if (initialMobile) setMobile(initialMobile);
  }, [initialMobile]);
  
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [consent, setConsent] = useState(true);
  const [pendingRegister, setPendingRegister] = useState(false);
  const [isMobileVerified, setIsMobileVerified] = useState(false);

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

  // Reset verification if mobile changes
  useEffect(() => {
    setIsMobileVerified(false);
  }, [mobile]);

  // WebOTP API listener
  useEffect(() => {
    if ("OTPCredential" in window && (step === "otp")) {
      const ac = new AbortController();
      navigator.credentials
        .get({
          otp: { transport: ["sms"] },
          signal: ac.signal,
        })
        .then((otpData) => {
          if (otpData && otpData.code) {
            handleAutoFillOtp(otpData.code);
          }
        })
        .catch((err) => console.log("WebOTP Error:", err));
      return () => ac.abort();
    }
  }, [step]);

  // Focus management for different steps
  useEffect(() => {
    if (step === "login") {
      setTimeout(() => mobileRef.current?.focus(), 100);
    } else if (step === "otp") {
      setTimeout(() => otpRefs[0]?.current?.focus(), 100);
    } else if (step === "register") {
      setTimeout(() => firstNameRef.current?.focus(), 100);
    }
  }, [step]);

  const handleAutoFillOtp = (code) => {
    const cleanCode = code.replace(/\D/g, "").slice(0, 4);
    if (cleanCode.length === 4) {
      const newOtp = cleanCode.split("");
      setOtp(newOtp);
      handleVerifyOtp(cleanCode);
    }
  };

  const loginSuccess = async (data, isSignup = false, skipRedirect = false) => {
    const target = redirectTargetRef.current || localStorage.getItem("auth_redirect_path") || pathname || "/";
    localStorage.removeItem("auth_redirect_path"); // Clean up
    
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

    try {
      const avRes = await fetch("/api/customer/profile/avatar");
      if (avRes.ok) {
        const avData = await avRes.json();
        if (avData.avatar) dispatch(setAvatar(avData.avatar));
      }
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

    if (!skipRedirect) {
      toast.success("Login Successful");
      if (onSuccess) onSuccess(target);
      else router.push(target);
      router.refresh();
    }
  };

  const handleSendOtp = async () => {
    if (mobile.length !== 10) return toast.error("Enter valid 10-digit mobile");
    setLoading(true);
    try {
      await sendOtpApi(mobile);
      toast.success("OTP Sent");
      handleStepChange("otp");
      setTimer(30);
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (overrideOtp) => {
    const otpValue = typeof overrideOtp === "string" ? overrideOtp : otp.join("");
    if (otpValue.length !== 4) return toast.error("Enter 4-digit OTP");
    setLoading(true);
    try {
      const data = await verifyOtpApi(mobile, otpValue);
      if (data.status === "REGISTER_REQUIRED" || data.type === "register") {
        if (pendingRegister) {
          // Verification success, now complete the pending registration
          const regData = await registerCustomer({
            firstName,
            lastName,
            email,
            mobile,
            wonPrize: wonPrize?.value,
            prizeLabel: wonPrize?.label,
          });
          if (regData.status === "REGISTER_SUCCESS" || regData.type === "success") {
            loginSuccess(regData, true);
            handleStepChange("success");
            setPendingRegister(false);
          }
        } else {
          setIsMobileVerified(true);
          handleStepChange("register");
        }
      } else if (data.status === "LOGIN" || data.type === "success") {
        loginSuccess(data);
      }
    } catch (err) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    // Handle paste or autofill of the entire 4-digit code
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
    
    // Auto-verify if 4 digits are entered manually
    if (index === 3 && value) {
      const finalOtp = [...newOtp];
      finalOtp[3] = value.slice(-1);
      if (finalOtp.every(d => d !== "")) {
        setTimeout(() => {
           const otpVal = finalOtp.join("");
           if (otpVal.length === 4) {
             handleVerifyOtp(otpVal); 
           }
        }, 50);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const getWeightedPrize = () => {
    const totalChance = SPIN_PRIZES.reduce((sum, p) => sum + p.chance, 0);
    let random = Math.random() * totalChance;
    for (const prize of SPIN_PRIZES) {
      if (random < prize.chance) return prize;
      random -= prize.chance;
    }
    return SPIN_PRIZES[0];
  };

  const handleSpinAndRegister = async () => {
    if (!firstName || !lastName || !email) return toast.error("Please fill all fields");

    setLoading(true);
    try {
      const { exists } = await checkCustomerApi({ email, mobile });
      if (exists) {
        toast.info("You are already a customer! Please verify OTP to login.");
        await sendOtpApi(mobile);
        setPendingRegister(false);
        handleStepChange("otp");
        setTimer(30);
        setLoading(false);
        return;
      }
    } catch (err) {
      setLoading(false);
      return toast.error("Failed to verify customer status.");
    }
    setLoading(false);

    setIsSpinning(true);
    const prize = getWeightedPrize();
    setWonPrize(prize);

    const segment = WHEEL_SEGMENTS.find((s) => s.value === prize.value) || WHEEL_SEGMENTS[0];
    const extraSpins = 360 * 5;
    const targetRotation = -segment.centerAngle;
    const finalRotation = -(extraSpins + Math.abs(targetRotation));

    await controls.start({
      rotate: finalRotation,
      transition: { duration: 4, ease: [0.17, 0.67, 0.12, 0.99] },
    });

    // After spin animation
    setTimeout(async () => {
      if (isMobileVerified) {
        try {
          setLoading(true);
          const regData = await registerCustomer({
            firstName,
            lastName,
            email,
            mobile,
            wonPrize: prize?.value,
            prizeLabel: prize?.label,
          });
          if (regData.status === "REGISTER_SUCCESS" || regData.type === "success") {
            loginSuccess(regData, true);
            handleStepChange("success");
            setPendingRegister(false);
          }
        } catch (err) {
          toast.error(err.message || "Registration failed");
          setIsSpinning(false);
        } finally {
          setLoading(false);
        }
      } else {
        try {
          setLoading(true);
          await sendOtpApi(mobile);
          toast.success("OTP Sent for verification");
          setPendingRegister(true);
          handleStepChange("otp");
          setTimer(30);
        } catch (err) {
          toast.error(err.message || "Failed to send OTP");
          setIsSpinning(false);
        } finally {
          setLoading(false);
        }
      }
    }, 500);
  };

  const copyCoupon = () => {
    const code = COUPON_MAP[wonPrize?.value] || "LUCIRA10";
    navigator.clipboard.writeText(code);
    toast.success("Coupon copied!");
  };

  const showWheel = step === "register" || forceShowWheel;

  // Custom animation for mobile
  const isMobileView = useMemo(() => typeof window !== "undefined" && window.innerWidth < 768, []);

  return (
    <div 
      className={`relative flex flex-col items-center w-full mx-auto overflow-hidden transition-all duration-300 bg-[#FFFEFC] 
      ${showWheel 
        ? "md:flex-row md:items-stretch md:w-[800px] md:max-w-[800px] md:min-h-[500px]" 
        : "md:flex-row md:items-stretch md:w-[800px] md:max-w-[800px] md:h-[500px]"}
      ${(isPopup || !showWheel) ? "md:shadow-[0_0_10px_rgba(0,0,0,0.3)] md:rounded-sm" : "md:rounded-sm"}
      max-md:shadow-none max-md:rounded-none max-md:max-w-full
      ${isMobileView ? "animate-[slideInBottom_0.45s_cubic-bezier(0.25,0.46,0.45,0.94)_forwards]" : ""}`}
      style={{
        animation: isMobileView ? "slideInBottom 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards" : "none"
      }}
    >
      <style>{`
        @keyframes slideInBottom {
          from { transform: translateY(110%); }
          to   { transform: translateY(0); }
        }
      `}</style>
      
      {showCloseButton && (
        <button 
          className="absolute top-5 right-5 z-20 p-1 rounded-full text-black cursor-pointer border-none flex items-center justify-center bg-white/50 backdrop-blur-sm" 
          onClick={onClose || onSuccess}
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      )}

      {/* Background/Side Image Container */}
      {showWheel ? (
        <div 
          className={`flex flex-col items-center justify-center relative w-full h-[220px] md:h-auto overflow-hidden bg-center bg-cover bg-no-repeat md:w-[50%] md:self-stretch`}
          style={{ backgroundImage: 'url("https://cdn.shopify.com/s/files/1/0739/8516/3482/files/BG_1_1.png?v=1770198650")' }}
        >
          <div className={`relative w-[90%] h-[290px] md:w-[350px] md:h-[350px] max-md:absolute max-md:top-[-75px]`}>
            <motion.img
              src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Below_Banner_Trust_Icon_Strip_1_1.png?v=1770784760"
              alt="Spin the Wheel"
              className="w-full h-full object-contain absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[1]"
              animate={controls}
              initial={{ rotate: 0 }}
            />
            <img
              src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Spin_The_Wheel_Spinner_1.png?v=1769229971"
              alt="Spin CTA"
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none h-auto w-[115%] max-w-none`}
            />
          </div>
        </div>
      ) : (
        (step === "login" || step === "otp" || step === "success") && (
          <div 
            className={`w-full h-[175px] md:h-auto bg-center bg-cover bg-no-repeat md:w-[50%] md:self-stretch`}
            style={{ 
              backgroundImage: isMobileView 
                ? 'url("https://luciraonline.myshopify.com/cdn/shop/files/Jan-Popup-Mobile_jpg.jpg?v=1770010490")' 
                : 'url("https://luciraonline.myshopify.com/cdn/shop/files/Jan-Popup-Desktop-New_2.jpg?v=1769844544")' 
            }}
          />
        )
      )}

      <div className={`flex flex-col w-full p-5 md:p-8 md:justify-center md:w-[50%] md:self-stretch`}>
        {!(isMobileView && step === "register") && (
          <div className="text-center mb-4">
            <img
              src="/images/logo.svg"
              width="120"
              height="49"
              alt="lucira jewelry logo"
              className="mx-auto"
            />
          </div>
        )}

        {step === "login" && (
          <>
            <p className="mb-2 text-center text-lg md:text-xl leading-tight font-medium text-black uppercase mx-auto mt-0">{overrideHeading || "WELCOME TO LUCIRA"}</p>
            <p className="text-sm md:text-base font-medium text-[#5B5B5B] text-center mb-3 tracking-wider leading-relaxed capitalize max-w-[100%] mx-auto">{overrideSubtext || "Welcome To The Jewelry World Of Lucira!"}</p>
            <div className="flex items-center border border-[#e2e2e2] h-[45px] px-4 rounded-sm bg-white">
              <span className="text-sm md:text-base font-normal mr-2.5 pr-3 border-r border-[#d0d0d0]">+91</span>
              <input
                ref={mobileRef}
                type="tel"
                placeholder="Enter Phone Number"
                maxLength="10"
                className="w-full h-full text-sm md:text-base border-none outline-none font-normal bg-transparent tracking-[0.3px]"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="my-3 max-w-full hidden">
              <label className="flex items-start gap-2 text-xs leading-tight cursor-pointer text-[#000]">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 accent-[#5a413f]"
                />
                <span>
                  I accept that I have read & understood Privacy Policy and T&Cs.
                </span>
              </label>
            </div>
            <button 
              className="text-white h-[45px] w-full font-normal text-sm md:text-base cursor-pointer transition-opacity uppercase tracking-[0.3px] border-none mt-3 bg-[#5a413f] rounded-lg disabled:opacity-50" 
              onClick={handleSendOtp} 
              disabled={loading}
            >
              {loading ? "SENDING..." : "REQUEST OTP"}
            </button>
            <div className="flex items-center justify-center gap-2 text-sm md:text-base text-black mt-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path d="M16.6668 10.8333C16.6668 15 13.7502 17.0833 10.2835 18.2916C10.102 18.3531 9.90478 18.3502 9.72516 18.2833C6.25016 17.0833 3.3335 15 3.3335 10.8333V4.99997C3.3335 4.77895 3.42129 4.56699 3.57757 4.41071C3.73385 4.25443 3.94582 4.16663 4.16683 4.16663C5.8335 4.16663 7.91683 3.16663 9.36683 1.89997C9.54337 1.74913 9.76796 1.66626 10.0002 1.66626C10.2324 1.66626 10.4569 1.74913 10.6335 1.89997C12.0918 3.17497 14.1668 4.16663 15.8335 4.16663C16.0545 4.16663 16.2665 4.25443 16.4228 4.41071C16.579 4.56699 16.6668 4.77895 16.6668 4.99997V10.8333Z" stroke="#008000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M7.5 9.99992L9.16667 11.6666L12.5 8.33325" stroke="#008000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>100% Secured & Spam Free</span>
            </div>
            <p className="text-center text-sm md:text-base mt-2.5 text-[#5B5B5B]">
              New user? <span className="cursor-pointer font-bold underline text-[#5a413f]" onClick={() => handleStepChange("register")}>Register</span>
            </p>
          </>
        )}

        {step === "otp" && (
          <>
            <p className="mb-2 text-center text-lg md:text-xl leading-tight font-medium text-black uppercase mx-auto mt-0">{overrideHeading || "VERIFY OTP"}</p>
            <p className="text-sm md:text-base font-medium text-[#5B5B5B] text-center mb-5 tracking-wider leading-relaxed capitalize max-w-[100%] mx-auto">{overrideSubtext || `Sent to +91 ${mobile}`}</p>
            <div className="flex justify-center gap-2 mt-2 mb-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={otpRefs[i]}
                  type="tel"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength="1"
                  className="w-[20%] h-[50px] text-center text-base md:text-lg border rounded-md border-[#ddd] focus:border-black outline-none font-extrabold"
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                />
              ))}
            </div>
            <button 
              className="text-white h-[45px] w-full font-normal text-sm md:text-base cursor-pointer transition-opacity uppercase tracking-[0.3px] border-none mt-3 bg-[#5a413f] rounded-lg disabled:opacity-50" 
              onClick={() => handleVerifyOtp()} 
              disabled={loading}
            >
              {loading ? "VERIFYING..." : "VERIFY OTP"}
            </button>
            <p className="text-center mt-2.5 text-sm md:text-base text-[#5B5B5B]">
              {timer > 0 ? (
                `Resend OTP in 00:${timer < 10 ? `0${timer}` : timer}`
              ) : (
                <span className="cursor-pointer underline font-bold text-[#b77766]" onClick={handleSendOtp}>
                  Resend OTP
                </span>
              )}
            </p>
          </>
        )}

        {step === "register" && (
          <div className="overflow-hidden">
            <p className="mb-2 text-center text-lg md:text-xl leading-tight font-medium text-black uppercase mx-auto mt-0">Register to Win a Reward</p>
            <p className="text-sm md:text-base font-medium text-[#5B5B5B] text-center mb-3 tracking-wider leading-relaxed capitalize max-w-[100%] mx-auto">Try Your Luck! Win a Diamond Pendant</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5 mb-2">
                <div className="flex flex-col">
                  <label className="text-sm md:text-base flex mb-1.5 font-normal text-[#666]">First Name <span className="text-red-500 ml-1">*</span></label>
                  <input
                    ref={firstNameRef}
                    type="text"
                    className="w-full h-10 px-4 text-sm md:text-base border border-[#e2e2e2] rounded-sm outline-none bg-white"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm md:text-base flex mb-1.5 font-normal text-[#666]">Last Name <span className="text-red-500 ml-1">*</span></label>
                  <input
                    type="text"
                    className="w-full h-10 px-4 text-sm md:text-base border border-[#e2e2e2] rounded-sm outline-none bg-white"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col mb-2">
                <label className="text-sm md:text-base flex mb-1.5 font-normal text-[#666]">Email Address <span className="text-red-500 ml-1">*</span></label>
                <input
                  type="email"
                  className="w-full h-10 px-4 text-sm md:text-base border border-[#e2e2e2] rounded-lg outline-none bg-white rounded-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm md:text-base flex mb-1.5 font-normal text-[#666]">Phone Number</label>
                <div className="flex items-center border border-[#e2e2e2] h-[45px] px-4 rounded-sm bg-white">
                  <span className="text-sm md:text-base font-normal mr-2.5 pr-3 border-r border-[#d0d0d0]">+91</span>
                  <input
                    type="tel"
                    placeholder="Enter Phone Number"
                    maxLength="10"
                    className="w-full h-full text-sm md:text-base border-none outline-none font-normal bg-transparent tracking-[0.3px] disabled:opacity-50"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                    disabled={isMobileVerified && mobile.length === 10}
                  />
                </div>
              </div>

              <div className="my-3 max-w-full">
                <label className="flex items-start gap-2 text-xs leading-tight cursor-pointer text-[#000]">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 accent-[#5a413f]"
                  />
                  <span>
                    I accept that I have read & understood Privacy Policy and T&Cs.
                  </span>
                </label>
              </div>

              <button
                className="text-white h-[45px] w-full font-normal text-sm md:text-base cursor-pointer transition-opacity uppercase tracking-[0.3px] border-none mt-0 bg-[#5a413f] rounded-lg disabled:opacity-50"
                onClick={handleSpinAndRegister}
                disabled={isSpinning || loading}
              >
                {isSpinning ? "SPINNING..." : "SPIN & CREATE ACCOUNT"}
              </button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="text-center">
            <div className="text-4xl mb-4 text-center">🎉</div>
            <p className="mb-2 text-center text-lg md:text-xl leading-tight font-medium text-black uppercase mx-auto mt-0 max-w-[245px]">Your Account has been created Successfully</p>
            <p className="text-xs font-medium text-[#5B5B5B] text-center mb-3 tracking-wider leading-relaxed capitalize max-w-[280px] mx-auto mt-3">
              Your reward is ready, Apply this on checkout
            </p>
            <div className="flex items-center justify-between gap-2 mx-auto my-3 p-2 pl-5 rounded-lg border border-dashed border-green-600 bg-green-50 max-w-[205px] font-semibold text-black">
              <span className="text-sm md:text-base">{COUPON_MAP[wonPrize?.value] || "LUCIRA10"}</span>
              <button className="border-none bg-transparent cursor-pointer text-lg p-1" onClick={copyCoupon}>
                📋
              </button>
            </div>
            <button 
              className="text-white h-[45px] w-full font-normal text-sm md:text-base cursor-pointer transition-opacity uppercase tracking-[0.3px] border-none mt-4 bg-[#5a413f] rounded-lg" 
              onClick={() => {
                const target = redirectTargetRef.current || localStorage.getItem("auth_redirect_path") || pathname || "/";
                localStorage.removeItem("auth_redirect_path");
                if (onSuccess) onSuccess(target);
                else router.push(target);
                router.refresh();
              }}
            >
              CONTINUE SHOPPING
            </button>
          </div>
        )}

        {step === "register" && (
          <p className="text-center text-sm md:text-base mt-2.5 text-[#5B5B5B] mb-1">
            Already have an account?{" "}
            <span
              className="cursor-pointer font-bold underline text-[#5a413f]"
              onClick={() => handleStepChange("login")}
            >
              Login
            </span>
          </p>
        )}

      </div>
    </div>
  );
}
