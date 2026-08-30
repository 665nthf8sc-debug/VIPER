"use client";

import { PixelIcon, PixelPanel } from "@/components/pixel-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadHallOfFame, saveHallOfFame } from "@/lib/client-scores";
import { sfx } from "@/lib/sfx";
import type { HighScore } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

const W = 256;
const H = 224;
const BRICK = 4;
const GROUND = 24;
const MAX_RIVALS = 3;

type Mode = "title" | "play" | "over";

type Meteor = {
  x: number;
  y: number;
  s: number;
  vy: number;
  trail: Array<{ x: number; y: number }>;
};

type Shot = {
  x: number;
  y: number;
  vx: number;
  friendly: boolean;
  color: string;
};

type BrickCell = { x: number; y: number; color: string };
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
};

type Fighter = {
  x: number;
  y: number;
  vx: number;
  facing: number;
  frame: number;
  hp: number;
  inv: number;
  cool: number;
  muzzle: number;
  palette: Record<string, string>;
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

const BASE_PALETTE: Record<string, string> = {
  o: "#140008",
  W: "#f8f0d8",
  b: "#1a0033",
  O: "#ff6a00",
  y: "#ffcc00",
  R: "#e02020",
  ".": "",
};

const RIVAL_KITS: Array<Record<string, string>> = [
  { ...BASE_PALETTE, O: "#3d7cff", W: "#d0e4ff" },
  { ...BASE_PALETTE, O: "#22c55e", W: "#d8ffe4" },
  { ...BASE_PALETTE, O: "#ff4dae", W: "#ffd4ee" },
  { ...BASE_PALETTE, O: "#3cdcff", W: "#d4f7ff" },
];

function drawSprite(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  x: number,
  y: number,
  flip = false,
  palette = BASE_PALETTE
) {
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j];
    for (let i = 0; i < row.length; i++) {
      const color = palette[row[i]];
      if (!color) continue;
      const px = flip ? x + (row.length - 1 - i) : x + i;
      ctx.fillStyle = color;
      ctx.fillRect(px, y + j, 1, 1);
    }
  }
}

