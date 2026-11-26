'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useSimulationStore } from '@/lib/store/useSimulationStore';

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: 'Tools',
    items: [
      ['1 – 7', 'Attractor · Repulsor · Vortex · Singularity · Shockwave · Brush · Eraser'],
      ['Click', 'Place a node / fire the tool'],
      ['Drag a node', 'Move it'],
      ['Scroll on a node', 'Tune its strength'],
      ['Scroll on empty space', 'Change new node strength'],
      ['Right-click a node', 'Delete it'],
      ['Shift', 'Reverse vortex spin · push with brush'],
    ],
  },
  {
    title: 'Simulation',
    items: [
      ['Space', 'Freeze / resume'],
      ['Ctrl / ⌘ + Z', 'Undo'],
      ['R', 'Random universe'],
      ['C', 'Clear all nodes'],
      ['B', 'Big bang'],
      ['P', 'Central shockwave'],
      ['X', 'Agitate particles'],
      ['S', 'Scatter particles'],
    ],
  },
  {
    title: 'View & capture',
    items: [
      ['T', 'Next theme'],
      ['V', 'Toggle velocity colouring'],
      ['N', 'Show / hide nodes'],
      ['O', 'Toggle settings panel'],
      ['H', 'Hide entire interface'],
      ['F', 'Fullscreen'],
      ['K', 'Save screenshot'],
      ['L', 'Start / stop video recording'],
      ['?', 'This help'],
    ],
  },
];

export default function HelpOverlay() {
  const open = useSimulationStore((s) => s.helpOpen);
  const setOpen = useSimulationStore((s) => s.setHelpOpen);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.96, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="aether-scroll max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#07070d]/90 p-6 text-white shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-wide">Controls</h2>
                <p className="mt-1 text-xs text-white/40">Everything in AETHER has a shortcut.</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {GROUPS.map((g) => (
                <div key={g.title}>
                  <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/35">{g.title}</div>
                  <ul className="space-y-2.5">
                    {g.items.map(([k, v]) => (
                      <li key={k} className="flex flex-col gap-1 text-xs">
                        <kbd className="w-fit rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/80">
                          {k}
                        </kbd>
                        <span className="text-white/55">{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
