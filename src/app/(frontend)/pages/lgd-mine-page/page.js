"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";


const CDN = "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/";


const STEPS = [
  {
    id: 1,
    leftHeading: "lab grown diamonds",
    rightHeading: "mined diamonds",
    leftImage: CDN + "The_Beginning_of_a_Diamond_edb8d0f9-756f-4c34-9a56-df5734f7ea05.jpg",
    middleImage: CDN + "Outer_Icon_Tail_White_109_480.png",
    rightImage: CDN + "Borned_Beneath_The_Earth.jpg",
    leftSubheading: "The Beginning of a Diamond:",
    leftPoints:
      "<ul><li><p>A tiny fragment of an existing diamond, called a seed, is carefully chosen. This seed acts as the foundation on which a new diamond crystal begins to grow.</p></li></ul>",
    leftDotColor: "#4caf50",
    rightSubheading: "Born Beneath the Earth:",
    rightPoints:
      "<ul><li><p>Over 1–3 billion years ago, deep within Earth's mantle, immense heat (over 1,200°C) and crushing pressure transformed pure carbon into diamond crystals, a rare geological process that took ages to complete.</p></li></ul>",
    rightDotColor: "#f44336",
    centerType: "dot",
    dotColor: "#ffa500",
    centerIcon: null,
    isFirst: true,
    isLast: false,
  },
  {
    id: 2,
    leftHeading: "",
    rightHeading: "",
    leftImage: CDN + "Building_the_Right_Environment_23ac4b73-2e71-4adc-814d-179b5437cdf5.jpg",
    middleImage: CDN + "Outer_Icon_Tail_White_109_480.png",
    rightImage: CDN + "Journey_o_Surface.jpg",
    leftSubheading: "Building the Right Environment:",
    leftPoints:
      "<ul><li><p>HPHT uses intense heat (~1,500°C) and pressure while CVD uses a plasma chamber filled with carbon-rich gas that deposits carbon atoms onto the seed.</p></li></ul>",
    leftDotColor: "#4caf50",
    rightSubheading: "Journey to the Surface:",
    rightPoints:
      "<ul><li><p>Volcanic eruptions carried these hidden crystals upward through vertical tunnels called kimberlite pipes, bringing them closer to the Earth's surface for the first time.</p></li></ul>",
    rightDotColor: "#f44336",
    centerType: "dot",
    dotColor: "#8b5cf6",
    centerIcon: null,
    isFirst: false,
    isLast: false,
  },
  {
    id: 3,
    leftHeading: "",
    rightHeading: "",
    leftImage: CDN + "Layer_by_Layer_Growth_6c2c94f0-c23d-47aa-922a-daa980d35a04.jpg",
    middleImage: CDN + "Outer_Icon_Tail_White_109_480.png",
    rightImage: CDN + "Exraction_Of_Ore_bec190cc-2bfe-4073-9332-7cc2355866d1.jpg",
    leftSubheading: "Layer by Layer Growth:",
    leftPoints:
      "<ul><li><p>Carbon atoms attach to the seed one layer at a time, slowly forming the diamond crystal. The process can take several weeks or months, depending on the desired size.</p></li></ul>",
    leftDotColor: "#4caf50",
    rightSubheading: "Extraction of Ore",
    rightPoints:
      "<ul><li><p>To extract diamonds, massive volumes of earth, gravel, and rock are dug up, sometimes up to 250 tons for just 1 carat. This process demands significant water, fuel, and energy resources.</p></li></ul>",
    rightDotColor: "#f44336",
    centerType: "dot",
    dotColor: "#ffa500",
    centerIcon: null,
    isFirst: false,
    isLast: false,
  },
  {
    id: 4,
    leftHeading: "",
    rightHeading: "",
    leftImage: CDN + "Crystal_Formation.jpg",
    middleImage: CDN + "Outer_Icon_Tail_White_109_480.png",
    rightImage: CDN + "Sorting_From_Stone.jpg",
    leftSubheading: "Crystal Formation:",
    leftPoints:
      "<ul><li><p>Every stage is closely monitored for temperature, pressure and gas purity. This ensures the diamond grows evenly, with exceptional clarity and minimal impurities.</p></li></ul>",
    leftDotColor: "#4caf50",
    rightSubheading: "Sorting from Stone",
    rightPoints:
      "<ul><li><p>The mined ore is crushed, washed, and filtered using techniques like dense media separation (using differences in weight) and X-ray fluorescence to isolate diamonds from the waste material.</p></li></ul>",
    rightDotColor: "#f44336",
    centerType: "dot",
    dotColor: "#ffa500",
    centerIcon: null,
    isFirst: false,
    isLast: false,
  },
  {
    id: 5,
    leftHeading: "",
    rightHeading: "",
    leftImage: CDN + "Cutting_Polishing_a5734bdf-6e42-42d0-b495-d0f79db88d39.jpg",
    middleImage: CDN + "Outer_Icon_Tail_White_109_480.png",
    rightImage: CDN + "Cutting_Polishing_2121bb0d-f6ef-44da-bf56-4be4d93fc24e.jpg",
    leftSubheading: "Cutting & Polishing:",
    leftPoints:
      "<ul><li><p>Once fully grown, the rough diamond is cut using advanced lasers and then hand-polished by expert craftsmen to reveal its brilliance and final shape.</p></li></ul>",
    leftDotColor: "#4caf50",
    rightSubheading: "Cutting & Polishing",
    rightPoints:
      "<ul><li><p>Once recovered, rough diamonds are graded, cut and polished by master craftsmen to reveal their brilliance. Each stone is then certified before making its way to jewelers worldwide.</p></li></ul>",
    rightDotColor: "#f44336",
    centerType: "dot",
    dotColor: "#45e8d8",
    centerIcon: null,
    isFirst: false,
    isLast: false,
  },
  {
    id: 6,
    leftHeading: "",
    rightHeading: "",
    leftImage: CDN + "Certification_Grading_2_2e5b990f-f034-4a80-bb2d-85e49b62eabb.jpg",
    middleImage: CDN + "Outer_Icon_Tail_White_109_480_white.png",
    rightImage: CDN + "Certification_Grading.jpg",
    leftSubheading: "Certification & Grading:",
    leftPoints:
      "<ul><li><p>Each diamond is graded by independent laboratories such as GIA, IGI or SGL, ensuring authenticity and excellence across the 4Cs – Cut, Color, Clarity, and Carat.</p></li></ul>",
    leftDotColor: "#4caf50",
    rightSubheading: "Certification & Grading",
    rightPoints:
      "<ul><li><p>Graded by independent labs like GIA, IGI or SGL, mined diamonds are graded on the same 4Cs with well-cut, clear, colorless stones prized highest.</p></li></ul>",
    rightDotColor: "#f44336",
    centerType: "icon",
    dotColor: "#ffa500",
    centerIcon: CDN + "OBJECTS.png",
    isFirst: false,
    isLast: true,
  },
];

