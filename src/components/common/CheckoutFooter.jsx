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
    <footer className="mt-auto border-t-0 lg:border-t bg-zinc-50 !py-0 mb-[105px] lg:mb-0">
      <div className="container-main !px-0 lg:!px-12 flex flex-col lg:flex-row items-center justify-between gap-5 lg:gap-8">
        
        {/* Left: Trust Badges */}
        <TrustBadges className="lg:flex-1" />

        {/* Right: Payment Icons */}
        <div className="flex items-center gap-5 transition-all duration-300 flex-wrap justify-center pt-2 lg:pt-0 pb-[35px] lg:pb-0">
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
