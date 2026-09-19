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
      "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Book-an-Appoinment-Desktop_jpg.jpg?v=1789532622",
    mobileImage:
      "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Book-an-Appoinment-Mobile_jpg.jpg?v=1789532622",
  },
];
