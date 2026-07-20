"use client";

/**
 * Earn Rewards — a 3-step, premium onboarding wizard built around the Lucira
 * "My Profile & My Occasions" PRD. Each completed step grants +100 Lucira Coins.
 *
 *   Step 1 · About You     — Date of Birth & Anniversary
 *   Step 2 · Your Occasions — add a meaningful date inline (relationship,
 *                             occasion, title, event date) → immutable cards
 *   Step 3 · Review        — add more / review, then complete
 *
 * Coins + progress persist through the existing earn-rewards service; occasion
 * records persist through the occasions data layer (backend + local fallback).
 */

import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Gift,
  Cake,
  Heart,
  CalendarHeart,
  Sparkles,
} from "lucide-react";
import { apiFetch, fetchCustomerDashboardStats } from "@/lib/api";
import { shopifyStorefrontFetch, CUSTOMER_QUERY } from "@/lib/shopify-client";
import { pushPromoClick } from "@/lib/gtm";
import { OccasionForm, OccasionCards } from "@/components/rewards/OccasionStep";
import {
  listOccasions,
  createOccasion,
  deleteOccasion,
  sortOccasions,
  occasionAnalytics,
  newFormSessionId,
} from "@/lib/occasions";

/* ─────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────── */
const CONFIG = {
  storageKey: "lucira_profile_data",
  apiBase: "/api/proxy/earn-rewards",
  totalSteps: 4,
  pointsPerStep: 100,
};

const STEP_NAMES = { 1: "About You", 2: "Gifting", 3: "Your Style", 4: "Occasions" };

/* Cloud Run service that persists DOB / Anniversary to the Shopify customer. */
const PERSONAL_INFO_API =
  "https://personal-information-api-385594025448.asia-south1.run.app/";

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
function extractNumericId(gid = "") {
  const p = String(gid).split("/");
  return p[p.length - 1];
}

