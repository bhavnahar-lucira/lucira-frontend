"use client";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Phone, User, Download, Send } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ─── DATA ────────────────────────────────────────────────────────────────────

const faqData = [
  {
    question: "What is the lock in?",
    answer: "The franchise has a lock-in period of 4.5 years in alignment with the payback timelines to ensure stable operations.",
  },
  {
    question: "How much is the tenure of the agreement?",
    answer: "The franchise agreement runs for 9 years.",
  },
  {
    question: "What is the security of the franchise?",
    answer: "The franchise operates under a formal agreement, brand standards, and clearly defined commercial terms, ensuring complete transparency and operational clarity.",
  },
  {
    question: "Is there any fee?",
    answer: "Yes. The franchise requires a one time franchise fee which is included within the total investment.",
  },
  {
    question: "Will I get the store of my choice?",
    answer: "You may propose your preferred location, and our team will evaluate it based on brand standards, market potential, visibility, and sales viability. If it meets the criteria, we will approve it.",
  },
  {
    question: "What is the process to start?",
    answer: "Submit your application → Location approval → Agreement signing → Store design and setup → Training and inventory → Grand launch.",
  },
  {
    question: "How fast can a franchise start?",
    answer: "Once the agreement is signed, a store can be ready to open within 90 to 120 days, depending on site readiness and local permissions.",
  },
  {
    question: "Who will run the store?",
    answer: "The store will be operated by your hired team, while Lucira provides training, audits, and ongoing support to ensure smooth performance.",
  },
  {
    question: "Will I get support with reconciliation and bookkeeping?",
    answer: "Yes. Lucira provides complete operational guidance, including daily reconciliation formats, reporting systems, and support with financial tracking.",
  },
  {
    question: "How will I get initial stock?",
    answer: "Initial inventory is supplied directly by Lucira based on your store size and assortment plan.",
  },
  {
    question: "Will I get GST input outstanding on the initial billing? How will I manage this?",
    answer: "Yes. All GST input on initial billing will appear in your books. You can utilize the input credit against future GST liabilities from your revenue.",
  },
  {
    question: "What happens if I want to exit before 4.5 years?",
    answer: "Early exit is possible but subject to terms mentioned in the agreement, including notice period requirements and settlement of outstanding obligations.",
  },
  {
    question: "How will collections happen at the store?",
    answer: "Customer payments flow directly into the designated franchise bank accounts, ensuring complete transparency. Lucira audits collections regularly for accuracy.",
  },
  {
    question: "How will I know the sales for the store?",
    answer: "You will receive real time access to sales data through the POS system, along with daily, weekly, and monthly reports.",
  },
  {
    question: "What expenses do I have to cover?",
    answer: "You will be responsible for rent, salaries, utilities, local marketing, and operational expenses as outlined in the franchise agreement.",
  },
  {
    question: "How will I get the MG?",
    answer: "The Minimum Guarantee (MG) is credited as per the defined cycle in your agreement, based on actuals and reconciled sales data.",
  },
  {
    question: "How can I offset the extra GST input in my books?",
    answer: "You can offset GST input against your monthly output GST liability generated through store sales.",
  },
  {
    question: "Is there any timeline for GST input credits to be utilized? Do they lapse?",
    answer: "GST input credits do not lapse as long as they remain valid under GST regulations. They continue to carry forward until fully utilized.",
  },
];

const heroImages = [
  {
    src: "https://luciraonline.myshopify.com/cdn/shop/files/DSC_2176.jpg?v=1764398076&width=800",
    alt: "Lucira gallery 1",
  },
  {
    src: "https://luciraonline.myshopify.com/cdn/shop/files/DSC_2185_2.jpg?v=1765200019&width=800",
    alt: "Lucira gallery 2",
  },
  {
    src: "https://luciraonline.myshopify.com/cdn/shop/files/DSC_2427_1.jpg?v=1765198765&width=800",
    alt: "Lucira gallery 3",
  },
  {
    src: "https://luciraonline.myshopify.com/cdn/shop/files/DSC_2424_2_cb7dad77-df08-4d26-8ab5-9bfcfc99556f.jpg?v=1765200337&width=800",
    alt: "Lucira gallery 4",
  },
  {
    src: "https://luciraonline.myshopify.com/cdn/shop/files/DSC_2253_2_1.jpg?v=1765200316&width=800",
    alt: "Lucira gallery 5",
  },
  {
    src: "https://luciraonline.myshopify.com/cdn/shop/files/DSC_2447_2_27ff37cf-7502-4e89-b110-2043ae6f7269.jpg?v=1765199990&width=800",
    alt: "Lucira gallery 6",
  },
];

