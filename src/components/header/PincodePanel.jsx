"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Shared body of the pincode module. Rendered inside the desktop popover
// (PincodePicker) and the mobile bottom sheet (PincodeStrip) so the two can
// never drift apart.
//
// Only mounted while the panel is open — nothing here costs anything on first
// paint, and `/api/stores` is not touched until a shopper actually engages.
//
// COLOUR: the "there is a store near you" signal is the same green the PDP
// already uses for store status (#006D4E on #D1EBE3, the "Open Now" badge in
// FindLuciraStore.jsx). Rose/brown stays for chrome and actions, so the panel
// reads in two colours instead of one flat tone — and nothing is invented.
//
// COPY: the pincode is never prefixed with "Delivering to". Paired with a
// "Delivery only" label that phrase read as "Delivery only / Delivering to
// 401504", which says the same thing twice. The pincode is now quiet context
// and the STORE is the headline, because the store is the useful part.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronRight, LocateFixed, Loader2, MapPin, Navigation,
  CalendarCheck, Truck, Sparkles, AlertCircle, ArrowRight,
} from "lucide-react";
import { resolveNearestStores, formatKm, NO_PINCODE } from "@/lib/nearestStore";
import { NEAREST_STORE_MAX_KM } from "@/data/storeGeo";
import { useUserPincode } from "@/hooks/useUserPincode";
import { pushPromoClick, pushToDataLayer } from "@/lib/gtm";

// Reinforcement, shown under the input. "Nearest store" is deliberately absent —
// it is the panel's own title, and repeating it wastes one of three slots.
const BENEFITS = [
  { Icon: Sparkles, label: "Try on today" },
  { Icon: CalendarCheck, label: "Book a slot" },
  { Icon: Truck, label: "Delivery check" },
];

/**
 * Owns the resolve lifecycle for one panel instance.
 * Kept in a hook so both wrappers share identical behaviour.
 */
export function usePincodeResolution({ locationId = "Header" } = {}) {
  const { pincode, commit, clear } = useUserPincode();
  const [draft, setDraft] = useState("");
  // `attempt` is the outcome of what was last typed — it can be an error.
  // `resolved` is the last SUCCESSFUL resolution and is what the pill and the
  // store cards read, so a mistyped pincode never erases the store the shopper
  // already had.
  const [attempt, setAttempt] = useState(NO_PINCODE);
  const [resolved, setResolved] = useState(NO_PINCODE);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [editing, setEditing] = useState(false);
  const lastResolved = useRef("");

  /** Resolve, and (by default) persist the pincode across the site. */
  const resolve = useCallback(async (value, { persist = true } = {}) => {
    const pin = String(value || "").replace(/\D/g, "").slice(0, 6);
    if (pin.length !== 6) return null;

    setBusy(true);
    try {
      const res = await resolveNearestStores(pin);
      setAttempt(res);
      lastResolved.current = pin;

      if (res.status === "invalid") return res;

      setResolved(res);
      if (persist) {
        commit(pin);
        pushPromoClick({
          creative_name: "Header pincode applied",
          location_id: locationId,
        });
        pushToDataLayer({
          event: "pincode_applied",
          pincode: pin,
          nearest_store: res.nearest?.shortName || "",
          nearest_store_km: res.nearest?.distance != null ? Number(res.nearest.distance.toFixed(1)) : null,
          in_range: res.status === "resolved",
        });
      }
      setEditing(false);
      return res;
    } catch {
      setAttempt({ ...NO_PINCODE, pincode: pin, status: "invalid" });
      return null;
    } finally {
      setBusy(false);
    }
  }, [commit, locationId]);

  // Resolve a previously saved pincode once, so the pill can show the store name.
  // Runs only when the pincode actually changes, and never for one we've already
  // resolved — so this costs a single request per page load at most.
  useEffect(() => {
    if (pincode.length !== 6 || lastResolved.current === pincode) return;
    resolve(pincode, { persist: false });
  }, [pincode, resolve]);

  const locateMe = useCallback(async () => {
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
            setDraft(detected);
            pushPromoClick({ creative_name: "Locate Me Clicked", location_id: locationId });
            await resolve(detected);
          }
        } catch {
          /* Silent: a failed reverse-geocode just leaves the field for manual entry. */
        } finally {
          setLocating(false);
        }
      },
      // A permission the shopper declined is not an error worth reporting.
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [resolve, locationId]);

  const reset = useCallback(() => {
    setDraft("");
    setEditing(true);
    setAttempt(NO_PINCODE);
    setResolved(NO_PINCODE);
    lastResolved.current = "";
    clear();
  }, [clear]);

  // Panel view state: the result block is hidden while the shopper is retyping.
  const showResult = !editing && resolved.pincode.length === 6;

  // Pill view state: driven by the COMMITTED pincode (the cookie) and the last
  // successful resolution — never by what is being typed. Otherwise hitting
  // "Change", or mistyping a pincode, would blank the pill while a perfectly
  // good pincode is still saved and still applied everywhere else on the site.
  const committed = pincode.length === 6 ? pincode : "";
  const matches = committed && resolved.pincode === committed;
  const committedStore = matches ? resolved.nearest : null;
  const committedInRange = matches ? resolved.status === "resolved" : null;

  return {
    pincode, draft, setDraft, busy, locating,
    editing, setEditing, resolve, locateMe, reset, showResult,
    attempt, resolved, committed, committedStore, committedInRange,
  };
}

