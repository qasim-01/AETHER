# AETHER

**AETHER** is a high-performacne, browser-based kinetic particle sandbox. It utilizes a custom 2D rendering engine to simulate thousands of particles reacting in real-time to user-placed gravitational and repulsive nodes.

Instead of basic linear attraction towards the nodes, the physics engine calculates tangential acceleration vectors to create complex orbital mechanics, fluid drag forces and accretion disks (in 3D an accretion disk is like a funnel thats flat at the center - commonly seen in depictions of black holes - like that one famous scene from interstellar)

____

![AETHER Engine Demo](docs/demo.gif) ## Features

- **High-Performace Canvas Engine:** Renders and computes physics for 2,000+ independent particles at 60 FPS.
- **Decoupled Architecture:** The physics loop and the UI are completely separated, this allows for state updates using Zustand and therefore this prevents React re-renders from bottlenecking the canvas `requestAnimationFrame` loop.
- **Orbital Vector Math:** Attractor nodes generate both linear pull and tangential swirl forces, naturally forming the accretion disks mentioned earlier instead of simply attracting particles linearly and then "slingshotting" them off in a direction.
- **Physics & Math Model Used:** Every frame, the engine calculates the distance ($d$) between a particle and a node. If within the threshold, it applies the inverse-square law to determine base strength, calculates the normalized directional vectors ($u_x, u_y$), and derives the perpendicular tangents ($\tau_x, \tau_y$) to apply orbital velocity.
- **Rendering:** It uses `globalCompositeOperation` to create plasma blending and long-exposure light trails.
- **Dynamic Themes:** This provides different coloring options to the users or "Themes" and it recalculations particle and UI hex codes instantly. 
    - Themes: Neon, Fire, Ocean, Mono

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