"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import { RefreshCcw, Loader2, ChevronRight, PackageX } from "lucide-react";
import { apiFetch } from "@/lib/api";

const STATUS_STYLES = {
  REQUESTED: { label: "Requested", cls: "text-amber-600 bg-amber-50/50 border-amber-100/70", dot: "bg-amber-500" },
  OPEN: { label: "Approved", cls: "text-blue-600 bg-blue-50/50 border-blue-100/70", dot: "bg-blue-500" },
  CLOSED: { label: "Completed", cls: "text-emerald-600 bg-emerald-50/50 border-emerald-100/70", dot: "bg-emerald-500" },
  DECLINED: { label: "Declined", cls: "text-rose-600 bg-rose-50/50 border-rose-100/70", dot: "bg-rose-500" },
  CANCELED: { label: "Cancelled", cls: "text-zinc-500 bg-zinc-50 border-zinc-200", dot: "bg-zinc-400" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.REQUESTED;
  return (
    <span className={`font-figtree px-2.5 md:px-4 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-[0.05em] flex items-center gap-1.5 border ${s.cls}`}>
      <span className={`size-1 md:size-1.5 rounded-full ${s.dot} animate-pulse`} />
      {s.label}
    </span>
  );
}

function formatDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

export default function MyReturnsPage() {
  const { accessToken } = useSelector((state) => state.user);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!accessToken) { setLoading(false); return; }
      try {
        setLoading(true);
        const res = await apiFetch("/api/customer/returns");
        setReturns(res?.returns || []);
      } catch (err) {
        console.error("[MyReturns] load failed:", err);
        toast.error("Failed to load your returns");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="font-figtree flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-white rounded-[2rem] md:rounded-[3rem] border border-zinc-100">
        <Loader2 className="size-8 md:size-10 animate-spin text-primary" />
        <p className="font-figtree text-zinc-400 font-semibold uppercase tracking-[0.13em] text-xs">
          Loading your returns...
        </p>
      </div>
    );
  }

  return (
    <div className="font-figtree space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-figtree text-xl md:text-2xl font-bold text-primary tracking-tight mb-1">
            My Returns
          </h2>
          <p className="font-figtree text-sm md:text-base text-zinc-500 font-medium leading-relaxed">
            Track the status of your return requests.
          </p>
        </div>
        {returns.length > 0 && (
          <div className="font-figtree px-4 py-2 bg-white border border-zinc-100 rounded-xl text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            {returns.length} Return{returns.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {returns.length === 0 ? (
        <div className="py-16 md:py-20 text-center space-y-5 md:space-y-6 bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-zinc-100">
          <div className="size-16 md:size-20 bg-zinc-50 text-zinc-300 rounded-3xl flex items-center justify-center mx-auto">
            <PackageX size={34} />
          </div>
          <div className="space-y-2">
            <h3 className="font-figtree text-lg md:text-2xl font-bold text-zinc-900">No returns yet</h3>
            <p className="font-figtree text-sm text-zinc-500 font-normal max-w-sm mx-auto leading-relaxed">
              When you request a return from one of your delivered orders, it will appear here.
            </p>
          </div>
          <Link prefetch={false}
            href="/admin/orders"
            className="font-figtree inline-block px-8 md:px-10 py-3.5 md:py-4 bg-primary text-white text-xs font-semibold uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 transition-transform"
          >
            View my orders
          </Link>
        </div>
      ) : (
        <div className="space-y-5 md:space-y-6">
          {returns.map((r) => (
            <Link prefetch={false}
              key={r.id}
              href={`/admin/returns/${r.numericId}`}
              className="block bg-white rounded-[2rem] border border-zinc-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 group"
            >
              <div className="p-5 md:p-7 flex items-center gap-4 md:gap-6">
                <div className="size-20 md:size-24 bg-[#FBFBFB] rounded-2xl overflow-hidden shrink-0 border border-zinc-50 flex items-center justify-center p-2 md:p-3">
                  {r.firstItem?.image ? (
                    <Image src={r.firstItem.image} alt={r.firstItem?.title || "Return item"} width={110} height={110} className="object-contain w-full h-full group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <RefreshCcw className="text-zinc-200" size={30} />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-figtree text-[9px] md:text-[11px] font-bold text-zinc-400 bg-zinc-50/80 px-2.5 md:px-4 py-1 rounded-full uppercase tracking-[0.1em] border border-zinc-100/50">
                      {r.name || "Return"}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  <h4 className="font-figtree text-sm md:text-lg font-bold text-zinc-900 leading-tight truncate">
                    {r.firstItem?.title || "Return request"}
                    {r.itemCount > 1 && <span className="text-zinc-400 font-medium"> +{r.itemCount - 1} more</span>}
                  </h4>
                  <p className="font-figtree text-[10px] md:text-sm text-zinc-400 font-medium">
                    Order {r.orderName} · Requested on {formatDate(r.createdAt)}
                  </p>
                </div>

                <ChevronRight className="text-zinc-300 group-hover:text-primary transition-colors shrink-0" size={22} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
