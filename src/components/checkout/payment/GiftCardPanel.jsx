"use client";

/**
 * GyFTR EPAY gift-card verification panel.
 *
 * Handles the read-only half of the flow: mobile -> OTP -> balance -> voucher
 * list / manual top-up. Reports the verified balance up via onBalanceChange
 * so the parent payment page can decide whether the gift card covers the
 * order total.
 *
 * Deliberately does NOT call redeemGyftrBalance or create an order itself.
 * Wiring "redeem then create the Shopify order" still needs: production
 * GyFTR credentials, a fix for the OTP-delivery bug GyFTR is chasing (mobile
 * 9136955445, code-25 "Invalid User details" as of 20 Aug 2026), and the
 * final per-category discount % from GyFTR before it's safe to let a real
 * customer's gift card balance actually get debited here.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import {
  generateGyftrOtp,
  getGyftrBalance,
  listGyftrVouchers,
  rechargeGyftrWallet,
} from "@/lib/gyftr";

export default function GiftCardPanel({ defaultMobile = "", orderAmount = 0, onBalanceChange }) {
  const [mobile, setMobile] = useState(defaultMobile);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [balance, setBalance] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [manualVoucher, setManualVoucher] = useState("");
  const [rechargingVoucher, setRechargingVoucher] = useState(false);

  const reportBalance = (nextBalance) => {
    setBalance(nextBalance);
    onBalanceChange?.(nextBalance);
  };

  const handleSendOtp = async () => {
    const digits = mobile.replace(/\D/g, "");
    if (digits.length !== 10) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }

    setSendingOtp(true);
    try {
      await generateGyftrOtp(digits);
      setOtpSent(true);
      toast.success("OTP sent to your mobile number");
    } catch (err) {
      toast.error(err.message || "Could not send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      toast.error("Enter the OTP you received");
      return;
    }

    setVerifying(true);
    try {
      const result = await getGyftrBalance(mobile, otp.trim());
      reportBalance(result.balance);

      try {
        const voucherResult = await listGyftrVouchers(mobile, otp.trim());
        setVouchers(voucherResult.vouchers || []);
      } catch (voucherErr) {
        // Non-fatal — balance is already verified, voucher list is a bonus.
        console.warn("[GiftCardPanel] Could not list vouchers:", voucherErr.message);
      }
    } catch (err) {
      toast.error(err.message || "Could not verify OTP");
    } finally {
      setVerifying(false);
    }
  };

  const handleAddVoucher = async (voucherNumber) => {
    if (!voucherNumber.trim()) {
      toast.error("Enter a voucher number");
      return;
    }

    setRechargingVoucher(true);
    try {
      const result = await rechargeGyftrWallet({ mobile, voucherNumber: voucherNumber.trim() });
      reportBalance(result.balance);
      setManualVoucher("");
      toast.success("Gift card added to your balance");
    } catch (err) {
      toast.error(err.message || "Could not add this gift card");
    } finally {
      setRechargingVoucher(false);
    }
  };

  const balanceCoversOrder = balance !== null && balance >= orderAmount;

  return (
    <div className="space-y-4 p-4 rounded-[6px] border border-[#EBE1D7] bg-[#FDFBF9]">
      {balance === null ? (
        <div className="space-y-3">
          <Label htmlFor="gyftr-mobile" className="text-[0.85rem] font-figtree text-black/80">
            Mobile number linked to your gift card
          </Label>
          <div className="flex gap-2">
            <Input
              id="gyftr-mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit mobile number"
              className="h-11"
              disabled={otpSent}
            />
            {!otpSent && (
              <Button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="h-11 shrink-0 bg-[#5A413F] hover:bg-[#4A312F] text-white"
              >
                {sendingOtp ? "Sending..." : "Send OTP"}
              </Button>
            )}
          </div>

          {otpSent && (
            <div className="flex gap-2">
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Enter OTP"
                className="h-11"
              />
              <Button
                type="button"
                onClick={handleVerifyOtp}
                disabled={verifying}
                className="h-11 shrink-0 bg-[#5A413F] hover:bg-[#4A312F] text-white"
              >
                {verifying ? "Verifying..." : "Verify"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="font-figtree text-[0.9rem] text-black">Gift card balance</p>
            <p className="font-figtree font-medium text-[1rem] text-black">
              ₹{balance.toLocaleString("en-IN")}
            </p>
          </div>

          {!balanceCoversOrder && (
            <p className="font-figtree text-[0.8rem] text-amber-700">
              This balance doesn&apos;t cover the full order (₹{orderAmount.toLocaleString("en-IN")} due).
              Add another gift card below to top it up.
            </p>
          )}

          {vouchers.length > 0 && (
            <div className="space-y-2">
              <p className="font-figtree text-[0.8rem] text-black/70">Gift cards on this number</p>
              {vouchers.map((v) => (
                <div key={v.VoucherGuid} className="flex justify-between text-[0.85rem] font-figtree">
                  <span>{v.BrandName} — {v.VoucherNumber}</span>
                  <span>₹{Number(v.Value || 0).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={manualVoucher}
              onChange={(e) => setManualVoucher(e.target.value)}
              placeholder="Have another gift card code?"
              className="h-11"
            />
            <Button
              type="button"
              onClick={() => handleAddVoucher(manualVoucher)}
              disabled={rechargingVoucher}
              className="h-11 shrink-0 bg-[#5A413F] hover:bg-[#4A312F] text-white"
            >
              {rechargingVoucher ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
