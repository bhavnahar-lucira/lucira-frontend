"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/redux/features/user/userSlice";
import { Loader2, ArrowLeft, ExternalLink, TicketPercent, ChevronRight } from "lucide-react";
import Link from "next/link";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function cleanPhone(raw) {
  if (!raw) return "";
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 10) return digits;
  return digits;
}

function fmtAmount(val) {
  if (val === null || val === undefined) return "0";
  return Number(val).toLocaleString("en-IN");
}

function fmtDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }) {
  const isActive = status === 1;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
        isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function PaymentBadge({ made }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
        made ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
      }`}
    >
      {made ? "Paid" : "Pending"}
    </span>
  );
}

/* ─── Enroll CTA ────────────────────────────────────────────────────────────*/
function EnrollBar({ url, label = "Enroll New Scheme" }) {
  return (
    <div className="flex justify-center mt-8">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-10 py-4 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 transition-all"
      >
        <ExternalLink size={14} />
        {label}
      </a>
    </div>
  );
}

/* ─── Detail View ───────────────────────────────────────────────────────────*/
function SchemeDetail({ scheme, onBack, enrollUrl }) {
  const details = scheme.scheme_monthly_details || [];
  const displayName =
    scheme.scheme_display_name ||
    `${scheme.scheme_unique_code || ""} | ${scheme.scheme_code || ""}`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="size-10 flex items-center justify-center rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h3 className="text-lg md:text-xl font-bold text-zinc-900 tracking-tight">{displayName}</h3>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">Monthly payment history</p>
        </div>
      </div>

      {/* Desktop Table */}
      {details.length > 0 ? (
        <>
          <div className="hidden md:block overflow-x-auto rounded-3xl border border-zinc-100 bg-white shadow-sm">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-100">
                  {["Status", "Due Date", "Month Amount", "Paid On", "Delay (days)", "Days Held", "Applied Rate"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-4 text-[10px] font-black text-primary uppercase tracking-widest whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {details.map((d, i) => (
                  <tr key={i} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4"><PaymentBadge made={d.payment_made} /></td>
                    <td className="px-6 py-4 text-zinc-600 font-medium">{fmtDate(d.due_date)}</td>
                    <td className="px-6 py-4 font-bold text-zinc-900">₹{fmtAmount(d.month_amount)}</td>
                    <td className="px-6 py-4 text-zinc-600 font-medium">{fmtDate(d.paid_on_date)}</td>
                    <td className="px-6 py-4 text-zinc-600 font-medium">{d.delay_days ?? 0}</td>
                    <td className="px-6 py-4 text-zinc-600 font-medium">{d.days_held ?? "—"}</td>
                    <td className="px-6 py-4 text-zinc-600 font-medium">{d.applied_rate ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {details.map((d, i) => (
              <div key={i} className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Month {i + 1}</span>
                  <PaymentBadge made={d.payment_made} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Due Date", fmtDate(d.due_date)],
                    ["Amount", `₹${fmtAmount(d.month_amount)}`],
                    ["Paid On", fmtDate(d.paid_on_date)],
                    ["Delay", `${d.delay_days ?? 0} days`],
                    ["Days Held", d.days_held ?? "—"],
                    ["Applied Rate", d.applied_rate ?? "—"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[10px] font-black text-primary uppercase tracking-wider mb-0.5">{label}</p>
                      <p className="font-bold text-zinc-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-3xl border border-zinc-100 p-10 text-center shadow-sm">
          <p className="text-zinc-400 font-medium">No monthly details available for this scheme.</p>
        </div>
      )}

      <EnrollBar url={enrollUrl} />
    </div>
  );
}

/* ─── Scheme List ───────────────────────────────────────────────────────────*/
function SchemeList({ schemes, onSelect, enrollUrl }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-3xl border border-zinc-100 bg-white shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-100">
              {["Scheme Code", "Customer Name", "Unique Code", "Scheme Amount", "Status", ""].map(
                (h, i) => (
                  <th
                    key={i}
                    className="text-left px-6 py-4 text-[10px] font-black text-primary uppercase tracking-widest whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {schemes.map((s, i) => (
              <tr
                key={i}
                onClick={() => onSelect(s)}
                className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50 cursor-pointer transition-colors group"
              >
                <td className="px-6 py-4 font-black text-primary">{s.scheme_code || s.scheme_unique_code}</td>
                <td className="px-6 py-4 font-medium text-zinc-700">{s.party_name || "—"}</td>
                <td className="px-6 py-4 text-zinc-500">{s.scheme_unique_code || "—"}</td>
                <td className="px-6 py-4 font-bold text-zinc-900">₹{fmtAmount(s.scheme_amount)}</td>
                <td className="px-6 py-4"><StatusBadge status={s.scheme_status} /></td>
                <td className="px-6 py-4 text-zinc-300 group-hover:text-primary transition-colors">
                  <ChevronRight size={18} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {schemes.map((s, i) => (
          <div
            key={i}
            onClick={() => onSelect(s)}
            className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-black text-primary uppercase tracking-widest mb-0.5">
                  {s.scheme_code || s.scheme_unique_code}
                </p>
                <p className="text-sm font-bold text-zinc-900">{s.party_name || "—"}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={s.scheme_status} />
                <ChevronRight size={16} className="text-zinc-300" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-50 text-sm">
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-0.5">Code</p>
                <p className="font-bold text-zinc-700">{s.scheme_unique_code || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-0.5">Amount</p>
                <p className="font-bold text-zinc-900">₹{fmtAmount(s.scheme_amount)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <EnrollBar url={enrollUrl} />
    </div>
  );
}

/* ─── Empty State ───────────────────────────────────────────────────────────*/
function EmptySchemes({ enrollUrl }) {
  return (
    <div className="bg-white rounded-[3rem] border-2 border-dashed border-zinc-100 py-20 text-center space-y-6">
      <div className="size-20 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto">
        <TicketPercent size={40} className="text-primary/40" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">No Enrolled Schemes</h3>
        <p className="text-zinc-500 font-medium max-w-sm mx-auto">
          You haven't enrolled in any savings scheme yet. Start your jewelry savings journey today!
        </p>
      </div>
      <a
        href={enrollUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-white text-sm font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 transition-transform"
      >
        <ExternalLink size={16} />
        Enroll Now
      </a>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────*/
export default function SchemesPage() {
  const user = useSelector(selectUser);

  const [schemes, setSchemes] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phone, setPhone] = useState("");

  // Build enroll URL (phone + timestamp + HMAC are generated server-side in prod;
  // here we just deep-link to the public enrollment page)
  const enrollUrl = `https://schemes.lucirajewelry.com`;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        // Fetch profile to get phone (user in redux may not have phone)
        const profRes = await fetch("/api/customer/profile");
        if (!profRes.ok) throw new Error("Could not load profile");
        const profData = await profRes.json();
        const rawPhone = profData?.customer?.phone || "";
        const cleanedPhone = cleanPhone(rawPhone);
        setPhone(cleanedPhone);

        if (!cleanedPhone || cleanedPhone.length < 10) {
          setError(
            "A phone number is not linked to your account.\nPlease add your phone number in My Profile to view schemes."
          );
          return;
        }

        // Fetch schemes via our secure server-side proxy
        const res = await fetch("/api/customer/schemes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: cleanedPhone }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to load schemes");
        }

        const data = await res.json();
        setSchemes(data.schemes || []);
      } catch (err) {
        console.error("Schemes load error:", err);
        setError(err.message || "Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  /* Loading */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-white rounded-[3rem] border border-zinc-100">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading your schemes…</p>
      </div>
    );
  }

  /* Error */
  if (error) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight mb-1">My Schemes</h2>
          <p className="text-sm md:text-base text-zinc-500 font-medium">View and manage your jewelry savings schemes.</p>
        </div>
        <div className="bg-white rounded-[3rem] border border-zinc-100 p-10 text-center space-y-4 shadow-sm">
          <div className="size-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto">
            <TicketPercent size={28} className="text-red-400" />
          </div>
          <p className="text-zinc-600 font-medium whitespace-pre-line">{error}</p>
          {error.includes("phone") && (
            <Link
              href="/admin/profile"
              className="inline-block mt-2 px-8 py-3 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
            >
              Update Profile
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      {!selectedScheme && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight mb-1">My Schemes</h2>
            <p className="text-sm md:text-base text-zinc-500 font-medium">View and manage your jewelry savings schemes.</p>
          </div>
          {schemes.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-white border border-zinc-100 rounded-xl text-xs font-black text-zinc-400">
                {schemes.length} SCHEME{schemes.length !== 1 ? "S" : ""}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {selectedScheme ? (
        <SchemeDetail
          scheme={selectedScheme}
          onBack={() => setSelectedScheme(null)}
          enrollUrl={enrollUrl}
        />
      ) : schemes.length === 0 ? (
        <EmptySchemes enrollUrl={enrollUrl} />
      ) : (
        <SchemeList
          schemes={schemes}
          onSelect={setSelectedScheme}
          enrollUrl={enrollUrl}
        />
      )}

      {/* Info Banner */}
      {!selectedScheme && (
        <div className="bg-white rounded-[2.5rem] p-10 border border-zinc-100 relative overflow-hidden shadow-sm">
          <div className="absolute -right-20 -bottom-20 size-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto md:mx-0">
                <TicketPercent size={28} className="text-primary" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">What are Lucira Schemes?</h3>
                <p className="text-zinc-500 font-medium max-w-md mt-2">
                  Our jewelry savings schemes let you save monthly and redeem on your dream jewelry purchase.
                  Enroll now and get exclusive member benefits.
                </p>
              </div>
            </div>
            <a
              href={enrollUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-5 bg-primary text-white text-sm font-black uppercase tracking-[0.2em] rounded-[1.5rem] hover:scale-105 transition-transform shadow-2xl shadow-primary/20 whitespace-nowrap flex items-center gap-2"
            >
              <ExternalLink size={16} />
              Learn More
            </a>
          </div>
        </div>
      )}
    </div>
  );
}