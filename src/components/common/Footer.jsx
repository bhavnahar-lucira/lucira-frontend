"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  Phone,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 1024px)");

  if (pathname?.startsWith("/dashboard")) return null;

  if (isMobile) {
    return (
      <footer className="w-full bg-primary text-white pt-10 pb-6">
        <div className="px-6 flex flex-col items-center">
          {/* LOGO & TAGLINE */}
          <div className="mb-10 text-center">
            <Image
              src="/images/footer-logo.svg"
              alt="Lucira"
              width={50}
              height={100}
              className="mx-auto mb-4"
            />
            <p className="text-[13px] font-figtree tracking-wide opacity-80 italic">
              Love, Joy & Comfort.
            </p>
          </div>

          {/* ACCORDION SECTIONS */}
          <div className="w-full">
            <Accordion type="single" collapsible className="w-full border-t border-white/10">
              {/* CONTACT US */}
              <AccordionItem value="contact" className="border-b border-white/10">
                <AccordionTrigger className="py-5 font-abhaya text-lg font-bold hover:no-underline">
                  Contact Us
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <div className="space-y-4 font-figtree">
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-white/70" />
                      <a href="mailto:care@lucirajewelry.com" className="text-sm">care@lucirajewelry.com</a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="text-white/70" />
                      <a href="tel:+919004436052" className="text-sm">+91 9004436052</a>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* SHOP ALL */}
              <AccordionItem value="shop" className="border-b border-white/10">
                <AccordionTrigger className="py-5 font-abhaya text-lg font-bold hover:no-underline">
                  Shop All
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <ul className="grid grid-cols-2 gap-y-3 gap-x-4 font-figtree text-[13px]">
                    <li><Link href="/collections/bestsellers">Best Sellers</Link></li>
                    <li><Link href="/collections/rings">Rings</Link></li>
                    <li><Link href="/collections/engagement-rings">Engagement Rings</Link></li>
                    <li><Link href="/collections/wedding-rings">Wedding Rings</Link></li>
                    <li><Link href="/collections/earrings">Earrings</Link></li>
                    <li><Link href="/collections/bracelets">Bracelets</Link></li>
                    <li><Link href="/collections/necklaces">Necklaces</Link></li>
                    <li><Link href="/collections/nosepins">Nosepins</Link></li>
                    <li><Link href="/collections/mens-rings">Men's Rings</Link></li>
                    <li><Link href="/collections/mens-stud">Men's Studs</Link></li>
                    <li><Link href="/collections/mens-bracelets">Men's Bracelets</Link></li>
                    <li><Link href="/collections/hexa">Collections</Link></li>
                    <li><Link href="/collections/all">Gifting</Link></li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* JEWELRY GUIDE */}
              <AccordionItem value="guide" className="border-b border-white/10">
                <AccordionTrigger className="py-5 font-abhaya text-lg font-bold hover:no-underline">
                  Lucira Jewelry Guide
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <ul className="grid grid-cols-2 gap-y-3 gap-x-4 font-figtree text-[13px]">
                    <li><Link href="/pages/diamond-education">Diamond Education</Link></li>
                    <li><Link href="/pages/metal-education">Metal Education</Link></li>
                    <li><Link href="/pages/gemstone-education-page">Gemstone Education</Link></li>
                    <li><Link href="/pages/size-guide-1">Size Guide</Link></li>
                    <li><Link href="/pages/how-to-wear-2">How To Wear</Link></li>
                    <li><Link href="/pages/new-tips-care">Jewelry Care Tips</Link></li>
                    <li><Link href="/pages/jewelry-gift-guide">Jewelry Gift Guide</Link></li>
                    <li><Link href="/pages/lgd-mine-page">LGD vs Mined</Link></li>
                    <li><Link href="/pages/ring-shank">Ring Shank</Link></li>
                    <li><Link href="/pages/diamond-shapes">Diamond Shapes</Link></li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* ABOUT */}
              <AccordionItem value="about" className="border-b border-white/10">
                <AccordionTrigger className="py-5 font-abhaya text-lg font-bold hover:no-underline">
                  About Lucira
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <ul className="grid grid-cols-2 gap-y-3 gap-x-4 font-figtree text-[13px]">
                    <li><Link href="/pages/about-our-company">About Our Company</Link></li>
                    <li><Link href="/pages/purpose-and-value">Purpose & Value</Link></li>
                    <li><Link href="/blogs/stories">Blogs</Link></li>
                    <li><Link href="/pages/rewards">Rewards</Link></li>
                    <li><Link href="/pages/featured-in">Featured In</Link></li>
                    <li><Link href="/pages/sitemap">Sitemap</Link></li>
                    <li><Link href="/pages/craftmanship">Craftsmanship</Link></li>
                    <li><Link href="/pages/mordern-slavery-policy">Modern Slavery Policy</Link></li>
                    <li><Link href="/pages/supplier-code-of-conduct">Supplier Code of Conduct</Link></li>
                    <li><Link href="/pages/accessibility-statement">Accessibility Statement</Link></li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* HELP */}
              <AccordionItem value="help" className="border-b border-white/10">
                <AccordionTrigger className="py-5 font-abhaya text-lg font-bold hover:no-underline">
                  Help
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <ul className="grid grid-cols-2 gap-y-3 gap-x-4 font-figtree text-[13px]">
                    <li><Link href="/pages/contact-us">Contact Us</Link></li>
                    <li><Link href="/pages/faqs">FAQ's</Link></li>
                    <li><Link href="/reviews">Reviews</Link></li>
                    <li><Link href="/pages/15-days-return">15-Days Return</Link></li>
                    <li><Link href="/pages/cancel-refund">Cancel & Refund</Link></li>
                    <li><Link href="/pages/lifetime-exchange-buyback-policy">Lifetime Exchange & Buyback</Link></li>
                    <li><Link href="/pages/old-gold-exchange">Old Gold Exchange</Link></li>
                    <li><Link href="/pages/shipping-policy-1">Shipping Policy</Link></li>
                    <li><Link href="/pages/privacy-policy">Privacy Policy</Link></li>
                    <li><Link href="/pages/exclusive-promotions-page">Offers T&C</Link></li>
                    <li><Link href="/pages/terms-condition">Terms & Conditions</Link></li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* EXPERIENCE */}
              <AccordionItem value="experience" className="border-b border-white/10">
                <AccordionTrigger className="py-5 font-abhaya text-lg font-bold hover:no-underline">
                  Experience Lucira
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <ul className="grid grid-cols-2 gap-y-3 gap-x-4 font-figtree text-[13px]">
                    <li><Link href="/pages/careers">Careers</Link></li>
                    <li><Link href="/pages/franchise-page">Franchise</Link></li>
                    <li><Link href="/pages/customized-jewelry">Bespoke</Link></li>
                    <li><Link href="/pages/store-packaging">Packaging</Link></li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* FOLLOW US */}
          <div className="w-full mt-10 mb-8 flex items-center gap-4">
            <span className="font-abhaya text-lg font-bold">Follow Us</span>
            <div className="flex items-center gap-5">
              <Link href="https://www.facebook.com/lucirajewelry" target="_blank"><Facebook size={20} /></Link>
              <Link href="https://www.instagram.com/lucirajewelry" target="_blank"><Instagram size={20} /></Link>
              <Link href="https://www.youtube.com/@Lucira_Jewelry" target="_blank"><Youtube size={22} /></Link>
              <Link href="https://in.pinterest.com/Lucira_Jewelry/_created" target="_blank">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.965 1.406-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.126-2.914 1.002 0 1.485.753 1.485 1.656 0 1.007-.644 2.512-.975 3.907-.276 1.169.587 2.122 1.74 2.122 2.088 0 3.691-2.197 3.691-5.371 0-2.808-2.015-4.776-4.907-4.776-3.344 0-5.305 2.508-5.305 5.1 0 1.011.39 2.096.875 2.69.096.118.11.222.081.334l-.324 1.32c-.052.214-.173.26-.399.162-1.488-.693-2.417-2.868-2.417-4.618 0-3.76 2.731-7.213 7.876-7.213 4.132 0 7.34 2.944 7.34 6.88 0 4.106-2.587 7.41-6.177 7.41-1.206 0-2.34-.627-2.729-1.362l-.744 2.834c-.269 1.027-1 2.316-1.492 3.111 1.052.325 2.16.501 3.31.501 6.621 0 11.988-5.367 11.988-11.987C24.005 5.367 18.639 0 12.017 0z" />
                </svg>
              </Link>
              <Link href="https://www.linkedin.com/company/lucira-jewelry" target="_blank"><Linkedin size={20} /></Link>
            </div>
          </div>

          {/* POLICY LINKS */}
          <div className="w-full flex justify-center gap-4 text-[13px] font-figtree py-6 border-t border-white/10 opacity-80">
            <Link href="/pages/privacy-policy">Privacy policy</Link>
            <span className="opacity-40">|</span>
            <Link href="/pages/terms-condition">Terms of service</Link>
          </div>

          {/* COPYRIGHT */}
          <div className="w-full pt-6 border-t border-white/10 text-center">
            <p className="text-[12px] font-figtree opacity-60">
              ©{new Date().getFullYear()} LuciraJewelry.com. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (

    <footer className="w-full bg-primary text-white">

      <div className="container-main py-12">
        <div className="grid grid-cols-1 xl:gap-10 lg:gap-8 xl:grid-cols-[220px_1fr] lg:grid-cols-[160px_1fr]">

          {/* LEFT LOGO */}
          <div className="text-center">
            <div className="mb-4 opacity-75">
              <Image
                src="/images/footer-logo.svg"
                alt="Lucira"
                width={90}
                height={165}
                className="mx-auto"
              />
            </div>
            <p className="text-sm text-white/80">
              Love, Joy & Comfort.
            </p>
          </div>

          {/* RIGHT LINKS */}
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">

            {/* SHOP ALL */}
            <div>
              <h4 className="mb-4 text-lg font-extrabold font-abhaya">Shop All</h4>
              <ul className="space-y-2.5 text-sm text-white font-figtree">
                <li><Link href="/collections/bestsellers">Best Sellers</Link></li>
                <li><Link href="/collections/rings">Rings</Link></li>
                <li><Link href="/collections/engagement-rings">Engagement Rings</Link></li>
                <li><Link href="/collections/wedding-rings">Wedding Rings</Link></li>
                <li><Link href="/collections/earrings">Earrings</Link></li>
                <li><Link href="/collections/bracelets">Bracelets</Link></li>
                <li><Link href="/collections/necklaces">Necklaces</Link></li>
                <li><Link href="/collections/nosepins">Nosepins</Link></li>
                <li><Link href="/collections/mens-rings">Men's Rings</Link></li>
                <li><Link href="/collections/mens-stud">Men's Studs</Link></li>
                <li><Link href="/collections/mens-bracelets">Men's Bracelets</Link></li>
                <li><Link href="/collections/hexa">Collections</Link></li>
                <li><Link href="/collections/all">Gifting</Link></li>
              </ul>
            </div>

            {/* JEWELRY GUIDE */}
            <div>
              <h4 className="mb-4 text-lg font-extrabold font-abhaya">
                Lucira Jewelry Guide
              </h4>
              <ul className="space-y-2.5 text-sm text-white font-figtree">
                <li><Link href="/pages/diamond-education">Diamond Education</Link></li>
                <li><Link href="/pages/metal-education">Metal Education</Link></li>
                <li><Link href="/pages/gemstone-education-page">Gemstone Education</Link></li>
                <li><Link href="/pages/size-guide-1">Size Guide</Link></li>
                <li><Link href="/pages/how-to-wear-2">How To Wear</Link></li>
                <li><Link href="/pages/new-tips-care">Jewelry Care Tips</Link></li>
                <li><Link href="/pages/jewelry-gift-guide">Jewelry Gift Guide</Link></li>
                <li><Link href="/pages/lgd-mine-page">LGD vs Mined</Link></li>
                <li><Link href="/pages/ring-shank">Ring Shank</Link></li>
                <li><Link href="/pages/diamond-shapes">Diamond Shapes</Link></li>
              </ul>
            </div>

            {/* ABOUT */}
            <div>
              <h4 className="mb-4 text-lg font-extrabold font-abhaya">About Lucira</h4>
              <ul className="space-y-2.5 text-sm text-white font-figtree">
                <li><Link href="/pages/about-our-company">About Our Company</Link></li>
                <li><Link href="/pages/purpose-and-value">Purpose & Value</Link></li>
                <li><Link href="/blogs/stories">Blogs</Link></li>
                <li><Link href="/pages/rewards">Rewards</Link></li>
                <li><Link href="/pages/featured-in">Featured In</Link></li>
                <li><Link href="/pages/sitemap">Sitemap</Link></li>
                <li><Link href="/pages/craftmanship">Craftsmanship</Link></li>
                <li><Link href="/pages/mordern-slavery-policy">Modern Slavery Policy</Link></li>
                <li><Link href="/pages/supplier-code-of-conduct">Supplier Code of Conduct</Link></li>
                <li><Link href="/pages/accessibility-statement">Accessibility Statement</Link></li>
              </ul>
            </div>

            {/* HELP */}
            <div>
              <h4 className="mb-4 text-lg font-extrabold font-abhaya">Help</h4>
              <ul className="space-y-2.5 text-sm text-white font-figtree">
                <li><Link href="/pages/contact-us">Contact Us</Link></li>
                <li><Link href="/pages/faqs">FAQ's</Link></li>
                <li><Link href="/reviews">Reviews</Link></li>
                <li><Link href="/pages/15-days-return">15-Days Return</Link></li>
                <li><Link href="/pages/cancel-refund">Cancel & Refund</Link></li>
                <li><Link href="/pages/lifetime-exchange-buyback-policy">Lifetime Exchange & Buyback</Link></li>
                <li><Link href="/pages/old-gold-exchange">Old Gold Exchange</Link></li>
                <li><Link href="/pages/shipping-policy-1">Shipping Policy</Link></li>
                <li><Link href="/pages/privacy-policy">Privacy Policy</Link></li>
                <li><Link href="/pages/exclusive-promotions-page">Offers T&C</Link></li>
                <li><Link href="/pages/terms-condition">Terms & Conditions</Link></li>
              </ul>
            </div>

            {/* CONTACT */}
            <div>
              <h4 className="mb-4 text-lg font-extrabold font-abhaya">Contact Us</h4>

              <div className="space-y-2.5 text-sm text-white font-figtree">
                <div className="flex items-center gap-2">
                  <Mail size={16} />
                  <a href="mailto:care@lucirajewelry.com" target="_blank">care@lucirajewelry.com</a>
                </div>

                <div className="flex items-center gap-2">
                  <Phone size={16} />
                  <a href="tel:+91 9004436052" target="_blank">+91 9004436052</a>
                </div>
              </div>

              <div className="mt-15">
                <h5 className="mb-3 text-lg font-extrabold font-abhaya">
                  Experience Lucira
                </h5>
                <ul className="space-y-2.5 text-sm text-white font-figtree">
                  <li><Link href="/pages/careers">Careers</Link></li>
                  <li><Link href="/pages/franchise-page">Franchise</Link></li>
                  <li><Link href="/pages/customized-jewelry">Bespoke</Link></li>
                  <li><Link href="/pages/store-packaging">Packaging</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* SOCIAL */}
      <div className="mb-6.5 flex items-center justify-center gap-6 border-t border-white/20 pt-6">
        <p className="text-lg font-extraboldfont-abhaya">Follow Us</p>

        <div className="flex items-center gap-4">
          <Link href="https://www.facebook.com/lucirajewelry">
            <Facebook size={18} />
          </Link>
          <Link href="https://www.instagram.com/lucirajewelry">
            <Instagram size={18} />
          </Link>
          <Link href="https://www.youtube.com/@Lucira_Jewelry">
            <Youtube size={18} />
          </Link>
          <Link href="https://in.pinterest.com/Lucira_Jewelry/_created/">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.965 1.406-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.126-2.914 1.002 0 1.485.753 1.485 1.656 0 1.007-.644 2.512-.975 3.907-.276 1.169.587 2.122 1.74 2.122 2.088 0 3.691-2.197 3.691-5.371 0-2.808-2.015-4.776-4.907-4.776-3.344 0-5.305 2.508-5.305 5.1 0 1.011.39 2.096.875 2.69.096.118.11.222.081.334l-.324 1.32c-.052.214-.173.26-.399.162-1.488-.693-2.417-2.868-2.417-4.618 0-3.76 2.731-7.213 7.876-7.213 4.132 0 7.34 2.944 7.34 6.88 0 4.106-2.587 7.41-6.177 7.41-1.206 0-2.34-.627-2.729-1.362l-.744 2.834c-.269 1.027-1 2.316-1.492 3.111 1.052.325 2.16.501 3.31.501 6.621 0 11.988-5.367 11.988-11.987C24.005 5.367 18.639 0 12.017 0z" />
            </svg>
          </Link>
          <Link href="https://www.linkedin.com/company/lucira-jewelry">
            <Linkedin size={18} />
          </Link>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-white/20 py-4 text-sm">
        <div className="container-main flex flex-col items-center justify-between gap-3 md:flex-row">
          <p className="text-white text-sm">
            ©{new Date().getFullYear()} LuciraJewelry.com. All Rights Reserved.
          </p>

          <div className="flex items-center gap-4 text-white text-base">
            <Link href="/pages/privacy-policy">Privacy policy</Link>
            <span>|</span>
            <Link href="/pages/terms-condition">Terms of service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}