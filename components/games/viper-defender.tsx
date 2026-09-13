"use client";

import { Button } from "@/components/ui/button";
import { awardArcade } from "@/lib/arcade/save";
import { sfx } from "@/lib/sfx";
import { useEffect, useRef, useState } from "react";

const W = 480;
const H = 340;

type Shot = { x: number; y: number; vy: number; friend: boolean };
type Inv = { x: number; y: number; hp: number };

export function ViperDefender({ onExit }: { onExit?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const keys = new Set<string>();
    let px = W / 2;
    let shield = 1;
    let cool = 0;
    let shots: Shot[] = [];
    let inv: Inv[] = [];
    let dir = 1;
    let waven = 1;
    let pts = 0;
    let dead = false;
    let awarded = false;
    let last = performance.now();

    const seed = (n: number) => {
      inv = [];
      const rows = 3 + (n > 3 ? 1 : 0);
      const cols = 8;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          inv.push({ x: 50 + c * 48, y: 40 + r * 28, hp: r === 0 ? 2 : 1 });
        }
      }
      dir = 1;
    };
    seed(1);

    const down = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase());
      if (e.key === " " || e.key.startsWith("Arrow")) e.preventDefault();
      if (e.key.toLowerCase() === "r" && dead) {
        dead = false;
        awarded = false;
        pts = 0;
        waven = 1;
        shield = 1;
        px = W / 2;
        shots = [];
        seed(1);
        setWave(1);
        setScore(0);
      }
    };
    const up = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    const loop = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      cool = Math.max(0, cool - dt);
      if (!dead) {
        if (keys.has("a") || keys.has("arrowleft")) px -= 180 * dt;
        if (keys.has("d") || keys.has("arrowright")) px += 180 * dt;
        px = Math.max(20, Math.min(W - 20, px));
        if ((keys.has(" ") || keys.has("w") || keys.has("arrowup")) && cool === 0) {
          shots.push({ x: px, y: H - 40, vy: -260, friend: true });
          cool = 0.28;
          sfx.shoot();
        }
        const step = (30 + waven * 8) * dir * dt;
        let bounce = false;
        for (const a of inv) {
          a.x += step;
          if (a.x < 16 || a.x > W - 16) bounce = true;
        }
        if (bounce) {
          dir *= -1;
          for (const a of inv) a.y += 12;
        }
        if (Math.random() < 0.008 + waven * 0.002) {
          const shooter = inv[Math.floor(Math.random() * inv.length)];
          if (shooter) shots.push({ x: shooter.x, y: shooter.y + 8, vy: 140, friend: false });
        }
        shots.forEach((s) => {
          s.y += s.vy * dt;
        });
        for (const s of shots) {
          if (s.friend) {
            for (const a of inv) {
              if (Math.abs(s.x - a.x) < 14 && Math.abs(s.y - a.y) < 12) {
                a.hp -= 1;
                s.y = -99;
                pts += 10;
                sfx.hit();
              }
            }
          } else if (Math.abs(s.x - px) < 16 && s.y > H - 48) {
            if (shield > 0) {
              shield = 0;
              s.y = H + 40;
              sfx.playerHurt();
            } else {
              dead = true;
              sfx.gameOver();
              if (!awarded) {
                awarded = true;
                awardArcade("defender", pts, { wave: waven });
              }
            }
          }
        }
        inv = inv.filter((a) => a.hp > 0);
        shots = shots.filter((s) => s.y > -10 && s.y < H + 10);
        if (inv.length === 0) {
          waven += 1;
          shield = 1;
          seed(waven);
          setWave(waven);
          sfx.xp();
        }
        if (inv.some((a) => a.y > H - 70)) {
          dead = true;
          if (!awarded) {
            awarded = true;
            awardArcade("defender", pts, { wave: waven });
            sfx.gameOver();
          }
        }
        setScore(pts);
      }
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#120028");
      g.addColorStop(1, "#050010");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#7a5cff";
      for (const a of inv) {
        ctx.fillRect(a.x - 12, a.y - 8, 24, 16);
        ctx.fillStyle = "#FF0080";
        ctx.fillRect(a.x - 4, a.y - 3, 8, 6);
        ctx.fillStyle = "#7a5cff";
      }
      ctx.fillStyle = shield ? "#00FFFF" : "#445";
      ctx.fillRect(px - 40, H - 28, 80, 6);
      ctx.fillStyle = "#FF0080";
      ctx.fillRect(px - 12, H - 44, 24, 16);
      ctx.fillStyle = "#00FFFF";
      ctx.fillRect(px - 4, H - 52, 8, 8);
      ctx.fillStyle = "#ffcc00";
      for (const s of shots) ctx.fillRect(s.x - 1, s.y - 6, 3, 10);
      ctx.fillStyle = "#f8f0d8";
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText(`WAVE ${waven}  SCORE ${pts}`, 12, 20);
      if (dead) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#FF0080";
        ctx.fillText("STORM KING WINS", 110, 160);
        ctx.fillStyle = "#00FFFF";
        ctx.fillText("R TO RETRY", 160, 188);
      }
      raf = requestAnimationFrame(loop);
    };
    let raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return (
    <div className="arcade-embed-game">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-press text-[10px] text-[#7a5cff]">VIPER DEFENDER</p>
        {onExit ? (
          <Button variant="arcade" className="h-10 px-4" onClick={onExit}>
            EXIT CABINET
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
        A/D move · Space fire. Wave {wave} · Score {score}
      </p>
    </div>
  );
}
