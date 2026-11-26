'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Camera, Video, Square, CircleHelp, Maximize, PanelRightClose, PanelRightOpen, EyeOff, Sun, Moon,
} from 'lucide-react';
import { useSimulationStore } from '@/lib/store/useSimulationStore';
import { getTheme } from '@/lib/themes';
import { loadPreset, screenshot, toggleRecording, canRecord } from '@/lib/engine/actions';
import CanvasStage from './CanvasStage';
import Toolbar from './Toolbar';
import SettingsPanel from './SettingsPanel';
import Hud from './Hud';
import HelpOverlay from './HelpOverlay';
import { Glass, IconButton } from './ui';
import { TOOLS } from './tools';
import { useShortcuts, toggleFullscreen } from './useShortcuts';

export default function SimulatorShell() {
  useShortcuts();
  const uiHidden = useSimulationStore((s) => s.uiHidden);
  const toggleUi = useSimulationStore((s) => s.toggleUi);
  const panelOpen = useSimulationStore((s) => s.panelOpen);
  const togglePanel = useSimulationStore((s) => s.togglePanel);
  const appearance = useSimulationStore((s) => s.appearance);
  const toggleAppearance = useSimulationStore((s) => s.toggleAppearance);
  const light = appearance === 'light';
  const setHelpOpen = useSimulationStore((s) => s.setHelpOpen);
  const isPaused = useSimulationStore((s) => s.isPaused);
  const isRecording = useSimulationStore((s) => s.isRecording);
  const activeTool = useSimulationStore((s) => s.activeTool);
  const theme = getTheme(useSimulationStore((s) => s.currentTheme), useSimulationStore((s) => s.appearance));
  const [recordSupported, setRecordSupported] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 1024 && useSimulationStore.getState().panelOpen) {
      useSimulationStore.getState().togglePanel();
    }
    Promise.resolve(useSimulationStore.persist.rehydrate()).then(() => {
      if (useSimulationStore.getState().forces.length === 0) loadPreset('galaxy');
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feature detection after mount
    setRecordSupported(canRecord());
  }, []);

  const hint = TOOLS.find((t) => t.id === activeTool)?.hint;

  return (
    <main className={`sim-root fixed inset-0 overflow-hidden text-ink ${light ? 'sim-light bg-[#f4f3ee]' : 'bg-black'}`}>
      <CanvasStage />
      <div
        className={`pointer-events-none fixed inset-0 z-[1] transition-opacity duration-500 ${
          light
            ? 'bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(120,110,90,0.14)_100%)]'
            : 'bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]'
        }`}
      />

      {/* Entry flash from the landing page warp */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-[60] bg-[#fff]"
        initial={{ opacity: 0.9 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />

      <AnimatePresence>
        {!uiHidden && (
          <motion.div
            key="ui"
            className="pointer-events-none fixed inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Top bar */}
            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
              <div className="pointer-events-auto flex items-center gap-2">
                <Link
                  href="/"
                  className="group flex h-12 items-center gap-3 rounded-2xl border border-ink/10 bg-panel/80 pl-3 pr-4 backdrop-blur-md transition-colors hover:border-ink/25"
                >
                  <ArrowLeft size={15} className="text-ink/40 transition-transform group-hover:-translate-x-0.5 group-hover:text-ink" />
                  <span className="font-display text-sm font-bold tracking-[0.35em]">AETHER</span>
                </Link>
                <div className="hidden h-12 items-center gap-2 rounded-2xl border border-ink/10 bg-panel/80 px-3.5 font-mono text-[10px] uppercase tracking-widest backdrop-blur-md md:flex">
                  {isRecording ? (
                    <>
                      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      <span className="text-red-400">Recording</span>
                    </>
                  ) : (
                    <>
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${isPaused ? '' : 'animate-pulse'}`}
                        style={{ background: isPaused ? '#fbbf24' : theme.accent }}
                      />
                      <span className="text-ink/50">{isPaused ? 'Frozen' : 'Live'}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="pointer-events-auto absolute left-1/2 top-4 hidden -translate-x-1/2 lg:block">
                <Toolbar />
              </div>

              <div className="pointer-events-auto">
                <Glass className="flex items-center gap-1 p-1.5">
                  <span className="contents lg:hidden">
                    <IconButton label="Screenshot (K)" onClick={screenshot} tooltip="none">
                      <Camera size={17} />
                    </IconButton>
                    <IconButton label="Controls (?)" onClick={() => setHelpOpen(true)} tooltip="none">
                      <CircleHelp size={17} />
                    </IconButton>
                  </span>
                  <IconButton label={light ? 'Dark mode (M)' : 'Light mode (M)'} onClick={toggleAppearance} tooltip="bottom">
                    {light ? <Moon size={17} /> : <Sun size={17} />}
                  </IconButton>
                  <IconButton label={panelOpen ? 'Hide settings (O)' : 'Show settings (O)'} onClick={togglePanel} tooltip="bottom">
                    {panelOpen ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
                  </IconButton>
                </Glass>
              </div>
            </div>

            {/* Toolbar on smaller screens */}
            <div className="pointer-events-auto absolute inset-x-0 bottom-4 flex justify-center px-2 lg:hidden">
              <div className="max-w-full overflow-x-auto">
                <Toolbar />
              </div>
            </div>

            {/* Settings panel */}
            <div className="absolute right-4 top-20">
              <SettingsPanel />
            </div>

            {/* HUD */}
            <div className="pointer-events-auto absolute bottom-4 left-4 hidden sm:block max-lg:bottom-24">
              <Hud />
            </div>

            {/* Tool hint */}
            <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 lg:block">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTool}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="rounded-full border border-ink/10 bg-panel/60 px-4 py-2 text-[11px] text-ink/60 backdrop-blur-md"
                >
                  {hint}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Capture + view controls */}
            <div className="pointer-events-auto absolute bottom-4 right-4 hidden lg:block">
              <Glass className="flex items-center gap-1 p-1.5">
                <IconButton label="Screenshot (K)" onClick={screenshot}>
                  <Camera size={17} />
                </IconButton>
                {recordSupported && (
                  <IconButton
                    label={isRecording ? 'Stop recording (L)' : 'Record video (L)'}
                    onClick={toggleRecording}
                    className={isRecording ? '!text-red-400' : ''}
                  >
                    {isRecording ? <Square size={15} fill="currentColor" /> : <Video size={17} />}
                  </IconButton>
                )}
                <IconButton label="Fullscreen (F)" onClick={toggleFullscreen}>
                  <Maximize size={17} />
                </IconButton>
                <IconButton label="Hide interface (H)" onClick={toggleUi}>
                  <EyeOff size={17} />
                </IconButton>
                <IconButton label="Controls (?)" onClick={() => setHelpOpen(true)}>
                  <CircleHelp size={17} />
                </IconButton>
              </Glass>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {uiHidden && (
          <motion.button
            key="show-ui"
            onClick={toggleUi}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
            exit={{ opacity: 0 }}
            className="fixed bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full border border-ink/10 bg-panel/50 px-4 py-2 text-[11px] text-ink/40 backdrop-blur transition-colors hover:text-ink"
          >
            Press <kbd className="font-mono text-ink/70">H</kbd> to show the interface
          </motion.button>
        )}
      </AnimatePresence>

      <HelpOverlay />
    </main>
  );
}
