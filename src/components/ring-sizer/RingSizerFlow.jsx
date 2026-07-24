"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { RING_SIZER_CREATIVE, trackRingSizer } from "@/lib/ringSizerTracking";

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

export function RingSizerFlow({ onApplySize, onClose, products = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const calibration = useRingSizerCalibration();

  /* Which step the shopper abandoned on, read at exit time. Held in a ref so
     the close handler does not have to depend on state.step - otherwise it is
     rebuilt on every step change and every header re-renders with it. */
  const stepRef = useRef(state.step);
  stepRef.current = state.step;

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
    // pxPerMm is the single most diagnostic value here: if the live
    // distribution drifts away from the 5-7 range real phones produce, it is
    // the earliest signal that people are misreading the calibration step.
    trackRingSizer(RING_SIZER_CREATIVE.CALIBRATION_COMPLETED, {
      calibration_target: state.targetId,
      px_per_mm: Number(ratio.toFixed(3)),
    });
    go(STEPS.CHOOSE);
  }, [calibration, go, pxPerMm, state.targetId]);

  const finish = useCallback(
    (result, method) => {
      dispatch({ type: "RESULT", result });
      trackRingSizer(RING_SIZER_CREATIVE.SIZE_MEASURED, {
        method,
        ring_size: result?.size?.indLabel ?? null,
        measured_mm: result?.measuredMm ? Number(result.measuredMm.toFixed(2)) : null,
        confidence: result?.confidence ?? null,
      });
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

  /**
   * Where "exit the sizer" goes.
   *
   * Prefers the ?from= product the shopper arrived from, because router.back()
   * is unreliable here: a QR handoff opens the sizer as the first entry in a
   * fresh tab's history, so there is nothing behind it. Only same-site paths
   * are honoured, so a crafted ?from= cannot bounce anyone off-site.
   */
  const fromParam = searchParams?.get("from") || "";
  const returnTo = /^\/(?!\/)/.test(fromParam) ? fromParam : null;

  const close = useCallback(() => {
    trackRingSizer(RING_SIZER_CREATIVE.EXITED, { step: stepRef.current });
    if (onClose) return onClose();
    if (returnTo) return router.push(returnTo);
    if (typeof window !== "undefined" && window.history.length > 1) return router.back();
    router.push("/collections/rings");
  }, [onClose, returnTo, router]);

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
      {state.step === STEPS.INTRO && (
        <IntroStep
          onNext={() => {
            trackRingSizer(RING_SIZER_CREATIVE.STARTED);
            go(STEPS.FLAT_SURFACE);
          }}
          onClose={close}
        />
      )}

      {state.step === STEPS.FLAT_SURFACE && (
        <FlatSurfaceStep
          onBack={back}
          onClose={close}
          onNext={() => {
            trackRingSizer(RING_SIZER_CREATIVE.FLAT_SURFACE_NEXT);
            go(STEPS.CALIBRATE);
          }}
        />
      )}

      {state.step === STEPS.CALIBRATE && (
        <CalibrateStep
          onClose={close}
          targetId={state.targetId}
          onTargetChange={(id) => {
            trackRingSizer(RING_SIZER_CREATIVE.CALIBRATION_TARGET_CHANGED, { calibration_target: id });
            set("targetId", id);
          }}
          pxPerMmX100={state.pxPerMmX100}
          onChange={(v) => set("pxPerMmX100", v)}
          onBack={back}
          onNext={commitCalibration}
        />
      )}

      {state.step === STEPS.CHOOSE && (
        <ChooseMethodStep
          onClose={close}
          onBack={back}
          onPick={(mode) => {
            trackRingSizer(
              mode === "ring"
                ? RING_SIZER_CREATIVE.METHOD_RING
                : RING_SIZER_CREATIVE.METHOD_PAPER
            );
            go(mode === "ring" ? STEPS.MEASURE_RING : STEPS.PAPER_INTRO);
          }}
        />
      )}

      {state.step === STEPS.MEASURE_RING && (
        <MeasureRingStep
          onClose={close}
          pxPerMm={pxPerMm}
          diameterMmX10={state.diameterMmX10}
          onChange={(v) => set("diameterMmX10", v)}
          onBack={back}
          onNext={(r) => finish(r, "ring")}
        />
      )}

      {state.step === STEPS.PAPER_INTRO && (
        <PaperIntroStep
          onBack={back}
          onClose={close}
          onNext={() => {
            trackRingSizer(RING_SIZER_CREATIVE.PAPER_TOOLS_NEXT);
            go(STEPS.MEASURE_STRIP);
          }}
        />
      )}

      {state.step === STEPS.MEASURE_STRIP && (
        <MeasureStripStep
          onClose={close}
          pxPerMm={pxPerMm}
          circumferenceMmX10={state.circumferenceMmX10}
          onChange={(v) => set("circumferenceMmX10", v)}
          onBack={back}
          onNext={(r) => finish(r, "paper_strip")}
        />
      )}

      {state.step === STEPS.RESULT && (
        <ResultStep
          result={state.result}
          products={products}
          onBack={back}
          onClose={close}
          onApply={onApplySize}
        />
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
