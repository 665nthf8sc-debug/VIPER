"use client";

import { useEffect, useRef } from "react";

export function ViperSky({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    const stars: Array<{ x: number; y: number; s: number; p: number }> = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(160, Math.floor(rect.width / 3));
      canvas.height = Math.max(90, Math.floor(rect.height / 3));
      stars.length = 0;
      for (let i = 0; i < 42; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.7,
          s: Math.random() > 0.7 ? 2 : 1,
          p: Math.random() * Math.PI * 2,
        });
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let tick = 0;
    const loop = () => {
      if (!running) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.imageSmoothingEnabled = false;

      const grd = ctx.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, "#061410");
      grd.addColorStop(0.45, "#120024");
      grd.addColorStop(1, "#1a3a18");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      tick += 1;
      for (const star of stars) {
        const twinkle = 0.4 + Math.abs(Math.sin(tick / 20 + star.p)) * 0.6;
        ctx.fillStyle = `rgba(248,240,216,${twinkle})`;
        ctx.fillRect(star.x, star.y, star.s, star.s);
      }

      const busX = ((tick * 0.6) % (w + 80)) - 50;
      const busY = Math.floor(h * 0.22);
      ctx.fillStyle = "#ffcc00";
      ctx.fillRect(busX + 8, busY - 10, 22, 8);
      ctx.fillStyle = "#3d7cff";
      ctx.fillRect(busX, busY, 32, 10);
      ctx.fillStyle = "#9ad4ff";
      ctx.fillRect(busX + 4, busY + 3, 6, 4);
      ctx.fillRect(busX + 13, busY + 3, 6, 4);
      ctx.fillStyle = "#f8f0d8";
      ctx.fillRect(busX + 12, busY + 10, 2, 4);

      ctx.fillStyle = "rgba(0, 80, 40, 0.35)";
      ctx.fillRect(0, h * 0.55, w, h * 0.45);

      ctx.fillStyle = "#080010";
      const base = h - 18;
      const towers = [
        [w * 0.1, 24, 12],
        [w * 0.2, 40, 16],
        [w * 0.34, 64, 20],
        [w * 0.5, 48, 16],
        [w * 0.66, 32, 14],
        [w * 0.8, 22, 12],
      ];
      for (const [x, tall, wide] of towers) {
        ctx.fillRect(x, base - tall, wide, tall);
        ctx.fillStyle = "#143018";
        for (let wy = base - tall + 4; wy < base - 4; wy += 5) {
          for (let wx = x + 2; wx < x + wide - 2; wx += 4) {
            if ((wx + wy) % 7 !== 0) ctx.fillRect(wx, wy, 2, 2);
          }
        }
        ctx.fillStyle = "#080010";
      }
      ctx.fillRect(0, base, w, h - base);

      ctx.fillStyle = "#00e800";
      ctx.fillRect(Math.floor(w * 0.08), base - 6, w * 0.18, 3);

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
