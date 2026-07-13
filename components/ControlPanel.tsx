'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Shuffle, Trash2, Eye, EyeOff, Radio, Target, Ban, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useSimulationStore } from '../lib/store/useSimulationStore';
import { ThemeMode } from '../types/simulation';

export default function ControlPanel() {
  const { 
    isPaused, togglePause, randomizeUniverse, clearForces, forces,
    activeTool, setActiveTool, currentTheme, setTheme, 
    sidebarOpen, toggleSidebar, nodesVisible, toggleNodesVisible
  } = useSimulationStore();

  const themesList: { id: ThemeMode; label: string }[] = [
    { id: 'NEON', label: 'Neon' },
    { id: 'FIRE', label: 'Fire' },
    { id: 'OCEAN', label: 'Ocean' },
    { id: 'MONO', label: 'Mono' }
  ];

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="fixed top-6 left-6 z-30 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 backdrop-blur-md text-white transition-all hover:bg-white/10"
      >
        {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
      </button>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -340, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed bottom-6 top-6 left-6 z-20 w-80 overflow-y-auto rounded-2xl border border-white/10 bg-black/60 p-6 text-white backdrop-blur-xl shadow-2xl transition-all"
          >
            <div className="mb-8 mt-12 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold tracking-widest text-white">AETHER</h1>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">Particle Simulator</p>
              </div>
              
              <button
                onClick={toggleNodesVisible}
                title={nodesVisible ? "Hide Nodes" : "Show Nodes"}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-all hover:bg-white/10 hover:text-white"
              >
                {nodesVisible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>

            <div className="mb-6 space-y-2 rounded-xl bg-white/5 p-4 border border-white/5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/40 uppercase tracking-wider">Info</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex justify-between items-center pt-2 text-sm border-t border-white/5">
                <span className="text-white/60">Field Array</span>
                <span className="font-mono text-xs font-semibold text-white">3,000 Pts</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/60">Active Field Nodes</span>
                <span className="font-mono text-xs font-semibold text-white">{forces.length}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2 font-medium">Tools</label>
              <div className="space-y-1.5">
                <button
                  onClick={() => setActiveTool('attractor')}
                  className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all ${
                    activeTool === 'attractor' 
                      ? 'bg-white/10 border-white/20 text-white font-medium shadow-lg' 
                      : 'bg-transparent border-transparent text-white/60 hover:bg-white/5'
                  }`}
                >
                  <Target size={16} />
                  <span>Attractor Node</span>
                </button>
                <button
                  onClick={() => setActiveTool('repulsor')}
                  className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all ${
                    activeTool === 'repulsor' 
                      ? 'bg-white/10 border-white/20 text-white font-medium shadow-lg' 
                      : 'bg-transparent border-transparent text-white/60 hover:bg-white/5'
                  }`}
                >
                  <Radio size={16} />
                  <span>Repulsor Node</span>
                </button>
                <button
                  onClick={() => setActiveTool('eraser')}
                  className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all ${
                    activeTool === 'eraser' 
                      ? 'bg-white/10 border-white/20 text-white font-medium shadow-lg' 
                      : 'bg-transparent border-transparent text-white/60 hover:bg-white/5'
                  }`}
                >
                  <Ban size={16} />
                  <span>Node Eraser</span>
                </button>
              </div>
            </div>

            <div className="mb-8">
              <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2 font-medium">Themes</label>
              <div className="grid grid-cols-2 gap-2">
                {themesList.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`px-3 py-2.5 rounded-xl border text-xs text-center transition-all ${
                      currentTheme === t.id
                        ? 'bg-white/10 border-white/20 text-white font-medium'
                        : 'bg-transparent border-white/5 text-white/50 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-white/10 pt-6">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={togglePause}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white text-black px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all hover:bg-white/90"
                >
                  {isPaused ? <Play size={14} /> : <Pause size={14} />}
                  <span>{isPaused ? 'Run' : 'Freeze'}</span>
                </button>

                <button
                  onClick={randomizeUniverse}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/10 text-white px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all hover:bg-white/20"
                >
                  <Shuffle size={14} />
                  <span>Generate</span>
                </button>
              </div>

              <button
                onClick={clearForces}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 text-white/40 px-4 py-2.5 text-xs uppercase tracking-wider transition-all hover:border-white/20 hover:text-white/60"
              >
                <Trash2 size={12} />
                <span>Clear Nodes</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}