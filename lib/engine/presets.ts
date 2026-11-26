import { ForceNode, PresetId } from '../../types/simulation';
import { SeedMode } from './ParticleEngine';

export type Preset = {
  id: PresetId;
  name: string;
  blurb: string;
  seed: SeedMode;
  build: (w: number, h: number) => Omit<ForceNode, 'id'>[];
};

const uid = () => Math.random().toString(36).slice(2, 11);

export const PRESETS: Preset[] = [
  {
    id: 'galaxy',
    name: 'Spiral Galaxy',
    blurb: 'A rotating disk around a central core',
    seed: 'disk',
    build: (w, h) => [
      { x: w / 2, y: h / 2, type: 'singularity', strength: 2.2 },
      { x: w / 2, y: h / 2, type: 'vortex', strength: 2.5 },
    ],
  },
  {
    id: 'binary',
    name: 'Binary Stars',
    blurb: 'Two wells trading matter',
    seed: 'binary',
    build: (w, h) => [
      { x: w / 2 - w * 0.17, y: h / 2, type: 'attractor', strength: 3 },
      { x: w / 2 + w * 0.17, y: h / 2, type: 'attractor', strength: 3 },
    ],
  },
  {
    id: 'blackhole',
    name: 'Event Horizon',
    blurb: 'Matter spirals in and is consumed',
    seed: 'ring',
    build: (w, h) => [{ x: w / 2, y: h / 2, type: 'singularity', strength: 4 }],
  },
  {
    id: 'nebula',
    name: 'Nebula',
    blurb: 'Counter-rotating gas vortices',
    seed: 'uniform',
    build: (w, h) => {
      const pts: Omit<ForceNode, 'id'>[] = [];
      const cols = 3;
      const rows = 2;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          pts.push({
            x: (w / cols) * (i + 0.5),
            y: (h / rows) * (j + 0.5),
            type: 'vortex',
            strength: (i + j) % 2 === 0 ? 3 : -3,
          });
        }
      }
      return pts;
    },
  },
  {
    id: 'fountain',
    name: 'Supernova',
    blurb: 'A blast ring caught by orbiting wells',
    seed: 'burst',
    build: (w, h) => {
      const r = Math.min(w, h) * 0.32;
      const out: Omit<ForceNode, 'id'>[] = [{ x: w / 2, y: h / 2, type: 'repulsor', strength: 2 }];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        out.push({ x: w / 2 + Math.cos(a) * r, y: h / 2 + Math.sin(a) * r, type: 'attractor', strength: 2.2 });
      }
      return out;
    },
  },
  {
    id: 'chaos',
    name: 'Chaos',
    blurb: 'A random universe every time',
    seed: 'uniform',
    build: (w, h) => {
      const types: ForceNode['type'][] = ['attractor', 'attractor', 'repulsor', 'vortex', 'singularity'];
      const count = 3 + Math.floor(Math.random() * 3);
      return Array.from({ length: count }, () => ({
        x: w * 0.15 + Math.random() * w * 0.7,
        y: h * 0.15 + Math.random() * h * 0.7,
        type: types[Math.floor(Math.random() * types.length)],
        strength: Math.random() * 2 + 1.5,
      }));
    },
  },
];

export function instantiate(preset: Preset, w: number, h: number): ForceNode[] {
  return preset.build(w, h).map((f) => ({ ...f, id: uid() }));
}

export { uid };
