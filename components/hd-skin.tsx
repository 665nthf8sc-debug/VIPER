"use client";

import { fpsAsset, loadAngleSheets, type AngleKind } from "@/lib/fps/sprite-loader";
import type { SkinId } from "@/lib/pass";
import { drawSprite, spriteRows, type SpriteKind } from "@/lib/sprites";
import { useEffect, useRef, useState } from "react";

export const HD_SKIN: Partial<Record<SkinId, AngleKind>> = {
  viper: "viper",
  chief: "chief",
  peely: "peely",
  storm: "stormstep",
  stormstep: "stormstep",
};

let portraitCache: Promise<Partial<Record<AngleKind, HTMLCanvasElement>>> | null = null;

function loadPortraits() {
  if (!portraitCache) {
    portraitCache = loadAngleSheets().then((angles) => {
      const out: Partial<Record<AngleKind, HTMLCanvasElement>> = {};
      (Object.keys(angles) as AngleKind[]).forEach((k) => {
        const frame = angles[k]?.[0];
        if (frame) out[k] = frame;
      });
      return out;
    });
  }
  return portraitCache;
}

export function HdSkin({
  palette,
  sprite,
  skinId,
  size = 40,
}: {
  palette: Record<string, string>;
  sprite: SpriteKind;
  skinId?: SkinId;
  size?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hd, setHd] = useState<HTMLCanvasElement | null>(null);
  const sheet = skinId ? HD_SKIN[skinId] : undefined;

  useEffect(() => {
    if (!sheet) return;
    let live = true;
    void loadPortraits().then((portraits) => {
      if (live && portraits[sheet]) setHd(portraits[sheet]!);
    });
    return () => {
      live = false;
    };
  }, [sheet]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#0c1408";
    ctx.fillRect(0, 0, size, size);
    if (hd) {
      const pad = 2;
      const scale = Math.min((size - pad * 2) / hd.width, (size - pad * 2) / hd.height);
      const w = Math.max(1, (hd.width * scale) | 0);
      const h = Math.max(1, (hd.height * scale) | 0);
      ctx.drawImage(hd, ((size - w) / 2) | 0, ((size - h) / 2) | 0, w, h);
    } else {
      const ox = size >= 48 ? 16 : 12;
      const oy = size >= 48 ? 16 : 12;
      drawSprite(ctx, spriteRows(sprite, 0), ox, oy, false, palette);
    }
  }, [hd, palette, size, sprite]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      className="pixelated mx-auto block"
      style={{ width: size * 1.4, height: size * 1.4 }}
    />
  );
}

export function hdSheetUrl(kind: AngleKind) {
  return fpsAsset(`/fps/sprites/char-${kind}-8angle.png`);
}
