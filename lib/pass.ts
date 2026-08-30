"use client";

import type { EmoteId, SidekickId, SpriteKind } from "@/lib/sprites";

export type SkinId =
  | "fox"
  | "steel"
  | "gold"
  | "neon"
  | "storm"
  | "badkit"
  | "kit"
  | "sonic"
  | "phantom"
  | "chief"
  | "pro"
  | "mythic"
  | "jonesy"
  | "peely"
  | "viper"
  | "sub";

export type SkinTrack = "pass" | "campaign" | "achieve" | "subscribe";

export type Skin = {
  id: SkinId;
  name: string;
  blurb: string;
  xp: number;
  track: SkinTrack;
  sprite: SpriteKind;
  palette: Record<string, string>;
};

export type FindId =
  | "wrap-storm"
  | "spray-viper"
  | "pick-gold"
  | "collar"
  | "treat"
  | "meteor-shard"
  | "secret-note"
  | "exotic-drum";

export type AchievementId =
  | "first-drop"
  | "first-elim"
  | "first-win"
  | "elim-10"
  | "win-3"
  | "like-3"
  | "find-collar"
  | "find-treat"
  | "meteor-core"
  | "tilted-secret";

export type EmoteDef = {
  id: EmoteId;
  name: string;
  blurb: string;
};

export type SidekickDef = {
  id: SidekickId;
  name: string;
  blurb: string;
};

export type FindDef = {
  id: FindId;
  name: string;
  blurb: string;
};

export type AchievementDef = {
  id: AchievementId;
  name: string;
  blurb: string;
  reward: string;
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
    track: "pass",
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
    xp: 250,
    track: "pass",
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
    xp: 600,
    track: "pass",
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
    xp: 1100,
    track: "pass",
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
    xp: 1800,
    track: "pass",
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
    id: "badkit",
    name: "BAD KIT",
    blurb: "The mean twin. Red pack. Worse attitude.",
    xp: 2700,
    track: "pass",
    sprite: "badkit",
    palette: {
      ...FOX_BASE,
      W: "#f8d0c8",
      b: "#3a0008",
      O: "#c42020",
      y: "#ffcc00",
      G: "#8a1010",
      V: "#f8d0c8",
      H: "#4a1010",
    },
  },
  {
    id: "kit",
    name: "KIT",
    blurb: "Backpack fox. Ready for the island.",
    xp: 3800,
    track: "pass",
    sprite: "kit",
    palette: {
      ...FOX_BASE,
      W: "#f8f0d8",
      b: "#1a0033",
      O: "#e07020",
      y: "#ffcc00",
      G: "#e07020",
      V: "#f8f0d8",
      H: "#6a3a18",
    },
  },
  {
    id: "sonic",
    name: "SONIC",
    blurb: "Blue blur. Gotta drop fast.",
    xp: 5200,
    track: "pass",
    sprite: "sonic",
    palette: {
      ...FOX_BASE,
      W: "#f8f0d8",
      b: "#081028",
      O: "#2a6dff",
      y: "#ffcc00",
      G: "#2a6dff",
      V: "#f8f0d8",
      B: "#2a6dff",
    },
  },
  {
    id: "phantom",
    name: "PHANTOM",
    blurb: "Ghost in the storm. White visor, no footsteps.",
    xp: 7000,
    track: "pass",
    sprite: "phantom",
    palette: {
      ...FOX_BASE,
      W: "#e8e0ff",
      b: "#100818",
      O: "#3a2458",
      y: "#f8f0d8",
      G: "#241830",
      V: "#f4f0ff",
    },
  },
  {
    id: "chief",
    name: "CHIEF MK.VI",
    blurb: "Mjolnir green. Gold visor. Finish the fight.",
    xp: 9000,
    track: "pass",
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
    xp: 11500,
    track: "pass",
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
    xp: 15000,
    track: "pass",
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
    xp: 99999,
    track: "campaign",
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
    xp: 99999,
    track: "campaign",
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
  {
    id: "viper",
    name: "VIPER",
    blurb: "The signature hood. Win 3 matches to pull it.",
    xp: 99999,
    track: "achieve",
    sprite: "viper",
    palette: {
      ...FOX_BASE,
      W: "#f8f0d8",
      b: "#140008",
      O: "#ff6a00",
      y: "#00e800",
      G: "#00e800",
      V: "#00e800",
    },
  },
  {
    id: "sub",
    name: "CHANNEL 3384",
    blurb: "Subscriber exclusive. Hit Subscribe, then claim it.",
    xp: 99999,
    track: "subscribe",
    sprite: "fox",
    palette: {
      ...FOX_BASE,
      W: "#ffe0e0",
      b: "#280008",
      O: "#e02020",
      y: "#f8f0d8",
      G: "#e02020",
      V: "#ffe0e0",
    },
  },
];

