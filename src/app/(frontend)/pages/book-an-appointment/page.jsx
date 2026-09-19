import HeroSliderImage from "@/components/home/HeroSliderImage";
import BestsellerSection from "@/components/home/homeCollection/BestsellerSection";
import HomeFAQSection from "@/components/home/HomeFAQSection";
import BookAppointmentClient from "@/components/pages/book-appointment/BookAppointmentClient";
import { APPOINTMENT_BANNERS } from "@/components/pages/book-appointment/banners";
import { APPOINTMENT_FAQ_ITEMS } from "@/components/pages/book-appointment/faq";

// The booking flow itself is static: every moving part (stores, pincode lookup,
// OTP) is fetched client-side at the moment the shopper asks for it. The
// bestseller rail below it is not, so the page follows the homepage's 24h
// window rather than caching a year-old product list.
export const revalidate = 86400; // 24 hours

export const metadata = {
  title: "Book an Appointment - Lucira Jewelry",
  description:
    "Book a Lucira appointment your way - shop live over a video call, visit a Lucira store near you, or try your favourite pieces at home before you decide.",
  alternates: { canonical: "/pages/book-an-appointment" },
  openGraph: {
    title: "Book an Appointment - Lucira Jewelry",
    description:
      "Shop live over a video call, visit a Lucira store near you, or try your favourite pieces at home before you decide.",
    url: "/pages/book-an-appointment",
    type: "website",
  },
};

export default async function BookAnAppointmentPage() {
  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL.trim() !== ""
      ? process.env.NEXT_PUBLIC_BACKEND_URL
      : "http://127.0.0.1:8080";
  const base = BACKEND_URL.endsWith("/") ? BACKEND_URL.slice(0, -1) : BACKEND_URL;

  // Same rail as the homepage, seeded the same way: server-fetch the "All" tab
  // so it paints with the page, and let BestsellerSection take over from there
  // when the shopper switches tabs.
  let bestsellersInitial = null;
  try {
    const res = await fetch(`${base}/api/collection?handle=bestsellers&limit=15`, {
      cache: "force-cache",
    });
    if (res.ok) {
      bestsellersInitial = await res.json();

      // Strip the heavy fields the rail never renders (mirrors the homepage).
      if (bestsellersInitial?.collection) {
        delete bestsellersInitial.collection.descriptionHtml;
        if (bestsellersInitial.collection.metafields?.custom) {
          delete bestsellersInitial.collection.metafields.custom.bestsellers_html;
          delete bestsellersInitial.collection.metafields.custom.seo_content_data;
        }
      }
      bestsellersInitial?.products?.forEach((p) => {
        delete p.descriptionHtml;
      });
    }
  } catch (e) {
    console.error("Failed to fetch bestsellers for Book an Appointment", e);
  }

  return (
    <div className="w-full">
      <HeroSliderImage initialData={APPOINTMENT_BANNERS} surface="book-an-appointment" />

      <BookAppointmentClient />

      <BestsellerSection initialData={bestsellersInitial} surface="book-an-appointment" />

      <HomeFAQSection title="Appointment Questions Answered" items={APPOINTMENT_FAQ_ITEMS} />
    </div>
  );
}
