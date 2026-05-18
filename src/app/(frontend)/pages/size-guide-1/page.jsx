import Link from "next/link"
import Image from "next/image"

export default function SizeGuidePage() {

    const ringSizeChart1 = [
        ["13","41","1","1","C ½"],
        ["13.4","42","2","2","D ¾"],
        ["13.7","43","3","2 ½","E 1¼"],
        ["14","44","4","3","F"],
        ["14.3","45","5","3½","G"],
        ["14.6","46","6","3 ¾","H"],
        ["15","47","7","4","I"],
        ["15.3","48","8","4 ½","I ½"],
        ["15.6","49","9","5","J ¼"],
        ["15.9","50","10","5 ½","K ¼"],
        ["16.2","51","11","5 ¾","L"],
        ["16.5","52","12","6","M"],
        ["16.8","53","13","6 ½","M ½"],
        ["17.2","54","14","7","N ½"],
        ["17.5","55","15","7 ½","O ½"],
        ["17.8","56","16","8","P"],
        ["18.1","57","17","8 ½","Q"],
        ["18.4","58","18","9","Q ⅓"],
    ]

    const ringSizeChart2 = [
        ["18.8","59","19","9 ½","R ½"],
        ["19.1","60","20","10","S"],
        ["19.4","61","21","10 ¼","S ¼"],
        ["19.7","62","22","10 ½","T ¼"],
        ["20","63","23","11","U"],
        ["20.3","64","24","11 ½","V"],
        ["20.6","65","25","12","V ½"],
        ["21","66","26","12 ½","W ¾"],
        ["21.3","67","27","13","X ½"],
        ["21.6","68","28","13 ¼","Y ½"],
        ["22","69","29","13 ⅔","Z+ ½"],
        ["22.2","70","30","13 ¾","Z+1"],
        ["22.6","71","31","14","Z+1.5"],
        ["22.9","72","32","14 ½","Z+2.4"],
        ["23.2","73","33","14 ¼","Z+3.5"],
        ["23.5","74","34","15 ½","Z+4.5"],
        ["23.9","75","35","15 ¾","Z+5"],
        ["24.2","76","36","16","Z+6"],
    ]

    const braceletSizeChart = [
        { cm: "12.70", inch: '5"' },
        { cm: "13.97", inch: '5.5"' },
        { cm: "15.24", inch: '6"' },
        { cm: "16.51", inch: '6.5"' },
        { cm: "17.78", inch: '7"' },
        { cm: "19.05", inch: '7.5"' },
        { cm: "20.32", inch: '8"' },
        { cm: "21.59", inch: '8.5"' },
        { cm: "22.86", inch: '9"' },
    ];

    const bangleSizeChart = [
        { size: '2.0"', mm: '51', inch: '2.00"' },
        { size: '2.1"', mm: '52.5', inch: '2.06"' },
        { size: '2-2/16"', mm: '54', inch: '2.12"' },
        { size: '2-3/16"', mm: '55.5', inch: '2.18"' },
        { size: '2-4/16"', mm: '57', inch: '2.24"' },
        { size: '2-5/16"', mm: '58.5', inch: '2.30"' },
    ];

    const necklaceLengths = [
        {
        title: '14" Choker',
        desc: 'Sits snugly at the base of the neck. Ideal for off-shoulder and V-neck outfits.',
        },
        {
        title: '16" Collarbone Length',
        desc: 'Versatile and perfect for layering with pendants.',
        },
        {
        title: '18" Princess Length (Most Popular!)',
        desc: 'Sits just below the collarbone, complementing most outfits.',
        },
        {
        title: '20" Matinee Length',
        desc: 'Falls around the top of the bust, perfect for professional wear.',
        },
        {
        title: '24" Opera Length',
        desc: 'Elegant and suited for formal occasions. Can be doubled for a layered look.',
        },
        {
        title: '30+" Rope Length',
        desc: 'A bold statement piece, ideal for layering.',
        },
    ];

    return (
        <section className="max-w-[1400px] mx-auto px-[clamp(12px,4vw,40px)] py-10 text-[#333]">
            <h1 className="text-center font-medium text-[clamp(20px,5vw,28px)] mb-[clamp(24px,4vw,32px)] leading-[150%] text-[#222]">
                Lucira Jewelry Size Guide
            </h1>
            <section className="mb-[clamp(30px,5vw,40px)]">
                <div className="w-full">
                    <div className="w-full">
                        
                        <h2 className="text-[clamp(18px,4vw,24px)] font-medium mb-4 leading-[1.4]">
                        Your Ultimate Size Guide for Rings, Necklaces, and Bracelets
                        </h2>

                        <p className="text-[clamp(14px,3vw,16px)] leading-[1.6] font-light text-[#333]">
                        Finding the perfect fit for your jewelry ensures both comfort and
                        style.&nbsp;
                        <Link
                            href="https://www.lucirajewelry.com/"
                            target="_blank"
                            className="font-bold underline hover:opacity-80 transition"
                        >
                            Lucira Jewelry&apos;s
                        </Link>&nbsp;
                        size guide offers step-by-step instructions to help you measure
                        rings, bracelets, bangles, and necklaces with ease. Let&apos;s find
                        the perfect fit for you!
                        </p>
                    </div>
                </div>
            </section>
            <section className="mb-[clamp(30px,5vw,40px)]">
                <div className="w-full">
                    <div className="w-full text-[#333]">
                        <h2 className="text-[clamp(18px,4vw,20px)] font-medium mb-4 leading-[150%] border-l-4 border-[#b48c54] pl-3">
                            Ring Size Guide
                        </h2>
                        
                        <div className="flex flex-wrap gap-[clamp(15px,3vw,20px)] max-w-[1200px] mx-auto p-[clamp(10px,3vw,20px)]">
                            <div className="flex-1 min-w-[300px] bg-[#fff8e1] p-[clamp(15px,3vw,20px)] content-center rounded-xl shadow">
                                <p className="mb-3">
                                    <strong>Method 1:</strong> Measure an Existing Ring
                                </p>
                                <ol className="list-decimal pl-5 space-y-2 text-[clamp(14px,3vw,16px)] font-light">
                                    <li>Select a ring that fits your desired finger.</li>
                                    <li>Measure its inner diameter using a flexible measuring tape.</li>
                                    <li>Use our conversion chart to find your ring size.</li>
                                </ol>
                            </div>
                            <div className="flex-1 min-w-[300px]">
                                <Image
                                    src="https://luciraonline.myshopify.com/cdn/shop/t/248/assets/ring-scale.webp?v=135522144173540751921758515040"
                                    alt="Ring measurement scale"
                                    width={600}
                                    height={600}
                                    className="w-full h-auto max-h-[600px] object-contain rounded-xl shadow"
                                />
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-[clamp(15px,3vw,20px)] max-w-[1200px] mx-auto p-[clamp(10px,3vw,20px)]">
                            <div className="flex-1 min-w-[300px] bg-[#fff8e1] p-[clamp(15px,3vw,20px)] content-center rounded-xl shadow">
                                <p className="mb-3">
                                    <strong>Method 2:</strong> Wrap a paper strip or string around your finger, mark and measure it, then refer to our size chart.
                                </p>
                                <ol className="list-decimal pl-5 space-y-2 text-[clamp(14px,3vw,16px)] font-light">
                                    <li>Measure in the evening for better accuracy.</li>
                                    <li>Warm hands give more accurate measurements.</li>
                                    <li>Avoid alcohol or salt before measuring.</li>
                                    <li>If your knuckle is larger, measure both base and knuckle.</li>
                                </ol>
                            </div>
                            <div className="flex-1 min-w-[300px] flex items-center justify-center">
                                <video
                                    className="w-full max-w-[500px] max-h-[500px] object-contain rounded-lg shadow"
                                    controls
                                    autoPlay
                                    loop
                                    muted
                                >
                                    <source
                                    src="https://cdn.shopify.com/videos/c/o/v/b6bd45e165384f7bb50a9598b5986822.mp4"
                                    type="video/mp4"
                                    />
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        </div>
                        
                        <div className="max-w-[1200px] mx-auto px-[clamp(10px,3vw,20px)]">
                            <p className="mb-3 text-[clamp(14px,3vw,16px)]">
                                Tips for Accurate Ring Measurement:
                            </p>

                            <ul className="list-disc pl-5 space-y-2 text-[clamp(14px,3vw,16px)] font-light">
                                <li>Measure your finger in the evening when it's slightly larger.</li>
                                <li>Ensure your hands are warm, as cold temperatures can shrink your fingers.</li>
                                <li>Avoid measuring after consuming alcohol or salty foods, as they can cause swelling.</li>
                                <li>
                                    If your knuckle is larger than the base of your finger, measure both and choose a size that slides on comfortably.
                                </li>
                            </ul>
                            <h5 className="mt-4 text-[clamp(14px,3vw,16px)]">
                            <strong>Need Help?</strong>{" "}
                                <Link
                                    href="https://lucirajewelry.com/pages/contact-us"
                                    className="underline hover:opacity-80 text-blue-700"
                                >
                                    Contact our team
                                </Link>{" "}
                            for personalized assistance
                            </h5>
                        </div>
                    </div>
                </div>
            </section>
            <section className="mb-[clamp(30px,5vw,40px)]">
                <div className="flex flex-col gap-[clamp(1.5rem,3vw,2rem)] max-w-[1200px] mx-auto w-full">
                    <div className="bg-white p-[clamp(16px,3vw,24px)] rounded-[10px] shadow">          
                        <h2 className="text-[clamp(18px,4vw,20px)] font-medium mb-4 border-l-4 border-[#b48c54] pl-3">
                            Ring Size Chart
                        </h2>
                        <div className="flex flex-wrap gap-[clamp(15px,3vw,20px)] justify-between">
                            <div className="flex-1 min-w-[280px] w-full overflow-x-auto">
                                <table className="w-full border-collapse text-[clamp(12px,3vw,14px)]">
                                    <thead>
                                        <tr className="bg-[#f9f9f9]">
                                            <th className="border p-2">Diameter (mm)</th>
                                            <th className="border p-2">Circumference (mm)</th>
                                            <th className="border p-2">India</th>
                                            <th className="border p-2">USA / Canada</th>
                                            <th className="border p-2">UK</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {ringSizeChart1.map((row, i) => (
                                        <tr key={i}>
                                        {row.map((cell, j) => (
                                            <td key={j} className="border p-2 text-center">
                                            {cell}
                                            </td>
                                        ))}
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex-1 min-w-[280px] w-full overflow-x-auto">
                                <table className="w-full border-collapse text-[clamp(12px,3vw,14px)]">
                                    <thead>
                                    <tr className="bg-[#f9f9f9]">
                                        <th className="border p-2">Diameter (mm)</th>
                                        <th className="border p-2">Circumference (mm)</th>
                                        <th className="border p-2">India</th>
                                        <th className="border p-2">USA / Canada</th>
                                        <th className="border p-2">UK</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {ringSizeChart2.map((row, i) => (
                                        <tr key={i}>
                                        {row.map((cell, j) => (
                                            <td key={j} className="border p-2 text-center">
                                            {cell}
                                            </td>
                                        ))}
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="flex justify-center mt-6">
                            <Link
                            href="https://lucirajewelry.com/collections/rings"
                            className="uppercase bg-[#a68380] text-white px-6 py-2 rounded-full text-[clamp(.9rem,3vw,1.2rem)] shadow hover:bg-[#95736f] transition hover:-translate-y-1"
                            >
                            Discover Our Ring Collection
                            </Link>
                        </div>
                    </div>
                    <div className="bg-white p-[clamp(16px,3vw,24px)] rounded-[10px] shadow flex flex-col items-center hidden">                    
                        <h2 className="text-[clamp(18px,4vw,20px)] mb-4 text-center">
                            Watch How to Measure Your Ring Size
                        </h2>
                        <video
                            className="w-full max-w-[500px] max-h-[500px] object-contain rounded-lg shadow"
                            controls
                        >
                            <source
                            src="https://cdn.shopify.com/videos/c/o/v/33cb8e89e66444f6ad888380ee29e75e.mp4"
                            type="video/mp4"
                            />
                            Your browser does not support the video tag.
                        </video>
                    </div>

                </div>
            </section>
            <section className="mb-[clamp(30px,5vw,40px)]">
                <h2 className="text-lg sm:text-xl font-medium border-l-4 border-[#b48c54] pl-3 mb-4">
                Bracelet Size Guide
                </h2>
                <p className="text-sm sm:text-base text-gray-900 leading-relaxed mb-4">
                A well-fitted bracelet enhances both comfort and elegance. Here's how
                to measure your wrist accurately:
                </p>
                <div className="space-y-3 text-sm sm:text-base text-gray-900">
                    <p><strong>Step 1:</strong> Measure Your Wrist</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>
                        Wrap a flexible tape measure around your wrist where the bracelet
                        will sit.
                        </li>
                        <li>
                        If using a piece of string, mark the meeting point and measure it
                        against a ruler.
                        </li>
                    </ul>

                    <p><strong>Step 2:</strong> Determine Your Preferred Fit</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Add 1 inch for a snug fit if your bracelet has a clasp.</li>
                        <li>
                        For bangles and cuffs, measure the widest part of your hand to
                        ensure an easy slide-on fit.
                        </li>
                    </ul>
                </div>
            </section>
            <section className="mb-[clamp(30px,5vw,40px)] flex flex-col lg:flex-row gap-6">
                <div className="flex-1 bg-white p-5 sm:p-6 rounded-lg shadow border">
                    <h2 className="text-lg sm:text-xl font-medium mb-4">
                        Bracelet Size Chart
                    </h2>

                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-xs sm:text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                <th className="border px-3 py-2 text-center">Size (CM)</th>
                                <th className="border px-3 py-2 text-center">Size (Inches)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {braceletSizeChart.map((row, index) => (
                                <tr key={index}>
                                    <td className="border px-3 py-2 text-center">{row.cm}</td>
                                    <td className="border px-3 py-2 text-center">{row.inch}</td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-center mt-6">
                        <Link
                        href="https://lucirajewelry.com/collections/bracelets"
                        className="bg-[#a68380] hover:bg-[#95736f] text-white text-xs sm:text-sm px-5 py-2 rounded-full uppercase tracking-wide transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                        Discover Our Bracelet Collection
                        </Link>
                    </div>
                </div>
                <div className="flex-1 bg-white p-5 sm:p-6 rounded-lg shadow border flex flex-col">
                    <h2 className="text-lg sm:text-xl font-medium mb-4 text-center">
                        Watch How to Measure Your Bracelet Size
                    </h2>
                    <video
                        controls
                        autoPlay
                        loop
                        muted
                        className="w-full h-full object-cover rounded-md shadow min-h-[300px]"
                    >
                        <source
                        src="https://cdn.shopify.com/videos/c/o/v/0ce96de369c24ea6a38a54a667a04818.mp4"
                        type="video/mp4"
                        />
                    </video>
                </div>
            </section>
            <section className="mb-[clamp(30px,5vw,40px)]">
                <h2 className="text-lg md:text-xl font-medium border-l-4 border-[#b48c54] pl-3 mb-4">
                Bangle Size Guide
                </h2>

                <p className="mb-4 text-sm md:text-base">
                Say goodbye to tight or loose bangles! Follow this step-by-step guide to find your ideal size:
                </p>

                <p className="font-semibold mb-2">Step 1: Measure Your Hand</p>
                <ul className="list-disc pl-5 mb-4 space-y-1 text-sm md:text-base">
                    <li>Tuck your thumb into your palm as if sliding on a bangle.</li>
                    <li>Measure the widest part across your hand using a flexible measuring tape.</li>
                </ul>

                <p className="font-semibold mb-2">Step 2: Measure Your Wrist</p>
                <ul className="list-disc pl-5 mb-4 space-y-1 text-sm md:text-base">
                    <li>Wrap a strip of paper or a flexible tape measure around your wrist and mark where the ends meet.</li>
                </ul>

                <p className="font-semibold mb-2">Alternate Method:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
                    <li>Use an existing bangle by measuring its inner diameter with a ruler.</li>
                    <li>Multiply the diameter by 3.14 (C = D × 3.14) to calculate the circumference.</li>
                </ul>
            </section>
            <section className="mb-[clamp(30px,5vw,40px)]">
                <div className="flex flex-col gap-6">
                    <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
                        <h2 className="text-lg md:text-xl font-medium mb-4">
                            Bangle Size Chart
                        </h2>

                        <div className="overflow-x-auto rounded-md shadow-sm">
                            <table className="min-w-full text-sm md:text-base border border-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                    <th className="border px-3 py-2 text-center">Bangle Size (Anna)</th>
                                    <th className="border px-3 py-2 text-center">Millimeters</th>
                                    <th className="border px-3 py-2 text-center">Inches</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bangleSizeChart.map((item, index) => (
                                    <tr key={index} className="text-center">
                                        <td className="border px-3 py-2">{item.size}</td>
                                        <td className="border px-3 py-2">{item.mm}</td>
                                        <td className="border px-3 py-2">{item.inch}</td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-center mt-6">
                            <Link
                            href="https://lucirajewelry.com/collections/bangles"
                            className="bg-[#a68380] hover:bg-[#95736f] text-white text-sm md:text-base px-6 py-2 rounded-full transition-all duration-300 shadow"
                            >
                            Discover Our Bangle Collection
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
            <section className="mb-[clamp(30px,5vw,40px)]">
                <div className="flex flex-col lg:flex-row gap-6 mb-10">
                    <div className="flex-1 bg-white p-4 md:p-6 rounded-lg shadow">
                        <h2 className="text-lg md:text-xl font-medium border-l-4 border-[#b48c54] pl-3 mb-4">
                            Necklace Size Guide
                        </h2>
                        <p className="mb-4 text-sm md:text-base">
                            Choosing the right necklace length enhances your personal style and outfit. Here's a quick step-by-step guide:
                        </p>
                        <ol className="list-decimal pl-5 space-y-2 text-sm md:text-base">
                            <li>
                            Wrap a flexible tape measure or piece of string around your neck where you'd like the necklace to sit.
                            </li>
                            <li>Add 2 inches for a comfortable fit or 4 inches for a looser drape.</li>
                            <li>
                            For chokers, measure the exact circumference of your neck and add 0.5 inches for comfort.
                            </li>
                            <li>Compare your measurement with the size chart below.</li>
                        </ol>
                    </div>
                    <div className="flex-1 bg-white p-4 md:p-6 rounded-lg shadow flex flex-col items-center">
                        <h2 className="text-lg md:text-xl font-medium text-center mb-4">
                            Watch How to Measure Your Necklace Size
                        </h2>
                        <video
                            className="w-full max-w-[500px] rounded-md shadow"
                            controls
                            autoPlay
                            loop
                            muted
                        >
                            <source
                            src="https://cdn.shopify.com/videos/c/o/v/98670eb471024a2e8cd8ffe48109edd7.mp4"
                            type="video/mp4"
                            />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </div>
            </section>
            <section className="mb-[clamp(30px,5vw,40px)]">
                <div className="bg-white">
                    <h2 className="text-lg md:text-xl font-medium border-l-4 border-[#b48c54] pl-3 mb-4">
                    Necklace Length Guide
                    </h2>

                    <ol className="list-decimal pl-5 space-y-3 text-sm md:text-base mb-6">
                        {necklaceLengths.map((item, index) => (
                            <li key={index}>
                            <strong>{item.title}</strong>: {item.desc}
                            </li>
                        ))}
                    </ol>
                    <div className="flex justify-center">
                        <Link
                            href="https://lucirajewelry.com/collections/necklaces"
                            className="bg-[#a68380] hover:bg-[#95736f] text-white text-sm md:text-base px-6 py-2 rounded-full transition-all duration-300 shadow"
                        >
                            Explore Our Necklace Collection
                        </Link>
                    </div>
                </div>
            </section>
        </section>
    )
}