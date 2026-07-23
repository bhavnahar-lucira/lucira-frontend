"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Loader2, Gift, Check, ChevronDown, ChevronUp, AlertCircle, MapPin, Plus, ChevronRight,
  UserRound, CalendarHeart
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
const WEBENGAGE_SYNC_API = "https://complete-my-profile-385594025448.asia-south1.run.app";

/* Normalise an Indian mobile number to E.164 (+91XXXXXXXXXX) — used as the WebEngage userId */
function toE164(phone) {
  const raw = String(phone || "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return raw.replace(/\s|-/g, "");
  const digits = raw.replace(/\D/g, "");
  return digits ? `+91${digits.slice(-10)}` : "";
}

/* Push the saved profile to WebEngage via the GCP Cloud Function ({ userId, attributes }) */
async function syncWebEngageProfile(d = {}) {
  const userId = toE164(d.mobile_number);
  if (!userId) return; // WebEngage needs an identifier

  // Only send attributes that have a value, so we never overwrite existing data with blanks.
  const attributes = { we_phone: userId };
  if (d.first_name) attributes.we_first_name = d.first_name;
  if (d.last_name) attributes.we_last_name = d.last_name;
  if (d.email) attributes.we_email = d.email;
  if (d.date_of_birth) attributes.we_birth_date = d.date_of_birth;     // YYYY-MM-DD
  if (d.gender) attributes.we_gender = String(d.gender).toLowerCase(); // male | female | other
  if (d.marital_status) attributes.marital_status = d.marital_status;
  if (d.anniversary_date) attributes.anniversary_date = d.anniversary_date;
  if (d.pincode) attributes.pincode = d.pincode;
  if (d.profession) attributes.profession = d.profession;

  try {
    await fetch(WEBENGAGE_SYNC_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, attributes }),
      keepalive: true,
    });
  } catch (e) {
    console.warn("WebEngage profile sync failed:", e);
  }
}

function extractNumericId(gid = "") {
  const p = String(gid).split("/");
  return p[p.length - 1];
}

/* Required fields that define a "complete" profile */
const REQUIRED_FIELDS = ["first_name", "date_of_birth", "gender", "pincode", "marital_status"];

function isProfileFilled(d = {}) {
  const base = REQUIRED_FIELDS.every((k) => d[k] && String(d[k]).trim());
  const anniversaryOk =
    d.marital_status === "Married"
      ? !!(d.anniversary_date && String(d.anniversary_date).trim())
      : true;
  return base && anniversaryOk;
}

/* ─── Field label + control wrapper ─── */
function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-[11px] font-semibold uppercase tracking-[0.13em] text-zinc-400">{label}</label>}
      {children}
      {hint && <span className="text-xs text-zinc-400 font-normal leading-relaxed">{hint}</span>}
    </div>
  );
}

/* ─── Filled input — refer & earn inspired ─── */
function BoxInput({ id, type = "text", value, onChange, readOnly, placeholder = "", prefix, suffix }) {
  return (
    <div className={`flex items-center gap-3 border rounded-lg px-4 transition-colors focus-within:border-primary focus-within:bg-white ${readOnly ? "border-zinc-100 bg-zinc-50/60" : "bg-zinc-50 border-zinc-200"}`}>
      {prefix && <span className="text-sm font-medium text-zinc-500 whitespace-nowrap shrink-0 border-r border-zinc-200 pr-3 flex items-center">{prefix}</span>}
      <input
        id={id}
        type={type}
        value={value || ""}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        placeholder={placeholder}
        className="bg-transparent border-none outline-none py-3 flex-1 min-w-0 text-sm font-medium text-zinc-900 placeholder:text-zinc-300"
      />
      {suffix && <span className="shrink-0 flex items-center">{suffix}</span>}
    </div>
  );
}

/* ─── Filled select ─── */
function BoxSelect({ id, value, onChange, children }) {
  return (
    <div className="relative flex items-center bg-zinc-50 border border-zinc-200 rounded-lg px-4 transition-colors focus-within:border-primary focus-within:bg-white">
      <select
        id={id}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-none outline-none py-3 flex-1 min-w-0 text-sm font-medium text-zinc-900 appearance-none cursor-pointer pr-6"
      >
        {children}
      </select>
      <ChevronDown size={15} className="absolute right-4 pointer-events-none text-zinc-400" />
    </div>
  );
}

