import Image from "next/image";
import { Suspense } from "react";
import FeaturedIn from "@/components/home/FeaturedIn";
import ExploreCollectionSection from "@/components/home/homeCollection/ExploreCollectionSection";
import LuciraPromise from "@/components/common/LuciraPromise";
import FAQ from "@/components/common/FAQ";

export default function AboutPage() {
    const data = {
        aboutBlack: "/images/aboutUs/about_us_2.png",
        aboutWhite: "/images/aboutUs/about_us_3.png",
        founderImage: "https://luciraonline.myshopify.com/cdn/shop/files/Group_1321315953_2.png",
        signatureBlack: "https://luciraonline.myshopify.com/cdn/shop/files/Group_1321315956_1.png",
        signatureWhite: "https://luciraonline.myshopify.com/cdn/shop/files/Group_1321315955_2.png",
        founderName: "Rupesh Jain",
        founderRole: "Founder & CEO",
        founderQuote: "Jewelry runs in my blood—it's who I am. After building brands in India, I created Lucira to go beyond tradition and craft pieces that reflect elegance and meaning. For me, jewelry isn't just adornment—it's a celebration of moments, love, and legacy. Every piece we make is a promise.",
    };

    const timelineData = [
        {
            year: "APRIL 2025",
            title: "LUCIRA LAUNCH",
            description: "Lucira was founded with a vision to make diamond jewellery more contemporary and accessible.",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Group_1321316005_1.png",
        },
        {
            year: "JUNE 2025",
            title: "COLLECTION LAUNCH",
            description: "Introduced two collections - On The Move & Hexa Collection, combining everyday comfort with bold design.",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Group_1321316005_1.png",
        },
        {
            year: "SEPT 2025",
            title: "SEED INVESTMENT",
            description: "Backed by early investors who believed in our vision to reshape India’s modern jewelry landscape.",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Group_1321316005_1.png",
        },
        {
            year: "OCT 2025",
            title: "1st STORE LAUNCH",
            description: "Opened the first Lucira Experience Store in Mumbai, extending our journey beyond digital.",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Group_1321316005_1.png",
        },
    ];

    const faqData = [
        {
            question: "What values guide your company?",
            answer: "We operate on the principles of trust, transparency, and craftsmanship. Every piece reflects our commitment to ethical practices, high quality, and long-lasting beauty.",
        },
        {
            question: "Who designs your jewelry?",
            answer: "Our collections are designed by a team of creative professionals who blend traditional artistry with modern innovation to craft pieces that are both elegant and wearable.",
        },
        {
            question: "Are your diamonds and materials ethically sourced?",
            answer: "Yes. We work only with suppliers who follow ethical sourcing practices and comply with strict labor and environmental standards to ensure responsible production.",
        },
        {
            question: "Do you provide certificates of authenticity?",
            answer: "All jewelry pieces come with certification verifying their authenticity, material quality, and gemstone grading.",
        },
        {
            question: "What makes your jewelry sustainable?",
            answer: "Our brand is committed to minimizing environmental impact by responsibly sourcing materials, using recyclable packaging, and ensuring traceability throughout our supply chain.",
        },
        {
            question: "What is your return and exchange policy?",
            answer: "We offer a customer-friendly return and exchange policy within a specific period, provided the jewelry is in its original condition and accompanied by proof of purchase.",
        },
        {
            question: "Do you have a buyback or lifetime exchange option?",
            answer: "Yes, customers can often exchange or upgrade their jewelry through a lifetime buyback or exchange program, allowing long-term flexibility and value.",
        },
        {
            question: "How is my order shipped and insured?",
            answer: "Orders are securely packed, fully insured, and shipped through reliable logistics partners. Tracking information is provided to ensure safe and transparent delivery.",
        },
        {
            question: "What kind of warranty or support do you provide?",
            answer: "We stand behind the quality of every piece. Our after-sales support includes maintenance guidance, repair assistance, and professional jewelry care.",
        },
        {
            question: "Do you offer custom or bespoke designs?",
            answer: "Yes, we provide personalized jewelry design services that allow customers to co-create pieces tailored to their style and occasion.",
        },
        {
            question: "What types of jewelry do you offer?",
            answer: "Our collections include engagement rings, wedding bands, earrings, necklaces, and bracelets, crafted for both everyday wear and special moments.",
        },
        {
            question: "Where can I experience your jewelry in person?",
            answer: "Our jewelry can be explored both online and in select retail or experience stores, designed to provide personalized consultation and service.",
        },
    ];

    return (
        <>
            <section className="relative w-full overflow-hidden text-center py-10 md:py-16 px-4 md:px-5">
                <div className="max-w-300 mx-auto relative">
                    <div className="absolute -top-2 md:top-17.5 left-1/2 -translate-x-1/2 w-full flex justify-center z-0 pointer-events-none">
                        <div className="relative w-[90%] md:w-250 h-25 md:h-40">
                            <Image src={data.aboutBlack} alt="About Us" fill className="object-contain" priority />
                        </div>
                    </div>
                    <div className="pt-10 md:pt-35 flex flex-col items-center">
                        <div className="relative w-full max-w-105 flex flex-col items-center mb-10">
                            <div className="absolute inset-0 overflow-hidden z-20 pointer-events-none">
                                <div className="absolute left-1/2 -translate-x-1/2 -top-15 md:-top-22 w-[90%] md:w-180 lg:w-250 h-30 md:h-50">
                                    <Image src={data.aboutWhite} alt="About Us White" fill className="object-contain" />
                                </div>
                                <div className="absolute -bottom-10 md:-bottom-15 right-0 md:-right-20 w-25 md:w-37.5 h-25 md:h-37.5">
                                    <Image src={data.signatureWhite} alt="Signature White" fill className="object-contain" />
                                </div>
                            </div>
                            
                            <div className="relative z-10 w-full h-105 md:h-175">
                                <Image src={data.founderImage} alt={data.founderName} fill className="object-cover rounded" />
                            </div>
                            <div className="absolute -bottom-10 md:-bottom-15 right-0 md:-right-20 w-25 md:w-37.5 h-25 md:h-37.5 z-0">
                                <Image src={data.signatureBlack} alt="Signature Black" fill className="object-contain" />
                            </div>
                            
                            <div className="absolute -bottom-10 left-0 md:bottom-0 md:-left-40 lg:-left-52 text-left">
                                <h3 className="text-[18px] md:text-[25px] font-medium uppercase">
                                    {data.founderName}
                                </h3>
                                <p className="text-[10px] md:text-[11px] text-gray-500 uppercase">
                                    {data.founderRole}
                                </p>
                            </div>
                        </div>
                        <blockquote className="max-w-[90%] md:max-w-200 text-gray-600 italic text-[16px] md:text-[20px] leading-7 md:leading-8 pt-6 md:pt-10">
                            {data.founderQuote}
                        </blockquote>
                    </div>
                </div>
            </section>
            
            <section className="w-full bg-white py-12 md:py-16 overflow-x-auto">
                <div className="mx-auto relative">
                    <div className="absolute top-[35%] left-0 w-full h-0.5 bg-[#b8957a] -translate-y-1/2 z-0 hidden lg:block" />
                    <div className="flex md:justify-around items-center gap-8 px-5 relative z-10 min-w-max md:min-w-0">
                        {timelineData.map((item, index) => (
                            <div key={index} className="flex flex-col items-center min-w-65">
                                <div className="text-base md:text-xl mb-6">{item.year}</div>
                                <div className="w-15 md:w-20 h-15 md:h-20 mb-6 relative">
                                    <Image src={item.image} alt={item.title} fill className="object-cover rounded-full border-[3px] border-white shadow-md" />
                                </div>
                                <div className="text-center max-w-65">
                                    <h3 className="text-base md:text-lg font-medium uppercase mb-3">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm md:text-base text-gray-500">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="w-full py-10 md:py-16 bg-white">
                <div className="max-w-350 mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-12">        
                    <div className="relative flex flex-col gap-6 md:gap-8">            
                        <div className="relative w-full h-75 sm:h-100 md:h-150">
                            <Image 
                                src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Lucira_aug_2564003_1.png?v=1758796025" 
                                alt="Our Vision" 
                                fill 
                                className="object-cover" 
                            />
                        </div>            
                        <div className="
                            md:absolute 
                            md:-right-90
                            lg:right-[-80%] 
                            md:top-[12%] 
                            z-20 
                            w-full 
                            md:max-w-175
                            bg-[#f2f2f2] 
                            px-6 md:px-10
                            py-8 md:py-15
                        ">
                            <h3 className="text-[22px] sm:text-[26px] md:text-[32px] font-medium uppercase tracking-wide mb-4 md:mb-6 text-black">
                                Our Vision
                            </h3>
                            <p className="text-[14px] md:text-[16px] leading-5.5 md:leading-6 tracking-wide text-gray-600">
                                Lucira reimagines diamonds for the modern India, a design-first fine
                                jewelry brand that turns everyday moments into timeless expressions of
                                self. Through bold experimentation in cuts, forms, and stories, we
                                craft pieces that blend contemporary design with ethical brilliance.
                            </p>
                        </div>
                    </div>
                    
                    
                    <div className="relative flex flex-col-reverse gap-6 md:gap-8 mt-8 md:mt-16">            
                        <div className="relative w-full h-75 sm:h-100 md:h-150 md:mt-100">
                            <Image 
                                src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Lucira_aug_2564090.png?v=1758796097" 
                                alt="Our Mission" 
                                fill 
                                className="object-cover"
                            />
                        </div>            
                        <div className="
                            md:absolute 
                            md:-left-90
                            lg:left-[-80%] 
                            md:bottom-[10%] 
                            z-20 
                            w-full 
                            md:max-w-175
                            bg-[#f2f2f2] 
                            px-6 md:px-10
                            py-8 md:py-15
                        ">
                            <h3 className="text-[22px] sm:text-[26px] md:text-[32px] font-medium uppercase tracking-wide mb-4 md:mb-6 text-black">
                                Our Mission
                            </h3>
                            <p className="text-[14px] md:text-[16px] leading-5.5 md:leading-6 tracking-wide text-gray-600">
                                To craft high-quality, ethically sourced diamond jewelry that blends
                                modern aesthetics with lasting value. We aim to inspire confidence and
                                joy in every customer interaction, whether in-store, online, or
                                through personalized experiences while upholding trust, transparency,
                                and craftsmanship as our core values.
                            </p>
                        </div>
                    </div>        
                </div>
            </section>
            <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
                <FeaturedIn />
            </Suspense>            
            <section className="w-full py-10 md:pt-16 md:pb-8">
                <div className="max-w-300 mx-auto px-4 lg:px-1">
                    <div className="relative w-full rounded-lg overflow-hidden">
                        <div className="relative w-full h-45 lg:h-150 md:h-100">
                            <Image
                                src="https://luciraonline.myshopify.com/cdn/shop/files/WhatsApp_Image_2025-09-24_at_11.43.16_3c4dde0d_1_2_2000x.png?v=1760096833"
                                alt="Our Team"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <div className="w-full bg-gray-100 text-center px-4 py-6 mt-2 xl:absolute xl:inset-0 xl:bg-transparent xl:flex xl:flex-col xl:justify-end xl:items-center xl:text-white xl:px-5 xl:pb-8 xl:mt-0">
                            <p className="text-[16px] sm:text-[20px] md:text-[24px] font-normal opacity-80">
                                OUR TEAM, OUR FAMILY
                            </p>
                            <p className="text-[14px] sm:text-[16px] md:text-[18px] max-w-[90%] md:max-w-200 mx-auto mt-2 leading-[1.4]">
                                Designers, Thinkers and Storytellers shaping a new language of luxury.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
                <ExploreCollectionSection />
            </Suspense>
            <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
                <div className="mt-10">
                    <LuciraPromise title="Lucira Promise" description="Where Authenticity meets Trust and Care that lasts a Lifetime" />
                </div>
            </Suspense>
            <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
                <FAQ title="FAQ'S" description="Got questions? We've got answers. Here's everything you need to know about earning, redeeming, and making the most of your rewards." faqs={faqData} />
            </Suspense>
        </>
    );
}