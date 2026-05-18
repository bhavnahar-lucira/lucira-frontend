"use client";

import { useRef, useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import StyledVideoCard from "./StyledCard";
import VideoPopup from "./VideoPopup";

import "swiper/css";
import "swiper/css/navigation";

export default function StyledByLucira() {
  const [videoData, setVideoData] = useState([]);
  const [popupState, setPopupState] = useState({ isOpen: false, index: 0 });
  const swiperRef = useRef(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
        const res = await fetch(`${baseUrl}/api/styled-videos`, { cache: "no-store" });
        const data = await res.json();
        if (data.success && data.videos?.length > 0) {
          setVideoData(data.videos);
        }
      } catch (err) {
        console.error("Failed to fetch styled videos:", err);
      }
    };
    fetchVideos();
  }, []);

  if (videoData.length === 0) return null;

  return (
    <section className="w-full my-8 md:my-12 bg-white overflow-hidden">
      <div className="container-main">
        <div className="text-center mb-6">
          <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">Styled By Lucira</h2>
        </div>

        <div className="relative w-full group/slider">
          <Swiper
            modules={[Navigation]}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            navigation={{
              prevEl: ".main-prev",
              nextEl: ".main-next",
            }}
            slidesPerView={1.2}
            centeredSlides={true}
            loop={true}
            slidesPerGroup={1}
            spaceBetween={15}
            speed={600}
            grabCursor={true}
            breakpoints={{
              360: {
                slidesPerView: 1.2,
                centeredSlides: true,
              },
              640: {
                slidesPerView: 2.5,
                centeredSlides: false
              },
              1023: {
                slidesPerView: 4,
                centeredSlides: true
              },
              1370: {
                slidesPerView: 5,
                centeredSlides: true
              },
            }}
            className="lucira-swiper overflow-visible!"
          >
            {videoData.map((item, i) => (
              <SwiperSlide key={`styled-v-${i}`}>
                <StyledVideoCard 
                  video={item.video} 
                  onClick={() => setPopupState({ isOpen: true, index: i })}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation Arrows - Desktop Only */}
          <button className="main-prev absolute left-3 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-lg hidden md:flex items-center justify-center text-black opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 hover:bg-gray-50 cursor-pointer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button className="main-next absolute right-3 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-lg hidden md:flex items-center justify-center text-black opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 hover:bg-gray-50 cursor-pointer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <VideoPopup 
        isOpen={popupState.isOpen}
        onClose={() => setPopupState({ ...popupState, isOpen: false })}
        videoData={videoData}
        initialIndex={popupState.index}
      />
    </section>

  );
}
