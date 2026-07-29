"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { OtpSpinAuth } from "@/components/auth/OtpSpinAuth";

export default function RegisterPage() {
  const { user } = useSelector((state) => state.user);
  const router = useRouter();
  const [step, setStep] = useState("register");

  // A fresh signup logs the user in while the reward coupon is still on screen.
  // Hold the redirect until they leave that screen themselves.
  const showingReward = step === "success";

  useEffect(() => {
    if (user && !showingReward) {
      router.replace("/admin");
    }
  }, [user, showingReward, router]);

  if (user && !showingReward) return null;

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-[#FDFBF9] px-4 py-12">
      <div className="w-full max-w-[800px]">
        <OtpSpinAuth
          initialStep={step}
          onStepChange={setStep}
          onSuccess={() => router.push("/admin")}
          showCloseButton={false}
        />
      </div>
    </div>
  );
}
