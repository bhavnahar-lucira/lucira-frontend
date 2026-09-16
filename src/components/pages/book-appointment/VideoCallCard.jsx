"use client";

// Virtual Shop → video call.
//
// The shortest of the three journeys: no pincode gate, because a video call
// does not depend on a store being near the shopper. Day + slot + number → OTP
// → booked, and a signed-in shopper on their own number skips straight past
// the OTP.

import React from "react";
import { CardShell, PrimaryButton, PhoneField, OtpStep, SuccessStep, VerifiedNote } from "./parts";
import DateTimePicker, { useSlotPicker } from "./DateTimePicker";
import { useBookingFlow, appointmentPromoDetails } from "./useBookingFlow";
import { APPOINTMENT_TYPES } from "@/lib/bookAppointment";
import { pushPromoClick, pushAppointmentInitiated } from "@/lib/gtm";

export default function VideoCallCard({ card, open, fillHeight, onOpen, onClose }) {
  const [step, setStep] = React.useState("idle");
  const [phone, setPhone] = React.useState("");
  const [phoneError, setPhoneError] = React.useState("");
  const [slotError, setSlotError] = React.useState("");
  const picker = useSlotPicker();
  const flow = useBookingFlow();

  // The page keeps one card open at a time; a card that gets closed from the
  // outside has to forget whatever the shopper had half-typed. Adjusting state
  // during render (rather than in an effect) is the pattern React asks for when
  // state is derived from a prop change — same as UnlockCoupon does for `user`.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    setStep(open ? "phone" : "idle");
    setPhoneError("");
    setSlotError("");
    setPhone(open ? flow.account.phone : "");
    picker.reset();
    if (!open) flow.setError("");
  }

  const skipsOtp = flow.isVerifiedNumber(phone);

  const start = () => {
    pushAppointmentInitiated({
      appointment_type: APPOINTMENT_TYPES.videoCall,
      appointment_label: card.title,
    });
    pushPromoClick({
      creative_name: "book appointment video call started",
      location_id: "book-an-appointment",
      promo_id: "video_call",
      promo_name: card.title,
    });
    onOpen();
  };

  const payload = () => ({
    appointmentType: APPOINTMENT_TYPES.videoCall,
    phone,
    name: flow.account.name,
    email: flow.account.email,
    ...picker.selection,
  });

  const booked = (lead) => {
    pushPromoClick({
      creative_name: "book appointment video call booked",
      location_id: "book-an-appointment",
      promo_id: "video_call",
      promo_name: card.title,
      ...appointmentPromoDetails(lead),
    });
    setStep("success");
  };

  const submit = async () => {
    const missingSlot = !picker.selection;
    const badPhone = phone.length !== 10;
    setSlotError(missingSlot ? "Please pick a time slot." : "");
    setPhoneError(badPhone ? "Enter a valid 10-digit mobile number." : "");
    if (missingSlot || badPhone) return;
    const lead = payload();
    const next = await flow.begin(phone, lead);
    if (next === "otp") setStep("otp");
    else if (next === "booked") booked(lead);
  };

  const verify = async (code) => {
    const lead = payload();
    if (await flow.confirm(phone, code, lead)) booked(lead);
  };

  return (
    <CardShell title={card.title} desc={card.desc} image={card.image} fillHeight={fillHeight} expanded={open && step !== "idle"}>
      {step === "idle" && <PrimaryButton onClick={start}>{card.cta}</PrimaryButton>}

      {step === "phone" && (
        <div className="flex flex-col gap-2.5">
          <DateTimePicker picker={picker} error={slotError} onChange={() => setSlotError("")} />
          <PhoneField value={phone} onChange={setPhone} error={phoneError || flow.error} />
          {skipsOtp && <VerifiedNote name={flow.account.name} />}
          <PrimaryButton onClick={submit} loading={flow.sending} disabled={phone.length !== 10}>
            {skipsOtp ? "Confirm Booking" : "Continue"}
          </PrimaryButton>
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-figtree text-zinc-500 hover:text-primary cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {step === "otp" && (
        <OtpStep
          idPrefix="video"
          phone={phone}
          onVerify={verify}
          onResend={() => flow.resend(phone)}
          verifying={flow.verifying}
          error={flow.error}
        />
      )}

      {step === "success" && (
        <SuccessStep
          message={`Your video call is scheduled for ${picker.selection?.appointmentDateLabel} at ${picker.selection?.appointmentTime}. Our executive will get in touch with the call details.`}
          ctaLabel="Browse Products"
          ctaHref="/collections/fast-shipping"
        />
      )}
    </CardShell>
  );
}