export const EMOTES: EmoteDef[] = [
  { id: "wave", name: "WAVE", blurb: "Default lobby hello." },
  { id: "floss", name: "FLOSS", blurb: "Win a VIPER DROP to unlock." },
  { id: "griddy", name: "GRIDDY", blurb: "Bank 10 career elims." },
  { id: "take-l", name: "TAKE THE L", blurb: "Find the VIPER spray in a drop." },
  { id: "hiss", name: "VIPER HISS", blurb: "Unlock the VIPER skin." },
];

export const SIDEKICKS: SidekickDef[] = [
  { id: "none", name: "NO PET", blurb: "Just you." },
  { id: "cat", name: "LOBBY CAT", blurb: "Find a collar on the island." },
  { id: "dog", name: "DROP DOG", blurb: "Find a treat on the island." },
];

export const FINDS: FindDef[] = [
  { id: "wrap-storm", name: "STORM WRAP", blurb: "Picked up in VIPER DROP." },
  { id: "spray-viper", name: "VIPER SPRAY", blurb: "Wall tag from the island." },
  { id: "pick-gold", name: "GOLD PICK", blurb: "Shiny harvest tool." },
  { id: "collar", name: "CAT COLLAR", blurb: "Unlocks the lobby cat." },
  { id: "treat", name: "DOG TREAT", blurb: "Unlocks the drop dog." },
  { id: "meteor-shard", name: "METEOR SHARD", blurb: "Stand in the Tilted crater." },
  { id: "secret-note", name: "VAULT NOTE", blurb: "Tilted basement secret." },
  { id: "exotic-drum", name: "DRUM SHOTTY", blurb: "Exotic from Tilted roofs." },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-drop", name: "FIRST BUS", blurb: "Ride the battle bus once.", reward: "+8 XP" },
  { id: "first-elim", name: "FIRST ELIM", blurb: "Get your first knockout.", reward: "+10 XP" },
  { id: "first-win", name: "VICTORY ROYALE", blurb: "Win VIPER DROP.", reward: "FLOSS" },
  { id: "elim-10", name: "ELIM MACHINE", blurb: "10 career elims.", reward: "GRIDDY" },
  { id: "win-3", name: "ISLAND LEGEND", blurb: "Win 3 matches.", reward: "VIPER SKIN" },
  { id: "like-3", name: "TAPE FAN", blurb: "Like 3 Channel 3384 tapes.", reward: "+40 XP" },
  { id: "find-collar", name: "CAT PERSON", blurb: "Find a collar in-game.", reward: "CAT" },
  { id: "find-treat", name: "GOOD DOG", blurb: "Find a treat in-game.", reward: "DOG" },
  { id: "meteor-core", name: "CRATER WALKER", blurb: "Touch the meteor core.", reward: "SHARD" },
  { id: "tilted-secret", name: "VAULT RAT", blurb: "Find the Tilted basement.", reward: "NOTE" },
];

export const PASS_EVENT = "viper-pass";
const KEY = "viper-pass-v2";
const LEGACY = "viper-pass-v1";

export type PassState = {
  xp: number;
  equipped: SkinId;
  emote: EmoteId;
  sidekick: SidekickId;
  watched: string[];
  liked: string[];
  unlocked: SkinId[];
  emotes: EmoteId[];
  sidekicks: SidekickId[];
  finds: FindId[];
  achievements: AchievementId[];
  subscribed: boolean;
  campaignStage: number;
  stats: { drops: number; elims: number; wins: number };
};

export const EMPTY_PASS: PassState = {
  xp: 0,
  equipped: "fox",
  emote: "wave",
  sidekick: "none",
  watched: [],
  liked: [],
  unlocked: [],
  emotes: ["wave"],
  sidekicks: ["none"],
  finds: [],
  achievements: [],
  subscribed: false,
  campaignStage: 0,
  stats: { drops: 0, elims: 0, wins: 0 },
};