/* ------------------------------------------------------------------ view ---- */

/**
 * A radar motif — concentric rings around a pin. It states the feature's whole
 * idea (what is near me?) in one glance, which a row of flat icons did not.
 */
function StoreRadar() {
  return (
    <div className="relative mx-auto mb-3.5 grid size-[58px] place-items-center">
      {/* A rotated square reads as a brilliant-cut stone rather than a generic
          radar target — location, said in the brand's own vocabulary. */}
      <span className="absolute inset-0 rotate-45 rounded-[17px] border border-[#F6E8E3] motion-safe:animate-pulse" />
      <span className="absolute inset-[7px] rotate-45 rounded-[13px] border border-[#EFD8D0] bg-gradient-to-br from-[#FFF4F0] to-[#FADFD5]" />
      <MapPin size={20} strokeWidth={2.2} className="relative text-[#8C5A4C]" />
      <Sparkles size={9} strokeWidth={2.4} className="absolute right-0 top-1 text-[#C99C8B]" />
      <Sparkles size={7} strokeWidth={2.4} className="absolute bottom-1 left-0.5 text-[#DFBEB1]" />
    </div>
  );
}

function StoreCard({ store, rank, onNavigate }) {
  const km = formatKm(store.distance);
  const nearest = rank === 0;
  return (
    <Link
      href={`/collections/${store.handle}`}
      prefetch={false}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
        nearest
          ? "border-[#DCEAE2] bg-[#F8FBF9] hover:border-[#A3D9C9]"
          : "border-[#F0E8E6] bg-white hover:border-[#B77767]"
      }`}
    >
      <span
        className={`grid shrink-0 place-items-center rounded-lg leading-none ${
          nearest ? "bg-[#D1EBE3] text-[#006D4E]" : "bg-[#F4EDEB] text-[#8C7168]"
        } ${km ? "size-[42px]" : "px-2.5 py-2"}`}
      >
        {km ? (
          <span className="text-center">
            <b className="block font-figtree text-[13px] font-extrabold tabular-nums">
              {km.replace(" km", "")}
            </b>
            <i className="block font-figtree text-[7.5px] font-bold not-italic tracking-[0.1em]">KM</i>
          </span>
        ) : (
          <Truck size={18} strokeWidth={1.9} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`block font-figtree text-[8.5px] font-bold uppercase tracking-[0.1em] ${
            nearest ? "text-[#006D4E]" : "text-[#A08A85]"
          }`}
        >
          {nearest ? "Nearest store" : "Also near you"}
        </span>
        <b className="block truncate font-figtree text-[13.5px] font-bold text-[#241B19]">
          {store.shortName || store.name}
        </b>
        {store.addressShort && (
          <span className="block truncate font-figtree text-[10.5px] text-[#8C7168]">
            {store.addressShort}
          </span>
        )}
      </span>

      <ChevronRight
        size={15}
        className="shrink-0 text-[#B77767]"
      />
    </Link>
  );
}

/**
 * @param {object} props
 * @param {ReturnType<typeof usePincodeResolution>} props.ctl
 * @param {() => void} [props.onDone] called when the shopper follows a link out
 * @param {boolean} [props.compact] tighter type for the mobile sheet
 */
export default function PincodePanel({ ctl, onDone, compact = false }) {
  const {
    draft, setDraft, attempt, resolved, busy, locating,
    resolve, locateMe, reset, showResult, setEditing,
  } = ctl;

  const inputRef = useRef(null);
  const invalid = attempt.status === "invalid" && !!attempt.pincode;
  const outOfRange = showResult && resolved.status === "out_of_range";

  // Deliberately does NOT close the panel on success. Showing the nearest store
  // is the payoff for entering a pincode — closing here would hide the one thing
  // the shopper just asked for. The panel closes on outside click, Esc, or when
  // they follow a store link.
  const onSubmit = async (e) => {
    e.preventDefault();
    await resolve(draft);
  };

  const startEditing = () => {
    setEditing(true);
    setDraft("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div className="font-figtree">
      {showResult ? (
        /* ── resolved: pincode is quiet context, the store is the headline ── */
        <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-[#F4E4DE] bg-[#FFF7F4] px-3 py-2">
          <span className="flex min-w-0 items-center gap-2">
            <MapPin size={14} strokeWidth={2.2} className="shrink-0 text-[#B77767]" />
            <span className="min-w-0">
              <span className="block font-figtree text-[8.5px] font-bold uppercase tracking-[0.1em] text-[#A08A85]">
                Your pincode
              </span>
              <b className="block font-figtree text-[14px] font-bold tabular-nums tracking-[0.04em] text-[#241B19]">
                {resolved.pincode}
                {resolved.city ? (
                  <span className="font-medium text-[#8C7168]"> · {resolved.city}</span>
                ) : null}
              </b>
            </span>
          </span>
          <button
            type="button"
            onClick={startEditing}
            className="shrink-0 rounded-md px-2 py-1.5 font-figtree text-[10.5px] font-bold uppercase tracking-[0.09em] text-[#B77767] transition-colors hover:bg-[#FFEDE9]"
          >
            Change
          </button>
        </div>
      ) : (
        /* ── entry: hook, then act, then reassure ── */
        <>
          <StoreRadar />

          <h3
            className={`text-center font-abhaya font-extrabold leading-tight text-[#241B19] ${
              compact ? "text-[17px]" : "text-[20px]"
            }`}
          >
            Find your nearest store
          </h3>
          <p
            className={`mx-auto mt-1.5 max-w-[268px] text-center leading-relaxed text-[#6B5651] ${
              compact ? "text-[11.5px]" : "text-[12.5px]"
            }`}
          >
            See which Lucira store is closest to you, and what&apos;s ready to try
            on today.
          </p>
          <p className="mt-2 mb-4 text-center font-figtree text-[8.5px] font-bold uppercase tracking-[0.14em] text-[#B77767]">
            Mumbai · Pune · Delhi NCR
          </p>
        </>
      )}

      {/* input row — hidden once a result is showing, since the row above owns it */}
      {!showResult && (
        <>
          <form
            onSubmit={onSubmit}
            autoComplete="off"
            className={`flex items-center gap-2 rounded-xl border bg-white py-1 pl-3 pr-1.5 transition-all focus-within:border-[#B77767] focus-within:ring-[3px] focus-within:ring-[#B77767]/15 ${
              invalid ? "border-[#F83E50]" : "border-[#E4D8D4]"
            }`}
          >
            <MapPin size={16} strokeWidth={2} className="shrink-0 text-[#C9AFA8]" />
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit pincode"
              aria-label="Pincode"
              aria-invalid={invalid || undefined}
              className="min-w-0 flex-1 border-0 bg-transparent py-2 font-figtree text-[15px] font-semibold tabular-nums tracking-[0.06em] text-[#241B19] outline-none placeholder:text-[13px] placeholder:font-medium placeholder:tracking-normal placeholder:text-[#B3A09B]"
            />
            <button
              type="submit"
              disabled={draft.length !== 6 || busy}
              // Stays solid brown when disabled and just dims. Swapping to a flat
              // grey-pink fill made it read as broken rather than as "not yet".
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#5A413F] px-3.5 py-2.5 font-figtree text-[11px] font-bold uppercase tracking-[0.09em] text-white transition-all hover:bg-[#8C5A4C] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : null}
              Apply
              {!busy && <ArrowRight size={12} strokeWidth={2.6} />}
            </button>
          </form>

          {/* Labelled, not a bare icon — nobody taps a crosshair to find out what it does. */}
          <button
            type="button"
            onClick={locateMe}
            disabled={locating || busy}
            className="mx-auto mt-2.5 flex items-center gap-1.5 rounded-md px-2 py-1 font-figtree text-[11.5px] font-semibold text-[#B77767] transition-colors hover:bg-[#FFF7F4] hover:text-[#8C5A4C] disabled:opacity-60"
          >
            {locating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <LocateFixed size={14} strokeWidth={2.2} />
            )}
            {locating ? "Finding you…" : "Use my current location"}
          </button>
        </>
      )}

      {/* error */}
      {invalid && (
        <p className="mt-2.5 flex items-start gap-1.5 px-0.5 text-[11.5px] leading-snug text-[#F83E50]">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          <span>
            We don&apos;t recognise {attempt.pincode}. Check the six digits and try
            again.
          </span>
        </p>
      )}

      {/* results */}
      {showResult && (
        <div className="flex flex-col gap-1.5">
          {busy ? (
            <>
              <div className="h-[60px] animate-pulse rounded-xl bg-[#F3EBE9]" />
              <div className="h-[60px] animate-pulse rounded-xl bg-[#F3EBE9] opacity-55" />
            </>
          ) : outOfRange ? (
            <>
              <div className="flex items-start gap-2.5 rounded-xl border border-[#EFE0DA] bg-[#FFF7F4] px-3 py-2.5">
                <Truck size={17} strokeWidth={1.9} className="mt-0.5 shrink-0 text-[#8C5A4C]" />
                <span className="font-figtree text-[11.5px] leading-relaxed text-[#5A413F]">
                  <b className="block text-[12.5px] font-bold text-[#241B19]">
                    We deliver here
                  </b>
                  Our closest store is over {NEAREST_STORE_MAX_KM}&nbsp;km away, so
                  shop the full collection online.
                </span>
              </div>
              <Link
                href="/pages/store-locator"
                prefetch={false}
                onClick={onDone}
                className="flex items-center justify-between gap-2 rounded-xl border border-[#E4D8D4] bg-white px-3 py-2.5 font-figtree text-[12.5px] font-semibold text-[#5A413F] transition-colors hover:border-[#B77767]"
              >
                See all Lucira stores
                <ChevronRight size={15} className="text-[#B77767]" />
              </Link>
            </>
          ) : (
            <>
              {resolved.nearby.slice(0, 2).map((store, i) => (
                <StoreCard
                  key={store.shopifyId || store.handle}
                  store={store}
                  rank={i}
                  onNavigate={onDone}
                />
              ))}

              {resolved.nearest?.mapLink && (
                <a
                  href={resolved.nearest.mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onDone}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-[#5A413F] px-3 py-2.5 font-figtree text-[11px] font-bold uppercase tracking-[0.09em] text-white transition-colors hover:bg-[#8C5A4C]"
                >
                  <Navigation size={13} strokeWidth={2.2} />
                  Directions to {resolved.nearest.shortName}
                </a>
              )}

              {resolved.nearby.length > 2 && (
                <Link
                  href="/pages/store-locator"
                  prefetch={false}
                  onClick={onDone}
                  className="px-0.5 py-1 text-center font-figtree text-[11px] font-bold uppercase tracking-[0.06em] text-[#B77767] hover:underline"
                >
                  + {resolved.nearby.length - 2} more store
                  {resolved.nearby.length > 3 ? "s" : ""} near you
                </Link>
              )}
            </>
          )}
        </div>
      )}

      {/* reassurance strip — only while the shopper has not entered anything yet */}
      {!showResult && (
        <div className="mt-4 grid grid-cols-3 gap-1.5 border-t border-[#F4ECEA] pt-3">
          {BENEFITS.map(({ Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 text-center">
              <Icon size={15} strokeWidth={1.9} className="text-[#B77767]" />
              <span className="font-figtree text-[8.5px] font-bold uppercase leading-tight tracking-[0.05em] text-[#8C7168]">
                {label}
              </span>
            </div>
          ))}
        </div>
      )}

      {showResult && (
        <button
          type="button"
          onClick={reset}
          className="mt-2.5 w-full rounded-md py-1 text-center font-figtree text-[10px] font-semibold uppercase tracking-[0.08em] text-[#B09993] transition-colors hover:text-[#8C5A4C]"
        >
          Clear pincode
        </button>
      )}
    </div>
  );
}