const galleryPositions = [
  "bottom-[62%] left-[10%] w-[48%] h-[38%]",
  "top-[18%] left-[59%] w-[13%] h-[20%]",
  "top-0 left-[73%] w-[28%] h-[60%]",
  "top-[39.5%] left-[19%] w-[24%] h-[28%]",
  "top-[39.5%] left-[44%] w-[28%] h-[62%]",
  "bottom-[3%] left-[73%] w-[31%] h-[35%]",
];

const featureCards = [
  {
    title: "Store Location Research",
    description:
      "We'll guide you to the right strategic location and set up every key process you need.",
    icon: null,
  },
  {
    title: "Full Training Support",
    description:
      "Our team provides end-to-end training so you and your staff are ready from day one.",
    icon: null,
  },
  {
    title: "Proven Business Model",
    description:
      "Leverage a tested and refined system that delivers consistent results across all locations.",
    icon: null,
  },
  {
    title: "Marketing & Branding",
    description:
      "Benefit from our established brand identity and national marketing campaigns.",
    icon: null,
  },
];

const howItWorksSteps = [
  {
    stepLabel: "Step 01",
    heading: "Online Registration",
    image: "https://luciraonline.myshopify.com/cdn/shop/files/DSC_2176.jpg?v=1764398076&width=800",
  },
  {
    stepLabel: "Step 02",
    heading: "Support Call",
    image: "https://luciraonline.myshopify.com/cdn/shop/files/DSC_2185_2.jpg?v=1765200019&width=800",
  },
  {
    stepLabel: "Step 03",
    heading: "Paper Work",
    image: "https://luciraonline.myshopify.com/cdn/shop/files/DSC_2427_1.jpg?v=1765198765&width=800",
  },
  {
    stepLabel: "Step 04",
    heading: "Store Launch",
    image: "https://luciraonline.myshopify.com/cdn/shop/files/DSC_2447_2_27ff37cf-7502-4e89-b110-2043ae6f7269.jpg?v=1765199990&width=800",
  },
];

// ─── ICONS ───────────────────────────────────────────────────────────────────

