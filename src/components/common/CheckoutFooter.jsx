import Image from "next/image";
import TrustBadges from "./TrustBadges";

export default function CheckoutFooter() {
  const paymentIcons = [
    { name: "VISA", src: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Icon_visa.svg" },
    { name: "MASTERCARD", src: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Icon_mastercard.svg" },
    { name: "RUPAY", src: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Icons_rupay.svg" },
    { name: "UPI", src: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Icon_upi.svg" },
  ];

  return (
    <footer className="mt-auto border-t bg-zinc-50 py-8 mb-20 lg:mb-0">
      <div className="container-main flex flex-col xl:flex-row items-center justify-between gap-8">
        
        {/* Left: Trust Badges */}
        <TrustBadges />

        {/* Right: Payment Icons */}
        <div className="flex items-center gap-5 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300 flex-wrap justify-center pt-2 lg:pt-0">
          {paymentIcons.map((icon) => (
            <Image 
              key={icon.name} 
              src={icon.src} 
              alt={icon.name} 
              height={22}
              width={44}
              className="h-[22px] w-auto object-contain"
            />
          ))}
        </div>

      </div>
    </footer>
  );
}
