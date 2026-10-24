"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { verifyPhonePePayment } from "@/lib/api";
import { clearCart, removeCoupon, removePoints } from "@/redux/features/cart/cartSlice";
import { toast } from "react-toastify";
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

function PhonePeCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { accessToken } = useSelector((state) => state.user);

  const [status, setStatus] = useState("verifying"); // 'verifying' | 'completed' | 'failed' | 'pending'
  const [errorMessage, setErrorMessage] = useState("");
  const [attempts, setAttempts] = useState(0);

  const isCheckingRef = useRef(false);

  const merchantOrderId = searchParams.get("merchantOrderId") || searchParams.get("orderId") || (() => {
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(window.localStorage.getItem("phonepe_pending_order") || "{}");
        return stored?.merchantOrderId || "";
      } catch {
        return "";
      }
    }
    return "";
  })();

  const checkStatus = async () => {
    if (!merchantOrderId) {
      setStatus("failed");
      setErrorMessage("No order identifier found. Please check your payment status or contact support.");
      return;
    }

    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      const response = await verifyPhonePePayment({ merchantOrderId }, accessToken);

      if (response?.success && response?.shopifyOrderName) {
        setStatus("completed");

        // Clear redux cart and applied discounts
        dispatch(clearCart());
        dispatch(removeCoupon());
        dispatch(removePoints());

        // Update GTM transaction_id if present
        try {
          const storedGtm = window.localStorage.getItem("gtm_purchase_data");
          if (storedGtm) {
            const parsed = JSON.parse(storedGtm);
            parsed.transaction_id = merchantOrderId;
            window.localStorage.setItem("gtm_purchase_data", JSON.stringify(parsed));
          }
        } catch (e) {
          console.warn("GTM data update warning:", e);
        }

        // Notify parent if embedded in iframe popup
        if (typeof window !== "undefined" && window.self !== window.top) {
          try {
            window.parent.postMessage({
              type: "PHONEPE_PAYMENT_COMPLETED",
              orderName: response.shopifyOrderName,
            }, "*");
          } catch (e) {
            console.warn("postMessage warning:", e);
          }
        }

        window.localStorage.removeItem("phonepe_pending_order");
        toast.success(`Order placed successfully: ${response.shopifyOrderName}`);

        setTimeout(() => {
          router.replace(`/success?orderName=${encodeURIComponent(response.shopifyOrderName)}`);
        }, 800);
        return;
      }

      if (response?.state === "FAILED") {
        setStatus("failed");
        setErrorMessage(response.message || "Your payment was not completed on PhonePe.");
        window.localStorage.removeItem("phonepe_pending_order");

        if (typeof window !== "undefined" && window.self !== window.top) {
          try {
            window.parent.postMessage({
              type: "PHONEPE_PAYMENT_FAILED",
              message: response.message || "Your payment was not completed on PhonePe.",
            }, "*");
          } catch (e) {
            console.warn("postMessage warning:", e);
          }
        }

        toast.error("Payment failed. Please try again.");
        return;
      }

      // If pending, allow polling
      setStatus("pending");
      setAttempts((prev) => prev + 1);
    } catch (err) {
      console.error("[PhonePe Callback] Verification error:", err);
      setStatus("pending");
      setAttempts((prev) => prev + 1);
    } finally {
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    checkStatus();
  }, [merchantOrderId]);

  // Polling mechanism if status is pending (up to 8 attempts, 3s apart)
  useEffect(() => {
    if (status === "pending" && attempts < 8) {
      const timer = setTimeout(() => {
        checkStatus();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, attempts]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white border border-[#EBE1D7] rounded-xl p-8 shadow-sm text-center">
        {status === "verifying" && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF0E6] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#5A413F] animate-spin" />
            </div>
            <h2 className="text-xl font-figtree font-semibold text-black">
              Verifying UPI Payment
            </h2>
            <p className="text-sm font-figtree text-zinc-600">
              Please wait while we confirm your payment with PhonePe. Do not close or refresh this page.
            </p>
          </div>
        )}

        {status === "pending" && attempts < 8 && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF0E6] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#5A413F] animate-spin" />
            </div>
            <h2 className="text-xl font-figtree font-semibold text-black">
              Confirming Transaction
            </h2>
            <p className="text-sm font-figtree text-zinc-600">
              Waiting for confirmation from your UPI app (Attempt {attempts} of 8)...
            </p>
          </div>
        )}

        {status === "pending" && attempts >= 8 && (
          <div className="space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <RefreshCw className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-figtree font-semibold text-black">
              Payment Confirmation In Progress
            </h2>
            <p className="text-sm font-figtree text-zinc-600">
              We are still waiting for confirmation from your bank. If the amount has been debited, your order will be confirmed shortly.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAttempts(0);
                  checkStatus();
                }}
                className="w-full bg-[#5A413F] hover:bg-[#4A312F] text-white py-3 rounded-md font-figtree font-medium transition-colors cursor-pointer"
              >
                Check Status Again
              </button>
              <Link
                href="/checkout/payment"
                className="w-full border border-zinc-200 py-3 rounded-md font-figtree text-sm font-medium hover:bg-zinc-50 transition-colors"
              >
                Back to Payment
              </Link>
            </div>
          </div>
        )}

        {status === "completed" && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-figtree font-semibold text-black">
              Payment Successful!
            </h2>
            <p className="text-sm font-figtree text-zinc-600">
              Redirecting you to the order confirmation page...
            </p>
          </div>
        )}

        {status === "failed" && (
          <div className="space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center text-red-600">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-figtree font-semibold text-black">
              Payment Failed
            </h2>
            <p className="text-sm font-figtree text-zinc-600">
              {errorMessage || "The payment could not be processed. If any amount was deducted, it will be refunded automatically by your bank."}
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/checkout/payment"
                className="w-full bg-[#5A413F] hover:bg-[#4A312F] text-white py-3 rounded-md font-figtree font-medium transition-colors text-center"
              >
                Retry Payment
              </Link>
              <Link
                href="/checkout/cart"
                className="w-full border border-zinc-200 py-3 rounded-md font-figtree text-sm font-medium hover:bg-zinc-50 transition-colors text-center"
              >
                Return to Cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PhonePeCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#5A413F] animate-spin" />
        </div>
      }
    >
      <PhonePeCallbackContent />
    </Suspense>
  );
}
