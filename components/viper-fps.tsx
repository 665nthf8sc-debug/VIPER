"use client";

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
};

export function ViperFps() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ReturnType<typeof mountFps> | null>(null);
  const [hud, setHud] = useState<FpsHud>(EMPTY);
  const [full, setFull] = useState(false);

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
    apiRef.current?.start();
    canvasRef.current?.focus();
    sfx.coin();
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
      <PixelPanel title="VIPER FPS  •  RAYCAST ISLAND" tone="orange">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <div>
            <p className="font-vt mb-3 text-xl text-[#f8f0d8]">
              Wolfenstein-style raycasting on a Fortnite island. High-res pixel
              brick, wood, hedges, and stone. Hunt Peely, Chief, Jonesy, and
              rival foxes. Loot pump, SCAR, exotic, medkits, and llamas.
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
              <Button variant="pixel" className="h-11 px-4" onClick={start}>
                {hud.mode === "win" || hud.mode === "over"
                  ? "DROP AGAIN"
                  : "ENTER ISLAND"}
              </Button>
              <Button variant="arcade" className="h-11 px-3" onClick={() => void toggleFull()}>
                {full ? "EXIT FULL" : "FULLSCREEN"}
              </Button>
              <p className="font-vt text-lg text-[#c9a0ff]">
                WASD move · mouse look · click shoot · E loot · 1–4 weapons ·
                Shift sprint
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
                {Math.ceil(hud.hp)} HP · {Math.ceil(hud.shield)} SHIELD
              </p>
              <p className="font-vt mt-1 text-xl text-[#ffcc00]">
                {hud.weapon.replace("_", " ").toUpperCase()} · ELIMS {hud.elims}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(
                  [
                    ["pickaxe", "PICKAXE", true],
                    ["pump", "PUMP", hud.hasPump],
                    ["scar", "SCAR", hud.hasScar],
                    ["exotic", "EXOTIC", hud.hasExotic],
                  ] as const
                ).map(([id, label, owned]) => (
                  <div
                    key={id}
                    className={`pixel-border p-2 ${
                      hud.weapon === id ? "ring-4 ring-[#ffcc00]" : ""
                    } ${owned ? "bg-[#1a0033]" : "bg-[#05000a] opacity-50"}`}
                  >
                    <p className="font-press text-[8px] text-[#ffcc00]">{label}</p>
                    <p className="font-vt text-base text-[#c9a0ff]">
                      {owned ? (hud.weapon === id ? "ACTIVE" : "FOUND") : "FIND ON MAP"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="pixel-bevel mt-4 bg-[#05000a] p-4">
              <p className="font-press text-[8px] text-[#ff6a00]">RIVALS</p>
              <p className="font-vt mt-2 text-lg text-[#f8f0d8]">
                Peely, Master Chief, Jonesy, and VIPER fox bots patrol the
                outpost. Clear the island for a Victory Royale.
              </p>
              <p className="font-press mt-3 text-[8px] text-[#00e800]">ISLAND TILES</p>
              <p className="font-vt mt-2 text-lg text-[#c9a0ff]">
                Tilted brick, wood builds, metal shacks, hedge paths, stone
                tower — all raycast with distance shading and grass floors.
              </p>
            </div>
          </div>
        </div>
      </PixelPanel>
    </section>
  );
}
