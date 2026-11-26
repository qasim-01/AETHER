'use client';

import { ReactNode } from 'react';

export function Glass({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-ink/10 bg-panel/80 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

export function IconButton({
  children,
  label,
  onClick,
  disabled,
  active,
  tooltip = 'top',
  className = '',
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  tooltip?: 'top' | 'bottom' | 'left' | 'none';
  className?: string;
}) {
  const pos =
    tooltip === 'top' ? 'bottom-full mb-3 left-1/2 -translate-x-1/2'
    : tooltip === 'bottom' ? 'top-full mt-3 left-1/2 -translate-x-1/2'
    : 'right-full mr-3 top-1/2 -translate-y-1/2';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-30 sm:h-11 sm:w-11 ${
        active ? 'bg-ink/15 text-ink' : 'text-ink/55 hover:bg-ink/[0.07] hover:text-ink'
      } ${className}`}
    >
      {children}
      {tooltip !== 'none' && (
        <span
          className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-lg border border-ink/10 bg-panel/90 px-2.5 py-1 text-[11px] text-ink opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 ${pos}`}
        >
          {label}
        </span>
      )}
    </button>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  accent,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  accent: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-ink/60">{label}</span>
        <span className="font-mono text-[11px] text-ink">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="aether-range w-full"
        style={{
          background: `linear-gradient(to right, ${accent} 0%, ${accent} ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`,
          ['--accent' as string]: accent,
        }}
      />
    </label>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  accent,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  accent: string;
}) {
  return (
    <div className="flex rounded-xl border border-ink/10 bg-ink/[0.03] p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-[10px] px-2 py-1.5 text-[11px] font-medium transition-all ${
              active ? 'text-panel' : 'text-ink/50 hover:text-ink'
            }`}
            style={active ? { background: accent } : undefined}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-ink/35">{children}</div>;
}
