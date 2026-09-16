"use client";

// "Booking Summary" — the store visit drawer: which store, which day, which
// slot, and who is coming. The day/slot picker itself is shared with the
// video-call and try-at-home cards (see DateTimePicker).

import React from "react";
import { Store as StoreIcon, UserRound } from "lucide-react";
import SideDrawer from "./SideDrawer";
import DateTimePicker, { SectionLabel, useSlotPicker } from "./DateTimePicker";
import {
  PrimaryButton,
  TextField,
  PhoneField,
  SelectField,
  CategoryPicker,
  SecureNote,
  VerifiedNote,
} from "./parts";
import {
  storeLabel,
  storeAddress,
  formatDistance,
  PRODUCT_CATEGORIES,
  VISIT_PURPOSES,
} from "@/lib/bookAppointment";

export default function BookingSummaryDrawer({
  open,
  onClose,
  store,
  account,
  isVerifiedNumber,
  onChangeStore,
  onSubmit,
  submitting,
  error,
}) {
  const picker = useSlotPicker();

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [purpose, setPurpose] = React.useState("");
  const [categories, setCategories] = React.useState([]);
  const [errors, setErrors] = React.useState({});

  // Every open starts on a fresh picker (today, or the first day that still has
  // a slot). A signed-in shopper also gets their own details back rather than
  // retyping what the account already holds. Derived during render rather than
  // in an effect (see VideoCallCard).
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      picker.reset();
      setErrors({});
      setName(account?.name || "");
      setPhone(account?.phone || "");
      setEmail(account?.email || "");
    }
  }

  const skipsOtp = !!isVerifiedNumber?.(phone);

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = "Please enter your name.";
    if (phone.length !== 10) next.phone = "Enter a valid 10-digit mobile number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (!picker.selection) next.slot = "Please pick a time slot.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      name: name.trim(),
      phone,
      email: email.trim(),
      purpose,
      categories,
      ...picker.selection,
    });
  };

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title="Booking Summary"
      footer={
        <div className="flex flex-col gap-2.5">
          {error && <p className="text-[11px] text-red-500 font-figtree">{error}</p>}
          {skipsOtp ? <VerifiedNote name={account?.name} /> : <SecureNote />}
          <PrimaryButton onClick={handleSubmit} loading={submitting}>
            Book Now
          </PrimaryButton>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Store */}
        <div className="border border-gray-100 bg-gray-50/50 rounded-sm p-3.5 flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <span className="flex items-center gap-1.5 font-figtree font-bold text-sm text-black">
              <StoreIcon size={14} className="text-primary" />
              {storeLabel(store)}
              {store?.distance !== null && store?.distance !== undefined && (
                <span className="font-normal text-zinc-500">({formatDistance(store.distance)})</span>
              )}
            </span>
            <button
              type="button"
              onClick={onChangeStore}
              className="text-[11px] font-figtree font-bold text-primary uppercase tracking-wide hover:underline shrink-0 cursor-pointer"
            >
              Change
            </button>
          </div>
          <p className="text-xs text-zinc-500 font-figtree leading-relaxed">{storeAddress(store)}</p>
        </div>

        <DateTimePicker
          picker={picker}
          error={errors.slot}
          onChange={() => setErrors((e) => ({ ...e, slot: undefined }))}
        />

        {/* Details */}
        <div className="flex flex-col gap-2.5">
          <SectionLabel icon={UserRound}>Enter Details</SectionLabel>
          <TextField
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter Name Here *"
            label="Name"
            error={errors.name}
            maxLength={60}
          />
          <PhoneField value={phone} onChange={setPhone} error={errors.phone} />
          <TextField
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter Mail Id Here *"
            label="Email"
            error={errors.email}
          />
          <SelectField
            value={purpose}
            onChange={setPurpose}
            options={VISIT_PURPOSES}
            placeholder="Purpose of Visit"
          />
          <CategoryPicker selected={categories} onChange={setCategories} options={PRODUCT_CATEGORIES} />
        </div>
      </div>
    </SideDrawer>
  );
}
