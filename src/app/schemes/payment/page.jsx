"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import { 
  apiFetch, 
  createOrnaverseEnrollment, 
  fetchOrnaverseEnrollments, 
  createOrnaverseReceipt 
} from "@/lib/api";
import { pushPromoClick } from "@/lib/gtm";
import { BadgeCheck, Loader2, ShieldCheck, Sparkles, WalletCards } from "lucide-react";

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", icon: "⚡" },
  { id: "credit", label: "Credit Card", icon: "💳" },
  { id: "debit", label: "Debit Card", icon: "💳" },
  { id: "netbanking", label: "Net Banking", icon: "🏦" },
];

const MAX_INSTALLMENT_AMOUNT = 19000;

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

  const savePaymentRecord = async (payload) => {
    try {
      const res = await apiFetch("/api/schemes/payment-records", {
        method: "POST",
        body: JSON.stringify({
          customer: { ...user, party_id: enrollment?.party_id },
          payment_context: {
            amount: enrollment?.amount,
            tenure: 9,
            method,
            source: "frontend_payment_page",
          },
          ...payload,
        }),
      });
      return res;
    } catch (error) {
      console.error("Payment record save failed:", error);
      return null;
    }
  };

  const handleInitiatePayment = async () => {
    if (!enrollment) {
      toast.error("Enrollment data missing");
      return;
    }

    setLoading(true);
    try {
      // Fire dataLayer promoClick event
      try {
        pushPromoClick({
          creative_name: "Pay Securely Cta in schemes payment page",
          location_id: "/schemes/payment",
          promo_id: String(enrollment?.amount || ""),
          promo_name: user?.mobile || user?.phone || "",
        });
      } catch (error) {
        console.error("Error pushing to dataLayer:", error);
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout");
      }

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

            /* 1️⃣ VERIFY SIGNATURE */
            await apiFetch("/api/schemes/razorpay/verify", {
              method: "POST",
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            /* 2️⃣ ORNAVERSE: CREATE ENROLLMENT */
            const now = new Date();
            const tenure = 9;
            const amount = enrollment.amount;
            const partyId = enrollment.party_id;

            const months = Array.from({ length: tenure }).map((_, i) => {
              const d = new Date(now);
              d.setMonth(d.getMonth() + i);
              return {
                month_id: d.getMonth() + 1,
                month_amount: amount,
                due_date: d.toISOString(),
              };
            });

            const enrollmentPayload = {
              document_date: now.toISOString(),
              party_id: partyId.toString(),
              scheme_id: 3,
              scheme_amount: amount,
              total_amount: amount * 10,
              scheme_bonus_value: amount,
              tenure,
              scheme_monthly_details: months,
              bonus_value: amount,
              mobile: user?.phone || user?.mobile,
              party_name: enrollment.party_name || user?.name,
              scheme_code: "9+1",
              max_installment_amount: MAX_INSTALLMENT_AMOUNT,
              nominee: !!enrollment.nominee_name,
              nominee_age: enrollment.nominee_age,
              subscription_id: response.razorpay_subscription_id
            };

            const ornaEnrollRes = await createOrnaverseEnrollment(enrollmentPayload);
            const ornaEnrollId = ornaEnrollRes?.EntityId;

            /* 3️⃣ ORNAVERSE: GET ENROLLED SCHEME TO FIND NEXT UNPAID MONTH */
            const ornaSchemesRes = await fetchOrnaverseEnrollments(partyId);
            const ornaSchemes = ornaSchemesRes?.Entities ?? [];
            const matchedScheme = ornaSchemes.find(s => String(s.scheme_enrollment_id) === String(ornaEnrollId));

            if (!matchedScheme) throw new Error("Enrolled scheme not found in Ornaverse");

            const unpaidMonth = matchedScheme.scheme_monthly_details.find(m => !m.payment_made);
            if (!unpaidMonth) throw new Error("No pending installment found");

            /* 4️⃣ ORNAVERSE: CREATE SCHEME RECEIPT */
            const receiptPayload = {
              Entity: {
                document_no: 123, // Placeholder as in original
                document_date: new Date().toISOString(),
                document_id: 99, // Placeholder as in original
                mobile: user?.phone || user?.mobile,
                party_id: partyId.toString(),
                party_name: enrollment.party_name || user?.name,
                email: user?.email || "",
                phone_code: "91",
                pan_no: null,
                address: enrollment.address,
                scheme_enrollment_id: ornaEnrollId.toString(),
                month_ids: [String(unpaidMonth.month_id)],
                amount,
                gold_rate: 0,
                weight: 0,
                scheme_receipt_details: [{
                  mode_id: 4, // ONLINE
                  card_type: null,
                  amount,
                  cheque_no: null,
                  cheque_date: null,
                  ref_no: response.razorpay_payment_id,
                  ledger_id: 154,
                  bank_pos: 5,
                  code: response.razorpay_payment_id,
                  mode_name: method.toUpperCase(),
                  mode_type: 2, // DIGITAL
                }],
                currency_id: "103",
                exchange_rate: 1,
                ledger_id: 154,
                company_id: 2,
                scheme_type: "1",
                scheme_unique_code: matchedScheme.scheme_unique_code,
              }
            };

            const ornaReceiptRes = await createOrnaverseReceipt(receiptPayload);

            /* 5️⃣ MONGODB: SAVE ENROLLMENT (Local Database) */
            await apiFetch("/api/schemes/enrollment", {
              method: "POST",
              body: JSON.stringify({
                customer_id: user?.id,
                mobile: user?.phone || user?.mobile,
                amount: enrollment.amount,
                nominee_name: enrollment.nominee_name || "N/A",
                nominee_age: enrollment.nominee_age || 0,
                nominee_relation: enrollment.nominee_relation || "N/A",
                address: enrollment.address || "N/A",
                pincode: enrollment.pincode || "N/A",
                city: enrollment.city || "N/A",
                state: enrollment.state || "N/A",
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_payment_id: response.razorpay_payment_id,
                ornaverse_enrollment_id: ornaEnrollId,
              }),
            });

            /* 6️⃣ WEBHOOK (WebEngage sync) */
            // Removed webhook call as it does not exist in the fastify backend and was causing a 404 Not Found error.

            /* 7️⃣ LOG FULL SUCCESS */
            await savePaymentRecord({
              customer: { ...user, party_id: enrollment.party_id },
              payment_status: "success",
              payment_verified: true,
              subscription: { id: response.razorpay_subscription_id },
              razorpay_payment: response,
              enrollment_payload: enrollmentPayload,
              enrollment_result: ornaEnrollRes,
              enrolled_scheme: matchedScheme,
              receipt_create_payload: receiptPayload,
              receipt_create_result: ornaReceiptRes,
              receiptEntityId: ornaReceiptRes?.EntityId || null,
            });

            sessionStorage.setItem("scheme_payment_success_data", JSON.stringify({
              customer: { ...user, party_id: enrollment.party_id },
              amount: enrollment.amount,
              enrollmentEntityId: ornaEnrollId,
              receiptEntityId: ornaReceiptRes?.EntityId || null
            }));

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
  const formatINR = (value) => new Intl.NumberFormat("en-IN").format(value);

  return (
    <div className="relative overflow-hidden bg-[linear-gradient(180deg,#fffdfc_0%,#f7f1ee_52%,#ffffff_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top_left,rgba(103,73,67,0.12),transparent_44%),radial-gradient(circle_at_top_right,rgba(154,123,113,0.10),transparent_38%)]" />

      <div className="relative container mx-auto max-w-7xl px-4 pt-6 pb-28 md:py-10">
        <div className="mb-8 md:mb-20">
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#6f5a55]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d9cbc5] bg-white/90 px-3 py-1.5 shadow-sm">
              <ShieldCheck size={14} />
              Secure monthly auto-debit
            </span>
            <span className="hidden items-center gap-2 rounded-full border border-[#d9cbc5] bg-white/90 px-3 py-1.5 shadow-sm md:inline-flex">
              <BadgeCheck size={14} />
              Vault of Dreams
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#201815] md:text-4xl">
                Complete your scheme payment
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f625f] md:text-base md:leading-7">
                Choose a payment method and confirm your monthly premium. Your selected amount is locked in for this subscription and will be used for Razorpay checkout.
              </p>
            </div>

            <div className="hidden rounded-2xl border border-[#e7dad4] bg-white/90 px-4 py-3 shadow-[0_12px_35px_rgba(98,72,65,0.08)] md:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6c524d] text-white">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8b736d]">Monthly premium</p>
                  <p className="text-2xl font-semibold text-[#201815]">₹{formatINR(monthlyAmount)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.82fr)]">
          <div className="space-y-5">
            <div className="rounded-3xl border border-[#eadfd9] bg-white/95 p-4 shadow-[0_14px_34px_rgba(72,48,42,0.06)] md:hidden">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8b736d]">Monthly premium</p>
                  <p className="mt-1 text-lg font-semibold tracking-tight text-[#201815]">₹{formatINR(monthlyAmount)}</p>
                  <p className="mt-1 text-xs leading-5 text-[#7b6d68]">
                    Review your amount and pay securely before continuing.
                  </p>
                </div>
                <Button
                  onClick={handleInitiatePayment}
                  disabled={loading}
                  className="h-11 shrink-0 rounded-2xl bg-[#6c524d] px-4 text-sm font-semibold tracking-wide text-white shadow-[0_12px_24px_rgba(108,82,77,0.25)] transition-all hover:bg-[#5f4945] active:scale-[0.99] cursor-pointer"
                >
                  {loading ? "..." : "Pay now"}
                </Button>
              </div>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-[#211815] md:text-xl">Payment methods</h2>
                <p className="mt-1 text-sm text-[#756661]">Pick your preferred way to pay now and continue monthly after activation.</p>
              </div>
            </div>

            <RadioGroup value={method} onValueChange={setMethod} className="space-y-4">
              {PAYMENT_METHODS.map((m) => (
                <Card
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`group cursor-pointer overflow-hidden border transition-all duration-200 ${
                    method === m.id
                      ? "border-[#6c524d] bg-white shadow-[0_18px_40px_rgba(108,82,77,0.12)]"
                      : "border-[#eadfd9] bg-white shadow-[0_8px_24px_rgba(72,48,42,0.04)] hover:-translate-y-0.5 hover:border-[#cbb7b0] hover:shadow-[0_14px_30px_rgba(72,48,42,0.08)]"
                  }`}
                >
                  <CardContent className="flex items-center justify-between px-4 py-4 md:px-6 md:py-5">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl transition-colors ${
                          method === m.id ? "bg-[#6c524d] text-white" : "bg-[#f6f0ed] text-[#6c524d]"
                        }`}
                      >
                        <span aria-hidden="true">{m.icon}</span>
                      </div>
                      <div>
                        <Label className="cursor-pointer text-base font-medium text-[#1f1816]">{m.label}</Label>
                        <p className="mt-1 hidden text-xs text-[#8b7b76] sm:block">
                          {m.id === "upi" && "Fast and frictionless"}
                          {m.id === "credit" && "Use your card for instant confirmation"}
                          {m.id === "debit" && "Pay directly from your bank account"}
                          {m.id === "netbanking" && "Choose your bank and continue"}
                        </p>
                      </div>
                    </div>
                    <RadioGroupItem
                      value={m.id}
                      id={m.id}
                      className="border-[#cdbcb5] text-[#6c524d] data-[state=checked]:border-[#6c524d] data-[state=checked]:text-[#6c524d]"
                    />
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>

            <div className="hidden gap-4 md:grid md:grid-cols-2">
              <div className="rounded-3xl border border-[#eadfd9] bg-white p-5 shadow-[0_10px_28px_rgba(72,48,42,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f6f0ed] text-[#6c524d]">
                    <WalletCards size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1f1816]">Monthly premium</p>
                    <p className="text-xs text-[#8a7a75]">Charged today through Razorpay</p>
                  </div>
                </div>
                <div className="mt-4 text-3xl font-semibold tracking-tight text-[#201815]">₹{formatINR(monthlyAmount)}</div>
              </div>

              <div className="rounded-3xl border border-[#eadfd9] bg-white p-5 shadow-[0_10px_28px_rgba(72,48,42,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f6f0ed] text-[#6c524d]">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1f1816]">Auto-renew</p>
                    <p className="text-xs text-[#8a7a75]">Recurring monthly subscription</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-[#6f625f]">
                  After this payment, future deductions continue monthly without you having to re-enter the amount.
                </p>
              </div>
            </div>
          </div>

          <div className="h-fit lg:sticky lg:top-6">
            <h2 className="mb-4 hidden text-lg font-semibold tracking-tight text-[#211815] md:block md:text-xl">Premium summary</h2>
            <Card className="overflow-hidden border-[#eadfd9] bg-[linear-gradient(180deg,#ffffff_0%,#faf6f4_100%)] shadow-[0_20px_55px_rgba(72,48,42,0.08)]">
              <CardContent className="p-0">
                <div className="border-b border-[#eee2dc] px-5 py-5 md:px-7 md:py-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#8c7a75]">Monthly premium</p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight text-[#201815] md:text-3xl">₹{formatINR(monthlyAmount)}</p>
                    </div>
                    <div className="rounded-2xl bg-[#f3e8e4] px-3 py-2 text-xs font-medium text-[#6c524d]">
                      Locked amount
                    </div>
                  </div>
                </div>

                <div className="px-5 py-5 md:px-7 md:py-7">
                  <div className="space-y-4 rounded-3xl border border-[#eadfd9] bg-white p-5 shadow-[0_10px_22px_rgba(72,48,42,0.04)]">
                    <div className="flex items-center justify-between text-sm md:text-base">
                      <span className="text-[#6f625f]">Due now</span>
                      <span className="font-semibold text-[#201815]">₹{formatINR(monthlyAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm md:text-base">
                      <span className="text-[#6f625f]">Payment cycle</span>
                      <span className="font-semibold text-[#201815]">Monthly subscription</span>
                    </div>
                    <div className="flex items-center justify-between text-sm md:text-base">
                      <span className="text-[#6f625f]">Method</span>
                      <span className="font-semibold text-[#201815]">
                        {PAYMENT_METHODS.find((item) => item.id === method)?.label || "UPI"}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleInitiatePayment}
                    disabled={loading}
                    className="mt-6 hidden h-14 w-full rounded-2xl bg-[#6c524d] text-sm font-semibold tracking-wide text-white shadow-[0_14px_32px_rgba(108,82,77,0.28)] transition-all hover:bg-[#5f4945] active:scale-[0.99] cursor-pointer md:flex"
                  >
                    {loading ? "Processing..." : "PAY SECURELY"}
                  </Button>

                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#eadfd9] bg-[#fffdfc] px-4 py-3">
                    <ShieldCheck className="mt-0.5 shrink-0 text-[#6c524d]" size={18} />
                    <p className="text-xs leading-6 text-[#7b6d68]">
                      Secure Razorpay checkout. Your monthly scheme amount stays fixed for this subscription and will be charged automatically each month.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#eadfd9] bg-[rgba(255,252,250,0.96)] px-4 py-3 shadow-[0_-10px_30px_rgba(72,48,42,0.12)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b736d]">Pay securely</p>
            <p className="mt-1 truncate text-sm font-semibold text-[#201815]">₹{formatINR(monthlyAmount)} monthly premium</p>
          </div>
          <Button
            onClick={handleInitiatePayment}
            disabled={loading}
            className="h-12 shrink-0 rounded-2xl bg-[#6c524d] px-5 text-sm font-semibold tracking-wide text-white shadow-[0_14px_32px_rgba(108,82,77,0.28)] transition-all hover:bg-[#5f4945] active:scale-[0.99] cursor-pointer"
          >
            {loading ? "Processing..." : "PAY"}
          </Button>
        </div>
      </div>
    </div>
  );
}
