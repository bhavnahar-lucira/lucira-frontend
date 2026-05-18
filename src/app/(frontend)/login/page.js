"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { OtpSpinAuth } from "@/components/auth/OtpSpinAuth";

export default function LoginPage() {
  const { user } = useSelector((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/admin");
    }
  }, [user, router]);

  if (user) return null;

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-[#FDFBF9] px-4 py-12">
      <div className="w-full max-w-[800px]">
        <OtpSpinAuth 
          initialStep="login" 
          onSuccess={() => router.push("/admin")}
          showCloseButton={false}
        />
      </div>
    </div>
  );
}
