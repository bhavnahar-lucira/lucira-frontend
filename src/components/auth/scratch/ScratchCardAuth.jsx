"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { AnimatePresence, motion, useAnimation, useReducedMotion } from "framer-motion";
import { sendOtpApi, verifyOtpApi, registerCustomer, rewardLookupApi, trackScratchCardView } from "@/lib/api";
import { getSessionId } from "@/redux/features/cart/cartSlice";
import { cleanPhoneInput } from "@/lib/phone";
import { useCompleteLogin } from "@/hooks/useCompleteLogin";
import { trackSignupSuccess, VARIANT_SCRATCH } from "@/lib/signupExperiment";
import { RewardTicket } from "./RewardTicket";
import { ScratchSurface } from "./ScratchSurface";

const COVER_SRC = "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Frame_1437258093.jpg?v=1790752132";
const OTP_RESEND_SECONDS = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMPTY_OTP = ["", "", "", ""];

// Only used if the backend has not been redeployed with the scratch-card
// reward yet — same odds as the wheel so the flow never dead-ends.
const FALLBACK_PRIZES = [
  { value: "1500_off", label: "₹1,500 OFF", amount: 1500, code: "GRAND1500" },
  { value: "1000_off", label: "₹1,000 OFF", amount: 1000, code: "GRAND1000" },
  { value: "750_off", label: "₹750 OFF", amount: 750, code: "GRAND750" },
];

// A/B success metric: one promoClick per successful popup login/sign-up.
const trackSuccess = (isNewUser, rewardValue) => trackSignupSuccess({ variant: VARIANT_SCRATCH, isNewUser, rewardValue });

function splitFullName(value) {
  const parts = String(value ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || "", lastName: "" };
  const lastName = parts.pop();
  return { firstName: parts.join(" "), lastName };
}

// A fresh or "reactivated" reward shows the full 7 days; one still inside its
// window shows what is left of it.
function withDaysLeft(r) {
  if (!r) return r;
  if (r.fresh || r.status === "expired" || !r.expiresAt) return { ...r, daysLeft: 7 };
  const days = Math.max(1, Math.ceil((new Date(r.expiresAt).getTime() - Date.now()) / 86400000));
  return { ...r, daysLeft: days };
}

function friendlyError(message = "") {
  const m = message.toLowerCase();
  if (m.includes("email") && (m.includes("taken") || m.includes("exists"))) {
    return "This email is already linked to another number. Please use a different email.";
  }
  return message || "Something went wrong. Please try again.";
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}

