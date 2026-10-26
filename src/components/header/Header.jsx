"use client";

import { Fragment, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

import TopBar from "./TopBar";
import MainHeader from "./MainHeader";
import Navbar from "./Navbar";
import MobileHeader from "./MobileHeader";
import { useMediaQueryState } from "@/hooks/useMediaQuery";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TOP_HEIGHT = 40;
const HEADER_HEIGHT = 96;

export default function Header({ menuData }) {
  const pathname = usePathname();
  const [hideTop, setHideTop] = useState(false);
  const { scrollY } = useScroll();
  // null on the server and while hydrating (viewport unknown), then a boolean.
  const isMobile = useMediaQueryState("(max-width: 1023px)");

  const isBuildYourJewelry = pathname === "/build-your-jewelry";

  useMotionValueEvent(scrollY, "change", (y) => {
    setHideTop(y > 120);
  });

  if (pathname?.startsWith("/dashboard") || pathname?.includes("store-giveaway") || pathname?.includes("exhibition")) return null;

  // The server cannot know the viewport, so the HTML it sends (and the
  // hydration pass, which must match it) carries BOTH headers, and Tailwind's
  // `lg` breakpoint — the same 1024px line as the media query — decides which
  // one is displayed. Nothing switches on screen: a phone shows the mobile
  // header from the first paint. Once hydrated, the viewport is known and only
  // the matching header stays mounted. The two slots keep fixed positions and
  // keys so the header that stays is the same instance, not a remount.
  const viewportUnknown = isMobile === null;
  const showMobile = viewportUnknown || isMobile;
  const showDesktop = viewportUnknown || !isMobile;
  const mobileOnly = viewportUnknown ? "lg:hidden" : "";
  const desktopOnly = viewportUnknown ? "hidden lg:block" : "";

  const isProductPage = pathname?.startsWith("/products");

  return (
    <>
      {showMobile && (
        <header
          key="mobile"
          className={cn("w-full z-100 bg-white sticky", mobileOnly)}
          style={{ top: isProductPage ? '-40px' : '-104px' }} // Hides only TopBar (40px) on PDP scroll, keeps logo/search row sticky
        >
          <TopBar />
          <MobileHeader menuData={menuData} />
        </header>
      )}

      {showDesktop && (
        <Fragment key="desktop">
          {/* Placeholder to prevent layout jump */}
          {!isBuildYourJewelry && <div className={cn("h-40", desktopOnly)} />}

          <header className={cn(
            isBuildYourJewelry
              ? "relative w-full z-100 bg-white border-b border-gray-100"
              : "fixed top-0 left-0 w-full z-100 bg-white border-b border-gray-100",
            !isBuildYourJewelry && hideTop && "sticky-header-active",
            desktopOnly
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
                height: (!isBuildYourJewelry && hideTop) ? 0 : "auto",
                opacity: (!isBuildYourJewelry && hideTop) ? 0 : 1,
                visibility: (!isBuildYourJewelry && hideTop) ? "hidden" : "visible",
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
        </Fragment>
      )}
    </>
  );
}
