"use client";

import { useCallback, useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { SIZER_BG, PrimaryButton, Footer, StepHeader } from "./chrome";
import {
  IntroStep,
  FlatSurfaceStep,
  CalibrateStep,
  ChooseMethodStep,
  MeasureRingStep,
  MeasureStripStep,
  PaperIntroStep,
} from "./steps";
import { ResultStep } from "./ResultStep";
import { useRingSizerCalibration } from "@/hooks/useRingSizerCalibration";
import {
  computePxPerMm,
  pickCalibrationTarget,
  CARD_SHORT_MM,
  CALIBRATION_TARGETS,
} from "@/lib/ringSizer";

const RESULT_KEY = "lucira_ringsizer_result_v1";

/**
 * Linear step machine. Kept local rather than in Redux - the flow is
 * self-contained and only the final size is worth sharing with the rest of
 * the app.
 */
const STEPS = {
  INTRO: "INTRO",
  FLAT_SURFACE: "FLAT_SURFACE",
  CALIBRATE: "CALIBRATE",
  CHOOSE: "CHOOSE",
  MEASURE_RING: "MEASURE_RING",
  PAPER_INTRO: "PAPER_INTRO",
  MEASURE_STRIP: "MEASURE_STRIP",
  RESULT: "RESULT",
};

// Slider values are integers to avoid float drift; see ScaleSlider.
const INITIAL = {
  step: STEPS.INTRO,
  history: [],
  pxPerMmX100: 600, // 6.0 px/mm - close to most modern phones
  diameterMmX10: 179, // IND 16
  circumferenceMmX10: 563, // IND 16
  targetId: "card",
  result: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "GO":
      return { ...state, step: action.step, history: [...state.history, state.step] };
    case "BACK": {
      const history = [...state.history];
      const prev = history.pop();
      return prev ? { ...state, step: prev, history } : state;
    }
    case "SET":
      return { ...state, [action.key]: action.value };
    case "RESULT":
      return {
        ...state,
        result: action.result,
        step: STEPS.RESULT,
        history: [...state.history, state.step],
      };
    default:
      return state;
  }
}

export function RingSizerFlow({ onApplySize, onClose }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const calibration = useRingSizerCalibration();

  const go = useCallback((step) => dispatch({ type: "GO", step }), []);
  const back = useCallback(() => dispatch({ type: "BACK" }), []);
  const set = useCallback((key, value) => dispatch({ type: "SET", key, value }), []);

  // Seed the calibration slider from a stored value so a returning user sees
  // their own ratio rather than the generic 6.0 default.
  useEffect(() => {
    if (calibration.isReady && calibration.pxPerMm) {
      set("pxPerMmX100", Math.round(calibration.pxPerMm * 100));
    }
  }, [calibration.isReady, calibration.pxPerMm, set]);

  const pxPerMm = state.pxPerMmX100 / 100;

  /* Pick a sensible DEFAULT target once, from the viewport and the generic
     6.0 px/mm starting estimate. After mount the target is whatever the user
     selected - it must never track the slider, or dragging would change which
     physical object they are being asked to match. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const suggested = pickCalibrationTarget(window.innerWidth, INITIAL.pxPerMmX100 / 100);
    if (suggested.id !== "card") set("targetId", suggested.id);
  }, [set]);

  const commitCalibration = useCallback(() => {
    const referenceMm =
      state.targetId === "coin" ? CALIBRATION_TARGETS.coin.referenceMm : CARD_SHORT_MM;
    const ratio = computePxPerMm(referenceMm * pxPerMm, referenceMm);
    calibration.save(ratio);
    go(STEPS.CHOOSE);
  }, [calibration, go, pxPerMm, state.targetId]);

  const finish = useCallback(
    (result) => {
      dispatch({ type: "RESULT", result });
      if (result?.size) {
        try {
          window.localStorage.setItem(
            RESULT_KEY,
            JSON.stringify({ ind: result.size.ind, indLabel: result.size.indLabel, ts: Date.now() })
          );
        } catch {}
      }
    },
    []
  );

  const close = onClose ?? (() => router.back());

  /* Zoom guard. iOS Safari honours neither `user-scalable=no` nor
     `maximum-scale`, so a pinch can silently invalidate the calibration
     part-way through. Rather than let it produce a confidently wrong size,
     block the flow until the user resets. */
  if (calibration.isReady && calibration.isZoomed) {
    return (
      <Shell>
        <StepHeader onClose={close} />
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <h2 className="font-abhaya text-[24px] font-semibold text-[#3F2E2C]">
            Please reset the zoom
          </h2>
          <p className="mt-3 font-figtree text-[13px] leading-relaxed text-[#8A7670]">
            The page is zoomed to {Math.round(calibration.zoom * 100)}%, which changes how big
            things appear on screen. Pinch back to 100% so your measurement stays accurate.
          </p>
        </div>
        <Footer>
          <PrimaryButton onClick={() => window.location.reload()}>Try again</PrimaryButton>
        </Footer>
      </Shell>
    );
  }

  return (
    <Shell>
      {state.step === STEPS.INTRO && <IntroStep onNext={() => go(STEPS.FLAT_SURFACE)} />}

      {state.step === STEPS.FLAT_SURFACE && (
        <FlatSurfaceStep onBack={back} onNext={() => go(STEPS.CALIBRATE)} />
      )}

      {state.step === STEPS.CALIBRATE && (
        <CalibrateStep
          targetId={state.targetId}
          onTargetChange={(id) => set("targetId", id)}
          pxPerMmX100={state.pxPerMmX100}
          onChange={(v) => set("pxPerMmX100", v)}
          onBack={back}
          onNext={commitCalibration}
        />
      )}

      {state.step === STEPS.CHOOSE && (
        <ChooseMethodStep
          onBack={back}
          onPick={(mode) => go(mode === "ring" ? STEPS.MEASURE_RING : STEPS.PAPER_INTRO)}
        />
      )}

      {state.step === STEPS.MEASURE_RING && (
        <MeasureRingStep
          pxPerMm={pxPerMm}
          diameterMmX10={state.diameterMmX10}
          onChange={(v) => set("diameterMmX10", v)}
          onBack={back}
          onNext={finish}
        />
      )}

      {state.step === STEPS.PAPER_INTRO && (
        <PaperIntroStep onBack={back} onNext={() => go(STEPS.MEASURE_STRIP)} />
      )}

      {state.step === STEPS.MEASURE_STRIP && (
        <MeasureStripStep
          pxPerMm={pxPerMm}
          circumferenceMmX10={state.circumferenceMmX10}
          onChange={(v) => set("circumferenceMmX10", v)}
          onBack={back}
          onNext={finish}
        />
      )}

      {state.step === STEPS.RESULT && (
        <ResultStep result={state.result} onBack={back} onClose={close} onApply={onApplySize} />
      )}
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div
      className="mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden"
      style={{ background: SIZER_BG }}
    >
      {children}
    </div>
  );
}
