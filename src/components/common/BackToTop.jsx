"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function BackToTop() {
  const pathname = usePathname();

  const [visible, setVisible] = useState(false);
  const [scrollDirection, setScrollDirection] = useState("up");

  const lastScrollY = useRef(0);

  // Allowed pages
  const allowedRoutes = [
    /^\/$/,
    /^\/collections\/[^/]+$/,
    /^\/products\/[^/]+$/,
    /^\/search$/,
  ];

  const shouldShowOnPage = allowedRoutes.some((route) =>
    route.test(pathname)
  );

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current) {
        setScrollDirection("down");
      } else {
        setScrollDirection("up");
      }
      
      if (currentScrollY > 500) {
        setVisible(true);
      } else {
        setVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!shouldShowOnPage) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={cn(
        "fixed bottom-80 right-5 md:right-7.5 z-100",
        "h-12.5 w-12.5 rounded-full",
        "bg-black text-white",
        "shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
        "backdrop-blur-md",
        "flex items-center justify-center",
        "transition-all duration-300 ease-out",
        "hover:scale-105 active:scale-95",
        visible && scrollDirection === "up"
          ? "translate-y-0 opacity-100"
          : "translate-y-5 opacity-0 pointer-events-none"
      )}
    >
      <ChevronUp
        size={18}
        className="transition-transform duration-300 group-hover:-translate-y-0.5"
      />
    </button>
  );
}