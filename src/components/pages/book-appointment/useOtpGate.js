"use client";

// ─────────────────────────────────────────────────────────────────────────────
// The OTP gate every Book Appointment journey passes through.
//
// The flow doc is explicit about why this step exists: it "filters out the spam
// leads and only send verified leads to the team". So the webhook fires HERE,
// after verify-otp succeeds — never when the form is merely submitted.
//
// verify-otp answers `LOGIN` for a known customer and `REGISTER_REQUIRED` for a
// new one; both are a 200 and both mean the number is verified. Only a bad or
// expired code throws. We deliberately do not sign the shopper in — booking an
// appointment should not silently swap their session.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import { sendOtpApi, verifyOtpApi } from "@/lib/api";
import { submitAppointmentLead } from "@/lib/bookAppointment";

export function useOtpGate() {
  const [sending, setSending] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [error, setError] = React.useState("");

  const send = React.useCallback(async (phone) => {
    setError("");
    setSending(true);
    try {
      await sendOtpApi(phone);
      return true;
    } catch (err) {
      setError(err?.message || "Could not send the OTP. Please try again.");
      return false;
    } finally {
      setSending(false);
    }
  }, []);

  /**
   * Verify the code, then hand the lead to the webhook.
   *
   * A webhook that fails must not strand a shopper who did everything right:
   * the code was verified, so the booking is confirmed either way and the
   * failure is logged rather than surfaced.
   */
  const verify = React.useCallback(async (phone, code, payload) => {
    setError("");
    if (!code || code.length !== 4) {
      setError("Please enter the 4-digit OTP.");
      return false;
    }
    setVerifying(true);
    try {
      await verifyOtpApi(phone, code);
    } catch (err) {
      setError(err?.message || "Invalid or expired OTP. Please try again.");
      setVerifying(false);
      return false;
    }

    try {
      await submitAppointmentLead(payload);
    } catch (err) {
      console.error("[book-appointment] lead webhook failed", err);
    }
    setVerifying(false);
    return true;
  }, []);

  return { send, verify, sending, verifying, error, setError };
}
