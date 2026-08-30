import { canvasFromMap, shade } from "@/lib/fps/pixel";

const BRICK_PAL = {
  ".": "",
  o: "#140008",
  B: "#6a6a78",
  b: "#505058",
  Y: "#ffcc00",
  y: "#c4a020",
  W: "#8a8a98",
};

const WOOD_PAL = {
  ".": "",
  o: "#140008",
  W: "#c4a06a",
  w: "#8a7040",
  D: "#6a5030",
  L: "#e8c888",
};

const METAL_PAL = {
  ".": "",
  o: "#140008",
  M: "#7a8898",
  m: "#505868",
  H: "#a8b8c8",
  R: "#c45a3a",
};

const STONE_PAL = {
  ".": "",
  o: "#140008",
  S: "#9a9aa8",
  s: "#686878",
  G: "#b8b8c8",
};

const HEDGE_PAL = {
  ".": "",
  o: "#140008",
  G: "#2a8a28",
  g: "#1a6a18",
  L: "#48c45c",
  Y: "#ffcc00",
};

const BRICK_ROWS = [
  "oBBBBBBBBBBBBBBBBo",
  "BbBbBbBbBbBbBbBbBo",
  "BBBBYYYYBBBBYYYYBo",
  "BbBbBbBbBbBbBbBbBo",
  "BBBBYYYYBBBBYYYYBo",
  "BbBbBbBbBbBbBbBbBo",
  "BBBBWWWWBBBBWWWWBo",
  "BbBbBbBbBbBbBbBbBo",
  "BBBBWWWWBBBBWWWWBo",
  "BbBbBbBbBbBbBbBbBo",
  "BBBBYYYYBBBBYYYYBo",
  "BbBbBbBbBbBbBbBbBo",
  "BBBBYYYYBBBBYYYYBo",
  "BbBbBbBbBbBbBbBbBo",
  "oBBBBBBBBBBBBBBBBo",
  "BbBbBbBbBbBbBbBbBo",
];

const WOOD_ROWS = [
  "oWWWWWWWWWWWWWWWWo",
  "WLLLLLLLLLLLLLLLLW",
  "WDDDDDDDDDDDDDDDDW",
  "WLLLLLLLLLLLLLLLLW",
  "WDDDDDDDDDDDDDDDDW",
  "WLLLLLLLLLLLLLLLLW",
  "WDDDDDDDDDDDDDDDDW",
  "WLLLLLLLLLLLLLLLLW",
  "WDDDDDDDDDDDDDDDDW",
  "WLLLLLLLLLLLLLLLLW",
  "WDDDDDDDDDDDDDDDDW",
  "WLLLLLLLLLLLLLLLLW",
  "WDDDDDDDDDDDDDDDDW",
  "WLLLLLLLLLLLLLLLLW",
  "oWWWWWWWWWWWWWWWWo",
  "WDDDDDDDDDDDDDDDDW",
];

const METAL_ROWS = [
  "oMMMMMMMMMMMMMMMMo",
  "MHHHHHHHHHHHHHHHHM",
  "MmmmmmmmmmmmmmmmmM",
  "MHHRRRRHHHHRRRRHHM",
  "MmmmmmmmmmmmmmmmmM",
  "MHHHHHHHHHHHHHHHHM",
  "MmmmmmmmmmmmmmmmmM",
  "MHHRRRRHHHHRRRRHHM",
  "MmmmmmmmmmmmmmmmmM",
  "MHHHHHHHHHHHHHHHHM",
  "MmmmmmmmmmmmmmmmmM",
  "MHHRRRRHHHHRRRRHHM",
  "MmmmmmmmmmmmmmmmmM",
  "MHHHHHHHHHHHHHHHHM",
  "oMMMMMMMMMMMMMMMMo",
  "MmmmmmmmmmmmmmmmmM",
];

const STONE_ROWS = [
  "oSSSSSSSSSSSSSSSSo",
  "SssssGssssGssssGss",
  "SssssssssssssssssS",
  "SGssssGssssGssssGs",
  "SssssssssssssssssS",
  "SssssGssssGssssGss",
  "SssssssssssssssssS",
  "SGssssGssssGssssGs",
  "SssssssssssssssssS",
  "SssssGssssGssssGss",
  "SssssssssssssssssS",
  "SGssssGssssGssssGs",
  "SssssssssssssssssS",
  "SssssGssssGssssGss",
  "oSSSSSSSSSSSSSSSSo",
  "SssssssssssssssssS",
];

