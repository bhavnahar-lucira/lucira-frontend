import Footer from "@/components/common/Footer";
import Header from "@/components/header/Header";
import { AutoAuthPopup } from "@/components/auth/AutoAuthPopup";
import PopularSearches from "@/components/common/PopularSearches";
import VisitorTracking from "@/components/common/VisitorTracking";
import HomeInformationContent from "@/components/common/HomeInformationContent";
import FloatingActionButton from "@/components/common/FloatingActionButton";

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
