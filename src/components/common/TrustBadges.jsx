import { RotateCcw, Calendar, BadgeCheck, RefreshCw } from "lucide-react";

export default function TrustBadges({ className = "" }) {
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

  return (
    <div className={`grid w-full grid-cols-2 gap-x-4 gap-y-5 lg:flex lg:w-auto lg:flex-wrap lg:items-center lg:justify-start lg:gap-8 xl:gap-12 ${className}`}>
      {trustBadges.map((badge, index) => (
        <div key={index} className="flex items-center gap-2.5 lg:gap-3">
          <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-[8px] flex items-center justify-center shrink-0 ${badge.bgColor}`}>
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
  );
}
