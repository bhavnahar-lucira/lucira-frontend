"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const howItWorksSteps = [
  {
    id: 1,
    image:
      "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Rectangle_22226_4.jpg?v=1751367485",
    title: "Step 1 : Schedule a call",
    alt: "Step 1 : Schedule video call",
    description:
      "Fill out a quick form and one of our experts will get in touch to guide you every step of the way.",
  },
  {
    id: 2,
    image:
      "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Rectangle_22227.jpg?v=1751367485",
    title: "Step 2 : Select jewelry",
    alt: "Step 2 : select jewelry",
    description:
      "Tell us the occasion, design inspiration, or any specific style you love and we’ll curate a selection just for you.",
  },
  {
    id: 3,
    image:
      "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Rectangle_22228.jpg?v=1751367486",
    title: "Step 3 : Live video call",
    alt: "Step 3 : live video call",
    description:
      "Join at your scheduled time to explore each piece up close with real-time photos and videos you can easily share with loved ones.",
  },
];

const collections = [
  {
    id: 1,
    title: "Rings",
    link: "/collections/rings",
    desktopImage:
      "https://luciraonline.myshopify.com/cdn/shop/files/NC_Ring.jpg?crop=center&height=692&v=1760525941&width=400",
    mobileImage:
      "https://luciraonline.myshopify.com/cdn/shop/files/NC_Ring.jpg?crop=center&height=692&v=1760525941&width=400",
  },
  {
    id: 2,
    title: "Earrings",
    link: "/collections/earrings",
    desktopImage:
      "https://luciraonline.myshopify.com/cdn/shop/files/Earrings_7f3ea122-c95a-4a57-9be0-05ab9f9672fb.jpg?crop=center&height=692&v=1760526503&width=400",
    mobileImage:
      "https://luciraonline.myshopify.com/cdn/shop/files/Earrings_7f3ea122-c95a-4a57-9be0-05ab9f9672fb.jpg?crop=center&height=692&v=1760526503&width=400",
  },
  {
    id: 3,
    title: "Necklaces",
    link: "/collections/necklaces",
    desktopImage:
      "https://luciraonline.myshopify.com/cdn/shop/files/Necklace_bb6f6704-59ca-429f-82c6-fbd8762eea47.jpg?crop=center&height=692&v=1760528650&width=400",
    mobileImage:
      "https://luciraonline.myshopify.com/cdn/shop/files/Necklace_bb6f6704-59ca-429f-82c6-fbd8762eea47.jpg?crop=center&height=692&v=1760528650&width=400",
  },
  {
    id: 4,
    title: "Bracelets",
    link: "/collections/bracelets",
    desktopImage:
      "https://luciraonline.myshopify.com/cdn/shop/files/Bracelets_collection.jpg?crop=center&height=692&v=1760529274&width=400",
    mobileImage:
      "https://luciraonline.myshopify.com/cdn/shop/files/Bracelets_collection.jpg?crop=center&height=692&v=1760529274&width=400",
  },
  {
    id: 5,
    title: "Mangalsutra",
    link: "/collections/mangalsutra",
    desktopImage:
      "https://luciraonline.myshopify.com/cdn/shop/files/NC_Mangalsutra.jpg?crop=center&height=692&v=1760525947&width=400",
    mobileImage:
      "https://luciraonline.myshopify.com/cdn/shop/files/NC_Mangalsutra.jpg?crop=center&height=692&v=1760525947&width=400",
  },
  {
    id: 6,
    title: "Pendants",
    link: "/collections/pendants",
    desktopImage:
      "https://luciraonline.myshopify.com/cdn/shop/files/NC_Pendant.jpg?crop=center&height=692&v=1760525935&width=400",
    mobileImage:
      "https://luciraonline.myshopify.com/cdn/shop/files/NC_Pendant.jpg?crop=center&height=692&v=1760525935&width=400",
  },
];

