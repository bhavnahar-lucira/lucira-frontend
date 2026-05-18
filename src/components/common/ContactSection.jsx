"use client";

import React from "react";
import Image from "next/image";
import { Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import { setCookie } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const STORES = [
  {
    name: "Head Office",
    phone: "+91 90044 36052",
    email: "care@lucirajewelry.com",
    address: "Office 1402-2, DLH Park, 14th Floor,\nSV Rd, Mumbai, Maharashtra 400062",
    image: "https://luciraonline.myshopify.com/cdn/shop/files/Lucira_contact_us_grid_900x.png?v=1757660196",
    mapLink: "https://www.google.com/maps/place/Lucira+Jewelry+%7C+Jewellery+Store+in+Mumbai/data=!4m2!3m1!1s0x0:0x268fe0bb8a89f9bb?sa=X&ved=1t:2428&ictx=111",
    isHeadOffice: true
  },
  {
    name: "Borivali Store",
    phone: "+91 8433667238",
    email: "lcmbombor@lucirajewelry.com",
    address: "Sky City Mall, S-40, 2nd Floor,\nWestern Express Hwy, Borivali East,\nMumbai - 400066",
    image: "https://luciraonline.myshopify.com/cdn/shop/files/Store-Collection-Banner3_jpg_900x.jpg?v=1769237134",
    mapLink: "https://www.google.com/maps/place/Lucira+Jewelry+%7C+Jewelry+Store+in+Borivali+Mumbai/data=!4m2!3m1!1s0x0:0x8e0b915ac78ac1?sa=X&ved=1t:2428&ictx=111"
  },
  {
    name: "Chembur Store",
    phone: "+91 9004402038",
    email: "lcsbomchb@lucirajewelry.com",
    address: "Shop No. 3 Ground Floor, 487, Geraldine CHS LTD,\nCentral Ave Rd, Chembur,\nMumbai, Maharashtra 400071",
    image: "https://luciraonline.myshopify.com/cdn/shop/files/Store-Collection-Banner-2_900x.jpg?v=1760699342",
    mapLink: "https://www.google.com/maps/place/Lucira+Jewelry+%7C+Jewellery+Store+in+Chembur+Mumbai/@19.0576005,72.898121,17z/data=!3m1!4b1!4m6!3m5!1s0x3be7c782f7511b79:0xaa877f3bbd754bfc!8m2!3d19.0575954!4d72.9006959!16s%2Fg%2F11xtgz09vw"
  },
  {
    name: "Pune Store",
    phone: "+91 8433667236",
    email: "lcspnqjmr@lucirajewelry.com",
    address: "Shop no. 3,4, Balgandharv Chowk, Sai Square,\n5 & 6, Jangali Maharaj Rd,\nPune, Maharashtra 411005",
    image: "https://luciraonline.myshopify.com/cdn/shop/files/Store-PLP-2_900x.jpg?v=1765807125",
    mapLink: "https://www.google.com/maps/place/Lucira+Jewelry+%7C+Jewellery+Store+in+JM+Road+Pune/@18.5233058,73.8452878,17z/data=!3m1!4b1!4m6!3m5!1s0x3bc2c1929b1639f7:0x7d0f5ff74de52a8d!8m2!3d18.5233007!4d73.8478627"
  },
  {
    name: "Noida Store",
    phone: "+91 8657392887",
    email: "lcnois18@lucirajewelry.com",
    address: "SCO-17, Wave One Courtyard, Sector 18,\nGautam Buddha Nagar, Noida,\nUttar Pradesh: 201301",
    image: "https://luciraonline.myshopify.com/cdn/shop/files/Noida_Store_1920_823_jpg_1920x823_crop_center.jpg?v=1776422892",
    mapLink: "https://www.google.com/maps/place/Lucira+Jewelry+%7C+Jewellery+Store+in+Wave+One+Mall,+Noida/data=!4m2!3m1!1s0x0:0xbdc183588be81689?sa=X&ved=1t:2428&ictx=111"
  }
];

export default function ContactSection() {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [submitted, setSubmitted] = React.useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, "").slice(0, 10) }));
    } else if (name === "name") {
      setFormData(prev => ({ ...prev, [name]: value.replace(/[^A-Za-z\s]/g, "") }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (formData.phone.length !== 10) {
      toast.error("Phone number must be 10 digits");
      return;
    }

    setCookie("contactFormData", formData, 30);
    const waMessage = `Hi Lucira, I'd like to get in touch.\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nMessage: ${formData.message || "No message provided"}`;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=+919004435760&text=${encodeURIComponent(waMessage)}`;

    window.open(whatsappUrl, "_blank");
    setSubmitted(true);
    toast.success("Thank you! Our concierge will contact you soon.");
  };

  if (submitted) {
    return (
      <section className="w-full py-24 bg-[#FEF5F1] text-center animate-in fade-in duration-700 px-4">
        <div className="max-w-xl mx-auto bg-white p-12 rounded-[4px] shadow-sm border border-[#FAF5F2]">
            <h2 className="text-4xl font-extrabold font-abhaya text-zinc-900 mb-6">Thank You!</h2>
            <p className="text-zinc-600 font-figtree text-lg leading-relaxed mb-8">
            Your inquiry has been sent. A Lucira jewelry expert will reach out to you shortly.
            </p>
            <Button 
            onClick={() => setSubmitted(false)}
            className="bg-primary text-white font-bold uppercase tracking-widest px-10 h-14 rounded-[4px] hover:bg-primary/90 transition-all border-none shadow-none"
            >
            Send another message
            </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="w-full bg-white overflow-x-hidden">
      {/* STORES GRID SECTION (HERO HEADING) */}
      <section className="container-main py-16 md:py-24">
        <div className="text-center mb-16 md:mb-24 space-y-4">
            <h1 className="main-title font-extrabold font-abhaya text-4xl md:text-5xl tracking-tight text-zinc-900">
                Contact Us
            </h1>
            <p className="max-w-3xl mx-auto text-gray-600 text-base md:text-lg font-figtree leading-relaxed">
                Connect with us for bespoke assistance and exclusive jewelry consultations — your journey to timeless elegance begins here
            </p>
        </div>

        <div className="grid grid-cols-1 gap-12 md:gap-20">
            {STORES.map((store, index) => (
            <div 
                key={index}
                className="group grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center"
            >
                {/* IMAGE - Reversible pattern */}
                <div className={`relative aspect-[16/9] md:aspect-[4/3] overflow-hidden ${index % 2 === 1 ? "lg:order-2" : ""}`}>
                <div className={`${store.isHeadOffice ? "rounded-none" : "rounded-[4px] shadow-sm"} w-full h-full overflow-hidden bg-zinc-50`}>
                    <Image
                        src={store.image}
                        alt={store.name}
                        fill
                        className={`object-cover transition-transform duration-1000 ${store.isHeadOffice ? "group-hover:scale-105" : "group-hover:scale-110"}`}
                    />
                </div>
                </div>

                {/* INFO */}
                <div className={`space-y-6 md:space-y-10 ${index % 2 === 1 ? "lg:order-1" : ""}`}>
                    <div className="space-y-3">
                        <h3 className="text-3xl md:text-4xl font-extrabold font-abhaya text-primary">
                            {store.name}
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10">
                        {/* Call */}
                        <div className="space-y-2 text-left">
                            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary font-figtree">
                                <Phone size={14} className="text-primary" /> CALL US
                            </span>
                            <a href={`tel:${store.phone.replace(/\s/g, '')}`} className="block text-zinc-800 font-medium font-figtree hover:text-primary transition-colors text-base">
                                {store.phone}
                            </a>
                        </div>

                        {/* Email */}
                        <div className="space-y-2 text-left">
                            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary font-figtree">
                                <Mail size={14} className="text-primary" /> MAIL US
                            </span>
                            <a href={`mailto:${store.email}`} className="block text-zinc-800 font-medium font-figtree hover:text-primary transition-colors text-base break-words">
                                {store.email}
                            </a>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-2 text-left">
                        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary font-figtree">
                            <MapPin size={14} className="text-primary" /> VISIT US
                        </span>
                        <p className="text-zinc-800 font-medium font-figtree text-base leading-relaxed whitespace-pre-line">
                            {store.address}
                        </p>
                    </div>

                    <div className="pt-4">
                        <Button className="h-12 bg-primary text-white px-10 rounded-[4px] font-bold tracking-widest uppercase text-xs hover:bg-primary/90 transition-all duration-500 shadow-none border-none">
                           <a href={store.mapLink} target="_blank" className="flex items-center gap-2 text-white">
                            Get Directions <ArrowRight size={14} />
                           </a>
                        </Button>
                    </div>
                </div>
            </div>
            ))}
        </div>
      </section>

      {/* FORM & MAP SPLIT SECTION */}
      <section className="w-full bg-[#FEF5F1] py-16 md:py-24 border-t border-[#FAF5F2]">
        <div className="container-main grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-start">
            
            {/* FORM SIDE */}
            <div className="space-y-8 md:space-y-12">
                <div className="space-y-4">
                    <h2 className="text-4xl md:text-5xl font-extrabold font-abhaya text-zinc-900 tracking-tight leading-tight">
                        Get In Touch
                    </h2>
                    <p className="text-zinc-600 font-figtree text-lg max-w-md">
                        Please share your details below and our jewelry concierge will be in touch with you shortly.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 md:space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                        <div className="space-y-1">
                            <input
                                type="text"
                                name="name"
                                placeholder="Your Name"
                                required
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full bg-transparent border-b border-zinc-300 py-3 focus:border-primary outline-none transition-colors font-figtree text-base"
                            />
                        </div>
                        <div className="space-y-1">
                            <input
                                type="email"
                                name="email"
                                placeholder="Your Email"
                                required
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full bg-transparent border-b border-zinc-300 py-3 focus:border-primary outline-none transition-colors font-figtree text-base"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <input
                            type="tel"
                            name="phone"
                            placeholder="Phone Number"
                            required
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full bg-transparent border-b border-zinc-300 py-3 focus:border-primary outline-none transition-colors font-figtree text-base"
                        />
                    </div>

                    <div className="space-y-1">
                        <textarea
                            name="message"
                            placeholder="Message"
                            value={formData.message}
                            onChange={handleInputChange}
                            className="w-full bg-transparent border-b border-zinc-300 py-3 focus:border-primary outline-none transition-colors font-figtree text-base min-h-[80px] resize-none"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="px-14 h-14 bg-primary text-white rounded-[4px] font-bold tracking-[0.2em] uppercase text-xs shadow-none hover:bg-primary/90 transition-all w-full md:w-auto border-none"
                    >
                        Submit
                    </Button>
                </form>
            </div>

            {/* MAP SIDE */}
            <div className="h-full min-h-[400px] lg:min-h-[550px] w-full lg:sticky lg:top-24">
                <div className="w-full h-full rounded-[4px] overflow-hidden shadow-sm grayscale hover:grayscale-0 transition-all duration-700 border-4 border-white">
                    <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2703.6862592491684!2d72.84453599999999!3d19.174340000000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b79870c015b5%3A0x268fe0bb8a89f9bb!2sLucira%20Jewelry%20%7C%20Jewellery%20Store%20in%20Mumbai!5e1!3m2!1sen!2sin!4v1776505957484!5m2!1sen!2sin" 
                        width="100%" 
                        height="100%" 
                        style={{ border: 0, minHeight: '400px' }} 
                        allowFullScreen="" 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Lucira Jewelry Location"
                    ></iframe>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
}