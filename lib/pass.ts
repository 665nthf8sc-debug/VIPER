"use client";

import type { SpriteKind } from "@/lib/sprites";

export type SkinId =
  | "fox"
  | "steel"
  | "gold"
  | "neon"
  | "storm"
  | "chief"
  | "pro"
  | "mythic"
  | "jonesy"
  | "peely";

export type Skin = {
  id: SkinId;
  name: string;
  blurb: string;
  xp: number;
  campaign?: boolean;
  sprite: SpriteKind;
  palette: Record<string, string>;
};

const INK = "#140008";

const FOX_BASE = {
  o: INK,
  H: "#3a2210",
  S: "#f8f0d8",
  B: "#3d7cff",
  Y: "#ffcc00",
  ".": "",
};

export const SKINS: Skin[] = [
  {
    id: "fox",
    name: "DEFAULT FOX",
    blurb: "The VIPER starter kit. Orange fur, no excuses.",
    xp: 0,
    sprite: "fox",
    palette: {
      ...FOX_BASE,
      W: "#f8f0d8",
      b: "#1a0033",
      O: "#ff6a00",
      y: "#ffcc00",
      G: "#ff6a00",
      V: "#f8f0d8",
    },
  },
  {
    id: "steel",
    name: "BLUE STEEL",
    blurb: "Cold drop. Clean shots.",
    xp: 100,
    sprite: "fox",
    palette: {
      ...FOX_BASE,
      W: "#d0e4ff",
      b: "#081428",
      O: "#3d7cff",
      y: "#9ad4ff",
      G: "#3d7cff",
      V: "#d0e4ff",
    },
  },
  {
    id: "gold",
    name: "GOLD DROP",
    blurb: "Look expensive. Play mean.",
    xp: 200,
    sprite: "fox",
    palette: {
      ...FOX_BASE,
      W: "#fff4c2",
      b: "#3d2200",
      O: "#ffcc00",
      y: "#fff4c2",
      G: "#ffcc00",
      V: "#fff4c2",
    },
  },
  {
    id: "neon",
    name: "NEON FANG",
    blurb: "Night-club viper. Impossible to miss.",
    xp: 300,
    sprite: "fox",
    palette: {
      ...FOX_BASE,
      W: "#ffd4ee",
      b: "#2a0033",
      O: "#ff4dae",
      y: "#ffcc00",
      G: "#ff4dae",
      V: "#ffd4ee",
    },
  },
  {
    id: "storm",
    name: "STORM OPS",
    blurb: "Circle closing. You are the weather.",
    xp: 400,
    sprite: "fox",
    palette: {
      ...FOX_BASE,
      W: "#d4f7ff",
      b: "#081820",
      O: "#3cdcff",
      y: "#f8f0d8",
      G: "#3cdcff",
      V: "#d4f7ff",
    },
  },
  {
    id: "chief",
    name: "CHIEF MK.VI",
    blurb: "Mjolnir green. Gold visor. Finish the fight.",
    xp: 500,
    sprite: "chief",
    palette: {
      ...FOX_BASE,
      W: "#c9d46a",
      b: "#1a2410",
      O: "#556b2f",
      y: "#d4af37",
      G: "#6b8f3c",
      V: "#ffcc00",
    },
  },
  {
    id: "pro",
    name: "8-BIT PRO",
    blurb: "Tournament block. Pure NES green.",
    xp: 650,
    sprite: "fox",
    palette: {
      ...FOX_BASE,
      W: "#e8ffe8",
      b: "#003300",
      O: "#00e800",
      y: "#ffcc00",
      G: "#00e800",
      V: "#e8ffe8",
    },
  },
  {
    id: "mythic",
    name: "MYTHIC VIPER",
    blurb: "The last page of the pass. Gold fangs.",
    xp: 850,
    sprite: "fox",
    palette: {
      ...FOX_BASE,
      W: "#fff4c2",
      b: "#2a0800",
      O: "#ff6a00",
      y: "#ffcc00",
      G: "#ffcc00",
      V: "#fff4c2",
    },
  },
  {
    id: "jonesy",
    name: "JONESY",
    blurb: "Chapter 1 default. Unlocked in Campaign at Tilted.",
    xp: 9999,
    campaign: true,
    sprite: "jonesy",
    palette: {
      o: INK,
      H: "#5a3210",
      S: "#e8b888",
      b: "#1a0033",
      B: "#3d7cff",
      W: "#e8b888",
      O: "#3d7cff",
      y: "#ffcc00",
      G: "#3d7cff",
      V: "#e8b888",
      Y: "#e8b888",
      ".": "",
    },
  },
  {
    id: "peely",
    name: "PEELY",
    blurb: "Banana. Campaign exclusive after The Cube.",
    xp: 9999,
    campaign: true,
    sprite: "peely",
    palette: {
      o: INK,
      Y: "#ffe14a",
      b: "#1a0033",
      W: "#ffe14a",
      O: "#f0c020",
      y: "#fff4c2",
      G: "#c4a010",
      V: "#fff4c2",
      H: "#6a4a10",
      S: "#ffe14a",
      B: "#f0c020",
      ".": "",
    },
  },
];

