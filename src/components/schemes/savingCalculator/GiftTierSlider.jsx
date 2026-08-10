"use client";

import { Gift } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const formatINR = (value) => new Intl.NumberFormat("en-IN").format(value);

/**
 * Premium slider with the gift tiers lifted off the track.
 *
 * The gift markers used to sit *on* the track at the same z-index as the range
 * handle, so at ₹3,000 / ₹5,000 the two painted on top of each other and the
 * marker swallowed the drag gesture. Markers now live on their own rail above
 * the track, the track itself only carries hairline tier ticks, and the handle
 * is the only thing on the line.
 *
 * The tier list comes from the admin API, so nothing here assumes two tiers or
 * assumes they are far enough apart to label in place — the readable copy lives
 * in the ladder below, which reflows instead of colliding.
 */
export default function GiftTierSlider({
  min,
  max,
  step,
  amount,
  onChange,
  intervals = [],
  compact = false,
}) {
  const activeIndex = intervals.findIndex(
    (inv) => amount >= inv.min && amount <= inv.max
  );

  /**
   * A native range input insets its thumb by half the thumb width at both ends,
   * so the handle centre travels `width - thumb`, not `width`. Positioning a
   * marker at a plain `left: n%` therefore drifts away from the handle — by
   * half a thumb at each end, and most visibly in the middle of the track.
   * `--thumb` mirrors the handle size in ui/slider.jsx at the same breakpoint.
   */
  const markerStyle = (value) => ({
    left: `calc(var(--thumb) / 2 + ${(value - min) / (max - min)} * (100% - var(--thumb)))`,
  });

  return (
    <div className="w-full font-figtree [--thumb:24px] sm:[--thumb:20px]">
      {/* Reward rail — sits above the track, never on it */}
      {intervals.length > 0 && (
        // mb keeps clearance from the handle even when the active marker
        // scales up — the rail and the track must never share pixels.
        <div className={`relative w-full mb-2 ${compact ? "h-6" : "h-7"}`}>
          {intervals.map((inv, idx) => {
            const isActive = idx === activeIndex;
            const isReached = amount >= inv.min;

            return (
              <button
                key={`marker-${inv.min}-${idx}`}
                type="button"
                onClick={() => onChange(inv.min)}
                title={`${inv.label} · ₹${formatINR(inv.min)}+`}
                aria-label={`Set monthly premium to ₹${formatINR(inv.min)} — ${inv.label}`}
                className={`absolute bottom-0 -translate-x-1/2 flex items-center justify-center rounded-full border transition-colors duration-300 cursor-pointer
                  ${compact ? "w-5 h-5" : "w-6 h-6"}
                  ${
                    isActive
                      ? "bg-success border-success text-white shadow-sm"
                      : isReached
                        ? "bg-success/15 border-success/40 text-success"
                        : "bg-white border-gray-300 text-gray-400"
                  }`}
                style={markerStyle(inv.min)}
              >
                <Gift size={compact ? 11 : 13} strokeWidth={2} />
                {/* Stem down to the tick, so each marker visibly points at its
                    own spot on the track instead of floating above it. */}
                <span
                  aria-hidden="true"
                  className={`absolute left-1/2 top-full h-2 w-px -translate-x-1/2 ${
                    isReached ? "bg-success/40" : "bg-gray-300"
                  }`}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Track */}
      <div className={`relative flex items-center w-full ${compact ? "h-6" : "h-7"}`}>
        {intervals.map((inv, idx) => (
          <span
            key={`tick-${inv.min}-${idx}`}
            aria-hidden="true"
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-px rounded-full pointer-events-none z-0
              ${compact ? "h-3" : "h-3.5"}
              ${amount >= inv.min ? "bg-white/80" : "bg-gray-500/60"}`}
            style={markerStyle(inv.min)}
          />
        ))}

        <Slider
          min={min}
          max={max}
          step={step}
          value={[amount]}
          onValueChange={([val]) => onChange(val)}
        />
      </div>

      {/* Scale */}
      <div
        className={`flex justify-between text-gray-400 font-semibold uppercase tracking-wider
          ${compact ? "text-[10px] mt-1" : "text-[11px] mt-1.5"}`}
      >
        <span>Min ₹{formatINR(min)}</span>
        <span>Max ₹{formatINR(max)}</span>
      </div>

      {/* Reward ladder — carries the copy the cramped pills could never fit */}
      {intervals.length > 0 && (
        <div className={`grid grid-cols-2 gap-2 ${compact ? "mt-4" : "mt-6"}`}>
          {intervals.map((inv, idx) => {
            const isActive = idx === activeIndex;
            const shortfall = inv.min - amount;
            const hint = isActive
              ? "Included in your plan"
              : shortfall > 0
                ? `Add ₹${formatINR(shortfall)} to unlock`
                : `Applies up to ₹${formatINR(inv.max)}`;

            return (
              <button
                key={`tier-${inv.min}-${idx}`}
                type="button"
                onClick={() => onChange(inv.min)}
                aria-pressed={isActive}
                className={`flex flex-col items-start gap-1 rounded-card border p-3 text-left transition-all duration-300 cursor-pointer
                  ${
                    isActive
                      ? "border-success/40 bg-success/10 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
              >
                <span
                  className={`flex items-center gap-1.5 font-semibold leading-tight
                    ${compact ? "text-[11px]" : "text-[13px]"}
                    ${isActive ? "text-success" : "text-gray-700"}`}
                >
                  <Gift size={compact ? 12 : 14} strokeWidth={2} className="shrink-0" />
                  {inv.label}
                </span>
                <span
                  className={`leading-tight ${compact ? "text-[10px]" : "text-[11px]"}
                    ${isActive ? "text-success/80" : "text-gray-500"}`}
                >
                  {hint}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
