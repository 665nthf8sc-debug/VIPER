"use client";

import { PixelIcon, PixelPanel } from "@/components/pixel-panel";
import { Button } from "@/components/ui/button";
import { addFind, equippedSkin } from "@/lib/pass";
import { sfx } from "@/lib/sfx";
import { drawGun, drawSprite, spriteRows } from "@/lib/sprites";
import { MYSTERY_SHORT } from "@/lib/youtube";
import { useEffect, useRef, useState } from "react";

const W = 256;
const H = 224;
const GROUND = 24;

type Gun = "none" | "ar" | "pump" | "exotic" | "drum";
type Fighter = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number;
  frame: number;
  cool: number;
  muzzle: number;
  gun: Gun;
  slot: number;
  deadWait: number;
  airborne: boolean;
};

type Pickup = { x: number; y: number; gun: Gun; secret?: "shard" | "note" | "drum" };

const GUN_NAME: Record<Gun, string> = {
  none: "FISTS",
  ar: "AR",
  pump: "PUMP",
  exotic: "EXOTIC SCAR",
  drum: "DRUM SHOTTY",
};

function gunColor(gun: Gun) {
  if (gun === "exotic") return "#ffcc00";
  if (gun === "drum") return "#c45a3a";
  if (gun === "pump") return "#a060ff";
  if (gun === "ar") return "#6a6a78";
  return "#3a3a48";
}

