'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, Atom, Camera, Infinity as InfinityIcon, Keyboard, Layers, MousePointer2, Sparkles, Undo2, Zap, Gauge,
} from 'lucide-react';
import HeroParticles from './HeroParticles';
import WarpTransition from './WarpTransition';
import ForceDemo from './ForceDemo';
import OrbitDiagram from './OrbitDiagram';
import { THEMES, THEME_ORDER } from '@/lib/themes';
import { useSimulationStore } from '@/lib/store/useSimulationStore';
import { ForceType } from '@/types/simulation';

const FORCES: { type: ForceType; name: string; key: string; desc: string; color: string; strength: number }[] = [
  {
    type: 'attractor',
    name: 'Attractor',
    key: '01',
    desc: 'Pull plus tangential swirl. Matter settles into glowing accretion disks instead of collapsing to a point.',
    color: THEMES.NEON.attractor,
    strength: 2.8,
  },
  {
    type: 'repulsor',
    name: 'Repulsor',
    key: '02',
    desc: 'Pushes matter away and carves voids through the field. Combine with wells to sculpt filaments.',
    color: THEMES.NEON.repulsor,
    strength: 3.5,
  },
  {
    type: 'vortex',
    name: 'Vortex',
    key: '03',
    desc: 'Almost pure rotation. Spins particles into rings and cyclones, clockwise or counter-clockwise.',
    color: THEMES.NEON.vortex,
    strength: 3,
  },
  {
    type: 'singularity',
    name: 'Singularity',
    key: '04',
    desc: 'A black hole. Anything that crosses the event horizon is consumed and reborn at the edge of the universe.',
    color: '#ffffff',
    strength: 2.4,
  },
];

const FEATURES = [
  { icon: Gauge, title: '15,000 particles', body: 'Typed-array physics and sprite-batched additive rendering keep it smooth at 60 FPS.' },
  { icon: Sparkles, title: 'Six cosmic presets', body: 'Spiral galaxies, binary stars, supernovae, event horizons and pure chaos in one click.' },
  { icon: Layers, title: 'Kaleidoscope symmetry', body: 'Mirror every node you place 2, 4 or 6 times around the centre to grow mandalas.' },
  { icon: Zap, title: 'Shockwaves & brushes', body: 'Fire expanding blast rings, or paint gravity directly with your cursor.' },
  { icon: Camera, title: 'Capture & record', body: 'Save stills or record your universe straight to video with one key.' },
  { icon: Keyboard, title: 'Built for flow', body: 'Undo, drag and scroll-to-tune nodes. Every action has a shortcut.' },
];

const MARQUEE = [
  'Accretion disks', 'Inverse-square fields', 'Event horizons', 'Tangential swirl', 'Shockwaves',
  'Velocity colouring', 'Kaleidoscope mode', 'Long-exposure trails', 'Video capture', 'Eight themes',
];