function drawGun(
  ctx: CanvasRenderingContext2D,
  fighter: Fighter,
  flash: boolean
) {
  const y = fighter.y + 9;
  const facing = fighter.facing > 0;
  const x = facing ? fighter.x + 12 : fighter.x - 8;
  ctx.fillStyle = "#2a2a38";
  ctx.fillRect(x, y, 9, 3);
  ctx.fillRect(facing ? x : x + 5, y + 2, 3, 4);
  ctx.fillStyle = "#6a6a78";
  ctx.fillRect(facing ? x + 1 : x + 1, y + 1, 7, 1);
  if (flash) {
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(facing ? x + 9 : x - 3, y, 4, 3);
    ctx.fillStyle = "#fff4c2";
    ctx.fillRect(facing ? x + 11 : x - 4, y + 1, 3, 1);
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
  const keys = useRef({ left: false, right: false, attack: false });
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
    let spawnMeteorIn = 28;
    let spawnRivalIn = 40;
    let shake = 0;
    let hi = 0;

    const player: Fighter = {
      x: 120,
      y: H - GROUND - 16,
      vx: 0,
      facing: 1,
      frame: 0,
      hp: 3,
      inv: 0,
      cool: 0,
      muzzle: 0,
      palette: BASE_PALETTE,
    };
    const bricks = makeCity();
    let meteors: Meteor[] = [];
    let rivals: Fighter[] = [];
    let shots: Shot[] = [];
    let parts: Particle[] = [];

    const reset = () => {
      player.x = 120;
      player.y = H - GROUND - 16;
      player.vx = 0;
      player.facing = 1;
      player.frame = 0;
      player.hp = 3;
      player.inv = 0;
      player.cool = 0;
      player.muzzle = 0;
      meteors = [];
      rivals = [];
      shots = [];
      parts = [];
      tick = 0;
      spawnMeteorIn = 28;
      spawnRivalIn = 20;
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

    const hurtPlayer = () => {
      if (player.inv > 0) return;
      player.hp -= 1;
      player.inv = 55;
      shake = 6;
      boom(player.x + 8, player.y + 8, 10, "#ff6a00");
      sfx.hit();
      if (player.hp <= 0) endGame();
    };

    const endGame = () => {
      if (modeRef.current !== "play") return;
      modeRef.current = "over";
      setMode("over");
      setScore(scoreRef.current);
      sfx.gameOver();
    };

    const fire = (fighter: Fighter, friendly: boolean) => {
      shots.push({
        x: fighter.facing > 0 ? fighter.x + 20 : fighter.x - 6,
        y: fighter.y + 10,
        vx: fighter.facing * (friendly ? 3.4 : 2.6),
        friendly,
        color: friendly ? "#ffcc00" : fighter.palette.O,
      });
      fighter.muzzle = 4;
      fighter.cool = friendly ? 9 : 32;
      sfx.shoot();
    };

    const spawnRival = () => {
      if (rivals.length >= MAX_RIVALS) return;
      const left = Math.random() > 0.5;
      rivals.push({
        x: left ? 8 : W - 24,
        y: H - GROUND - 16,
        vx: 0,
        facing: left ? 1 : -1,
        frame: 0,
        hp: 2,
        inv: 20,
        cool: 24,
        muzzle: 0,
        palette: RIVAL_KITS[rivals.length % RIVAL_KITS.length],
      });
    };

    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") keys.current.left = down;
      if (e.code === "ArrowRight" || e.code === "KeyD") keys.current.right = down;
      if (
        e.code === "Space" ||
        e.code === "KeyZ" ||
        e.code === "KeyX" ||
        e.code === "ArrowUp"
      ) {
        keys.current.attack = down;
        if (down && modeRef.current === "play") e.preventDefault();
      }
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

      for (const b of bricks) {
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

        spawnMeteorIn -= 1;
        if (spawnMeteorIn <= 0) {
          const aim = Math.random() > 0.35;
          meteors.push({
            x: aim
              ? player.x + (Math.random() - 0.5) * 28
              : 8 + Math.random() * (W - 24),
            y: -10,
            s: 6,
            vy: 1.6 + Math.min(2.4, scoreRef.current / 700) + Math.random() * 0.5,
            trail: [],
          });
          spawnMeteorIn = Math.max(14, 36 - Math.floor(scoreRef.current / 180));
        }

        spawnRivalIn -= 1;
        if (spawnRivalIn <= 0) {
          spawnRival();
          spawnRivalIn = Math.max(90, 160 - Math.floor(scoreRef.current / 80));
        }

        if (keys.current.left) player.vx = -1.8;
        else if (keys.current.right) player.vx = 1.8;
        else player.vx *= 0.6;
        player.x = Math.max(2, Math.min(W - 18, player.x + player.vx));
        if (player.vx > 0.2) player.facing = 1;
        if (player.vx < -0.2) player.facing = -1;
        if (Math.abs(player.vx) > 0.4 && tick % 6 === 0) player.frame ^= 1;
        if (player.inv > 0) player.inv -= 1;
        if (player.cool > 0) player.cool -= 1;
        if (player.muzzle > 0) player.muzzle -= 1;

        if (keys.current.attack && player.cool === 0) {
          fire(player, true);
        }

        for (let i = rivals.length - 1; i >= 0; i--) {
          const rival = rivals[i];
          if (rival.hp <= 0) {
            boom(rival.x + 8, rival.y + 8, 12, rival.palette.O);
            rivals.splice(i, 1);
            scoreRef.current += 80;
            continue;
          }
          if (rival.inv > 0) rival.inv -= 1;
          if (rival.cool > 0) rival.cool -= 1;
          if (rival.muzzle > 0) rival.muzzle -= 1;

          const incoming = meteors.find(
            (m) => Math.abs(m.x - rival.x) < 16 && m.y < rival.y && m.y > rival.y - 70
          );
          const gap = rival.x - player.x;
          if (incoming) {
            rival.vx = incoming.x < rival.x ? 1.6 : -1.6;
          } else if (Math.abs(gap) > 70) {
            rival.vx = player.x > rival.x ? 0.95 : -0.95;
          } else if (Math.abs(gap) < 28) {
            rival.vx = gap > 0 ? 1.1 : -1.1;
          } else {
            rival.vx *= 0.45;
          }
          rival.facing = player.x >= rival.x ? 1 : -1;
          if (rival.cool === 0 && Math.abs(gap) > 18 && Math.abs(gap) < 140) {
            fire(rival, false);
          }
          rival.x = Math.max(2, Math.min(W - 18, rival.x + rival.vx));
          rival.facing = player.x >= rival.x ? 1 : -1;
          if (Math.abs(rival.vx) > 0.3 && tick % 6 === 0) rival.frame ^= 1;
        }

        for (let i = shots.length - 1; i >= 0; i--) {
          const shot = shots[i];
          shot.x += shot.vx;
          if (shot.x < -8 || shot.x > W + 8) {
            shots.splice(i, 1);
            continue;
          }
          let spent = false;
          if (shot.friendly) {
            for (let r = rivals.length - 1; r >= 0; r--) {
              const rival = rivals[r];
              if (aabb(shot.x, shot.y, 5, 2, rival.x + 2, rival.y + 2, 12, 14)) {
                rival.hp -= 1;
                rival.inv = 10;
                rival.x += shot.vx > 0 ? 6 : -6;
                boom(shot.x, shot.y, 5, shot.color);
                scoreRef.current += 35;
                sfx.ko();
                spent = true;
                break;
              }
            }
          } else if (
            player.inv === 0 &&
            aabb(shot.x, shot.y, 5, 2, player.x + 2, player.y + 2, 12, 14)
          ) {
            hurtPlayer();
            spent = true;
          }
          if (!spent) {
            for (let m = meteors.length - 1; m >= 0; m--) {
              const rock = meteors[m];
              if (aabb(shot.x, shot.y, 5, 2, rock.x, rock.y, rock.s, rock.s)) {
                boom(rock.x, rock.y, 8, "#ff6a00");
                meteors.splice(m, 1);
                if (shot.friendly) scoreRef.current += 15;
                spent = true;
                break;
              }
            }
          }
          if (spent) shots.splice(i, 1);
        }

        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.trail.push({ x: m.x, y: m.y });
          if (m.trail.length > 7) m.trail.shift();
          m.y += m.vy;
          m.x -= 0.12;

          let dead = false;
          if (
            player.inv === 0 &&
            aabb(player.x + 2, player.y + 2, 12, 14, m.x, m.y, m.s, m.s)
          ) {
            hurtPlayer();
            dead = true;
          }

          for (let r = rivals.length - 1; r >= 0; r--) {
            const rival = rivals[r];
            if (aabb(rival.x + 2, rival.y + 2, 12, 14, m.x, m.y, m.s, m.s)) {
              boom(rival.x + 8, rival.y + 8, 10, "#ff6a00");
              rivals.splice(r, 1);
              scoreRef.current += 25;
              dead = true;
            }
          }

          if (!dead && m.y + m.s >= H - GROUND) {
            boom(m.x, H - GROUND, 4, "#ff6a00");
            dead = true;
          }

          if (dead || m.y > H) meteors.splice(i, 1);
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

      for (const shot of shots) {
        ctx.fillStyle = "#140008";
        ctx.fillRect(shot.x, shot.y, 6, 3);
        ctx.fillStyle = shot.color;
        ctx.fillRect(shot.x + 1, shot.y, 5, 2);
      }

      for (const rival of rivals) {
        if (rival.inv === 0 || Math.floor(tick / 4) % 2 === 0) {
          drawSprite(
            ctx,
            rival.frame ? FOX_B : FOX_A,
            Math.floor(rival.x),
            Math.floor(rival.y),
            rival.facing < 0,
            rival.palette
          );
          drawGun(ctx, rival, rival.muzzle > 0);
        }
      }

      if (player.inv === 0 || Math.floor(tick / 4) % 2 === 0) {
        drawSprite(
          ctx,
          player.frame ? FOX_B : FOX_A,
          Math.floor(player.x),
          Math.floor(player.y),
          player.facing < 0
        );
        drawGun(ctx, player, player.muzzle > 0);
      }

      ctx.fillStyle = "#00e800";
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textBaseline = "top";
      ctx.fillText(`SCORE ${padScore(scoreRef.current)}`, 8, 8);
      hi = Math.max(hi, scoreRef.current, scoresRef.current[0]?.score ?? 0);
      ctx.fillText(`HI ${padScore(hi)}`, 152, 8);
      for (let i = 0; i < player.hp; i++) {
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
        ctx.fillText("DODGE THE ROCKS.", 56, 100);
        ctx.fillText("BLAST THE SQUAD.", 56, 116);
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
        ctx.fillText("ELIMINATED", 72, 78);
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

  const hold = (dir: "left" | "right" | "attack", on: boolean) => {
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
            <div className="mt-4 grid grid-cols-3 gap-2 sm:hidden">
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
                variant="pixel"
                className="h-16 text-xs"
                onPointerDown={() => hold("attack", true)}
                onPointerUp={() => hold("attack", false)}
                onPointerLeave={() => hold("attack", false)}
              >
                FIRE
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
                className="hidden h-11 px-3 sm:inline-flex"
                onPointerDown={() => hold("attack", true)}
                onPointerUp={() => hold("attack", false)}
                onPointerLeave={() => hold("attack", false)}
              >
                FIRE
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
                Arrows move. Hold Space / Z / FIRE to shoot. Dodge rocks,
                beam the other droppers.
              </p>
            </div>

            {mode === "over" ? (
              <div className="dialog-box mt-4 p-4">
                <p className="font-press mb-3 text-[10px] text-[#e02020]">
                  ELIMINATED
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
              Survive the rocks. Gun down the other squad. Beat VIP if you
              can.
            </p>
          </div>
        </div>
      </PixelPanel>
    </section>
  );
}
