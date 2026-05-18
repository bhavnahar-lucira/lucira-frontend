"use client";

import React, { useState, useEffect } from "react";
import { Sheet } from "react-modal-sheet";
import { X, Calendar, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CONTENT = {
  video: {
    title: "Schedule a Video Call",
    desc: "Shop live over video call view designs up close, compare pieces, and get expert guidance."
  },
  home: {
    title: "Book a Home Trial",
    desc: "Select your favorite pieces & try them at home before you decide, see the fit, finish in your own space."
  },
  appointment: {
    title: "Visit Our Store",
    desc: "Explore and try your favorite designs in person, with expert guidance from our in-store team."
  }
};

export default function ExploreBottomSheet({ activeType, onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Dynamic Form State
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [todayDate, setTodayDate] = useState("");

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setTodayDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  useEffect(() => {
    if (activeType) {
      setIsOpen(true);
      // Initialize form data based on type
      if (activeType === 'video') {
        setFormData({ firstName: "", phone: "", email: "" });
      } else if (activeType === 'home') {
        setFormData({ firstName: "", phone: "", pinCode: "" });
      } else if (activeType === 'appointment') {
        setFormData({ firstName: "", phone: "", store: "Chembur- Mumbai", date: "", time: "" });
      }
      setErrors({});
    } else {
      setIsOpen(false);
    }
  }, [activeType]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName?.trim()) newErrors.firstName = "First name is required";
    if (!formData.phone?.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    if (activeType === 'video') {
      if (!formData.email?.trim()) {
        newErrors.email = "E-mail is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
        newErrors.email = "Enter a valid email address";
      }
    }

    if (activeType === 'home') {
      if (!formData.pinCode?.trim()) {
        newErrors.pinCode = "Pin code is required";
      } else if (!/^\d{6}$/.test(formData.pinCode.trim())) {
        newErrors.pinCode = "Enter a valid 6-digit pin code";
      }
    }

    if (activeType === 'appointment') {
      if (!formData.store) newErrors.store = "Please select a store";
      if (!formData.date) newErrors.date = "Date is required";
      if (!formData.time) newErrors.time = "Time is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (value) => {
    setFormData((prev) => ({ ...prev, store: value }));
    if (errors.store) setErrors((prev) => ({ ...prev, store: "" }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (validate()) {
      console.log(`${activeType} Request Submitted:`, formData);
      handleClose();
    }
  };

  if (!activeType && !isOpen) return null;
  const content = CONTENT[activeType] || CONTENT.video;

  return (
    <Sheet 
      isOpen={isOpen} 
      onClose={handleClose}
      snapPoints={[0, 0.95, 1]}
      initialSnap={1}
    >
      <Sheet.Container className="!rounded-t-[32px] overflow-hidden">
        <Sheet.Header />
        <Sheet.Content className="px-6 pb-12 overflow-y-auto no-scrollbar">
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-start mb-6 gap-2">
              <div className="flex-1 pr-8">
                <h2 className="text-2xl font-black font-abhaya text-zinc-900 mb-2 leading-tight">
                  {content.title}
                </h2>
                <p className="text-zinc-600 text-[13px] leading-relaxed">
                  {content.desc}
                </p>
              </div>
              <button 
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 active:scale-90 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-sm font-bold text-zinc-900 block ml-0.5">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="Enter your first name"
                  value={formData.firstName || ""}
                  onChange={handleChange}
                  className={`h-12 rounded-xl border-zinc-200 focus:border-zinc-900 focus-visible:ring-0 transition-all shadow-none ${errors.firstName ? "border-red-500" : ""}`}
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1 ml-1">{errors.firstName}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-bold text-zinc-900 block ml-0.5">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  className={`h-12 rounded-xl border-zinc-200 focus:border-zinc-900 focus-visible:ring-0 transition-all shadow-none ${errors.phone ? "border-red-500" : ""}`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1 ml-1">{errors.phone}</p>}
              </div>

              {activeType === 'video' && (
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-bold text-zinc-900 block ml-0.5">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your e-mail ID"
                    value={formData.email || ""}
                    onChange={handleChange}
                    className={`h-12 rounded-xl border-zinc-200 focus:border-zinc-900 focus-visible:ring-0 transition-all shadow-none ${errors.email ? "border-red-500" : ""}`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
                </div>
              )}

              {activeType === 'home' && (
                <div className="space-y-1.5">
                  <Label htmlFor="pinCode" className="text-sm font-bold text-zinc-900 block ml-0.5">
                    Pin Code
                  </Label>
                  <Input
                    id="pinCode"
                    name="pinCode"
                    placeholder="Enter your pin code"
                    value={formData.pinCode || ""}
                    onChange={handleChange}
                    className={`h-12 rounded-xl border-zinc-200 focus:border-zinc-900 focus-visible:ring-0 transition-all shadow-none ${errors.pinCode ? "border-red-500" : ""}`}
                  />
                  {errors.pinCode && <p className="text-red-500 text-xs mt-1 ml-1">{errors.pinCode}</p>}
                </div>
              )}

              {activeType === 'appointment' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="store" className="text-sm font-bold text-zinc-900 block ml-0.5">
                      Store
                    </Label>
                    <Select value={formData.store || ""} onValueChange={handleSelectChange}>
                      <SelectTrigger className={`h-12 w-full rounded-xl border-zinc-200 focus:border-zinc-900 focus:ring-0 shadow-none ${errors.store ? "border-red-500" : ""}`}>
                        <SelectValue placeholder="Select a store" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Chembur- Mumbai">Chembur- Mumbai</SelectItem>
                        <SelectItem value="Bandra- Mumbai">Bandra- Mumbai</SelectItem>
                        <SelectItem value="Andheri- Mumbai">Andheri- Mumbai</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.store && <p className="text-red-500 text-xs mt-1 ml-1">{errors.store}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="date" className="text-sm font-bold text-zinc-900 block ml-0.5">
                        Date
                      </Label>
                      <div className="relative">
                        <Input
                          id="date"
                          name="date"
                          type="date"
                          min={todayDate}
                          value={formData.date || ""}
                          onChange={handleChange}
                          className={`h-12 rounded-xl border-zinc-200 focus:border-zinc-900 focus-visible:ring-0 transition-all shadow-none appearance-none pr-10 ${errors.date ? "border-red-500" : ""}`}
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={20} />
                      </div>
                      {errors.date && <p className="text-red-500 text-xs mt-1 ml-1">{errors.date}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="time" className="text-sm font-bold text-zinc-900 block ml-0.5">
                        Time
                      </Label>
                      <div className="relative">
                        <Input
                          id="time"
                          name="time"
                          type="time"
                          value={formData.time || ""}
                          onChange={handleChange}
                          className={`h-12 rounded-xl border-zinc-200 focus:border-zinc-900 focus-visible:ring-0 transition-all shadow-none appearance-none pr-10 ${errors.time ? "border-red-500" : ""}`}
                        />
                        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={20} />
                      </div>
                      {errors.time && <p className="text-red-500 text-xs mt-1 ml-1">{errors.time}</p>}
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4">
                <p className="text-zinc-500 text-[11px] mb-6 leading-relaxed text-center">
                  Our team will contact you within the next 24 hours.
                </p>
                {activeType === 'home' ? (
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleSubmit()}
                      className="w-full h-14 bg-[#25D366] hover:bg-[#1eb956] text-white font-bold text-base tracking-[0.1em] uppercase rounded-xl transition-all shadow-none border-none"
                    >
                      Open WhatsApp
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="submit"
                    className="w-full h-14 bg-[#5A413F] hover:bg-[#4a3533] text-white font-bold text-base tracking-[0.15em] uppercase rounded-xl transition-all shadow-none"
                  >
                    {activeType === 'appointment' ? 'BOOK APPOINTMENT' : 'SUBMIT'}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop onTap={handleClose} />

      <style jsx global>{`
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }
      `}</style>
    </Sheet>
  );
}
