import React, { useEffect, useRef } from 'react';

interface Petal {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  spin: number;
  angle: number;
  sway: number;
  swaySpeed: number;
  swayAmp: number;
  char: string;
  color: string;
  opacity: number;
}

export default function PetalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const FLOWERS = ['✿', '❀', '✾', '⚘', '✽'];
    const COLORS = [
      'rgba(196,131,107,VAL)',
      'rgba(168,216,234,VAL)',
      'rgba(176,144,128,VAL)',
      'rgba(244,192,122,VAL)',
      'rgba(135,206,235,VAL)',
    ];

    const COUNT = 28;
    const petals: Petal[] = [];

    const makePetal = (startY = -30): Petal => {
      return {
        x: Math.random() * window.innerWidth,
        y: startY - Math.random() * 100,
        size: 12 + Math.random() * 18,
        speed: 0.5 + Math.random() * 0.9,
        drift: (Math.random() - 0.5) * 0.6,
        spin: (Math.random() - 0.5) * 0.03,
        angle: Math.random() * Math.PI * 2,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.008 + Math.random() * 0.012,
        swayAmp: 20 + Math.random() * 30,
        char: FLOWERS[Math.floor(Math.random() * FLOWERS.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: 0.12 + Math.random() * 0.22,
      };
    };

    // Populate initial petals across the screen height
    for (let i = 0; i < COUNT; i++) {
      const p = makePetal();
      p.y = Math.random() * window.innerHeight;
      petals.push(p);
    }

    let animationFrameId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of petals) {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.font = `${p.size}px serif`;
        ctx.fillStyle = p.color.replace('VAL', '1');
        ctx.translate(p.x + Math.sin(p.sway) * p.swayAmp, p.y);
        ctx.rotate(p.angle);
        ctx.fillText(p.char, -p.size / 2, p.size / 2);
        ctx.restore();

        p.y += p.speed;
        p.x += p.drift;
        p.angle += p.spin;
        p.sway += p.swaySpeed;

        // Reset petal to top if it falls off screen
        if (p.y > window.innerHeight + 40) {
          const fresh = makePetal(-30);
          Object.assign(p, fresh);
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="petal-canvas"
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