export const PASS_EVENT = "viper-pass";
const KEY = "viper-pass-v1";

export type PassState = {
  xp: number;
  equipped: SkinId;
  watched: string[];
  unlocked: SkinId[];
  campaignStage: number;
};

const FALLBACK: PassState = {
  xp: 0,
  equipped: "fox",
  watched: [],
  unlocked: [],
  campaignStage: 0,
};

function isSkinId(value: string): value is SkinId {
  return SKINS.some((skin) => skin.id === value);
}

export function loadPass(): PassState {
  if (typeof window === "undefined") return FALLBACK;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...FALLBACK };
    const parsed = JSON.parse(raw) as Partial<PassState>;
    const unlocked = Array.isArray(parsed.unlocked)
      ? parsed.unlocked.filter((id): id is SkinId => typeof id === "string" && isSkinId(id))
      : [];
    return {
      xp: Math.max(0, Number(parsed.xp) || 0),
      equipped:
        parsed.equipped && isSkinId(parsed.equipped) ? parsed.equipped : "fox",
      watched: Array.isArray(parsed.watched)
        ? parsed.watched.filter((id) => typeof id === "string")
        : [],
      unlocked,
      campaignStage: Math.max(0, Number(parsed.campaignStage) || 0),
    };
  } catch {
    return { ...FALLBACK };
  }
}

function persist(state: PassState) {
  window.localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(PASS_EVENT));
}

export function skinById(id: SkinId) {
  return SKINS.find((skin) => skin.id === id) ?? SKINS[0];
}

export function equippedSkin() {
  return skinById(loadPass().equipped);
}

export function isUnlocked(skin: Skin, pass: PassState) {
  if (skin.campaign) return pass.unlocked.includes(skin.id);
  return pass.xp >= skin.xp;
}

export function nextSkin(pass: PassState) {
  return SKINS.find((skin) => !skin.campaign && skin.xp > pass.xp) ?? null;
}

export function grantWatchXp(videoId: string) {
  const state = loadPass();
  if (state.watched.includes(videoId)) {
    return { gained: 0, total: state.xp, already: true as const };
  }
  state.watched = [...state.watched, videoId];
  state.xp += 50;
  persist(state);
  return { gained: 50, total: state.xp, already: false as const };
}

export function grantPlayXp(score: number, elims: number) {
  const state = loadPass();
  const gained = Math.max(12, Math.floor(score / 8) + elims * 30);
  state.xp += gained;
  persist(state);
  return { gained, total: state.xp };
}

export function beatCampaignMission(index: number, unlock?: SkinId) {
  const state = loadPass();
  state.campaignStage = Math.max(state.campaignStage, index + 1);
  state.xp += 80;
  if (unlock && !state.unlocked.includes(unlock)) {
    state.unlocked = [...state.unlocked, unlock];
  }
  persist(state);
  return { unlocked: unlock, xp: state.xp };
}

export function equipSkin(id: SkinId) {
  const state = loadPass();
  const skin = skinById(id);
  if (!isUnlocked(skin, state)) return false;
  state.equipped = id;
  persist(state);
  return true;
}

export function maxPassXp() {
  return SKINS.filter((s) => !s.campaign).at(-1)?.xp ?? 850;
}