export function MeteorMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [banner, setBanner] = useState("SPAWN ISLAND  •  SPACE TO DROP");
  const [loadout, setLoadout] = useState("FISTS");
  const running = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const skin = equippedSkin();
    const pads = [
      { left: false, right: false, jump: false, fire: false },
      { left: false, right: false, jump: false, fire: false },
    ];

    const makePlayer = (slot: number, x: number): Fighter => ({
      x,
      y: 36,
      vx: 0,
      vy: 0,
      facing: 1,
      frame: 0,
      cool: 0,
      muzzle: 0,
      gun: "none",
      slot,
      deadWait: 0,
      airborne: false,
    });

    let p1 = makePlayer(0, 70);
    let p2 = makePlayer(1, 110);
    p2.facing = -1;
    let shots: Array<{ x: number; y: number; vx: number; team: number }> = [];
    let loot: Pickup[] = [];
    let tick = 0;
    let secretHold = 0;
    let toast = "SPAWN ISLAND";
    let toastLife = 90;
    let seeded = false;

    const groundY = () => H - GROUND - 16;
    const PAD_Y = 36;

    const seedTilted = () => {
      if (seeded) return;
      seeded = true;
      loot = [
        { x: 28, y: groundY() + 8, gun: "ar" },
        { x: 78, y: groundY() + 8, gun: "pump" },
        { x: 168, y: groundY() + 8, gun: "exotic" },
        { x: 210, y: 96, gun: "drum", secret: "drum" },
        { x: 118, y: groundY() + 8, gun: "none", secret: "shard" },
        { x: 12, y: groundY() + 8, gun: "none", secret: "note" },
      ];
    };

    const toSpawn = (who: Fighter) => {
      who.x = 70 + who.slot * 40;
      who.y = PAD_Y;
      who.vx = 0;
      who.vy = 0;
      who.gun = "none";
      who.deadWait = 0;
      who.airborne = false;
      toast = "BACK TO SPAWN";
      toastLife = 70;
      sfx.warp();
    };

    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (e.code === "KeyA") pads[0].left = down;
      if (e.code === "KeyD") pads[0].right = down;
      if (e.code === "KeyW" || e.code === "Space") pads[0].jump = down;
      if (e.code === "KeyZ" || e.code === "KeyX") pads[0].fire = down;
      if (e.code === "ArrowLeft") pads[1].left = down;
      if (e.code === "ArrowRight") pads[1].right = down;
      if (e.code === "ArrowUp") pads[1].jump = down;
      if (e.code === "KeyK" || e.code === "Period") pads[1].fire = down;
      if (down && (e.code === "Space" || e.code.startsWith("Arrow"))) e.preventDefault();
    };
    const down = (e: KeyboardEvent) => onKey(e, true);
    const up = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    const fire = (who: Fighter) => {
      if (who.cool > 0 || who.gun === "none") return;
      const spd = who.gun === "exotic" ? 4.2 : who.gun === "drum" ? 3.2 : 3.6;
      shots.push({
        x: who.facing > 0 ? who.x + 18 : who.x - 4,
        y: who.y + 10,
        vx: who.facing * spd,
        team: who.slot,
      });
      who.muzzle = 4;
      who.cool = who.gun === "pump" || who.gun === "drum" ? 28 : 12;
      sfx.shoot();
    };

    const drawMeteor = () => {
      ctx.fillStyle = "#2a1a18";
      ctx.beginPath();
      ctx.arc(128, 118, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff6a00";
      ctx.fillRect(118, 100, 20, 8);
      ctx.fillStyle = "#ffcc00";
      ctx.fillRect(122, 108, 12, 6);
      ctx.fillStyle = "#8a4030";
      ctx.fillRect(108, 128, 40, 10);
    };

    const loop = () => {
      if (!running.current) return;
      tick += 1;
      if (toastLife > 0) toastLife -= 1;

      const players = [p1, p2];
      for (const who of players) {
        if (who.deadWait > 0) {
          who.deadWait -= 1;
          if (who.deadWait === 0) toSpawn(who);
          continue;
        }
        const pad = pads[who.slot];
        who.vx = pad.left ? -1.3 : pad.right ? 1.3 : 0;
        if (pad.left) who.facing = -1;
        if (pad.right) who.facing = 1;
        const onPad = !who.airborne && who.y <= PAD_Y + 2;
        if (onPad) {
          who.x = Math.max(48, Math.min(176, who.x + who.vx));
          who.y = PAD_Y;
          if (pad.jump) {
            who.airborne = true;
            who.vy = 1.6;
            seedTilted();
            toast = "DROPPING  •  1 HP";
            toastLife = 60;
            sfx.drop();
          }
        } else {
          const onGround = who.y >= groundY() - 0.2;
          if (pad.jump && onGround) {
            who.vy = -4.1;
            sfx.jump();
          }
          who.vy += who.airborne && who.y < groundY() - 8 ? 0.18 : 0.22;
          who.y += who.vy;
          if (who.y >= groundY()) {
            who.y = groundY();
            who.vy = 0;
            who.airborne = false;
          }
          who.x = Math.max(4, Math.min(W - 20, who.x + who.vx));
          if (who.cool > 0) who.cool -= 1;
          if (who.muzzle > 0) who.muzzle -= 1;
          if (pad.fire && !onPad) fire(who);

          for (const drop of [...loot]) {
            if (Math.abs(who.x - drop.x) < 12 && Math.abs(who.y - drop.y) < 16) {
              if (drop.gun !== "none") {
                who.gun = drop.gun;
                loot = loot.filter((d) => d !== drop);
                sfx.pickup();
                toast = GUN_NAME[who.gun];
                toastLife = 50;
              } else if (drop.secret === "shard") {
                secretHold += 1;
                if (secretHold > 50) {
                  const got = addFind("meteor-shard");
                  toast = got.fresh ? "SECRET  METEOR SHARD" : "SHARD OWNED";
                  toastLife = 80;
                  secretHold = 0;
                  loot = loot.filter((d) => d !== drop);
                  sfx.xp();
                }
              } else if (drop.secret === "note" && who.y >= groundY() - 1) {
                const got = addFind("secret-note");
                toast = got.fresh ? "SECRET  VAULT NOTE" : "NOTE OWNED";
                toastLife = 80;
                loot = loot.filter((d) => d !== drop);
                sfx.xp();
              } else if (drop.secret === "drum") {
                who.gun = "drum";
                addFind("exotic-drum");
                loot = loot.filter((d) => d !== drop);
                toast = "EXOTIC DRUM";
                toastLife = 60;
                sfx.coin();
              }
            }
          }
        }
        if (Math.abs(who.vx) > 0.2 && tick % 6 === 0) who.frame ^= 1;
      }

      for (let i = shots.length - 1; i >= 0; i--) {
        const shot = shots[i];
        shot.x += shot.vx;
        if (shot.x < -6 || shot.x > W + 6) {
          shots.splice(i, 1);
          continue;
        }
        for (const who of players) {
          if (who.slot === shot.team || who.deadWait > 0 || (!who.airborne && who.y <= PAD_Y + 2)) continue;
          if (
            shot.x > who.x + 2 &&
            shot.x < who.x + 14 &&
            shot.y > who.y + 2 &&
            shot.y < who.y + 14
          ) {
            who.deadWait = 24;
            shots.splice(i, 1);
            sfx.ko();
            toast = `P${who.slot + 1} DOWN  •  SPAWN`;
            toastLife = 70;
            break;
          }
        }
      }

      setLoadout(`P1 ${GUN_NAME[p1.gun]}  ·  P2 ${GUN_NAME[p2.gun]}`);
      if (tick % 20 === 0) {
        const onPad = !p1.airborne && p1.y <= PAD_Y + 2;
        setBanner(
          onPad
            ? "SPAWN ISLAND  •  SPACE TO DROP"
            : "TILTED + METEOR  •  1 HP  •  DIE = LOSE GUNS"
        );
      }

      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#183868");
      g.addColorStop(0.35, "#241018");
      g.addColorStop(1, "#402018");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const towers = [
        [8, 52],
        [40, 88],
        [84, 120],
        [156, 96],
        [196, 64],
        [224, 48],
      ];
      for (const [x, h] of towers) {
        ctx.fillStyle = "#6a6a78";
        ctx.fillRect(x, H - GROUND - h, 28, h);
        ctx.fillStyle = "#ffcc00";
        ctx.fillRect(x + 4, H - GROUND - h + 8, 6, 8);
        ctx.fillRect(x + 16, H - GROUND - h + 8, 6, 8);
      }
      ctx.fillStyle = "#2a1a14";
      ctx.fillRect(0, H - GROUND, W, GROUND);
      drawMeteor();
      ctx.fillStyle = "#7ec8f8";
      ctx.fillRect(44, PAD_Y + 16, 168, 6);
      ctx.fillStyle = "#c4a06a";
      ctx.fillRect(48, PAD_Y + 18, 160, 8);
      ctx.fillStyle = "#ffcc00";
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText("SPAWN", 104, 28);
      ctx.fillStyle = "#ff6a00";
      ctx.fillText("METEOR", 104, 86);

      for (const drop of loot) {
        if (drop.gun === "none" && drop.secret === "shard") {
          ctx.fillStyle = tick % 20 < 10 ? "#ff6a00" : "#ffcc00";
          ctx.fillRect(drop.x, drop.y - 4, 8, 8);
        } else if (drop.gun === "none" && drop.secret === "note") {
          ctx.fillStyle = "#3cdcff";
          ctx.fillRect(drop.x, drop.y, 6, 6);
        } else {
          ctx.fillStyle = gunColor(drop.gun);
          ctx.fillRect(drop.x, drop.y, 10, 4);
        }
      }

      const pal2 = {
        ...skin.palette,
        O: "#3d7cff",
        G: "#3d7cff",
      };
      for (const who of players) {
        if (who.deadWait > 12) continue;
        drawSprite(
          ctx,
          spriteRows(skin.sprite, who.frame),
          who.x,
          who.y,
          who.facing < 0,
          who.slot === 0 ? skin.palette : pal2
        );
        if (who.gun !== "none") {
          drawGun(ctx, who.x, who.y, who.facing, who.muzzle > 0);
        }
      }
      ctx.fillStyle = "#ffcc00";
      for (const shot of shots) ctx.fillRect(shot.x, shot.y, 5, 2);

      ctx.fillStyle = "#00e800";
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText("HP 1", 8, 14);
      ctx.fillStyle = "#ffcc00";
      ctx.fillText(!p1.airborne && p1.y <= PAD_Y + 2 ? "SAFE" : "FIGHT", 200, 14);
      if (toastLife > 0) {
        ctx.fillStyle = "rgba(10,0,20,0.7)";
        ctx.fillRect(16, 96, 224, 28);
        ctx.fillStyle = "#ffcc00";
        ctx.fillText(toast.slice(0, 22), 24, 114);
      }

      requestAnimationFrame(loop);
    };
    const raf = requestAnimationFrame(loop);
    return () => {
      running.current = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return (
    <section id="map" className="section-wrap py-16 sm:py-20">
      <PixelPanel title="VIPER'S MAP  •  TILTED + METEOR" tone="orange">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div>
            <p className="font-vt mb-3 text-xl text-[#f8f0d8]">
              Tilted Towers with a massive meteor in the middle. Everyone has{" "}
              <span className="text-[#e02020]">1 HP</span>. Grab AR, pump, and
              exotics. Die and you lose the guns and respawn on Spawn Island.
            </p>
            <div className="game-stage pixel-bevel bg-[#05000a] p-2 sm:p-3">
              <canvas
                ref={canvasRef}
                width={W}
                height={H}
                className="pixelated mx-auto block h-auto w-full max-w-[768px] bg-black"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <p className="font-press mt-3 text-[9px] text-[#ffcc00]">{banner}</p>
            <p className="font-vt text-lg text-[#c9a0ff]">{loadout}</p>
            <p className="font-vt mt-2 text-lg text-[#f8f0d8]">
              P1 A/D W Z. P2 arrows + K. Space from spawn to drop. Stand in the
              orange crater, the left basement glow, and the roof exotic — those
              are secrets. Finds land in your locker.
            </p>
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2">
              <PixelIcon name="map" />
              <h3 className="font-press text-[10px] text-[#ffcc00]">
                MYSTERY SHORT
              </h3>
            </div>
            <div className="tv-bezel p-3">
              <p className="font-press mb-2 text-[8px] text-[#00e800]">
                CH-07  SECRETS OF TILTED
              </p>
              {MYSTERY_SHORT.id ? (
                <div className="relative aspect-[9/16] overflow-hidden bg-black">
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.youtube.com/embed/${MYSTERY_SHORT.id}?rel=0`}
                    title={MYSTERY_SHORT.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="relative flex aspect-[9/16] flex-col items-center justify-center bg-[#05000a] text-center">
                  <p className="font-press text-[10px] text-[#ff6a00]">COMING SOON</p>
                  <p className="font-press mt-4 px-4 text-[8px] leading-5 text-[#ffcc00]">
                    VIPER IS POSTING A SHORT ABOUT THIS MAP AND THE SECRETS
                  </p>
                  <p className="font-vt mt-4 px-4 text-lg text-[#c9a0ff]">
                    The meteor. The vault. The roof exotic. Watch the tape when
                    it drops.
                  </p>
                </div>
              )}
            </div>
            <p className="font-vt mt-3 text-lg text-[#c9a0ff]">
              {MYSTERY_SHORT.teaser}
            </p>
            <Button
              variant="arcade"
              className="mt-3 h-10 w-full text-[9px]"
              nativeButton={false}
              render={
                <a href="#locker" onClick={() => sfx.select()} />
              }
            >
              OPEN LOCKER FINDS
            </Button>
          </div>
        </div>
      </PixelPanel>
    </section>
  );
}
