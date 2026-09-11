"use client";

// Visit Our Store — the longest journey of the three.
//
// Pincode → nearest store (auto-selected, changeable from a drawer) → booking
// summary drawer (day, slot, details) → OTP → booked. When no store falls inside
// the nearby radius the shopper gets three honest exits instead of a dead end:
// try another pincode, browse the full store list anyway, or take a video call.
//
// A signed-in shopper has their name, number and email waiting in the summary
// form, and booking on their own registered number skips the OTP.

import React from "react";
import { Store as StoreIcon } from "lucide-react";
import {
  CardShell,
  PrimaryButton,
  OutlineButton,
  PincodeStep,
  PincodeChip,
  OtpStep,
  SuccessStep,
} from "./parts";
import StoresDrawer from "./StoresDrawer";
import BookingSummaryDrawer from "./BookingSummaryDrawer";
import { useBookingFlow } from "./useBookingFlow";
import {
  fetchStoresForPincode,
  nearestStoreWithin,
  storeLabel,
  storeAddress,
  storeCollectionUrl,
  formatDistance,
  savedPincode,
  APPOINTMENT_TYPES,
} from "@/lib/bookAppointment";
import { pushPromoClick } from "@/lib/gtm";

export default function VisitStoreCard({ card, open, fillHeight, onOpen, onClose, onBookVideoCall }) {
  const [step, setStep] = React.useState("idle");
  const [pincode, setPincode] = React.useState("");
  const [pincodeError, setPincodeError] = React.useState("");
  const [looking, setLooking] = React.useState(false);

  const [stores, setStores] = React.useState([]);
  const [store, setStore] = React.useState(null);

  const [storesOpen, setStoresOpen] = React.useState(false);
  const [summaryOpen, setSummaryOpen] = React.useState(false);

  // Details captured in the summary drawer, held here so the OTP step (which
  // renders back in the card) still has them when the webhook fires.
  const [details, setDetails] = React.useState(null);
  const flow = useBookingFlow();

  // Derived from the `open` prop during render — see the note in VideoCallCard.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    setStep(open ? "pincode" : "idle");
    setPincodeError("");
    setPincode(open ? savedPincode() : "");
    if (!open) {
      setStores([]);
      setStore(null);
      setStoresOpen(false);
      setSummaryOpen(false);
      setDetails(null);
      flow.setError("");
    }
  }

  const start = () => {
    pushPromoClick({
      creative_name: "book appointment store visit started",
      location_id: "book-an-appointment",
      promo_id: "visit_store",
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
      const { stores: found } = await fetchStoresForPincode(value);
      setStores(found);
      const nearest = nearestStoreWithin(found);
      setStore(nearest);
      setStep(nearest ? "store" : "unavailable");
      pushPromoClick({
        creative_name: nearest
          ? "book appointment store found nearby"
          : "book appointment no store nearby",
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

  const backToPincode = () => {
    setStoresOpen(false);
    setStep("pincode");
    setStore(null);
  };

  const pickStore = (picked) => {
    setStore(picked);
    setStoresOpen(false);
    setStep("store");
  };

  const payloadFor = (values) => ({
    appointmentType: APPOINTMENT_TYPES.visitStore,
    name: values.name,
    phone: values.phone,
    email: values.email,
    pincode,
    purpose: values.purpose,
    categories: values.categories,
    storeName: storeLabel(store),
    storeAddress: storeAddress(store),
    appointmentDate: values.appointmentDate,
    appointmentTime: values.appointmentTime,
  });

  const booked = () => {
    pushPromoClick({
      creative_name: "book appointment store visit booked",
      location_id: "book-an-appointment",
      promo_id: pincode,
      promo_name: storeLabel(store),
    });
    setSummaryOpen(false);
    setStep("success");
  };

  // The summary drawer collects the booking, then hands off to the OTP step in
  // the card — the flow doc draws "Almost Done" in the card, not the drawer.
  const handleBookNow = (values) => {
    setDetails(values);
    (async () => {
      const next = await flow.begin(values.phone, payloadFor(values));
      if (next === "otp") {
        setSummaryOpen(false);
        setStep("otp");
      } else if (next === "booked") {
        booked();
      }
    })();
  };

  const verify = async (code) => {
    if (await flow.confirm(details.phone, code, payloadFor(details))) booked();
  };

  return (
    <>
      <CardShell title={card.title} desc={card.desc} image={card.image} fillHeight={fillHeight} expanded={open && step !== "idle"}>
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
              <p className="font-figtree font-bold text-sm text-black">We do not have Stores Nearby</p>
              <p className="text-xs text-zinc-500 font-figtree mt-1">
                Do not worry — we can still connect virtually.
              </p>
            </div>
            <PincodeChip pincode={pincode} onChange={backToPincode} />
            <OutlineButton onClick={() => setStoresOpen(true)} disabled={!stores.length}>
              View All Stores
            </OutlineButton>
            <PrimaryButton onClick={onBookVideoCall}>Book Video Call</PrimaryButton>
          </div>
        )}

        {step === "store" && (
          <div className="flex flex-col gap-2.5">
            <div className="border border-gray-100 bg-gray-50/50 rounded-sm p-3 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 font-figtree font-bold text-sm text-black">
                <StoreIcon size={14} className="text-primary" />
                {storeLabel(store)}
                {store?.distance !== null && store?.distance !== undefined && (
                  <span className="font-normal text-zinc-500">({formatDistance(store.distance)})</span>
                )}
              </span>
              <p className="text-xs text-zinc-500 font-figtree leading-relaxed line-clamp-2">
                {storeAddress(store)}
              </p>
            </div>
            <PincodeChip pincode={pincode} onChange={backToPincode} />
            <OutlineButton onClick={() => setStoresOpen(true)}>Change Store</OutlineButton>
            <PrimaryButton onClick={() => setSummaryOpen(true)}>Continue</PrimaryButton>
          </div>
        )}

        {step === "otp" && (
          <OtpStep
            idPrefix="visit"
            phone={details?.phone}
            onVerify={verify}
            onResend={() => flow.resend(details.phone)}
            verifying={flow.verifying}
            error={flow.error}
          />
        )}

        {step === "success" && (
          <SuccessStep
            message={`We are waiting to see you at our ${storeLabel(store)} on ${details?.appointmentDate} at ${details?.appointmentTime}. You can browse the products available in the store.`}
            ctaLabel="Browse Store Products"
            ctaHref={storeCollectionUrl(store)}
          />
        )}
      </CardShell>

      <StoresDrawer
        open={storesOpen}
        onClose={() => setStoresOpen(false)}
        pincode={pincode}
        stores={stores}
        selectedId={store?.shopifyId}
        onSelect={pickStore}
        onChangePincode={backToPincode}
      />

      <BookingSummaryDrawer
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        store={store}
        account={flow.account}
        isVerifiedNumber={flow.isVerifiedNumber}
        onChangeStore={() => {
          setSummaryOpen(false);
          setStoresOpen(true);
        }}
        onSubmit={handleBookNow}
        submitting={flow.sending}
        error={flow.error}
      />
    </>
  );
}
