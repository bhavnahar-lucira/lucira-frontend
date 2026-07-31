import { RotateCcw, Calendar, BadgeCheck, RefreshCw } from "lucide-react";
import Image from "next/image";

export default function CheckoutFooter() {
  const trustBadges = [
    {
      icon: <RotateCcw size={18} className="text-[#5A413F]" />,
      text: "15 Day Exchange",
      bgColor: "bg-[#FEF9F6] border border-[#EADFD8]",
    },
    {
      icon: <Calendar size={18} className="text-[#5A413F]" />,
      text: "100% Certified",
      bgColor: "bg-[#FEF9F6] border border-[#EADFD8]",
    },
    {
      icon: <BadgeCheck size={18} className="text-[#5A413F]" />,
      text: "Lifetime Exchange",
      bgColor: "bg-[#FEF9F6] border border-[#EADFD8]",
    },
    {
      icon: <RefreshCw size={18} className="text-[#5A413F]" />,
      text: "One Year Warranty",
      bgColor: "bg-[#FEF9F6] border border-[#EADFD8]",
    },
  ];

  const paymentIcons = [
    { name: "VISA", src: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Icon_visa.svg" },
    { name: "MASTERCARD", src: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Icon_mastercard.svg" },
    { name: "RUPAY", src: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Icons_rupay.svg" },
    { name: "UPI", src: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Icon_upi.svg" },
  ];

  return (
    <footer className="mt-auto border-t bg-zinc-50 py-8 mb-20 lg:mb-0">
      <div className="container-main flex flex-col xl:flex-row items-center justify-between gap-8">
        
        {/* Left: Trust Badges */}
        <div className="grid w-full grid-cols-2 gap-x-4 gap-y-5 lg:flex lg:w-auto lg:flex-wrap lg:items-center lg:justify-start lg:gap-8 xl:gap-12">
          {trustBadges.map((badge, index) => (
            <div key={index} className="flex items-center gap-2.5 lg:gap-3">
              <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-sm flex items-center justify-center shrink-0 ${badge.bgColor}`}>
                {badge.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] lg:text-sm font-semibold text-[#3D2B28] uppercase tracking-wide font-figtree leading-tight">
                  {badge.text}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Payment Icons */}
        <div className="flex items-center gap-5 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300 flex-wrap justify-center pt-2 lg:pt-0">
          {paymentIcons.map((icon) => (
            <Image 
              key={icon.name} 
              src={icon.src} 
              alt={icon.name} 
              height={22}
              width={44}
              className="h-[22px] w-auto object-contain"
            />
          ))}
        </div>

      </div>
    </footer>
  );
}