export default function VideoCallPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone) => {
    return /^[\d\s+\-()]{7,20}$/.test(phone);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Please enter your first name";
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      setSubmitted(true);

      const message = encodeURIComponent(`Hi Lucira, I would like to schedule a video call. \nName: ${formData.firstName}\nEmail: ${formData.email}\nPhone: ${formData.phone}`);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=+919004435760&text=${message}`;
      
      window.open(whatsappUrl, "_blank");

      console.log(formData);
    }
  };

  const resetForm = () => {
    setSubmitted(false);

    setFormData({
      firstName: "",
      email: "",
      phone: "",
    });

    setErrors({});
  };

  return (
    <div className="w-full">
      {/* HERO BANNER SECTION */}
      <section className="relative w-full h-[535px] md:h-[605px] flex items-end md:items-center mb-5 md:mb-20 bg-cover bg-center bg-no-repeat container-main bg-[url('https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Video-Call-Banner-Desktop_320cf8bb-6d9a-4e6a-9557-94ef49275b25.jpg?v=1751366655')]">
        <div className="absolute inset-0 bg-black/30 z-10"></div>

        <div className="relative z-20 w-full max-w-[1320px] pb-10 md:pb-0">
          <div className="text-center md:text-left text-white max-w-[750px] flex flex-col items-center md:items-start mx-auto md:mx-0">
            <h1 className="font-abhaya text-3xl md:text-[56px] font-bold leading-tight mb-4 tracking-wide uppercase">
              WIDE RANGE OF JEWELRY JUST A CALL AWAY 
            </h1>

            <p className="font-figtree text-sm md:text-[20px] mb-10 max-w-[650px] font-light">
              Experience our grown diamond collection from the comfort of your home with our personalized video consultation.
            </p>
            
            <button 
              onClick={() => document.getElementById('video-call-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-[#1A1A1A] px-10 py-4 rounded-sm font-figtree font-bold text-xs md:text-sm hover:bg-[#F5F5F5] transition-all uppercase tracking-[0.2em] shadow-lg"
            >
              Schedule Your Call
            </button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="w-full">
        <div className="container-main">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-3xl lg:text-4xl font-extrabold font-abhaya mb-2 text-black">
              HOW IT WORKS
            </h2>

            <p className="text-black text-base font-normal">
              Shopping made personal - get real-time guidance from Lucira
              experts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {howItWorksSteps.map((step) => (
              <div key={step.id} className="text-center">
                <div className="relative w-full aspect-square overflow-hidden mb-5">
                  <Image
                    src={step.image}
                    alt={step.alt}
                    fill
                    className="object-cover"
                  />
                </div>

                <h3 className="font-figtree text-lg md:text-[22px] font-semibold mb-3">
                  {step.title}
                </h3>

                <p className="font-figtree text-sm md:text-base leading-6 text-[#4B4B4B] max-w-[380px] mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VIDEO CALL SCHEDULER */}
      <section id="video-call-form" className="w-full pt-10 md:pt-20 pb-6">
        <div className="block md:hidden px-5 mb-8">
          <Image
            src="https://luciraonline.myshopify.com/cdn/shop/files/Macbook_Pro_8a067db9-0dce-4e3a-b3db-d3d5166c024c.png?v=1750666235"
            alt="Video Call Mobile"
            width={800}
            height={800}
            className="w-full h-auto object-cover"
          />
        </div>

        <div className="max-w-[1320px] mx-auto px-5 md:px-10 flex flex-col md:flex-row items-start justify-between gap-10 md:gap-16">
          <div className="hidden md:block flex-1">
            <Image
              src="https://luciraonline.myshopify.com/cdn/shop/files/Macbook_Pro_8a067db9-0dce-4e3a-b3db-d3d5166c024c.png?v=1750666235"
              alt="Video Call Desktop"
              width={700}
              height={700}
              className="w-full h-auto object-cover"
            />
          </div>

          <div className="w-full md:max-w-[450px]">
            {!submitted ? (
              <>
                <h2 className="text-3xl lg:text-4xl font-extrabold font-abhaya mb-2 text-black">
                  Schedule a Video Call
                </h2>

                <p className="text-black text-base font-normal">
                  Let our team bring the Lucira experience to you - curated, personal, and without pressure.
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="mb-5">
                    <label className="block text-xs font-medium uppercase mb-2 pt-5">
                      First Name
                    </label>

                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          firstName: e.target.value,
                        })
                      }
                      className={`w-full border rounded-md px-4 py-3 text-sm outline-none ${
                        errors.firstName
                          ? "border-red-500"
                          : "border-[#CCCCCC]"
                      }`}
                    />

                    {errors.firstName && (
                      <p className="text-red-500 text-xs mt-2">
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div className="mb-5">
                    <label className="block text-xs font-medium uppercase mb-2">
                      Email
                    </label>

                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: e.target.value,
                        })
                      }
                      className={`w-full border rounded-md px-4 py-3 text-sm outline-none ${
                        errors.email
                          ? "border-red-500"
                          : "border-[#CCCCCC]"
                      }`}
                    />

                    {errors.email && (
                      <p className="text-red-500 text-xs mt-2">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="mb-5">
                    <label className="block text-xs font-medium uppercase mb-2">
                      Phone Number
                    </label>

                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.target.value,
                        })
                      }
                      className={`w-full border rounded-md px-4 py-3 text-sm outline-none ${
                        errors.phone
                          ? "border-red-500"
                          : "border-[#CCCCCC]"
                      }`}
                    />

                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-2">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#9D7C78] text-white rounded-[10px] py-3 px-6 text-sm mt-4 hover:opacity-90 transition-opacity"
                  >
                    Submit
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-10">
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 80 80"
                  fill="none"
                  className="mx-auto mb-5"
                >
                  <circle
                    cx="40"
                    cy="40"
                    r="38"
                    stroke="#9d7c78"
                    strokeWidth="4"
                    fill="none"
                  />

                  <path
                    d="M25 40L35 50L55 30"
                    stroke="#9d7c78"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <h2 className="text-[#9d7c78] text-3xl mb-4 font-medium">
                  Thank You!
                </h2>

                <p className="text-base text-[#1A1A1A] mb-2">
                  Your information has been submitted successfully.
                </p>

                <p className="text-sm text-[#666666]">
                  Our executive will contact you shortly.
                </p>

                <button
                  onClick={resetForm}
                  className="w-full max-w-[200px] bg-[#9D7C78] text-white rounded-[10px] py-3 px-6 text-sm mt-8 hover:opacity-90 transition-opacity"
                >
                  Submit Another
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* COLLECTION GRID SECTION */}
      <section className="w-full py-10 md:py-[30px]">
        <div className="w-[96%] max-w-[1920px] mx-auto">
          {/* Heading */}
          <div className="text-center">
            <h2 className="text-3xl lg:text-4xl font-extrabold font-abhaya mb-2 text-black">
              Shop By Category
            </h2>

            <p className="text-black text-base font-normal">
              Discover our signature jewelry collections
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[6px] md:gap-5 mt-6 md:mt-10">
            {collections.map((item, index) => (
              <Link
                key={item.id}
                href={item.link}
                className="group relative block overflow-hidden"
                onClick={() => {
                  window.dataLayer = window.dataLayer || [];

                  window.dataLayer.push({
                    event: "promoClick",
                    promoClick: {
                      creative_name: "Below Banner Collection Grid",
                      promo_name: item.title,
                      promo_position: item.link,
                      location_id: "homepage",
                    },
                  });
                }}
              >
                {/* Desktop Image */}
                <div className="hidden md:block relative overflow-hidden">
                  <Image
                    src={item.desktopImage}
                    alt={`Explore our ${item.title} Collection`}
                    width={400}
                    height={692}
                    priority={index < 6}
                    className="w-full h-auto object-cover aspect-[270/468] transition-all duration-500 md:group-hover:rounded-[100%/60%]"
                  />
                </div>

                {/* Mobile Image */}
                <div className="block md:hidden relative overflow-hidden">
                  <Image
                    src={item.mobileImage}
                    alt={`Explore our ${item.title} Collection`}
                    width={420}
                    height={720}
                    className="w-full h-auto object-cover aspect-[1/1.4]"
                  />
                </div>

                {/* Title */}
                <span className="absolute left-1/2 -translate-x-1/2 bottom-[15%] md:bottom-[6%] text-[14px] md:text-[16px] uppercase font-medium text-[#1A1A1A] text-center z-10 transition-all duration-500 md:group-hover:bottom-[14%] whitespace-nowrap">
                  {item.title}
                </span>

                {/* Shop Now */}
                <span className="hidden md:block absolute left-1/2 -translate-x-1/2 bottom-[3%] text-[10px] uppercase text-[#1A1A1A] opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:bottom-[8%] whitespace-nowrap z-10">
                  Shop Now
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}