export default function LandingPage() {
  const router = useRouter();
  const explodeRef = useRef<(() => void) | null>(null);
  const [warping, setWarping] = useState(false);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [scrolled, setScrolled] = useState(false);
  const theme = useSimulationStore((s) => s.currentTheme);
  const setTheme = useSimulationStore((s) => s.setTheme);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroFade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroLift = useTransform(scrollYProgress, [0, 1], [0, -120]);

  useEffect(() => {
    useSimulationStore.persist.rehydrate();
    router.prefetch('/sim');
    const onScroll = () => setScrolled(window.scrollY > 40);
    const onMove = (e: PointerEvent) => setPointer({ x: e.clientX, y: e.clientY });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onMove);
    };
  }, [router]);

  const enter = useCallback(() => {
    if (warping) return;
    explodeRef.current?.();
    setTimeout(() => setWarping(true), window.scrollY < 200 ? 350 : 0);
  }, [warping]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#05050c] text-white">
      {/* ─────────── Nav ─────────── */}
      <nav
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
          scrolled ? 'border-b border-white/5 bg-[#05050c]/70 backdrop-blur-xl' : ''
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-sm font-bold tracking-[0.4em]">AETHER</span>
          </Link>
          <div className="hidden items-center gap-8 text-[13px] text-white/55 md:flex">
            <a href="#forces" className="transition-colors hover:text-white">Forces</a>
            <a href="#physics" className="transition-colors hover:text-white">Physics</a>
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#themes" className="transition-colors hover:text-white">Themes</a>
          </div>
          <button
            onClick={enter}
            className="group flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[13px] font-medium backdrop-blur transition-all hover:border-white/40 hover:bg-white/10"
          >
            Launch
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </nav>

      {/* ─────────── Hero ─────────── */}
      <section ref={heroRef} className="relative h-[100svh] min-h-[560px] w-full overflow-hidden">
        <HeroParticles explodeRef={explodeRef} />
        <div className="aether-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#05050c_100%)]" />
        <h1 className="sr-only">AETHER — kinetic particle universe</h1>

        <HudFrame pointer={pointer} />

        <motion.div
          style={{ opacity: heroFade, y: heroLift }}
          className="pointer-events-none absolute inset-x-0 top-[58%] flex flex-col items-center px-6 text-center sm:top-[60%]"
        >
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="max-w-xl text-balance text-base text-white/65 sm:text-lg"
          >
            A kinetic particle universe in your browser. Bend light and matter with gravity wells, vortices and
            black holes.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.8 }}
            className="pointer-events-auto mt-8 flex flex-col items-center gap-3 sm:flex-row"
          >
            <EnterButton onClick={enter} />
            <a
              href="#forces"
              className="rounded-full px-6 py-3.5 text-sm text-white/60 transition-colors hover:text-white"
            >
              Explore the physics ↓
            </a>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="mt-6 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/30 sm:flex"
          >
            <MousePointer2 size={11} /> Move your cursor through the word
          </motion.p>
        </motion.div>
      </section>

      {/* ─────────── Marquee ─────────── */}
      <div className="relative border-y border-white/5 bg-white/[0.015] py-5">
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap font-display text-sm uppercase tracking-[0.25em] text-white/30">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="flex items-center gap-12">
              {m}
              <span className="text-[#00f3ff]/60">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─────────── Forces ─────────── */}
      <section id="forces" className="relative mx-auto max-w-7xl scroll-mt-16 px-5 py-28 sm:px-8 sm:py-36">
        <SectionHeading
          eyebrow="Fundamental forces"
          title={<>Four forces.<br className="sm:hidden" /> Infinite universes.</>}
          body="Every node you place bends the field around it. These are live simulations: move your cursor inside each one, click to fire a shockwave."
        />
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FORCES.map((f, i) => (
            <motion.div
              key={f.type}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className="group relative h-[420px] cursor-crosshair overflow-hidden rounded-3xl border border-white/10 bg-[#07070d] transition-colors hover:border-white/25"
            >
              <ForceDemo
                type={f.type}
                strength={f.strength}
                particles={f.type === 'singularity' ? 1100 : 900}
                wander={f.type === 'repulsor'}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#05050c] via-[#05050c]/80 to-transparent" />
              <div className="pointer-events-none absolute left-5 top-5 font-mono text-[10px] tracking-[0.25em] text-white/35">
                F/{f.key}
              </div>
              <div
                className="pointer-events-none absolute right-5 top-5 h-2 w-2 rounded-full"
                style={{ background: f.color, boxShadow: `0 0 12px ${f.color}` }}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6">
                <h3 className="font-display text-xl font-semibold" style={{ color: f.color }}>
                  {f.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─────────── Physics ─────────── */}
      <section id="physics" className="relative scroll-mt-16 overflow-hidden border-y border-white/5 bg-[#06060e] py-28 sm:py-36">
        <div className="aether-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Under the hood"
              title="Orbits, not slingshots."
              body="Naive attraction pulls particles straight in and flings them out the other side. AETHER splits every force into a radial pull and a perpendicular tangent, so matter falls into stable, glowing orbits."
            />
            <div className="mt-10 space-y-3">
              <Formula label="Field strength" math={<>F = <V>k</V> · <V>s</V> ⁄ (<V>d</V> + ε)</>} />
              <Formula
                label="Direction"
                math={<>û = (Δx, Δy) ⁄ <V>d</V> &nbsp;·&nbsp; τ̂ = (−û<sub>y</sub>, û<sub>x</sub>)</>}
              />
              <Formula label="Acceleration" math={<>a = F · (1.2 û + 0.7 τ̂)</>} />
              <Formula label="Drag" math={<>v ← v · μ<sup>Δt</sup></>} />
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative mx-auto aspect-square w-full max-w-[520px]"
          >
            <OrbitDiagram />
          </motion.div>
        </div>
      </section>

      {/* ─────────── Features ─────────── */}
      <section id="features" className="relative mx-auto max-w-7xl scroll-mt-16 px-5 py-28 sm:px-8 sm:py-36">
        <SectionHeading
          eyebrow="The sandbox"
          title="Everything you need to play god."
          body="A complete instrument panel for building, tuning and capturing your own universes."
        />
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: (i % 3) * 0.08, duration: 0.6 }}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-7 transition-all hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(0,243,255,0.18),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#00f3ff]/15 to-[#9d00ff]/15">
                  <Icon size={19} className="text-[#7ff9ff]" />
                </div>
                <h3 className="mt-6 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{f.body}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─────────── Themes ─────────── */}
      <section id="themes" className="relative scroll-mt-16 border-t border-white/5 py-28 sm:py-36">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            eyebrow="Palettes"
            title="Paint with light."
            body="Eight hand-tuned themes. Pick one here and the simulator will open in it."
          />
          <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="grid grid-cols-4 gap-3 self-center">
              {THEME_ORDER.map((id) => {
                const t = THEMES[id];
                const active = id === theme;
                return (
                  <button
                    key={id}
                    onClick={() => setTheme(id)}
                    className={`group flex flex-col items-center gap-3 rounded-2xl border p-4 transition-all ${
                      active ? 'border-white/30 bg-white/[0.06]' : 'border-white/5 hover:border-white/15'
                    }`}
                  >
                    <span
                      className="relative h-12 w-12 rounded-full transition-transform duration-500 group-hover:rotate-180 group-hover:scale-110"
                      style={{
                        background: `conic-gradient(${t.gradient.join(', ')}, ${t.gradient[0]})`,
                        boxShadow: active ? `0 0 30px -4px ${t.accent}` : `0 0 18px -10px ${t.accent}`,
                      }}
                    >
                      <span className="absolute inset-[3px] rounded-full bg-[#05050c]/30 backdrop-blur-[1px]" />
                    </span>
                    <span className={`text-xs ${active ? 'text-white' : 'text-white/45'}`}>{t.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="relative h-[380px] overflow-hidden rounded-3xl border border-white/10 bg-black">
              <ForceDemo
                key={theme}
                type="attractor"
                theme={theme}
                strength={3.2}
                particles={1800}
                settings={{ colorMode: 'velocity', trail: 0.8, glow: 0.85 }}
              />
              <div className="pointer-events-none absolute left-5 top-5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/60 backdrop-blur">
                {THEMES[theme].name} · velocity mode
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── Final CTA ─────────── */}
      <section className="relative overflow-hidden py-32 sm:py-44">
        <Portal />
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-white/40">The field is waiting</p>
          <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Step into the <span className="text-glow bg-gradient-to-r from-[#00f3ff] via-[#9d00ff] to-[#ff0099] bg-clip-text text-transparent">Aether</span>
          </h2>
          <p className="mt-6 max-w-md text-white/55">No install, no sign-up. Just you, fifteen thousand particles and the laws of physics.</p>
          <div className="mt-10">
            <EnterButton onClick={enter} large />
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 text-xs text-white/35 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5">
            <LogoMark small />
            <span className="font-display tracking-[0.35em] text-white/60">AETHER</span>
          </div>
          <span className="flex items-center gap-2">
            <Atom size={12} /> Built with Next.js, Canvas 2D and a lot of vector math
          </span>
          <span className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Undo2 size={12} /> Ctrl+Z friendly</span>
            <span className="flex items-center gap-1.5"><InfinityIcon size={12} /> Free forever</span>
          </span>
        </div>
      </footer>

      {warping && <WarpTransition onComplete={() => router.push('/sim')} />}
    </div>
  );
}

// ───────────────────────────── pieces ─────────────────────────────

function V({ children }: { children: React.ReactNode }) {
  return <span className="italic text-[#7ff9ff]">{children}</span>;
}

function Formula({ label, math }: { label: string; math: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-black/40 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">{label}</span>
      <span className="font-serif text-lg text-white/90">{math}</span>
    </motion.div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
  align = 'center',
}: {
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  align?: 'center' | 'left';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7 }}
      className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'}
    >
      <div className={`flex items-center gap-3 ${align === 'center' ? 'justify-center' : ''}`}>
        <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#00f3ff]" />
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#7ff9ff]/80">{eyebrow}</span>
        <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#00f3ff]" />
      </div>
      <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{title}</h2>
      <p className="mt-5 text-base leading-relaxed text-white/50 sm:text-lg">{body}</p>
    </motion.div>
  );
}

