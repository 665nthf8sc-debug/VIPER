/** Resolve public asset path (GitHub Pages uses /VIPER base). */
export function fpsAsset(path: string) {
  if (typeof window === "undefined") return path;
  const prefix = window.location.pathname.startsWith("/VIPER") ? "/VIPER" : "";
  return `${prefix}${path}`;
}

function isGrayBackdrop(r: number, g: number, b: number) {
  const spread = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  if (spread < 22 && r > 55 && r < 210) return true;
  return false;
}

/** Magenta #FF00FF chroma key, plus near-magenta anti-alias fringes. */
export function isMagentaKey(r: number, g: number, b: number) {
  if (r >= 250 && g <= 8 && b >= 250) return true;
  if (r > 200 && b > 200 && g < 70 && r + b - 2 * g > 280) return true;
  return false;
}

export function knockChroma(
  source: HTMLCanvasElement,
  mode: "magenta" | "gray" | "both" = "both"
) {
  const ctx = source.getContext("2d")!;
  const frame = ctx.getImageData(0, 0, source.width, source.height);
  const d = frame.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const mag = mode !== "gray" && isMagentaKey(r, g, b);
    const gray = mode !== "magenta" && isGrayBackdrop(r, g, b);
    if (mag || gray) d[i + 3] = 0;
  }
  ctx.putImageData(frame, 0, 0);
  return source;
}

export function cropToAlpha(source: HTMLCanvasElement) {
  const ctx = source.getContext("2d")!;
  const { width, height } = source;
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 16) continue;
      if (minX > x) minX = x;
      if (minY > y) minY = y;
      if (maxX < x) maxX = x;
      if (maxY < y) maxY = y;
    }
  }
  if (maxX <= minX) return source;
  const pad = Math.max(2, ((maxX - minX) * 0.02) | 0);
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const out = document.createElement("canvas");
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  const octx = out.getContext("2d")!;
  octx.imageSmoothingEnabled = false;
  octx.drawImage(source, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

/** Keep billboard crisp but cap source size for raycast column draws. */
export function normalizeSpriteSize(source: HTMLCanvasElement, maxHeight = 384) {
  if (source.height <= maxHeight) return source;
  const scale = maxHeight / source.height;
  const out = document.createElement("canvas");
  out.width = Math.max(1, (source.width * scale) | 0);
  out.height = maxHeight;
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0, out.width, out.height);
  return out;
}

export function canvasFromImage(img: HTMLImageElement) {
  const tmp = document.createElement("canvas");
  tmp.width = img.width;
  tmp.height = img.height;
  const ctx = tmp.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  return tmp;
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`sprite load failed: ${url}`));
    img.src = url;
  });
}

/** Load PNG, knock out magenta (and gray studio), crop to character. */
export function processSpriteImage(img: HTMLImageElement) {
  const tmp = canvasFromImage(img);
  knockChroma(tmp, "both");
  return normalizeSpriteSize(cropToAlpha(tmp));
}

export function loadSprite(url: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(processSpriteImage(img));
    img.onerror = () => reject(new Error(`sprite load failed: ${url}`));
    img.src = url;
  });
}

function sliceCell(
  source: HTMLCanvasElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number
) {
  const cell = document.createElement("canvas");
  cell.width = Math.max(1, sw);
  cell.height = Math.max(1, sh);
  const ctx = cell.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  return cell;
}

/** Slice a horizontal 8-angle turnaround into 8 cropped frames. */
export function sliceAngleStrip(source: HTMLCanvasElement, frames = 8) {
  const fw = Math.floor(source.width / frames);
  const out: HTMLCanvasElement[] = [];
  for (let i = 0; i < frames; i++) {
    const cell = sliceCell(source, i * fw, 0, fw, source.height);
    knockChroma(cell, "magenta");
    out.push(normalizeSpriteSize(cropToAlpha(cell)));
  }
  return out;
}

/** Slice a 2x4 (or cols x rows) item/env sheet. */
export function sliceGrid(
  source: HTMLCanvasElement,
  cols: number,
  rows: number,
  opts: { chroma?: boolean; crop?: boolean; maxHeight?: number } = {}
) {
  const { chroma = true, crop = true, maxHeight = 384 } = opts;
  const cw = Math.floor(source.width / cols);
  const ch = Math.floor(source.height / rows);
  const out: HTMLCanvasElement[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = sliceCell(source, x * cw, y * ch, cw, ch);
      if (chroma) knockChroma(cell, "magenta");
      const ready = crop ? cropToAlpha(cell) : cell;
      out.push(maxHeight ? normalizeSpriteSize(ready, maxHeight) : ready);
    }
  }
  return out;
}

/**
 * Wolfenstein 8-angle index from relative yaw.
 * Sheet order: front, front-right, right, back-right, back, back-left, left, front-left.
 * `facing` is the sprite's world yaw; camera is at (camX, camY).
 */
export function angleFrame(
  facing: number,
  camX: number,
  camY: number,
  spriteX: number,
  spriteY: number
) {
  const toCam = Math.atan2(camY - spriteY, camX - spriteX);
  let rel = toCam - facing;
  while (rel < 0) rel += Math.PI * 2;
  while (rel >= Math.PI * 2) rel -= Math.PI * 2;
  return Math.round(rel / (Math.PI / 4)) & 7;
}

