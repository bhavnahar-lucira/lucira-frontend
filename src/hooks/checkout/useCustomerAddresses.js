import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import {
  apiFetch,
  createCustomerAddress,
  deleteCustomerAddress,
  fetchCustomerAddresses,
  selectDefaultCustomerAddress,
  updateCustomerAddress,
} from "@/lib/api";
import { shopifyStorefrontFetch, CUSTOMER_UPDATE_MUTATION } from "@/lib/shopify-client";
import { updateUser } from "@/redux/features/user/userSlice";
import { checkPincodeDeliverability } from "./usePincodeDeliverability";

/**
 * Owns the customer's saved-address list plus the currently selected one.
 * Mirrors the profile-sync behavior that used to live inline in the
 * shipping page: first/last name, phone and email get pushed back to the
 * customer profile whenever the customer only has 0-1 saved addresses, so
 * their account stays in sync with their one "real" address.
 */
export function useCustomerAddresses({ accessToken, user }) {
  const dispatch = useDispatch();
  const [addresses, setAddresses] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  const applyAddressPayload = useCallback((payload) => {
    setAddresses(payload.addresses || []);
    setCustomer(payload.customer || null);

    const nextSelectedId = payload.defaultAddressId || payload.addresses?.[0]?.id || "";
    setSelectedAddressId(nextSelectedId);

    if (typeof window !== "undefined") {
      const currentAddress = (payload.addresses || []).find((address) => address.id === nextSelectedId) || null;
      window.localStorage.setItem(
        "checkoutShippingAddress",
        JSON.stringify({
          customer: payload.customer || null,
          address: currentAddress,
        })
      );
    }

    return payload;
  }, []);

  const loadAddresses = useCallback(async () => {
    try {
      setLoadingAddresses(true);
      if (!accessToken || accessToken.startsWith("simulated_")) {
        applyAddressPayload({ addresses: [], customer: null });
        return;
      }
      applyAddressPayload(await fetchCustomerAddresses(accessToken));
    } catch (error) {
      toast.error(error.message || "Unable to load saved addresses");
    } finally {
      setLoadingAddresses(false);
    }
  }, [accessToken, applyAddressPayload]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // Only sync the account profile when the customer effectively has a
  // single address on file — with multiple addresses there's no longer one
  // obvious "the" address to mirror onto the profile.
  const syncProfile = useCallback(
    async (form) => {
      if (!accessToken || accessToken.startsWith("simulated_") || addresses.length > 1) return;
      try {
        const profileUpdate = {
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          email: form.email,
        };
        await Promise.all([
          apiFetch("/api/customer/profile", {
            method: "PATCH",
            body: JSON.stringify(profileUpdate),
          }),
          shopifyStorefrontFetch(CUSTOMER_UPDATE_MUTATION, {
            customerAccessToken: accessToken,
            customer: profileUpdate,
          }),
        ]);
        dispatch(updateUser(profileUpdate));
      } catch (syncErr) {
        console.warn("[useCustomerAddresses] Failed to sync profile:", syncErr);
      }
    },
    [accessToken, addresses.length, dispatch]
  );

  const createAddress = useCallback(
    async (form, { makeDefault = false } = {}) => {
      const deliverable = await checkPincodeDeliverability(form.zip?.trim());
      if (!deliverable) {
        throw new Error("We are not delivering product on this address");
      }

      const { email: _formEmail, ...addressToSave } = form;
      const payload = await createCustomerAddress({ address: addressToSave, makeDefault }, accessToken);
      applyAddressPayload(payload);
      await syncProfile(form);
      return payload;
    },
    [accessToken, applyAddressPayload, syncProfile]
  );

  const updateAddress = useCallback(
    async (addressId, form, { makeDefault = false } = {}) => {
      const deliverable = await checkPincodeDeliverability(form.zip?.trim());
      if (!deliverable) {
        throw new Error("We are not delivering product on this address");
      }

      const { email: _formEmail, ...addressToSave } = form;
      const payload = await updateCustomerAddress({ addressId, address: addressToSave, makeDefault }, accessToken);
      applyAddressPayload(payload);
      await syncProfile(form);
      return payload;
    },
    [accessToken, applyAddressPayload, syncProfile]
  );

  const selectAddress = useCallback(
    async (addressId) => {
      const addressToSelect = addresses.find((a) => a.id === addressId);
      if (addressToSelect?.isDefault) {
        toast.info("This address is already default");
        setSelectedAddressId(addressId);
        return;
      }

      setSelectedAddressId(addressId);
      try {
        applyAddressPayload(await selectDefaultCustomerAddress(addressId, accessToken));

        if (addressToSelect && accessToken && !accessToken.startsWith("simulated_") && addresses.length <= 1) {
          try {
            const profileUpdate = {
              firstName: addressToSelect.firstName,
              lastName: addressToSelect.lastName,
              phone: addressToSelect.phone,
              email: customer?.email || user?.email || "",
            };
            await Promise.all([
              apiFetch("/api/customer/profile", {
                method: "PATCH",
                body: JSON.stringify(profileUpdate),
              }),
              shopifyStorefrontFetch(CUSTOMER_UPDATE_MUTATION, {
                customerAccessToken: accessToken,
                customer: profileUpdate,
              }),
            ]);
            dispatch(updateUser(profileUpdate));
          } catch (syncErr) {
            console.warn("[useCustomerAddresses] Failed to sync selected address name with profile:", syncErr);
          }
        }
      } catch (error) {
        toast.error(error.message || "Unable to select address");
        loadAddresses();
      }
    },
    [accessToken, addresses, customer, user, dispatch, applyAddressPayload, loadAddresses]
  );

  const deleteAddress = useCallback(
    async (addressId) => {
      const addressToDelete = addresses.find((a) => a.id === addressId);
      if (addressToDelete?.isDefault) {
        toast.error("You cannot delete default address");
        return;
      }
      try {
        applyAddressPayload(await deleteCustomerAddress(addressId, accessToken));
        toast.success("Address removed");
      } catch (error) {
        toast.error(error.message || "Unable to remove address");
      }
    },
    [accessToken, addresses, applyAddressPayload]
  );

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || null;

  return {
    addresses,
    customer,
    selectedAddressId,
    setSelectedAddressId,
    selectedAddress,
    hasSavedAddresses: addresses.length > 0,
    loadingAddresses,
    loadAddresses,
    createAddress,
    updateAddress,
    selectAddress,
    deleteAddress,
  };
}
