"use client";

import { FpsItemIcon } from "@/components/fps-item-icon";
import { PixelIcon, PixelPanel } from "@/components/pixel-panel";
import { Button } from "@/components/ui/button";
import { mountFps, type FpsHud } from "@/lib/fps/engine";
import { sfx } from "@/lib/sfx";
import { useEffect, useRef, useState } from "react";

const EMPTY: FpsHud = {
  mode: "title",
  hp: 100,
  shield: 50,
  weapon: "pickaxe",
  ammo: "MELEE",
  elims: 0,
  banner: "",
  hasPump: false,
  hasScar: false,
  hasExotic: false,
  pumpAmmo: "—",
  scarAmmo: "—",
  exoticAmmo: "—",
  level: 1,
  levelName: "BEACH OUTPOST",
  remaining: 5,
  bossLive: false,
  bossName: "",
  score: 0,
  lives: 3,
};

export function ViperFps() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ReturnType<typeof mountFps> | null>(null);
  const [hud, setHud] = useState<FpsHud>(EMPTY);
  const [full, setFull] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const api = mountFps(canvas, setHud);
    apiRef.current = api;
    return () => {
      api.stop();
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onFs = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const start = () => {
    sfx.setMuted(muted);
    apiRef.current?.start();
    apiRef.current?.lockPointer();
    sfx.coin();
    const focusView = () => canvasRef.current?.focus();
    focusView();
    queueMicrotask(focusView);
    requestAnimationFrame(focusView);
    window.setTimeout(focusView, 0);
  };

  const toggleFull = async () => {
    const node = stageRef.current;
    if (!node) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await node.requestFullscreen();
      sfx.select();
    } catch {
      sfx.hit();
    }
  };

  return (
    <section id="fps" className="section-wrap py-16 sm:py-20">
      <PixelPanel title="VIPER FPS  •  3 LEVELS + BOSSES" tone="orange">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <div>
            <p className="font-vt mb-3 text-xl text-[#f8f0d8]">
              Three-level raycast island. Beach Outpost, Neon Villa, then
              Hazard Foundry. Wolf3D stats bar under the view — VIPER face
              beats up as you take hits. Animated guns, rivals that shoot
              back. Loot pump, SCAR, exotic, ammo, medkits, chests, and llamas.
            </p>
            <div
              ref={stageRef}
              className="fps-stage game-stage pixel-bevel bg-[#05000a] p-2 sm:p-3"
            >
              <canvas
                ref={canvasRef}
                tabIndex={0}
                className="pixelated mx-auto block h-auto w-full max-w-[960px] cursor-crosshair bg-black outline-none"
                style={{ imageRendering: "pixelated", aspectRatio: "16 / 9" }}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                variant="pixel"
                className="h-11 px-4"
                onClick={(e) => {
                  e.currentTarget.blur();
                  start();
                }}
              >
                {hud.mode === "win" || hud.mode === "over" ? "DROP AGAIN" : "ENTER ISLAND"}
              </Button>
              <Button variant="arcade" className="h-11 px-3" onClick={() => void toggleFull()}>
                {full ? "EXIT FULL" : "FULLSCREEN"}
              </Button>
              <Button
                variant="arcade"
                className="h-11 px-3"
                onClick={() => {
                  setMuted((m) => {
                    const next = !m;
                    sfx.setMuted(next);
                    if (!next) {
                      sfx.playFpsMusic(hud.mode === "play" || hud.mode === "win" || hud.mode === "over" ? "game" : "title");
                    }
                    return next;
                  });
                }}
              >
                {muted ? "SFX OFF" : "SFX ON"}
              </Button>
              <p className="font-vt text-lg text-[#c9a0ff]">
                WASD move · Q/E turn · Space shoot · 1–4 / wheel weapons ·
                Shift sprint. Mouse look: click the view (Esc unlocks). Walk
                over loot. Arrows also turn. R reload.
              </p>
            </div>
            {hud.banner ? (
              <p className="font-press mt-2 text-[9px] text-[#ffcc00]">{hud.banner}</p>
            ) : null}
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2">
              <PixelIcon name="tower" />
              <h3 className="font-press text-[10px] text-[#ffcc00]">LOADOUT</h3>
            </div>
            <div className="pixel-bevel bg-[#05000a] p-4">
              <p className="font-press text-[8px] text-[#3cdcff]">STATUS</p>
              <p className="font-vt mt-2 text-2xl text-[#00e800]">
                {Math.max(0, Math.ceil(hud.hp))} HP ·{" "}
                {Math.max(0, Math.ceil(hud.shield))} SHIELD
              </p>
              <p className="font-vt mt-1 text-xl text-[#ffcc00]">
                SCORE {hud.score} · LIVES {hud.lives} · LEVEL {hud.level}{" "}
                {hud.levelName}
              </p>
              <p className="font-vt mt-1 text-xl text-[#f8f0d8]">
                {hud.bossLive ? `BOSS ${hud.bossName}` : `REMAIN ${hud.remaining}`}{" "}
                · ELIMS {hud.elims}
              </p>
              <p className="font-vt mt-1 text-xl text-[#c9a0ff]">
                {hud.weapon.replace("_", " ").toUpperCase()} · {hud.ammo}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(
                  [
                    ["pickaxe", "PICKAXE", true, "MELEE"],
                    ["pump", "PUMP", hud.hasPump, hud.pumpAmmo],
                    ["scar", "SCAR", hud.hasScar, hud.scarAmmo],
                    ["exotic", "EXOTIC", hud.hasExotic, hud.exoticAmmo],
                  ] as const
                ).map(([id, label, owned, ammo]) => (
                  <div
                    key={id}
                    className={`pixel-border p-2 ${
                      hud.weapon === id ? "ring-4 ring-[#ffcc00]" : ""
                    } ${owned ? "bg-[#1a0033]" : "bg-[#05000a] opacity-50"}`}
                  >
                    <FpsItemIcon id={id} dim={!owned} />
                    <p className="font-press mt-1 text-[8px] text-[#ffcc00]">{label}</p>
                    <p className="font-vt text-base text-[#c9a0ff]">
                      {owned
                        ? `${hud.weapon === id ? "ACTIVE" : "OWNED"} · ${ammo}`
                        : "FIND ON MAP"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="pixel-bevel mt-4 bg-[#05000a] p-4">
              <p className="font-press text-[8px] text-[#ff6a00]">LEVEL LOOP</p>
              <p className="font-vt mt-2 text-lg text-[#f8f0d8]">
                L1 Beach Outpost — 5 rivals then King Peely. L2 Neon Villa —
                8 then Storm Overlord. L3 Hazard Foundry — 12 then Iron
                Chief. +100 score per elim, +500 boss. Three lives; death
                respawns the level. Zero lives is game over.
              </p>
              <p className="font-press mt-3 text-[8px] text-[#00e800]">ISLAND TILES</p>
              <p className="font-vt mt-2 text-lg text-[#c9a0ff]">
                Each stage retile: outdoor grass, indoor villa wood, industrial
                metal. Radar marks bosses with a star. Q/E turn, walk-over
                loot, mag / reserve on every gun.
              </p>
            </div>
          </div>
        </div>
      </PixelPanel>
    </section>
  );
}