const DefaultIcon = ({ size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M31.25 43.75V33.3333C31.25 32.7808 31.0305 32.2509 30.6398 31.8602C30.2491 31.4695 29.7192 31.25 29.1667 31.25H20.8333C20.2808 31.25 19.7509 31.4695 19.3602 31.8602C18.9695 32.2509 18.75 32.7808 18.75 33.3333V43.75"
      stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
    />
    <path
      d="M37.0291 21.4791C36.5948 21.0634 36.0168 20.8313 35.4156 20.8313C34.8143 20.8313 34.2363 21.0634 33.802 21.4791C32.8333 22.4031 31.546 22.9186 30.2072 22.9186C28.8685 22.9186 27.5812 22.4031 26.6124 21.4791C26.1782 21.064 25.6007 20.8323 24.9999 20.8323C24.3992 20.8323 23.8216 21.064 23.3874 21.4791C22.4186 22.4037 21.1308 22.9196 19.7916 22.9196C18.4524 22.9196 17.1646 22.4037 16.1958 21.4791C15.7615 21.0634 15.1835 20.8313 14.5822 20.8313C13.981 20.8313 13.403 21.0634 12.9687 21.4791C12.0329 22.3721 10.7984 22.8849 9.50541 22.9178C8.2124 22.9506 6.95341 22.5012 5.97349 21.657C4.99358 20.8128 4.36285 19.6341 4.20408 18.3505C4.0453 17.0668 4.36984 15.77 5.11453 14.7125L11.1333 5.99579C11.5152 5.43227 12.0293 4.97091 12.6307 4.65203C13.2322 4.33316 13.9025 4.1665 14.5833 4.16663H35.4166C36.0953 4.16637 36.7639 4.33192 37.3641 4.64889C37.9642 4.96587 38.4779 5.42466 38.8604 5.98538L44.8916 14.7187C45.6365 15.7771 45.9606 17.0749 45.8008 18.3592C45.6411 19.6435 45.0088 20.8223 44.0274 21.666C43.0459 22.5096 41.7855 22.9576 40.4918 22.9227C39.198 22.8878 37.9636 22.3724 37.0291 21.477"
      stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
    />
    <path
      d="M8.33337 22.8125V39.5833C8.33337 40.6884 8.77236 41.7482 9.55376 42.5296C10.3352 43.311 11.395 43.75 12.5 43.75H37.5C38.6051 43.75 39.6649 43.311 40.4463 42.5296C41.2277 41.7482 41.6667 40.6884 41.6667 39.5833V22.8125"
      stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function FranchisePage() {
  const [heroModalOpen, setHeroModalOpen] = useState(false);
  const [brochureModalOpen, setBrochureModalOpen] = useState(false);
  const [brochureForm, setBrochureForm] = useState({ name: "", phone: "" });
  const [brochureErrors, setBrochureErrors] = useState({});
  const [brochureSubmitting, setBrochureSubmitting] = useState(false);
  const [brochureSuccess, setBrochureSuccess] = useState(false);

  const handleHeroOpen = () => {
    setHeroModalOpen(true);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "formOpen",
      formName: "Franchise Registration Form",
      formType: "google_form",
      timestamp: new Date().toISOString(),
    });
  };
  const handleHeroClose = () => setHeroModalOpen(false);

  const handleBrochureOpen = () => {
    setBrochureSuccess(false);
    setBrochureForm({ name: "", phone: "" });
    setBrochureErrors({});
    setBrochureModalOpen(true);
  };
  const handleBrochureClose = () => setBrochureModalOpen(false);

  const validateBrochure = () => {
    const errors = {};
    if (!brochureForm.name.trim()) errors.name = "Name is required.";
    if (!brochureForm.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!/^\+?[\d\s\-]{7,15}$/.test(brochureForm.phone.trim())) {
      errors.phone = "Enter a valid phone number.";
    }
    return errors;
  };

  const handleBrochureSubmit = (e) => {
    e.preventDefault();
    const errors = validateBrochure();
    if (Object.keys(errors).length > 0) {
      setBrochureErrors(errors);
      return;
    }
    setBrochureSubmitting(true);
    setBrochureErrors({});
    // Replace with your actual API call
    setTimeout(() => {
      setBrochureSubmitting(false);
      setBrochureSuccess(true);
      setTimeout(() => {
        handleBrochureClose();
        setBrochureSuccess(false);
      }, 3000);
    }, 1000);
  };

  return (
    <div className="font-figtree text-[#333]">
      {/* ═══════════════════════════════════════════
          1. HERO SECTION
      ═══════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="container-main grid grid-cols-1 gap-[50px] py-[60px] md:grid-cols-[400px_1fr] md:gap-10 lg:grid-cols-[450px_1fr] lg:gap-[60px] items-center min-h-[500px]">
          <div className="md:pr-5">
            <h1
              className="
                text-[28px] sm:text-[36px] lg:text-[42px]
                font-bold tracking-[2px] uppercase text-primary
                leading-[1.2] mb-6 font-abhaya
              "
            >
              LUCIRA&apos;S FRANCHISE
            </h1>
            <p className="text-[14px] md:text-[16px] leading-[1.8] text-zinc-600 mb-[40px]">
              Build your future with a brand that stands for elegance, quality,
              and care. Join our growing network of franchise partners and bring
              the Lucira experience to your community. We provide full support,
              training, and a proven business model to help you succeed from day
              one.
            </p>
            <Button
              onClick={handleHeroOpen}
              className="h-auto px-[45px] py-[18px] text-[14px] tracking-[2px] font-bold rounded-md"
            >
              REGISTER NOW
            </Button>
          </div>

          <div className="relative h-[300px] sm:h-[450px] lg:h-[550px]">
            {heroImages.map((img, i) => (
              <div
                key={i}
                className={`absolute overflow-hidden bg-[#f5f5f5] shadow-md rounded-lg ${galleryPositions[i]}`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          2. WHY FRANCHISE SECTION
      ═══════════════════════════════════════════ */}
      <section className="py-[80px] bg-[#FAF9F6]">
        <div className="container-main">
          <div className="text-center mb-[80px]">
            <h2
              className="
                text-[26px] sm:text-[32px] lg:text-[40px]
                font-bold tracking-[1.5px] uppercase text-primary
                leading-[1.3] mb-4 font-abhaya
              "
            >
              WHY LUCIRA FRANCHISE?
            </h2>
            <div className="w-[80px] h-[3px] bg-accent mx-auto mb-6"></div>
            <p className="text-[15px] md:text-[18px] leading-[1.7] text-zinc-600 max-w-[850px] mx-auto font-figtree">
              Step into a world of exquisite craftsmanship and strategic growth. 
              Partnering with Lucira means joining a legacy of brilliance and 
              commitment to excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-[60px]">
            {featureCards.map((card, i) => (
              <div
                key={i}
                className="
                  bg-white rounded-xl shadow-sm hover:shadow-md
                  transition-all duration-300 p-6 pt-14
                  relative flex flex-col items-start
                "
              >
                <div
                  className="
                    w-[60px] h-[60px] lg:w-[70px] lg:h-[70px]
                    bg-accent rounded-full flex items-center justify-center
                    absolute -top-[30px] lg:-top-[35px] left-8
                    shadow-lg
                  "
                >
                  {card.icon ? (
                    <Image
                      src={card.icon}
                      alt={card.title}
                      width={40}
                      height={40}
                      className="brightness-0 invert w-[30px] h-[30px] lg:w-[35px] lg:h-[35px]"
                    />
                  ) : (
                    <DefaultIcon size={35} />
                  )}
                </div>
                <h3
                  className="
                    text-[18px] lg:text-[20px]
                    font-bold text-primary mb-3 font-abhaya
                  "
                >
                  {card.title}
                </h3>
                <p
                  className="
                    text-[14px] leading-[1.6] text-zinc-600
                  "
                >
                  {card.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button
              variant="outline"
              onClick={handleBrochureOpen}
              className="h-auto px-[40px] py-[16px] text-[15px] tracking-[1.5px] border-accent text-accent hover:bg-accent hover:text-white rounded-md"
            >
              <Download className="mr-2 h-5 w-5" /> DOWNLOAD BROCHURE
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          3. HOW IT WORKS SECTION
      ═══════════════════════════════════════════ */}
      <section className="pt-[60px] pb-[60px] bg-white">
        <div className="container-main">
          {/* Header */}
          <div className="text-center mb-[60px]">
            <h2
              className="
                text-[26px] md:text-[32px] lg:text-[40px]
                font-bold uppercase tracking-[2px] text-primary
                leading-[1.2] mb-4 font-abhaya
              "
            >
              HOW IT WORKS?
            </h2>
            <div className="w-[80px] h-[3px] bg-accent mx-auto mb-6"></div>
            <p className="text-[14px] md:text-[16px] leading-[1.6] text-zinc-600 max-w-[700px] mx-auto">
              Our streamlined onboarding process ensures a smooth journey from 
              initial interest to your grand store launch.
            </p>
          </div>

          {/* Desktop Grid — 4 columns */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((step, i) => (
              <div key={i} className="group relative">
                {/* Image */}
                <div className="relative w-full pt-[85%] overflow-hidden rounded-xl bg-[#f0f0f0] shadow-sm">
                  <Image
                    src={step.image}
                    alt={step.heading}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                {/* Content card — overlaps image bottom */}
                <div
                  className="
                    relative -mt-[50px] mx-auto
                    w-[85%]
                    bg-white rounded-lg
                    shadow-xl border border-gray-50
                    p-6
                    transition-all duration-300
                    group-hover:-translate-y-2
                  "
                >
                  <p className="text-[12px] text-accent font-bold uppercase tracking-wider mb-2">
                    {step.stepLabel}
                  </p>
                  <h3
                    className="
                      text-[18px] lg:text-[20px] font-bold text-primary
                      leading-[1.4] font-abhaya mb-0
                    "
                  >
                    {step.heading}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile List — 1 column row layout */}
          <div className="flex flex-col gap-6 md:hidden">
            {howItWorksSteps.map((step, i) => (
              <div
                key={i}
                className="
                  flex flex-row items-center
                  bg-white rounded-xl
                  shadow-md border border-gray-50
                  overflow-hidden
                "
              >
                {/* Image */}
                <div className="relative w-[120px] min-w-[120px] h-[100px]">
                  <Image
                    src={step.image}
                    alt={step.heading}
                    fill
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
                {/* Content */}
                <div className="flex-1 px-5 py-[15px]">
                  <p className="text-[11px] text-accent font-bold uppercase mb-1">
                    {step.stepLabel}
                  </p>
                  <h3 className="text-[16px] font-bold text-primary leading-[1.4] font-abhaya">
                    {step.heading}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          4. BANNER SECTION
      ═══════════════════════════════════════════ */}
      <section className="container-main mt-[20px] mb-[60px]">
        <div
          className="
            relative h-[450px] md:h-[500px]
            rounded-2xl overflow-hidden bg-black
          "
        >
          <Image
            src="https://luciraonline.myshopify.com/cdn/shop/files/DSC_2445_1_40298bc3-12fc-4234-93c3-339092621f9e_1920x.jpg?v=1765198639"
            alt="Franchise banner background"
            fill
            className="object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40 z-[1]" />
          <div
            className="
              relative z-[2] max-w-[900px] mx-auto px-8
              text-center h-full flex flex-col justify-center
            "
          >
            <h2
              className="
                text-[32px] md:text-[42px] lg:text-[56px]
                font-bold text-white leading-[1.1] mb-6 font-abhaya
              "
            >
              Become Our Franchise Partner
            </h2>
            <p
              className="
                text-[16px] lg:text-[18px] font-medium text-white/90
                leading-[1.6] max-w-[650px] mx-auto mb-10
              "
            >
              Join our growing network of successful franchise partners and
              build your business with a brand that values luxury and trust.
            </p>
            <div className="flex justify-center">
              <Button
                onClick={handleHeroOpen}
                className="
                  h-auto px-[45px] py-[18px] text-[14px] 
                  font-bold uppercase tracking-wider rounded-md
                  bg-white text-primary hover:bg-white/90
                  transition-all duration-300 hover:-translate-y-0.5
                "
              >
                APPLY NOW
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          5. FAQ SECTION
      ═══════════════════════════════════════════ */}
      <section className="py-[80px] bg-[#FAF9F6]">
        <div className="container-main max-w-[900px]">
          <div className="text-center mb-[60px]">
            <h2
              className="
                text-[26px] md:text-[32px] lg:text-[40px]
                font-bold uppercase tracking-[2px] text-primary
                leading-[1.2] mb-4 font-abhaya
              "
            >
              FAQ&apos;S
            </h2>
            <div className="w-[80px] h-[3px] bg-accent mx-auto mb-6"></div>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqData.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="bg-white border border-gray-100 rounded-lg overflow-hidden px-6"
              >
                <AccordionTrigger className="hover:no-underline py-5 text-left group">
                  <span className="text-[16px] md:text-[18px] font-bold text-primary font-figtree pr-4">
                    {item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pt-0">
                  <div className="text-[14px] md:text-[16px] leading-[1.7] text-zinc-600 font-figtree">
                    {item.answer}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          MODAL — REGISTRATION
      ═══════════════════════════════════════════ */}
      {heroModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[99999] p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && handleHeroClose()}
        >
          <div className="bg-white rounded-2xl w-full max-w-[700px] max-h-[95vh] relative shadow-2xl overflow-hidden flex flex-col">
            <button
              onClick={handleHeroClose}
              className="
                absolute top-[15px] right-[20px] z-20
                w-[36px] h-[36px] rounded-full bg-white/80 border border-gray-100
                text-[24px] text-gray-500 flex items-center justify-center
                cursor-pointer hover:text-black hover:bg-white transition-all leading-none
              "
            >
              &times;
            </button>
            <h3
              className="
                text-[18px] sm:text-[22px] font-bold tracking-[1.5px]
                uppercase text-primary text-center font-figtree
                px-[30px] py-[25px] bg-[#FAF9F6] border-b border-gray-100
              "
            >
              REGISTRATION FORM
            </h3>
            <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 120px)" }}>
              <iframe
                src="https://docs.google.com/forms/d/e/1FAIpQLScNWHT4WkZTuS8DCCQUOvM7MeUrdOrwqKxxcYfsEJUlapR5CQ/viewform?usp=sharing&ouid=113968896276132378000"
                className="w-full h-full border-none"
                loading="lazy" style={{ height: "800px", display: "block" }}
              >
                Loading…
              </iframe>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          MODAL — BROCHURE DOWNLOAD
      ═══════════════════════════════════════════ */}
      {brochureModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[99999] p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && handleBrochureClose()}
        >
          <div className="bg-white rounded-2xl w-full max-w-[480px] relative shadow-2xl overflow-hidden">
            <button
              onClick={handleBrochureClose}
              className="
                absolute top-[20px] right-[20px] z-10
                text-[32px] text-gray-400 leading-none bg-transparent
                border-none cursor-pointer hover:text-primary transition-colors
              "
            >
              &times;
            </button>
            <div className="px-10 py-12">
              {!brochureSuccess ? (
                <>
                  <h3
                    className="
                      font-bold text-[22px] md:text-[26px]
                      tracking-[1px] uppercase text-primary
                      text-center mb-8 font-abhaya
                    "
                  >
                    DOWNLOAD BROCHURE
                  </h3>
                  <form onSubmit={handleBrochureSubmit} className="flex flex-col space-y-5">
                    {/* Name */}
                    <div className="relative">
                      <User className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={brochureForm.name}
                        onChange={(e) =>
                          setBrochureForm({ ...brochureForm, name: e.target.value })
                        }
                        className="
                          w-full py-4 pl-[50px] pr-5
                          border border-gray-200 rounded-lg
                          text-[15px] font-figtree
                          focus:outline-none focus:border-accent
                          transition-colors
                        "
                      />
                      {brochureErrors.name && (
                        <p className="text-red-500 text-[12px] mt-1 ml-1">
                          {brochureErrors.name}
                        </p>
                      )}
                    </div>
                    {/* Phone */}
                    <div className="relative">
                      <Phone className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" size={18} />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={brochureForm.phone}
                        onChange={(e) =>
                          setBrochureForm({ ...brochureForm, phone: e.target.value })
                        }
                        className="
                          w-full py-4 pl-[50px] pr-5
                          border border-gray-200 rounded-lg
                          text-[15px] font-figtree
                          focus:outline-none focus:border-accent
                          transition-colors
                        "
                      />
                      {brochureErrors.phone && (
                        <p className="text-red-500 text-[12px] mt-1 ml-1">
                          {brochureErrors.phone}
                        </p>
                      )}
                    </div>
                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={brochureSubmitting}
                      className="w-full h-auto py-5 text-[16px] font-bold tracking-wider"
                    >
                      {brochureSubmitting ? "Submitting..." : (
                        <span className="flex items-center">
                          DOWNLOAD BROCHURE <Send size={18} className="ml-2" />
                        </span>
                      )}
                    </Button>
                  </form>
                </>
              ) : (
                /* Success State */
                <div className="flex flex-col items-center text-center py-5">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={48} className="text-green-500" />
                    </div>
                  </div>
                  <h3 className="text-[26px] font-bold text-primary mb-3 font-abhaya">
                    Thank You!
                  </h3>
                  <p className="text-[16px] text-zinc-600 leading-[1.5] font-figtree">
                    Your brochure is on its way. We&apos;ll be in touch shortly.
                  </p>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-8">
                    <div className="h-full bg-green-500 animate-[shrink_3s_linear_forwards]" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}