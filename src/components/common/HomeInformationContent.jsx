"use client";

import { usePathname } from "next/navigation";
import InformationContent from "../home/InformationContent";

export default function HomeInformationContent({ storePages = null }) {
  const pathname = usePathname();

  // Only show on the homepage
  if (pathname !== "/") return null;

  return <InformationContent storePages={storePages} />;
}
