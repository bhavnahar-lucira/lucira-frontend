"use client";

import { useId, useState } from "react";
import LazyImage from "../common/LazyImage";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const LOVE_STORIES = [
  {
    id: "1",
    title: "Proposal Moment",
    image: "/images/love-stories/1.jpg",
    href: "/collections/love-story-1",
    productTitle: "Round Six-Prong Solitaire Stud Earrings",
    productHandle: "brilliant-round-six-prong-solitaire-stud-earrings-1",
  },
  {
    id: "2",
    title: "Forever Together",
    image: "/images/love-stories/2.jpg",
    href: "/collections/love-story-2",
    productTitle: "Pear & Emerald Diamond Toi et Moi Ring",
    productHandle: "brilliant-round-six-prong-solitaire-stud-earrings-2",
  },
  {
    id: "3",
    title: "pearl flower",
    image: "/images/love-stories/3.jpg",
    href: "/collections/love-story-3",
    productTitle: "Round Cut with Side Diamonds Accent Ring",
    productHandle: "brilliant-round-six-prong-solitaire-stud-earrings-3",
  },
  {
    id: "4",
    title: "Lucira Moments",
    image: "/images/love-stories/4.jpg",
    href: "/collections/love-story-4",
    productTitle: "Round Bezel Set Tennis Necklace",
    productHandle: "brilliant-round-six-prong-solitaire-stud-earrings-4",
  },
  {
    id: "5",
    title: "Special Couple",
    image: "/images/love-stories/1.jpg",
    href: "/collections/love-story-5",
    productTitle: "Diamond Stud Earrings",
    productHandle: "brilliant-round-six-prong-solitaire-stud-earrings-5",
  },
];

function LoveStoryCard({ item }) {
  return (
    <div className="overflow-hidden rounded-sm border border-transparent transition-all hover:border-black/5">
      <Link href={item.href} className="group block overflow-hidden rounded-sm">
        <div className="relative aspect-[0.78/1] w-full overflow-hidden rounded-sm">
          <LazyImage
            src={item.image}
            alt={item.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      </Link>
    </div>
  );
}

export default function LoveStorySlider({
  title = "Celebrating Your Love Story, with Lucira",
  subtitle = "Because every yes deserves something special",
  items = LOVE_STORIES,
}) {
  const id = useId().replace(/:/g, "");
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const prevElClass = `love-prev-${id}`;
  const nextElClass = `love-next-${id}`;
  const paginationElClass = `love-pagination-${id}`;

  return (
    <section className="w-full my-15 overflow-hidden">
      <div className="container-main">
        <div className="text-center mb-6">
          <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">{title}</h2>
          <p className="text-black font-normal md:text-base text-sm leading-[1.4] tracking-normal align-middle">{subtitle}</p>
        </div>

        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={12}
            slidesPerView={1.2}
            onSwiper={(swiper) => {
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            onSlideChange={(swiper) => {
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            navigation={{
              nextEl: `.${nextElClass}`,
              prevEl: `.${prevElClass}`,
            }}
            pagination={{
              el: `.${paginationElClass}`,
              clickable: true,
              renderBullet: (index, className) => {
                return `<span class="${className} m-0! mr-2! h-2! w-2! rounded-full! bg-[#cfcfcf]! transition-all duration-300 [&.swiper-pagination-bullet-active]:w-6! md:[&.swiper-pagination-bullet-active]:w-6! [&.swiper-pagination-bullet-active]:rounded-full! [&.swiper-pagination-bullet-active]:bg-black!"></span>`;
              },
            }}
            breakpoints={{
              640: { slidesPerView: 2.2, spaceBetween: 12 },
              768: { slidesPerView: 3, spaceBetween: 12 },
              1024: { slidesPerView: 4, spaceBetween: 12 },
            }}
            className="w-full overflow-visible!"
          >
            {items.map((item) => (
              <SwiperSlide key={item.id}>
                <LoveStoryCard item={item} />
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="mt-6 flex items-center justify-between">
            <div className={`${paginationElClass} flex items-center`} />

            <div className="flex items-center gap-3">
              <button
                disabled={isBeginning}
                className={`${prevElClass} flex h-11 w-11 items-center justify-center rounded-full border border-black text-black transition hover:bg-black hover:text-white disabled:opacity-20 disabled:pointer-events-none disabled:cursor-not-allowed`}
                aria-label="Previous"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                disabled={isEnd}
                className={`${nextElClass} flex h-11 w-11 items-center justify-center rounded-full border border-black text-black transition hover:bg-black hover:text-white disabled:opacity-20 disabled:pointer-events-none disabled:cursor-not-allowed`}
                aria-label="Next"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .${paginationElClass} {
          position: static !important;
          width: auto !important;
        }
      `}</style>
    </section>
  );
}