function EnterButton({ onClick, large }: { onClick: () => void; large?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`group relative isolate overflow-hidden rounded-full p-px font-medium ${large ? 'text-base' : 'text-sm'}`}
    >
      <span className="animate-spin-slow absolute inset-[-200%] -z-10 bg-[conic-gradient(from_0deg,#00f3ff,#9d00ff,#ff0099,#00f3ff)]" />
      <span
        className={`flex items-center gap-3 rounded-full bg-[#07070d] transition-colors group-hover:bg-[#0d0d1a] ${
          large ? 'px-9 py-4.5' : 'px-7 py-3.5'
        }`}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00f3ff] opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00f3ff]" />
        </span>
        Enter the simulator
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </span>
      <span className="absolute inset-0 -z-20 rounded-full bg-[#00f3ff]/40 opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
    </button>
  );
}

function LogoMark({ small }: { small?: boolean }) {
  const s = small ? 18 : 22;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="2.6" fill="#00f3ff" />
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#9d00ff" strokeWidth="1.2" transform="rotate(30 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#ff0099" strokeWidth="1.2" transform="rotate(-30 12 12)" opacity="0.8" />
    </svg>
  );
}

function HudFrame({ pointer }: { pointer: { x: number; y: number } }) {
  const corner = 'absolute h-6 w-6 border-white/25';
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 1 }}
      className="pointer-events-none absolute inset-4 hidden font-mono text-[10px] uppercase tracking-[0.25em] text-white/30 sm:inset-8 sm:block"
    >
      <span className={`${corner} left-0 top-16 border-l border-t`} />
      <span className={`${corner} right-0 top-16 border-r border-t`} />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span className={`${corner} bottom-0 right-0 border-b border-r`} />
      <div className="absolute left-8 top-20">
        Sector 00 · Kinetic field
      </div>
      <div className="absolute right-8 top-20 flex items-center gap-2">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Field online
      </div>
      <div className="absolute bottom-4 left-8 tabular-nums">
        x {pointer.x.toString().padStart(4, '0')} · y {pointer.y.toString().padStart(4, '0')}
      </div>
      <div className="absolute bottom-4 right-8 flex items-center gap-3">
        Scroll
        <span className="relative h-8 w-px overflow-hidden bg-white/15">
          <motion.span
            className="absolute inset-x-0 h-3 bg-white/70"
            animate={{ y: [-12, 32] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          />
        </span>
      </div>
    </motion.div>
  );
}

