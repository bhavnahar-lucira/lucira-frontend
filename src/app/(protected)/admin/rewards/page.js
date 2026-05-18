"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Check, ArrowRight, Loader2, Gift } from "lucide-react";

/* ─────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────── */
const CONFIG = {
  storageKey   : "lucira_profile_data",
  apiBase      : "/api/proxy/earn-rewards",
  totalSteps   : 4,
  pointsPerStep: 100,
};

const STEP_NAMES = { 1: "About Us", 2: "Gifting Behaviour", 3: "Your Wishlist", 4: "Your Style" };

/* theme colours (mirrors the Shopify liquid CSS vars) */
const T = {
  blush : "#5A413F",
  dark  : "#3d2a1e",
  ivory : "#f4f0f0",
  border: "#e5ddd4",
  muted : "#9a8f85",
};

/* ─────────────────────────────────────────────────────────
   TINY UTILS / HELPERS
───────────────────────────────────────────────────────── */
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
function extractNumericId(gid = "") {
  const p = String(gid).split("/");
  return p[p.length - 1];
}

/* ─────────────────────────────────────────────────────────
   ATOMS
───────────────────────────────────────────────────────── */
function Chip({ label, selected, onToggle }) {
  return (
    <button
      type="button"
      className="chip-button"
      onClick={onToggle}
      style={{
        padding       : "10px 18px",
        borderRadius  : "8px",
        border        : `1px solid ${selected ? T.blush : "#ffeaea"}`,
        background    : selected ? T.blush : "#fff0f0",
        color         : selected ? "#fff" : "#1a1a1a",
        fontSize      : "13px",
        cursor        : "pointer",
        transition    : "all .2s",
        minHeight     : "44px",
        fontFamily    : "inherit",
        fontWeight    : "500",
      }}
    >
      {label}
    </button>
  );
}


