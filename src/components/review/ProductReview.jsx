'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import Image from 'next/image';

const images = [
  { id:1, src: "/images/product/review/1.jpg", title: "Curious Kitten", description: "Exploring the world one paw at a time" },
  { id:2, src: "/images/product/review/2.jpg", title: "Sleepy Cat", description: "Dreaming of chasing mice in a field of catnip" },
  { id:3, src: "/images/product/review/3.jpg", title: "Playful Friend", description: "Always ready for an adventure with you" },
  { id:4, src: "/images/product/review/4.jpg", title: "Majestic Fluff", description: "Royalty doesn't need a crown when you have fur like this" },
  { id:5, src: "/images/product/review/5.jpg", title: "Whiskers", description: "Specializing in judging human behavior" },
  { id:6, src: "/images/product/review/6.jpg", title: "Whiskers", description: "Specializing in judging human behavior" },
];

function Card({ frontCard, index, setIndex, drag, image }) {
  const [exitX, setExitX] = useState(0);

  const x = useMotionValue(0);
  const scale = useTransform(x, [-150, 0, 150], [0.8, 1, 0.8]);
  const rotate = useTransform(x, [-150, 0, 150], [-15, 0, 15], { clamp: false });

  const variantsFrontCard = {
    animate: { scale: 1, y: 0, opacity: 1 },
    exit: (custom) => ({
      x: custom,
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.2 }
    })
  };

  const variantsBackCard = {
    initial: { scale: 0.85, y: 20, opacity: 0.5 },
    animate: { scale: 0.9, y: 30, opacity: 0.7 }
  };

  function handleDragEnd(_, info) {
    if (info.offset.x < -100) {
      setExitX(-500);
      setIndex((prev) => (prev + 1) % images.length);
    } else if (info.offset.x > 100) {
      setExitX(500);
      setIndex((prev) => (prev + 1) % images.length);
    }
  }

  return (
    <motion.div
      style={{ x, rotate }}
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-grab"
      whileTap={{ cursor: "grabbing" }}
      drag={drag}
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      onDragEnd={handleDragEnd}
      variants={frontCard ? variantsFrontCard : variantsBackCard}
      initial="initial"
      animate="animate"
      exit="exit"
      custom={exitX}
      transition={
        frontCard
          ? { type: "spring", stiffness: 300, damping: 25 }
          : { scale: { duration: 0.2 }, opacity: { duration: 0.4 } }
      }
    >
      <motion.div
        style={{ scale }}
        className="bg-white rounded-xl shadow-lg overflow-hidden w-60 h-50"
      >
        <Image
          src={image.src}
          alt={image.title}
          width={250}
          height={200}
          className="object-cover object-center w-full h-60"
          draggable={false}
        />
      </motion.div>
    </motion.div>
  );
}

export default function ProductReview() {
  const [index, setIndex] = useState(0);
  const nextIndex = (index + 1) % images.length;

  return (
      <motion.div className="relative w-full max-w-60 flex items-center justify-center mb-5 h-50">
        <AnimatePresence initial={false}>
          <Card key={nextIndex} frontCard={false} image={images[nextIndex]} />
          <Card
            key={index}
            frontCard={true}
            index={index}
            setIndex={setIndex}
            drag="x"
            image={images[index]}
          />
        </AnimatePresence>
      </motion.div>
  );
}