import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ForceNode, ActiveTool, ThemeMode, SimSettings, Appearance } from '../../types/simulation';

export const DEFAULT_SETTINGS: SimSettings = {
  particleCount: 4000,
  nodeStrength: 2.5,
  friction: 0.975,
  trail: 0.55,
  timeScale: 1,
  glow: 1,
  edgeMode: 'bounce',
  colorMode: 'palette',
  symmetry: 1,
};

const HISTORY_LIMIT = 50;

interface SimulationState {
  isPaused: boolean;
  forces: ForceNode[];
  history: ForceNode[][];
  activeTool: ActiveTool;
  currentTheme: ThemeMode;
  appearance: Appearance;
  settings: SimSettings;
  panelOpen: boolean;
  uiHidden: boolean;
  nodesVisible: boolean;
  helpOpen: boolean;
  isRecording: boolean;

  togglePause: () => void;
  setActiveTool: (tool: ActiveTool) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleAppearance: () => void;
  togglePanel: () => void;
  toggleUi: () => void;
  toggleNodesVisible: () => void;
  setHelpOpen: (open: boolean) => void;
  setRecording: (rec: boolean) => void;

  setSetting: <K extends keyof SimSettings>(key: K, value: SimSettings[K]) => void;
  resetSettings: () => void;

  addForces: (forces: ForceNode[]) => void;
  setForces: (forces: ForceNode[]) => void;
  /** Live update without a history entry (used while dragging / scrolling). */
  updateForce: (id: string, patch: Partial<ForceNode>) => void;
  /** Push the current forces onto the undo stack (call before a drag begins). */
  checkpoint: () => void;
  removeForce: (id: string) => void;
  removeForceAt: (x: number, y: number, radius: number) => void;
  clearForces: () => void;
  undo: () => void;
}

const pushHistory = (s: SimulationState) => [...s.history, s.forces].slice(-HISTORY_LIMIT);

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set) => ({
      isPaused: false,
      forces: [],
      history: [],
      activeTool: 'attractor',
      currentTheme: 'NEON',
      appearance: 'dark',
      settings: DEFAULT_SETTINGS,
      panelOpen: true,
      uiHidden: false,
      nodesVisible: true,
      helpOpen: false,
      isRecording: false,

      togglePause: () => set((s) => ({ isPaused: !s.isPaused })),
      setActiveTool: (tool) => set({ activeTool: tool }),
      setTheme: (theme) => set({ currentTheme: theme }),
      toggleAppearance: () => set((s) => ({ appearance: s.appearance === 'dark' ? 'light' : 'dark' })),
      togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
      toggleUi: () => set((s) => ({ uiHidden: !s.uiHidden })),
      toggleNodesVisible: () => set((s) => ({ nodesVisible: !s.nodesVisible })),
      setHelpOpen: (open) => set({ helpOpen: open }),
      setRecording: (rec) => set({ isRecording: rec }),

      setSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

      addForces: (forces) => set((s) => ({ history: pushHistory(s), forces: [...s.forces, ...forces] })),
      setForces: (forces) => set((s) => ({ history: pushHistory(s), forces })),
      updateForce: (id, patch) =>
        set((s) => ({ forces: s.forces.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
      checkpoint: () => set((s) => ({ history: pushHistory(s) })),
      removeForce: (id) =>
        set((s) => ({ history: pushHistory(s), forces: s.forces.filter((f) => f.id !== id) })),
      removeForceAt: (x, y, radius) =>
        set((s) => {
          const next = s.forces.filter((f) => Math.hypot(f.x - x, f.y - y) > radius);
          if (next.length === s.forces.length) return {};
          return { history: pushHistory(s), forces: next };
        }),
      clearForces: () =>
        set((s) => (s.forces.length ? { history: pushHistory(s), forces: [] } : {})),
      undo: () =>
        set((s) => {
          if (!s.history.length) return {};
          return { forces: s.history[s.history.length - 1], history: s.history.slice(0, -1) };
        }),
    }),
    {
      name: 'aether-prefs',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ currentTheme: s.currentTheme, appearance: s.appearance, settings: s.settings }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SimulationState>;
        return {
          ...current,
          ...p,
          settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) },
        };
      },
      skipHydration: true,
    },
  ),
);
