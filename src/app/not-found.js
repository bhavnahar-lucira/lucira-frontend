import Link from "next/link";
import Header from "@/components/header/Header";
import Footer from "@/components/common/Footer";


export default function NotFound() {
  // Replace these with CMS / API later if needed
  const data = {
    ringImage: "https://luciraonline.myshopify.com/cdn/shop/files/Group_1321315630_9e9275ff-1542-4638-b680-f1903f950cf9.png?v=1750417573", // put your image in /public/images/
    heading: "LOOKS LIKE THE GEM IS MISSING…",
    subheading: "But don’t worry, treasures waiting for you.",
    collectionLink: "/collections/all",
    collectionLabel: "BROWSE OUR COLLECTIONS",
    homeLink: "/",
    homeLabel: "GO TO HOMEPAGE",
  };

  return (
    <div className="w-full">
      <Header />
      <section className="pt-7.5">
        <div className="text-center pb-12.5 md:pt-7.5">
          <div className="flex justify-center items-center gap-2.5 w-[50%] mx-auto text-[100px] font-bold">
            {data.ringImage ? (
              <img
                src={data.ringImage}
                alt="Missing Gem"
                title="Missing Gem"
                loading="lazy"
                className="md:w-[70%] w-full h-auto"
              />
            ) : (
              <span>0</span>
            )}
          </div>
          <h2 className="mt-5 mb-2 text-[20px] md:text-[40px]">
            {data.heading}
          </h2>

          {/* Subheading */}
          <p className="text-[#666] mb-7.5 text-[14px] md:text-[20px]">
            {data.subheading}
          </p>

          {/* Buttons */}
          <div className="flex justify-center gap-3.75 flex-wrap">

            {/* Primary Button */}
            <Link
              href={data.collectionLink}
              className="px-5 py-4 border border-primary bg-primary text-white rounded-xl text-base w-[90%] md:w-[25%] text-center"
            >
              {data.collectionLabel}
            </Link>

            {/* Secondary Button */}
            <Link
              href={data.homeLink}
              className="px-5 py-4 border border-primary text-primary rounded-xl text-base w-[90%] md:w-[25%] text-center"
            >
              {data.homeLabel}
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}