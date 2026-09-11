import BookAppointmentClient from "@/components/pages/book-appointment/BookAppointmentClient";

// A static shell: every moving part (stores, pincode lookup, OTP) is fetched
// client-side at the moment the shopper asks for it, so there is nothing here
// worth revalidating.
export const revalidate = 31536000; // 1 year

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

export default function BookAnAppointmentPage() {
  return <BookAppointmentClient />;
}
