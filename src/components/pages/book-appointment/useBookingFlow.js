"use client";

// ─────────────────────────────────────────────────────────────────────────────
// The submit path every Book Appointment journey shares.
//
// Three things happen here, in this order:
//
//   1. A shopper who is already signed in, booking on the number their account
//      is registered with, skips the OTP entirely — that number was verified
//      when they signed in, and re-verifying it buys nothing. Change the number
//      to one the account does not own and the OTP comes straight back: the
//      point of the step is proving the number belongs to whoever is booking.
//
//   2. Everyone else verifies over OTP, exactly as the flow doc requires.
//
//   3. A verified number with no Shopify customer behind it gets one created —
//      the verification has already done the hard part, so the same OTP that
//      cleans the lead also opens the account. Same registerCustomer path the
//      PDP coupon unlock and checkout auth use, tagged so these leads are
//      identifiable.
//
// The lead webhook fires once, from `complete`, which the card calls when it is
// about to show the success state — never from `begin` or `confirm`.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import { useDispatch } from "react-redux";
import { useAuth } from "@/hooks/useAuth";
import { login, setAvatar } from "@/redux/features/user/userSlice";
import { mergeCart } from "@/redux/features/cart/cartSlice";
import { mergeGuestWishlist } from "@/redux/features/wishlist/wishlistSlice";
import { apiFetch, sendOtpApi, verifyOtpApi, registerCustomer } from "@/lib/api";
import { submitAppointmentLead } from "@/lib/bookAppointment";
import { pushAppointmentConfirmed } from "@/lib/gtm";

/**
 * Reduce any stored phone shape to the bare 10 digits the forms use.
 *
 * Take the LAST ten rather than stripping a leading "91": Indian mobiles can
 * legitimately begin with 91 (9123456789), and a prefix strip would eat the
 * first two digits of a perfectly good number.
 */
export function localPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

const newSessionId = () => `session_${Math.random().toString(36).substring(2, 15)}`;

/** The booking, in the flat shape the GTM/Meta tags read. */
const appointmentEventData = (payload = {}) => ({
  appointment_type: payload.appointmentType || "",
  store_name: payload.storeName || "",
  appointment_date: payload.appointmentDate || "",
  appointment_time: payload.appointmentTime || "",
  purpose_of_visit: payload.purpose || "",
  product_categories: (payload.categories || []).join(", "),
  pincode: payload.pincode || "",
  phone: payload.phone || "",
  email: (payload.email || "").trim(),
});

/**
 * The booking details every "… booked" promoClick carries alongside its
 * creative/promo keys. Deliberately no phone or email: promoClick feeds GA4,
 * which does not allow PII — those live on appointment_confirmed only.
 */
export const appointmentPromoDetails = (payload = {}) => ({
  appointment_type: payload.appointmentType || "",
  appointment_date: payload.appointmentDate || "",
  appointment_time: payload.appointmentTime || "",
  purpose_of_visit: payload.purpose || "",
  product_categories: (payload.categories || []).join(", "),
});

