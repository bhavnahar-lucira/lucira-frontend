import React from 'react';
import { BuildYourJewelryBuilder, BuildYourJewelryHero } from '@/components/build-your-jewelry';

export const metadata = {
  title: 'Build Your Own Jewelry | Lucira',
  description: 'Design your own personalized lab-grown diamond chain with our online builder.',
};

const Page = async ({ searchParams }) => {
  const resolvedSearchParams = await searchParams;
  const type = resolvedSearchParams?.type || '';

  if (type) {
    return (
      <main>
        <BuildYourJewelryBuilder key={type} initialType={type} />
      </main>
    );
  }

  return (
    <main>
      <BuildYourJewelryHero />
    </main>
  );
};

export default Page;
