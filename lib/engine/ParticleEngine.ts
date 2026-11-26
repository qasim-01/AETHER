import { ActiveTool, ForceNode, SimSettings, ThemeColors } from '../../types/simulation';
import { sampleGradient } from '../themes';

/**
 * AETHER particle engine.
 *
 * Framework-agnostic: React never touches the hot loop. The engine pulls the
 * current forces / settings / theme through getter callbacks every frame, so
 * UI state changes never restart the animation loop.
 *
 * Particles live in flat typed arrays (struct-of-arrays) and are rendered as
 * pre-baked radial glow sprites with additive blending.
 */

export type SeedMode = 'uniform' | 'disk' | 'ring' | 'burst' | 'binary';

export type EngineSources = {
  getForces: () => ForceNode[];
  getSettings: () => SimSettings;
  getTheme: () => ThemeColors;
  isPaused: () => boolean;
};

type Pulse = { x: number; y: number; r: number; max: number; strength: number };

const MAX_SPEED = 22;
const VELOCITY_BUCKETS = 24;
const SPRITE_SIZE = 32;

export const FORCE_RADIUS: Record<ForceNode['type'], number> = {
  attractor: 300,
  repulsor: 260,
  vortex: 340,
  singularity: 460,
};

export function horizonRadius(strength: number) {
  return 6 + strength * 3.2;
}

export function symmetricPoints(x: number, y: number, w: number, h: number, sym: number) {
  if (sym <= 1) return [{ x, y }];
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const pts: { x: number; y: number }[] = [];
  if (sym === 2) {
    pts.push({ x, y }, { x: cx - dx, y: cy - dy });
    return pts;
  }
  for (let i = 0; i < sym; i++) {
    const a = (i / sym) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    pts.push({ x: cx + dx * c - dy * s, y: cy + dx * s + dy * c });
  }
  return pts;
}

