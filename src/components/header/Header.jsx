"use client";

import TopBar from "./TopBar";
import MainHeader from "./MainHeader";
import Navbar from "./Navbar";
import MobileHeader from "./MobileHeader";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePathname } from "next/navigation";

export default function Header({ menuData }) {
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 1023px)");

  if (pathname?.startsWith("/dashboard") || pathname?.includes("store-giveaway")) return null;

  if (isMobile) {
    const isProductPage = pathname?.startsWith("/products");
    return (
      <header 
        className="w-full z-[100] bg-white sticky"
        style={{ top: isProductPage ? '-40px' : '-104px' }}
      >
        <TopBar />
        <MobileHeader menuData={menuData} />
      </header>
    );
  }

  return (
    <header 
      className="sticky w-full z-[100] bg-white border-b border-gray-100 flex flex-col"
      style={{ top: '-136px' }}
    >
      <TopBar />
      <MainHeader />
      <Navbar menuData={menuData} />
    </header>
  );
}
