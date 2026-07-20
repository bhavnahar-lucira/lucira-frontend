"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CreditCard, PenLine, Scissors, Smartphone } from "lucide-react";
import { Bullets, Footer, PrimaryButton, Readout, StepHeader } from "./chrome";
import {
  FlatSurfaceIllustration,
  HasRingIllustration,
  IntroHero,
  NoRingIllustration,
  PaperToolsHero,
  RingGlyph,
  StripGlyph,
} from "./illustrations";
import { ScaleSlider } from "./ScaleSlider";
import {
  CARD_LONG_MM,
  CARD_RADIUS_MM,
  CARD_SHORT_MM,
  COIN_10_MM,
  diameterToRingSize,
  circumferenceToRingSize,
  formatMm,
} from "@/lib/ringSizer";

/* ========================================================================
 * Intro - "What you need"
 * ===================================================================== */

const NEED_MEASURE = [
  { label: "Mobile Phone", Icon: Smartphone },
  { label: "Ring / Paper strip", Icon: RingGlyph },
  { label: "Debit or Credit Card / ₹10 Coin", Icon: CreditCard },
];

const NEED_PAPER = [
  { label: "Paper Strip", Icon: StripGlyph },
  { label: "Pen / Marker", Icon: PenLine },
  { label: "Scissor / Cutter", Icon: Scissors },
];

