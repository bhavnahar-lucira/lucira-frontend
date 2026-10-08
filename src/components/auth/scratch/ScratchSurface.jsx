"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const GRID = 20; // coverage is tracked on a 20×20 grid instead of reading pixels back
const COVER_FILL = "#5a413f";
const SPARK_COLORS = ["#f3d9b1", "#e6b85c", "#ffffff", "#d4a373"];

/**
 * Scratch-off layer drawn over its children-free parent (the ticket sits
 * underneath). Erases with a soft round brush, reports progress, and calls
 * onComplete once `threshold` of the card is cleared.
 *
 * Progress uses our own grid rather than getImageData, so the Shopify-CDN
 * cover never needs CORS and there is no per-move pixel read.
 */
export function ScratchSurface({
  coverSrc,
  enabled,
  revealed,
  threshold = 0.5,
  brushRadius = 22,
  onStart,
  onComplete,
}) {
  const reduce = useReducedMotion();
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const state = useRef({
    ctx: null, w: 0, h: 0, dpr: 1, drawing: false, last: null, started: false,
    scratched: false, done: false, cells: new Uint8Array(GRID * GRID), count: 0,
    lastSpark: 0, lastBuzzStep: 0,
  });
  const [started, setStarted] = useState(false);
  const [sparks, setSparks] = useState([]);

  // Paint the cover once. Re-running after a scratch would restore the ink, so
  // the image only lands if nothing has been scratched yet.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const s = state.current;
    const w = wrap.offsetWidth;
    const h = wrap.offsetHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.fillStyle = COVER_FILL;
    ctx.fillRect(0, 0, w, h);
    Object.assign(s, { ctx, w, h, dpr });

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (s.scratched) return;
      const scale = Math.max(w / img.width, h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    };
    img.src = coverSrc;
  }, [coverSrc]);

  const markCoverage = useCallback((x, y) => {
    const s = state.current;
    const cw = s.w / GRID;
    const ch = s.h / GRID;
    const r = brushRadius * 0.8;
    const x0 = Math.max(0, Math.floor((x - r) / cw));
    const x1 = Math.min(GRID - 1, Math.floor((x + r) / cw));
    const y0 = Math.max(0, Math.floor((y - r) / ch));
    const y1 = Math.min(GRID - 1, Math.floor((y + r) / ch));
    for (let gy = y0; gy <= y1; gy++) {
      for (let gx = x0; gx <= x1; gx++) {
        const cx = (gx + 0.5) * cw - x;
        const cy = (gy + 0.5) * ch - y;
        if (cx * cx + cy * cy <= r * r) {
          const i = gy * GRID + gx;
          if (!s.cells[i]) {
            s.cells[i] = 1;
            s.count++;
          }
        }
      }
    }
  }, [brushRadius]);

  const toLocal = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const s = state.current;
    // Parent may scale the card (keyboard open); map back to canvas CSS px.
    return {
      x: ((e.clientX - rect.left) * s.w) / rect.width,
      y: ((e.clientY - rect.top) * s.h) / rect.height,
    };
  };

  const scratch = (from, to) => {
    const s = state.current;
    const { ctx } = s;
    if (!ctx) return;
    s.scratched = true;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushRadius * 2;
    ctx.shadowColor = "#000";
    ctx.shadowBlur = brushRadius * 0.6 * s.dpr; // soft edge
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x + 0.01, to.y);
    ctx.stroke();

    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(dist / (brushRadius / 2)));
    for (let i = 0; i <= steps; i++) {
      markCoverage(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps);
    }

    const progress = s.count / (GRID * GRID);
    const buzzStep = Math.floor(progress * 100 / 15);
    if (buzzStep > s.lastBuzzStep) {
      s.lastBuzzStep = buzzStep;
      navigator.vibrate?.(8);
    }
    if (!s.done && progress >= threshold) {
      s.done = true;
      s.drawing = false;
      navigator.vibrate?.([20, 40, 30]);
      onComplete?.();
    }
  };

  const spawnSpark = (p) => {
    if (reduce) return;
    const s = state.current;
    const now = performance.now();
    if (now - s.lastSpark < 45) return;
    s.lastSpark = now;
    const id = `${now}-${Math.random()}`;
    const spark = {
      id,
      x: p.x,
      y: p.y,
      dx: (Math.random() - 0.5) * 40,
      dy: 18 + Math.random() * 26,
      size: 3 + Math.random() * 4,
      color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
    };
    setSparks((prev) => [...prev.slice(-18), spark]);
    setTimeout(() => setSparks((prev) => prev.filter((x) => x.id !== id)), 650);
  };

  const onPointerDown = (e) => {
    if (!enabled || revealed || state.current.done) return;
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    const p = toLocal(e);
    const s = state.current;
    s.drawing = true;
    s.last = p;
    if (!s.started) {
      s.started = true;
      setStarted(true);
      onStart?.();
    }
    scratch(p, p);
    spawnSpark(p);
  };

  const onPointerMove = (e) => {
    const s = state.current;
    if (!s.drawing) return;
    e.preventDefault();
    const p = toLocal(e);
    scratch(s.last, p);
    s.last = p;
    spawnSpark(p);
  };

  const endStroke = () => {
    state.current.drawing = false;
  };

  const interactive = enabled && !revealed;

  return (
    <motion.div
      ref={wrapRef}
      className="absolute inset-0 rounded-[12px] overflow-hidden"
      animate={revealed ? { opacity: 0, scale: 1.06 } : { opacity: 1, scale: 1 }}
      transition={{ duration: reduce ? 0 : 0.45, ease: "easeOut" }}
      style={{ pointerEvents: revealed ? "none" : "auto" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ touchAction: "none", cursor: interactive ? "grab" : "default" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onPointerLeave={endStroke}
      />

      {/* Idle shimmer sweep until the first scratch */}
      {!started && !reduce && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="lucira-scratch-shimmer absolute inset-y-0 -left-1/2 w-1/2" />
        </div>
      )}

      {/* "Scratch here" hint once unlocked */}
      <AnimatePresence>
        {interactive && !started && (
          <motion.div
            key="hint"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.svg
              width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round"
              animate={reduce ? {} : { x: [-34, 34, -20, 30, -34], y: [-8, 6, 14, -2, -8], rotate: [-8, 8, -4, 6, -8] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,.45))" }}
            >
              <path d="M18 11V6a2 2 0 0 0-4 0v1" />
              <path d="M14 10V4a2 2 0 0 0-4 0v2" />
              <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
              <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
            </motion.svg>
            <span className="mt-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-[12px] tracking-[0.5px]">
              Scratch here to reveal
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gold dust under the finger */}
      {sparks.map((sp) => (
        <motion.span
          key={sp.id}
          className="absolute rounded-full pointer-events-none"
          style={{ left: sp.x, top: sp.y, width: sp.size, height: sp.size, background: sp.color, boxShadow: `0 0 6px ${sp.color}` }}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          animate={{ opacity: 0, x: sp.dx, y: sp.dy, scale: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}

      <style>{`
        .lucira-scratch-shimmer {
          background: linear-gradient(100deg, transparent 0%, rgba(255,236,205,.28) 50%, transparent 100%);
          animation: luciraScratchShimmer 2.6s ease-in-out infinite;
        }
        @keyframes luciraScratchShimmer {
          0% { transform: translateX(0); }
          60%, 100% { transform: translateX(400%); }
        }
      `}</style>
    </motion.div>
  );
}
