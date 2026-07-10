"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  ChevronLeft, RefreshCcw, Loader2, CheckCircle2, Truck, ClipboardCheck,
  Wallet, PackageCheck, XCircle, Clock, HelpCircle
} from "lucide-react";
import { apiFetch } from "@/lib/api";

const STATUS_STYLES = {
  REQUESTED: { label: "Requested", cls: "text-amber-600 bg-amber-50", dot: "bg-amber-500" },
  OPEN: { label: "Approved", cls: "text-blue-600 bg-blue-50", dot: "bg-blue-500" },
  CLOSED: { label: "Completed", cls: "text-emerald-600 bg-emerald-50", dot: "bg-emerald-500" },
  DECLINED: { label: "Declined", cls: "text-rose-600 bg-rose-50", dot: "bg-rose-500" },
  CANCELED: { label: "Cancelled", cls: "text-zinc-500 bg-zinc-100", dot: "bg-zinc-400" },
};

const STAGE_ICON = {
  requested: RefreshCcw,
  approved: CheckCircle2,
  picked_up: Truck,
  quality_check: ClipboardCheck,
  refunded: Wallet,
  completed: PackageCheck,
};

function formatDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

export default function ReturnDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { accessToken } = useSelector((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [ret, setRet] = useState(null);

  useEffect(() => {
    async function load() {
      if (!accessToken) { setLoading(false); return; }
      try {
        setLoading(true);
        const res = await apiFetch(`/api/customer/returns/${id}`);
        setRet(res?.return || null);
      } catch (err) {
        console.error("[ReturnDetail] load failed:", err);
        toast.error("Couldn't load this return");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [accessToken, id]);

  if (loading) {
    return (
      <div className="font-figtree flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-white rounded-[2rem] md:rounded-[3rem] border border-zinc-100">
        <Loader2 className="size-8 md:size-10 animate-spin text-primary" />
        <p className="font-figtree text-zinc-400 font-semibold uppercase tracking-[0.13em] text-xs">
          Loading return status...
        </p>
      </div>
    );
  }

  if (!ret) {
    return (
      <div className="font-figtree space-y-6">
        <button onClick={() => router.push("/admin/returns")} className="size-10 bg-white border border-zinc-100 rounded-xl flex items-center justify-center text-zinc-500 hover:text-primary transition-colors">
          <ChevronLeft className="size-5" />
        </button>
        <div className="bg-white rounded-[2rem] border border-zinc-100 p-10 text-center">
          <p className="font-figtree text-zinc-500">Return not found.</p>
        </div>
      </div>
    );
  }

  const status = STATUS_STYLES[ret.status] || STATUS_STYLES.REQUESTED;
  const isDeclined = ret.state === "declined";
  const isCanceled = ret.state === "canceled";
  const isTerminal = isDeclined || isCanceled;

  return (
    <div className="font-figtree space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Back header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/returns")}
          className="size-10 bg-white border border-zinc-100 rounded-xl flex items-center justify-center text-zinc-500 hover:text-primary hover:border-primary/20 transition-colors shrink-0"
          aria-label="Back"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div>
          <h2 className="font-figtree text-xl md:text-2xl font-bold text-primary tracking-tight">
            Return {ret.name || ""}
          </h2>
          {ret.order?.name && (
            <p className="font-figtree text-xs md:text-sm text-zinc-400 font-medium">
              For order {ret.order.name} · Requested {formatDate(ret.createdAt)}
            </p>
          )}
        </div>
      </div>

      {/* Status hero */}
      <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`size-12 rounded-2xl flex items-center justify-center ${status.cls}`}>
              {isDeclined ? <XCircle size={22} /> : isCanceled ? <XCircle size={22} /> : <Clock size={22} />}
            </div>
            <div>
              <p className="font-figtree text-[11px] font-bold text-zinc-400 uppercase tracking-[0.15em]">Current status</p>
              <p className="font-figtree text-lg font-bold text-zinc-900">{status.label}</p>
            </div>
          </div>
        </div>

        {/* Declined / cancelled banner */}
        {isDeclined && (
          <div className="mt-5 bg-rose-50/60 border border-rose-100 rounded-2xl p-4">
            <p className="font-figtree text-[13px] text-rose-900/80 leading-relaxed">
              This return request was declined{ret.declineReason ? ` (${String(ret.declineReason).toLowerCase().replace(/_/g, " ")})` : ""}.
              {ret.declineNote ? ` ${ret.declineNote}` : ""} If you have questions, our support team is happy to help.
            </p>
          </div>
        )}
        {isCanceled && (
          <div className="mt-5 bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
            <p className="font-figtree text-[13px] text-zinc-600 leading-relaxed">This return was cancelled.</p>
          </div>
        )}

        {/* Timeline */}
        {!isTerminal && (
          <div className="mt-6 md:mt-8">
            {ret.timeline.map((stage, idx) => {
              const Icon = STAGE_ICON[stage.key] || CheckCircle2;
              const isCurrent = idx === ret.currentStage;
              const done = stage.reached;
              const isLast = idx === ret.timeline.length - 1;
              return (
                <div key={stage.key} className="flex gap-4">
                  {/* Rail */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`size-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        done
                          ? "bg-primary border-primary text-white"
                          : "bg-white border-zinc-200 text-zinc-300"
                      } ${isCurrent ? "ring-4 ring-primary/15" : ""}`}
                    >
                      <Icon size={17} />
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 flex-1 min-h-[38px] ${done ? "bg-primary/40" : "bg-zinc-100"}`} />
                    )}
                  </div>
                  {/* Content */}
                  <div className={`pb-8 ${isLast ? "pb-0" : ""}`}>
                    <p className={`font-figtree text-sm font-bold ${done ? "text-zinc-900" : "text-zinc-400"}`}>
                      {stage.label}
                      {isCurrent && (
                        <span className="ml-2 font-figtree text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wide align-middle">
                          In progress
                        </span>
                      )}
                    </p>
                    <p className="font-figtree text-[12px] text-zinc-400 mt-0.5">{stage.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Refund note */}
      {ret.refund ? (
        <div className="bg-emerald-50/50 rounded-[1.75rem] border border-emerald-100 p-6 flex items-start gap-4">
          <div className="size-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Wallet size={20} />
          </div>
          <div>
            <p className="font-figtree text-sm font-bold text-emerald-900">Refund processed</p>
            <p className="font-figtree text-[13px] text-emerald-800/70 mt-0.5 leading-relaxed">
              A refund of {ret.refund.currency} {ret.refund.amount} was recorded{ret.refund.createdAt ? ` on ${formatDate(ret.refund.createdAt)}` : ""}.
              Our team will coordinate the bank transfer with you.
            </p>
          </div>
        </div>
      ) : !isTerminal && (
        <div className="bg-primary/5 rounded-[1.75rem] border border-primary/10 p-6 flex items-start gap-4">
          <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Wallet size={20} />
          </div>
          <div>
            <p className="font-figtree text-sm font-bold text-primary">Refund via bank transfer</p>
            <p className="font-figtree text-[13px] text-zinc-600 mt-0.5 leading-relaxed">
              Once your item passes quality check, our team will contact you to arrange your refund via bank transfer — within 7 days, with no return shipping fee.
            </p>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h3 className="font-figtree text-sm font-bold text-zinc-900 uppercase tracking-[0.1em] mb-4">
          Items in this return
        </h3>
        <div className="divide-y divide-zinc-100">
          {ret.items.map((item) => (
            <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
              <div className="size-16 bg-[#FBFBFB] rounded-xl overflow-hidden shrink-0 border border-zinc-50 flex items-center justify-center p-1.5">
                {item.image ? (
                  <Image src={item.image} alt={item.title} width={80} height={80} className="object-contain w-full h-full" />
                ) : (
                  <RefreshCcw className="text-zinc-200" size={22} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-figtree text-sm font-bold text-zinc-900 leading-snug">{item.title}</h4>
                <p className="font-figtree text-[12px] text-zinc-500 mt-0.5">
                  Qty {item.quantity}
                  {item.reason ? ` · ${String(item.reason).toLowerCase().replace(/_/g, " ")}` : ""}
                </p>
                {item.note && <p className="font-figtree text-[12px] text-zinc-400 mt-1 italic">“{item.note}”</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help */}
      <div className="bg-zinc-900 rounded-[1.75rem] p-6 md:p-7 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0">
            <HelpCircle size={20} />
          </div>
          <div>
            <p className="font-figtree text-sm font-bold text-white">Need help with this return?</p>
            <p className="font-figtree text-[12px] text-white/60 mt-0.5">Our support team is here for you.</p>
          </div>
        </div>
        <Link prefetch={false} href="/admin/orders" className="font-figtree text-[11px] font-bold text-white/80 hover:text-white uppercase tracking-[0.12em] whitespace-nowrap">
          My orders
        </Link>
      </div>
    </div>
  );
}
