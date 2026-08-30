"use client";

import { loadFrontPortrait, type AngleKind } from "@/lib/fps/sprite-loader";
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

const portraitCache = new Map<AngleKind, Promise<HTMLCanvasElement | null>>();

function portraitFor(kind: AngleKind) {
  let pending = portraitCache.get(kind);
  if (!pending) {
    pending = loadFrontPortrait(kind);
    portraitCache.set(kind, pending);
  }
  return pending;
}

export function HdSkin({
  palette,
  sprite,
  skinId,
  size = 72,
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
    void portraitFor(sheet).then((frame) => {
      if (live && frame) setHd(frame);
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
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = "#0c1408";
    ctx.fillRect(0, 0, size, size);
    if (hd) {
      const pad = 4;
      const scale = Math.min((size - pad * 2) / hd.width, (size - pad * 2) / hd.height);
      const w = Math.max(1, (hd.width * scale) | 0);
      const h = Math.max(1, (hd.height * scale) | 0);
      ctx.drawImage(hd, ((size - w) / 2) | 0, ((size - h) / 2) | 0, w, h);
    } else {
      ctx.imageSmoothingEnabled = false;
      const ox = Math.max(4, ((size - 16) / 2) | 0);
      const oy = Math.max(4, ((size - 16) / 2) | 0);
      drawSprite(ctx, spriteRows(sprite, 0), ox, oy, false, palette);
    }
  }, [hd, palette, size, sprite]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      className="mx-auto block bg-[#0c1408]"
      style={{ width: size, height: size }}
    />
  );
}
