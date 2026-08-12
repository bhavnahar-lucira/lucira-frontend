"use client";

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { toast } from "react-toastify";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { AddressForm } from "./AddressForm";
import { AddressListInline } from "./AddressListInline";
import { AddressSummaryCard } from "./AddressSummaryCard";
import { emptyAddressForm, normalizeAddressForm } from "@/lib/checkout/address-helpers";

function validateAddressForm(form) {
  if (!form.firstName.trim()) return "First name is required";
  if (!form.lastName.trim()) return "Last name is required";
  if (!form.address1.trim()) return "Address is required";
  if (!form.city.trim()) return "City is required";
  if (!form.province.trim()) return "State is required";
  if (!form.zip.trim()) return "PIN code is required";
  if (!/^\d{6}$/.test(form.zip.trim())) return "Please enter a valid 6-digit PIN code";
  if (!form.country.trim()) return "Country is required";
  if (form.gstin.trim() && form.gstin.trim().length !== 15) return "GSTIN must be 15 characters";
  return "";
}

/**
 * Pickup has no shipping address to be "same as", so it always shows a
 * plain "Billing Address" heading with the billing content underneath.
 * Ship mode shows the "Billing Address same as Shipping Address" toggle,
 * only revealing billing content when it's switched off.
 *
 * The billing content itself is a saved-address summary card + inline
 * picker once there's a genuine second address to choose from, or an
 * inline form to add one when there's at most one saved address (nothing
 * meaningfully "different" to pick). Everything stays on the page — no
 * dialog/bottom-sheet popups.
 */
export function BillingAddressSection({
  isPickup = false,
  addresses,
  customer,
  createAddress,
  deleteAddress,
  billingAddressMode,
  selectedBillingAddress,
  setBillingMode,
  selectBillingAddress,
}) {
  const [billingView, setBillingView] = useState("card"); // "card" | "list" | "form"
  const [createForm, setCreateForm] = useState(emptyAddressForm);
  const [createMakeDefault, setCreateMakeDefault] = useState(false);
  const [createIsCompany, setCreateIsCompany] = useState(false);
  const [creating, setCreating] = useState(false);

  const showBillingContent = isPickup || billingAddressMode === "different";

  const updateCreateForm = (field, value) => setCreateForm((prev) => ({ ...prev, [field]: value }));

  // Seed the "nothing to pick yet" / new-address form once, without
  // clobbering anything the customer has already started typing.
  useEffect(() => {
    if (addresses.length <= 1 || billingView === "form") {
      setCreateForm((prev) => (prev.firstName || prev.address1 ? prev : normalizeAddressForm({}, customer || {})));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses.length, customer, billingView]);

  const openCreate = () => {
    setCreateForm(normalizeAddressForm({}, customer || {}));
    setCreateMakeDefault(false);
    setCreateIsCompany(false);
    setBillingView("form");
  };

  const handleCreate = async () => {
    const validationError = validateAddressForm(createForm);
    if (validationError) return toast.error(validationError);

    try {
      setCreating(true);
      const payload = await createAddress(createForm, { makeDefault: createMakeDefault });
      const newAddress =
        payload.addresses?.find((a) => a.address1 === createForm.address1 && a.zip === createForm.zip) ||
        payload.addresses?.[payload.addresses.length - 1];
      if (newAddress) {
        await selectBillingAddress(newAddress.id);
      }
      setBillingView("card");
      toast.success("Address added");
    } catch (error) {
      toast.error(error.message || "Unable to add address");
    } finally {
      setCreating(false);
    }
  };

  const backToCard = (
    <button type="button" onClick={() => setBillingView("card")} className="text-zinc-500 hover:text-zinc-900">
      <ChevronLeft className="size-5" />
    </button>
  );

  return (
    <div className="space-y-4">
      {isPickup ? (
        <h2 className="text-xl font-bold text-zinc-900">Billing Address</h2>
      ) : (
        <div className="flex items-center justify-between gap-4 mt-6">
          <span className="text-[0.9375rem] font-figtree font-medium text-black">Billing Address same as Shipping Address</span>
          <ToggleSwitch
            checked={billingAddressMode === "same"}
            onCheckedChange={(checked) => setBillingMode(checked ? "same" : "different")}
          />
        </div>
      )}

      {showBillingContent &&
        (addresses.length <= 1 ? (
          <AddressForm
            form={createForm}
            onChange={updateCreateForm}
            makeDefault={createMakeDefault}
            onDefaultChange={setCreateMakeDefault}
            isCompanyPurchase={createIsCompany}
            onCompanyPurchaseChange={setCreateIsCompany}
            submitLabel="Save Address"
            onSubmit={handleCreate}
            saving={creating}
          />
        ) : billingView === "form" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {backToCard}
              <h3 className="text-lg font-bold text-zinc-900">Billing Address</h3>
            </div>
            <AddressForm
              form={createForm}
              onChange={updateCreateForm}
              makeDefault={createMakeDefault}
              onDefaultChange={setCreateMakeDefault}
              isCompanyPurchase={createIsCompany}
              onCompanyPurchaseChange={setCreateIsCompany}
              submitLabel="Save Address"
              onSubmit={handleCreate}
              saving={creating}
            />
          </div>
        ) : billingView === "list" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {backToCard}
              <h3 className="text-lg font-bold text-zinc-900">All Addresses</h3>
            </div>
            <AddressListInline
              addresses={addresses}
              selectedAddressId={selectedBillingAddress?.id || ""}
              onSelect={async (id) => {
                await selectBillingAddress(id);
                setBillingView("card");
              }}
              onDelete={deleteAddress}
              radioGroupName="billing-addresses"
              onAddNew={openCreate}
            />
          </div>
        ) : (
          <AddressSummaryCard address={selectedBillingAddress} onChangeClick={() => setBillingView("list")} />
        ))}
    </div>
  );
}
