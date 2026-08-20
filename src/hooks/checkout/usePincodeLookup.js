import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";

/**
 * Watches an address form's PIN code and autofills city/state/country from
 * the postal API. `setForm` must be the form's state setter (functional
 * updates only, so multiple form instances can each own their cache).
 */
export function usePincodeLookup(zip, setForm) {
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const pincodeCache = useRef({});
  const lastFetchedPincode = useRef("");

  const fetchPincodeDetails = useCallback(
    async (pincode) => {
      try {
        if (!pincode || pincode.length !== 6) return;

        if (pincodeCache.current[pincode]) {
          setForm((prev) => ({ ...prev, ...pincodeCache.current[pincode] }));
          return;
        }

        setPincodeLoading(true);

        const data = await apiFetch(`/api/pincode?pincode=${pincode}`);
        const result = data?.[0];

        if (
          !result ||
          result.Status !== "Success" ||
          !Array.isArray(result.PostOffice) ||
          result.PostOffice.length === 0
        ) {
          lastFetchedPincode.current = "";
          setForm((prev) => ({ ...prev, city: "", province: "" }));
          toast.error("Unable to verify PIN Code. Please enter City and State manually.");
          return;
        }

        const office = result.PostOffice[0];
        const addressData = {
          city: office.District || "",
          province: office.State || "",
          country: office.Country || "India",
          _pincodeCity: office.District || "",
          _pincodeProvince: office.State || "",
        };

        pincodeCache.current[pincode] = addressData;
        setForm((prev) => ({ ...prev, ...addressData }));
      } catch (error) {
        console.error("Pincode lookup failed:", error);
        toast.error("Unable to fetch PIN Code details. Please enter City and State manually.");
      } finally {
        setPincodeLoading(false);
      }
    },
    [setForm]
  );

  useEffect(() => {
    const pincode = zip?.trim();

    if (!pincode || pincode.length < 6) {
      lastFetchedPincode.current = "";
      setForm((prev) => ({
        ...prev,
        city: "",
        province: "",
        _pincodeCity: "",
        _pincodeProvince: "",
      }));
      return;
    }

    if (!/^\d{6}$/.test(pincode)) return;
    if (lastFetchedPincode.current === pincode) return;

    const timer = setTimeout(async () => {
      await fetchPincodeDetails(pincode);
      lastFetchedPincode.current = pincode;
    }, 500);

    return () => clearTimeout(timer);
  }, [zip, fetchPincodeDetails, setForm]);

  return { pincodeLoading };
}
