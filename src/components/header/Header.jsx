"use client";

import { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

import TopBar from "./TopBar";
import MainHeader from "./MainHeader";
import Navbar from "./Navbar";
import MobileHeader from "./MobileHeader";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TOP_HEIGHT = 40;
const HEADER_HEIGHT = 96;

export default function Header() {
  const pathname = usePathname();
  const [hideTop, setHideTop] = useState(false);
  const { scrollY } = useScroll();
  const isMobile = useMediaQuery("(max-width: 1023px)");

  useMotionValueEvent(scrollY, "change", (y) => {
    setHideTop(y > 120);
  });

  if (pathname?.startsWith("/dashboard")) return null;

  if (isMobile) {
      return (
        <header 
          className="w-full z-[100] bg-white sticky"
          style={{ top: '-104px' }} // Hides TopBar (40px) + Logo Row (64px) on scroll
        >
          <TopBar />
          <MobileHeader />
        </header>
      );
    }



  return (
    <>
      {/* Placeholder to prevent layout jump */}
      <div className="h-40" />

      <header className={cn("fixed top-0 left-0 w-full z-[100] bg-white border-b border-gray-100", hideTop && "sticky-header-active")}>

        {/* Announcement Bar */}
        <motion.div
          animate={{
            height: hideTop ? 0 : "auto",
            opacity: hideTop ? 0 : 1,
          }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <TopBar />
        </motion.div>

        {/* Main Header */}
        <motion.div
          animate={{
            height: hideTop ? 0 : "auto",
            opacity: hideTop ? 0 : 1,
            visibility: hideTop ? "hidden" : "visible",
          }}
          transition={{ duration: 0.25 }}
          className={cn("relative z-20", hideTop ? "overflow-hidden" : "overflow-visible")}
        >
          <MainHeader />
        </motion.div>

        {/* Navbar always visible */}
        <div className="relative z-10">
          <Navbar hideTop={hideTop} />
        </div>

      </header>
    </>
  );
}