const HEDGE_ROWS = [
  "oGGGGGGGGGGGGGGGGo",
  "GLgLgLgLgLgLgLgLgG",
  "GgGgGgGgGgGgGgGgG",
  "GLgLgLgLgLgLgLgLgG",
  "GgGgGgGgGgGgGgGgG",
  "GLgLgLgLgLgLgLgLgG",
  "GgGgGgGgGgGgGgGgG",
  "GLgLgLgLgLgLgLgLgG",
  "GgGgGgGgGgGgGgGgG",
  "GLgLgLgLgLgLgLgLgG",
  "GgGgGgGgGgGgGgGgG",
  "GLgLgLgLgLgLgLgLgG",
  "GgGgGgGgGgGgGgGgG",
  "GLgLgLgLgLgLgLgLgG",
  "oGGGGGGGGGGGGGGGGo",
  "GgGgGgGgGgGgGgGgG",
];

export type WallTexId = 1 | 2 | 3 | 4 | 5;

export function buildWallTextures() {
  const px = 8;
  return {
    1: canvasFromMap(BRICK_ROWS, BRICK_PAL, px),
    2: canvasFromMap(WOOD_ROWS, WOOD_PAL, px),
    3: canvasFromMap(METAL_ROWS, METAL_PAL, px),
    4: canvasFromMap(HEDGE_ROWS, HEDGE_PAL, px),
    5: canvasFromMap(STONE_ROWS, STONE_PAL, px),
  } satisfies Record<WallTexId, HTMLCanvasElement>;
}

export function buildSkyStrip(w: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = 1;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "#1a5088");
  g.addColorStop(0.35, "#3d8fd4");
  g.addColorStop(0.55, "#7ec8f8");
  g.addColorStop(0.75, "#b8e4ff");
  g.addColorStop(1, "#ffe8a8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, 1);
  return canvas;
}

export function buildFloorStrip(w: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < w; x++) {
      const blade = (x + y * 3) % 7;
      const base = blade < 2 ? "#3a9a38" : blade < 4 ? "#48c45c" : "#2a7a28";
      ctx.fillStyle = (x + y) % 11 === 0 ? shade(base, -18) : base;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  for (let i = 0; i < 40; i++) {
    const fx = Math.floor(Math.random() * w);
    const fy = Math.floor(Math.random() * 64);
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(fx, fy, 2, 2);
  }
  return canvas;
}

export function buildCeilingClouds(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#1a5088");
  g.addColorStop(0.45, "#5eb0f0");
  g.addColorStop(1, "#ffe8a8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (let i = 0; i < 12; i++) {
    const cx = (i * 137) % w;
    const cy = 20 + (i * 53) % (h * 0.35);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 48 + (i % 3) * 20, 18 + (i % 2) * 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas;
}

export function sampleWallColumn(
  tex: HTMLCanvasElement,
  u: number,
  vStart: number,
  vEnd: number,
  ctx: CanvasRenderingContext2D,
  x: number,
  y0: number,
  h: number,
  shadeAmt: number
) {
  const tw = tex.width;
  const th = tex.height;
  const sx = Math.floor(u * tw) % tw;
  const sh = Math.max(1, Math.floor(h));
  const tmp = document.createElement("canvas");
  tmp.width = 1;
  tmp.height = sh;
  const tctx = tmp.getContext("2d")!;
  tctx.imageSmoothingEnabled = false;
  tctx.drawImage(tex, sx, 0, 1, th, 0, 0, 1, sh);
  ctx.drawImage(tmp, x, y0, 1, sh);
  if (shadeAmt !== 0) {
    ctx.fillStyle = shadeAmt > 0 ? `rgba(0,0,0,${shadeAmt})` : `rgba(255,255,220,${-shadeAmt * 0.15})`;
    ctx.fillRect(x, y0, 1, sh);
  }
}
