'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, SlidersHorizontal, Palette, RotateCcw, Bomb, Waves, Vibrate } from 'lucide-react';
import { useSimulationStore } from '@/lib/store/useSimulationStore';
import { THEMES, THEME_ORDER, getTheme } from '@/lib/themes';
import { PRESETS } from '@/lib/engine/presets';
import { loadPreset, bigBang, shockwaveCenter, shake, resetParticles } from '@/lib/engine/actions';
import { Glass, Slider, Segmented, SectionLabel } from './ui';
import { Symmetry } from '@/types/simulation';

type Tab = 'scenes' | 'physics' | 'visuals';

const TABS: { id: Tab; label: string; icon: typeof Sparkles }[] = [
  { id: 'scenes', label: 'Scenes', icon: Sparkles },
  { id: 'physics', label: 'Physics', icon: SlidersHorizontal },
  { id: 'visuals', label: 'Visuals', icon: Palette },
];

export default function SettingsPanel() {
  const [tab, setTab] = useState<Tab>('scenes');
  const open = useSimulationStore((s) => s.panelOpen);
  const theme = getTheme(useSimulationStore((s) => s.currentTheme), useSimulationStore((s) => s.appearance));

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          className="pointer-events-auto w-[min(320px,calc(100vw-2rem))]"
        >
          <Glass className="flex max-h-[calc(100svh-11rem)] max-lg:max-h-[calc(100svh-13rem)] flex-col overflow-hidden">
            <div className="flex gap-1 border-b border-ink/10 p-1.5">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-medium transition-colors ${
                      active ? 'text-ink' : 'text-ink/45 hover:text-ink/80'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="panel-tab"
                        className="absolute inset-0 rounded-xl bg-ink/[0.08]"
                        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                      />
                    )}
                    <Icon size={13} className="relative" style={active ? { color: theme.accent } : undefined} />
                    <span className="relative">{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="aether-scroll overflow-y-auto p-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  {tab === 'scenes' && <ScenesTab accent={theme.accent} />}
                  {tab === 'physics' && <PhysicsTab accent={theme.accent} />}
                  {tab === 'visuals' && <VisualsTab accent={theme.accent} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </Glass>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function ScenesTab({ accent }: { accent: string }) {
  return (
    <div className="space-y-6">
      <div>
        <SectionLabel>Presets</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => loadPreset(p.id)}
              className="group relative overflow-hidden rounded-xl border border-ink/10 bg-ink/[0.03] p-3 text-left transition-all hover:border-ink/25 hover:bg-ink/[0.06]"
            >
              <PresetGlyph index={i} accent={accent} />
              <div className="relative mt-6 text-xs font-semibold text-ink">{p.name}</div>
              <div className="relative mt-0.5 text-[10px] leading-snug text-ink/40">{p.blurb}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Events</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <EventButton icon={Bomb} label="Big Bang" kbd="B" onClick={bigBang} />
          <EventButton icon={Waves} label="Shockwave" kbd="P" onClick={shockwaveCenter} />
          <EventButton icon={Vibrate} label="Agitate" kbd="X" onClick={shake} />
          <EventButton icon={RotateCcw} label="Scatter" kbd="S" onClick={resetParticles} />
        </div>
      </div>
    </div>
  );
}

function PresetGlyph({ index, accent }: { index: number; accent: string }) {
  // Small decorative orbit glyph per preset card
  return (
    <svg className="absolute right-2 top-2 opacity-60 transition-opacity group-hover:opacity-100" width="34" height="34" viewBox="0 0 34 34">
      <circle cx="17" cy="17" r="3" fill={accent} />
      {[0, 1, 2].slice(0, (index % 3) + 1).map((k) => (
        <ellipse
          key={k}
          cx="17"
          cy="17"
          rx={8 + k * 4}
          ry={4 + k * 2.5}
          fill="none"
          stroke={accent}
          strokeOpacity={0.6 - k * 0.15}
          transform={`rotate(${index * 30 + k * 40} 17 17)`}
        />
      ))}
    </svg>
  );
}

function EventButton({
  icon: Icon,
  label,
  kbd,
  onClick,
}: {
  icon: typeof Bomb;
  label: string;
  kbd: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-ink/10 bg-ink/[0.03] px-3 py-2.5 text-xs text-ink/75 transition-all hover:border-ink/25 hover:bg-ink/[0.06] hover:text-ink"
    >
      <Icon size={14} />
      <span className="flex-1 text-left">{label}</span>
      <kbd className="font-mono text-[10px] text-ink/30">{kbd}</kbd>
    </button>
  );
}

function PhysicsTab({ accent }: { accent: string }) {
  const s = useSimulationStore((st) => st.settings);
  const set = useSimulationStore((st) => st.setSetting);
  const reset = useSimulationStore((st) => st.resetSettings);
  return (
    <div className="space-y-5">
      <Slider
        label="Particles"
        value={s.particleCount}
        min={500}
        max={15000}
        step={500}
        onChange={(v) => set('particleCount', v)}
        format={(v) => v.toLocaleString()}
        accent={accent}
      />
      <Slider
        label="New node strength"
        value={s.nodeStrength}
        min={0.5}
        max={8}
        step={0.25}
        onChange={(v) => set('nodeStrength', v)}
        format={(v) => v.toFixed(2)}
        accent={accent}
      />
      <Slider
        label="Time scale"
        value={s.timeScale}
        min={0.1}
        max={2.5}
        step={0.05}
        onChange={(v) => set('timeScale', v)}
        format={(v) => `${v.toFixed(2)}×`}
        accent={accent}
      />
      <Slider
        label="Drag"
        value={Math.round((1 - s.friction) * 1000) / 10}
        min={0}
        max={8}
        step={0.1}
        onChange={(v) => set('friction', 1 - v / 100)}
        format={(v) => `${v.toFixed(1)}%`}
        accent={accent}
      />

      <div>
        <SectionLabel>Boundaries</SectionLabel>
        <Segmented
          value={s.edgeMode}
          onChange={(v) => set('edgeMode', v)}
          options={[
            { value: 'bounce', label: 'Bounce' },
            { value: 'wrap', label: 'Wrap around' },
          ]}
          accent={accent}
        />
      </div>

      <div>
        <SectionLabel>Placement symmetry</SectionLabel>
        <Segmented<Symmetry>
          value={s.symmetry}
          onChange={(v) => set('symmetry', v)}
          options={[
            { value: 1, label: 'Off' },
            { value: 2, label: '2×' },
            { value: 4, label: '4×' },
            { value: 6, label: '6×' },
          ]}
          accent={accent}
        />
        <p className="mt-2 text-[10px] leading-relaxed text-ink/35">
          Mirrors each node you place around the centre of the screen. Great for mandalas.
        </p>
      </div>

      <button
        onClick={reset}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink/10 py-2.5 text-[11px] uppercase tracking-wider text-ink/40 transition-all hover:border-ink/25 hover:text-ink/70"
      >
        <RotateCcw size={12} /> Reset to defaults
      </button>
    </div>
  );
}

function VisualsTab({ accent }: { accent: string }) {
  const s = useSimulationStore((st) => st.settings);
  const set = useSimulationStore((st) => st.setSetting);
  const currentTheme = useSimulationStore((st) => st.currentTheme);
  const setTheme = useSimulationStore((st) => st.setTheme);
  const nodesVisible = useSimulationStore((st) => st.nodesVisible);
  const toggleNodes = useSimulationStore((st) => st.toggleNodesVisible);
  const appearance = useSimulationStore((st) => st.appearance);
  const toggleAppearance = useSimulationStore((st) => st.toggleAppearance);

  return (
    <div className="space-y-6">
      <div>
        <SectionLabel>Appearance</SectionLabel>
        <Segmented
          value={appearance}
          onChange={(v) => v !== appearance && toggleAppearance()}
          options={[
            { value: 'dark', label: 'Dark · light' },
            { value: 'light', label: 'Light · ink' },
          ]}
          accent={accent}
        />
      </div>

      <div>
        <SectionLabel>Theme</SectionLabel>
        <div className="grid grid-cols-4 gap-2">
          {THEME_ORDER.map((id) => {
            const t = THEMES[id];
            const active = id === currentTheme;
            return (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`group flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all ${
                  active ? 'border-ink/40 bg-ink/[0.08]' : 'border-ink/5 hover:border-ink/20'
                }`}
              >
                <span
                  className="h-7 w-7 rounded-full transition-transform group-hover:scale-110"
                  style={{
                    background: `conic-gradient(from 200deg, ${t.gradient.join(', ')}, ${t.gradient[0]})`,
                    boxShadow: active ? `0 0 16px -2px ${t.accent}` : undefined,
                  }}
                />
                <span className={`text-[10px] ${active ? 'text-ink' : 'text-ink/45'}`}>{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <SectionLabel>Colour by</SectionLabel>
        <Segmented
          value={s.colorMode}
          onChange={(v) => set('colorMode', v)}
          options={[
            { value: 'palette', label: 'Palette' },
            { value: 'velocity', label: 'Velocity' },
          ]}
          accent={accent}
        />
      </div>

      <Slider
        label="Trail length"
        value={s.trail}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => set('trail', v)}
        format={(v) => `${Math.round(v * 100)}%`}
        accent={accent}
      />
      <Slider
        label="Glow"
        value={s.glow}
        min={0.3}
        max={2.5}
        step={0.05}
        onChange={(v) => set('glow', v)}
        format={(v) => `${v.toFixed(2)}×`}
        accent={accent}
      />

      <div>
        <SectionLabel>Field nodes</SectionLabel>
        <Segmented
          value={nodesVisible ? 'show' : 'hide'}
          onChange={(v) => (v === 'show') !== nodesVisible && toggleNodes()}
          options={[
            { value: 'show', label: 'Visible' },
            { value: 'hide', label: 'Hidden' },
          ]}
          accent={accent}
        />
      </div>
    </div>
  );
}