// Keeps the overlay inside the visible area when the mobile keyboard opens.
function useVisualViewportBox() {
  const [box, setBox] = useState(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setBox({ height: vv.height, top: vv.offsetTop });
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return box;
}

// Tallest viewport seen (keyboard closed). The card is laid out against this so
// it never shrinks or moves when the keyboard opens or the sheet hides.
function useBaselineHeight() {
  const [h, setH] = useState(() => (typeof window === "undefined" ? 700 : window.innerHeight));
  useEffect(() => {
    const vv = window.visualViewport;
    const update = () => setH((prev) => Math.max(prev, vv?.height || 0, window.innerHeight));
    update();
    vv?.addEventListener("resize", update);
    window.addEventListener("resize", update);
    return () => {
      vv?.removeEventListener("resize", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return h;
}

// Seeded PRNG so the confetti layout is pure (same burst every render).
function seeded(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Confetti() {
  const pieces = useMemo(() => {
    const rand = seeded(1437);
    const colors = ["#5a413f", "#e6b85c", "#f3d9b1", "#b77766", "#ffffff", "#d4a373"];
    return Array.from({ length: 44 }, (_, i) => {
      const angle = rand() * Math.PI * 2;
      const dist = 90 + rand() * 130;
      return {
        id: i,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 50,
        w: 5 + rand() * 5,
        h: 8 + rand() * 7,
        rotate: rand() * 720 - 360,
        color: colors[i % colors.length],
        delay: rand() * 0.12,
      };
    });
  }, []);
  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute left-1/2 top-1/2 rounded-[2px]"
          style={{ width: p.w, height: p.h, background: p.color, marginLeft: -p.w / 2, marginTop: -p.h / 2 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.5 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 140], opacity: [1, 1, 0], rotate: p.rotate, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: p.delay }}
        />
      ))}
    </div>
  );
}

function OtpBoxes({ otp, setOtp, onComplete, firstRef }) {
  const refs = [firstRef, useRef(null), useRef(null), useRef(null)];

  const handleChange = (i, raw) => {
    const value = raw.replace(/\D/g, "");
    // Paste / SMS autofill of the whole code
    if (value.length >= 4) {
      const next = value.slice(0, 4).split("");
      setOtp(next);
      refs[3].current?.blur();
      onComplete(next.join(""));
      return;
    }
    const next = [...otp];
    next[i] = value.slice(-1);
    setOtp(next);
    if (value && i < 3) refs[i + 1].current?.focus();
    if (next.every((d) => d !== "")) onComplete(next.join(""));
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      {otp.map((digit, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="tel"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={i === 0 ? 4 : 1}
          placeholder="-"
          aria-label={`OTP digit ${i + 1}`}
          className="h-[46px] w-full text-center text-[18px] font-semibold border border-[#E2E2E2] bg-[#FAFAFA] rounded-[4px] outline-none focus:border-[#5a413f] placeholder:text-[#9a9a9a]"
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !otp[i] && i > 0) refs[i - 1].current?.focus();
          }}
        />
      ))}
    </div>
  );
}

const PrimaryButton = ({ children, ...props }) => (
  <button
    type="button"
    className="w-full h-[46px] rounded-[4px] bg-[#5a413f] text-white text-[16px] tracking-[0.3px] uppercase border-none cursor-pointer disabled:opacity-60 active:scale-[0.99] transition-transform"
    {...props}
  >
    {children}
  </button>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="m8 12.5 2.5 2.5L16 9.5" />
  </svg>
);

/**
 * Mobile scratch-card signup popup (A/B variant of the spin wheel).
 *
 *   phone ─► otp ─┬─ new user:      name + email + OTP → account → verified → scratch → won
 *                 ├─ existing, prize: ticket "already won" → OTP → won (reveal / "reactivate")
 *                 └─ existing, none:  OTP → verified → scratch a fresh card → won
 *
 * "Reactivate" is display-only: GRAND codes are shared, so the backend just
 * reports the reward as expired when the account is older than 7 days.
 */
