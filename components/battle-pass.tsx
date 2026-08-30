"use client";

import { PixelIcon, PixelPanel } from "@/components/pixel-panel";
import { Button } from "@/components/ui/button";
import {
  equipSkin,
  isUnlocked,
  loadPass,
  maxPassXp,
  nextSkin,
  PASS_EVENT,
  SKINS,
  skinById,
  type PassState,
} from "@/lib/pass";
import { sfx } from "@/lib/sfx";
import { drawSprite, spriteRows, type SpriteKind } from "@/lib/sprites";
import { useEffect, useRef, useState } from "react";

function SkinPreview({
  palette,
  sprite,
}: {
  palette: Record<string, string>;
  sprite: SpriteKind;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#05000a";
    ctx.fillRect(0, 0, 48, 48);
    drawSprite(ctx, spriteRows(sprite, 0), 16, 16, false, palette);
  }, [palette, sprite]);
  return (
    <canvas
      ref={ref}
      width={48}
      height={48}
      className="pixelated mx-auto block h-16 w-16 bg-black"
    />
  );
}

export function BattlePass() {
  const [pass, setPass] = useState<PassState>({
    xp: 0,
    equipped: "fox",
    watched: [],
    unlocked: [],
    campaignStage: 0,
  });

  useEffect(() => {
    const sync = () => setPass(loadPass());
    sync();
    window.addEventListener(PASS_EVENT, sync);
    return () => window.removeEventListener(PASS_EVENT, sync);
  }, []);

  const equipped = skinById(pass.equipped);
  const upcoming = nextSkin(pass);
  const cap = maxPassXp();
  const pct = Math.min(100, Math.round((pass.xp / cap) * 100));
  const toNext = upcoming ? Math.max(0, upcoming.xp - pass.xp) : 0;

  return (
    <section id="pass" className="section-wrap py-16 sm:py-20">
      <PixelPanel title="VIPER BATTLE PASS  •  SEASON 3384">
        <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="font-press text-[10px] text-[#ffcc00]">
              XP {pass.xp} / {cap}
            </p>
            <div className="mt-2 h-5 w-full bg-[#05000a] shadow-[inset_3px_3px_0_#000]">
              <div
                className="h-full bg-[#00e800]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="font-vt mt-2 text-lg text-[#c9a0ff]">
              Play VIPER DROP or watch Channel 3384 to earn XP. Clear Chapter 1
              campaign for Jonesy and Peely. Equipped:{" "}
              <span className="text-[#ffcc00]">{equipped.name}</span>
              {upcoming
                ? ` · ${toNext} XP to ${upcoming.name}`
                : " · PASS COMPLETE"}
            </p>
          </div>
          <div className="pixel-bevel bg-[#05000a] p-2">
            <SkinPreview palette={equipped.palette} sprite={equipped.sprite} />
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {SKINS.map((skin, i) => {
            const unlocked = isUnlocked(skin, pass);
            const active = pass.equipped === skin.id;
            return (
              <button
                key={skin.id}
                type="button"
                onClick={() => {
                  if (unlocked) {
                    equipSkin(skin.id);
                    sfx.coin();
                  } else {
                    sfx.hit();
                  }
                }}
                className={`min-w-[140px] shrink-0 pixel-border bg-[#05000a] p-3 text-left ${
                  active ? "ring-4 ring-[#ffcc00]" : ""
                } ${unlocked ? "" : "opacity-70"}`}
              >
                <p className="font-press text-[8px] text-[#3cdcff]">
                  {skin.campaign ? "EXCL" : `TIER ${String(i + 1).padStart(2, "0")}`}
                </p>
                <SkinPreview palette={skin.palette} sprite={skin.sprite} />
                <p className="font-press mt-2 text-[9px] text-[#ffcc00]">
                  {skin.name}
                </p>
                <p className="font-vt text-base text-[#c9a0ff]">
                  {unlocked
                    ? "UNLOCKED"
                    : skin.campaign
                      ? "CAMPAIGN"
                      : `${skin.xp} XP`}
                </p>
                <span className="font-press mt-1 block text-[8px] text-[#00e800]">
                  {active ? "EQUIPPED" : unlocked ? "EQUIP" : "LOCKED"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 bg-[#1a0033] p-3">
            <PixelIcon name="game" />
            <p className="font-vt text-lg text-[#f8f0d8]">
              Drop in and survive. Score and elims convert to Battle Pass XP
              when you get eliminated.
            </p>
          </div>
          <div className="flex items-start gap-3 bg-[#1a0033] p-3">
            <PixelIcon name="youtube" />
            <p className="font-vt text-lg text-[#f8f0d8]">
              Watch a featured VIPER clip for +50 XP the first time. Six tapes
              on the TV.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Button
            variant="arcade"
            className="h-11 px-4"
            nativeButton={false}
            render={<a href="#locker" onClick={() => sfx.select()} />}
          >
            OPEN CHIEF&apos;S LOCKER
          </Button>
        </div>
      </PixelPanel>
    </section>
  );
}
