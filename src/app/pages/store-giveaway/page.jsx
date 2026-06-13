"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function StoreGiveawayPage() {
  const [step, setStep] = useState(1);
  const [voucherNumber, setVoucherNumber] = useState("");

  const handleRegister = (e) => {
    e.preventDefault();
    console.log("Voucher Number:", voucherNumber);
    // Logic for registration will go here
    // setStep(2); 
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between py-6 px-6 overflow-hidden selection:bg-white selection:text-black">
      {/* Background Image */}
      <div className="absolute inset-0 -z-10 bg-[#1a1a1a]">
        <Image
          src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/993f34f813a40595ba8ebfbe90f2ac87be0a7024.jpg"
          alt="Giveaway background"
          fill
          className="object-cover opacity-70 brightness-90"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      </div>

      {/* Top Section: Logo & Progress */}
      <div className="w-full max-w-lg flex flex-col items-center gap-10">
        <Image
          src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Lucira_Full_White_logo_1.svg?v=1767856155"
          alt="Lucira Jewelry"
          width={130}
          height={50}
          priority
        />

        {/* Progress Indicator */}
        <div className="flex items-center gap-0 w-full max-w-[280px] justify-center">
          <div className="relative flex items-center justify-center">
            <div className={`w-4.5 h-4.5 rounded-full transition-all duration-300 ${step >= 1 ? "bg-white ring-8 ring-white/10" : "border border-white/40 bg-transparent"}`} />
          </div>
          <div className={`h-[1px] w-20 transition-all duration-300 ${step > 1 ? "bg-white" : "bg-white/30"}`} />
          <div className="relative flex items-center justify-center">
            <div className={`w-4.5 h-4.5 rounded-full transition-all duration-300 ${step >= 2 ? "bg-white ring-8 ring-white/10" : "border border-white bg-transparent"}`} />
          </div>
          <div className={`h-[1px] w-20 transition-all duration-300 ${step > 2 ? "bg-white" : "bg-white/30"}`} />
          <div className="relative flex items-center justify-center">
            <div className={`w-4.5 h-4.5 rounded-full transition-all duration-300 ${step >= 3 ? "bg-white ring-8 ring-white/10" : "border border-white bg-transparent"}`} />
          </div>
        </div>
      </div>

      {/* Middle Section: Main Content */}
      <div className="absolute bottom-[35px] w-[90%] max-w-lg flex flex-col items-center gap-8 text-center z-20 left-1/2 -translate-x-1/2">
        <div className="space-y-4 w-full">
          <h1 className="text-white text-[24px] font-abhaya font-extrabold leading-[1.3] tracking-normal text-center mb-[10px]">
            1 Lakh Giveaway
          </h1>
          <p className="text-white/95 font-figtree font-normal text-[14px] leading-[1.4] tracking-normal text-center m-0 w-full max-w-full">
            One lucky winner takes home jewelry worth ₹1 Lakh
          </p>
        </div>

        {/* Form */}
        <div className="w-full max-w-[440px] flex flex-col items-center gap-6">
          <form 
            onSubmit={handleRegister}
            className="w-full p-1.5 bg-white rounded-lg flex items-center shadow-lg"
          >
            <input
              type="text"
              placeholder="Enter Voucher Number"
              value={voucherNumber}
              onChange={(e) => setVoucherNumber(e.target.value)}
              className="flex-grow bg-transparent px-5 py-3 text-black placeholder:text-[#999] focus:outline-none font-figtree text-[16px]"
              required
            />
            <button 
              type="submit"
              className="bg-[#5A413F] text-white px-7 py-3.5 font-figtree font-bold uppercase text-[14px] tracking-normal hover:bg-[#4A3533] transition-all whitespace-nowrap rounded-md"
            >
              REGISTER NOW
            </button>
          </form>

          <p className="text-white text-[13px] font-figtree tracking-normal">
            By Registering you accept our{" "}
            <Link href="/pages/terms-and-conditions" className="underline underline-offset-2 hover:text-white/80 transition-colors">
              Terms & Conditions
            </Link>
          </p>
        </div>
      </div>

      {/* Bottom Spacer */}
      <div className="h-4" />
    </div>
  );
}

