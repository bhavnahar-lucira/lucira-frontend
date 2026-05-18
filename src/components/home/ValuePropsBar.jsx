"use client";

import LazyImage from "../common/LazyImage";

const PROPS = [
  {
    icon: "/images/product/shipping.svg",
    text: "Free and secure shipping",
  },
  {
    icon: "/images/product/exchange.svg",
    text: "Lifetime returns/exchange",
  },
  {
    icon: "/images/product/certified.svg",
    text: "100% certified lab grown diamonds",
  },
  {
    icon: "/images/product/return.svg",
    text: "15 day money back guarantee",
  }
];

export default function ValuePropsBar() {
  return (
    <section className="w-full bg-[#F5F5F5] py-5 border-b border-gray-100">
      <div className="max-w-480 mx-auto px-6 md:px-17">
        <div className="flex flex-wrap justify-between items-center gap-6">
          {PROPS.map((prop, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-6 h-6 relative grayscale opacity-70">
                <LazyImage src={prop.icon} alt={prop.text} fill className="object-contain" />
              </div>
              <span className="text-xs uppercase font-medium tracking-wider text-gray-900">
                {prop.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
