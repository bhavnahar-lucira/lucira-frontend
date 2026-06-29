"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Play, Info, Heart, Truck, RotateCcw, BadgeCheck, PlayCircle, Video, Store, CheckCircle,  Diamond, Ruler, ShieldCheck, ChevronRight, Share2, MessageCircle, Ghost, Check  } from "lucide-react";
import PriceSavingsDetails from "@/components/product/PriceSavingsDetails";
import ProductAccordion from "@/components/product/ProductAccordion";
import LuxuryMarquee from "@/components/product/LuxuryMarquee";
import ProductStory from "@/components/product/ProductStory";
import FeaturedIn from "@/components/product/FeaturedIn";
import OurProcess from "@/components/product/OurProcess";
import CategorySlider from "@/components/product/CategorySlider";
import CustomerReviews from "@/components/product/CustomerReviews";
import FAQSection from "@/components/product/FAQSection";
import DiamondComparison from "@/components/product/DiamondComparison";
import { FindLuciraStore } from "@/components/product/FindLuciraStore";
import { JoinLuciraCommunity } from "@/components/product/JoinLuciraCommunity";
import { ProductSlider } from "@/components/product/ProductSlider";
import ProductCard from "@/components/product/ProductCard";
import ExploreOtherRings from "@/components/product/ExploreOtherRings";
import WearThisWith from "@/components/product/WearThisWith";
import { Separator } from "@/components/ui/separator"
import { shopifyStorefrontFetch } from "@/lib/shopify-client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