function RadioOpt({ value, checked, label, onChange }) {
  return (
    <label 
      onClick={() => onChange(value)}
      style={{ display:"flex", alignItems:"center", gap:"8px", cursor:"pointer", fontSize:"13px", color:"#1a1a1a" }}
    >
      <div
        style={{
          width:"16px", height:"16px", borderRadius:"50%",
          border:`1.5px solid ${checked ? T.blush : T.border}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          flexShrink:0,
          pointerEvents: "none",
        }}
      >
        {checked && <div style={{ width:"8px", height:"8px", borderRadius:"50%", background: T.blush }} />}
      </div>
      {label}
    </label>
  );
}

function CheckOpt({ label, checked, onChange }) {
  return (
    <label 
      onClick={onChange}
      style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", fontSize:"13px", color:"#1a1a1a" }}
    >
      <div
        style={{
          width:"16px", height:"16px", borderRadius:"3px",
          border:`1.5px solid ${checked ? T.blush : T.border}`,
          background: checked ? T.blush : "#fff",
          display:"flex", alignItems:"center", justifyContent:"center",
          flexShrink:0,
          pointerEvents: "none",
        }}
      >
        {checked && <Check size={9} stroke="#fff" strokeWidth={3} />}
      </div>
      {label}
    </label>
  );
}

function Toggle({ checked }) {
  return (
    <div
      style={{
        width:"40px", height:"22px", borderRadius:"22px",
        background: checked ? T.blush : T.border,
        position:"relative", transition:"background .3s",
        flexShrink:0,
        pointerEvents: "none",
      }}
    >
      <span style={{
        position:"absolute", top:"3px", left: checked ? "19px" : "3px",
        width:"16px", height:"16px", borderRadius:"50%", background:"#fff",
        boxShadow:"0 1px 4px rgba(0,0,0,.2)", transition:"left .3s",
      }} />
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <p style={{
      fontSize:"11px", fontWeight:600, letterSpacing:"1.5px",
      textTransform:"uppercase", color:"#000", marginBottom:"10px", marginTop:"18px",
    }}>
      {children}
    </p>
  );
}

function DateInput({ value, onChange }) {
  return (
    <input
      type="date"
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      style={{
        width:"100%", border:`1px solid ${T.ivory}`, borderRadius:"8px",
        padding:"12px", fontSize:"13px", color:"#1a1a1a", background: T.ivory,
        outline:"none", boxSizing:"border-box", fontFamily:"inherit",
        position: "relative",
      }}
      onFocus={e => { e.target.style.borderColor = T.blush; e.target.style.background = "#fff"; }}
      onBlur={e => { e.target.style.borderColor = T.ivory; e.target.style.background = T.ivory; }}
    />
  );
}

/* ─────────────────────────────────────────────────────────
   PROGRESS RING
───────────────────────────────────────────────────────── */
function ProgressRing({ pct }) {
  const R = 42, C = 2 * Math.PI * R;
  return (
    <div style={{ position:"relative", width:"96px", height:"96px", margin:"0 auto 14px" }}>
      <svg width="96" height="96" viewBox="0 0 96 96" style={{ display:"block", transform:"rotate(-90deg)" }}>
        <circle cx="48" cy="48" r={R} fill="none" stroke="#f2ede6" strokeWidth="5" />
        <circle
          cx="48" cy="48" r={R} fill="none" stroke={T.blush} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={C}
          strokeDashoffset={C - (pct / 100) * C}
          style={{ transition:"stroke-dashoffset .9s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", gap:"2px" }}>
        <span style={{ fontSize:"22px", fontWeight:600, color:"#1c1410", lineHeight:1 }}>{Math.round(pct)}</span>
        <span style={{ fontSize:"11px", color: T.muted, marginTop:"4px" }}>%</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MILESTONE BAR
───────────────────────────────────────────────────────── */
function MilestoneBar({ completedSteps, profileComplete }) {
  const milestones = [
    { id:0, label:"Start" },
    { id:1, label:"+100 pts" },
    { id:2, label:"+200 pts" },
    { id:3, label:"+300 pts" },
    { id:4, label:"+400 pts" },
  ];
  const pct = profileComplete ? 100 : (completedSteps.length / CONFIG.totalSteps) * 100;

  return (
    <div style={{ position:"relative", marginBottom:"8px" }}>
      {/* bg track */}
      <div style={{ position:"absolute", top:"31px", left:0, right:0, height:"10px", background:"#fff", borderRadius:"3rem" }} />
      {/* fill */}
      <div style={{
        position:"absolute", top:"31px", left:0, height:"10px",
        background: T.blush, borderRadius:"3rem",
        width:`${pct}%`, transition:"width .8s cubic-bezier(.4,0,.2,1)",
      }} />
      {/* dots + labels */}
      <div style={{ display:"flex", justifyContent:"space-between", position:"relative", zIndex:2 }}>
        {milestones.map(m => {
          const done    = profileComplete || m.id <= completedSteps.length;
          const current = !profileComplete && m.id === completedSteps.length;
          return (
            <div key={m.id} style={{ display:"flex", flexDirection:"column-reverse", alignItems: m.id === 0 ? "flex-start" : m.id === 4 ? "flex-end" : "center", gap:"8px", flex:1, position:"relative" }}>
              <div style={{
                width:"22px", height:"22px", borderRadius:"50%",
                border:`2px solid ${done ? T.blush : current ? T.blush : T.border}`,
                background: done ? T.blush : "#fff",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow: current ? `0 0 0 3px rgba(183,111,121,.15)` : "none",
                flexShrink:0,
              }}>
                {done
                  ? <Check size={9} stroke="#fff" strokeWidth={3} />
                  : <div style={{ width:"8px", height:"8px", borderRadius:"50%", background: current ? T.blush : T.border }} />
                }
              </div>
              <span style={{
                fontSize:"12px", letterSpacing:"1px", textTransform:"uppercase",
                fontWeight: done || current ? 600 : 400,
                color: done || current ? "#1c1410" : T.muted,
                whiteSpace:"nowrap",
              }}>
                {m.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STEP PANELS
───────────────────────────────────────────────────────── */
const GIFT_FREQ  = ["Frequently", "Occasionally", "Rarely"];
const GIFT_STYLE = ["I plan in advance", "I need Recommendations", "I stay close to the date"];
const GIFT_RECIP = ["Partner", "Parents", "Siblings", "Friends", "Extended Family"];
const JEW_TYPES  = ["Rings", "Necklaces", "Bracelets", "Earrings", "Brooches"];
const METALS     = ["Yellow Gold", "White Gold", "Rose Gold", "Platinum"];
const BUDGETS    = ["Under ₹10K", "₹10K – ₹50K", "₹50K – ₹1L", "₹1L+"];
const STYLES     = ["Classic", "Contemporary", "Vintage", "Minimalist", "Statement"];
const OCCASIONS  = ["Weddings & Engagements", "Festivals & Special Occasions", "Everyday Wear", "Corporate & Formal Events"];

function toggle(arr = [], val, single = false) {
  if (single) return [val];
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
}

function ChipGroup({ options, selected, onChange, single = false }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"4px" }}>
      {options.map(o => (
        <Chip key={o} label={o} selected={(selected||[]).includes(o)}
          onToggle={() => onChange(toggle(selected, o, single))} />
      ))}
    </div>
  );
}

function CheckGroup({ options, selected, onChange }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"4px" }}>
      {options.map(o => (
        <CheckOpt key={o} label={o} checked={(selected||[]).includes(o)}
          onChange={() => onChange(toggle(selected, o))} />
      ))}
    </div>
  );
}

function Step1({ data, onChange }) {
  return (
    <>
      <FieldLabel>Gender</FieldLabel>
      <div style={{ display:"flex", gap:"18px", flexWrap:"wrap", marginBottom:"4px" }}>
        {["male","female","other"].map(v => (
          <RadioOpt key={v} value={v} checked={data.gender===v} label={v[0].toUpperCase()+v.slice(1)}
            onChange={val => onChange("gender", val)} />
        ))}
      </div>

      <FieldLabel>Date of Birth</FieldLabel>
      <DateInput value={data.date_of_birth} onChange={v => onChange("date_of_birth", v)} />

      <div 
        onClick={() => onChange("is_married", !data.is_married)}
        style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderTop:`1px solid ${T.ivory}`, borderBottom:`1px solid ${T.ivory}`, margin:"14px 0", cursor: "pointer" }}
      >
        <span style={{ fontSize:"13px", color:"#1c1410", fontWeight:500 }}>Are you Married?</span>
        <Toggle checked={!!data.is_married} onChange={v => onChange("is_married", v)} />
      </div>

      {data.is_married && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
          <div>
            <p style={{ fontSize:"9.5px", letterSpacing:"1.5px", textTransform:"uppercase", color:T.muted, marginBottom:"8px", fontWeight:500 }}>Date of Anniversary</p>
            <DateInput value={data.anniversary_date} onChange={v => onChange("anniversary_date", v)} />
          </div>
          <div>
            <p style={{ fontSize:"9.5px", letterSpacing:"1.5px", textTransform:"uppercase", color:T.muted, marginBottom:"8px", fontWeight:500 }}>Spouse Date of Birth</p>
            <DateInput value={data.spouse_dob} onChange={v => onChange("spouse_dob", v)} />
          </div>
        </div>
      )}
    </>
  );
}

function Step2({ data, onChange }) {
  return (
    <>
      <FieldLabel>How often do you buy Jewelry as a Gift?</FieldLabel>
      <ChipGroup options={GIFT_FREQ} selected={data.gifting_frequency} single
        onChange={v => onChange("gifting_frequency", v)} />

      <FieldLabel>What kind of gifting best describes you?</FieldLabel>
      <CheckGroup options={GIFT_STYLE} selected={data.gifting_style}
        onChange={v => onChange("gifting_style", v)} />

      <FieldLabel>Who do you usually gift jewelry to?</FieldLabel>
      <ChipGroup options={GIFT_RECIP} selected={data.gift_recipients}
        onChange={v => onChange("gift_recipients", v)} />
    </>
  );
}

function Step3({ data, onChange }) {
  return (
    <>
      <FieldLabel>Which jewelry types interest you?</FieldLabel>
      <ChipGroup options={JEW_TYPES} selected={data.jewelry_types}
        onChange={v => onChange("jewelry_types", v)} />

      <FieldLabel>Preferred metal type?</FieldLabel>
      <ChipGroup options={METALS} selected={data.metal_type} single
        onChange={v => onChange("metal_type", v)} />

      <FieldLabel>Your usual budget range?</FieldLabel>
      <ChipGroup options={BUDGETS} selected={data.budget_range} single
        onChange={v => onChange("budget_range", v)} />
    </>
  );
}

function Step4({ data, onChange }) {
  return (
    <>
      <FieldLabel>How would you describe your style?</FieldLabel>
      <ChipGroup options={STYLES} selected={data.style_preference}
        onChange={v => onChange("style_preference", v)} />

      <FieldLabel>Occasions you shop for?</FieldLabel>
      <CheckGroup options={OCCASIONS} selected={data.shopping_occasions}
        onChange={v => onChange("shopping_occasions", v)} />
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   VALIDATION
───────────────────────────────────────────────────────── */
function validate(step, d) {
  const e = [];
  if (step === 1) {
    if (!d.gender)          e.push("Please select your gender.");
    if (!d.date_of_birth)   e.push("Please enter your date of birth.");
    if (d.is_married) {
      if (!d.anniversary_date) e.push("Please enter your anniversary date.");
      if (!d.spouse_dob)       e.push("Please enter spouse's date of birth.");
    }
  }
  if (step === 2) {
    if (!(d.gifting_frequency||[]).length) e.push("Please select how often you gift jewelry.");
    if (!(d.gifting_style||[]).length)     e.push("Please select at least one gifting style.");
    if (!(d.gift_recipients||[]).length)   e.push("Please select who you gift jewelry to.");
  }
  if (step === 3) {
    if (!(d.jewelry_types||[]).length) e.push("Please select at least one jewelry type.");
    if (!(d.metal_type||[]).length)    e.push("Please select a preferred metal type.");
    if (!(d.budget_range||[]).length)  e.push("Please select your budget range.");
  }
  if (step === 4) {
    if (!(d.style_preference||[]).length)   e.push("Please select a style that describes you.");
    if (!(d.shopping_occasions||[]).length) e.push("Please select at least one shopping occasion.");
  }
  return e;
}

/* ─────────────────────────────────────────────────────────
   DEFAULT STATE
───────────────────────────────────────────────────────── */
const blank = {
  step_1: { gender:"", date_of_birth:"", is_married:false, anniversary_date:"", spouse_dob:"" },
  step_2: { gifting_frequency:[], gifting_style:[], gift_recipients:[] },
  step_3: { jewelry_types:[], metal_type:[], budget_range:[] },
  step_4: { style_preference:[], shopping_occasions:[] },
};

const initial = {
  currentStep:1, formData: blank,
  rewardedSteps:[], completedSteps:[], profileComplete:false,
};

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────── */
export default function EarnRewardsPage() {
  const [state,       setState]       = useState(initial);
  const [nectorCoins, setNectorCoins] = useState(null);   // fetched via proxy
  const [coinsLoading, setCoinsLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [errors,      setErrors]      = useState([]);
  const [saveStatus,  setSaveStatus]  = useState(""); // "" | "saving" | "saved"
  const [completing,  setCompleting]  = useState(false);

  const API = useRef(new Set());

  /* ── Init ── */
  useEffect(() => {
    async function init() {
      loadLocal();
      await fetchServerProgress();
      setPageLoading(false);
      fetchCoins();
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Nector coins (via Next.js proxy — no CORS) ── */
  async function fetchCoins() {
    setCoinsLoading(true);
    try {
      const r    = await fetch("/api/customer/nector-coins", { cache:"no-store" });
      const data = await r.json();
      if (data?.status !== false) setNectorCoins(data.coins_balance ?? 0);
    } catch (e) {
      console.warn("Nector proxy error:", e);
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
      setState(prev => ({
        ...prev, ...p,
        formData      : { ...blank, ...(p.formData || {}) },
        rewardedSteps : p.rewardedSteps  || [],
        completedSteps: p.completedSteps || [],
      }));
    } catch (_) {}
  }

  function saveLocal(s) {
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(s)); } catch (_) {}
  }

  /* ── Server progress ── */
  async function fetchServerProgress() {
    try {
      const profileRes = await fetch("/api/customer/profile");
      if (!profileRes.ok) return;
      const profileData = await profileRes.json();
      const simpleId    = extractNumericId(profileData?.customer?.id || "");
      if (!simpleId) return;

      const r = await fetch(
        `${CONFIG.apiBase}/get-progress.php?customer_id=shopify-${simpleId}&t=${Date.now()}`
      );
      const d = await r.json();
      if (!d.success) return;

      const rewardedSteps  = (d.rewarded_steps  || []).map(Number);
      const completedSteps = (d.completed_steps || []).map(Number);
      
      // Verification check: ensure all completed steps that SHOULD be rewarded ARE rewarded.
      // This handles cases where a user might have filled a step but not clicked 'Continue'.
      // However, per requirements, we only reward ONCE and explicitly.
      
      const profileComplete = !!d.profile_complete && rewardedSteps.includes(4);

      let formData = { ...blank };
      if (d.form_data && typeof d.form_data === "object") {
        Object.entries(d.form_data).forEach(([k,v]) => { if (v && typeof v === "object") formData[k] = v; });
      }

      setState(prev => {
        // Resume from the first step that is NOT BOTH completed AND rewarded, 
        // to give the user the chance to get their coins.
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
          currentStep: profileComplete ? prev.currentStep : firstIncomplete
        }; 
        saveLocal(ns); 
        return ns; 
      });
    } catch (e) { console.warn("Server progress:", e); }
  }

  /* ── API save (with coin reward on first time) ── */
  async function apiSave(step, stepData, autoSave = false, allFormData = null) {
    try {
      const profileRes = await fetch("/api/customer/profile");
      if (!profileRes.ok) return;
      const profileData = await profileRes.json();
      const simpleId    = extractNumericId(profileData?.customer?.id || "");
      if (!simpleId) return;

      const customerId = `shopify-${simpleId}`;
      const payload = { 
        customer_id: customerId, 
        step, 
        form_data: stepData, 
        all_form_data: allFormData || state.formData, 
        auto_save: autoSave 
      };

      const res = await fetch(`${CONFIG.apiBase}/save-step.php`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        keepalive: true,
        body: JSON.stringify(payload),
      });
      
      const d = await res.json();
      if (!autoSave && d.coins_awarded) {
        fetchCoins();
      }
      return d;
    } catch (e) {
      console.warn("apiSave error:", e);
    }
  }

  /* ── Debounced auto-save ── */
  const debouncedSave = useCallback(
    debounce((step, stepData, allFormData) => {
      if (step === 4) return;
      setSaveStatus("saving");
      apiSave(step, stepData, true, allFormData)
        .then(() => { 
          setSaveStatus("saved"); 
          setTimeout(() => setSaveStatus(""), 2000); 
        })
        .catch(() => setSaveStatus(""));
    }, 800),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);

  /* ── Field change ── */
  function handleChange(stepKey, field, value) {
    setState(prev => {
      const updatedStepData = { ...prev.formData[stepKey], [field]: value };
      const updatedAllData = { ...prev.formData, [stepKey]: updatedStepData };
      const ns = { ...prev, formData: updatedAllData };
      
      saveLocal(ns);
      debouncedSave(prev.currentStep, updatedStepData, updatedAllData);
      return ns;
    });
    setErrors([]);
  }

  /* ── Navigation ── */
  function goStep(next) {
    if (next < state.currentStep) { 
      setErrors([]); 
      setState(p => ({ ...p, currentStep:next })); 
      return; 
    }

    // Validate current step before proceeding forward
    const currentStepKey = `step_${state.currentStep}`;
    const currentData = state.formData[currentStepKey] || {};
    const errs = validate(state.currentStep, currentData);
    if (errs.length) {
      setErrors(errs);
      return;
    }
    
    setErrors([]);

    const n = state.currentStep;
    const isNewReward = !state.rewardedSteps.includes(n);
    const stepData = state.formData[currentStepKey];
    const allData = state.formData;

    setState(prev => {
      const ns  = {
        ...prev, 
        currentStep: next,
        rewardedSteps : isNewReward ? [...prev.rewardedSteps, n]  : prev.rewardedSteps,
        completedSteps: prev.completedSteps.includes(n) ? prev.completedSteps : [...prev.completedSteps, n],
      };
      saveLocal(ns);
      return ns;
    });

    // Award coins only if this step hasn't been rewarded before
    if (isNewReward) {
      apiSave(n, stepData, false, allData);
    } else {
      // Still save the data if it's already rewarded, but as auto_save to avoid double coins
      apiSave(n, stepData, true, allData);
    }
  }

  function completeProfile() {
    // Validate final step
    const step4Data = state.formData.step_4 || {};
    const errs = validate(4, step4Data);
    if (errs.length) {
      setErrors(errs);
      return;
    }

    setErrors([]);
    setCompleting(true);

    const isNewReward = !state.rewardedSteps.includes(4);
    const stepData = state.formData.step_4;
    const allData = state.formData;

    setState(prev => {
      const ns  = {
        ...prev, 
        profileComplete: true,
        rewardedSteps : isNewReward ? [...prev.rewardedSteps, 4]  : prev.rewardedSteps,
        completedSteps: prev.completedSteps.includes(4) ? prev.completedSteps : [...prev.completedSteps, 4],
      };
      saveLocal(ns);
      return ns;
    });

    if (isNewReward) {
      apiSave(4, stepData, false, allData).finally(() => setCompleting(false));
    } else {
      apiSave(4, stepData, true, allData).finally(() => setCompleting(false));
    }
  }

  /* ── Derived ── */
  const coins       = state.rewardedSteps.length * CONFIG.pointsPerStep;
  const ringPct     = (state.rewardedSteps.length / CONFIG.totalSteps) * 100;
  const remaining   = CONFIG.totalSteps - state.rewardedSteps.length;

  /* ── Loading screen ── */
  if (pageLoading) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", gap:"12px" }}>
        <Loader2 size={36} style={{ animation:"spin 1s linear infinite", color: T.blush }} />
        <p style={{ fontSize:"10px", letterSpacing:"2px", textTransform:"uppercase", color: T.muted }}>Loading your rewards...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────
     RENDER
  ──────────────────────────────────────────────────────── */
  return (
    <div className="font-inherit animate-[fadeSlide_0.35s_ease]">
      <style>{`
        @keyframes fadeSlide { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input[type=date]::-webkit-calendar-picker-indicator { 
          opacity: 0; 
          cursor: pointer; 
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
        }
        
        @media (max-width: 768px) {
          /* Grid adjustments */
          .rewards-layout {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .rewards-sidebar {
            position: static !important;
            order: -1; /* Move sidebar/stats to top on mobile */
          }
          /* Typography & spacing boosts for mobile */
          .step-tabs button {
            font-size: 10px !important;
            padding: 12px 4px !important;
          }
          .main-card-body {
            padding: 16px 16px 20px !important;
          }
          .chip-button {
            font-size: 14px !important;
            padding: 12px 16px !important;
            min-height: 48px !important;
          }
        }
      `}</style>

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="font-figtree text-xl md:text-2xl font-bold text-zinc-900 tracking-tight mb-1">Earn Rewards</h2>
          <p className="text-[#666] text-sm md:text-base font-medium mt-1">Complete your profile to earn Lucira Coins and unlock exclusive benefits.</p>
        </div>

        {/* Lucira Coins badge */}
        <div className="flex items-center gap-3 bg-gradient-to-br from-[#3d2a1e] to-[#5c3d28] rounded-xl px-[18px] py-3 shadow-[0_8px_24px_rgba(28,20,16,0.18)]">
          <Gift size={22} className="text-[#d4aa5a]" />
          <div>
            <p className="font-figtree text-base md:text-base font-semibold text-zinc-100 tracking-tight mb-1">Lucira Coins</p>
            <p className="text-2xl font-bold text-white m-0 leading-[1.2]">
              {coinsLoading ? "..." : nectorCoins !== null ? nectorCoins.toLocaleString("en-IN") : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="rewards-layout grid grid-cols-[1fr_210px] gap-5 items-start">

        {/* ── MAIN CARD ── */}
        <div className="bg-white rounded-[4px] shadow-[0_2px_20px_rgba(28,20,16,0.07)] overflow-hidden">

          {/* Milestone / pts bar */}
          <div className="px-7 py-5 bg-[#F4F0F0] border-b border-[#f4f0f0]">
            <MilestoneBar completedSteps={state.completedSteps} profileComplete={state.profileComplete} />
            <p className="text-sm text-[#1a1a1a] mt-2.5 tracking-[0.3px]">
              {state.profileComplete
                ? <>🎉 <strong className="text-[#5A413F]">Profile complete!</strong> You&apos;ve earned all your Lucira Coins.</>
                : <>You are just <strong className="text-[#5A413F] text-sm">{remaining} more step{remaining!==1?"s":""}</strong> away for Bonus Lucira Coins</>
              }
            </p>
          </div>

          {/* Step tabs */}
          {!state.profileComplete && (
            <div className="step-tabs flex border-b border-[#e5ddd4] bg-[#f4f0f0]">
              {[1,2,3,4].map(n => {
                const done   = state.completedSteps.includes(n);
                const active = state.currentStep === n;
                return (
                  <button key={n} type="button"
                    onClick={() => done && !active && setState(p => ({ ...p, currentStep:n }))}
                    className={`flex-1 text-center py-[9px] px-1 text-[9px] tracking-[1.5px] uppercase font-normal transition-all duration-200 border-b-2 ${
                      active ? "text-[#5A413F] bg-white border-[#5A413F]" : 
                      done ? "text-[#1c1410] bg-transparent border-transparent cursor-pointer" : 
                      "text-[#9a8f85] bg-transparent border-transparent cursor-default"
                    }`}>
                    {STEP_NAMES[n]}
                  </button>
                );
              })}
            </div>
          )}

          {/* Step body */}
          <div className="main-card-body px-6 py-6">
            {state.profileComplete ? (
              /* ── Completion screen ── */
              <div className="text-center py-7 px-4">
                <div className="w-20 h-20 rounded-full border-2 border-[#5A413F] flex items-center justify-center mx-auto mb-5 bg-[#f4f0f0]">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#5A413F" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#1c1410] mb-1.5">You Have Completed Your Profile</h3>
                <p className="text-[#666] text-sm mb-7">Visit later if any question is added.</p>
                <a href="/collections/all"
                  className="inline-block bg-[#5A413F] text-white px-12 py-[13px] rounded-full text-[11px] tracking-[2.5px] uppercase no-underline font-medium">
                  Shop Now
                </a>
                <div className="mt-6 pt-4 border-t border-[#e5ddd4] text-[13px] text-[#666]">
                  Need Help?{" "}
                  <a href="https://api.whatsapp.com/send/?phone=%2B919004435760&text=Hi!+Can+you+tell+me+more+about+Lucira+Jewelry%E2%80%99s+collection%3F&type=phone_number&app_absent=0"
                    className="text-[#5A413F] no-underline" target="_blank" rel="noopener noreferrer">
                    Chat with our Expert
                  </a>
                </div>
              </div>
            ) : (
              <>
                {/* Eyebrow */}
                <p className="text-xs tracking-[2.5px] uppercase text-[#5A413F] mb-1.25 font-medium">
                  Step {state.currentStep} of {CONFIG.totalSteps}
                </p>
                <h3 className="text-xl font-medium text-[#1c1410] mb-1 leading-[1.5]">
                  {state.currentStep===1?"Let Us Know You Better":state.currentStep===2?"Gifting Behaviour":state.currentStep===3?"Your Wishlist":"Your Style"}
                </h3>
                {[1,3,4].includes(state.currentStep) && (
                  <p className="text-[#666] text-sm mb-[18px] leading-[1.5]">
                    {state.currentStep===1?"Tell us a little about yourself so we can personalise your experience."
                      :state.currentStep===3?"Tell us what jewelry styles you're dreaming about."
                      :"Help us understand your aesthetic preferences."}
                  </p>
                )}

                {/* Validation errors */}
                {errors.length > 0 && (
                  <div className="bg-[#ffe8e8] rounded-lg p-2.5 px-4 mb-3.5">
                    {errors.map((e,i) => <p key={i} className="text-[#c40000] text-xs my-0.5">• {e}</p>)}
                  </div>
                )}

                {/* Active step */}
                {state.currentStep===1 && <Step1 data={state.formData.step_1} onChange={(f,v)=>handleChange("step_1",f,v)} />}
                {state.currentStep===2 && <Step2 data={state.formData.step_2} onChange={(f,v)=>handleChange("step_2",f,v)} />}
                {state.currentStep===3 && <Step3 data={state.formData.step_3} onChange={(f,v)=>handleChange("step_3",f,v)} />}
                {state.currentStep===4 && <Step4 data={state.formData.step_4} onChange={(f,v)=>handleChange("step_4",f,v)} />}

                {/* Actions */}
                <div className="flex items-center justify-between mt-6 pt-[18px] border-t border-[#f4f0f0]">
                  <button type="button"
                    disabled={state.currentStep===1}
                    onClick={() => goStep(state.currentStep-1)}
                    className={`max-w-[145px] w-full rounded-full text-xs py-2.5 font-inherit transition-all duration-200 border ${
                      state.currentStep===1 ? "bg-white text-[#e5ddd4] border-[#e5ddd4] opacity-40 cursor-default" : "bg-white text-[#5A413F] border-[#5A413F] opacity-100 cursor-pointer"
                    }`}>
                    Back
                  </button>

                  <button type="button"
                    disabled={completing}
                    onClick={() => state.currentStep<CONFIG.totalSteps ? goStep(state.currentStep+1) : completeProfile()}
                    className="bg-[#5A413F] text-white border-none px-[26px] py-[11px] rounded-full text-xs tracking-[1px] font-inherit cursor-pointer flex items-center gap-2.5 shadow-[0_4px_16px_rgb(90_65_63)] transition-all duration-200">
                    {completing ? <Loader2 size={14} className="animate-spin" /> : (
                      <>{state.currentStep<CONFIG.totalSteps?"Save & Continue":"Complete Profile"}<ArrowRight size={12}/></>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="rewards-sidebar flex flex-col gap-3.5 sticky top-20">

          {/* Progress ring card */}
          <div className="bg-white rounded-[4px] px-[18px] py-[22px] text-center shadow-[0_2px_20px_rgba(28,20,16,0.07)]">
            <ProgressRing pct={ringPct} />
            <p className="text-[9.5px] tracking-[2px] uppercase text-[#9a8f85] mb-4">Profile Completed</p>
            <ul className="list-none p-0 m-0 text-left flex flex-col gap-2.5 border-t border-[#f4f0f0] pt-3.5">
              {[1,2,3,4].map(n => {
                const done = state.profileComplete || state.completedSteps.includes(n);
                return (
                  <li key={n} className={`flex items-center gap-[9px] text-[11.5px] ${done ? "text-[#1c1410]" : "text-[#9a8f85]"}`}>
                    <div className={`w-6 h-[18px] rounded-full border-[1.5px] flex items-center justify-center shrink-0 ${done ? "bg-[#5A413F] border-transparent" : "bg-white border-[#e5ddd4]"}`}>
                      {done ? <Check size={8} className="text-white" strokeWidth={3}/> : <div className="w-1.5 h-1.5 rounded-full bg-[#e5ddd4]" />}
                    </div>
                    {STEP_NAMES[n]}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Coins earned card */}
          <div className="bg-gradient-to-br from-[#3d2a1e] to-[#5c3d28] rounded-[4px] px-4 py-3.5 text-center shadow-[0_8px_40px_rgba(28,20,16,0.12)]">
            <p className="text-xs tracking-[2px] uppercase text-white/45 mb-1.5">Coins Earned</p>
            <p className="text-[26px] font-semibold text-white leading-none m-0">{coins}</p>
            <p className="text-[10px] text-white/45 tracking-[0.5px] mt-2">Lucira Coins</p>
          </div>
        </div>
      </div>

      {/* Auto-save indicator */}
      {saveStatus && (
        <div className="fixed bottom-6 right-6 bg-white border border-[#e5ddd4] rounded-full px-3.5 py-[7px] text-[11px] text-[#9a8f85] font-inherit tracking-[0.5px] shadow-[0_2px_20px_rgba(28,20,16,0.07)] flex items-center gap-1.5 z-[200] animate-[fadeSlide_0.3s_ease]">
          {saveStatus==="saving"
            ? <><div className="w-1.5 h-1.5 rounded-full bg-[#5A413F] animate-pulse" />Saving...</>
            : <><Check size={10} className="text-[#5A413F]"/>Saved</>
          }
        </div>
      )}

      {/* Mobile responsive */}
      {/* (Previously handled by media query in <style>, now mostly integrated via Tailwind but keeping the structure if needed for more complex things) */}
    </div>
  );
}
