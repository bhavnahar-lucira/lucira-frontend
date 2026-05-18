"use client";

import Marquee from "react-fast-marquee";

export default function LuxuryMarquee({ prop = [] }) {
  const items = [
    "Personalized Jewelry, Made For You",
    "Fast & Secure Shipping",
    "Quality Control & Assurance",
    "Bespoke Experience",
  ];

  const StarIcon = () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_1043_55624)">
        <path fillRule="evenodd" clipRule="evenodd" d="M8.31023 0.685779C7.97773 -0.228598 6.68455 -0.228588 6.35205 0.68578L4.84105 4.84104L0.685778 6.35205C-0.228598 6.68455 -0.228588 7.97772 0.68578 8.31022L4.84105 9.82123L6.35205 13.9765C6.68455 14.8908 7.97773 14.8908 8.31023 13.9765L9.82123 9.82123L13.9765 8.31022C14.8909 7.97772 14.8909 6.68455 13.9765 6.35205L9.82123 4.84104L8.31023 0.685779Z" fill="currentColor"></path>
      </g>
      <defs>
        <clipPath id="clip0_1043_55624">
          <rect width="14.6623" height="14.6623" fill="white"></rect>
        </clipPath>
      </defs>
    </svg>
  );

  // 👉 find bg class dynamically
  const bgClass = prop.find(cls => cls.startsWith("bg-")) || "bg-primary";

  // 👉 convert bg-secondary → from-secondary
  const gradientFrom = bgClass.replace("bg-", "from-");

  // 👉 Handle independent icon color if passed via icon- prefix (e.g., icon-[#5A413F])
  const iconColorClass = prop.find(c => c.startsWith("icon-"))?.replace("icon-", "text-") || "";
  const containerProp = prop.filter(c => !c.startsWith("icon-"));

  return (
    <div className={`relative py-4 overflow-hidden ${containerProp.join(" ")}`}>
      
      <div className={`pointer-events-none absolute left-0 top-0 h-full w-24 bg-linear-to-r ${gradientFrom} to-transparent z-10`}></div>
      <div className={`pointer-events-none absolute right-0 top-0 h-full w-24 bg-linear-to-l ${gradientFrom} to-transparent z-10`}></div>

      <Marquee
        speed={80}
        pauseOnHover={true}
        gradient={false}
        autoFill={true}
      >
        {items.map((item, i) => (
          <div key={`item-${i}`} className="flex items-center gap-10 pr-10 whitespace-nowrap">
            <span className="font-semibold italic text-xl leading-[100%] tracking-normal">
              {item}
            </span>
            <div className={iconColorClass}>
              <StarIcon />
            </div>
          </div>
        ))}
      </Marquee>

    </div>
  );
}