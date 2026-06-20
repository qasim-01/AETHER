import { create } from 'zustand';
import { ForceNode, ActiveTool, ThemeMode } from '../../types/simulation';

interface SimulationState {
  isPaused: boolean;
  forces: ForceNode[];
  activeTool: ActiveTool;
  currentTheme: ThemeMode;
  sidebarOpen: boolean;
  triggerRandomize: number;
  togglePause: () => void;
  setActiveTool: (tool: ActiveTool) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleSidebar: () => void;
  addForce: (force: ForceNode) => void;
  removeForceAt: (x: number, y: number, radius: number) => void;
  clearForces: () => void;
  randomizeUniverse: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  isPaused: false,
  forces: [],
  activeTool: 'attractor',
  currentTheme: 'MONO',
  sidebarOpen: true,
  triggerRandomize: 0,
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setTheme: (theme) => set({ currentTheme: theme }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  addForce: (force) => set((state) => ({ forces: [...state.forces, force] })),
  removeForceAt: (x: number, y: number, radius: number) => set((state) => ({
    forces: state.forces.filter(f => {
      const dist = Math.sqrt((f.x - x) ** 2 + (f.y - y) ** 2);
      return dist > radius;
    })
  })),
  clearForces: () => set({ forces: [] }),
  randomizeUniverse: () => set((state) => ({ 
    triggerRandomize: state.triggerRandomize + 1,
    forces: []
  })),
}));