"use client";

import { useRef, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircleCheck, TrendingUp, Gift, Calendar, ArrowRight, IndianRupee, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


const DEFAULT_AMOUNT = 10000;
const MIN_AMOUNT = 2000;
const MAX_AMOUNT = 19000;
const STEP = 500;
const MONTHS = 9;

export default function EnrollSummary({
  nominee_name,
  nominee_age,
  nominee_relation,
  amount: controlledAmount,
  onAmountChange,
}) {   
  
  /* ===================== REDUX ===================== */
  const customer = useSelector((s) => s.user?.user);
  const enrollment = customer?.enrollment_draft || null;

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

  useEffect(() => {
    if (controlledAmount === undefined || controlledAmount === null) return;
    if (!hasUserInteracted.current) {
      setAmount(controlledAmount);
      setInputValue(String(controlledAmount));
    }
  }, [controlledAmount]);

  /* ===================== FALLBACK (IMPORTANT) ===================== */
  const displayAmount = amount ?? controlledAmount ?? DEFAULT_AMOUNT;

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
    onAmountChange?.(num);
    await saveDraft(num);
    
  };

  const formatINR = (value) =>
    new Intl.NumberFormat("en-IN").format(value);

  /* ===================== UI ===================== */

   /* ===== SAVE TO SESSION ===== */
  const saveDraft = async (value) => {
    try {
      sessionStorage.setItem(
        "scheme_enrollment",
        JSON.stringify({
          amount: value,
          tenure: MONTHS,
          nominee_name,
          nominee_age,
          nominee_relation,
        })
      );
    } catch (error) {
      // Ignore storage failures in local-only persistence.
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold tracking-tight text-gray-900">
          Premium Summary
        </h3>
        <p className="text-gray-500 text-sm">
          Review your investment and expected returns.
        </p>
      </div>

      {/* ===================== SUMMARY CARD ===================== */}
      <Card className="border-none bg-gradient-to-br from-[#FDFCFB] to-[#E2D1C3]/20 shadow-sm overflow-hidden">
        <CardContent className="p-6 md:p-8 space-y-6">
          <ul className="space-y-4">
            <motion.li 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex justify-between items-center group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                  <CircleCheck size={18} className="text-green-600" />
                </div>
                <span className="text-sm md:text-base text-gray-700 font-medium">Monthly Premium</span>
              </div>
              <strong className="text-lg">₹{formatINR(monthly)}</strong>
            </motion.li>

            <motion.li 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex justify-between items-center group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                  <Calendar size={18} className="text-blue-600" />
                </div>
                <span className="text-sm md:text-base text-gray-700 font-medium">Total Installments ({MONTHS} mo)</span>
              </div>
              <strong className="text-lg">₹{formatINR(totalInstallment)}</strong>
            </motion.li>

            <motion.li 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-between items-center group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                  <Gift size={18} className="text-amber-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm md:text-base text-gray-700 font-medium">10th Month Bonus</span>
                  <span className="text-[10px] text-amber-600 font-bold uppercase tracking-tighter">We Pay for you!</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <strong className="text-lg text-amber-600">₹{formatINR(bonus)}</strong>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px] hover:bg-amber-100 border-none">FREE</Badge>
              </div>
            </motion.li>
          </ul>

          <div className="pt-6 mt-6 border-t border-dashed border-gray-300">
            <div className="flex justify-between items-end bg-white/50 p-4 rounded-xl border border-white">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-green-600" />
                  <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Total Returns</span>
                </div>
                <p className="text-[10px] text-gray-400">Total value after 10 months</p>
              </div>
              <motion.span 
                key={returns}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="text-2xl md:text-3xl font-black text-green-600"
              >
                ₹{formatINR(returns)}
              </motion.span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===================== ADJUSTMENT AREA ===================== */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-gray-400" />
            Adjust Monthly Premium
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="flex flex-col gap-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">
                  ₹
                </span>
                <Input
                  ref={inputRef}
                  type="number"
                  value={inputValue || displayAmount}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={() => normalizeValue(inputValue || displayAmount)}
                  className="text-lg font-bold h-12 pl-8 border-gray-200 focus:ring-black focus:border-black appearance-none
                    [&::-webkit-inner-spin-button]:appearance-none
                    [&::-webkit-outer-spin-button]:appearance-none transition-all"
                />
              </div>
              <Button
                size="lg"
                className="h-12 bg-black hover:bg-gray-800 transition-all cursor-pointer px-6"
                onClick={() => normalizeValue(inputValue || displayAmount)}
              >
                UPDATE
              </Button>
            </div>

            <div className="space-y-4 px-2">
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
                  onAmountChange?.(val);
                  await saveDraft(val);  
                }}
                className="**:data-[slot=slider-thumb]:size-6 **:data-[slot=slider-thumb]:border-4 **:data-[slot=slider-thumb]:border-white **:data-[slot=slider-thumb]:bg-black **:data-[slot=slider-thumb]:shadow-lg **:data-[slot=slider-thumb]:cursor-grab active:**:data-[slot=slider-thumb]:cursor-grabbing"
              />
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                <span>₹{formatINR(MIN_AMOUNT)}</span>
                <span>₹{formatINR(MAX_AMOUNT)}</span>
              </div>
            </div>

            <AnimatePresence>
              {amountError && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-500 text-xs font-medium flex items-center gap-1"
                >
                  <CircleCheck size={12} className="rotate-45" />
                  {amountError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex gap-3">
        <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          The 10th month installment is completely free! For example, if you pay ₹10,000 for 9 months, we add ₹10,000 bonus, making your total gold value ₹1,00,000.
        </p>
      </div>
    </div>
  );
}
