'use client'

import Image from "next/image";
import Link from "next/link";
import FAQ from "@/components/common/FAQ";
import { Suspense, useState } from "react";
import { toast } from "react-toastify";

export default function BespokePage() {
    const bespokeDesign = [
        {
            img: "https://luciraonline.myshopify.com/cdn/shop/files/Images-5_600x.jpg",
            href: "/collections/tennis-necklaces"
        },
        {
            img: "https://luciraonline.myshopify.com/cdn/shop/files/Images-4_600x.jpg",
            href: "/collections/necklaces"
        },
        {
            img: "https://luciraonline.myshopify.com/cdn/shop/files/Images-3_600x.jpg",
            href: "/collections/all-charms-pendants"
        },
        {
            img: "https://luciraonline.myshopify.com/cdn/shop/files/Images-2_600x.jpg",
            href: "/collections/diamond-tennis-bracelets"
        }
    ]

    const faqData= [
        {
            question: "Can I share my own sketches or inspiration photos for the design?",
            answer: "Absolutely. Whether it’s a rough drawing, a Pinterest reference or want to upgrade an old design, our craftsmen can bring it to life."
        },
        {
            question: "How long does it take to create a custom-made piece?",
            answer: "Most bespoke pieces take 2 - 4 weeks, depending on complexity. We keep you updated at every step from design approval to final polishing."
        },
        {
            question: "What is the price range for bespoke jewelry at Lucira?",
            answer: "Pricing depends on your chosen diamond, metal and design details. We share a clear estimate upfront so you know exactly what to expect, no hidden costs."
        },
        {
            question: "Can I make changes to the design once the process has started?",
            answer: "Minor changes can usually be made before production begins. Once crafting has started, changes may affect the timeline or cost but we’ll guide you through every option."
        },
        {
            question: "Is the bespoke process secure if I book an online or video consultation?",
            answer: "Completely. Our consultations are private, secure and handled only by trained Lucira design specialists."
        },
        {
            question: "What is your policy if I need resizing, repairs, or adjustments later?",
            answer: "We offer lifetime service including resizing, cleaning, repairs and setting checks. Your custom piece is supported long after it’s delivered."
        }
    ]

    const [formData, setFormData] = useState({
        fullName: "",
        contact: "",
        comment: ""
    })

    const [errors, setErrors] = useState({
        fullName: "",
        phone: "",
        comment: "",
    });

    const getErrors = (data) => {
        const newErrors = {
            fullName: "",
            phone: "",
            comment: "",
        };
        
        if (!data.fullName.trim()) {
            newErrors.fullName = "Full name is required";
        } else if (!/^[A-Za-z\s]+$/.test(data.fullName)) {
            newErrors.fullName = "Only letters allowed";
        } else if (data.fullName.trim().length < 2) {
            newErrors.fullName = "Minimum 2 characters required";
        }
        
        if (!data.phone) {
            newErrors.phone = "Phone number is required";
        } else if (!/^\d{10}$/.test(data.phone)) {
            newErrors.phone = "Phone must be exactly 10 digits";
        }
        
        if (!data.comment.trim()) {
            newErrors.comment = "Comment is required";
        } else if (data.comment.trim().length < 10) {
            newErrors.comment = "Minimum 10 characters required";
        }

        return newErrors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let updatedValue = value;

        if (name === "fullName") {
            updatedValue = value.replace(/[^a-zA-Z\s]/g, "");
        }

        if (name === "phone") {
            updatedValue = value.replace(/[^0-9]/g, "").slice(0, 10);
        }

        setFormData((prev) => ({
            ...prev,
            [name]: updatedValue,
        }));
        
        const fieldError = getErrors({
            ...formData,
            [name]: updatedValue,
        });

        setErrors((prev) => ({
            ...prev,
            [name]: fieldError[name],
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const validationErrors = getErrors(formData);

        setErrors(validationErrors);
        
        const hasErrors = Object.values(validationErrors).some(
            (err) => err !== ""
        );

        if (hasErrors) {
            toast.error("Please fix the errors before submitting");
            return;
        }
        
        toast.success("Form submitted successfully!");

        setFormData({
            fullName: "",
            phone: "",
            comment: "",
        });

        setErrors({
            fullName: "",
            phone: "",
            comment: "",
        });
    };

    const handleScroll = () => {
        const element = document.getElementById("gallery");
        if (!element) return;

        const offset = 100;
        const top = element.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({
            top,
            behavior: "smooth",
        });
    };

    return (
        <>
            <section className="relative w-full">
                <div className="hidden md:block">
                    <Image
                        src="https://luciraonline.myshopify.com/cdn/shop/files/Bespoke-Desktop-Banner_2.jpg"
                        alt="Bespoke Jewelry"
                        width={1600}
                        height={700}
                        priority
                        className="w-full h-[calc(100dvh-200px)] object-cover"
                    />
                </div>

                <div className="md:hidden">
                    <Image
                        src="https://luciraonline.myshopify.com/cdn/shop/files/7df9539829becce028c90cc314b6e75fad295914_1.jpg"
                        alt="Bespoke Jewelry"
                        width={800}
                        height={500}
                        priority
                        className="w-full h-[360px] object-cover"
                    />
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center text-white px-4">
                    <h2 className="text-lg md:text-3xl uppercase tracking-widest">
                        Bespoke Jewelry
                    </h2>
                    <p className="text-xs md:text-lg mt-2">
                        Your story deserves nothing less than a jewel made just for you.
                    </p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70 md:hidden" />
            </section>
            <section className="max-w-7xl mx-auto px-4 py-16 flex flex-col md:flex-row items-center">
                <div className="w-full md:w-1/2">
                    <Image
                        src="https://luciraonline.myshopify.com/cdn/shop/files/Middle-Banner-Desktop_2eb2e51d-562a-4640-97a6-d43497a9ec67_1200x.jpg"
                        alt="Jewelry design"
                        width={1000}
                        height={600}
                        className="w-full h-[500px] object-cover"
                    />
                </div>

                <div className="w-full md:w-1/2 bg-gray-100 p-8 relative -left-[10%]">
                    <h2 className="text-2xl uppercase font-medium mb-4">
                        Your Story, Your Choice
                    </h2>

                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        From your first sketch to detailed 3D renders, from choosing the right stone to finally setting it by hand, every bespoke Lucira piece blends traditional craft with modern techniques. Inspired by India’s rich heritage of karigars who turned jewelry into heirlooms and refined with today’s design innovation, we create pieces that feel personal, meaningful and truly one-of-a-kind.
                    </p>

                    <button onClick={handleScroll} className="underline text-sm font-medium">
                        View our Full Creations
                    </button>
                </div>
            </section>
            <section className="w-full">
                <h2 className="text-2xl text-center uppercase mb-6">
                    The Making of Your Jewel
                </h2>
                <div className="hidden md:block">
                    <div className="relative w-full h-[600px] bg-black overflow-hidden">
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute w-full h-full object-cover"
                        >
                            <source src="https://cdn.shopify.com/videos/c/o/v/0c586e11ab2447169989386e1a3e7b3d.mp4" type="video/mp4" />
                        </video>
                    </div>
                </div>
                <div className="md:hidden">
                    <div className="relative w-full h-[600px] bg-black overflow-hidden">
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute w-full h-full object-cover"
                        >
                            <source src="https://cdn.shopify.com/videos/c/o/v/0491a5abda8e4dbf83dbcdb8a25fff63.mp4" type="video/mp4" />
                        </video>
                    </div>
                </div>
            </section>
            <section className="py-16 px-4">
                <div className="max-w-2xl mx-auto text-center mb-10">
                    <h2 className="uppercase text-xl mb-2">
                        Start Your Bespoke Journey
                    </h2>
                    <p className="text-gray-500 text-sm">
                        We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">                        
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium">Full Name *</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className={`border p-4 rounded-md ${
                                errors.fullName ? "border-red-500" : ""
                                }`}
                            />
                            {errors.fullName && (
                                <span className="text-red-500 text-xs">
                                {errors.fullName}
                                </span>
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium">Mobile Number *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className={`border p-4 rounded-md ${
                                errors.phone ? "border-red-500" : ""
                                }`}
                            />
                            {errors.phone && (
                                <span className="text-red-500 text-xs">
                                {errors.phone}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium">Comment *</label>
                        <textarea
                        name="comment"
                        value={formData.comment}
                        onChange={handleChange}
                        className={`border p-4 rounded-md resize-none h-40 ${
                            errors.comment ? "border-red-500" : ""
                        }`}
                        />
                        {errors.comment && (
                        <span className="text-red-500 text-xs">
                            {errors.comment}
                        </span>
                        )}
                    </div>

                    <div className="text-center">
                        <button
                        type="submit"
                        className="bg-[#a68380] text-white px-8 py-3 rounded-xl"
                        >
                        Submit
                        </button>
                    </div>
                </form>
            </section>
            <section id="gallery" className="w-full px-16">
                <div className="text-center mb-10">
                    <h2 className="uppercase text-xl mb-2">
                        Past Creations, Personal Journeys
                    </h2>
                    <p className="text-gray-500 text-sm">
                        Explore bespoke pieces designed around real moments and real people.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mx-auto">
                {bespokeDesign.map((item, i) => (
                    <div key={i} className="relative group overflow-hidden rounded-xl">
                    <Image
                        src={item.img}
                        alt="Jewelry"
                        width={400}
                        height={500}
                        className="w-full h-[full] object-cover transition group-hover:scale-105"
                    />

                    <Link href={item.href} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-12.5 py-3 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition">
                        View Similar Designs
                    </Link>
                    </div>
                ))}
                </div>
            </section>
            <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
                <FAQ title="FAQ'S" description="Everything you need to know about creating your custom jewel." faqs={faqData} />
            </Suspense>
        </>
    )
}