import Link from "next/link";
import { LayoutDashboard, LogOut, User } from "lucide-react";

export default function DashboardHeader() {
  return (
    <header className="bg-zinc-900 text-white border-b border-zinc-800">
      <div className="relative h-16 flex items-center px-6">
        {/* Logo — pinned left */}
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <LayoutDashboard size={20} className="text-zinc-400" />
          Dashboard
        </Link>

        {/* Nav — absolutely centered in the header */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-zinc-400 absolute left-1/2 -translate-x-1/2 overflow-x-auto scrollbar-none max-w-[calc(100%-280px)]">
          <Link href="/dashboard" className="hover:text-white transition-colors whitespace-nowrap">Overview</Link>
          <Link href="/dashboard/gold-coin-offer" className="hover:text-white transition-colors whitespace-nowrap">Gold Coin</Link>
          <Link href="/dashboard/topbar-offers" className="hover:text-white transition-colors whitespace-nowrap">Topbar Offers</Link>
          <Link href="/dashboard/pincodes" className="hover:text-white transition-colors whitespace-nowrap">Pincodes</Link>
          <Link href="/dashboard/stores" className="hover:text-white transition-colors whitespace-nowrap">Stores</Link>
          <Link href="/dashboard/curated-looks" className="hover:text-white transition-colors whitespace-nowrap">Curated Looks</Link>
          <Link href="/dashboard/styled-videos" className="hover:text-white transition-colors whitespace-nowrap">Styled Videos</Link>
        </nav>

        {/* Actions — pinned right */}
        <div className="flex items-center gap-4 ml-auto shrink-0">
          <Link href="/admin/profile" className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <User size={20} />
          </Link>
          <button className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-red-400">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
