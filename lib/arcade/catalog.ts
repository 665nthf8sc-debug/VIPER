import type { EmoteId, SidekickId } from "@/lib/sprites";
import type { SkinId } from "@/lib/pass";

export type ThemeId = "sunset" | "golden" | "void" | "toxic" | "ice";

export type GameId =
  | "drop"
  | "fps"
  | "crossing"
  | "snake"
  | "defender"
  | "builder";

export type PropKind =
  | "machine"
  | "soon"
  | "keypad"
  | "terminal"
  | "prize"
  | "door"
  | "admin";

export type Theme = {
  id: ThemeId;
  name: string;
  mag: string;
  cyan: string;
  deep: string;
  floor: string;
};

export const THEMES: Record<ThemeId, Theme> = {
  sunset: {
    id: "sunset",
    name: "NEON SUNSET",
    mag: "#FF0080",
    cyan: "#00FFFF",
    deep: "#1a0038",
    floor: "#3a1466",
  },
  golden: {
    id: "golden",
    name: "GOLD DROP",
    mag: "#ffcc00",
    cyan: "#ffe680",
    deep: "#2a1800",
    floor: "#5a3a00",
  },
  void: {
    id: "void",
    name: "VOID OPS",
    mag: "#a020f0",
    cyan: "#7a5cff",
    deep: "#080010",
    floor: "#1a1028",
  },
  toxic: {
    id: "toxic",
    name: "STORM TOXIC",
    mag: "#39ff14",
    cyan: "#00e8a0",
    deep: "#031a08",
    floor: "#0a3a18",
  },
  ice: {
    id: "ice",
    name: "ICE BOX",
    mag: "#66e0ff",
    cyan: "#ffffff",
    deep: "#041428",
    floor: "#123050",
  },
};

export type SkinCard = {
  id: SkinId;
  name: string;
  blurb: string;
  tickets: number;
  portrait: string;
  code?: string;
};

export const ARCADE_SKINS: SkinCard[] = [
  {
    id: "fox",
    name: "DROPPER",
    blurb: "Teen hoodie, RGB cans, green streak. The default walk.",
    tickets: 0,
    portrait: "/skins/fox.webp",
  },
  {
    id: "steel",
    name: "BLUE STEEL",
    blurb: "Chrome knight armor. Visor down.",
    tickets: 250,
    portrait: "/skins/steel.webp",
    code: "STEEL",
  },
  {
    id: "gold",
    name: "GOLD DROP",
    blurb: "Aviator luxury. Wings out.",
    tickets: 400,
    portrait: "/skins/gold.webp",
    code: "DROPGOLD",
  },
  {
    id: "neon",
    name: "NEON FANG",
    blurb: "Cyberpunk leather. Glow fangs.",
    tickets: 550,
    portrait: "/skins/neon.webp",
    code: "FANG",
  },
  {
    id: "storm",
    name: "STORM OPS",
    blurb: "Tactical purple. You are the weather.",
    tickets: 700,
    portrait: "/skins/storm.webp",
    code: "OPS",
  },
  {
    id: "kit",
    name: "KIT",
    blurb: "Orange cat. White mech. Cyan eyes.",
    tickets: 900,
    portrait: "/skins/kit.webp",
    code: "MEOW",
  },
  {
    id: "sonic",
    name: "SONIC",
    blurb: "Blue blur. Lightning trails.",
    tickets: 1100,
    portrait: "/skins/sonic.webp",
    code: "BLUEBLUR",
  },
  {
    id: "phantom",
    name: "PHANTOM",
    blurb: "Spectral armor. White eyes.",
    tickets: 1300,
    portrait: "/skins/phantom.webp",
    code: "GHOST",
  },
  {
    id: "pro",
    name: "8-BIT PRO",
    blurb: "Retro gamer hoodie. Visor shades.",
    tickets: 1500,
    portrait: "/skins/pro.webp",
    code: "8BIT",
  },
  {
    id: "chief",
    name: "CHIEF MK.VI",
    blurb: "Mjolnir green. Finish the fight.",
    tickets: 1600,
    portrait: "/skins/chief.webp",
  },
  {
    id: "mythic",
    name: "MYTHIC VIPER",
    blurb: "Gold-purple celestial. God tier.",
    tickets: 2000,
    portrait: "/skins/mythic.webp",
    code: "MYTHIC",
  },
  {
    id: "jonesy",
    name: "JONESY",
    blurb: "Blonde soldier. Fox patch. Headset.",
    tickets: 800,
    portrait: "/skins/jonesy.webp",
    code: "AGENT",
  },
  {
    id: "peely",
    name: "PEELY",
    blurb: "Banana. Still detailed. Still a banana.",
    tickets: 750,
    portrait: "/skins/peely.webp",
  },
  {
    id: "viper",
    name: "VIPER",
    blurb: "Signature hood. Green glow.",
    tickets: 1200,
    portrait: "/skins/viper.webp",
  },
  {
    id: "sub",
    name: "CHANNEL 3384",
    blurb: "YouTuber hoodie. LED kicks. RGB cans.",
    tickets: 600,
    portrait: "/skins/sub.webp",
    code: "CHAN",
  },
  {
    id: "stormstep",
    name: "STORMSTEP",
    blurb: "Lightning hoodie. Neon visor.",
    tickets: 850,
    portrait: "/skins/stormstep.webp",
  },
  {
    id: "admin",
    name: "SECRET ADMIN",
    blurb: "Exclusive owner. Hologram panels. Glowing eyes.",
    tickets: 99999,
    portrait: "/skins/admin.webp",
    code: "ADMIN",
  },
];

