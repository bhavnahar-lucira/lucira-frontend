import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

const steps = [
  {
    step: 1,
    title: 'CHOOSE SETTING',
    buttonText: 'Start With Setting',
    description: 'Select your favorite ring style and metal.',
    image: '/images/menu/engagement-ring.jpg',
    href: '/collections/engagement-rings'
  },
  {
    step: 2,
    title: 'CHOOSE DIAMOND',
    buttonText: 'Start With Diamond',
    description: 'Find the perfect diamond for your setting.',
    image: '/images/icons/diamond.svg',
    href: '/collections/solitaires'
  },
  {
    step: 3,
    title: 'COMPLETE RING',
    buttonText: 'View Completed Ring',
    description: 'Review and add your unique creation to cart.',
    image: '/images/menu/wedding-ring.jpg',
    href: '#'
  }
];

const BuildYourJewelry = () => {
  return (
    <section className="py-20 md:py-28 bg-[#FCFAFA]">
      <div className="container-main">
        {/* Header Section */}
        <div className="text-center mb-16 md:mb-20">
          <h1 className="text-3xl md:text-5xl font-abhaya font-bold mb-4 tracking-wide uppercase text-[#5A413F]">
            BUILD YOUR OWN RING
          </h1>
          <div className="w-20 h-[2px] bg-[#B77767] mx-auto mb-6"></div>
          <p className="text-zinc-600 font-figtree text-lg md:text-xl max-w-2xl mx-auto">
            Design the perfect ring in 3 simple steps.
          </p>
        </div>

        {/* Steps Container */}
        <div className="relative flex flex-col md:flex-row justify-between items-start gap-12 md:gap-6">
          
          {/* Connector Line (Desktop Only) */}
          <div className="hidden md:block absolute top-[60px] left-[10%] right-[10%] h-[1px] bg-zinc-200 z-0"></div>

          {steps.map((item, index) => (
            <div key={index} className="flex-1 w-full flex flex-col items-center text-center relative z-10 group">
              
              {/* Icon/Image Wrapper */}
              <div className="relative mb-8">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-white border border-zinc-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 transform group-hover:-translate-y-1">
                  <div className="relative w-20 h-20 md:w-24 md:h-24">
                    <Image 
                      src={item.image} 
                      alt={item.title} 
                      fill 
                      className="object-contain p-3 md:p-4"
                    />
                  </div>
                </div>
                
                {/* Step Number Badge */}
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#B77767] text-white flex items-center justify-center text-sm font-bold shadow-sm">
                  {item.step}
                </div>
              </div>

              {/* Content */}
              <div className="px-4">
                <h3 className="text-xl md:text-2xl font-abhaya font-bold mb-3 text-[#5A413F]">
                  {item.title}
                </h3>
                <p className="text-zinc-500 font-figtree text-sm mb-8 leading-relaxed max-w-[200px] mx-auto">
                  {item.description}
                </p>
              </div>

              {/* Action Button */}
              <Button className="w-full md:w-auto px-10 py-7 bg-[#5A413F] text-white hover:bg-[#4A3934] rounded-sm font-bold tracking-[0.2em] uppercase text-[10px] md:text-xs transition-colors border-none">
                {item.buttonText}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BuildYourJewelry;
