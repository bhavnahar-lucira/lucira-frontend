"use client";

// Virtual Shop → video call.
//
// The shortest of the three journeys: no pincode gate, because a video call
// does not depend on a store being near the shopper. Number → OTP → booked, and
// a signed-in shopper on their own number skips straight past the OTP.

import React from "react";
import { CardShell, PrimaryButton, PhoneField, OtpStep, SuccessStep, VerifiedNote } from "./parts";
import { useBookingFlow } from "./useBookingFlow";
import { APPOINTMENT_TYPES } from "@/lib/bookAppointment";
import { pushPromoClick } from "@/lib/gtm";

export default function VideoCallCard({ card, open, onOpen, onClose }) {
  const [step, setStep] = React.useState("idle");
  const [phone, setPhone] = React.useState("");
  const [phoneError, setPhoneError] = React.useState("");
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
    setPhone(open ? flow.account.phone : "");
    if (!open) flow.setError("");
  }

  const skipsOtp = flow.isVerifiedNumber(phone);

  const start = () => {
    pushPromoClick({
      creative_name: "book appointment video call started",
      location_id: "book-an-appointment",
      promo_id: "video_call",
      promo_name: card.title,
    });
    onOpen();
  };

  const booked = () => {
    pushPromoClick({
      creative_name: "book appointment video call booked",
      location_id: "book-an-appointment",
      promo_id: "video_call",
      promo_name: card.title,
    });
    setStep("success");
  };

  const payload = () => ({
    appointmentType: APPOINTMENT_TYPES.videoCall,
    phone,
    name: flow.account.name,
    email: flow.account.email,
  });

  const submit = async () => {
    if (phone.length !== 10) {
      setPhoneError("Enter a valid 10-digit mobile number.");
      return;
    }
    setPhoneError("");
    const next = await flow.begin(phone, payload());
    if (next === "otp") setStep("otp");
    else if (next === "booked") booked();
  };

  const verify = async (code) => {
    if (await flow.confirm(phone, code, payload())) booked();
  };

  return (
    <CardShell title={card.title} desc={card.desc} image={card.image} expanded={open && step !== "idle"}>
      {step === "idle" && <PrimaryButton onClick={start}>{card.cta}</PrimaryButton>}

      {step === "phone" && (
        <div className="flex flex-col gap-2.5">
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
          message="Our executive will get in touch to get further details."
          ctaLabel="Browse Products"
          ctaHref="/collections/fast-shipping"
        />
      )}
    </CardShell>
  );
}
