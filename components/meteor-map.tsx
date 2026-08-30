"use client";

import { PixelIcon, PixelPanel } from "@/components/pixel-panel";
import { Button } from "@/components/ui/button";
import {
  addFind,
  DANCE_EVENT,
  DANCE_FRAMES,
  EMOTES,
  equippedSkin,
  isEmoteUnlocked,
  loadPass,
  playEmote,
} from "@/lib/pass";
import { sfx } from "@/lib/sfx";
import {
  drawEmoteName,
  drawSidekick,
  drawSprite,
  emotePose,
  idlePose,
  spriteRows,
  type EmoteId,
} from "@/lib/sprites";
import { MYSTERY_SHORT } from "@/lib/youtube";
import { useEffect, useRef, useState } from "react";

const W = 256;
const H = 224;
const GROUND = 24;
const GRAVITY = 0.22;
const JUMP_V = -4.2;

type Dancer = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number;
  frame: number;
  slot: number;
  emote: EmoteId;
  danceUntil: number;
  bot: boolean;
};

export function MeteorMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padsRef = useRef([
    { left: false, right: false, jump: false },
    { left: false, right: false, jump: false },
  ]);
  const [banner, setBanner] = useState("CHILL PLAZA  •  B TO EMOTE");
  const [status, setStatus] = useState("Walk around. Dance together.");
  const running = useRef(true);

  const hold = (
    slot: 0 | 1,
    dir: "left" | "right" | "jump",
    on: boolean
  ) => {
    padsRef.current[slot][dir] = on;
  };

  useEffect(() => {
    running.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const pads = padsRef.current;

    const groundY = () => H - GROUND - 16;

    const makeDancer = (
      slot: number,
      x: number,
      emote: EmoteId,
      bot: boolean
    ): Dancer => ({
      x,
      y: groundY(),
      vx: 0,
      vy: 0,
      facing: slot === 1 ? -1 : 1,
      frame: 0,
      slot,
      emote,
      danceUntil: bot ? 999999 : 0,
      bot,
    });

    const p1 = makeDancer(0, 64, loadPass().emote, false);
    const p2 = makeDancer(1, 108, "floss", false);
    const npcA = makeDancer(2, 28, "griddy", true);
    const npcB = makeDancer(3, 188, "wave", true);
    npcB.facing = -1;
    const people = [p1, p2, npcA, npcB];
    let tick = 0;
    let toast = "HANG OUT";
    let toastLife = 80;
    let shardHold = 0;
    let noteHold = 0;

    const startDance = (who: Dancer, id?: EmoteId) => {
      if (who.bot) {
        who.danceUntil = tick + DANCE_FRAMES;
        return;
      }
      if (id && !isEmoteUnlocked(id, loadPass())) {
        sfx.hit();
        return;
      }
      if (playEmote(id)) {
        who.emote = id ?? loadPass().emote;
        who.danceUntil = tick + DANCE_FRAMES;
        sfx.emote();
        toast = EMOTES.find((e) => e.id === who.emote)?.name ?? "EMOTE";
        toastLife = 50;
      } else {
        sfx.hit();
      }
    };

    const onDance = () => {
      p1.emote = loadPass().emote;
      p1.danceUntil = tick + DANCE_FRAMES;
    };
    window.addEventListener(DANCE_EVENT, onDance);

    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.code === "KeyA") pads[0].left = down;
      if (e.code === "KeyD") pads[0].right = down;
      if (e.code === "KeyW" || e.code === "Space") pads[0].jump = down;
      if (e.code === "ArrowLeft") pads[1].left = down;
      if (e.code === "ArrowRight") pads[1].right = down;
      if (e.code === "ArrowUp") pads[1].jump = down;
      if (down && e.code === "KeyB") {
        e.preventDefault();
        startDance(p1);
      }
      if (down && e.code === "KeyN") {
        e.preventDefault();
        startDance(p2, loadPass().emote);
      }
      if (down && /^Digit[1-5]$/.test(e.code)) {
        const emote = EMOTES[Number(e.code.slice(5)) - 1];
        if (emote) {
          e.preventDefault();
          startDance(p1, emote.id);
        }
      }
      if (down && (e.code === "Space" || e.code.startsWith("Arrow"))) {
        e.preventDefault();
      }
    };
    const down = (e: KeyboardEvent) => onKey(e, true);
    const up = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

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

    let raf = 0;
    const loop = () => {
      if (!running.current) return;
      tick += 1;
      if (toastLife > 0) toastLife -= 1;
      p1.emote = loadPass().emote;

      if (tick % 220 === 0) startDance(npcA);
      if (tick % 260 === 40) startDance(npcB);

      for (const who of people) {
        const pad = who.bot
          ? { left: false, right: false, jump: false }
          : pads[who.slot];
        const dancing = tick < who.danceUntil;
        if (!dancing) {
          who.vx = pad.left ? -1.2 : pad.right ? 1.2 : 0;
          if (pad.left) who.facing = -1;
          if (pad.right) who.facing = 1;
        } else {
          who.vx *= 0.4;
        }
        const onGround = who.y >= groundY() - 0.2;
        if (pad.jump && onGround) {
          who.vy = JUMP_V;
          sfx.jump();
        }
        who.vy += GRAVITY;
        who.y += who.vy;
        if (who.y >= groundY()) {
          who.y = groundY();
          who.vy = 0;
        }
        who.x = Math.max(4, Math.min(W - 20, who.x + who.vx));
        if (Math.abs(who.vx) > 0.2 && tick % 6 === 0) who.frame ^= 1;
      }

      const crater = Math.abs(p1.x - 120) < 18 && p1.y >= groundY() - 1;
      if (crater) {
        shardHold += 1;
        if (shardHold === 40) {
          const got = addFind("meteor-shard");
          toast = got.fresh ? "METEOR SHARD" : "SHARD OWNED";
          toastLife = 80;
          sfx.xp();
        }
      } else {
        shardHold = 0;
      }
      const vault = p1.x < 22 && p1.y >= groundY() - 1;
      if (vault) {
        noteHold += 1;
        if (noteHold === 40) {
          const got = addFind("secret-note");
          toast = got.fresh ? "VAULT NOTE" : "NOTE OWNED";
          toastLife = 80;
          sfx.xp();
        }
      } else {
        noteHold = 0;
      }

      if (tick % 20 === 0) {
        const dancing = people.filter((p) => tick < p.danceUntil).length;
        setBanner("CHILL PLAZA  •  B TO EMOTE");
        setStatus(
          dancing
            ? `${dancing} dancing on the pad`
            : "P1 A/D W  ·  P2 arrows  ·  B dance  ·  N for P2"
        );
      }

      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#183868");
      g.addColorStop(0.4, "#241018");
      g.addColorStop(1, "#402018");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const towers: Array<[number, number]> = [
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
      ctx.fillStyle = "#3cdcff";
      ctx.fillRect(8, H - GROUND - 10, 10, 10);
      ctx.fillStyle = "#c4a06a";
      ctx.fillRect(48, H - GROUND, 160, 4);
      ctx.fillStyle = "#ffcc00";
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText("PLAZA", 104, 28);
      ctx.fillStyle = "#ff6a00";
      ctx.fillText("METEOR", 104, 86);

      const skin = equippedSkin();
      const pal2 = { ...skin.palette, O: "#3d7cff", G: "#3d7cff" };
      const palNpc = { ...skin.palette, O: "#ff4dae", G: "#ff4dae" };
      for (const who of people) {
        const dancing = tick < who.danceUntil;
        const pose = dancing ? emotePose(who.emote, tick) : idlePose(tick);
        const pal = who.bot ? palNpc : who.slot === 0 ? skin.palette : pal2;
        drawSprite(
          ctx,
          spriteRows(who.bot ? "fox" : skin.sprite, pose.frame),
          who.x + pose.ox,
          who.y + pose.oy,
          dancing ? pose.flip : who.facing < 0,
          pal
        );
        if (who.slot === 0) {
          drawSidekick(ctx, loadPass().sidekick, who.x + 16, who.y + 8, tick);
        }
        if (dancing && !who.bot) {
          const label = EMOTES.find((e) => e.id === who.emote)?.name ?? "EMOTE";
          drawEmoteName(ctx, label, who.x - 10, who.y - 10);
        }
      }

      ctx.fillStyle = "#00e800";
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText("NO GUNS", 8, 14);
      ctx.fillStyle = "#ffcc00";
      ctx.fillText("HANG", 208, 14);
      if (toastLife > 0) {
        ctx.fillStyle = "rgba(10,0,20,0.7)";
        ctx.fillRect(16, 96, 224, 28);
        ctx.fillStyle = "#ffcc00";
        ctx.fillText(toast.slice(0, 22), 24, 114);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      running.current = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener(DANCE_EVENT, onDance);
    };
  }, []);

  return (
    <section id="map" className="section-wrap py-16 sm:py-20">
      <PixelPanel title="VIPER'S MAP  •  TILTED + METEOR" tone="orange">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div>
            <p className="font-vt mb-3 text-xl text-[#f8f0d8]">
              This is VIPER&apos;s Fortnite Creative map:{" "}
              <span className="text-[#ffcc00]">Tilted Towers</span> with a giant
              meteor in the middle, secrets in the crater and the vault, and a
              short on the way. The pad below is a chill plaza — walk, jump,
              and emote together. No guns.
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
            <p className="font-vt text-lg text-[#c9a0ff]">{status}</p>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:hidden">
              <Button
                variant="arcade"
                className="h-14 text-[10px]"
                onPointerDown={() => hold(0, "left", true)}
                onPointerUp={() => hold(0, "left", false)}
                onPointerLeave={() => hold(0, "left", false)}
              >
                ◀
              </Button>
              <Button
                variant="arcade"
                className="h-14 text-[10px]"
                onPointerDown={() => hold(0, "jump", true)}
                onPointerUp={() => hold(0, "jump", false)}
                onPointerLeave={() => hold(0, "jump", false)}
              >
                JUMP
              </Button>
              <Button
                variant="pixel"
                className="h-14 text-[10px]"
                onClick={() => {
                  if (playEmote()) sfx.emote();
                }}
              >
                EMOTE
              </Button>
              <Button
                variant="arcade"
                className="h-14 text-[10px]"
                onPointerDown={() => hold(0, "right", true)}
                onPointerUp={() => hold(0, "right", false)}
                onPointerLeave={() => hold(0, "right", false)}
              >
                ▶
              </Button>
            </div>
            <p className="font-vt mt-2 text-lg text-[#f8f0d8]">
              P1 A/D walk, W jump, B emote, 1–5 pick a dance. P2 arrows + N to
              dance. Stand on the orange meteor for the shard. Left basement
              glow is the vault note. Finds land in your locker.
            </p>
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2">
              <PixelIcon name="map" />
              <h3 className="font-press text-[10px] text-[#ffcc00]">
                THE CREATIVE MAP
              </h3>
            </div>
            <div className="pixel-bevel mb-4 bg-[#05000a] p-4">
              <p className="font-press text-[8px] leading-5 text-[#3cdcff]">
                TILTED TOWERS
              </p>
              <p className="font-vt mt-2 text-lg text-[#f8f0d8]">
                Classic Chapter 1 skyline. Clock tower, roofs, and the old
                fight that never really left.
              </p>
              <p className="font-press mt-4 text-[8px] leading-5 text-[#ff6a00]">
                THE METEOR
              </p>
              <p className="font-vt mt-2 text-lg text-[#f8f0d8]">
                A giant rock sits in the middle of town. Crater heat, orange
                glow, secrets if you know where to stand.
              </p>
              <p className="font-press mt-4 text-[8px] leading-5 text-[#ffcc00]">
                SECRETS
              </p>
              <p className="font-vt mt-2 text-lg text-[#f8f0d8]">
                Vault. Roof cache. Meteor core. VIPER is filming a short about
                them — until it drops, this page is the briefing.
              </p>
            </div>
            <div className="mb-3 flex items-center gap-2">
              <PixelIcon name="youtube" />
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
                  <p className="font-press text-[10px] text-[#ff6a00]">
                    COMING SOON
                  </p>
                  <p className="font-press mt-4 px-4 text-[8px] leading-5 text-[#ffcc00]">
                    VIPER IS POSTING A SHORT ABOUT THIS MAP AND THE SECRETS
                  </p>
                  <p className="font-vt mt-4 px-4 text-lg text-[#c9a0ff]">
                    The meteor. The vault. Watch the tape when it drops.
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
              render={<a href="#locker" onClick={() => sfx.select()} />}
            >
              OPEN LOCKER FINDS
            </Button>
          </div>
        </div>
      </PixelPanel>
    </section>
  );
}
