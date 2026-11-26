'use client';

import { useEffect, useRef } from 'react';

/** Full-screen hyperspace jump. Calls `onComplete` once the screen has whited out. */
export default function WarpTransition({ onComplete, duration = 1300 }: { onComplete: () => void; duration?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const done = useRef(onComplete);

  useEffect(() => {
    done.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const COUNT = 900;
    const colors = ['#00f3ff', '#9d00ff', '#ff0099', '#ffffff', '#ffffff'];
    const stars = Array.from({ length: COUNT }, () => ({
      a: Math.random() * Math.PI * 2,
      r: Math.random() * Math.max(w, h) * 0.6 + 4,
      c: colors[(Math.random() * colors.length) | 0],
    }));

    const start = performance.now();
    let raf = 0;
    let fired = false;

    const frame = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const ease = p * p * p;
      ctx.fillStyle = `rgba(5,5,12,${0.35 - p * 0.25})`;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      const cx = w / 2;
      const cy = h / 2;
      const speed = 2 + ease * 80;
      for (const s of stars) {
        const r0 = s.r;
        s.r += speed * (0.2 + s.r / 300);
        const len = Math.min(s.r - r0, 400) * (0.5 + ease * 3);
        const x1 = cx + Math.cos(s.a) * s.r;
        const y1 = cy + Math.sin(s.a) * s.r;
        const x0 = cx + Math.cos(s.a) * Math.max(0, s.r - len);
        const y0 = cy + Math.sin(s.a) * Math.max(0, s.r - len);
        ctx.strokeStyle = s.c;
        ctx.globalAlpha = Math.min(1, 0.3 + p);
        ctx.lineWidth = 0.6 + ease * 2.2;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        if (s.r > Math.max(w, h)) {
          s.r = Math.random() * 40 + 2;
          s.a = Math.random() * Math.PI * 2;
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // Central glow builds into a white-out.
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * (0.1 + ease));
      glow.addColorStop(0, `rgba(255,255,255,${0.2 + ease * 0.8})`);
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      if (p > 0.82) {
        ctx.fillStyle = `rgba(255,255,255,${(p - 0.82) / 0.18})`;
        ctx.fillRect(0, 0, w, h);
      }

      if (p >= 1 && !fired) {
        fired = true;
        done.current();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  return <canvas ref={ref} className="fixed inset-0 z-[100] h-screen w-screen" aria-hidden />;
}
