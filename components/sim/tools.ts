import { Target, Radio, Tornado, Orbit, Zap, Brush, Eraser, type LucideIcon } from 'lucide-react';
import { ActiveTool, ThemeColors } from '@/types/simulation';

export type ToolDef = {
  id: ActiveTool;
  label: string;
  key: string;
  icon: LucideIcon;
  hint: string;
  color: (t: ThemeColors) => string;
};

export const TOOLS: ToolDef[] = [
  {
    id: 'attractor',
    label: 'Attractor',
    key: '1',
    icon: Target,
    hint: 'Click to place a gravity well · drag nodes to move them',
    color: (t) => t.attractor,
  },
  {
    id: 'repulsor',
    label: 'Repulsor',
    key: '2',
    icon: Radio,
    hint: 'Click to place a repulsive field',
    color: (t) => t.repulsor,
  },
  {
    id: 'vortex',
    label: 'Vortex',
    key: '3',
    icon: Tornado,
    hint: 'Click to place a spinning vortex · Shift+click spins counter-clockwise',
    color: (t) => t.vortex,
  },
  {
    id: 'singularity',
    label: 'Singularity',
    key: '4',
    icon: Orbit,
    hint: 'Click to open a black hole that consumes matter',
    color: (t) => t.singularity,
  },
  {
    id: 'pulse',
    label: 'Shockwave',
    key: '5',
    icon: Zap,
    hint: 'Click to fire an expanding shockwave',
    color: (t) => t.accent,
  },
  {
    id: 'brush',
    label: 'Gravity Brush',
    key: '6',
    icon: Brush,
    hint: 'Hold to pull particles with your cursor · hold Shift to push',
    color: (t) => t.accent,
  },
  {
    id: 'eraser',
    label: 'Eraser',
    key: '7',
    icon: Eraser,
    hint: 'Click or drag over nodes to remove them · right-click also deletes',
    color: () => '#ff4d6d',
  },
];
