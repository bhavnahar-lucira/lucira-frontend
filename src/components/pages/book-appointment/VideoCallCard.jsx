"use client";

// Virtual Shop → video call.
//
// The shortest of the three journeys: no pincode gate, because a video call
// does not depend on a store being near the shopper. Number → OTP → booked.

import React from "react";
import { CardShell, PrimaryButton, PhoneField, OtpStep, SuccessStep } from "./parts";
import { useOtpGate } from "./useOtpGate";
import { APPOINTMENT_TYPES } from "@/lib/bookAppointment";
import { pushPromoClick } from "@/lib/gtm";

export default function VideoCallCard({ card, open, onOpen, onClose }) {
  const [step, setStep] = React.useState("idle");
  const [phone, setPhone] = React.useState("");
  const [phoneError, setPhoneError] = React.useState("");
  const otp = useOtpGate();

  // The page keeps one card open at a time; a card that gets closed from the
  // outside has to forget whatever the shopper had half-typed. Adjusting state
  // during render (rather than in an effect) is the pattern React asks for when
  // state is derived from a prop change — same as UnlockCoupon does for `user`.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    setStep(open ? "phone" : "idle");
    if (!open) {
      setPhone("");
      setPhoneError("");
      otp.setError("");
    }
  }

  const start = () => {
    pushPromoClick({
      creative_name: "book appointment video call started",
      location_id: "book-an-appointment",
      promo_id: "video_call",
      promo_name: card.title,
    });
    onOpen();
  };

  const sendOtp = async () => {
    if (phone.length !== 10) {
      setPhoneError("Enter a valid 10-digit mobile number.");
      return;
    }
    setPhoneError("");
    if (await otp.send(phone)) setStep("otp");
  };

  const verify = async (code) => {
    const ok = await otp.verify(phone, code, {
      appointmentType: APPOINTMENT_TYPES.videoCall,
      phone,
    });
    if (!ok) return;
    pushPromoClick({
      creative_name: "book appointment video call booked",
      location_id: "book-an-appointment",
      promo_id: "video_call",
      promo_name: card.title,
    });
    setStep("success");
  };

  return (
    <CardShell title={card.title} desc={card.desc} image={card.image} expanded={open && step !== "idle"}>
      {step === "idle" && <PrimaryButton onClick={start}>{card.cta}</PrimaryButton>}

      {step === "phone" && (
        <div className="flex flex-col gap-2.5">
          <PhoneField value={phone} onChange={setPhone} error={phoneError || otp.error} />
          <PrimaryButton onClick={sendOtp} loading={otp.sending} disabled={phone.length !== 10}>
            Continue
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
          onResend={() => otp.send(phone)}
          verifying={otp.verifying}
          error={otp.error}
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
