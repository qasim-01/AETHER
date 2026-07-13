'use client';

import { useEffect, useRef, useState } from 'react';
import { useSimulationStore } from '../lib/store/useSimulationStore';
import { Particle, ThemeMode, ThemeColors } from '../types/simulation';

const THEMES: Record<ThemeMode, ThemeColors> = {
  NEON: { // neon theme color, brigh blue, bright pink, bright purble & white
    background: 'rgba(5, 5, 12, 0.35)', // Increased alpha removes the lingering halo
    particles: ['#00f3ff', '#ff0099', '#9d00ff', '#ffffff'],
    attractor: '#00f3ff',
    repulsor: '#ff0099',
    accent: '#00f3ff'
  },
  FIRE: { // fire theme color, red, orange, yellow, white particles
    background: 'rgba(12, 4, 2, 0.35)',
    particles: ['#ff4500', '#ffaa00', '#ffdd00', '#ffffff'],
    attractor: '#ffaa00',
    repulsor: '#ff4500',
    accent: '#ffaa00'
  },
  OCEAN: { // ocean color theme, blue, sea green, light blue, white particl
    background: 'rgba(2, 8, 15, 0.35)',
    particles: ['#0055ff', '#00ffaa', '#00aaff', '#ffffff'],
    attractor: '#00ffaa',
    repulsor: '#0055ff',
    accent: '#00ffaa'
  },
  MONO: { // mono theme - just basic all black and white and grey
    background: 'rgba(10, 10, 10, 0.35)',
    particles: ['#ffffff', '#aaaaaa', '#555555', '#333333'],
    attractor: '#ffffff',
    repulsor: '#555555',
    accent: '#ffffff'
  }
};

export default function CanvasStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isInside, setIsInside] = useState(false);
  
  const { 
    isPaused, forces, activeTool, currentTheme, 
    triggerRandomize, addForce, removeForceAt, nodesVisible 
  } = useSimulationStore();
  
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const themeRef = useRef<ThemeColors>(THEMES[currentTheme]);

  // this will allow the colors of the simulation to change in real time and no need for refreshing every time you want to change colors
  useEffect(() => {
    themeRef.current = THEMES[currentTheme];
    const newColors = THEMES[currentTheme].particles;
    
    particlesRef.current.forEach(p => {
      p.color = newColors[Math.floor(Math.random() * newColors.length)];
    });
  }, [currentTheme]);

  const generateParticles = (width: number, height: number) => {
    const pArray: Particle[] = [];
    const colors = themeRef.current.particles;
    for (let i = 0; i < 3000; i++) { // increase to 3,000 particles now - maybe add a slider later on
      pArray.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: Math.random(),
        size: Math.random() * 1.2 + 0.6
      });
    }
    particlesRef.current = pArray;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (particlesRef.current.length === 0) {
        generateParticles(canvas.width, canvas.height);
      }
    };
    window.addEventListener('resize', resize);
    resize();

    const animate = () => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = themeRef.current.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // this will hel colors blend better - fixing the weird halo i was getting before
      ctx.globalCompositeOperation = 'lighter'; 

      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!isPaused) {
          forces.forEach((force) => {
            const dx = force.x - p.x;
            const dy = force.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Radius reduced from 500 to 300
            if (dist < 300 && dist > 5) {
              const baseForce = (force.strength * 45) / (dist + 30);
              const ux = dx / dist;
              const uy = dy / dist;

              if (force.type === 'attractor') {
                const pullStrength = baseForce * 1.2;
                const swirlStrength = baseForce * 0.7;
                const tx = -uy * swirlStrength;
                const ty = ux * swirlStrength;

                p.vx += (ux * pullStrength) + tx;
                p.vy += (uy * pullStrength) + ty;

                // Core friction zone to form the accretion disk
                if (dist < 50) {
                  p.vx *= 0.92;
                  p.vy *= 0.92;
                }
              } else {
                // Repulsor strength drastically reduced
                p.vx -= ux * baseForce * 0.4;
                p.vy -= uy * baseForce * 0.4;
              }
            }
          });

          p.vx *= 0.975;
          p.vy *= 0.975;
          p.x += p.vx;
          p.y += p.vy;

          // makes particles bounce back at canvas edges
          const margin = 2;
          if (p.x <= 0) { p.x = margin; p.vx *= -1; }
          if (p.x >= canvas.width) { p.x = canvas.width - margin; p.vx *= -1; }
          if (p.y <= 0) { p.y = margin; p.vy *= -1; }
          if (p.y >= canvas.height) { p.y = canvas.height - margin; p.vy *= -1; }
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hide/Show Nodes
      if (nodesVisible) {
        ctx.globalCompositeOperation = 'source-over';
        forces.forEach((force) => {
          const color = force.type === 'attractor' ? themeRef.current.attractor : themeRef.current.repulsor;
          ctx.beginPath();
          ctx.arc(force.x, force.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(force.x, force.y, 18 + Math.sin(Date.now() / 250) * 3, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPaused, forces, nodesVisible]);

  // trigger for generating universe
  useEffect(() => {
    if (triggerRandomize > 0 && canvasRef.current) {
      generateParticles(canvasRef.current.width, canvasRef.current.height);
      
      const numForces = Math.floor(Math.random() * 3) + 2; // Generate 2-4 nodes
      for (let i = 0; i < numForces; i++) {
         useSimulationStore.getState().addForce({
           id: Math.random().toString(36).substr(2, 9),
           x: canvasRef.current.width * 0.2 + Math.random() * (canvasRef.current.width * 0.6),
           y: canvasRef.current.height * 0.2 + Math.random() * (canvasRef.current.height * 0.6),
           type: Math.random() > 0.5 ? 'attractor' : 'repulsor',
           strength: Math.random() * 1.5 + 1.5
         });
      }
    }
  }, [triggerRandomize]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'eraser') {
      removeForceAt(x, y, 30);
    } else {
      addForce({
        id: Math.random().toString(36).substr(2, 9),
        x,
        y,
        type: activeTool,
        strength: 2.5
      });
    }
  };

  const getCursorColor = () => {
    if (activeTool === 'attractor') return themeRef.current.attractor;
    if (activeTool === 'repulsor') return themeRef.current.repulsor;
    return '#ffffff';
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full z-0 bg-black cursor-none"
        onClick={handleCanvasClick}
        onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
        onMouseEnter={() => setIsInside(true)}
        onMouseLeave={() => setIsInside(false)}
      />
      
      {isInside && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-transform duration-100 ease-out"
          style={{
            left: mousePos.x,
            top: mousePos.y,
            width: activeTool === 'eraser' ? '40px' : '20px',
            height: activeTool === 'eraser' ? '40px' : '20px',
            borderColor: getCursorColor(),
            backgroundColor: `${getCursorColor()}15`,
          }}
        >
          <div 
            className="absolute top-1/2 left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ backgroundColor: getCursorColor() }}
          />
        </div>
      )}
    </>
  );
}