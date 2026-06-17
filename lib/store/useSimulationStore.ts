import { create } from "zustand";

import { ForceNode } from "../../types/simulation"

interface SimulationState {
    isPaused: boolean;
    forces: ForceNode[];
    triggerRandomize: number; // a trigger to tell the canvas to randomize

    togglePause: () => void;

    addForce: (force: ForceNode) => void;

    clearForces: () => void;

    randomizeUniverse: () => void;
}



export const useSimulationStore = create<SimulationState>((set) => ({
  isPaused: false,
  forces: [],

  triggerRandomize: 0,

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  addForce: (force) => set((state) => ({ forces: [...state.forces, force] })),
  clearForces: () => set({ forces: [] }),

  randomizeUniverse: () => set((state) => ({ 
    triggerRandomize: state.triggerRandomize + 1,
    forces: [] // the canvas will gen new based on trigger
  })),
}));