"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Phone, MapPin, Check, Store, ChevronDown } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

export default function StoreGiveawayPage() {
  const [step, setStep] = useState(1);
  const [voucherNumber, setVoucherNumber] = useState("");
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voucherError, setVoucherError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    pincode: "",
    store: "",
  });



  const [isValidating, setIsValidating] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setVoucherError("");

    // Client-side range check
    const num = parseInt(voucherNumber, 10);
    const isValidFormat = /^\d{1,5}$/.test(voucherNumber.trim());

    if (!isValidFormat || num < 1 || num > 50000) {
      setVoucherError("Invalid voucher code. Please enter a valid code.");
      return;
    }

    // Check with backend if voucher is already used
    setIsValidating(true);
    try {
      const response = await fetch("https://store-giveaway-webhook-385594025448.asia-south1.run.app/store_giveaway/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucherNumber }),
      });

      if (response.ok) {
        setStep(2);
      } else if (response.status === 409) {
        setVoucherError("This voucher has already been used.");
      } else {
        setVoucherError("Invalid voucher code. Please try again.");
      }
    } catch (error) {
      setVoucherError("Network error. Please check your connection.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("https://store-giveaway-webhook-385594025448.asia-south1.run.app/store_giveaway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, voucherNumber }),
      });

      if (response.ok) {
        setStep(3);
      } else if (response.status === 409) {
        // 409 Conflict = voucher already used
        setStep(1);
        setVoucherError("This voucher has already been used.");
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      alert("Network error. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const terms = [
    "Participation is open only to customers who visit a Lucira store during the campaign period.",
    "Customers may participate by submitting a physical entry voucher at the store or by registering online and visiting the store.",
    "Participants must follow @lucirajewelry on Instagram to qualify for the giveaway",
    "No purchase is necessary to enter the giveaway.",
    "Only one entry per customer is permitted.",
    "The campaign is valid from 14 Jun 2026 to 15 Sept 2026.",
    "One lucky winner will receive jewelry worth ₹1,00,000.",
    "The winner will be announced on 15 September 2026.",
    "A store visit is mandatory for prize validation and collection.",
    "Any incomplete, duplicate, or invalid entries may be disqualified.",
    "In the event of any dispute, Lucira's decision shall be final and binding.",
  ];

  return (
    <div className={`relative min-h-screen w-full flex flex-col items-center py-6 sm:py-8 px-4 sm:px-6 overflow-hidden selection:bg-white selection:text-black transition-colors duration-500`}>
      {/* Background Image - Only for Step 1 */}
      {step === 1 && (
        <div className="absolute inset-0 -z-10 bg-[#1a1a1a]">
          {/* Mobile Image */}
          <div className="block md:hidden absolute inset-0">
            <Image
              src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/993f34f813a40595ba8ebfbe90f2ac87be0a7024.jpg"
              alt="Giveaway background mobile"
              fill
              className="object-cover opacity-70 brightness-90"
              priority
            />
          </div>
          {/* Desktop Image */}
          <div className="hidden md:block absolute inset-0">
            <Image
              src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Store_Giveaway_web_banner_1.png"
              alt="Giveaway background desktop"
              fill
              className="object-cover opacity-70 brightness-90"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        </div>
      )}

      {/* Top Section: Logo & Progress */}
      <div className="w-full max-w-lg flex flex-col items-center gap-6 sm:gap-8 z-20">
        <Image
          src={step === 1 
            ? "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Lucira_Full_White_logo_1.svg?v=1767856155" 
            : "/images/logo.svg"
          }
          alt="Lucira Jewelry"
          width={110}
          height={42}
          className="sm:w-[130px] sm:h-[50px]"
          priority
        />

        {/* Progress Indicator */}
        <div className="flex items-center gap-0 w-full max-w-[200px] sm:max-w-[240px] justify-center mt-1">
          <div className="relative flex items-center justify-center">
            <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
              step >= 1 
                ? (step === 1 ? "bg-white ring-6 sm:ring-8 ring-white/10" : "bg-[#5A413F]") 
                : (step === 1 ? "border border-white/40" : "border border-[#5A413F]/40")
            }`} />
          </div>
          <div className={`h-[0.5px] w-12 sm:w-16 transition-all duration-300 ${
            step > 1 
              ? (step === 1 ? "bg-white" : "bg-[#5A413F]") 
              : (step === 1 ? "bg-white/30" : "bg-black/20")
          }`} />
          <div className="relative flex items-center justify-center">
            <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
              step >= 2 
                ? (step === 1 ? "bg-white ring-6 sm:ring-8 ring-white/10" : "bg-[#5A413F]") 
                : (step === 1 ? "border border-white bg-transparent" : "border border-[#5A413F] bg-transparent")
            }`} />
          </div>
          <div className={`h-[0.5px] w-12 sm:w-16 transition-all duration-300 ${
            step > 2 
              ? (step === 1 ? "bg-white" : "bg-[#5A413F]") 
              : (step === 1 ? "bg-white/30" : "bg-black/20")
          }`} />
          <div className="relative flex items-center justify-center">
            <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
              step >= 3 
                ? (step === 1 ? "bg-white ring-6 sm:ring-8 ring-white/10" : "bg-[#5A413F]") 
                : (step === 1 ? "border border-white bg-transparent" : "border border-[#5A413F] bg-transparent")
            }`} />
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute bottom-[30px] sm:bottom-[40px] w-[92%] sm:w-[90%] max-w-lg flex flex-col items-center gap-6 sm:gap-8 text-center z-20 left-1/2 -translate-x-1/2"
          >
            <div className="space-y-2 sm:space-y-3 w-full">
              <h1 className="text-white text-[24px] sm:text-[28px] font-abhaya font-extrabold leading-tight tracking-normal text-center">
                1 Lakh Giveaway
              </h1>
              <p className="text-white/90 font-figtree font-normal text-[14px] sm:text-[15px] leading-relaxed tracking-normal text-center m-0 w-full max-w-full">
                One lucky winner takes home jewelry worth ₹1 Lakh
              </p>
            </div>

            <div className="w-full max-w-[440px] flex flex-col items-center gap-5 sm:gap-6">
              <div className="w-full flex flex-col gap-2">
                <form 
                  onSubmit={handleRegister}
                  className="w-full p-1 bg-white rounded-lg flex items-center shadow-2xl"
                >
                  <input
                    type="text"
                    placeholder="Voucher Number *"
                    value={voucherNumber}
                    onChange={(e) => {
                      setVoucherNumber(e.target.value);
                      setVoucherError("");
                    }}
                    className={`flex-grow min-w-0 bg-transparent px-3 sm:px-5 py-3 sm:py-3.5 text-black placeholder:text-[#999] focus:outline-none font-figtree text-[15px] sm:text-[16px]`}
                    required
                  />
                  <button 
                    type="submit"
                    disabled={isValidating}
                    className="bg-[#5A413F] text-white px-4 sm:px-8 py-3 sm:py-3.5 font-figtree font-bold uppercase text-[12px] sm:text-[13px] tracking-wider hover:bg-[#4A3533] transition-all whitespace-nowrap rounded-md disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isValidating ? "CHECKING..." : "REGISTER NOW"}
                  </button>
                </form>

                {/* Error message sits flush below the white bar */}
                {voucherError && (
                  <div className="flex items-center gap-2 bg-red-500/20 backdrop-blur-sm border border-red-400/40 rounded-md px-3 py-2">
                    <svg className="w-3.5 h-3.5 text-red-300 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-200 text-[12px] sm:text-[13px] font-figtree">
                      {voucherError}
                    </p>
                  </div>
                )}
              </div>

              <p className="text-white text-[12px] sm:text-[13px] font-figtree tracking-normal opacity-80">
                By Registering you accept our{" "}
                <button 
                  onClick={() => setIsTermsOpen(true)}
                  className="underline underline-offset-4 hover:text-white transition-colors"
                >
                  Terms & Conditions
                </button>
              </p>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md mt-8 sm:mt-12 z-20 flex flex-col items-center"
          >
            <div className="text-center mb-6 sm:mb-10">
              <h2 className="text-[24px] sm:text-[26px] font-abhaya font-extrabold text-black mb-1">Entry Form</h2>
              <p className="text-[#666] font-figtree text-[14px] sm:text-[15px]">Fill your details to participate.</p>
            </div>

            <form onSubmit={handleFinalSubmit} className="w-full space-y-4 sm:space-y-6">
              <div className="grid grid-cols-2 gap-2 xs:gap-4">
                <div className="space-y-1 xs:space-y-2">
                  <label className="flex items-center gap-2 text-[13px] sm:text-[14px] font-figtree font-bold text-black ml-1">
                    <User className="w-3.5 h-3.5 xs:w-4 xs:h-4" /> First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="First Name"
                    required
                    className="w-full bg-[#F9F9F9] border-none rounded-lg px-3 xs:px-5 py-3.5 xs:py-4 text-black placeholder:text-[#999] focus:ring-1 focus:ring-black/5 outline-none font-figtree text-[14px] xs:text-[15px]"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-1 xs:space-y-2">
                  <label className="flex items-center gap-2 text-[13px] sm:text-[14px] font-figtree font-bold text-black ml-1">
                    <User className="w-3.5 h-3.5 xs:w-4 xs:h-4" /> Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    required
                    className="w-full bg-[#F9F9F9] border-none rounded-lg px-3 xs:px-5 py-3.5 xs:py-4 text-black placeholder:text-[#999] focus:ring-1 focus:ring-black/5 outline-none font-figtree text-[14px] xs:text-[15px]"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <label className="flex items-center gap-2 text-[13px] sm:text-[14px] font-figtree font-bold text-black ml-1">
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your Mail Id"
                  className="w-full bg-[#F9F9F9] border-none rounded-lg px-4 sm:px-5 py-3.5 sm:py-4 text-black placeholder:text-[#999] focus:ring-1 focus:ring-black/5 outline-none font-figtree text-[15px]"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <label className="flex items-center gap-2 text-[13px] sm:text-[14px] font-figtree font-bold text-black ml-1">
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="Enter your Phone Number"
                  required
                  maxLength={10}
                  pattern="\d{10}"
                  className="w-full bg-[#F9F9F9] border-none rounded-lg px-4 sm:px-5 py-3.5 sm:py-4 text-black placeholder:text-[#999] focus:ring-1 focus:ring-black/5 outline-none font-figtree text-[15px]"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setFormData({...formData, phone: value});
                  }}
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <label className="flex items-center gap-2 text-[13px] sm:text-[14px] font-figtree font-bold text-black ml-1">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your Pincode"
                  required
                  className="w-full bg-[#F9F9F9] border-none rounded-lg px-4 sm:px-5 py-3.5 sm:py-4 text-black placeholder:text-[#999] focus:ring-1 focus:ring-black/5 outline-none font-figtree text-[15px]"
                  value={formData.pincode}
                  onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <label className="flex items-center gap-2 text-[13px] sm:text-[14px] font-figtree font-bold text-black ml-1">
                  <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Select Store <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    className="w-full bg-[#F9F9F9] border-none rounded-lg px-4 sm:px-5 py-3.5 sm:py-4 text-black focus:ring-1 focus:ring-black/5 outline-none font-figtree appearance-none text-[15px]"
                    value={formData.store}
                    onChange={(e) => setFormData({...formData, store: e.target.value})}
                  >
                    <option value="" disabled>Select Store</option>
                    <option value="Chembur">Chembur</option>
                    <option value="Borivali">Borivali</option>
                    <option value="Noida">Noida</option>
                    <option value="Pune">Pune</option>
                  </select>
                  <div className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#999]" />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-[#5A413F] text-white py-3.5 sm:py-4 font-figtree font-bold uppercase text-[14px] sm:text-[15px] tracking-wider transition-all rounded-lg mt-4 sm:mt-8 shadow-lg shadow-black/10 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#4A3533]'}`}
              >
                {isSubmitting ? "SUBMITTING..." : "SUBMIT"}
              </button>
            </form>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md mt-16 sm:mt-24 z-20 flex flex-col items-center text-center px-4"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#22C55E] rounded-full flex items-center justify-center mb-8 sm:mb-10 shadow-xl shadow-green-100">
              <Check className="w-10 h-10 sm:w-12 sm:h-12 text-white stroke-[3px]" />
            </div>

            <h2 className="text-[28px] sm:text-[32px] font-abhaya font-extrabold text-black mb-2 sm:mb-3">You're In!</h2>
            <p className="text-[#555] font-figtree text-[15px] sm:text-[16px] leading-relaxed max-w-[260px] sm:max-w-[280px] mb-8 sm:mb-12">
              Visit us in-store & follow us on Instagram to qualify.
            </p>

            <Link
              href="/pages/store-locator"
              className="w-full bg-[#5A413F] text-white py-3.5 sm:py-4 font-figtree font-bold uppercase text-[14px] sm:text-[15px] tracking-wider hover:bg-[#4A3533] transition-all rounded-lg shadow-lg shadow-black/10"
            >
              LOCATE NEAREST STORE
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terms & Conditions Drawer */}
      <Drawer open={isTermsOpen} onOpenChange={setIsTermsOpen}>
        <DrawerContent className="bg-white px-4 sm:px-6 pb-12 pt-0">
          <div className="flex justify-between items-center mb-6 pt-0">
            <DrawerHeader className="p-0 text-left">
              <DrawerTitle className="font-abhaya font-bold text-[20px] sm:text-[22px] text-zinc-900 tracking-tight">
                Terms & Conditions
              </DrawerTitle>
            </DrawerHeader>
            <DrawerClose className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-zinc-500" />
            </DrawerClose>
          </div>

          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            <ul className="space-y-0">
              {terms.map((term, index) => (
                <li key={index} className="flex gap-3 text-black font-figtree mb-2 items-start">
                  <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-300" />
                  <span className="font-normal text-[11px] sm:text-[12px] leading-[1.4] tracking-normal align-middle">
                    {term}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Bottom Spacer */}
      <div className="h-4" />

      {/* Hide Zoho SalesIQ elements on this page */}
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
  );
}