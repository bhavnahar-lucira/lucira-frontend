"use client";

import Link from "next/link";
import Image from "next/image";
import { Lock, ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function CheckoutHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const steps = [
    { name: "Cart", path: "/checkout/cart" },
    { name: "Shipping", path: "/checkout/shipping" },
    { name: "Payment", path: "/checkout/payment" },
  ];

  const currentStepIndex = steps.findIndex((step) => pathname === step.path);
  const currentStep = steps[currentStepIndex] || { name: "Checkout" };

  return (
    <>
      {/* DESKTOP HEADER (LG) */}
      <header className="hidden lg:block border-b bg-white sticky top-0 z-50">
        <div className="container-main h-20 flex items-center justify-between">

          {/* Left: Logo */}
          <div className="flex-1">
            <Link prefetch={false} href="/">
              <Image
                src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/logo.svg"
                alt="Lucira"
                width={95}
                height={50}
                priority
              />
            </Link>
          </div>

          {/* Center: Progress Bar */}
          <div className="flex flex-col items-center justify-center flex-[2]">
            <div className="flex items-center w-full max-w-md">
              {steps.map((step, index) => {
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;
                const isDone = isActive || isCompleted;

                return (
                  <div key={step.name} className="flex items-center flex-1 last:flex-none">
                    {/* Step (circle + label) */}
                    <div className="flex flex-col items-center gap-2 flex-none">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-300 ${isDone
                          ? "bg-[#5A413F]"
                          : "border border-zinc-300 bg-white"
                          }`}
                      >
                        <span
                          className={`text-xs font-figtree ${isDone ? "text-white font-semibold" : "text-zinc-400 font-medium"
                            }`}
                        >
                          {index + 1}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] tracking-[0.08em] font-figtree whitespace-nowrap ${isDone ? "text-[#5A413F] font-semibold" : "text-zinc-400 font-medium"
                          }`}
                      >
                        {step.name.toUpperCase()}
                      </span>
                    </div>

                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-px mx-1.5 -mt-5.5 transition-colors duration-300 ${isCompleted ? "bg-[#5A413F]" : "bg-zinc-300"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Security & Login */}
          <div className="flex-1 flex items-center justify-end gap-4">
            <div className="flex items-center gap-2 rounded-full bg-[#18935112] text-[#189351] px-3.5 py-[7px]">
              <Lock size={12} strokeWidth={2.25} className="text-[#189351]" />
              <span className="text-xs font-bold uppercase tracking-[1px] text-[#189351] whitespace-nowrap">
                100% Secure
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE HEADER (SM/MD) */}
      <header className="lg:hidden h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 z-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-zinc-800"
          >
            <ArrowLeft size={24} strokeWidth={2} />
          </button>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <h1 className={"font-figtree font-semibold text-xl leading-none tracking-[0.3px] align-middle text-black capitalize"}>
            {currentStep.name === "Cart" ? "My Cart" : currentStep.name}
          </h1>
        </div>

        <div className={"font-figtree font-medium text-sm leading-none tracking-[0px] align-middle text-zinc-400"}>
          {currentStepIndex + 1}/{steps.length}
        </div>
      </header>
    </>
  );
}
