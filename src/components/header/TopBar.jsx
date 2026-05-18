"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import Link from "next/link";
import "swiper/css";
import "swiper/css/navigation";

export default function TopBar() {
  const [announcements, setAnnouncements] = useState([]);
  const [settingsVisible, setSettingsVisible] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
        const res = await fetch(`${baseUrl}/api/announcements`);
        const data = await res.json();
        setSettingsVisible(data.isVisible ?? true);
        if (data.announcements && data.announcements.length > 0) {
          setAnnouncements(data.announcements);
        }
      } catch (err) {
        console.error("TopBar fetch error:", err);
      } finally {
        setHasLoaded(true);
      }
    };
    fetchAnnouncements();
  }, []);

  if (!hasLoaded || !settingsVisible || announcements.length === 0) return null;

  return (
    <div className="bg-[#000000] text-white group relative h-10 overflow-hidden">
      <button className="topbar-prev absolute left-4 z-20 transition-opacity cursor-pointer top-1/2 -translate-y-1/2 flex items-center justify-center">
        <ChevronLeft size={16} />
      </button>

      <Swiper
        modules={[Autoplay, Navigation]}
        direction="vertical"
        autoplay={{
          delay: 10000,
          disableOnInteraction: false,
        }}
        navigation={{
          prevEl: ".topbar-prev",
          nextEl: ".topbar-next",
        }}
        loop={true}
        className="w-full h-full"
      >
        {announcements.map((item, index) => (
          <SwiperSlide key={index} className="!flex items-center justify-center h-full">
            {item.url ? (
              <Link 
                href={item.url}
                className="text-center font-medium text-sm leading-none tracking-[0.7px] flex items-center justify-center h-full w-full px-12 hover:underline transition-all"
              >
                {item.text}
              </Link>
            ) : (
              <p className="text-center font-medium text-sm leading-none tracking-[0.7px] flex items-center justify-center h-full w-full px-12">
                {item.text}
              </p>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      <button className="topbar-next absolute right-4 z-20 transition-opacity cursor-pointer top-1/2 -translate-y-1/2 flex items-center justify-center">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}