"use client";

import { useState } from "react";
import GiftTierSlider from "./GiftTierSlider";
import { Info, ChevronRight, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useAuth } from "@/hooks/useAuth";
import { pushPromoClick } from "@/lib/gtm";
import Image from "next/image";
import shopifyLoader from "@/utils/shopifyLoader";
import { useSchemeSettings } from "@/hooks/useSchemeSettings";
import { fetchOrnaverseCustomer, createOrnaverseCustomer } from "@/lib/api";

const PRESETS = [3000, 5000, 10000, 19000];
const DEFAULT_AMOUNT = 10000;

export default function MobileSavingCalculator() {
  const [isAgreed, setIsAgreed] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const amountParam = searchParams.get("amount");
  const { isAuthenticated, openLogin, user } = useAuth();
  const { settings, loading: settingsLoading, calculateGift, getActiveIntervals } = useSchemeSettings();

  const getInitialAmount = () => {
    if (amountParam && !isNaN(Number(amountParam))) {
      const num = Number(amountParam);
      return Math.max(2000, Math.min(19000, num));
    }
    return DEFAULT_AMOUNT;
  };

  const initialAmount = getInitialAmount();

  const [amountError, setAmountError] = useState("");
  const [amount, setAmount] = useState(initialAmount);
  const [localLoading, setLocalLoading] = useState(false);

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const giftValue = calculateGift(amount);
  const totalInstallment = amount * 9;
  const bonus = amount;
  const totalReturns = totalInstallment + bonus + giftValue;

  const get10DigitMobile = (raw) => {
    if (!raw) return "";
    let cleaned = raw.replace(/\D/g, "");
    return cleaned.length > 10 ? cleaned.slice(-10) : cleaned;
  };

  const formatINR = (value) => new Intl.NumberFormat("en-IN").format(value);

  const selectAmount = (value) => {
    setAmount(value);
    setAmountError("");
  };

  const activeIntervals = getActiveIntervals();

  const redemptionData = [
    { month: 7, discount: 25 },
    { month: 8, discount: 25 },
    { month: 9, discount: 25 },
    { month: 10, discount: 100 },
  ];

  return (
    <section className="px-4 pt-4 pb-12 md:pb-5 space-y-6">
      {/* MAIN CARD */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 space-y-7">
        {/* HEADER */}
        <div className="text-center space-y-3">
          <p className="text-[10px] tracking-[0.2em] text-gray-400 uppercase font-semibold">
            Adjust your monthly premium
          </p>

          <div className="bg-gray-50 rounded-2xl py-4 border border-gray-100">
            <p className="text-4xl font-bold text-primary">₹{formatINR(amount)}</p>
          </div>
        </div>

        {/* SLIDER */}
        <div className="px-1 pt-2">
          <GiftTierSlider
            min={2000}
            max={19000}
            step={500}
            amount={amount}
            onChange={selectAmount}
            intervals={activeIntervals}
            compact
          />
        </div>

        {/* PRESETS */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {PRESETS.map((val) => (
            <div key={val} className="relative">
              {val === 10000 && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 rounded-full bg-accent px-1.5 py-px text-[8px] font-bold uppercase tracking-wide text-white shadow-sm">
                  Popular
                </span>
              )}
              <button
                type="button"
                onClick={() => selectAmount(val)}
                aria-pressed={amount === val}
                className={`h-11 w-full rounded-xl border text-xs font-semibold transition-all
                  ${
                    amount === val
                      ? "border-primary bg-primary text-white shadow-md"
                      : "border-gray-100 bg-gray-50 text-gray-600"
                  }`}
              >
                ₹{formatINR(val)}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* PREMIUM SUMMARY CARD */}
      <div className="bg-[#f9f6f4] rounded-3xl p-6 shadow-sm border border-[#f0e8e4]">
        <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">
          Estimated Premium Summary
        </h3>

        <div className="space-y-5">
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <div className="w-3.5 h-3.5 bg-[#a68d85] mt-0.5 rounded-sm shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-800 leading-none">
                  Total Contribution
                </p>
                <p className="text-[10px] text-gray-500 italic mt-1.5">
                  (9 monthly Payments)
                </p>
              </div>
            </div>
            <p className="text-sm font-bold text-gray-900">
              ₹{formatINR(totalInstallment)}
            </p>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex gap-3 ml-6.5">
              <div>
                <p className="text-xs font-bold text-gray-800 leading-none">
                  Bonus of Final Month
                </p>
                <p className="text-[10px] text-gray-500 italic mt-1.5">
                  (We cover your 10th Payment)
                </p>
              </div>
            </div>
            <p className="text-sm font-bold text-gray-900">₹{formatINR(bonus)}</p>
          </div>

          {giftValue > 0 && (
            <div className="w-full my-3">
              <Image
                loader={shopifyLoader}
                src={giftValue >= 10000
                  ? "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Mob_Banner_10k.jpg?v=1781241879"
                  : "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Mob_Banner_5k.jpg?v=1781241879"
                }
                alt="Free Gift Banner"
                width={900}
                height={300}
                className="w-full h-auto rounded-xl object-contain shadow-sm"
              />
            </div>
          )}

          <div className="h-px bg-gray-200/60" />

          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <div className="w-3.5 h-3.5 bg-success mt-0.5 rounded-sm shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-800 leading-none">
                  Total Benefit Value
                </p>
                <p className="text-[10px] text-gray-500 italic mt-1.5">
                  (After 10 Months)
                </p>
              </div>
            </div>
            <p className="text-lg font-bold text-success">₹{formatINR(totalReturns)}</p>
          </div>
        </div>
      </div>

      {/* REDEMPTION DRAWER TRIGGER */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex justify-between items-center active:bg-gray-50 transition-colors">
            <div className="flex flex-col gap-1">
              <p className="text-[13px] font-bold text-gray-900">Need Flexibility?</p>
              <p className="text-[11px] text-gray-500">Redeem Early After 6 Months</p>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <span className="text-xs font-bold">View Benefits</span>
              <ChevronRight size={16} />
            </div>
          </div>
        </DrawerTrigger>
        <DrawerContent className="bg-white">
          <DrawerHeader className="text-left border-b pb-4">
            <DrawerTitle className="text-lg font-bold text-primary">
              Early Redemption Benefits
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              Check what you get if you decide to redeem your savings before the 10-month
              term.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {redemptionData.map((item) => {
              const installments = item.month - 1;
              const totalPayment = amount * installments;
              const daysArrayMap = {
                7: [181, 150, 122, 91, 61, 30],
                8: [212, 181, 150, 122, 91, 61, 30],
                9: [242, 212, 181, 150, 122, 91, 61, 30],
              };

              let discountAmount;

              if (item.month === 10) {
                discountAmount = amount;
              } else {
                const daysArray = daysArrayMap[item.month] || [];

                discountAmount = Math.ceil(
                  daysArray.reduce((sum, d) => {
                    return sum + (d / 365) * (item.discount / 100) * amount;
                  }, 0)
                );
                }

                let currentGiftValue = calculateGift(amount);

                const totalValue = totalPayment + discountAmount + currentGiftValue;

                return (
                <div
                  key={item.month}
                  className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4"
                >
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
                    <span className="text-primary font-bold text-sm">
                      {item.month}th Month Redemption
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">
                        Total Contribution ({installments} months)
                      </span>
                      <span className="font-bold text-gray-900">
                        ₹{formatINR(totalPayment)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">
                        {item.month === 10 ? "Bonus Benefit" : "Interest Benefit"}
                      </span>
                      <span className="font-bold text-gray-900">
                        ₹{formatINR(discountAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-300">
                      <span className="text-xs font-bold text-gray-900">
                        Jewellery Value
                      </span>
                      <span className="text-lg font-bold text-accent">
                        ₹{formatINR(totalValue)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <DrawerFooter className="pt-2 border-t">
            <DrawerClose asChild>
              <button className="w-full bg-primary text-white h-12 rounded-xl font-bold text-sm">
                Got it
              </button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <div className="text-center text-[10px] text-gray-500 px-4">
        <p>
          If jewellery is more than ₹{formatINR(totalReturns)}, you just need to pay the
          difference amount at the time of purchase
        </p>
      </div>

      {/* TERMS & CONDITIONS */}
      <div className="px-2">
        <label className="flex items-start gap-3 text-[11px] text-gray-500 leading-relaxed hover:cursor-pointer">
          <Checkbox
            checked={isAgreed}
            onCheckedChange={(val) => setIsAgreed(!!val)}
            className="border-gray-300 mt-0.5"
          />
          <span>
            I agree to the{" "}
            <a
              href="https://www.lucirajewelry.com/pages/terms-condition"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-bold underline"
            >
              Terms & Conditions
            </a>{" "}
            of Lucira Jewelry Savings Scheme.
          </span>
        </label>
      </div>

      {amountError && (
        <p className="text-xs text-red-500 text-center font-medium">{amountError}</p>
      )}

      {/* FIXED BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-6 py-5 z-[50] md:hidden">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                Monthly Premium
              </span>
              <span className="text-xl font-bold text-black">₹{formatINR(amount)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                Total Returns
              </span>
              <span className="text-xl font-bold text-success block">
                ₹{formatINR(totalReturns)}
              </span>
            </div>
          </div>

          <button
            disabled={!!amountError || !isAgreed || localLoading}
            onClick={async () => {
              if (amountError || !isAgreed || localLoading) return;

              // Fire dataLayer promoClick event
              try {
                pushPromoClick({
                  creative_name: "scheme page Continue cta",
                  location_id: "schemes page",
                  promo_id: String(amount),
                  promo_name: get10DigitMobile(user?.mobile || user?.phone) || "",
                });
              } catch (error) {
                console.error("Error pushing to dataLayer:", error);
              }

              if (isAuthenticated) {
                try {
                  setLocalLoading(true);
                  const mobile10 = get10DigitMobile(user.mobile || user.phone);
                  if (mobile10) {
                    // Check if customer exists in Ornaverse
                    const ornaData = await fetchOrnaverseCustomer(mobile10);
                    const ornaProfile = ornaData?.Entities?.[0];

                    if (!ornaProfile?.party_id) {
                      // Create customer in Ornaverse in background
                      await createOrnaverseCustomer({
                        first_name: user.first_name || "User",
                        last_name: user.last_name || "Customer",
                        phone: mobile10,
                        email: user.email || `${mobile10}@lucira.internal`,
                      });
                    }
                  }
                  router.push(`/schemes/enroll?amount=${amount}`);
                } catch (err) {
                  console.error("[Scheme Flow] Background Ornaverse Error:", err);
                  // Still push forward to let the enrollment page handle it if possible
                  router.push(`/schemes/enroll?amount=${amount}`);
                } finally {
                  setLocalLoading(false);
                }
              } else {
                openLogin(`/schemes/enroll?amount=${amount}`);
              }
            }}
            className={`w-full rounded-xl h-14 text-base font-bold tracking-wide shadow-lg active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center ${
              amountError || !isAgreed || localLoading
                ? "bg-gray-300 text-gray-500"
                : "bg-primary text-white"
            }`}
          >
            {localLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                <span>PLEASE WAIT...</span>
              </div>
            ) : "CONTINUE"}
          </button>
        </div>
      </div>
    </section>
  );
}
