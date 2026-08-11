"use client";

import { ChevronDownIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { INDIAN_STATES } from "@/lib/checkout/address-helpers";

export function AddressForm({
  form,
  onChange,
  makeDefault,
  onDefaultChange,
  submitLabel,
  onSubmit,
  saving,
  isMobile = false,
  disablePhone = false,
  hideEmail = false,
  formIdSuffix = isMobile ? "mobile" : "desktop",
  isCompanyPurchase = false,
  onCompanyPurchaseChange,
  showCompanyToggle = true,
  children,
}) {
  const handleCompanyToggle = (next) => {
    onCompanyPurchaseChange?.(next);
    if (!next) {
      onChange("company", "");
      onChange("gstin", "");
    }
  };

  // The state dropdown is a fixed list, but pincode autofill (or a saved
  // address) can return a value that isn't in it — keep that value
  // selectable instead of silently blanking the field.
  const stateOptions =
    form.province && !INDIAN_STATES.includes(form.province) ? [form.province, ...INDIAN_STATES] : INDIAN_STATES;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="First Name" value={form.firstName} onChange={(e) => onChange("firstName", e.target.value)} className="h-12 border-zinc-200 bg-white" />
        <Input placeholder="Last Name" value={form.lastName} onChange={(e) => onChange("lastName", e.target.value)} className="h-12 border-zinc-200 bg-white" />

        {showCompanyToggle && (
          <div className="col-span-2 flex items-center justify-between gap-4 mt-1 mb-2">
            <label htmlFor={`company-purchase-${formIdSuffix}`} className="text-[13px] font-medium text-zinc-500 cursor-pointer">
              Purchasing for / under Company
            </label>
            <ToggleSwitch id={`company-purchase-${formIdSuffix}`} checked={isCompanyPurchase} onCheckedChange={handleCompanyToggle} />
          </div>
        )}

        {isCompanyPurchase && (
          <>
            <Input placeholder="Company Name" value={form.company} onChange={(e) => onChange("company", e.target.value)} className="h-12 border-zinc-200 bg-white" />
            {form.country.trim().toLowerCase() === "india" ? (
              <Input
                placeholder="GSTIN (optional)"
                value={form.gstin}
                onChange={(e) => onChange("gstin", e.target.value.toUpperCase())}
                maxLength={15}
                className="h-12 border-zinc-200 bg-white"
              />
            ) : (
              <div className="hidden" />
            )}
          </>
        )}

        <div className="col-span-2">
          <Input placeholder="Address" value={form.address1} onChange={(e) => onChange("address1", e.target.value)} className="h-12 border-zinc-200 bg-white" />
        </div>
        <div className="col-span-2">
          <Input placeholder="Landmark (Optional)" value={form.address2} onChange={(e) => onChange("address2", e.target.value)} className="h-12 border-zinc-200 bg-white" />
        </div>

        <Input
          placeholder="Pincode"
          value={form.zip}
          maxLength={6}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            onChange("zip", value);
          }}
          className="h-12 border-zinc-200 bg-white"
        />
        <Input placeholder="City" value={form.city} onChange={(e) => onChange("city", e.target.value)} className="h-12 border-zinc-200 bg-white" />

        <div className="relative w-full">
          <select
            value={form.province}
            onChange={(e) => onChange("province", e.target.value)}
            className="h-12 w-full appearance-none rounded-md border border-zinc-200 bg-white px-3 pr-9 text-sm outline-none"
          >
            <option value="" disabled>
              State
            </option>
            {stateOptions.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 opacity-50" aria-hidden="true" />
        </div>
        <Input placeholder="Country/Region" value={form.country} onChange={(e) => onChange("country", e.target.value)} readOnly className="h-12 border-zinc-200 bg-white" />

        <div className="col-span-2 flex items-center h-12 rounded-md border border-zinc-200 bg-white px-3 has-[input:disabled]:opacity-50">
          <span className="text-sm text-zinc-900 mr-2">+91</span>
          <input
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            disabled={disablePhone}
            className="h-full grow bg-transparent outline-none text-sm text-zinc-900 placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
        </div>
        {!hideEmail && (
          <div className="col-span-2">
            <Input
              placeholder="Mail Id"
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
              className="h-12 border-zinc-200 bg-white"
            />
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id={`make-default-${formIdSuffix}`} checked={makeDefault} onCheckedChange={(checked) => onDefaultChange(Boolean(checked))} />
        <label htmlFor={`make-default-${formIdSuffix}`} className="text-sm font-medium text-zinc-700 cursor-pointer">
          Use this as my Default Shopping Address
        </label>
      </div>

      {children ? (
        <div className="flex items-center justify-between gap-4">
          <Button type="button" onClick={onSubmit} disabled={saving} className={`grow md:grow-0 h-14 md:h-12 bg-[#5A413F] hover:bg-[#4a3533] text-white font-medium text-base tracking-wide ${isMobile ? 'rounded-full uppercase tracking-widest' : 'rounded-md'}`}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : submitLabel}
          </Button>
          {children}
        </div>
      ) : (
        <Button type="button" onClick={onSubmit} disabled={saving} className={`w-full md:w-full h-14 md:h-12 bg-[#5A413F] hover:bg-[#4a3533] text-white font-medium text-base tracking-wide ${isMobile ? 'rounded-full uppercase tracking-widest' : 'rounded-md'}`}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : submitLabel}
        </Button>
      )}
    </div>
  );
}
