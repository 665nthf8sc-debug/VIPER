"use client";

import {
  ARCADE_SKINS,
  DAILIES,
  THEME_CODES,
  TICKET_CODES,
  XP_CODES,
  dailyForDate,
  type CodeResult,
  type GameId,
  type ThemeId,
} from "@/lib/arcade/catalog";
import {
  EMPTY_PASS,
  PASS_EVENT,
  loadPass,
  persistPass,
  unlockSkin,
  type PassState,
  type SkinId,
} from "@/lib/pass";
import type { EmoteId, SidekickId } from "@/lib/sprites";

const KEY = "viper-arcade-v1";
export const ARCADE_EVENT = "viper-arcade";

export type ArcadeSettings = {
  music: boolean;
  sfx: boolean;
  quality: "high" | "low";
};

export type PublicProfile = {
  username: string;
  equipped: SkinId;
  theme: ThemeId;
  sidekick: SidekickId;
};

export type ArcadeSave = {
  username: string;
  passHash: string;
  theme: ThemeId;
  admin: boolean;
  secretRoom: boolean;
  usedCodes: string[];
  tickets: number;
  highScores: Record<string, number>;
  plays: Record<string, number>;
  friends: string[];
  daily: { day: string; id: string; done: boolean };
  settings: ArcadeSettings;
  pass: PassState;
};

type Store = {
  current: string | null;
  accounts: Record<string, ArcadeSave>;
  public: Record<string, PublicProfile>;
};

const EMPTY_SETTINGS: ArcadeSettings = {
  music: true,
  sfx: true,
  quality: "high",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function blankPass(): PassState {
  return {
    ...EMPTY_PASS,
    stats: { ...EMPTY_PASS.stats },
    unlocked: [],
    emotes: ["wave", "floss", "griddy"],
    sidekicks: ["none"],
    watched: [],
    liked: [],
    finds: [],
    achievements: [],
  };
}

export function freshSave(username: string, passHash = ""): ArcadeSave {
  const day = today();
  const daily = dailyForDate(day);
  const migrated = typeof window !== "undefined" ? loadPass() : blankPass();
  return {
    username,
    passHash,
    theme: "sunset",
    admin: false,
    secretRoom: false,
    usedCodes: [],
    tickets: 0,
    highScores: {},
    plays: {},
    friends: [],
    daily: { day, id: daily.id, done: false },
    settings: { ...EMPTY_SETTINGS },
    pass: {
      ...blankPass(),
      ...migrated,
      stats: { ...EMPTY_PASS.stats, ...migrated.stats },
    },
  };
}

function emptyStore(): Store {
  return { current: null, accounts: {}, public: {} };
}

function readStore(): Store {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      current: typeof parsed.current === "string" ? parsed.current : null,
      accounts:
        parsed.accounts && typeof parsed.accounts === "object"
          ? parsed.accounts
          : {},
      public:
        parsed.public && typeof parsed.public === "object" ? parsed.public : {},
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: Store) {
  window.localStorage.setItem(KEY, JSON.stringify(store));
  const save = store.current ? store.accounts[store.current] : null;
  if (save) {
    persistPass(save.pass);
    store.public[save.username] = {
      username: save.username,
      equipped: save.pass.equipped,
      theme: save.theme,
      sidekick: save.pass.sidekick,
    };
    window.localStorage.setItem(KEY, JSON.stringify(store));
  }
  window.dispatchEvent(new Event(ARCADE_EVENT));
  window.dispatchEvent(new Event(PASS_EVENT));
}

function mutate(fn: (save: ArcadeSave, store: Store) => void) {
  const store = readStore();
  const name = store.current;
  if (!name || !store.accounts[name]) return null;
  const save = store.accounts[name];
  const latest = loadPass();
  save.pass = {
    ...save.pass,
    ...latest,
    stats: { ...save.pass.stats, ...latest.stats },
  };
  const day = today();
  if (save.daily.day !== day) {
    const daily = dailyForDate(day);
    save.daily = { day, id: daily.id, done: false };
  }
  fn(save, store);
  writeStore(store);
  return save;
}

export async function hashSecret(value: string) {
  const payload = `viper3384:${value}`;
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(payload)
    );
    return [...new Uint8Array(buf)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return btoa(unescape(encodeURIComponent(payload)))
    .split("")
    .reverse()
    .join("");
}

export function currentSave(): ArcadeSave {
  const store = readStore();
  if (store.current && store.accounts[store.current]) {
    const save = store.accounts[store.current];
    const day = today();
    if (save.daily.day !== day) {
      const daily = dailyForDate(day);
      save.daily = { day, id: daily.id, done: false };
    }
    return save;
  }
  return freshSave("GUEST");
}

export function isSignedIn() {
  const store = readStore();
  return Boolean(store.current && store.accounts[store.current]);
}

export async function registerAccount(username: string, password: string) {
  const name = username.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "").slice(0, 16);
  if (name.length < 3) return { ok: false as const, label: "NAME TOO SHORT" };
  const store = readStore();
  if (store.accounts[name]) return { ok: false as const, label: "NAME TAKEN" };
  const save = freshSave(name, await hashSecret(password));
  store.accounts[name] = save;
  store.current = name;
  writeStore(store);
  return { ok: true as const, save };
}

