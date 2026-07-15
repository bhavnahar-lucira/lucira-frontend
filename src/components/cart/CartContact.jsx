import { Phone, MessageCircle, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function CartContact({ productName }) {
    const whatsappMessage = productName
      ? `Hi, I'm on the cart page and need help with the ${productName}`
      : "Hi, I want to get more information about Lucira";
    const whatsappHref = `https://wa.me/919004435760?text=${encodeURIComponent(whatsappMessage)}`;

    return (
      <div className="bg-white border border-[#EADFD8] rounded-lg p-6 shadow-[0_2px_12px_-4px_rgba(90,65,63,0.10)] text-center space-y-4">
        <h4 className="font-figtree font-semibold text-xs lg:text-sm leading-[1.3] text-[#3D2B28] uppercase tracking-[0.7px]">
          Contact Us For Assistance
        </h4>
        <div className="flex justify-center items-center gap-2.5 lg:gap-3 pt-1">
          <Link prefetch={false} href="tel:+919004436052" className="flex items-center gap-2 border border-[#EADFD8] bg-[#FEF9F6] px-3.5 py-2.5 rounded-full transition-colors hover:bg-[#F1E4D1]/50">
            <Phone size={16} className="text-[#5A413F]" />
            <span className="font-figtree font-medium text-xs lg:text-sm text-[#3D2B28]">Call</span>
          </Link>
          <Link prefetch={false} href={whatsappHref} target="_blank" className="flex items-center gap-2 border border-[#EADFD8] bg-[#FEF9F6] px-3.5 py-2.5 rounded-full transition-colors hover:bg-[#F1E4D1]/50">
            <MessageCircle size={16} className="text-[#5A413F]" />
            <span className="font-figtree font-medium text-xs lg:text-sm text-[#3D2B28]">Whatsapp</span>
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              if (window.$zoho && window.$zoho.salesiq) {
                window.$zoho.salesiq.floatwindow.visible("show");
              }
            }}
            className="flex items-center gap-2 border border-[#EADFD8] bg-[#FEF9F6] px-3.5 py-2.5 rounded-full transition-colors hover:bg-[#F1E4D1]/50 hover:cursor-pointer"
          >
            <MessageSquare size={16} className="text-[#5A413F]" />
            <span className="font-figtree font-medium text-xs lg:text-sm text-[#3D2B28]">Chat</span>
          </button>
        </div>
    </div>
    )
}
