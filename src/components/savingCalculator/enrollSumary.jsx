"use client";

import { useRef, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CircleCheck } from "lucide-react";


const DEFAULT_AMOUNT = 10000;
const MIN_AMOUNT = 2000;
const MAX_AMOUNT = 19000;
const STEP = 500;
const MONTHS = 9;

export default function EnrollSummary({nominee_name, nominee_age, nominee_relation}) {   
  
  /* ===================== REDUX ===================== */
  const customer = useSelector((s) => s.user?.user);
  const enrollment = null;

  const enrolledAmount =
    enrollment?.amount ??
    customer?.enrollment_draft?.amount ??
    null;

  /* ===================== STATE ===================== */
  const inputRef = useRef(null);
  const hasUserInteracted = useRef(false);

  const [amount, setAmount] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [amountError, setAmountError] = useState("");

  /* ===================== SYNC REDUX → LOCAL ===================== */
  useEffect(() => {
    if (enrolledAmount && !hasUserInteracted.current) {
      setAmount(enrolledAmount);
      setInputValue(String(enrolledAmount));
    }
  }, [enrolledAmount]);

  /* ===================== FALLBACK (IMPORTANT) ===================== */
  const displayAmount = amount ?? DEFAULT_AMOUNT;

  /* ===================== CALCULATIONS ===================== */
  const monthly = displayAmount;
  const totalInstallment = monthly * MONTHS;
  const bonus = monthly;
  const returns = totalInstallment + bonus;

  /* ===================== HELPERS ===================== */
  const normalizeValue = async (val) => {
    const num = Math.max(
      MIN_AMOUNT,
      Math.min(MAX_AMOUNT, Number(val))
    );

    if (!num || num % STEP !== 0) {
      inputRef.current?.focus();
      setAmountError("Amount must be in multiples of ₹500");
      return;
    }

    hasUserInteracted.current = true;
    setAmount(num);
    setInputValue(String(num));
    setAmountError("");
    await saveDraft(num);
    
  };

  const formatINR = (value) =>
    new Intl.NumberFormat("en-IN").format(value);

  /* ===================== UI ===================== */

   /* ===== SAVE TO SESSION ===== */
  const saveDraft = async (value) => {
    await fetch("/api/session/update-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enrollment_draft: {
          amount: value,
          tenure: MONTHS,
          nominee_name: nominee_name,
          nominee_age: nominee_age,
          nominee_relation: nominee_relation,
        },
      }),
    });
  };

  return (
    <div>
      <h3 className="text-xl font-medium mb-8 tracking-wider text-center">
        Premium Summary
      </h3>

      {/* ===================== SUMMARY ===================== */}
      <div className="bg-[#f6f1ee] rounded-2xl px-4 py-6 md:px-4 md:py-6">
        <ul className="space-y-3 md:space-y-5 text-gray-800">
          <li className="flex justify-between items-center text-[14px] md:text-base">
            <span className="flex items-center gap-2">
              <CircleCheck
                size={20}
                strokeWidth={1.25}
                className="fill-green-600 stroke-white"
              />
              Your Premium amount / month
            </span>
            <strong>₹{formatINR(monthly)}</strong>
          </li>

          <li className="flex justify-between items-center text-[14px] md:text-base">
            <span className="flex items-center gap-2">
              <CircleCheck
                size={20}
                strokeWidth={1.25}
                className="fill-green-600 stroke-white"
              />
              Total Installment ({MONTHS} months)
            </span>
            <strong>₹{formatINR(totalInstallment)}</strong>
          </li>

          <li className="flex justify-between items-center text-[14px] md:text-base">
            <span className="flex items-center gap-2">
              <CircleCheck
                size={20}
                strokeWidth={1.25}
                className="fill-green-600 stroke-white"
              />
              We Pay your {MONTHS + 1}th Premium
            </span>
            <strong>₹{formatINR(bonus)}</strong>
          </li>
        </ul>

        <hr className="my-4 md:my-6 border-gray-300" />

        <div className="flex justify-between items-center text-xl">
          <span>Your Total Returns</span>
          <span className="text-green-600 font-semibold">
            ₹{formatINR(returns)}
          </span>
        </div>
      </div>

      {/* ===================== INPUT + SLIDER ===================== */}
      <div className="w-full bg-white mt-8">
        <h3 className="text-xl font-medium mb-8 tracking-wider text-center">Adjust your monthly premium</h3>
        <section className="text-center mb-12">
          <div className="flex gap-4 mb-2">
            {/* Rupee Input */}
            <div className="relative w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg pointer-events-none">
                ₹
              </span>

              <Input
                ref={inputRef}
                type="number"
                value={inputValue || displayAmount}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={() =>
                  normalizeValue(inputValue || displayAmount)
                }
                className="text-lg h-12 pl-10 appearance-none
                  [&::-webkit-inner-spin-button]:appearance-none
                  [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>

            <Button
              size="lg"
              className="h-12 cursor-pointer"
              onClick={() =>
                normalizeValue(inputValue || displayAmount)
              }
            >
              CHECK
            </Button>
          </div>
          {/* Slider */}
          <div className="mt-8">
          <Slider
            min={MIN_AMOUNT}
            max={MAX_AMOUNT}
            step={STEP}
            value={[displayAmount]}
            onValueChange={async ([val]) => {
              hasUserInteracted.current = true;
              setAmount(val);
              setInputValue(String(val));
              setAmountError(""); 
              await saveDraft(val);  
                                      
            }}
            className="mb-6
              **:data-[slot=slider-thumb]:size-6
              **:data-[slot=slider-thumb]:border-3
              **:data-[slot=slider-thumb]:cursor-pointer"
          />
          </div>
           {amountError && (
            <p className="text-red-500 text-sm mt-5">
              {amountError}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
