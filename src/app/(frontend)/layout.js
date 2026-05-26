import Footer from "@/components/common/Footer";
import Header from "@/components/header/Header";
import { AutoAuthPopup } from "@/components/auth/AutoAuthPopup";
import PopularSearches from "@/components/common/PopularSearches";
import VisitorTracking from "@/components/common/VisitorTracking";
import HomeInformationContent from "@/components/common/HomeInformationContent";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import { getMenu } from "@/lib/menus";

export const revalidate = 21600; // 6 hours

export default async function FrontendLayout({ children }) {
  const menuData = await getMenu("main-menu-official");

  return (
    <>
      <Header menuData={menuData} />
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
