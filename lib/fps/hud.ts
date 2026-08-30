import type { WeaponId } from "@/lib/fps/weapons";

export const RENDER_W = 640;
export const WORLD_H = 320;
export const BAR_H = 40;
export const RENDER_H = WORLD_H + BAR_H;

const NAVY = "#00005c";
const NAVY_HI = "#3c3ca8";
const NAVY_LO = "#000030";
const DIV = "#1a1a70";
const LABEL = "#c8c8e8";
const NUM = "#f8e060";
const NUM_DIM = "#a89040";
const FACE_WELL = "#000028";

export function faceTierForHp(hp: number): 0 | 1 | 2 | 3 | 4 {
  if (hp <= 0) return 4;
  if (hp <= 25) return 3;
  if (hp <= 50) return 2;
  if (hp <= 75) return 1;
  return 0;
}

/** Procedural VIPER portrait that scuffs / bloodies as HP drops. */
export function buildViperFace(tier: 0 | 1 | 2 | 3 | 4) {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  const hood = tier >= 4 ? "#1a3a18" : tier >= 3 ? "#1e6a1c" : "#2a8a28";
  const hoodDk = "#143814";
  const skin = tier >= 4 ? "#6a5850" : tier >= 3 ? "#c4a090" : "#f0c8a8";
  const visor = tier >= 3 ? "#8a7000" : tier >= 2 ? "#c4a010" : "#ffcc00";
  const ink = "#100008";

  ctx.fillStyle = ink;
  ctx.fillRect(6, 2, 20, 28);
  ctx.fillStyle = hood;
  ctx.fillRect(7, 3, 18, 26);
  ctx.fillStyle = hoodDk;
  ctx.fillRect(7, 22, 18, 7);
  ctx.fillStyle = skin;
  ctx.fillRect(10, 8, 12, 13);
  ctx.fillStyle = visor;
  ctx.fillRect(10, 10, 12, 5);
  ctx.fillStyle = "#1a1a22";
  ctx.fillRect(12, 11, 3, 3);
  ctx.fillRect(18, 11, 3, 3);
  ctx.fillStyle = "#f8f0d8";
  ctx.fillRect(13, 12, 1, 1);
  ctx.fillRect(19, 12, 1, 1);

  if (tier === 0) {
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(9, 20, 14, 2);
  }
  if (tier >= 1) {
    ctx.fillStyle = "#5a4030";
    ctx.fillRect(20, 16, 3, 2);
    ctx.fillRect(8, 7, 4, 1);
  }
  if (tier >= 2) {
    ctx.fillStyle = "#a01818";
    ctx.fillRect(11, 16, 2, 5);
    ctx.fillRect(17, 18, 4, 1);
    ctx.fillStyle = "#3a2010";
    ctx.fillRect(18, 11, 4, 4);
  }
  if (tier >= 3) {
    ctx.fillStyle = "#801010";
    ctx.fillRect(10, 15, 12, 3);
    ctx.fillRect(8, 18, 3, 6);
    ctx.fillStyle = "#2a1010";
    ctx.fillRect(12, 11, 3, 4);
    ctx.fillStyle = "#f8f0d8";
    ctx.fillRect(13, 14, 2, 1);
  }
  if (tier >= 4) {
    ctx.fillStyle = "#4a1010";
    ctx.fillRect(7, 3, 18, 26);
    ctx.fillStyle = "#2a2020";
    ctx.fillRect(10, 8, 12, 13);
    ctx.fillStyle = "#801818";
    ctx.fillRect(12, 11, 8, 2);
    ctx.fillRect(15, 9, 2, 8);
    ctx.fillStyle = "#200808";
    ctx.fillRect(12, 11, 3, 3);
    ctx.fillRect(18, 11, 3, 3);
  }
  return canvas;
}

function bevelBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.fillStyle = NAVY;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = NAVY_HI;
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillStyle = NAVY_LO;
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x + w - 1, y, 1, h);
}

function compartment(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  dim = false
) {
  bevelBox(ctx, x, y, w, h);
  ctx.fillStyle = DIV;
  ctx.fillRect(x + w - 1, y + 2, 1, h - 4);
  ctx.fillStyle = LABEL;
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(label, x + w / 2, y + 4);
  ctx.fillStyle = dim ? NUM_DIM : NUM;
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.textBaseline = "alphabetic";
  ctx.fillText(value, x + w / 2, y + h - 7);
  ctx.textAlign = "left";
}

export type WolfBarState = {
  level: number;
  score: number;
  lives: number;
  hp: number;
  ammo: string;
  weapon: WeaponId;
  weaponIcon: HTMLCanvasElement | null;
  faces: HTMLCanvasElement[];
};

/** Classic Wolf3D-style stats bar under the 3D view. */
export function drawWolfBar(
  ctx: CanvasRenderingContext2D,
  barY: number,
  state: WolfBarState
) {
  const y = barY;
  const h = BAR_H;
  const w = RENDER_W;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, y, w, h);
  ctx.fillStyle = NAVY_HI;
  ctx.fillRect(0, y, w, 2);
  ctx.fillStyle = NAVY_LO;
  ctx.fillRect(0, y + h - 2, w, 2);

  const cols = [
    { x: 0, w: 78, label: "LEVEL", value: String(state.level) },
    { x: 78, w: 100, label: "SCORE", value: String(state.score).padStart(1, "0") },
    { x: 178, w: 72, label: "LIVES", value: String(state.lives) },
  ];
  for (const c of cols) {
    compartment(ctx, c.x, y, c.w, h, c.label, c.value, state.lives <= 0 && c.label === "LIVES");
  }

  const faceX = 250;
  const faceW = 78;
  bevelBox(ctx, faceX, y, faceW, h);
  ctx.fillStyle = DIV;
  ctx.fillRect(faceX + faceW - 1, y + 2, 1, h - 4);
  ctx.fillStyle = FACE_WELL;
  ctx.fillRect(faceX + 18, y + 3, 42, h - 6);
  ctx.fillStyle = NAVY_LO;
  ctx.strokeStyle = NAVY_LO;
  ctx.strokeRect(faceX + 18.5, y + 3.5, 41, h - 7);
  const tier = faceTierForHp(state.hp);
  const face = state.faces[tier] ?? state.faces[0];
  if (face) {
    const fw = 32;
    const fh = 32;
    ctx.drawImage(face, faceX + 23, y + 4, fw, fh);
  }

  compartment(ctx, 328, y, 92, h, "HEALTH", String(Math.max(0, Math.ceil(state.hp))));
  compartment(ctx, 420, y, 92, h, "AMMO", state.ammo === "MELEE" ? "—" : state.ammo.split("/")[0] || "0");

  const wx = 512;
  const ww = w - wx;
  bevelBox(ctx, wx, y, ww, h);
  ctx.fillStyle = LABEL;
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("WEAPON", wx + ww / 2, y + 3);
  if (state.weaponIcon) {
    ctx.imageSmoothingEnabled = false;
    const iw = 56;
    const ih = 24;
    ctx.drawImage(state.weaponIcon, wx + (ww - iw) / 2, y + 12, iw, ih);
  } else {
    ctx.fillStyle = NUM;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textBaseline = "alphabetic";
    ctx.fillText(state.weapon.toUpperCase().slice(0, 6), wx + ww / 2, y + h - 8);
  }
  ctx.textAlign = "left";
  ctx.restore();
}
