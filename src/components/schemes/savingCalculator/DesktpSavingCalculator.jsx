"use client";

import { useState } from "react";
import GiftTierSlider from "./GiftTierSlider";
import { Info, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { pushPromoClick } from "@/lib/gtm";
import Image from "next/image";
import shopifyLoader from "@/utils/shopifyLoader";
import { useSchemeSettings } from "@/hooks/useSchemeSettings";
import { fetchOrnaverseCustomer, createOrnaverseCustomer } from "@/lib/api";

const PRESETS = [3000, 5000, 10000, 19000];
const DEFAULT_AMOUNT = 10000;

const RedemptionTooltip = ({ month, amount, discountPercent, giftValue }) => {
  const daysArrayMap = {
    7: [181, 150, 122, 91, 61, 30],
    8: [212, 181, 150, 122, 91, 61, 30],
    9: [242, 212, 181, 150, 122, 91, 61, 30],
  };

  const installments = month - 1;
  const totalPayment = amount * installments;

  let discountAmount;

  if (month === 10) {
    discountAmount = amount;
  } else {
    const daysArray = daysArrayMap[month] || [];

    discountAmount = Math.ceil(
      daysArray.reduce((total, days) => {
        return total + (days / 365) * (discountPercent / 100) * amount;
      }, 0)
    );
  }

  const totalValue = totalPayment + discountAmount + giftValue;

  return (
    <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-72 bg-white rounded-lg shadow-2xl p-6 z-50 pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <h5 className="text-black font-bold text-base mb-4 tracking-tight">
        Redemption in {month}th month
      </h5>

      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-600 text-[13px] font-medium">Your total payment</p>
            <p className="text-gray-400 text-[11px] font-light mt-0.5">
              ({installments} installments)
            </p>
          </div>
          <p className="text-gray-800 font-semibold text-[13px]">
            ₹{new Intl.NumberFormat("en-IN").format(totalPayment)}
          </p>
        </div>

        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-600 text-[13px] font-medium">
              {month === 10 ? "Bonus Benefit" : "Interest Benefit"}
            </p>
            <p className="text-gray-400 text-[11px] font-light mt-0.5">
              ({discountPercent}% of one Installment value)
            </p>
          </div>
          <p className="text-gray-800 font-semibold text-[13px]">
            ₹{new Intl.NumberFormat("en-IN").format(discountAmount)}
          </p>
        </div>

        {giftValue > 0 && (
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-[13px] font-medium">
                Promotional Gift
              </p>
              <p className="text-gray-400 text-[11px] font-light mt-0.5">
                (Free Diamond Pendant)
              </p>
            </div>
            <p className="text-gray-800 font-semibold text-[13px]">
              ₹{new Intl.NumberFormat("en-IN").format(giftValue)}
            </p>
          </div>
        )}

        <div className="h-px bg-gray-100 my-1" />

        <div className="flex justify-between items-start pt-1">
          <div>
            <p className="text-gray-900 text-[13px] font-bold">
              You can buy jewellery worth:
            </p>
            <p className="text-gray-400 text-[11px] font-light mt-0.5">
              (after {month}th month)
            </p>
          </div>
          <p className="text-accent font-bold text-base">
            ₹{new Intl.NumberFormat("en-IN").format(totalValue)}
          </p>
        </div>
      </div>

      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 shadow-[4px_4px_8px_rgba(0,0,0,0.05)]" />
    </div>
  );
};

const DesktpSavingCalculator = () => {
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
  const [isAgreed, setIsAgreed] = useState(true);
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

  const getTotalValue = (month, amt, rate) => {
    const gv = calculateGift(amt);
    if (month === 10) {
      return amt * 9 + amt + gv;
    }
    const daysArrayMap = {
      7: [181, 150, 122, 91, 61, 30],
      8: [212, 181, 150, 122, 91, 61, 30],
      9: [242, 212, 181, 150, 122, 91, 61, 30],
    };
    const daysArray = daysArrayMap[month] || [];
    const interest = Math.ceil(
      daysArray.reduce((sum, d) => sum + (d / 365) * (rate / 100) * amt, 0)
    );
    return amt * (month - 1) + interest + gv;
  };

  const formatINR = (value) => new Intl.NumberFormat("en-IN").format(value);

  const selectAmount = (value) => {
    setAmount(value);
    setAmountError("");
  };

  const activeIntervals = getActiveIntervals();

  return (
    <section className="w-full max-w-7xl mx-auto px-6 mt-6 min-[1024px]:mt-20">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-10 md:gap-20 items-start">
        <div className="lg:sticky lg:top-28">
          <h3 className="text-2xl font-abhaya font-bold mb-6 text-center text-gray-900">
            Adjust your monthly premium
          </h3>
          <div className="flex gap-4 mb-10 justify-center items-center">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl px-10 py-4 text-center">
              <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 font-semibold mb-1">
                Monthly premium
              </p>
              <p className="text-4xl font-semibold text-primary">
                ₹{formatINR(amount)}
              </p>
            </div>
          </div>

          <GiftTierSlider
            min={2000}
            max={19000}
            step={500}
            amount={amount}
            onChange={selectAmount}
            intervals={activeIntervals}
          />

          <div className="flex items-center gap-4 my-8 text-gray-400">
            <span className="h-px flex-1 bg-gray-200" />
            <span className="text-xs uppercase tracking-widest">Or</span>
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {PRESETS.map((val) => (
              <div key={val} className="relative">
                {val === 10000 && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                    Popular
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => selectAmount(val)}
                  aria-pressed={amount === val}
                  className={`h-12 w-full cursor-pointer rounded-card border text-base transition-all duration-200 ${
                    amount === val
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  ₹{formatINR(val)}
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-center items-center mt-15">
            <button
              disabled={!!amountError || localLoading}
              className={`flex items-center gap-2 px-8 w-[60%] h-12 mx-auto rounded-md text-base uppercase justify-center
                ${
                  amountError || !isAgreed || localLoading
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-primary text-white cursor-pointer"
                }`}
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
            >
              {localLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : "Continue"}
            </button>
          </div>

          <label className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-600 hover:cursor-pointer">
            <Checkbox
              checked={isAgreed}
              onCheckedChange={(val) => setIsAgreed(!!val)}
              className="border-primary"
            />
            <span>
              I agree to{" "}
              <a
                href="https://www.lucirajewelry.com/pages/terms-condition"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline cursor-pointer"
              >
                Terms & Conditions
              </a>{" "}
              of Lucira Jewelry.
            </span>
          </label>

          {amountError && (
            <p className="text-sm text-red-500 mt-2 text-center">{amountError}</p>
          )}
        </div>

        <div className="hidden lg:block w-px bg-gray-300 self-stretch"></div>

        <div className="flex flex-col">
          <h3 className="text-2xl font-abhaya font-bold mb-6 text-center text-gray-900">
            Estimated Premium Summary
          </h3>
          <div className="bg-[#f9f6f4] rounded-2xl p-8 shadow-sm">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-4 h-4 bg-[#a68d85] mt-1.5 shrink-0" />
                  <div>
                    <p className="text-base font-medium text-gray-900 leading-none">
                      Your Total Contribution
                    </p>
                    <p className="text-[11px] text-gray-500 italic mt-1.5">
                      (9 monthly Payments)
                    </p>
                  </div>
                </div>
                <p className="text-xl font-semibold text-gray-900">
                  ₹{formatINR(totalInstallment)}
                </p>
              </div>

              <div className="flex justify-between items-start">
                <div className="flex gap-4 ml-8">
                  <div>
                    <p className="text-base font-medium text-gray-900 leading-none">
                      Bonus of Final Month
                    </p>
                    <p className="text-[11px] text-gray-500 italic mt-1.5">
                      (We cover your 10th Payment)
                    </p>
                  </div>
                </div>
                <p className="text-xl font-semibold text-gray-900">₹{formatINR(bonus)}</p>
              </div>

              {giftValue > 0 && (
                <div className="w-full my-4">
                  <Image
                    loader={shopifyLoader}
                    src={giftValue >= 10000
                      ? "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Web_Banner_10k.jpg?v=1781241879"
                      : "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Web_Banner_5k.jpg?v=1781241879"
                    }
                    alt="Free Gift Banner"
                    width={1200}
                    height={300}
                    className="w-full h-auto rounded-xl object-contain shadow-sm"
                  />
                </div>
              )}

              <div className="h-px bg-gray-200" />

              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-4 h-4 bg-success mt-1.5 shrink-0" />
                  <div>
                    <p className="text-base font-medium text-gray-900 leading-none">
                      Total Benefit Value
                    </p>
                    <p className="text-[11px] text-gray-500 italic mt-1.5">
                      (After 10 Months)
                    </p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-success">
                  ₹{formatINR(totalReturns)}
                </p>
              </div>

              <div className="flex justify-between items-center pt-2">
                <p className="text-base font-medium text-gray-700 ml-8">
                  You Actually Spend
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  ₹{formatINR(totalInstallment)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h4 className="text-lg font-medium text-gray-800 mb-8">
              Need Flexibility? Redeem Early After 6 Months
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {[
                { month: 7, discount: 25 },
                { month: 8, discount: 25 },
                { month: 9, discount: 25 },
                { month: 10, discount: 100 },
              ].map((item) => (
                <div
                  key={item.month}
                  className="group relative bg-white border border-gray-100 shadow-sm rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col">
                    <span className="text-black font-bold text-[13px]">
                      {item.month}th Month
                    </span>
                    <span className="text-accent font-bold text-base mt-1">
                      ₹
                      {new Intl.NumberFormat("en-IN").format(
                        getTotalValue(item.month, amount, item.discount)
                      )}
                    </span>
                  </div>
                  <div className="p-2 border-l border-gray-100">
                    <Info size={18} className="text-black cursor-help" />
                  </div>

                  <RedemptionTooltip
                    month={item.month}
                    amount={amount}
                    discountPercent={item.discount}
                    giftValue={giftValue}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="text-center text-xs px-10 border-t mt-16 py-6 text-gray-500">
        <p>
          If jewellery is more than ₹{formatINR(totalReturns)}, you just need to pay the
          difference amount at the time of purchase
        </p>
      </div>
    </section>
  );
};

export default DesktpSavingCalculator;
