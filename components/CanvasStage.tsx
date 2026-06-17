'use client';

import { useEffect, useRef } from 'react';
import { useSimulationStore } from '../lib/store/useSimulationStore';
import { Particle, ForceNode } from '../types/simulation';

export default function CanvasStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPaused, forces, triggerRandomize, addForce } = useSimulationStore();
  
  // Mutable references for the animation loop
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);

  // Utility to generate a random universe
  const generateRandomUniverse = (width: number, height: number) => {
    const newParticles: Particle[] = [];
    const colors = ['#00f3ff', '#ff0099', '#7000ff', '#ffffff'];
    
    // Spawn 1500 particles
    for (let i = 0; i < 1500; i++) {
      newParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: Math.random(),
        size: Math.random() * 1.5 + 0.5
      });
    }
    particlesRef.current = newParticles;

    // Spawn 3-5 random forces
    const numForces = Math.floor(Math.random() * 3) + 3;
    for (let i = 0; i < numForces; i++) {
      addForce({
        id: Math.random().toString(36).substr(2, 9),
        x: width * 0.1 + Math.random() * (width * 0.8),
        y: height * 0.1 + Math.random() * (height * 0.8),
        type: Math.random() > 0.5 ? 'attractor' : 'repulsor',
        strength: Math.random() * 2 + 1
      });
    }
  };

  // Main Effect Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // alpha: false optimizes performance
    if (!ctx) return;

    // Resize handler
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Initial universe spawn
    if (particlesRef.current.length === 0) {
      generateRandomUniverse(canvas.width, canvas.height);
    }

    // Animation Loop
    const animate = () => {
      if (!isPaused) {
        // Cinematic Trail Effect using opacity
        ctx.fillStyle = 'rgba(5, 5, 10, 0.15)'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Update & Draw Particles
        const particles = particlesRef.current;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Apply Forces
          forces.forEach(force => {
            const dx = force.x - p.x;
            const dy = force.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 400 && dist > 5) {
              const f = (force.strength * 50) / (dist * dist);
              const dir = force.type === 'attractor' ? 1 : -1;
              p.vx += (dx / dist) * f * dir;
              p.vy += (dy / dist) * f * dir;
            }
          });

          // Friction & Velocity
          p.vx *= 0.98;
          p.vy *= 0.98;
          p.x += p.vx;
          p.y += p.vy;

          // Soft Boundary Wrap
          if (p.x < 0) p.x = canvas.width;
          if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height;
          if (p.y > canvas.height) p.y = 0;

          // Draw Particle (Glow effect)
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw Forces
        ctx.shadowBlur = 0; // Reset shadow for forces
        forces.forEach(force => {
          ctx.beginPath();
          ctx.arc(force.x, force.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = force.type === 'attractor' ? '#00f3ff' : '#ff0099';
          ctx.fill();
          
          // Outer ring
          ctx.beginPath();
          ctx.arc(force.x, force.y, 20 + Math.sin(Date.now() / 200) * 5, 0, Math.PI * 2);
          ctx.strokeStyle = force.type === 'attractor' ? 'rgba(0, 243, 255, 0.3)' : 'rgba(255, 0, 153, 0.3)';
          ctx.lineWidth = 2;
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
  }, [isPaused, forces]); // Re-run effect if pause or forces change

  // Listen for Randomize Trigger
  useEffect(() => {
    if (triggerRandomize > 0 && canvasRef.current) {
      generateRandomUniverse(canvasRef.current.width, canvasRef.current.height);
    }
  }, [triggerRandomize]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full z-0 cursor-crosshair"
      onClick={(e) => {
        // Allow user to click to add a gravity well
        addForce({
          id: Math.random().toString(36).substr(2, 9),
          x: e.clientX,
          y: e.clientY,
          type: 'attractor',
          strength: 2
        });
      }}
    />
  );
}