# AETHER

**AETHER** is a high-performacne, browser-based kinetic particle sandbox. It utilizes a custom 2D rendering engine to simulate thousands of particles reacting in real-time to user-placed gravitational and repulsive nodes.

Instead of basic linear attraction towards the nodes, the physics engine calculates tangential acceleration vectors to create complex orbital mechanics, fluid drag forces and accretion disks (in 3D an accretion disk is like a funnel thats flat at the center - commonly seen in depictions of black holes - like that one famous scene from interstellar)

____

## Features

### Landing page (`/`)
- **Particle hero:** the word AETHER is built from thousands of live particles that swirl away from your cursor and re-form.
- **Live force demos:** each force type runs its own mini simulation. Hover to move the force, click to fire a shockwave.
- **Animated physics explainer:** the radial pull and tangential swirl vectors behind the orbital mechanics.
- **Theme picker:** choose a palette before you enter, and the simulator opens in it.
- **Warp transition:** the word explodes into a vortex and you jump to hyperspace into the simulator.

### Simulator (`/sim`)
- **Four field types:** Attractor (accretion disks), Repulsor, Vortex (clockwise or counter-clockwise) and Singularity (a black hole that consumes particles and respawns them at the edge).
- **Interactive tools:** Shockwave (expanding blast ring), Gravity Brush (hold to pull, Shift to push) and Eraser.
- **Direct manipulation:** drag nodes to move them, scroll over a node to tune its strength, right-click to delete, Ctrl/⌘+Z to undo.
- **Six presets:** Spiral Galaxy, Binary Stars, Event Horizon, Nebula, Supernova and Chaos, plus Big Bang, Shockwave, Agitate and Scatter events.
- **Kaleidoscope symmetry:** mirror every placed node 2, 4 or 6 times around the centre.
- **Physics controls:** particle count (500 to 15,000), node strength, time scale, drag, and bounce or wrap-around boundaries.
- **Light & dark mode:** an ink-on-paper light mode alongside the glowing dark mode (`M`).
- **One-click reset:** wipe back to an empty black universe with freshly scattered particles (`0`).
- **Visual controls:** 8 themes (Neon, Fire, Ocean, Aurora, Synthwave, Nebula, Toxic, Mono), palette or velocity-based colouring, trail length and glow.
- **Capture:** PNG screenshots and WebM video recording of the canvas.
- **Live HUD:** FPS, particle and node counts, particles consumed, and a kinetic-energy sparkline.
- **Keyboard shortcuts for everything** (press `?` in the simulator). Theme and settings are remembered between visits.

### Engine
- **Decoupled architecture:** `lib/engine/ParticleEngine.ts` is a framework-agnostic class. It reads forces and settings from Zustand through getters every frame, so UI changes never restart the `requestAnimationFrame` loop.
- **Struct-of-arrays particles:** positions and velocities live in `Float32Array`s, and frame-rate independent integration keeps the motion consistent on 60 Hz and 120 Hz screens.
- **Sprite rendering:** particles are drawn as pre-baked radial glow sprites with additive (`lighter`) blending for plasma-like light trails.
- **Orbital vector math:** each frame the engine computes the distance $d$ to every node, applies a $1/(d+\varepsilon)$ falloff, and splits the force into a radial unit vector $\hat{u}$ and its perpendicular tangent $\hat{\tau} = (-u_y, u_x)$. That turns straight-line attraction into stable orbits and accretion disks.

_____

## Tech Stack Used:

- **Framework:** [Next.js](https://next.js.org/) (App Router)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management:** [Zustand](https://github.com/pmdrs/zustand)
- **Animation:** [Framer Motion](https://www.framer.com/motion/)
- **Physics/Rendering:** HTML5 Canvas API (Vanilla JS)

______

## Using/Running AETHER

- AETHER is deployed with vercel at: https://aether-gilt-kappa.vercel.app/

If you would like to run this project locally on your device, you'll need Node.js installed.
    
1. **Clone the Repository**
    ```bash
    git clone [https://github.com/yourusername/aether.git](https://github.com/yourusername/aether.git)
   cd aether

2. **Install dependencies**
    ```bash
    npm install

3. **Run it locally**
    ```bash
    npm run dev

4. **Open the interface**
    Navigate to http://localhost:3000 in your browser

____