"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Shared building blocks for the three Book Appointment cards.
//
// Each card on /pages/book-an-appointment is its own small state machine that
// swaps its body in place — the flow doc draws every step (pincode, OTP,
// success) inside the card it belongs to, never as a full-page takeover. These
// are the bodies those machines swap between.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import { Loader2, MapPin, Check, ChevronDown, Pencil, ShieldCheck } from "lucide-react";
import LazyImage from "@/components/common/LazyImage";

/* ─── Card shell ──────────────────────────────────────────────────────────── */

export function CardShell({ title, desc, image, children, expanded }) {
  return (
    // No `overflow-hidden` here: the image below clips its own hover-scale, so
    // the only thing clipping at this level would cut off is the category
    // popover that opens inside the card. No z-index either — that would make
    // each card its own stacking context and drop an open popover behind the
    // card to its right.
    <div
      className={`flex flex-col h-full bg-white rounded-sm p-5 md:p-4 lg:p-5 shadow-sm transition-shadow ${
        expanded ? "shadow-md ring-1 ring-primary/15" : ""
      }`}
    >
      <div className="relative aspect-395/295 overflow-hidden rounded-sm mb-3 group">
        <LazyImage
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col items-start gap-2 grow">
        <h3 className="text-xl font-bold text-black font-figtree">{title}</h3>
        <p className="text-black text-sm md:text-base leading-[1.4]">{desc}</p>
        <div className="mt-auto w-full pt-2">{children}</div>
      </div>
    </div>
  );
}

/* ─── Buttons ─────────────────────────────────────────────────────────────── */

