"use client";

import { PixelIcon, PixelPanel } from "@/components/pixel-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadHallOfFame, saveHallOfFame } from "@/lib/client-scores";
import { equippedSkin, grantPlayXp } from "@/lib/pass";
import { POIS, type Poi } from "@/lib/pois";
import { sfx } from "@/lib/sfx";
import { drawBattleBus, drawGun, drawSprite, spriteRows } from "@/lib/sprites";
import type { HighScore } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

const W = 256;
const H = 224;
const BRICK = 4;
const GROUND = 24;
const MAX_RIVALS = 3;
const GRAVITY = 0.22;
const JUMP_V = -4.35;

type Mode = "title" | "bus" | "play" | "over";

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
  vy: number;
  facing: number;
  frame: number;
  hp: number;
  inv: number;
  cool: number;
  muzzle: number;
  sprite: "fox" | "chief";
  palette: Record<string, string>;
};

const RIVAL_KITS: Array<Record<string, string>> = [
  {
    o: "#140008",
    W: "#d0e4ff",
    b: "#081428",
    O: "#3d7cff",
    y: "#9ad4ff",
    G: "#3d7cff",
    V: "#d0e4ff",
    ".": "",
  },
  {
    o: "#140008",
    W: "#d8ffe4",
    b: "#082010",
    O: "#22c55e",
    y: "#a8ffc4",
    G: "#22c55e",
    V: "#d8ffe4",
    ".": "",
  },
  {
    o: "#140008",
    W: "#ffd4ee",
    b: "#2a0033",
    O: "#ff4dae",
    y: "#ffcc00",
    G: "#ff4dae",
    V: "#ffd4ee",
    ".": "",
  },
  {
    o: "#140008",
    W: "#d4f7ff",
    b: "#081820",
    O: "#3cdcff",
    y: "#f8f0d8",
    G: "#3cdcff",
    V: "#d4f7ff",
    ".": "",
  },
];

function groundY() {
  return H - GROUND - 16;
}

