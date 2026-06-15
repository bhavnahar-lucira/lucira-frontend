"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { setCustomer } from "@/redux/slices/customerSlice";
import { setEnrollment } from "@/redux/slices/enrollmentSlice";
import { useState } from "react";
import { toast } from "react-toastify";

export function EnrollModal({ open, onOpenChange, amount }) {
  const router = useRouter();
  const dispatch = useDispatch();

  /* ================= STATE ================= */
  const [step, setStep] = useState("form");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= HELPERS ================= */
  const validMobile = () => /^[6-9]\d{9}$/.test(mobile);

  const resetModal = () => {
    setStep("form");
    setFirstName("");
    setLastName("");
    setMobile("");
    setOtp("");
    setOtpVerified(false);
    setLoading(false);
  };

  /* ================= SEND OTP ================= */
  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim())
      return toast.error("Enter first and last name");
    if (!validMobile()) return toast.error("Enter valid mobile");

    setLoading(true);

    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile }),
    });

    setLoading(false);

    if (!res.ok) return toast.error("Failed to send OTP");

    toast.success("OTP sent");
    setStep("otp");
  };

  /* ================= VERIFY OTP ================= */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (otp.length !== 4) return toast.error("Invalid OTP");

    setLoading(true);

    const otpRes = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, otp }),
    });

    if (!otpRes.ok) {
      setLoading(false);
      return toast.error("Incorrect OTP");
    }

    setOtpVerified(true);

    /* 🔍 CHECK EXISTING CUSTOMER */
    const checkRes = await fetch("/api/customer/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile }),
    });

    let customer = (await checkRes.json())?.Entities?.[0];

    /* 🆕 CREATE IF NOT EXISTS */
    if (!customer?.party_id) {
      const createRes = await fetch("/api/customer/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: mobile,
        }),
      });

      const created = await createRes.json();
      customer = {
        party_id: created.EntityId,
        mobile,
        party_name: `${firstName} ${""} ${lastName}`,
      };
    }

    /* ================= REDUX ================= */
    const customerPayload = {
      party_id: customer.party_id,
      mobile: customer.mobile,
      name: customer.party_name,
    };

    const enrollmentPayload = {
      amount,
      tenure: 9,
    };

    dispatch(setCustomer(customerPayload));
    dispatch(setEnrollment(enrollmentPayload));

    /* ================= SESSION ================= */
    await fetch("/api/session/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...customerPayload,
        enrollment_draft: enrollmentPayload,
      }),
    });

    setLoading(false);
    onOpenChange(false);
    resetModal();
    router.push("/enroll");
  };

  /* ================= UI ================= */
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetModal();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === "form" ? "Enter Details" : "Verify OTP"}
          </DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <Input
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <Input
              placeholder="Mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
            <Button type="submit" disabled={loading} className="cursor-pointer">
              {loading ? "Sending..." : "Send OTP"}
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <Input
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <Button type="submit" disabled={loading} className="cursor-pointer">
              {loading ? "Verifying..." : "Verify & Continue"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
