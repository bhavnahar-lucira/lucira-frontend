"use client";

import { useState } from "react";
import { Loader2, CalendarDays, AlertCircle, Trash2 } from "lucide-react";
import {
  RELATIONSHIPS,
  OCCASION_TYPES,
  validateOccasion,
  occasionLabel,
  relationshipLabel,
  formatEventDate,
} from "@/lib/occasions";

const EMPTY = {
  occasion_name: "",
  relationship_name: "",
  occasion_title: "",
  event_date: "",
};

/* ─── Diamond chip (matches prototype) ─── */
function DiamondChip({ label, selected, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`occ-chip${selected ? " occ-chip--selected" : ""}`}
    >
      <span className="occ-chip__diamond" />
      {label}
    </button>
  );
}

function FieldError({ children }) {
  if (!children) return null;
  return (
    <p className="occ-field-error">
      <AlertCircle size={11} /> {children}
    </p>
  );
}

export function OccasionForm({ onAdd, onCancel, adding }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const submit = async () => {
    if (adding) return;
    const validationErrors = validateOccasion(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      const firstKey = Object.keys(validationErrors)[0];
      document.getElementById(`occ-${firstKey}`)?.focus();
      return;
    }
    const ok = await onAdd(form);
    if (ok) { setForm(EMPTY); setErrors({}); }
    else setErrors({ _form: "We could not add this occasion. Please try again." });
  };

  const isFormValid =
    form.relationship_name && form.event_date && form.occasion_name && form.occasion_title.trim();

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <style>{`
        .occ-section { margin-bottom: 32px; }
        .occ-section__title {
          font-weight: 600; color: #2B2321; margin: 0 0 3px;
        }
        .occ-section__sub {
          color: #8C7A73; margin: 0 0 14px; line-height: 1.5;
        }

        /* Diamond chip */
        .occ-chip {
          font-family: inherit;
          padding: 9px 17px; border-radius: 999px;
          border: 1px solid #E8DED6; background: transparent;
          color: #2B2321; cursor: pointer;
          display: flex; align-items: center; gap: 7px;
          transition: all .15s ease;
        }
        .occ-chip:hover { border-color: var(--primary); }
        .occ-chip__diamond {
          width: 6px; height: 6px; background: color-mix(in srgb, var(--primary) 40%, white);
          transform: rotate(45deg); opacity: 0; transition: opacity .15s ease; flex: 0 0 auto;
        }
        .occ-chip--selected {
          background: var(--primary); border-color: var(--primary); color: #fff;
        }
        .occ-chip--selected .occ-chip__diamond { opacity: 1; background: rgba(255,255,255,.7); }

        /* Date underline field */
        .occ-date-wrap {
          display: flex; align-items: center; gap: 8px;
          border-bottom: 1px solid #E8DED6; max-width: 320px;
          transition: border-color .2s ease;
        }
        .occ-date-wrap:focus-within { border-bottom-color: var(--primary); }
        .occ-date-input {
          font-family: inherit; color: #2B2321;
          background: transparent; border: none; outline: none;
          padding: 6px 2px 10px; flex: 1; min-width: 0; appearance: none;
        }
        .occ-date-input::placeholder { color: #B7A9A2; }
        .occ-date-icon { color: var(--primary); opacity:.6; padding-bottom: 10px; flex: 0 0 auto; }

        /* Title underline field */
        .occ-title-wrap {
          border-bottom: 1px solid #E8DED6; transition: border-color .2s ease;
        }
        .occ-title-wrap.has-error { border-bottom-color: #ef4444; }
        .occ-title-wrap:focus-within { border-bottom-color: var(--primary); }
        .occ-title-input {
          font-family: inherit; color: #2B2321;
          background: transparent; border: none; outline: none;
          padding: 6px 2px 10px; width: 100%; min-width: 0; appearance: none;
        }
        .occ-title-input::placeholder { color: #B7A9A2; }

        .occ-form-error {
          display: flex; align-items: flex-start; gap: 8px;
          color: #dc2626; margin-top: 6px;
        }

        /* Action buttons */
        .occ-actions {
          display: flex; gap: 10px;
          padding-top: 20px; border-top: 1px solid color-mix(in srgb, var(--primary) 15%, white); margin-top: 28px;
        }
        .occ-btn-cancel {
          flex: 1; font-family: inherit;
          letter-spacing: .09em; text-transform: uppercase;
          background: #fff; color: #8C7A73;
          border: 1px solid #E8DED6; border-radius: 3px;
          padding: 13px 16px; cursor: pointer;
          transition: background .15s ease, color .15s ease;
        }
        .occ-btn-cancel:hover { background: color-mix(in srgb, var(--primary) 6%, white); color: var(--primary); }
        .occ-btn-submit {
          flex: 1; font-family: inherit;
          letter-spacing: .09em; text-transform: uppercase;
          background: var(--primary); color: #fff;
          border: 1px solid var(--primary); border-radius: 3px;
          padding: 13px 16px; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          transition: opacity .15s ease;
        }
        .occ-btn-submit:hover:not(:disabled) { opacity: .85; }
        .occ-btn-submit:disabled { opacity: .5; cursor: not-allowed; }
      `}</style>

      <div className="occ-section">
        <p className="occ-section__title text-sm">Who do you shop for most?</p>
        <p className="occ-section__sub text-xs">This helps us curate pieces suited to them.</p>
        <div role="radiogroup" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {RELATIONSHIPS.map((r) => (
            <DiamondChip
              key={r.value}
              label={r.label}
              selected={form.relationship_name === r.value}
              onSelect={() => setField("relationship_name", r.value)}
            />
          ))}
        </div>
        <FieldError>{errors.relationship_name}</FieldError>
      </div>

      <div className="occ-section">
        <p className="occ-section__title text-sm">Which date should we remember?</p>
        <p className="occ-section__sub text-xs">We&apos;ll mark the calendar so you don&apos;t have to.</p>
        <label className="text-[10px] tracking-widest uppercase text-[#B7A9A2] block mb-1.5">
          Date of occasion
        </label>
        <div className="occ-date-wrap">
          <input
            id="occ-event_date"
            type="date"
            value={form.event_date}
            onChange={(e) => setField("event_date", e.target.value)}
            className="occ-date-input text-sm"
            placeholder="dd-mm-yyyy"
          />
          <CalendarDays size={16} className="occ-date-icon" />
        </div>
        <FieldError>{errors.event_date}</FieldError>
      </div>

      <div className="occ-section">
        <p className="occ-section__title text-sm">What&apos;s the occasion?</p>
        <p className="occ-section__sub text-xs">Occasions are private and only used to personalise your offers.</p>
        <div role="radiogroup" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {OCCASION_TYPES.map((o) => (
            <DiamondChip
              key={o.value}
              label={o.label}
              selected={form.occasion_name === o.value}
              onSelect={() => setField("occasion_name", o.value)}
            />
          ))}
        </div>
        <FieldError>{errors.occasion_name}</FieldError>
      </div>

      <div className="occ-section" style={{ marginBottom: 0 }}>
        <p className="occ-section__title text-sm">Give it a name</p>
        <p className="occ-section__sub text-xs">A short label you&apos;ll recognise, e.g. Mum&apos;s Birthday</p>
        <div className={`occ-title-wrap${errors.occasion_title ? " has-error" : ""}`}>
          <input
            id="occ-occasion_title"
            type="text"
            value={form.occasion_title}
            onChange={(e) => setField("occasion_title", e.target.value)}
            className="occ-title-input text-sm"
            placeholder="Occasion name"
            maxLength={80}
          />
        </div>
        <FieldError>{errors.occasion_title}</FieldError>
      </div>

      {errors._form && (
        <div className="occ-form-error text-xs">
          <AlertCircle size={15} className="shrink-0" />
          {errors._form}
        </div>
      )}

      <div className="occ-actions">
        <button type="button" className="occ-btn-cancel text-[11px]" onClick={onCancel} disabled={adding}>Cancel</button>
        <button
          type="submit"
          className="occ-btn-submit text-[11px]"
          disabled={adding || !isFormValid}
        >
          {adding ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save occasion"}
        </button>
      </div>
    </form>
  );
}

