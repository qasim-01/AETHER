import type { ParticleEngine } from './ParticleEngine';

/** Module-level handle so UI controls can issue imperative engine commands. */
let current: ParticleEngine | null = null;

export const setEngine = (e: ParticleEngine | null) => {
  current = e;
};

export const getEngine = () => current;
