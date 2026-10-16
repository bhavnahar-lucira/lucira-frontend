import EventExhibitionClient from "@/components/exhibition/EventExhibitionClient";

export const metadata = {
  title: "Exhibition - Register & Get 1000 Lucira Points | Lucira Jewelry",
  description: "Register at the Lucira Event Exhibition and receive 1000 Lucira / Nector Points credited to your account. Explore exquisite lab-grown diamond jewelry.",
  openGraph: {
    title: "Exhibition - Get 1000 Lucira Points",
    description: "Register at the Lucira Exhibition and receive 1000 Lucira / Nector Points.",
    images: ["https://cdn.shopify.com/s/files/1/0739/8516/3482/files/DSC02543_2.jpg?v=1792067775"],
  },
};

export default function ExhibitionPage() {
  return <EventExhibitionClient />;
}
