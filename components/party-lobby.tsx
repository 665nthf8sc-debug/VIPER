"use client";

import { Button } from "@/components/ui/button";
import {
  EMOTES,
  EMPTY_PASS,
  equipEmote,
  equipSidekick,
  equipSkin,
  isEmoteUnlocked,
  isSidekickUnlocked,
  isUnlocked,
  loadPass,
  PASS_EVENT,
  SIDEKICKS,
  SKINS,
  type PassState,
} from "@/lib/pass";
import { sfx } from "@/lib/sfx";
import {
  drawSidekick,
  drawSprite,
  emotePose,
  spriteRows,
} from "@/lib/sprites";
import { useEffect, useRef, useState } from "react";

function LobbyPad() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [pass, setPass] = useState<PassState>(EMPTY_PASS);

  useEffect(() => {
    const sync = () => setPass(loadPass());
    sync();
    window.addEventListener(PASS_EVENT, sync);
    return () => window.removeEventListener(PASS_EVENT, sync);
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let tick = 0;
    let raf = 0;
    const skin = SKINS.find((s) => s.id === pass.equipped) ?? SKINS[0];
    const loop = () => {
      tick += 1;
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
      ctx.fillRect(48, 82, 64, 8);
      ctx.fillStyle = "#8a7040";
      ctx.fillRect(52, 80, 56, 2);
      const pose = emotePose(pass.emote, tick);
      drawSprite(
        ctx,
        spriteRows(skin.sprite, pose.frame),
        72 + pose.ox,
        64 + pose.oy,
        pose.flip,
        skin.palette
      );
      drawSidekick(ctx, pass.sidekick, 94, 78, tick);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
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
  const [tab, setTab] = useState<"skins" | "emotes" | "pets">("skins");

  useEffect(() => {
    const sync = () => setPass(loadPass());
    sync();
    window.addEventListener(PASS_EVENT, sync);
    return () => window.removeEventListener(PASS_EVENT, sync);
  }, []);

  return (
    <div className="pixel-bevel bg-[#05000a] p-3">
      <p className="font-press mb-2 text-[8px] text-[#3cdcff]">PRE-GAME LOBBY</p>
      <LobbyPad />
      <p className="font-vt mt-2 text-center text-lg text-[#ffcc00]">
        {SKINS.find((s) => s.id === pass.equipped)?.name} ·{" "}
        {EMOTES.find((e) => e.id === pass.emote)?.name}
        {pass.sidekick !== "none"
          ? ` · ${SIDEKICKS.find((s) => s.id === pass.sidekick)?.name}`
          : ""}
      </p>
      <div className="mt-3 flex gap-2">
        {(["skins", "emotes", "pets"] as const).map((id) => (
          <Button
            key={id}
            variant={tab === id ? "pixel" : "arcade"}
            className="h-8 flex-1 px-1 text-[8px]"
            onClick={() => {
              setTab(id);
              sfx.select();
            }}
          >
            {id.toUpperCase()}
          </Button>
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
                    if (unlocked && equipEmote(emote.id)) sfx.xp();
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
        Wait here, swap outfits, dance, then drop with friends. B to emote
        on the cart. Pets and dances unlock from achievements and island finds.
      </p>
    </div>
  );
}
