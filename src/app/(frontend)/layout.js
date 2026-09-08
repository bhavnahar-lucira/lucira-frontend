import Footer from "@/components/common/Footer";
import Header from "@/components/header/Header";
import { AutoAuthPopup } from "@/components/auth/AutoAuthPopup";
import PopularSearches from "@/components/common/PopularSearches";
import VisitorTracking from "@/components/common/VisitorTracking";
import HomeInformationContent from "@/components/common/HomeInformationContent";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import { getMenu } from "@/lib/menus";
import { getStorePages } from "@/lib/storeContent";

export default async function FrontendLayout({ children }) {
  const menuData = await getMenu("main-menu-official");
  // Drives the two store blocks in the footer — "Lucira's Experience Stores"
  // and the "Visit our stores:" links in Popular Searches — so a store added in
  // Dashboard → Stores appears in both without a deploy.
  const storePages = await getStorePages();

  return (
    <>
      <Header menuData={menuData} />
      <VisitorTracking />
      {children}
      <Footer />
      <HomeInformationContent storePages={storePages} />
      <PopularSearches storePages={storePages} />
      <AutoAuthPopup />
      <FloatingActionButton />
    </>
  );
}

