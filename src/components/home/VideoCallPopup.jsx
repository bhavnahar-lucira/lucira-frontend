"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function VideoCallPopup({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    firstName: "",
    phone: "",
    email: "",
  });

  const [errors, setErrors] = useState({});

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        firstName: "",
        phone: "",
        email: "",
      });
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
    if (!formData.email.trim()) {
      newErrors.email = "E-mail is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      newErrors.email = "Enter a valid email address";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log("Video Call Request Submitted:", formData);
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
              Schedule a Video Call
            </DialogTitle>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Shop live over video call view designs up close, compare pieces, and get expert guidance.
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
                value={formData.firstName}
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
                value={formData.phone}
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
              <Label htmlFor="email" className="text-sm font-bold text-gray-900 block">
                E-mail
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your e-mail ID"
                value={formData.email}
                onChange={handleChange}
                className={`h-12 rounded-sm border-gray-300 focus:border-gray-500 focus-visible:ring-0 transition-all shadow-none placeholder:text-gray-400 ${
                  errors.email ? "border-red-500" : ""
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div className="pt-2">
              <p className="text-gray-500 text-xs md:text-sm mb-6 leading-relaxed">
                Our team will contact you within the next 24 hours.
              </p>
              <Button
                type="submit"
                className="w-full h-14 bg-[#5A413F] hover:bg-[#4a3533] text-white font-bold text-base tracking-[0.15em] uppercase rounded-sm transition-all shadow-none"
              >
                SUBMIT
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
