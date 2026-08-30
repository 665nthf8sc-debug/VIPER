"use client";

import { PixelIcon, PixelPanel } from "@/components/pixel-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { HighScore } from "@/lib/types";
import { loadHallOfFame, saveHallOfFame } from "@/lib/client-scores";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

const W = 256;
const H = 224;
const BRICK = 4;
const GROUND = 24;

type Mode = "title" | "play" | "over";

type Meteor = {
  x: number;
  y: number;
  s: number;
  vy: number;
  trail: Array<{ x: number; y: number }>;
};

type BrickCell = { x: number; y: number; color: string; alive: boolean };
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
};

const FOX_A = [
  "......oooo......",
  ".....oWWWWo.....",
  "....oWWWWWWo....",
  "....oWbWWbWo....",
  "....oWWWWWWo....",
  ".....oWWWWo.....",
  "....oooooooo....",
  "...ooOOOOOOoo...",
  "..ooOOOOOOOOoo..",
  "..oOOOOOOOOOOo..",
  "..oOOOOOOOOOOo..",
  "...oOOOo.oOOo...",
  "...oOOo...oOOo..",
  "...oooo...oooo..",
  "....oo.....oo...",
  "....oo.....oo...",
];

const FOX_B = [
  "......oooo......",
  ".....oWWWWo.....",
  "....oWWWWWWo....",
  "....oWbWWbWo....",
  "....oWWWWWWo....",
  ".....oWWWWo.....",
  "....oooooooo....",
  "...ooOOOOOOoo...",
  "..ooOOOOOOOOoo..",
  "..oOOOOOOOOOOo..",
  "..oOOOOOOOOOOo..",
  "...oOOOo.oOOo...",
  "....oOOo.oOOo...",
  "....oooo.oooo...",
  ".....oo...oo....",
  "....oo.....oo...",
];

const METEOR = [
  "..yy..",
  ".yOOy.",
  "yORROy",
  "yORROy",
  ".yOOy.",
  "..yy..",
];

const PALETTE: Record<string, string> = {
  o: "#140008",
  W: "#f8f0d8",
  b: "#1a0033",
  O: "#ff6a00",
  y: "#ffcc00",
  R: "#e02020",
  ".": "",
};

function drawSprite(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  x: number,
  y: number,
  flip = false
) {
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j];
    for (let i = 0; i < row.length; i++) {
      const color = PALETTE[row[i]];
      if (!color) continue;
      const px = flip ? x + (row.length - 1 - i) : x + i;
      ctx.fillStyle = color;
      ctx.fillRect(px, y + j, 1, 1);
    }
  }
}

function makeCity(): BrickCell[] {
  const bricks: BrickCell[] = [];
  const towers = [
    { x: 10, w: 28, h: 56, tone: "#6a6a78" },
    { x: 42, w: 36, h: 88, tone: "#7a7a88" },
    { x: 84, w: 44, h: 120, tone: "#8a8a96" },
    { x: 134, w: 36, h: 96, tone: "#747484" },
    { x: 176, w: 28, h: 64, tone: "#686878" },
    { x: 210, w: 32, h: 48, tone: "#5c5c6c" },
  ];
  const groundY = H - GROUND;
  for (const t of towers) {
    const rows = Math.floor(t.h / BRICK);
    const cols = Math.floor(t.w / BRICK);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const window = r > 1 && r % 2 === 0 && c % 2 === 1;
        bricks.push({
          x: t.x + c * BRICK,
          y: groundY - t.h + r * BRICK,
          color: window ? "#ffcc66" : t.tone,
          alive: true,
        });
      }
    }
  }
  return bricks;
}

