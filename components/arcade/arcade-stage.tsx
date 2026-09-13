"use client";

/* eslint-disable @next/next/no-img-element */

import { arcadeAsset } from "@/lib/arcade/asset";
import { PET_PORTRAITS, THEMES, skinByPortrait, type ThemeId } from "@/lib/arcade/catalog";
import type { PublicProfile } from "@/lib/arcade/save";
import {
  SPEED,
  DEPTH_SPEED,
  nearestProp,
  resolveCollision,
  scaleForZ,
  screenYForZ,
  visibleMachines,
  type Vec,
} from "@/lib/arcade/world";
import type { SkinId } from "@/lib/pass";
import type { SidekickId } from "@/lib/sprites";
import { useEffect, useRef } from "react";

export type OverlayKind =
  | null
  | "account"
  | "keypad"
  | "skins"
  | "settings"
  | "friends"
  | "prize"
  | "soon"
  | "debug"
  | "insert"
  | "game"
  | "cutscene";

type Props = {
  theme: ThemeId;
  skin: SkinId;
  pet: SidekickId;
  secret: boolean;
  overlay: OverlayKind;
  visitor: PublicProfile | null;
  quality: "high" | "low";
  dancing: boolean;
  onPrompt: (label: string | null) => void;
  onInteract: (id: string, kind: string, title: string) => void;
  keysRef: React.MutableRefObject<Set<string>>;
};

