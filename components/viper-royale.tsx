"use client";

import { equippedSkin, PASS_EVENT } from "@/lib/pass";
import {
  mountRoyale,
  type RoyaleHud,
  type RoyaleWeapon,
} from "@/lib/royale/match";
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
    ? "border-amber-300 bg-sky-950/85 text-amber-300 shadow-[0_0_18px_#fde04766]"
    : "border-white/20 bg-black/35 text-white/80";
}

export function ViperRoyale() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<{
    start: () => void;
    stop: () => void;
    setMusicMuted: (m: boolean) => void;
  } | null>(null);
  const [hud, setHud] = useState<RoyaleHud>(EMPTY);
  const [skinName, setSkinName] = useState("DEFAULT FOX");
  const [full, setFull] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
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
    apiRef.current?.start();
    apiRef.current?.setMusicMuted(!musicOn);
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

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    apiRef.current?.setMusicMuted(!next);
  };

  return (
    <section id="royale" className="royale-wrap py-16 sm:py-20">
      <div className="mx-auto w-[min(1120px,calc(100%-1.5rem))]">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">
              3D Battle Royale
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-5xl">
              Island Drop
            </h2>
            <p className="mt-2 max-w-xl text-base text-white/75">
              Smooth fighters, a real Battle Bus, and a free 360° camera. Drag
              to look around the lobby, then drop in. Outfit: {skinName}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={dropIn}
              className="rounded-full bg-amber-300 px-6 py-3 text-sm font-black tracking-wide text-stone-900 shadow-lg shadow-amber-300/30 hover:brightness-110"
            >
              {hud.mode === "over" || hud.mode === "win"
                ? "Drop in again"
                : "Drop in"}
            </button>
            <button
              type="button"
              onClick={() => void toggleFull()}
              className="rounded-full bg-blue-600 px-5 py-3 text-sm font-black tracking-wide text-white shadow-lg shadow-blue-900/40"
            >
              {full ? "Exit" : "Fullscreen"}
            </button>
            <button
              type="button"
              onClick={toggleMusic}
              className="rounded-full bg-slate-900/80 px-5 py-3 text-sm font-black tracking-wide text-white ring-1 ring-white/20"
            >
              {musicOn ? "Music on" : "Music off"}
            </button>
          </div>
        </div>

        <div
          ref={stageRef}
          className="royale-stage relative overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-[0_24px_80px_#041018]"
        >
          <canvas
            ref={canvasRef}
            className="block h-full w-full cursor-grab active:cursor-grabbing"
            onContextMenu={(e) => e.preventDefault()}
          />
          <div className="pointer-events-none absolute inset-0 font-sans">
            {hud.mode !== "title" ? (
              <div className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2">
                <span className="absolute left-1/2 top-0 h-2 w-px -translate-x-1/2 bg-white" />
                <span className="absolute bottom-0 left-1/2 h-2 w-px -translate-x-1/2 bg-white" />
                <span className="absolute left-0 top-1/2 h-px w-2 -translate-y-1/2 bg-white" />
                <span className="absolute right-0 top-1/2 h-px w-2 -translate-y-1/2 bg-white" />
              </div>
            ) : (
              <div className="absolute inset-x-0 bottom-8 text-center">
                <p className="text-sm font-semibold tracking-wide text-white drop-shadow-[0_2px_8px_#000]">
                  Drag to look around · Peely, Chief, and the Battle Bus are on the pad
                </p>
              </div>
            )}

            {hud.banner ? (
              <p className="absolute left-1/2 top-14 -translate-x-1/2 rounded-full bg-slate-950/70 px-5 py-2 text-center text-sm font-semibold tracking-wide text-amber-300">
                {hud.banner}
              </p>
            ) : null}

            <div className="absolute right-5 top-5 text-right text-white drop-shadow-[0_2px_8px_#000]">
              <p className="text-4xl font-black">{hud.playersLeft}</p>
              <p className="text-[11px] font-semibold tracking-widest text-white/80">
                PLAYERS LEFT
              </p>
              <p className="mt-2 text-xs font-semibold text-amber-300">
                Elims {hud.elims}
              </p>
            </div>

            {hud.mode === "play" || hud.mode === "drop" || hud.mode === "bus" ? (
              <div className="absolute bottom-5 left-1/2 w-[min(440px,94%)] -translate-x-1/2">
                <div className="mb-2 flex justify-center gap-2">
                  {(
                    [
                      ["pickaxe", "1  Pickaxe"],
                      ["ar", "2  Assault"],
                      ["shotgun", "3  Pump"],
                    ] as const
                  ).map(([id, label]) => (
                    <span
                      key={id}
                      className={`rounded-lg border-2 px-3 py-2 text-[11px] font-bold ${slotClass(id, hud.weapon)}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div className="rounded-xl bg-slate-950/70 px-3 py-2 ring-1 ring-white/10">
                  <div className="mb-1 h-2.5 w-full overflow-hidden rounded-full bg-sky-950">
                    <div
                      className="h-full bg-cyan-400"
                      style={{ width: `${hud.shield}%` }}
                    />
                  </div>
                  <div className="h-3.5 w-full overflow-hidden rounded-full bg-green-950">
                    <div
                      className="h-full bg-lime-400"
                      style={{ width: `${hud.hp}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] font-bold text-white">
                    <span>HP {Math.round(hud.hp)}</span>
                    <span>Shield {Math.round(hud.shield)}</span>
                    <span className="text-amber-300">Wood {hud.mats}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {hud.mode === "win" || hud.mode === "over" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                <p
                  className={`text-5xl font-black tracking-tight sm:text-7xl ${
                    hud.mode === "win" ? "text-amber-300" : "text-red-400"
                  }`}
                >
                  {hud.mode === "win" ? "VICTORY ROYALE" : "ELIMINATED"}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <p className="mt-4 text-sm text-white/70">
          Drag or mouse-look in any direction — up, down, and full 360. WASD
          moves where you are looking. Space jumps or leaves the bus. 1 / 2 / 3
          weapons. Click to harvest or shoot. Q wall, E / C ramp, Shift sprint.
          Chests drop shield and wood. Music is an original score, not Epic&apos;s
          soundtrack.
        </p>
      </div>
    </section>
  );
}
