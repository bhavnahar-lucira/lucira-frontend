"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", icon: "⚡" },
  { id: "credit", label: "Credit Card", icon: "💳" },
  { id: "debit", label: "Debit Card", icon: "💳" },
  { id: "netbanking", label: "Net Banking", icon: "🏦" },
];

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
      // Load Razorpay script
      if (typeof window !== "undefined" && !window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => console.log("Razorpay loaded");
        script.onerror = () => {
          toast.error("Failed to load payment gateway");
          setLoading(false);
          return;
        };
        document.body.appendChild(script);
        
        // Wait for script to load
        await new Promise((resolve) => {
          const checkRazorpay = setInterval(() => {
            if (window.Razorpay) {
              clearInterval(checkRazorpay);
              resolve();
            }
          }, 100);
        });
      }

      // Step 1: Create subscription with enrollment data
      const subscriptionRes = await fetch("/api/schemes/razorpay/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: enrollment.amount,
          tenure: 9,
          customer_mobile: user?.phone || user?.mobile,
          customer_name: user?.name,
        }),
      });

      if (!subscriptionRes.ok) {
        const error = await subscriptionRes.json();
        throw new Error(error.error || "Failed to create subscription");
      }

      const subscriptionData = await subscriptionRes.json();

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
        handler: async (response) => {
          try {
            // Step 3: Verify payment signature
            const verifyRes = await fetch("/api/schemes/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              throw new Error("Payment verification failed");
            }

            // Step 4: Create enrollment record
            const enrollmentRes = await fetch("/api/schemes/enrollment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
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

            if (!enrollmentRes.ok) {
              throw new Error("Failed to save enrollment");
            }

            // Clear session and redirect
            sessionStorage.removeItem("scheme_enrollment");
            toast.success("Payment successful! Your scheme is now active.");
            router.push("/schemes/payment-success");
          } catch (err) {
            toast.error(err.message || "Failed to complete enrollment");
            console.error("Payment completion error:", err);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.info("Payment cancelled");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.message || "Failed to initiate payment");
      console.error("Payment initiation error:", err);
    } finally {
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

  return (
    <div className="w-full max-w-3xl mx-auto p-6 md:p-10">
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Payment
        </h1>
        <p className="text-gray-600">
          Review and confirm your enrollment payment
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        {/* Payment Methods */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Select Payment Method
              </h2>

              <RadioGroup value={method} onValueChange={setMethod}>
                <div className="space-y-4">
                  {PAYMENT_METHODS.map((m) => (
                    <div key={m.id} className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value={m.id} id={m.id} />
                      <Label htmlFor={m.id} className="flex-1 cursor-pointer">
                        <span className="text-2xl mr-3">{m.icon}</span>
                        <span className="font-medium">{m.label}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              <Button
                onClick={handleInitiatePayment}
                disabled={loading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider rounded-lg mt-8 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="inline mr-2 animate-spin" size={18} />
                    Processing...
                  </>
                ) : (
                  `Pay ₹${(monthlyAmount).toLocaleString()} Now`
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="bg-amber-50 rounded-lg p-6 border border-amber-100 h-fit">
          <h3 className="font-bold text-gray-900 mb-6 text-base uppercase">
            Order Summary
          </h3>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly Amount</span>
              <span className="font-semibold">₹{monthlyAmount.toLocaleString()}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Installments</span>
              <span className="font-semibold">{totalInstallments}</span>
            </div>

            <div className="flex justify-between text-green-600">
              <span>Bonus (10th Month)</span>
              <span className="font-semibold">₹{bonus.toLocaleString()}</span>
            </div>

            <div className="border-t border-amber-200 pt-4 flex justify-between">
              <span className="font-bold">Total Benefit</span>
              <span className="font-bold text-lg text-amber-600">
                ₹{totalValue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Nominee Info */}
          <div className="mt-6 pt-6 border-t border-amber-200">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-3">
              Nominee Details
            </p>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-600">Name:</span>{" "}
                <span className="font-medium">{enrollment.nominee_name}</span>
              </p>
              <p>
                <span className="text-gray-600">Age:</span>{" "}
                <span className="font-medium">{enrollment.nominee_age}</span>
              </p>
              <p>
                <span className="text-gray-600">Relation:</span>{" "}
                <span className="font-medium">{enrollment.nominee_relation}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs md:text-sm text-gray-700">
        <p className="mb-2">
          By proceeding, you agree to our{" "}
          <a href="#" className="text-primary font-semibold hover:underline">
            Terms & Conditions
          </a>{" "}
          and{" "}
          <a href="#" className="text-primary font-semibold hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
