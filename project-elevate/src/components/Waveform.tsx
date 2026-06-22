
import { useEffect, useRef } from "react";

interface WaveformProps {
  /** 0..1 — how much of the wave (from the right, RTL) is "lit" tape */
  progress?: number;
  /** drives amplitude; higher = livelier */
  energy?: number;
  bars?: number;
  className?: string;
  height?: number;
}

/**
 * The signature element: a living audio waveform on canvas.
 * Bars breathe continuously; `progress` lights them from the right
 * (RTL reading direction) to visualize the pipeline filling up.
 */
export function Waveform({
  progress = 1,
  energy = 1,
  bars = 56,
  className,
  height = 120,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);
  const energyRef = useRef(energy);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  useEffect(() => {
    energyRef.current = energy;
  }, [energy]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let t = 0;

    // per-bar phase seeds for organic motion
    const seeds = Array.from({ length: bars }, (_, i) => i * 1.7 + Math.sin(i));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      canvas.width = w * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const w = canvas.clientWidth;
      const h = height;
      ctx.clearRect(0, 0, w, h);

      const gap = 4;
      const barW = Math.max(1, (w - gap * (bars - 1)) / bars);
      const mid = h / 2;
      const e = energyRef.current;
      const prog = progressRef.current;

      for (let i = 0; i < bars; i++) {
        // RTL: bar 0 sits on the right edge
        const x = w - (i + 1) * barW - i * gap;
        const center = bars / 2;
        const falloff = 1 - Math.abs(i - center) / center; // taller in the middle
        const wave =
          Math.sin(t * 0.05 + seeds[i]) * 0.5 +
          Math.sin(t * 0.13 + seeds[i] * 0.7) * 0.5;
        const amp = (0.18 + 0.82 * Math.abs(wave) * falloff) * e;
        const barH = Math.max(3, amp * (h * 0.86));

        // RTL fill: rightmost `prog` fraction is lit
        const litFraction = i / bars;
        const lit = litFraction < prog;

        const grad = ctx.createLinearGradient(0, mid - barH / 2, 0, mid + barH / 2);
        if (lit) {
          grad.addColorStop(0, "#73ffb8");
          grad.addColorStop(0.5, "#2dd4a8");
          grad.addColorStop(1, "#0fc78f");
        } else {
          grad.addColorStop(0, "rgba(115,255,184,0.28)");
          grad.addColorStop(1, "rgba(45,212,168,0.10)");
        }
        ctx.fillStyle = grad;

        const r = Math.max(0, Math.min(barW / 2, 6));
        roundRect(ctx, x, mid - barH / 2, barW, barH, r);
        ctx.fill();
      }

      if (!reduce) t += 1;
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [bars, height]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height }}
      aria-hidden
    />
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