function aabb(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function padScore(n: number) {
  return String(Math.max(0, Math.min(999999, Math.floor(n)))).padStart(6, "0");
}

export function MeteorGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef({ left: false, right: false });
  const modeRef = useRef<Mode>("title");
  const scoreRef = useRef(0);
  const [mode, setMode] = useState<Mode>("title");
  const [score, setScore] = useState(0);
  const [initials, setInitials] = useState("VIP");
  const [scores, setScores] = useState<HighScore[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const wantStart = useRef(false);
  const scoresRef = useRef<HighScore[]>([]);

  useEffect(() => {
    const ac = new AbortController();
    loadHallOfFame()
      .then((next) => {
        if (ac.signal.aborted) return;
        scoresRef.current = next;
        setScores(next);
        setError("");
      })
      .catch(() => {
        if (ac.signal.aborted) return;
        setError("HALL OF FAME OFFLINE");
      });
    return () => ac.abort();
  }, []);

  useEffect(() => {
    sfx.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let tick = 0;
    let spawnIn = 50;
    let shake = 0;
    let hi = 0;

    const player = {
      x: 120,
      y: H - GROUND - 16,
      vx: 0,
      lives: 3,
      inv: 0,
      facing: 1,
      frame: 0,
    };
    let bricks = makeCity();
    let meteors: Meteor[] = [];
    let parts: Particle[] = [];

    const reset = () => {
      player.x = 120;
      player.y = H - GROUND - 16;
      player.vx = 0;
      player.lives = 3;
      player.inv = 0;
      player.facing = 1;
      bricks = makeCity();
      meteors = [];
      parts = [];
      tick = 0;
      spawnIn = 50;
      scoreRef.current = 0;
      setScore(0);
    };

    const boom = (x: number, y: number, n: number, color: string) => {
      for (let i = 0; i < n; i++) {
        parts.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 2.4,
          vy: -Math.random() * 2.2,
          color,
          life: 20 + Math.random() * 18,
        });
      }
    };

    const crush = (cx: number, cy: number, radius: number) => {
      let hit = false;
      for (const b of bricks) {
        if (!b.alive) continue;
        const dx = b.x + 2 - cx;
        const dy = b.y + 2 - cy;
        if (dx * dx + dy * dy < radius * radius) {
          b.alive = false;
          hit = true;
          boom(b.x, b.y, 2, b.color);
        }
      }
      return hit;
    };

    const endGame = () => {
      if (modeRef.current !== "play") return;
      modeRef.current = "over";
      setMode("over");
      setScore(scoreRef.current);
      sfx.gameOver();
    };

    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") keys.current.left = down;
      if (e.code === "ArrowRight" || e.code === "KeyD") keys.current.right = down;
      if (down && (e.code === "Enter" || e.code === "Space")) {
        if (modeRef.current === "title") {
          e.preventDefault();
          reset();
          modeRef.current = "play";
          setMode("play");
          sfx.start();
        }
      }
      if (
        down &&
        (e.code === "ArrowLeft" ||
          e.code === "ArrowRight" ||
          e.code === "Space")
      ) {
        e.preventDefault();
      }
    };
    const down = (e: KeyboardEvent) => onKey(e, true);
    const up = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    const loop = () => {
      if (!running) return;
      ctx.imageSmoothingEnabled = false;
      const ox = shake ? (Math.random() - 0.5) * shake : 0;
      const oy = shake ? (Math.random() - 0.5) * shake : 0;
      if (shake > 0) shake *= 0.85;

      ctx.fillStyle = "#140028";
      ctx.fillRect(0, 0, W, H);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#1a0033");
      sky.addColorStop(1, "#3a1020");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#f8f0d8";
      for (let i = 0; i < 18; i++) {
        const sx = (i * 73) % W;
        const sy = (i * 37) % 90;
        if ((tick + i) % 40 < 28) ctx.fillRect(sx, sy, 1, 1);
      }

      ctx.save();
      ctx.translate(ox, oy);

      ctx.fillStyle = "#2a1a14";
      ctx.fillRect(0, H - GROUND, W, GROUND);
      ctx.fillStyle = "#1a100c";
      ctx.fillRect(0, H - GROUND, W, 3);
      ctx.fillStyle = "#ffcc00";
      for (let x = 8; x < W; x += 16) ctx.fillRect(x, H - 12, 8, 2);

      const aliveBricks = bricks.filter((b) => b.alive);
      for (const b of aliveBricks) {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, BRICK, BRICK);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(b.x + BRICK - 1, b.y + BRICK - 1, 1, 1);
      }

      if (wantStart.current) {
        wantStart.current = false;
        reset();
        modeRef.current = "play";
        setMode("play");
        sfx.start();
      }

      if (modeRef.current === "play") {
        tick += 1;
        if (tick % 5 === 0) {
          scoreRef.current += 1;
          if (tick % 15 === 0) setScore(scoreRef.current);
        }

        spawnIn -= 1;
        if (spawnIn <= 0) {
          const big = Math.random() > 0.82;
          meteors.push({
            x: 8 + Math.random() * (W - 24),
            y: -10,
            s: big ? 10 : 6,
            vy: 1.15 + Math.min(2.2, scoreRef.current / 900) + Math.random() * 0.4,
            trail: [],
          });
          spawnIn = Math.max(16, 58 - Math.floor(scoreRef.current / 120));
        }

        if (keys.current.left) player.vx = -1.7;
        else if (keys.current.right) player.vx = 1.7;
        else player.vx *= 0.6;
        player.x = Math.max(2, Math.min(W - 18, player.x + player.vx));
        if (player.vx > 0.2) player.facing = 1;
        if (player.vx < -0.2) player.facing = -1;
        if (Math.abs(player.vx) > 0.4 && tick % 6 === 0) player.frame ^= 1;
        if (player.inv > 0) player.inv -= 1;

        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.trail.push({ x: m.x, y: m.y });
          if (m.trail.length > 7) m.trail.shift();
          m.y += m.vy;
          m.x -= 0.15;

          let dead = false;
          if (
            player.inv === 0 &&
            aabb(player.x + 2, player.y + 2, 12, 14, m.x, m.y, m.s, m.s)
          ) {
            player.lives -= 1;
            player.inv = 70;
            shake = 6;
            boom(player.x + 8, player.y + 8, 10, "#ff6a00");
            sfx.hit();
            dead = true;
            if (player.lives <= 0) endGame();
          }

          if (!dead && crush(m.x + m.s / 2, m.y + m.s / 2, m.s + 3)) {
            shake = 4;
            sfx.crunch();
            scoreRef.current += 8;
            dead = true;
            if (bricks.filter((b) => b.alive).length < 14) endGame();
          }

          if (!dead && m.y + m.s >= H - GROUND) {
            boom(m.x, H - GROUND, 6, "#ff6a00");
            dead = true;
          }

          if (dead || m.y > H) meteors.splice(i, 1);
        }

        if (bricks.filter((b) => b.alive).length < 10 && modeRef.current === "play") {
          endGame();
        }
      }

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life -= 1;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 2, 2);
        if (p.life <= 0) parts.splice(i, 1);
      }

      for (const m of meteors) {
        m.trail.forEach((t, idx) => {
          ctx.fillStyle = idx > 4 ? "#ffcc00" : "#b33d00";
          ctx.fillRect(t.x + 1, t.y - 2, 3, 3);
        });
        drawSprite(ctx, METEOR, Math.floor(m.x), Math.floor(m.y));
      }

      if (player.inv === 0 || Math.floor(tick / 4) % 2 === 0) {
        drawSprite(
          ctx,
          player.frame ? FOX_B : FOX_A,
          Math.floor(player.x),
          Math.floor(player.y),
          player.facing < 0
        );
      }

      ctx.fillStyle = "#00e800";
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textBaseline = "top";
      ctx.fillText(`SCORE ${padScore(scoreRef.current)}`, 8, 8);
      hi = Math.max(hi, scoreRef.current, scoresRef.current[0]?.score ?? 0);
      ctx.fillText(`HI ${padScore(hi)}`, 152, 8);
      for (let i = 0; i < player.lives; i++) {
        ctx.fillStyle = "#e02020";
        ctx.fillRect(8 + i * 10, 20, 8, 6);
        ctx.fillRect(10 + i * 10, 18, 4, 8);
      }

      if (modeRef.current === "title") {
        ctx.fillStyle = "rgba(10,0,20,0.55)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ffcc00";
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText("METEOR STRIKE", 54, 70);
        ctx.fillStyle = "#f8f0d8";
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText("DODGE. SURVIVE.", 64, 100);
        ctx.fillText("SAVE THE SKYLINE.", 56, 116);
        if (Math.floor(tick / 30) % 2 === 0) {
          ctx.fillStyle = "#ff6a00";
          ctx.fillText("PRESS START", 76, 150);
        }
      }

      if (modeRef.current === "over") {
        ctx.fillStyle = "rgba(10,0,20,0.72)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#e02020";
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText("TILTED DESTROYED", 36, 78);
        ctx.fillStyle = "#ffcc00";
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(`SCORE ${padScore(scoreRef.current)}`, 72, 110);
      }

      ctx.restore();
      tick += modeRef.current === "title" ? 1 : 0;
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const hold = (dir: "left" | "right", on: boolean) => {
    keys.current[dir] = on;
  };

  const startRun = () => {
    setSaveMsg("");
    setInitials("VIP");
    wantStart.current = true;
    sfx.coin();
  };

  const submitScore = async () => {
    const letters = initials.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
    if (letters.length !== 3) {
      setSaveMsg("NEED 3 LETTERS");
      return;
    }
    setSaving(true);
    setSaveMsg("");
    try {
      const next = await saveHallOfFame(letters, score);
      scoresRef.current = next;
      setScores(next);
      setSaveMsg("NAME ENTERED");
      sfx.coin();
    } catch {
      setSaveMsg("SAVE FAILED");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="game" className="section-wrap py-16 sm:py-20">
      <PixelPanel title="8-BIT CART  •  METEOR STRIKE" tone="orange">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div>
            <div className="pixel-bevel bg-[#05000a] p-2 sm:p-3">
              <canvas
                ref={canvasRef}
                width={W}
                height={H}
                className="pixelated mx-auto block h-auto w-full max-w-[768px] bg-black"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:hidden">
              <Button
                variant="arcade"
                className="h-16 text-xs"
                onPointerDown={() => hold("left", true)}
                onPointerUp={() => hold("left", false)}
                onPointerLeave={() => hold("left", false)}
              >
                ◀ LEFT
              </Button>
              <Button
                variant="arcade"
                className="h-16 text-xs"
                onPointerDown={() => hold("right", true)}
                onPointerUp={() => hold("right", false)}
                onPointerLeave={() => hold("right", false)}
              >
                RIGHT ▶
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="pixel" className="h-11 px-4" onClick={startRun}>
                {mode === "over" ? "INSERT COIN TO RETRY" : "INSERT COIN"}
              </Button>
              <Button
                variant="arcade"
                className="h-11 px-3"
                onClick={() => {
                  setMuted((m) => !m);
                  sfx.select();
                }}
              >
                {muted ? "SFX OFF" : "SFX ON"}
              </Button>
              <p className="font-vt text-lg text-[#c9a0ff]">
                Arrows / A D to run. Touch pads on phones.
              </p>
            </div>

            {mode === "over" ? (
              <div className="dialog-box mt-4 p-4">
                <p className="font-press mb-3 text-[10px] text-[#e02020]">
                  TILTED DESTROYED
                </p>
                <p className="font-vt mb-3 text-xl">
                  Enter 3 initials like a 1985 arcade cabinet.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    value={initials}
                    maxLength={3}
                    onChange={(e) =>
                      setInitials(
                        e.target.value.toUpperCase().replace(/[^A-Z]/g, "")
                      )
                    }
                    className="font-press h-12 w-28 rounded-none border-4 border-[#f8f0d8] bg-[#001a00] text-center text-xl tracking-[0.4em] text-[#00e800]"
                    aria-label="Arcade initials"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void submitScore();
                    }}
                  />
                  <Button
                    variant="pixel"
                    className="h-12 px-4"
                    disabled={saving}
                    onClick={() => void submitScore()}
                  >
                    {saving ? "SAVING..." : "SAVE SCORE"}
                  </Button>
                </div>
                {saveMsg ? (
                  <p className="font-press mt-3 text-[10px] text-[#ffcc00]">
                    {saveMsg}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <PixelIcon name="game" />
              <h3 className="font-press text-[10px] text-[#ffcc00] sm:text-xs">
                TOP PLAYERS
              </h3>
            </div>
            <ol className="pixel-bevel bg-[#05000a] p-3">
              {error ? (
                <li className="font-press py-6 text-center text-[10px] text-[#e02020]">
                  {error}
                </li>
              ) : null}
              {!error && scores.length === 0 ? (
                <li className="font-vt py-6 text-center text-xl text-[#c9a0ff]">
                  No scores yet. Insert coin.
                </li>
              ) : null}
              {scores.map((row, i) => (
                <li
                  key={row.id}
                  className={cn(
                    "font-press flex items-center justify-between gap-3 px-2 py-2 text-[10px] sm:text-xs",
                    i === 0 ? "bg-[#3d1466] text-[#ffcc00]" : "text-[#00e800]"
                  )}
                >
                  <span className="text-[#f8f0d8]">{String(i + 1).padStart(2, "0")}</span>
                  <span>{row.initials}</span>
                  <span className="hud-digits">{padScore(row.score)}</span>
                </li>
              ))}
            </ol>
            <p className="font-vt mt-4 text-lg text-[#c9a0ff]">
              High scores save to the arcade ROM on this machine. Beat VIP if
              you can.
            </p>
          </div>
        </div>
      </PixelPanel>
    </section>
  );
}
