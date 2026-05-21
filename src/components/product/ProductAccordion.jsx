"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

import { motion } from "framer-motion";
import Image from "next/image";

export default function ProductAccordion() {
  return (
    <div className="mt-6">
      <Accordion type="single" collapsible defaultValue="package" className="w-full">        
        <Item title="Warranty & Return Policy">
          <p className="text-sm leading-relaxed">
            Lucira offers lifetime exchange and a 15-day free return policy.
            All products come with certified quality assurance.
          </p>
        </Item>

        <Item title="Care & Maintenance">
          <p className="text-sm leading-relaxed">
            Clean your jewelry with a soft cloth and avoid chemicals or perfumes
            for long-lasting shine.
          </p>
        </Item>

        {/* What's in the package */}
        <AccordionItem value="package" className="border-b border-gray-100">
          <AccordionTrigger className="text-base font-semibold py-4 hover:no-underline text-black">
            What&apos;s In The Package
          </AccordionTrigger>
          <AccordionContent asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}              
            >
              <div className="flex gap-3 mb-6">
                <div className="w-25 aspect-square bg-gray-50 rounded-lg relative overflow-hidden">
                   <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Box.jpg" alt="Box" fill className="object-cover" unoptimized />
                </div>
                <div className="w-25 aspect-square bg-gray-50 rounded-lg relative overflow-hidden">
                   <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Selvet_a9064cb1-d29c-4bd2-a3b6-3f504dd02d9d.jpg" alt="Cloth" fill className="object-cover" unoptimized />
                </div>
                <div className="w-25 aspect-square bg-gray-50 rounded-lg relative overflow-hidden">
                   <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Thank-You-Card_4d9152e7-daaa-4f9c-9183-3cfbd6620035.jpg" alt="Card" fill className="object-cover" unoptimized />
                </div>
              </div>
              <p className="text-sm leading-relaxed">
                Your Lucira jewelry piece arrives in a premium jewelry box,
                accompanied by a soft velvet polishing cloth and a thank-you card,
                crafted to make every unboxing feel special.
              </p>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function Item({ title, children }) {
  return (
    <AccordionItem value={title} className="border-b border-gray-100">
      <AccordionTrigger className="text-base font-semibold py-4 hover:no-underline text-black">
        {title}
      </AccordionTrigger>
      <AccordionContent asChild>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {children}
        </motion.div>
      </AccordionContent>
    </AccordionItem>
  );
}
