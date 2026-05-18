"use client";
import { useState } from "react";
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
import ExploreOtherRings from "@/components/product/ExploreOtherRings";
import WearThisWith from "@/components/product/WearThisWith";
import { Separator } from "@/components/ui/separator"

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

export default function ProductPage() {
  const [engraving, setEngraving] = useState("");
  const [activePromoSlide, setActivePromoSlide] = useState(1);
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
              <div className="w-full">
                <Swiper
                  modules={[Autoplay]}
                  spaceBetween={8}
                  slidesPerView={1.5}
                  autoplay={false}
                  loop={true}
                  className="w-full"
                >
                  <SwiperSlide>
                    <div className="border border-dashed border-gray-400 rounded-lg px-3 py-3 flex items-center gap-2 bg-gray-50 h-full">
                      <span className="text-base shrink-0">💎</span>
                      <p className="text-sm font-semibold text-black whitespace-nowrap">
                        You're saving flat <span className="font-extrabold text-black">25% OFF</span> on diamond prices.
                      </p>
                    </div>
                  </SwiperSlide>
                  <SwiperSlide>
                    <div className="border border-dashed border-gray-400 rounded-lg px-3 py-3 flex items-center gap-2 bg-gray-50 h-full">
                      <span className="text-base shrink-0">🪙</span>
                      <p className="text-sm font-semibold text-black whitespace-nowrap">
                        Save more with <span className="font-extrabold text-black">Lucira coins</span>
                      </p>
                    </div>
                  </SwiperSlide>
                  <SwiperSlide>
                    <div className="border border-dashed border-gray-400 rounded-lg px-3 py-3 flex items-center gap-2 bg-gray-50 h-full">
                      <span className="text-base shrink-0">✨</span>
                      <p className="text-sm font-semibold text-black whitespace-nowrap">
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
                <Button className="flex-1 h-12 text-lg font-bold  rounded-md hover:cursor-pointer">
                  ADD TO CART
                </Button>
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
                    <Feature icon={<Image src="/images/product/shipping.svg" alt="Shipping icon" width={20} height={20} />} text="Free and secure shipping" />
                    <Feature icon={<Image src="/images/product/exchange.svg" alt="Exchange icon" width={20} height={20} />} text="Lifetime exchange and 100% value guarantee" />                  
                </div>
                <div className="flex flex-col space-y-4.5">
                  <Feature icon={<Image src="/images/product/return.svg" alt="Return icon" width={20} height={20} />} text="15-day free returns" />
                  <Feature icon={<BadgeCheck size={20} className="text-black" />} text="IGI and Hallmark certified" />
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
                  Estimated free dispatch by <span className="font-semibold text-black">January 21, 2026</span>
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
                          <Image src="/images/story-ring.jpg" alt="gold coin" fill className="object-cover" />
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
                img="/images/store.jpg"
              />
              <ExploreCard
                title="Try At Home"
                description="Try your selected pieces from the comfort of your home. Available in all major cities"
                action="BOOK HOME TRIAL"
                img="/images/subscribe-2.jpg"
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
                      <Image src="/images/icons/metal.svg" alt="Metal details icon" width={18} height={18} />
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
                      <Image src="/images/icons/dimension.svg" alt="Dimensions icon" width={18} height={18} />
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
                    <Image src="/images/icons/diamond.svg" alt="Diamond details icon" width={18} height={18} />
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
                      <Image src="/images/product/IGI.png" alt="IGI" fill className="object-contain" />
                    </div>
                    <div className="w-14 h-14 relative">
                      <Image src="/images/product/SGL.png" alt="SGL" fill className="object-contain" />
                    </div>
                    <div className="w-14 h-14 relative">
                      <Image src="/images/product/BIS.png" alt="BIS Hallmark" fill className="object-contain" />
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