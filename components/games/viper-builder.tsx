"use client";

import { Button } from "@/components/ui/button";
import { sfx } from "@/lib/sfx";
import { useEffect, useRef } from "react";

const COLS = 18;
const ROWS = 10;
const CELL = 28;
const W = COLS * CELL;
const H = ROWS * CELL;
const PAL = ["#FF0080", "#00FFFF", "#7a5cff", "#ffcc00", "#39ff14", "#141018"];

export function ViperBuilder({ onExit }: { onExit?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(5));
    let cx = 8;
    let cy = 5;
    let pal = 0;
    const keys = new Set<string>();
    let cool = 0;
    let last = performance.now();

    const down = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase());
      if (e.key >= "1" && e.key <= "5") pal = Number(e.key) - 1;
      if (e.key === " ") e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      cool = Math.max(0, cool - dt);
      if (cool === 0) {
        if (keys.has("a") || keys.has("arrowleft")) {
          cx = Math.max(0, cx - 1);
          cool = 0.12;
        }
        if (keys.has("d") || keys.has("arrowright")) {
          cx = Math.min(COLS - 1, cx + 1);
          cool = 0.12;
        }
        if (keys.has("w") || keys.has("arrowup")) {
          cy = Math.max(0, cy - 1);
          cool = 0.12;
        }
        if (keys.has("s") || keys.has("arrowdown")) {
          cy = Math.min(ROWS - 1, cy + 1);
          cool = 0.12;
        }
      }
      if (keys.has(" ") || keys.has("e")) {
        grid[cy][cx] = pal;
      }
      if (keys.has("x") || keys.has("backspace")) grid[cy][cx] = 5;
      ctx.fillStyle = "#080010";
      ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          ctx.fillStyle = PAL[grid[y][x]];
          ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
        }
      }
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(cx * CELL + 1, cy * CELL + 1, CELL - 2, CELL - 2);
      ctx.fillStyle = PAL[pal];
      ctx.fillRect(8, H - 0, 0, 0);
      raf = requestAnimationFrame(loop);
    };
    let raf = requestAnimationFrame(loop);
    canvas.addEventListener("pointerdown", (e) => {
      const r = canvas.getBoundingClientRect();
      const x = Math.floor(((e.clientX - r.left) / r.width) * COLS);
      const y = Math.floor(((e.clientY - r.top) / r.height) * ROWS);
      if (x >= 0 && y >= 0 && x < COLS && y < ROWS) {
        grid[y][x] = pal;
        cx = x;
        cy = y;
        sfx.pickup();
      }
    });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return (
    <div className="arcade-embed-game">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-press text-[10px] text-[#39ff14]">VIPER BUILDER</p>
        {onExit ? (
          <Button variant="arcade" className="h-10 px-4" onClick={onExit}>
            EXIT LAB
          </Button>
        ) : null}
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="mx-auto block w-full max-w-[720px] bg-black"
        style={{ imageRendering: "pixelated" }}
      />
      <p className="font-vt mt-3 text-lg text-[#c9a0ff]">
        WASD move cursor · 1-5 palette · Space/click place · X erase
      </p>
    </div>
  );
}
