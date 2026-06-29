"use client";
import Link from "next/link";

export default function BuildYourJewelry() {
    return (
        <section className="build-jewelry-section relative w-full bg-[#FEF5F1] py-16 pb-[250px] overflow-hidden bg-no-repeat bg-contain">
            <div className="container-main relative z-10 text-center">
                <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-2 text-black">
                Build Your Jewelry
                </h2>

                <p className="text-black font-normal text-sm md:text-base leading-[1.4]">
                Jewelry for life's most meaningful moments
                </p>

                <Link
                href="/collections/all"
                className="inline-flex items-center justify-center px-7 py-3 text-sm md:text-base font-bold uppercase rounded-sm bg-primary hover:bg-[#4A3934] text-white transition-colors mt-8"
                >
                Shop All Bestsellers
                </Link>
            </div>
        </section>
    );
}