"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { OtpSpinAuth } from "@/components/auth/OtpSpinAuth";
import { withUtms, safeInternalPath } from "@/lib/utm";

// Where to go once logged in. Default is /admin exactly as before. When a gated
// page sent the visitor here (?redirect=/admin/orders?utm_…) go back to that
// page instead, and carry the utm_* from this /login URL along so the campaign
// stays on the URL for the whole journey. Only same-origin paths are honoured.
const postLoginTarget = () => {
  if (typeof window === "undefined") return "/admin";
  const redirect = new URLSearchParams(window.location.search).get("redirect");
  return withUtms(safeInternalPath(redirect, "/admin"));
};

export default function LoginPage() {
  const { user } = useSelector((state) => state.user);
  const router = useRouter();
  const [step, setStep] = useState("login");

  // Registering from here logs the user in while the reward coupon is still on
  // screen. Hold the redirect until they leave that screen themselves.
  const showingReward = step === "success";

  useEffect(() => {
    if (user && !showingReward) {
      router.replace(postLoginTarget());
    }
  }, [user, showingReward, router]);

  if (user && !showingReward) return null;

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-[#FDFBF9] px-4 py-12">
      <div className="w-full max-w-[800px]">
        <OtpSpinAuth
          initialStep={step}
          onStepChange={setStep}
          onSuccess={() => router.push(postLoginTarget())}
          showCloseButton={false}
        />
      </div>
    </div>
  );
}
