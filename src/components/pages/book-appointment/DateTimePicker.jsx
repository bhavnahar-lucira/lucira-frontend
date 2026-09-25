"use client";

// "Select Date" + "Select Time Slot" — the same strip and grid in every
// journey, so a shopper who has booked a store visit recognises the video-call
// and try-at-home forms on sight.
//
// The date strip is today plus the next six days. The slot grid is the fixed
// 11 AM → 9 PM hourly window (stores open 10:30, close 10, so the flow doc asks
// for a 30-min opening and 1-hour closing buffer); slots that have already
// passed today are rendered disabled rather than hidden, so the grid does not
// reflow under the shopper as the afternoon wears on.
//
// The selection lives in `useSlotPicker` in the card or drawer that owns the
// form, because the OTP step (which renders after this picker has gone) still
// needs the slot when the webhook fires.

import React from "react";
import { CalendarDays, Clock3 } from "lucide-react";
import {
  upcomingDays,
  timeSlots,
  isSlotAvailable,
  firstBookableDay,
  firstAvailableSlot,
  slotSelection,
} from "@/lib/bookAppointment";

export function SectionLabel({ icon: Icon, children }) {
  return (
    <p className="flex items-center gap-1.5 font-figtree font-bold text-sm text-black">
      <Icon size={14} className="text-primary" />
      {children}
    </p>
  );
}

/**
 * Owns the day/slot choice for one form.
 *
 * Today is pre-selected, unless every slot today has already gone — then the
 * first day that still has one is, so the shopper never opens onto a dead grid.
 * The earliest open slot on that day is pre-selected too, as it is whenever the
 * day changes: most shoppers take the first slot anyway, and a form that opens
 * already bookable is one fewer tap between them and Confirm.
 * `now` is captured once per `reset()` so the disabled set cannot shift
 * mid-form. Callers `reset()` whenever the form (re)opens, optionally passing
 * the `{ dayKey, slotHour }` from an earlier submit so a shopper stepping back
 * from the OTP finds their slot still chosen — unless sitting on the OTP step
 * has cost them it, in which case they land on the first one still bookable.
 */
export function useSlotPicker() {
  const slots = React.useMemo(() => timeSlots(), []);
  const [now, setNow] = React.useState(() => new Date());
  const [days, setDays] = React.useState(() => upcomingDays(7, new Date()));
  const [dayKey, setDayKey] = React.useState(() => firstBookableDay(days, now)?.key || days[0].key);
  const [slotHour, setSlotHour] = React.useState(
    () => firstAvailableSlot(days.find((d) => d.key === dayKey), now)?.hour ?? null
  );

  const reset = React.useCallback((preset) => {
    const fresh = new Date();
    const nextDays = upcomingDays(7, fresh);
    setNow(fresh);
    setDays(nextDays);

    const presetDay = preset?.dayKey ? nextDays.find((d) => d.key === preset.dayKey) : null;
    const presetSlot = timeSlots().find((s) => s.hour === preset?.slotHour) || null;
    const presetStillOpen =
      !!presetDay && !!presetSlot && isSlotAvailable(presetDay, presetSlot, fresh);

    const nextDay = presetStillOpen ? presetDay : firstBookableDay(nextDays, fresh) || nextDays[0];
    setDayKey(nextDay.key);
    setSlotHour(presetStillOpen ? presetSlot.hour : firstAvailableSlot(nextDay, fresh)?.hour ?? null);
  }, []);

  const day = days.find((d) => d.key === dayKey) || days[0];
  const slot = slots.find((s) => s.hour === slotHour) || null;

  return {
    days,
    slots,
    now,
    dayKey,
    setDayKey,
    slotHour,
    setSlotHour,
    day,
    slot,
    reset,
    /** `{ appointmentDate, appointmentTime, appointmentDateLabel }`, or null until a slot is picked. */
    selection: slotSelection(day, slot),
    /** The raw choice, in the shape `reset()` takes back. */
    preset: { dayKey, slotHour },
  };
}

export default function DateTimePicker({ picker, error, onChange }) {
  const { days, slots, now, dayKey, setDayKey, slotHour, setSlotHour, day } = picker;

  return (
    <div className="flex flex-col gap-5">
      {/* Date */}
      <div className="flex flex-col gap-2.5">
        <SectionLabel icon={CalendarDays}>Select Date</SectionLabel>
        <div className="grid grid-cols-4 gap-2">
          {days.map((d) => {
            const isOn = d.key === dayKey;
            const isDead = !slots.some((s) => isSlotAvailable(d, s, now));
            return (
              <button
                key={d.key}
                type="button"
                disabled={isDead}
                onClick={() => {
                  setDayKey(d.key);
                  setSlotHour(firstAvailableSlot(d, now)?.hour ?? null);
                  onChange?.();
                }}
                className={`h-14 rounded-sm border flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isDead
                    ? "border-gray-100 bg-gray-50 text-zinc-300 cursor-not-allowed"
                    : isOn
                      ? "border-primary bg-primary/5 text-black cursor-pointer"
                      : "border-gray-200 text-black hover:border-gray-300 cursor-pointer"
                }`}
              >
                <span className="font-figtree font-bold text-sm leading-none">{d.dayNum}</span>
                <span className="font-figtree text-[10px] leading-none text-zinc-500">{d.dayName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slot */}
      <div className="flex flex-col gap-2.5">
        <SectionLabel icon={Clock3}>Select Time Slot</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {slots.map((s) => {
            const available = isSlotAvailable(day, s, now);
            const isOn = s.hour === slotHour;
            return (
              <button
                key={s.hour}
                type="button"
                disabled={!available}
                onClick={() => {
                  setSlotHour(s.hour);
                  onChange?.();
                }}
                className={`h-10 rounded-sm border font-figtree text-xs transition-colors ${
                  !available
                    ? "border-gray-100 bg-gray-50 text-zinc-300 cursor-not-allowed"
                    : isOn
                      ? "border-primary bg-primary/5 text-black font-bold cursor-pointer"
                      : "border-gray-200 text-black hover:border-gray-300 cursor-pointer"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        {error && <p className="text-[11px] text-red-500 font-figtree">{error}</p>}
      </div>
    </div>
  );
}
