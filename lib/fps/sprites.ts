import { canvasFromMap, paintMap } from "@/lib/fps/pixel";

export type RegularKind = "peely" | "chief" | "viper" | "stormstep";
export type BossKind = "bossPeely" | "bossStorm" | "bossChief";
export type EnemyKind = RegularKind | "jonesy" | "fox" | BossKind;

export function isBossKind(kind: EnemyKind): kind is BossKind {
  return kind === "bossPeely" || kind === "bossStorm" || kind === "bossChief";
}

export function regularFor(kind: EnemyKind): RegularKind {
  if (kind === "bossPeely" || kind === "peely") return "peely";
  if (kind === "bossChief" || kind === "chief") return "chief";
  if (kind === "bossStorm" || kind === "stormstep" || kind === "jonesy") return "stormstep";
  return "viper";
}
export type PickupKind = "pump" | "scar" | "exotic" | "med" | "shield" | "llama" | "chest" | "ammo";

const INK = "#140008";

export function buildEnemySprite(rawKind: EnemyKind) {
  const px = 4;
  const kind = regularFor(rawKind);
  let rows: string[];
  let palette: Record<string, string>;

  if (kind === "peely") {
    palette = { ".": "", o: INK, Y: "#ffcc00", y: "#e8a800", B: "#c4a020", W: "#f8f0d8", b: "#8a7020" };
    rows = [
      "........oooooooo........",
      "......ooYYYYYYoo........",
      ".....oYYYYYYYYYo........",
      "....oYYWWWWWWYYo........",
      "....oYYWbbWWbbYYo.......",
      "....oYYYYYYYYYYo........",
      ".....oYYYYYYYYo.........",
      "......oooooooo..........",
      "....oooooooooooo........",
      "...ooYYYYYYYYYYoo.......",
      "..ooYYYYYYYYYYYYoo......",
      "..oYYYYYYYYYYYYYYo......",
      "..oYYYYYYYYYYYYYYo......",
      "..oYYYYYo..oYYYYYo......",
      "...oYYYo....oYYYo.......",
      "...oooo......oooo.......",
      "...oYYo......oYYo.......",
      "...oYYo......oYYo.......",
    ];
  } else if (kind === "chief") {
    palette = { ".": "", o: INK, G: "#3d7a48", g: "#2a5a30", V: "#7ec8f8", v: "#4a8898", W: "#d0e4ff", Y: "#ffcc00" };
    rows = [
      "........oooooooo........",
      "......ooGGGGGGoo........",
      ".....oGGGGGGGGGo........",
      "....oGGVVVVVVGGo........",
      "....oGGVVVVVVGGo........",
      "....oGGGGGGGGGGo........",
      ".....oGGGGGGGo..........",
      "......oooooooo..........",
      "....oooooooooooo........",
      "...ooGGGGGGGGGGoo.......",
      "..ooGGGGGGGGGGGGoo......",
      "..oGGGGGGGGGGGGGo......",
      "..oGGGGGGGGGGGGGo......",
      "..oGGGGo....oGGGGo......",
      "...oGGo......oGGo.......",
      "...oooo......oooo.......",
      "...oGGo......oGGo.......",
      "...oGGo......oGGo.......",
    ];
  } else if (kind === "viper") {
    palette = { ".": "", o: INK, G: "#2a8a28", g: "#1a5a18", V: "#ffcc00", K: "#1a1a22", S: "#f8f0d8" };
    rows = [
      "........oooooooo........",
      "......ooKKKKKKoo........",
      ".....oKKGGGGKKKo........",
      "....oKKGSSSSGKKo........",
      "....oKKGSbbSGKKo........",
      "....oKKGGGGGGKKo........",
      ".....oKKKKKKKo..........",
      "......oooooooo..........",
      "....oooooooooooo........",
      "...ooGGGGGGGGGGoo.......",
      "..ooGGGVVVVGGGGoo.......",
      "..oGGGGVVVVGGGGGo.......",
      "..oGGGGGGGGGGGGGo.......",
      "..oGGGGo....oGGGGo......",
      "...oGGo......oGGo.......",
      "...oooo......oooo.......",
      "...oKKo......oKKo.......",
      "...oKKo......oKKo.......",
    ];
  } else if (kind === "stormstep") {
    palette = { ".": "", o: INK, B: "#3d7cff", Y: "#ffcc00", K: "#1a1a28", S: "#f8f0d8", C: "#3cdcff" };
    rows = [
      "........oooooooo........",
      "......ooBBBBBBoo........",
      ".....oBBCCCCCBBo........",
      "....oBBSSSSSSBBo........",
      "....oBBSbbSSbBBo........",
      "....oBBBBBBBBBBo........",
      ".....oBBBBBBBo..........",
      "......oooooooo..........",
      "....oooooooooooo........",
      "...ooBBBBBBBBBBoo.......",
      "..ooBBBBYYYYBBBBoo......",
      "..oBBBBBYYYYBBBBo.......",
      "..oBBBBBBBBBBBBBo.......",
      "..oBBBo......oBBBo......",
      "...oBBo......oBBo.......",
      "...oooo......oooo.......",
      "...oCCo......oCCo.......",
      "...oCCo......oCCo.......",
    ];
  } else if (kind === "jonesy") {
    palette = { ".": "", o: INK, H: "#6a5030", S: "#f8f0d8", B: "#3d7cff", Y: "#ffcc00", W: "#d0e4ff" };
    rows = [
      "........oooooooo........",
      "......ooHHHHHHoo........",
      ".....oHHSSSSSSHo........",
      "....oHSSSSSSSSSHo.......",
      "....oHSSbbSSbbSHo.......",
      "....oHSSSSSSSSSHo.......",
      ".....oHHHHHHHo..........",
      "......oooooooo..........",
      "....oooooooooooo........",
      "...ooBBBBBBBBBBoo.......",
      "..ooBBBBYYYYBBoo........",
      "..oBBBBYYYYBBBBo........",
      "..oBBBBYYYYBBBBo........",
      "..oBBBo......oBBBo......",
      "...oBo........oBo.......",
      "...oooo......oooo.......",
      "...oBBo......oBBo.......",
      "...oBBo......oBBo.......",
    ];
  } else {
    palette = { ".": "", o: INK, W: "#f8f0d8", O: "#ff6a00", Y: "#ffcc00", b: "#1a0033" };
    rows = [
      "........oooooooo........",
      "......ooOOOOOOoo........",
      ".....oOOOOOOOOOo........",
      "....oOWWWWWWWWOOo.......",
      "....oOWbbWWbbWOOo.......",
      "....oOOOOOOOOOOo........",
      ".....oOOOOOOOOo.........",
      "......oooooooo..........",
      "....oooooooooooo........",
      "...ooOOOOOOOOOOoo.......",
      "..ooOOOOYYYYOOOOoo......",
      "..oOOOOYYYYYYOOOOo.....",
      "..oOOOOYYYYYYOOOOo.....",
      "..oOOOo......oOOOo......",
      "...oOOo......oOOo.......",
      "...oooo......oooo.......",
      "...oOOo......oOOo.......",
      "...oOOo......oOOo.......",
    ];
  }

  const canvas = canvasFromMap(rows, palette, px);
  return canvas;
}

