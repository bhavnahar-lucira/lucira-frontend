"use client";

import { Suspense } from "react";
import Image from "next/image";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { HandCoins, Calendar, Wallet, ShieldCheck, Star, ArrowRight, Loader2 } from "lucide-react";
import { useWindowSize } from "@/hooks/useWindowSize";
import DesktpSavingCalculator from "@/components/schemes/savingCalculator/DesktpSavingCalculator";
import MobileSavingCalculator from "@/components/schemes/savingCalculator/MobileSavingCalculator";
import SchemeHowItWorks from "@/components/schemes/SchemeHowItWorks";
import { SchemeFaq } from "@/components/schemes/SchemeFaq";
import { motion } from "framer-motion";

export default function Page() {
  const { width } = useWindowSize();
  if (!width) return null;

  const items = [
    {
      icon: HandCoins,
      title: "FLEXIBLE PAYMENTS",
      desc: "Start with just ₹2,000/month and grow your gold savings effortlessly.",
      bg: "bg-[#5a413f]/5",
      iconColor: "text-[#5a413f]",
    },
    {
      icon: Calendar,
      title: "SMART PLANNING",
      desc: "Perfect for future weddings, gifts, and special milestones in your life.",
      bg: "bg-blue-50/50",
      iconColor: "text-blue-600",
    },
    {
      icon: Wallet,
      title: "EXTRA SAVINGS",
      desc: "Lucira pays your 10th installment completely FREE. Pure 100% bonus!",
      bg: "bg-green-50/50",
      iconColor: "text-green-600",
    },
    {
      icon: ShieldCheck,
      title: "SAFE & SECURE",
      desc: "Fully transparent scheme with no hidden charges or processing fees.",
      bg: "bg-purple-50/50",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="w-full bg-white font-figtree">
      {/* Hero Banner with Subtle Animation */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative"
      >
        {width > 1024 ? (
          <AspectRatio ratio={1920 / 420}>
            <Image
              src="/images/schemes/desktop-scheme.jpg"
              alt="Savings Scheme Banner"
              fill
              priority
              className="object-cover"
            />
          </AspectRatio>
        ) : (
          <AspectRatio ratio={428 / 380}>
            <Image
              src="/images/schemes/mobile-scheme.jpg"
              alt="Savings Scheme Banner"
              fill
              priority
              className="object-cover"
            />
          </AspectRatio>
        )}
        <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
      </motion.div>

      {/* Calculator Section */}
      <section className="relative mt-12 md:mt-20 z-10 px-4">
        <Suspense fallback={<div className="text-center py-20 bg-white rounded-3xl shadow-xl max-w-7xl mx-auto flex items-center justify-center gap-3"><Loader2 className="animate-spin" /> Loading calculator...</div>}>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {width < 1024 ? <MobileSavingCalculator /> : <DesktpSavingCalculator />}
          </motion.div>
        </Suspense>
      </section>

      <div className="w-full bg-white mt-16 md:mt-24 mb-20 md:mb-32">
        {/* How It Works Section */}
        <SchemeHowItWorks />

        {/* Benefits Section */}
        <section className="w-full max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              Why Choose Vault of Dreams?
            </h2>
            <div className="w-24 h-1 bg-[#5a413f] mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  whileHover={{ y: -8 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`${item.bg} rounded-3xl p-4 md:p-8 border border-white shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden`}
                >
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/40 rounded-full blur-2xl group-hover:bg-white/60 transition-colors"></div>
                  
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 md:mb-8 group-hover:scale-110 transition-transform duration-500`}>
                    <Icon
                      size={width < 768 ? 24 : 36}
                      strokeWidth={1.5}
                      className={item.iconColor}
                    />
                  </div>

                  <h3 className="text-[14px] md:text-lg font-bold tracking-tight mb-2 md:mb-4 text-gray-900 leading-tight">
                    {item.title}
                  </h3>

                  <p className="text-[11px] md:text-[15px] text-gray-600 leading-relaxed font-medium">
                    {item.desc}
                  </p>

                  <div className="mt-4 md:mt-8 flex items-center gap-2 text-[10px] md:text-[12px] font-bold text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    LEARN MORE <ArrowRight size={14} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full bg-[#fafafa] py-12 md:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-8 md:mb-16">
              <h2 className="text-[22px] md:text-[36px] tracking-wide font-bold uppercase text-gray-900">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-500 mt-4 max-w-[600px] mx-auto text-[14px] md:text-[16px] leading-relaxed">
                Everything you need to know about the Vault of Dreams jewelry savings scheme.
              </p>
              <div className="w-16 h-1 bg-gray-200 mx-auto mt-8 rounded-full"></div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 md:p-12"
            >
              <SchemeFaq />
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}
