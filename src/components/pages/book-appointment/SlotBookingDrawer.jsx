"use client";

// The booking drawer behind Virtual Shop and Try At Home.
//
// Both journeys ask for the same thing — who is booking, a day, a slot and a
// number (plus, for a home trial, the categories to bring) — so they share one
// surface, and it is the same SideDrawer the store visit already uses: a
// right-hand panel on desktop, a bottom sheet on mobile. The card behind it
// stays on its own step; the OTP and success states still render there, the way
// the flow doc draws it.
//
// The form itself lives in SlotBookingFields, because the product card runs the
// same booking with nothing behind it to render the OTP and success states into
// — see ProductAppointmentDrawer.

import React from "react";
import SideDrawer from "./SideDrawer";
import SlotBookingFields, { useSlotBookingForm } from "./SlotBookingFields";
import { PrimaryButton, SecureNote, VerifiedNote } from "./parts";

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
  const form = useSlotBookingForm({ open, account, initial });

  const skipsOtp = !!isVerifiedNumber?.(form.phone);

  const handleSubmit = () => {
    const values = form.collect();
    if (values) onSubmit(values);
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
      <SlotBookingFields form={form} intro={intro} showCategories={showCategories} />
    </SideDrawer>
  );
}