export function PrimaryButton({ children, loading, className = "", ...props }) {
  return (
    <button
      type="button"
      {...props}
      disabled={loading || props.disabled}
      className={`h-11 w-full bg-primary text-white font-figtree font-bold text-sm uppercase tracking-wide rounded-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export function OutlineButton({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`h-11 w-full border border-primary text-primary font-figtree font-bold text-sm uppercase tracking-wide rounded-sm flex items-center justify-center gap-2 transition-colors hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
}

/* ─── Fields ──────────────────────────────────────────────────────────────── */

export function TextField({ label, error, className = "", ...props }) {
  return (
    <div className="w-full">
      <input
        {...props}
        aria-label={label}
        className={`h-11 w-full border rounded-sm px-3 text-sm font-figtree text-black placeholder:text-zinc-400 outline-none focus:border-primary transition-colors ${
          error ? "border-red-400" : "border-gray-200"
        } ${className}`}
      />
      {error && <p className="text-[11px] text-red-500 font-figtree mt-1">{error}</p>}
    </div>
  );
}

export function PhoneField({ value, onChange, error, placeholder = "Enter Mobile Number Here *" }) {
  return (
    <div className="w-full">
      <div
        className={`h-11 w-full border rounded-sm flex items-center overflow-hidden focus-within:border-primary transition-colors ${
          error ? "border-red-400" : "border-gray-200"
        }`}
      >
        <span className="px-3 text-sm font-figtree text-black border-r border-gray-200 h-full flex items-center shrink-0">
          +91
        </span>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          aria-label="Mobile number"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder={placeholder}
          className="flex-1 h-full px-3 text-sm font-figtree text-black placeholder:text-zinc-400 outline-none min-w-0"
        />
      </div>
      {error && <p className="text-[11px] text-red-500 font-figtree mt-1">{error}</p>}
    </div>
  );
}

export function SelectField({ value, onChange, options, placeholder }) {
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
        className={`h-11 w-full border border-gray-200 rounded-sm px-3 pr-9 text-sm font-figtree outline-none focus:border-primary transition-colors appearance-none bg-white cursor-pointer ${
          value ? "text-black" : "text-zinc-400"
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o} className="text-black">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
    </div>
  );
}

/** Multi-select for "Product Category(s)" — a popover of checkboxes. */
const CATEGORY_POPOVER_MAX_H = 224; // matches max-h-56

export function CategoryPicker({ selected, onChange, options, placeholder = "Product Category(s)" }) {
  const [open, setOpen] = React.useState(false);
  const [dropUp, setDropUp] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const toggle = (cat) => {
    onChange(selected.includes(cat) ? selected.filter((c) => c !== cat) : [...selected, cat]);
  };

  // Decide the direction as the popover opens, in the handler rather than an
  // effect. Inside the booking drawer this field sits just above the footer, so
  // opening downward would put the list under the fold of a scroll container.
  const toggleOpen = () => {
    if (!open && ref.current) {
      const { bottom } = ref.current.getBoundingClientRect();
      setDropUp(window.innerHeight - bottom < CATEGORY_POPOVER_MAX_H + 16);
    }
    setOpen((v) => !v);
  };

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={toggleOpen}
        className="h-11 w-full border border-gray-200 rounded-sm px-3 pr-9 text-sm font-figtree text-left outline-none focus:border-primary transition-colors bg-white cursor-pointer flex items-center"
      >
        <span className={`truncate ${selected.length ? "text-black" : "text-zinc-400"}`}>
          {selected.length ? selected.join(", ") : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          className={`absolute z-50 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-sm shadow-lg py-1 ${
            dropUp ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {options.map((cat) => {
            const isOn = selected.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggle(cat)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-figtree text-black hover:bg-gray-50 text-left cursor-pointer"
              >
                <span
                  className={`w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 ${
                    isOn ? "bg-primary border-primary" : "border-gray-300"
                  }`}
                >
                  {isOn && <Check size={11} className="text-white" strokeWidth={3} />}
                </span>
                {cat}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Pincode ─────────────────────────────────────────────────────────────── */

/**
 * "Enter Pincode to Find Nearest Store" + Locate Me.
 *
 * Locate Me reverse-geocodes through Nominatim, the same geocoder the header
 * pincode panel uses, so a shopper who has already granted location once is not
 * asked to type anything.
 */
export function PincodeStep({ value, onChange, onSubmit, loading, error, cta = "Continue" }) {
  const [locating, setLocating] = React.useState(false);

  const locate = () => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
          const detected = String(data?.address?.postcode || "").replace(/\D/g, "").slice(0, 6);
          if (detected.length === 6) {
            onChange(detected);
            onSubmit(detected);
          }
        } catch {
          /* A failed reverse-geocode just leaves the field for manual entry. */
        } finally {
          setLocating(false);
        }
      },
      // A permission the shopper declined is not an error worth reporting.
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative">
        <input
          type="tel"
          inputMode="numeric"
          maxLength={6}
          value={value}
          aria-label="Pincode"
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.length === 6) onSubmit(value);
          }}
          placeholder="Enter Pincode to Find Nearest Store"
          className={`h-11 w-full border rounded-sm pl-3 pr-24 text-sm font-figtree text-black placeholder:text-zinc-400 outline-none focus:border-primary transition-colors ${
            error ? "border-red-400" : "border-gray-200"
          }`}
        />
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-2.5 flex items-center gap-1 text-[11px] font-figtree font-bold text-primary uppercase tracking-wide rounded-sm hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50"
        >
          {locating ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
          Locate Me
        </button>
      </div>
      {error && <p className="text-[11px] text-red-500 font-figtree -mt-1">{error}</p>}
      <PrimaryButton onClick={() => onSubmit(value)} loading={loading} disabled={value.length !== 6}>
        {cta}
      </PrimaryButton>
    </div>
  );
}

/** The "400064 · Change Pincode" row shown above every post-pincode state. */
export function PincodeChip({ pincode, onChange }) {
  return (
    <div className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-100 rounded-sm px-3 h-10">
      <span className="flex items-center gap-1.5 text-sm font-figtree font-semibold text-black">
        <MapPin size={13} className="text-primary" />
        {pincode}
      </span>
      <button
        type="button"
        onClick={onChange}
        className="flex items-center gap-1 text-[11px] font-figtree font-bold text-primary uppercase tracking-wide hover:underline cursor-pointer"
      >
        <Pencil size={11} />
        Change Pincode
      </button>
    </div>
  );
}

/* ─── OTP ─────────────────────────────────────────────────────────────────── */

const OTP_LENGTH = 4;

/**
 * "Almost Done" — the step that keeps unverified leads out of the store queue.
 * The parent owns verify/resend; this owns the digits and the countdown.
 */
export function OtpStep({ idPrefix, phone, onVerify, onResend, verifying, error }) {
  const [digits, setDigits] = React.useState(Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = React.useState(60);

  React.useEffect(() => {
    document.getElementById(`${idPrefix}-otp-0`)?.focus();
  }, [idPrefix]);

  React.useEffect(() => {
    if (timer <= 0) return undefined;
    const t = setInterval(() => setTimer((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [timer]);

  const focusAt = (i) => document.getElementById(`${idPrefix}-otp-${i}`)?.focus();

  const setDigit = (i, raw) => {
    const clean = raw.replace(/\D/g, "");
    const next = [...digits];
    if (!clean) {
      next[i] = "";
      setDigits(next);
      return;
    }
    next[i] = clean[clean.length - 1];
    setDigits(next);
    if (i < OTP_LENGTH - 1) focusAt(i + 1);
  };

  const onKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      const next = [...digits];
      if (!digits[i] && i > 0) {
        next[i - 1] = "";
        setDigits(next);
        focusAt(i - 1);
      } else {
        next[i] = "";
        setDigits(next);
      }
    } else if (e.key === "Enter" && digits.every(Boolean)) {
      onVerify(digits.join(""));
    }
  };

  const onPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i += 1) next[i] = pasted[i];
    setDigits(next);
    focusAt(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  const resend = async () => {
    await onResend();
    setDigits(Array(OTP_LENGTH).fill(""));
    setTimer(60);
    focusAt(0);
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-figtree font-bold text-base text-black">Almost Done</p>
        <p className="text-xs text-zinc-500 font-figtree mt-0.5">OTP has been sent to {phone}</p>
      </div>

      <div className="flex items-center gap-2.5" onPaste={onPaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            id={`${idPrefix}-otp-${i}`}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={d}
            aria-label={`OTP digit ${i + 1}`}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            className={`h-12 flex-1 min-w-0 border rounded-sm text-center text-lg font-figtree font-bold text-black outline-none focus:border-primary transition-colors ${
              error ? "border-red-400" : "border-gray-200"
            }`}
          />
        ))}
      </div>

      {error && <p className="text-[11px] text-red-500 font-figtree -mt-1">{error}</p>}

      <PrimaryButton
        onClick={() => onVerify(digits.join(""))}
        loading={verifying}
        disabled={digits.some((d) => !d)}
      >
        Verify &amp; Confirm
      </PrimaryButton>

      <button
        type="button"
        onClick={resend}
        disabled={timer > 0}
        className="text-[11px] font-figtree text-zinc-500 hover:text-primary disabled:hover:text-zinc-500 disabled:cursor-not-allowed cursor-pointer"
      >
        {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
      </button>
    </div>
  );
}

/* ─── Success ─────────────────────────────────────────────────────────────── */

export function SuccessStep({ message, ctaLabel, ctaHref, onCta }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3 bg-[#F1F9F1] border border-[#DBEFDB] rounded-sm p-3">
        <span className="w-8 h-8 rounded-full bg-[#E3F5E0] flex items-center justify-center shrink-0">
          <Check size={16} className="text-[#2DB36F]" strokeWidth={3} />
        </span>
        <div className="min-w-0">
          <p className="font-figtree font-bold text-sm text-black leading-tight">Appointment Booked</p>
          <p className="text-xs text-zinc-500 font-figtree mt-1 leading-relaxed">{message}</p>
        </div>
      </div>
      <a
        href={ctaHref}
        onClick={onCta}
        className="h-11 w-full bg-primary text-white font-figtree font-bold text-sm uppercase tracking-wide rounded-sm flex items-center justify-center transition-opacity hover:opacity-90"
      >
        {ctaLabel}
      </a>
    </div>
  );
}

/* ─── Misc ────────────────────────────────────────────────────────────────── */

export function SecureNote() {
  return (
    <p className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-figtree">
      <ShieldCheck size={12} className="text-[#2DB36F]" />
      Your Data is Secured with Us.
    </p>
  );
}
