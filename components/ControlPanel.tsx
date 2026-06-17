'use client';

import { useSimulationStore } from '@/lib/store/useSimulationStore';
import { motion } from 'framer-motion';

import { Play, Pause, Shuffle, Trash2 } from 'lucide-react';

export default function ControlPanel() {
  const { isPaused, togglePause, randomizeUniverse, clearForces, forces } = useSimulationStore();

  return (
    <motion.div 
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-8 left-8 w-72 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 z-10 text-white shadow-2xl"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-500">
          AETHER
        </h1>
        <p className="text-xs text-white/50 uppercase tracking-widest mt-1">Kinetic Sandbox</p>
      </div>

      {/* Telemetry */}
      <div className="space-y-3 mb-8">
        <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
          <span className="text-white/60">Particles</span>
          <span className="font-mono text-cyan-400">1,500</span>
        </div>
        <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
          <span className="text-white/60">Active Forces</span>
          <span className="font-mono text-fuchsia-400">{forces.length}</span>
        </div>
        <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
          <span className="text-white/60">Status</span>
          <span className="font-mono text-emerald-400">{isPaused ? 'STANDBY' : 'ACTIVE'}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={togglePause}
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
        >
          {isPaused ? <Play size={20} className="mb-2" /> : <Pause size={20} className="mb-2" />}
          <span className="text-xs uppercase tracking-wider">{isPaused ? 'Resume' : 'Pause'}</span>
        </button>

        <button 
          onClick={randomizeUniverse}
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 transition-all"
        >
          <Shuffle size={20} className="mb-2" />
          <span className="text-xs uppercase tracking-wider">Generate</span>
        </button>

        <button 
          onClick={clearForces}
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all col-span-2 text-white/60 hover:text-white"
        >
          <Trash2 size={20} className="mb-2" />
          <span className="text-xs uppercase tracking-wider">Clear Forces</span>
        </button>
      </div>

      <div className="mt-6 text-[10px] text-white/30 text-center uppercase tracking-widest">
        Click canvas to add gravity well
      </div>
    </motion.div>
  );
}