export function ArcadeStage({
  theme,
  skin,
  pet,
  secret,
  overlay,
  visitor,
  quality,
  dancing,
  onPrompt,
  onInteract,
  keysRef,
}: Props) {
  const worldRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const palmsRef = useRef<HTMLDivElement>(null);
  const signsRef = useRef<HTMLDivElement>(null);
  const pos = useRef<Vec>({ x: 380, z: 72 });
  const facing = useRef(1);
  const cam = useRef(200);
  const look = useRef(0);
  const moving = useRef(false);
  const foot = useRef(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const locked = () =>
      overlay === "game" ||
      overlay === "keypad" ||
      overlay === "account" ||
      overlay === "insert" ||
      overlay === "skins" ||
      overlay === "settings" ||
      overlay === "friends" ||
      overlay === "prize" ||
      overlay === "soon" ||
      overlay === "debug";

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const keys = keysRef.current;
      if (!locked() && overlay !== "cutscene") {
        let vx = 0;
        let vz = 0;
        if (keys.has("a") || keys.has("arrowleft")) vx -= 1;
        if (keys.has("d") || keys.has("arrowright")) vx += 1;
        if (keys.has("w") || keys.has("arrowup")) vz -= 1;
        if (keys.has("s") || keys.has("arrowdown")) vz += 1;
        if (vx !== 0 || vz !== 0) {
          const len = Math.hypot(vx, vz) || 1;
          pos.current = resolveCollision(
            {
              x: pos.current.x + (vx / len) * SPEED * dt,
              z: pos.current.z + (vz / len) * DEPTH_SPEED * dt,
            },
            secret
          );
          if (vx !== 0) facing.current = vx > 0 ? 1 : -1;
          moving.current = true;
          foot.current += dt;
        } else {
          moving.current = false;
        }
      }
      if (overlay === "cutscene") {
        pos.current = { x: 3920, z: 70 };
        cam.current += (3920 - 420 - cam.current) * Math.min(1, dt * 1.8);
      } else {
        const target = pos.current.x - 420 + look.current;
        cam.current += (target - cam.current) * Math.min(1, dt * 6);
      }
      look.current *= 1 - dt * 3;

      const world = worldRef.current;
      const player = playerRef.current;
      const root = world?.parentElement;
      if (world && player && root) {
        const h = root.clientHeight;
        world.style.transform = `translate3d(${-cam.current}px,0,0)`;
        if (palmsRef.current) {
          palmsRef.current.style.transform = `translate3d(${-cam.current * 0.14}px,0,0)`;
        }
        if (signsRef.current) {
          signsRef.current.style.transform = `translate3d(${-cam.current * 0.45}px,0,0)`;
        }
        const y = screenYForZ(pos.current.z, h);
        const sc = scaleForZ(pos.current.z);
        player.style.left = `${pos.current.x}px`;
        player.style.top = `${y}px`;
        player.style.transform = `translate(-50%,-92%) scale(${facing.current * sc},${sc})`;
        player.style.zIndex = String(200 + Math.round(pos.current.z));
        player.classList.toggle("is-walk", moving.current);
        player.classList.toggle("is-dance", dancing);
        const near = nearestProp(pos.current, secret);
        if (near && !locked() && overlay !== "cutscene") {
          const verb =
            near.kind === "machine" || near.game
              ? `E · INSERT COIN · ${near.title}`
              : near.kind === "keypad"
                ? "E · KEYPAD"
                : near.kind === "soon"
                  ? `E · ${near.title} UNDER CONSTRUCTION`
                  : `E · ${near.title}`;
          onPrompt(verb);
        } else {
          onPrompt(null);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dancing, keysRef, onInteract, onPrompt, overlay, secret]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) {
        if (overlay === null) e.preventDefault();
      }
      if (overlay !== null && overlay !== "cutscene") return;
      if (k === "e" || k === " ") {
        const near = nearestProp(pos.current, secret);
        if (near?.id === "admin-back") {
          pos.current = { x: 380, z: 72 };
          return;
        }
        if (near) onInteract(near.id, near.kind, near.title);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onInteract, overlay, secret]);

  const t = THEMES[theme];
  const portrait = arcadeAsset(skinByPortrait(skin).portrait);
  const petSrc =
    pet !== "none" ? arcadeAsset(PET_PORTRAITS[pet as Exclude<SidekickId, "none">]) : null;
  const machines = visibleMachines(secret);

  return (
    <div
      className={`arcade-stage ${quality === "low" ? "is-low" : ""}`}
      style={
        {
          "--mag": t.mag,
          "--cyan": t.cyan,
          "--deep": t.deep,
          "--floor": t.floor,
        } as React.CSSProperties
      }
    >
      <div className="arcade-sky" />
      <div ref={palmsRef} className="arcade-palms" />
      <div ref={signsRef} className="arcade-wall-signs">
        <span style={{ left: 240 }}>PLAYER 1</span>
        <span style={{ left: 980 }}>VIPER DROP</span>
        <span style={{ left: 1700 }}>TILTED</span>
        <span style={{ left: 2420 }}>STORM KING</span>
        <span style={{ left: 3720 }}>CODES</span>
        {secret ? <span style={{ left: 4600 }}>ADMIN</span> : null}
      </div>
      <div ref={worldRef} className="arcade-world">
        <div className="arcade-floor" />
        {machines.map((m) => (
          <div
            key={m.id}
            className={`arcade-prop kind-${m.kind} ${m.id === "secret-door" && secret ? "is-open" : ""}`}
            style={{
              left: m.x,
              top: `calc(62% + ${m.z * 0.72}px)`,
              zIndex: 100 + Math.round(m.z),
              width: m.w + 48,
              ["--hue" as string]: m.hue,
              ["--accent" as string]: m.accent,
              transform: `translate(-50%,-100%) scale(${scaleForZ(m.z)})`,
            }}
          >
            {m.kind === "machine" || m.kind === "admin" ? (
              <div className="cabinet">
                <div className="cabinet-marquee">{m.title}</div>
                <div className="cabinet-screen">
                  <i />
                  <b />
                </div>
                <div className="cabinet-body" />
                <div className="cabinet-slot">INSERT COIN</div>
              </div>
            ) : null}
            {m.kind === "soon" ? (
              <div className="cabinet soon">
                <div className="tape" />
                <div className="cabinet-marquee">COMING SOON</div>
                <div className="cabinet-screen dim">{m.title}</div>
                <div className="sparks" />
              </div>
            ) : null}
            {m.kind === "terminal" ? (
              <div className="terminal">
                <div className="terminal-screen">{m.title}</div>
                <p>{m.subtitle}</p>
              </div>
            ) : null}
            {m.kind === "prize" ? (
              <div className="booth">
                <div className="booth-sign">PRIZE COUNTER</div>
                <div className="booth-window" />
              </div>
            ) : null}
            {m.kind === "keypad" ? (
              <div className="keypad-wall">
                <div className="keypad-glow" />
                <p>KEYPAD</p>
              </div>
            ) : null}
            {m.kind === "door" ? (
              <div className="fake-wall">
                <div className="panel left" />
                <div className="panel right" />
                {secret && m.id === "secret-door" ? <span>ADMIN</span> : <span> </span>}
              </div>
            ) : null}
          </div>
        ))}
        {visitor ? (
          <div
            className="arcade-npc"
            style={{
              left: 520,
              top: "calc(62% + 50px)",
              transform: "translate(-50%,-92%) scale(0.95)",
              zIndex: 160,
            }}
          >
            <img src={arcadeAsset(skinByPortrait(visitor.equipped).portrait)} alt="" />
            <em>{visitor.username}</em>
          </div>
        ) : null}
        <div ref={playerRef} className="arcade-player">
          <img src={portrait} alt="" draggable={false} />
          {petSrc ? <img className="arcade-pet" src={petSrc} alt="" /> : null}
        </div>
      </div>
      <div className="arcade-fg" />
    </div>
  );
}
