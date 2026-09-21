"use client";

// Book Appointment, started from a product card.
//
// Same two journeys as the Book Appointment page — a home trial and a video
// call — and deliberately the same steps, the same validation and the same
// OTP, so a shopper who books from a collection page and a shopper who books
// from /pages/book-an-appointment are filling in one form, not two.
//
// What differs is the framing. On the page each journey owns a card, and the
// pincode gate, the OTP and the confirmation render inside that card while only
// the day/slot form gets a drawer. A product card has no such surface to fall
// back to — it is one tile in a grid, and expanding it would reflow every card
// around it — so here the WHOLE journey lives in the drawer and the steps
// simply replace each other inside it.
//
// The home trial is pincode-gated for the same reason it is on the page: trials
// are run out of a store, so where no store is near enough the honest move is
// to offer the video call rather than take a booking we cannot honour.
//
// The gate is skipped where the site already HAS the shopper's pincode (header
// pill, delivery check, a previous booking). Prefilling it and still asking
// them to press Continue only makes them confirm something they have already
// told us; the check runs itself instead and the drawer opens on the slot form.
// Nothing is hidden by that — the pincode rides along at the top of the form
// with a Change Pincode next to it, which is where a mistyped one gets fixed.

import React from "react";
import { Loader2 } from "lucide-react";
import SideDrawer from "./SideDrawer";
import SlotBookingFields, { useSlotBookingForm } from "./SlotBookingFields";
import {
  PrimaryButton,
  PincodeStep,
  PincodeChip,
  OtpStep,
  SuccessStep,
  SecureNote,
  VerifiedNote,
} from "./parts";
import { useBookingFlow, appointmentPromoDetails } from "./useBookingFlow";
import {
  fetchStoresForPincode,
  nearestStoreWithin,
  storeLabel,
  savedPincode,
  APPOINTMENT_TYPES,
} from "@/lib/bookAppointment";
import { pushPromoClick, pushAppointmentInitiated } from "@/lib/gtm";

/** The "we cover your area" panel, shown once the pincode clears. */
function AvailabilityNote({ store }) {
  return (
    <div className="bg-[#F1F9F1] border border-[#DBEFDB] rounded-sm p-3">
      <p className="font-figtree font-bold text-sm text-black">Service is Available at your Location</p>
      <p className="text-xs text-zinc-500 font-figtree mt-1">Served by our {storeLabel(store)}.</p>
    </div>
  );
}

const TITLES = {
  [APPOINTMENT_TYPES.tryAtHome]: "Book Home Trial",
  [APPOINTMENT_TYPES.videoCall]: "Book Video Call",
};

