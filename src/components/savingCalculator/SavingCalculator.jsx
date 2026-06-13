"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CircleCheck, Headphones } from 'lucide-react';
import { EnrollModal } from "./enrollModal";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { setEnrollment } from "@/redux/slices/enrollmentSlice";

const PRESETS = [2000, 5000, 10000, 19000];
const DEFAULT_AMOUNT = 10000;

const SavingCalculator = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const customer = useSelector(s => s.customer.customer);
    const inputRef = useRef(null);
    const [amountError, setAmountError] = useState("");
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState(DEFAULT_AMOUNT);
    const [inputValue, setInputValue] = useState(String(DEFAULT_AMOUNT));

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
      setAmountError();
    };

    const formatINR = (value) =>
    new Intl.NumberFormat("en-IN").format(value);
  return (
    
      <section className="w-full max-w-7xl mx-auto px-6  mt-6 min-[1024px]:mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-10 md:gap-20 items-start">
          {/* Left Section */}
          <div>
            <h3 className="text-xl font-medium mb-8 tracking-wider text-center">Adjust your monthly premium</h3>
            <label className="block mb-2 text-sm text-gray-700">Monthly Installment</label>
            <div className="flex gap-4 mb-8">
                {/* Rupee Input */}
                <div className="relative w-full">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg pointer-events-none">₹</span>
                    <Input
                    ref={inputRef}
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={() => normalizeValue(inputValue)}
                    className="text-lg h-12 pl-10 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                </div>
                <Button className="text-white cursor-pointer text-sm h-12" size="lg" onClick={() => normalizeValue(inputValue)}>CHECK</Button>
            </div>           

            {/*Slider*/}
            <Slider min={2000} max={19000} step={500} value={[amount]}  onValueChange={([val]) => {
                setAmount(val);
                setInputValue(String(val));
                setAmountError(); 
              }}
              className="mb-6
                **:data-[slot=slider-thumb]:size-6
                **:data-[slot=slider-thumb]:border-3
                **:data-[slot=slider-thumb]:cursor-pointer"
            />

            <div className="text-center my-6 text-gray-500">Or</div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {PRESETS.map((val) => (
                <div key={val} onClick={() => { setAmount(val); setInputValue(String(val)); }}
                  className={`h-12 cursor-pointer border-0 relative bg-gray-200 rounded-md flex justify-center items-center ${
                    amount === val
                      ? "text-white border bg-primary"
                      : "bg-gray-100"
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
                disabled={amountError}
                className={`flex items-center gap-2 px-8 w-[60%] h-12 mx-auto rounded-md text-base uppercase justify-center
                ${amountError ? "bg-gray-400 cursor-not-allowed" : "bg-primary text-white cursor-pointer"}`}
                onClick={async () => {
                  if (amountError) return;
                  if (customer?.mobile) {
                    const enrollmentPayload = {
                      amount,
                      tenure: 9
                    };
                    dispatch(setEnrollment(enrollmentPayload));
                    // ✅ Logged-in user → update draft only
                    await fetch("/api/session/update-draft", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        enrollment_draft: {
                          amount,
                          tenure: 9,
                        },
                      }),
                    });

                    router.push("/enroll");
                  } else {
                    // ❌ Not logged in → open login modal
                    setOpen(true);
                  }
                }}
              >
                Continue
              </button>
            </div>

            {amountError && (
              <p className="text-sm text-red-500 mt-2 text-center">{amountError}</p>
            )}
            <EnrollModal open={open} onOpenChange={setOpen} amount={amount} />
          </div>
          <div className="hidden lg:block w-px bg-gray-300 h-full"></div>
          {/* Right Section */}
          <div>
            <h3 className="text-xl font-medium mb-8 tracking-wider text-center">Estimated Premium Summary</h3>
            <div className="bg-[#f6f1ee] rounded-2xl p-8">              
              <ul className="space-y-5 text-gray-800 text-[12px] md:text-base">
                <li className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span> <CircleCheck size={20} strokeWidth={1.25} className="fill-green-600 stroke-white"/></span>
                    Your Premium amount/month
                  </span>
                  <strong>₹{formatINR(amount)}</strong>
                </li>
                <li className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span> <CircleCheck size={20} strokeWidth={1.25} className="fill-green-600 stroke-white"/></span>
                    Total Installment (9 months)
                  </span>
                  <strong>₹{formatINR(totalInstallment)}</strong>
                </li>
                <li className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span> <CircleCheck size={20} strokeWidth={1.25} className="fill-green-600 stroke-white"/></span>
                    We Pay your 10th Premium
                  </span>
                  <span className="flex justify-end items-center font-normal gap-0.5">
                    <strong>₹{formatINR(bonus)}</strong>
                  </span>
                </li>
              </ul>
              <hr className="my-6 border-gray-300" />
              <div className="flex justify-between items-center text-base md:text-xl font-normal">
                <span>Your Total Returns</span>
                <span className="text-green-600 flex justify-end items-center font-semibold gap-0.5">
                  <strong>₹{formatINR(totalReturns)}</strong>
                </span>
              </div>
            </div>
            {/* <div className="w-full bg-white mt-8 md:mt-20">
              <section className="text-center mb-12">
                <h2 className="text-base md:text-2xl tracking-wide font-medium mb-4 md:mb-8 uppercase">
                  STILL CONFUSED? LET US GUIDE YOU
                </h2>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-xl mx-auto">
                  <input
                    type="tel"
                    placeholder="MOBILE NUMBER"
                    className="w-full sm:w-60 h-12 px-4 border border-gray-500 rounded-md outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                  />
      
                  <button className="flex items-center gap-2 bg-primary text-white px-8 h-12 rounded-md cursor-pointer text-base uppercase">
                    <Headphones size={18} />
                    TALK TO AN EXPERT
                  </button>
                </div>
              </section>
            </div> */}
          </div>
        </div>
      </section>
  )
}

export default SavingCalculator