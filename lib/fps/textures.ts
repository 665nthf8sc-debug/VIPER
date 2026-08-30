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

/** Full-frame island sky with clouds — drawn once, reused every frame. */
export function buildSkyCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#1a5088");
  g.addColorStop(0.45, "#5eb0f0");
  g.addColorStop(0.85, "#b8e4ff");
  g.addColorStop(1, "#ffe8a8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  for (let i = 0; i < 14; i++) {
    const cx = ((i * 173) % w) + 20;
    const cy = 18 + ((i * 67) % (h * 0.55));
    ctx.beginPath();
    ctx.ellipse(cx, cy, 36 + (i % 4) * 14, 14 + (i % 3) * 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas;
}

/** Full-frame grass floor — drawn under walls so gaps never show black. */
export function buildFloorCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const blade = (x * 2 + y * 5) % 9;
      const base =
        blade < 2 ? "#2a7a28" : blade < 5 ? "#48c45c" : blade < 7 ? "#3a9a38" : "#58d868";
      ctx.fillStyle = (x + y) % 13 === 0 ? shade(base, -22) : base;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = (i % 3 === 0 ? "#ffcc00" : "#c4a06a") as string;
    ctx.fillRect((i * 47) % w, (i * 31) % h, 2, 2);
  }
  return canvas;
}

export function buildFloorStrip(w: number) {
  return buildFloorCanvas(w, 64);
}
