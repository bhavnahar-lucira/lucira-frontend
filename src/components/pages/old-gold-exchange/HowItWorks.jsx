"use client";

import LazyImage from "@/components/common/LazyImage";

export default function HowItWorks({ data }) {
  const { heading, subheading, steps, video } = data;

  return (
    <section className="how-it-works-section py-10 bg-white">
      <div className="container-main mx-auto px-4 max-w-[1200px]">

        {heading && (
          <h2 className="text-[18px] md:text-[28px] font-abhaya font-semibold text-center uppercase tracking-[2px] mb-3 text-primary">
            {heading}
          </h2>
        )}

        {subheading && (
          <p className="text-gray-500 text-[14px] md:text-[18px] text-center max-w-[660px] mx-auto mb-10">
            {subheading}
          </p>
        )}
        {/* className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start" */}
        <div >

          {/* Steps Grid   grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8*/}
          <div className="how-it-works-left grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {steps.map((step, index) => (
              <div key={index} className="how-it-works-step flex flex-col group">
                <div className="how-it-works-step-image relative overflow-hidden rounded-xl mb-4 aspect-square bg-[#f0f0f0]">
                  <LazyImage
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="how-it-works-step-content text-left">
                  {step.number && (
                    <p className="text-[#b76f79] font-medium text-sm mb-1 uppercase tracking-widest">
                      Step {step.number.toString().padStart(2, '0')}
                    </p>
                  )}
                  {step.title && (
                    <p className="text-lg font-semibold uppercase tracking-wider text-[#1a1a1a]">
                      {step.title}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Video Container (Right Side) */}
          {/* <div className="how-it-works-right sticky top-24">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/10 aspect-[9/16] md:aspect-auto">
               <video 
                src={video} 
                className="w-full h-full object-cover block" 
                autoPlay 
                muted 
                loop 
                playsInline 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-none"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <p className="text-sm uppercase tracking-[3px] font-medium opacity-90">Store Experience</p>
                <p className="text-xl font-bold font-abhaya tracking-wider">LUCIRA JEWELRY</p>
              </div>
            </div>
          </div> */}

        </div>

      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .how-it-works-right {
            display: none; /* Hide video on smaller screens as per original design's flow if needed, or place below */
          }
           .how-it-works-left {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        @media (max-width: 768px) {
           .how-it-works-left {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </section>
  );
}