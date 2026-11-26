import { ThemeColors, ThemeMode } from '../types/simulation';

export const THEMES: Record<ThemeMode, ThemeColors> = {
  NEON: {
    name: 'Neon',
    bg: [5, 5, 12],
    particles: ['#00f3ff', '#ff0099', '#9d00ff', '#ffffff'],
    gradient: ['#2a00ff', '#9d00ff', '#ff0099', '#00f3ff', '#ffffff'],
    attractor: '#00f3ff',
    repulsor: '#ff0099',
    vortex: '#9d00ff',
    singularity: '#ffffff',
    accent: '#00f3ff',
  },
  FIRE: {
    name: 'Fire',
    bg: [12, 4, 2],
    particles: ['#ff4500', '#ffaa00', '#ffdd00', '#ffffff'],
    gradient: ['#5a0a00', '#ff2a00', '#ff7b00', '#ffd000', '#fffbe0'],
    attractor: '#ffaa00',
    repulsor: '#ff4500',
    vortex: '#ffdd00',
    singularity: '#fff4d6',
    accent: '#ffaa00',
  },
  OCEAN: {
    name: 'Ocean',
    bg: [2, 8, 15],
    particles: ['#0055ff', '#00ffaa', '#00aaff', '#ffffff'],
    gradient: ['#001a66', '#0055ff', '#00aaff', '#00ffaa', '#e0fff6'],
    attractor: '#00ffaa',
    repulsor: '#0055ff',
    vortex: '#00aaff',
    singularity: '#e0fff6',
    accent: '#00ffaa',
  },
  AURORA: {
    name: 'Aurora',
    bg: [3, 8, 10],
    particles: ['#39ff9f', '#00d5ff', '#b26bff', '#e6fff4'],
    gradient: ['#0b3d3a', '#16c79a', '#39ff9f', '#b26bff', '#f0e6ff'],
    attractor: '#39ff9f',
    repulsor: '#b26bff',
    vortex: '#00d5ff',
    singularity: '#e6fff4',
    accent: '#39ff9f',
  },
  SYNTH: {
    name: 'Synthwave',
    bg: [10, 3, 16],
    particles: ['#ff2e97', '#ffb800', '#7b2dff', '#2de2e6'],
    gradient: ['#3a0ca3', '#7b2dff', '#ff2e97', '#ffb800', '#fff3b0'],
    attractor: '#2de2e6',
    repulsor: '#ff2e97',
    vortex: '#ffb800',
    singularity: '#fff3b0',
    accent: '#ff2e97',
  },
  NEBULA: {
    name: 'Nebula',
    bg: [6, 3, 12],
    particles: ['#ff6ec7', '#7d5fff', '#5ee7ff', '#ffd6f5'],
    gradient: ['#1b0b3a', '#7d5fff', '#ff6ec7', '#ffb3e6', '#ffffff'],
    attractor: '#ff6ec7',
    repulsor: '#5ee7ff',
    vortex: '#7d5fff',
    singularity: '#ffffff',
    accent: '#ff6ec7',
  },
  TOXIC: {
    name: 'Toxic',
    bg: [4, 8, 2],
    particles: ['#b6ff00', '#00ff6a', '#e5ff7a', '#ffffff'],
    gradient: ['#0f2a00', '#3fae00', '#b6ff00', '#e5ff7a', '#ffffff'],
    attractor: '#b6ff00',
    repulsor: '#00ff6a',
    vortex: '#e5ff7a',
    singularity: '#ffffff',
    accent: '#b6ff00',
  },
  MONO: {
    name: 'Mono',
    bg: [10, 10, 10],
    particles: ['#ffffff', '#aaaaaa', '#666666', '#d4d4d4'],
    gradient: ['#333333', '#666666', '#aaaaaa', '#dddddd', '#ffffff'],
    attractor: '#ffffff',
    repulsor: '#888888',
    vortex: '#bbbbbb',
    singularity: '#ffffff',
    accent: '#ffffff',
  },
};

export const THEME_ORDER: ThemeMode[] = ['NEON', 'FIRE', 'OCEAN', 'AURORA', 'SYNTH', 'NEBULA', 'TOXIC', 'MONO'];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Sample a multi-stop gradient into `steps` hex colours. */
export function sampleGradient(stops: string[], steps: number): string[] {
  const rgb = stops.map(hexToRgb);
  const out: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / (steps - 1)) * (rgb.length - 1);
    const a = Math.floor(t);
    const b = Math.min(a + 1, rgb.length - 1);
    const f = t - a;
    const c = rgb[a].map((v, k) => Math.round(v + (rgb[b][k] - v) * f));
    out.push(`rgb(${c[0]},${c[1]},${c[2]})`);
  }
  return out;
}

// ───────────────────────────── light mode ─────────────────────────────

const PAPER: [number, number, number] = [246, 245, 241];

function rgbToHsl([r, g, b]: [number, number, number]): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h /= 6;
  return [h, sat, l];
}

function hsl(h: number, sat: number, l: number) {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = sat * Math.min(l, 1 - l);
    return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Re-tune a colour for paper: keep its hue, push it to a rich mid-tone.
 * Near-greys (white in most palettes) borrow the theme accent's hue instead
 * of turning into flat black ink.
 */
function forPaper(hex: string, accentHue: number, lightness = 0.44) {
  const [h, sat, l] = rgbToHsl(hexToRgb(hex));
  if (sat < 0.15) {
    // Mono stays mono: map brightness to a graphite tone.
    return Number.isNaN(accentHue) ? hsl(0, 0, 0.12 + (1 - l) * 0.45) : hsl(accentHue, 0.55, 0.26);
  }
  return hsl(h, Math.min(1, Math.max(0.7, sat)), lightness);
}

const lightCache = new Map<ThemeMode, ThemeColors>();

/** The same palette, re-tuned for a light paper background. */
export function getTheme(mode: ThemeMode, appearance: 'dark' | 'light'): ThemeColors {
  const base = THEMES[mode];
  if (appearance === 'dark') return base;
  let t = lightCache.get(mode);
  if (!t) {
    const [ah, asat] = rgbToHsl(hexToRgb(base.accent));
    const accentHue = asat < 0.15 ? NaN : ah;
    const paper = (c: string, l?: number) => forPaper(c, accentHue, l);
    // Velocity: slow particles are a soft tint, fast ones a deep saturated tone.
    const stops = base.gradient.filter((c) => rgbToHsl(hexToRgb(c))[1] >= 0.15);
    const src = stops.length >= 2 ? stops : base.gradient;
    const gradient = src.map((c, i) => paper(c, 0.72 - (i / (src.length - 1)) * 0.36));
    t = {
      ...base,
      bg: PAPER,
      particles: base.particles.map((c) => paper(c)),
      gradient,
      attractor: paper(base.attractor, 0.4),
      repulsor: paper(base.repulsor, 0.4),
      vortex: paper(base.vortex, 0.4),
      singularity: '#16161f',
      accent: paper(base.accent, 0.38),
      light: true,
    };
    lightCache.set(mode, t);
  }
  return t;
}
