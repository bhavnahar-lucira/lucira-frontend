"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import {
  fetchCustomerAddresses,
  deleteCustomerAddress,
  selectDefaultCustomerAddress,
  createCustomerAddress,
  updateCustomerAddress,
} from "@/lib/api";

const emptyAddressForm = {
  firstName: "",
  lastName: "",
  company: "",
  address1: "",
  address2: "",
  city: "",
  province: "",
  zip: "",
  country: "India",
  phone: "",
  gstin: "",
};

function normalizeAddressForm(address = {}) {
  return {
    ...emptyAddressForm,
    ...address,
    country: address.country || "India",
  };
}

export default function SavedAddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [editingAddressId, setEditingAddressId] = useState("");
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [makeDefault, setMakeDefault] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const payload = await fetchCustomerAddresses();
      setAddresses(payload.addresses || []);
    } catch (error) {
      toast.error(error.message || "Unable to load addresses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const openCreateDialog = () => {
    setDialogMode("create");
    setEditingAddressId("");
    setAddressForm(emptyAddressForm);
    setMakeDefault(addresses.length === 0);
    setShowErrors(false);
    setDialogOpen(true);
  };

  const openEditDialog = (address) => {
    setDialogMode("edit");
    setEditingAddressId(address.id);
    setAddressForm(normalizeAddressForm(address));
    setMakeDefault(Boolean(address.isDefault));
    setShowErrors(false);
    setDialogOpen(true);
  };

  const handleSaveAddress = async () => {
    if (!addressForm.firstName || !addressForm.lastName || !addressForm.address1 || !addressForm.city || !addressForm.province || !addressForm.zip || !addressForm.phone) {
      setShowErrors(true);
      toast.error("Please fill in all required fields");
      return;
    }

    // Phone validation: exactly 10 digits
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(addressForm.phone)) {
      setShowErrors(true);
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    // ZIP/PIN validation: exactly 6 digits (India)
    const zipRegex = /^[0-9]{6}$/;
    if (!zipRegex.test(addressForm.zip)) {
      setShowErrors(true);
      toast.error("Please enter a valid 6-digit PIN code");
      return;
    }

    try {
      setSaving(true);
      if (dialogMode === "create") {
        await createCustomerAddress({ address: addressForm, makeDefault });
        toast.success("Address added successfully");
      } else {
        await updateCustomerAddress({
          addressId: editingAddressId,
          address: addressForm,
          makeDefault,
        });
        toast.success("Address updated successfully");
      }
      setDialogOpen(false);
      loadAddresses();
    } catch (error) {
      toast.error(error.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const addressToDelete = addresses.find(a => a.id === id);
    if (addressToDelete?.isDefault) {
      toast.error("Default address cannot be deleted. Please set another address as default first.");
      return;
    }

    if (!confirm("Are you sure you want to remove this address?")) return;
    try {
      await deleteCustomerAddress(id);
      toast.error("Address removed successfully", {
        icon: <Check className="w-4 h-4" />
      });
      loadAddresses();
    } catch (error) {
      toast.error(error.message || "Failed to remove address");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await selectDefaultCustomerAddress(id);
      toast.success("Default address updated");
      loadAddresses();
    } catch (error) {
      toast.error(error.message || "Failed to set default address");
    }
  };

  return (
    <div className="font-figtree space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 outline-none">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-figtree text-xl md:text-2xl font-bold text-zinc-900 tracking-tight mb-1">
            Saved Addresses
          </h2>
          <p className="font-figtree text-sm md:text-base text-zinc-500 font-medium leading-relaxed">
            Manage your shipping and billing locations for faster checkout.
          </p>
        </div>
        <button
          onClick={openCreateDialog}
          className="font-figtree px-6 py-3 bg-primary text-white text-xs font-semibold uppercase tracking-[0.15em] rounded-2xl hover:opacity-90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 w-fit"
        >
          <Plus size={15} />
          Add New Address
        </button>
      </div>

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 md:py-20 space-y-4 bg-white rounded-[2rem] md:rounded-[3rem] border border-zinc-100">
          <Loader2 className="size-8 md:size-10 animate-spin text-primary" />
          <p className="font-figtree text-zinc-400 font-semibold uppercase tracking-[0.13em] text-xs">
            Loading your locations...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 items-stretch">

          {/* ── Address Cards ── */}
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`bg-white rounded-[1.75rem] md:rounded-[2rem] border-2 p-5 md:p-6 transition-all duration-300 relative group flex flex-col justify-between ${
                address.isDefault
                  ? "border-primary shadow-xl shadow-primary/5"
                  : "border-zinc-100 hover:border-zinc-200 shadow-sm"
              }`}
            >
              {/* Default badge */}
              {address.isDefault && (
                <div className="absolute -top-3 left-5 px-3 py-1 bg-primary text-white text-[8px] font-semibold uppercase tracking-[0.12em] rounded-full shadow-lg shadow-primary/20 flex items-center gap-1">
                  <CheckCircle2 size={9} />
                  Default
                </div>
              )}

              <div className="space-y-4">
                {/* Icon + Action buttons */}
                <div className="flex items-start justify-between">
                  <div className="size-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                    <MapPin size={19} />
                  </div>
                  <div className="flex items-center gap-1.5 transition-opacity">
                    <button
                      onClick={() => openEditDialog(address)}
                      className="size-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-500 hover:bg-zinc-900 hover:text-white transition-all"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="size-8 rounded-lg bg-zinc-50 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Name + Address */}
                <div className="space-y-1">
                  <h3 className="font-figtree text-sm md:text-base font-semibold text-zinc-900 line-clamp-1">
                    {[address.firstName, address.lastName].filter(Boolean).join(" ")}
                  </h3>
                  <p className="font-figtree text-xs text-zinc-500 font-normal leading-relaxed line-clamp-3">
                    {address.address1}
                    {address.address2 ? `, ${address.address2}` : ""},{" "}
                    {address.city}, {address.province} {address.zip}
                  </p>
                </div>

                {/* Footer: phone + set default */}
                <div className="pt-3 border-t border-zinc-50 flex items-center justify-between">
                  <span className="font-figtree text-[9px] font-semibold text-zinc-300 uppercase tracking-[0.12em]">
                    {address.phone || "No phone"}
                  </span>
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="font-figtree text-[9px] font-semibold text-primary uppercase tracking-[0.12em] hover:underline"
                    >
                      Set Default
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* ── Empty State ── */}
          {addresses.length === 0 && (
            <div className="col-span-full py-16 md:py-20 text-center space-y-5 md:space-y-6 bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-zinc-100">
              <div className="size-16 md:size-20 bg-zinc-50 text-zinc-300 rounded-3xl flex items-center justify-center mx-auto">
                <MapPin size={34} />
              </div>
              <div className="space-y-2">
                <h3 className="font-figtree text-lg md:text-2xl font-bold text-zinc-900">
                  No addresses saved
                </h3>
                <p className="font-figtree text-sm text-zinc-500 font-normal max-w-sm mx-auto leading-relaxed">
                  Add a shipping address to make your checkout experience seamless.
                </p>
              </div>
              <button
                onClick={openCreateDialog}
                className="font-figtree px-8 md:px-10 py-3.5 md:py-4 bg-primary text-white text-xs font-semibold uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 transition-transform"
              >
                Add My First Address
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Address Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl p-0 rounded-[1.5rem] sm:rounded-[2rem] border-none shadow-2xl flex flex-col max-h-[90vh] lg:max-h-[85vh] overflow-hidden w-[95vw] sm:w-full mx-auto">

          {/* Scrollable Form Body */}
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">

            {/* Dialog Header */}
            <div className="flex items-start justify-between gap-4 shrink-0">
              <div>
                <DialogTitle className="font-figtree text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">
                  {dialogMode === "edit" ? "Edit Address" : "Add New Address"}
                </DialogTitle>
                <DialogDescription className="font-figtree text-sm text-zinc-400 font-normal mt-1 leading-relaxed">
                  Provide your address details below for accurate delivery.
                </DialogDescription>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1">
                  <Input
                    placeholder="First name *"
                    value={addressForm.firstName}
                    onChange={(e) => setAddressForm({ ...addressForm, firstName: e.target.value })}
                    className={cn(
                      "font-figtree h-12 md:h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white transition-all font-medium text-sm placeholder:text-zinc-400",
                      showErrors && !addressForm.firstName && "border-rose-500 bg-rose-50/30"
                    )}
                  />
                  {showErrors && !addressForm.firstName && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest ml-4 animate-in fade-in slide-in-from-top-1">Required</p>}
                </div>
                <div className="space-y-1">
                  <Input
                    placeholder="Last name *"
                    value={addressForm.lastName}
                    onChange={(e) => setAddressForm({ ...addressForm, lastName: e.target.value })}
                    className={cn(
                      "font-figtree h-12 md:h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white transition-all font-medium text-sm placeholder:text-zinc-400",
                      showErrors && !addressForm.lastName && "border-rose-500 bg-rose-50/30"
                    )}
                  />
                  {showErrors && !addressForm.lastName && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest ml-4 animate-in fade-in slide-in-from-top-1">Required</p>}
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Input
                    placeholder="Address *"
                    value={addressForm.address1}
                    onChange={(e) => setAddressForm({ ...addressForm, address1: e.target.value })}
                    className={cn(
                      "font-figtree h-12 md:h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white transition-all font-medium text-sm placeholder:text-zinc-400",
                      showErrors && !addressForm.address1 && "border-rose-500 bg-rose-50/30"
                    )}
                  />
                  {showErrors && !addressForm.address1 && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest ml-4 animate-in fade-in slide-in-from-top-1">Required</p>}
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Input
                    placeholder="Street / Locality"
                    value={addressForm.address2}
                    onChange={(e) => setAddressForm({ ...addressForm, address2: e.target.value })}
                    className="font-figtree h-12 md:h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white transition-all font-medium text-sm placeholder:text-zinc-400"
                  />
                </div>
                <div className="space-y-1">
                  <Input
                    placeholder="City *"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className={cn(
                      "font-figtree h-12 md:h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white transition-all font-medium text-sm placeholder:text-zinc-400",
                      showErrors && !addressForm.city && "border-rose-500 bg-rose-50/30"
                    )}
                  />
                  {showErrors && !addressForm.city && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest ml-4 animate-in fade-in slide-in-from-top-1">Required</p>}
                </div>
                <div className="space-y-1">
                  <Input
                    placeholder="State *"
                    value={addressForm.province}
                    onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                    className={cn(
                      "font-figtree h-12 md:h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white transition-all font-medium text-sm placeholder:text-zinc-400",
                      showErrors && !addressForm.province && "border-rose-500 bg-rose-50/30"
                    )}
                  />
                  {showErrors && !addressForm.province && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest ml-4 animate-in fade-in slide-in-from-top-1">Required</p>}
                </div>
                <div className="space-y-1">
                  <Input
                    placeholder="PIN code *"
                    value={addressForm.zip}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setAddressForm({ ...addressForm, zip: val });
                    }}
                    className={cn(
                      "font-figtree h-12 md:h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white transition-all font-medium text-sm placeholder:text-zinc-400",
                      showErrors && !addressForm.zip && "border-rose-500 bg-rose-50/30"
                    )}
                  />
                  {showErrors && !addressForm.zip && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest ml-4 animate-in fade-in slide-in-from-top-1">Required</p>}
                </div>
                <div className="space-y-1">
                  <Input
                    type="tel"
                    placeholder="Phone (10 digits) *"
                    value={addressForm.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setAddressForm({ ...addressForm, phone: val });
                    }}
                    className={cn(
                      "font-figtree h-12 md:h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white transition-all font-medium text-sm placeholder:text-zinc-400",
                      showErrors && !addressForm.phone && "border-rose-500 bg-rose-50/30"
                    )}
                  />
                  {showErrors && !addressForm.phone && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest ml-4 animate-in fade-in slide-in-from-top-1">Required</p>}
                </div>
              </div>

              {/* Make Default Checkbox */}
              <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl">
                <Checkbox
                  id="make-default"
                  checked={makeDefault}
                  onCheckedChange={(checked) => setMakeDefault(Boolean(checked))}
                  className="border-zinc-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0"
                />
                <label
                  htmlFor="make-default"
                  className="font-figtree text-xs font-semibold text-zinc-600 uppercase tracking-[0.13em] cursor-pointer leading-relaxed flex-1"
                >
                  Set as my default address
                </label>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="px-6 py-4 md:py-5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="font-figtree w-full sm:w-auto px-6 md:px-8 h-11 md:h-14 border-zinc-200 text-zinc-600 font-semibold rounded-2xl text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAddress}
              disabled={saving}
              className="font-figtree w-full sm:w-auto px-10 md:px-12 h-11 md:h-14 bg-primary hover:opacity-90 text-white font-semibold rounded-2xl transition-all shadow-xl shadow-primary/20 text-sm"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Save Address"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}