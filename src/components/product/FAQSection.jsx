"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function QuestionsAnswered() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "Are Lucira diamonds certified and graded?",
      answer:
        "Yes. Every Lucira diamond is certified and graded for cut, clarity, colour, and quality. Each diamond comes with an internationally recognised certificate from IGI or SGL, ensuring complete authenticity and transparency.",
    },
    {
      question: "Do you offer a lifetime exchange policy and how much value will I receive?",
      answer:
        "Yes. You can exchange your Lucira jewellery anytime and receive 100% of the metal (gold or platinum) value and 100% of the diamond value, calculated at current market rates.",
    },
    {
      question: "Do you offer a buyback option and how much value will I receive?",
      answer:
        "Yes. Lucira offers a fair and transparent buyback policy where you receive 90% of the metal (gold or platinum) value and 90% of the diamond value, calculated at current market rates.",
    },
    {
      question: "Will a lab-grown diamond test as real?",
      answer:
        "Yes. Lab-grown diamonds pass standard diamond testing methods just like natural diamonds.",
    },
    {
      question: "Are lab-grown diamonds suitable for everyday wear?",
      answer:
        "Yes. They are as hard and durable as natural diamonds, making them perfect for daily wear.",
    },
  ];

  return (
    <section className="w-full py-12 bg-gray-50 mt-15"> 

      <div className="max-w-480 mx-auto px-5 md:px-17 min-[1440px]:px-17 grid lg:grid-cols-[1fr_480px] gap-16">

        {/* LEFT FAQ */}

        <div>

          <h2 className="text-28px font-bold mb-6 text-black">
            Your Questions Answered
          </h2>

          <div className="w-full">

            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <div key={index} className="border-b py-6">

                  <button
                    onClick={() =>
                      setOpenIndex(isOpen ? -1 : index)
                    }
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="font-semibold text-base">
                      {faq.question}
                    </span>

                    <span className="text-xl">
                      {isOpen ? "-" : "+"}
                    </span>
                  </button>

                  <AnimatePresence>

                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                        }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="text-sm leading-relaxed mt-4">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}

                  </AnimatePresence>

                </div>
              );
            })}

          </div>

        </div>

        {/* RIGHT IMAGE */}

        <div className="relative w-full min-h-132 hidden lg:block rounded-lg overflow-hidden bg-gray-200">

          <Image
            src="/images/faq.jpg"
            alt="FAQ"
            fill
            className="object-cover"
          />

        </div>

      </div>

    </section>
  );
}