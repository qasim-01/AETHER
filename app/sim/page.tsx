import type { Metadata } from 'next';
import SimulatorShell from '@/components/sim/SimulatorShell';

export const metadata: Metadata = {
  title: 'Simulator · AETHER',
  description: 'Shape a universe of glowing particles with gravity wells, vortices and black holes.',
};

export default function SimulatorPage() {
  return <SimulatorShell />;
}
