import { Figtree, Abhaya_Libre } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import ReduxProvider from "@/redux/provider";
import BackToTop from "@/components/common/BackToTop";
import ZohoSalesIQ from "@/components/common/ZohoSalesIQ";
import ToastProvider from "@/components/common/ToastProvider";
import PointsResetHandler from "@/components/common/PointsResetHandler";
import { GlobalAuthModal } from "@/components/auth/GlobalAuthModal";
import Script from "next/script";
import GtmPageView from "@/components/common/GtmPageView";
import { organizationSchema, websiteSchema, storesSchema } from "@/lib/seo";
import WebEngageRegistration from "@/components/common/WebEngageRegistration";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-figtree",
  display: "swap",
});

const abhaya = Abhaya_Libre({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-abhaya",
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.lucirajewelry.com";

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: "India's Best Lab Grown Diamond Jewellery Brand - Lucira Jewelry",
  description: "Shop premium diamond jewellery online in India at Lucira Jewelry. Discover elegant lab grown diamond designs, certified quality, modern craftsmanship, and timeless styles crafted for every occasion. Shop now.",
  icons: {
    icon: "/Favicon.png",
    apple: "/Favicon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  //const isProd = process.env.NODE_ENV === "production";
  const isProd = true;
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://cdn.shopify.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.shopify.com" />
        {isProd && (
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-MKZBJB8M');`}
          </Script>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [organizationSchema, websiteSchema, ...storesSchema],
            }),
          }}
        />
      </head>
      <body className={`${figtree.variable} ${abhaya.variable} font-figtree antialiased`}>
        {isProd && (
          <noscript>
            <iframe
              src="https://www.googletagmanager.com/ns.html?id=GTM-MKZBJB8M"
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <ReduxProvider>
          {isProd && (
            <Suspense fallback={null}>
              <GtmPageView />
            </Suspense>
          )}
          <PointsResetHandler />
          <ZohoSalesIQ />
          {children}
          <GlobalAuthModal />
          <BackToTop />
        </ReduxProvider>
        <ToastProvider />
      </body>
    </html>
  );
}