function makeCity(poi: Poi): BrickCell[] {
  const bricks: BrickCell[] = [];
  const floor = H - GROUND;
  for (const t of poi.towers) {
    const rows = Math.floor(t.h / BRICK);
    const cols = Math.floor(t.w / BRICK);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const window = r > 1 && r % 2 === 0 && c % 2 === 1;
        bricks.push({
          x: t.x + c * BRICK,
          y: floor - t.h + r * BRICK,
          color: window ? poi.accent : t.tone,
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

export function ViperDrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const keys = useRef({
    left: false,
    right: false,
    attack: false,
    jump: false,
  });
  const modeRef = useRef<Mode>("title");
  const scoreRef = useRef(0);
  const elimsRef = useRef(0);
  const [mode, setMode] = useState<Mode>("title");
  const [score, setScore] = useState(0);
  const [initials, setInitials] = useState("VIP");
  const [scores, setScores] = useState<HighScore[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const [xpGain, setXpGain] = useState(0);
  const [full, setFull] = useState(false);
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
    const onFs = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let tick = 0;
    let spawnRivalIn = 40;
    let shake = 0;
    let hi = 0;
    let poiIndex = 0;
    let bricks = makeCity(POIS[0]);
    let banner = "";
    let bannerLife = 0;
    let busX = -60;
    let falling = false;

    const applySkin = (fighter: Fighter) => {
      const skin = equippedSkin();
      fighter.palette = skin.palette;
      fighter.sprite = skin.sprite;
    };

    const player: Fighter = {
      x: 120,
      y: groundY(),
      vx: 0,
      vy: 0,
      facing: 1,
      frame: 0,
      hp: 3,
      inv: 0,
      cool: 0,
      muzzle: 0,
      sprite: "fox",
      palette: equippedSkin().palette,
    };
    applySkin(player);

    let rivals: Fighter[] = [];
    let shots: Shot[] = [];
    let parts: Particle[] = [];

    const reset = () => {
      applySkin(player);
      poiIndex = 0;
      bricks = makeCity(POIS[0]);
      player.x = 40;
      player.y = 48;
      player.vx = 0;
      player.vy = 0;
      player.facing = 1;
      player.frame = 0;
      player.hp = 3;
      player.inv = 0;
      player.cool = 0;
      player.muzzle = 0;
      rivals = [];
      shots = [];
      parts = [];
      tick = 0;
      spawnRivalIn = 28;
      busX = -64;
      falling = false;
      banner = "BATTLE BUS";
      bannerLife = 90;
      scoreRef.current = 0;
      elimsRef.current = 0;
      setScore(0);
      setXpGain(0);
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
      boom(player.x + 8, player.y + 8, 10, player.palette.O);
      sfx.hit();
      if (player.hp <= 0) endGame();
    };

    const endGame = () => {
      if (modeRef.current !== "play" && modeRef.current !== "bus") return;
      modeRef.current = "over";
      setMode("over");
      setScore(scoreRef.current);
      const reward = grantPlayXp(scoreRef.current, elimsRef.current);
      setXpGain(reward.gained);
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
        y: groundY(),
        vx: 0,
        vy: 0,
        facing: left ? 1 : -1,
        frame: 0,
        hp: 2,
        inv: 20,
        cool: 24,
        muzzle: 0,
        sprite: "fox",
        palette: RIVAL_KITS[rivals.length % RIVAL_KITS.length],
      });
    };

    const changePoi = (dir: number) => {
      poiIndex = (poiIndex + dir + POIS.length) % POIS.length;
      bricks = makeCity(POIS[poiIndex]);
      rivals = [];
      shots = [];
      spawnRival();
      spawnRivalIn = 50;
      banner = POIS[poiIndex].name;
      bannerLife = 70;
      sfx.warp();
    };

    const physics = (fighter: Fighter, canJump: boolean) => {
      const floor = groundY();
      const onGround = fighter.y >= floor - 0.4 && fighter.vy >= 0;
      if (canJump && keys.current.jump && onGround) {
        fighter.vy = JUMP_V;
        sfx.jump();
      }
      fighter.vy += GRAVITY;
      fighter.y += fighter.vy;
      if (fighter.y >= floor) {
        fighter.y = floor;
        fighter.vy = 0;
      }
    };

    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") keys.current.left = down;
      if (e.code === "ArrowRight" || e.code === "KeyD") keys.current.right = down;
      if (e.code === "KeyZ" || e.code === "KeyX") {
        keys.current.attack = down;
        if (down && modeRef.current === "play") e.preventDefault();
      }
      if (e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") {
        keys.current.jump = down;
        if (down && (modeRef.current === "play" || modeRef.current === "bus")) {
          e.preventDefault();
        }
      }
      if (down && (e.code === "Enter" || e.code === "Space")) {
        if (modeRef.current === "title") {
          e.preventDefault();
          reset();
          modeRef.current = "bus";
          setMode("bus");
          sfx.bus();
        }
      }
      if (
        down &&
        (e.code === "ArrowLeft" ||
          e.code === "ArrowRight" ||
          e.code === "ArrowUp" ||
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
      const poi = POIS[poiIndex];
      const ox = shake ? (Math.random() - 0.5) * shake : 0;
      const oy = shake ? (Math.random() - 0.5) * shake : 0;
      if (shake > 0) shake *= 0.85;

      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, poi.skyTop);
      sky.addColorStop(1, poi.skyBot);
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

      if (poi.water) {
        ctx.fillStyle = "#1a6088";
        ctx.fillRect(70, H - GROUND - 18, 90, 18);
        ctx.fillStyle = "#3cdcff";
        for (let x = 74; x < 156; x += 10) {
          ctx.fillRect(x, H - GROUND - 16 + ((tick / 8 + x) % 3), 6, 1);
        }
      }

      ctx.fillStyle = poi.ground;
      ctx.fillRect(0, H - GROUND, W, GROUND);
      ctx.fillStyle = poi.dirt;
      ctx.fillRect(0, H - GROUND, W, 3);
      ctx.fillStyle = poi.accent;
      for (let x = 8; x < W; x += 16) ctx.fillRect(x, H - 12, 8, 2);

      for (const b of bricks) {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, BRICK, BRICK);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(b.x + BRICK - 1, b.y + BRICK - 1, 1, 1);
      }

      if (poi.id === "pleasant") {
        ctx.fillStyle = "#1a4a18";
        ctx.fillRect(88, H - GROUND - 20, 6, 20);
        ctx.fillRect(188, H - GROUND - 18, 6, 18);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(80, H - GROUND - 34, 22, 16);
        ctx.fillRect(180, H - GROUND - 30, 22, 14);
      }

      ctx.fillStyle = "rgba(90,40,160,0.28)";
      ctx.fillRect(0, 0, 6, H);
      ctx.fillRect(W - 6, 0, 6, H);
      ctx.fillStyle = poi.accent;
      if (Math.floor(tick / 16) % 2 === 0) {
        ctx.fillRect(2, 108, 3, 5);
        ctx.fillRect(W - 5, 108, 3, 5);
      }

      if (wantStart.current) {
        wantStart.current = false;
        reset();
        modeRef.current = "bus";
        setMode("bus");
        sfx.bus();
      }

      if (modeRef.current === "bus") {
        tick += 1;
        busX += 1.45;
        if (!falling) {
          player.x = busX + 14;
          player.y = 42;
          player.facing = 1;
          if (busX > 108 || (busX > 64 && keys.current.jump)) {
            falling = true;
            player.vy = 0.4;
            sfx.drop();
            banner = "SKYDIVING";
            bannerLife = 50;
          }
        } else {
          if (keys.current.left) player.vx = -1.6;
          else if (keys.current.right) player.vx = 1.6;
          else player.vx *= 0.7;
          player.x += player.vx;
          player.vy += 0.18;
          player.y += player.vy;
          if (player.vx > 0.2) player.facing = 1;
          if (player.vx < -0.2) player.facing = -1;
          if (player.y >= groundY()) {
            player.y = groundY();
            player.vy = 0;
            modeRef.current = "play";
            setMode("play");
            banner = POIS[poiIndex].name;
            bannerLife = 70;
            sfx.start();
            spawnRival();
          }
        }
        drawBattleBus(ctx, Math.floor(busX), 28);
      }

      if (modeRef.current === "play") {
        tick += 1;
        if (tick % 5 === 0) {
          scoreRef.current += 1;
          if (tick % 15 === 0) setScore(scoreRef.current);
        }

        spawnRivalIn -= 1;
        if (spawnRivalIn <= 0) {
          spawnRival();
          spawnRivalIn = Math.max(90, 160 - Math.floor(scoreRef.current / 80));
        }

        if (keys.current.left) player.vx = -1.8;
        else if (keys.current.right) player.vx = 1.8;
        else player.vx *= 0.6;
        player.x += player.vx;
        if (player.vx > 0.2) player.facing = 1;
        if (player.vx < -0.2) player.facing = -1;
        if (Math.abs(player.vx) > 0.4 && tick % 6 === 0) player.frame ^= 1;
        physics(player, true);
        if (player.inv > 0) player.inv -= 1;
        if (player.cool > 0) player.cool -= 1;
        if (player.muzzle > 0) player.muzzle -= 1;

        if (player.x > W - 6) {
          changePoi(1);
          player.x = 10;
        } else if (player.x < -4) {
          changePoi(-1);
          player.x = W - 26;
        }

        if (keys.current.attack && player.cool === 0) {
          fire(player, true);
        }

        for (let i = rivals.length - 1; i >= 0; i--) {
          const rival = rivals[i];
          if (rival.hp <= 0) {
            boom(rival.x + 8, rival.y + 8, 12, rival.palette.O);
            rivals.splice(i, 1);
            scoreRef.current += 80;
            elimsRef.current += 1;
            continue;
          }
          if (rival.inv > 0) rival.inv -= 1;
          if (rival.cool > 0) rival.cool -= 1;
          if (rival.muzzle > 0) rival.muzzle -= 1;

          const gap = rival.x - player.x;
          if (Math.abs(gap) > 70) {
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
          if (Math.abs(rival.vx) > 0.3 && tick % 6 === 0) rival.frame ^= 1;
          rival.y = groundY();
          rival.vy = 0;
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
          if (spent) shots.splice(i, 1);
        }
      }

      if (modeRef.current === "title") {
        drawBattleBus(ctx, 96 + Math.sin(tick / 24) * 8, 36);
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
            spriteRows(rival.sprite, rival.frame),
            Math.floor(rival.x),
            Math.floor(rival.y),
            rival.facing < 0,
            rival.palette
          );
          drawGun(ctx, rival.x, rival.y, rival.facing, rival.muzzle > 0);
        }
      }

      if (
        modeRef.current !== "title" &&
        (player.inv === 0 || Math.floor(tick / 4) % 2 === 0)
      ) {
        drawSprite(
          ctx,
          spriteRows(player.sprite, player.frame),
          Math.floor(player.x),
          Math.floor(player.y),
          player.facing < 0,
          player.palette
        );
        if (modeRef.current === "play") {
          drawGun(ctx, player.x, player.y, player.facing, player.muzzle > 0);
        }
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
      ctx.fillStyle = poi.accent;
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText(poi.tag, 152, 20);

      if (bannerLife > 0) {
        bannerLife -= 1;
        ctx.fillStyle = "rgba(10,0,20,0.55)";
        ctx.fillRect(28, 88, 200, 28);
        ctx.fillStyle = "#ffcc00";
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(banner, 40, 98);
      }

      if (modeRef.current === "title") {
        ctx.fillStyle = "rgba(10,0,20,0.55)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#00e800";
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText("VIPER DROP", 72, 64);
        ctx.fillStyle = "#ffcc00";
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText("RIDE THE BUS.", 68, 96);
        ctx.fillText("WALK THE MAP.", 68, 112);
        ctx.fillText("JUMP THE SPRAY.", 60, 128);
        if (Math.floor(tick / 30) % 2 === 0) {
          ctx.fillStyle = "#ff6a00";
          ctx.fillText("PRESS START", 76, 156);
        }
      }

      if (modeRef.current === "over") {
        ctx.fillStyle = "rgba(10,0,20,0.72)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#e02020";
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText("ELIMINATED", 72, 70);
        ctx.fillStyle = "#ffcc00";
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(`SCORE ${padScore(scoreRef.current)}`, 72, 100);
        ctx.fillStyle = "#00e800";
        ctx.fillText(`ELIMS ${elimsRef.current}`, 88, 118);
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

  const hold = (dir: "left" | "right" | "attack" | "jump", on: boolean) => {
    keys.current[dir] = on;
  };

  const startRun = () => {
    setSaveMsg("");
    setInitials("VIP");
    wantStart.current = true;
    sfx.coin();
  };

  const toggleStageFull = async () => {
    const node = stageRef.current;
    if (!node) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await node.requestFullscreen();
      }
      sfx.select();
    } catch {
      setSaveMsg("FULLSCREEN BLOCKED");
    }
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
      <PixelPanel title="8-BIT CART  •  VIPER DROP" tone="orange">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div>
            <div
              ref={stageRef}
              className="game-stage pixel-bevel bg-[#05000a] p-2 sm:p-3"
            >
              <canvas
                ref={canvasRef}
                width={W}
                height={H}
                className="pixelated mx-auto block h-auto w-full max-w-[768px] bg-black"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 sm:hidden">
              <Button
                variant="arcade"
                className="h-16 text-[10px]"
                onPointerDown={() => hold("left", true)}
                onPointerUp={() => hold("left", false)}
                onPointerLeave={() => hold("left", false)}
              >
                ◀
              </Button>
              <Button
                variant="arcade"
                className="h-16 text-[10px]"
                onPointerDown={() => hold("jump", true)}
                onPointerUp={() => hold("jump", false)}
                onPointerLeave={() => hold("jump", false)}
              >
                JUMP
              </Button>
              <Button
                variant="pixel"
                className="h-16 text-[10px]"
                onPointerDown={() => hold("attack", true)}
                onPointerUp={() => hold("attack", false)}
                onPointerLeave={() => hold("attack", false)}
              >
                FIRE
              </Button>
              <Button
                variant="arcade"
                className="h-16 text-[10px]"
                onPointerDown={() => hold("right", true)}
                onPointerUp={() => hold("right", false)}
                onPointerLeave={() => hold("right", false)}
              >
                ▶
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="pixel" className="h-11 px-4" onClick={startRun}>
                {mode === "over" ? "DROP IN AGAIN" : "DROP IN"}
              </Button>
              <Button
                variant="arcade"
                className="hidden h-11 px-3 sm:inline-flex"
                onPointerDown={() => hold("jump", true)}
                onPointerUp={() => hold("jump", false)}
                onPointerLeave={() => hold("jump", false)}
              >
                JUMP
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
                onClick={() => void toggleStageFull()}
              >
                {full ? "EXIT FULL" : "FULLSCREEN"}
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
                A/D move. Space / W jump over bullets. Z / X / FIRE shoot. Walk
                off the screen to hit the next POI.
              </p>
            </div>

            {mode === "over" ? (
              <div className="dialog-box mt-4 p-4">
                <p className="font-press mb-3 text-[10px] text-[#e02020]">
                  ELIMINATED
                </p>
                <p className="font-vt mb-3 text-xl">
                  {xpGain > 0
                    ? `+${xpGain} Battle Pass XP banked. Enter 3 initials.`
                    : "Enter 3 initials like a 1985 arcade cabinet."}
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
                TOP DROPPERS
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
                  No scores yet. Ride the bus.
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
                  <span className="text-[#f8f0d8]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{row.initials}</span>
                  <span className="hud-digits">{padScore(row.score)}</span>
                </li>
              ))}
            </ol>
            <p className="font-vt mt-4 text-lg text-[#c9a0ff]">
              Five POIs wrap around the island: Tilted, Retail, Salty, Pleasant,
              Loot Lake. Jump the spray. Bank XP for the pass.
            </p>
          </div>
        </div>
      </PixelPanel>
    </section>
  );
}