export default function ProductPage({ product = {} }) {
  const [engraving, setEngraving] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [activePromoSlide, setActivePromoSlide] = useState(1);
  const [youMayAlsoLikeProducts, setYouMayAlsoLikeProducts] = useState([]);

  useEffect(() => {
    const fetchMatching = async () => {
      const gid = product.shopifyId || (product.id ? `gid://shopify/Product/${product.id}` : null);
      if (!gid) return;

      const QUERY = `
        query getMatching($id: ID!) {
          product(id: $id) {
            matching: metafield(namespace: "custom", key: "matching_product") {
              references(first: 20) {
                edges {
                  node {
                    ... on Product {
                      id
                      title
                      handle
                      productType
                      featuredImage { url altText }
                      images(first: 5) { edges { node { url altText } } }
                      variants(first: 20) {
                        edges {
                          node {
                            id
                            title
                            sku
                            availableForSale
                            price { amount currencyCode }
                            compareAtPrice { amount currencyCode }
                            selectedOptions { name value }
                            image { url altText }
                          }
                        }
                      }
                      productMetafields: metafields(identifiers: [{namespace: "ornaverse", key: "bestsellers"}]) {
                        key
                        value
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      try {
        const data = await shopifyStorefrontFetch(QUERY, { id: gid });
        const refs = data?.product?.matching?.references?.edges || [];
        if (refs.length > 0) {
          const mapped = refs.map(({ node: p }) => {
            const productMetafields = {};
            p.productMetafields?.forEach(m => { if (m) productMetafields[m.key] = m.value; });

            return {
              ...p,
              id: p.id.split("/").pop(),
              shopifyId: p.id,
              image: p.featuredImage?.url,
              productMetafields,
              variants: p.variants.edges.map(({ node: v }) => ({
                ...v,
                id: v.id.split("/").pop(),
                shopifyId: v.id,
                price: Number(v.price.amount),
                compare_price: v.compareAtPrice ? Number(v.compareAtPrice.amount) : null,
                inStock: v.availableForSale,
                image: v.image?.url
              }))
            };
          });
          setYouMayAlsoLikeProducts(mapped);
        }
      } catch (e) {
        console.error("Error fetching matching products", e);
      }
    };
    fetchMatching();
  }, [product.shopifyId, product.id]);
  return (
    <div className="w-full">
      <div className="max-w-480 mx-auto px-17 min-[1440px]:px-17">
        {/* Breadcrumb */}
        <Breadcrumb className="py-5">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#" className="text-sm font-medium text-black">Engagement Rings</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator><ChevronRight size={14}/></BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="#" className="text-sm font-medium text-black">Round</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator><ChevronRight size={14}/></BreadcrumbSeparator>
            <BreadcrumbItem className="text-sm font-medium text-gray-400">
              Round Cut with Side Diamonds Accent Engagement Ring
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_530px] gap-10 items-start">
          {/* Left: Product Gallery */}
          <div className="grid grid-cols-2 gap-4 sticky top-5">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-[#F7F7F7]">
               <Image src="/images/product/1.jpg" alt="Product" fill className="object-cover" />
               <div className="absolute top-4 left-4 flex flex-col gap-2">
                 <span className="bg-white/95 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-[0.05em] shadow-sm">Best Seller</span>
                 <span className="bg-white/95 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-[0.05em] shadow-sm">Fast Shipping</span>
               </div>
               <button className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full text-[12px] font-semibold flex items-center gap-2 shadow-sm border border-gray-100">
                 <Play size={14} className="fill-black" /> Virtual try on
               </button>
            </div>
            <div className="relative aspect-square rounded-lg overflow-hidden bg-[#F7F7F7]">
               <Image src="/images/product/2.jpg" alt="Product" fill className="object-cover" />
               <button className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full text-[12px] font-semibold flex items-center gap-2 shadow-sm border border-gray-100">
                 <div className="w-5 h-5 rounded-full border border-gray-200 overflow-hidden relative">
                    <Image src="/images/product/6.jpg" alt="similar" fill className="object-cover" />
                 </div>
                 Similar items
               </button>
            </div>
            <div className="aspect-square rounded-lg overflow-hidden bg-[#F7F7F7] relative">
               <Image src="/images/product/3.jpg" alt="Product" fill className="object-cover" />
            </div>
            <div className="aspect-square rounded-lg overflow-hidden bg-[#F7F7F7] relative">
               <Image src="/images/product/4.jpg" alt="Product" fill className="object-cover" />
            </div>
            <div className="aspect-square rounded-lg overflow-hidden bg-[#F7F7F7] relative">
               <Image src="/images/product/5.jpg" alt="Product" fill className="object-cover" />
            </div>
            <div className="aspect-square rounded-lg overflow-hidden bg-[#F7F7F7] relative">
               <Image src="/images/product/6.jpg" alt="Product" fill className="object-cover" />
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="w-full">
            <div className="space-y-4">
              {/* Title */}
              <div className="w-full">
                <div className="space-y-3">
                  <h1 className="text-28px font-bold leading-[1.2] tracking-tight">
                    2 CT Round Cut with Side Diamonds Accent Engagement Ring
                  </h1>
                  <div className="flex items-center gap-1.5 leading-none overflow-hidden justify-start">
                    <span className="text-base text-gray-800">VVS-VS Clarity · EF Color · 14K yellow gold · 2.6g · 4 round + 4 marquise accents · Lab-Grown diamond 
                      <button className="inline-flex items-center">
                        <Info size={14} className="text-gray-800 ml-2 top-0.75 relative hover:cursor-pointer" />
                      </button>
                    </span>
                  </div>
                </div>
                {/* Rating */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={16} fill="black" className="text-black" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold">4.9</span>
                </div>
              </div>

              {/* Price */}
              <div className="w-full">
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xl font-bold">₹99,970</span>
                  <span className="text-lg text-gray-500 line-through font-medium">₹126,008</span>
                  <span className="bg-gray-100 text-black text-base font-semibold px-3 py-1 rounded-full">
                    21% OFF
                  </span>
                  <button className="text-sm font-semibold underline underline-offset-4 ml-auto decoration-gray-300">
                    See Savings Breakup
                  </button>
                </div>
                <p className="text-sm text-gray-400 font-medium tracking-tight mt-2">Inclusive of all taxes.</p>
              </div>
              
              
              {/* Savings Banners Slider */}
              <div className="w-full mt-4">
                <Swiper
                  modules={[Autoplay]}
                  spaceBetween={8}
                  slidesPerView={1.5}
                  autoplay={false}
                  loop={true}
                  className="w-full"
                >
                  <SwiperSlide>
                    <div className="border-[0.0875rem] border-dashed border-[#E9DAC5] rounded-[0.25rem] px-[1rem] py-[0.5rem] flex items-center gap-2 bg-[#F1E4D14A] h-full w-fit whitespace-nowrap">
                      <span className="text-base shrink-0">
                        <img 
                          src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/image_3147_5.png?v=1782295698" 
                          alt="Diamond Discount" 
                          className="w-5 h-5 object-contain inline-block align-middle"
                        />
                      </span>
                      <p className="font-figtree font-medium text-[0.875rem] leading-[1.4] tracking-normal text-black whitespace-nowrap">
                        You're saving flat <span className="font-extrabold text-black">25% OFF</span> on diamond prices.
                      </p>
                    </div>
                  </SwiperSlide>
                  <SwiperSlide>
                    <div className="border-[0.0875rem] border-dashed border-[#E9DAC5] rounded-[0.25rem] px-[1rem] py-[0.5rem] flex items-center gap-2 bg-[#F1E4D14A] h-full w-fit whitespace-nowrap">
                      <span className="text-base shrink-0">🪙</span>
                      <p className="font-figtree font-medium text-[0.875rem] leading-[1.4] tracking-normal text-black whitespace-nowrap">
                        Save more with <span className="font-extrabold text-black">Lucira coins</span>
                      </p>
                    </div>
                  </SwiperSlide>
                  <SwiperSlide>
                    <div className="border-[0.0875rem] border-dashed border-[#E9DAC5] rounded-[0.25rem] px-[1rem] py-[0.5rem] flex items-center gap-2 bg-[#F1E4D14A] h-full w-fit whitespace-nowrap">
                      <span className="text-base shrink-0">✨</span>
                      <p className="font-figtree font-medium text-[0.875rem] leading-[1.4] tracking-normal text-black whitespace-nowrap">
                        Free <span className="font-extrabold text-black">Gift</span> included
                      </p>
                    </div>
                  </SwiperSlide>
                </Swiper>
              </div>
              <Separator />
            </div> 

            <div className="space-y-6 mt-4">
              {/* Gold Selection */}
              <div className="space-y-3">
                <div className="text-base font-bold">
                  Select Gold Color & Karat: <span className="text-gray-500 font-medium ml-1">14KT Yellow Gold</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <GoldOption metal="White Gold" karat="14KT" color="linear-gradient(143.06deg, #dfdfdf 29.61%, #f3f3f3 48.83%, #dfdfdf 66.43%)" />
                  <GoldOption metal="Yellow Gold" karat="14KT" active color="linear-gradient(147.45deg, #c59922 17.98%, #ead59e 48.14%, #c59922 83.84%)"/>
                  <GoldOption metal="Rose Gold" karat="14KT" color="linear-gradient(154.36deg, #f2b5b5 10.36%, #f8dbdb 68.09%)"/>
                  <GoldOption metal="White Gold" karat="18KT" color="linear-gradient(143.06deg, #dfdfdf 29.61%, #f3f3f3 48.83%, #dfdfdf 66.43%)"/>
                  <GoldOption metal="Yellow Gold" karat="18KT" color="linear-gradient(147.45deg, #c59922 17.98%, #ead59e 48.14%, #c59922 83.84%)"/>
                  <GoldOption metal="Rose Gold" karat="18KT" color="linear-gradient(154.36deg, #f2b5b5 10.36%, #f8dbdb 68.09%)"/>
                </div>
              </div>

              {/* Ring Size */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-base">Select Ring Size: <span className="font-medium ml-1">12 IND</span></span>
                  <button className="text-sm font-medium underline underline-offset-4 decoration-gray-300">Size Guide</button>
                </div>
                
                <div className="bg-[#F8F9FA] rounded-lg flex items-center gap-4 px-4 py-2.5 border border-gray-100">
                  <div className="bg-white rounded-lg p-2 shadow-sm">
                    <Play size={16} fill="black" />
                  </div>
                  <span className="text-base text-black">Watch this quick video to measure your ring right.</span>
                </div>

                <div className="grid grid-cols-7 gap-4">
                  {[5,6,7,8,9,10,11,12,13,14,15,16,17,18].map(size => (
                    <button
                      key={size}
                      className={`relative border rounded-md h-10 flex items-center justify-center text-base transition-all ${
                        size === 12
                          ? "border-primary bg-white ring-1 ring-primary font-bold"
                          : "border-gray-200 hover:border-primary font-normal"
                      }`}
                    >
                      {size.toString().padStart(2,"0")}
                      <span className="absolute top-1 left-1 w-1.5 h-1.5 bg-[#2DB36F] rounded-full"></span>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-black font-medium">Didn't get the size right? We'll exchange it.</p>                
                <div className="bg-[#ECF7F2] border border-[#B3E1CD] text-black  rounded-lg px-4 py-3 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-[#189351] rounded-full"></span>
                  This combination is <span className="font-semibold">in-stock & ready to ship in 24 hrs</span>
                </div>
              </div>
              <Separator />
            </div>

            {/* Engraving */}
            <div className="mt-4 mb-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-base">Complimentary Engraving (optional)</h3>
                <p className="text-sm text-black leading-relaxed font-medium">
                  Personalise your ring with a custom engraving. Your chosen message will
                  be carefully laser-engraved on the inner band.
                </p>
              </div>
              <div className="flex gap-4 items-center mt-4">
                <div className="relative flex-1">
                  <Input
                    value={engraving}
                    maxLength={20}
                    onChange={(e)=>setEngraving(e.target.value)}
                    placeholder="Enter name, date, initials"
                    className="h-12 bg-white border-gray-300 pr-16 text-sm"
                  />
                  <Button variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 hover:cursor-pointer">
                    DONE
                  </Button>
                </div>                
              </div>
              <div className="text-right text-base text-black mt-1 leading-6">
                {engraving.length}/20
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-2 mb-4">
              <div className="flex gap-2">
                 <button className="flex-1 h-12 text-lg font-bold rounded hover:cursor-pointer relative overflow-hidden bg-primary text-white hover:bg-[#8F5D5D] transition-colors shimmer-btn">
                    <span className="flex items-center justify-center">
                      {isMounted && (
                        <motion.span
                          initial={{ width: 0, marginRight: 0, x: -350 }}
                          animate={{
                            width: [0, 0, 28],
                            marginRight: [0, 0, 8],
                            x: [-350, 0]
                          }}
                          transition={{
                            ease: [0.16, 1, 0.3, 1],
                            x: { duration: 2.2, delay: 2 },
                            width: { duration: 2.2, times: [0, 0.6, 1], delay: 2 },
                            marginRight: { duration: 2.2, times: [0, 0.6, 1], delay: 2 }
                          }}
                          className="flex items-center justify-center shrink-0 overflow-hidden"
                        >
                          <svg width={28} height={18} viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "28px", height: "18px" }}>
                            <path d="M1 1H3L4.07085 6M4.07085 6L5.66 13.42C5.75758 13.8749 6.01067 14.2815 6.37571 14.5699C6.74075 14.8582 7.19491 15.0103 7.66 15H17.44C17.8952 14.9993 18.3365 14.8433 18.691 14.5578C19.0456 14.2724 19.2921 13.8745 19.39 13.43L21.04 6H4.07085ZM7.95 19.95C7.95 20.5023 7.50228 20.95 6.95 20.95C6.39772 20.95 5.95 20.5023 5.95 19.95C5.95 19.3977 6.39772 18.95 6.95 18.95C7.50228 18.95 7.95 19.3977 7.95 19.95ZM18.95 19.95C18.95 20.5023 18.5023 20.95 17.95 20.95C17.3977 20.95 16.95 20.5023 16.95 19.95C16.95 19.3977 17.3977 18.95 17.95 18.95C18.5023 18.95 18.95 19.3977 18.95 19.95Z" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </motion.span>
                      )}
                      <span>ADD TO CART</span>
                    </span>
                 </button>
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-md bg-gray-50 hover:cursor-pointer">
                  <Heart size={24} className="text-black" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-12 font-medium text-lg flex items-center justify-center gap-2 bg-gray-50 hover:cursor-pointer">
                  <Image src="/images/icons/engrave.svg" alt="whatsapp" width={18} height={18} />
                  Whatsapp Us
                </Button>
                <Button variant="outline" className="h-12 font-medium text-lg flex items-center justify-center gap-2 bg-gray-50 hover:cursor-pointer">
                  <Video size={18} className="text-black" />
                  Shop Live
                </Button>
              </div>
            </div>
           
            {/* Features */}
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-x-4 text-sm font-medium text-black">
               <div className="flex flex-col space-y-4.5 flex-1">
                <Feature
                  icon={
                    <svg width="20" height="20" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.125 18.9583C21.125 19.6766 20.8397 20.3655 20.3317 20.8734C19.8238 21.3813 19.135 21.6667 18.4167 21.6667C17.6984 21.6667 17.0095 21.3813 16.5016 20.8734C15.9937 20.3655 15.7083 19.6766 15.7083 18.9583C15.7083 18.24 15.9937 17.5512 16.5016 17.0433C17.0095 16.5353 17.6984 16.25 18.4167 16.25C19.135 16.25 19.8238 16.5353 20.3317 17.0433C20.8397 17.5512 21.125 18.24 21.125 18.9583ZM10.2917 18.9583C10.2917 19.6766 10.0063 20.3655 9.49841 20.8734C8.9905 21.3813 8.30163 21.6667 7.58333 21.6667C6.86504 21.6667 6.17616 21.3813 5.66825 20.8734C5.16034 20.3655 4.875 19.6766 4.875 18.9583C4.875 18.24 5.16034 17.5512 5.66825 17.0433C6.17616 16.5353 6.86504 16.25 7.58333 16.25C8.30163 16.25 8.9905 16.5353 9.49841 17.0433C10.0063 17.5512 10.2917 18.24 10.2917 18.9583Z" stroke="#5A413F" strokeWidth="2"/>
                      <path d="M15.7084 18.9585H10.2917M21.1251 18.9585H21.9517C22.19 18.9585 22.3092 18.9585 22.4088 18.9455C22.7675 18.9008 23.101 18.7379 23.3566 18.4824C23.6123 18.227 23.7755 17.8936 23.8204 17.535C23.8334 17.4342 23.8334 17.3151 23.8334 17.0767V14.0835C23.8334 12.2159 23.0915 10.4249 21.771 9.10429C20.4504 7.78372 18.6593 7.04183 16.7917 7.04183M16.2501 16.7918V7.5835C16.2501 6.05166 16.2501 5.28575 15.7734 4.81016C15.2989 4.3335 14.533 4.3335 13.0001 4.3335H5.41675C3.88491 4.3335 3.119 4.3335 2.64341 4.81016C2.16675 5.28466 2.16675 6.05058 2.16675 7.5835V16.2502C2.16675 17.2631 2.16675 17.769 2.3845 18.146C2.52712 18.393 2.73224 18.5981 2.97925 18.7407C3.35625 18.9585 3.86216 18.9585 4.87508 18.9585" stroke="#5A413F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  }
                  text="Free and secure shipping"
                />
                <Feature
                  icon={
                    <svg width="20" height="20" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M7.07957 3.521C6.76741 3.5211 6.4601 3.59828 6.18494 3.74569C5.90977 3.8931 5.67527 4.10618 5.50224 4.366L1.61416 10.1965C1.37691 10.554 1.34874 11.0112 1.54049 11.3947C3.66944 15.6493 6.6262 19.4362 10.2375 22.5335L12.1333 24.1596C12.3748 24.3666 12.6824 24.4804 13.0005 24.4804C13.3186 24.4804 13.6262 24.3666 13.8677 24.1596L15.7636 22.5346C19.3754 19.4371 22.3325 15.6498 24.4617 11.3947C24.6534 11.0112 24.6242 10.554 24.3869 10.1965L20.4967 4.366C20.3236 4.10653 20.0892 3.89376 19.8143 3.74655C19.5393 3.59934 19.2323 3.52224 18.9204 3.52208L7.07957 3.521ZM6.85424 5.26625C6.87901 5.22922 6.91253 5.19887 6.95184 5.17789C6.99115 5.15691 7.03502 5.14596 7.07957 5.146H9.61457L7.53999 10.125C7.49389 10.2394 7.45765 10.3576 7.43166 10.4782C6.6687 10.4213 5.90667 10.3526 5.14582 10.2723L3.62374 10.1131L6.85424 5.26625ZM3.55332 11.7392C5.49823 15.3049 8.06409 18.4948 11.1302 21.1587L7.74474 12.1302C6.82109 12.0667 5.89866 11.9866 4.97791 11.8897L3.55332 11.7392ZM9.51816 12.231L13 21.5195L16.4829 12.231C14.1622 12.3362 11.8378 12.3362 9.51707 12.231M18.2563 12.1302L14.8709 21.1587C17.937 18.4948 20.5028 15.3049 22.4477 11.7392L21.0232 11.8897C20.1023 11.9858 19.18 12.066 18.2563 12.1302ZM22.3762 10.1131L20.8531 10.2734C20.0922 10.3537 19.3302 10.4223 18.5672 10.4792C18.5417 10.3583 18.5058 10.2398 18.46 10.125L16.3854 5.146H18.9204C18.965 5.14596 19.0088 5.15691 19.0481 5.17789C19.0874 5.19887 19.121 5.22922 19.1457 5.26625L22.3762 10.1131ZM16.8913 10.5843C14.2978 10.7187 11.7036 10.7187 9.10866 10.5843L11.375 5.146H14.625L16.8913 10.5843Z" fill="#5A413F"/>
                    </svg>
                  }
                  text="Certified Diamond & Gold Jewelry"
                />
              </div>
              <div className="flex flex-col space-y-4.5">
                <Feature
                  icon={
                    <svg width="20" height="20" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.3917 21.1248C20.2953 19.8642 21.6962 17.9755 22.3501 15.788C23.004 13.6005 22.8694 11.2529 21.9699 9.15437C21.0704 7.05588 19.463 5.33961 17.4279 4.30473C15.3927 3.26984 13.0589 2.98199 10.8333 3.49135M22.2083 21.1248H18.3917V17.3331M7.58333 4.89209C5.68631 6.15733 4.29275 8.04743 3.64498 10.2337C2.99721 12.42 3.13622 14.7642 4.03782 16.8586C4.93942 18.9531 6.54659 20.6652 8.57984 21.6974C10.6131 22.7296 12.9438 23.0165 15.1667 22.5082M3.79167 4.89209H7.58333V8.66643" stroke="#5A413F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  }
                  text="Lifetime Buyback or Exchange"
                />
                <Feature
                  icon={
                    <svg width="20" height="20" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath="url(#clip0_2_68952)">
                        <path d="M0.8125 15.4375V25.1875M0.8125 23.5625H18.6875C18.6875 22.7005 18.3451 21.8739 17.7356 21.2644C17.1261 20.6549 16.2995 20.3125 15.4375 20.3125H11.375M11.375 20.3125C11.375 19.4505 11.0326 18.6239 10.4231 18.0144C9.8136 17.4049 8.98695 17.0625 8.125 17.0625H0.8125M11.375 20.3125H7.3125M7.1825 0.8125H23.6925C24.0929 0.81821 24.4747 0.982005 24.7548 1.26816C25.0349 1.55431 25.1904 1.93961 25.1875 2.34V11.7433C25.1904 12.1437 25.0349 12.529 24.7548 12.8152C24.4747 13.1013 24.0929 13.2651 23.6925 13.2708H7.1825C6.78214 13.2651 6.40028 13.1013 6.12021 12.8152C5.84015 12.529 5.6846 12.1437 5.6875 11.7433V2.34C5.6846 1.93961 5.84015 1.55431 6.12021 1.26816C6.40028 0.982005 6.78214 0.81821 7.1825 0.8125Z" stroke="#5A413F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8.66663 4.3335H10.2916M20.5833 9.75016H22.2083M13 7.04183C13 7.68829 13.2568 8.30828 13.7139 8.7654C14.171 9.22252 14.791 9.47933 15.4375 9.47933C16.0839 9.47933 16.7039 9.22252 17.161 8.7654C17.6182 8.30828 17.875 7.68829 17.875 7.04183C17.875 6.39536 17.6182 5.77538 17.161 5.31826C16.7039 4.86114 16.0839 4.60433 15.4375 4.60433C14.791 4.60433 14.171 4.86114 13.7139 5.31826C13.2568 5.77538 13 6.39536 13 7.04183Z" stroke="#5A413F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </g>
                      <defs>
                        <clipPath id="clip0_2_68952">
                          <rect width="26" height="26" fill="white"/>
                        </clipPath>
                      </defs>
                    </svg>
                  }
                  text="15-day Money Back Guarantee"
                />
              </div>
              </div>

              <Separator/>

              {/* Lucira Coins */}
              <div className="flex gap-4 items-center bg-gray-50 border border-gray-100 rounded-xl p-4">
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center">
                  <Star size={24} className="text-primary fill-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold leading-tight">
                    Earn 5138 Lucira Coins worth ₹500 with this order
                  </p>
                  <p className="text-sm font-medium text-black">
                    10 Lucira Coins = ₹1
                  </p>
                </div>
              </div>

              <Separator/>
            </div>

            <div className="space-y-4 mt-4">
              {/* Pincode & Delivery */}
              <div className="space-y-3 pt-2">
                <div className="relative">
                  <Input
                    placeholder="Enter Pincode"
                    defaultValue="411005"
                    className="h-14 bg-white border-gray-200 rounded-md text-sm font-medium pr-40"
                  />
                  <Button className="h-12 px-10 font-bold rounded-md absolute right-1 top-1/2 transform -translate-y-1/2 hover:cursor-pointer">
                    CHECK
                  </Button>
                </div>
                <div className="text-sm text-black flex items-center gap-2">
                  <Info size={16} className="text-black" />
                  Estimated dispatch by <span className="font-semibold text-black">January 21, 2026</span>
                </div>
              </div>

              {/* Nearest Store */}
              <div className="border border-gray-200 rounded-md p-4 space-y-2.5 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Store size={20} className="text-black" strokeWidth={1.2} />
                  <span className="text-base font-bold">Nearest Store - <span className="italic font-semibold text-black">Pune Lucira Store (3Km)</span></span>
                </div>
                <div className="flex items-center gap-2 bg-[#E3F5E0] text-black px-3 py-1.5 rounded-full w-fit">
                      <div className="w-3.5 h-3.5 bg-[#76D168] rounded-full flex items-center justify-center">
                        <Check size={9} className="text-white" strokeWidth={4} />
                      </div>
                      <span className="text-12px font-semibold tracking-tight">Design Available</span>
                </div>
                <p className="text-sm text-black">
                  Also available in <button className="underline underline-offset-2 font-bold">2 other stores</button>
                </p>
                <Button className="w-full h-12 font-bold rounded-md mt-1 text-sm">
                  FIND IN STORE
                </Button>
              </div>
              <Separator/>
            </div>

            {/* Promo Cards Slider */}
            <div className="space-y-4 mt-4">
              <div className="overflow-hidden">
                <Swiper
                  spaceBetween={12}
                  slidesPerView={1.2}
                  onSlideChange={(swiper) => setActivePromoSlide(swiper.activeIndex + 1)}
                  className="w-full overflow-visible!"
                >
                  {[1, 2, 3].map((i) => (
                    <SwiperSlide key={i}>
                      <div className="bg-[#F9F9F9] border border-gray-100 rounded-xl p-5 flex items-center gap-5 h-full">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden shadow-sm shrink-0">
                          <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/story-ring.jpg" alt="gold coin" fill className="object-cover" unoptimized />
                        </div>
                        <div className="space-y-2">
                          <p className="text-lg font-semibold italic leading-tight">Complimentary Gold Coin</p>
                          <p className="text-sm leading-relaxed">
                            Receive a free gold coin with this ring, making your order even more special.
                          </p>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
                {/* Slider Indicator */}
                <div className="flex items-center gap-5 mt-4">
                  <div className="flex-1 h-0.75 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-black rounded-full transition-all duration-300"
                      style={{ width: `${(activePromoSlide / 3) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-[12px] font-bold tracking-tight text-black">{activePromoSlide}/3</span>
                </div>
              </div>
              <Separator/>            
            </div>
            {/* Explore Section */}
            <div className="space-y-4 mt-4">
              <h3 className="text-base font-semibold">More Ways To Explore:</h3>
              <ExploreCard
                title="Visit Our Store"
                description="Explore and try your favorite designs in person, with expert guidance from our in-store team."
                action="BOOK APPOINTMENT"
                img="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/subscribe-1.jpg"
              />
              <ExploreCard
                title="Try At Home"
                description="Try your selected pieces from the comfort of your home. Available in all major cities"
                action="BOOK HOME TRIAL"
                img="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/subscribe-2.jpg"
              />
              <Separator/>
            </div>

            {/* Product Details Section */}
            <div className="space-y-4 mt-4">
              <h2 className="text-base font-semibold tracking-tight">Product Details:</h2>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-4">
                {/* Metal & Dimensions */}
                <div className="flex gap-3 relative justify-between">
                  {/* Metal */}
                  <div className="w-[48%] border-r">
                    <div className="flex items-center gap-2 font-semibold text-sm mb-2 uppercase tracking-wide">
                      <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/PDPIcons_metal.svg" alt="Metal details icon" width={18} height={18} />
                      Metal
                    </div>
                    <div className="flex items-center gap-4.5 pr-2">
                      <div className="w-20 h-20 bg-white rounded-lg border border-gray-100 flex items-center justify-center p-2 shadow-sm">
                        <Image src="/images/product/try.jpg" alt="Metal details sample" width={80} height={80} className="object-contain" />
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm  leading-none">14KT Yellow Gold</p>
                        <p className="text-sm leading-none">Net Wt: <span className="font-medium">2.079 g</span></p>
                      </div>
                    </div>
                  </div>
                  {/* Dimensions */}
                  <div className="w-[48%] pl-2">
                    <div className="flex items-center gap-2 font-semibold text-sm mb-2 uppercase tracking-wide">
                      <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/dimension.svg" alt="Dimensions icon" width={18} height={18} />
                      Dimensions
                    </div>
                    <div className="flex items-center gap-4.5">
                      <div className="w-20 h-20 bg-white rounded-lg border border-gray-100 flex items-center justify-center p-2 shadow-sm">
                        <Image src="/images/product/try.jpg" alt="Dimensions sample" width={80} height={80} className="object-contain" />
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm  leading-none">Height: <span className="font-medium ml-2">7.1 mm</span></p>
                        <p className="text-sm  leading-none">Width: <span className="font-medium ml-2">8 mm</span></p>
                        <p className="text-sm  leading-none">Gross Wt: <span className="font-medium ml-2">2.58 g</span></p>
                      </div>
                    </div>
                  </div>
                </div>
                <Separator/>
                {/* Diamond Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-semibold text-sm uppercase tracking-wide">
                    <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/LJ-PD0059YG_1.jpg" alt="Diamond details icon" width={18} height={18} />
                    Diamond
                  </div>
                  
                  <div className="bg-[#EDEDED] rounded-md px-4 py-2 flex items-center gap-2.5 w-fit">
                    <div className="w-5 h-5 rounded-full bg-gray-500 flex items-center justify-center text-12px text-white font-semibold">i</div>
                    <span className="text-12px">Clarity & Color: <span className="font-medium">VVS-VS, EF</span></span>
                  </div>

                  <div className="flex divide-x divide-gray-200">
                    {[ 
                      { img: "/images/product/1.jpg", shape: "Round", pcs: "1", carat: "2.00ct" },
                      { img: "/images/product/2.jpg", shape: "Round", pcs: "4", carat: "0.048ct" },
                      { img: "/images/product/3.jpg", shape: "Marquise", pcs: "4", carat: "0.48ct" }
                    ].map((d, i) => (
                      <DiamondDetail key={i} {...d} index={i} />
                    ))}
                  </div>
                  <Separator/>
                </div>

                <p className="text-12px leading-relaxed">
                  Our products are handcrafted and personalised for your delight, hence a weight variance is expected.
                </p>
              </div>
            </div>

            <PriceSavingsDetails/>

            {/* Certification */}
            <div className="pt-6">
              <div className="bg-gray-50 border border-gray-100 rounded-xl ps-4 pe-16 py-4">
                <div className="flex items-center gap-2 text-base font-semibold text-black mb-4">
                  <svg width="19" height="17" viewBox="0 0 19 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.91667 13.25H1.58333C1.36232 13.25 1.15036 13.1622 0.994078 13.0059C0.837797 12.8496 0.75 12.6377 0.75 12.4167V1.58333C0.75 1.36232 0.837797 1.15036 0.994078 0.994078C1.15036 0.837797 1.36232 0.75 1.58333 0.75H16.5833C16.8043 0.75 17.0163 0.837797 17.1726 0.994078C17.3289 1.15036 17.4167 1.36232 17.4167 1.58333V12.4167C17.4167 12.6377 17.3289 12.8496 17.1726 13.0059C17.0163 13.1622 16.8043 13.25 16.5833 13.25H13.25M4.08333 4.08333H14.0833M4.08333 7H6.58333M4.08333 9.91667H5.75" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11.583 12C12.246 12 12.8819 11.7366 13.3508 11.2678C13.8196 10.7989 14.083 10.163 14.083 9.5C14.083 8.83696 13.8196 8.20107 13.3508 7.73223C12.8819 7.26339 12.246 7 11.583 7C10.92 7 10.2841 7.26339 9.81524 7.73223C9.3464 8.20107 9.08301 8.83696 9.08301 9.5C9.08301 10.163 9.3464 10.7989 9.81524 11.2678C10.2841 11.7366 10.92 12 11.583 12Z" stroke="black" strokeWidth="1.5"/>
                    <path d="M11.5837 14.9166L13.2503 15.7499V11.3633C13.2503 11.3633 12.7753 11.9999 11.5837 11.9999C10.392 11.9999 9.91699 11.3749 9.91699 11.3749V15.7499L11.5837 14.9166Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>

                  Certified Quality Guaranteed.
                </div>
                <div className="flex items-start justify-between gap-4">
                  <button className="text-sm font-semibold underline underline-offset-[6px] decoration-black mt-1 whitespace-nowrap">
                    See Sample Certificate
                  </button>
                  <div className="flex items-center gap-7">
                    <div className="w-14 h-14 relative">
                      <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/IGI.png" alt="IGI" fill className="object-contain" />
                    </div>
                    <div className="w-14 h-14 relative">
                      <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/SGL_528e2e93-e563-40b6-a8a6-c098475a6de9.png" alt="SGL" fill className="object-contain" />
                    </div>
                    <div className="w-14 h-14 relative">
                      <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/BIS.png" alt="BIS Hallmark" fill className="object-contain" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <ProductAccordion/>
            {/* Wear This With Slider */}
            <WearThisWith />

          </div>
        </div>
      </div>
      <LuxuryMarquee prop={["bg-primary", "text-white", "mt-10", "text-md", "font-semibold"]}/>
      <ProductStory/>  
      <FeaturedIn/>
      <OurProcess/>
      <CustomerReviews/>
      <FAQSection/>
      <DiamondComparison/>
      <ProductSlider title="From the Same Collection" subtitle="Discover matching pieces that perfectly complement one another"/>
      <ExploreOtherRings />
      <CategorySlider/>
      <ProductSlider title="Recently Viewed"/>
      {youMayAlsoLikeProducts.length > 0 && (
        <section className="w-full bg-white mt-10 md:mt-15 overflow-hidden">
          <div className="max-w-480 mx-auto px-5 md:px-17">
            <div className="text-center mb-10 md:mb-12">
              <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">From the Same Collection</h2>
              <p class="text-black font-normal md:text-base text-sm leading-[1.4] tracking-normal align-middle">Discover matching pieces that perfectly complement one another.</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-8 md:gap-y-12">
              {youMayAlsoLikeProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
      <FindLuciraStore/>
      <JoinLuciraCommunity/>

    </div>
  );
}

function DiamondDetail({ img, shape, pcs, carat }) {
  return (
    <div className="flex-1 ps-6 pe-6 first:ps-0 last:pe-0 flex flex-col items-start">

      {/* Diamond Image */}
      <div className="flex justify-start w-full mb-5">
        <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center overflow-hidden bg-white">
          <Image
            src={img}
            alt={shape}
            width={40}
            height={40}
            className="object-cover"
          />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-12px w-full">

        <div className="flex justify-between">
          <span className="w-18">Shape:</span>
          <span className="font-medium">{shape}</span>
        </div>

        <div className="flex justify-between">
          <span className="w-18">No. of Pcs:</span>
          <span className="font-medium">{pcs}</span>
        </div>

        <div className="flex justify-between">
          <span className="w-18">Carat:</span>
          <span className="font-medium">{carat}</span>
        </div>

      </div>

    </div>
  );
}

function DiamondInfo({ img, shape, pcs, carat }) {
  return (
    <div className="flex gap-4 border-l border-gray-100 pl-6 first:border-none first:pl-0">
      <div className="w-14 h-14 rounded-full bg-[#F7F7F7] flex items-center justify-center shrink-0 relative overflow-hidden border border-gray-100">
        <Image src={img} alt={`${shape} diamond shape`} fill className="object-cover p-1.5 rounded-full" />
      </div>
      <div className="space-y-1 text-[13px] font-bold">
        <p className="text-gray-400">Shape: <span className="text-black font-bold ml-1">{shape}</span></p>
        <p className="text-gray-400">No. of Pcs: <span className="text-black font-bold ml-1">{pcs}</span></p>
        <p className="text-gray-400">Carat: <span className="text-black font-bold ml-1">{carat}</span></p>
      </div>
    </div>
  );
}

function ExploreCard({ title, description, action, img }) {
  return (
    <div className="bg-[#F9F9F9] border border-gray-100 rounded-lg p-3 flex items-center justify-between gap-3">
      <div className="w-24 h-16 rounded-md bg-gray-200 shrink-0 relative overflow-hidden shadow-sm">
        {img && <Image src={img} alt={title} fill className="object-cover" />}
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold leading-tight">
          {title}
        </p>
        <p className="text-12px font-medium leading-[1.3]">
          {description}
        </p>
      </div>
      <Button variant="link" className="text-sm p-0 m-0 font-bold underline underline-offset-4 whitespace-nowrap">
        {action}
      </Button>
    </div>
  );
}


function Feature({ icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0">
        {icon}
      </div>
      <span className="leading-tight tracking-tight">{text}</span>
    </div>
  );
}

function GoldOption({ metal, karat, color, active }) {
  return (
    <div
      className={`border rounded-lg py-2 px-4 cursor-pointer relative flex flex-col items-center gap-3 transition-all ${
        active
          ? "border-primary bg-white ring-1 ring-primary shadow-sm"
          : "border-gray-200 bg-[#F9F9F9] hover:border-gray-300"
      }`}
    >
      <span className={`absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-[#2DB36F]`}></span>
      <div className={`w-7 h-7 rounded-full border border-gray-100 shadow-inner`} style={{ background: color }}></div>
      <div className={`text-sm text-center text-black leading-tight uppercase tracking-tight flex flex-col gap-1 ${active ? "font-semibold" : "font-normal"}`}>
        <span>{karat}</span>
        <span>{metal}</span>
      </div>
    </div>
  );
}