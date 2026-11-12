"use client";

import { useEffect, useState } from "react";
import { FileText, Download, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { fetchOrderInvoiceStatus, downloadOrderInvoice } from "@/lib/api";

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

/**
 * Website-order invoice (the Ornaverse ECommSales document, printed to PDF by
 * the backend). One hook per order page, so the status is fetched once and
 * shared by the header button and the Order Summary block.
 */
export function useOrderInvoices(orderId, accessToken) {
  // The fetched result is tagged with the order it belongs to, so "loading"
  // is derived (result not for this order yet) instead of set inside the
  // effect — and a stale response for a previous order is never shown.
  const key = orderId && accessToken ? String(orderId) : null;
  const [result, setResult] = useState({ key: null, invoices: [] });
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    if (!key) return undefined;
    let alive = true;
    fetchOrderInvoiceStatus(key, accessToken)
      .then((data) => { if (alive) setResult({ key, invoices: data?.invoices || [] }); })
      .catch(() => { if (alive) setResult({ key, invoices: [] }); });
    return () => { alive = false; };
  }, [key, accessToken]);

  const loading = Boolean(key) && result.key !== key;
  const invoices = key && result.key === key ? result.invoices : [];

  const download = async (documentNo) => {
    if (downloading) return;
    setDownloading(documentNo);
    try {
      await downloadOrderInvoice(orderId, documentNo, accessToken);
    } catch (err) {
      toast.error(err?.message || "Could not download the invoice. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  return { loading, invoices, downloading, download };
}

/** Prominent button next to the order title — only when an invoice exists. */
export function OrderInvoiceHeaderButton({ invoiceState }) {
  const { loading, invoices, downloading, download } = invoiceState;
  if (loading || invoices.length === 0) return null;

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      {invoices.map((inv) => (
        <button
          key={inv.documentNo}
          type="button"
          onClick={() => download(inv.documentNo)}
          disabled={Boolean(downloading)}
          title={`${inv.documentNo}${inv.documentDate ? ` · ${formatDate(inv.documentDate)}` : ""}`}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 md:px-4 bg-primary hover:bg-tertiary text-white text-xs md:text-sm font-semibold rounded-xl transition-all shadow-sm shadow-primary/20 disabled:opacity-60 disabled:cursor-wait"
        >
          {downloading === inv.documentNo ? (
            <Loader2 size={16} className="animate-spin shrink-0" />
          ) : (
            <Download size={16} className="shrink-0" />
          )}
          <span className="hidden sm:inline">Download Invoice</span>
          <span className="sm:hidden">Invoice</span>
          {invoices.length > 1 && (
            <span className="text-[10px] font-medium text-white/70">{inv.documentNo.split("-").pop()}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * Order Summary block: the "not available yet" notes, or — when the invoice
 * exists — a light secondary link (the main button sits next to the title).
 */
export default function OrderInvoiceDownload({ invoiceState, orderNumber, isCancelled, isShipped }) {
  const { loading, invoices, downloading, download } = invoiceState;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-tertiary/70 font-medium">
        <Loader2 size={14} className="animate-spin" />
        <span>Checking invoice…</span>
      </div>
    );
  }

  if (invoices.length === 0) {
    if (isCancelled) return null;

    // Shipped or delivered but Ornaverse has no posted invoice for it (e.g.
    // an order that was never synced to the ERP): don't promise "after
    // dispatch" — point the customer to support instead.
    if (isShipped) {
      const waText = encodeURIComponent(`Hi, I need the invoice for my order #${orderNumber || ""}.`);
      return (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-accent/5 border border-accent/20 rounded-xl text-xs font-medium text-tertiary">
          <FileText size={14} className="text-accent shrink-0 mt-0.5" />
          <span>
            Your invoice isn&apos;t available to download yet.{" "}
            <a
              href={`https://wa.me/+917304464910?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold underline underline-offset-2"
            >
              Request it on WhatsApp
            </a>
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-3 py-2.5 bg-accent/5 border border-accent/20 rounded-xl text-xs font-medium text-tertiary">
        <FileText size={14} className="text-accent shrink-0" />
        <span>Your invoice will be available here once it&apos;s generated, just before dispatch.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {invoices.map((inv) => (
        <button
          key={inv.documentNo}
          type="button"
          onClick={() => download(inv.documentNo)}
          disabled={Boolean(downloading)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-accent/5 hover:bg-accent/10 border border-accent/20 text-primary rounded-xl transition-colors disabled:opacity-60 disabled:cursor-wait"
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <FileText size={16} className="shrink-0 text-accent" />
            <span className="flex flex-col items-start min-w-0">
              <span className="text-sm font-semibold">Tax Invoice</span>
              <span className="text-[11px] text-tertiary/80 truncate">
                {inv.documentNo}{inv.documentDate ? ` · ${formatDate(inv.documentDate)}` : ""}
              </span>
            </span>
          </span>
          {downloading === inv.documentNo ? (
            <Loader2 size={16} className="animate-spin shrink-0 text-accent" />
          ) : (
            <Download size={16} className="shrink-0 text-accent" />
          )}
        </button>
      ))}
    </div>
  );
}
