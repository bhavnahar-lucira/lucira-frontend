"use client";
import React from "react";
import { IndianRupee, Gift, ShoppingBag } from "lucide-react";

const SchemeHowItWorks = () => {
  const steps = [
    {
      icon: IndianRupee,
      title: "START MONTHLY PAYMENTS",
      description: "Pay In 9 Easy Installments Simple And Flexible.",
    },
    {
      icon: Gift,
      title: "UNLOCK YOUR REWARD",
      description: "Complete Payments And Get The 10th Benefit On Us.",
    },
    {
      icon: ShoppingBag,
      title: "REDEEM & SHOP",
      description: "Your Reward Is Auto-Applied Shop Online Or In-Store.",
    },
  ];

  return (
    <section className="w-full mx-auto mb-12 md:mb-12 md:py-10 bg-white">
      {/* Header section */}
      <div className="text-center mb-8 md:mb-10 max-w-[92%] mx-auto">
        <h2 className="text-xl md:text-2xl tracking-wide font-medium mb-3 uppercase text-black">
          HOW DOES IT WORK
        </h2>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block w-full overflow-hidden">
        <div className="relative flex items-center w-full">
          {/* Continuous Horizontal Line */}
          <div className="absolute top-12.5 left-0 w-full h-px bg-gray-300 z-0" />

          <div className="flex w-full items-start px-[4%] relative z-10">
            {/* Left Box */}
            <div className="w-[30%] bg-white border-l border-r border-black py-10 px-8 mr-12 min-h-40 flex items-center">
              <h3 className="text-2xl lg:text-[28px] font-normal leading-[1.3] tracking-[0.05em] uppercase text-black">
                FLEXIBLE PAYMENTS.
                <br />
                ZERO HASSLE.
                <br />
                3 SIMPLE STEPS.
              </h3>
            </div>

            {/* Steps */}
            <div className="w-[70%] flex justify-between pt-2">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center text-center w-1/3 px-4"
                >
                  {/* Icon with white background to hide line behind it */}
                  <div className="w-20 h-20 rounded-full bg-[#E8E8E8] flex items-center justify-center mb-6 border-[3px] border-white shadow-sm relative z-20">
                    <step.icon
                      size={28}
                      strokeWidth={1.2}
                      className="text-black"
                    />
                  </div>

                  <div className="mt-2">
                    <h4 className="text-base font-medium mb-2 uppercase text-black">
                      {step.title}
                    </h4>
                    <div className="flex flex-col items-center w-[70%] mx-auto">
                      <p className="text-sm text-[#1A1A1A] tracking-[0.02em] leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col items-start px-3">
        <div className="relative flex flex-col gap-10 w-full">
          {/* Vertical line */}
          <div className="absolute left-6.75 top-8 bottom-8 w-[1.5px] bg-black" />

          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-6 relative z-10">
              <div className="w-15 h-15 rounded-full bg-[#E5E5E5] flex shrink-0 items-center justify-center border-2 border-white shadow-sm">
                <step.icon
                  size={22}
                  strokeWidth={1.2}
                  className="text-black"
                />
              </div>
              <div className="flex flex-col">
                <h4 className="text-sm font-semibold tracking-widest uppercase mb-1 text-black">
                  {step.title}
                </h4>
                <p className="text-xs text-[#1A1A1A] tracking-[0.01em] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SchemeHowItWorks;
