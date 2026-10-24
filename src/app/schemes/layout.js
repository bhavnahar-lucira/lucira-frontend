import Header from "@/components/header/Header";
import Footer from "@/components/common/Footer";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import { getHeaderMenu } from "@/lib/menus";

export const metadata = {
  title: "Jewellery Savings Scheme: Vault of Dreams | Lucira Jewelry",
  description:
    "Save for your jewellery with Lucira's Vault of Dreams scheme: 9 monthly payments plus 1 free month. Read the terms and start saving.",
  alternates: { canonical: "/schemes" },
  openGraph: {
    title: "Jewellery Savings Scheme: Vault of Dreams | Lucira Jewelry",
    description:
      "Save for your jewellery with Lucira's Vault of Dreams scheme: 9 monthly payments plus 1 free month. Read the terms and start saving.",
    url: "/schemes",
    type: "website",
  },
};

export default async function SchemesLayout({ children }) {
  const menuData = await getHeaderMenu("main-menu-official");

  return (
    <>
      <Header menuData={menuData} />
      <main className="w-full min-h-screen bg-white">
        {children}
      </main>
      <Footer />
      <FloatingActionButton />
    </>
  );
}
