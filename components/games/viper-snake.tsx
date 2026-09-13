"use client";

import { Button } from "@/components/ui/button";
import { awardArcade } from "@/lib/arcade/save";
import { sfx } from "@/lib/sfx";
import { useEffect, useRef, useState } from "react";

const COLS = 24;
const ROWS = 16;
const CELL = 18;
const W = COLS * CELL;
const H = ROWS * CELL;

type Pt = { x: number; y: number };

export function ViperSnake({ onExit }: { onExit?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let dir: Pt = { x: 1, y: 0 };
    let pending: Pt = { x: 1, y: 0 };
    let snake: Pt[] = [
      { x: 6, y: 8 },
      { x: 5, y: 8 },
      { x: 4, y: 8 },
    ];
    let llama: Pt = { x: 14, y: 8 };
    let food = 0;
    let dead = false;
    let awarded = false;
    let acc = 0;
    let last = performance.now();
    let storm = 0;
    let stepEvery = 0.18;

    const place = () => {
      for (let n = 0; n < 80; n++) {
        const p = {
          x: storm + 1 + Math.floor(Math.random() * (COLS - 2 - storm * 2)),
          y: storm + 1 + Math.floor(Math.random() * (ROWS - 2 - storm * 2)),
        };
        if (!snake.some((s) => s.x === p.x && s.y === p.y)) return p;
      }
      return { x: 12, y: 8 };
    };

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "a" || k === "arrowleft") pending = dir.x === 1 ? dir : { x: -1, y: 0 };
      if (k === "d" || k === "arrowright") pending = dir.x === -1 ? dir : { x: 1, y: 0 };
      if (k === "w" || k === "arrowup") pending = dir.y === 1 ? dir : { x: 0, y: -1 };
      if (k === "s" || k === "arrowdown") pending = dir.y === -1 ? dir : { x: 0, y: 1 };
      if (k === "r" && dead) {
        dir = { x: 1, y: 0 };
        pending = dir;
        snake = [
          { x: 6, y: 8 },
          { x: 5, y: 8 },
          { x: 4, y: 8 },
        ];
        llama = { x: 14, y: 8 };
        food = 0;
        dead = false;
        awarded = false;
        storm = 0;
        stepEvery = 0.18;
        setScore(0);
      }
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += dt;
      if (!dead && acc >= stepEvery) {
        acc = 0;
        dir = pending;
        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        const hitWall =
          head.x < storm ||
          head.y < storm ||
          head.x >= COLS - storm ||
          head.y >= ROWS - storm;
        const hitSelf = snake.some((s) => s.x === head.x && s.y === head.y);
        if (hitWall || hitSelf) {
          dead = true;
          if (!awarded) {
            awarded = true;
            awardArcade("snake", food * 10, { food });
            sfx.gameOver();
          }
        } else {
          snake.unshift(head);
          if (head.x === llama.x && head.y === llama.y) {
            food += 1;
            setScore(food * 10);
            sfx.llama();
            stepEvery = Math.max(0.07, 0.18 - food * 0.006);
            if (food % 8 === 0) storm = Math.min(4, storm + 1);
            llama = place();
          } else {
            snake.pop();
          }
        }
      }
      ctx.fillStyle = "#0a0018";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#3a146680";
      ctx.fillRect(0, 0, W, storm * CELL);
      ctx.fillRect(0, H - storm * CELL, W, storm * CELL);
      ctx.fillRect(0, 0, storm * CELL, H);
      ctx.fillRect(W - storm * CELL, 0, storm * CELL, H);
      ctx.strokeStyle = "#FF008022";
      for (let x = 0; x < COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL, 0);
        ctx.lineTo(x * CELL, H);
        ctx.stroke();
      }
      ctx.fillStyle = "#ffcc00";
      ctx.fillRect(llama.x * CELL + 2, llama.y * CELL + 2, CELL - 4, CELL - 4);
      ctx.fillStyle = "#FF0080";
      ctx.fillRect(llama.x * CELL + 5, llama.y * CELL + 5, 6, 6);
      snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? "#00FFFF" : i % 2 ? "#FF0080" : "#7a5cff";
        ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
      });
      ctx.fillStyle = "#f8f0d8";
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText(`LLAMAS ${food}`, 8, 16);
      if (dead) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#FF0080";
        ctx.fillText("STORM GOT YOU", 120, 150);
        ctx.fillStyle = "#00FFFF";
        ctx.fillText("R TO RETRY", 150, 176);
      }
      raf = requestAnimationFrame(loop);
    };
    let raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="arcade-embed-game">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-press text-[10px] text-[#00ffff]">VIPER SNAKE</p>
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
        Eat llamas. Storm closes in. Score {score}
      </p>
    </div>
  );
}
