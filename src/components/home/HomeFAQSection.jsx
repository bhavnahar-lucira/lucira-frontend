"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const FAQ_ITEMS = [
  {
    id: "faq_item_fk8RVR",
    question: "What is a Lab Grown Diamond?",
    answer: "<p>Lab Grown Diamonds are Real Diamonds, identical to natural ones in chemical, physical, and optical properties, with only one key difference: their origin. While Natural Diamonds form deep within the Earth over billions of years, Lab Grown Diamonds are created in controlled environments using advanced technology. They offer the same brilliance and durability including the same hardness and resistance to scratches or damage at up to 85% less cost.</p>"
  },
  {
    id: "faq_item_hJTL6Q",
    question: "How long does delivery take?",
    answer: "<p>All orders are typically shipped within 8–10 business days, while customized products take up to 15 working days. Tracking details are shared with you the moment your order is dispatched.</p>"
  },
  {
    id: "faq_item_VVFQNn",
    question: "Which manufacturing process does Lucira Jewelry use?",
    answer: "<p>We use the CVD (Chemical Vapor Deposition) method, where a tiny carbon seed grows into a diamond inside a controlled chamber, resulting in a diamond that's completely identical to a mined one, but created above ground with zero environmental disruption.</p>"
  },
  {
    id: "faq_item_ncbnNG",
    question: "How much does a 1 carat Natural Diamond cost compared to a Lab Grown Diamond?",
    answer: "<p>A 1-carat diamond with EF color and VVS1 clarity can cost between ₹10 to 13 lakhs if it's Natural, while the same quality in a Lab Grown Diamond is priced around ₹35,000 to ₹50,000. That's up to 95% more affordable with absolutely no compromise on quality, brilliance or beauty.</p>"
  },
  {
    id: "faq_item_3bCqxT",
    question: "What is your return and exchange policy?",
    answer: "<p>We offer 15-days easy returns and exchanges for unworn items with original tags and certificates. Custom or engraved jewelry are only applicable for lifetime exchange and buyback.</p>"
  },
  {
    id: "faq_item_UUYJpx",
    question: "How can I trust that your diamonds are real?",
    answer: "<p>All Lucira Jewelry diamonds are independently certified, tested, and accompanied by a grading report from IGI, SGl, GIA and BIS hallmark. You'll receive full transparency with every purchase.</p>"
  },
  {
    id: "faq_item_GU9qGy",
    question: "Can I speak to someone before buying?",
    answer: "<p>Of course. You can <strong>book a video call</strong>, chat with us online, or message us on WhatsApp. Our diamond experts are happy to guide you every step of the way.</p>"
  },
  {
    id: "faq_item_CFeAUB",
    question: "Do you offer customization or engraving?",
    answer: "<p>Yes! We love personal touches. You can engrave names, dates or messages, and even customize the diamond shape, size, setting, or band.</p>"
  },
  {
    id: "faq_item_ERB3Hp",
    question: "Do you offer lifetime exchange or buyback on jewelry?",
    answer: "<p>We offer a 100% Lifetime Exchange policy on both gold/platinum and diamond, allowing you to exchange or upgrade your jewellery anytime.</p><p>Our Lifetime Buyback option lets you sell your diamond jewellery back to us whenever you choose. For diamonds, 10% will be deducted from the Lifetime Exchange value at the time of buyback.</p><p>For complete details on our policies, please visit our official website or reach out to our customer care team.</p>"
  }
];

export default function HomeFAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (

    <section className="w-full py-12 bg-gray-50">

      <div className="max-w-480 mx-auto px-5 md:px-17 min-[1440px]:px-17 grid lg:grid-cols-[1fr_480px] gap-16">

        {/* LEFT FAQ */}

        <div>

          <h2 className="text-28px font-bold mb-6 text-black">
            Your Questions Answered
          </h2>

          <div className="w-full">

            {FAQ_ITEMS.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <div key={faq.id} className="border-b py-6">

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
                        <div
                          className="text-sm leading-relaxed mt-4 max-w-full [&>p]:mb-2 last:[&>p]:mb-0"
                          dangerouslySetInnerHTML={{ __html: faq.answer }}
                        />
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
            src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/FAQ_side_img_1.png"
            alt="FAQ"
            fill
            className="object-cover"
          />


        </div>

      </div>

    </section>
  );
}
