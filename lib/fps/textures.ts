import { canvasFromMap, shade } from "@/lib/fps/pixel";

export type FloorTheme = "outdoor" | "indoor" | "industrial";

export type ThemeTiles = {
  outdoor?: HTMLCanvasElement;
  indoor?: HTMLCanvasElement;
  industrial?: HTMLCanvasElement;
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

export type WallTexId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Villa/cabin interiors share one indoor theme; metal is industrial; the rest is outdoor. */
export function wallThemeFor(id: number): FloorTheme {
  if (id === 3 || id === 6) return "industrial";
  if (id === 1 || id === 2 || id === 8) return "indoor";
  return "outdoor";
}

export function buildWallTextures() {
  const px = 8;
  return {
    1: canvasFromMap(WOOD_ROWS, WOOD_PAL, px),
    2: canvasFromMap(WOOD_ROWS, WOOD_PAL, px),
    3: canvasFromMap(METAL_ROWS, METAL_PAL, px),
    4: canvasFromMap(HEDGE_ROWS, HEDGE_PAL, px),
    5: canvasFromMap(STONE_ROWS, STONE_PAL, px),
    6: canvasFromMap(METAL_ROWS, METAL_PAL, px),
    7: canvasFromMap(STONE_ROWS, STONE_PAL, px),
    8: canvasFromMap(WOOD_ROWS, WOOD_PAL, px),
  } satisfies Record<WallTexId, HTMLCanvasElement>;
}

export function scaleTex(source: HTMLCanvasElement, max = 256) {
  const longest = Math.max(source.width, source.height);
  if (longest <= max) return source;
  const scale = max / longest;
  const out = document.createElement("canvas");
  out.width = Math.max(1, (source.width * scale) | 0);
  out.height = Math.max(1, (source.height * scale) | 0);
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0, out.width, out.height);
  return out;
}

function pickThemeTile(
  override: HTMLCanvasElement | undefined,
  interiors: HTMLCanvasElement[],
  surfaces: HTMLCanvasElement[],
  theme: FloorTheme
) {
  if (override) return scaleTex(override, 256);
  if (theme === "indoor") {
    return scaleTex(interiors[1] ?? interiors[0] ?? surfaces[0] ?? canvasFromMap(WOOD_ROWS, WOOD_PAL, 8), 256);
  }
  if (theme === "industrial") {
    return scaleTex(interiors[6] ?? interiors[3] ?? surfaces[3] ?? canvasFromMap(METAL_ROWS, METAL_PAL, 8), 256);
  }
  return scaleTex(surfaces[6] ?? interiors[7] ?? canvasFromMap(HEDGE_ROWS, HEDGE_PAL, 8), 256);
}

/**
 * Collapse wall IDs 1–8 onto three paired themes so adjacent outdoor walls match
 * and indoor/industrial rooms never share an outdoor vista texture.
 */
export function applyHdWalls(
  walls: Record<WallTexId, HTMLCanvasElement>,
  interiors: HTMLCanvasElement[],
  surfaces: HTMLCanvasElement[],
  overrides: ThemeTiles = {}
) {
  const outdoor = pickThemeTile(overrides.outdoor, interiors, surfaces, "outdoor");
  const indoor = pickThemeTile(overrides.indoor, interiors, surfaces, "indoor");
  const industrial = pickThemeTile(overrides.industrial, interiors, surfaces, "industrial");
  const byTheme: Record<FloorTheme, HTMLCanvasElement> = { outdoor, indoor, industrial };
  (Object.keys(walls) as unknown as WallTexId[]).forEach((id) => {
    walls[id] = byTheme[wallThemeFor(id)];
  });
  return walls;
}

/** Blend the last ~32px into the first so u=0 matches u=width. */
export function makeSkySeamless(img: HTMLCanvasElement, blendPx = 32) {
  const w = img.width;
  const h = img.height;
  const blend = Math.max(1, Math.min(blendPx, (w / 4) | 0));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const left = ctx.getImageData(0, 0, blend, h).data;
  const right = ctx.getImageData(w - blend, 0, blend, h);
  const d = right.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < blend; x++) {
      const t = (x + 1) / blend;
      const i = (y * blend + x) * 4;
      d[i] = d[i] * (1 - t) + left[i] * t;
      d[i + 1] = d[i + 1] * (1 - t) + left[i + 1] * t;
      d[i + 2] = d[i + 2] * (1 - t) + left[i + 2] * t;
    }
  }
  ctx.putImageData(right, w - blend, 0);
  return canvas;
}

export function buildSkyFromImage(img: HTMLCanvasElement, w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, 0, w, h);
  // Always fix at output size — downscale can reopen a wrap that was seamless in the source.
  return makeSkySeamless(canvas, Math.max(40, (w * 0.08) | 0));
}

export function buildFloorFromTile(tile: HTMLCanvasElement, w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  const tw = Math.max(1, tile.width);
  const th = Math.max(1, tile.height);
  for (let y = 0; y < h; y += th) {
    for (let x = 0; x < w; x += tw) {
      ctx.drawImage(tile, x, y, tw, th);
    }
  }
  return canvas;
}

