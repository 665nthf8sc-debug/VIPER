"use client";

import { Button } from "@/components/ui/button";
import { awardArcade } from "@/lib/arcade/save";
import { sfx } from "@/lib/sfx";
import { useEffect, useRef, useState } from "react";

const W = 480;
const H = 320;
const LANES = 8;
const LANE_H = 28;
const ROAD_Y = 56;

type Car = { x: number; y: number; w: number; vx: number; color: string };

export function ViperCrossing({ onExit }: { onExit?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef(new Set<string>());
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [over, setOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let px = W / 2;
    let py = H - 28;
    let cars: Car[] = [];
    let dist = 0;
    let life = 3;
    let dead = false;
    let acc = 0;
    let last = performance.now();
    let cool = 0;

    const spawn = (lane: number) => {
      const dir = lane % 2 === 0 ? 1 : -1;
      const speed = 40 + lane * 14 + dist * 0.02;
      cars.push({
        x: dir > 0 ? -40 : W + 40,
        y: ROAD_Y + lane * LANE_H + 4,
        w: 28 + (lane % 3) * 10,
        vx: dir * speed,
        color: lane % 2 ? "#FF0080" : "#00FFFF",
      });
    };
    for (let i = 0; i < LANES; i++) spawn(i);

    const onKey = (e: KeyboardEvent, down: boolean) => {
      keys.current[down ? "add" : "delete"](e.key.toLowerCase());
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    const down = (e: KeyboardEvent) => onKey(e, true);
    const up = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    const hold = (name: string) =>
      keys.current.has(name) ||
      (name === "a" && keys.current.has("arrowleft")) ||
      (name === "d" && keys.current.has("arrowright")) ||
      (name === "w" && keys.current.has("arrowup")) ||
      (name === "s" && keys.current.has("arrowdown"));

    const loop = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      acc += dt;
      cool = Math.max(0, cool - dt);
      if (!dead) {
        const sp = 110;
        if (hold("a")) px -= sp * dt;
        if (hold("d")) px += sp * dt;
        if (hold("w") && cool === 0) {
          py -= LANE_H;
          dist += 10;
          cool = 0.16;
          sfx.move();
        }
        if (hold("s") && cool === 0) {
          py += LANE_H;
          cool = 0.16;
        }
        px = Math.max(12, Math.min(W - 12, px));
        py = Math.max(24, Math.min(H - 18, py));
        if (py < ROAD_Y - 8) {
          dist += 50;
          py = H - 28;
          px = W / 2;
          sfx.xp();
        }
        for (const c of cars) c.x += c.vx * dt;
        cars = cars.filter((c) => c.x > -80 && c.x < W + 80);
        while (cars.length < LANES * 2) {
          spawn(Math.floor(Math.random() * LANES));
        }
        for (const c of cars) {
          if (Math.abs(c.x - px) < c.w / 2 + 8 && Math.abs(c.y + 8 - py) < 12) {
            life -= 1;
            px = W / 2;
            py = H - 28;
            sfx.hit();
            if (life <= 0) {
              dead = true;
              setOver(true);
              awardArcade("crossing", dist);
              sfx.gameOver();
            }
            setLives(life);
          }
        }
        setScore(dist);
      }
      ctx.fillStyle = "#140028";
      ctx.fillRect(0, 0, W, H);
      const sky = ctx.createLinearGradient(0, 0, 0, ROAD_Y);
      sky.addColorStop(0, "#FF0080");
      sky.addColorStop(1, "#3a1466");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, ROAD_Y - 4);
      ctx.fillStyle = "#1a3a18";
      ctx.fillRect(0, ROAD_Y - 8, W, 8);
      ctx.fillRect(0, ROAD_Y + LANES * LANE_H, W, 40);
      for (let i = 0; i < LANES; i++) {
        ctx.fillStyle = i % 2 ? "#22102a" : "#1a0a22";
        ctx.fillRect(0, ROAD_Y + i * LANE_H, W, LANE_H);
        ctx.fillStyle = "#ffcc00";
        for (let x = (acc * 80) % 28; x < W; x += 28) {
          ctx.fillRect(x, ROAD_Y + i * LANE_H + LANE_H / 2, 12, 2);
        }
      }
      for (const c of cars) {
        ctx.fillStyle = "#050008";
        ctx.fillRect(c.x - c.w / 2, c.y, c.w, 16);
        ctx.fillStyle = c.color;
        ctx.fillRect(c.x - c.w / 2 + 1, c.y + 1, c.w - 2, 14);
        ctx.fillStyle = "#e8ffff";
        ctx.fillRect(c.x - 4, c.y + 4, 8, 6);
      }
      ctx.fillStyle = "#050008";
      ctx.fillRect(px - 8, py - 14, 16, 18);
      ctx.fillStyle = "#00FFFF";
      ctx.fillRect(px - 7, py - 13, 14, 16);
      ctx.fillStyle = "#FF0080";
      ctx.fillRect(px - 4, py - 10, 8, 6);
      ctx.fillStyle = "#f8f0d8";
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText(`SCORE ${dist}`, 12, 22);
      ctx.fillText(`LIVES ${life}`, 340, 22);
      if (dead) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#FF0080";
        ctx.fillText("TILTED GOT YOU", 120, 150);
        ctx.fillStyle = "#00FFFF";
        ctx.fillText("R TO RETRY", 160, 180);
      }
      raf = requestAnimationFrame(loop);
    };
    let raf = requestAnimationFrame(loop);
    const retry = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r" && dead) {
        dead = false;
        life = 3;
        dist = 0;
        px = W / 2;
        py = H - 28;
        setOver(false);
        setLives(3);
        setScore(0);
      }
    };
    window.addEventListener("keydown", retry);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("keydown", retry);
    };
  }, []);

  return (
    <div className="arcade-embed-game">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-press text-[10px] text-[#39ff14]">VIPER CROSSING</p>
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
        className="mx-auto block w-full max-w-[720px] rounded-sm bg-black"
        style={{ imageRendering: "pixelated" }}
      />
      <p className="font-vt mt-3 text-lg text-[#c9a0ff]">
        Cross Tilted traffic. W hops a lane. Score {score} · Lives {lives}
        {over ? " · R retry" : ""}
      </p>
    </div>
  );
}
