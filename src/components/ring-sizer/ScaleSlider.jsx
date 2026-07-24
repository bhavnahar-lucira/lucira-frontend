"use client";

import { Minus, Plus } from "lucide-react";
import { Slider } from "@/components/ui/slider";

/**
 * The "− ●———— +" control used on all three measuring screens.
 *
 * Everything is driven in INTEGER units so the slider never accumulates float
 * drift: callers scale their real unit up (mm x 10, pxPerMm x 100) and scale
 * back down when reading. The +/- buttons exist because a bare touch slider
 * cannot reliably hit the last fraction of a millimetre, and that last
 * fraction is roughly half a ring size.
 */
export function ScaleSlider({ value, min, max, step = 1, onChange, label }) {
  const clamp = (v) => Math.min(max, Math.max(min, v));

  return (
    <div className="w-full">
      {label ? (
        <p className="mb-3 text-center font-figtree text-sm text-[#3F2E2C]">{label}</p>
      ) : null}

      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Decrease"
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#3F2E2C] transition disabled:opacity-30 active:bg-black/5"
        >
          <Minus size={20} strokeWidth={1.5} />
        </button>

        <Slider
          className="flex-1"
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={([v]) => onChange(clamp(v))}
        />

        <button
          type="button"
          aria-label="Increase"
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#3F2E2C] transition disabled:opacity-30 active:bg-black/5"
        >
          <Plus size={20} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
