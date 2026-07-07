"use client";
import Link from "next/link";
import Image from "next/image";

export default function BuildYourJewelry() {
    return (
        <section className="w-full overflow-hidden">
            <Link href="/build-your-jewelry" className="block w-full">
                {/* Desktop Banner */}
                <div className="hidden md:block w-full">
                    <Image
                        src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Build_Your_Jewelry_Desktop_Upscale_jpg.jpg?v=1783416047"
                        alt="Build Your Jewelry"
                        width={1920}
                        height={600}
                        className="w-full h-auto object-cover"
                        priority
                    />
                </div>
                {/* Mobile Banner */}
                <div className="block md:hidden w-full">
                    <Image
                        src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Build_Your_Jewelry_Mobile_Upscale_jpg.jpg?v=1783416048"
                        alt="Build Your Jewelry"
                        width={768}
                        height={800}
                        className="w-full h-auto object-cover"
                        priority
                    />
                </div>
            </Link>
        </section>
    );
}