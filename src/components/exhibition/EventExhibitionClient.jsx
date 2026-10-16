"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { 
  User, 
  Mail,
  Cake, 
  Phone, 
  Calendar, 
  Pencil, 
  X, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

import {
  checkExhibitionCustomerApi,
  sendExhibitionOtpApi,
  verifyExhibitionOtpApi,
  claimExhibitionRewardApi
} from "@/lib/api";
import { login } from "@/redux/features/user/userSlice";
import { mergeCart } from "@/redux/features/cart/cartSlice";
import { mergeGuestWishlist } from "@/redux/features/wishlist/wishlistSlice";
import { pushSignup, pushPromoClick, pushToDataLayer } from "@/lib/gtm";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import shopifyLoader from "@/utils/shopifyLoader";

const STORE_BG_URL = "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/DSC02543_2.jpg?v=1792067775";
const GOLD_COIN_URL = "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/gold_coin.png?v=1792067741";
const WHITE_LOGO_URL = "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Lucira_Full_White_logo_1.svg?v=1767856155&width=256";

export default function EventExhibitionClient() {
  const router = useRouter();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user?.user);

  // Steps: 2 = Form Drawer (Default, no splash animation), 3 = OTP Verification, 4 = Success Page
  const [step, setStep] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [claimedRewardData, setClaimedRewardData] = useState(null);

  // Form Fields (All mandatory)
  const [formData, setFormData] = useState({
    fullName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "", // DD/MM/YYYY
  });

  const [formErrors, setFormErrors] = useState({});

  // OTP State (4 digits)
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(118); // 01:58
  const otpInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const timerRef = useRef(null);

  // Pre-fill form if customer is already logged in
  useEffect(() => {
    if (currentUser) {
      const cleanPhone = (currentUser.phone || currentUser.mobile || "").replace(/^\+91/, "").replace(/\D/g, "").slice(-10);
      const first = currentUser.first_name || "";
      const last = currentUser.last_name || "";
      const full = `${first} ${last}`.trim();
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || full || "",
        firstName: prev.firstName || first || "",
        lastName: prev.lastName || last || "",
        email: prev.email || currentUser.email || "",
        phone: prev.phone || cleanPhone || "",
      }));
    }
  }, [currentUser]);

  // Resend OTP countdown
  useEffect(() => {
    if (step === 3 && timer > 0) {
      timerRef.current = setTimeout(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [step, timer]);

  // Auto-focus first OTP input on reaching step 3
  useEffect(() => {
    if (step === 3) {
      const t = setTimeout(() => {
        otpInputRefs[0]?.current?.focus();
      }, 250);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Format timer as MM:SS
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Handle Full Name change (auto syncs firstName & lastName)
  const handleFullNameChange = (e) => {
    const full = e.target.value;
    const parts = full.trim().split(/\s+/);
    const first = parts[0] || "";
    const last = parts.slice(1).join(" ") || "";
    setFormData((prev) => ({
      ...prev,
      fullName: full,
      firstName: first,
      lastName: last,
    }));
    if (formErrors.fullName) {
      setFormErrors((prev) => ({ ...prev, fullName: null }));
    }
  };

  // DOB smart input mask: DD/MM/YYYY
  const handleDobChange = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 8) val = val.slice(0, 8);

    let formatted = "";
    if (val.length <= 2) {
      formatted = val;
    } else if (val.length <= 4) {
      formatted = `${val.slice(0, 2)}/${val.slice(2)}`;
    } else {
      formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4, 8)}`;
    }

    setFormData((prev) => ({ ...prev, dob: formatted }));
    if (formErrors.dob) {
      setFormErrors((prev) => ({ ...prev, dob: null }));
    }
  };

  // Validate form inputs
  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim() && !formData.firstName.trim()) {
      errors.fullName = "Full Name is mandatory";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is mandatory";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (!cleanPhone) {
      errors.phone = "Phone number is mandatory";
    } else if (cleanPhone.length !== 10) {
      errors.phone = "Enter a valid 10-digit number";
    } else if (!/^[6-9]/.test(cleanPhone)) {
      errors.phone = "Phone must start with 6, 7, 8 or 9";
    }

    if (!formData.dob.trim()) {
      errors.dob = "Date of Birth is mandatory";
    } else {
      const parts = formData.dob.split("/");
      if (parts.length !== 3 || parts[2].length !== 4) {
        errors.dob = "Please use DD/MM/YYYY format";
      } else {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        const currentYear = new Date().getFullYear();
        if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1920 || y > currentYear) {
          errors.dob = "Please enter a valid date of birth";
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 2 -> Step 3: Handle Form Submit (Send OTP)
  const handleFormContinue = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const cleanPhone = formData.phone.replace(/\D/g, "");

    try {
      // 1. Check if user already claimed
      const checkRes = await checkExhibitionCustomerApi(cleanPhone);
      if (checkRes.alreadyClaimed) {
        setAlreadyClaimed(true);
      }

      // 2. Send OTP and save initial lead details immediately
      const parts = (formData.fullName || "").trim().split(/\s+/);
      const finalFirst = formData.firstName || parts[0] || "";
      const finalLast = formData.lastName || parts.slice(1).join(" ") || "";

      await sendExhibitionOtpApi(cleanPhone, {
        fullName: formData.fullName.trim(),
        firstName: finalFirst,
        lastName: finalLast,
        email: formData.email.trim(),
        dob: formData.dob.trim(),
      });

      // Track Form Continue in dataLayer (promoClick)
      try {
        pushPromoClick({
          creative_name: "Event Exhibition Form Continue",
          location_id: typeof window !== "undefined" ? window.location.pathname : "/pages/event-exhibition",
          promo_id: "exhibition_lead_initiated",
          promo_name: `${finalFirst} ${finalLast}`.trim() || `+91${cleanPhone}`,
          promo_position: "step_2_form",
        });
      } catch (e) {
        console.warn("[GTM] promoClick error on form continue:", e);
      }

      setTimer(118);
      setOtpDigits(["", "", "", ""]);
      setStep(3);
    } catch (err) {
      toast.error(err.message || "Failed to send verification code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle individual OTP digit change
  const handleOtpDigitChange = (index, value) => {
    const val = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);

    // Auto-advance
    if (val && index < 3) {
      otpInputRefs[index + 1]?.current?.focus();
    }

    // Auto submit if all 4 filled
    if (val && index === 3 && newDigits.every((d) => d !== "")) {
      handleVerifyOtp(newDigits.join(""));
    }
  };

  // Handle Backspace in OTP boxes
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1]?.current?.focus();
    }
  };

  // Handle Paste in OTP boxes
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 4; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setOtpDigits(newDigits);

    if (pasted.length === 4) {
      otpInputRefs[3]?.current?.focus();
      handleVerifyOtp(pasted);
    } else {
      otpInputRefs[Math.min(3, pasted.length)]?.current?.focus();
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (timer > 0) return;
    try {
      const cleanPhone = formData.phone.replace(/\D/g, "");
      await sendExhibitionOtpApi(cleanPhone);
      setTimer(118);
      toast.info("A fresh OTP has been sent to your phone");
    } catch (err) {
      toast.error("Failed to resend code. Please try again.");
    }
  };

  // Step 3 -> Step 4: Verify OTP & Claim Reward
  const handleVerifyOtp = async (overrideOtp) => {
    const enteredOtp = overrideOtp || otpDigits.join("");
    if (enteredOtp.length < 4) {
      toast.error("Please enter the complete 4-digit OTP");
      return;
    }

    setIsSubmitting(true);
    const cleanPhone = formData.phone.replace(/\D/g, "");
    const parts = (formData.fullName || "").trim().split(/\s+/);
    const finalFirst = formData.firstName || parts[0] || "Customer";
    const finalLast = formData.lastName || parts.slice(1).join(" ") || "";

    try {
      // 1. Verify OTP
      await verifyExhibitionOtpApi(cleanPhone, enteredOtp);

      // 2. Claim Reward (or retrieve claimed state)
      const claimRes = await claimExhibitionRewardApi({
        fullName: (formData.fullName || "").trim(),
        firstName: finalFirst,
        lastName: finalLast,
        email: formData.email.trim(),
        mobile: cleanPhone,
        dob: formData.dob.trim(),
      });

      setClaimedRewardData(claimRes);
      if (claimRes.alreadyClaimed || claimRes.status === "ALREADY_CLAIMED") {
        setAlreadyClaimed(true);
      } else {
        setAlreadyClaimed(false);
      }

      // 1. Send dataLayer signup event (WebEngage listens to 'signup' with user.cuid)
      const canonicalPhone = `+91${cleanPhone}`;
      const fullName = `${finalFirst} ${finalLast}`.trim();
      const cleanEmail = formData.email.trim();
      const userId = claimRes.user?.id || `exhibition_${cleanPhone}`;

      try {
        pushSignup({
          id: userId,
          mobile: canonicalPhone,
          phone: canonicalPhone,
          email: cleanEmail,
          name: fullName,
          dob: formData.dob.trim(),
        });
      } catch (e) {
        console.warn("[GTM] pushSignup error:", e);
      }

      // 2. Send dataLayer promoClick event
      try {
        pushPromoClick({
          creative_name: "Event Exhibition Claim Reward",
          location_id: typeof window !== "undefined" ? window.location.pathname : "/pages/event-exhibition",
          promo_id: "exhibition_1000_coins",
          promo_name: fullName || canonicalPhone,
          promo_position: (claimRes.alreadyClaimed || claimRes.status === "ALREADY_CLAIMED") ? "already_claimed" : "new_claim",
        });
      } catch (e) {
        console.warn("[GTM] pushPromoClick error:", e);
      }

      // 3. Send explicit lead dataLayer event for WebEngage / CRM tracking
      try {
        pushToDataLayer({
          event: "lead",
          lead_type: "event_exhibition",
          user: {
            id: userId,
            cuid: canonicalPhone,
            mobile: canonicalPhone,
            phone: canonicalPhone,
            email: cleanEmail,
            name: fullName,
            dob: formData.dob.trim(),
          },
        });
      } catch (e) {
        console.warn("[GTM] lead event error:", e);
      }

      // If user session returned, log in to Redux
      if (claimRes.user && claimRes.accessToken) {
        dispatch(
          login({
            user: claimRes.user,
            accessToken: claimRes.accessToken,
          })
        );

        try {
          await dispatch(mergeCart({ userId })).unwrap();
        } catch (_) {}
        try {
          await dispatch(mergeGuestWishlist()).unwrap();
        } catch (_) {}
      }

      setStep(4);
    } catch (err) {
      toast.error(err.message || "Invalid OTP code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const termsList = [
    "Participation in the 1000 Lucira Points Event Exhibition Offer is exclusive to exhibition attendees.",
    "First Name, Last Name, Email, Phone Number, and Date of Birth (DOB) are mandatory for valid registration.",
    "1000 Lucira / Nector Coins are credited only once per unique customer, mobile number, or email.",
    "Returning customers or previously registered members who have already claimed will see their claimed status.",
    "Points can be redeemed against eligible diamond jewelry purchases on Lucira online or at our Experience Centres.",
    "Lucira reserves the right to verify customer identity and modify or withdraw this offer in the event of any discrepancies.",
  ];

  return (
    <div className="h-screen sm:h-auto sm:min-h-screen w-full relative flex flex-col items-center justify-between font-figtree selection:bg-[#543E3B] selection:text-white overflow-hidden sm:overflow-x-hidden sm:overflow-y-auto bg-[#FAF6F4]">
      {/* ─── FULL-BLEED BACKGROUND (Edge-to-edge across entire desktop & mobile, NO BLACK BARS) ─── */}
      {step !== 4 ? (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            loader={shopifyLoader}
            src={STORE_BG_URL}
            alt="Lucira Jewelry Experience Centre"
            fill
            sizes="100vw"
            priority
            className={`object-cover object-center transition-all duration-700 ${
              step >= 2 ? "scale-105 brightness-[0.38] blur-[1px]" : "scale-100 brightness-100"
            }`}
          />
          {/* Dimming overlay ONLY when drawer is open (step >= 2), ZERO overlay on Splash Screen */}
          {step >= 2 && (
            <div className="absolute inset-0 bg-black/55 transition-opacity duration-500" />
          )}
        </div>
      ) : (
        /* Step 4 Background: Clean, Ultra-Luxurious White / Champagne */
        <div className="absolute inset-0 z-0 bg-[#FCFBF9]">
          <div className="absolute inset-0 bg-radial-at-t from-[#F8F1EB] via-[#FCFBF9] to-[#FAF6F2] opacity-80" />
          <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#EFE6DC]/40 via-transparent to-transparent" />
        </div>
      )}

      {/* ─── DESKTOP & MOBILE CONTENT CONTAINER: ONE SCREEN, NO BLACK, PERFECT 500px WIDTH ─── */}
      <div className="relative w-full max-w-[500px] h-full sm:h-auto sm:min-h-full flex flex-col justify-between z-10 overflow-hidden sm:overflow-x-hidden sm:overflow-y-visible mx-auto">

      {/* ─── HEADER / LOGO (All Steps as in Figma) ─── */}
      <header className="w-full pt-8 pb-3 px-6 flex justify-center items-center z-20">
        <Link href="/" className="inline-block transition-transform hover:scale-105 duration-300">
          <Image
            src={step === 4 ? "/images/logo.svg" : WHITE_LOGO_URL}
            alt="Lucira Jewelry"
            width={130}
            height={42}
            priority
            unoptimized={step !== 4}
            className={`w-[120px] sm:w-[135px] h-auto ${step !== 4 ? "drop-shadow-sm" : ""}`}
          />
        </Link>
      </header>

      {/* ─── MAIN CONTENT CONTAINER: DRAWER ON MOBILE, CENTERED POPUP ON DESKTOP ─── */}
      <main className={`w-full flex-1 flex flex-col items-center ${step === 4 ? "justify-center" : "justify-end sm:justify-center"} p-0 sm:p-4 z-20 overflow-hidden sm:overflow-x-hidden sm:overflow-y-visible`}>
        <AnimatePresence mode="wait" initial={false}>

          {/* ══════════════════════════════════════════════════════════════════
              FRAME 1: SPLASH SCREEN (Store Photo with Exact Text)
             ══════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <motion.div
              key="splash-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center px-4 flex flex-col items-center cursor-pointer select-none mb-4 sm:mb-16"
              onClick={() => setStep(2)}
              title="Click or wait to register"
            >
              <h1
                className="text-[#1A1A1A] font-abhaya font-bold tracking-wide"
                style={{
                  fontFamily: "Abhaya Libre, serif",
                  fontWeight: 700,
                  fontSize: "24px",
                  lineHeight: 1.3,
                  letterSpacing: "0%",
                  textAlign: "center",
                  verticalAlign: "middle",
                  maxWidth: "300px",
                  marginBottom: "12px",
                }}
              >
                Register Now &amp; Get 1000 Lucira Points
              </h1>
              <p className="text-[#333333] text-xs sm:text-[13px] font-figtree mt-0.5">
                Join the Lucira Family Today
              </p>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              FRAME 2: FORM (Default screen, no animation on load)
             ══════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <motion.div
              key="form-drawer"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0 }}
              className="w-full sm:max-w-[460px] flex flex-col items-center sm:my-auto"
            >
              {/* Dimmed Text above Drawer / Popup */}
              <div
                className="text-center px-4 flex flex-col items-center mb-[30px] sm:mb-4 mt-2 sm:mt-0"
              >
                <p
                  className="text-white font-abhaya font-bold tracking-wide drop-shadow-sm"
                  style={{
                    fontFamily: "Abhaya Libre, serif",
                    fontWeight: 700,
                    fontSize: "24px",
                    lineHeight: 1.3,
                    letterSpacing: "0%",
                    textAlign: "center",
                    verticalAlign: "middle",
                    maxWidth: "300px",
                    marginBottom: "8px",
                  }}
                >
                  Register Now &amp; Get 1000 Lucira Points
                </p>
                <p className="text-white/80 text-xs sm:text-[13px] font-figtree">
                  Join the Lucira Family Today
                </p>
              </div>

              {/* White Sheet: Drawer on Mobile, Centered Modal Popup on Desktop */}
              <div className="w-full bg-white rounded-t-[32px] sm:rounded-[24px] px-6 pt-6 pb-7 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] sm:shadow-[0_25px_80px_rgba(0,0,0,0.55)] border border-white/20 sm:border-zinc-200/80">
                
                {/* Form Header */}
                <div className="mb-5">
                  <h2 className="text-[21px] sm:text-[23px] font-figtree font-bold text-zinc-900 leading-tight">
                    Create Your Account
                  </h2>
                  <p className="text-[13px] text-zinc-500 font-figtree mt-1">
                    It would take a moment
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleFormContinue} className="space-y-3.5">
                  
                  {/* Full Name * */}
                  <div className="space-y-1">
                    <label className="text-[13px] font-semibold text-[#1A1A1A] flex items-center gap-1.5 font-figtree">
                      <User size={15} className="text-[#333333]" />
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your Full Name"
                      value={formData.fullName}
                      onChange={handleFullNameChange}
                      className={`w-full h-[48px] px-4 bg-[#FAF9F8] border rounded-[8px] text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none transition-all ${
                        formErrors.fullName ? "border-red-400 ring-1 ring-red-400" : "border-[#E5E5E5] focus:border-[#543E3B]"
                      }`}
                    />
                    {formErrors.fullName && (
                      <p className="text-[11px] text-red-500 font-medium">{formErrors.fullName}</p>
                    )}
                  </div>

                  {/* Mobile Number * */}
                  <div className="space-y-1">
                    <label className="text-[13px] font-semibold text-[#1A1A1A] flex items-center gap-1.5 font-figtree">
                      <Phone size={15} className="text-[#333333]" />
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-[14px] font-semibold text-zinc-700 border-r border-zinc-200 pr-2.5">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="Enter Mobile Number"
                        value={formData.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setFormData({ ...formData, phone: val });
                          if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                        }}
                        className={`w-full h-[48px] pl-16 pr-4 bg-[#FAF9F8] border rounded-[8px] text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none transition-all ${
                          formErrors.phone ? "border-red-400 ring-1 ring-red-400" : "border-[#E5E5E5] focus:border-[#543E3B]"
                        }`}
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="text-[11px] text-red-500 font-medium">{formErrors.phone}</p>
                    )}
                  </div>

                  {/* Email * */}
                  <div className="space-y-1">
                    <label className="text-[13px] font-semibold text-[#1A1A1A] flex items-center gap-1.5 font-figtree">
                      <Mail size={15} className="text-[#333333]" />
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Enter your Email ID"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (formErrors.email) setFormErrors({ ...formErrors, email: null });
                      }}
                      className={`w-full h-[48px] px-4 bg-[#FAF9F8] border rounded-[8px] text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none transition-all ${
                        formErrors.email ? "border-red-400 ring-1 ring-red-400" : "border-[#E5E5E5] focus:border-[#543E3B]"
                      }`}
                    />
                    {formErrors.email && (
                      <p className="text-[11px] text-red-500 font-medium">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Date of Birth * */}
                  <div className="space-y-1">
                    <label className="text-[13px] font-semibold text-[#1A1A1A] flex items-center gap-1.5 font-figtree">
                      <Calendar size={15} className="text-[#333333]" />
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        value={formData.dob}
                        onChange={handleDobChange}
                        maxLength={10}
                        className={`w-full h-[48px] px-4 pr-11 bg-[#FAF9F8] border rounded-[8px] text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none transition-all ${
                          formErrors.dob ? "border-red-400 ring-1 ring-red-400" : "border-[#E5E5E5] focus:border-[#543E3B]"
                        }`}
                      />
                      <label className="absolute right-3.5 cursor-pointer text-zinc-500 hover:text-zinc-800">
                        <Calendar size={18} />
                        <input
                          type="date"
                          max={new Date().toISOString().split("T")[0]}
                          className="absolute inset-0 opacity-0 cursor-pointer pointer-events-auto"
                          onChange={(e) => {
                            if (e.target.value) {
                              const [y, m, d] = e.target.value.split("-");
                              setFormData({ ...formData, dob: `${d}/${m}/${y}` });
                              if (formErrors.dob) setFormErrors({ ...formErrors, dob: null });
                            }
                          }}
                        />
                      </label>
                    </div>
                    {formErrors.dob && (
                      <p className="text-[11px] text-red-500 font-medium">{formErrors.dob}</p>
                    )}
                  </div>

                  {/* CONTINUE Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-[48px] sm:h-[50px] rounded-[8px] bg-[#543E3B] hover:bg-[#43302E] text-white font-figtree font-bold uppercase tracking-wider text-[14px] flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>SENDING OTP...</span>
                        </>
                      ) : (
                        <span>CONTINUE</span>
                      )}
                    </button>
                  </div>

                  {/* Disclaimer */}
                  <p className="text-center text-[11px] text-[#666666] font-figtree pt-1 leading-relaxed">
                    By proceeding you accept Lucira's{" "}
                    <button
                      type="button"
                      onClick={() => setIsTermsOpen(true)}
                      className="text-[#1A1A1A] font-semibold underline underline-offset-2 hover:text-[#543E3B] cursor-pointer"
                    >
                      Terms &amp; Conditions
                    </button>{" "}
                    &amp;{" "}
                    <Link
                      href="/pages/privacy-policy"
                      target="_blank"
                      className="text-[#1A1A1A] font-semibold underline underline-offset-2 hover:text-[#543E3B]"
                    >
                      Privacy Policy
                    </Link>
                  </p>
                </form>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              FRAME 3: OTP VERIFICATION (Exact as Figma Frame 3, 0 Edge Padding)
             ══════════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <motion.div
              key="otp-verification"
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col items-center"
            >
              {/* Dimmed Text above Drawer */}
              <div
                className="text-center mb-[30px] mt-2 sm:mb-[15%] sm:mt-[30px] px-4 flex flex-col items-center"
              >
                <p
                  className="text-white text-[15px] sm:text-[17px] font-abhaya font-bold tracking-wide drop-shadow-sm"
                  style={{
                    fontFamily: "Abhaya Libre, serif",
                    fontWeight: 700,
                    fontSize: "24px",
                    lineHeight: 1.3,
                    letterSpacing: "0%",
                    textAlign: "center",
                    verticalAlign: "middle",
                    maxWidth: "300px",
                    marginBottom: "12px",
                  }}
                >
                  Register Now &amp; Get 1000 Lucira Points
                </p>
                <p className="text-white/80 text-xs sm:text-[13px] font-figtree mt-0.5">
                  Join the Lucira Family Today
                </p>
              </div>

              {/* White Bottom Sheet Container */}
              <div className="w-full bg-white rounded-t-[32px] sm:rounded-[24px] px-6 pt-7 pb-8 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] border border-white/20">
                
                {/* Phone Header with Edit Pencil Icon */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[18px] font-bold text-zinc-900 font-figtree">
                      +91 {formData.phone}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="p-1 hover:bg-zinc-100 rounded-full text-zinc-600 transition-colors cursor-pointer"
                      title="Edit phone number"
                    >
                      <Pencil size={15} />
                    </button>
                  </div>
                </div>

                <p className="text-[13px] text-zinc-500 font-figtree mb-6">
                  Enter OTP sent to given Number
                </p>

                {/* 4 Digit OTP Boxes */}
                <div
                  className="flex justify-between gap-[10px] mb-6"
                  style={{ gap: "10px" }}
                  onPaste={handleOtpPaste}
                >
                  {[0, 1, 2, 3].map((idx) => (
                    <input
                      key={idx}
                      ref={otpInputRefs[idx]}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={otpDigits[idx]}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-full h-14 text-center text-xl font-bold font-figtree bg-[#FAF9F8] border border-[#E5E5E5] rounded-[8px] focus:bg-white focus:border-[#543E3B] focus:ring-1 focus:ring-[#543E3B] focus:outline-none transition-all"
                      style={{ width: "100%" }}
                    />
                  ))}
                </div>

                {/* Resend Countdown */}
                <div className="text-center mb-6">
                  {timer > 0 ? (
                    <p className="text-xs text-zinc-500 font-figtree">
                      Resend OTP in{" "}
                      <span className="font-semibold text-zinc-800">
                        {formatTimer(timer)}
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-xs font-semibold text-[#543E3B] hover:text-[#43302E] underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                {/* VERIFY Button */}
                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={isSubmitting || otpDigits.some((d) => !d)}
                  className="w-full h-[48px] sm:h-[50px] rounded-[8px] bg-[#543E3B] hover:bg-[#43302E] text-white font-figtree font-bold uppercase tracking-wider text-[14px] flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>VERIFYING...</span>
                    </>
                  ) : (
                    <span>VERIFY</span>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              FRAME 4: SUCCESS PAGE (Clean White with Big 3D Gold Coin)
             ══════════════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <motion.div
              key="success-page"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md flex flex-col items-center text-center my-auto py-8 px-6"
            >
              {/* 3D Gold Coin */}
              <div className="relative mb-8 flex items-center justify-center">
                <div className="absolute w-56 h-56 rounded-full bg-gradient-to-tr from-[#F8D778]/40 via-[#F3C54E]/20 to-transparent blur-3xl animate-pulse -z-10" />
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                  className="relative w-40 h-40 sm:w-48 sm:h-48 drop-shadow-[0_20px_35px_rgba(212,175,55,0.45)]"
                >
                  <Image
                    loader={shopifyLoader}
                    src={GOLD_COIN_URL}
                    alt="1000 Lucira Points Gold Coin"
                    fill
                    priority
                    className="object-contain"
                  />
                </motion.div>
              </div>

              {/* Headline & Subtext */}
              <div className="space-y-2.5 mb-8">
                {alreadyClaimed ? (
                  <>
                    <h2 className="text-[26px] sm:text-[30px] font-abhaya font-extrabold text-zinc-900 leading-tight">
                      Already Claimed!
                    </h2>
                    <p className="text-[14px] sm:text-[15px] text-zinc-600 font-figtree max-w-xs mx-auto leading-relaxed">
                      You have already claimed your 1000 Lucira Points.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-[26px] sm:text-[30px] font-abhaya font-extrabold text-zinc-900 leading-tight">
                      Registration Successful!
                    </h2>
                    <p className="text-[14px] sm:text-[15px] text-zinc-600 font-figtree max-w-xs mx-auto leading-relaxed">
                      Your 1000 Lucira Points have been credited.
                    </p>
                  </>
                )}
              </div>

              {/* EXPLORE OUR JEWELRY Button */}
              <Link
                href="/collections/all"
                className="w-full h-[50px] rounded-[8px] bg-[#543E3B] hover:bg-[#43302E] text-white font-figtree font-bold uppercase tracking-wider text-[14px] flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
              >
                <span>EXPLORE OUR JEWELRY</span>
              </Link>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ─── TERMS & CONDITIONS DRAWER ─── */}
      <Drawer open={isTermsOpen} onOpenChange={setIsTermsOpen}>
        <DrawerContent className="bg-white px-5 sm:px-8 pb-10 pt-2">
          <div className="flex justify-between items-center mb-5 border-b border-zinc-100 pb-3">
            <DrawerHeader className="p-0 text-left">
              <DrawerTitle className="font-abhaya font-bold text-[20px] text-zinc-900">
                Terms &amp; Conditions
              </DrawerTitle>
            </DrawerHeader>
            <DrawerClose className="p-2 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
              <X size={18} className="text-zinc-600" />
            </DrawerClose>
          </div>

          <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2 text-zinc-700 text-xs sm:text-sm font-figtree leading-relaxed">
            {termsList.map((term, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#543E3B] shrink-0 mt-1.5" />
                <span>{term}</span>
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Suppress third-party widgets */}
      <style dangerouslySetInnerHTML={{ __html: `
        #zsiq_chat_wrap,
        #zsiq_float_container,
        #zsiq_chat_wrap_parent,
        .zsiq_theme1,
        iframe[name="zsiqchat"] {
          display: none !important;
        }
      `}} />

      </div>
    </div>
  );
}