export const PET_PORTRAITS: Record<Exclude<SidekickId, "none">, string> = {
  cat: "/pets/cat.webp",
  dog: "/pets/dog.webp",
  llama: "/pets/llama.webp",
};

export const PET_PRICES: Record<Exclude<SidekickId, "none">, number> = {
  cat: 120,
  dog: 120,
  llama: 200,
};

export const EMOTE_PRICES: Partial<Record<EmoteId, number>> = {
  floss: 80,
  griddy: 80,
  "take-l": 90,
  hiss: 90,
};

export type CodeResult =
  | { ok: true; kind: "xp"; amount: number; label: string }
  | { ok: true; kind: "tickets"; amount: number; label: string }
  | { ok: true; kind: "theme"; theme: ThemeId; label: string }
  | { ok: true; kind: "skin"; skin: SkinId; label: string }
  | { ok: true; kind: "cutscene"; label: string }
  | { ok: false; label: string };

export const XP_CODES: Record<string, number> = {
  BANK: 100,
  GRIND: 500,
  HUSTLE: 250,
};

export const TICKET_CODES: Record<string, number> = {
  COIN: 50,
  VIPER: 25,
};

export const THEME_CODES: Record<string, ThemeId> = {
  SUNSET: "sunset",
  GOLDEN: "golden",
  VOID: "void",
  TOXIC: "toxic",
  ICE: "ice",
};

export function skinByPortrait(id: SkinId) {
  return ARCADE_SKINS.find((s) => s.id === id) ?? ARCADE_SKINS[0];
}

export type DailyChallenge = {
  id: string;
  label: string;
  game: GameId;
  target: number;
  tickets: number;
};

export const DAILIES: DailyChallenge[] = [
  {
    id: "cross-400",
    label: "Score 400 in VIPER CROSSING",
    game: "crossing",
    target: 400,
    tickets: 50,
  },
  {
    id: "snake-12",
    label: "Eat 12 llamas in VIPER SNAKE",
    game: "snake",
    target: 12,
    tickets: 50,
  },
  {
    id: "def-5",
    label: "Clear wave 5 in VIPER DEFENDER",
    game: "defender",
    target: 5,
    tickets: 50,
  },
  {
    id: "drop-3",
    label: "Get 3 elims in VIPER DROP",
    game: "drop",
    target: 3,
    tickets: 60,
  },
  {
    id: "fps-400",
    label: "Score 400 in VIPER FPS",
    game: "fps",
    target: 400,
    tickets: 60,
  },
];

export function dailyForDate(isoDay: string) {
  let n = 0;
  for (let i = 0; i < isoDay.length; i++) n += isoDay.charCodeAt(i);
  return DAILIES[n % DAILIES.length];
}

export type MachineDef = {
  id: string;
  kind: PropKind;
  title: string;
  subtitle: string;
  game?: GameId;
  x: number;
  z: number;
  w: number;
  d: number;
  hue: string;
  accent: string;
  secret?: boolean;
};