function makeSprite(color: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = SPRITE_SIZE;
  const g = c.getContext('2d')!;
  const r = SPRITE_SIZE / 2;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, color);
  grad.addColorStop(0.12, color);
  grad.addColorStop(0.3, withAlpha(color, 0.35));
  grad.addColorStop(0.6, withAlpha(color, 0.08));
  grad.addColorStop(1, withAlpha(color, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  return c;
}

function withAlpha(color: string, a: number) {
  if (color.startsWith('#')) {
    const h = color.slice(1);
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  return color.replace('rgb(', 'rgba(').replace(')', `,${a})`);
}

export class ParticleEngine {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  /** Optional trail-free layer for nodes and the cursor. */
  private overlay: HTMLCanvasElement | null;
  private octx: CanvasRenderingContext2D | null;
  /** Main + overlay merged each frame while recording video. */
  private composite: HTMLCanvasElement | null = null;
  private src: EngineSources;

  width = 0;
  height = 0;
  private dpr = 1;

  private n = 0;
  private x = new Float32Array(0);
  private y = new Float32Array(0);
  private vx = new Float32Array(0);
  private vy = new Float32Array(0);
  private size = new Float32Array(0);
  private col = new Uint8Array(0);

  private paletteSprites: HTMLCanvasElement[] = [];
  private velocitySprites: HTMLCanvasElement[] = [];
  private spriteTheme: ThemeColors | null = null;

  private pulses: Pulse[] = [];
  private raf: number | null = null;
  private lastTime = 0;
  private frameTimes: number[] = [];

  /** Interaction state, written by the UI layer. */
  pointer = { x: -9999, y: -9999, inside: false };
  tool: ActiveTool | null = null;
  hoverId: string | null = null;
  brush: { active: boolean; repel: boolean } = { active: false, repel: false };
  showNodes = true;
  showCursor = true;

  /** Live stats, polled by the HUD. */
  stats = { fps: 0, energy: 0, absorbed: 0, particles: 0 };

  constructor(canvas: HTMLCanvasElement, sources: EngineSources, overlay?: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.overlay = overlay ?? null;
    this.octx = overlay ? overlay.getContext('2d')! : null;
    this.src = sources;
  }

  // ───────────────────────────── lifecycle ─────────────────────────────

  resize(width: number, height: number, dpr = Math.min(window.devicePixelRatio || 1, 2)) {
    const first = this.width === 0;
    this.dpr = dpr;
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.width = width;
    this.height = height;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.overlay && this.octx) {
      this.overlay.width = this.canvas.width;
      this.overlay.height = this.canvas.height;
      this.overlay.style.width = `${width}px`;
      this.overlay.style.height = `${height}px`;
      this.octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (this.composite) {
      this.composite.width = this.canvas.width;
      this.composite.height = this.canvas.height;
    }
    this.clear();
    if (first) this.seed('uniform');
  }

  /** Wipe all trails back to the theme background. */
  clear() {
    const [r, g, b] = this.src.getTheme().bg;
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = `rgb(${r},${g},${b})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /** Start merging nodes into a single canvas each frame (for video capture). */
  startComposite() {
    if (!this.composite) {
      this.composite = document.createElement('canvas');
      this.composite.width = this.canvas.width;
      this.composite.height = this.canvas.height;
    }
    this.updateComposite();
    return this.composite;
  }

  stopComposite() {
    this.composite = null;
  }

  private updateComposite() {
    if (!this.composite) return;
    const c = this.composite.getContext('2d')!;
    c.drawImage(this.canvas, 0, 0);
    if (this.overlay) c.drawImage(this.overlay, 0, 0);
  }

  start() {
    if (this.raf !== null) return;
    this.lastTime = performance.now();
    const loop = (t: number) => {
      this.frame(t);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  // ───────────────────────────── particles ─────────────────────────────

  private allocate(count: number) {
    const keep = Math.min(this.n, count);
    const grow = <T extends Float32Array | Uint8Array>(old: T, Ctor: new (n: number) => T) => {
      const next = new Ctor(count);
      next.set(old.subarray(0, keep));
      return next;
    };
    this.x = grow(this.x, Float32Array);
    this.y = grow(this.y, Float32Array);
    this.vx = grow(this.vx, Float32Array);
    this.vy = grow(this.vy, Float32Array);
    this.size = grow(this.size, Float32Array);
    this.col = grow(this.col, Uint8Array);
    const prev = this.n;
    this.n = count;
    return prev;
  }

  /** Change particle count while keeping existing particles where they are. */
  setCount(count: number) {
    if (count === this.n) return;
    const prev = this.allocate(count);
    for (let i = prev; i < count; i++) this.spawnUniform(i);
  }

  private spawnUniform(i: number) {
    this.x[i] = Math.random() * this.width;
    this.y[i] = Math.random() * this.height;
    this.vx[i] = (Math.random() - 0.5) * 1.5;
    this.vy[i] = (Math.random() - 0.5) * 1.5;
    this.size[i] = Math.random() * 1.2 + 0.6;
    this.col[i] = (Math.random() * 4) | 0;
  }

  /** Respawn a particle on a random screen edge (used by singularities). */
  private spawnEdge(i: number) {
    const side = (Math.random() * 4) | 0;
    const w = this.width;
    const h = this.height;
    if (side === 0) { this.x[i] = Math.random() * w; this.y[i] = 1; }
    else if (side === 1) { this.x[i] = w - 1; this.y[i] = Math.random() * h; }
    else if (side === 2) { this.x[i] = Math.random() * w; this.y[i] = h - 1; }
    else { this.x[i] = 1; this.y[i] = Math.random() * h; }
    const dx = w / 2 - this.x[i];
    const dy = h / 2 - this.y[i];
    const d = Math.hypot(dx, dy) || 1;
    this.vx[i] = (dx / d) * 0.6 + (Math.random() - 0.5) * 0.8;
    this.vy[i] = (dy / d) * 0.6 + (Math.random() - 0.5) * 0.8;
  }

  seed(mode: SeedMode, count = this.src.getSettings().particleCount) {
    this.allocate(count);
    this.stats.absorbed = 0;
    this.pulses = [];
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.42;
    for (let i = 0; i < count; i++) {
      this.size[i] = Math.random() * 1.2 + 0.6;
      this.col[i] = (Math.random() * 4) | 0;
      if (mode === 'uniform') {
        this.spawnUniform(i);
      } else if (mode === 'disk' || mode === 'ring' || mode === 'binary') {
        let ox = cx;
        const oy = cy;
        let rr = R;
        if (mode === 'binary') {
          const left = i % 2 === 0;
          ox = cx + (left ? -1 : 1) * w * 0.17;
          rr = R * 0.55;
        }
        const a = Math.random() * Math.PI * 2;
        const rad = mode === 'ring'
          ? rr * (0.7 + Math.random() * 0.3)
          : rr * Math.sqrt(Math.random()) * 0.95 + 20;
        this.x[i] = ox + Math.cos(a) * rad;
        this.y[i] = oy + Math.sin(a) * rad;
        const v = 1.2 + Math.random() * 0.9;
        this.vx[i] = -Math.sin(a) * v;
        this.vy[i] = Math.cos(a) * v;
      } else if (mode === 'burst') {
        const a = Math.random() * Math.PI * 2;
        const v = Math.random() * 14 + 1;
        this.x[i] = cx + Math.cos(a) * 4;
        this.y[i] = cy + Math.sin(a) * 4;
        this.vx[i] = Math.cos(a) * v;
        this.vy[i] = Math.sin(a) * v;
      }
    }
  }

  // ───────────────────────────── effects ─────────────────────────────

  pulse(x: number, y: number, strength = 1) {
    this.pulses.push({ x, y, r: 0, max: 520 + strength * 60, strength });
  }

  /** Kick every particle with a random impulse. */
  shake(power = 6) {
    for (let i = 0; i < this.n; i++) {
      this.vx[i] += (Math.random() - 0.5) * power;
      this.vy[i] += (Math.random() - 0.5) * power;
    }
  }

  // ───────────────────────────── frame ─────────────────────────────

  private ensureSprites(theme: ThemeColors) {
    if (this.spriteTheme === theme) return;
    this.spriteTheme = theme;
    this.paletteSprites = theme.particles.map(makeSprite);
    this.velocitySprites = sampleGradient(theme.gradient, VELOCITY_BUCKETS).map(makeSprite);
  }

  private frame(now: number) {
    const dtMs = now - this.lastTime;
    this.lastTime = now;
    this.frameTimes.push(dtMs);
    if (this.frameTimes.length > 30) this.frameTimes.shift();

    const settings = this.src.getSettings();
    const theme = this.src.getTheme();
    const forces = this.src.getForces();
    const paused = this.src.isPaused();

    if (settings.particleCount !== this.n) this.setCount(settings.particleCount);
    this.ensureSprites(theme);

    // Frame-rate independent integration, clamped so tab switches don't explode things.
    const dt = Math.min(dtMs / 16.667, 2.5) * settings.timeScale;

    if (!paused) this.step(dt, forces, settings);
    this.render(theme, forces, settings, paused);

    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.stats.fps = avg > 0 ? 1000 / avg : 0;
    this.stats.particles = this.n;
  }

  private step(dt: number, forces: ForceNode[], s: SimSettings) {
    const { x, y, vx, vy, n, width: w, height: h } = this;
    const friction = Math.pow(s.friction, dt);
    const wrap = s.edgeMode === 'wrap';

    // Temporary brush force follows the pointer.
    const all = forces.slice();
    if (this.brush.active && this.pointer.inside) {
      all.push({
        id: '__brush',
        x: this.pointer.x,
        y: this.pointer.y,
        type: this.brush.repel ? 'repulsor' : 'attractor',
        strength: Math.max(s.nodeStrength, 2) * (this.brush.repel ? 2.2 : 1.1),
      });
    }

    // Unpack forces into flat arrays for the inner loop.
    const fc = all.length;
    const fx = new Float32Array(fc);
    const fy = new Float32Array(fc);
    const fs = new Float32Array(fc);
    const ft = new Uint8Array(fc);
    const fr2 = new Float32Array(fc);
    const fh2 = new Float32Array(fc);
    for (let k = 0; k < fc; k++) {
      const f = all[k];
      fx[k] = f.x;
      fy[k] = f.y;
      fs[k] = f.strength;
      ft[k] = f.type === 'attractor' ? 0 : f.type === 'repulsor' ? 1 : f.type === 'vortex' ? 2 : 3;
      const R = FORCE_RADIUS[f.type] * (0.75 + Math.abs(f.strength) * 0.1);
      fr2[k] = R * R;
      const hr = horizonRadius(f.strength);
      fh2[k] = hr * hr;
    }

    // Advance shockwaves.
    for (const p of this.pulses) p.r += 13 * dt;
    this.pulses = this.pulses.filter((p) => p.r < p.max);
    const pulses = this.pulses;

    let energy = 0;

    for (let i = 0; i < n; i++) {
      let px = x[i];
      let py = y[i];
      let ax = 0;
      let ay = 0;
      let damp = 1;
      let absorbed = false;

      for (let k = 0; k < fc; k++) {
        const dx = fx[k] - px;
        const dy = fy[k] - py;
        const d2 = dx * dx + dy * dy;
        if (d2 > fr2[k]) continue;
        const t = ft[k];
        if (t === 3 && d2 < fh2[k]) { absorbed = true; break; }
        if (d2 < 25) continue;
        const dist = Math.sqrt(d2);
        const ux = dx / dist;
        const uy = dy / dist;
        const st = fs[k];

        if (t === 0) {
          // Attractor: inverse-ish pull plus tangential swirl → accretion disks.
          const base = (st * 45) / (dist + 30) * 0.1;
          ax += ux * base * 1.2 - uy * base * 0.7;
          ay += uy * base * 1.2 + ux * base * 0.7;
          if (dist < 50) damp *= 0.92;
        } else if (t === 1) {
          const base = (st * 45) / (dist + 30) * 0.1;
          ax -= ux * base * 0.55;
          ay -= uy * base * 0.55;
        } else if (t === 2) {
          // Vortex: mostly tangential, gentle inward pull keeps a ring.
          const base = (st * 45) / (dist + 40) * 0.1;
          const inward = Math.abs(base) * 0.18;
          ax += -uy * base * 1.15 + ux * inward;
          ay += ux * base * 1.15 + uy * inward;
        } else {
          // Singularity: steep pull, strong spin, consumes what crosses the horizon.
          const base = (st * 60) / (dist + 14) * 0.1;
          ax += ux * base * 1.0 - uy * base * 0.8;
          ay += uy * base * 1.0 + ux * base * 0.8;
          if (dist < 90) damp *= 0.985;
        }
      }

      if (absorbed) {
        this.spawnEdge(i);
        this.stats.absorbed++;
        continue;
      }

      for (let k = 0; k < pulses.length; k++) {
        const p = pulses[k];
        const dx = px - p.x;
        const dy = py - p.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const band = Math.abs(d - p.r);
        if (band < 36 && d > 1) {
          const falloff = (1 - p.r / p.max) * (1 - band / 36);
          const kick = 2.4 * p.strength * falloff;
          ax += (dx / d) * kick;
          ay += (dy / d) * kick;
        }
      }

      let nvx = (vx[i] + ax * 10 * dt) * friction;
      let nvy = (vy[i] + ay * 10 * dt) * friction;
      if (damp !== 1) {
        const dd = Math.pow(damp, dt);
        nvx *= dd;
        nvy *= dd;
      }
      const sp2 = nvx * nvx + nvy * nvy;
      if (sp2 > MAX_SPEED * MAX_SPEED) {
        const f = MAX_SPEED / Math.sqrt(sp2);
        nvx *= f;
        nvy *= f;
      }
      energy += sp2;

      px += nvx * dt;
      py += nvy * dt;

      if (wrap) {
        if (px < 0) px += w; else if (px >= w) px -= w;
        if (py < 0) py += h; else if (py >= h) py -= h;
      } else {
        if (px <= 0) { px = 1; nvx = -nvx; }
        else if (px >= w) { px = w - 1; nvx = -nvx; }
        if (py <= 0) { py = 1; nvy = -nvy; }
        else if (py >= h) { py = h - 1; nvy = -nvy; }
      }

      x[i] = px;
      y[i] = py;
      vx[i] = nvx;
      vy[i] = nvy;
    }

    this.stats.energy = n > 0 ? energy / n : 0;
  }

  private render(theme: ThemeColors, forces: ForceNode[], s: SimSettings, paused: boolean) {
    const ctx = this.ctx;
    const { x, y, vx, vy, size, col, n } = this;
    const [br, bg, bb] = theme.bg;

    ctx.globalCompositeOperation = 'source-over';
    const fade = paused ? 0 : Math.max(0.06, 0.04 + (1 - s.trail) * 0.6);
    if (fade > 0 || paused) {
      ctx.fillStyle = `rgba(${br},${bg},${bb},${paused ? 1 : fade})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    const blend: GlobalCompositeOperation = theme.light ? 'multiply' : 'lighter';
    ctx.globalCompositeOperation = blend;
    const glow = s.glow;
    const scale = 5.2 * glow;
    const velocity = s.colorMode === 'velocity';
    const vs = this.velocitySprites;
    const ps = this.paletteSprites;
    const vmax = 12;

    for (let i = 0; i < n; i++) {
      let sprite: HTMLCanvasElement;
      if (velocity) {
        const sp = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]);
        const b = Math.min(VELOCITY_BUCKETS - 1, ((sp / vmax) * VELOCITY_BUCKETS) | 0);
        sprite = vs[b];
      } else {
        sprite = ps[col[i] % ps.length];
      }
      const d = size[i] * scale;
      ctx.drawImage(sprite, x[i] - d / 2, y[i] - d / 2, d, d);
    }

    // Shockwave rings.
    ctx.globalCompositeOperation = blend;
    for (const p of this.pulses) {
      const a = 1 - p.r / p.max;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.strokeStyle = withAlpha(theme.accent, a * 0.6);
      ctx.lineWidth = 2 + a * 4;
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';

    // Nodes and cursor go on the overlay (cleared every frame) so trails never smear them.
    const top = this.octx ?? ctx;
    if (this.octx) {
      this.octx.clearRect(0, 0, this.width, this.height);
    }
    if (this.showNodes) this.renderNodes(top, theme, forces);
    this.updateComposite();
    if (this.showCursor && this.pointer.inside && this.tool) this.renderCursor(top, theme, s);
  }

  private renderNodes(ctx: CanvasRenderingContext2D, theme: ThemeColors, forces: ForceNode[]) {
    const t = performance.now() / 1000;
    for (const f of forces) {
      const color = theme[f.type];
      const hovered = f.id === this.hoverId;
      const s = Math.abs(f.strength);
      const spin = f.strength < 0 ? -1 : 1;
      ctx.save();
      ctx.translate(f.x, f.y);

      if (f.type === 'singularity') {
        const hr = horizonRadius(s);
        const halo = ctx.createRadialGradient(0, 0, hr * 0.8, 0, 0, hr * 4);
        halo.addColorStop(0, withAlpha(color, 0.55));
        halo.addColorStop(0.25, withAlpha(color, 0.15));
        halo.addColorStop(1, withAlpha(color, 0));
        ctx.globalCompositeOperation = theme.light ? 'multiply' : 'lighter';
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, hr * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(0, 0, hr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = withAlpha(color, 0.9);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, hr + 1.5 + Math.sin(t * 3) * 0.8, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, 0, 4 + s * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.25;
        const ring = 14 + s * 2.5;

        if (f.type === 'attractor') {
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(0, 0, ring + Math.sin(t * 4) * 3, 0, Math.PI * 2);
          ctx.stroke();
          // inward-collapsing ring
          const ph = 1 - ((t * 0.8) % 1);
          ctx.globalAlpha = 0.5 * (1 - ph);
          ctx.beginPath();
          ctx.arc(0, 0, ring + ph * 26, 0, Math.PI * 2);
          ctx.stroke();
        } else if (f.type === 'repulsor') {
          for (let k = 0; k < 2; k++) {
            const ph = (t * 0.7 + k * 0.5) % 1;
            ctx.globalAlpha = 0.7 * (1 - ph);
            ctx.beginPath();
            ctx.arc(0, 0, ring * 0.6 + ph * 34, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else if (f.type === 'vortex') {
          ctx.globalAlpha = 0.85;
          ctx.rotate(t * 2.4 * spin);
          for (let k = 0; k < 3; k++) {
            ctx.beginPath();
            ctx.arc(0, 0, ring, (k * Math.PI * 2) / 3, (k * Math.PI * 2) / 3 + 1.1);
            ctx.stroke();
          }
        }
      }

      if (hovered) {
        ctx.globalAlpha = 1;
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = this.tool === 'eraser' ? '#ff4d6d' : theme.light ? '#1c1c2e' : '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 34 + s * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
  }

  private renderCursor(ctx: CanvasRenderingContext2D, theme: ThemeColors, s: SimSettings) {
    const tool = this.tool!;
    const color =
      tool === 'eraser' ? '#ff4d6d'
      : tool === 'pulse' || tool === 'brush' ? theme.accent
      : theme[tool];
    const pts = tool === 'eraser' || tool === 'pulse' || tool === 'brush'
      ? [this.pointer]
      : symmetricPoints(this.pointer.x, this.pointer.y, this.width, this.height, s.symmetry);

    pts.forEach((p, idx) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = idx === 0 ? 1 : 0.4;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.25;
      const r = tool === 'eraser' ? 22 : tool === 'brush' ? 28 : 11;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      if (idx === 0) {
        ctx.beginPath();
        ctx.moveTo(-r - 6, 0); ctx.lineTo(-r - 2, 0);
        ctx.moveTo(r + 2, 0); ctx.lineTo(r + 6, 0);
        ctx.moveTo(0, -r - 6); ctx.lineTo(0, -r - 2);
        ctx.moveTo(0, r + 2); ctx.lineTo(0, r + 6);
        ctx.stroke();
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  /** Capture the current frame as a PNG data URL. */
  snapshot() {
    if (!this.overlay) return this.canvas.toDataURL('image/png');
    const c = document.createElement('canvas');
    c.width = this.canvas.width;
    c.height = this.canvas.height;
    const g = c.getContext('2d')!;
    g.drawImage(this.canvas, 0, 0);
    if (this.showNodes) {
      // Redraw nodes without the cursor on top of the particle layer.
      g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.renderNodes(g, this.src.getTheme(), this.src.getForces());
    }
    return c.toDataURL('image/png');
  }
}
