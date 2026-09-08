import Link from "next/link";

export default function CartContact({ productName }) {
    const whatsappMessage = productName
      ? `Hi, I'm on the cart page and need help with the ${productName}`
      : "Hi, I want to get more information about Lucira";
    const whatsappHref = `https://wa.me/919004435760?text=${encodeURIComponent(whatsappMessage)}`;

    return (
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-[6px] p-3 sm:p-[20px] text-center space-y-3 lg:space-y-4">
        <h4 className="font-figtree font-semibold text-[0.8rem] leading-[1.3] text-[#3D2B28] uppercase tracking-[0.7px] text-center">
          Contact Us For Assistance
        </h4>
        <div className="flex flex-wrap sm:flex-nowrap justify-center items-center gap-[14px] pt-1">
          <Link prefetch={false} href="tel:+919004436052" className="flex items-center gap-1.5 sm:gap-2 transition-colors group bg-[#ffe4ef] rounded-[3rem] pr-3 sm:pr-[18px]">
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-full bg-[#DA3779] text-white transition-transform group-hover:scale-110">
              <img src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/phone-call_1.png?v=1772105479" className="w-[14px] h-[14px] sm:w-4 sm:h-4" alt="Call" />
            </span>
            <span className="font-figtree font-semibold text-[0.8rem] text-[#3e3e3e]">Call</span>
          </Link>
          <Link prefetch={false} href={whatsappHref} target="_blank" className="flex items-center gap-1.5 sm:gap-2 transition-colors group bg-[#deffe4] rounded-[3rem] pr-3 sm:pr-[18px]">
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-full bg-[#32d950] text-white transition-transform group-hover:scale-110">
              <img src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/whatsapp_3_1.png?v=1772105856" className="w-[14px] h-[14px] sm:w-4 sm:h-4" alt="WhatsApp" />
            </span>
            <span className="font-figtree font-semibold text-[0.8rem] text-[#3e3e3e]">Whatsapp</span>
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              if (window.$zoho && window.$zoho.salesiq) {
                window.$zoho.salesiq.floatwindow.visible("show");
              }
            }}
            className="flex items-center gap-1.5 sm:gap-2 transition-colors group hover:cursor-pointer bg-[#daedff] rounded-[3rem] pr-3 sm:pr-[18px]"
          >
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-full bg-[#0066cc] text-white transition-transform group-hover:scale-110">
              <img src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/chat_1.png?v=1772104883" className="w-[14px] h-[14px] sm:w-4 sm:h-4" alt="Chat" />
            </span>
            <span className="font-figtree font-semibold text-[0.8rem] text-[#3e3e3e]">Chat</span>
          </button>
        </div>
    </div>
    )
}
