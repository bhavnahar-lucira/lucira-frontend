"use client";

import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";

const DEFAULT_AMOUNT = 2000;
const MAX_AMOUNT = 19000;

export default function SchemeEnrollPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const amountParam = searchParams.get("amount");

  const user = useSelector((state) => state.user.user);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    amount: amountParam && !isNaN(Number(amountParam)) ? Number(amountParam) : DEFAULT_AMOUNT,
    address: "",
    pincode: "",
    city: "",
    state: "",
    nominee_name: "",
    nominee_age: "",
    nominee_relation: "",
  });

  const [errors, setErrors] = useState({});

  // Fetch user profile to prefill data
  useEffect(() => {
    if (!user) {
      router.push("/schemes");
      return;
    }

    // Prefill with user data if available
    setForm((prev) => ({
      ...prev,
      ...(user.name && { nominee_name: user.name }),
      ...(user.address && { address: user.address }),
      ...(user.city && { city: user.city }),
      ...(user.state && { state: user.state }),
      ...(user.pincode && { pincode: user.pincode }),
    }));
  }, [user, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.pincode.trim()) newErrors.pincode = "Pincode is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.state.trim()) newErrors.state = "State is required";
    if (!form.nominee_name.trim()) newErrors.nominee_name = "Nominee name is required";
    if (!form.nominee_age || Number(form.nominee_age) < 18) newErrors.nominee_age = "Nominee age must be 18+";
    if (!form.nominee_relation.trim()) newErrors.nominee_relation = "Relationship is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToPayment = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Store enrollment data in session/state for payment page
      sessionStorage.setItem(
        "scheme_enrollment",
        JSON.stringify({
          amount: form.amount,
          nominee_name: form.nominee_name,
          nominee_age: form.nominee_age,
          nominee_relation: form.nominee_relation,
          address: form.address,
          pincode: form.pincode,
          city: form.city,
          state: form.state,
        })
      );

      toast.success("Enrollment details saved");
      router.push("/schemes/payment");
    } catch (err) {
      toast.error(err.message || "Failed to save enrollment details");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 text-center">
        <p>Please log in to continue with enrollment.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 md:p-10">
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Enrollment Details
        </h1>
        <p className="text-gray-600">
          Complete your enrollment to proceed to payment
        </p>
      </div>

      <div className="space-y-6 bg-white p-6 md:p-8 rounded-lg border border-gray-100">
        {/* Monthly Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Monthly Amount: ₹{form.amount.toLocaleString()}
          </label>
          <p className="text-xs md:text-sm text-gray-500">
            Total benefit value: ₹{(form.amount * 10).toLocaleString()}
          </p>
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-2">
            Address *
          </label>
          <Input
            id="address"
            name="address"
            value={form.address}
            onChange={handleInputChange}
            placeholder="Enter your address"
            className={errors.address ? "border-red-500" : ""}
          />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
        </div>

        {/* Pincode */}
        <div>
          <label htmlFor="pincode" className="block text-sm font-medium text-gray-900 mb-2">
            Pincode *
          </label>
          <Input
            id="pincode"
            name="pincode"
            value={form.pincode}
            onChange={handleInputChange}
            placeholder="Enter pincode"
            className={errors.pincode ? "border-red-500" : ""}
          />
          {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
        </div>

        {/* City & State */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-900 mb-2">
              City *
            </label>
            <Input
              id="city"
              name="city"
              value={form.city}
              onChange={handleInputChange}
              placeholder="City"
              className={errors.city ? "border-red-500" : ""}
            />
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-900 mb-2">
              State *
            </label>
            <Input
              id="state"
              name="state"
              value={form.state}
              onChange={handleInputChange}
              placeholder="State"
              className={errors.state ? "border-red-500" : ""}
            />
            {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
          </div>
        </div>

        {/* Nominee Details */}
        <div className="border-t pt-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Nominee Details</h3>

          <div>
            <label htmlFor="nominee_name" className="block text-sm font-medium text-gray-900 mb-2">
              Nominee Name *
            </label>
            <Input
              id="nominee_name"
              name="nominee_name"
              value={form.nominee_name}
              onChange={handleInputChange}
              placeholder="Nominee name"
              className={errors.nominee_name ? "border-red-500" : ""}
            />
            {errors.nominee_name && <p className="text-red-500 text-xs mt-1">{errors.nominee_name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="nominee_age" className="block text-sm font-medium text-gray-900 mb-2">
                Age *
              </label>
              <Input
                id="nominee_age"
                name="nominee_age"
                type="number"
                min="18"
                value={form.nominee_age}
                onChange={handleInputChange}
                placeholder="Age"
                className={errors.nominee_age ? "border-red-500" : ""}
              />
              {errors.nominee_age && <p className="text-red-500 text-xs mt-1">{errors.nominee_age}</p>}
            </div>

            <div>
              <label htmlFor="nominee_relation" className="block text-sm font-medium text-gray-900 mb-2">
                Relationship *
              </label>
              <Input
                id="nominee_relation"
                name="nominee_relation"
                value={form.nominee_relation}
                onChange={handleInputChange}
                placeholder="e.g., Spouse, Child"
                className={errors.nominee_relation ? "border-red-500" : ""}
              />
              {errors.nominee_relation && <p className="text-red-500 text-xs mt-1">{errors.nominee_relation}</p>}
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="border-t pt-6">
          <Button
            onClick={handleContinueToPayment}
            disabled={loading}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider rounded-lg transition-all"
          >
            {loading ? "Processing..." : "Continue to Payment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
