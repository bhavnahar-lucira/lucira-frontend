import Header from "@/components/header/Header";
import Footer from "@/components/common/Footer";
import { getMenu } from "@/lib/menus";

export const metadata = {
  title: "Vault of Dreams - Lucira Jewelry",
  description: "Save for your precious jewelry with Lucira's flexible Vault of Dreams scheme. 9 monthly payments + 1 free month!",
};

export default async function SchemesLayout({ children }) {
  const menuData = await getMenu("main-menu-official");

  return (
    <>
      <Header menuData={menuData} />
      <main className="w-full min-h-screen bg-white">
        {children}
      </main>
      <Footer />
    </>
  );
}