export function buildPickupSprite(kind: PickupKind) {
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 48;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  if (kind === "llama") {
    paintMap(ctx, ["..PPPP..", ".PppppP.", "PpYYppPp", "PpYYppPp", ".PppppP.", "..PPPP.."], {
      ".": "",
      P: "#c45aff",
      p: "#9a38d8",
      Y: "#ffcc00",
    }, 6, 0, 0);
  } else if (kind === "chest") {
    ctx.fillStyle = "#8a7040";
    ctx.fillRect(8, 16, 32, 24);
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(8, 26, 32, 4);
    ctx.fillStyle = "#c4a06a";
    ctx.fillRect(20, 20, 8, 10);
  } else if (kind === "pump") {
    ctx.fillStyle = "#505058";
    ctx.fillRect(8, 20, 32, 8);
    ctx.fillStyle = "#a060ff";
    ctx.fillRect(12, 12, 24, 12);
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(28, 16, 8, 4);
  } else if (kind === "scar") {
    ctx.fillStyle = "#3a3a48";
    ctx.fillRect(6, 22, 36, 6);
    ctx.fillStyle = "#6a6a78";
    ctx.fillRect(10, 16, 28, 10);
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(30, 18, 6, 4);
  } else if (kind === "exotic") {
    ctx.fillStyle = "#2a2a38";
    ctx.fillRect(6, 22, 36, 6);
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(10, 14, 28, 12);
    ctx.fillStyle = "#ff6a00";
    ctx.fillRect(14, 18, 8, 4);
  } else if (kind === "med") {
    ctx.fillStyle = "#00e800";
    ctx.fillRect(14, 10, 20, 28);
    ctx.fillStyle = "#f8f0d8";
    ctx.fillRect(20, 14, 8, 20);
    ctx.fillRect(16, 20, 16, 8);
  } else if (kind === "ammo") {
    ctx.fillStyle = "#3a5a28";
    ctx.fillRect(10, 14, 28, 22);
    ctx.fillStyle = "#6a8a38";
    ctx.fillRect(10, 14, 28, 6);
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(12, 28, 8, 3);
    ctx.fillRect(22, 28, 8, 3);
    ctx.fillStyle = "#c4a06a";
    ctx.fillRect(16, 18, 16, 8);
  } else {
    ctx.fillStyle = "#3cdcff";
    ctx.fillRect(14, 10, 20, 28);
    ctx.fillStyle = "#f8f0d8";
    ctx.fillRect(20, 14, 8, 20);
    ctx.fillRect(16, 20, 16, 8);
  }
  return canvas;
}

