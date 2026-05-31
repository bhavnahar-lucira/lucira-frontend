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

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.lucirajewelry.com";

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: "India's Best Lab Grown Diamond Jewellery Brand - Lucira Jewelry",
  description: "Shop premium diamond jewellery online in India at Lucira Jewelry. Discover elegant lab grown diamond designs, certified quality, modern craftsmanship, and timeless styles crafted for every occasion. Shop now.",
  icons: {
    icon: "https://luciraonline.myshopify.com/cdn/shop/files/Favicon_New_10.png?crop=center&height=32&v=1767615434&width=32",
    apple: "https://luciraonline.myshopify.com/cdn/shop/files/Favicon_New_10.png?crop=center&height=32&v=1767615434&width=32",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  const isProd = process.env.NODE_ENV === "production";

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
      <body className="font-figtree antialiased">
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
          <WebEngageRegistration />
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