/* ─── Segmented pill control ─── */
function ChipGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt)}
            className={`text-sm font-medium rounded-lg px-4 sm:px-5 py-3 border transition-colors ${selected ? "bg-primary border-primary text-white shadow-sm shadow-primary/20" : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-primary/40 hover:text-zinc-900"}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function EarnRewardsPage() {
  const { accessToken, user } = useSelector((state) => state.user);
  const userStorageKey = user?.id ? `${CONFIG.storageKey}_${extractNumericId(user.id)}` : CONFIG.storageKey;

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

  // Was the profile already complete-and-saved when the page finished loading (this device)?
  const [completedOnLoad, setCompletedOnLoad] = useState(false);
  // Did the user successfully save a complete profile during this session?
  const [savedThisSession, setSavedThisSession] = useState(false);

  const profileFilled = isProfileFilled(formData);
  // "Completed" means it was genuinely complete on load, or the user just saved it — NOT
  // simply that the fields are full right now (that would hide the button mid-edit and let a
  // stale flag claim completion).
  const isCompleted = completedOnLoad || savedThisSession;

  // Capture completion state once, from the data that loaded from the server / localStorage.
  useEffect(() => {
    if (!pageLoading) {
      setCompletedOnLoad(profileComplete && isProfileFilled(formData));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageLoading]);

  useEffect(() => {
    async function init() {
      try {
        const raw = localStorage.getItem(userStorageKey);
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

      const d = await apiFetch(`/api/customer/progress`);
      
      setProfileComplete(prev => prev || !!d?.profile_complete);

      const savedData = d?.form_data?.step_1 || {};
      setFormData(prev => ({
        ...prev, ...savedData,
        first_name: savedData.first_name || c?.firstName || "",
        last_name: savedData.last_name || c?.lastName || "",
        email: savedData.email || c?.email || "",
        mobile_number: savedData.mobile_number || c?.phone || "",
        marital_status: savedData.marital_status || "",
        anniversary_date: savedData.anniversary_date || "",
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
          note: `dob:${stepData.date_of_birth || ""};gender:${stepData.gender || ""};pincode:${stepData.pincode || ""};profession:${stepData.profession || ""};marital_status:${stepData.marital_status || ""};anniversary_date:${stepData.anniversary_date || ""}`,
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
        const raw = localStorage.getItem(userStorageKey) || "{}";
        const p = JSON.parse(raw);
        localStorage.setItem(userStorageKey, JSON.stringify({ ...p, formData: { step_1: next } }));
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
    if (!formData.first_name || !formData.date_of_birth || !formData.gender || !formData.pincode || !formData.marital_status) {
      alert("Please fill in all required fields marked with *");
      return;
    }
    if (formData.marital_status === "Married" && !formData.anniversary_date) {
      alert("Please provide your anniversary date.");
      return;
    }
    setCompleting(true);
    pushPromoClick({ creative_name: "Completed User Profile", location_id: "admin rewards" });
    await savePersonalInfo(formData);
    await syncWebEngageProfile(formData);
    try {
      const profileData = await shopifyStorefrontFetch(CUSTOMER_QUERY, { customerAccessToken: accessToken });
      const simpleId = extractNumericId(profileData?.customer?.id || "");
      if (simpleId) {
        await apiFetch(`/api/customer/reward/profile-complete`, {
          method: "POST", body: JSON.stringify({ customerId: simpleId, formData })
        });
      }
    } catch {}
    setProfileComplete(true);
    setSavedThisSession(true);
    fetchCoins();
    try {
      const raw = localStorage.getItem(userStorageKey) || "{}";
      const p = JSON.parse(raw);
      localStorage.setItem(userStorageKey, JSON.stringify({ ...p, profileComplete: true }));
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
    <div className="font-figtree flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl">
      {/* ── Coin strip / Claim Banner ── */}
      <div className="bg-[#5a413f] rounded-[2rem] md:rounded-[4px] p-4 md:py-4 md:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6 shadow-lg shadow-black/5 border border-white/10">
        <div className="flex items-center gap-3.5 md:gap-4 w-full sm:w-auto">
          <div className="shrink-0 rounded-full bg-white/5 border border-white/10 shadow-sm">
            <img
              src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/image_3494_77267ae6-b0ed-4923-b485-e9c957ad34b2.png?v=1784708230"
              alt="Lucira Coins"
              className="size-9 md:size-11 object-contain drop-shadow-md"
            />
          </div>
          <p className="text-white/95 font-semibold text-base leading-snug">
             {isCompleted
               ? "Welcome to your rewards! Enjoy exclusive offers and member benefits."
               : "Free 500 Lucirá coins on completing your profile"}
          </p>
        </div>
        
        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-3 bg-black/20 backdrop-blur-sm border border-white/10 py-2.5 px-4 md:py-2 md:px-5 rounded-xl sm:rounded-full shadow-[inset_0_1px_10px_rgba(0,0,0,0.2)]">
           <p className="text-[10px] md:text-xs tracking-widest uppercase text-white font-medium mt-0.5">Balance</p>
           <div className="flex items-center gap-1.5 md:gap-2">
             <img 
               src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/image_3494_77267ae6-b0ed-4923-b485-e9c957ad34b2.png?v=1784708230" 
               alt="Coins" 
               className="size-4 md:size-5 object-contain drop-shadow-sm" 
             />
             <p className="text-xl md:text-2xl font-semibold leading-none tracking-tight text-[#FDE073]">
                {coinsLoading ? <span className="inline-block w-8 h-4 rounded bg-[#FDE073]/20 animate-pulse" /> : nectorCoins !== null ? nectorCoins.toLocaleString("en-IN") : "—"}
             </p>
           </div>
        </div>
      </div>

      {/* ── Personal Details Card ── */}
      <div className="bg-white rounded-[2rem] md:rounded-[4px] border border-zinc-100 shadow-sm overflow-hidden">
        <div
          className={`flex items-center justify-between gap-3 sm:gap-4 px-5 sm:px-6 md:px-8 py-5 md:py-6 cursor-pointer hover:bg-zinc-50/60 transition-colors border-b ${personalOpen ? "border-zinc-100" : "border-transparent"}`}
          onClick={() => setPersonalOpen(!personalOpen)}
        >
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="size-11 md:size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <UserRound size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg md:text-xl font-semibold text-zinc-900 tracking-tight m-0">Personal details</h3>
              <p className="text-xs md:text-sm text-zinc-400 font-normal mt-0.5 leading-relaxed">Keep your details current to personalise your rewards.</p>
            </div>
          </div>
          <span className="size-9 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
            {personalOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>

        {personalOpen && (
          <div className="px-5 sm:px-6 pb-6 pt-5 md:px-8 md:pb-8 md:pt-6">
            {isCompleted && (
              <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-8">
                <span className="size-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                  <Check size={14} strokeWidth={2.6} />
                </span>
                <div>
                  <p className="text-sm font-medium text-emerald-800 m-0">Profile completed</p>
                  <p className="text-sm text-emerald-600/80 mt-1 mb-0">
                    You&apos;ve earned 500 Lucirá coins — thank you for keeping your details current.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-7">
              {/* First Name */}
              <Field label="First name">
                <BoxInput
                  id="first_name"
                  value={formData.first_name}
                  onChange={(v) => handleChange("first_name", v)}
                  placeholder="First name"
                />
              </Field>

              {/* Last Name */}
              <Field label="Last name">
                <BoxInput
                  id="last_name"
                  value={formData.last_name}
                  onChange={(v) => handleChange("last_name", v)}
                  placeholder="Last name"
                />
              </Field>

              {/* Mobile — read-only, no edit action */}
              <Field label="Mobile number">
                <BoxInput
                  id="mobile_number"
                  value={formData.mobile_number}
                  readOnly
                  prefix="IN +91"
                />
              </Field>

              {/* Gender */}
              <Field label="Gender *">
                <ChipGroup
                  options={["Male", "Female", "Other"]}
                  value={formData.gender}
                  onChange={(v) => handleChange("gender", v)}
                />
              </Field>

              {/* Marital Status */}
              <Field label="Marital status *">
                <ChipGroup
                  options={["Married", "Unmarried"]}
                  value={formData.marital_status}
                  onChange={(v) => {
                    handleChange("marital_status", v);
                    if (v === "Unmarried") handleChange("anniversary_date", "");
                  }}
                />
              </Field>

              {/* Birthday */}
              <Field label="Birthday *" hint="Look out for a treat around your birthday">
                <BoxInput
                  id="dob"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(v) => handleChange("date_of_birth", v)}
                />
              </Field>

              {/* Anniversary (Conditional) */}
              {formData.marital_status === "Married" && (
                <Field label="Anniversary Date *" hint="Celebrate your special day with us">
                  <BoxInput
                    id="anniversary"
                    type="date"
                    value={formData.anniversary_date}
                    onChange={(v) => handleChange("anniversary_date", v)}
                  />
                </Field>
              )}

              {/* Pincode */}
              <Field label="Pincode *">
                <BoxInput
                  id="pincode"
                  value={formData.pincode}
                  onChange={(v) => handleChange("pincode", v.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter pincode"
                  prefix={<MapPin size={15} className="text-zinc-400" />}
                  suffix={
                    pincodeLoading ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <button
                        type="button"
                        onClick={detectPincode}
                        className="bg-transparent border-none cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary p-0"
                        title="Auto-detect pincode using your location"
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
                <BoxSelect
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
                </BoxSelect>
              </Field>

              {/* Email */}
              <Field label="Email address *">
                <BoxInput
                  id="email"
                  value={formData.email}
                  readOnly
                  suffix={
                    <span className="size-[18px] rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  }
                />
              </Field>
            </div>

            {!isCompleted && (
              <div className="mt-10 flex flex-col sm:flex-row items-end sm:items-center justify-end gap-4">
                {!profileFilled && (
                  <p className="text-xs text-amber-600 font-medium bg-amber-50 py-2 px-3 rounded-lg border border-amber-100 flex items-center gap-1.5 m-0 max-w-[280px] sm:max-w-none text-right sm:text-left">
                    <AlertCircle size={14} className="shrink-0" />
                    Please fill out all required fields (*) to claim your coins.
                  </p>
                )}
                <button
                  className="bg-primary text-white border border-primary text-xs font-semibold uppercase tracking-[0.15em] px-8 py-3.5 rounded-2xl cursor-pointer transition-opacity flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 w-full sm:w-auto"
                  onClick={completeProfile}
                  disabled={completing || !profileFilled}
                >
                  {completing ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save details"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Occasion Details Card ── */}
      <div className="bg-white rounded-[2rem] md:rounded-[4px] border border-zinc-100 shadow-sm overflow-hidden">
        <div
          className={`flex items-center justify-between gap-3 sm:gap-4 px-5 sm:px-6 md:px-8 py-5 md:py-6 cursor-pointer hover:bg-zinc-50/60 transition-colors border-b ${occasionOpen ? "border-zinc-100" : "border-transparent"}`}
          onClick={() => setOccasionOpen(!occasionOpen)}
        >
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="size-11 md:size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <CalendarHeart size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg md:text-xl font-semibold text-zinc-900 tracking-tight m-0">Occasion reminders</h3>
              <p className="text-xs md:text-sm text-zinc-400 font-normal mt-0.5 leading-relaxed">Add the dates that matter for tailored offers.</p>
            </div>
          </div>
          <span className="size-9 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
            {occasionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>

        {occasionOpen && (
          <div className="px-5 sm:px-6 pb-6 pt-5 md:px-8 md:pb-8 md:pt-6">
            <div className="bg-gradient-to-r from-[#BE4B64] to-[#E88A62] rounded-2xl p-4 md:px-8 md:py-4 flex flex-row items-center justify-between gap-6 mb-8 shadow-lg shadow-[#BE4B64]/20 relative overflow-hidden group">
              <div className="relative z-10 max-w-xl">
                <h4 className="text-lg md:text-xl font-semibold text-white mb-1.5 tracking-tight drop-shadow-sm">
                  Personalised offers for your occasions!
                </h4>
                <p className="text-sm md:text-sm leading-relaxed text-white/95 m-0 font-medium">
                  We&apos;ll send a tailored offer 21 days before each occasion you add — never during the celebration itself.
                </p>
              </div>
              <div className="relative z-10 shrink-0 hidden sm:block">
                <div className="size-14 md:size-[72px] bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl rotate-12 group-hover:rotate-3 transition-transform duration-500">
                  <Gift className="size-7 md:size-9 text-white drop-shadow-md" strokeWidth={1.5} />
                </div>
              </div>
              <div className="absolute top-0 right-0 -mr-16 -mt-16 size-64 bg-white/20 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-110" />
            </div>

            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap border-b border-zinc-100 pb-4">
              <div>
                <p className="text-sm font-semibold text-zinc-900 mb-1">
                  Occasions on file
                </p>
                <p className="text-sm text-zinc-500 m-0">
                  Manage your important dates to receive personalised offers.
                </p>
              </div>
              <button className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] bg-primary text-white border border-primary rounded-2xl px-5 py-3 cursor-pointer transition-opacity hover:opacity-90 whitespace-nowrap shadow-md shadow-primary/20" onClick={() => setIsOccasionSheetOpen(true)}>
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
        <SheetContent side="right" className="w-full sm:max-w-[440px] overflow-y-auto p-0 font-[Figtree,var(--font-figtree),ui-sans-serif] [&>button]:outline-none">
          <SheetHeader className="px-6 pt-8 pb-5 border-b border-zinc-100 sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between gap-4">
              <SheetTitle className="text-xl font-bold text-primary tracking-tight">Add occasion</SheetTitle>
              <button
                onClick={() => setIsOccasionSheetOpen(false)}
                className="size-8 flex items-center justify-center rounded-full bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                title="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <p className="text-sm text-zinc-500 font-medium mt-1">Add the people and dates you shop for — we&apos;ll take it from there.</p>
          </SheetHeader>
          <div className="px-6 pt-2 pb-8">
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
