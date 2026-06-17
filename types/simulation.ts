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


export type ForceNode = {
    id: string;
    x: number;
    y: number;
    type: ForceType;
    strength: number;
};