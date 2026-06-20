export type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    life: number;
    size: number;
};

export type ForceType = "attractor" | "repulsor";

export type ActiveTool = "attractor" | "repulsor" | "eraser";

export type ThemeMode = "NEON" | "FIRE" | "OCEAN" | "MONO";

export type ThemeColors = {
    background: string;
    particles: string[];
    attractor: string;
    repulsor: string;
    accent: string;
};

export type ForceNode = {
    id: string;
    x: number;
    y: number;
    type: ForceType;
    strength: number;
};