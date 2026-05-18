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
            <Link href="/">
              <Image 
                src="/images/logo.svg" 
                alt="Lucira" 
                width={120} 
                height={50} 
                priority
              />
            </Link>
          </div>

          {/* Center: Progress Bar */}
          <div className="flex flex-col items-center justify-center flex-2">
            <div className="flex items-center w-full max-w-md">
              {steps.map((step, index) => {
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;

                return (
                  <div key={step.name} className="flex-1 flex flex-col items-center">
                    {/* Step Label */}
                    <span className={`text-[11px] font-bold uppercase tracking-widest mb-2 font-figtree transition-colors duration-300 ${
                      isActive ? "text-primary" : "text-zinc-400"
                    }`}>
                      {step.name}
                    </span>

                    {/* Circle & Line Container */}
                    <div className="relative flex items-center justify-center w-full">
                      {/* Connector Line */}
                      {index < steps.length - 1 && (
                        <div className="absolute left-[50%] w-full h-px bg-zinc-200">
                           <div 
                            className="h-full bg-green-600 transition-all duration-500 ease-in-out" 
                            style={{ width: isCompleted ? '100%' : '0%' }}
                          />
                        </div>
                      )}

                      {/* Step Circle */}
                      <div className={`w-4.5 h-4.5 rounded-full border-2 z-10 bg-white transition-colors duration-300 flex items-center justify-center ${
                        isActive || isCompleted ? "border-green-600" : "border-zinc-300"
                      }`}>
                        {(isActive || isCompleted) && (
                          <div className="w-2 h-2 bg-green-600 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Security & Login */}
          <div className="flex-1 flex items-center justify-end gap-4">            
            <div className="flex items-center gap-2 text-zinc-500">
              <Lock size={16} className="text-zinc-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap">
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
          <h1 className="text-[15px] font-bold text-[#443360] tracking-tight uppercase">
            {currentStep.name}
          </h1>
        </div>

        <div className="text-[12px] font-bold text-zinc-400 tracking-wider">
          {currentStepIndex + 1}/{steps.length}
        </div>
      </header>
    </>
  );
}