export default function ProductAppointmentDrawer({
  open,
  onClose,
  type,
  product,
  // The surface the card that opened this was sitting on. Passed in rather than
  // assumed: the same card renders on a collection grid, in search results and
  // inside a PDP's related rail, and a booking off each of those is a different
  // thing to have learned. Defaults to the grid, which is where most of them are.
  locationId = "plp",
  // Everything the CTA already worked out about the piece — ids, price, image.
  // Shared so a booking event and the click that opened it describe the same
  // product in the same fields.
  promoProduct = null,
}) {
  const isTryAtHome = type === APPOINTMENT_TYPES.tryAtHome;

  // Read at mount rather than on an open transition: the card mounts this drawer
  // only when it is opening and unmounts it on close, so mount IS the opening.
  // Memoised so the cookie is touched once and not on every render.
  const knownPincode = React.useMemo(() => (isTryAtHome ? savedPincode() : ""), [isTryAtHome]);

  // A video call does not depend on a store being near the shopper, so it opens
  // straight onto the form. A home trial has to clear the pincode gate — but
  // where we already know the pincode it clears itself, and "checking" is the
  // second or so that takes.
  const firstStep = !isTryAtHome ? "form" : knownPincode ? "checking" : "pincode";

  const [step, setStep] = React.useState(firstStep);
  const [pincode, setPincode] = React.useState(knownPincode);
  const [pincodeError, setPincodeError] = React.useState("");
  const [looking, setLooking] = React.useState(false);
  const [store, setStore] = React.useState(null);
  const [details, setDetails] = React.useState(null);

  // A home trial with no store near enough can be turned into a video call from
  // the unavailable step. That genuinely changes what is being booked, so it has
  // to change the type the lead and the tags carry — otherwise the store team
  // gets a "try_at_home" for an address no store covers.
  const [videoFallback, setVideoFallback] = React.useState(false);
  const activeType = videoFallback ? APPOINTMENT_TYPES.videoCall : type;
  const activeIsTryAtHome = activeType === APPOINTMENT_TYPES.tryAtHome;

  const flow = useBookingFlow();
  const form = useSlotBookingForm({ open, account: flow.account, initial: details });

  // Lets an in-flight OTP request tell that the shopper has already closed the
  // drawer, so it cannot drop them onto the OTP step of a flow whose details
  // have since been cleared.
  const openRef = React.useRef(open);
  React.useEffect(() => {
    openRef.current = open;
  }, [open]);

  // "Started" fires once, at mount, for the same reason the pincode is seeded
  // there. No state is touched here, so this stays a plain side effect.
  const startedRef = React.useRef(false);
  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    pushAppointmentInitiated({
      appointment_type: type,
      appointment_label: TITLES[type],
    });
    pushPromoClick({
      ...promoProduct,
      creative_name: `Product card ${isTryAtHome ? "try at home" : "video call"} started`,
      location_id: locationId,
      // The journey, not the piece: this event answers "which flow did they
      // open", and the piece is carried by the product fields beside it.
      promo_id: isTryAtHome ? "try_at_home" : "video_call",
      promo_name: product?.title || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, isTryAtHome, product?.title]);

  // `auto` marks the run the drawer starts by itself off a pincode we already
  // had, which differs from a typed one in one way that matters: there is no
  // step behind it to show an error on.
  const checkPincode = async (value, { auto = false } = {}) => {
    if (value.length !== 6) {
      setPincodeError("Enter a valid 6-digit pincode.");
      if (auto) setStep("pincode");
      return;
    }
    setPincodeError("");
    setLooking(true);
    try {
      const { stores } = await fetchStoresForPincode(value);
      const nearest = nearestStoreWithin(stores);
      setStore(nearest);
      // Serviceable goes straight to the form. A separate "we cover you —
      // continue" step made the shopper press Continue twice to be told
      // something and then act on it; the form leads with the same note, and
      // the pincode chip rides along with it, so nothing is lost by skipping it.
      setStep(nearest ? "form" : "unavailable");
      pushPromoClick({
        ...promoProduct,
        creative_name: nearest
          ? "Product card try at home serviceable"
          : "Product card try at home not serviceable",
        location_id: locationId,
        promo_id: value,
        promo_name: nearest ? storeLabel(nearest) : "no store nearby",
        // Says whether the shopper typed this pincode or we already had it, so
        // the skipped-gate path can be told apart in reporting.
        promo_position: auto ? "saved pincode" : "entered pincode",
      });
    } catch {
      // A lookup that failed has to land somewhere the shopper can act. On the
      // typed path that is the step they are already standing on; on the
      // automatic one there is no such step yet, so fall back to the gate with
      // their pincode already in the field.
      setPincodeError("We could not check that pincode. Please try again.");
      if (auto) setStep("pincode");
    } finally {
      setLooking(false);
    }
  };

  // Clears the gate on the shopper's behalf, once per opening. Guarded by a ref
  // rather than a dependency list because it must not run twice — StrictMode
  // mounts effects twice in development, and a second lookup would re-push the
  // serviceability event.
  const autoCheckedRef = React.useRef(false);
  React.useEffect(() => {
    if (autoCheckedRef.current || !knownPincode) return;
    autoCheckedRef.current = true;
    checkPincode(knownPincode, { auto: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [knownPincode]);

  const payloadFor = (values) => ({
    appointmentType: activeType,
    // Name and email come from the form, not the account: a signed-out shopper
    // has neither on file, and a lead that is only a phone number leaves the
    // store team with nothing to go on.
    name: values.name,
    phone: values.phone,
    email: values.email,
    pincode: activeIsTryAtHome ? pincode : "",
    categories: values.categories,
    storeName: store ? storeLabel(store) : "",
    appointmentDate: values.appointmentDate,
    appointmentTime: values.appointmentTime,
    // The piece they were looking at when they started — without it the store
    // team gets a booking off a collection page and no idea what to bring.
    productTitle: product?.title || "",
    productUrl: product?.handle
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/products/${product.handle}`
      : "",
  });

  // Takes the submitted values rather than reading `details`: this runs after an
  // await, so the closure's `details` could still be the previous one.
  const booked = (values, verifiedVia) => {
    flow.complete({ ...payloadFor(values), verifiedVia });
    pushPromoClick({
      ...promoProduct,
      creative_name: `Product card ${activeIsTryAtHome ? "try at home" : "video call"} booked`,
      location_id: locationId,
      promo_id: activeIsTryAtHome ? pincode : "video_call",
      promo_name: product?.title || "",
      ...appointmentPromoDetails(payloadFor(values)),
    });
    setStep("success");
  };

  const submitForm = () => {
    const values = form.collect();
    if (!values) return;
    setDetails(values);
    (async () => {
      const next = await flow.begin(values.phone, payloadFor(values));
      if (!openRef.current) return;
      if (next === "otp") setStep("otp");
      else if (next === "verified") booked(values, "session");
    })();
  };

  const verify = async (code) => {
    if (!details) return;
    if (await flow.confirm(details.phone, code, payloadFor(details))) booked(details, "otp");
  };

  const backToPincode = () => {
    setStep("pincode");
    setStore(null);
    // Re-checking a pincode reopens the home-trial question, so a video call
    // taken as a fallback for the OLD pincode must not stick.
    setVideoFallback(false);
  };

  const skipsOtp = !!flow.isVerifiedNumber?.(form.phone);

  // Only the form step carries a sticky footer. Every other step renders its own
  // call to action inline, and a second button under it would read as the one
  // that actually submits.
  const footer =
    step === "form" ? (
      <div className="flex flex-col gap-2.5">
        {flow.error && <p className="text-[11px] text-red-500 font-figtree">{flow.error}</p>}
        {skipsOtp ? <VerifiedNote name={flow.account?.name} /> : <SecureNote />}
        <PrimaryButton onClick={submitForm} loading={flow.sending}>
          {skipsOtp ? "Confirm Booking" : "Continue"}
        </PrimaryButton>
      </div>
    ) : null;

  return (
    <SideDrawer open={open} onClose={onClose} title={TITLES[activeType]} footer={footer}>
      {/* The gate, clearing itself. Deliberately a panel rather than a spinner
          alone: a drawer that opens onto nothing but a spinner reads as slow,
          whereas one that says what it is doing reads as working. */}
      {step === "checking" && (
        <div className="flex flex-col items-center justify-center gap-2.5 py-10">
          <Loader2 size={20} className="animate-spin text-primary" />
          <p className="text-xs text-zinc-500 font-figtree text-center">
            Checking home trial availability for {pincode}…
          </p>
        </div>
      )}

      {step === "pincode" && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-zinc-500 font-figtree">
            Home trials are run out of our stores. Tell us where you are and we will check.
          </p>
          <PincodeStep
            value={pincode}
            onChange={setPincode}
            onSubmit={checkPincode}
            loading={looking}
            error={pincodeError}
          />
        </div>
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
          {/* Stays in this drawer rather than handing off to another one: the
              page can switch to its Virtual Shop card because that card is
              already on screen, but here there is nowhere to hand off TO. */}
          <PrimaryButton
            onClick={() => {
              setVideoFallback(true);
              setStep("form");
            }}
          >
            Book Video Call
          </PrimaryButton>
        </div>
      )}

      {step === "form" && (
        <SlotBookingFields
          form={form}
          intro={
            store ? (
              <div className="flex flex-col gap-2.5">
                <AvailabilityNote store={store} />
                {/* The pincode is still theirs to change from here — it was on
                    the step this form replaced, and dropping it would strand
                    anyone who mistyped it. */}
                <PincodeChip pincode={pincode} onChange={backToPincode} />
              </div>
            ) : null
          }
          showCategories={activeIsTryAtHome && !!store}
        />
      )}

      {step === "otp" && (
        <OtpStep
          idPrefix={`card-${activeIsTryAtHome ? "tryhome" : "video"}`}
          phone={details?.phone}
          onVerify={verify}
          onResend={() => flow.resend(details?.phone)}
          onBack={() => setStep("form")}
          verifying={flow.verifying}
          error={flow.error}
        />
      )}

      {step === "success" && (
        <SuccessStep
          message={
            activeIsTryAtHome
              ? `Your home trial is scheduled for ${details?.appointmentDateLabel} at ${details?.appointmentTime}. Our executive will get in touch to confirm the details.`
              : `Your video call is scheduled for ${details?.appointmentDateLabel} at ${details?.appointmentTime}. Our executive will get in touch with the call details.`
          }
          ctaLabel="View Product"
          ctaHref={product?.handle ? `/products/${product.handle}` : "/collections/fast-shipping"}
        />
      )}
    </SideDrawer>
  );
}