export const MACHINES: MachineDef[] = [
  {
    id: "home-skins",
    kind: "terminal",
    title: "SKINS",
    subtitle: "PLAYER 1",
    x: 220,
    z: 36,
    w: 88,
    d: 36,
    hue: "#FF0080",
    accent: "#00FFFF",
  },
  {
    id: "home-settings",
    kind: "terminal",
    title: "SETTINGS",
    subtitle: "AUDIO / GFX",
    x: 330,
    z: 36,
    w: 88,
    d: 36,
    hue: "#7a5cff",
    accent: "#00FFFF",
  },
  {
    id: "home-friends",
    kind: "terminal",
    title: "FRIENDS",
    subtitle: "SQUAD UP",
    x: 440,
    z: 36,
    w: 88,
    d: 36,
    hue: "#00FFFF",
    accent: "#FF0080",
  },
  {
    id: "prize",
    kind: "prize",
    title: "PRIZE COUNTER",
    subtitle: "REDEEM TICKETS",
    x: 620,
    z: 34,
    w: 130,
    d: 40,
    hue: "#ffcc00",
    accent: "#FF0080",
  },
  {
    id: "drop",
    kind: "machine",
    title: "VIPER DROP",
    subtitle: "12-PLAYER BR",
    game: "drop",
    x: 980,
    z: 30,
    w: 120,
    d: 44,
    hue: "#FF0080",
    accent: "#00FFFF",
  },
  {
    id: "fps",
    kind: "machine",
    title: "VIPER FPS",
    subtitle: "RAYCAST OPS",
    game: "fps",
    x: 1340,
    z: 30,
    w: 120,
    d: 44,
    hue: "#e02030",
    accent: "#1a1a1a",
  },
  {
    id: "crossing",
    kind: "machine",
    title: "VIPER CROSSING",
    subtitle: "TILTED STREETS",
    game: "crossing",
    x: 1700,
    z: 30,
    w: 120,
    d: 44,
    hue: "#39ff14",
    accent: "#0a5a20",
  },
  {
    id: "snake",
    kind: "machine",
    title: "VIPER SNAKE",
    subtitle: "STORM GRID",
    game: "snake",
    x: 2060,
    z: 30,
    w: 120,
    d: 44,
    hue: "#00FFFF",
    accent: "#FF0080",
  },
  {
    id: "defender",
    kind: "machine",
    title: "VIPER DEFENDER",
    subtitle: "STORM KING",
    game: "defender",
    x: 2420,
    z: 30,
    w: 120,
    d: 44,
    hue: "#7a5cff",
    accent: "#ffcc00",
  },
  {
    id: "soon-pinball",
    kind: "soon",
    title: "PINBALL",
    subtitle: "COMING SOON",
    x: 2780,
    z: 30,
    w: 110,
    d: 40,
    hue: "#ffcc00",
    accent: "#222",
  },
  {
    id: "soon-racing",
    kind: "soon",
    title: "RACING",
    subtitle: "COMING SOON",
    x: 3080,
    z: 30,
    w: 110,
    d: 40,
    hue: "#ffcc00",
    accent: "#222",
  },
  {
    id: "soon-fight",
    kind: "soon",
    title: "FIGHTING",
    subtitle: "COMING SOON",
    x: 3380,
    z: 30,
    w: 110,
    d: 40,
    hue: "#ffcc00",
    accent: "#222",
  },
  {
    id: "keypad",
    kind: "keypad",
    title: "KEYPAD",
    subtitle: "4-DIGIT CODE",
    x: 3720,
    z: 26,
    w: 70,
    d: 28,
    hue: "#00FFFF",
    accent: "#FF0080",
  },
  {
    id: "secret-door",
    kind: "door",
    title: "FAKE WALL",
    subtitle: "???",
    x: 4040,
    z: 20,
    w: 160,
    d: 24,
    hue: "#3a1466",
    accent: "#00FFFF",
  },
  {
    id: "admin-skin",
    kind: "admin",
    title: "SECRET ADMIN",
    subtitle: "EQUIP DEV SKIN",
    x: 4440,
    z: 32,
    w: 110,
    d: 40,
    hue: "#39ff14",
    accent: "#111",
    secret: true,
  },
  {
    id: "admin-builder",
    kind: "admin",
    title: "VIPER BUILDER",
    subtitle: "CREATIVE SANDBOX",
    game: "builder",
    x: 4720,
    z: 32,
    w: 120,
    d: 40,
    hue: "#00FFFF",
    accent: "#FF0080",
    secret: true,
  },
  {
    id: "admin-debug",
    kind: "admin",
    title: "DEBUG STATS",
    subtitle: "PLAYER / GAMES",
    x: 5000,
    z: 32,
    w: 110,
    d: 40,
    hue: "#ffcc00",
    accent: "#111",
    secret: true,
  },
  {
    id: "admin-back",
    kind: "door",
    title: "BACK DOOR",
    subtitle: "MAIN ARCADE",
    x: 5240,
    z: 28,
    w: 90,
    d: 32,
    hue: "#FF0080",
    accent: "#00FFFF",
    secret: true,
  },
];
