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

export default function Header({ menuData }) {
  const pathname = usePathname();
  const [hideTop, setHideTop] = useState(false);
  const { scrollY } = useScroll();
  const isMobile = useMediaQuery("(max-width: 1023px)");
  
  const isBuildYourJewelry = pathname === "/build-your-jewelry";

  useMotionValueEvent(scrollY, "change", (y) => {
    setHideTop(y > 120);
  });

  if (pathname?.startsWith("/dashboard") || pathname === "/pages/store-giveaway") return null;

  if (isMobile) {
      return (
        <header 
          className="w-full z-100 bg-white sticky"
          style={{ top: isBuildYourJewelry ? "0px" : "-104px" }} // Hides TopBar (40px) + Logo Row (64px) on scroll
        >
          {!isBuildYourJewelry && <TopBar />}
          <MobileHeader menuData={menuData} />
        </header>
      );
    }



  return (
    <>
      {/* Placeholder to prevent layout jump */}
      {!isBuildYourJewelry && <div className="h-40" />}

      <header className={cn(
        isBuildYourJewelry 
          ? "relative w-full z-100 bg-white border-b border-gray-100" 
          : "fixed top-0 left-0 w-full z-100 bg-white border-b border-gray-100", 
        !isBuildYourJewelry && hideTop && "sticky-header-active"
      )}>

        {/* Announcement Bar */}
        {!isBuildYourJewelry && (
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
        )}

        {/* Main Header */}
        <motion.div
          animate={{
            height: "auto",
            opacity: 1,
            visibility: "visible",
          }}
          transition={{ duration: 0.25 }}
          className={cn("relative z-20", (!isBuildYourJewelry && hideTop) ? "overflow-hidden" : "overflow-visible")}
        >
          <MainHeader />
        </motion.div>

        {/* Navbar */}
        {!isBuildYourJewelry && (
          <div className="relative z-10">
            <Navbar hideTop={hideTop} menuData={menuData} />
          </div>
        )}

      </header>
    </>
  );
}