const FINAL_BLOCK = {
  image: CDN + "Group_316bd24c-03d2-46b6-85ba-47edda579b03.png",
  leftHeading: "LAB GROWN DIAMONDS",
  rightHeading: "MINED DIAMONDS",
  leftPoints: [
    "<strong>Price &amp; Affordability –</strong> Usually 40–70% cheaper than mined diamonds, letting buyers get a larger or higher-quality stone in the same budget due to lower production costs and fewer middlemen.",
    "<strong>Ethical &amp; Conflict-Free –</strong> Created in safe, controlled labs, lab grown diamonds have no links to conflict or unethical mining. You get complete peace of mind with transparent and traceable origins.",
    "<strong>Quality &amp; Purity –</strong> Formed under precise lab conditions, these diamonds often have fewer flaws and higher clarity. They can also be made in rare colors like pink, blue, and yellow with perfect consistency.",
    "<strong>Scientific Traceability –</strong> Every lab grown diamond can be traced back to its source lab, ensuring full transparency.",
  ],
  rightPoints: [
    "<strong>Environmental Impact –</strong> Mining 1 carat of diamond can require moving 100–250 tons of earth and consumes huge amounts of water and fossil fuels, generating significant waste and carbon emissions.",
    "<strong>Ethical &amp; Human Rights Issues –</strong> &ldquo;Blood or conflict diamonds&rdquo; have historically funded wars. Even today, unethical labor practices, poor safety conditions and exploitation of workers remain issues in certain regions.",
    "<strong>Limited Design Options –</strong> Natural diamonds are rare and fixed in size, color and clarity, limiting choice and making customization nearly impossible.",
    "<strong>Complex Supply Chain –</strong> Multiple intermediaries like miners, traders, cutters and retailers inflate costs and make it harder to trace a diamond's origin.",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// TravelDiamond — Floating diamond that follows scroll progress
// ─────────────────────────────────────────────────────────────────────────────
const TravelDiamond = ({ sourceRef, targetRef, image }) => {
  const { scrollY } = useScroll();
  const [coords, setCoords] = useState({ startX: 0, startY: 0, endX: 0, endY: 0, startW: 0, endW: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const updateCoords = () => {
      if (!sourceRef.current || !targetRef.current || !containerRef.current) return;
      const s = sourceRef.current.getBoundingClientRect();
      const t = targetRef.current.getBoundingClientRect();
      const c = containerRef.current.getBoundingClientRect();

      const scrollYVal = window.pageYOffset;
      const scrollXVal = window.pageXOffset;

      // Coordinates relative to the container
      setCoords({
        startX: s.left + s.width / 2 - c.left,
        startY: s.top + s.height / 2 - c.top,
        startW: s.width,
        endX: t.left + t.width / 2 - c.left,
        endY: t.top + t.height / 2 - c.top,
        endW: t.width,
      });
    };

    updateCoords();
    window.addEventListener("resize", updateCoords);
    // Intersection observer to trigger recalc when elements might have moved
    const obs = new IntersectionObserver(updateCoords);
    if (sourceRef.current) obs.observe(sourceRef.current);
    if (targetRef.current) obs.observe(targetRef.current);

    return () => {
      window.removeEventListener("resize", updateCoords);
      obs.disconnect();
    };
  }, [sourceRef, targetRef]);

  // Adjust triggers based on container top
  const [triggers, setTriggers] = useState([0, 0]);
  useEffect(() => {
    if (!containerRef.current) return;
    const c = containerRef.current.getBoundingClientRect();
    const scrollYVal = window.pageYOffset;
    // Start when source is roughly in middle of screen, end when target is in middle
    // Add specific offsets for better start/end points
    setTriggers([
      coords.startY + c.top + scrollYVal - window.innerHeight / 2,
      coords.endY + c.top + scrollYVal - window.innerHeight / 2 - 100
    ]);
  }, [coords]);

  const progress = useTransform(scrollY, [triggers[0], triggers[1]], [0, 1]);
  const smoothProgress = useSpring(progress, { stiffness: 100, damping: 25, restDelta: 0.001 });

  const x = useTransform(smoothProgress, [0, 1], [coords.startX, coords.endX]);
  const y = useTransform(smoothProgress, [0, 1], [coords.startY, coords.endY]);
  const width = useTransform(smoothProgress, [0, 1], [coords.startW, coords.endW]);

  const xCentered = useTransform([x, width], ([v, w]) => v - w / 2);
  const yCentered = useTransform([y, width], ([v, w]) => v - (w * 0.8) / 2);

  const opacity = useTransform(smoothProgress, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);

  // Hide the real images when animation is active
  useEffect(() => {
    const unsub = smoothProgress.on("change", (v) => {
      if (sourceRef.current) sourceRef.current.style.visibility = v > 0.05 ? "hidden" : "visible";
      if (targetRef.current) targetRef.current.style.visibility = v > 0.95 ? "visible" : "hidden";
    });
    return () => unsub();
  }, [smoothProgress, sourceRef, targetRef]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-[499]" style={{ height: '100%' }}>
      <motion.img
        src={image}
        style={{
          position: "absolute",
          x: xCentered,
          y: yCentered,
          width: width,
          height: "auto",
          opacity: opacity,
        }}
        className="lgd-floating-diamond"
      />
    </div>
  );
};


// ─────────────────────────────────────────────────────────────────────────────
// ImageStep — each sticky comparison step with slide-in animation
// ─────────────────────────────────────────────────────────────────────────────
const ImageStep = ({ step, lastStepIconRef }) => {
  const [isActive, setIsActive] = useState(step.isFirst); // first block starts active
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setIsActive(true);
      },
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    // <div
    //   ref={ref}
    //   className={`lgd-step relative z-[1] flex justify-center items-center transition-transform duration-[600ms] ease-out will-change-transform ${step.isFirst ? "bg-white" : ""
    //     } ${isActive ? "translate-y-0" : "translate-y-[80px]"}`}
    //   style={{ position: "sticky", top: "180px", minHeight: "79vh", gap: "75px" }}
    // >

    <div
      ref={ref}
      className={`lgd-step relative z-[1] flex justify-center items-center transition-transform duration-[600ms] ease-out will-change-transform ${step.isFirst ? "bg-white" : ""
        } ${isActive ? "translate-y-0" : "translate-y-[80px]"}`}
      style={{
        position: "sticky",
        top: step.isFirst ? "92px" : "130px",  // 👈 Conditional top value
        minHeight: "79vh",
        gap: "75px"
      }}
    >
      {/* ── LEFT COLUMN ── */}
      <div className="lgd-col flex flex-col items-center text-center" style={{ maxWidth: "300px" }}>
        {step.leftHeading && (
          <div className="lgd-col-heading block font-abhaya font-semibold text-[#5A413F] uppercase tracking-[1px]" style={{ minHeight: "50px", fontSize: "24px", marginBottom: "12px" }}>
            {step.leftHeading}
          </div>
        )}
        {step.leftImage && (
          <img src={step.leftImage} alt="Lab grown diamond step" className="w-full h-auto" loading="lazy" />
        )}
        <div className="lgd-desc bg-white text-left w-full" style={{ minHeight: "268px", maxWidth: "300px" }}>
          {step.leftSubheading && (
            <h2 className="lgd-sub-title text-[20px] font-semibold text-[#333] mt-4 mb-0">{step.leftSubheading}</h2>
          )}
          <div
            className="lgd-points-left mt-3"
            style={{ "--dot-col": step.leftDotColor }}
            dangerouslySetInnerHTML={{ __html: step.leftPoints }}
          />
        </div>
      </div>

      {/* ── CENTER COLUMN ── */}
      <div className="lgd-center-wrap relative flex items-center justify-center" style={{ width: "fit-content", height: "200px" }}>
        {/* Vertical dividing line */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: "100px",
            width: step.isLast ? "6px" : "4.5px",
            height: "57vh",
            backgroundColor: step.isLast ? "#fff" : "#d3d3d3",
          }}
        />

        {/* Center image (the scrolling diamond image) */}
        {step.middleImage && (
          <img
            src={step.middleImage}
            alt="Process step"
            className={`lgd-center-img object-cover`}
            style={{ height: "400px" }}
            loading="lazy"
          />
        )}

        {/* Dot */}
        {step.centerType === "dot" && (
          <div
            className="absolute left-1/2 transition-all duration-[600ms] ease-out"
            style={{
              top: "var(--icon-top, -23%)",
              width: "var(--icon-size, 35px)",
              height: "var(--icon-size, 35px)",
              borderRadius: "50%",
              backgroundColor: step.dotColor,
              transform: isActive ? "translate(-50%, -75%) scale(1)" : "translate(-50%, -50%) scale(0)",
              opacity: isActive ? 1 : 0,
            }}
          />
        )}

        {/* Icon */}
        {step.centerType === "icon" && step.centerIcon && (
          <img
            ref={step.isLast ? lastStepIconRef : null}
            src={step.centerIcon}
            alt="Center icon"
            className={`absolute left-1/2 transition-all duration-[600ms] ease-out ${step.isLast ? "lgd-final-icon-src" : ""}`}
            style={{
              top: "var(--icon-top, -23%)",
              transform: isActive ? "translate(-50%, -50%) scale(1)" : "translate(-50%, -50%) scale(0)",
              opacity: isActive ? 1 : 0,
              width: "var(--icon-size, auto)",
              height: "var(--icon-size, auto)",
            }}
            loading="lazy"
          />
        )}
      </div>

      {/* ── RIGHT COLUMN ── */}
      <div className="lgd-col flex flex-col items-center text-center" style={{ maxWidth: "300px" }}>
        {step.rightHeading && (
          <div className="lgd-col-heading block font-abhaya font-semibold text-[#5A413F] uppercase tracking-[1px]" style={{ minHeight: "50px", fontSize: "24px", marginBottom: "12px" }}>
            {step.rightHeading}
          </div>
        )}
        {step.rightImage && (
          <img src={step.rightImage} alt="Mined diamond step" className="w-full h-auto" loading="lazy" />
        )}
        <div className="lgd-desc bg-white text-left w-full" style={{ minHeight: "268px", maxWidth: "300px" }}>
          {step.rightSubheading && (
            <h2 className="lgd-sub-title text-right text-[20px] font-semibold text-[#333] mt-4 mb-0">{step.rightSubheading}</h2>
          )}
          <div
            className="lgd-points-right mt-3"
            style={{ "--dot-col": step.rightDotColor }}
            dangerouslySetInnerHTML={{ __html: step.rightPoints }}
          />
        </div>
      </div>
    </div>
  );
};


