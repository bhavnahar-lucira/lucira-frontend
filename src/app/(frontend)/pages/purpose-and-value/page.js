"use client";

import { useEffect, useRef, useState } from "react";
const cards = [
  {
    id: 1,
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/P_V_Img_01_1.png?v=1754975116",
    title: "Thoughtful Craftsmanship",
    description: "We believe the small things matter. Every detail, from cut to clasp, is considered, refined, and perfected.",
  },
  {
    id: 2,
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Rectangle_22290_2.jpg?v=1750321336",
    title: "Radical Transparency",
    description: "We're open about where our diamonds come from, how they're made, and who makes them. No guesswork, no greenwashing.",
  },
  {
    id: 3,
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Rectangle_22290_3.jpg?v=1750321336",
    title: "Sustainability by Design",
    description: "Our lab-grown diamonds use fewer natural resources and are traceable, conflict-free, and carbon-conscious by nature.",
  },
  {
    id: 4,
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Rectangle_22290_8.jpg?v=1750404810",
    title: "Integrity Over Hype",
    description: "We don't chase trends. We chase meaning. Every collection is designed to feel timeless, not seasonal.",
  },
  {
    id: 5,
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Rectangle_22290_8.jpg?v=1750404810",
    title: "People First",
    description: "We care about the hands behind the product. Ethical labor practices and safe, respectful workspaces are non-negotiable.",
  },
  {
    id: 6,
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Rectangle_22290_7.jpg?v=1750394263",
    title: "Timeless Self-Expression",
    description: "Jewelry is deeply personal. We design pieces that reflect who you are and what you stand for, no matter your style, gender, or journey.",
  },
];

const ABOUT_TEXT =
  "At Lucira, we honor love, celebrate individuality, and champion conscious choices. Each piece reflects quality, integrity, and intention—crafted to mark life's milestones with meaning, not just adornment.";

