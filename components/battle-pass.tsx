"use client";

import { PixelIcon, PixelPanel } from "@/components/pixel-panel";
import { Button } from "@/components/ui/button";
import {
  equipSkin,
  isUnlocked,
  loadPass,
  EMPTY_PASS,
  maxPassXp,
  nextSkin,
  PASS_EVENT,
  passSkins,
  skinById,
  type PassState,
} from "@/lib/pass";
import { HdSkin } from "@/components/hd-skin";
import { sfx } from "@/lib/sfx";
import { useEffect, useState } from "react";

export function BattlePass() {
  const [pass, setPass] = useState<PassState>(EMPTY_PASS);

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
              XP is slow on purpose. A match banks a handful of points, not the
              whole track. Watch tapes (+8), like them (+12), then grind drops.
              Equipped:{" "}
              <span className="text-[#ffcc00]">{equipped.name}</span>
              {upcoming
                ? ` · ${toNext} XP to ${upcoming.name}`
                : " · PASS COMPLETE"}
            </p>
          </div>
          <div className="pixel-bevel bg-[#05000a] p-2">
            <HdSkin palette={equipped.palette} sprite={equipped.sprite} skinId={equipped.id} size={48} />
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {passSkins().map((skin, i) => {
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
                  {`TIER ${String(i + 1).padStart(2, "0")}`}
                </p>
                <HdSkin palette={skin.palette} sprite={skin.sprite} skinId={skin.id} size={48} />
                <p className="font-press mt-2 text-[9px] text-[#ffcc00]">
                  {skin.name}
                </p>
                <p className="font-vt text-base text-[#c9a0ff]">
                  {unlocked ? "UNLOCKED" : `${skin.xp} XP`}
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
              Drop in and survive. A full match caps around 35 XP — you will not
              clear the pass in one game. Elims and a Victory Royale help.
            </p>
          </div>
          <div className="flex items-start gap-3 bg-[#1a0033] p-3">
            <PixelIcon name="youtube" />
            <p className="font-vt text-lg text-[#f8f0d8]">
              Watch a featured VIPER clip for +8 XP the first time. Like a tape
              for +12. Subscribers claim the Channel 3384 exclusive.
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
