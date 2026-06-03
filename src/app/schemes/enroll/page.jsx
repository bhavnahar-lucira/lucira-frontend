"use client";

import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
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

import { toast } from "react-toastify";
/* ===================== CONSTANTS ===================== */
const DEFAULT_AMOUNT = 2000;
const MONTHS = 9;

export default function Enroll() {
  const router = useRouter();
  

  /* ===================== REDUX ===================== */
  const customer = useSelector((s) => s.user.user);
  const enrollment = useSelector((s) => s.user.user?.enrollment_draft);
  const mobile = customer?.mobile;

  const profile = customer || {};

  const nomineeNameRef = useRef(null);
  const nomineeAgeRef = useRef(null);
  const nomineeRelationRef = useRef(null);

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

  const party_name = profile.name || profile.party_name || "";
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

  /* ===================== PREFILL ===================== */
  useEffect(() => {
    if (!profile) return;

    setForm({
      address: profile.address || profile.address_1 || "",
      pincode: profile.pincode || profile.pin_code || "",
      city: profile.city || profile.city_name || "",
      state: profile.state || profile.state_name || "",
      nominee_name: "",
      nominee_age: "",
      nominee_relation: "",
    });
  }, [profile]);

  /* ===================== PAN LOCK ===================== */
  const [loading, setLoading] = useState(false);


  /* ===================== AMOUNT LOGIC ===================== */
  const hasUserInteracted = useRef(false);
  const [amount, setAmount] = useState(null);
  const [inputValue, setInputValue] = useState("");

  const enrolledAmount =
    enrollment?.amount ??
    customer?.enrollment_draft?.amount ??
    null;

  useEffect(() => {
    if (enrolledAmount && !hasUserInteracted.current) {
      setAmount(enrolledAmount);
      setInputValue(String(enrolledAmount));
    }
  }, [enrolledAmount]);

  const displayAmount = amount ?? DEFAULT_AMOUNT;

   const saveDraft = async (value) => {
    await fetch("/api/session/update-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enrollment_draft: {
          amount: value,
          tenure: MONTHS,
          nominee_name: form.nominee_name,
          nominee_age: form.nominee_age,
          nominee_relation: form.nominee_relation,
        },
      }),
    });
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
      toast.dismiss();
      toast.success("Details saved successfully");
      await saveDraft(displayAmount);
      try { sessionStorage.setItem("scheme_enrollment", JSON.stringify({ amount: displayAmount, tenure: MONTHS, nominee_name: form.nominee_name, nominee_age: form.nominee_age, nominee_relation: form.nominee_relation, address: form.address, pincode: form.pincode, city: form.city, state: form.state })); } catch(e){}
      router.push("/schemes/payment");
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to update customer details");
    } finally {
      setLoading(false);
    }
  };
  const formatINR = (value) =>
    new Intl.NumberFormat("en-IN").format(value);

  return (
    <div className="w-full">
      <section className="w-full max-w-7xl mx-auto px-6 mt-8 mb-40 md:mt-20 md:mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-2 md:gap-20 items-start">
          {/* Left Section */}
          <div className="w-full bg-white">
            <h2 className="text-xl font-medium mb-8 tracking-wider text-center">
              Account Details
            </h2>
            <div className="w-full bg-white rounded-xl space-y-8">
              {/* Address Details */}
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-gray-800">Address Details</h3>

                <Input placeholder="Enter Address" className="h-14"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  } />

                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Enter Pincode" className="h-14"
                    value={form.pincode}
                    onChange={(e) =>
                      setForm({ ...form, pincode: e.target.value })
                    }
                  />
                  <Input placeholder="Enter City" className="h-14"
                    value={form.city}
                    onChange={(e) =>
                      setForm({ ...form, city: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Enter State" className="h-14"
                    value={form.state}
                    onChange={(e) =>
                      setForm({ ...form, state: e.target.value })
                    }
                  />
                  <Input value="India" disabled className="h-14" />
                </div>
              </section>
              
              {/* Nominee Details */}
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-gray-800">Nominee Details</h3>

                <Input placeholder="Enter Nominee Full Name*" className="h-14"
                  ref={nomineeNameRef}
                  value={form.nominee_name}
                  onChange={(e) =>
                    setForm({ ...form, nominee_name: e.target.value })
                  }
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Nominee Age" className="h-14"
                    ref={nomineeAgeRef}
                    value={form.nominee_age}
                    onChange={(e) =>
                      setForm({ ...form, nominee_age: e.target.value })
                    }
                  />
                  <div className="w-full h-14">
                    <Select
                      value={form.nominee_relation}
                      onValueChange={(v) =>
                        setForm({ ...form, nominee_relation: v })
                      }
                    >
                      <SelectTrigger className="w-full h-14!" ref={nomineeRelationRef}>
                        <SelectValue placeholder="Nominee Relation" />
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
              </section>

              {/* Continue Button */}
              <div className="fixed bottom-16 left-0 w-full bg-white border-t px-4 py-3 z-10 md:border-0 md:px-0 md:py-0 md:w-[50%] md:static md:mx-auto">
                <div className="flex justify-between items-center mb-2 md:hidden">
                  <span className="text-sm text-gray-600">
                    Monthly Enrollment
                  </span>
                  <span className="text-lg font-semibold">
                    ₹{formatINR(displayAmount)}
                  </span>
                </div>
                <Button
                  disabled={loading}
                  className="w-full bg-black md:bg-primary text-white rounded-md px-8 h-12 text-sm tracking-wide
    disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  onClick={handleContinue}
                >
                  {loading ? "PLEASE WAIT..." : "CONTINUE"}
                </Button>
              </div>
            </div>
          </div>
          <div className="hidden lg:block w-px bg-gray-300 h-full"></div>
          {/* Right Section */}
          <EnrollSummary nominee_name= {form.nominee_name}
          nominee_age={form.nominee_age}
          nominee_relation={form.nominee_relation}/>
        </div>
      </section>
    </div>
  );
}