function Portal() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      <div className="relative h-[680px] w-[680px] max-w-[140vw]">
        <div className="animate-spin-slow absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent,#00f3ff33,transparent_30%,#9d00ff44,transparent_60%,#ff009933,transparent)] blur-2xl" />
        <div className="animate-spin-slower absolute inset-[12%] rounded-full border border-white/5 bg-[conic-gradient(from_90deg,transparent,#00f3ff22,transparent_40%,#ff009922,transparent_80%)]" />
        <div className="absolute inset-[24%] rounded-full border border-dashed border-white/10 animate-spin-slow" />
        <div className="absolute inset-[36%] rounded-full bg-[radial-gradient(circle,#05050c_45%,transparent_72%)]" />
        {Array.from({ length: 14 }).map((_, i) => {
          const dur = 10 + (i % 4) * 4;
          return (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 h-0 w-0"
              style={{
                animation: `aether-orbit ${dur}s linear infinite`,
                animationDelay: `${-(i / 14) * dur}s`,
              }}
            >
              <span
                className="absolute h-1 w-1 rounded-full bg-white"
                style={{
                  boxShadow: '0 0 8px #00f3ff',
                  transform: `translateX(${180 + (i % 3) * 50}px)`,
                  opacity: 0.4 + (i % 3) * 0.2,
                }}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}
