"use client"
import Image from "next/image";
import { RotateCw } from "lucide-react";
import { useState, Suspense } from "react"
import FAQ from "@/components/common/FAQ";

export default function GemstoneEducationPage() {
    const [activeIndex, setActiveIndex] = useState(0)
    const [active, setActive] = useState(null)

    const birthstones = [
        {
            month: "JAN",
            name: "Garnet",
            tabIcon: "https://luciraonline.myshopify.com/cdn/shop/files/Garnet_314878af-386a-465e-96d1-0d238294a020_120x120_crop_center.png",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Garnet_ec535ee4-2c08-446b-b86d-ead77275c934_600x600_crop_center.jpg",
            properties: "Garnet is a durable and vibrant gemstone known for its rich, fiery hues and exceptional brilliance. Belonging to a group of silicate minerals, garnet occurs in a spectrum of colours from deep red and raspberry pink to vivid green and bright orange. It has a glass-like lustre and typically forms in cubic crystals.",
            facts: "Garnet has been treasured for over 5,000 years, with discoveries in ancient Egyptian jewelry and Roman signet rings. The name “garnet” comes from the Latin word granatum, meaning pomegranate, inspired by its resemblance to the fruit’s deep red seeds.",
            hardness: "6.5–7.5",
            zodiac: "Capricorn and Leo",
            meaning: "Passion, Protection, Strength, and Commitment",
        },
        {
            month: "FEB",
            name: "Amethyst",
            tabIcon: "https://luciraonline.myshopify.com/cdn/shop/files/Amethyst_f4af72a5-aad7-4f0f-8d69-8e3656760906_120x120_crop_center.png",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Amethyst_600x600_crop_center.jpg",
            properties: "Amethyst is a striking variety of quartz admired for its captivating purple hues, ranging from soft lavender to deep royal violet. Its glass-like lustre and transparent-to-translucent clarity enhance its refined brilliance. The gemstone’s colour comes from trace amounts of iron and natural irradiation within the crystal.",
            facts: "Amethyst has been admired for thousands of years, with origins dating back to ancient civilizations such as Greece, Egypt, and Rome. The name “amethyst” comes from the Greek word amethystos. Historically, it was considered as valuable as ruby and sapphire until large deposits were discovered in Brazil during the 19th century.",
            hardness: "7",
            zodiac: "Pisces, Aquarius, and Sagittarius",
            meaning: "Calmness, Clarity, and Protection",
        },
        {
            month: "MAR",
            name: "Aquamarine",
            tabIcon: "https://luciraonline.myshopify.com/cdn/shop/files/AquaMarine_025a81f7-90d5-4037-a6d6-769104c92c5d_120x120_crop_center.png",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/AquaMarine_2f8d0e10-10b2-4f15-a1a6-e93435056fa7_600x600_crop_center.jpg",
            properties: "Aquamarine is a variety of the mineral beryl, prized for its cool blue to blue-green hues. It has a glass-like lustre, excellent transparency, and strong durability. Symbolically, it represents peace, courage, clear communication, and harmony.",
            facts: "Historically treasured by sailors as a protective talisman, aquamarine derives its name from the Latin aqua marina, meaning “sea water.",
            hardness: "7.5–8",
            zodiac: "Pisces and Aries",
            meaning: "Calmness, Clarity, and Courage",
        },
        {
            month: "APR",
            name: "Diamond",
            tabIcon: "https://luciraonline.myshopify.com/cdn/shop/files/Diamond_970909be-d268-4fd0-b730-6bd0519b80a3_120x120_crop_center.png",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Diamond_77bde258-e081-4ad5-b185-f084d3ce09d9_600x600_crop_center.jpg",
            properties: "Diamond is composed of pure carbon arranged in a crystal lattice structure, giving it extraordinary hardness and light performance. It has exceptional brilliance, fire, and durability, making it ideal for everyday fine jewelry.",
            facts: "The name Diamond comes from the ancient Greek word “adamas”, meaning unbreakable, invincible, or indestructible. Over time, adamas evolved through Latin (diamas) and Old French (diamant) into the modern English word diamond.",
            hardness: "10",
            zodiac: "Aries and Libra",
            meaning: "Eternal love, Strength, and Purity",
        },
        {
            month: "MAY",
            name: "Emerald",
            tabIcon: "https://luciraonline.myshopify.com/cdn/shop/files/Emerald_f3de4bcb-d24a-4239-a0d3-19675335beda_120x120_crop_center.png",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Emerald_b37853cf-7742-4c01-9de3-92a661f5ae91_600x600_crop_center.jpg",
            properties: "Emerald is a variety of the mineral beryl, colored by traces of chromium and vanadium. It is prized for its intense green hue, natural inclusions (often called “jardin”), and refined brilliance. Though relatively hard, it is more delicate than it appears due to internal inclusions.",
            facts: "Emeralds have been treasured since ancient Egypt, famously adored by Cleopatra. Today, major sources include Colombia.",
            hardness: "7.5 - 8",
            zodiac: "Taurus and Gemini",
            meaning: "Love, Renewal, and Prosperity",
        },
        {
            month: "JUN",
            name: "Pearl",
            tabIcon: "https://luciraonline.myshopify.com/cdn/shop/files/Pearl_7cf7afb9-a707-4ac0-b4d0-8041e78392dc_120x120_crop_center.png",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Pearl_3e59d06e-fdd0-4a2e-ae57-9fff2930e34f_600x600_crop_center.jpg",
            properties: "Pearl is an organic gemstone formed inside mollusks. Unlike other gems, it is not mined but created naturally when an irritant is coated with layers of nacre. It is known for its smooth surface, subtle iridescence, and creamy to white hues, though it also appears in pink, gold, and black.",
            facts: "Treasured for over 4,000 years, pearls were once reserved for royalty and nobility. Ancient divers retrieved natural pearls from the Persian Gulf and Indian Ocean long before cultured pearls were developed in Japan in the early 20th century.",
            hardness: "2.5 - 4.5",
            zodiac: "Cancer and Pisces",
            meaning: "Purity, Wisdom, and Timeless Sophistication.",
        },
        {
            month: "JUL",
            name: "Ruby",
            tabIcon: "https://luciraonline.myshopify.com/cdn/shop/files/Ruby_c8b32bdf-7341-42cf-8fb1-6cd2a2856b6d_120x120_crop_center.png",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Ruby_ff39bb12-0614-4b18-999f-2eb4161f298b_600x600_crop_center.jpg",
            properties: "Ruby is a variety of the mineral corundum, colored red by traces of chromium. It is prized for its vibrant “pigeon blood” red tone, exceptional durability, and strong brilliance. With a hardness of 9, ruby is ideal for everyday fine jewellery.",
            facts: "Rubies have been treasured for centuries, especially in ancient Burma (now Myanmar), where warriors believed they made them invincible in battle. Today, major sources include Myanmar, Mozambique, Thailand, Sri Lanka, and Madagascar, with Burmese rubies considered among the finest in the world.",
            hardness: "9",
            zodiac: "Leo Aries and Scorpio",
            meaning: "Passion, Love, and Prosperity",
        },
        {
            month: "AUG",
            name: "Peridot",
            tabIcon: "https://luciraonline.myshopify.com/cdn/shop/files/Peridot_13fb1b9a-4492-41ba-9141-3c86da32bf85_120x120_crop_center.png",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Peridot_eddaf486-d149-4d6b-8059-ed002e98ed52_600x600_crop_center.jpg",
            properties: "Peridot is a gem-quality variety of the mineral olivine, known for its distinctive yellow-green to olive hues caused by iron within its structure. It has a bright, glass-like lustre and is typically eye-clean with lively brilliance.",
            facts: "Peridot has been mined for over 3,500 years, first discovered on Egypt’s Zabargad Island in the Red Sea, where it was treasured by ancient pharaohs. Today, key sources include Myanmar, Pakistan, China, Vietnam, and the United States (Arizona). Rarely, peridot has even been found in meteorites, making it one of the few gemstones with extraterrestrial origins.",
            hardness: "6.5 - 7",
            zodiac: "Leo, Virgo and Libra",
            meaning: "Positivity, Prosperity, and Renewal",
        },
        {
            month: "SEP",
            name: "Sapphire",
            tabIcon: "https://luciraonline.myshopify.com/cdn/shop/files/Sapphire_4dbe553f-bed4-45c3-9222-e8d8efdae5d2_120x120_crop_center.png",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Sapphire_dee1e691-bf7c-4b02-b461-125f37fa6808_600x600_crop_center.jpg",
            properties: "Sapphire is a variety of the mineral corundum, most famous for its deep blue colour, though it occurs in many shades, including pink, yellow, and white. Its exceptional hardness, brilliance, and durability make it a prized choice for rings and heirloom pieces.",
            facts: "Sapphire is a variety of the mineral corundum, most famous for its deep blue colour, though it occurs in many shades, including pink, yellow, and white. Its exceptional hardness, brilliance, and durability make it a prized choice for rings and heirloom pieces.",
            hardness: "9",
            zodiac: "Virgo, Libra, and Sagittarius",
            meaning: "Wisdom, Loyalty, and Nobility",
        },
        {
            month: "OCT",
            name: "Opal",
            tabIcon: "https://luciraonline.myshopify.com/cdn/shop/files/Opal_V2-desktop_120x120_crop_center.png",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Opal_f97315c1-f187-46be-b231-5389669346eb_600x600_crop_center.jpg",
            properties: "Opal is a hydrated form of silica known for its unique internal structure that diffracts light, creating its signature flashes of colour. It ranges from white and black to fire opal’s vibrant orange. With a soft, luminous glow and distinctive character.",
            facts: "Opals have been admired since ancient Rome, where they symbolized hope and purity. Today, Australia produces over 90% of the world’s opals, including the rare and prized black opal.",
            hardness: "5.5 - 6.5",
            zodiac: "Scorpio and Pisces",
            meaning: "Creativity, Passion, and Individuality",
        },
        {
            month: "NOV",
            name: "Topaz",
            tabIcon: "https://luciraonline.myshopify.com/cdn/shop/files/Topaz_04fbda1f-a983-405a-b510-aece8a9d158f_120x120_crop_center.png",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Topaz_0dfaff20-2867-4910-8c87-a2e7f73290ca_600x600_crop_center.jpg",
            properties: "Topaz is a silicate mineral admired for its wide range of colours, including blue, golden yellow, pink, and the rare Imperial topaz with warm orange tones. It has excellent transparency, a glass-like lustre, and impressive hardness.",
            facts: "The name “topaz” is believed to derive from the ancient Greek name Topazios, an island in the Red Sea. Historically treasured by royalty, major sources today include Brazil and Imperial topaz from Brazil is especially prized for its rich golden-orange hue.",
            hardness: "8",
            zodiac: "Scorpio and Sagittarius",
            meaning: "Strength and Wisdom",
        },
        {
            month: "DEC",
            name: "Turquoise",
            tabIcon: "https://luciraonline.myshopify.com/cdn/shop/files/Turquoise_643b9ba0-4a93-4422-ba31-a953c04d3b78_120x120_crop_center.png",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Turquoise_1ca730d3-fe5c-4eea-9df9-b6b9b98f9ed9_600x600_crop_center.jpg",
            properties: "Turquoise is an opaque gemstone composed of hydrated copper and aluminum phosphate, giving it its signature blue-green colour often accented with natural matrix patterns. It has a smooth, waxy lustre, and due to its relative softness and porosity, it benefits from gentle care.",
            facts: "Turquoise has been cherished for over 7,000 years, worn by ancient Egyptians, Persians, and Native American cultures as a protective talisman. The name derives from the French word “turquois,” meaning “Turkish,” as the stone reached Europe through Turkish trade routes.",
            hardness: "5 - 6",
            zodiac: "Pisces and Aquarius",
            meaning: "Protection, Wisdom, and Good Fortune",
        },
    ];

    const cards = [
        {
            title: "CUT",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Cut.jpg",
            bg: "bg-[#6b6b6b]",
            flipTitle: "CUT",
            flipDesc: "Cut defines how well a gemstone’s facets are shaped and aligned. A precise cut maximizes brilliance, fire, and sparkle by allowing light to reflect beautifully through the stone.",
        },
        {
            title: "CARAT",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Carat_595ff833-04b7-4b50-92fd-a748b95ec1aa.jpg",
            bg: "bg-[#5a7a6a]",
            flipTitle: "CARAT",
            flipDesc: "Carat measures a gemstone’s weight, not its size. While a higher carat often means a larger stone, overall appearance also depends on cut, shape, and proportions.",
        },
        {
            title: "COLOUR",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Color_54913866-0d4b-4283-b500-20a809c89735.jpg",
            bg: "bg-[#7a6a8a]",
            flipTitle: "COLOUR",
            flipDesc: "Colour evaluates a gemstone’s hue, tone, and saturation. The most prized stones display rich, even colour with optimal intensity, adding to their rarity and value.",
        },
        {
            title: "CLARITY",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Clarity_e53d3414-ce91-47c4-b8d4-e68dcdadcb98.jpg",
            bg: "bg-[#4a6a8a]",
            flipTitle: "CLARITY",
            flipDesc: "Clarity indicates the presence of natural inclusions or surface blemishes within a gemstone. Stones with fewer visible imperfections appear more transparent, radiant, and visually pure.",
        },
    ];

    const faqData = [
        {
        question: "What is a gemstone?",
        answer:
            "A gemstone is a naturally occurring mineral or organic material that is cut and polished for use in jewelry. It is valued for its beauty, rarity, and durability.",
        },
        {
        question: " How do I choose the right gemstone?",
        answer:
            "Choose based on personal preference, birthstone, symbolism, durability, and lifestyle. Consider colour, meaning, and how often you plan to wear it.",
        },
        {
        question: "What is the Mohs scale?",
        answer:
            "The Mohs scale measures a gemstone’s hardness and resistance to scratching, ranking from 1 (softest) to 10 (hardest, like diamond).",
        },
        {
        question: "Are all gemstones suitable for daily wear?",
        answer:
            "Not all. Stones with hardness 7 and above are generally better for everyday wear, while softer stones like opal or pearl require extra care.",
        },
        {
        question: "What is the difference between precious and semi-precious stones?",
        answer:
            "Traditionally, diamond, ruby, sapphire, and emerald are considered “precious,” while others fall under “semi-precious,” though rarity varies widely.",
        },
        {
        question: "How should I care for my gemstone jewelry?",
        answer:
            "Clean gently with mild soap and water, avoid harsh chemicals, store separately to prevent scratches, and remove before heavy activities.",
        },
    ];

    const toggle = (index) => {
        setActive(active === index ? null : index)
    }

    return (
        <>
            <section className="relative w-full">
                <div
                    className="
                    relative w-full
                    h-[535px] md:h-[605px] lg:h-[725px]
                    bg-[url('https://luciraonline.myshopify.com/cdn/shop/files/Mobile-Banner_7db8d201-9ac7-418c-b376-6f2a5f0fcfc3_768x.jpg')]
                    md:bg-[url('https://luciraonline.myshopify.com/cdn/shop/files/Desktop-Banner_bd830e61-9714-4e35-a652-4c56df1c4e23_1920x.jpg')]
                    bg-cover bg-center
                    flex items-end justify-center
                    "
                >
                    <div className="absolute inset-0 bg-black/20 z-10" />
                    <div className="relative z-20 text-center text-white px-5 pb-4 max-w-[800px] mb-3 md:mb-5">
                        <h2 className="text-[18px] md:text-[28px] mb-3">
                            GEMSTONE GUIDEBOOK
                        </h2>
                        <p className="text-[12px] md:text-[18px]">
                            Let's learn about the colourful world of gemstones
                        </p>
                    </div>
                </div>
            </section>

            <section className="py-10 md:py-14">
                <div className="max-w-6xl mx-auto px-4">                    
                    <div className="text-center mb-10">
                        <h2 className="text-[18px] md:text-[24px] font-medium tracking-wide">
                            KNOW YOUR BIRTHSTONE
                        </h2>
                        <p className="text-[12px] md:text-[15px] text-gray-500 mt-2 max-w-xl mx-auto">
                            Explore the history, symbolism, and unique energy of your birthstone.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3 justify-between overflow-x-scroll no-scrollbar px-8 pb-3 mb-10 min-h-35">
                        {birthstones.map((item, index) => (
                            <button
                            key={index}
                            onClick={() => setActiveIndex(index)}
                            className={`flex flex-col items-center min-w-15 cursor-pointer transition-all duration-300 ${
                                activeIndex === index ? "scale-110" : "opacity-70"
                            }`}
                            >
                            <img
                                src={item.tabIcon}
                                alt={item.name}
                                className={`rounded-full object-cover transition-all duration-300 ${
                                activeIndex === index
                                    ? "w-15 h-15 md:w-20 md:h-20"
                                    : "w-10 h-10 md:w-15 md:h-15"
                                }`}
                            />
                            <span
                                className={`text-[10px] md:text-[12px] mt-1 ${
                                activeIndex === index
                                    ? "font-semibold text-black"
                                    : "text-gray-500"
                                }`}
                            >
                                {item.month}
                            </span>
                            </button>
                        ))}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-start transition-all duration-500">                        
                        <div className="relative w-full h-150">
                            <Image fill 
                                src={birthstones[activeIndex].image}
                                alt={birthstones[activeIndex].name}
                                className="w-full rounded-md object-cover h-full"
                            />
                        </div>                        
                        <div className="space-y-4">                            
                            <div className="grid grid-cols-[140px_1fr] gap-2">
                                <span className="uppercase text-sm font-medium">Gemstone</span>
                                <span className="text-gray-600">{birthstones[activeIndex].name}</span>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] gap-2">
                                <span className="uppercase text-sm font-medium">Also Known As</span>
                                <span className="text-gray-600">{birthstones[activeIndex].meaning}</span>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] gap-2">
                                <span className="uppercase text-sm font-medium">Sunshine</span>
                                <span className="text-gray-600">{birthstones[activeIndex].zodiac}</span>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] gap-2">
                                <span className="uppercase text-sm font-medium">Mohs Hardness</span>
                                <span className="text-gray-600">{birthstones[activeIndex].hardness}</span>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] gap-2">
                                <p className="uppercase text-sm font-medium mb-1">Properties</p>
                                <p className="text-gray-600 text-sm leading-relaxed">{birthstones[activeIndex].properties}</p>
                            </div>

                            <div className="grid grid-cols-[140px_1fr] gap-2">
                                <p className="uppercase text-sm font-medium mb-1">Facts</p>
                                <p className="text-gray-600 text-sm leading-relaxed">{birthstones[activeIndex].facts}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            <section className="bg-white py-6 px-4">
                <div className="text-center max-w-xl mx-auto mb-10">
                    <h2 className="text-xl tracking-[0.12em] uppercase text-black mb-3">
                    4C’s of Gemstone
                    </h2>
                    <p className="text-gray-600 text-sm">
                    Let’s learn purity standards
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl mx-auto">
                    {cards.map((card, index) => (
                    <div
                        key={index}
                        className="aspect-[4/3] md:aspect-square" style={{perspective: "1200px"}}
                    >
                        <div
                        onClick={() => toggle(index)}
                        className={`relative w-full h-full transition-transform duration-500 transform-3d ${
                            active === index ? "rotate-y-180" : ""
                        }`}
                        >
                        <div className="absolute inset-0 backface-hidden">
                            <img
                            src={card.image}
                            className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex flex-col text-center justify-end p-6 bg-gradient-to-t from-black/60 to-transparent">
                                <p className="text-white tracking-widest mb-2 text-xl">
                                    {card.title}
                                </p>
                                <p className="text-white/70 text-xs flex items-center justify-center gap-2">
                                    <span className="animate-spin">
                                        <RotateCw size={16} />
                                    </span>
                                    Tap to Reveal
                                </p>
                            </div>
                        </div>
                        <div
                            className={`absolute inset-0 rotate-y-180 backface-hidden flex items-center justify-center text-center p-6 ${card.bg}`} style={{ transform: "rotateY(180deg)" }}
                        >
                            <div>
                            <p className="text-white tracking-widest mb-3 text-2xl">
                                {card.flipTitle}
                            </p>
                            <p className="text-white/80 text-sm leading-relaxed">
                                {card.flipDesc}
                            </p>
                            </div>
                        </div>
                        </div>
                    </div>
                    ))}
                </div>
            </section>

            <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
                <FAQ title="Know your Gems" description="Discover expert-backed answers that help you understand quality, authenticity, and timeless value in every gemstone." faqs={faqData} />
            </Suspense>
        </>
    )
}