export async function loginAccount(username: string, password: string) {
  const name = username.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "").slice(0, 16);
  const store = readStore();
  const save = store.accounts[name];
  if (!save) return { ok: false as const, label: "NO ACCOUNT" };
  const hash = await hashSecret(password);
  if (save.passHash && save.passHash !== hash) {
    return { ok: false as const, label: "BAD PASSWORD" };
  }
  store.current = name;
  writeStore(store);
  return { ok: true as const, save };
}

export function playAsGuest() {
  const store = readStore();
  if (!store.accounts.GUEST) store.accounts.GUEST = freshSave("GUEST");
  store.current = "GUEST";
  writeStore(store);
  return store.accounts.GUEST;
}

export function logoutAccount() {
  const store = readStore();
  store.current = null;
  writeStore(store);
}

export function exportSaveCode() {
  const save = currentSave();
  const raw = JSON.stringify({
    username: save.username,
    passHash: save.passHash,
    theme: save.theme,
    admin: save.admin,
    secretRoom: save.secretRoom,
    usedCodes: save.usedCodes,
    tickets: save.tickets,
    highScores: save.highScores,
    plays: save.plays,
    friends: save.friends,
    settings: save.settings,
    pass: save.pass,
  });
  return `VIPER3384.${btoa(unescape(encodeURIComponent(raw)))}`;
}

export async function importSaveCode(code: string) {
  try {
    const trimmed = code.trim();
    const body = trimmed.startsWith("VIPER3384.")
      ? trimmed.slice("VIPER3384.".length)
      : trimmed;
    const parsed = JSON.parse(decodeURIComponent(escape(atob(body)))) as Partial<ArcadeSave>;
    if (!parsed || typeof parsed !== "object") throw new Error("bad");
    const name =
      typeof parsed.username === "string"
        ? parsed.username.toUpperCase().replace(/[^A-Z0-9_]/g, "").slice(0, 16)
        : "IMPORT";
    const store = readStore();
    const save = {
      ...freshSave(name, typeof parsed.passHash === "string" ? parsed.passHash : ""),
      ...parsed,
      username: name,
      pass: {
        ...blankPass(),
        ...(parsed.pass ?? {}),
        stats: { ...EMPTY_PASS.stats, ...parsed.pass?.stats },
      },
    } as ArcadeSave;
    store.accounts[name] = save;
    store.current = name;
    writeStore(store);
    return { ok: true as const, save };
  } catch {
    return { ok: false as const, label: "BAD SAVE CODE" };
  }
}

export function syncPassIntoArcade() {
  mutate((save) => {
    save.pass = loadPass();
  });
}

export function addTickets(n: number) {
  let total = 0;
  mutate((save) => {
    save.tickets = Math.max(0, save.tickets + Math.floor(n));
    total = save.tickets;
  });
  return total;
}

export function addXp(n: number) {
  mutate((save) => {
    save.pass.xp = Math.max(0, save.pass.xp + Math.floor(n));
  });
}

export function awardArcade(
  game: GameId,
  score: number,
  extra?: { win?: boolean; elims?: number; wave?: number; food?: number }
) {
  const tickets = Math.max(
    2,
    Math.min(80, Math.floor(score / 40) + (extra?.win ? 20 : 4) + (extra?.elims ?? 0) * 3)
  );
  mutate((save) => {
    save.plays[game] = (save.plays[game] ?? 0) + 1;
    save.highScores[game] = Math.max(save.highScores[game] ?? 0, score);
    save.tickets += tickets;
    const daily = DAILIES.find((d) => d.id === save.daily.id);
    if (daily && !save.daily.done && daily.game === game) {
      let hit = score >= daily.target;
      if (daily.id === "snake-12") hit = (extra?.food ?? 0) >= daily.target;
      if (daily.id === "def-5") hit = (extra?.wave ?? 0) >= daily.target;
      if (daily.id === "drop-3") hit = (extra?.elims ?? 0) >= daily.target;
      if (hit) {
        save.daily.done = true;
        save.tickets += daily.tickets;
      }
    }
  });
  return tickets;
}

export function equipArcadeSkin(id: SkinId) {
  if (!canUseSkin(id)) return false;
  mutate((s) => {
    s.pass.equipped = id;
  });
  return true;
}

function skinUnlockedByXp(id: SkinId, xp: number) {
  const fromPass = [
    ["fox", 0],
    ["steel", 250],
    ["gold", 600],
    ["neon", 1100],
    ["storm", 1800],
    ["stormstep", 2000],
    ["kit", 3800],
    ["sonic", 5200],
    ["phantom", 7000],
    ["chief", 9000],
    ["pro", 11500],
    ["mythic", 15000],
  ] as const;
  const row = fromPass.find((r) => r[0] === id);
  return row ? xp >= row[1] : false;
}

