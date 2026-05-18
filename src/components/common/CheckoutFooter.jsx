import { RotateCcw, Calendar, BadgeCheck, RefreshCw } from "lucide-react";
import Image from "next/image";

export default function CheckoutFooter() {
  const trustBadges = [
    {
      icon: <RotateCcw size={20} className="text-blue-600" />,
      text: "15 Day Exchange",
      subtext: "On Online Orders",
      bgColor: "bg-blue-50",
    },
    {
      icon: <Calendar size={20} className="text-pink-600" />,
      text: "100% Certified",
      bgColor: "bg-pink-50",
    },
    {
      icon: <BadgeCheck size={20} className="text-green-600" />,
      text: "Lifetime Exchange",
      bgColor: "bg-green-50",
    },
    {
      icon: <RefreshCw size={20} className="text-yellow-600" />,
      text: "One Year Warranty",
      bgColor: "bg-yellow-50",
    },
  ];

  const paymentIcons = [
    { name: "VISA", src: "/images/icons/visa.svg" },
    { name: "MASTERCARD", src: "/images/icons/mastercard.svg" },
    { name: "RUPAY", src: "/images/icons/rupay.svg" },
    { name: "UPI", src: "/images/icons/upi.svg" },
  ];

  return (
    <footer className="mt-auto border-t bg-zinc-50 py-8 mb-20 lg:mb-0">
      <div className="container-main flex flex-col xl:flex-row items-center justify-between gap-8">
        
        {/* Left: Trust Badges */}
        <div className="grid w-full grid-cols-2 gap-x-3 gap-y-4 lg:flex lg:w-auto lg:flex-wrap lg:items-center lg:justify-start lg:gap-8 xl:gap-12">
          {trustBadges.map((badge, index) => (
            <div key={index} className="flex items-center gap-1 lg:gap-3">
              <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center shrink-0 ${badge.bgColor}`}>
                {badge.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-xs lg:text-sm font-bold text-black/70 uppercase tracking-tight font-figtree leading-tight">
                  {badge.text}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Payment Icons */}
        <div className="flex items-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-300 flex-wrap justify-center">
          {paymentIcons.map((icon) => (
            <Image 
              key={icon.name} 
              src={icon.src} 
              alt={icon.name} 
              height={20}
              width={40}
              className="h-5 w-auto object-contain"
            />
          ))}
        </div>

      </div>
    </footer>
  );
}
