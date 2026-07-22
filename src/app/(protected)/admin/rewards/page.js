"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Loader2, Gift, Check, ChevronDown, ChevronUp, AlertCircle, MapPin, Plus
} from "lucide-react";
import { apiFetch, fetchCustomerDashboardStats } from "@/lib/api";
import { shopifyStorefrontFetch, CUSTOMER_QUERY } from "@/lib/shopify-client";
import { pushPromoClick } from "@/lib/gtm";
import { OccasionForm, OccasionCards } from "@/components/rewards/OccasionStep";
import {
  listOccasions, createOccasion, deleteOccasion, sortOccasions,
  occasionAnalytics, newFormSessionId,
} from "@/lib/occasions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const CONFIG = {
  storageKey: "lucira_profile_data",
  apiBase: "/api/proxy/earn-rewards",
};

const PERSONAL_INFO_API = "https://personal-information-api-385594025448.asia-south1.run.app/";

function extractNumericId(gid = "") {
  const p = String(gid).split("/");
  return p[p.length - 1];
}

/* ─── Underline Field — matches the HTML prototype ─── */
function Field({ label, hint, children }) {
  return (
    <div className="rewards-field">
      {label && <label className="rewards-field__label">{label}</label>}
      {children}
      {hint && <span className="rewards-field__hint">{hint}</span>}
    </div>
  );
}

function UnderlineInput({ id, type = "text", value, onChange, readOnly, placeholder = "", prefix, suffix }) {
  return (
    <div className={`rewards-field__underline-wrap${readOnly ? " is-readonly" : ""}`}>
      {prefix && <span className="rewards-field__prefix">{prefix}</span>}
      <input
        id={id}
        type={type}
        value={value || ""}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        placeholder={placeholder}
        className="rewards-field__input"
      />
      {suffix && <span className="rewards-field__suffix">{suffix}</span>}
    </div>
  );
}

function UnderlineSelect({ id, value, onChange, children }) {
  return (
    <div className="rewards-field__underline-wrap rewards-field__select-wrap">
      <select
        id={id}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="rewards-field__input rewards-field__select"
      >
        {children}
      </select>
      <ChevronDown size={13} className="rewards-field__select-icon" />
    </div>
  );
}

