"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  User,
  Settings,
  LogOut,
  Bell,
  Search,
  Gem,
  CreditCard,
  MapPin,
  Gift,
  GraduationCap,
  TicketPercent,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectUser } from "@/redux/features/user/userSlice";
import Header from "@/components/header/Header";
import Footer from "@/components/common/Footer";

const sidebarLinks = [
  { name: "My Overview", href: "/admin", icon: LayoutDashboard, color: "text-blue-500", bg: "bg-blue-500/10" },
  { name: "My Orders", href: "/admin/orders", icon: ShoppingBag, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { name: "Wishlist", href: "/admin/wishlist", icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10" },
  { name: "My Schemes", href: "/admin/schemes", icon: TicketPercent, color: "text-amber-700", bg: "bg-amber-700/10" },
  { name: "Saved Addresses", href: "/admin/addresses", icon: MapPin, color: "text-orange-500", bg: "bg-orange-500/10" },
  { name: "Earn Rewards", href: "/admin/rewards", icon: Gift, color: "text-amber-500", bg: "bg-amber-500/10" },
  { name: "My Profile", href: "/admin/profile", icon: User, color: "text-zinc-500", bg: "bg-zinc-500/10" },
  { name: "Refer & Earn", href: "/admin/referral", icon: Gem, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { name: "Education", href: "/admin/education", icon: GraduationCap, color: "text-amber-600", bg: "bg-amber-600/10" },
];

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

function SidebarNav({ pathname, handleSignOut, setSheetOpen }) {
  return (
    <div className="flex flex-col h-full bg-white">
      <nav className="flex-1 overflow-y-auto pt-10 pb-8 px-4 space-y-1.5">
        <p className="px-4 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 mb-4">Account Menu</p>
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setSheetOpen && setSheetOpen(false)}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm outline-none focus:outline-none focus-visible:outline-none ${
                isActive
                  ? `bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]`
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <div className={`size-8 rounded-lg flex items-center justify-center ${isActive ? "bg-white/20 text-white" : `${link.bg} ${link.color}`}`}>
                <Icon size={18} />
              </div>
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-zinc-100 mt-auto">
        <button
          onClick={() => {
            if (setSheetOpen) setSheetOpen(false);
            handleSignOut();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 text-sm font-bold hover:bg-red-50 rounded-xl transition-colors cursor-pointer outline-none focus:outline-none focus-visible:outline-none"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function CustomerDashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [avatar, setAvatar] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchAvatar() {
      try {
        const res = await fetch(`/api/customer/profile/avatar?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.avatar) setAvatar(data.avatar);
        }
      } catch (err) {
        console.error("Layout avatar fetch error", err);
      }
    }
    fetchAvatar();

    // Listen for profile updates from other components
    window.addEventListener("profile-updated", fetchAvatar);
    return () => window.removeEventListener("profile-updated", fetchAvatar);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      dispatch(logout());
      router.push("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row relative">

        {/* Mobile menu bar */}
        <div className="lg:hidden bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-[50px] z-20">
          <span className="text-sm font-bold text-zinc-900">Account Menu</span>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="p-2 -mr-2 text-zinc-500 hover:bg-zinc-50 rounded-xl outline-none focus:outline-none focus-visible:outline-none">
                <Menu size={24} />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="p-0 border-0 outline-none focus:outline-none focus-visible:outline-none sm:max-w-[300px] [&>button]:outline-none [&>button]:focus:outline-none [&>button]:focus-visible:outline-none"
            >
              <SheetTitle className="sr-only">Account Menu</SheetTitle>
              <SidebarNav pathname={pathname} handleSignOut={handleSignOut} setSheetOpen={setMobileMenuOpen} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-72 bg-white border-r border-zinc-200 flex-col sticky top-[80px] h-[calc(100vh-80px)] z-30 shrink-0">
          <SidebarNav pathname={pathname} handleSignOut={handleSignOut} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-screen w-full min-w-0 outline-none focus:outline-none">
          <div className="p-4 sm:p-8 flex-1 bg-[#F8FAFC] overflow-x-hidden outline-none focus:outline-none">
            {children}
          </div>
        </main>

      </div>
      <Footer />
    </>
  );
}
