'use client';

import { useEffect, useRef } from 'react';
import { ParticleEngine } from '@/lib/engine/ParticleEngine';
import { THEMES } from '@/lib/themes';
import { ForceNode, ForceType, SimSettings, ThemeMode } from '@/types/simulation';
import { DEFAULT_SETTINGS } from '@/lib/store/useSimulationStore';

/** A miniature live simulation with one force that follows the cursor on hover. */
export default function ForceDemo({
  type,
  theme = 'NEON',
  strength = 2.5,
  particles = 900,
  settings: overrides,
  wander = false,
}: {
  type: ForceType;
  theme?: ThemeMode;
  strength?: number;
  particles?: number;
  settings?: Partial<SimSettings>;
  /** Drift the force along a slow Lissajous path when the cursor is away. */
  wander?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const forces: ForceNode[] = [{ id: 'demo', x: 0, y: 0, type, strength }];
    let hovering = false;
    const settings: SimSettings = {
      ...DEFAULT_SETTINGS,
      particleCount: particles,
      edgeMode: 'wrap',
      trail: 0.7,
      ...overrides,
    };
    const engine = new ParticleEngine(canvas, {
      getForces: () => {
        if (wander && !hovering && engine.width) {
          const t = performance.now() / 1000;
          forces[0].x = engine.width * (0.5 + Math.sin(t * 0.7) * 0.32);
          forces[0].y = engine.height * (0.5 + Math.sin(t * 1.1 + 1) * 0.3);
        }
        return forces;
      },
      getSettings: () => settings,
      getTheme: () => THEMES[theme],
      isPaused: () => false,
    });
    engine.showCursor = false;
    const home = () => {
      forces[0].x = engine.width / 2;
      forces[0].y = engine.height / 2;
    };
    const resize = () => {
      const r = canvas.parentElement!.getBoundingClientRect();
      engine.resize(Math.max(1, r.width), Math.max(1, r.height), Math.min(window.devicePixelRatio || 1, 1.5));
      if (!hovering) home();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      hovering = true;
      forces[0].x = e.clientX - r.left;
      forces[0].y = e.clientY - r.top;
    };
    const onLeave = () => {
      hovering = false;
      home();
    };
    const onDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      engine.pulse(e.clientX - r.left, e.clientY - r.top, 1.2);
    };
    const host = canvas.parentElement!;
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);
    host.addEventListener('pointerdown', onDown);

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) engine.start();
      else engine.stop();
    });
    io.observe(canvas);

    return () => {
      io.disconnect();
      ro.disconnect();
      engine.stop();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      host.removeEventListener('pointerdown', onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, theme, strength, particles, wander]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}
