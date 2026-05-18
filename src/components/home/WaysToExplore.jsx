"use client";

import React, { useState, useRef } from "react";
import LazyImage from "../common/LazyImage";
import { Button } from "@/components/ui/button";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ExploreBottomSheet from "./ExploreBottomSheet";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import VideoCallPopup from "./VideoCallPopup";
import TryAtHomePopup from "./TryAtHomePopup";
import BookAppointmentPopup from "./BookAppointmentPopup";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const WAYS = [
  {
    title: "Virtual Shop",
    desc: "Shop live over video call view designs up close, compare pieces, and get expert guidance.",
    buttonText: "SCHEDULE VIDEO CALL",
    image: "/images/explore/VirtualTryOn.jpg",
    url: "https://wa.me/919004435760?text=Hi,%20I%20want%20to%20schedule%20video%20call%20"
  },
  {
    title: "Try At Home",
    desc: "Select your favorite pieces & try them at home before you decide, see the fit, finish in your own space.",
    buttonText: "BOOK HOME TRIAL",
    image: "/images/explore/TryAtHome.jpg",
    url: "https://wa.me/919004435760?text=Hi,%20I%20want%20to%20book%20home%20trial%20"
  },
  {
    title: "Visit Our Store",
    desc: "Explore and try your favorite designs in person, with expert guidance from our in-store team.",
    buttonText: "BOOK APPOINTMENT",
    image: "/images/explore/LuciraStore.jpg",
    url: "https://wa.me/919004435760?text=Hi,%20I%20want%20to%20book%20an%20appointment%20"
  }
];

export default function WaysToExplore() { 
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [activeSheet, setActiveSheet] = useState(null);
  
  const [isVideoCallPopupOpen, setIsVideoCallPopupOpen] = useState(false);
  const [isTryAtHomePopupOpen, setIsTryAtHomePopupOpen] = useState(false);
  const [isBookAppointmentPopupOpen, setIsBookAppointmentPopupOpen] = useState(false);
  
  const swiperRef = useRef(null);

  const handleAction = (buttonText) => {
    if (isMobile) {
      if (buttonText === "SCHEDULE VIDEO CALL") setActiveSheet('video');
      else if (buttonText === "BOOK HOME TRIAL") setActiveSheet('home');
      else if (buttonText === "BOOK APPOINTMENT") setActiveSheet('appointment');
    } else {
      if (buttonText === "SCHEDULE VIDEO CALL") setIsVideoCallPopupOpen(true);
      else if (buttonText === "BOOK HOME TRIAL") setIsTryAtHomePopupOpen(true);
      else if (buttonText === "BOOK APPOINTMENT") setIsBookAppointmentPopupOpen(true);
    }
  };

  const SectionHeader = () => (
    <div className="text-left lg:text-center mb-8 px-0">
      <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">More Ways To Explore</h2>
      <p className="text-black font-normal md:text-base text-sm leading-[1.4] tracking-normal align-middle">Experience Lucira your way, online or at our showrooms.</p>
    </div>
  );

  return (
    <section className={`w-full ${isMobile ? "mt-12 bg-[#FEF5F1] py-12" : "mt-0 bg-[#FEF5F1] py-16"} overflow-hidden`}>
      <div className="container-main mx-auto">
        {isMobile ? (
          <>
            <SectionHeader />

            <div className="relative group">
              <Swiper
                modules={[Pagination]}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                }}
                pagination={{
                  clickable: true,
                  el: ".explore-pagination",
                }}
                slidesPerView={1.1}
                spaceBetween={12}
                centeredSlides={false}
                loop={false}
                className="explore-swiper overflow-visible!"
              >
                {WAYS.map((way, index) => (
                  <SwiperSlide key={index} className="h-auto">
                    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden group p-5 shadow-sm border border-zinc-100">
                      <div className="relative aspect-395/295 overflow-hidden rounded-xl mb-6">
                        <LazyImage 
                          src={way.image} 
                          alt={way.title} 
                          fill 
                          sizes="(max-width: 768px) 90vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex flex-col items-start gap-3 grow">
                        <h3 className="text-xl font-bold text-black">{way.title}</h3>
                        <p className="text-black font-normal md:text-base text-sm leading-[1.4] tracking-normal align-middle mb-4">
                          {way.desc}
                        </p>
                        <div className="mt-auto w-full">
                          <Button asChild
                            className="w-fit h-10 px-8 text-sm font-bold uppercase bg-primary hover:bg-primary text-white transition-all rounded-sm"
                          >
                            <a href={way.url} target="_blank">{way.buttonText}</a>
                          </Button>
                          <Button 
                            onClick={() => handleAction(way.buttonText)}
                            className="w-full h-10 px-8 text-sm font-bold uppercase bg-primary hover:bg-primary text-white transition-all rounded-lg hidden"
                          >
                            {way.buttonText}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              <div className="flex items-center justify-between mt-8">
                 <div className="explore-pagination flex gap-2" />
                 <div className="flex gap-3">
                    <button 
                      onClick={() => swiperRef.current?.slidePrev()}
                      className="w-11 h-11 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-900 bg-white shadow-sm active:scale-90 transition-all"
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <button 
                      onClick={() => swiperRef.current?.slideNext()}
                      className="w-11 h-11 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-900 bg-white shadow-sm active:scale-90 transition-all"
                    >
                      <ChevronRight size={22} />
                    </button>
                 </div>
              </div>
            </div>

            <ExploreBottomSheet 
              activeType={activeSheet}
              onClose={() => setActiveSheet(null)}
            />
          </>
        ) : (
          <>
            <SectionHeader />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8">
              {WAYS.map((way, index) => (
                <div key={index} className="flex flex-col h-full bg-white rounded-sm overflow-hidden group p-5 md:p-4 lg:p-5 shadow-sm">
                  <div className="relative aspect-395/295 overflow-hidden rounded-sm mb-3">
                    <LazyImage 
                      src={way.image} 
                      alt={way.title} 
                      fill 
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col items-start gap-2 grow">
                    <h3 className="text-xl font-bold text-black">{way.title}</h3>
                    <p className="text-black text-base mb-4">
                      {way.desc}
                    </p>
                    <div className="mt-auto w-full">
                      <Button asChild
                        variant="outline" 
                        className="h-9 px-8 text-sm font-bold uppercase hover:bg-primary hover:text-white hover:border-primary cursor-pointer"
                      >
                        <a href={way.url} target="_blank">{way.buttonText}</a>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleAction(way.buttonText)}
                        className="h-9 px-8 text-sm font-bold uppercase hover:bg-primary hover:text-white hover:border-primary cursor-pointer hidden"
                      >
                        {way.buttonText}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <VideoCallPopup 
              isOpen={isVideoCallPopupOpen} 
              onClose={() => setIsVideoCallPopupOpen(false)} 
            />
            <TryAtHomePopup 
              isOpen={isTryAtHomePopupOpen}
              onClose={() => setIsTryAtHomePopupOpen(false)}
            />
            <BookAppointmentPopup
              isOpen={isBookAppointmentPopupOpen}
              onClose={() => setIsBookAppointmentPopupOpen(false)}
            />
          </>
        )}
      </div>

      <style jsx global>{`
        .explore-pagination .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: #D1D1D1;
          opacity: 1;
          border-radius: 4px;
          transition: all 0.3s ease;
        }
        .explore-pagination .swiper-pagination-bullet-active {
          width: 24px;
          background: #000;
        }
        @media (min-width: 768px) {
          .explore-pagination .swiper-pagination-bullet-active {
            width: 24px;
          }
        }
      `}</style>
    </section>
  );
}