export function canUseSkin(id: SkinId, save = currentSave()) {
  if (id === "fox") return true;
  if (save.pass.unlocked.includes(id)) return true;
  if (save.admin && id === "admin") return true;
  if (save.pass.subscribed && id === "sub") return true;
  return skinUnlockedByXp(id, save.pass.xp);
}

export function buySkin(id: SkinId) {
  const card = ARCADE_SKINS.find((s) => s.id === id);
  if (!card) return { ok: false as const, label: "UNKNOWN SKIN" };
  const save = currentSave();
  if (canUseSkin(id, save)) return { ok: false as const, label: "ALREADY OWNED" };
  if (id === "admin" && !save.admin) return { ok: false as const, label: "ADMIN ONLY" };
  if (save.tickets < card.tickets) return { ok: false as const, label: "NOT ENOUGH TICKETS" };
  mutate((s) => {
    s.tickets -= card.tickets;
    if (!s.pass.unlocked.includes(id)) s.pass.unlocked = [...s.pass.unlocked, id];
    s.pass.equipped = id;
  });
  unlockSkin(id);
  return { ok: true as const, label: `EQUIPPED ${card.name}` };
}

export function buyPet(id: Exclude<SidekickId, "none">, price: number) {
  const save = currentSave();
  if (save.pass.sidekicks.includes(id)) return { ok: false as const, label: "OWNED" };
  if (save.tickets < price) return { ok: false as const, label: "NOT ENOUGH TICKETS" };
  mutate((s) => {
    s.tickets -= price;
    s.pass.sidekicks = [...s.pass.sidekicks, id];
    s.pass.sidekick = id;
  });
  return { ok: true as const, label: "PET EQUIPPED" };
}

export function buyEmote(id: EmoteId, price: number) {
  const save = currentSave();
  if (save.pass.emotes.includes(id)) return { ok: false as const, label: "OWNED" };
  if (save.tickets < price) return { ok: false as const, label: "NOT ENOUGH TICKETS" };
  mutate((s) => {
    s.tickets -= price;
    s.pass.emotes = [...s.pass.emotes, id];
    s.pass.emote = id;
  });
  return { ok: true as const, label: "EMOTE UNLOCKED" };
}

export function setTheme(id: ThemeId) {
  mutate((s) => {
    s.theme = id;
  });
}

export function patchSettings(partial: Partial<ArcadeSettings>) {
  mutate((s) => {
    s.settings = { ...s.settings, ...partial };
  });
}

export function redeemCode(raw: string): CodeResult {
  const code = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length < 3) return { ok: false, label: "ENTER A CODE" };
  const save = currentSave();
  if (code === "3384") {
    mutate((s) => {
      s.admin = true;
      s.secretRoom = true;
      if (!s.usedCodes.includes("3384")) s.usedCodes = [...s.usedCodes, "3384"];
    });
    return { ok: true, kind: "cutscene", label: "WALL SEQUENCE UNLOCKED" };
  }
  if (save.usedCodes.includes(code) && (XP_CODES[code] || TICKET_CODES[code])) {
    return { ok: false, label: "CODE ALREADY USED" };
  }
  if (XP_CODES[code]) {
    const amount = XP_CODES[code];
    mutate((s) => {
      s.pass.xp += amount;
      s.usedCodes = [...s.usedCodes, code];
    });
    return { ok: true, kind: "xp", amount, label: `+${amount} XP` };
  }
  if (TICKET_CODES[code]) {
    const amount = TICKET_CODES[code];
    mutate((s) => {
      s.tickets += amount;
      s.usedCodes = [...s.usedCodes, code];
    });
    return { ok: true, kind: "tickets", amount, label: `+${amount} TICKETS` };
  }
  if (THEME_CODES[code]) {
    const theme = THEME_CODES[code];
    mutate((s) => {
      s.theme = theme;
    });
    return { ok: true, kind: "theme", theme, label: `THEME ${theme.toUpperCase()}` };
  }
  const skin = ARCADE_SKINS.find((s) => s.code === code);
  if (skin) {
    mutate((s) => {
      if (!s.pass.unlocked.includes(skin.id)) {
        s.pass.unlocked = [...s.pass.unlocked, skin.id];
      }
      s.pass.equipped = skin.id;
      if (skin.id === "admin") s.admin = true;
    });
    unlockSkin(skin.id);
    return { ok: true, kind: "skin", skin: skin.id, label: `UNLOCKED ${skin.name}` };
  }
  return { ok: false, label: "UNKNOWN CODE" };
}

export function addFriend(name: string) {
  const u = name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "").slice(0, 16);
  if (u.length < 3) return false;
  mutate((s) => {
    if (!s.friends.includes(u)) s.friends = [...s.friends, u];
  });
  return true;
}

export function lookupPublic(username: string): PublicProfile | null {
  const store = readStore();
  return store.public[username.toUpperCase()] ?? null;
}

export function mostPlayed(save = currentSave()) {
  const entries = Object.entries(save.plays).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? "drop";
}

export function playerCountEstimate() {
  const hour = new Date().getHours();
  const base = 12 + (hour % 7) * 3;
  const store = readStore();
  return base + Object.keys(store.accounts).length;
}