function ChecklistSheet({ title, items, hero, onNext, cta = "Next" }) {
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="w-full">{hero}</div>

        <div className="-mt-6 rounded-t-[20px] bg-white px-6 pt-3 pb-6">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#DCCFC9]" />

          <h2 className="text-center font-abhaya text-[26px] leading-tight font-semibold text-[#3F2E2C]">
            {title}
          </h2>
          <p className="mt-1 text-center font-figtree text-[12px] text-[#8A7670]">
            Find diamond jewelry pieces that match your style.
          </p>

          <ul className="mt-7 space-y-5">
            {items.map(({ label, Icon }) => (
              <li key={label} className="flex items-center gap-4">
                <span
                  aria-hidden
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EFE4DF]"
                >
                  <Icon size={22} strokeWidth={1.5} color="#3F2E2C" />
                </span>
                <span className="font-figtree text-[13px] text-[#3F2E2C]">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white">
        <Footer>
          <PrimaryButton onClick={onNext}>{cta}</PrimaryButton>
        </Footer>
      </div>
    </>
  );
}

export function IntroStep({ onNext }) {
  return (
    <ChecklistSheet
      title="What you need"
      items={NEED_MEASURE}
      hero={<IntroHero className="w-full" />}
      onNext={onNext}
    />
  );
}

export function PaperIntroStep({ onNext, onBack }) {
  return (
    <>
      <StepHeader onBack={onBack} />
      <ChecklistSheet
        title="What you need"
        items={NEED_PAPER}
        hero={<PaperToolsHero className="w-full" />}
        onNext={onNext}
      />
    </>
  );
}

/* ========================================================================
 * Step 01 - flat surface
 * ===================================================================== */

export function FlatSurfaceStep({ onNext, onBack }) {
  return (
    <>
      <StepHeader step="Step 01" onBack={onBack} />
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <FlatSurfaceIllustration className="w-full max-w-[300px]" />
        <p className="mt-6 text-center font-figtree text-[13px] font-semibold text-[#3F2E2C]">
          Place Your Phone On A Flat Surface.
        </p>
        <p className="mt-2 max-w-[250px] text-center font-figtree text-[12px] text-[#8A7670]">
          Look straight down at the screen — viewing at an angle will skew your measurement.
        </p>
      </div>
      <Footer>
        <PrimaryButton onClick={onNext}>Next</PrimaryButton>
      </Footer>
    </>
  );
}

/* ========================================================================
 * Step 02 - calibration
 *
 * The card lies HORIZONTALLY across the screen, and deliberately does not fit:
 * its 85.6mm long edge is wider than any phone (the widest made, a 15 Pro Max,
 * is 71.2mm of glass across). So the outline has no right border - it runs off
 * the edge, and the card runs off with it.
 *
 * What gets measured is the card's 53.98mm SHORT edge, held between the top
 * and bottom borders. The left edge stays pinned; the slider drives the two
 * horizontal borders apart and together, and that gap is the whole
 * calibration:  pxPerMm = gapHeight / 53.98
 * ===================================================================== */

const CARD_BULLETS = [
  "Place your card in the highlighted area",
  "Keep it flat and avoid tilting",
  "Align it with the on-screen outline",
  "You're ready when the outline almost disappears",
];

const COIN_BULLETS = [
  "Place your ₹10 coin in the highlighted area",
  "Keep it flat and avoid tilting",
  "You're ready when the outline almost disappears",
];

const STAGE_INSET_PX = 24;

/**
 * The calibration target is a STABLE user choice, never derived from the
 * current slider value.
 *
 * Deriving it created a feedback loop: dragging the slider changed the
 * implied screen size, which flipped the target from card to coin mid-drag,
 * resizing the outline and rewriting the instructions underneath the user.
 * Whatever object they are physically holding cannot change because they
 * moved a slider.
 */
export function CalibrateStep({ pxPerMmX100, onChange, onNext, onBack, targetId, onTargetChange }) {
  const pxPerMm = pxPerMmX100 / 100;
  const isCoin = targetId === "coin";
  const referenceMm = isCoin ? COIN_10_MM : CARD_SHORT_MM;

  // The measured dimension is always the VERTICAL one.
  const heightPx = referenceMm * pxPerMm;
  const widthPx = isCoin ? heightPx : CARD_LONG_MM * pxPerMm;
  const radiusPx = isCoin ? heightPx / 2 : CARD_RADIUS_MM * pxPerMm;

  /**
   * Cap the slider so the gap always fits the stage vertically. Past that the
   * borders would clip and the user would be dragging with no feedback.
   *
   * Measured from the stage rather than the viewport because the stage is what
   * actually bounds the outline. No feedback loop: the stage is flex-sized by
   * its siblings and clips its contents, so the outline cannot grow it.
   */
  const stageRef = useRef(null);
  const [stage, setStage] = useState({ h: 0, w: 0 });
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const read = () => setStage({ h: el.clientHeight, w: el.clientWidth });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const stageH = stage.h;

  /**
   * On a real phone the card always runs off the right edge, which is why
   * there is no right border. On a wide or low-density screen (desktop
   * testing, tablets) it can fit - and a box that just stops with no border
   * reads as a rendering bug rather than an intentional overhang. So close it
   * off when it genuinely fits.
   */
  const overhangsRight = !isCoin && stage.w > 0 && STAGE_INSET_PX + widthPx > stage.w;
  const closeRightEdge = isCoin || !overhangsRight;

  const sliderMax = stageH
    ? Math.min(900, Math.floor(((stageH - 16) / referenceMm) * 100))
    : 900;

  // Keep the value legal when the target or the stage changes under it.
  useEffect(() => {
    if (stageH && pxPerMmX100 > sliderMax) onChange(sliderMax);
  }, [stageH, sliderMax, pxPerMmX100, onChange]);

  return (
    <>
      <StepHeader step="Step 02" onBack={onBack} />

      {/* Stage clips the outline's overhanging right side. The outline itself
          is shrink-0 - it is meant to overflow, not be squeezed to fit, or
          flex would quietly compress the declared 85.6mm width. */}
      <div ref={stageRef} className="relative flex flex-1 items-center overflow-hidden">
        <div
          className="relative shrink-0 border-y border-l border-dashed border-[#4A3A36] bg-[#D9D6D2]"
          style={{
            marginLeft: `${STAGE_INSET_PX}px`,
            width: `${widthPx}px`,
            height: `${heightPx}px`,
            borderTopLeftRadius: `${radiusPx}px`,
            borderBottomLeftRadius: `${radiusPx}px`,
            borderTopRightRadius: closeRightEdge ? `${radiusPx}px` : 0,
            borderBottomRightRadius: closeRightEdge ? `${radiusPx}px` : 0,
            borderRightWidth: closeRightEdge ? 1 : 0,
          }}
        >
          <div className="px-6 py-5">
            <Bullets items={isCoin ? COIN_BULLETS : CARD_BULLETS} />
          </div>
        </div>
      </div>

      <div className="px-6 pt-3">
        <p className="text-center font-figtree text-[12px] leading-relaxed text-[#8A7670]">
          {isCoin
            ? "Match your ₹10 coin to the outline."
            : "Lay your card flat across the screen — it will run off the right edge. Match its top and bottom edges to the outline."}
        </p>

        <button
          type="button"
          onClick={() => onTargetChange(isCoin ? "card" : "coin")}
          className="mx-auto mt-2 block border-b border-[#B49A91] pb-0.5 font-figtree text-[12px] text-[#5A413F]"
        >
          {isCoin ? "Use a card instead" : "Use a ₹10 coin instead"}
        </button>
      </div>

      <div className="px-5 pt-3 pb-2">
        <ScaleSlider value={pxPerMmX100} min={250} max={sliderMax} step={1} onChange={onChange} />
      </div>

      <Footer>
        <PrimaryButton onClick={onNext}>Next</PrimaryButton>
      </Footer>
    </>
  );
}

/* ========================================================================
 * Step 03 - branch
 * ===================================================================== */

export function ChooseMethodStep({ onPick, onBack }) {
  const Option = ({ label, sub, art, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="block w-full overflow-hidden rounded-[6px] border border-[#E3D3CC] bg-white text-left transition active:opacity-80"
    >
      {art}
      <div className="px-4 py-3">
        <p className="font-figtree text-[13px] font-semibold text-[#3F2E2C]">{label}</p>
        <p className="mt-0.5 font-figtree text-[11px] text-[#8A7670]">{sub}</p>
      </div>
    </button>
  );

  return (
    <>
      <StepHeader step="Step 03" onBack={onBack} />

      {/* Centred in the leftover space. The inner min-h-full wrapper is what
          does the centring rather than justify-center on the scroller itself -
          with justify-center, once the content grows taller than the viewport
          flexbox pushes the overflow above the scroll origin and the top card
          becomes unreachable. */}
      <div className="flex-1 overflow-y-auto px-5">
        <div className="flex min-h-full flex-col justify-center gap-4 py-4">
          <Option
            label="I have a ring"
            sub="Measure a ring that already fits you"
            art={<HasRingIllustration className="w-full" />}
            onClick={() => onPick("ring")}
          />
          <Option
            label="I don't have a ring"
            sub="Measure your finger with a paper strip"
            art={<NoRingIllustration className="w-full" />}
            onClick={() => onPick("strip")}
          />
          <p className="text-center font-figtree text-[12px] text-[#8A7670]">
            Choose anyone option
          </p>
        </div>
      </div>
    </>
  );
}

/* ========================================================================
 * Step 04a - measure an existing ring
 * ===================================================================== */

const RING_BULLETS = [
  "Place your ring in the highlighted area",
  "Keep it flat and avoid tilting",
  "Align it with the on-screen circle",
  "You're ready when the circle sits just inside your ring",
];

export function MeasureRingStep({ diameterMmX10, onChange, onNext, onBack, pxPerMm }) {
  const diameterMm = diameterMmX10 / 10;
  const result = useMemo(() => diameterToRingSize(diameterMm), [diameterMm]);
  const circlePx = diameterMm * pxPerMm;

  return (
    <>
      <StepHeader step="Step 04" onBack={onBack} />

      <div className="flex-1 overflow-y-auto">
        {/* Graph-paper stage: a fine 8px grid with a heavier line every 5th,
            so the circle has a stable visual reference as it scales. The
            crosshair through the centre gives the ring something to sit
            square against. */}
        <div className="px-5 pt-2">
          <div
            className="relative flex items-center justify-center overflow-hidden rounded-[4px] border border-dashed border-[#C9AFA6]"
            style={{
              minHeight: `${Math.max(circlePx + 64, 220)}px`,
              backgroundColor: "#FFFCFA",
              backgroundImage: [
                "linear-gradient(#E8DAD3 1px, transparent 1px)",
                "linear-gradient(90deg, #E8DAD3 1px, transparent 1px)",
                "linear-gradient(#C9AFA6 1px, transparent 1px)",
                "linear-gradient(90deg, #C9AFA6 1px, transparent 1px)",
              ].join(","),
              backgroundSize: "8px 8px, 8px 8px, 40px 40px, 40px 40px",
            }}
          >
            <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-[#8A7670]/50" />
            <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-[#8A7670]/50" />

            <div
              className="relative rounded-full border-[1.5px] border-[#3F2E2C]"
              style={{ width: `${circlePx}px`, height: `${circlePx}px` }}
            />
          </div>
        </div>

        <div className="px-6 pt-4">
          <Bullets items={RING_BULLETS} />
        </div>
      </div>

      <div className="px-5 pt-4 pb-2">
        <Readout
          primary={`${formatMm(diameterMm)} diameter`}
          sizeLabel={result.size?.indLabel}
        />
        <div className="mt-3">
          <ScaleSlider value={diameterMmX10} min={130} max={230} step={1} onChange={onChange} />
        </div>
      </div>

      <Footer>
        <PrimaryButton onClick={() => onNext(result)} disabled={!result.size}>
          Next
        </PrimaryButton>
      </Footer>
    </>
  );
}

/* ========================================================================
 * Step 04b - measure a paper strip
 * ===================================================================== */

const STRIP_BULLETS = [
  "Prepare a thin strip of paper",
  "Wrap it gently around your finger",
  "Mark the exact overlap point",
  "Align it with the measurement guide for your perfect fit",
];

export function MeasureStripStep({ circumferenceMmX10, onChange, onNext, onBack, pxPerMm }) {
  const circumferenceMm = circumferenceMmX10 / 10;
  const result = useMemo(() => circumferenceToRingSize(circumferenceMm), [circumferenceMm]);
  const lengthPx = circumferenceMm * pxPerMm;

  return (
    <>
      <StepHeader step="Step 04" onBack={onBack} />

      <div className="flex flex-1 gap-4 overflow-y-auto px-6 pt-2">
        <div className="flex-1 pt-2">
          <Bullets items={STRIP_BULLETS} />
        </div>

        {/* Vertical measuring guide. The user lays the strip alongside it and
            matches their pen mark to the lower cap. */}
        <div className="flex shrink-0 flex-col items-center justify-start pt-2">
          <div className="h-px w-6 bg-[#3F2E2C]" />
          <div className="w-[3px] rounded-full bg-[#C9AFA6]" style={{ height: `${lengthPx}px` }} />
          <div className="h-px w-6 bg-[#3F2E2C]" />
        </div>
      </div>

      <div className="px-5 pt-4 pb-2">
        <Readout
          primary={`${formatMm(circumferenceMm)} circumference`}
          sizeLabel={result.size?.indLabel}
        />
        <div className="mt-3">
          <ScaleSlider
            value={circumferenceMmX10}
            min={400}
            max={700}
            step={1}
            onChange={onChange}
          />
        </div>
      </div>

      <Footer>
        <PrimaryButton onClick={() => onNext(result)} disabled={!result.size}>
          Next
        </PrimaryButton>
      </Footer>
    </>
  );
}