function isSkinId(value: string): value is SkinId {
  return SKINS.some((skin) => skin.id === value);
}
function isEmoteId(value: string): value is EmoteId {
  return EMOTES.some((e) => e.id === value);
}
function isSidekickId(value: string): value is SidekickId {
  return SIDEKICKS.some((s) => s.id === value);
}
function isFindId(value: string): value is FindId {
  return FINDS.some((f) => f.id === value);
}
function isAchievementId(value: string): value is AchievementId {
  return ACHIEVEMENTS.some((a) => a.id === value);
}

function unique<T>(list: T[]) {
  return [...new Set(list)];
}

export function passSkins() {
  return SKINS.filter((s) => s.track === "pass");
}

export function loadPass(): PassState {
  if (typeof window === "undefined") return { ...EMPTY_PASS, stats: { ...EMPTY_PASS.stats } };
  try {
    const raw = window.localStorage.getItem(KEY);
    const legacyRaw = window.localStorage.getItem(LEGACY);
    const parsed = raw
      ? (JSON.parse(raw) as Partial<PassState>)
      : legacyRaw
        ? (JSON.parse(legacyRaw) as Partial<PassState>)
        : null;
    if (!parsed) return { ...EMPTY_PASS, stats: { ...EMPTY_PASS.stats } };
    const fromLegacy = !raw && Boolean(legacyRaw);
    const unlocked = Array.isArray(parsed.unlocked)
      ? parsed.unlocked.filter((id): id is SkinId => typeof id === "string" && isSkinId(id))
      : [];
    return {
      xp: fromLegacy ? 0 : Math.max(0, Number(parsed.xp) || 0),
      equipped:
        parsed.equipped && isSkinId(parsed.equipped) ? parsed.equipped : "fox",
      emote: parsed.emote && isEmoteId(parsed.emote) ? parsed.emote : "wave",
      sidekick:
        parsed.sidekick && isSidekickId(parsed.sidekick) ? parsed.sidekick : "none",
      watched: Array.isArray(parsed.watched)
        ? parsed.watched.filter((id) => typeof id === "string")
        : [],
      liked: Array.isArray(parsed.liked)
        ? parsed.liked.filter((id) => typeof id === "string")
        : [],
      unlocked,
      emotes: unique([
        "wave",
        ...(Array.isArray(parsed.emotes)
          ? parsed.emotes.filter((id): id is EmoteId => typeof id === "string" && isEmoteId(id))
          : []),
      ]),
      sidekicks: unique([
        "none",
        ...(Array.isArray(parsed.sidekicks)
          ? parsed.sidekicks.filter(
              (id): id is SidekickId => typeof id === "string" && isSidekickId(id)
            )
          : []),
      ]),
      finds: Array.isArray(parsed.finds)
        ? parsed.finds.filter((id): id is FindId => typeof id === "string" && isFindId(id))
        : [],
      achievements: Array.isArray(parsed.achievements)
        ? parsed.achievements.filter(
            (id): id is AchievementId => typeof id === "string" && isAchievementId(id)
          )
        : [],
      subscribed: Boolean(parsed.subscribed),
      campaignStage: Math.max(0, Number(parsed.campaignStage) || 0),
      stats: {
        drops: Math.max(0, Number(parsed.stats?.drops) || 0),
        elims: Math.max(0, Number(parsed.stats?.elims) || 0),
        wins: Math.max(0, Number(parsed.stats?.wins) || 0),
      },
    };
  } catch {
    return { ...EMPTY_PASS, stats: { ...EMPTY_PASS.stats } };
  }
}

function persist(state: PassState) {
  window.localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(PASS_EVENT));
}

function grantAchievement(state: PassState, id: AchievementId, extraXp = 0) {
  if (state.achievements.includes(id)) return;
  state.achievements = [...state.achievements, id];
  state.xp += extraXp;
  if (id === "first-win" && !state.emotes.includes("floss")) {
    state.emotes = [...state.emotes, "floss"];
  }
  if (id === "elim-10" && !state.emotes.includes("griddy")) {
    state.emotes = [...state.emotes, "griddy"];
  }
  if (id === "win-3" && !state.unlocked.includes("viper")) {
    state.unlocked = [...state.unlocked, "viper"];
    if (!state.emotes.includes("hiss")) state.emotes = [...state.emotes, "hiss"];
  }
  if (id === "find-collar" && !state.sidekicks.includes("cat")) {
    state.sidekicks = [...state.sidekicks, "cat"];
  }
  if (id === "find-treat" && !state.sidekicks.includes("dog")) {
    state.sidekicks = [...state.sidekicks, "dog"];
  }
}

