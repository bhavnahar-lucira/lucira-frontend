"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, Camera, MessageSquarePlus, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import ProductReview from "./ProductReview";
import WriteReviewForm from "./WriteReviewForm";

const filters = [
  { id: "all", label: "All Reviews" },
  { id: "recent", label: "Most Recent" },
  { id: "top", label: "Top Rated" },
  { id: "video", label: "Video First", icon: Play },
  { id: "photos", label: "Image First", icon: Camera },
];

const reviews = [
  {
    id: 1,
    name: "Divya Agrawal",
    product: "Sleek Emerald Cut Bezel Ring",
    rating: 5,
    text: "Love absolutely ❤️❤️❤️",
    date: "August 11, 2025",
    image: "/images/product/review/1.jpg",
    video: true,
  },
  {
    id: 2,
    name: "Jessica",
    product: "Classic Oval Shape Diamond Ring",
    rating: 5,
    text: "Lovely",
    date: "August 1, 2025",
    image: "/images/product/review/3.jpg",
  },
  {
    id: 3,
    name: "Mishtyy",
    product: "Round Solitaire with Diamond",
    rating: 5,
    text: "👍👍👍",
    date: "June 30, 2025",
    image: "/images/product/review/4.jpg",
  },
  {
    id: 4,
    name: "Mishtyy",
    product: "Round Solitaire with Diamond",
    rating: 5,
    text: "👍👍👍",
    date: "June 30, 2025",
    image: "/images/product/review/5.jpg",
  },
  {
    id: 5,
    name: "Mishtyy",
    product: "Round Solitaire with Diamond",
    rating: 5,
    text: "👍👍👍",
    date: "June 30, 2025",
    image: "/images/product/review/6.jpg",
  },
];

export default function ProductReviewCard({ productId }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);

  const filteredReviews = reviews.filter((review) => {
    if (activeFilter === "video") return review.video;
    if (activeFilter === "photos") return review.image;
    return true;
  });

  return (
    <div className="px-6 py-10 overflow-hidden">

      <h2 className="text-2xl text-center font-semibold">
        Customer Reviews
      </h2>

      {/* Rating Summary */}
      <div className="flex justify-center items-center gap-12 mt-8 shadow rounded-lg pl-8 pe-10 py-6 bg-white">

        {/* LEFT SIDE */}
        <div className="flex justify-start items-center w-120 gap-10 flex-1">
          <div className="flex flex-col items-center">
            <h2 className="text-7xl font-bold mt-1">4.0</h2>

            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  className="text-amber-400 fill-amber-400"
                  size={22}
                />
              ))}
              <Star className="text-gray-300" size={22} />
            </div>

            <p className="text-gray-500 text-sm mt-1">
              Based on 479 reviews
            </p>
          </div>
          {/* Rating Bars */}
          <div className="space-y-3 text-sm flex-1">

            <RatingRow label="5" percent="80%" count="400" color="bg-green-500" />
            <RatingRow label="4" percent="60%" count="300" color="bg-lime-500" />
            <RatingRow label="3" percent="35%" count="175" color="bg-yellow-400" />
            <RatingRow label="2" percent="20%" count="100" color="bg-orange-400" />
            <RatingRow label="1" percent="10%" count="50" color="bg-red-500" />

          </div>
        </div>

        {/* RIGHT SIDE */}
        <ProductReview activeFilter={activeFilter} />

      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mt-8 flex-wrap gap-4">

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const Icon = f.icon;

            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium ${
                  activeFilter === f.id
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {Icon && <Icon size={14}/>}
                {f.label}
              </button>
            );
          })}
        </div>

        <Button 
          variant="outline" 
          className="gap-2"
          onClick={() => setIsWriteReviewOpen(true)}
        >
          <MessageSquarePlus size={16}/>
          Write a Review
        </Button>

      </div>

      <WriteReviewForm 
        isOpen={isWriteReviewOpen}
        onClose={() => setIsWriteReviewOpen(false)}
        productId={productId}
      />

      {/* Animated Masonry Gallery */}
      <motion.div layout className="max-w-7xl mx-auto mt-10 columns-1 sm:columns-2 lg:columns-4 gap-6">

        <AnimatePresence>

          {filteredReviews.map((review) => (

            <motion.div
              key={review.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.35 }}
              className="break-inside-avoid mb-6 bg-white rounded-xl shadow overflow-hidden"
            >

              <div className="relative aspect-square">
                <Image
                  src={review.image}
                  alt={review.name}
                  fill
                  className="object-cover"
                />

                {review.video && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/80 p-3 rounded-full">
                      <Play size={20}/>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4">

                <h3 className="font-semibold">{review.name}</h3>

                <p className="text-sm text-gray-500">
                  Reviewed {review.product}
                </p>

                <div className="flex gap-1 mt-2">
                  {[...Array(review.rating)].map((_,i)=>(
                    <Star
                      key={i}
                      size={16}
                      className="text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>

                <p className="text-sm mt-2">{review.text}</p>

                <p className="text-xs text-gray-400 mt-2">{review.date}</p>

              </div>

            </motion.div>

          ))}

        </AnimatePresence>

      </motion.div>

    </div>
  );
}

function RatingRow({ label, percent, color, count }) {
  return (
    <div className="flex items-center gap-3">

      <span className="flex items-center gap-1 font-bold text-gray-600">
        {label}
        <Star size={14} className="text-amber-400 fill-amber-400"/>
      </span>

      <div className="flex-1 h-2 bg-gray-200 rounded">
        <div
          className={`${color} h-2 rounded`}
          style={{ width: percent }}
        />
      </div>

      <span className="text-primary font-bold">{count}</span>

    </div>
  );
}