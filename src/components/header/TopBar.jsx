"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import Link from "next/link";
import "swiper/css";
import "swiper/css/navigation";
import { apiFetch } from "@/lib/api";

// One request per page load, shared by every TopBar instance. While React is
// hydrating, the header renders both its mobile and desktop variants (CSS
// shows one), so two TopBars mount briefly; without this they would each
// fetch the announcements. A failed request is forgotten so a later mount can
// retry.
let announcementsRequest = null;
const loadAnnouncements = () => {
  if (!announcementsRequest) {
    announcementsRequest = apiFetch("/api/announcements").catch((err) => {
      announcementsRequest = null;
      throw err;
    });
  }
  return announcementsRequest;
};

export default function TopBar() {
  const pathname = usePathname();

  const getLocationId = (path) => {
    if (!path || path === '/') return 'homepage';
    if (path.startsWith('/collections') || path.startsWith('/search')) return 'plp';
    if (path.startsWith('/products')) return 'pdp';
    return 'internal pages';
  };

  const handleAnnouncementClick = (item) => {
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'promoClick',
        promoClick: {
          creative_name: 'announcement bar',
          location_id: getLocationId(pathname),
          promo_id: item.text,
          promo_name: 'Embrace'
        }
      });
    }
  };
  const [announcements, setAnnouncements] = useState([]);
  const [settingsVisible, setSettingsVisible] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await loadAnnouncements();
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

  // Until the announcements arrive, hold the bar's exact box (black, 40px) so
  // the header and page below do not drop by 40px a moment after first paint.
  // The bar collapses only if the dashboard has it switched off or empty.
  if (!hasLoaded) {
    return <div className="bg-[#000000] h-10" aria-hidden="true" />;
  }
  if (!settingsVisible || announcements.length === 0) return null;

  return (
    <div className="bg-[#000000] text-white group relative h-10 overflow-hidden">
      <button className="topbar-prev absolute left-2 z-20 transition-opacity cursor-pointer top-1/2 -translate-y-1/2 flex items-center justify-center">
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
              <Link prefetch={false} 
                href={item.url}
                onClick={() => handleAnnouncementClick(item)}
                className="text-center font-medium text-sm leading-none tracking-[0.7px] flex items-center justify-center h-full w-full px-6 hover:underline transition-all"
              >
                {item.text}
              </Link>
            ) : (
              <p 
                onClick={() => handleAnnouncementClick(item)}
                className="text-center font-medium text-sm leading-none tracking-[0.7px] flex items-center justify-center h-full w-full px-12"
              >
                {item.text}
              </p>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      <button className="topbar-next absolute right-2 z-20 transition-opacity cursor-pointer top-1/2 -translate-y-1/2 flex items-center justify-center">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
