"use client";

import { useEffect, useRef } from "react";

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: string;
};

export function MeteorSky({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    const meteors: Spark[] = [];
    const stars: Array<{ x: number; y: number; s: number; p: number }> = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(160, Math.floor(rect.width / 3));
      canvas.height = Math.max(90, Math.floor(rect.height / 3));
      stars.length = 0;
      for (let i = 0; i < 40; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          s: Math.random() > 0.7 ? 2 : 1,
          p: Math.random() * Math.PI * 2,
        });
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const spawn = () => {
      meteors.push({
        x: Math.random() * canvas.width * 1.2,
        y: -6,
        vx: -0.4 - Math.random() * 0.5,
        vy: 1.1 + Math.random() * 1.4,
        size: 2 + Math.floor(Math.random() * 3),
        life: 1,
        color: Math.random() > 0.5 ? "#ff6a00" : "#ffcc00",
      });
    };

    let tick = 0;
    const loop = () => {
      if (!running) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#0a0014";
      ctx.fillRect(0, 0, w, h);

      const grd = ctx.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, "#1a0033");
      grd.addColorStop(0.6, "#120024");
      grd.addColorStop(1, "#2a0810");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      tick += 1;
      for (const star of stars) {
        const twinkle = 0.4 + Math.abs(Math.sin(tick / 20 + star.p)) * 0.6;
        ctx.fillStyle = `rgba(248,240,216,${twinkle})`;
        ctx.fillRect(star.x, star.y, star.s, star.s);
      }

      if (tick % 18 === 0) spawn();

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx;
        m.y += m.vy;
        for (let t = 0; t < 6; t++) {
          ctx.fillStyle = t < 2 ? "#ffcc00" : t < 4 ? "#ff6a00" : "#b33d00";
          ctx.fillRect(m.x + t * 0.9, m.y - t * 1.6, m.size, m.size);
        }
        ctx.fillStyle = "#fff4c2";
        ctx.fillRect(m.x, m.y, m.size + 1, m.size);
        if (m.y > h + 10 || m.x < -10) meteors.splice(i, 1);
      }

      // silhouette of Tilted
      ctx.fillStyle = "#080010";
      const base = h - 18;
      const towers = [
        [w * 0.12, 28, 14],
        [w * 0.22, 46, 16],
        [w * 0.36, 70, 22],
        [w * 0.52, 58, 18],
        [w * 0.68, 36, 14],
        [w * 0.8, 24, 12],
      ];
      for (const [x, tall, wide] of towers) {
        ctx.fillRect(x, base - tall, wide, tall);
        ctx.fillStyle = "#1a0033";
        for (let wy = base - tall + 4; wy < base - 4; wy += 5) {
          for (let wx = x + 2; wx < x + wide - 2; wx += 4) {
            if ((wx + wy) % 7 !== 0) ctx.fillRect(wx, wy, 2, 2);
          }
        }
        ctx.fillStyle = "#080010";
      }
      ctx.fillRect(0, base, w, h - base);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={className}
      aria-hidden
      style={{ imageRendering: "pixelated" }}
    />
  );
}
