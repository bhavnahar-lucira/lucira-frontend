"use client";

// Try At Home.
//
// Home trials are run out of a store, so this journey is pincode-gated: if no
// store sits within the nearby radius the service simply is not available there
// and the honest move is to offer the video call instead of taking a booking we
// cannot honour. Where it IS available, "Continue" opens the same booking
// drawer the store visit uses — day, slot, number and the categories to bring —
// and the OTP and success states render back in the card.

import React from "react";
import {
  CardShell,
  PrimaryButton,
  PincodeStep,
  PincodeChip,
  OtpStep,
  SuccessStep,
} from "./parts";
import SlotBookingDrawer from "./SlotBookingDrawer";
import { useBookingFlow, appointmentPromoDetails } from "./useBookingFlow";
import {
  fetchStoresForPincode,
  nearestStoreWithin,
  storeCollectionUrl,
  storeLabel,
  savedPincode,
  APPOINTMENT_TYPES,
} from "@/lib/bookAppointment";
import { pushPromoClick, pushAppointmentInitiated } from "@/lib/gtm";

/** The "we cover your area" panel, shown in the card and again in the drawer. */
function AvailabilityNote({ store }) {
  return (
    <div className="bg-[#F1F9F1] border border-[#DBEFDB] rounded-sm p-3">
      <p className="font-figtree font-bold text-sm text-black">Service is Available at your Location</p>
      <p className="text-xs text-zinc-500 font-figtree mt-1">Served by our {storeLabel(store)}.</p>
    </div>
  );
}

export default function TryAtHomeCard({ card, open, fillHeight, onOpen, onClose, onBookVideoCall }) {
  const [step, setStep] = React.useState("idle");
  const [pincode, setPincode] = React.useState("");
  const [pincodeError, setPincodeError] = React.useState("");
  const [looking, setLooking] = React.useState(false);
  const [store, setStore] = React.useState(null);

  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // What the drawer collected, held here so the OTP step and the success
  // message — which render back in the card — still have it once it closes.
  const [details, setDetails] = React.useState(null);
  const flow = useBookingFlow();

  // See VideoCallCard: lets an in-flight OTP request tell that the shopper has
  // already backed out of the flow.
  const openRef = React.useRef(open);
  React.useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Derived from the `open` prop during render — see the note in VideoCallCard.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    setStep(open ? "pincode" : "idle");
    setPincodeError("");
    if (!open) {
      setPincode("");
      setStore(null);
      setDrawerOpen(false);
      setDetails(null);
      flow.setError("");
    }
  }

  const start = () => {
    // Prefilled here rather than in the render-phase block below: `savedPincode`
    // reads document.cookie, and render has to stay a pure function of props and
    // state, browser globals included. `onOpen` is only ever called from here,
    // so this runs exactly once per opening.
    setPincode(savedPincode());
    pushAppointmentInitiated({
      appointment_type: APPOINTMENT_TYPES.tryAtHome,
      appointment_label: card.title,
    });
    pushPromoClick({
      creative_name: "book appointment try at home started",
      location_id: "book-an-appointment",
      promo_id: "try_at_home",
      promo_name: card.title,
    });
    onOpen();
  };

  const checkPincode = async (value) => {
    if (value.length !== 6) {
      setPincodeError("Enter a valid 6-digit pincode.");
      return;
    }
    setPincodeError("");
    setLooking(true);
    try {
      const { stores } = await fetchStoresForPincode(value);
      const nearest = nearestStoreWithin(stores);
      setStore(nearest);
      setStep(nearest ? "available" : "unavailable");
      pushPromoClick({
        creative_name: nearest
          ? "book appointment try at home serviceable"
          : "book appointment try at home not serviceable",
        location_id: "book-an-appointment",
        promo_id: value,
        promo_name: nearest ? storeLabel(nearest) : "no store nearby",
      });
    } catch {
      setPincodeError("We could not check that pincode. Please try again.");
    } finally {
      setLooking(false);
    }
  };

  const payloadFor = (values) => ({
    appointmentType: APPOINTMENT_TYPES.tryAtHome,
    // Name and email come from the drawer, not the account: a signed-out
    // shopper has neither on file, and a lead that is only a phone number
    // leaves the store team with nothing to go on.
    name: values.name,
    phone: values.phone,
    email: values.email,
    pincode,
    categories: values.categories,
    storeName: store ? storeLabel(store) : "",
    appointmentDate: values.appointmentDate,
    appointmentTime: values.appointmentTime,
  });

  // Takes the submitted values rather than reading `details` state: this runs
  // after an await, so the closure's `details` could still be the previous one.
  const booked = (values, verifiedVia) => {
    flow.complete({ ...payloadFor(values), verifiedVia });
    pushPromoClick({
      creative_name: "book appointment try at home booked",
      location_id: "book-an-appointment",
      promo_id: pincode,
      promo_name: store ? storeLabel(store) : "",
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

  const backToPincode = () => {
    setDrawerOpen(false);
    setStep("pincode");
    setStore(null);
  };

  return (
    <>
      <CardShell title={card.title} desc={card.desc} image={card.image} fillHeight={fillHeight} expanded={open && step !== "idle" && !drawerOpen}>
        {step === "idle" && <PrimaryButton onClick={start}>{card.cta}</PrimaryButton>}

        {step === "pincode" && (
          <PincodeStep
            value={pincode}
            onChange={setPincode}
            onSubmit={checkPincode}
            loading={looking}
            error={pincodeError}
          />
        )}

        {step === "unavailable" && (
          <div className="flex flex-col gap-2.5">
            <div className="bg-[#FEF5F1] border border-[#F1E4D1] rounded-sm p-3">
              <p className="font-figtree font-bold text-sm text-black">Service is Not Available at your Location</p>
              <p className="text-xs text-zinc-500 font-figtree mt-1">
                Do not worry — we can still connect virtually.
              </p>
            </div>
            <PincodeChip pincode={pincode} onChange={backToPincode} />
            <PrimaryButton onClick={onBookVideoCall}>Book Video Call</PrimaryButton>
          </div>
        )}

        {step === "available" && (
          <div className="flex flex-col gap-2.5">
            <AvailabilityNote store={store} />
            <PincodeChip pincode={pincode} onChange={backToPincode} />
            <PrimaryButton onClick={() => setDrawerOpen(true)}>Continue</PrimaryButton>
          </div>
        )}

        {step === "otp" && (
          <OtpStep
            idPrefix="tryhome"
            phone={details?.phone}
            onVerify={verify}
            onResend={() => flow.resend(details?.phone)}
            onBack={() => {
              setStep("available");
              setDrawerOpen(true);
            }}
            verifying={flow.verifying}
            error={flow.error}
          />
        )}

        {step === "success" && (
          <SuccessStep
            message={`Your home trial is scheduled for ${details?.appointmentDateLabel} at ${details?.appointmentTime}. Our executive will get in touch to confirm the details.`}
            ctaLabel="Browse Products"
            ctaHref={storeCollectionUrl(store)}
          />
        )}
      </CardShell>

      <SlotBookingDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Book Home Trial"
        intro={<AvailabilityNote store={store} />}
        account={flow.account}
        isVerifiedNumber={flow.isVerifiedNumber}
        showCategories
        initial={details}
        onSubmit={handleBookNow}
        submitting={flow.sending}
        error={flow.error}
      />
    </>
  );
}
