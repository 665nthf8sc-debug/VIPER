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
    ? "border-[#ffcc33] bg-[#152238]/90 text-[#ffcc33] shadow-[0_0_16px_#ffcc3388]"
    : "border-white/25 bg-black/40 text-white/80";
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
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black tracking-[0.35em] text-[#7ec8ff]">
              CHAPTER 7  •  VIPER ISLAND
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-5xl">
              VIPER Royale
            </h2>
            <p className="mt-2 max-w-xl text-base text-white/75">
              Fortnite-style third person. Smooth fighters, sunny island, storm
              wall, and an original drop score. Outfit: {skinName}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={dropIn}
              className="rounded-sm bg-[#ffcc33] px-5 py-3 text-sm font-black tracking-widest text-[#1a1400] shadow-[0_4px_0_#b38f00] hover:brightness-110"
            >
              {hud.mode === "over" || hud.mode === "win"
                ? "DROP IN AGAIN"
                : "DROP IN"}
            </button>
            <button
              type="button"
              onClick={() => void toggleFull()}
              className="rounded-sm bg-[#2b5cff] px-4 py-3 text-sm font-black tracking-widest text-white shadow-[0_4px_0_#1636aa]"
            >
              {full ? "EXIT" : "FULLSCREEN"}
            </button>
            <button
              type="button"
              onClick={toggleMusic}
              className="rounded-sm bg-[#152238] px-4 py-3 text-sm font-black tracking-widest text-white ring-1 ring-white/20"
            >
              {musicOn ? "MUSIC ON" : "MUSIC OFF"}
            </button>
          </div>
        </div>

        <div
          ref={stageRef}
          className="royale-stage relative overflow-hidden rounded-sm ring-4 ring-[#152238] shadow-[0_20px_60px_#041018]"
        >
          <canvas
            ref={canvasRef}
            className="block h-full w-full"
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
              <div className="absolute inset-x-0 bottom-10 text-center">
                <p className="text-sm font-black tracking-[0.4em] text-white/90">
                  BATTLE BUS INBOUND
                </p>
              </div>
            )}

            {hud.banner ? (
              <p className="absolute left-1/2 top-14 -translate-x-1/2 bg-[#152238]/80 px-5 py-2 text-center text-sm font-black tracking-[0.28em] text-[#ffcc33]">
                {hud.banner}
              </p>
            ) : null}

            <div className="absolute right-5 top-5 text-right text-white drop-shadow-[0_2px_8px_#000]">
              <p className="text-4xl font-black">{hud.playersLeft}</p>
              <p className="text-[11px] font-black tracking-[0.25em] text-white/80">
                PLAYERS LEFT
              </p>
              <p className="mt-2 text-xs font-black text-[#ffcc33]">
                ELIMS {hud.elims}
              </p>
            </div>

            {hud.mode === "play" || hud.mode === "drop" || hud.mode === "bus" ? (
              <div className="absolute bottom-5 left-1/2 w-[min(440px,94%)] -translate-x-1/2">
                <div className="mb-2 flex justify-center gap-2">
                  {(
                    [
                      ["pickaxe", "1  PICKAXE"],
                      ["ar", "2  ASSAULT"],
                      ["shotgun", "3  PUMP"],
                    ] as const
                  ).map(([id, label]) => (
                    <span
                      key={id}
                      className={`rounded-sm border-2 px-3 py-2 text-[11px] font-black ${slotClass(id, hud.weapon)}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div className="rounded-sm bg-[#152238]/80 px-3 py-2 ring-1 ring-white/10">
                  <div className="mb-1 h-2.5 w-full overflow-hidden rounded-sm bg-[#16324d]">
                    <div
                      className="h-full bg-[#3cdcff]"
                      style={{ width: `${hud.shield}%` }}
                    />
                  </div>
                  <div className="h-3.5 w-full overflow-hidden rounded-sm bg-[#143018]">
                    <div
                      className="h-full bg-[#4cff62]"
                      style={{ width: `${hud.hp}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] font-black text-white">
                    <span>HP {Math.round(hud.hp)}</span>
                    <span>SHIELD {Math.round(hud.shield)}</span>
                    <span className="text-[#e8b020]">WOOD {hud.mats}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {hud.mode === "win" || hud.mode === "over" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                <p
                  className={`text-5xl font-black tracking-[0.12em] sm:text-7xl ${
                    hud.mode === "win" ? "text-[#ffcc33]" : "text-[#ff5a5a]"
                  }`}
                >
                  {hud.mode === "win" ? "VICTORY ROYALE" : "ELIMINATED"}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <p className="mt-4 text-sm text-white/70">
          WASD move · Mouse look · Space jump / leave bus · 1 pickaxe 2 AR 3 pump
          · Click harvest or shoot · Q wall · E / C ramp · Shift sprint · Gold
          chests for shield and wood. Music is original VIPER score, not Epic&apos;s
          soundtrack.
        </p>
      </div>
    </section>
  );
}
