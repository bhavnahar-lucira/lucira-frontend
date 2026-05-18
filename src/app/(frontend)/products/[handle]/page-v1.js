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
import { Star, Play, Info, Heart, Truck, RotateCcw, BadgeCheck, PlayCircle, Video, Store, CheckCircle,  Diamond, Ruler, ShieldCheck  } from "lucide-react";
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

export default function ProductPage() {
  const [engraving, setEngraving] = useState("");
  return (
    <div className="w-full">
      <div className="px-17 py-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Engagement Rings</BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbLink href="#">Round</BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            <BreadcrumbItem>
              Round Cut with Side Diamonds Accent Engagement Ring
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_530px] gap-10 items-start">
          <div className="grid grid-cols-2 gap-4 sticky top-5 self-start">
            <ProductImage label="Best Seller" />
            <ProductImage/>
            <ProductImage />
            <ProductImage />
            <ProductImage />
            <ProductImage />
          </div>
          <div className="space-y-6 max-w-132.5 sticky top-5 self-start">
            {/* Title */}
            <h1 className="text-[26px] font-semibold leading-tight">
              2 CT Round Cut with Side Diamonds Accent Engagement Ring
            </h1>
            {/* Description */}
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              VVS-VS Clarity · EF Color · 14K yellow gold · 2.6g · 4 round +
              4 marquise accents · Lab-Grown diamond
              <Info size={14} />
            </p>
            {/* Rating */}
            <div className="flex items-center gap-2 text-sm">
              <div className="flex text-black">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={16} fill="black" />
                ))}
              </div>
              <span>4.9</span>
            </div>
            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold">
                ₹99,970
              </span>
              <span className="line-through text-muted-foreground">
                ₹126,008
              </span>
              <span className="bg-gray-100 text-xs px-2 py-1 rounded-full">
                21% OFF
              </span>
              <span className="text-sm underline ml-auto cursor-pointer">
                See Savings Breakup
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Inclusive of all taxes.
            </p>
            {/* Savings banners */}
            <div className="flex gap-3">
              <div className="border border-dashed rounded-md p-3 text-sm flex-1">
                💎 You're saving flat <b>25% OFF</b> on diamond prices.
              </div>
              <div className="border border-dashed rounded-md p-3 text-sm flex-1">
                🪙 Save more with Lucira coins
              </div>
            </div>
            {/* Gold selection */}
            <div className="space-y-3">
              <div className="text-sm font-medium">
                Select Gold Color & Karat:
                <span className="text-muted-foreground ml-1">
                  14KT Yellow Gold
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <GoldOption label="14KT White Gold" color="bg-gray-200" />
                <GoldOption label="14KT Yellow Gold" active color="bg-yellow-400"/>
                <GoldOption label="14KT Rose Gold" color="bg-rose-300"/>
                <GoldOption label="18KT White Gold" color="bg-gray-200"/>
                <GoldOption label="18KT Yellow Gold" color="bg-yellow-400"/>
                <GoldOption label="18KT Rose Gold" color="bg-rose-300"/>
              </div>
            </div>

            {/* Ring Size */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>
                  Select Ring Size:
                  <b className="ml-1">12 IND</b>
                </span>
                <span className="underline cursor-pointer">
                  Size Guide
                </span>
              </div>
              {/* video helper */}
              <div className="bg-gray-100 rounded-md flex items-center gap-3 px-3 py-2 text-sm">
                <div className="bg-gray-300 rounded-md p-2">
                  <Play size={16}/>
                </div>
                Watch this quick video to measure your ring right.
              </div>
              {/* sizes */}
              <div className="grid grid-cols-7 gap-2">
                {[5,6,7,8,9,10,11,12,13,14,15,16,17,18].map(size => (
                  <button
                    key={size}
                    className={`relative border rounded-md py-2 text-sm ${
                      size === 12
                        ? "border-black bg-gray-100 font-semibold"
                        : "hover:border-black"
                    }`}
                  >
                    {size.toString().padStart(2,"0")}
                    {/* stock dot */}
                    <span className="absolute top-1 left-1 w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Didn't get the size right? We'll exchange it.
              </p>
            </div>


            {/* Stock banner */}

            <div className="border border-green-400 bg-green-50 text-green-700 text-sm rounded-md px-3 py-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              This combination is <b>in-stock & ready to ship in 24 hrs</b>
            </div>
            <div className="space-y-6">
              {/* Engraving */}
              <div className="space-y-2">
                <h3 className="font-semibold">
                  Complimentary Engraving (optional)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Personalise your ring with a custom engraving. Your chosen message will
                  be carefully laser-engraved on the inner band.
                </p>
                <div className="flex gap-2">

                  <Input
                    value={engraving}
                    maxLength={20}
                    onChange={(e)=>setEngraving(e.target.value)}
                    placeholder="Enter name, date, initials"
                  />

                  <Button variant="ghost">
                    DONE
                  </Button>

                </div>

                <div className="text-right text-xs text-muted-foreground">
                  {engraving.length}/20
                </div>
              </div>
              {/* Add to cart */}
              <div className="flex gap-3">
                <Button className="flex-1 h-12 text-base">
                  ADD TO CART
                </Button>
                <Button variant="outline" size="icon" className="h-12 w-12">
                  <Heart size={20}/>
                </Button>
              </div>
              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">

                <Button variant="outline" className="h-11">
                  <span className="mr-2">🟢</span>
                  Whatsapp Us
                </Button>

                <Button variant="outline" className="h-11">
                  <Video size={18} className="mr-2"/>
                  Shop Live
                </Button>

              </div>
              {/* Shipping features */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Feature icon={<Truck size={18}/>} text="Free and secure shipping" />
                <Feature icon={<RotateCcw size={18}/>} text="15-day free returns" />
                <Feature icon={<RotateCcw size={18}/>} text="Lifetime exchange and 100% value guarantee" />
                <Feature icon={<BadgeCheck size={18}/>} text="IGI and Hallmark certified" />
              </div>
              {/* Coins card */}
              <div className="flex gap-3 items-center bg-gray-100 rounded-md p-3">
                <div className="bg-yellow-100 p-2 rounded-md">
                  ⭐
                </div>

                <div className="text-sm">
                  <p className="font-medium">
                    Earn 5138 Lucira Coins worth ₹500 with this order
                  </p>

                  <p className="text-muted-foreground text-xs">
                    10 Lucira Coins = ₹1
                  </p>
                </div>

              </div>
              {/* Pincode */}
              <div className="flex gap-3">
                <Input
                  placeholder="Enter Pincode"
                  defaultValue="411005"
                />
                <Button className="px-6">
                  CHECK
                </Button>
              </div>
              {/* Delivery date */}
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                ℹ️ Estimated free dispatch by
                <span className="font-medium text-black">
                  January 21, 2026
                </span>
              </div>

            </div>

            <div className="space-y-8">
              {/* Nearest store */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 font-medium">
                  <Store size={18} />
                  Nearest Store - <span className="italic">Pune Lucira Store (3Km)</span>
                </div>

                <div className="flex items-center gap-2 text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full w-fit">
                  <CheckCircle size={16} />
                  Design Available
                </div>

                <p className="text-sm text-muted-foreground">
                  Also available in <span className="underline cursor-pointer">2 other stores</span>
                </p>

                <Button className="w-full">
                  FIND IN STORE
                </Button>

              </div>
              {/* Complimentary Gold Coin */}
              <div className="border rounded-lg p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-yellow-200 flex items-center justify-center">
                  🪙
                </div>
                <div className="flex-1">

                  <p className="font-medium italic">
                    Complimentary Gold Coin
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Receive a free gold coin with this ring, making your order even more special.
                  </p>

                </div>

              </div>
              {/* Slider indicator */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-1 bg-gray-200 rounded">
                  <div className="h-1 w-1/3 bg-black rounded"></div>
                </div>
                <span className="text-sm">1/3</span>
              </div>
              {/* More ways to explore */}
              <div className="space-y-4">
                <h3 className="font-semibold">
                  More Ways To Explore:
                </h3>
                {/* Visit Store */}
                  <ExploreCard
                    title="Visit Our Store"
                    description="Explore and try your favorite designs in person, with expert guidance from our in-store team."
                    action="BOOK APPOINTMENT"
                  />
                {/* Try At Home */}
                <ExploreCard
                  title="Try At Home"
                  description="Try your selected pieces from the comfort of your home. Available in all major cities"
                  action="BOOK HOME TRIAL"
                />
              </div>
            </div>
            <div className="mt-10">

              <h2 className="text-lg font-semibold mb-4">
                Product Details:
              </h2>

              <div className="border rounded-lg p-6 space-y-6">

                {/* Metal + Dimensions */}

                <div className="grid md:grid-cols-2 gap-6">

                  {/* Metal */}

                  <div className="flex gap-4">

                    <div className="flex-shrink-0">
                      <Image
                        src="/images/product/metal-ring.png"
                        alt="Ring Metal"
                        width={70}
                        height={70}
                        className="rounded-md bg-gray-100"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 font-medium mb-2">
                        <Diamond size={16} />
                        Metal
                      </div>

                      <p className="text-sm">14KT Yellow Gold</p>
                      <p className="text-sm text-muted-foreground">
                        Net Wt: 2.079 g
                      </p>
                    </div>

                  </div>


                  {/* Dimensions */}

                  <div className="flex gap-4 border-l pl-6">

                    <div className="flex-shrink-0">
                      <Image
                        src="/images/product/ring-dimension.png"
                        alt="Dimensions"
                        width={70}
                        height={70}
                        className="rounded-md bg-gray-100"
                      />
                    </div>

                    <div>

                      <div className="flex items-center gap-2 font-medium mb-2">
                        <Ruler size={16} />
                        Dimensions
                      </div>

                      <p className="text-sm">
                        Height: <span className="font-medium">7.1 mm</span>
                      </p>

                      <p className="text-sm">
                        Width: <span className="font-medium">8 mm</span>
                      </p>

                      <p className="text-sm">
                        Gross Wt: <span className="font-medium">2.58 g</span>
                      </p>

                    </div>

                  </div>

                </div>


                {/* Diamond */}

                <div className="space-y-4">

                  <div className="flex items-center gap-2 font-medium">
                    <Diamond size={16} />
                    Diamond
                  </div>

                  <div className="bg-gray-100 text-sm px-3 py-2 rounded-md w-fit">
                    Clarity & Color: VVS-VS, EF
                  </div>


                  {/* Diamond Grid */}

                  <div className="grid md:grid-cols-3 gap-6">

                    <DiamondInfo
                      img="/images/product/diamond-round.png"
                      shape="Round"
                      pcs="1"
                      carat="2.00ct"
                    />

                    <DiamondInfo
                      img="/images/product/diamond-round-small.png"
                      shape="Round"
                      pcs="4"
                      carat="0.048ct"
                    />

                    <DiamondInfo
                      img="/images/product/diamond-marquise.png"
                      shape="Marquise"
                      pcs="4"
                      carat="0.48ct"
                    />

                  </div>

                </div>


                {/* Disclaimer */}

                <p className="text-sm text-muted-foreground">
                  Our products are handcrafted and personalised for your delight,
                  hence a weight variance is expected.
                </p>

              </div>

            </div>
            <PriceSavingsDetails/>
            <div className="mt-10">
              <div className="bg-gray-100 rounded-lg px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                {/* Left Content */}

                <div className="space-y-2">

                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <ShieldCheck size={20} />
                    Certified Quality Guaranteed.
                  </div>

                  <button className="underline text-sm font-medium">
                    See Sample Certificate
                  </button>

                </div>


                {/* Logos */}

                <div className="flex items-center gap-8">

                  <Image
                    src="/images/product/igi.png"
                    alt="IGI"
                    width={70}
                    height={70}
                  />

                  <Image
                    src="/images/product/sgl.png"
                    alt="SGL"
                    width={80}
                    height={40}
                  />

                  <Image
                    src="/images/product/bis.png"
                    alt="BIS Hallmark"
                    width={80}
                    height={40}
                  />

                </div>

              </div>

            </div>
            <ProductAccordion/>

          </div>
        </div>
      </div>

      <LuxuryMarquee/>    
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

function DiamondInfo({ img, shape, pcs, carat }) {
  return (
    <div className="flex gap-4 border-l pl-4 first:border-none first:pl-0">

      <div>
        <Image
          src={img}
          alt={shape}
          width={50}
          height={50}
          className="rounded-full bg-gray-100"
        />
      </div>

      <div className="text-sm space-y-1">

        <p>
          Shape: <span className="font-medium">{shape}</span>
        </p>

        <p>
          No. of Pcs: <span className="font-medium">{pcs}</span>
        </p>

        <p>
          Carat: <span className="font-medium">{carat}</span>
        </p>

      </div>

    </div>
  );
}

function ExploreCard({ title, description, action }) {
  return (
    <div className="border rounded-lg p-4 flex items-center gap-4">

      <div className="w-16 h-16 bg-gray-200 rounded-md"></div>

      <div className="flex-1">

        <p className="font-medium">
          {title}
        </p>

        <p className="text-sm text-muted-foreground">
          {description}
        </p>

      </div>

      <button className="underline font-medium text-sm">
        {action}
      </button>

    </div>
  );
}


function Feature({ icon, text }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      {text}
    </div>
  );
}

function ProductImage({ label }) {
  return (
    <div className="relative bg-muted rounded-lg aspect-square flex items-center justify-center">

      {label && (
        <div className="absolute top-3 left-3 text-xs bg-white px-2 py-1 rounded shadow">
          {label}
        </div>
      )}

      <span className="text-sm text-muted-foreground">
        Image
      </span>

    </div>
  );
}


function OptionCard({ title, active }) {
  return (
    <div
      className={`border rounded-lg p-4 text-sm cursor-pointer ${
        active ? "border-black bg-muted" : ""
      }`}
    >
      {title}
    </div>
  );
}

function GoldOption({ label, color, active }) {

  return (
    <div
      className={`border rounded-lg p-4 text-sm cursor-pointer relative flex flex-col items-center gap-2 ${
        active
          ? "border-black bg-gray-50"
          : "hover:border-black"
      }`}
    >

      <span className="absolute top-2 left-2 w-2 h-2 bg-green-600 rounded-full"></span>

      <div className={`w-6 h-6 rounded-full ${color}`}></div>

      {label}

    </div>
  );
}