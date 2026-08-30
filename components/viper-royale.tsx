"use client";

import { PixelPanel } from "@/components/pixel-panel";
import { Button } from "@/components/ui/button";
import { equippedSkin, PASS_EVENT } from "@/lib/pass";
import {
  mountRoyale,
  type RoyaleHud,
  type RoyaleWeapon,
} from "@/lib/royale/match";
import { sfx } from "@/lib/sfx";
import { useEffect, useRef, useState } from "react";

const EMPTY: RoyaleHud = {
  mode: "title",
  hp: 100,
  shield: 50,
  mats: 0,
  weapon: "pickaxe",
  playersLeft: 11,
  elims: 0,
  stormR: 78,
  banner: "",
  grounded: true,
};

function slotClass(id: RoyaleWeapon, current: RoyaleWeapon) {
  return id === current
    ? "border-[#ffcc00] bg-[#1a2740] text-[#ffcc00]"
    : "border-white/30 bg-black/50 text-white/80";
}

export function ViperRoyale() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const [hud, setHud] = useState<RoyaleHud>(EMPTY);
  const [skinName, setSkinName] = useState("DEFAULT FOX");
  const [full, setFull] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setSkinName(equippedSkin().name);
    sync();
    window.addEventListener(PASS_EVENT, sync);
    return () => window.removeEventListener(PASS_EVENT, sync);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const api = mountRoyale(canvas, setHud);
    apiRef.current = api;
    return () => {
      api.stop();
      apiRef.current = null;
    };
  }, [skinName]);

  useEffect(() => {
    const onFs = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const dropIn = () => {
    sfx.coin();
    apiRef.current?.start();
  };

  const toggleFull = async () => {
    const node = stageRef.current;
    if (!node) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await node.requestFullscreen();
    } catch {
      /* ignore */
    }
  };

  return (
    <section id="royale" className="section-wrap py-16 sm:py-20">
      <PixelPanel title="LIBRARY 02  •  VIPER ROYALE" tone="orange">
        <p className="font-vt mb-4 text-xl text-[#c9a0ff]">
          Third-person Fortnite slice. Bus, storm, pickaxe, guns, walls, ramps.
          Skin: {skinName}. Best on desktop — click the island to look around.
        </p>
        <div
          ref={stageRef}
          className="royale-stage relative overflow-hidden bg-[#4aa0d8]"
        >
          <canvas
            ref={canvasRef}
            className="block h-full w-full"
            onContextMenu={(e) => e.preventDefault()}
          />
          <div className="pointer-events-none absolute inset-0">
            {hud.mode !== "title" ? (
              <div className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2">
                <span className="absolute left-1/2 top-0 h-2 w-px -translate-x-1/2 bg-white/90" />
                <span className="absolute bottom-0 left-1/2 h-2 w-px -translate-x-1/2 bg-white/90" />
                <span className="absolute left-0 top-1/2 h-px w-2 -translate-y-1/2 bg-white/90" />
                <span className="absolute right-0 top-1/2 h-px w-2 -translate-y-1/2 bg-white/90" />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/25 text-center">
                <p className="text-sm font-black tracking-[0.35em] text-white/90">
                  VIPER ROYALE
                </p>
                <p className="mt-2 max-w-md px-4 text-lg text-white">
                  3D Battle Royale minigame. Drop from the bus. Outlast 10 bots.
                  Last one standing gets Victory Royale.
                </p>
              </div>
            )}

            {hud.banner ? (
              <p className="absolute left-1/2 top-16 -translate-x-1/2 bg-black/55 px-4 py-2 text-center text-sm font-black tracking-widest text-[#ffcc00]">
                {hud.banner}
              </p>
            ) : null}

            <div className="absolute right-4 top-4 text-right text-white">
              <p className="text-3xl font-black">{hud.playersLeft}</p>
              <p className="text-xs font-bold tracking-widest text-white/80">
                PLAYERS LEFT
              </p>
              <p className="mt-2 text-xs font-bold text-[#ffcc00]">
                ELIMS {hud.elims}
              </p>
            </div>

            {hud.mode === "play" || hud.mode === "drop" || hud.mode === "bus" ? (
              <div className="absolute bottom-4 left-1/2 w-[min(420px,92%)] -translate-x-1/2">
                <div className="mb-2 flex justify-center gap-2">
                  {(
                    [
                      ["pickaxe", "1  PICK"],
                      ["ar", "2  AR"],
                      ["shotgun", "3  PUMP"],
                    ] as const
                  ).map(([id, label]) => (
                    <span
                      key={id}
                      className={`rounded border-2 px-3 py-2 text-xs font-black ${slotClass(id, hud.weapon)}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div className="rounded bg-black/55 px-3 py-2">
                  <div className="mb-1 h-2 w-full bg-[#1a3a58]">
                    <div
                      className="h-full bg-[#3cdcff]"
                      style={{ width: `${hud.shield}%` }}
                    />
                  </div>
                  <div className="h-3 w-full bg-[#143018]">
                    <div
                      className="h-full bg-[#4cff62]"
                      style={{ width: `${hud.hp}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs font-bold text-white">
                    <span>HP {Math.round(hud.hp)}</span>
                    <span>SHD {Math.round(hud.shield)}</span>
                    <span className="text-[#e8b020]">WOOD {hud.mats}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {hud.mode === "win" || hud.mode === "over" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <p
                  className={`text-4xl font-black tracking-widest sm:text-6xl ${
                    hud.mode === "win" ? "text-[#ffcc00]" : "text-[#ff4d4d]"
                  }`}
                >
                  {hud.mode === "win" ? "VICTORY ROYALE" : "ELIMINATED"}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="pixel" className="h-11 px-4" onClick={dropIn}>
            {hud.mode === "over" || hud.mode === "win"
              ? "DROP IN AGAIN"
              : "DROP IN"}
          </Button>
          <Button variant="arcade" className="h-11 px-3" onClick={() => void toggleFull()}>
            {full ? "EXIT FULL" : "FULLSCREEN"}
          </Button>
          <p className="font-vt text-lg text-[#c9a0ff]">
            WASD move. Mouse look. Space jump / leave bus. 1 pickaxe, 2 AR, 3
            pump. Click to harvest or shoot. Q wall. E / C ramp. Shift sprint.
            Chests give shield and wood.
          </p>
        </div>
      </PixelPanel>
    </section>
  );
}
