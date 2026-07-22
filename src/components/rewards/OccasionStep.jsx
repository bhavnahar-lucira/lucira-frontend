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
      className={`group flex items-center gap-2 border rounded-full px-4 py-2 transition-colors duration-200 cursor-pointer ${
        selected
          ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
          : "bg-white border-zinc-200 text-zinc-700 hover:border-primary"
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function FieldError({ children }) {
  if (!children) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-500 mt-2 font-medium">
      <AlertCircle size={13} className="shrink-0" /> {children}
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
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-7">
      <div>
        <p className="text-sm font-bold text-primary mb-1">Who do you shop for most?</p>
        <p className="text-sm text-zinc-500 mb-3.5">This helps us curate pieces suited to them.</p>
        <div role="radiogroup" className="flex flex-wrap gap-3">
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

      <div>
        <p className="text-sm font-bold text-primary mb-1">Which date should we remember?</p>
        <p className="text-sm text-zinc-500 mb-3.5">We&apos;ll mark the calendar so you don&apos;t have to.</p>
        <label className="text-[10px] tracking-widest uppercase text-zinc-400 font-bold block mb-2.5">
          Date of occasion
        </label>
        <div className="flex items-center gap-2 border-b border-zinc-200 transition-colors focus-within:border-primary max-w-[320px]">
          <input
            id="occ-event_date"
            type="date"
            value={form.event_date}
            onChange={(e) => setField("event_date", e.target.value)}
            className="bg-transparent border-none outline-none py-2 px-0.5 flex-1 min-w-0 text-sm font-medium text-zinc-900 placeholder:text-zinc-300 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50"
            placeholder="dd-mm-yyyy"
          />
        </div>
        <FieldError>{errors.event_date}</FieldError>
      </div>

      <div>
        <p className="text-sm font-bold text-primary mb-1">What&apos;s the occasion?</p>
        <p className="text-sm text-zinc-500 mb-3.5">Occasions are private and only used to personalise your offers.</p>
        <div role="radiogroup" className="flex flex-wrap gap-3">
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

      <div>
        <p className="text-sm font-bold text-primary mb-1">Give it a name</p>
        <p className="text-sm text-zinc-500 mb-3.5">A short label you&apos;ll recognise, e.g. Mum&apos;s Birthday</p>
        <div className={`flex items-center border-b transition-colors focus-within:border-primary ${errors.occasion_title ? "border-red-500" : "border-zinc-200"}`}>
          <input
            id="occ-occasion_title"
            type="text"
            value={form.occasion_title}
            onChange={(e) => setField("occasion_title", e.target.value)}
            className="bg-transparent border-none outline-none py-2 px-0.5 w-full text-sm font-medium text-zinc-900 placeholder:text-zinc-300"
            placeholder="Occasion name"
            maxLength={80}
          />
        </div>
        <FieldError>{errors.occasion_title}</FieldError>
      </div>

      {errors._form && (
        <div className="flex items-start gap-2 text-xs font-medium text-red-500 mt-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          {errors._form}
        </div>
      )}

      <div className="flex gap-4 pt-6 border-t border-zinc-100">
        <button type="button" className="flex-1 bg-white border border-zinc-200 text-zinc-500 text-[10px] font-bold uppercase tracking-widest px-4 py-4 rounded-xl transition-colors hover:bg-zinc-50 hover:text-primary hover:border-primary/30" onClick={onCancel} disabled={adding}>Cancel</button>
        <button
          type="submit"
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-white border border-primary text-[10px] font-bold uppercase tracking-[0.15em] px-4 py-4 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
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
      <div className="border border-dashed border-zinc-200 rounded-2xl p-8 text-center text-sm leading-relaxed text-zinc-500">
        <p className="font-bold text-primary mb-2">
          Save the moments that matter
        </p>
        Add important occasions to help Lucirá make future gifting and reminders more relevant.
      </div>
    );
  }

  return (
    <ul className="list-none m-0 p-0 relative space-y-4">
      {/* timeline line */}
      {occasions.length > 1 && (
        <li aria-hidden className="absolute left-[21px] top-6 bottom-8 w-px bg-primary/10 pointer-events-none" />
      )}
      {occasions.map((o) => (
        <li key={o.occasion_id} className="relative pl-[60px] pb-2 flex items-start group">
          {/* icon bubble */}
          <span className="absolute left-0 top-0 size-[42px] rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0 z-10 transition-colors group-hover:bg-primary/10">
            {OCC_ICONS[o.occasion_name] || OCC_ICONS.other}
          </span>

          {/* text */}
          <div className="flex-1 min-w-0 bg-zinc-50/50 rounded-2xl p-4 border border-zinc-100/50 group-hover:border-zinc-200 group-hover:bg-zinc-50 transition-colors">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="text-sm font-bold text-zinc-900 mb-1">
                  {o.occasion_title}
                </p>
                <p className="text-xs font-medium text-zinc-500 mb-2">
                  {relationshipLabel(o.relationship_name)} · {occasionLabel(o.occasion_name)}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
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
                  className="bg-white border border-zinc-200 text-zinc-400 p-2 rounded-lg shrink-0 transition-colors hover:text-red-500 hover:border-red-200 hover:bg-red-50 focus:outline-none"
                >
                  {deletingId === o.occasion_id
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Trash2 size={14} />}
                </button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
