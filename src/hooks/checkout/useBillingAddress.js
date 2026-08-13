import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { fetchCheckoutAddressSelection, saveCheckoutAddressSelection } from "@/lib/api";

const BILLING_SELECTION_STORAGE_KEY = "checkoutBillingAddressSelection";

function readStoredBillingSelection() {
  if (typeof window === "undefined") {
    return { billingAddressMode: "same", billingAddressId: "", billingAddressSnapshot: null };
  }

  try {
    const rawValue = window.localStorage.getItem(BILLING_SELECTION_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : null;
    if (parsedValue?.billingAddressMode === "different" && parsedValue?.billingAddressId) {
      return { 
        billingAddressMode: "different", 
        billingAddressId: parsedValue.billingAddressId,
        billingAddressSnapshot: parsedValue.billingAddressSnapshot || null
      };
    }
  } catch (error) {
    console.error("Billing selection restore error:", error);
  }

  return { billingAddressMode: "same", billingAddressId: "", billingAddressSnapshot: null };
}

function persistBillingSelection(selection) {
  if (typeof window === "undefined") return;

  if (selection?.billingAddressMode === "different" && selection?.billingAddressId) {
    window.localStorage.setItem(
      BILLING_SELECTION_STORAGE_KEY,
      JSON.stringify({ 
        billingAddressMode: "different", 
        billingAddressId: selection.billingAddressId,
        billingAddressSnapshot: selection.billingAddressSnapshot || null
      })
    );
    return;
  }

  window.localStorage.removeItem(BILLING_SELECTION_STORAGE_KEY);
}

/**
 * Billing address selection: "same as shipping" vs. a different saved
 * address, persisted to localStorage + /api/checkout/address-selection.
 * Reads/writes the exact storage key + endpoint the payment page already
 * uses, so either page can own the UI and the other reads it back.
 */
export function useBillingAddress({ accessToken, addresses, loadingAddresses, selectedAddressId, selectedAddress }) {
  const [billingAddressMode, setBillingAddressModeState] = useState("same");
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState("");
  const [billingAddressSnapshot, setBillingAddressSnapshot] = useState(null);
  const [loadingBillingSelection, setLoadingBillingSelection] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingBillingSelection(true);
      const stored = readStoredBillingSelection();
      let effective = stored;

      try {
        const remote = await fetchCheckoutAddressSelection(accessToken);
        if (remote?.billingAddressMode === "different" && remote?.billingAddressId) {
          effective = remote;
        }
      } catch (error) {
        console.error("[useBillingAddress] Failed to load remote billing selection:", error);
      }

      if (cancelled) return;

      if (effective.billingAddressMode === "different" && effective.billingAddressId) {
        setBillingAddressModeState("different");
        setSelectedBillingAddressId(effective.billingAddressId);
        if (effective.billingAddressSnapshot) {
          setBillingAddressSnapshot(effective.billingAddressSnapshot);
        }
      } else {
        setBillingAddressModeState("same");
      }
      setLoadingBillingSelection(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  // If the saved billing address gets deleted elsewhere, fall back to "same"
  // instead of pointing at an address that no longer exists.
  useEffect(() => {
    if (loadingAddresses || loadingBillingSelection) return;
    if (billingAddressMode !== "different" || !selectedBillingAddressId) return;
    if (addresses.some((address) => address.id === selectedBillingAddressId)) return;
    
    // If we have a snapshot that matches the selected ID, we keep it! 
    // This protects against Shopify API cache delays during checkout navigation.
    if (billingAddressSnapshot && billingAddressSnapshot.id === selectedBillingAddressId) return;

    setBillingAddressModeState("same");
    setSelectedBillingAddressId("");
    setBillingAddressSnapshot(null);
    persistBillingSelection({ billingAddressMode: "same" });
    saveCheckoutAddressSelection({ billingAddressMode: "same" }, accessToken).catch((error) => {
      console.error("[useBillingAddress] Failed to persist billing fallback:", error);
    });
  }, [addresses, loadingAddresses, loadingBillingSelection, billingAddressMode, selectedBillingAddressId, accessToken]);

  const selectedBillingAddress = useMemo(() => {
    if (billingAddressMode === "same") return selectedAddress;
    return addresses.find((address) => address.id === selectedBillingAddressId) || billingAddressSnapshot || null;
  }, [billingAddressMode, selectedAddress, addresses, selectedBillingAddressId, billingAddressSnapshot]);

  const selectBillingAddress = useCallback(
    async (addressId, overrideAddress = null) => {
      const nextBillingAddress = overrideAddress || addresses.find((address) => address.id === addressId) || null;
      setBillingAddressModeState("different");
      setSelectedBillingAddressId(addressId);
      setBillingAddressSnapshot(nextBillingAddress);
      persistBillingSelection({ 
        billingAddressMode: "different", 
        billingAddressId: addressId,
        billingAddressSnapshot: nextBillingAddress
      });

      try {
        await saveCheckoutAddressSelection({ billingAddressMode: "different", billingAddressId: addressId }, accessToken);
      } catch (error) {
        toast.error(error.message || "Unable to save billing address");
      }
    },
    [addresses, accessToken]
  );

  const setBillingMode = useCallback(
    async (mode) => {
      if (mode === "same") {
        setBillingAddressModeState("same");
        setSelectedBillingAddressId(selectedAddressId);
        setBillingAddressSnapshot(selectedAddress);
        persistBillingSelection({ billingAddressMode: "same" });
        try {
          await saveCheckoutAddressSelection({ billingAddressMode: "same" }, accessToken);
        } catch (error) {
          toast.error(error.message || "Unable to save billing preference");
        }
        return;
      }

      setBillingAddressModeState("different");
      if (!selectedBillingAddressId) {
        setSelectedBillingAddressId(selectedAddressId);
        setBillingAddressSnapshot(selectedAddress);
      }
    },
    [selectedAddressId, selectedAddress, selectedBillingAddressId, accessToken]
  );

  return {
    billingAddressMode,
    selectedBillingAddress,
    loadingBillingSelection,
    selectBillingAddress,
    setBillingMode,
  };
}
