"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { pushPaymentFailure } from "@/lib/gtm";

export default function FailurePage() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // 1. Read failure data stored from Payment Page
    const storedData = window.localStorage.getItem("gtm_payment_failure_data");
    
    if (!storedData) {
      // Prevent direct access - redirect to home
      router.replace("/");
      return;
    }

    try {
      const failureData = JSON.parse(storedData);
      
      // 2. Fire the Payment Failure Event
      pushPaymentFailure(failureData);
      
      // 3. Clear storage to prevent duplicate firing on refresh
      window.localStorage.removeItem("gtm_payment_failure_data");
      setIsVerifying(false);
    } catch (err) {
      console.error("GTM Failure tracking failed:", err);
      router.replace("/");
    }
  }, [router]);

  if (isVerifying) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-red-100 p-6 rounded-full mb-6 text-red-600">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
      </div>
      <h1 className="text-3xl font-bold mb-2">Order Failed</h1>
      <p className="text-zinc-600 mb-8 max-w-md">We're sorry, but there was an issue processing your order. Please try again or contact support.</p>
      <div className="flex gap-4">
        <Link href="/checkout/cart" className="bg-black text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors">
          Return to Cart
        </Link>
        <Link href="/" className="border border-zinc-300 px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-zinc-100 transition-colors">
          Back to Home
        </Link>
      </div>
    </div>
  );
}