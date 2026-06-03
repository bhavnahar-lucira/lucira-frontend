"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { Loader2 } from "lucide-react";

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", icon: "⚡" },
  { id: "credit", label: "Credit Card", icon: "💳" },
  { id: "debit", label: "Debit Card", icon: "💳" },
  { id: "netbanking", label: "Net Banking", icon: "🏦" },
];

function loadRazorpayScript() {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function SchemePaymentPage() {
  const router = useRouter();
  const user = useSelector((state) => state.user.user);

  const [enrollment, setEnrollment] = useState(null);
  const [method, setMethod] = useState("upi");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/schemes");
      return;
    }

    // Retrieve enrollment data from session storage
    const stored = sessionStorage.getItem("scheme_enrollment");
    if (!stored) {
      toast.error("Enrollment data not found. Please start from enrollment page.");
      router.push("/schemes/enroll");
      return;
    }

    try {
      setEnrollment(JSON.parse(stored));
    } catch (e) {
      toast.error("Failed to load enrollment data");
      router.push("/schemes/enroll");
    }
  }, [user, router]);

  const handleInitiatePayment = async () => {
    if (!enrollment) {
      toast.error("Enrollment data missing");
      return;
    }

    setLoading(true);
    try {
      // Load Razorpay script using the shared helper
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout");
      }

      // Step 1: Create subscription with enrollment data
      const subscriptionRes = await apiFetch("/api/schemes/razorpay/subscription", {
        method: "POST",
        body: JSON.stringify({
          amount: enrollment.amount,
          tenure: 9,
          customer_mobile: user?.phone || user?.mobile,
          customer_name: user?.name,
          customer_email: user?.email,
          customer: {
            mobile: user?.phone || user?.mobile,
            name: user?.name,
            email: user?.email,
          },
        }),
      });

      const subscriptionData = subscriptionRes;

      if (!subscriptionData.subscription_id) {
        throw new Error("No subscription created");
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key: subscriptionData.key_id,
        subscription_id: subscriptionData.subscription_id,
        name: "Lucira Jewelry",
        description: "Vault of Dreams Scheme",
        prefill: {
          name: user?.name || "Customer",
          contact: user?.phone || user?.mobile,
          email: user?.email,
        },
        handler: async function handleSuccess(response) {
          try {
            setLoading(true);
            // Step 3: Verify payment signature
            const verifyRes = await apiFetch("/api/schemes/razorpay/verify", {
              method: "POST",
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            // Step 4: Create enrollment record
            const enrollmentRes = await apiFetch("/api/schemes/enrollment", {
              method: "POST",
              body: JSON.stringify({
                customer_id: user?.id,
                mobile: user?.phone || user?.mobile,
                amount: enrollment.amount,
                nominee_name: enrollment.nominee_name,
                nominee_age: enrollment.nominee_age,
                nominee_relation: enrollment.nominee_relation,
                address: enrollment.address,
                pincode: enrollment.pincode,
                city: enrollment.city,
                state: enrollment.state,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_payment_id: response.razorpay_payment_id,
              }),
            });

            // Clear session and redirect
            sessionStorage.removeItem("scheme_enrollment");
            toast.success("Payment successful! Your scheme is now active.");
            router.push("/schemes/payment-success");
          } catch (err) {
            toast.error(err.message || "Failed to complete enrollment");
            console.error("Payment completion error:", err);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.info("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on("payment.failed", function (response) {
        toast.error(response.error?.description || "Payment failed. Please try again.");
        setLoading(false);
      });

      razorpay.open();
    } catch (err) {
      toast.error(err.message || "Failed to initiate payment");
      console.error("Payment initiation error:", err);
      setLoading(false);
    }
  };

  if (!enrollment) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 text-center">
        <Loader2 className="inline animate-spin mb-4" size={32} />
        <p>Loading payment details...</p>
      </div>
    );
  }

  const monthlyAmount = enrollment.amount;
  const totalInstallments = 9;
  const bonus = monthlyAmount;
  const totalValue = monthlyAmount * 10;

  const formatINR = (value) => new Intl.NumberFormat("en-IN").format(value);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LEFT */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Payment Methods</h2>
          <RadioGroup value={method} onValueChange={setMethod} className="space-y-4">
            {PAYMENT_METHODS.map((m) => (
              <Card
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`cursor-pointer border py-4 ${method === m.id ? "border-primary" : ""}`}
              >
                <CardContent className="flex justify-between px-4 items-center">
                  <div className="flex gap-3">
                    <span className="text-2xl mr-3">{m.icon}</span>
                    <Label className="cursor-pointer">{m.label}</Label>
                  </div>
                  <RadioGroupItem value={m.id} id={m.id} />
                </CardContent>
              </Card>
            ))}
          </RadioGroup>
          <div className="mt-8 p-4 border border-primary/30 rounded-lg bg-primary/5 mb-40 md:mb-0">
            <div className="flex items-start gap-3">
              <span className="text-primary w-5 h-5 mt-1 shrink-0 font-bold">i</span>
              <div>
                <h3 className="font-semibold">Seamless Monthly Auto-Pay</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Your Vault of Dreams contributions will be securely auto-debited each month 
                  through trusted payment partners — ensuring a seamless, worry-free journey 
                  towards your dream jewelry.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="mb-16">
          <h2 className="hidden md:block text-lg font-semibold mb-4">Premium Summary</h2>
          <Card className="bg-[#f7f3f2]">
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between">
                <span>Monthly Premium</span>
                <span className="font-semibold">₹{formatINR(monthlyAmount)}</span>
              </div>
              <Button
                onClick={handleInitiatePayment}
                disabled={loading}
                className="w-full h-14 bg-primary text-white cursor-pointer rounded-md"
              >
                {loading ? "Processing..." : "PAY SECURELY"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
