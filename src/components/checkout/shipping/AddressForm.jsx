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

  const inputClasses = "h-[48px] rounded-[4px] border border-zinc-200 bg-[#FAFAFA] shadow-none font-figtree text-[0.9375rem] lg:text-[1.05rem] placeholder:text-zinc-400 text-zinc-900";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {showCompanyToggle && (
          <div className="col-span-2 flex items-center justify-between gap-4 mb-1">
            <label htmlFor={`company-purchase-${formIdSuffix}`} className="text-[0.875rem] font-medium font-figtree text-zinc-400 cursor-pointer">
              Purchasing for / under Company
            </label>
            <ToggleSwitch id={`company-purchase-${formIdSuffix}`} checked={isCompanyPurchase} onCheckedChange={handleCompanyToggle} />
          </div>
        )}

        <Input placeholder="First Name" value={form.firstName} onChange={(e) => onChange("firstName", e.target.value)} className={inputClasses} />
        <Input placeholder="Last Name" value={form.lastName} onChange={(e) => onChange("lastName", e.target.value)} className={inputClasses} />

        {isCompanyPurchase && (
          <>
            <div className="col-span-2">
              <Input placeholder="Company Name" value={form.company} onChange={(e) => onChange("company", e.target.value)} className={inputClasses} />
            </div>
            {form.country.trim().toLowerCase() === "india" ? (
              <div className="col-span-2">
                <Input
                  placeholder="GSTIN"
                  value={form.gstin}
                  onChange={(e) => onChange("gstin", e.target.value.toUpperCase())}
                  maxLength={15}
                  className={inputClasses}
                />
              </div>
            ) : (
              <div className="hidden" />
            )}
          </>
        )}

        <div className="col-span-2">
          <Input placeholder="Address" value={form.address1} onChange={(e) => onChange("address1", e.target.value)} className={inputClasses} />
        </div>
        <div className="col-span-2">
          <Input placeholder="Landmark (Optional)" value={form.address2} onChange={(e) => onChange("address2", e.target.value)} className={inputClasses} />
        </div>

        <Input
          placeholder="Pincode"
          value={form.zip}
          maxLength={6}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            onChange("zip", value);
          }}
          className={inputClasses}
        />
        <Input placeholder="City" value={form.city} onChange={(e) => onChange("city", e.target.value)} className={inputClasses} />

        <div className="relative w-full">
          <select
            value={form.province}
            onChange={(e) => onChange("province", e.target.value)}
            className={`w-full appearance-none px-3 pr-9 outline-none border ${inputClasses}`}
          >
            <option value="" disabled className="text-zinc-500">
              State
            </option>
            {stateOptions.map((state) => (
              <option key={state} value={state} className="text-zinc-900">
                {state}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="text-zinc-500 pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" aria-hidden="true" />
        </div>
        <Input placeholder="Country/Region" value={form.country} onChange={(e) => onChange("country", e.target.value)} readOnly className={inputClasses} />

        <div className={`col-span-2 flex items-center px-3 has-[input:disabled]:opacity-50 border ${inputClasses}`}>
          <span className="text-[0.9375rem] font-figtree text-zinc-900 mr-2">+91</span>
          <input
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            disabled={disablePhone}
            className="h-full grow bg-transparent outline-none text-[0.9375rem] lg:text-[1.05rem] font-figtree text-zinc-900 placeholder:text-zinc-400 disabled:cursor-not-allowed"
          />
        </div>
        {!hideEmail && (
          <div className="col-span-2">
            <Input
              placeholder="Mail Id"
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
              className={inputClasses}
            />
          </div>
        )}
      </div>

      <div className="flex items-start space-x-3 pt-2">
        <Checkbox id={`make-default-${formIdSuffix}`} checked={makeDefault} onCheckedChange={(checked) => onDefaultChange(Boolean(checked))} className="mt-0.5 border-zinc-300 data-[state=checked]:bg-[#5A413F] data-[state=checked]:border-[#5A413F]" />
        <label htmlFor={`make-default-${formIdSuffix}`} className="text-[0.875rem] font-figtree font-medium text-zinc-500 cursor-pointer">
          Use this as my Default Shopping Address
        </label>
      </div>

      {children ? (
        <div className="flex items-center justify-between gap-4 pt-2">
          <Button type="button" onClick={onSubmit} disabled={saving} className="grow md:grow-0 h-[48px] bg-transparent hover:bg-zinc-50 border border-[#5A413F] text-[#5A413F] font-figtree font-semibold text-[0.9375rem] rounded-[4px] transition-colors">
            {saving ? <Loader2 className="size-4 animate-spin" /> : submitLabel}
          </Button>
          {children}
        </div>
      ) : (
        <Button type="button" onClick={onSubmit} disabled={saving} className="w-full h-[48px] bg-transparent hover:bg-zinc-50 border border-[#5A413F] text-[#5A413F] font-figtree font-semibold text-[0.9375rem] rounded-[4px] transition-colors mt-2">
          {saving ? <Loader2 className="size-4 animate-spin" /> : submitLabel}
        </Button>
      )}
    </div>
  );
}
