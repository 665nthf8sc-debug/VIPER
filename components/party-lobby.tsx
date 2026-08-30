"use client";

import { Button } from "@/components/ui/button";
import {
  DANCE_EVENT,
  DANCE_FRAMES,
  EMOTES,
  EMPTY_PASS,
  equipSidekick,
  equipSkin,
  isEmoteUnlocked,
  isSidekickUnlocked,
  isUnlocked,
  loadPass,
  PASS_EVENT,
  playEmote,
  SIDEKICKS,
  SKINS,
  type PassState,
} from "@/lib/pass";
import { sfx } from "@/lib/sfx";
import {
  drawEmoteName,
  drawSidekick,
  drawSprite,
  emotePose,
  idlePose,
  spriteRows,
} from "@/lib/sprites";
import { useEffect, useRef, useState } from "react";

function LobbyPad() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [pass, setPass] = useState<PassState>(EMPTY_PASS);
  const running = useRef(true);

  useEffect(() => {
    const sync = () => setPass(loadPass());
    sync();
    window.addEventListener(PASS_EVENT, sync);
    return () => window.removeEventListener(PASS_EVENT, sync);
  }, []);

  useEffect(() => {
    running.current = true;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let tick = 0;
    let danceUntil = DANCE_FRAMES;
    let raf = 0;
    const onDance = () => {
      danceUntil = tick + DANCE_FRAMES;
    };
    window.addEventListener(DANCE_EVENT, onDance);
    const loop = () => {
      if (!running.current) return;
      tick += 1;
      const live = loadPass();
      const skin = SKINS.find((s) => s.id === live.equipped) ?? SKINS[0];
      const dancing = tick < danceUntil;
      const pose = dancing ? emotePose(live.emote, tick) : idlePose(tick);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#102848";
      ctx.fillRect(0, 0, 160, 120);
      ctx.fillStyle = "#3cdcff";
      ctx.fillRect(0, 0, 160, 48);
      ctx.fillStyle = "#7ec8f8";
      ctx.fillRect(0, 48, 160, 20);
      ctx.fillStyle = "#2a6a28";
      ctx.fillRect(0, 86, 160, 34);
      ctx.fillStyle = "#c4a06a";
      ctx.fillRect(40, 82, 80, 8);
      ctx.fillStyle = "#8a7040";
      ctx.fillRect(44, 80, 72, 2);
      ctx.save();
      ctx.scale(2, 2);
      drawSprite(
        ctx,
        spriteRows(skin.sprite, pose.frame),
        36 + pose.ox / 2,
        28 + pose.oy / 2,
        pose.flip,
        skin.palette
      );
      drawSidekick(ctx, live.sidekick, 50, 42, tick);
      ctx.restore();
      if (dancing) {
        const label =
          EMOTES.find((e) => e.id === live.emote)?.name ?? "EMOTE";
        drawEmoteName(ctx, label, 40, 18);
      } else {
        ctx.fillStyle = "#ffcc00";
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText("CLICK A DANCE", 20, 18);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      running.current = false;
      cancelAnimationFrame(raf);
      window.removeEventListener(DANCE_EVENT, onDance);
    };
  }, [pass.equipped, pass.emote, pass.sidekick]);

  return (
    <canvas
      ref={ref}
      width={160}
      height={120}
      className="pixelated mx-auto block h-auto w-full max-w-[320px] bg-black"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

export function PartyLobby() {
  const [pass, setPass] = useState<PassState>(EMPTY_PASS);
  const [tab, setTab] = useState<"skins" | "emotes" | "pets">("emotes");
  const [nowPlaying, setNowPlaying] = useState("WAVE");

  useEffect(() => {
    const sync = () => setPass(loadPass());
    sync();
    const onDance = (event: Event) => {
      sync();
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      const name =
        EMOTES.find((e) => e.id === (id ?? loadPass().emote))?.name ?? "EMOTE";
      setNowPlaying(name);
    };
    window.addEventListener(PASS_EVENT, sync);
    window.addEventListener(DANCE_EVENT, onDance);
    return () => {
      window.removeEventListener(PASS_EVENT, sync);
      window.removeEventListener(DANCE_EVENT, onDance);
    };
  }, []);

  return (
    <div className="relative z-[90] pixel-bevel bg-[#05000a] p-3">
      <p className="font-press mb-2 text-[8px] text-[#3cdcff]">PRE-GAME LOBBY</p>
      <div className="game-stage pixel-bevel bg-[#05000a] p-1">
        <LobbyPad />
      </div>
      <p className="font-press mt-2 text-center text-[10px] text-[#00e800]">
        {nowPlaying ? `DANCING  ${nowPlaying}` : "IDLE  ·  PICK A DANCE"}
      </p>
      <p className="font-vt mt-1 text-center text-lg text-[#ffcc00]">
        {SKINS.find((s) => s.id === pass.equipped)?.name} ·{" "}
        {EMOTES.find((e) => e.id === pass.emote)?.name}
        {pass.sidekick !== "none"
          ? ` · ${SIDEKICKS.find((s) => s.id === pass.sidekick)?.name}`
          : ""}
      </p>
      <Button
        variant="pixel"
        className="mt-2 h-10 w-full text-[9px]"
        onClick={() => {
          if (playEmote()) sfx.emote();
          else sfx.hit();
        }}
      >
        PLAY EMOTE
      </Button>
      <div className="mt-3 flex gap-2" role="tablist">
        {(["skins", "emotes", "pets"] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={
              tab === id
                ? "font-press h-8 flex-1 bg-[#ff6a00] px-1 text-[8px] text-[#1a0033]"
                : "font-press h-8 flex-1 bg-[#1a0033] px-1 text-[8px] text-[#ffcc00]"
            }
            onClick={() => {
              setTab(id);
              sfx.select();
            }}
          >
            {id.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="mt-2 grid max-h-48 grid-cols-2 gap-2 overflow-y-auto">
        {tab === "skins"
          ? SKINS.map((skin) => {
              const unlocked = isUnlocked(skin, pass);
              return (
                <button
                  key={skin.id}
                  type="button"
                  onClick={() => {
                    if (unlocked && equipSkin(skin.id)) sfx.coin();
                    else sfx.hit();
                  }}
                  className={`pixel-border p-2 text-left ${
                    pass.equipped === skin.id ? "ring-4 ring-[#ffcc00]" : ""
                  } ${unlocked ? "bg-[#1a0033]" : "bg-[#05000a] opacity-60"}`}
                >
                  <p className="font-press truncate text-[8px] text-[#ffcc00]">
                    {skin.name}
                  </p>
                  <p className="font-vt text-base text-[#c9a0ff]">
                    {unlocked ? "EQUIP" : "LOCKED"}
                  </p>
                </button>
              );
            })
          : null}
        {tab === "emotes"
          ? EMOTES.map((emote) => {
              const unlocked = isEmoteUnlocked(emote.id, pass);
              return (
                <button
                  key={emote.id}
                  type="button"
                  onClick={() => {
                    if (unlocked && playEmote(emote.id)) sfx.emote();
                    else sfx.hit();
                  }}
                  className={`pixel-border p-2 text-left ${
                    pass.emote === emote.id ? "ring-4 ring-[#ffcc00]" : ""
                  } ${unlocked ? "bg-[#1a0033]" : "bg-[#05000a] opacity-60"}`}
                >
                  <p className="font-press truncate text-[8px] text-[#ffcc00]">
                    {emote.name}
                  </p>
                  <p className="font-vt text-base text-[#c9a0ff]">
                    {unlocked ? emote.blurb : "LOCKED"}
                  </p>
                </button>
              );
            })
          : null}
        {tab === "pets"
          ? SIDEKICKS.map((pet) => {
              const unlocked = isSidekickUnlocked(pet.id, pass);
              return (
                <button
                  key={pet.id}
                  type="button"
                  onClick={() => {
                    if (unlocked && equipSidekick(pet.id)) sfx.coin();
                    else sfx.hit();
                  }}
                  className={`pixel-border p-2 text-left ${
                    pass.sidekick === pet.id ? "ring-4 ring-[#ffcc00]" : ""
                  } ${unlocked ? "bg-[#1a0033]" : "bg-[#05000a] opacity-60"}`}
                >
                  <p className="font-press truncate text-[8px] text-[#ffcc00]">
                    {pet.name}
                  </p>
                  <p className="font-vt text-base text-[#c9a0ff]">
                    {unlocked ? pet.blurb : "LOCKED"}
                  </p>
                </button>
              );
            })
          : null}
      </div>
      <p className="font-vt mt-2 text-base text-[#c9a0ff]">
        Click a dance or PLAY EMOTE — the fox jumps and the name pops up. On
        the cart, press B (or 1–5) to dance on the title screen.
      </p>
    </div>
  );
}
