"use client";

/**
 * OccasionStep — inline occasion capture used inside the Earn Rewards wizard.
 *
 * Exports:
 *   <OccasionForm onAdd adding />  — premium inline add form (chips + title + date)
 *   <OccasionCards ... />          — read-only immutable cards grid with delete
 *
 * Matches the wizard's chip aesthetic (see screenshot) but elevated: brand-fill
 * on select, soft blush when idle, smooth transitions, large tap targets.
 */

import { useState } from "react";
import {
  Cake,
  Sparkles,
  Gift,
  Plus,
  Trash2,
  Loader2,
  CalendarDays,
  AlertCircle,
} from "lucide-react";
import {
  RELATIONSHIPS,
  OCCASION_TYPES,
  TITLE_MAX,
  DELETE_ENABLED,
  relationshipLabel,
  occasionLabel,
  formatEventDate,
  validateOccasion,
} from "@/lib/occasions";

const BRAND = "#5A413F";

export const occasionIcon = (type, size = 16) => {
  if (type === "birthday") return <Cake size={size} />;
  if (type === "anniversary") return <Sparkles size={size} />;
  return <Gift size={size} />;
};

const EMPTY = {
  relationship_name: "",
  occasion_name: "",
  occasion_title: "",
  event_date: "",
};

/* ─────────────────────────────────────────────────────────
   CHIP
───────────────────────────────────────────────────────── */
function Chip({ label, icon, selected, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-200 sm:px-5 ${
        selected
          ? "border-transparent bg-[#5A413F] text-white shadow-md shadow-[#5A413F]/25"
          : "border-transparent bg-[#fbeeee] text-zinc-700 hover:bg-[#f6e2e2] active:scale-[0.98]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function FieldLabel({ children, htmlFor }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-3 block text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500"
    >
      {children}
    </label>
  );
}

/* ─────────────────────────────────────────────────────────
   INLINE ADD FORM
───────────────────────────────────────────────────────── */
export function OccasionForm({ onAdd, adding, compact }) {
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
      const first = Object.keys(validationErrors)[0];
      document.getElementById(`occ-${first}`)?.focus?.();
      return;
    }
    const ok = await onAdd(form);
    if (ok) {
      setForm(EMPTY);
      setErrors({});
    } else {
      setErrors({ _form: "We could not add this occasion. Please try again." });
    }
  };

  return (
    <div
      className={`rounded-2xl border border-[#efe6e6] bg-[#fdf9f9] p-5 sm:p-6 ${
        compact ? "" : ""
      }`}
    >
      {/* Relationship */}
      <div>
        <FieldLabel>Who is this occasion for?</FieldLabel>
        <div role="radiogroup" aria-label="Relationship" className="flex flex-wrap gap-2.5">
          {RELATIONSHIPS.map((r) => (
            <Chip
              key={r.value}
              label={r.label}
              selected={form.relationship_name === r.value}
              onSelect={() => setField("relationship_name", r.value)}
            />
          ))}
        </div>
        <FieldError id="occ-relationship_name">{errors.relationship_name}</FieldError>
      </div>

      {/* Occasion */}
      <div className="mt-6">
        <FieldLabel>What&apos;s the occasion?</FieldLabel>
        <div role="radiogroup" aria-label="Occasion" className="flex flex-wrap gap-2.5">
          {OCCASION_TYPES.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              icon={occasionIcon(o.value, 16)}
              selected={form.occasion_name === o.value}
              onSelect={() => setField("occasion_name", o.value)}
            />
          ))}
        </div>
        <FieldError id="occ-occasion_name">{errors.occasion_name}</FieldError>
      </div>

      {/* Title + Date */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="occ-occasion_title">Give it a title</FieldLabel>
          <input
            id="occ-occasion_title"
            type="text"
            value={form.occasion_title}
            maxLength={TITLE_MAX}
            placeholder="e.g. Mum's Birthday"
            onChange={(e) => setField("occasion_title", e.target.value)}
            className={`h-12 w-full rounded-xl border bg-white px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-[#5A413F] ${
              errors.occasion_title ? "border-red-300" : "border-[#e8dede]"
            }`}
          />
          <FieldError>{errors.occasion_title}</FieldError>
        </div>
        <div>
          <FieldLabel htmlFor="occ-event_date">When is it?</FieldLabel>
          <input
            id="occ-event_date"
            type="date"
            value={form.event_date}
            onChange={(e) => setField("event_date", e.target.value)}
            className={`h-12 w-full rounded-xl border bg-white px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-[#5A413F] ${
              errors.event_date ? "border-red-300" : "border-[#e8dede]"
            }`}
          />
          <FieldError>{errors.event_date}</FieldError>
        </div>
      </div>

      {errors._form && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} className="shrink-0" />
          {errors._form}
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={adding}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#5A413F] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#5A413F]/20 transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {adding ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Adding…
          </>
        ) : (
          <>
            <Plus size={16} />
            Add Occasion
          </>
        )}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CARDS GRID
───────────────────────────────────────────────────────── */
export function OccasionCards({ occasions, onDelete, deletingId, emptyHint }) {
  if (!occasions?.length) {
    return emptyHint ? (
      <p className="rounded-2xl border border-dashed border-[#e8dede] bg-[#fdf9f9] px-5 py-8 text-center text-sm text-zinc-400">
        {emptyHint}
      </p>
    ) : null;
  }

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      {occasions.map((o) => (
        <div
          key={o.occasion_id}
          className="group relative flex items-center gap-3.5 rounded-2xl border border-[#efe6e6] bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f4f0f0] text-[#5A413F]">
            {occasionIcon(o.occasion_name, 20)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-semibold text-zinc-900" title={o.occasion_title}>
              {o.occasion_title}
            </h4>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-zinc-500">
              <span className="font-medium text-[#5A413F]">{occasionLabel(o.occasion_name)}</span>
              <span className="text-zinc-300">•</span>
              <span>{relationshipLabel(o.relationship_name)}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-600">
              <CalendarDays size={12} className="text-zinc-400" />
              {formatEventDate(o.event_date)}
            </div>
          </div>
          {DELETE_ENABLED && o.deletable !== false && (
            <button
              type="button"
              onClick={() => onDelete(o)}
              disabled={deletingId === o.occasion_id}
              aria-label={`Delete ${o.occasion_title}`}
              className="shrink-0 rounded-lg p-2 text-zinc-300 transition-all hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed"
            >
              {deletingId === o.occasion_id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-2 text-xs font-medium text-red-500">{children}</p>;
}