/* ─────────────────────────────────────────────────────────
   ATOMS
───────────────────────────────────────────────────────── */
function DateInput({ id, value, onChange }) {
  return (
    <input
      id={id}
      type="date"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-12 w-full rounded-xl border border-[#e8dede] bg-white px-4 text-sm font-medium text-zinc-900 outline-none transition-colors focus:border-[#5A413F]"
    />
  );
}

function Toggle({ checked }) {
  return (
    <div
      className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
      style={{ background: checked ? "#5A413F" : "#e5ddd4", pointerEvents: "none" }}
    >
      <span
        className="absolute top-0.5 size-5 rounded-full bg-white shadow transition-all"
        style={{ left: checked ? "22px" : "2px" }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PROGRESS RING
───────────────────────────────────────────────────────── */
function ProgressRing({ pct }) {
  const R = 46;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative mx-auto mb-8 flex size-[110px] items-center justify-center">
      <svg width="110" height="110" viewBox="0 0 110 110" className="block -rotate-90">
        <circle cx="55" cy="55" r={R} fill="none" stroke="#eaeaea" strokeWidth="6" />
        <circle
          cx="55"
          cy="55"
          r={R}
          fill="none"
          className="stroke-primary"
          strokeWidth="6"
          strokeDasharray={C}
          strokeDashoffset={C - (pct / 100) * C}
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-primary text-[20px] font-light tracking-wide text-primary">
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MILESTONE BAR (generalised for N steps)
───────────────────────────────────────────────────────── */
function MilestoneBar({ completedCount, total, profileComplete }) {
  const nodes = Array.from({ length: total + 1 }, (_, i) => ({
    id: i,
    label: i === 0 ? "Start" : `+${i * 100}`,
  }));
  const done = (id) => profileComplete || id <= completedCount;
  const current = (id) => !profileComplete && id === completedCount;
  const pct = profileComplete ? 100 : (completedCount / total) * 100;

  return (
    <div className="relative pt-1 pb-1">
      {/* track */}
      <div className="absolute left-0 right-0 top-[33px] h-2 rounded-full bg-white" />
      <div
        className="absolute left-0 top-[33px] h-2 rounded-full bg-[#5A413F] transition-[width] duration-700"
        style={{ width: `${pct}%` }}
      />
      <div className="relative z-[2] h-12">
        {nodes.map((m) => (
          <div
            key={m.id}
            className="absolute top-0 flex flex-col-reverse items-center gap-2"
            style={{
              left: `${(m.id / total) * 100}%`,
              transform: "translateX(-50%)"
            }}
          >
            <div
              className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                done(m.id)
                  ? "border-[#5A413F] bg-[#5A413F]"
                  : current(m.id)
                  ? "border-[#5A413F] bg-white ring-4 ring-[#5A413F]/15"
                  : "border-[#e5ddd4] bg-white"
              }`}
            >
              {done(m.id) ? (
                <Check size={11} className="text-white" strokeWidth={3} />
              ) : (
                <div
                  className={`size-2 rounded-full ${
                    current(m.id) ? "bg-[#5A413F]" : "bg-[#e5ddd4]"
                  }`}
                />
              )}
            </div>
            <span
              className={`whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider sm:text-[11px] ${
                done(m.id) || current(m.id) ? "text-[#1c1410]" : "text-[#b3a89e]"
              }`}
            >
              {m.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STEP · ABOUT YOU
───────────────────────────────────────────────────────── */
function StepAboutYou({ data, onChange }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            <Cake size={13} /> Date of Birth
          </p>
          <DateInput
            id="dob"
            value={data.date_of_birth}
            onChange={(v) => onChange("date_of_birth", v)}
          />
        </div>
        <div className="flex items-end">
          <div
            onClick={() => onChange("is_married", !data.is_married)}
            className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-[#e8dede] bg-[#fdf9f9] px-4 py-3.5"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-[#1c1410]">
              <Heart size={15} className="text-[#5A413F]" /> Are you married?
            </span>
            <Toggle checked={!!data.is_married} />
          </div>
        </div>
      </div>

      {data.is_married && (
        <div className="animate-[fadeSlide_.3s_ease]">
          <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            <Sparkles size={13} /> Date of Anniversary
          </p>
          <div className="sm:max-w-[calc(50%-10px)]">
            <DateInput
              id="doa"
              value={data.anniversary_date}
              onChange={(v) => onChange("anniversary_date", v)}
            />
          </div>
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-xl bg-[#f4f0f0] px-4 py-3 text-xs leading-relaxed text-zinc-600">
        <Gift size={15} className="mt-0.5 shrink-0 text-[#5A413F]" />
        We use these dates only to plan thoughtful surprises — never shared
        publicly.
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SURVEY STEPS (Gifting Behaviour · Style & Preferences)
───────────────────────────────────────────────────────── */
const GIFT_FREQ = ["Frequently", "Occasionally", "Rarely"];
const GIFT_STYLE = ["I plan in advance", "I need recommendations", "I stay close to the date"];
const GIFT_RECIP = ["Partner", "Parents", "Siblings", "Friends", "Extended Family"];
const JEW_TYPES = ["Rings", "Necklaces", "Bracelets", "Earrings", "Brooches"];
const METALS = ["Yellow Gold", "White Gold", "Rose Gold", "Platinum"];
const BUDGETS = ["Under ₹10K", "₹10K – ₹50K", "₹50K – ₹1L", "₹1L+"];
const STYLES = ["Classic", "Contemporary", "Vintage", "Minimalist", "Statement"];

function toggleVal(arr = [], val, single = false) {
  if (single) return [val];
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

function SurveyChip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-200 sm:px-5 ${
        selected
          ? "border-transparent bg-[#5A413F] text-white shadow-md shadow-[#5A413F]/25"
          : "border-transparent bg-[#fbeeee] text-zinc-700 hover:bg-[#f6e2e2] active:scale-[0.98]"
      }`}
    >
      {label}
    </button>
  );
}

function ChipGroup({ options, selected, onChange, single = false }) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2.5">
      {options.map((o) => (
        <SurveyChip
          key={o}
          label={o}
          selected={(selected || []).includes(o)}
          onClick={() => onChange(toggleVal(selected, o, single))}
        />
      ))}
    </div>
  );
}

function CheckRow({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center gap-3 rounded-xl py-1.5 text-left text-sm text-zinc-700 transition-colors hover:text-zinc-900"
    >
      <span
        className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
          checked ? "border-[#5A413F] bg-[#5A413F]" : "border-[#d8cfc6] bg-white"
        }`}
      >
        {checked && <Check size={12} className="text-white" strokeWidth={3} />}
      </span>
      {label}
    </button>
  );
}

function CheckGroup({ options, selected, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      {options.map((o) => (
        <CheckRow
          key={o}
          label={o}
          checked={(selected || []).includes(o)}
          onChange={() => onChange(toggleVal(selected, o))}
        />
      ))}
    </div>
  );
}

function SurveyField({ children }) {
  return (
    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
      {children}
    </p>
  );
}

function StepGifting({ data, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <SurveyField>How often do you buy jewellery as a gift?</SurveyField>
        <ChipGroup
          options={GIFT_FREQ}
          selected={data.gifting_frequency}
          single
          onChange={(v) => onChange("gifting_frequency", v)}
        />
      </div>
      <div>
        <SurveyField>What kind of gifting best describes you?</SurveyField>
        <CheckGroup
          options={GIFT_STYLE}
          selected={data.gifting_style}
          onChange={(v) => onChange("gifting_style", v)}
        />
      </div>
      <div>
        <SurveyField>Who do you usually gift jewellery to?</SurveyField>
        <ChipGroup
          options={GIFT_RECIP}
          selected={data.gift_recipients}
          onChange={(v) => onChange("gift_recipients", v)}
        />
      </div>
    </div>
  );
}

function StepPreferences({ data, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <SurveyField>Which jewellery types interest you?</SurveyField>
        <ChipGroup
          options={JEW_TYPES}
          selected={data.jewelry_types}
          onChange={(v) => onChange("jewelry_types", v)}
        />
      </div>
      <div>
        <SurveyField>Preferred metal?</SurveyField>
        <ChipGroup
          options={METALS}
          selected={data.metal_type}
          single
          onChange={(v) => onChange("metal_type", v)}
        />
      </div>
      <div>
        <SurveyField>Your usual budget range?</SurveyField>
        <ChipGroup
          options={BUDGETS}
          selected={data.budget_range}
          single
          onChange={(v) => onChange("budget_range", v)}
        />
      </div>
      <div>
        <SurveyField>How would you describe your style?</SurveyField>
        <ChipGroup
          options={STYLES}
          selected={data.style_preference}
          onChange={(v) => onChange("style_preference", v)}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────── */
const blank = {
  step_1: { date_of_birth: "", is_married: false, anniversary_date: "" },
  step_2: { gifting_frequency: [], gifting_style: [], gift_recipients: [] },
  step_3: { jewelry_types: [], metal_type: [], budget_range: [], style_preference: [] },
  step_4: {},
};

const initial = {
  currentStep: 1,
  formData: blank,
  rewardedSteps: [],
  completedSteps: [],
  profileComplete: false,
};

export default function EarnRewardsPage() {
  const { accessToken } = useSelector((state) => state.user);
  const [state, setState] = useState(initial);
  const [nectorCoins, setNectorCoins] = useState(null);
  const [coinsLoading, setCoinsLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [saveStatus, setSaveStatus] = useState("");
  const [completing, setCompleting] = useState(false);

  // Occasions
  const [occasions, setOccasions] = useState([]);
  const [addingOcc, setAddingOcc] = useState(false);
  const [deletingOccId, setDeletingOccId] = useState(null);

  /* ── Init ── */
  useEffect(() => {
    async function init() {
      loadLocal();
      if (accessToken) await fetchServerProgress();
      try {
        const list = await listOccasions(accessToken);
        setOccasions(sortOccasions(list));
      } catch {
        /* occasions optional at load */
      }
      setPageLoading(false);
      fetchCoins();
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  /* ── Coins balance ── */
  async function fetchCoins() {
    setCoinsLoading(true);
    try {
      const stats = await fetchCustomerDashboardStats(accessToken);
      const points = Number(String(stats?.points ?? "").replace(/,/g, ""));
      if (Number.isFinite(points)) {
        setNectorCoins(points);
        return;
      }
      throw new Error("no usable points value");
    } catch (e) {
      try {
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const data = await apiFetch("/api/customer/nector-coins", {
          cache: "no-store",
          headers,
        });
        if (data?.status !== false) setNectorCoins(data.coins_balance ?? 0);
      } catch (err) {
        console.warn("Nector proxy error:", err);
      }
    } finally {
      setCoinsLoading(false);
    }
  }

  /* ── Local storage ── */
  function loadLocal() {
    try {
      const raw = localStorage.getItem(CONFIG.storageKey);
      if (!raw) return;
      const p = JSON.parse(raw);
      setState((prev) => ({
        ...prev,
        ...p,
        formData: { ...blank, ...(p.formData || {}) },
        rewardedSteps: p.rewardedSteps || [],
        completedSteps: p.completedSteps || [],
      }));
    } catch (_) {}
  }
  function saveLocal(s) {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(s));
    } catch (_) {}
  }

  /* ── Server progress ── */
  async function fetchServerProgress() {
    try {
      if (!accessToken) return;
      const profileData = await shopifyStorefrontFetch(CUSTOMER_QUERY, {
        customerAccessToken: accessToken,
      });
      const simpleId = extractNumericId(profileData?.customer?.id || "");
      if (!simpleId) return;

      const d = await apiFetch(
        `${CONFIG.apiBase}/get-progress.php?customer_id=shopify-${simpleId}&t=${Date.now()}`
      );
      if (!d.success) return;

      const rewardedSteps = (d.rewarded_steps || []).map(Number).filter((n) => n <= CONFIG.totalSteps);
      const completedSteps = (d.completed_steps || []).map(Number).filter((n) => n <= CONFIG.totalSteps);
      const profileComplete = !!d.profile_complete && rewardedSteps.includes(CONFIG.totalSteps);

      let formData = { ...blank };
      if (d.form_data && typeof d.form_data === "object") {
        Object.entries(d.form_data).forEach(([k, v]) => {
          if (v && typeof v === "object" && blank[k]) formData[k] = v;
        });
      }

      setState((prev) => {
        let firstIncomplete = 1;
        for (let i = 1; i <= CONFIG.totalSteps; i++) {
          if (!rewardedSteps.includes(i)) {
            firstIncomplete = i;
            break;
          }
        }
        if (profileComplete) firstIncomplete = 1;
        const ns = {
          ...prev,
          rewardedSteps,
          completedSteps,
          profileComplete,
          formData,
          currentStep: profileComplete ? prev.currentStep : firstIncomplete,
        };
        saveLocal(ns);
        return ns;
      });
    } catch (e) {
      console.warn("Server progress:", e);
    }
  }

  /* ── API save (awards coins on first completion of a step) ── */
  async function apiSave(step, stepData, autoSave = false, allFormData = null) {
    try {
      if (!accessToken) return;
      const profileData = await shopifyStorefrontFetch(CUSTOMER_QUERY, {
        customerAccessToken: accessToken,
      });
      const simpleId = extractNumericId(profileData?.customer?.id || "");
      if (!simpleId) return;

      const payload = {
        customer_id: `shopify-${simpleId}`,
        step,
        form_data: stepData,
        all_form_data: allFormData || state.formData,
        auto_save: autoSave,
      };
      const d = await apiFetch(`${CONFIG.apiBase}/save-step.php`, {
        method: "POST",
        keepalive: true,
        body: JSON.stringify(payload),
      });
      if (!autoSave && d.coins_awarded) fetchCoins();
      return d;
    } catch (e) {
      console.warn("apiSave error:", e);
    }
  }

  /* ── Persist DOB / Anniversary to Shopify customer ── */
  async function savePersonalInfo(stepData) {
    try {
      if (!accessToken) return;
      const profileData = await shopifyStorefrontFetch(CUSTOMER_QUERY, {
        customerAccessToken: accessToken,
      });
      const c = profileData?.customer;
      const simpleId = extractNumericId(c?.id || "");
      if (!simpleId) return;
      await fetch(PERSONAL_INFO_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: simpleId,
          first_name: c.firstName || "",
          last_name: c.lastName || "",
          email: c.email || "",
          phone: c.phone || "",
          note: `dob:${stepData.date_of_birth || ""};doa:${stepData.anniversary_date || ""}`,
          date_of_birth: stepData.date_of_birth || "",
          date_of_anniversary: stepData.anniversary_date || "",
          is_married: !!stepData.is_married,
        }),
      });
    } catch (e) {
      console.warn("personal-info save failed:", e);
    }
  }

  /* ── Debounced auto-save (step 1 fields only) ── */
  const debouncedSave = useMemo(
    () =>
      debounce((step, stepData, allFormData) => {
        if (step === CONFIG.totalSteps) return;
        setSaveStatus("saving");
        apiSave(step, stepData, true, allFormData)
          .then(() => {
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus(""), 2000);
          })
          .catch(() => setSaveStatus(""));
      }, 800),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /* ── Field change (About You) ── */
  function handleChange(stepKey, field, value) {
    setState((prev) => {
      const updatedStep = { ...prev.formData[stepKey], [field]: value };
      const updatedAll = { ...prev.formData, [stepKey]: updatedStep };
      const ns = { ...prev, formData: updatedAll };
      saveLocal(ns);
      debouncedSave(Number(stepKey.split("_")[1]), updatedStep, updatedAll);
      return ns;
    });
    setErrors([]);
  }

  /* ── Occasion add / delete ── */
  async function addOccasion(form) {
    setAddingOcc(true);
    try {
      const created = await createOccasion(form, accessToken);
      const next = sortOccasions([
        created,
        ...occasions.filter((o) => o.occasion_id !== created.occasion_id),
      ]);
      setOccasions(next);
      occasionAnalytics.created(newFormSessionId(), form, next.length);
      setErrors([]);
      return true;
    } catch {
      return false;
    } finally {
      setAddingOcc(false);
    }
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
    } finally {
      setDeletingOccId(null);
    }
  }

  /* ── Validation ── */
  function validate(step, d) {
    const e = [];
    if (step === 1) {
      if (!d.date_of_birth) e.push("Please enter your date of birth.");
      if (d.is_married && !d.anniversary_date)
        e.push("Please enter your anniversary date.");
    }
    if (step === 2) {
      if (!(d.gifting_frequency || []).length) e.push("Tell us how often you gift jewellery.");
      if (!(d.gifting_style || []).length) e.push("Select at least one gifting style.");
      if (!(d.gift_recipients || []).length) e.push("Select who you usually gift to.");
    }
    if (step === 3) {
      if (!(d.jewelry_types || []).length) e.push("Select at least one jewellery type.");
      if (!(d.metal_type || []).length) e.push("Select a preferred metal.");
      if (!(d.budget_range || []).length) e.push("Select your budget range.");
      if (!(d.style_preference || []).length) e.push("Select a style that describes you.");
    }
    // Step 4 (occasions) is optional — completing is always allowed.
    return e;
  }

  /* ── Navigation ── */
  function goStep(next) {
    if (next < state.currentStep) {
      setErrors([]);
      setState((p) => ({ ...p, currentStep: next }));
      return;
    }
    const key = `step_${state.currentStep}`;
    const cur = state.formData[key] || {};
    const errs = validate(state.currentStep, cur);
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setErrors([]);

    const n = state.currentStep;
    const isNewReward = !state.rewardedSteps.includes(n);
    if (n === 1) savePersonalInfo(cur);

    setState((prev) => {
      const ns = {
        ...prev,
        currentStep: next,
        rewardedSteps: isNewReward ? [...prev.rewardedSteps, n] : prev.rewardedSteps,
        completedSteps: prev.completedSteps.includes(n)
          ? prev.completedSteps
          : [...prev.completedSteps, n],
      };
      saveLocal(ns);
      return ns;
    });

    apiSave(n, cur, !isNewReward, state.formData);
  }

  function completeProfile() {
    const errs = validate(CONFIG.totalSteps, state.formData.step_3 || {});
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    setCompleting(true);
    pushPromoClick({ creative_name: "Completed User Profile", location_id: "admin rewards" });

    const n = CONFIG.totalSteps;
    const isNewReward = !state.rewardedSteps.includes(n);
    setState((prev) => {
      const ns = {
        ...prev,
        profileComplete: true,
        rewardedSteps: isNewReward ? [...prev.rewardedSteps, n] : prev.rewardedSteps,
        completedSteps: prev.completedSteps.includes(n)
          ? prev.completedSteps
          : [...prev.completedSteps, n],
      };
      saveLocal(ns);
      return ns;
    });
    const step4Payload = {
      shopping_occasions: occasions.map(o => `${o.occasion_name} - ${o.occasion_title} (${o.event_date})`),
      style_preference: state.formData.step_3?.style_preference || []
    };

    apiSave(n, step4Payload, !isNewReward, { ...state.formData, step_4: step4Payload }).finally(() =>
      setCompleting(false)
    );
  }

  /* ── Derived ── */
  const coins = state.rewardedSteps.length * CONFIG.pointsPerStep;
  const ringPct = (state.rewardedSteps.length / CONFIG.totalSteps) * 100;
  const remaining = CONFIG.totalSteps - state.completedSteps.length;

  /* ── Loading ── */
  if (pageLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 size={36} className="animate-spin text-[#5A413F]" />
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a8f85]">
          Loading your rewards…
        </p>
      </div>
    );
  }

  const stepTitle = {
    1: "A little about you",
    2: "Your gifting behaviour",
    3: "Your style & preferences",
    4: "Your occasions",
  }[state.currentStep];
  const stepDesc = {
    1: "Share your special dates so Lucira can celebrate them with you.",
    2: "Help us understand how you gift so our suggestions feel personal.",
    3: "Tell us what you love — we’ll tailor recommendations to your taste.",
    4: "Save meaningful dates — birthdays, anniversaries — for timely, thoughtful gifting.",
  }[state.currentStep];

  return (
    <div className="font-figtree animate-[fadeSlide_0.35s_ease]">
      <style>{`
        @keyframes fadeSlide { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        input[type=date]::-webkit-calendar-picker-indicator { cursor: pointer; opacity:.6; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="mb-1 text-xl font-bold tracking-tight text-zinc-900 md:text-2xl">
            Earn Rewards
          </h2>
          <p className="mt-1 text-sm font-medium text-[#666] md:text-base">
            Complete your profile to earn Lucira Coins and unlock exclusive benefits.
          </p>
        </div>
        <div className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-br from-[#3d2a1e] to-[#5c3d28] px-[18px] py-3 shadow-[0_8px_24px_rgba(28,20,16,0.18)] sm:w-auto">
          <Gift size={22} className="text-[#d4aa5a]" />
          <div>
            <p className="mb-0.5 text-sm font-semibold tracking-tight text-zinc-100">
              Lucira Coins
            </p>
            <p className="m-0 text-2xl font-bold leading-tight text-white">
              {coinsLoading
                ? "…"
                : nectorCoins !== null
                ? nectorCoins.toLocaleString("en-IN")
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[1fr_240px]">
        {/* MAIN CARD */}
        <div className="order-1 overflow-hidden rounded-2xl bg-white shadow-[0_2px_20px_rgba(28,20,16,0.07)]">
          {/* Milestone bar */}
          <div className="border-b border-[#efe6e6] bg-[#F4F0F0] px-6 py-5 sm:px-8">
            <MilestoneBar
              completedCount={state.completedSteps.length}
              total={CONFIG.totalSteps}
              profileComplete={state.profileComplete}
            />
            <p className="mt-3 text-sm tracking-[0.2px] text-[#1a1a1a]">
              {state.profileComplete ? (
                <>
                  🎉 <strong className="text-[#5A413F]">Profile complete!</strong> You&apos;ve
                  earned all your Lucira Coins.
                </>
              ) : (
                <>
                  You are just{" "}
                  <strong className="text-[#5A413F]">
                    {remaining} more step{remaining !== 1 ? "s" : ""}
                  </strong>{" "}
                  away from bonus Lucira Coins.
                </>
              )}
            </p>
          </div>

          {!state.profileComplete && (
            <>
              {/* Desktop — underline tabs (unchanged) */}
              <div className="hidden border-b border-[#e5ddd4] bg-[#f4f0f0] sm:flex">
                {[1, 2, 3, 4].map((n) => {
                  const done = state.completedSteps.includes(n);
                  const active = state.currentStep === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => done && !active && setState((p) => ({ ...p, currentStep: n }))}
                      className={`flex-1 border-b-2 px-1 py-3 text-[11px] uppercase tracking-[0.12em] transition-all ${
                        active
                          ? "border-[#5A413F] bg-white font-semibold text-[#5A413F]"
                          : done
                          ? "cursor-pointer border-transparent text-[#1c1410]"
                          : "cursor-default border-transparent text-[#b3a89e]"
                      }`}
                    >
                      {STEP_NAMES[n]}
                    </button>
                  );
                })}
              </div>

              {/* Mobile — scrollable pills (no clipping) */}
              <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-[#e5ddd4] bg-[#f4f0f0] px-4 py-3.5 sm:hidden">
                {[1, 2, 3, 4].map((n) => {
                  const done = state.completedSteps.includes(n);
                  const active = state.currentStep === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      disabled={!done && !active}
                      onClick={() => done && !active && setState((p) => ({ ...p, currentStep: n }))}
                      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-all ${
                        active
                          ? "bg-[#5A413F] text-white shadow-md shadow-[#5A413F]/25"
                          : done
                          ? "cursor-pointer bg-white text-[#5A413F] ring-1 ring-[#e5ddd4]"
                          : "cursor-default text-[#b3a89e]"
                      }`}
                    >
                      {done && !active && <Check size={11} strokeWidth={3} />}
                      {STEP_NAMES[n]}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Body */}
          <div className="px-5 py-6 sm:px-8 sm:py-8">
            {state.profileComplete ? (
              <CompletionScreen occasionCount={occasions.length} />
            ) : (
              <>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5A413F]">
                  Step {state.currentStep} of {CONFIG.totalSteps}
                </p>
                <h3 className="text-xl font-semibold leading-snug text-[#1c1410] md:text-2xl">
                  {stepTitle}
                </h3>
                <p className="mb-6 mt-1 text-sm leading-relaxed text-[#666]">{stepDesc}</p>

                {errors.length > 0 && (
                  <div className="mb-5 rounded-xl bg-[#ffe8e8] px-4 py-2.5">
                    {errors.map((e, i) => (
                      <p key={i} className="my-0.5 text-xs text-[#c40000]">
                        • {e}
                      </p>
                    ))}
                  </div>
                )}

                {/* Step 1 · About You */}
                {state.currentStep === 1 && (
                  <StepAboutYou
                    data={state.formData.step_1}
                    onChange={(f, v) => handleChange("step_1", f, v)}
                  />
                )}

                {/* Step 2 · Gifting Behaviour */}
                {state.currentStep === 2 && (
                  <StepGifting
                    data={state.formData.step_2}
                    onChange={(f, v) => handleChange("step_2", f, v)}
                  />
                )}

                {/* Step 3 · Style & Preferences */}
                {state.currentStep === 3 && (
                  <StepPreferences
                    data={state.formData.step_3}
                    onChange={(f, v) => handleChange("step_3", f, v)}
                  />
                )}

                {/* Step 4 · My Occasions */}
                {state.currentStep === 4 && (
                  <div className="space-y-6">
                    <OccasionForm onAdd={addOccasion} adding={addingOcc} />
                    {occasions.length > 0 && (
                      <div>
                        <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                          <CalendarHeart size={14} className="text-[#5A413F]" />
                          Your occasions ({occasions.length})
                        </p>
                        <OccasionCards
                          occasions={occasions}
                          onDelete={removeOccasion}
                          deletingId={deletingOccId}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#f0eaea] pt-5">
                  <button
                    type="button"
                    disabled={state.currentStep === 1}
                    onClick={() => goStep(state.currentStep - 1)}
                    className={`flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-xs font-semibold transition-all ${
                      state.currentStep === 1
                        ? "cursor-default border-[#e5ddd4] text-[#d8cfc6]"
                        : "border-[#5A413F] text-[#5A413F] hover:bg-[#5A413F]/5"
                    }`}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>

                  <button
                    type="button"
                    disabled={completing}
                    onClick={() =>
                      state.currentStep < CONFIG.totalSteps
                        ? goStep(state.currentStep + 1)
                        : completeProfile()
                    }
                    className="flex items-center gap-2 rounded-full bg-[#5A413F] px-7 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-lg shadow-[#5A413F]/25 transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {completing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        {state.currentStep < CONFIG.totalSteps ? "Save & Continue" : "Complete Profile"}
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="order-2 flex flex-col gap-3.5 md:sticky md:top-20">
          <div className="rounded-2xl bg-white px-7 py-8 text-center shadow-sm border border-[#E5E7EB]">
            
            <ProgressRing pct={ringPct} />
            
            <p className="mb-6 text-[12px] font-semibold uppercase tracking-[0.2em] text-primary">
              Profile Completed
            </p>
            
            <ul className="m-0 flex list-none flex-col gap-4 border-t border-[#E5E7EB] p-0 pt-6 text-left">
              {[1, 2, 3, 4].map((n) => {
                const done = state.profileComplete || state.completedSteps.includes(n);
                return (
                  <li
                    key={n}
                    className={`group flex items-center gap-3.5 text-[14px] font-medium transition-all duration-300 ${
                      done ? "text-primary" : "text-[#9EA3B0] hover:text-[#6B7280]"
                    }`}
                  >
                    <div
                      className={`relative flex size-[22px] shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                        done 
                          ? "bg-primary scale-110" 
                          : "border-[1.5px] border-[#D1D5DB] bg-white group-hover:border-[#9EA3B0]"
                      }`}
                    >
                      {done ? (
                        <Check size={12} className="text-white relative z-10" strokeWidth={3} />
                      ) : (
                        <div className="size-2 rounded-full bg-[#E5E7EB] transition-colors duration-300 group-hover:bg-[#D1D5DB]" />
                      )}
                    </div>
                    <span className="translate-y-px">{STEP_NAMES[n]}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-[#3d2a1e] to-[#5c3d28] px-4 py-4 text-center shadow-[0_8px_40px_rgba(28,20,16,0.12)]">
            <p className="mb-1.5 text-xs uppercase tracking-[0.15em] text-white/45">
              Coins Earned
            </p>
            <p className="m-0 text-[26px] font-semibold leading-none text-white">{coins}</p>
            <p className="mt-2 text-[10px] tracking-[0.5px] text-white/45">Lucira Coins</p>
          </div>
        </div>
      </div>

      {/* Auto-save indicator */}
      {saveStatus && (
        <div className="fixed bottom-6 right-6 z-[200] flex animate-[fadeSlide_0.3s_ease] items-center gap-1.5 rounded-full border border-[#e5ddd4] bg-white px-3.5 py-[7px] text-[11px] tracking-[0.5px] text-[#9a8f85] shadow-[0_2px_20px_rgba(28,20,16,0.07)]">
          {saveStatus === "saving" ? (
            <>
              <div className="size-1.5 animate-pulse rounded-full bg-[#5A413F]" />
              Saving…
            </>
          ) : (
            <>
              <Check size={10} className="text-[#5A413F]" />
              Saved
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPLETION SCREEN
───────────────────────────────────────────────────────── */
function CompletionScreen({ occasionCount }) {
  return (
    <div className="px-4 py-7 text-center">
      <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full border-2 border-[#5A413F] bg-[#f4f0f0]">
        <CalendarHeart size={34} className="text-[#5A413F]" />
      </div>
      <h3 className="mb-1.5 text-xl font-semibold text-[#1c1410]">
        You&apos;re all set!
      </h3>
      <p className="mb-7 text-sm text-[#666]">
        {occasionCount > 0
          ? `We’ve saved ${occasionCount} occasion${occasionCount !== 1 ? "s" : ""} and your Lucira Coins. We’ll help you make each one memorable.`
          : "Your profile is complete and your Lucira Coins are in. "}
      </p>
      <Link
        href="/collections/jewelry"
        className="inline-block rounded-full bg-[#5A413F] px-12 py-3.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white no-underline"
      >
        Shop Now
      </Link>
      <div className="mt-6 border-t border-[#e5ddd4] pt-4 text-[13px] text-[#666]">
        Need help?{" "}
        <a
          href="https://api.whatsapp.com/send/?phone=%2B919004435760&text=Hi!+Can+you+tell+me+more+about+Lucira+Jewelry%E2%80%99s+collection%3F&type=phone_number&app_absent=0"
          className="text-[#5A413F] no-underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Chat with our Expert
        </a>
      </div>
    </div>
  );
}
