"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Info } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { pushPromoClick } from "@/lib/gtm";

const PRESETS = [2000, 5000, 10000, 19000];
const DEFAULT_AMOUNT = 10000;

const getTotalValue = (month, amount, rate) => {
  if (month === 10) {
    return amount * 9 + amount; // 9 paid + 1 bonus
  }
  const daysArrayMap = {
    7: [181, 150, 122, 91, 61, 30],
    8: [212, 181, 150, 122, 91, 61, 30],
    9: [242, 212, 181, 150, 122, 91, 61, 30],
  };
  const daysArray = daysArrayMap[month] || [];
  const interest = Math.ceil(
    daysArray.reduce((sum, d) => sum + (d / 365) * (rate / 100) * amount, 0)
  );
  return amount * (month - 1) + interest;
};

const RedemptionTooltip = ({ month, amount, discountPercent }) => {
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

  const totalValue = totalPayment + discountAmount;

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
          <p className="text-[#E67E22] font-bold text-base">
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

  const getInitialAmount = () => {
    if (amountParam && !isNaN(Number(amountParam))) {
      const num = Number(amountParam);
      return Math.max(2000, Math.min(19000, num));
    }
    return DEFAULT_AMOUNT;
  };

  const initialAmount = getInitialAmount();

  const inputRef = useRef(null);
  const [amountError, setAmountError] = useState("");
  const [amount, setAmount] = useState(initialAmount);
  const [inputValue, setInputValue] = useState(String(initialAmount));
  const [isAgreed, setIsAgreed] = useState(true);

  const totalInstallment = amount * 9;
  const bonus = amount;
  const totalReturns = totalInstallment + bonus;

  const normalizeValue = (val) => {
    const num = Math.max(2000, Math.min(19000, Number(val)));

    if (num % 500 !== 0) {
      inputRef.current?.focus();
      setAmountError("Amount must be in multiples of ₹500");
      return;
    }

    setAmount(num);
    setInputValue(String(num));
    setAmountError("");
  };

  const formatINR = (value) => new Intl.NumberFormat("en-IN").format(value);

  return (
    <section className="w-full max-w-7xl mx-auto px-6 mt-6 min-[1024px]:mt-20">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-10 md:gap-20 items-start">
        <div className="lg:sticky lg:top-28">
          <h3 className="text-xl font-medium mb-8 tracking-wider text-center">
            Adjust your monthly premium
          </h3>
          <div className="flex gap-4 mb-8 justify-center items-center">
            <div className="bg-gray-100 rounded-2xl px-8 py-4">
              <p className="text-3xl font-semibold text-gray-900">
                ₹{formatINR(inputValue)}
              </p>
            </div>
          </div>

          <Slider
            min={2000}
            max={19000}
            step={500}
            value={[amount]}
            onValueChange={([val]) => {
              setAmount(val);
              setInputValue(String(val));
              setAmountError("");
            }}
            className="mb-6"
          />

          <div className="text-center my-6 text-gray-500">Or</div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PRESETS.map((val) => (
              <div
                key={val}
                onClick={() => {
                  setAmount(val);
                  setInputValue(String(val));
                  setAmountError("");
                }}
                className={`h-12 cursor-pointer border-0 relative rounded-md flex justify-center items-center ${
                  amount === val ? "text-white border bg-primary" : "bg-gray-100"
                }`}
              >
                ₹{val.toLocaleString()}
                {val === 10000 && (
                  <span className="text-xs opacity-80 absolute left-1/2 top-0 transform -translate-x-1/2 pt-12 h-18 border border-primary w-full rounded-md text-primary flex justify-center items-center">
                    Popular
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center items-center mt-15">
            <button
              disabled={!!amountError}
              className={`flex items-center gap-2 px-8 w-[60%] h-12 mx-auto rounded-md text-base uppercase justify-center
                ${
                  amountError || !isAgreed
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-primary text-white cursor-pointer"
                }`}
              onClick={async () => {
                if (amountError || !isAgreed) return;

                // Fire dataLayer promoClick event
                try {
                  pushPromoClick({
                    creative_name: "scheme page Continue cta",
                    location_id: "schemes page",
                    promo_id: String(amount),
                    promo_name: user?.mobile || "",
                  });
                } catch (error) {
                  console.error("Error pushing to dataLayer:", error);
                }

                if (isAuthenticated) {
                  router.push(`/schemes/enroll?amount=${amount}`);
                } else {
                  openLogin(`/schemes/enroll?amount=${amount}`);
                }
              }}
            >
              Continue
            </button>
          </div>

          <label className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-600 hover:cursor-pointer">
            <Checkbox
              checked={isAgreed}
              onCheckedChange={(val) => setIsAgreed(!!val)}
              className="border-black"
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
          <h3 className="text-xl font-medium mb-8 tracking-wider text-center">
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

              <div className="h-px bg-gray-200" />

              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-4 h-4 bg-[#008000] mt-1.5 shrink-0" />
                  <div>
                    <p className="text-base font-medium text-gray-900 leading-none">
                      Total Benefit Value
                    </p>
                    <p className="text-[11px] text-gray-500 italic mt-1.5">
                      (After 10 Months)
                    </p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#008000]">
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
                    <span className="text-[#E67E22] font-bold text-base mt-1">
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