/** Small seamless-looking tile — used when dedicated floor-*.png files are missing. */
export function makeTileSeamless(tile: HTMLCanvasElement, size = 64) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tile, 0, 0, size, size);
  const blend = Math.max(4, (size / 8) | 0);
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  const sample = (x: number, y: number) => {
    const i = (((y + size) % size) * size + ((x + size) % size)) * 4;
    return [d[i], d[i + 1], d[i + 2]] as const;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const edgeX = x < blend ? (blend - x) / blend : x >= size - blend ? (x - (size - blend) + 1) / blend : 0;
      const edgeY = y < blend ? (blend - y) / blend : y >= size - blend ? (y - (size - blend) + 1) / blend : 0;
      const t = Math.max(edgeX, edgeY) * 0.55;
      if (t <= 0) continue;
      const wrap = sample(x < blend ? x + size - blend : x >= size - blend ? x - (size - blend) : x, y < blend ? y + size - blend : y >= size - blend ? y - (size - blend) : y);
      const i = (y * size + x) * 4;
      d[i] = d[i] * (1 - t) + wrap[0] * t;
      d[i + 1] = d[i + 1] * (1 - t) + wrap[1] * t;
      d[i + 2] = d[i + 2] * (1 - t) + wrap[2] * t;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Crop a uniform corner instead of stretching a landmark (flowers/path) as a sheet. */
export function deriveUniformTile(source: HTMLCanvasElement, size = 64) {
  const cw = Math.max(16, (source.width * 0.22) | 0);
  const ch = Math.max(16, (source.height * 0.22) | 0);
  const crop = document.createElement("canvas");
  crop.width = size;
  crop.height = size;
  const ctx = crop.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0, cw, ch, 0, 0, size, size);
  return makeTileSeamless(crop, size);
}

export type FloorSample = {
  data: Uint8ClampedArray;
  size: number;
};

export function sampleFloorTile(tile: HTMLCanvasElement, size = 64): FloorSample {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tile, 0, 0, size, size);
  return { data: ctx.getImageData(0, 0, size, size).data, size };
}

export function buildThemeFloors(
  surfaces: HTMLCanvasElement[],
  interiors: HTMLCanvasElement[],
  overrides: ThemeTiles = {}
): Record<FloorTheme, FloorSample> {
  const outdoorSrc = makeTileSeamless(
    overrides.outdoor ??
      (surfaces[2] ? deriveUniformTile(surfaces[2], 128) : buildFloorCanvas(128, 128)),
    128
  );
  const indoorSrc = makeTileSeamless(
    overrides.indoor ?? surfaces[0] ?? interiors[1] ?? buildFloorCanvas(128, 128),
    128
  );
  const industrialSrc = makeTileSeamless(
    overrides.industrial ??
      surfaces[3] ??
      interiors[6] ??
      canvasFromMap(METAL_ROWS, METAL_PAL, 4),
    128
  );
  return {
    outdoor: sampleFloorTile(outdoorSrc, 128),
    indoor: sampleFloorTile(indoorSrc, 128),
    industrial: sampleFloorTile(industrialSrc, 128),
  };
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
  return makeSkySeamless(canvas);
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
  return canvas;
}

export function buildFloorStrip(w: number) {
  return buildFloorCanvas(w, 64);
}

export function paintTitlePoster(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  tick: number,
  art: HTMLCanvasElement | null
) {
  if (art) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(art, 0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
  } else {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#140018");
    g.addColorStop(0.28, "#6a1848");
    g.addColorStop(0.5, "#ff6a28");
    g.addColorStop(0.72, "#ffcc44");
    g.addColorStop(1, "#2a0a58");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(80,20,140,0.35)";
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.ellipse(420 + i * 18, 40 + i * 10, 90 - i * 6, 22, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#ffcc44";
    ctx.beginPath();
    ctx.arc(92, 78, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#05000a";
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, 248);
    ctx.lineTo(70, 230);
    ctx.lineTo(130, 250);
    ctx.lineTo(210, 220);
    ctx.lineTo(300, 255);
    ctx.lineTo(400, 210);
    ctx.lineTo(520, 248);
    ctx.lineTo(w, 230);
    ctx.lineTo(w, h);
    ctx.fill();
    ctx.fillStyle = "#0a0014";
    ctx.fillRect(118, 198, 28, 70);
    ctx.beginPath();
    ctx.moveTo(90, 268);
    ctx.lineTo(132, 168);
    ctx.lineTo(174, 268);
    ctx.fill();
    ctx.save();
    ctx.translate(48, 0);
    ctx.transform(1, 0, -0.18, 1, 0, 0);
    ctx.font = 'italic 700 54px Impact, "Arial Black", sans-serif';
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#140008";
    ctx.fillStyle = "#f8f0d8";
    ctx.strokeText("VIPER", 8, 158);
    ctx.fillText("VIPER", 8, 158);
    ctx.restore();
    ctx.font = 'italic 700 16px Impact, "Arial Black", sans-serif';
    ctx.fillStyle = "#7cff3a";
    ctx.fillText("ROYALE", 56, 184);
  }

  ctx.fillStyle = "rgba(10,0,16,0.45)";
  ctx.fillRect(0, h - 48, w, 48);
  if (Math.floor(tick / 28) % 2 === 0) {
    ctx.fillStyle = "#ffcc00";
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText("ENTER / SPACE / CLICK", 150, h - 20);
  }
}
