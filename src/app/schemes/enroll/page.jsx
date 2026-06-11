"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import EnrollSummary from "@/components/savingCalculator/enrollSumary";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, UserPlus, Info, CheckCircle2, ChevronRight } from "lucide-react";

import { fetchCustomerAddresses, fetchOrnaverseCustomer, updateOrnaverseCustomer } from "@/lib/api";

import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { pushPromoClick } from "@/lib/gtm";

/* ===================== CONSTANTS ===================== */
const DEFAULT_AMOUNT = 2000;
const MONTHS = 9;

function clampAmount(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.max(2000, Math.min(19000, num));
}

const STEPS = [
  { id: 1, label: "Scheme Details", active: true, completed: true },
  { id: 2, label: "Your Info", active: true, completed: false },
  { id: 3, label: "Payment", active: false, completed: false },
];

export default function Enroll() {
  const router = useRouter();
  const searchParams = useSearchParams();
  

  /* ===================== REDUX ===================== */
  const customer = useSelector((s) => s.user.user);
  const accessToken = useSelector((s) => s.user.accessToken);
  const enrollment = useSelector((s) => s.user.user?.enrollment_draft);
  const mobile = customer?.mobile || customer?.phone;

  const [profile, setProfile] = useState({});

  const nomineeNameRef = useRef(null);
  const nomineeAgeRef = useRef(null);
  const nomineeRelationRef = useRef(null);

  /* ===================== ORNAVERSE CUSTOMER FETCH ===================== */
  useEffect(() => {
    if (!mobile) return;

    const loadOrnaverseProfile = async () => {
      try {
        const data = await fetchOrnaverseCustomer(mobile);
        const ornaProfile = data?.Entities?.[0] || {};
        setProfile(ornaProfile);
      } catch (error) {
        console.error("[Ornaverse] Failed to fetch customer:", error);
      }
    };

    loadOrnaverseProfile();
  }, [mobile]);

  const initialAmount = useMemo(() => {
    const queryAmount = clampAmount(searchParams.get("amount"));
    if (queryAmount) return queryAmount;

    const storedAmount = (() => {
      if (typeof window === "undefined") return null;
      try {
        const stored = sessionStorage.getItem("scheme_enrollment");
        if (!stored) return null;
        const parsed = JSON.parse(stored);
        return clampAmount(parsed?.amount);
      } catch (error) {
        return null;
      }
    })();

    if (storedAmount) return storedAmount;

    const draftAmount = clampAmount(enrollment?.amount || customer?.enrollment_draft?.amount);
    if (draftAmount) return draftAmount;

    return DEFAULT_AMOUNT;
  }, [searchParams, customer?.enrollment_draft?.amount, enrollment?.amount]);

  /* ===================== SPLIT FIRST AND LAST NAME ===================== */
  function splitFullName(fullName = "") {
    const trimmed = fullName.trim();

    if (!trimmed) {
      return { first_name: "", last_name: "" };
    }

    const parts = trimmed.split(/\s+/);

    return {
      first_name: parts[0],
      last_name: parts.length > 1 ? parts.slice(1).join(" ") : "",
    };
  }

  const party_name = profile.party_name || customer?.name || "";
  const { first_name, last_name } = splitFullName(party_name);

  /* ===================== FORM STATE ===================== */
  const [form, setForm] = useState({
    address: "",
    pincode: "",
    city: "",
    state: "",
    nominee_name: "",
    nominee_age: "",
    nominee_relation: "",
  });

  /* ===================== AUTOFILL FROM SHOPIFY ===================== */
  const [fetchingAddresses, setFetchingAddresses] = useState(false);

  useEffect(() => {
    if (!accessToken || accessToken.startsWith("simulated_")) return;

    const loadShopifyAddress = async () => {
      try {
        setFetchingAddresses(true);
        const data = await fetchCustomerAddresses(accessToken);
        
        if (data?.addresses?.length > 0) {
          // Use default address or the first one
          const addr = data.addresses.find(a => a.isDefault) || data.addresses[0];
          
          setForm(prev => ({
            ...prev,
            address: prev.address || addr.address1 + (addr.address2 ? `, ${addr.address2}` : ""),
            pincode: prev.pincode || addr.zip || "",
            city: prev.city || addr.city || "",
            state: prev.state || addr.province || "",
          }));
        }
      } catch (error) {
        console.error("[Autofill] Failed to fetch addresses:", error);
      } finally {
        setFetchingAddresses(false);
      }
    };

    loadShopifyAddress();
  }, [accessToken]);

  /* ===================== PREFILL FROM ORNAVERSE ===================== */
  useEffect(() => {
    if (!profile.party_id) return;

    setForm(prev => ({
      ...prev,
      address: prev.address || profile.address || profile.address_1 || "",
      pincode: prev.pincode || profile.pin_code || profile.pincode || "",
      city: prev.city || profile.city_name || profile.city || "",
      state: prev.state || profile.state_name || profile.state || "",
    }));
  }, [profile]);

  /* ===================== PAN LOCK ===================== */
  const [loading, setLoading] = useState(false);


  /* ===================== AMOUNT LOGIC ===================== */
  const hasUserInteracted = useRef(false);
  const [amount, setAmount] = useState(initialAmount);
  const [inputValue, setInputValue] = useState("");
  const displayAmount = amount ?? DEFAULT_AMOUNT;

  useEffect(() => {
    if (!hasUserInteracted.current) {
      setAmount(initialAmount);
      setInputValue(String(initialAmount));
    }
  }, [initialAmount]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        "scheme_enrollment",
        JSON.stringify({
          amount: displayAmount,
          tenure: MONTHS,
          nominee_name: form.nominee_name,
          nominee_age: form.nominee_age,
          nominee_relation: form.nominee_relation,
          address: form.address,
          pincode: form.pincode,
          city: form.city,
          state: form.state,
          party_id: profile.party_id,
          party_name: party_name
        })
      );
    } catch (e) {
      // Ignore storage failures and keep the UI functional.
    }
  }, [
    displayAmount,
    form.address,
    form.city,
    form.nominee_age,
    form.nominee_name,
    form.nominee_relation,
    form.pincode,
    form.state,
    profile.party_id,
    party_name
  ]);

   const saveDraft = async (value) => {
    try {
      sessionStorage.setItem(
        "scheme_enrollment",
        JSON.stringify({
          amount: value,
          tenure: MONTHS,
          nominee_name: form.nominee_name,
          nominee_age: form.nominee_age,
          nominee_relation: form.nominee_relation,
          address: form.address,
          pincode: form.pincode,
          city: form.city,
          state: form.state,
          party_id: profile.party_id,
          party_name: party_name
        })
      );
    } catch (e) {
      // Storage is a convenience, not a hard requirement.
    }
  };

  /* ===================== CREATE ENROLLMENT ===================== */
  const handleContinue = async () => {
    // ✅ Nominee validation
    if (!form.nominee_name.trim()) {
      toast.error("Please enter nominee name");
      nomineeNameRef.current?.focus();
      return;
    }

    try {
      setLoading(true);
      toast.loading("Updating your details...");

      // ✅ Update Ornaverse Customer
      if (profile.party_id) {
        const payload = {
          id: profile.party_id,
          first_name: first_name,
          last_name: last_name,
          email: profile.email || customer?.email || "",
          phone: mobile,
          address: form.address,
          address1: "",
          city: form.city,
          state: form.state,
          country: "India",
          zip: form.pincode,
        };

        await updateOrnaverseCustomer(payload);
      }

      // Fire dataLayer promoClick event
      try {
        pushPromoClick({
          creative_name: "Continue To Payment Cta in enroll scheme page",
          location_id: "/schemes/enroll",
          promo_id: String(displayAmount),
          promo_name: mobile || "",
        });
      } catch (error) {
        console.error("Error pushing to dataLayer:", error);
      }

      toast.dismiss();
      toast.success("Details saved successfully");
      await saveDraft(displayAmount);
      router.push("/schemes/payment");
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to update customer details");
      console.error("Update error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (value) =>
    new Intl.NumberFormat("en-IN").format(value);

  return (
    <div className="w-full bg-[#fafafa] min-h-screen">
      {/* Progress Stepper */}
      <div className="w-full bg-white border-b py-4 px-6 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 md:gap-8">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-2 md:gap-4">
              <div className={`flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full text-xs md:text-sm font-semibold transition-colors duration-300 ${
                step.completed ? "bg-green-600 text-white" : 
                step.active ? "bg-black text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {step.completed ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> : step.id}
              </div>
              <span className={`text-[10px] md:text-sm font-medium whitespace-nowrap ${step.active ? "text-black" : "text-gray-400"}`}>
                {step.label}
              </span>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-gray-300 mx-1" />
              )}
            </div>
          ))}
        </div>
      </div>

      <section className="w-full max-w-7xl mx-auto px-4 md:px-6 mt-8 mb-40 md:mt-12 md:mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_auto_1fr] gap-8 md:gap-16 items-start">
          
          {/* Left Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full space-y-8"
          >
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                Complete Enrollment
              </h1>
              <p className="text-gray-500 text-sm md:text-base">
                Please provide your details to finalize your gold savings scheme.
              </p>
            </div>

            {/* Address Details Card */}
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-100 flex flex-row items-center gap-3 py-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg font-semibold">Address Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="address">Permanent Address</Label>
                  <Input 
                    id="address"
                    placeholder="Enter Full Address" 
                    className="h-12 border-gray-200 focus:ring-black focus:border-black transition-all"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input 
                      id="pincode"
                      placeholder="6-digit Pincode" 
                      className="h-12 border-gray-200 focus:ring-black focus:border-black transition-all"
                      value={form.pincode}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city"
                      placeholder="Enter City" 
                      className="h-12 border-gray-200 focus:ring-black focus:border-black transition-all"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input 
                      id="state"
                      placeholder="Enter State" 
                      className="h-12 border-gray-200 focus:ring-black focus:border-black transition-all"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input value="India" disabled className="h-12 bg-gray-50 border-gray-200" />
                  </div>
                </div>
              </CardContent>
            </Card>
              
            {/* Nominee Details Card */}
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-100 flex flex-row items-center gap-3 py-4">
                <div className="p-2 bg-[#5a413f]/5 rounded-lg">
                  <UserPlus className="w-5 h-5 text-[#5a413f]" />
                </div>
                <CardTitle className="text-lg font-semibold">Nominee Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nominee_name">Nominee Full Name <span className="text-red-500">*</span></Label>
                  <Input 
                    id="nominee_name"
                    placeholder="Enter Nominee Full Name" 
                    className="h-12 border-gray-200 focus:ring-black focus:border-black transition-all"
                    ref={nomineeNameRef}
                    value={form.nominee_name}
                    onChange={(e) => setForm({ ...form, nominee_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nominee_age">Nominee Age</Label>
                    <Input 
                      id="nominee_age"
                      type="number"
                      placeholder="Age" 
                      className="h-12 border-gray-200 focus:ring-black focus:border-black transition-all"
                      ref={nomineeAgeRef}
                      value={form.nominee_age}
                      onChange={(e) => setForm({ ...form, nominee_age: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nominee_relation">Relation with Nominee</Label>
                    <div className="w-full">
                      <Select
                        value={form.nominee_relation}
                        onValueChange={(v) => setForm({ ...form, nominee_relation: v })}
                      >
                        <SelectTrigger id="nominee_relation" className="h-12 border-gray-200 focus:ring-black focus:border-black" ref={nomineeRelationRef}>
                          <SelectValue placeholder="Select Relation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="father">Father</SelectItem>
                          <SelectItem value="mother">Mother</SelectItem>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="son">Son</SelectItem>
                          <SelectItem value="daughter">Daughter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Desktop Continue Button */}
            <div className="hidden md:block pt-4">
              <Button
                disabled={loading}
                className="w-full md:w-auto md:min-w-[200px] bg-black hover:bg-gray-800 text-white rounded-lg px-10 h-14 text-base font-bold tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                onClick={handleContinue}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>PROCESSING...</span>
                  </div>
                ) : "CONTINUE TO PAYMENT"}
              </Button>
            </div>
          </motion.div>

          {/* Divider */}
          <div className="hidden lg:flex flex-col items-center h-full py-12">
            <div className="w-px bg-gray-200 h-full"></div>
            <div className="my-4 p-2 rounded-full bg-gray-50 border border-gray-100">
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <div className="w-px bg-gray-200 h-full"></div>
          </div>

          {/* Right Section - Premium Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full lg:sticky lg:top-32"
          >
            <EnrollSummary 
              nominee_name={form.nominee_name}
              nominee_age={form.nominee_age}
              nominee_relation={form.nominee_relation}
              amount={amount}
              onAmountChange={setAmount}
            />
          </motion.div>

          {/* Mobile Continue Button (Fixed Bottom) */}
          <div className="fixed bottom-0 left-0 w-full bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-6 py-5 z-30 md:hidden">
            <div className="max-w-7xl mx-auto flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                    Monthly Premium
                  </span>
                  <span className="text-xl font-bold text-black">
                    ₹{formatINR(displayAmount)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-green-600 font-bold">
                    Bonus Applied
                  </span>
                  <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                    +1 Month Free
                  </div>
                </div>
              </div>
              <Button
                disabled={loading}
                className="w-full bg-black text-white rounded-xl h-14 text-base font-bold tracking-wide shadow-lg active:scale-[0.98] transition-all disabled:opacity-60"
                onClick={handleContinue}
              >
                {loading ? "PLEASE WAIT..." : "CONTINUE"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
