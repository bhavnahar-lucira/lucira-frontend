// Dummy banner for /pages/book-an-appointment.
//
// Shape is identical to what GET /api/settings/hero-banners returns for the
// homepage, so this array can be swapped for a dashboard-managed fetch later
// without touching HeroSliderImage or the page.
//
// Fields: id, type ("image" | "video"), name, title, subtitle, alt, url,
// desktopImage (1920x800-ish), mobileImage (768x960-ish).
export const APPOINTMENT_BANNERS = [
  {
    id: "appointment_banner_dummy_1",
    type: "image",
    name: "Book an Appointment",
    title: "",
    subtitle: "",
    alt: "Book an Appointment Banner",
    url: "/pages/book-an-appointment",
    desktopImage:
      "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Festive-Banner-Desktop_06c33352-510b-41d9-83b0-9c1e972c56e3.jpg?v=1788522932",
    mobileImage:
      "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Festive-Banner-Mobile_27_208ace66-d913-4e6c-94a2-79d569b697c9.jpg?v=1788522932",
  },
];
