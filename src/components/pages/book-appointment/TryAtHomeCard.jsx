"use client";

// Try At Home.
//
// Home trials are run out of a store, so this journey is pincode-gated: if no
// store sits within the nearby radius the service simply is not available there
// and the honest move is to offer the video call instead of taking a booking we
// cannot honour. Where it IS available the form is deliberately short — phone
// is the only required field, categories are optional — because an executive
// calls back to collect the rest.

import React from "react";
import {
  CardShell,
  PrimaryButton,
  PincodeStep,
  PincodeChip,
  PhoneField,
  CategoryPicker,
  OtpStep,
  SuccessStep,
  VerifiedNote,
} from "./parts";
import { useBookingFlow } from "./useBookingFlow";
import {
  fetchStoresForPincode,
  nearestStoreWithin,
  storeCollectionUrl,
  storeLabel,
  savedPincode,
  APPOINTMENT_TYPES,
  PRODUCT_CATEGORIES,
} from "@/lib/bookAppointment";
import { pushPromoClick } from "@/lib/gtm";

export default function TryAtHomeCard({ card, open, onOpen, onClose, onBookVideoCall }) {
  const [step, setStep] = React.useState("idle");
  const [pincode, setPincode] = React.useState("");
  const [pincodeError, setPincodeError] = React.useState("");
  const [looking, setLooking] = React.useState(false);
  const [store, setStore] = React.useState(null);

  const [phone, setPhone] = React.useState("");
  const [phoneError, setPhoneError] = React.useState("");
  const [categories, setCategories] = React.useState([]);
  const flow = useBookingFlow();

  // Derived from the `open` prop during render — see the note in VideoCallCard.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    setStep(open ? "pincode" : "idle");
    setPincodeError("");
    setPhoneError("");
    setPincode(open ? savedPincode() : "");
    setPhone(open ? flow.account.phone : "");
    if (!open) {
      setStore(null);
      setCategories([]);
      flow.setError("");
    }
  }

  const skipsOtp = flow.isVerifiedNumber(phone);

  const start = () => {
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

  const payload = () => ({
    appointmentType: APPOINTMENT_TYPES.tryAtHome,
    phone,
    pincode,
    categories,
    name: flow.account.name,
    email: flow.account.email,
    storeName: store ? storeLabel(store) : "",
  });

  const booked = () => {
    pushPromoClick({
      creative_name: "book appointment try at home booked",
      location_id: "book-an-appointment",
      promo_id: pincode,
      promo_name: store ? storeLabel(store) : "",
    });
    setStep("success");
  };

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

  const backToPincode = () => {
    setStep("pincode");
    setStore(null);
  };

  return (
    <CardShell title={card.title} desc={card.desc} image={card.image} expanded={open && step !== "idle"}>
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
          <div className="bg-[#F1F9F1] border border-[#DBEFDB] rounded-sm p-3">
            <p className="font-figtree font-bold text-sm text-black">Service is Available at your Location</p>
            <p className="text-xs text-zinc-500 font-figtree mt-1">
              Served by our {storeLabel(store)}.
            </p>
          </div>
          <PincodeChip pincode={pincode} onChange={backToPincode} />
          <PhoneField value={phone} onChange={setPhone} error={phoneError || flow.error} />
          <CategoryPicker selected={categories} onChange={setCategories} options={PRODUCT_CATEGORIES} />
          {skipsOtp && <VerifiedNote name={flow.account.name} />}
          <PrimaryButton onClick={submit} loading={flow.sending} disabled={phone.length !== 10}>
            {skipsOtp ? "Confirm Booking" : "Continue"}
          </PrimaryButton>
        </div>
      )}

      {step === "otp" && (
        <OtpStep
          idPrefix="tryhome"
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
          ctaHref={storeCollectionUrl(store)}
        />
      )}
    </CardShell>
  );
}