function evaluate(state: PassState) {
  if (state.stats.drops >= 1) grantAchievement(state, "first-drop", 8);
  if (state.stats.elims >= 1) grantAchievement(state, "first-elim", 10);
  if (state.stats.wins >= 1) grantAchievement(state, "first-win", 12);
  if (state.stats.elims >= 10) grantAchievement(state, "elim-10", 20);
  if (state.stats.wins >= 3) grantAchievement(state, "win-3", 25);
  if (state.liked.length >= 3) grantAchievement(state, "like-3", 40);
  if (state.finds.includes("collar")) grantAchievement(state, "find-collar", 8);
  if (state.finds.includes("treat")) grantAchievement(state, "find-treat", 8);
  if (state.finds.includes("meteor-shard")) grantAchievement(state, "meteor-core", 10);
  if (state.finds.includes("secret-note")) grantAchievement(state, "tilted-secret", 10);
  if (state.finds.includes("spray-viper") && !state.emotes.includes("take-l")) {
    state.emotes = [...state.emotes, "take-l"];
  }
}

export function skinById(id: SkinId) {
  return SKINS.find((skin) => skin.id === id) ?? SKINS[0];
}

export function equippedSkin() {
  return skinById(loadPass().equipped);
}

export function isUnlocked(skin: Skin, pass: PassState) {
  if (skin.track === "pass") return pass.xp >= skin.xp;
  if (skin.track === "subscribe") return pass.subscribed;
  return pass.unlocked.includes(skin.id);
}

export function isEmoteUnlocked(id: EmoteId, pass: PassState) {
  return pass.emotes.includes(id);
}

export function isSidekickUnlocked(id: SidekickId, pass: PassState) {
  return pass.sidekicks.includes(id);
}

export function nextSkin(pass: PassState) {
  return passSkins().find((skin) => skin.xp > pass.xp) ?? null;
}

export function grantWatchXp(videoId: string) {
  const state = loadPass();
  if (state.watched.includes(videoId)) {
    return { gained: 0, total: state.xp, already: true as const };
  }
  state.watched = [...state.watched, videoId];
  state.xp += 8;
  persist(state);
  return { gained: 8, total: state.xp, already: false as const };
}

export function grantLikeXp(videoId: string) {
  const state = loadPass();
  if (state.liked.includes(videoId)) {
    return { gained: 0, total: state.xp, already: true as const };
  }
  state.liked = [...state.liked, videoId];
  state.xp += 12;
  evaluate(state);
  persist(state);
  return { gained: 12, total: state.xp, already: false as const };
}

export function claimSubscriber() {
  const state = loadPass();
  state.subscribed = true;
  persist(state);
  return true;
}

export function grantPlayXp(score: number, elims: number, win = false) {
  const state = loadPass();
  const raw = Math.floor(score / 60) + elims * 5 + (win ? 18 : 3);
  const gained = Math.min(35, Math.max(4, raw));
  state.xp += gained;
  persist(state);
  return { gained, total: state.xp };
}

export function recordDrop() {
  const state = loadPass();
  state.stats.drops += 1;
  evaluate(state);
  persist(state);
}

export function recordElims(n: number) {
  if (n <= 0) return;
  const state = loadPass();
  state.stats.elims += n;
  evaluate(state);
  persist(state);
}

export function recordWin() {
  const state = loadPass();
  state.stats.wins += 1;
  evaluate(state);
  persist(state);
}

export function addFind(id: FindId) {
  const state = loadPass();
  if (state.finds.includes(id)) return { fresh: false as const, name: FINDS.find((f) => f.id === id)?.name ?? id };
  state.finds = [...state.finds, id];
  evaluate(state);
  persist(state);
  return { fresh: true as const, name: FINDS.find((f) => f.id === id)?.name ?? id };
}

export function beatCampaignMission(index: number, unlock?: SkinId) {
  const state = loadPass();
  state.campaignStage = Math.max(state.campaignStage, index + 1);
  state.xp += 20;
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

export function equipEmote(id: EmoteId) {
  const state = loadPass();
  if (!state.emotes.includes(id)) return false;
  state.emote = id;
  persist(state);
  return true;
}

export function equipSidekick(id: SidekickId) {
  const state = loadPass();
  if (!state.sidekicks.includes(id)) return false;
  state.sidekick = id;
  persist(state);
  return true;
}

export function maxPassXp() {
  return passSkins().at(-1)?.xp ?? 15000;
}