export default function PurposeAndValuePage() {
  const bannerContentRef = useRef(null);
  const brandTextRef = useRef(null);
  const revealSectionRef = useRef(null);
  const progressBarRef = useRef(null);
  const [words] = useState(() => ABOUT_TEXT.split(" "));
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    const section = document.querySelector(".what-we-do-for-section");
    const labels = document.querySelectorAll(".center-text");
    if (!section || !labels.length) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        labels.forEach((el) => {
          el.style.visibility = entry.isIntersecting ? "visible" : "hidden";
        });
      },
      { threshold: 0 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      if (bannerContentRef.current) {
        const progress = Math.min(scrollY / windowHeight, 1);
        const translateY = progress * windowHeight * 0.5;
        bannerContentRef.current.style.transform = `translate(-50%, calc(50% + ${translateY}px))`;
      }

      if (revealSectionRef.current) {
        const rect = revealSectionRef.current.getBoundingClientRect();
        let progress = 0;
        if (rect.top <= windowHeight && rect.bottom >= 0) {
          progress = (windowHeight - rect.top) / windowHeight;
        }
        progress = Math.max(0, Math.min(1, progress));
        if (progressBarRef.current) {
          progressBarRef.current.style.width = `${progress * 100}%`;
        }
        setRevealedCount(Math.floor(progress * words.length));
      }

      const brandSection = document.querySelector(".purpose-value-build-jewelry-brand");
      if (brandSection && brandTextRef.current) {
        const brandSectionRect = brandSection.getBoundingClientRect();
        const brandSectionTop = scrollY + brandSectionRect.top;
        const scrollStart = brandSectionTop - windowHeight;
        const scrollEnd = brandSectionTop;

        if (scrollY >= scrollStart && scrollY <= scrollEnd) {
          const progress = (scrollY - scrollStart) / (scrollEnd - scrollStart);
          const clamped = Math.max(0, Math.min(1, progress));
          const translateY = -100 + clamped * 100;
          brandTextRef.current.style.transform = `translate(-50%, calc(-50% + ${translateY}vh))`;
          brandTextRef.current.style.opacity = clamped;
        } else if (scrollY < scrollStart) {
          brandTextRef.current.style.transform = `translate(-50%, calc(-50% - 100vh))`;
          brandTextRef.current.style.opacity = 0;
        } else {
          brandTextRef.current.style.transform = `translate(-50%, -50%)`;
          brandTextRef.current.style.opacity = 1;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [words.length]);

  return (
    <main className="font-figtree">
      <style>{`
        .progress-indicator { position: fixed; top: 0; left: 0; width: 100%; height: 0; background: rgba(167,132,129,.2); z-index: 999; }
        .progress-bar { height: 100%; background: #a78481; width: 0%; transition: width .1s ease-out; }

        .purpose-value-banner { position: relative; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; background: #ffffff; z-index: 2; }
        .purpose-value-banner::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url(https://cdn.shopify.com/s/files/1/0739/8516/3482/files/unsplash_eOpewngf68w_5c9b7ec0-422f-4e75-b97b-e17cec6dea2a.jpg?v=1750229802); background-position: top center; background-size: cover; background-repeat: no-repeat; transform: translateY(-100%); animation: slideIn 1.5s ease-out forwards; animation-delay: 0.3s; }
        @keyframes slideIn { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        .purpose-value-banner h1 { color: #fff; margin: 0; font-weight: 500; font-size: 42px; line-height: 150%; text-transform: uppercase; text-align: center; max-width: 100%; }
        .purpose-value-banner-wrapper { position: absolute; left: 50%; bottom: 50%; width: 100%; z-index: 2; text-align: center; transition: transform 0.1s linear; }

        .purpose-value-about-us { position: relative; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; overflow: hidden; z-index: 4; }
        .purpose-value-about-us .text-reveal-container { position: sticky; top: 50%; transform: translateY(-50%); max-width: 80%; padding: 0 2rem; }
        .purpose-value-about-us .reveal-text { color: #a78481; text-align: center; margin: 0; font-weight: 500; font-size: 32px; line-height: 150%; text-transform: uppercase; letter-spacing: 0; }
        .purpose-value-about-us .word { display: inline-block; opacity: .1; transition: opacity .3s ease-out; margin-right: .3em; }
        .purpose-value-about-us .word.revealed { opacity: 1; }

        .what-we-do-for-section { position: relative; overflow: hidden; z-index: 3; background: #fff; }
        .what-we-do-for-section .header-section { height: 210px; display: flex; align-items: center; justify-content: center; position: relative; }
        .what-we-do-for-section .center-text { position: fixed; left: 50%; transform: translate(-50%, -50%); color: rgba(139,115,85,.8); pointer-events: none; white-space: nowrap; font-weight: 500; font-size: 42px; line-height: 150%; text-transform: uppercase; height: 100vh; top: 50%; width: 100%; text-align: center; display: flex; align-items: center; justify-content: center; visibility: hidden; }
        .what-we-do-for-section .frame-text-stroke { -webkit-text-stroke: 0.005em #ffffff; color: #ffffff00 !important; font-weight: 500; z-index: 3; position: fixed; }
        .what-we-do-for-section .cards-section { position: relative; z-index: 2; padding-top: 100px; max-width: 1100px; margin-left: auto; margin-right: auto; }
        .what-we-do-for-section .card { width: 400px; border-radius: 0; overflow: hidden; position: relative; z-index: 2; margin-bottom: 200px; }
        .what-we-do-for-section .card img { width: 100%; object-fit: cover; display: block; }
        .what-we-do-for-section .card-content { padding: 0; }
        .what-we-do-for-section .card-title { color: #1A1A1A; margin-bottom: 8px; margin-top: 24px; font-weight: 500; font-size: 24px; line-height: 150%; letter-spacing: 0px; text-transform: uppercase; }
        .what-we-do-for-section .card-description { color: #000000; font-weight: 500; font-size: 12px; line-height: 16px; margin: 0; }
        .what-we-do-for-section .card:nth-child(odd) { margin-left: 0; margin-right: auto; }
        .what-we-do-for-section .card:nth-child(even) { margin-left: auto; margin-right: 0; }

        .purpose-value-build-jewelry-brand { background: url(https://cdn.shopify.com/s/files/1/0739/8516/3482/files/unsplash_XPT-OtA0E-8_1.jpg?v=1750239476); background-position: center; background-size: cover; background-repeat: no-repeat; position: relative; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; z-index: 4; }
        .purpose-value-build-jewelry-brand-wrapper { position: absolute; left: 50%; top: 50%; z-index: 2; text-align: center; width: 100%; max-width: 100%; }
        .purpose-value-build-jewelry-brand h2 { font-weight: 500; font-size: 32px; line-height: 150%; text-align: center; text-transform: uppercase; color: #000000; width: 100%; margin: 0 auto; max-width: 80%; letter-spacing: 0; }
        .purpose-value-build-jewelry-brand h2 span { display: block; }

        @media only screen and (min-width: 1024px) and (max-width: 1400px) {
          .what-we-do-for-section .center-text { font-size: 60px; }
          .what-we-do-for-section .frame-text-stroke { -webkit-text-stroke: 1px #ffffff; }
        }
        @media only screen and (min-width: 1600px) and (max-width: 3000px) {
          .what-we-do-for-section .cards-section { max-width: 1199px; }
        }
        @media only screen and (min-width: 0px) and (max-width: 767px) {
          .purpose-value-banner h1 { font-size: 24px; letter-spacing: 2px; max-width: 330px; margin: 0 auto; }
          .purpose-value-about-us { height: auto; }
          .purpose-value-about-us .reveal-text { font-size: 18px; line-height: 1.8; padding: 0 1rem; }
          .purpose-value-about-us .text-reveal-container { position: inherit; transform: none; padding: 50px 2rem; max-width: 100%; }
          .purpose-value-about-us {z-index: 4;}
          .what-we-do-for-section .cards-section { margin-top: 65px; z-index: 12; padding-top: 0; background: #fff; margin-bottom: 250px; padding-bottom: 0; display: flex; flex-wrap: wrap; justify-content: space-between; padding: 0 1rem;}
          .what-we-do-for-section .card { width: 100%; max-width: 48%; margin-bottom: 50px; }
          .what-we-do-for-section .center-text { font-size: 24px; }
          .what-we-do-for-section .frame-text-stroke { -webkit-text-stroke: 0em #ffffff; }
          .what-we-do-for-section .header-section { height: 200px; }
          .what-we-do-for-section .card-title {font-size: 14px; line-height: 1.4; font-weight: 700; margin-top: 14px; }
          .what-we-do-for-section .card-description { font-size: 12px !important; line-height: 1.4 !important; }
          .purpose-value-build-jewelry-brand { background-image: url(https://cdn.shopify.com/s/files/1/0739/8516/3482/files/unsplash_XPT-OtA0E-8_2.jpg?v=1750334523); align-items: flex-start; padding-top: 175px; }
          .purpose-value-build-jewelry-brand h2 { font-size: 18px !important; }
        }
      `}</style>

      <div className="progress-indicator">
        <div className="progress-bar" ref={progressBarRef} />
      </div>

      <section className="purpose-value-banner" id="bannerSection">
        <div style={{ width: "100%" }}>
          <div
            className="purpose-value-banner-wrapper"
            ref={bannerContentRef}
            style={{ transform: "translate(-50%, 50%)" }}
          >
            <h1>Luxury That&apos;s Kinder to the Planet</h1>
          </div>
        </div>
      </section>

      <section className="purpose-value-about-us" ref={revealSectionRef} id="revealSection">
        <div className="text-reveal-container">
          <h2 className="reveal-text">
            {words.map((word, i) => (
              <span key={i} className={`word${i <= revealedCount ? " revealed" : ""}`}>
                {word}
              </span>
            ))}
          </h2>
        </div>
      </section>

      <section className="what-we-do-for-section">
        <div style={{ width: "100%" }}>
          <div className="header-section" />
          <div className="center-text">What We Stand For</div>
          <div className="center-text frame-text-stroke">What We Stand For</div>
          <div className="cards-section">
            {cards.map((card, index) => (
              <div className="card" key={index}>
                <img
                  src={card.image}
                  alt={card.title}
                  title={card.title}
                  loading="lazy"
                />
                <div className="card-content">
                  <h3 className="card-title">{card.title}</h3>
                  <p className="card-description">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="purpose-value-build-jewelry-brand">
        <div style={{ width: "100%" }}>
          <div
            className="purpose-value-build-jewelry-brand-wrapper"
            ref={brandTextRef}
            style={{ opacity: 0, transform: "translate(-50%, calc(-50% - 100vh))" }}
          >
            <h2>
              <span>We&apos;re building more than a jewelry brand.</span>
              <span>We&apos;re building a future where beauty, ethics, and craftsmanship come together.</span>
              <span>If that resonates with you, you&apos;re already part of the Lucira story.</span>
            </h2>
          </div>
        </div>
      </section>
    </main>
  );
}