export function ScratchCardAuth({ onClose, onSuccess }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const completeLogin = useCompleteLogin();
  const vvBox = useVisualViewportBox();
  const baseHeight = useBaselineHeight();
  const shake = useAnimation();

  const [step, setStep] = useState("phone"); // phone | otp | verified | won
  const [userType, setUserType] = useState(null); // new | existing
  const [lookupReward, setLookupReward] = useState(null);
  const [reward, setReward] = useState(null);
  const [mobile, setMobile] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(EMPTY_OTP);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [scratching, setScratching] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [showTapReveal, setShowTapReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  // Only ever rendered client-side (AuthDialog mounts it after the popup opens).
  const [cardSize] = useState(() =>
    typeof window === "undefined" ? 255 : Math.round(Math.min(window.innerWidth * 0.68, 290))
  );

  const phoneRef = useRef(null);
  const nameRef = useRef(null);
  const otpFirstRef = useRef(null);

  // How long the card was on screen: sent once, on close/unmount or tab hide.
  useEffect(() => {
    const start = Date.now();
    let sent = false;
    const flush = () => {
      if (sent) return;
      sent = true;
      trackScratchCardView(getSessionId(), Math.round((Date.now() - start) / 1000));
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  useEffect(() => {
    if (step !== "otp") return;
    const t = setTimeout(() => {
      if (userType === "new" && !fullName) nameRef.current?.focus();
      else otpFirstRef.current?.focus();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, userType]);

  // Fallback for people who don't scratch: offer a plain tap-to-reveal.
  useEffect(() => {
    if (!scratching || revealed) return;
    const t = setTimeout(() => setShowTapReveal(true), 6000);
    return () => clearTimeout(t);
  }, [scratching, revealed]);

  const hasStoredPrize = userType === "existing" && !!lookupReward && !reward?.fresh;
  const scratchEnabled = step === "verified" && !!reward;
  const cardLocked = step === "phone" || step === "otp";

  const nudgeCard = () => {
    if (!reduce) shake.start({ x: [0, -9, 9, -6, 6, -2, 0], transition: { duration: 0.45 } });
    if (step === "phone") phoneRef.current?.focus();
    else if (step === "otp") (userType === "new" && !fullName ? nameRef : otpFirstRef).current?.focus();
  };

  const handleContinue = async () => {
    if (mobile.length !== 10) return toast.error("Please enter a valid 10-digit mobile number");
    if (!/^[6-9]/.test(mobile)) return toast.error("Please enter a valid Indian mobile number");
    setLoading(true);
    try {
      const [lookup] = await Promise.all([
        rewardLookupApi(mobile).catch(() => null),
        sendOtpApi(mobile),
      ]);
      const type = lookup?.exists ? "existing" : "new";
      setUserType(type);
      setLookupReward(lookup?.reward || null);
      setOtp(EMPTY_OTP);
      setMobileVerified(false);
      setTimer(OTP_RESEND_SECONDS);
      setStep("otp");
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await sendOtpApi(mobile);
      setOtp(EMPTY_OTP);
      setTimer(OTP_RESEND_SECONDS);
      toast.success("OTP sent");
    } catch (err) {
      toast.error(err.message || "Failed to resend OTP");
    }
  };

  const editNumber = () => {
    setStep("phone");
    setUserType(null);
    setLookupReward(null);
    setOtp(EMPTY_OTP);
    setMobileVerified(false);
    setTimeout(() => phoneRef.current?.focus(), 300);
  };

  const finishExisting = async (data) => {
    const r = withDaysLeft(data.reward || null);
    setReward(r);
    setLoggedIn(true);
    trackSuccess(false, r?.value);
    if (r?.fresh) {
      setStep("verified");
    } else {
      setRevealed(true);
      setStep("won");
    }
    await completeLogin(data, { isSignup: false, mobile });
  };

  const handleVerify = async (override) => {
    if (loading) return;
    const code = typeof override === "string" ? override : otp.join("");
    const { firstName, lastName } = splitFullName(fullName);
    const isNew = userType === "new";

    // Validate the form before spending the OTP.
    if (isNew && !firstName) {
      nameRef.current?.focus();
      return toast.error("Please enter your full name");
    }
    if (isNew && !EMAIL_RE.test(email.trim())) {
      return toast.error("Please enter a valid email address");
    }
    if (!mobileVerified && code.length !== 4) return toast.error("Enter the 4-digit OTP");

    setLoading(true);
    try {
      const sessionId = getSessionId();
      if (!mobileVerified) {
        const data = await verifyOtpApi(mobile, code, sessionId, { rewardSource: "scratch_card" });
        if (data?.status === "LOGIN" || data?.type === "success") {
          await finishExisting(data);
          return;
        }
        if (!(data?.status === "REGISTER_REQUIRED" || data?.status === "REGISTER" || data?.type === "register")) {
          throw new Error("Verification failed. Please try again.");
        }
        setMobileVerified(true);
        if (!isNew) {
          // Lookup failed earlier and this is actually a new customer.
          setUserType("new");
          setLoading(false);
          toast.info("Please add your name and email to create your account");
          return;
        }
      }

      const regData = await registerCustomer({
        firstName,
        lastName,
        email: email.trim(),
        mobile,
        sessionId,
        rewardSource: "scratch_card",
        tags: "signup_scratch_card, signup_popup_mobile",
      });
      if (!(regData?.status === "REGISTER_SUCCESS" || regData?.status === "SUCCESS" || regData?.type === "success")) {
        throw new Error("Could not create your account. Please try again.");
      }
      const r = withDaysLeft(
        regData.reward || { ...FALLBACK_PRIZES[Math.floor(Math.random() * FALLBACK_PRIZES.length)], status: "active", fresh: true }
      );
      setReward(r);
      setLoggedIn(true);
      setStep("verified");
      trackSuccess(true, r.value);
      await completeLogin(regData, { isSignup: true, mobile, email: email.trim(), name: fullName.trim() });
    } catch (err) {
      toast.error(friendlyError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpComplete = (code) => {
    // New users still need name + email; only auto-submit when those are in.
    if (userType === "new" && (!fullName.trim() || !EMAIL_RE.test(email.trim()))) return;
    setTimeout(() => handleVerify(code), 60);
  };

  // The button reveals the card directly (same as "tap to reveal"); scratching
  // the card by hand still works too.
  const startScratchMode = () => {
    setScratching(true);
    handleScratchComplete();
  };

  const handleScratchStart = () => {
    setScratching(true);
  };

  const handleScratchComplete = () => {
    if (revealed) return;
    setRevealed(true);
    setShowTapReveal(false);
    setTimeout(() => {
      setScratching(false);
      setStep("won");
    }, reduce ? 0 : 1200);
  };

  const handleCopy = async () => {
    if (!reward?.code) return;
    await copyText(reward.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (loggedIn) router.refresh();
    onClose?.();
  };

  const handleContinueShopping = () => {
    handleClose();
  };

  const days = reward?.daysLeft ?? 7;
  const validityText = `Coupon Valid For Next ${days} Day${days > 1 ? "s" : ""} at Checkout`;

  if (typeof document === "undefined") return null;

  const ticketMode = step === "won" ? "won" : lookupReward?.status === "expired" ? "reactivate" : "reveal";
  const ticketAmount = reward?.amount ?? lookupReward?.amount ?? 0;

  const card = (
    <motion.div
      className="relative"
      style={{ width: cardSize, height: cardSize }}
      initial={reduce ? false : { opacity: 0, scale: 0.8, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
    >
      <motion.div
        className="absolute inset-0"
        animate={!reduce && cardLocked ? { y: [0, -6, 0] } : { y: 0 }}
        transition={cardLocked ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
      >
        <motion.div animate={shake} className="absolute inset-0 rounded-[12px] shadow-[0_18px_40px_rgba(0,0,0,0.45)]" style={{ perspective: 900 }}>
          {hasStoredPrize ? (
            <motion.div
              key="stored-ticket"
              className="absolute inset-0"
              initial={reduce ? false : { rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 160, damping: 18 }}
            >
              <RewardTicket
                amount={ticketAmount}
                mode={ticketMode}
                countUp={step === "won"}
                stamp={step === "won" && reward?.status === "expired" ? "REACTIVATED" : ""}
              />
            </motion.div>
          ) : (
            <>
              {reward && (
                <motion.div
                  className="absolute inset-0"
                  animate={revealed && !reduce ? { scale: [1, 1.07, 1] } : { scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.25 }}
                >
                  <RewardTicket amount={reward.amount} mode="won" countUp={revealed} />
                </motion.div>
              )}
              <ScratchSurface
                coverSrc={COVER_SRC}
                enabled={scratchEnabled}
                revealed={revealed}
                onStart={handleScratchStart}
                onComplete={handleScratchComplete}
              />
            </>
          )}

          {/* Locked: tapping the card nudges toward the phone / OTP field */}
          {cardLocked && !hasStoredPrize && (
            <button
              type="button"
              aria-label="Verify your number to scratch the card"
              className="absolute inset-0 rounded-[12px] bg-transparent border-none cursor-pointer flex items-end justify-center pb-3"
              onClick={nudgeCard}
            >
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-sm text-white text-[11px] tracking-[0.4px]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="4" y="11" width="16" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                Verify to scratch
              </span>
            </button>
          )}
        </motion.div>
      </motion.div>

      {revealed && !reduce && <Confetti />}

      <button
        type="button"
        onClick={handleClose}
        aria-label="Close"
        className="absolute -top-[14px] -right-[14px] w-[26px] h-[26px] rounded-full bg-[#E9E9E9] border-none flex items-center justify-center cursor-pointer z-30"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );

  const panelMotion = {
    initial: reduce ? false : { opacity: 0, x: 28 },
    animate: { opacity: 1, x: 0 },
    exit: reduce ? { opacity: 0 } : { opacity: 0, x: -28 },
    transition: { duration: 0.22 },
  };

  const otpHeader = (
    <>
      <div className="flex items-center gap-1.5">
        <p className="m-0 text-[16px] font-semibold text-black">OTP Sent to +91 {mobile}</p>
        <button type="button" onClick={editNumber} aria-label="Edit mobile number" className="p-1 bg-transparent border-none cursor-pointer text-black">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </button>
      </div>
      <p className="m-0 mt-0.5 mb-4 text-[12px] text-black">
        {userType === "existing" ? "Welcome back to Lucira Jewelry" : "Welcome to Lucira Jewelry"}
      </p>
    </>
  );

  const resendRow = (
    <p className="text-center text-[11px] text-[#333] my-3">
      {timer > 0 ? (
        <>Resend OTP in <b>00:{String(timer).padStart(2, "0")}</b></>
      ) : (
        <button type="button" onClick={handleResend} className="bg-transparent border-none underline font-semibold text-[#5a413f] cursor-pointer text-[12px]">
          Resend OTP
        </button>
      )}
    </p>
  );

  const inputClass =
    "w-full h-[46px] px-3 text-[14px] border border-[#E2E2E2] bg-[#FAFAFA] rounded-[4px] outline-none focus:border-[#5a413f] placeholder:text-[#8a8a8a]";

  let panel = null;
  if (step === "phone") {
    panel = (
      <motion.div key="phone" {...panelMotion}>
        <p className="m-0 text-[16px] font-semibold text-black">Scratch &amp; Win Assured Rewards</p>
        <p className="m-0 mt-0.5 mb-4 text-[12px] text-black">Verify your number to unlock your Lucira scratch card</p>
        <div className="flex items-center h-[46px] px-3 border border-[#E2E2E2] bg-[#FAFAFA] rounded-[4px] focus-within:border-[#5a413f]">
          <span className="text-[14px] pr-2.5 mr-2.5 border-r border-[#bdbdbd]">+91</span>
          <input
            ref={phoneRef}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            placeholder="Enter Mobile Number"
            className="flex-1 h-full bg-transparent border-none outline-none text-[14px] placeholder:text-[#8a8a8a]"
            value={mobile}
            onChange={(e) => setMobile(cleanPhoneInput(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && handleContinue()}
          />
        </div>
        <p className="text-center text-[10px] text-black my-3">
          By proceeding you accept Lucira&apos;s{" "}
          <a href="/pages/terms-condition" target="_blank" className="underline text-black">Terms &amp; Conditions</a> &amp;{" "}
          <a href="/pages/privacy-policy" target="_blank" className="underline text-black">Privacy Policy</a>
        </p>
        <PrimaryButton onClick={handleContinue} disabled={loading}>
          {loading ? "Sending OTP..." : "Continue"}
        </PrimaryButton>
      </motion.div>
    );
  } else if (step === "otp") {
    panel = (
      <motion.div key={`otp-${userType}`} {...panelMotion}>
        {otpHeader}
        {userType === "new" && (
          <div className="space-y-3 mb-3">
            <input
              ref={nameRef}
              type="text"
              autoComplete="name"
              placeholder="Enter Your Full Name"
              className={inputClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="Enter Your Mail Id"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}
        {!mobileVerified && <OtpBoxes otp={otp} setOtp={setOtp} onComplete={handleOtpComplete} firstRef={otpFirstRef} />}
        {mobileVerified ? <div className="h-3" /> : resendRow}
        <PrimaryButton onClick={() => handleVerify()} disabled={loading}>
          {loading
            ? "Verifying..."
            : userType === "new"
              ? mobileVerified ? "Create Account" : "Verify"
              : hasStoredPrize
                ? lookupReward.status === "expired" ? "Reactivate My Code" : "Reveal My Code"
                : "Verify"}
        </PrimaryButton>
      </motion.div>
    );
  } else if (step === "verified") {
    panel = (
      <motion.div key="verified" {...panelMotion}>
        <div className="flex items-center gap-2">
          <CheckIcon />
          <p className="m-0 text-[16px] font-semibold text-black">Verified Successfully</p>
        </div>
        <p className="m-0 mt-1 mb-4 text-[12px] text-black">
          {userType === "existing" ? "Welcome back! Your scratch card is ready" : "Your Account has been created Successfully"}
        </p>
        <PrimaryButton onClick={startScratchMode}>Scratch The Card</PrimaryButton>
      </motion.div>
    );
  } else if (step === "won") {
    panel = (
      <motion.div key="won" {...panelMotion}>
        {reward ? (
          <>
            <div className="flex items-center gap-2">
              <CheckIcon />
              <p className="m-0 text-[16px] font-semibold text-black">You Won ₹{reward.amount} OFF</p>
            </div>
            <p className="m-0 mt-1 mb-4 text-[12px] text-black">{validityText}</p>
            <motion.div
              initial={reduce ? false : { scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
              className="flex items-center justify-between h-[48px] px-3 rounded-[4px] border-[1.5px] border-dashed border-[#22c55e] bg-[#EFFCF1]"
            >
              <span className="text-[15px] font-bold tracking-[1px] text-[#16a34a]">{reward.code}</span>
              <button type="button" onClick={handleCopy} aria-label={copied ? "Copied" : "Copy coupon code"} className="p-1 bg-transparent border-none cursor-pointer text-[#16a34a]">
                {copied ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </motion.div>
            <p className="text-center text-[10px] text-black my-3">
              {copied ? "Code copied! " : ""}Your Reward is Ready to use at Checkout. *T&amp;C Applicable
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <CheckIcon />
              <p className="m-0 text-[16px] font-semibold text-black">Welcome back to Lucira Jewelry</p>
            </div>
          </>
        )}
        <PrimaryButton onClick={handleContinueShopping}>Continue Shopping</PrimaryButton>
      </motion.div>
    );
  }

  return createPortal(
    <motion.div
      className="fixed left-0 right-0 z-[2000] flex flex-col"
      style={{ top: vvBox?.top ?? 0, height: vvBox ? vvBox.height : "100dvh" }}
      role="dialog"
      aria-modal="true"
      aria-label="Scratch card rewards"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-[#1f1f1f]/[0.92]" aria-hidden="true" />

      {/* Sized from the keyboard-closed height so the card stays put */}
      <div
        className="absolute left-0 right-0 top-0 flex flex-col items-center justify-center"
        style={{ height: Math.max(cardSize + 60, baseHeight - 300) }}
      >
        {card}
        <AnimatePresence>
          {showTapReveal && !revealed && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={handleScratchComplete}
              className="absolute bottom-6 bg-transparent border-none text-white/85 underline text-[13px] cursor-pointer"
            >
              Tap to reveal instead
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        className="relative mt-auto bg-white rounded-t-[20px] px-4 pt-5 pb-[max(16px,env(safe-area-inset-bottom))] overflow-hidden"
        initial={reduce ? false : { y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {panel}
        </AnimatePresence>
      </motion.div>
    </motion.div>,
    document.body
  );
}
