'use client'
import Image from "next/image";
import { Suspense, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { setReferralLink, setReferralLoading, setReferralError } from "@/redux/features/user/userSlice";
import { toast } from "react-toastify";
import FAQ from "@/components/common/FAQ";

export default function RewardsPage() {
    const howItWorks = [
        {
            title: "Step 1 : Sign up",
            img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/account_circle_40ad6df8-71df-443c-adf0-603a8f1796d5.svg?v=1750683483",
            desc: "Sign up for Lucira Rewards in seconds and get 500 coins instantly,no hidden steps. Use your coins toward your first purchase and start saving right away!",
        },
        {
            title: "Step 2 : Earn Lucira coins",
            img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/gift.svg?v=1750683771",
            desc: "Earn 5% back in Lucira Coins every time you shop with us. Plus, enjoy exclusive bonus rewards during special promotions and events.",
        },
        {
            title: "Step 3 : Redeem",
            img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Redeem.svg?v=1750683772",
            desc: "Apply your Lucira Coins at checkout for instant savings. Whether it’s a new ring or your favorite bracelet, enjoy more sparkle for less.",
        },
    ]

    const waysToEarn = [
        {
            img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Rectangle_22226.jpg?v=1750848230",
            title: "Signup Bonus",
            description: "Join the Lucira Rewards program and get rewarded instantly, receive bonus Lucira Coins just for creating your account."
        },
        {
            img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Rectangle_22226_1.jpg?v=1750848231",
            title: "Product Purchase",
            description: "Earn Lucira Coins every time you shop. The more you treat yourself, the more rewards you collect with each order."
        },
        {
            img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Rectangle_22226_2.jpg?v=1750848231",
            title: "Write a Review",
            description: "Your words can guide others. Share a review of your recent Lucira purchase and enjoy exclusive rewards in the form of Lucira Coins."
        },
        {
            img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Rectangle_22226_3.jpg?v=1750848231",
            title: "Refer & Earn",
            description: "Love Lucira? Invite your friends to experience the same. When they shop using your referral link, both of you earn Lucira Coins."
        },
    ]

    const faqData = [
        {
            question: "What is Lucira Rewards?",
            answer:
                "Lucira Rewards is our loyalty program designed to thank you for shopping with us. You earn Lucira Coins with every purchase, review, referral, and more redeem them for savings on future orders.",
        },
        {
            question: "How do I join Lucira Rewards?",
            answer:
                "It’s easy! Just sign up for a Lucira account and you’ll automatically be enrolled in our rewards program,no extra steps required.",
        },
        {
            question: "How do I earn Lucira Coins",
            answer:
                "You can earn Lucira Coins in multiple ways: 1. By signing up 2. Making purchases 3. Referring friends",
        },
        {
            question: "How do I redeem my Lucira Coins?",
            answer:
                "At checkout, you’ll see the option to apply your available Lucira Coins to your order. Use them to get discounts and enjoy more sparkle for less.",
        },
        {
            question: "Is there a limit to how many Lucira Coins I can earn?",
            answer:
                "There’s no cap on how many coins you can collect. The more you shop, refer, and engage, the more you earn!",
        },
        {
            question: "How do referrals work?",
            answer:
                "Share your unique referral link with friends. When they make their first purchase using your link, both of you will receive Lucira Coins!",
        },
        {
            question: "I forgot to log in before placing my order. Can I still get Lucira Coins?",
            answer:
                "Yes! Just contact our support team with your order details, and we’ll manually credit your Lucira Coins.",
        },
        {
            question: "Where can I check my Lucira Coins balance?",
            answer:
                "Log in to your Lucira account and go to the 'Rewards' section. Your current balance and earning history will be displayed there.",
        },
    ];

    const dispatch = useDispatch();
    const [open, setOpen] = useState();
    const { user, isAuthenticated } = useSelector((state) => state.user);
    const isLoggedIn = isAuthenticated;
    const referralLink = useSelector((state) => state.user.referralLink);

    useEffect(() => {
        if (isLoggedIn && user?.id && !referralLink) {
            fetchReferralLink();
        }
    }, [isLoggedIn, user, referralLink]);

    async function fetchReferralLink() {
        try {
            dispatch(
                setReferralLoading(true)
            );
            const response = await fetch("/api/customer/referral",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        customerId: user.id
                    })
                }
            );
            const data = await response.json();
            if (data.referralLink) {
                dispatch(
                    setReferralLink(
                        data.referralLink
                    )
                );
            }
        } catch (error) {
            dispatch(
                setReferralError(
                    "Failed loading referral link"
                )
            );
        } finally {
            dispatch(
                setReferralLoading(false)
            );

        }
    }

    const handleScroll = () => {
        const element = document.getElementById("referral-program");
        if (!element) return;

        const offset = 60;
        const top = element.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({
            top,
            behavior: "smooth",
        });
    };

    const handleClick = async () => {
        if (!isLoggedIn) {
            setOpen(true)
            return
        }

        if (!referralLink) {
            toast.info(
                "Referral link still generating"
            );
            return;
        }

        await navigator.clipboard.writeText(
            referralLink
        );

        toast.success(
            "Referral link copied!"
        );
    }

    return (
        <>
            <section
                className="bg-cover bg-right-top bg-no-repeat h-[calc(100dvh-200px)] relative"
                style={{
                    backgroundImage:
                        "url(https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Loyalty-Desktop-Banner_1.jpg?v=1750941750)",
                }}
            >
                <div className="absolute top-1/2 left-[10%] -translate-y-1/2">
                    <h1 className="text-white text-3xl md:text-5xl font-medium uppercase mb-10">
                        Lucira Rewards
                    </h1>
                    <p className="text-white text-base md:text-lg max-w-xl mb-16 leading-relaxed">
                        With every Lucira purchase, you're not just adding a piece of
                        jewelry to your collection, you're capturing a moment. Collect
                        Lucira Coins and unlock exclusive rewards, special offers, and
                        little luxuries designed to celebrate your journey.
                    </p>
                    <button
                        onClick={handleScroll}
                        className="bg-white text-[#A68380] px-8 py-4 rounded-full uppercase text-sm font-medium inline-block w-full max-w-xs text-center cursor-pointer"
                    >
                        Join now to Earn
                    </button>
                </div>
            </section>
            <section className="py-16" id="refer-and-earn">
                <div className="w-full mx-auto px-12">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl font-medium uppercase mb-4">
                            How it Works
                        </h2>
                        <p className="max-w-3xl mx-auto text-gray-800 text-sm">
                            Your sparkle deserves something extra. With Lucira Rewards, every purchase brings you closer to exclusive benefits through our Lucira Coins program.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {howItWorks.map((item, i) => (
                            <div
                                key={i}
                                className="border border-gray-800 rounded-xl p-6 flex flex-col"
                            >
                                <Image src={item.img} className="w-14 h-14 mb-4" width={14} height={14} alt={item.title} />
                                <h3 className="text-lg uppercase font-bold mb-4">{item.title}</h3>
                                <p className="text-sm text-gray-800">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="py-16">
                <div className="w-full mx-auto px-12">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl font-medium uppercase mb-4">
                            Ways to Earn
                        </h2>
                        <p className="max-w-3xl mx-auto text-gray-800 text-sm">
                            Unlock more sparkle with every interaction. From signing up to sharing the love, there are multiple ways to earn Lucira Coins and enjoy exclusive rewards.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {waysToEarn.map((item, i) => (
                            <div key={i} className="relative">
                                <Image width={400} height={400} alt={item.title}
                                    src={item.img}
                                    className="w-full h-auto rounded-md object-cover"
                                />
                                <h3 className="mt-4 mb-2 uppercase font-medium text-md">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-gray-900">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="py-12 md:py-16" id="referral-program">
                <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
                    <div className="text-center mb-8 md:mb-10">
                        <h2 className="text-2xl md:text-3xl font-medium uppercase mb-4">
                            Referral Program
                        </h2>
                        <p className="max-w-3xl mx-auto text-gray-800 text-sm md:text-base leading-relaxed">
                            Let your sparkle inspire and earn while you do. Invite your friends to
                            join Lucira and enjoy exclusive perks when they make their first
                            purchase - you earn Lucira Coins and they get a discount. It's our way
                            of saying thank you.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                        <div className="md:col-span-2 lg:col-span-1 flex flex-col justify-center">
                            <p className="mb-4 text-gray-800 text-sm md:text-base">
                                Your Referral Link is Ready to Share with your friends
                            </p>
                            <div className="flex flex-col sm:flex-row">
                                <input className="flex-1 border px-4 py-3 text-sm rounded-md sm:rounded-l-md sm:rounded-r-none"
                                    value={
                                        isLoggedIn
                                            ? referralLink || "Generating your referral link..."
                                            : "Please Login to Share your Referral Link"
                                    }
                                    readOnly
                                />
                                <button
                                    onClick={handleClick}
                                    className="bg-[#A68380] text-white px-6 py-3 text-sm uppercase rounded-md mt-2 sm:mt-0 sm:rounded-r-md sm:rounded-l-none cursor-pointer">
                                    {isLoggedIn ? "Copy" : "Login"}
                                </button>
                            </div>
                        </div>

                        <div className="relative bg-[#F3E0CF] rounded-md p-5 md:p-6 min-h-[160px] md:min-h-[180px] flex flex-col justify-center text-right overflow-hidden">
                            <Image
                                alt="They Get"
                                width={300}
                                height={300}
                                src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/They_Get_img_2.png?v=1751354604"
                                className="absolute bottom-0 left-0 h-[85%] md:h-full w-auto object-contain"
                            />
                            <p className="text-sm mb-2 relative z-10">
                                They Get
                            </p>
                            <p className="text-2xl md:text-3xl font-bold relative z-10">
                                ₹1,000 Off <br />
                                <span className="text-lg md:text-xl font-bold">
                                    on their 1st Order
                                </span>
                            </p>
                        </div>

                        <div className="relative bg-[#F3E0CF] rounded-md p-5 md:p-6 min-h-[160px] md:min-h-[180px] flex flex-col justify-center text-left overflow-hidden">
                            <Image
                                alt="You Get"
                                width={300}
                                height={300}
                                src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/7d93784d-d99f-4716-8c45-779b911938f6_2.png?v=1751352893"
                                className="absolute bottom-0 right-0 h-[85%] md:h-full w-auto object-contain" />
                            <p className="text-sm mb-2 relative z-10">
                                You Get
                            </p>
                            <p className="text-2xl md:text-3xl font-bold relative z-10">
                                2,000 <br />
                                <span className="text-lg md:text-xl font-bold">
                                    Lucira Coins
                                </span>
                            </p>
                        </div>

                    </div>
                </div>
            </section>
            <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
                <FAQ title="FAQ'S" description="Curious about Lucira Rewards? We’ve got you covered! Here’s everything you need to know about earning, redeeming, and making the most of your Lucira Rewards. What is Lucira Rewards?" faqs={faqData} />
            </Suspense>

            <AuthDialog open={open} onOpenChange={setOpen} />
        </>
    )
}