"use client";

import { Button } from "@/components/ui/button";
import {
  equipSkin,
  isUnlocked,
  loadPass,
  PASS_EVENT,
  SKINS,
  type PassState,
} from "@/lib/pass";
import { sfx } from "@/lib/sfx";
import { drawSprite, spriteRows } from "@/lib/sprites";
import { useEffect, useRef, useState } from "react";

function MiniSkin({
  palette,
  sprite,
}: {
  palette: Record<string, string>;
  sprite: "fox" | "chief";
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#0c1408";
    ctx.fillRect(0, 0, 40, 40);
    drawSprite(ctx, spriteRows(sprite, 0), 12, 12, false, palette);
  }, [palette, sprite]);
  return (
    <canvas
      ref={ref}
      width={40}
      height={40}
      className="pixelated mx-auto block h-14 w-14"
    />
  );
}

export function Locker() {
  const [pass, setPass] = useState<PassState>({
    xp: 0,
    equipped: "fox",
    watched: [],
  });

  useEffect(() => {
    const sync = () => setPass(loadPass());
    sync();
    window.addEventListener(PASS_EVENT, sync);
    return () => window.removeEventListener(PASS_EVENT, sync);
  }, []);

  const chief = SKINS.find((s) => s.id === "chief")!;
  const chiefReady = isUnlocked(chief, pass.xp);

  return (
    <section id="locker" className="section-wrap py-16 sm:py-20">
      <section className="relative bg-[#161c10] p-4 sm:p-6 pixel-bevel-chief">
        <h2 className="mb-4 bg-[#d4af37] px-3 py-2 text-center text-[10px] text-[#161c10] sm:text-xs">
          CHIEF&apos;S LOCKER  •  ARMORY 117
        </h2>
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="pixel-border bg-[#0c1408] p-4 text-center">
            <svg
              viewBox="0 0 16 16"
              className="mx-auto h-40 w-40"
              shapeRendering="crispEdges"
              aria-label="Master Chief 8-bit"
            >
              <rect width="16" height="16" fill="#0c1408" />
              <rect x="5" y="1" width="6" height="1" fill="#140008" />
              <rect x="4" y="2" width="8" height="5" fill="#6b8f3c" />
              <rect x="3" y="3" width="10" height="3" fill="#556b2f" />
              <rect x="4" y="4" width="8" height="2" fill="#ffcc00" />
              <rect x="5" y="4" width="6" height="2" fill="#fff4c2" />
              <rect x="4" y="7" width="8" height="1" fill="#140008" />
              <rect x="3" y="8" width="10" height="5" fill="#556b2f" />
              <rect x="7" y="9" width="2" height="3" fill="#d4af37" />
              <rect x="4" y="13" width="3" height="2" fill="#140008" />
              <rect x="9" y="13" width="3" height="2" fill="#140008" />
              <rect x="4" y="15" width="3" height="1" fill="#6b8f3c" />
              <rect x="9" y="15" width="3" height="1" fill="#6b8f3c" />
            </svg>
            <p className="font-press mt-3 text-[10px] text-[#d4af37]">
              MJOLNIR MK.VI
            </p>
            <p className="font-press mt-1 text-[8px] text-[#9aaa70]">
              SPARTAN 117
            </p>
            <p className="font-vt mt-3 text-lg text-[#c9d46a]">
              {chiefReady
                ? "Armor unlocked. Finish the fight."
                : `Need ${chief.xp} XP on the VIPER pass to pull Chief from the locker.`}
            </p>
            <Button
              variant="pixel"
              className="mt-4 h-11 w-full bg-[#556b2f] text-[10px]"
              disabled={!chiefReady}
              onClick={() => {
                if (equipSkin("chief")) sfx.coin();
                else sfx.hit();
              }}
            >
              {pass.equipped === "chief" ? "CHIEF EQUIPPED" : "EQUIP CHIEF"}
            </Button>
          </div>

          <div>
            <p className="font-vt mb-4 text-xl text-[#c9d46a]">
              Every Battle Pass skin lives in this locker. Unlock with XP, then
              tap Equip. The next drop uses whatever you leave hanging here.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SKINS.map((skin) => {
                const unlocked = isUnlocked(skin, pass.xp);
                const active = pass.equipped === skin.id;
                return (
                  <button
                    key={skin.id}
                    type="button"
                    onClick={() => {
                      if (unlocked && equipSkin(skin.id)) sfx.select();
                      else sfx.hit();
                    }}
                    className={`pixel-border bg-[#0c1408] p-3 text-left ${
                      active ? "ring-4 ring-[#d4af37]" : ""
                    }`}
                  >
                    <MiniSkin palette={skin.palette} sprite={skin.sprite} />
                    <p className="font-press mt-2 truncate text-[8px] text-[#d4af37]">
                      {skin.name}
                    </p>
                    <p className="font-vt text-base text-[#9aaa70]">
                      {unlocked ? skin.blurb : "LOCKED"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