const OCC_ICONS = {
  birthday: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="8" width="18" height="13" rx="1" /><path d="M3 12h18" /><path d="M12 8v13" />
      <path d="M12 8c-1.6 0-4-1-4-3a2 2 0 0 1 4-1" /><path d="M12 8c1.6 0 4-1 4-3a2 2 0 0 0-4-1" />
    </svg>
  ),
  anniversary: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 21s-7-4.5-9.3-9A5.2 5.2 0 0 1 12 6a5.2 5.2 0 0 1 9.3 6c-2.3 4.5-9.3 9-9.3 9z" />
    </svg>
  ),
  other: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 3" />
    </svg>
  ),
};

export function OccasionCards({ occasions, onDelete, deletingId }) {
  if (!occasions?.length) {
    return (
      <div style={{
        border: "1px dashed #E8DED6", borderRadius: 12,
        padding: "32px 20px", textAlign: "center",
      }} className="text-[13px] leading-relaxed text-[#8C7A73]">
        <p className="font-semibold text-sm text-[#3E2B29] mb-1.5">
          Save the moments that matter
        </p>
        Add important occasions to help Lucirá make future gifting and reminders more relevant.
      </div>
    );
  }

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, position: "relative" }}>
      {/* timeline line */}
      {occasions.length > 1 && (
        <li aria-hidden style={{
          position: "absolute", left: 19, top: 24, bottom: 24,
          width: 1, background: "color-mix(in srgb, var(--primary) 30%, white)", pointerEvents: "none",
        }} />
      )}
      {occasions.map((o) => (
        <li key={o.occasion_id} style={{ position: "relative", paddingLeft: 54, paddingBottom: 22, display: "flex", alignItems: "flex-start" }}>
          {/* icon bubble */}
          <span style={{
            position: "absolute", left: 0, top: 0,
            width: 38, height: 38, borderRadius: "50%",
            background: "color-mix(in srgb, var(--primary) 8%, white)",
            border: "1px solid color-mix(in srgb, var(--primary) 25%, white)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--primary)", flexShrink: 0, zIndex: 1, opacity: .85,
          }}>
            {OCC_ICONS[o.occasion_name] || OCC_ICONS.other}
          </span>

          {/* text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="text-sm font-medium text-[#2B2321] my-0.5">
              {o.occasion_title}
            </p>
            <p className="text-xs text-[#8C7A73] m-0">
              {relationshipLabel(o.relationship_name)} · {occasionLabel(o.occasion_name)}
            </p>
            <p className="text-xs text-[#B7A9A2] mt-1 mb-0 flex items-center gap-1.5">
              <CalendarDays size={12} />
              {formatEventDate(o.event_date)}
            </p>
          </div>

          {/* delete */}
          {o.deletable !== false && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(o)}
              disabled={deletingId === o.occasion_id}
              title="Remove occasion"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#B7A9A2", padding: "4px 2px", flexShrink: 0,
                transition: "color .15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#B7A9A2")}
            >
              {deletingId === o.occasion_id
                ? <Loader2 size={14} className="animate-spin" />
                : <Trash2 size={14} />}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
