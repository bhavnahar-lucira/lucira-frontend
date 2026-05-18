import Image from "next/image";

export default function HowToWearPage() {
    const sections = [
        {
            title: "Finding the right bracelet for every occasion",
            items: [
                {
                    img: "https://luciraonline.myshopify.com/cdn/shop/t/248/assets/tennis-braclets.jpg?v=21878449302920909891758515057",
                    text: "For your everyday office outfit, tennis bracelets or a sleek oval bracelet would be the perfect fit as they would add charm and sophistication. When you want to exude leadership and confidence in a formal party or an important meeting, a cuff bracelet would perfectly complement your outfit.",
                },
                {
                    img: "https://luciraonline.myshopify.com/cdn/shop/t/248/assets/chain-bracelet.jpg?v=54880131363936672621758515027",
                    text: "For relaxed outings, simply clasp a chain bracelet or a charm bracelet to complete your outfit to subtly add elegance. A customized charm bracelet would be just perfect to exhibit richness and express your unique style and interests.",
                },
                {
                    img: "https://luciraonline.myshopify.com/cdn/shop/t/248/assets/bangle-bracelet.jpg?v=33651636669916661031758515026",
                    text: "With a bangle bracelet, you can effortlessly add a touch of style during festivities and special occasions. Pair it with a mangalsutra bracelet during Indian occasions, and surely you won't be able to stop admiring your wrist.",
                },
            ],
        },
    ];

    const mixedSections = [
        {
            title: "Bracelet sizing made simple, so beauty never slips",
            img: "https://luciraonline.myshopify.com/cdn/shop/t/248/assets/styling.jpg?v=125255256452384074911758515045",
            text: [
                "Finding the right fit is essential as it will decide how well it enhances your elegance while ensuring comfort. Thumb rule to decide the best fit is by checking the ability to slide in one or two fingers so the bracelet is not clasped too tight. It shouldn't be too loose either that you are constantly worried about the bracelet slipping off.",
                "Here's a tip - If you're unsure of the size while ordering the bracelet online, measure your wrist and add half an inch to it. This will give you a snug yet comfortable fit.",
            ],
        },
        {
            title: "Stacking Bracelets: The Secrets to a Perfect Ensemble",
            img: "https://luciraonline.myshopify.com/cdn/shop/t/248/assets/stacking-image.webp?v=13390808722548147361758515043",
            text: [
                "The first step is to know the number of bracelets you want to layer - 3, 5, 7? Layering in odd numbers gives a pleasing look.",
                "To enhance the balance, choose one color such as rose gold or a theme such as diamonds!",
                "Choose your base bracelet like a cuff bracelet that is not too heavy. Add variations in thickness for a more elegant look! You can layer a chain bracelet with a statement bangle bracelet or a tennis bracelet. Your stack should start from not more than one-third of the total length of your forearm.",
                "Ensure that you are comfortable with the stack and decide what looks more cohesive with your outfit. If it's a traditional occasion, you can opt for stacking on both hands and do not worry about overdressing as it will create a very balanced look!"
            ],
        },
        {
            title: "Styling Bracelets with Other Jewelry",
            img: "https://luciraonline.myshopify.com/cdn/shop/t/248/assets/styling-bracelet.jpg?v=106201200013033433361758515045",
            text: [
                "To style your bracelets seamlessly to maintain a refined look, maintain a graceful balance between your bracelets and other jewelry.",
                "For instance, when we wear a lot of rings, we choose a delicate looking, thin bracelet. To complement a bold statement necklace, opt for a delicate bracelet to achieve a balanced, elegant look. This ensures your wrist is adorned without overwhelming your overall style",
                "You can even choose your watch to be the focal point and stack bracelets. If you are going for a chic and simplistic style, opt for a single tennis bracelet which is of the same color of the watch.",
                "This way you are able to express your own style the way you like! We have crafted our exquisite collection to help you achieve the perfect balance of ease and elegance. Explore different styles with us!"
            ],
        },
    ];

    const necklaceSections = [
        {
            title: "Tennis Necklaces: Diamonds Designed for Decadence",
            img: "https://luciraonline.myshopify.com/cdn/shop/t/248/assets/tennis-braclets.jpg?v=21878449302920909891758515057",
            text: [
                "Add a touch of luxury to special occasions or a big day effortlessly with a shimmering diamond tennis necklace. Even on a regular day, a tennis necklace laying elegantly on your collarbone, grabs attention and elevates your look!",
                "Styling Tip: If you are planning to wear an off-shoulder gown or a plain black dress, choose to wear a tennis bracelet to enhance your aesthetics."
            ],
        },
        {
            title: "Layering Necklace",
            img: "https://luciraonline.myshopify.com/cdn/shop/t/248/assets/layering-necklace.jpg?v=162097071000196491081758515034",
            text: [
                "Whether you’re dressing for a moment or creating your signature look, our curated layering necklaces are designed to move with you, shine with you, and tell your story.",
                "From delicate chains to bold accents, each piece is crafted to complement the next—so you can build your look, one meaningful layer at a time. Wear them solo for subtle charm or stack them to create effortless impact"
            ],
        },
        {
            title: "Pendant Necklaces",
            img: "https://luciraonline.myshopify.com/cdn/shop/t/248/assets/pendant-necklace.jpg?v=8936009244818934171758515037",
            text: [
                "Pendant necklaces are timeless tokens with the ability to make jaws drop. It all depends on how you style it. If you wear a turtleneck top, the beauty of the pendant may be stolen. On the other hand, wear a rectangular pendant with a square neckline and you have a photographic look ready!",
                "Styling tip: Create a chic, personalised style by layering a solitaire diamond pendant necklace with a tennis necklace. Add a simple cuff or an oval bracelet and you are ready to walk on the ready carpet!"
            ],
        },
        {
            title: "Mangalsutra Necklace",
            img: "https://luciraonline.myshopify.com/cdn/shop/t/248/assets/mangalsutra-necklace.jpg?v=17597906835205452901758515035",
            text: [
                "Mangalsutra necklaces are a symbol of tradition. It signifies commitment and unity of the couple. For a sleep everyday look, layer the mangalsutra with a simple golden bracelet. You can don a saree under the blazer for a powerful look or even toss over a hoodie and leggings and wear the mangalsutra necklace with braided hair.",
                "Styling Tip: If you are planning to wear an off-shoulder gown or a plain black dress, choose to wear a tennis bracelet to enhance your aesthetics."
            ],
        },
    ];

    return (
        <section className="container mx-auto px-4 md:px-6 lg:px-10 xl:px-20 py-10 md:py-12">
            <h1 className="text-center text-xl md:text-2xl font-medium mb-8">
                HOW TO WEAR
            </h1>
            <div className="w-full mb-10">
                <h2 className="text-lg md:text-xl font-medium mb-3">Bracelet Styling Guide</h2>
                <p className="text-sm md:text-base font-light leading-relaxed text-justify text-gray-900">
                    Bracelets are versatile pieces of jewelry that elevate your elegance. It's a statement of personality. May it be a party you are hosting, a regular office day, or an international trip, a bracelet is a must-have.
                </p>
            </div>
            <section className="px-4 md:px-6 lg:px-10 xl:px-10 py-10 space-y-14">                
                {sections.map((section, idx) => (
                    <div key={idx}>
                        <h2 className="text-lg md:text-xl font-medium mb-6">{section.title}</h2>
                        <div className="space-y-10">
                            {section.items.map((item, i) => (
                                <div key={i} className="flex flex-col md:flex-row gap-6 md:gap-15 items-center">
                                    <div className="w-full md:w-[30%]">
                                        <div className="relative w-full h-[250px] md:h-[270px] rounded-lg overflow-hidden">
                                            <Image
                                            src={item.img}
                                            alt="bracelet"
                                            fill
                                            className="object-cover"
                                            />
                                        </div>
                                    </div>
                                    <p className="flex-1 text-sm md:text-base text-gray-900 leading-relaxed text-justify">
                                        {item.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {mixedSections.map((sec, idx) => (
                    <div key={idx}>
                        <h2 className="text-lg md:text-xl font-medium mb-6">
                            {sec.title}
                        </h2>

                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1 space-y-3 text-sm md:text-base text-gray-900">
                                {sec.text.map((t, i) => (
                                    <p key={i}>{t}</p>
                                ))}
                            </div>
                            <div className="w-full md:w-[30%]">
                                <div className="relative w-full h-[300px] rounded-lg overflow-hidden">
                                    <Image src={sec.img} alt="style" fill className="object-cover" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                
                <div className="w-full mb-10">
                    <h2 className="text-lg md:text-xl font-medium mb-4">
                    The Ultimate Guide to Wearing Necklaces: Styles and Styling
                    </h2>
                    <p className="text-sm md:text-base text-gray-900">
                    There's something undeniably powerful about necklaces to enhance your outfit, frame your face and make you feel elegant without much effort. While 'how to wear a necklace' sounds like the easiest task, styling them according to your outfits can make all the difference.
                    </p>
                </div>
                <div className="w-full my-10 text-center">
                    <h2 className="text-lg md:text-xl font-medium mb-3">Different Styles of Necklaces and How to Wear Them</h2>
                </div>
                
                {necklaceSections.map((item, idx) => (
                    <div key={idx}>
                        <h2 className="text-lg md:text-xl font-medium mb-6">{item.title}</h2>

                        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center">
                            <div className="w-full md:w-[30%]">
                                <div className={`relative w-full ${idx === 0 ? "h-[250px]" : "aspect-square"} rounded-lg overflow-hidden`}>
                                    <Image 
                                        src={item.img} 
                                        alt="necklace" 
                                        fill 
                                        className={idx === 0 ? "object-cover" : "object-contain"} 
                                    />
                                </div>
                            </div>
                            <div className="flex-1 text-sm md:text-base text-gray-900 space-y-2">
                                {item.text.map((t, i) => (
                                    <p key={i}>{t}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
                
                <p className="text-center text-sm md:text-base text-gray-900">
                    Keep experimenting with the styles, every necklace can make you stand out if styled well. It can bring the 'wow' factor to an outfit. Discover your style and wear your diamond accessories with confidence because there's nothing more beautiful than a woman who knows that she's shining!
                </p>
            </section>
        </section>
    )
}