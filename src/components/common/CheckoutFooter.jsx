import { RotateCcw, BadgeCheck, RefreshCw, ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function CheckoutFooter() {
  const trustBadges = [
    {
      icon: <RotateCcw size={20} className="text-primary" />,
      text: "15 Day Exchange",
    },
    {
      icon: <BadgeCheck size={20} className="text-primary" />,
      text: "100% Certified",
    },
    {
      icon: <RefreshCw size={20} className="text-primary" />,
      text: "Lifetime Exchange",
    },
    {
      icon: <ShieldCheck size={20} className="text-primary" />,
      text: "One Year Warranty",
    },
  ];

  const paymentIcons = [
    { name: "VISA", src: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Icon_visa.svg" },
    { name: "MASTERCARD", src: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Icon_mastercard.svg" },
    { name: "RUPAY", src: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Icons_rupay.svg" },
    { name: "UPI", src: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Icon_upi.svg" },
  ];

  return (
    <footer className="mt-auto border-t bg-zinc-50 py-8 lg:mb-0" style={{ marginBottom: 0, paddingBottom: "30px" }}>
      <div className="container-main flex flex-col xl:flex-row items-center justify-between gap-8">
        
        {/* Left: Trust Badges */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-4 w-full lg:flex lg:w-auto lg:items-center lg:justify-start lg:gap-8 xl:gap-12">
          {trustBadges.map((badge, index) => (
            <div key={index} className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1.5 lg:gap-3 text-center lg:text-left">
              <div 
                className="flex items-center justify-center shrink-0"
                style={{ background: "transparent", height: "20px", width: "20px" }}
              >
                {badge.icon}
              </div>
              <div className="flex flex-col">
                <span 
                  className="text-[10px] sm:text-xs lg:text-sm text-black/70 uppercase font-figtree leading-tight"
                  style={{ letterSpacing: "0.4px", fontWeight: 700 }}
                >
                  {badge.text}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Payment Icons */}
        <div 
          className="flex items-center gap-6 transition-all duration-300 flex-wrap justify-center w-full xl:w-auto mt-0 pt-[30px] xl:pt-0 border-t border-[#eaeaea] xl:border-t-0"
        >
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
