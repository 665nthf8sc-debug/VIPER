"use client";

import { Button } from "@/components/ui/button";
import {
  ACHIEVEMENTS,
  EMOTES,
  EMPTY_PASS,
  FINDS,
  SIDEKICKS,
  SKINS,
  equipEmote,
  equipSidekick,
  equipSkin,
  isEmoteUnlocked,
  isSidekickUnlocked,
  isUnlocked,
  loadPass,
  PASS_EVENT,
  type PassState,
} from "@/lib/pass";
import { HdSkin } from "@/components/hd-skin";
import { sfx } from "@/lib/sfx";
import { useEffect, useState } from "react";

export function Locker() {
  const [pass, setPass] = useState<PassState>(EMPTY_PASS);
  const [tab, setTab] = useState<"skins" | "emotes" | "pets" | "finds" | "ach">("skins");

  useEffect(() => {
    const sync = () => setPass(loadPass());
    sync();
    window.addEventListener(PASS_EVENT, sync);
    return () => window.removeEventListener(PASS_EVENT, sync);
  }, []);

  const chief = SKINS.find((s) => s.id === "chief")!;
  const chiefReady = isUnlocked(chief, pass);

  return (
    <section id="locker" className="section-wrap py-16 sm:py-20">
      <section className="relative bg-[#161c10] p-4 sm:p-6 pixel-bevel-chief">
        <h2 className="mb-4 bg-[#d4af37] px-3 py-2 text-center text-[10px] text-[#161c10] sm:text-xs">
          LOCKER  •  SKINS  EMOTES  PETS  FINDS
        </h2>
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="pixel-border bg-[#0c1408] p-4 text-center">
            <HdSkin
              palette={SKINS.find((s) => s.id === pass.equipped)?.palette ?? chief.palette}
              sprite={SKINS.find((s) => s.id === pass.equipped)?.sprite ?? "fox"}
              skinId={pass.equipped}
            />
            <p className="font-press mt-3 text-[10px] text-[#d4af37]">
              {SKINS.find((s) => s.id === pass.equipped)?.name}
            </p>
            <p className="font-vt mt-3 text-lg text-[#c9d46a]">
              XP {pass.xp} · {pass.stats.wins} WINS · {pass.stats.elims} ELIMS
            </p>
            <p className="font-vt mt-2 text-lg text-[#9aaa70]">
              {chiefReady
                ? "Chief is in the locker."
                : `Chief unlocks at ${chief.xp} pass XP.`}
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
              Island finds, dances, and pets live here. Pick something up in
              VIPER DROP or walk the Tilted plaza and it shows in Finds.
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              {(
                [
                  ["skins", "SKINS"],
                  ["emotes", "EMOTES"],
                  ["pets", "PETS"],
                  ["finds", "FINDS"],
                  ["ach", "ACHIEVE"],
                ] as const
              ).map(([id, label]) => (
                <Button
                  key={id}
                  variant={tab === id ? "pixel" : "arcade"}
                  className="h-9 px-3 text-[8px]"
                  onClick={() => {
                    setTab(id);
                    sfx.select();
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>

            {tab === "skins" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {SKINS.map((skin) => {
                  const unlocked = isUnlocked(skin, pass);
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
                      <HdSkin palette={skin.palette} sprite={skin.sprite} skinId={skin.id} />
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
            ) : null}

            {tab === "emotes" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {EMOTES.map((emote) => {
                  const unlocked = isEmoteUnlocked(emote.id, pass);
                  return (
                    <button
                      key={emote.id}
                      type="button"
                      onClick={() => {
                        if (unlocked && equipEmote(emote.id)) sfx.xp();
                        else sfx.hit();
                      }}
                      className={`pixel-border bg-[#0c1408] p-3 text-left ${
                        pass.emote === emote.id ? "ring-4 ring-[#d4af37]" : ""
                      }`}
                    >
                      <p className="font-press text-[9px] text-[#d4af37]">{emote.name}</p>
                      <p className="font-vt text-lg text-[#9aaa70]">
                        {unlocked ? emote.blurb : "LOCKED"}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {tab === "pets" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {SIDEKICKS.map((pet) => {
                  const unlocked = isSidekickUnlocked(pet.id, pass);
                  return (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => {
                        if (unlocked && equipSidekick(pet.id)) sfx.coin();
                        else sfx.hit();
                      }}
                      className={`pixel-border bg-[#0c1408] p-3 text-left ${
                        pass.sidekick === pet.id ? "ring-4 ring-[#d4af37]" : ""
                      }`}
                    >
                      <p className="font-press text-[9px] text-[#d4af37]">{pet.name}</p>
                      <p className="font-vt text-lg text-[#9aaa70]">
                        {unlocked ? pet.blurb : "LOCKED"}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {tab === "finds" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {FINDS.map((item) => {
                  const have = pass.finds.includes(item.id);
                  return (
                    <div key={item.id} className="pixel-border bg-[#0c1408] p-3">
                      <p className="font-press text-[9px] text-[#d4af37]">{item.name}</p>
                      <p className="font-vt text-lg text-[#9aaa70]">
                        {have ? item.blurb : "NOT FOUND YET"}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {tab === "ach" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ACHIEVEMENTS.map((row) => {
                  const have = pass.achievements.includes(row.id);
                  return (
                    <div key={row.id} className="pixel-border bg-[#0c1408] p-3">
                      <p className="font-press text-[9px] text-[#d4af37]">{row.name}</p>
                      <p className="font-vt text-lg text-[#9aaa70]">{row.blurb}</p>
                      <p className="font-press mt-1 text-[8px] text-[#00e800]">
                        {have ? `DONE  •  ${row.reward}` : `REWARD  ${row.reward}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </section>
  );
}
