'use client';

import { useEffect, useState } from 'react';
import { getEngine } from '@/lib/engine/engineRef';
import { useSimulationStore } from '@/lib/store/useSimulationStore';
import { THEMES } from '@/lib/themes';
import { Glass } from './ui';

const HISTORY = 48;

export default function Hud() {
  const forces = useSimulationStore((s) => s.forces.length);
  const theme = THEMES[useSimulationStore((s) => s.currentTheme)];
  const [stats, setStats] = useState({ fps: 0, energy: 0, absorbed: 0, particles: 0 });
  const [spark, setSpark] = useState<number[]>([]);

  useEffect(() => {
    const id = setInterval(() => {
      const e = getEngine();
      if (!e) return;
      setStats({ ...e.stats });
      setSpark((s) => [...s, e.stats.energy].slice(-HISTORY));
    }, 250);
    return () => clearInterval(id);
  }, []);

  const max = Math.max(1, ...spark);
  const path = spark
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / (HISTORY - 1)) * 100},${28 - (v / max) * 24}`)
    .join(' ');

  const fpsColor = stats.fps > 50 ? '#34d399' : stats.fps > 30 ? '#fbbf24' : '#f87171';

  return (
    <Glass className="w-[220px] p-3.5 font-mono text-[11px]">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <Stat label="FPS" value={Math.round(stats.fps).toString()} color={fpsColor} />
        <Stat label="NODES" value={forces.toString()} />
        <Stat label="PARTICLES" value={stats.particles.toLocaleString()} />
        <Stat label="CONSUMED" value={stats.absorbed.toLocaleString()} />
      </div>
      <div className="mt-3 border-t border-white/5 pt-2.5">
        <div className="mb-1 flex justify-between text-[9px] tracking-widest text-white/35">
          <span>KINETIC ENERGY</span>
          <span className="text-white/60">{stats.energy.toFixed(2)}</span>
        </div>
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-7 w-full">
          <defs>
            <linearGradient id="hud-grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={theme.accent} stopOpacity="0.35" />
              <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          {spark.length > 1 && (
            <>
              <path d={`${path} L100,30 L0,30 Z`} fill="url(#hud-grad)" />
              <path d={path} fill="none" stroke={theme.accent} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
            </>
          )}
        </svg>
      </div>
    </Glass>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] tracking-widest text-white/35">{label}</span>
      <span className="text-sm text-white" style={color ? { color } : undefined}>
        {value}
      </span>
    </div>
  );
}
