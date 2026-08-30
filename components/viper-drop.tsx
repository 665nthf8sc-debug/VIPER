"use client";

import { PixelIcon, PixelPanel } from "@/components/pixel-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MISSIONS } from "@/lib/campaign";
import { loadHallOfFame, saveHallOfFame } from "@/lib/client-scores";
import {
  beatCampaignMission,
  equippedSkin,
  grantPlayXp,
  type Skin,
} from "@/lib/pass";
import { POIS, type Poi } from "@/lib/pois";
import { sfx } from "@/lib/sfx";
import { drawBattleBus, drawGun, drawSprite, spriteRows } from "@/lib/sprites";
import {
  EMPTY_PAD,
  makeInviteCode,
  openSquadChannel,
  padActive,
  squadSeats,
  type Fill,
  type NetMsg,
  type Pad,
  type Playlist,
  type SquadSize,
} from "@/lib/squad";
import type { HighScore } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

const W = 256;
const H = 224;
const BRICK = 4;
const GROUND = 24;
const MAX_RIVALS = 4;
const GRAVITY = 0.22;
const JUMP_V = -4.35;
const HP_MAX = 100;
const SHIELD_MAX = 100;
const SHOT_DMG = 18;
const REVIVE_NEED = 300;
const BLEED_MAX = 900;

type Mode = "title" | "bus" | "play" | "over" | "win";

type Shot = {
  x: number;
  y: number;
  vx: number;
  team: number;
  color: string;
};

type Loot = { x: number; y: number; kind: "mini" | "med" };
type BrickCell = { x: number; y: number; color: string };
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
};

type Fighter = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number;
  frame: number;
  hp: number;
  shield: number;
  inv: number;
  cool: number;
  muzzle: number;
  team: number;
  slot: number;
  knocked: boolean;
  dead: boolean;
  revive: number;
  bleed: number;
  control: "bot" | "local" | "net";
  sprite: Skin["sprite"];
  palette: Record<string, string>;
};

const RIVAL_KITS: Array<Record<string, string>> = [
  {
    o: "#140008",
    W: "#d0e4ff",
    b: "#081428",
    O: "#3d7cff",
    y: "#9ad4ff",
    G: "#3d7cff",
    V: "#d0e4ff",
    H: "#3a2210",
    S: "#d0e4ff",
    B: "#3d7cff",
    Y: "#9ad4ff",
    ".": "",
  },
  {
    o: "#140008",
    W: "#d8ffe4",
    b: "#082010",
    O: "#22c55e",
    y: "#a8ffc4",
    G: "#22c55e",
    V: "#d8ffe4",
    H: "#082010",
    S: "#d8ffe4",
    B: "#22c55e",
    Y: "#a8ffc4",
    ".": "",
  },
  {
    o: "#140008",
    W: "#ffd4ee",
    b: "#2a0033",
    O: "#ff4dae",
    y: "#ffcc00",
    G: "#ff4dae",
    V: "#ffd4ee",
    H: "#2a0033",
    S: "#ffd4ee",
    B: "#ff4dae",
    Y: "#ffcc00",
    ".": "",
  },
  {
    o: "#140008",
    W: "#d4f7ff",
    b: "#081820",
    O: "#3cdcff",
    y: "#f8f0d8",
    G: "#3cdcff",
    V: "#d4f7ff",
    H: "#081820",
    S: "#d4f7ff",
    B: "#3cdcff",
    Y: "#f8f0d8",
    ".": "",
  },
];

const TEAMMATE_KITS = [
  RIVAL_KITS[0],
  {
    o: "#140008",
    W: "#fff4c2",
    b: "#3d2200",
    O: "#ffcc00",
    y: "#fff4c2",
    G: "#ffcc00",
    V: "#fff4c2",
    H: "#3d2200",
    S: "#fff4c2",
    B: "#ffcc00",
    Y: "#fff4c2",
    ".": "",
  },
];

function groundY() {
  return H - GROUND - 16;
}

function makeCity(poi: Poi): BrickCell[] {
  const bricks: BrickCell[] = [];
  const floor = H - GROUND;
  for (const t of poi.towers) {
    const rows = Math.floor(t.h / BRICK);
    const cols = Math.floor(t.w / BRICK);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const window = r > 1 && r % 2 === 0 && c % 2 === 1;
        bricks.push({
          x: t.x + c * BRICK,
          y: floor - t.h + r * BRICK,
          color: window ? poi.accent : t.tone,
        });
      }
    }
  }
  return bricks;
}

