"use client";

// Virtual Shop → video call.
//
// The shortest of the three journeys: no pincode gate, because a video call
// does not depend on a store being near the shopper. The CTA opens the booking
// drawer straight away — day + slot + number — and from there it is OTP → booked
// back in the card. A signed-in shopper on their own number skips the OTP.

import React from "react";
import { CardShell, PrimaryButton, OtpStep, SuccessStep } from "./parts";
import SlotBookingDrawer from "./SlotBookingDrawer";
import { useBookingFlow, appointmentPromoDetails } from "./useBookingFlow";
import { APPOINTMENT_TYPES } from "@/lib/bookAppointment";
import { pushPromoClick, pushAppointmentInitiated } from "@/lib/gtm";

export default function VideoCallCard({ card, open, fillHeight, onOpen, onClose }) {
  const [step, setStep] = React.useState("idle");
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // What the drawer collected, held here so the OTP step and the success
  // message — which render back in the card — still have it once it closes.
  const [details, setDetails] = React.useState(null);
  const flow = useBookingFlow();

  // Whether the card is still open, readable from an async callback. An OTP
  // request that was already in flight when the shopper backed out must not
  // drop them onto the OTP step of a flow whose details have since been
  // cleared — `details` is reset the moment `open` goes false.
  const openRef = React.useRef(open);
  React.useEffect(() => {
    openRef.current = open;
  }, [open]);

  // The page keeps one card open at a time; a card that gets closed from the
  // outside has to forget whatever the shopper had half-typed. Adjusting state
  // during render (rather than in an effect) is the pattern React asks for when
  // state is derived from a prop change — same as UnlockCoupon does for `user`.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    setStep(open ? "form" : "idle");
    setDrawerOpen(open);
    if (!open) {
      setDetails(null);
      flow.setError("");
    }
  }

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

  const payloadFor = (values) => ({
    appointmentType: APPOINTMENT_TYPES.videoCall,
    // Name and email come from the drawer, not the account: a signed-out
    // shopper has neither on file, and a lead that is only a phone number
    // leaves the video-call desk with nothing to go on.
    name: values.name,
    phone: values.phone,
    email: values.email,
    appointmentDate: values.appointmentDate,
    appointmentTime: values.appointmentTime,
  });

  // Takes the submitted values rather than reading `details` state: this runs
  // after an await, so the closure's `details` could still be the previous one.
  const booked = (values, verifiedVia) => {
    flow.complete({ ...payloadFor(values), verifiedVia });
    pushPromoClick({
      creative_name: "book appointment video call booked",
      location_id: "book-an-appointment",
      promo_id: "video_call",
      promo_name: card.title,
      ...appointmentPromoDetails(payloadFor(values)),
    });
    setDrawerOpen(false);
    setStep("success");
  };

  const handleBookNow = (values) => {
    setDetails(values);
    (async () => {
      const next = await flow.begin(values.phone, payloadFor(values));
      if (!openRef.current) return;
      if (next === "otp") {
        setDrawerOpen(false);
        setStep("otp");
      } else if (next === "verified") {
        booked(values, "session");
      }
    })();
  };

  const verify = async (code) => {
    if (!details) return;
    if (await flow.confirm(details.phone, code, payloadFor(details))) booked(details, "otp");
  };

  // There is no step in front of the drawer for this journey, so dismissing it
  // backs all the way out of the flow rather than leaving an expanded card with
  // nothing in it.
  const closeDrawer = () => {
    setDrawerOpen(false);
    onClose();
  };

  return (
    <>
      <CardShell title={card.title} desc={card.desc} image={card.image} fillHeight={fillHeight} expanded={open && step !== "idle" && !drawerOpen}>
        {step === "idle" && <PrimaryButton onClick={start}>{card.cta}</PrimaryButton>}

        {step === "form" && (
          <div className="flex flex-col gap-2.5">
            <p className="text-xs text-zinc-500 font-figtree">
              Pick a date and time in the panel to finish booking.
            </p>
            <PrimaryButton onClick={() => setDrawerOpen(true)}>Resume Booking</PrimaryButton>
          </div>
        )}

        {step === "otp" && (
          <OtpStep
            idPrefix="video"
            phone={details?.phone}
            onVerify={verify}
            onResend={() => flow.resend(details?.phone)}
            onBack={() => {
              setStep("form");
              setDrawerOpen(true);
            }}
            verifying={flow.verifying}
            error={flow.error}
          />
        )}

        {step === "success" && (
          <SuccessStep
            message={`Your video call is scheduled for ${details?.appointmentDateLabel} at ${details?.appointmentTime}. Our executive will get in touch with the call details.`}
            ctaLabel="Browse Products"
            ctaHref="/collections/fast-shipping"
          />
        )}
      </CardShell>

      <SlotBookingDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        title="Book Video Call"
        account={flow.account}
        isVerifiedNumber={flow.isVerifiedNumber}
        initial={details}
        onSubmit={handleBookNow}
        submitting={flow.sending}
        error={flow.error}
      />
    </>
  );
}
