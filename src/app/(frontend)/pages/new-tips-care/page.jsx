import Image from "next/image"

export default function JewelryCareTipsPage() {
    const tipsData = [
        {
            title: "Daily Jewelry Care Tips",
            subtitle:
                "A little care goes a long way in keeping your jewelry radiant.",
            video:
                "https://luciraonline.myshopify.com/cdn/shop/videos/c/vp/4ddaecef9c3649658f64f0d6fee078a6/4ddaecef9c3649658f64f0d6fee078a6.HD-1080p-4.8Mbps-53552721.mp4",
            poster:
                "https://luciraonline.myshopify.com/cdn/shop/files/preview_images/4ddaecef9c3649658f64f0d6fee078a6.thumbnail.0000000000_small.jpg",
            reverse: true,
            points: [
                "Put your jewelry on after makeup, perfume, and lotion, let it be the final touch.",
                "Take it off before bedtime to prevent any damage.",
                "Avoid wearing solitaires while swimming or exercising, as sweat and chlorine can dull the sparkle. Bezel-set pieces, however, are perfectly safe for active wear and you can always add our Ring Shield for extra protection.",
                "Keep jewelry away from harsh chemicals, they can fade its shine and loosen its setting over time.",
            ],
        },
        {
            title: "How to Clean Your Jewelry Properly",
            subtitle:
                "With the right touch and proper cleaning, your jewelry shines like the day you got it.",
            video:
                "https://luciraonline.myshopify.com/cdn/shop/videos/c/vp/915d9a20ae4945b3b1c870dc00ddfd2a/915d9a20ae4945b3b1c870dc00ddfd2a.HD-1080p-3.3Mbps-53552869.mp4",
            poster:
                "https://luciraonline.myshopify.com/cdn/shop/files/preview_images/915d9a20ae4945b3b1c870dc00ddfd2a.thumbnail.0000000000_small.jpg",
            reverse: false,
            points: [
                "Use a soft cloth to gently clean any tarnish or discoloration. This method is safe for most jewelry pieces and helps maintain their shine without causing damage.",
                "To use a kit, spray a gentle jewelry cleaner onto your piece and use a tiny brush to reach the tiny crevices. Gently scrub in a circular motion to remove any dirt buildup.",
                "Let your piece breathe. Dry it up completely before storing it in a clean and dry place.",
            ],
        },
    ];

    const storageData = [
        {
            title: "Divide and Rule",
            description: "Store each piece separately in a soft pouch or a lined Jewelry Box.",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Divide_n_Rule.jpg?v=1754030688",
        },
        {
            title: "Prevent Tangles",
            description: "Close the clasps and lay necklaces flat or hang them to prevent knots.",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Prevent_Tangle.jpg?v=1754030688",
        },
        {
            title: "Control Humidity",
            description: "Use anti-tarnish strips or silica gel / packs in your Jewelry Box.",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Control_Humidity.png?v=1754030689",
        },
        {
            title: "Individual Care",
            description: "Opt for thoughtful storage options, such as individual pouches for each diamond piece.",
            image: "https://luciraonline.myshopify.com/cdn/shop/files/Individual_Care.jpg?v=1754030687",
        },
    ];

    const mistakesData = [
        {
            text: "Avoid soaking delicate diamonds in soap and water, as it can leave residue and dull their shine.",
            image:
            "https://luciraonline.myshopify.com/cdn/shop/files/Dont_use_soap.jpg?v=1754030688",
            icon: "https://luciraonline.myshopify.com/cdn/shop/files/Group_1321315714.svg",
            reverse: false,
        },
        {
            text: "Gently wipe them with a soft cloth or use a diamond-safe cleaner to preserve their sparkle without causing harm.",
            image:
            "https://luciraonline.myshopify.com/cdn/shop/files/Use_cloth_to_clean.png?v=1754047007",
            icon: "https://luciraonline.myshopify.com/cdn/shop/files/Group_1321315717.svg",
            reverse: true,
        },
        {
            text: "Don’t use toothpaste to clean as it scratches diamonds and their metal settings over time.",
            image:
            "https://luciraonline.myshopify.com/cdn/shop/files/Dont_use_toothpaste_V2.jpg?v=1754048931",
            icon: "https://luciraonline.myshopify.com/cdn/shop/files/Group_1321315714.svg",
            reverse: false,
        },
        {
            text: "Use a Gentle Jewelry Cleaner instead.",
            image:
            "https://luciraonline.myshopify.com/cdn/shop/files/Jewelry_cleaning.jpg?v=1754030688",
            icon: "https://luciraonline.myshopify.com/cdn/shop/files/Group_1321315717.svg",
            reverse: true,
        },
        {
            text: "Storing jewelry in spaces with poor air circulation can trap moisture and lead to tarnishing.",
            image:
            "https://luciraonline.myshopify.com/cdn/shop/files/Don_t_store_jewellery_in_any_space.jpg?v=1754030687",
            icon: "https://luciraonline.myshopify.com/cdn/shop/files/Group_1321315714.svg",
            reverse: false,
        },
        {
            text: "Wrap each piece in anti-tarnish cloth or keep it in an airtight pouch with silica gel.",
            image:
            "https://luciraonline.myshopify.com/cdn/shop/files/anti_tarnish.jpg?v=1754030688",
            icon: "https://luciraonline.myshopify.com/cdn/shop/files/Group_1321315717.svg",
            reverse: true,
        },
    ];

    const fixesData = [
        {
            title: "Tangled Necklaces?",
            description:
            "Sprinkle baby powder or apply a drop of oil (like coconut or olive oil) to loosen the knots. Use a pin to gently separate them.",
            image:
            "https://luciraonline.myshopify.com/cdn/shop/files/Use_powder.jpg",
        },
        {
            title: "Ring Too Tight?",
            description:
            "Fingers swell in heat. Soak your hand in cold water for a few minutes and keep it elevated to reduce swelling.",
            image:
            "https://luciraonline.myshopify.com/cdn/shop/files/Tightness_Ring.jpg",
        },
        {
            title: "Wobbly Stones?",
            description:
            "Avoid wearing them until they are repaired. As a quick temporary fix, apply a small dab of clear nail polish to secure the loose stone.",
            image:
            "https://luciraonline.myshopify.com/cdn/shop/files/Wobbly_stone.jpg",
        },
    ];

    return (
        <>
            <section className="relative w-full">
                <div className="hidden md:block relative w-full h-[calc(100dvh-200px)]">
                    <Image
                    src="https://luciraonline.myshopify.com/cdn/shop/files/Banner_V3_04e3d73c-3503-4bfc-9ece-862a4ad407d8.jpg"
                    alt="Banner Desktop"
                    fill
                    priority
                    className="object-cover"
                    />
                </div>
                
                <div className="block md:hidden relative w-full h-[360px]">
                    <Image
                        src="https://luciraonline.myshopify.com/cdn/shop/files/Mobile_Banner_V2.png"
                        alt="Banner Mobile"
                        fill
                        className="object-cover object-bottom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-80" />
                </div>
                <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 text-center text-white px-4 w-full">
                    <h1 className="text-lg md:text-3xl font-medium uppercase tracking-wide">
                    Lucira Jewelry Care Guide
                    </h1>
                    <p className="text-xs md:text-lg mt-2">
                    Keep your precious pieces sparkling for generations to come
                    </p>
                </div>
            </section>
            <section className="max-w-6xl mx-auto px-4 md:px-6 pt-16 space-y-4 md:space-y-6">
                <div className="w-full mb-15">
                    <h2 className="text-xl md:text-3xl font-medium uppercase tracking-wide text-gray-900 mb-5">
                        What Are the Best Jewelry Care Tips to Follow ?
                    </h2>
                    <p className="text-sm md:text-lg text-gray-800 leading-relaxed mb-4">
                        Ever noticed how some jewelry catches the light effortlessly, turning heads without even trying? That kind of brilliance doesn’t just last on its own, it stays because of true quality and the care that keeps it shining. We, at Lucira, craft your jewelry with the finest materials and design our pieces to last for lifetimes but even the best jewelry needs a little attention, love and care to maintain its brilliance.
                    </p>
                    <p className="text-sm md:text-lg text-gray-800 leading-relaxed">
                        Keep your jewelry shining with everyday care tips, smart storage ideas, and simple solutions for knots and tangles. This guide helps you care for your diamond jewelry with the attention it truly deserves.
                    </p>
                </div>
                <div className="w-full mb-15 flex flex-col gap-12">
                    {tipsData.map((item, index) => (
                    <div
                    key={index}
                    className={`flex flex-col-reverse ${
                        item.reverse ? "md:flex-row-reverse" : "md:flex-row"
                    } items-start gap-6 md:gap-10`}
                    >
                        <div className="w-full md:w-1/2">
                            <div className="relative w-full aspect-auto rounded-lg overflow-hidden">
                                <video
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    controls
                                    poster={item.poster}
                                >
                                    <source src={item.video} type="video/mp4" />
                                </video>
                            </div>
                        </div>
                        
                        <div className="w-full md:w-1/2 space-y-4">
                            <div>
                                <h3 className="text-lg md:text-2xl font-medium uppercase tracking-wide text-gray-900">
                                    {item.title}
                                </h3>
                                <p className="text-xs md:text-base text-gray-800 mt-1">
                                    {item.subtitle}
                                </p>
                            </div>

                            <ul className="list-disc pl-5 space-y-2 text-xs md:text-base text-gray-800 leading-relaxed">
                            {item.points.map((point, i) => (
                                <li key={i}>{point}</li>
                            ))}
                            </ul>
                        </div>
                    </div>
                    ))}
                </div>
                <div className="w-full mb-15">
                    <div className="text-center mb-8 md:mb-12">
                        <h2 className="text-xl md:text-3xl font-medium uppercase tracking-wide text-gray-900">
                        How to Store Your Jewelry the Right Way
                        </h2>
                        <p className="mt-3 text-sm md:text-base text-gray-900 max-w-2xl mx-auto">
                        Protect your jewelry from climate, tangles, and tarnish by storing
                        them the right way.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {storageData.map((item, index) => (
                            <div key={index} className="flex flex-col gap-4">
                                <div className="relative w-1/2 w-full aspect-2/3">
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        fill
                                        className="object-cover rounded-md"
                                    />
                                </div>
                                <div className="flex flex-col justify-center md:mt-4 w-1/2 md:w-full">
                                    <h3 className="text-sm md:text-lg font-medium uppercase tracking-wide text-gray-900">
                                        {item.title}
                                    </h3>
                                    <p className="mt-1 text-xs md:text-sm text-gray-900 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="w-full mb-15">
                    <div className="text-center mb-8 md:mb-12">
                        <h2 className="text-xl md:text-3xl font-medium uppercase tracking-wide text-gray-900">
                        What Are the Biggest Jewelry Care Mistakes to Avoid?
                        </h2>
                        <p className="mt-3 text-sm md:text-base text-gray-900">
                        It’s not the wear that weakens your jewelry, it’s how you care for it.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {mistakesData.map((item, index) => {
                        const isReverse = index % 2 !== 0;

                            return (
                                <div
                                key={index}
                                className="flex flex-col md:flex-row-reverse items-center gap-4"
                                >
                                    <div
                                        className={`w-full md:w-1/2 ${
                                        isReverse ? "md:order-2" : "md:order-1"
                                        }`}
                                    >
                                        <Image
                                        src={item.image}
                                        alt="Jewelry care"
                                        width={400}
                                        height={300}
                                        className="w-full h-auto rounded-md object-cover"
                                        />
                                    </div>
                                    <div
                                        className={`w-full md:w-1/2 ${
                                        isReverse ? "md:order-1 text-left" : "md:order-2 text-right"
                                        }`}
                                    >
                                        <div
                                        className={`flex ${
                                            isReverse ? "justify-start" : "justify-end"
                                        } mb-2`}
                                        >
                                        <Image
                                            src={item.icon}
                                            alt="icon"
                                            width={40}
                                            height={40}
                                        />
                                        </div>

                                        <p className="text-[14px] md:text-[18px] leading-relaxed">
                                        {item.text}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="w-full mb-15">
                    <div className="text-center mb-8 md:mb-12">
                        <h2 className="text-[21px] md:text-[32px] font-medium uppercase">
                        How Can You Fix Common Jewelry Problems at Home ?
                        </h2>
                        <p className="text-[14px] md:text-[18px] mt-2">
                        Quick fixes to bring back the brilliance.
                        </p>
                    </div>
                </div>
                <div className="flex flex-col gap-6 md:gap-8 max-w-212.5 mx-auto">
                    {fixesData.map((item, index) => (
                    <div
                        key={index}
                        className="flex flex-col md:flex-row gap-4 md:gap-6 items-start"
                    >
                        <div className="w-full md:w-[40%]">
                            <Image
                                src={item.image}
                                alt={item.title}
                                width={500}
                                height={300}
                                className="w-full h-auto rounded-md object-cover"
                            />
                        </div>
                        <div className="w-full md:w-[60%] text-left">
                            <h3 className="text-[18px] md:text-[24px] font-medium uppercase">
                                {item.title}
                            </h3>
                            <p className="text-[12px] md:text-[18px] mt-2 leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    </div>
                    ))}
                </div>
                <div className="max-w-212.5 mx-auto mt-10 mb-20 text-center">
                    <p className="text-[14px] md:text-[18px] leading-relaxed italic text-gray-800">
                        With the right care, your diamond will keep its shine through celebrations, milestones, and the moments that matter most.
                    </p>
                </div>
            </section>
        </>
    )
}