export function useBookingFlow() {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();

  const [sending, setSending] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [error, setError] = React.useState("");

  // What we already know about whoever is booking, in the shape the forms want.
  const account = React.useMemo(() => {
    const phone = localPhone(user?.mobile || user?.phone);
    const name =
      [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() || user?.name || "";
    // Placeholder addresses minted by the auto-register paths are not worth
    // prefilling back into a form that asks for a real one.
    const email = /@lucirajewelry\.com$|@gmail\.com$/.test(user?.email || "")
      && /^\d{10,12}@/.test(user?.email || "")
      ? ""
      : user?.email || "";
    return {
      signedIn: !!isAuthenticated && !!user,
      name: name === "User Customer" ? "" : name,
      phone,
      email,
    };
  }, [user, isAuthenticated]);

  /** Is this the number the signed-in account already proved it owns? */
  const isVerifiedNumber = React.useCallback(
    (phone) => account.signedIn && !!account.phone && account.phone === localPhone(phone),
    [account]
  );

  // Bring the newly verified customer into the session the same way every other
  // OTP surface on the site does. None of it is allowed to fail the booking —
  // or to delay it: only the login dispatch is awaited, because only it changes
  // what the shopper sees next. The avatar, cart and wishlist round-trips run in
  // the background, so a slow merge cannot hold the confirmation screen back.
  const establishSession = React.useCallback(
    (data) => {
      const customer = data?.user || data?.customer;
      if (!customer || !data?.accessToken) return;
      try {
        dispatch(login({ user: customer, accessToken: data.accessToken }));
      } catch (err) {
        console.error("[book-appointment] session dispatch failed", err);
        return;
      }
      apiFetch("/api/customer/profile/avatar")
        .then((av) => {
          if (av?.avatar) dispatch(setAvatar(av.avatar));
        })
        .catch(() => {
          /* avatar is cosmetic */
        });
      dispatch(mergeCart({ userId: customer.id }))
        .unwrap()
        .catch((err) => console.error("[book-appointment] cart merge failed", err));
      dispatch(mergeGuestWishlist())
        .unwrap()
        .catch((err) => console.error("[book-appointment] wishlist merge failed", err));
    },
    [dispatch]
  );

  /**
   * Record the booking: fire the confirmation event, then the lead webhook.
   *
   * Deliberately NOT called from `begin` or `confirm`. Those two can resolve
   * after the shopper has already backed out of the flow, and a booking that
   * reaches the store team while the shopper is looking at a collapsed card —
   * with no confirmation, no slot on screen and no promoClick — is worse than
   * no booking at all. The card calls this once it knows it is still on screen
   * and is about to show the success state.
   *
   * Returns synchronously, and deliberately does not await the webhook. The
   * booking is settled the moment this is called — the shopper has verified,
   * they are still on screen, and nothing about the confirmation depends on
   * what the webhook answers, since a failure is logged rather than surfaced.
   * Awaiting it only bought a frozen button for the length of the round-trip.
   * `keepalive` on the request keeps it alive if the tab closes meanwhile.
   */
  const complete = React.useCallback((payload) => {
    pushAppointmentConfirmed(appointmentEventData(payload));
    submitAppointmentLead(payload).catch((err) => {
      console.error("[book-appointment] lead webhook failed", err);
    });
  }, []);

  /**
   * Start the submit. Returns "verified" when the number needs no OTP (the
   * caller records the booking itself), "otp" when a code is on its way, or
   * "error".
   */
  const begin = React.useCallback(
    async (phone) => {
      setError("");
      if (localPhone(phone).length !== 10) {
        setError("Enter a valid 10-digit mobile number.");
        return "error";
      }
      setSending(true);
      try {
        if (isVerifiedNumber(phone)) return "verified";
        await sendOtpApi(phone);
        return "otp";
      } catch (err) {
        setError(err?.message || "Could not send the OTP. Please try again.");
        return "error";
      } finally {
        setSending(false);
      }
    },
    [isVerifiedNumber]
  );

  /** Verify the code and register the customer if there is not one yet. */
  const confirm = React.useCallback(
    async (phone, code, payload) => {
      setError("");
      if (!code || code.length !== 4) {
        setError("Please enter the 4-digit OTP.");
        return false;
      }
      setVerifying(true);
      const sessionId = newSessionId();

      let result;
      try {
        result = await verifyOtpApi(phone, code, sessionId);
      } catch (err) {
        setError(err?.message || "Invalid or expired OTP. Please try again.");
        setVerifying(false);
        return false;
      }

      // The number is verified from here on. Anything below is best-effort:
      // failing to open an account must not lose a confirmed appointment.
      try {
        if (result?.status === "REGISTER_REQUIRED" || result?.status === "REGISTER") {
          const [first, ...rest] = (payload.name || "").trim().split(/\s+/).filter(Boolean);
          const created = await registerCustomer({
            // Empty strings let the backend apply its own defaults rather than
            // writing a made-up name onto a real customer record.
            firstName: first || "",
            lastName: rest.join(" "),
            email: payload.email || "",
            mobile: phone,
            sessionId,
            tags: "book-appointment-lead",
          });
          if (created?.status === "REGISTER_SUCCESS" || created?.status === "SUCCESS") {
            establishSession(created);
          }
        } else if (result?.status === "LOGIN" || result?.status === "SUCCESS") {
          establishSession(result);
        }
      } catch (err) {
        console.error("[book-appointment] customer create/sign-in failed", err);
      }

      setVerifying(false);
      return true;
    },
    [establishSession]
  );

  const resend = React.useCallback(async (phone) => {
    setError("");
    try {
      await sendOtpApi(phone);
      return true;
    } catch (err) {
      setError(err?.message || "Could not resend the OTP.");
      return false;
    }
  }, []);

  return {
    account,
    isVerifiedNumber,
    begin,
    confirm,
    complete,
    resend,
    sending,
    verifying,
    error,
    setError,
  };
}
