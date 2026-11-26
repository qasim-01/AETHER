'use client';

import { useEffect } from 'react';
import { useSimulationStore } from '@/lib/store/useSimulationStore';
import { THEME_ORDER } from '@/lib/themes';
import {
  randomize, bigBang, shockwaveCenter, shake, resetParticles, screenshot, toggleRecording, resetUniverse,
} from '@/lib/engine/actions';
import { TOOLS } from './tools';

export function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

export function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && (target as HTMLInputElement).type !== 'range') return;
      const s = useSimulationStore.getState();

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        s.undo();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const tool = TOOLS.find((t) => t.key === e.key);
      if (tool) {
        s.setActiveTool(tool.id);
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          s.togglePause();
          break;
        case 'Escape':
          s.setHelpOpen(false);
          break;
        case '0':
          resetUniverse();
          break;
        case '?':
          s.setHelpOpen(!s.helpOpen);
          break;
        default:
          switch (e.key.toLowerCase()) {
            case 'r': randomize(); break;
            case 'c': s.clearForces(); break;
            case 'b': bigBang(); break;
            case 'p': shockwaveCenter(); break;
            case 'x': shake(); break;
            case 's': resetParticles(); break;
            case 't': {
              const i = THEME_ORDER.indexOf(s.currentTheme);
              s.setTheme(THEME_ORDER[(i + (e.shiftKey ? -1 + THEME_ORDER.length : 1)) % THEME_ORDER.length]);
              break;
            }
            case 'v': s.setSetting('colorMode', s.settings.colorMode === 'palette' ? 'velocity' : 'palette'); break;
            case 'n': s.toggleNodesVisible(); break;
            case 'm': s.toggleAppearance(); break;
            case 'o': s.togglePanel(); break;
            case 'h': s.toggleUi(); break;
            case 'f': toggleFullscreen(); break;
            case 'k': screenshot(); break;
            case 'l': toggleRecording(); break;
          }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
