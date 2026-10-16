import OffersPage from '@/components/pages/offers/OffersPage';

export const metadata = {
  title: 'Offers & Promotions | Lucira Jewelry',
  description: 'Explore exclusive jewellery offers, diamond discounts, and making charge waivers at Lucira Jewelry.',
  alternates: {
    canonical: '/pages/offers',
  },
};

export default function Page() {
  return <OffersPage />;
}