function aabb(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function padScore(n: number) {
  return String(Math.max(0, Math.min(999999, Math.floor(n)))).padStart(6, "0");
}

function makeFighter(partial: Partial<Fighter> & Pick<Fighter, "x" | "team" | "slot" | "palette">): Fighter {
  return {
    y: groundY(),
    vx: 0,
    vy: 0,
    facing: 1,
    frame: 0,
    hp: HP_MAX,
    shield: 50,
    inv: 0,
    cool: 0,
    muzzle: 0,
    knocked: false,
    dead: false,
    revive: 0,
    bleed: 0,
    control: "bot",
    sprite: "fox",
    ...partial,
  };
}

type Snap = {
  mode: Mode;
  poiIndex: number;
  score: number;
  elims: number;
  banner: string;
  bannerLife: number;
  busX: number;
  missionIndex: number;
  missionKills: number;
  playlist: Playlist;
  squad: Fighter[];
  rivals: Fighter[];
  shots: Shot[];
  loot: Loot[];
};

export function ViperDrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pads = useRef<Pad[]>([
    { ...EMPTY_PAD },
    { ...EMPTY_PAD },
    { ...EMPTY_PAD },
  ]);
  const remotePads = useRef<Pad[]>([
    { ...EMPTY_PAD },
    { ...EMPTY_PAD },
    { ...EMPTY_PAD },
  ]);
  const netPalettes = useRef<Array<Record<string, string> | null>>([
    null,
    null,
    null,
  ]);
  const modeRef = useRef<Mode>("title");
  const scoreRef = useRef(0);
  const elimsRef = useRef(0);
  const snapRef = useRef<Snap | null>(null);
  const lobby = useRef({
    playlist: "br" as Playlist,
    squad: "solo" as SquadSize,
    fill: "bot" as Fill,
    code: "",
    role: "host" as "host" | "guest",
    seat: 0,
  });
  const channelRef = useRef<BroadcastChannel | null>(null);
  const [mode, setMode] = useState<Mode>("title");
  const [score, setScore] = useState(0);
  const [initials, setInitials] = useState("VIP");
  const [scores, setScores] = useState<HighScore[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const [xpGain, setXpGain] = useState(0);
  const [full, setFull] = useState(false);
  const [playlist, setPlaylist] = useState<Playlist>("br");
  const [squad, setSquad] = useState<SquadSize>("duo");
  const [fill, setFill] = useState<Fill>("bot");
  const [code, setCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joined, setJoined] = useState(0);
  const [role, setRole] = useState<"host" | "guest">("host");
  const [campaignNote, setCampaignNote] = useState("");
  const wantStart = useRef(false);
  const scoresRef = useRef<HighScore[]>([]);

  useEffect(() => {
    lobby.current.playlist = playlist;
    lobby.current.squad = squad;
    lobby.current.fill = fill;
    lobby.current.code = code;
    lobby.current.role = role;
  }, [playlist, squad, fill, code, role]);

  useEffect(() => {
    const ac = new AbortController();
    loadHallOfFame()
      .then((next) => {
        if (ac.signal.aborted) return;
        scoresRef.current = next;
        setScores(next);
        setError("");
      })
      .catch(() => {
        if (ac.signal.aborted) return;
        setError("HALL OF FAME OFFLINE");
      });
    return () => ac.abort();
  }, []);

  useEffect(() => {
    sfx.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const onFs = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    if (!code) {
      channelRef.current = null;
      return;
    }
    const ch = openSquadChannel(code);
    channelRef.current = ch;
    ch.onmessage = (ev: MessageEvent<NetMsg>) => {
      const msg = ev.data;
      if (!msg || typeof msg !== "object" || !("t" in msg)) return;
      if (msg.t === "join" && lobby.current.role === "host") {
        const seats = squadSeats(lobby.current.squad);
        const seat = Math.min(1 + (netPalettes.current[1] ? 1 : 0), seats - 1);
        if (seat <= 0) return;
        netPalettes.current[seat] = msg.palette;
        setJoined((n) => Math.max(n, seat));
        ch.postMessage({
          t: "welcome",
          seat,
          playlist: lobby.current.playlist,
          squad: lobby.current.squad,
        } satisfies NetMsg);
        sfx.coin();
      }
      if (msg.t === "welcome" && lobby.current.role === "guest") {
        lobby.current.seat = msg.seat;
        setPlaylist(msg.playlist);
        setSquad(msg.squad);
      }
      if (msg.t === "pads" && lobby.current.role === "host") {
        remotePads.current[msg.seat] = msg.pad;
      }
      if (msg.t === "start" && lobby.current.role === "guest") {
        wantStart.current = true;
      }
      if (msg.t === "snap" && lobby.current.role === "guest") {
        try {
          snapRef.current = JSON.parse(msg.body) as Snap;
        } catch {
          /* ignore */
        }
      }
    };
    if (lobby.current.role === "guest") {
      ch.postMessage({
        t: "join",
        name: "P2",
        sprite: equippedSkin().sprite,
        palette: equippedSkin().palette,
      } satisfies NetMsg);
    }
    return () => {
      ch.close();
      channelRef.current = null;
    };
  }, [code, role]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let tick = 0;
    let spawnRivalIn = 50;
    let shake = 0;
    let hi = 0;
    let poiIndex = 0;
    let bricks = makeCity(POIS[0]);
    let banner = "";
    let bannerLife = 0;
    let busX = -60;
    let falling = false;
    let missionIndex = 0;
    let missionKills = 0;
    let squadList: Fighter[] = [];
    let rivals: Fighter[] = [];
    let shots: Shot[] = [];
    let loot: Loot[] = [];
    let parts: Particle[] = [];

    const aliveSquad = () => squadList.filter((f) => !f.dead);
    const everyone = () => [...aliveSquad(), ...rivals.filter((r) => !r.dead)];

    const boom = (x: number, y: number, n: number, color: string) => {
      for (let i = 0; i < n; i++) {
        parts.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 2.4,
          vy: -Math.random() * 2.2,
          color,
          life: 18 + Math.random() * 16,
        });
      }
    };

    const spawnLoot = () => {
      loot = [
        { x: 40 + Math.random() * 70, y: groundY() + 8, kind: "mini" },
        { x: 150 + Math.random() * 70, y: groundY() + 8, kind: "med" },
      ];
    };

    const spawnRival = () => {
      if (rivals.length >= MAX_RIVALS) return;
      const left = Math.random() > 0.5;
      const id = 10 + rivals.length;
      rivals.push(
        makeFighter({
          x: left ? 8 : W - 24,
          team: id,
          slot: id,
          hp: 55,
          shield: 0,
          inv: 18,
          cool: 30,
          control: "bot",
          palette: RIVAL_KITS[rivals.length % RIVAL_KITS.length],
        })
      );
    };

    const buildSquad = () => {
      const skin = equippedSkin();
      const seats = squadSeats(lobby.current.squad);
      squadList = [];
      for (let i = 0; i < seats; i++) {
        const netPal = netPalettes.current[i];
        squadList.push(
          makeFighter({
            x: 36 + i * 22,
            y: 48,
            team: 0,
            slot: i,
            control: i === 0 ? "local" : "bot",
            sprite: i === 0 ? skin.sprite : "fox",
            palette: i === 0 ? skin.palette : netPal ?? TEAMMATE_KITS[(i - 1) % TEAMMATE_KITS.length],
            shield: 50,
          })
        );
      }
    };

    const reset = () => {
      poiIndex =
        lobby.current.playlist === "campaign" ? MISSIONS[0].poi : 0;
      missionIndex = 0;
      missionKills = 0;
      bricks = makeCity(POIS[poiIndex]);
      buildSquad();
      rivals = [];
      shots = [];
      parts = [];
      spawnLoot();
      tick = 0;
      spawnRivalIn = 36;
      busX = -64;
      falling = false;
      banner =
        lobby.current.playlist === "campaign"
          ? MISSIONS[0].title
          : "BATTLE BUS";
      bannerLife = 90;
      scoreRef.current = 0;
      elimsRef.current = 0;
      setScore(0);
      setXpGain(0);
      setCampaignNote(
        lobby.current.playlist === "campaign" ? MISSIONS[0].blurb : ""
      );
    };

    const endMatch = (win: boolean) => {
      if (modeRef.current === "over" || modeRef.current === "win") return;
      modeRef.current = win ? "win" : "over";
      setMode(win ? "win" : "over");
      setScore(scoreRef.current);
      const reward = grantPlayXp(
        scoreRef.current + (win ? 200 : 0),
        elimsRef.current
      );
      setXpGain(reward.gained);
      sfx.gameOver();
    };

    const hurt = (fighter: Fighter, dmg: number) => {
      if (fighter.inv > 0 || fighter.dead || fighter.knocked) return;
      let left = dmg;
      if (fighter.shield > 0) {
        const soak = Math.min(fighter.shield, left);
        fighter.shield -= soak;
        left -= soak;
      }
      fighter.hp -= left;
      fighter.inv = 22;
      shake = 5;
      boom(fighter.x + 8, fighter.y + 8, 8, fighter.palette.O);
      sfx.hit();
      if (fighter.hp > 0) return;
      fighter.hp = 0;
      fighter.shield = 0;
      const canKnock = fighter.team === 0 && squadList.length > 1;
      if (canKnock) {
        fighter.knocked = true;
        fighter.bleed = BLEED_MAX;
        fighter.revive = 0;
        sfx.knock();
      } else {
        fighter.dead = true;
        if (fighter.team === 0) {
          const living = squadList.filter((f) => !f.dead && !f.knocked);
          if (living.length === 0) endMatch(false);
        }
      }
    };

    const fire = (fighter: Fighter) => {
      if (fighter.knocked || fighter.dead) return;
      shots.push({
        x: fighter.facing > 0 ? fighter.x + 20 : fighter.x - 6,
        y: fighter.y + 10,
        vx: fighter.facing * (fighter.team === 0 ? 3.4 : 2.5),
        team: fighter.team,
        color: fighter.team === 0 ? "#ffcc00" : fighter.palette.O,
      });
      fighter.muzzle = 4;
      fighter.cool = fighter.team === 0 ? 10 : 46;
      sfx.shoot();
    };

    const changePoi = (dir: number) => {
      poiIndex = (poiIndex + dir + POIS.length) % POIS.length;
      bricks = makeCity(POIS[poiIndex]);
      rivals = [];
      shots = [];
      spawnLoot();
      spawnRival();
      spawnRivalIn = 70;
      banner = POIS[poiIndex].name;
      bannerLife = 70;
      sfx.warp();
      for (const mate of squadList) {
        if (dir > 0) mate.x = 10 + mate.slot * 16;
        else mate.x = W - 28 - mate.slot * 16;
      }
    };

    const physics = (fighter: Fighter, jump: boolean) => {
      const floor = fighter.knocked ? groundY() + 6 : groundY();
      const onGround = fighter.y >= floor - 0.4 && fighter.vy >= 0;
      if (jump && onGround && !fighter.knocked && !fighter.dead) {
        fighter.vy = JUMP_V;
        sfx.jump();
      }
      fighter.vy += GRAVITY;
      fighter.y += fighter.vy;
      if (fighter.y >= floor) {
        fighter.y = floor;
        fighter.vy = 0;
      }
    };

    const nearestFoe = (self: Fighter) => {
      let best: Fighter | null = null;
      let bestD = 9999;
      for (const other of everyone()) {
        if (other === self || other.team === self.team || other.dead) continue;
        const d = Math.abs(other.x - self.x);
        if (d < bestD) {
          bestD = d;
          best = other;
        }
      }
      return best;
    };

    const driveBot = (bot: Fighter) => {
      if (bot.knocked || bot.dead) return;
      if (bot.team === 0) {
        const down = squadList.find((f) => f.knocked && !f.dead);
        if (down) {
          bot.vx = down.x > bot.x ? 1.2 : -1.2;
          bot.facing = down.x >= bot.x ? 1 : -1;
          return;
        }
        const foe = nearestFoe(bot);
        const lead = squadList[0];
        if (foe && Math.abs(foe.x - bot.x) < 110) {
          bot.facing = foe.x >= bot.x ? 1 : -1;
          const gap = foe.x - bot.x;
          if (Math.abs(gap) < 28) bot.vx = gap > 0 ? -1 : 1;
          else bot.vx *= 0.4;
          if (bot.cool === 0 && Math.abs(gap) > 16) fire(bot);
        } else if (lead && !lead.dead) {
          const dest = lead.x - 20 * bot.slot;
          bot.vx = Math.abs(dest - bot.x) > 8 ? (dest > bot.x ? 1.1 : -1.1) : 0;
          bot.facing = lead.facing;
        }
        return;
      }
      const foe = nearestFoe(bot);
      if (!foe) return;
      const gap = bot.x - foe.x;
      if (Math.abs(gap) > 64) bot.vx = foe.x > bot.x ? 0.85 : -0.85;
      else if (Math.abs(gap) < 26) bot.vx = gap > 0 ? 1 : -1;
      else bot.vx *= 0.4;
      bot.facing = foe.x >= bot.x ? 1 : -1;
      if (bot.cool === 0 && Math.abs(gap) > 18 && Math.abs(gap) < 130) fire(bot);
    };

    const padFor = (slot: number): Pad => {
      const local = pads.current[slot];
      const remote = remotePads.current[slot];
      if (slot === 0) return local;
      if (padActive(remote)) {
        if (squadList[slot]) squadList[slot].control = "net";
        return remote;
      }
      if (padActive(local)) {
        if (squadList[slot]) squadList[slot].control = "local";
        return local;
      }
      return EMPTY_PAD;
    };

    const onKey = (e: KeyboardEvent, down: boolean) => {
      const p1 = pads.current[0];
      const p2 = pads.current[1];
      const p3 = pads.current[2];
      if (e.code === "KeyA") p1.left = down;
      if (e.code === "KeyD") p1.right = down;
      if (e.code === "KeyZ" || e.code === "KeyX") p1.fire = down;
      if (e.code === "KeyW" || e.code === "Space") p1.jump = down;
      if (e.code === "ArrowLeft") p2.left = down;
      if (e.code === "ArrowRight") p2.right = down;
      if (e.code === "ArrowUp") p2.jump = down;
      if (e.code === "KeyK" || e.code === "Period") p2.fire = down;
      if (e.code === "KeyJ") p3.left = down;
      if (e.code === "KeyL") p3.right = down;
      if (e.code === "KeyI") p3.jump = down;
      if (e.code === "KeyM") p3.fire = down;
      if (down && e.code === "Enter" && modeRef.current === "title") {
        e.preventDefault();
        wantStart.current = true;
      }
      if (
        down &&
        (e.code.startsWith("Arrow") ||
          e.code === "Space" ||
          e.code === "KeyW" ||
          e.code === "KeyA" ||
          e.code === "KeyD")
      ) {
        if (modeRef.current === "play" || modeRef.current === "bus") e.preventDefault();
      }
    };
    const down = (e: KeyboardEvent) => onKey(e, true);
    const up = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    const drawWorld = (
      poi: Poi,
      neo: boolean,
      drawSquad: Fighter[],
      drawRivals: Fighter[],
      drawShots: Shot[],
      drawLoot: Loot[],
      ox: number,
      oy: number
    ) => {
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, neo ? "#180028" : poi.skyTop);
      sky.addColorStop(1, neo ? "#4a2088" : poi.skyBot);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#f8f0d8";
      for (let i = 0; i < 18; i++) {
        const sx = (i * 73) % W;
        const sy = (i * 37) % 90;
        if ((tick + i) % 40 < 28) ctx.fillRect(sx, sy, 1, 1);
      }
      ctx.save();
      ctx.translate(ox, oy);
      if (poi.water) {
        ctx.fillStyle = "#1a6088";
        ctx.fillRect(70, H - GROUND - 18, 90, 18);
        ctx.fillStyle = "#3cdcff";
        for (let x = 74; x < 156; x += 10) {
          ctx.fillRect(x, H - GROUND - 16 + ((tick / 8 + x) % 3), 6, 1);
        }
      }
      ctx.fillStyle = poi.ground;
      ctx.fillRect(0, H - GROUND, W, GROUND);
      ctx.fillStyle = poi.dirt;
      ctx.fillRect(0, H - GROUND, W, 3);
      ctx.fillStyle = poi.accent;
      for (let x = 8; x < W; x += 16) ctx.fillRect(x, H - 12, 8, 2);
      for (const b of bricks) {
        ctx.fillStyle = neo && b.color !== poi.accent ? "#6a4a88" : b.color;
        ctx.fillRect(b.x, b.y, BRICK, BRICK);
      }
      if (poi.id === "pleasant") {
        ctx.fillStyle = "#1a4a18";
        ctx.fillRect(88, H - GROUND - 20, 6, 20);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(80, H - GROUND - 34, 22, 16);
      }
      ctx.fillStyle = "rgba(90,40,160,0.28)";
      ctx.fillRect(0, 0, 6, H);
      ctx.fillRect(W - 6, 0, 6, H);
      for (const drop of drawLoot) {
        ctx.fillStyle = drop.kind === "mini" ? "#3cdcff" : "#00e800";
        ctx.fillRect(drop.x, drop.y, 8, 8);
        ctx.fillStyle = "#140008";
        ctx.fillRect(drop.x + 2, drop.y + 2, 4, 4);
      }
      for (const p of parts) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 2, 2);
      }
      for (const shot of drawShots) {
        ctx.fillStyle = "#140008";
        ctx.fillRect(shot.x, shot.y, 6, 3);
        ctx.fillStyle = shot.color;
        ctx.fillRect(shot.x + 1, shot.y, 5, 2);
      }
      const drawF = (f: Fighter) => {
        if (f.dead) return;
        if (f.inv > 0 && Math.floor(tick / 4) % 2 === 1) return;
        drawSprite(
          ctx,
          spriteRows(f.sprite, f.frame),
          Math.floor(f.x),
          Math.floor(f.y),
          f.facing < 0,
          f.palette
        );
        if (!f.knocked) drawGun(ctx, f.x, f.y, f.facing, f.muzzle > 0);
        const bx = Math.floor(f.x);
        const by = Math.floor(f.y) - 5;
        ctx.fillStyle = "#140008";
        ctx.fillRect(bx, by, 16, 3);
        ctx.fillStyle = "#3cdcff";
        ctx.fillRect(bx, by, Math.round(16 * (f.shield / SHIELD_MAX)), 1);
        ctx.fillStyle = f.knocked ? "#ffcc00" : "#00e800";
        ctx.fillRect(bx, by + 2, Math.round(16 * (f.hp / HP_MAX)), 1);
        if (f.knocked && f.revive > 0) {
          ctx.fillStyle = "#ffcc00";
          ctx.fillRect(bx, by - 3, Math.round(16 * (f.revive / REVIVE_NEED)), 2);
        }
      };
      for (const rival of drawRivals) drawF(rival);
      for (const mate of drawSquad) drawF(mate);
    };

    const paintHud = (
      poi: Poi,
      hero: Fighter | undefined,
      missionTitle: string
    ) => {
      ctx.fillStyle = "#00e800";
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textBaseline = "top";
      ctx.fillText(`SCORE ${padScore(scoreRef.current)}`, 8, 8);
      hi = Math.max(hi, scoreRef.current, scoresRef.current[0]?.score ?? 0);
      ctx.fillText(`HI ${padScore(hi)}`, 152, 8);
      if (hero) {
        ctx.fillStyle = "#140008";
        ctx.fillRect(8, 20, 74, 10);
        ctx.fillStyle = "#3cdcff";
        ctx.fillRect(8, 20, Math.round(74 * (hero.shield / SHIELD_MAX)), 4);
        ctx.fillStyle = hero.knocked ? "#ffcc00" : "#00e800";
        ctx.fillRect(8, 25, Math.round(74 * (hero.hp / HP_MAX)), 5);
        ctx.fillStyle = "#f8f0d8";
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText("SHD", 86, 19);
      }
      ctx.fillStyle = poi.accent;
      ctx.fillText(poi.tag, 152, 20);
      if (missionTitle) {
        ctx.fillStyle = "#ffcc00";
        ctx.fillText(missionTitle.slice(0, 14), 8, 34);
      }
    };

    const loop = () => {
      if (!running) return;
      ctx.imageSmoothingEnabled = false;
      const isGuest = lobby.current.role === "guest";

      if (isGuest) {
        const ch = channelRef.current;
        if (ch) {
          ch.postMessage({
            t: "pads",
            seat: lobby.current.seat || 1,
            pad: pads.current[0],
          } satisfies NetMsg);
        }
        const snap = snapRef.current;
        ctx.fillStyle = "#05000a";
        ctx.fillRect(0, 0, W, H);
        if (!snap) {
          ctx.fillStyle = "#ffcc00";
          ctx.font = '8px "Press Start 2P", monospace';
          ctx.fillText("WAITING HOST", 68, 100);
        } else {
          modeRef.current = snap.mode;
          scoreRef.current = snap.score;
          bricks = makeCity(POIS[snap.poiIndex]);
          const neo = Boolean(MISSIONS[snap.missionIndex]?.neo);
          drawWorld(
            POIS[snap.poiIndex],
            neo,
            snap.squad,
            snap.rivals,
            snap.shots,
            snap.loot,
            0,
            0
          );
          if (snap.mode === "bus") {
            drawBattleBus(ctx, Math.floor(snap.busX), 28);
          }
          ctx.restore();
          paintHud(
            POIS[snap.poiIndex],
            snap.squad[lobby.current.seat] ?? snap.squad[0],
            snap.playlist === "campaign"
              ? MISSIONS[snap.missionIndex]?.season ?? ""
              : ""
          );
          if (snap.bannerLife > 0) {
            ctx.fillStyle = "rgba(10,0,20,0.55)";
            ctx.fillRect(28, 88, 200, 28);
            ctx.fillStyle = "#ffcc00";
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText(snap.banner.slice(0, 18), 40, 98);
          }
          if (snap.mode === "over" || snap.mode === "win") {
            setMode(snap.mode);
          }
        }
        tick += 1;
        raf = requestAnimationFrame(loop);
        return;
      }

      const poi = POIS[poiIndex];
      const neo = Boolean(
        lobby.current.playlist === "campaign" && MISSIONS[missionIndex]?.neo
      );
      const ox = shake ? (Math.random() - 0.5) * shake : 0;
      const oy = shake ? (Math.random() - 0.5) * shake : 0;
      if (shake > 0) shake *= 0.85;

      if (wantStart.current) {
        wantStart.current = false;
        reset();
        modeRef.current = "bus";
        setMode("bus");
        sfx.bus();
        channelRef.current?.postMessage({ t: "start" } satisfies NetMsg);
      }

      if (modeRef.current === "bus") {
        tick += 1;
        busX += 1.45;
        const hero = squadList[0];
        if (hero && !falling) {
          for (const mate of squadList) {
            mate.x = busX + 10 + mate.slot * 12;
            mate.y = 42;
          }
          const p = padFor(0);
          if (busX > 108 || (busX > 64 && p.jump)) {
            falling = true;
            for (const mate of squadList) mate.vy = 0.4;
            sfx.drop();
            banner = "SKYDIVING";
            bannerLife = 50;
          }
        } else {
          for (const mate of squadList) {
            const p = padFor(mate.slot);
            if (mate.control !== "bot" || padActive(p)) {
              if (p.left) mate.vx = -1.6;
              else if (p.right) mate.vx = 1.6;
              else mate.vx *= 0.7;
            }
            mate.x += mate.vx;
            mate.vy += 0.18;
            mate.y += mate.vy;
            if (mate.y >= groundY()) {
              mate.y = groundY();
              mate.vy = 0;
            }
          }
          if (squadList.every((m) => m.y >= groundY() - 0.2)) {
            modeRef.current = "play";
            setMode("play");
            banner =
              lobby.current.playlist === "campaign"
                ? MISSIONS[missionIndex].title
                : POIS[poiIndex].name;
            bannerLife = 80;
            sfx.start();
            spawnRival();
            spawnRival();
          }
        }
      }

      if (modeRef.current === "play") {
        tick += 1;
        if (tick % 5 === 0) {
          scoreRef.current += 1;
          if (tick % 15 === 0) setScore(scoreRef.current);
        }
        spawnRivalIn -= 1;
        if (spawnRivalIn <= 0) {
          spawnRival();
          spawnRivalIn = Math.max(110, 180 - Math.floor(scoreRef.current / 100));
        }

        for (const mate of squadList) {
          if (mate.dead) continue;
          if (mate.inv > 0) mate.inv -= 1;
          if (mate.cool > 0) mate.cool -= 1;
          if (mate.muzzle > 0) mate.muzzle -= 1;
          const p = padFor(mate.slot);
          const human = mate.slot === 0 || padActive(p) || mate.control !== "bot";
          if (mate.knocked) {
            mate.bleed -= 1;
            mate.vx = p.left ? -0.4 : p.right ? 0.4 : 0;
            mate.x += mate.vx;
            physics(mate, false);
            if (mate.bleed <= 0) {
              mate.dead = true;
              mate.knocked = false;
            }
            continue;
          }
          if (human) {
            if (p.left) mate.vx = -1.8;
            else if (p.right) mate.vx = 1.8;
            else mate.vx *= 0.6;
            if (p.fire && mate.cool === 0) fire(mate);
            physics(mate, p.jump);
          } else {
            driveBot(mate);
            physics(mate, false);
          }
          mate.x += mate.vx;
          if (mate.vx > 0.2) mate.facing = 1;
          if (mate.vx < -0.2) mate.facing = -1;
          if (Math.abs(mate.vx) > 0.4 && tick % 6 === 0) mate.frame ^= 1;
        }

        const hero = squadList[0];
        if (hero && !hero.dead) {
          if (hero.x > W - 6) changePoi(1);
          else if (hero.x < -4) changePoi(-1);
        }

        for (const down of squadList) {
          if (!down.knocked || down.dead) continue;
          const helper = squadList.some(
            (mate) =>
              mate !== down &&
              !mate.dead &&
              !mate.knocked &&
              aabb(mate.x, mate.y, 16, 16, down.x, down.y, 16, 16)
          );
          if (helper) {
            down.revive += 1;
            if (down.revive >= REVIVE_NEED) {
              down.knocked = false;
              down.hp = 40;
              down.shield = 0;
              down.revive = 0;
              down.bleed = 0;
              down.inv = 40;
              down.y = groundY();
              sfx.revive();
              banner = "REVIVED";
              bannerLife = 50;
            }
          } else {
            down.revive = Math.max(0, down.revive - 2);
          }
        }

        for (const drop of [...loot]) {
          for (const mate of squadList) {
            if (mate.dead || mate.knocked) continue;
            if (aabb(mate.x, mate.y, 16, 16, drop.x, drop.y, 8, 8)) {
              if (drop.kind === "mini") {
                mate.shield = Math.min(SHIELD_MAX, mate.shield + 50);
              } else {
                mate.hp = Math.min(HP_MAX, mate.hp + 50);
              }
              loot = loot.filter((d) => d !== drop);
              sfx.pickup();
            }
          }
        }

        for (let i = rivals.length - 1; i >= 0; i--) {
          const rival = rivals[i];
          if (rival.dead || rival.hp <= 0) {
            boom(rival.x + 8, rival.y + 8, 12, rival.palette.O);
            rivals.splice(i, 1);
            scoreRef.current += 80;
            elimsRef.current += 1;
            missionKills += 1;
            continue;
          }
          if (rival.inv > 0) rival.inv -= 1;
          if (rival.cool > 0) rival.cool -= 1;
          if (rival.muzzle > 0) rival.muzzle -= 1;
          driveBot(rival);
          rival.x = Math.max(2, Math.min(W - 18, rival.x + rival.vx));
          if (Math.abs(rival.vx) > 0.3 && tick % 6 === 0) rival.frame ^= 1;
          rival.y = groundY();
        }

        for (let i = shots.length - 1; i >= 0; i--) {
          const shot = shots[i];
          shot.x += shot.vx;
          if (shot.x < -8 || shot.x > W + 8) {
            shots.splice(i, 1);
            continue;
          }
          let spent = false;
          for (const target of everyone()) {
            if (target.team === shot.team || target.dead) continue;
            const bodyH = target.knocked ? 8 : 14;
            if (
              aabb(shot.x, shot.y, 5, 2, target.x + 2, target.y + 2, 12, bodyH)
            ) {
              hurt(target, SHOT_DMG);
              spent = true;
              if (shot.team === 0) {
                scoreRef.current += 20;
                sfx.ko();
              }
              break;
            }
          }
          if (spent) shots.splice(i, 1);
        }

        if (
          lobby.current.playlist === "campaign" &&
          missionKills >= MISSIONS[missionIndex].kills
        ) {
          const beaten = MISSIONS[missionIndex];
          beatCampaignMission(missionIndex, beaten.unlock);
          if (beaten.unlock) {
            setCampaignNote(`UNLOCKED ${beaten.unlock.toUpperCase()}`);
          }
          if (missionIndex >= MISSIONS.length - 1) {
            endMatch(true);
          } else {
            missionIndex += 1;
            missionKills = 0;
            const next = MISSIONS[missionIndex];
            poiIndex = next.poi;
            bricks = makeCity(POIS[poiIndex]);
            rivals = [];
            shots = [];
            spawnLoot();
            spawnRival();
            banner = next.title;
            bannerLife = 90;
            setCampaignNote(next.blurb);
            for (const mate of squadList) {
              if (!mate.dead && !mate.knocked) {
                mate.hp = Math.min(HP_MAX, mate.hp + 40);
                mate.shield = Math.min(SHIELD_MAX, mate.shield + 25);
              }
            }
            sfx.xp();
          }
        }

        const standing = squadList.filter((f) => !f.dead && !f.knocked);
        const allDown = squadList.every((f) => f.dead || f.knocked);
        if (allDown && standing.length === 0) {
          const anyBleed = squadList.some((f) => f.knocked && !f.dead);
          if (!anyBleed) endMatch(false);
          if (squadList.every((f) => f.dead)) endMatch(false);
        }
      }

      drawWorld(poi, neo, squadList, rivals, shots, loot, ox, oy);
      if (modeRef.current === "bus" || modeRef.current === "title") {
        drawBattleBus(
          ctx,
          modeRef.current === "title" ? 96 + Math.sin(tick / 24) * 8 : Math.floor(busX),
          28
        );
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life -= 1;
        if (p.life <= 0) parts.splice(i, 1);
      }
      ctx.restore();

      paintHud(
        poi,
        squadList[0],
        lobby.current.playlist === "campaign"
          ? MISSIONS[missionIndex]?.season ?? ""
          : ""
      );
      if (bannerLife > 0) {
        bannerLife -= 1;
        ctx.fillStyle = "rgba(10,0,20,0.55)";
        ctx.fillRect(20, 86, 216, 32);
        ctx.fillStyle = "#ffcc00";
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(banner.slice(0, 20), 28, 98);
      }

      if (modeRef.current === "title") {
        ctx.fillStyle = "rgba(10,0,20,0.55)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#00e800";
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText("VIPER DROP", 72, 58);
        ctx.fillStyle = "#ffcc00";
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText("SQUADS. SHIELDS.", 56, 88);
        ctx.fillText("REVIVE. CAMPAIGN.", 52, 104);
        if (Math.floor(tick / 30) % 2 === 0) {
          ctx.fillStyle = "#ff6a00";
          ctx.fillText("PRESS ENTER", 76, 150);
        }
      }
      if (modeRef.current === "over" || modeRef.current === "win") {
        ctx.fillStyle = "rgba(10,0,20,0.72)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = modeRef.current === "win" ? "#ffcc00" : "#e02020";
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText(
          modeRef.current === "win" ? "VICTORY ROYALE" : "ELIMINATED",
          modeRef.current === "win" ? 48 : 72,
          70
        );
        ctx.fillStyle = "#ffcc00";
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(`SCORE ${padScore(scoreRef.current)}`, 72, 100);
        ctx.fillStyle = "#00e800";
        ctx.fillText(`ELIMS ${elimsRef.current}`, 88, 118);
      }

      if (
        lobby.current.role === "host" &&
        channelRef.current &&
        tick % 2 === 0 &&
        modeRef.current !== "title"
      ) {
        const snap: Snap = {
          mode: modeRef.current,
          poiIndex,
          score: scoreRef.current,
          elims: elimsRef.current,
          banner,
          bannerLife,
          busX,
          missionIndex,
          missionKills,
          playlist: lobby.current.playlist,
          squad: squadList,
          rivals,
          shots,
          loot,
        };
        channelRef.current.postMessage({
          t: "snap",
          body: JSON.stringify(snap),
        } satisfies NetMsg);
      }

      tick += modeRef.current === "title" ? 1 : 0;
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const hold = (dir: keyof Pad, on: boolean) => {
    pads.current[0][dir] = on;
  };

  const hostRoom = () => {
    const next = makeInviteCode();
    setCode(next);
    setFill("invite");
    setRole("host");
    setJoined(0);
    lobby.current.code = next;
    lobby.current.fill = "invite";
    lobby.current.role = "host";
    sfx.coin();
  };

  const joinRoom = () => {
    const next = joinCode.trim().toUpperCase();
    if (next.length < 4) {
      setSaveMsg("NEED 4-LETTER CODE");
      return;
    }
    setCode(next);
    setRole("guest");
    setFill("invite");
    lobby.current.code = next;
    lobby.current.role = "guest";
    lobby.current.seat = 1;
    sfx.select();
  };

  const startRun = () => {
    setSaveMsg("");
    setInitials("VIP");
    wantStart.current = true;
    sfx.coin();
  };

  const toggleStageFull = async () => {
    const node = stageRef.current;
    if (!node) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await node.requestFullscreen();
      sfx.select();
    } catch {
      setSaveMsg("FULLSCREEN BLOCKED");
    }
  };

  const submitScore = async () => {
    const letters = initials.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
    if (letters.length !== 3) {
      setSaveMsg("NEED 3 LETTERS");
      return;
    }
    setSaving(true);
    setSaveMsg("");
    try {
      const next = await saveHallOfFame(letters, score);
      scoresRef.current = next;
      setScores(next);
      setSaveMsg("NAME ENTERED");
      sfx.coin();
    } catch {
      setSaveMsg("SAVE FAILED");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="game" className="section-wrap py-16 sm:py-20">
      <PixelPanel title="8-BIT CART  •  VIPER DROP" tone="orange">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div>
            <div
              ref={stageRef}
              className="game-stage pixel-bevel bg-[#05000a] p-2 sm:p-3"
            >
              <canvas
                ref={canvasRef}
                width={W}
                height={H}
                className="pixelated mx-auto block h-auto w-full max-w-[768px] bg-black"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 sm:hidden">
              <Button
                variant="arcade"
                className="h-16 text-[10px]"
                onPointerDown={() => hold("left", true)}
                onPointerUp={() => hold("left", false)}
                onPointerLeave={() => hold("left", false)}
              >
                ◀
              </Button>
              <Button
                variant="arcade"
                className="h-16 text-[10px]"
                onPointerDown={() => hold("jump", true)}
                onPointerUp={() => hold("jump", false)}
                onPointerLeave={() => hold("jump", false)}
              >
                JUMP
              </Button>
              <Button
                variant="pixel"
                className="h-16 text-[10px]"
                onPointerDown={() => hold("fire", true)}
                onPointerUp={() => hold("fire", false)}
                onPointerLeave={() => hold("fire", false)}
              >
                FIRE
              </Button>
              <Button
                variant="arcade"
                className="h-16 text-[10px]"
                onPointerDown={() => hold("right", true)}
                onPointerUp={() => hold("right", false)}
                onPointerLeave={() => hold("right", false)}
              >
                ▶
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="pixel" className="h-11 px-4" onClick={startRun}>
                {mode === "over" || mode === "win" ? "DROP IN AGAIN" : "DROP IN"}
              </Button>
              <Button
                variant="arcade"
                className="h-11 px-3"
                onClick={() => void toggleStageFull()}
              >
                {full ? "EXIT FULL" : "FULLSCREEN"}
              </Button>
              <Button
                variant="arcade"
                className="h-11 px-3"
                onClick={() => {
                  setMuted((m) => !m);
                  sfx.select();
                }}
              >
                {muted ? "SFX OFF" : "SFX ON"}
              </Button>
              <p className="font-vt text-lg text-[#c9a0ff]">
                P1 A/D W Z. P2 arrows + K. P3 J/L I M. Stand on a knocked
                teammate for 5s to revive. Blue loot is shield, green is health.
              </p>
            </div>

            {mode === "over" || mode === "win" ? (
              <div className="dialog-box mt-4 p-4">
                <p
                  className={`font-press mb-3 text-[10px] ${
                    mode === "win" ? "text-[#ffcc00]" : "text-[#e02020]"
                  }`}
                >
                  {mode === "win" ? "VICTORY ROYALE" : "ELIMINATED"}
                </p>
                <p className="font-vt mb-3 text-xl">
                  {xpGain > 0
                    ? `+${xpGain} Battle Pass XP banked. Enter 3 initials.`
                    : "Enter 3 initials like a 1985 arcade cabinet."}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    value={initials}
                    maxLength={3}
                    onChange={(e) =>
                      setInitials(
                        e.target.value.toUpperCase().replace(/[^A-Z]/g, "")
                      )
                    }
                    className="font-press h-12 w-28 rounded-none border-4 border-[#f8f0d8] bg-[#001a00] text-center text-xl tracking-[0.4em] text-[#00e800]"
                    aria-label="Arcade initials"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void submitScore();
                    }}
                  />
                  <Button
                    variant="pixel"
                    className="h-12 px-4"
                    disabled={saving}
                    onClick={() => void submitScore()}
                  >
                    {saving ? "SAVING..." : "SAVE SCORE"}
                  </Button>
                </div>
                {saveMsg ? (
                  <p className="font-press mt-3 text-[10px] text-[#ffcc00]">
                    {saveMsg}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <PixelIcon name="game" />
              <h3 className="font-press text-[10px] text-[#ffcc00] sm:text-xs">
                LOBBY
              </h3>
            </div>
            <div className="pixel-bevel bg-[#05000a] p-3">
              <p className="font-press mb-2 text-[8px] text-[#3cdcff]">PLAYLIST</p>
              <div className="mb-3 flex gap-2">
                {(["br", "campaign"] as const).map((id) => (
                  <Button
                    key={id}
                    variant={playlist === id ? "pixel" : "arcade"}
                    className="h-9 flex-1 px-2 text-[8px]"
                    onClick={() => {
                      setPlaylist(id);
                      sfx.select();
                    }}
                  >
                    {id === "br" ? "BATTLE ROYALE" : "CHAPTER 1"}
                  </Button>
                ))}
              </div>
              <p className="font-press mb-2 text-[8px] text-[#3cdcff]">SQUAD</p>
              <div className="mb-3 flex gap-2">
                {(["solo", "duo", "trio"] as const).map((id) => (
                  <Button
                    key={id}
                    variant={squad === id ? "pixel" : "arcade"}
                    className="h-9 flex-1 px-2 text-[8px]"
                    onClick={() => {
                      setSquad(id);
                      sfx.select();
                    }}
                  >
                    {id.toUpperCase()}
                  </Button>
                ))}
              </div>
              <p className="font-press mb-2 text-[8px] text-[#3cdcff]">FILL</p>
              <div className="mb-3 flex gap-2">
                {(["bot", "invite"] as const).map((id) => (
                  <Button
                    key={id}
                    variant={fill === id ? "pixel" : "arcade"}
                    className="h-9 flex-1 px-2 text-[8px]"
                    onClick={() => {
                      setFill(id);
                      sfx.select();
                    }}
                  >
                    {id === "bot" ? "BOTS" : "INVITE"}
                  </Button>
                ))}
              </div>
              {fill === "invite" ? (
                <div className="space-y-2">
                  <Button variant="pixel" className="h-10 w-full text-[9px]" onClick={hostRoom}>
                    {code ? `CODE ${code}` : "MAKE INVITE CODE"}
                  </Button>
                  <div className="flex gap-2">
                    <Input
                      value={joinCode}
                      maxLength={4}
                      placeholder="CODE"
                      onChange={(e) =>
                        setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                      }
                      className="font-press h-10 rounded-none border-4 border-[#f8f0d8] bg-[#001a00] text-center tracking-[0.3em] text-[#00e800]"
                    />
                    <Button variant="arcade" className="h-10 px-3" onClick={joinRoom}>
                      JOIN
                    </Button>
                  </div>
                  <p className="font-vt text-base text-[#c9a0ff]">
                    Open another tab on this PC, enter the code, JOIN, then the
                    host DROPS IN. Same-keyboard: P2 uses arrows.
                    {joined > 0 ? ` · P${joined + 1} LINKED` : ""}
                    {role === "guest" ? " · YOU ARE GUEST" : ""}
                  </p>
                </div>
              ) : (
                <p className="font-vt text-base text-[#c9a0ff]">
                  Duo or trio fills empty seats with squad bots. They shoot
                  enemies, revive you, and let rival bots fight each other.
                </p>
              )}
              {playlist === "campaign" ? (
                <p className="font-vt mt-3 text-base text-[#ffcc00]">
                  Chapter 1: eight drops. Jonesy unlocks at Tilted. Peely
                  unlocks at The Cube.
                  {campaignNote ? ` · ${campaignNote}` : ""}
                </p>
              ) : null}
            </div>

            <div className="mt-4 mb-3 flex items-center gap-2">
              <h3 className="font-press text-[10px] text-[#ffcc00] sm:text-xs">
                TOP DROPPERS
              </h3>
            </div>
            <ol className="pixel-bevel bg-[#05000a] p-3">
              {error ? (
                <li className="font-press py-6 text-center text-[10px] text-[#e02020]">
                  {error}
                </li>
              ) : null}
              {!error && scores.length === 0 ? (
                <li className="font-vt py-6 text-center text-xl text-[#c9a0ff]">
                  No scores yet. Ride the bus.
                </li>
              ) : null}
              {scores.map((row, i) => (
                <li
                  key={row.id}
                  className={cn(
                    "font-press flex items-center justify-between gap-3 px-2 py-2 text-[10px] sm:text-xs",
                    i === 0 ? "bg-[#3d1466] text-[#ffcc00]" : "text-[#00e800]"
                  )}
                >
                  <span className="text-[#f8f0d8]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{row.initials}</span>
                  <span className="hud-digits">{padScore(row.score)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </PixelPanel>
    </section>
  );
}
