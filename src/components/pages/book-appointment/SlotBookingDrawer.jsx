"use client";

// The booking drawer behind Virtual Shop and Try At Home.
//
// Both journeys ask for the same thing — who is booking, a day, a slot and a
// number (plus, for a home trial, the categories to bring) — so they share one
// surface, and it is the same SideDrawer the store visit already uses: a
// right-hand panel on desktop, a bottom sheet on mobile. The card behind it
// stays on its own step; the OTP and success states still render there, the way
// the flow doc draws it.

import React from "react";
import { UserRound } from "lucide-react";
import SideDrawer from "./SideDrawer";
import DateTimePicker, { SectionLabel, useSlotPicker } from "./DateTimePicker";
import {
  PrimaryButton,
  TextField,
  PhoneField,
  CategoryPicker,
  SecureNote,
  VerifiedNote,
} from "./parts";
import { PRODUCT_CATEGORIES } from "@/lib/bookAppointment";

export default function SlotBookingDrawer({
  open,
  onClose,
  title,
  intro,
  account,
  isVerifiedNumber,
  showCategories = false,
  initial,
  onSubmit,
  submitting,
  error,
}) {
  const picker = useSlotPicker();

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [categories, setCategories] = React.useState([]);
  const [errors, setErrors] = React.useState({});

  // Every open starts on a fresh picker — the shopper may have sat on the card
  // long enough for the earliest slot to have gone — with a signed-in shopper's
  // own details already filled. `initial` is what they submitted last time, so
  // stepping back from the OTP returns them to their own answers rather than a
  // blank form. Derived during render rather than in an effect, the same way
  // BookingSummaryDrawer does it.
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

  const skipsOtp = !!isVerifiedNumber?.(phone);

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = "Please enter your name.";
    if (phone.length !== 10) next.phone = "Enter a valid 10-digit mobile number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (!picker.selection) next.slot = "Please pick a time slot.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      name: name.trim(),
      phone,
      email: email.trim(),
      categories,
      // Carried so a shopper stepping back from the OTP finds this same slot
      // still selected — `appointmentDate` alone is an instant, not a choice.
      ...picker.preset,
      ...picker.selection,
    });
  };

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex flex-col gap-2.5">
          {error && <p className="text-[11px] text-red-500 font-figtree">{error}</p>}
          {skipsOtp ? <VerifiedNote name={account?.name} /> : <SecureNote />}
          {/* Not disabled on an incomplete form: a dead button explains nothing,
              and `validate` has a message for every field it is waiting on. */}
          <PrimaryButton onClick={handleSubmit} loading={submitting}>
            {skipsOtp ? "Confirm Booking" : "Continue"}
          </PrimaryButton>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {intro}

        <DateTimePicker
          picker={picker}
          error={errors.slot}
          onChange={() => setErrors((e) => ({ ...e, slot: undefined }))}
        />

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
          {showCategories && (
            <CategoryPicker selected={categories} onChange={setCategories} options={PRODUCT_CATEGORIES} />
          )}
        </div>
      </div>
    </SideDrawer>
  );
}