/* ─── Segmented gender control ─── */
function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="rewards-segmented">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rewards-segmented__btn${value === opt ? " is-active" : ""}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function EarnRewardsPage() {
  const { accessToken } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    first_name: "", last_name: "", mobile_number: "", date_of_birth: "",
    profession: "", gender: "", pincode: "", email: ""
  });
  const [profileComplete, setProfileComplete] = useState(false);
  const [nectorCoins, setNectorCoins] = useState(null);
  const [coinsLoading, setCoinsLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Occasions
  const [occasions, setOccasions] = useState([]);
  const [addingOcc, setAddingOcc] = useState(false);
  const [deletingOccId, setDeletingOccId] = useState(null);

  // Accordions
  const [personalOpen, setPersonalOpen] = useState(true);
  const [occasionOpen, setOccasionOpen] = useState(true);

  // Sheet
  const [isOccasionSheetOpen, setIsOccasionSheetOpen] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const raw = localStorage.getItem(CONFIG.storageKey);
        if (raw) {
          const p = JSON.parse(raw);
          if (p.formData?.step_1) setFormData(prev => ({ ...prev, ...p.formData.step_1 }));
          setProfileComplete(!!p.profileComplete);
        }
      } catch {}

      if (accessToken) {
        await fetchServerProgress();
        try {
          const list = await listOccasions(accessToken);
          setOccasions(sortOccasions(list));
        } catch {}
      }
      setPageLoading(false);
      fetchCoins();
    }
    init();
  }, [accessToken]);

  async function fetchCoins() {
    setCoinsLoading(true);
    try {
      const stats = await fetchCustomerDashboardStats(accessToken);
      const points = Number(String(stats?.points ?? "").replace(/,/g, ""));
      if (Number.isFinite(points)) setNectorCoins(points);
    } catch {}
    finally { setCoinsLoading(false); }
  }

  async function fetchServerProgress() {
    try {
      if (!accessToken) return;
      const profileData = await shopifyStorefrontFetch(CUSTOMER_QUERY, { customerAccessToken: accessToken });
      const c = profileData?.customer;
      const simpleId = extractNumericId(c?.id || "");
      if (!simpleId) return;

      const d = await apiFetch(`${CONFIG.apiBase}/get-progress.php?customer_id=shopify-${simpleId}&t=${Date.now()}`);
      setProfileComplete(!!d?.profile_complete);

      const savedData = d?.form_data?.step_1 || {};
      setFormData(prev => ({
        ...prev, ...savedData,
        first_name: savedData.first_name || c?.firstName || "",
        last_name: savedData.last_name || c?.lastName || "",
        email: savedData.email || c?.email || "",
        mobile_number: savedData.mobile_number || c?.phone || "",
      }));
    } catch (e) { console.warn("Server progress:", e); }
  }

  async function savePersonalInfo(stepData) {
    try {
      if (!accessToken) return;
      const profileData = await shopifyStorefrontFetch(CUSTOMER_QUERY, { customerAccessToken: accessToken });
      const simpleId = extractNumericId(profileData?.customer?.id || "");
      if (!simpleId) return;
      await fetch(PERSONAL_INFO_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: simpleId,
          first_name: stepData.first_name || "",
          last_name: stepData.last_name || "",
          email: stepData.email || "",
          phone: stepData.mobile_number || "",
          note: `dob:${stepData.date_of_birth || ""};gender:${stepData.gender || ""};pincode:${stepData.pincode || ""};profession:${stepData.profession || ""}`,
          date_of_birth: stepData.date_of_birth || "",
        }),
      });
    } catch (e) { console.warn("personal-info save failed:", e); }
  }

  async function apiSave(step, stepData, autoSave = false) {
    try {
      if (!accessToken) return;
      const profileData = await shopifyStorefrontFetch(CUSTOMER_QUERY, { customerAccessToken: accessToken });
      const simpleId = extractNumericId(profileData?.customer?.id || "");
      if (!simpleId) return;
      const payload = {
        customer_id: `shopify-${simpleId}`, step,
        form_data: stepData,
        all_form_data: { step_1: stepData },
        auto_save: autoSave,
      };
      const d = await apiFetch(`${CONFIG.apiBase}/save-step.php`, {
        method: "POST", keepalive: true, body: JSON.stringify(payload),
      });
      if (!autoSave && d.coins_awarded) fetchCoins();
      return d;
    } catch {}
  }

  function handleChange(field, value) {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      try {
        const raw = localStorage.getItem(CONFIG.storageKey) || "{}";
        const p = JSON.parse(raw);
        localStorage.setItem(CONFIG.storageKey, JSON.stringify({ ...p, formData: { step_1: next } }));
      } catch {}
      return next;
    });
  }

  async function detectPincode() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setPincodeLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const pin =
            data?.address?.postcode ||
            data?.address?.postal_code ||
            "";
          if (pin) {
            handleChange("pincode", pin.replace(/\s/g, "").slice(0, 6));
          } else {
            alert("Could not detect pincode. Please enter manually.");
          }
        } catch {
          alert("Location lookup failed. Please enter pincode manually.");
        } finally {
          setPincodeLoading(false);
        }
      },
      () => {
        alert("Location access denied. Please enter pincode manually.");
        setPincodeLoading(false);
      },
      { timeout: 10000 }
    );
  }

  async function completeProfile() {
    if (!formData.first_name || !formData.date_of_birth || !formData.gender || !formData.pincode) {
      alert("Please fill in all required fields marked with *");
      return;
    }
    setCompleting(true);
    pushPromoClick({ creative_name: "Completed User Profile", location_id: "admin rewards" });
    await savePersonalInfo(formData);
    await apiSave(4, formData, false);
    try {
      const profileData = await shopifyStorefrontFetch(CUSTOMER_QUERY, { customerAccessToken: accessToken });
      const simpleId = extractNumericId(profileData?.customer?.id || "");
      if (simpleId) {
        await apiFetch(`/api/customer/reward/profile-complete`, {
          method: "POST", body: JSON.stringify({ customerId: simpleId })
        });
      }
    } catch {}
    setProfileComplete(true);
    fetchCoins();
    try {
      const raw = localStorage.getItem(CONFIG.storageKey) || "{}";
      const p = JSON.parse(raw);
      localStorage.setItem(CONFIG.storageKey, JSON.stringify({ ...p, profileComplete: true }));
    } catch {}
    setCompleting(false);
  }

  async function addOccasion(form) {
    setAddingOcc(true);
    try {
      const created = await createOccasion(form, accessToken);
      const next = sortOccasions([created, ...occasions.filter((o) => o.occasion_id !== created.occasion_id)]);
      setOccasions(next);
      occasionAnalytics.created(newFormSessionId(), form, next.length);
      setIsOccasionSheetOpen(false);
      return true;
    } catch { return false; }
    finally { setAddingOcc(false); }
  }

  async function removeOccasion(o) {
    setDeletingOccId(o.occasion_id);
    try {
      await deleteOccasion(o.occasion_id, accessToken);
      const next = occasions.filter((x) => x.occasion_id !== o.occasion_id);
      setOccasions(next);
      occasionAnalytics.deleted(o, next.length);
    } catch {
      window.alert("We could not delete this occasion. Please try again.");
    } finally { setDeletingOccId(null); }
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 size={36} className="animate-spin text-primary" />
        <p className="text-xs uppercase tracking-[0.2em] text-[#9a8f85]">Loading your rewards…</p>
      </div>
    );
  }

  return (
    <div className="rewards-page">
      <style>{`
        /* ─── Design tokens — all derived from var(--primary) ─── */
        .rewards-page {
          --rw-primary: var(--primary, #5A413F);
          --rw-primary-fg: var(--primary-foreground, #fff);
          --rw-tint:   color-mix(in srgb, var(--primary) 7%,  white);
          --rw-tint-md: color-mix(in srgb, var(--primary) 14%, white);
          --rw-tint-border: color-mix(in srgb, var(--primary) 25%, white);
          --rw-border: #E8DED6;
          --rw-text:   #2B2321;
          --rw-muted:  #8C7A73;
          --rw-faint:  #B7A9A2;
          font-family: 'Figtree', var(--font-figtree), ui-sans-serif, system-ui, -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
          animation: rwFade .35s ease;
          max-width: 900px;
        }
        @keyframes rwFade { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

        /* ─── Coin strip ─── */
        .rewards-strip {
          background: linear-gradient(135deg, #1a1208 0%, #2d1f0e 40%, #1a1208 100%);
          border-radius: 14px;
          padding: 22px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
          position: relative;
          overflow: hidden;
        }
        .rewards-strip::before {
          content: "";
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(176,141,87,.18) 60%, rgba(228,207,165,.22) 70%, transparent 80%);
          pointer-events: none;
        }
        .rewards-strip::after {
          content: "";
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(228,207,165,.5) 40%, rgba(228,207,165,.5) 60%, transparent);
          pointer-events: none;
        }
        .rewards-strip__left { display:flex; align-items:center; gap:14px; position:relative; }
        .rewards-strip__icon {
          width:46px; height:46px; border-radius:50%;
          background:rgba(176,141,87,.2); border:1px solid rgba(228,207,165,.25);
          display:flex; align-items:center; justify-content:center;
          color:#E4CFA5; flex:0 0 auto;
        }
        .rewards-strip__coins { text-align:right; position:relative; }

        /* ─── Section card ─── */
        .rewards-card {
          background:#fff;
          border:1px solid var(--rw-border);
          border-radius:16px;
          overflow:hidden;
          margin-bottom:20px;
        }
        .rewards-card__header {
          display:flex; align-items:center; justify-content:space-between;
          padding:18px 24px;
          cursor:pointer;
          border-bottom:1px solid transparent;
          transition:background .15s ease;
        }
        .rewards-card__header:hover { background:var(--rw-tint); }
        .rewards-card__header.is-open { border-bottom-color:var(--rw-border); }
        .rewards-card__title {
          font-weight:600; color:var(--rw-primary); margin:0;
          display:flex; align-items:center; gap:8px;
        }
        .rewards-card__dot {
          width:5px; height:5px; background:var(--rw-primary); transform:rotate(45deg); flex:0 0 auto; opacity:.45;
        }
        .rewards-card__chevron {
          width:28px; height:28px; border-radius:50%;
          background:var(--rw-tint);
          border:1px solid var(--rw-tint-border);
          display:flex; align-items:center; justify-content:center;
          color:var(--rw-primary); flex:0 0 auto;
          transition:background .15s ease;
        }
        .rewards-card__header:hover .rewards-card__chevron { background:var(--rw-tint-md); }
        .rewards-card__body { padding:28px 24px 32px; }

        /* ─── Form grid ─── */
        .rewards-form-grid {
          display:grid;
          grid-template-columns:1fr 1fr;
          column-gap:48px;
          row-gap:28px;
        }
        @media(max-width:680px){ .rewards-form-grid{ grid-template-columns:1fr; } }

        /* ─── Underline field ─── */
        .rewards-field { display:flex; flex-direction:column; gap:8px; }
        .rewards-field__label {
          letter-spacing:.1em; text-transform:uppercase;
          color:var(--rw-faint); line-height:1;
        }
        .rewards-field__hint { color:var(--rw-faint); margin-top:-2px; }
        .rewards-field__underline-wrap {
          display:flex; align-items:center; gap:8px;
          border-bottom:1px solid var(--rw-border);
          transition:border-color .2s ease;
        }
        .rewards-field__underline-wrap:focus-within { border-bottom-color:var(--rw-primary); }
        .rewards-field__underline-wrap.is-readonly { opacity:.7; }
        .rewards-field__input {
          font-family:inherit; color:var(--rw-text);
          background:transparent; border:none; outline:none; padding:6px 2px 10px;
          flex:1; min-width:0; appearance:none;
        }
        .rewards-field__input::placeholder { color:var(--rw-faint); }
        .rewards-field__select { cursor:pointer; padding-right:20px; }
        .rewards-field__select-wrap { position:relative; }
        .rewards-field__select-icon { position:absolute; right:2px; bottom:12px; pointer-events:none; color:var(--rw-faint); }
        .rewards-field__prefix { color:var(--rw-muted); padding-bottom:10px; white-space:nowrap; flex:0 0 auto; }
        .rewards-field__prefix--divider { border-right:1px solid var(--rw-border); padding-right:10px; margin-right:2px; }
        .rewards-field__suffix { letter-spacing:.06em; text-transform:uppercase; color:var(--rw-primary); white-space:nowrap; cursor:pointer; padding-bottom:10px; flex:0 0 auto; }
        .rewards-field__suffix--icon { display:flex; align-items:center; gap:4px; }

        /* ─── Segmented ─── */
        .rewards-segmented {
          display:flex; gap:24px;
          border-bottom:1px solid var(--rw-border);
        }
        .rewards-segmented__btn {
          font-family:inherit; color:var(--rw-muted);
          background:none; border:none; cursor:pointer;
          padding:6px 0 12px; position:relative;
          transition:color .15s ease;
        }
        .rewards-segmented__btn.is-active { color:var(--rw-primary); font-weight:600; }
        .rewards-segmented__btn.is-active::after {
          content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px; background:var(--rw-primary);
        }

        /* ─── Action row ─── */
        .rewards-actions { margin-top:36px; display:flex; justify-content:flex-end; }
        .rewards-btn-primary {
          background:var(--rw-primary); color:#fff;
          border:1px solid var(--rw-primary);
          font-family:inherit; letter-spacing:.1em; text-transform:uppercase;
          padding:14px 30px; border-radius:3px; cursor:pointer;
          transition:opacity .2s ease;
          display:flex; align-items:center; gap:8px;
        }
        .rewards-btn-primary:hover:not(:disabled) { opacity:.82; }
        .rewards-btn-primary:disabled { opacity:.45; cursor:not-allowed; }

        /* ─── Success banner ─── */
        .rewards-success-banner {
          display:flex; align-items:center; gap:14px;
          background:var(--rw-tint);
          border:1px solid var(--rw-tint-border);
          border-radius:12px; padding:14px 18px; margin-bottom:28px;
        }
        .rewards-success-banner__check {
          width:30px; height:30px; border-radius:50%; background:var(--rw-primary);
          display:flex; align-items:center; justify-content:center; flex:0 0 auto; color:#fff;
        }

        /* ─── Promo banner (occasions) ─── */
        .rewards-promo {
          background:var(--rw-primary); border-radius:14px;
          padding:26px 28px; display:flex; align-items:flex-start;
          justify-content:space-between; gap:20px; margin-bottom:28px;
        }
        .rewards-promo__icon {
          width:42px; height:42px; border-radius:50%;
          background:rgba(255,255,255,.15);
          display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,.9); flex:0 0 auto;
        }

        /* ─── Occasion cards header ─── */
        .occ-header {
          display:flex; align-items:center; justify-content:space-between; gap:16px;
          margin-bottom:22px; flex-wrap:wrap;
        }
        .occ-add-btn {
          display:flex; align-items:center; gap:7px;
          font-family:inherit; letter-spacing:.09em; text-transform:uppercase;
          background:var(--rw-primary); color:#fff;
          border:1px solid var(--rw-primary); border-radius:3px;
          padding:11px 20px; cursor:pointer; white-space:nowrap;
          transition:opacity .15s ease;
        }
        .occ-add-btn:hover { opacity:.85; }

        .occ-sheet-body { padding:0 24px 28px; }

        input[type=date]::-webkit-calendar-picker-indicator { cursor:pointer; opacity:.5; }
      `}</style>

      {/* ── Coin strip ── */}
      <div className="rewards-strip">
        <div className="rewards-strip__left">
          <div className="rewards-strip__icon">
            {profileComplete
              ? <Check size={22} strokeWidth={2.4} />
              : <Gift size={22} strokeWidth={1.8} />}
          </div>
          <div>
            <p className="text-base font-semibold mb-0.5" style={{color:"#F5EDD8",margin:"0 0 3px"}}>
              {profileComplete ? "Profile completed" : "Complete profile & earn"}
            </p>
            <p className="text-sm" style={{color:"rgba(228,207,165,.7)",margin:0,lineHeight:1.5}}>
              {profileComplete
                ? "You've earned 500 Lucirá coins — thank you for keeping your details current."
                : "Fill out your details below to earn 500 Lucirá coins instantly."}
            </p>
          </div>
        </div>
        <div className="rewards-strip__coins">
          <p className="text-[10px] tracking-widest uppercase" style={{color:"rgba(228,207,165,.55)",margin:"0 0 3px"}}>
            Lucirá Coins
          </p>
          <p className="text-3xl font-bold leading-none tracking-tight" style={{color:"#E4CFA5"}}>
            {coinsLoading
              ? <span className="inline-block w-12 h-7 rounded bg-white/10 animate-pulse" />
              : nectorCoins !== null ? nectorCoins.toLocaleString("en-IN") : "—"}
          </p>
        </div>
      </div>

      {/* ── Personal Details Card ── */}
      <div className="rewards-card">
        <div
          className={`rewards-card__header${personalOpen ? " is-open" : ""}`}
          onClick={() => setPersonalOpen(!personalOpen)}
        >
          <h3 className="rewards-card__title">
            <span className="rewards-card__dot" />
            Personal details
          </h3>
          <span className="rewards-card__chevron">
            {personalOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </span>
        </div>

        {personalOpen && (
          <div className="rewards-card__body">
            {profileComplete && (
              <div className="rewards-success-banner">
                <span className="rewards-success-banner__check">
                  <Check size={14} strokeWidth={2.6} />
                </span>
                <div>
                  <p className="text-sm font-medium" style={{color:"var(--rw-primary)",margin:0}}>Profile completed</p>
                  <p className="text-sm" style={{color:"var(--rw-muted)",margin:"3px 0 0"}}>
                    You&apos;ve earned 500 Lucirá coins — thank you for keeping your details current.
                  </p>
                </div>
              </div>
            )}

            <div className="rewards-form-grid">
              {/* First Name */}
              <Field label="First name">
                <UnderlineInput
                  id="first_name"
                  value={formData.first_name}
                  onChange={(v) => handleChange("first_name", v)}
                  placeholder="First name"
                />
              </Field>

              {/* Last Name */}
              <Field label="Last name">
                <UnderlineInput
                  id="last_name"
                  value={formData.last_name}
                  onChange={(v) => handleChange("last_name", v)}
                  placeholder="Last name"
                />
              </Field>

              {/* Mobile — read-only, no edit action */}
              <Field label="Mobile number">
                <UnderlineInput
                  id="mobile_number"
                  value={formData.mobile_number}
                  readOnly
                  prefix={
                    <span className="rewards-field__prefix rewards-field__prefix--divider">
                      IN +91
                    </span>
                  }
                />
              </Field>

              {/* Gender */}
              <Field label="Gender">
                <SegmentedControl
                  options={["Male", "Female", "Other"]}
                  value={formData.gender}
                  onChange={(v) => handleChange("gender", v)}
                />
              </Field>

              {/* Birthday */}
              <Field label="Birthday" hint="Look out for a treat around your birthday">
                <UnderlineInput
                  id="dob"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(v) => handleChange("date_of_birth", v)}
                  placeholder="dd-mm-yyyy"
                />
              </Field>

              {/* Pincode — OSM Nominatim auto-detect */}
              <Field label="Pincode">
                <UnderlineInput
                  id="pincode"
                  value={formData.pincode}
                  onChange={(v) => handleChange("pincode", v.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter pincode"
                  prefix={<MapPin size={15} className="rewards-field__prefix" style={{ paddingBottom: 10 }} />}
                  suffix={
                    pincodeLoading ? (
                      <span className="rewards-field__suffix" style={{ display: "flex", alignItems: "center", paddingBottom: 10 }}>
                        <Loader2 size={13} className="animate-spin" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={detectPincode}
                        className="rewards-field__suffix rewards-field__suffix--icon"
                        title="Auto-detect pincode using your location"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" />
                          <circle cx="12" cy="10" r="2.4" />
                        </svg>
                        Use location
                      </button>
                    )
                  }
                />
              </Field>

              {/* Profession */}
              <Field label="Profession" hint="Optional — helps us recommend the right pieces">
                <UnderlineSelect
                  id="profession"
                  value={formData.profession}
                  onChange={(v) => handleChange("profession", v)}
                >
                  <option value="">Select profession</option>
                  <option value="Homemaker">Homemaker</option>
                  <option value="Student">Student</option>
                  <option value="Salaried">Salaried</option>
                  <option value="Business">Business</option>
                  <option value="Other">Other</option>
                </UnderlineSelect>
              </Field>

              {/* Email */}
              <Field label="Email address">
                <UnderlineInput
                  id="email"
                  value={formData.email}
                  readOnly
                  suffix={
                    <span className="rewards-field__suffix" style={{ display: "flex", alignItems: "center", gap: 4, paddingBottom: 10 }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#5bc236", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={11} color="#fff" strokeWidth={3} />
                      </span>
                    </span>
                  }
                />
              </Field>
            </div>

            {!profileComplete && (
              <div className="rewards-actions">
                <button
                  className="rewards-btn-primary"
                  onClick={completeProfile}
                  disabled={completing || !formData.date_of_birth || !formData.gender || !formData.pincode || !formData.first_name}
                >
                  {completing ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save details"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Occasion Details Card ── */}
      <div className="rewards-card">
        <div
          className={`rewards-card__header${occasionOpen ? " is-open" : ""}`}
          onClick={() => setOccasionOpen(!occasionOpen)}
        >
          <h3 className="rewards-card__title">
            <span className="rewards-card__dot" />
            Occasion reminders
          </h3>
          <span className="rewards-card__chevron">
            {occasionOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </span>
        </div>

        {occasionOpen && (
          <div className="rewards-card__body">
            <div className="rewards-promo">
              <div>
                <p className="text-base font-semibold" style={{color:"#fff",margin:"0 0 6px"}}>
                  Perfectly timed, quietly personal
                </p>
                <p className="text-sm leading-relaxed" style={{color:"rgba(255,255,255,.72)",margin:0,maxWidth:380}}>
                  We&apos;ll send a tailored offer 21 days before each occasion you add — never during the celebration itself.
                </p>
              </div>
              <span className="rewards-promo__icon">
                <Gift size={20} strokeWidth={1.6} />
              </span>
            </div>

            <div className="occ-header">
              <div>
                <p className="text-sm font-semibold" style={{color:"var(--rw-primary)",margin:"0 0 3px"}}>
                  Occasions on file
                </p>
                <p className="text-sm" style={{color:"var(--rw-muted)",margin:0}}>
                  Manage your important dates to receive personalised offers.
                </p>
              </div>
              <button className="occ-add-btn text-xs" onClick={() => setIsOccasionSheetOpen(true)}>
                <Plus size={14} /> Add occasion
              </button>
            </div>

            <OccasionCards
              occasions={occasions}
              onDelete={removeOccasion}
              deletingId={deletingOccId}
            />
          </div>
        )}
      </div>

      {/* ── Add Occasion Sheet ── */}
      <Sheet open={isOccasionSheetOpen} onOpenChange={setIsOccasionSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[440px] overflow-y-auto p-0 font-[Figtree,var(--font-figtree),ui-sans-serif]">
          <SheetHeader className="px-6 pt-6 pb-5 border-b border-[#E8DED6] sticky top-0 bg-white z-10">
            <SheetTitle className="text-base font-semibold text-[#3E2B29]">Add occasion</SheetTitle>
            <p className="text-sm text-[#8C7A73] mt-1">Add the people and dates you shop for — we&apos;ll take it from there.</p>
          </SheetHeader>
          <div className="px-6 pt-6">
            <OccasionForm
              onAdd={addOccasion}
              adding={addingOcc}
              onCancel={() => setIsOccasionSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