const FinalDiamondBlock = ({ data, finalImgRef }) => {
  return (
    <div
      className="lgd-final-block relative z-[1] bg-white"
      style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", margin: "0 8rem auto" }}
    >
      {/* Left — LGD */}
      <div className="lgd-final-col lgd-final-left text-left">
        <h3 className="font-abhaya font-semibold text-left mb-[60px] text-[#5A413F]" style={{ fontSize: "28px", margin: "0 0 60px 0" }}>
          {data.leftHeading}
        </h3>
        <ul className="list-none m-0 p-0">
          {data.leftPoints.map((pt, i) => (
            <li
              key={i}
              className="lgd-fl-li relative pl-5 leading-[22px] text-[#444]"
              style={{ fontSize: "12px", marginBottom: "15px", maxWidth: `${70 + i * 10}%` }}
            >
              <span
                className="absolute left-0 rounded-full bg-[#4CAF50]"
                style={{ top: "8px", width: "9px", height: "9px" }}
              />
              <span dangerouslySetInnerHTML={{ __html: pt }} />
            </li>
          ))}
        </ul>
      </div>

      {/* Center — Diamond Image */}
      <div
        className="lgd-final-diamond relative flex items-center justify-center"
        style={{ width: "400px", height: "400px" }}
      >
        <img
          ref={finalImgRef}
          src={data.image}
          alt="Final Diamond"
          className="lgd-final-diamond-img w-full h-auto block"
          loading="lazy"
        />
      </div>

      {/* Right — Mined */}
      <div className="lgd-final-col lgd-final-right text-right">
        <h3 className="font-abhaya font-semibold text-right text-[#5A413F]" style={{ fontSize: "28px", margin: "0 0 60px 0" }}>
          {data.rightHeading}
        </h3>
        <ul className="list-none m-0 p-0">
          {data.rightPoints.map((pt, i) => (
            <li
              key={i}
              className="lgd-fr-li relative pr-5 leading-[22px] text-right text-[#444]"
              style={{ fontSize: "12px", marginBottom: "15px", maxWidth: `${70 + i * 10}%`, marginLeft: "auto" }}
            >
              <span
                className="absolute right-0 rounded-full bg-[#F44336]"
                style={{ top: "8px", width: "9px", height: "9px" }}
              />
              <span dangerouslySetInnerHTML={{ __html: pt }} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function LgdMinePage() {
  const finalImgRef = useRef(null);

  const lastStepIconRef = useRef(null);
  const finalDiamondRef = useRef(null);

  return (
    <div className="w-full bg-white font-figtree">
      {/* ─────── SCOPED STYLES ─────── */}
      <style>{`
        /* ── Base Styles ── */
        .lgd-step {
          --icon-top: -23%;
          --icon-size: 35px;
        }

        .dp-blocks-wrapper {
          --wrapper-width: 70%;
        }

        .lgd-process-header {
          position: sticky;
          z-index: 2;
          margin-top: 30px;
          gap: 10px;
          min-height: 50px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* ── Bullet points ── */
        .lgd-points-left ul,
        .lgd-points-right ul {
          list-style: none;
          padding-left: 0;
          margin-top: 12px;
        }
        .lgd-points-left li,
        .lgd-points-right li {
          position: relative;
          max-width: 280px;
          padding-left: 15px;
          margin-bottom: 15px;
          line-height: 1.4;
          text-align: left;
          font-size: 0.875rem;
          color: #444;
        }
        .lgd-points-left li p,
        .lgd-points-right li p {
          margin: 0;
          line-height: inherit;
        }
        .lgd-points-left li::before {
          content: '';
          position: absolute;
          left: 0; top: 6px;
          width: 7px; height: 7px;
          border-radius: 50%;
          background-color: #4caf50;
        }
        .lgd-points-right li::before {
          content: '';
          position: absolute;
          left: 0; top: 6px;
          width: 7px; height: 7px;
          border-radius: 50%;
          background-color: #f44336;
        }

        /* ── Mobile: step blocks ── */
        @media (max-width: 768px) {
          .dp-blocks-wrapper {
            --wrapper-width: 95%;
          }
          .lgd-process-header {
            z-index: 20 !important;
            background: white !important;
            margin-top: 0 !important;
            padding-top: 1.25rem !important; /* pt-5 */
            top: 92px !important;
          }
          .lgd-step {
            gap: 10px !important;
            flex-direction: row !important;
            --icon-top: 14% !important;
            --icon-size: 20px !important;
          }
          .lgd-col {
            max-width: unset !important;
          }
          .lgd-col-heading {
            min-height: 21px !important;
            font-size: 14px !important;
          }
          .lgd-desc h2 {
            margin: 15px 0 5px 0 !important;
            font-size: 13px !important;
          }
          .lgd-desc p,
          .lgd-points-left li,
          .lgd-points-right li {
            font-size: 10px !important;
            line-height: 1.5 !important;
            max-width: 100% !important;
          }
          .lgd-center-wrap {
            position: absolute !important;
            width: 40px !important;
            height: auto !important;
            bottom: 48% !important;
          }
          .lgd-center-img {
            height: auto !important;
            width: 100% !important;
          }
          .lgd-points-right {
            display: flex;
            justify-content: flex-end;
          }
          .lgd-points-right li {
            text-align: right;
            padding-right: 15px !important;
            padding-left: 0 !important;
          }
          .lgd-desc .lgd-sub-title {
            text-align: left !important;
          }
          .lgd-col:last-child .lgd-sub-title {
            text-align: right !important;
          }
          .lgd-points-right li::before {
            left: unset;
            right: 0;
          }
          .lgd-desc h2:last-of-type {
            text-align: right;
          }

          /* Final block mobile */
          .lgd-final-block {
            display: flex !important;
            flex-wrap: wrap !important;
            flex-direction: column !important;
            margin: 0 2rem auto !important;
            gap: 20px !important;
          }
          .lgd-final-col { order: 0; }
          .lgd-final-left { order: 2; }
          .lgd-final-diamond { order: 1; width: 70% !important; height: auto !important; margin: 0 auto; }
          .lgd-final-right { order: 3; }
          .lgd-final-left h3,
          .lgd-final-right h3 {
            font-size: 23px !important;
            margin: 0 0 20px 0 !important;
            text-align: left !important;
          }
          .lgd-final-right h3 { text-align: left !important; }
          .lgd-fl-li,
          .lgd-fr-li {
            max-width: 100% !important;
            text-align: left !important;
            padding-right: 0 !important;
            padding-left: 20px !important;
          }
          .lgd-fr-li span:first-child {
            right: unset !important;
            left: 0 !important;
          }
        }

        @media (max-width: 550px) {
          .lgd-step { padding-top: 20px; min-height: unset !important; top: 285px !important; margin-top: 15px; }
          .lgd-col-heading { font-size: 12px !important; display: none !important; }
          .lgd-main-heading { font-size: 17px !important; }
          .lgd-sub-heading { font-size: 15px !important; }
        }

        @media (min-width: 1700px) {
          .lgd-col, .lgd-desc { max-width: 400px !important; }
        }
      `}</style>

      {/* ─────── BANNER ─────── */}
      <section
        className="relative w-full h-[535px] md:h-[605px] flex items-end justify-center bg-cover bg-center bg-no-repeat
          bg-[url('https://cdn.shopify.com/s/files/1/0739/8516/3482/files/LGD_vs_Mined_Diamond_Page_Banner_Mobile.png?v=1763528551')]
          md:bg-[url('https://cdn.shopify.com/s/files/1/0739/8516/3482/files/LGD_vs_Mined_Diamond_Page_Banner_Desktop.png?v=1763528534')]"
      >
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div className="relative z-20 text-center text-white p-5 pb-[10px] max-w-[800px] mb-[10px] md:mb-[20px]">
          <h1 className="font-abhaya text-[28px] md:text-[36px] font-medium leading-tight mb-3">
            LGD MINE
          </h1>
          <p className="text-[18px] md:text-[20px] leading-snug">
            A closer look at what truly separates them; from origin to ethics, purity and price
          </p>
        </div>
      </section>

      {/* ─────── PROCESS SECTION ─────── */}
      <div className="diamond-process-section w-full relative">

        {/* ── Wrapper (responsive width, centred) ── */}
        <div className="dp-blocks-wrapper mx-auto" style={{ width: "var(--wrapper-width, 70%)" }}>

          {/* Sticky heading row */}
          <div className="lgd-process-header">
            <h2
              className="lgd-main-heading font-abhaya font-semibold text-center text-[#5A413F]"
              style={{ fontSize: "28px", margin: "0 0 12px 0" }}
            >
              Two Journeys. One Diamond.
            </h2>
            <p
              className="lgd-sub-heading text-center text-[#555] mx-auto pb-4"
              style={{ fontSize: "18px", maxWidth: "700px", lineHeight: "22px" }}
            >
              Whether born in a lab or deep within the Earth, each diamond follows its own path. One shaped by science, the other by nature.
            </p>

            {/* Mobile-only Persistent Column Labels */}
            <div className="flex w-full justify-between mt-2 md:hidden px-0 border-t pt-2 bg-white pb-3">
              <span className="text-[11px] font-abhaya font-bold text-[#5A413F] uppercase tracking-wider">Lab Grown Diamonds</span>
              <span className="text-[11px] font-abhaya font-bold text-[#5A413F] uppercase tracking-wider">Mined Diamonds</span>
            </div>
          </div>

          {/* Steps */}
          {STEPS.map((step) => (
            <ImageStep key={step.id} step={step} lastStepIconRef={lastStepIconRef} />
          ))}
        </div>

        {/* ── Final heading ── */}
        <div className="relative z-[1] bg-white text-center py-6">
          <h2 className="font-abhaya font-semibold text-[#5A413F] mx-3" style={{ fontSize: "28px", margin: "0 12px 0" }}>
            What Sets Them Apart
          </h2>
          <p className="text-[16px] text-[#555] pb-[60px] mt-2">
            From origin and ethics to price and purity, here&apos;s how lab-grown diamonds offer a modern alternative to traditional mining.
          </p>
        </div>

        {/* ── Final comparison block ── */}
        <FinalDiamondBlock data={FINAL_BLOCK} finalImgRef={finalDiamondRef} />

        {/* ── Travel Animation Layer ── */}
        <TravelDiamond
          sourceRef={lastStepIconRef}
          targetRef={finalDiamondRef}
          image={FINAL_BLOCK.image}
        />

        {/* spacer */}
        <div className="h-20" />
      </div>
    </div>
  );
}