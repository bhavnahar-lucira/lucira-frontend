/**
 * GyFTR EPAY gift-card API helpers.
 *
 * All calls go through the lucira-backend proxy (routes/gyftr) — no GyFTR
 * credentials ever touch the browser. See lib/gyftr.js on the backend for
 * the encryption layer and endpoint mapping.
 */

import { apiFetch } from "@/lib/api";

const normalizeMobile = (mobile = "") => String(mobile || "").replace(/\D/g, "").slice(-10);

export const generateGyftrOtp = (mobile) =>
  apiFetch("/api/gyftr/generate-otp", {
    method: "POST",
    body: JSON.stringify({ mobile: normalizeMobile(mobile) }),
  });

export const getGyftrBalance = (mobile, otp) =>
  apiFetch("/api/gyftr/balance", {
    method: "POST",
    body: JSON.stringify({ mobile: normalizeMobile(mobile), otp }),
  });

export const listGyftrVouchers = (mobile, otp) =>
  apiFetch("/api/gyftr/vouchers", {
    method: "POST",
    body: JSON.stringify({ mobile: normalizeMobile(mobile), otp }),
  });

export const rechargeGyftrWallet = ({ mobile, voucherNumber, voucherType = "P" }) =>
  apiFetch("/api/gyftr/recharge", {
    method: "POST",
    body: JSON.stringify({ mobile: normalizeMobile(mobile), voucherNumber, voucherType }),
  });

// NOTE: not called from any page yet — order-creation on successful
// redemption isn't wired up. See GiftCardPanel.jsx for details before
// hooking this into a real checkout button.
export const redeemGyftrBalance = ({ mobile, amount, billNo, billValue, porderId }) =>
  apiFetch("/api/gyftr/redeem", {
    method: "POST",
    body: JSON.stringify({ mobile: normalizeMobile(mobile), amount, billNo, billValue, porderId }),
  });

export const getGyftrTxnStatus = ({ porderId, txnId }) =>
  apiFetch("/api/gyftr/status", {
    method: "POST",
    body: JSON.stringify({ porderId, txnId }),
  });
