import { Phone, MessageCircle, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function CartContact() {
    return (
      <div className="bg-white border border-zinc-50 rounded-lg p-6 shadow-sm text-center space-y-4">
        <h4 className="text-[11px] font-bold text-black uppercase tracking-[0.2em]">CONTACT US FOR ASSISTANCE</h4>
        <div className="flex justify-around items-center pt-2">
          <Link href="tel:+918976773659" className="flex items-center gap-2 bg-zinc-50 px-3 py-2.5 rounded-xl hover:bg-zinc-100 transition-colors">
            <Phone size={18} className="text-black" />
            <span className="text-xs font-bold text-black">Call</span>
          </Link>
          <Link href="https://wa.me/919004435760?text=Hi%2C+I+want+to+get+more+information+about+Lucira" target="_blank" className="flex items-center gap-2 bg-zinc-50 px-3 py-2.5 rounded-xl hover:bg-zinc-100 transition-colors">
            <MessageCircle size={18} className="text-black" />
            <span className="text-xs font-bold text-black">Whatsapp</span>
          </Link>
          <button 
            onClick={(e) => {
              e.preventDefault();
              if (window.$zoho && window.$zoho.salesiq) {
                window.$zoho.salesiq.floatwindow.visible("show");
              }
            }}
            className="flex items-center gap-2 bg-zinc-50 px-3 py-2.5 rounded-xl hover:bg-zinc-100 transition-colors hover:cursor-pointer"
          >
            <MessageSquare size={18} className="text-black" />
            <span className="text-xs font-bold text-black">Chat</span>
          </button>
        </div>
    </div>
    )
}