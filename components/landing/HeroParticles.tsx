'use client';

import { useEffect, useRef } from 'react';
import { sampleGradient } from '@/lib/themes';

/**
 * Hero canvas: the word AETHER assembled from thousands of glowing particles.
 * Particles spring towards sampled glyph positions, get swirled away by the
 * cursor, and blow apart into a vortex when `explodeRef.current()` is called.
 */

const BUCKETS = 32;
const LOOP_GRADIENT = ['#00f3ff', '#4d7cff', '#9d00ff', '#ff0099', '#ff6ec7', '#9d00ff', '#00f3ff'];
const SPRITE = 32;

function sprite(color: string) {
  const c = document.createElement('canvas');
  c.width = c.height = SPRITE;
  const g = c.getContext('2d')!;
  const r = SPRITE / 2;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  const rgba = (a: number) => color.replace('rgb(', 'rgba(').replace(')', `,${a})`);
  grad.addColorStop(0, rgba(1));
  grad.addColorStop(0.15, rgba(0.9));
  grad.addColorStop(0.35, rgba(0.25));
  grad.addColorStop(1, rgba(0));
  g.fillStyle = grad;
  g.fillRect(0, 0, SPRITE, SPRITE);
  return c;
}

export default function HeroParticles({
  explodeRef,
  text = 'AETHER',
}: {
  explodeRef: React.RefObject<(() => void) | null>;
  text?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    const sprites = sampleGradient(LOOP_GRADIENT, BUCKETS).map(sprite);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0;
    let h = 0;
    let n = 0;
    let x = new Float32Array(0);
    let y = new Float32Array(0);
    let vx = new Float32Array(0);
    let vy = new Float32Array(0);
    let hx = new Float32Array(0);
    let hy = new Float32Array(0);
    let sz = new Float32Array(0);
    let hue = new Float32Array(0);

    const STARS = 420;
    const sx = new Float32Array(STARS);
    const sy = new Float32Array(STARS);
    const sd = new Float32Array(STARS);

    const pointer = { x: -9999, y: -9999, px: -9999, py: -9999, active: false };
    let exploding = false;
    let explodeT = 0;
    let visible = true;
    let raf = 0;
    let fontFamily = 'sans-serif';

    const sampleText = () => {
      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const o = off.getContext('2d')!;
      const fs = Math.min(w * 0.165, h * 0.3, 260);
      o.font = `800 ${fs}px ${fontFamily}`;
      if ('letterSpacing' in o) (o as unknown as { letterSpacing: string }).letterSpacing = `${fs * 0.04}px`;
      o.textAlign = 'center';
      o.textBaseline = 'middle';
      o.fillStyle = '#fff';
      o.fillText(text, w / 2, h * 0.42);
      const data = o.getImageData(0, 0, w, h).data;
      const pts: number[] = [];
      let step = Math.max(3, Math.round(fs / 42));
      const collect = () => {
        pts.length = 0;
        for (let yy = 0; yy < h; yy += step) {
          for (let xx = 0; xx < w; xx += step) {
            if (data[(yy * w + xx) * 4 + 3] > 128) pts.push(xx, yy);
          }
        }
      };
      collect();
      while (pts.length / 2 > 6500) {
        step++;
        collect();
      }
      return pts;
    };

    const build = () => {
      const pts = sampleText();
      const count = pts.length / 2;
      const ox = x, oy = y, ovx = vx, ovy = vy, on = n;
      n = count;
      x = new Float32Array(n); y = new Float32Array(n);
      vx = new Float32Array(n); vy = new Float32Array(n);
      hx = new Float32Array(n); hy = new Float32Array(n);
      sz = new Float32Array(n); hue = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        hx[i] = pts[i * 2] + (Math.random() - 0.5) * 1.5;
        hy[i] = pts[i * 2 + 1] + (Math.random() - 0.5) * 1.5;
        if (i < on) {
          x[i] = ox[i]; y[i] = oy[i]; vx[i] = ovx[i]; vy[i] = ovy[i];
        } else {
          // Start scattered in a ring so the word condenses out of a cloud.
          const a = Math.random() * Math.PI * 2;
          const r = Math.max(w, h) * (0.35 + Math.random() * 0.5);
          x[i] = w / 2 + Math.cos(a) * r;
          y[i] = h * 0.42 + Math.sin(a) * r;
          vx[i] = -Math.sin(a) * 6;
          vy[i] = Math.cos(a) * 6;
        }
        sz[i] = Math.random() * 1.1 + 0.7;
        hue[i] = (hx[i] / w) * BUCKETS;
      }
      for (let i = 0; i < STARS; i++) {
        sx[i] = Math.random() * w;
        sy[i] = Math.random() * h;
        sd[i] = Math.random();
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#05050c';
      ctx.fillRect(0, 0, w, h);
      build();
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = pointer.y >= 0 && pointer.y <= rect.height;
    };
    const onLeave = () => {
      pointer.active = false;
    };

    let t0 = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const dt = Math.min((now - t0) / 16.667, 2.5);
      t0 = now;
      const t = now / 1000;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = exploding ? 'rgba(5,5,12,0.12)' : 'rgba(5,5,12,0.3)';
      ctx.fillRect(0, 0, w, h);

      // Starfield with a gentle parallax towards the cursor.
      const mx = pointer.active ? (pointer.x / w - 0.5) : 0;
      const my = pointer.active ? (pointer.y / h - 0.5) : 0;
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < STARS; i++) {
        const d = sd[i];
        let px = sx[i] - mx * d * 30;
        let py = sy[i] - my * d * 30;
        if (exploding) {
          // stars rush outward during the warp
          const dx = sx[i] - w / 2;
          const dy = sy[i] - h / 2;
          sx[i] += dx * 0.02 * explodeT * dt;
          sy[i] += dy * 0.02 * explodeT * dt;
          px = sx[i];
          py = sy[i];
        } else if (!reduceMotion) {
          sx[i] += (d * 0.12 + 0.02) * dt;
          if (sx[i] > w) sx[i] = 0;
        }
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.5 + d) + i));
        ctx.globalAlpha = (0.15 + d * 0.55) * tw;
        const s = d * 1.4 + 0.3;
        ctx.fillRect(px, py, s, s);
      }
      ctx.globalAlpha = 1;

      if (exploding) explodeT += 0.03 * dt;

      const R = Math.min(170, w * 0.18);
      const R2 = R * R;
      const pvx = pointer.x - pointer.px;
      const pvy = pointer.y - pointer.py;
      pointer.px = pointer.x;
      pointer.py = pointer.y;

      ctx.globalCompositeOperation = 'lighter';
      const shift = reduceMotion ? 0 : t * 4;
      const cx = w / 2;
      const cy = h * 0.42;

      for (let i = 0; i < n; i++) {
        let ax = 0;
        let ay = 0;
        if (exploding) {
          const dx = x[i] - cx;
          const dy = y[i] - cy;
          const d = Math.sqrt(dx * dx + dy * dy) + 1;
          const f = 0.25 + explodeT * 1.4;
          ax += (dx / d) * f - (dy / d) * f * 0.9;
          ay += (dy / d) * f + (dx / d) * f * 0.9;
        } else {
          const wave = reduceMotion ? 0 : Math.sin(t * 1.6 + hx[i] * 0.012) * 2.2;
          ax += (hx[i] - x[i]) * 0.014;
          ay += (hy[i] + wave - y[i]) * 0.014;
          if (pointer.active) {
            const dx = x[i] - pointer.x;
            const dy = y[i] - pointer.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < R2 && d2 > 1) {
              const d = Math.sqrt(d2);
              const f = (1 - d / R) * 2.6;
              ax += (dx / d) * f + (-dy / d) * f * 0.9 + pvx * 0.02;
              ay += (dy / d) * f + (dx / d) * f * 0.9 + pvy * 0.02;
            }
          }
        }
        vx[i] = (vx[i] + ax * dt) * (exploding ? 0.99 : 0.88);
        vy[i] = (vy[i] + ay * dt) * (exploding ? 0.99 : 0.88);
        x[i] += vx[i] * dt;
        y[i] += vy[i] * dt;

        const speed = Math.abs(vx[i]) + Math.abs(vy[i]);
        const b = (((hue[i] + shift) % BUCKETS) + BUCKETS) % BUCKETS | 0;
        const d = sz[i] * (5 + Math.min(speed, 8) * 0.5);
        ctx.drawImage(sprites[b], x[i] - d / 2, y[i] - d / 2, d, d);
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    explodeRef.current = () => {
      exploding = true;
      explodeT = 0;
    };

    let cancelled = false;
    const init = async () => {
      const fam = getComputedStyle(document.documentElement).getPropertyValue('--font-unbounded').trim();
      if (fam) {
        fontFamily = fam;
        try {
          await document.fonts.load(`800 100px ${fam}`);
        } catch {}
      }
      if (cancelled) return;
      resize();
      raf = requestAnimationFrame(frame);
    };
    init();

    const ro = new ResizeObserver(() => w && resize());
    ro.observe(canvas);
    window.addEventListener('pointermove', onMove);
    document.addEventListener('pointerleave', onLeave);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      explodeRef.current = null;
    };
  }, [explodeRef, text]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />;
}
