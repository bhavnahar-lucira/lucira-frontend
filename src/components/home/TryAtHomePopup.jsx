"use client";

import React, { useState, useEffect } from "react";
import { X, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function TryAtHomePopup({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    firstName: "",
    phone: "",
    pinCode: "",
  });

  const [errors, setErrors] = useState({});

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        firstName: "",
        phone: "",
        pinCode: "",
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
    if (!formData.pinCode.trim()) {
      newErrors.pinCode = "Pin code is required";
    } else if (!/^\d{6}$/.test(formData.pinCode.trim())) {
      newErrors.pinCode = "Enter a valid 6-digit pin code";
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

  const handleWhatsAppAction = (type) => {
    if (validate()) {
      console.log(`Try At Home Request (${type}):`, formData);
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
              Try At Home
            </DialogTitle>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Select your favorite pieces & try them at home before you decide, see the fit, finish in your own space.
            </p>
          </DialogHeader>

          <div className="space-y-6">
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
              <Label htmlFor="pinCode" className="text-sm font-bold text-gray-900 block">
                Pin Code
              </Label>
              <Input
                id="pinCode"
                name="pinCode"
                placeholder="Enter your pin code"
                value={formData.pinCode}
                onChange={handleChange}
                className={`h-12 rounded-sm border-gray-300 focus:border-gray-500 focus-visible:ring-0 transition-all shadow-none placeholder:text-gray-400 ${
                  errors.pinCode ? "border-red-500" : ""
                }`}
              />
              {errors.pinCode && (
                <p className="text-red-500 text-xs mt-1">{errors.pinCode}</p>
              )}
            </div>

            <div className="pt-4 space-y-3">
              <Button
                onClick={() => handleWhatsAppAction("App")}
                className="w-full h-12 bg-[#25D366] hover:bg-[#1eb956] text-white font-bold text-sm tracking-wide rounded-sm transition-all shadow-none border-none"
              >
                Open WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => handleWhatsAppAction("Web")}
                className="w-full h-12 border-[#25D366] text-[#25D366] hover:bg-[#f0fff4] hover:text-[#1eb956] font-bold text-sm tracking-wide rounded-sm transition-all shadow-none"
              >
                Continue to WhatsApp Web
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
                <div className="w-5 h-5 bg-[#25D366] rounded-full flex items-center justify-center">
                    <MessageCircle size={12} className="text-white fill-white" />
                </div>
                <p className="text-gray-600 text-xs font-medium">
                    Don't have the app? <a href="#" className="text-gray-900 underline font-bold">Download it now</a>
                </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
