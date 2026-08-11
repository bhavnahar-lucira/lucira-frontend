import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export async function checkPincodeDeliverability(pincode) {
  if (!pincode) return false;
  try {
    const data = await apiFetch(`/api/pincodes/check?pincode=${pincode.trim()}`);
    return data.success && data.deliverable;
  } catch (err) {
    console.error("Pincode check failed:", err);
    return false;
  }
}

export function usePincodeDeliverability(zip, { enabled = true } = {}) {
  const [isDeliverable, setIsDeliverable] = useState(true);
  const [checkingPincode, setCheckingPincode] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkSelected = async () => {
      if (enabled && zip) {
        setCheckingPincode(true);
        const deliverable = await checkPincodeDeliverability(zip);
        if (isMounted) {
          setIsDeliverable(deliverable);
          setCheckingPincode(false);
        }
      } else if (isMounted) {
        setIsDeliverable(true);
        setCheckingPincode(false);
      }
    };

    checkSelected();
    return () => {
      isMounted = false;
    };
  }, [zip, enabled]);

  return { isDeliverable, checkingPincode };
}
