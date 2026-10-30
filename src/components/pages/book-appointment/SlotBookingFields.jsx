"use client";

// The day/slot/details form itself, split out from the drawer that frames it.
//
// Two surfaces ask for exactly the same thing: the Book Appointment page, where
// the form is one drawer and the OTP and success states render back in the card
// behind it, and a product card, where there is no card to render back into so
// the whole journey has to live inside a single drawer. The second cannot open
// SlotBookingDrawer — that is a SideDrawer, and a drawer inside a drawer is not
// a thing — so the parts that are genuinely shared are the form state and the
// fields, not the panel.
//
// Split as a hook plus a body rather than one component because SideDrawer
// takes its body and its sticky footer as separate props: the caller needs to
// render the fields in one place and drive `validate`/`submit` from another.

import React from "react";
import { UserRound } from "lucide-react";
import DateTimePicker, { SectionLabel, useSlotPicker } from "./DateTimePicker";
import { TextField, PhoneField, CategoryPicker } from "./parts";
import { PRODUCT_CATEGORIES } from "@/lib/bookAppointment";

/**
 * Form state for one booking.
 *
 * `open` is passed so the form resets on each opening: the shopper may have sat
 * on the surface long enough for the earliest slot to have gone, and a
 * signed-in shopper's own details should be waiting for them. `initial` is what
 * they submitted last time, so stepping back from the OTP returns them to their
 * own answers rather than a blank form.
 *
 * Reset is derived during render rather than run in an effect — the pattern
 * React asks for when state follows a prop, and the same way
 * BookingSummaryDrawer does it.
 */
export function useSlotBookingForm({ open, account, initial }) {
  const picker = useSlotPicker();

  // Seeded at mount, not just on the open transition. The Book Appointment page
  // mounts its drawer closed and opens it later, so the transition below is
  // enough there — but a product card mounts the drawer ALREADY open, and a
  // form that only fills on a transition that never happens would greet a
  // signed-in shopper with empty fields.
  const [name, setName] = React.useState(() => initial?.name ?? account?.name ?? "");
  const [phone, setPhone] = React.useState(() => initial?.phone ?? account?.phone ?? "");
  const [email, setEmail] = React.useState(() => initial?.email ?? account?.email ?? "");
  const [categories, setCategories] = React.useState(() => initial?.categories ?? []);
  const [errors, setErrors] = React.useState({});

  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      picker.reset(initial);
      setName(initial?.name ?? account?.name ?? "");
      setPhone(initial?.phone ?? account?.phone ?? "");
      setEmail(initial?.email ?? account?.email ?? "");
      setCategories(initial?.categories ?? []);
      setErrors({});
    }
  }

  // The session is restored a tick after mount, so on the card — where the form
  // is already on screen by then — the account details would otherwise land too
  // late to be seen. Derived during render rather than in an effect, the same
  // way the open transition above is. Only fills what is still blank, so it can
  // never overwrite something the shopper has typed.
  const signedIn = !!account?.signedIn;
  const accountKey = `${signedIn}|${account?.name || ""}|${account?.phone || ""}|${account?.email || ""}`;
  const [prevAccountKey, setPrevAccountKey] = React.useState(accountKey);
  if (accountKey !== prevAccountKey) {
    setPrevAccountKey(accountKey);
    if (signedIn) {
      if (!name) setName(account?.name || "");
      if (!phone) setPhone(account?.phone || "");
      if (!email) setEmail(account?.email || "");
    }
  }

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = "Please enter your name.";
    if (phone.length !== 10) next.phone = "Enter a valid 10-digit mobile number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (!picker.selection) next.slot = "Please pick a time slot.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /** The submitted booking, or null when the form is not ready to go. */
  const collect = () => {
    if (!validate()) return null;
    return {
      name: name.trim(),
      phone,
      email: email.trim(),
      categories,
      // Carried so a shopper stepping back from the OTP finds this same slot
      // still selected — `appointmentDate` alone is an instant, not a choice.
      ...picker.preset,
      ...picker.selection,
    };
  };

  return {
    picker,
    phone,
    name, setName,
    setPhone,
    email, setEmail,
    categories, setCategories,
    errors, setErrors,
    validate,
    collect,
  };
}

export default function SlotBookingFields({ form, intro, showCategories = false }) {
  return (
    <div className="flex flex-col gap-5">
      {intro}

      <DateTimePicker
        picker={form.picker}
        error={form.errors.slot}
        onChange={() => form.setErrors((e) => ({ ...e, slot: undefined }))}
      />

      <div className="flex flex-col gap-2.5">
        <SectionLabel icon={UserRound}>Enter Details</SectionLabel>
        <TextField
          value={form.name}
          onChange={(e) => form.setName(e.target.value)}
          placeholder="Enter Name Here *"
          label="Name"
          error={form.errors.name}
          maxLength={60}
        />
        <PhoneField value={form.phone} onChange={form.setPhone} error={form.errors.phone} />
        <TextField
          type="email"
          value={form.email}
          onChange={(e) => form.setEmail(e.target.value)}
          placeholder="Enter Mail Id Here *"
          label="Email"
          error={form.errors.email}
        />
        {showCategories && (
          <CategoryPicker selected={form.categories} onChange={form.setCategories} options={PRODUCT_CATEGORIES} />
        )}
      </div>
    </div>
  );
}
