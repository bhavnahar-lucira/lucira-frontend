import EventExhibitionClient from "@/components/exhibition/EventExhibitionClient";

export const metadata = {
  title: "Event Exhibition - Register & Get 1000 Lucira Points | Lucira Jewelry",
  description: "Register at the Lucira Event Exhibition and receive 1000 Lucira / Nector Points credited to your account. Explore exquisite lab-grown diamond jewelry.",
  openGraph: {
    title: "Event Exhibition - Get 1000 Lucira Points",
    description: "Register at the Lucira Event Exhibition and receive 1000 Lucira / Nector Points.",
    images: ["/images/exhibition/store-bg.jpg"],
  },
};

export default function EventExhibitionPage() {
  return <EventExhibitionClient />;
}
