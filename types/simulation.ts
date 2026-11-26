export type ForceType = 'attractor' | 'repulsor' | 'vortex' | 'singularity';

export type ActiveTool = ForceType | 'pulse' | 'brush' | 'eraser';

export type ThemeMode =
  | 'NEON'
  | 'FIRE'
  | 'OCEAN'
  | 'AURORA'
  | 'SYNTH'
  | 'NEBULA'
  | 'TOXIC'
  | 'MONO';

export type ColorMode = 'palette' | 'velocity';

export type EdgeMode = 'bounce' | 'wrap';

export type Symmetry = 1 | 2 | 4 | 6;

export type PresetId = 'galaxy' | 'binary' | 'blackhole' | 'nebula' | 'fountain' | 'chaos';

export type ThemeColors = {
  name: string;
  /** rgb triplet of the backdrop, used for trails */
  bg: [number, number, number];
  particles: string[];
  /** slow → fast gradient used in velocity colour mode */
  gradient: string[];
  attractor: string;
  repulsor: string;
  vortex: string;
  singularity: string;
  accent: string;
};

export type ForceNode = {
  id: string;
  x: number;
  y: number;
  type: ForceType;
  strength: number;
};

export type SimSettings = {
  particleCount: number;
  nodeStrength: number;
  friction: number;
  trail: number;
  timeScale: number;
  glow: number;
  edgeMode: EdgeMode;
  colorMode: ColorMode;
  symmetry: Symmetry;
};