function paintMuzzle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, hot = 1) {
  ctx.fillStyle = `rgba(255,255,210,${0.85 * hot})`;
  ctx.fillRect(x, y - 2, size, 5);
  ctx.fillStyle = `rgba(255,180,40,${0.7 * hot})`;
  ctx.fillRect(x + 2, y - 5, size + 6, 11);
  ctx.fillStyle = `rgba(255,80,16,${0.45 * hot})`;
  ctx.fillRect(x + 8, y - 8, size + 4, 17);
}

/** Wolf-style viewmodel: idle + fire (kick, muzzle, pump cycle). Barrel aims up-left. */
export function buildWeaponView(id: "pickaxe" | "pump" | "scar" | "exotic", frame: number) {
  const w = 200;
  const h = 130;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  const justFired = frame > 0;
  const kick = justFired ? Math.min(16, frame * 1.6) : 0;
  const rise = justFired ? Math.min(10, frame) : 0;

  ctx.fillStyle = "#d0a070";
  ctx.fillRect(118, 96 + kick, 36, 28);
  ctx.fillRect(86, 102 + kick, 40, 22);
  ctx.fillStyle = "#8a6038";
  ctx.fillRect(120, 98 + kick, 32, 8);

  if (id === "pickaxe") {
    const swing = justFired ? 10 - Math.min(10, frame) : 0;
    ctx.fillStyle = "#8a7040";
    ctx.fillRect(70 + swing, 58 + kick, 54, 10);
    ctx.fillStyle = "#c4a06a";
    ctx.fillRect(118 + swing, 40 + kick - rise, 40, 28);
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(124 + swing, 46 + kick - rise, 26, 14);
    if (justFired && frame > 6) {
      ctx.fillStyle = "rgba(255,255,220,0.35)";
      ctx.fillRect(40, 36 + kick, 36, 8);
    }
  } else if (id === "pump") {
    const pump = frame > 4 && frame < 14 ? (frame > 9 ? 14 - frame : frame - 4) * 3 : 0;
    ctx.fillStyle = "#1a1a24";
    ctx.fillRect(28, 72 + kick, 120, 16);
    ctx.fillStyle = "#3a3a48";
    ctx.fillRect(40, 58 + kick, 96, 18);
    ctx.fillStyle = "#a060ff";
    ctx.fillRect(48 + pump, 60 + kick, 44, 12);
    ctx.fillStyle = "#6a6a78";
    ctx.fillRect(100, 62 + kick, 28, 10);
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(128, 64 + kick, 10, 5);
    ctx.fillStyle = "#2a2a38";
    ctx.fillRect(18, 74 + kick, 16, 8);
    if (justFired && frame > 10) {
      paintMuzzle(ctx, 4, 76 + kick, 16, frame / 18);
    }
  } else if (id === "scar") {
    ctx.fillStyle = "#1a1a28";
    ctx.fillRect(20, 74 + kick, 132, 12);
    ctx.fillStyle = "#5a5a68";
    ctx.fillRect(36, 58 + kick, 100, 18);
    ctx.fillStyle = "#3a3a48";
    ctx.fillRect(44, 62 + kick, 72, 8);
    ctx.fillStyle = "#2a2a38";
    ctx.fillRect(12, 76 + kick, 22, 6);
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(126, 64 + kick, 8, 4);
    if (justFired) paintMuzzle(ctx, 2, 76 + kick, 14, Math.min(1, frame / 5));
  } else {
    ctx.fillStyle = "#1a1a28";
    ctx.fillRect(16, 76 + kick, 140, 10);
    ctx.fillStyle = "#c4a020";
    ctx.fillRect(40, 52 + kick, 104, 22);
    ctx.fillStyle = "#ff6a00";
    ctx.fillRect(48, 58 + kick, 28, 10);
    ctx.fillStyle = "#f8f0d8";
    ctx.fillRect(82, 62 + kick, 40, 5);
    ctx.fillStyle = "#2a2a38";
    ctx.fillRect(6, 78 + kick, 18, 5);
    if (justFired) paintMuzzle(ctx, 0, 78 + kick, 18, Math.min(1, frame / 6));
  }
  return canvas;
}

