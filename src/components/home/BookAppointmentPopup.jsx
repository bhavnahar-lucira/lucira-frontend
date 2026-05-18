"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export default function BookAppointmentPopup({ isOpen, onClose }) {
  const initialFormState = {
    firstName: "",
    phone: "",
    store: "Chembur- Mumbai",
    date: "",
    time: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [todayDate, setTodayDate] = useState("");

  // Set today's date for min constraint
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setTodayDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormState);
      setErrors({});
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }
    if (!formData.store) {
      newErrors.store = "Please select a store";
    }
    if (!formData.date) {
      newErrors.date = "Date is required";
    }
    if (!formData.time) {
      newErrors.time = "Time is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value || "" }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (value) => {
    setFormData((prev) => ({ ...prev, store: value || "" }));
    if (errors.store) {
      setErrors((prev) => ({ ...prev, store: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log("Book Appointment Request Submitted:", formData);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[500px] p-0 overflow-hidden border-none rounded-sm shadow-2xl"
        showCloseButton={false}
      >
        <div className="bg-white p-8 md:p-10 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors p-1 z-[210] cursor-pointer"
          >
            <X size={24} />
          </button>

          <DialogHeader className="text-left p-0 mb-8">
            <DialogTitle className="text-2xl md:text-3xl font-bold font-abhaya text-gray-900 mb-4 tracking-tight">
              Visit Our Store
            </DialogTitle>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Explore and try your favorite designs in person, with expert guidance from our in-store team.
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-bold text-gray-900 block">
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Enter your first name"
                value={formData.firstName || ""}
                onChange={handleChange}
                className={`h-12 rounded-sm border-gray-300 focus:border-gray-500 focus-visible:ring-0 transition-all shadow-none placeholder:text-gray-400 ${
                  errors.firstName ? "border-red-500" : ""
                }`}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-bold text-gray-900 block">
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone || ""}
                onChange={handleChange}
                className={`h-12 rounded-sm border-gray-300 focus:border-gray-500 focus-visible:ring-0 transition-all shadow-none placeholder:text-gray-400 ${
                  errors.phone ? "border-red-500" : ""
                }`}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="store" className="text-sm font-bold text-gray-900 block">
                Store
              </Label>
              <Select value={formData.store || ""} onValueChange={handleSelectChange}>
                <SelectTrigger className={`h-12 w-full rounded-sm border-gray-300 focus:border-gray-500 focus:ring-0 shadow-none ${errors.store ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Select a store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chembur- Mumbai">Chembur- Mumbai</SelectItem>
                  <SelectItem value="Bandra- Mumbai">Bandra- Mumbai</SelectItem>
                  <SelectItem value="Andheri- Mumbai">Andheri- Mumbai</SelectItem>
                </SelectContent>
              </Select>
              {errors.store && (
                <p className="text-red-500 text-xs mt-1">{errors.store}</p>
              )}
            </div>

            {/* Date and Time Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-bold text-gray-900 block">
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
                    className={`h-12 rounded-sm border-gray-300 focus:border-gray-500 focus-visible:ring-0 transition-all shadow-none appearance-none pr-10 ${
                      errors.date ? "border-red-500" : ""
                    }`}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>
                {errors.date && (
                  <p className="text-red-500 text-xs mt-1">{errors.date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="text-sm font-bold text-gray-900 block">
                  Time
                </Label>
                <div className="relative">
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    value={formData.time || ""}
                    onChange={handleChange}
                    className={`h-12 rounded-sm border-gray-300 focus:border-gray-500 focus-visible:ring-0 transition-all shadow-none appearance-none pr-10 ${
                      errors.time ? "border-red-500" : ""
                    }`}
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>
                {errors.time && (
                  <p className="text-red-500 text-xs mt-1">{errors.time}</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-gray-500 text-xs md:text-sm mb-6 leading-relaxed">
                Our team will contact you within the next 24 hours.
              </p>
              <Button
                type="submit"
                className="w-full h-14 bg-[#5A413F] hover:bg-[#4a3533] text-white font-bold text-base tracking-[0.15em] uppercase rounded-sm transition-all shadow-none"
              >
                BOOK APPOINTMENT
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
      
      {/* Remove browser default date/time icons to use our custom ones */}
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
    </Dialog>
  );
}
