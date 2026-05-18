import Link from "next/link";
import { ShieldCheck, Settings, LogOut } from "lucide-react";

export default function AdminHeader() {
  return (
    <header className="bg-white border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-lg text-zinc-900">
            <ShieldCheck size={24} className="text-blue-600" />
            Admin Panel
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
            <Link href="/admin" className="hover:text-blue-600 transition-colors">Control Center</Link>
            <Link href="/admin/profile" className="hover:text-blue-600 transition-colors">User Profiles</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <Settings size={20} className="text-zinc-600" />
          </button>
          <button className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-red-500">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