export function buildMuzzleFlash() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 24;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#fff6c0";
  ctx.fillRect(10, 8, 12, 8);
  ctx.fillStyle = "#ffcc00";
  ctx.fillRect(4, 6, 24, 12);
  ctx.fillStyle = "#ff6a00";
  ctx.fillRect(0, 4, 10, 16);
  ctx.fillRect(22, 4, 10, 16);
  ctx.fillStyle = "#fffde8";
  ctx.fillRect(13, 9, 6, 6);
  return canvas;
}

export const ENEMY_NAMES: Record<EnemyKind, string> = {
  peely: "PEELY",
  chief: "CHIEF",
  viper: "VIPER",
  stormstep: "STORMSTEP",
  jonesy: "JONESY",
  fox: "RIVAL FOX",
  bossPeely: "KING PEELY",
  bossStorm: "STORM OVERLORD",
  bossChief: "IRON CHIEF",
};

export const PICKUP_LABEL: Record<PickupKind, string> = {
  pump: "PUMP SHOTGUN",
  scar: "SCAR",
  exotic: "EXOTIC SCAR",
  med: "MEDKIT",
  shield: "MINI SHIELD",
  llama: "LOOT LLAMA",
  chest: "LOOT CHEST",
  ammo: "AMMO BOX",
};

/** Map FPS rival / boss kinds onto 8-angle sheets. */
export function angleKindFor(
  kind: EnemyKind
): "viper" | "chief" | "peely" | "stormstep" {
  return regularFor(kind);
}
