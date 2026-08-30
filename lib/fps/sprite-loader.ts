/** Resolve public asset path (GitHub Pages uses /VIPER base). */
export function fpsAsset(path: string) {
  if (typeof window === "undefined") return path;
  const prefix = window.location.pathname.startsWith("/VIPER") ? "/VIPER" : "";
  return `${prefix}${path}`;
}

function isBackdrop(r: number, g: number, b: number) {
  const spread = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  if (spread < 22 && r > 55 && r < 210) return true;
  return false;
}

function cropToAlpha(source: HTMLCanvasElement) {
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

/** Load PNG, knock out gray studio backdrop, crop to character. */
export function processSpriteImage(img: HTMLImageElement) {
  const tmp = document.createElement("canvas");
  tmp.width = img.width;
  tmp.height = img.height;
  const ctx = tmp.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  const frame = ctx.getImageData(0, 0, tmp.width, tmp.height);
  for (let i = 0; i < frame.data.length; i += 4) {
    const r = frame.data[i];
    const g = frame.data[i + 1];
    const b = frame.data[i + 2];
    if (isBackdrop(r, g, b)) {
      frame.data[i + 3] = 0;
    } else {
      frame.data[i + 3] = 255;
    }
  }
  ctx.putImageData(frame, 0, 0);
  return normalizeSpriteSize(cropToAlpha(tmp));
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

export function loadSprite(url: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(processSpriteImage(img));
    img.onerror = () => reject(new Error(`sprite load failed: ${url}`));
    img.src = url;
  });
}

export type HdSpriteSet = {
  chief: HTMLCanvasElement;
  peely: HTMLCanvasElement;
  jonesy: HTMLCanvasElement;
  fox: HTMLCanvasElement;
};

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
