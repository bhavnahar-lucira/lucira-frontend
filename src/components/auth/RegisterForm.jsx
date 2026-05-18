"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { motion, useAnimation } from "framer-motion";
import {
  registerCustomer,
} from "@/lib/api";
import { login, setAvatar } from "@/redux/features/user/userSlice";
import { pushSignup } from "@/lib/gtm";
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
  const [step, setStep] = useState("register"); // register, success
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const [isMobilePreFilled] = useState(!!initialMobile);

  useEffect(() => {
    if (initialMobile) {
      setMobile(initialMobile);
    }
  }, [initialMobile]);

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

    // Track Signup in GTM
    pushSignup({
      id: userId,
      mobile: mobile,
      email: email,
      name: `${firstName} ${lastName}`.trim()
    });
    
    dispatch(
      login({
        id: userId,
        mobile,
        email: user?.email || email,
        first_name: user?.first_name || firstName,
        last_name: user?.last_name || lastName,
        name:
          (user?.first_name || firstName) && (user?.last_name || lastName)
            ? `${user?.first_name || firstName} ${user?.last_name || lastName}`
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

    toast.success("Registration Successful");
  };

  const handleSpinAndRegister = async () => {
    if (!firstName || !lastName || !email || !mobile) return toast.error("Please fill all fields");
    if (mobile.length !== 10) return toast.error("Enter valid 10-digit mobile");
    if (!consent) return toast.error("Please accept T&Cs");

    if (isMobile) {
      setIsDrawerOpen(true);
      // Small delay to ensure drawer is open before animation
      setTimeout(() => startSpinning(), 500);
    } else {
      startSpinning();
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

    await controls.start({
      rotate: finalRotation,
      transition: { duration: 4, ease: [0.17, 0.67, 0.12, 0.99] },
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
          loginSuccess(data);
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
    <div className="relative w-full max-w-[350px] aspect-square mx-auto">
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
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none w-full max-w-[400px] h-auto"
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
            <img src="/images/logo.svg" width="120" height="49" alt="lucira jewelry logo" className="mx-auto" />
          </div>
          
          <h2 className="text-xl font-bold text-center uppercase mb-1 font-serif">Register to Win Rewards</h2>
          <p className="text-sm text-gray-500 text-center mb-6">Try Your Luck! Win a Diamond Pendant</p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">First Name <span className="text-red-500">*</span></label>
                <input type="text" className="w-full h-10 px-3 text-sm border border-gray-200 rounded focus:border-black outline-none transition-all" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Last Name <span className="text-red-500">*</span></label>
                <input type="text" className="w-full h-10 px-3 text-sm border border-gray-200 rounded focus:border-black outline-none transition-all" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Email Address <span className="text-red-500">*</span></label>
              <input type="email" className="w-full h-10 px-3 text-sm border border-gray-200 rounded focus:border-black outline-none transition-all" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Phone Number <span className="text-red-500">*</span></label>
              <div className="flex items-center border border-gray-200 rounded h-10 px-3 bg-white focus-within:border-black transition-all">
                <span className="text-sm text-gray-500 mr-2 border-r border-gray-200 pr-2">+91</span>
                <input
                  type="tel"
                  maxLength="10"
                  className="w-full h-full text-sm outline-none bg-transparent disabled:opacity-50"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                  disabled={isMobilePreFilled && mobile.length === 10}
                />
              </div>
            </div>

            <div className="flex items-start gap-2 pt-2">
              <input type="checkbox" id="consent-reg" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 accent-[#5a413f]" />
              <label htmlFor="consent-reg" className="text-[11px] text-gray-600 leading-tight cursor-pointer">
                I accept that I have read & understood Privacy Policy and T&Cs.
              </label>
            </div>

            <button
              className="w-full h-11 bg-[#5f4745] hover:bg-[#4a3634] text-white text-sm font-semibold rounded transition-colors uppercase tracking-wider mt-2 disabled:opacity-50 shadow-md"
              onClick={handleSpinAndRegister}
              disabled={isSpinning || loading}
            >
              {isSpinning ? "SPINNING..." : "SPIN & CREATE ACCOUNT"}
            </button>

            <p className="text-center text-[13px] text-gray-600 mt-4">
              Already registered?{" "}
              <span className="text-[#5a413f] font-bold underline cursor-pointer" onClick={() => router.push("/login")}>
                Login
              </span>
            </p>
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
