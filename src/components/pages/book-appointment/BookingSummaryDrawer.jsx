"use client";

// "Booking Summary" — the store visit drawer: which store, which day, which
// slot, and who is coming.
//
// The date strip is today plus the next six days. The slot grid is the fixed
// 11 AM → 9 PM hourly window (stores open 10:30, close 10, so the flow doc asks
// for a 30-min opening and 1-hour closing buffer); slots that have already
// passed today are rendered disabled rather than hidden, so the grid does not
// reflow under the shopper as the afternoon wears on.

import React from "react";
import { Store as StoreIcon, CalendarDays, Clock3, UserRound } from "lucide-react";
import SideDrawer from "./SideDrawer";
import {
  PrimaryButton,
  TextField,
  PhoneField,
  SelectField,
  CategoryPicker,
  SecureNote,
  VerifiedNote,
} from "./parts";
import {
  storeLabel,
  storeAddress,
  formatDistance,
  upcomingDays,
  timeSlots,
  isSlotAvailable,
  firstBookableDay,
  PRODUCT_CATEGORIES,
  VISIT_PURPOSES,
} from "@/lib/bookAppointment";

function SectionLabel({ icon: Icon, children }) {
  return (
    <p className="flex items-center gap-1.5 font-figtree font-bold text-sm text-black">
      <Icon size={14} className="text-primary" />
      {children}
    </p>
  );
}

export default function BookingSummaryDrawer({
  open,
  onClose,
  store,
  account,
  isVerifiedNumber,
  onChangeStore,
  onSubmit,
  submitting,
  error,
}) {
  const days = React.useMemo(() => upcomingDays(7), []);
  const slots = React.useMemo(() => timeSlots(), []);

  // `now` is captured once per open so the disabled set cannot shift mid-form.
  const [now, setNow] = React.useState(() => new Date());
  const [dayKey, setDayKey] = React.useState("");
  const [slotHour, setSlotHour] = React.useState(null);

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [purpose, setPurpose] = React.useState("");
  const [categories, setCategories] = React.useState([]);
  const [errors, setErrors] = React.useState({});

  // Today is pre-selected, unless every slot today has already gone — then the
  // first day that still has one is, so the shopper never opens onto a dead grid.
  // A signed-in shopper also gets their own details back rather than retyping
  // what the account already holds. Derived during render rather than in an
  // effect (see VideoCallCard).
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      const fresh = new Date();
      setNow(fresh);
      setDayKey(firstBookableDay(days, fresh)?.key || days[0].key);
      setSlotHour(null);
      setErrors({});
      setName(account?.name || "");
      setPhone(account?.phone || "");
      setEmail(account?.email || "");
    }
  }

  const skipsOtp = !!isVerifiedNumber?.(phone);

  const selectedDay = days.find((d) => d.key === dayKey) || days[0];

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = "Please enter your name.";
    if (phone.length !== 10) next.phone = "Enter a valid 10-digit mobile number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (slotHour === null) next.slot = "Please pick a time slot.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const slot = slots.find((s) => s.hour === slotHour);
    onSubmit({
      name: name.trim(),
      phone,
      email: email.trim(),
      purpose,
      categories,
      appointmentDate: selectedDay.label,
      appointmentTime: slot?.label || "",
    });
  };

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title="Booking Summary"
      footer={
        <div className="flex flex-col gap-2.5">
          {error && <p className="text-[11px] text-red-500 font-figtree">{error}</p>}
          {skipsOtp ? <VerifiedNote name={account?.name} /> : <SecureNote />}
          <PrimaryButton onClick={handleSubmit} loading={submitting}>
            Book Now
          </PrimaryButton>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Store */}
        <div className="border border-gray-100 bg-gray-50/50 rounded-sm p-3.5 flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <span className="flex items-center gap-1.5 font-figtree font-bold text-sm text-black">
              <StoreIcon size={14} className="text-primary" />
              {storeLabel(store)}
              {store?.distance !== null && store?.distance !== undefined && (
                <span className="font-normal text-zinc-500">({formatDistance(store.distance)})</span>
              )}
            </span>
            <button
              type="button"
              onClick={onChangeStore}
              className="text-[11px] font-figtree font-bold text-primary uppercase tracking-wide hover:underline shrink-0 cursor-pointer"
            >
              Change
            </button>
          </div>
          <p className="text-xs text-zinc-500 font-figtree leading-relaxed">{storeAddress(store)}</p>
        </div>

        {/* Date */}
        <div className="flex flex-col gap-2.5">
          <SectionLabel icon={CalendarDays}>Select Date</SectionLabel>
          <div className="grid grid-cols-4 gap-2">
            {days.map((day) => {
              const isOn = day.key === dayKey;
              const isDead = !slots.some((s) => isSlotAvailable(day, s, now));
              return (
                <button
                  key={day.key}
                  type="button"
                  disabled={isDead}
                  onClick={() => {
                    setDayKey(day.key);
                    setSlotHour(null);
                  }}
                  className={`h-14 rounded-sm border flex flex-col items-center justify-center gap-0.5 transition-colors ${
                    isDead
                      ? "border-gray-100 bg-gray-50 text-zinc-300 cursor-not-allowed"
                      : isOn
                        ? "border-primary bg-primary/5 text-black cursor-pointer"
                        : "border-gray-200 text-black hover:border-gray-300 cursor-pointer"
                  }`}
                >
                  <span className="font-figtree font-bold text-sm leading-none">{day.dayNum}</span>
                  <span className="font-figtree text-[10px] leading-none text-zinc-500">{day.dayName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slot */}
        <div className="flex flex-col gap-2.5">
          <SectionLabel icon={Clock3}>Select Time Slot</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot) => {
              const available = isSlotAvailable(selectedDay, slot, now);
              const isOn = slot.hour === slotHour;
              return (
                <button
                  key={slot.hour}
                  type="button"
                  disabled={!available}
                  onClick={() => {
                    setSlotHour(slot.hour);
                    setErrors((e) => ({ ...e, slot: undefined }));
                  }}
                  className={`h-10 rounded-sm border font-figtree text-xs transition-colors ${
                    !available
                      ? "border-gray-100 bg-gray-50 text-zinc-300 cursor-not-allowed"
                      : isOn
                        ? "border-primary bg-primary/5 text-black font-bold cursor-pointer"
                        : "border-gray-200 text-black hover:border-gray-300 cursor-pointer"
                  }`}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
          {errors.slot && <p className="text-[11px] text-red-500 font-figtree">{errors.slot}</p>}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-2.5">
          <SectionLabel icon={UserRound}>Enter Details</SectionLabel>
          <TextField
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter Name Here *"
            label="Name"
            error={errors.name}
            maxLength={60}
          />
          <PhoneField value={phone} onChange={setPhone} error={errors.phone} />
          <TextField
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter Mail Id Here *"
            label="Email"
            error={errors.email}
          />
          <SelectField
            value={purpose}
            onChange={setPurpose}
            options={VISIT_PURPOSES}
            placeholder="Purpose of Visit"
          />
          <CategoryPicker selected={categories} onChange={setCategories} options={PRODUCT_CATEGORIES} />
        </div>
      </div>
    </SideDrawer>
  );
}
