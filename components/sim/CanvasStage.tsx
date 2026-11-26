'use client';

import { useEffect, useRef } from 'react';
import { useSimulationStore } from '@/lib/store/useSimulationStore';
import { ParticleEngine, symmetricPoints } from '@/lib/engine/ParticleEngine';
import { setEngine } from '@/lib/engine/engineRef';
import { uid } from '@/lib/engine/presets';
import { THEMES } from '@/lib/themes';
import { ForceNode } from '@/types/simulation';

const HIT_RADIUS = 26;

export default function CanvasStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const drag = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const erasing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const get = useSimulationStore.getState;

    const engine = new ParticleEngine(canvas, {
      getForces: () => get().forces,
      getSettings: () => get().settings,
      getTheme: () => THEMES[get().currentTheme],
      isPaused: () => get().isPaused,
    });
    engineRef.current = engine;
    setEngine(engine);

    const sync = () => {
      const s = get();
      engine.tool = s.activeTool;
      engine.showNodes = s.nodesVisible;
    };
    sync();
    const unsub = useSimulationStore.subscribe(sync);

    const resize = () => engine.resize(window.innerWidth, window.innerHeight);
    resize();
    window.addEventListener('resize', resize);
    engine.start();

    return () => {
      unsub();
      window.removeEventListener('resize', resize);
      engine.stop();
      setEngine(null);
      engineRef.current = null;
    };
  }, []);

  const pos = (e: React.PointerEvent | React.WheelEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const nodeAt = (x: number, y: number): ForceNode | null => {
    let best: ForceNode | null = null;
    let bestD = HIT_RADIUS;
    for (const f of useSimulationStore.getState().forces) {
      const d = Math.hypot(f.x - x, f.y - y);
      if (d < bestD) {
        best = f;
        bestD = d;
      }
    }
    return best;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const engine = engineRef.current;
    if (!engine) return;
    const { x, y } = pos(e);
    engine.pointer.x = x;
    engine.pointer.y = y;
    engine.pointer.inside = true;
    engine.brush.repel = e.shiftKey;

    const store = useSimulationStore.getState();
    if (drag.current) {
      store.updateForce(drag.current.id, { x: x - drag.current.ox, y: y - drag.current.oy });
      return;
    }
    if (erasing.current) {
      store.removeForceAt(x, y, 30);
    }
    engine.hoverId = nodeAt(x, y)?.id ?? null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const engine = engineRef.current;
    if (!engine) return;
    const { x, y } = pos(e);
    const store = useSimulationStore.getState();
    const tool = store.activeTool;
    const hit = nodeAt(x, y);
    canvasRef.current?.setPointerCapture(e.pointerId);
    engine.pointer = { x, y, inside: true };

    // Right click: delete the node under the cursor.
    if (e.button === 2) {
      if (hit) store.removeForce(hit.id);
      return;
    }
    if (e.button !== 0) return;

    if (tool === 'eraser') {
      erasing.current = true;
      store.removeForceAt(x, y, 30);
      return;
    }
    if (tool === 'brush') {
      engine.brush.active = true;
      engine.brush.repel = e.shiftKey;
      return;
    }
    if (tool === 'pulse') {
      engine.pulse(x, y, store.settings.nodeStrength / 1.6);
      return;
    }
    if (hit) {
      store.checkpoint();
      drag.current = { id: hit.id, ox: x - hit.x, oy: y - hit.y };
      return;
    }

    const sign = tool === 'vortex' && e.shiftKey ? -1 : 1;
    const pts = symmetricPoints(x, y, engine.width, engine.height, store.settings.symmetry);
    store.addForces(
      pts.map((p) => ({ id: uid(), x: p.x, y: p.y, type: tool, strength: store.settings.nodeStrength * sign })),
    );
  };

  const endPointer = () => {
    drag.current = null;
    erasing.current = false;
    if (engineRef.current) engineRef.current.brush.active = false;
  };

  const onWheel = (e: React.WheelEvent) => {
    const { x, y } = pos(e);
    const store = useSimulationStore.getState();
    const hit = nodeAt(x, y);
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    if (hit) {
      const sign = hit.strength < 0 ? -1 : 1;
      const mag = Math.min(8, Math.max(0.5, Math.abs(hit.strength) + delta));
      store.updateForce(hit.id, { strength: mag * sign });
    } else {
      const v = Math.min(8, Math.max(0.5, store.settings.nodeStrength + delta));
      store.setSetting('nodeStrength', Math.round(v * 100) / 100);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 h-full w-full cursor-none touch-none"
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onPointerLeave={() => {
        if (engineRef.current) engineRef.current.pointer.inside = false;
      }}
      onWheel={onWheel}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
