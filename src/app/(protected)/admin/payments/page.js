"use client";

import { CreditCard, Plus, ShieldCheck, Trash2, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useSelector } from "react-redux";
import { selectUser } from "@/redux/features/user/userSlice";

const savedCards = [
  {
    id: "card-1",
    type: "Visa",
    number: "**** **** **** 4242",
    expiry: "12/28",
    isDefault: true,
    bg: "bg-gradient-to-br from-zinc-900 to-zinc-800",
    logo: "https://upload.wikimedia.org/wikipedia/commons/d/d6/Visa_2021.svg"
  },
  {
    id: "card-2",
    type: "Mastercard",
    number: "**** **** **** 8890",
    expiry: "05/27",
    isDefault: false,
    bg: "bg-gradient-to-br from-blue-900 to-indigo-900",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
  }
];

export default function PaymentMethodsPage() {
  const user = useSelector(selectUser);
  const fName = user?.first_name || user?.firstName || "";
  const lName = user?.last_name || user?.lastName || "";
  const fullName = `${fName} ${lName}`.toUpperCase().trim() || "VALUED CUSTOMER";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-figtree text-xl md:text-2xl font-bold text-zinc-900 tracking-tight mb-1">Payment Methods</h2>
          <p className="font-figtree text-sm md:text-base text-zinc-500 font-medium leading-relaxed">Securely manage your cards and digital wallets.</p>
        </div>
        <button className="font-figtree px-6 py-3 bg-primary text-white text-xs font-semibold uppercase tracking-[0.15em] rounded-2xl hover:opacity-90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 w-fit">
          <Plus size={16} />
          Add New Card
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-lg md:text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            Your Cards
            <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-400 text-[10px] font-bold">{savedCards.length}</span>
          </h3>
          
          <div className="space-y-4">
            {savedCards.map((card) => (
              <div key={card.id} className="bg-white rounded-[2.5rem] border border-zinc-100 p-2 shadow-sm hover:shadow-xl transition-all duration-500 group">
                <div className="p-6 flex flex-col md:flex-row gap-6 items-center">
                  {/* Card Visual */}
                  <div className={`w-full md:w-64 h-40 rounded-[1.5rem] ${card.bg} p-6 text-white relative overflow-hidden shadow-2xl group-hover:scale-[1.02] transition-transform duration-500`}>
                    <div className="absolute -right-10 -top-10 size-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className="size-10 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
                          <CreditCard size={24} />
                        </div>
                        <Image src={card.logo} alt={card.type} height={16} width={48} className="h-4 w-auto brightness-0 invert opacity-80" />
                        </div>
                        <div>
                        <p className="text-sm font-black tracking-[0.2em] mb-1">{card.number}</p>
                        <div className="flex justify-between items-end">
                          <p className="text-[10px] font-bold opacity-60 uppercase">{fullName}</p>
                          <p className="text-[10px] font-bold opacity-60">{card.expiry}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <div>
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                        <h4 className="font-bold text-zinc-900">{card.type} Ending in {card.number.split(' ').pop()}</h4>
                        {card.isDefault && <span className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Default</span>}
                      </div>
                      <p className="text-xs text-zinc-400 font-medium">Expires {card.expiry}</p>
                    </div>
                    
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Edit</button>
                      <span className="size-1 bg-zinc-200 rounded-full" />
                      <button className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:underline">Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg md:text-xl font-bold text-zinc-900 tracking-tight">Security & Privacy</h3>
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 p-8 space-y-8">
            <div className="flex gap-6">
              <div className="size-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                <ShieldCheck size={28} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-zinc-900">PCI DSS Compliant</h4>
                <p className="text-sm text-zinc-500 font-medium leading-relaxed">Your payment information is processed through highly secure, encrypted channels ensuring maximum safety.</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="size-14 rounded-2xl bg-emerald-500/5 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 size={28} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-zinc-900">Verified Transactions</h4>
                <p className="text-sm text-zinc-500 font-medium leading-relaxed">Every transaction is monitored and verified for authenticity to protect you against fraud.</p>
              </div>
            </div>

            <div className="pt-4">
              <button className="w-full py-4 border-2 border-zinc-100 rounded-2xl text-xs font-black uppercase tracking-[0.2em] text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition-all">
                Manage Security Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
