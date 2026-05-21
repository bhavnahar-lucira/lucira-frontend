import Header from "@/components/header/Header";
import VisitorTracking from "@/components/common/VisitorTracking";
import dynamic from "next/dynamic";

const Footer = dynamic(() => import("@/components/common/Footer"), { ssr: true });
const AutoAuthPopup = dynamic(() => import("@/components/auth/AutoAuthPopup").then(mod => mod.AutoAuthPopup), { ssr: false });
const PopularSearches = dynamic(() => import("@/components/common/PopularSearches"), { ssr: false });
const HomeInformationContent = dynamic(() => import("@/components/common/HomeInformationContent"), { ssr: false });
const FloatingActionButton = dynamic(() => import("@/components/common/FloatingActionButton"), { ssr: false });

export default function FrontendLayout({ children }) {
  return (
    <>
      <Header />
      <VisitorTracking />
      {children}
      <Footer />
      <HomeInformationContent />
      <PopularSearches />
      <AutoAuthPopup />
      <FloatingActionButton />
    </>
  );
}
