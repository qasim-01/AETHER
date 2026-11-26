'use client';

import { motion } from 'framer-motion';
import { Pause, Play, Undo2, Trash2, Shuffle, RotateCcw } from 'lucide-react';
import { useSimulationStore } from '@/lib/store/useSimulationStore';
import { getTheme } from '@/lib/themes';
import { randomize, resetUniverse } from '@/lib/engine/actions';
import { TOOLS } from './tools';
import { IconButton, Glass } from './ui';

export default function Toolbar() {
  const activeTool = useSimulationStore((s) => s.activeTool);
  const setActiveTool = useSimulationStore((s) => s.setActiveTool);
  const theme = getTheme(useSimulationStore((s) => s.currentTheme), useSimulationStore((s) => s.appearance));
  const isPaused = useSimulationStore((s) => s.isPaused);
  const togglePause = useSimulationStore((s) => s.togglePause);
  const undo = useSimulationStore((s) => s.undo);
  const canUndo = useSimulationStore((s) => s.history.length > 0);
  const clearForces = useSimulationStore((s) => s.clearForces);

  return (
    <Glass className="flex items-center gap-1 p-1.5">
      {TOOLS.map((t) => {
        const active = t.id === activeTool;
        const color = t.color(theme);
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            aria-label={`${t.label} (${t.key})`}
            aria-pressed={active}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-ink/55 transition-colors hover:text-ink sm:h-11 sm:w-11"
          >
            {active && (
              <motion.span
                layoutId="tool-active"
                className="absolute inset-0 rounded-xl"
                style={{
                  background: `radial-gradient(circle at 50% 120%, ${color}55, ${color}10 70%)`,
                  boxShadow: `inset 0 0 0 1px ${color}66, 0 0 22px -6px ${color}`,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              />
            )}
            <Icon size={18} className="relative" style={active ? { color } : undefined} />
            <span className="absolute bottom-0.5 right-1 font-mono text-[8px] text-ink/30">{t.key}</span>
            <span className="pointer-events-none absolute top-full mt-3 whitespace-nowrap rounded-lg border border-ink/10 bg-panel/90 px-2.5 py-1 text-[11px] text-ink opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
              {t.label} <span className="ml-1 font-mono text-ink/40">{t.key}</span>
            </span>
          </button>
        );
      })}

      <div className="mx-1 h-7 w-px bg-ink/10" />

      <IconButton label={isPaused ? 'Resume (Space)' : 'Freeze (Space)'} onClick={togglePause} tooltip="bottom">
        {isPaused ? <Play size={17} /> : <Pause size={17} />}
      </IconButton>
      <IconButton label="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo} tooltip="bottom">
        <Undo2 size={17} />
      </IconButton>
      <IconButton label="Random universe (R)" onClick={randomize} tooltip="bottom">
        <Shuffle size={17} />
      </IconButton>
      <IconButton label="Clear nodes (C)" onClick={clearForces} tooltip="bottom">
        <Trash2 size={17} />
      </IconButton>
      <IconButton label="Reset to empty universe (0)" onClick={resetUniverse} tooltip="bottom">
        <RotateCcw size={17} />
      </IconButton>
    </Glass>
  );
}