export type AngleKind = "viper" | "chief" | "peely" | "stormstep";

export type HdSpriteSet = {
  chief: HTMLCanvasElement;
  peely: HTMLCanvasElement;
  jonesy: HTMLCanvasElement;
  fox: HTMLCanvasElement;
};

export type AngleSet = Record<AngleKind, HTMLCanvasElement[]>;

export type ItemGrid = {
  weapons: HTMLCanvasElement[];
  heals: HTMLCanvasElement[];
  chests: HTMLCanvasElement[];
  shields: HTMLCanvasElement[];
};

export type EnvArt = {
  interiors: HTMLCanvasElement[];
  surfaces: HTMLCanvasElement[];
  sky: HTMLCanvasElement | null;
};

export type LockerPortraits = Partial<Record<string, HTMLCanvasElement>>;

export type FpsArt = {
  angles: Partial<AngleSet>;
  items: Partial<ItemGrid>;
  env: EnvArt;
  portraits: LockerPortraits;
  legacy: HdSpriteSet;
};

const ANGLE_FILES: Record<AngleKind, string> = {
  viper: "/fps/sprites/char-viper-8angle.png",
  chief: "/fps/sprites/char-chief-8angle.png",
  peely: "/fps/sprites/char-peely-8angle.png",
  stormstep: "/fps/sprites/char-stormstep-8angle.png",
};

async function loadKeyedSheet(path: string) {
  const img = await loadImage(fpsAsset(path));
  const canvas = canvasFromImage(img);
  knockChroma(canvas, "magenta");
  return canvas;
}

export async function loadAngleSheets(): Promise<Partial<AngleSet>> {
  const out: Partial<AngleSet> = {};
  await Promise.all(
    (Object.keys(ANGLE_FILES) as AngleKind[]).map(async (kind) => {
      try {
        const sheet = await loadKeyedSheet(ANGLE_FILES[kind]);
        out[kind] = sliceAngleStrip(sheet);
      } catch {
        /* procedural fallback */
      }
    })
  );
  return out;
}

export async function loadItemGrids(): Promise<Partial<ItemGrid>> {
  const files = {
    weapons: "/fps/sprites/items-weapons.png",
    heals: "/fps/sprites/items-heals.png",
    chests: "/fps/sprites/items-chests.png",
    shields: "/fps/sprites/items-shields.png",
  } as const;
  const out: Partial<ItemGrid> = {};
  await Promise.all(
    (Object.keys(files) as (keyof typeof files)[]).map(async (key) => {
      try {
        const sheet = await loadKeyedSheet(files[key]);
        out[key] = sliceGrid(sheet, 4, 2, { chroma: false, crop: true, maxHeight: 256 });
      } catch {
        /* keep empty */
      }
    })
  );
  return out;
}

export async function loadEnvArt(): Promise<EnvArt> {
  const env: EnvArt = { interiors: [], surfaces: [], sky: null };
  try {
    const img = await loadImage(fpsAsset("/fps/sprites/env-interiors.png"));
    env.interiors = sliceGrid(canvasFromImage(img), 4, 2, {
      chroma: false,
      crop: false,
      maxHeight: 256,
    });
  } catch {
    /* procedural walls */
  }
  try {
    const img = await loadImage(fpsAsset("/fps/sprites/env-surfaces.png"));
    env.surfaces = sliceGrid(canvasFromImage(img), 4, 2, {
      chroma: false,
      crop: false,
      maxHeight: 256,
    });
  } catch {
    /* procedural floors */
  }
  try {
    const img = await loadImage(fpsAsset("/fps/sprites/env-sky-storm.png"));
    env.sky = canvasFromImage(img);
  } catch {
    env.sky = null;
  }
  return env;
}

export function portraitsFromAngles(angles: Partial<AngleSet>): LockerPortraits {
  const portraits: LockerPortraits = {};
  (Object.keys(angles) as AngleKind[]).forEach((kind) => {
    const frame = angles[kind]?.[0];
    if (frame) portraits[kind] = frame;
  });
  return portraits;
}

export async function loadHdEnemySprites(
  fallback: HdSpriteSet
): Promise<HdSpriteSet> {
  const base = "/fps/sprites";
  const kinds = ["chief", "peely", "jonesy", "fox"] as const;
  const out = { ...fallback };
  await Promise.all(
    kinds.map(async (kind) => {
      try {
        out[kind] = await loadSprite(fpsAsset(`${base}/${kind}.png`));
      } catch {
        /* keep procedural fallback */
      }
    })
  );
  return out;
}

export async function loadFpsArt(legacyFallback: HdSpriteSet): Promise<FpsArt> {
  const [angles, items, env, legacy] = await Promise.all([
    loadAngleSheets(),
    loadItemGrids(),
    loadEnvArt(),
    loadHdEnemySprites(legacyFallback),
  ]);
  return {
    angles,
    items,
    env,
    portraits: portraitsFromAngles(angles),
    legacy,
  };
}

export function canvasToUrl(canvas: HTMLCanvasElement) {
  try {
    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
}
