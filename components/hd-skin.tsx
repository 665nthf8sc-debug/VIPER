"use client";

import { fpsAsset, isMagentaKey, type AngleKind } from "@/lib/fps/sprite-loader";
import type { SkinId } from "@/lib/pass";
import { drawSprite, spriteRows, type SpriteKind } from "@/lib/sprites";
import { useEffect, useRef } from "react";

export const HD_SKIN: Partial<Record<SkinId, AngleKind>> = {
  viper: "viper",
  chief: "chief",
  peely: "peely",
  storm: "stormstep",
  stormstep: "stormstep",
};

const SHEET: Record<AngleKind, string> = {
  viper: "/fps/sprites/char-viper-8angle.png",
  chief: "/fps/sprites/char-chief-8angle.png",
  peely: "/fps/sprites/char-peely-8angle.png",
  stormstep: "/fps/sprites/char-stormstep-8angle.png",
  arc: "/fps/sprites/char-arc-8angle.png",
  bush: "/fps/sprites/char-bush-8angle.png",
};

const painted = new Map<string, HTMLCanvasElement>();

function paintFront(img: HTMLImageElement) {
  const fw = Math.max(1, Math.floor(img.width / 8));
  const src = document.createElement("canvas");
  src.width = fw;
  src.height = img.height;
  const sctx = src.getContext("2d")!;
  sctx.drawImage(img, 0, 0, fw, img.height, 0, 0, fw, img.height);
  const pix = sctx.getImageData(0, 0, fw, img.height);
  let minX = fw;
  let minY = img.height;
  let maxX = 0;
  let maxY = 0;
  for (let i = 0; i < pix.data.length; i += 4) {
    const r = pix.data[i];
    const g = pix.data[i + 1];
    const b = pix.data[i + 2];
    if (isMagentaKey(r, g, b)) {
      pix.data[i + 3] = 0;
      continue;
    }
    const x = (i / 4) % fw;
    const y = ((i / 4) / fw) | 0;
    if (minX > x) minX = x;
    if (minY > y) minY = y;
    if (maxX < x) maxX = x;
    if (maxY < y) maxY = y;
  }
  sctx.putImageData(pix, 0, 0);
  if (maxX <= minX) return src;
  const out = document.createElement("canvas");
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  const octx = out.getContext("2d")!;
  octx.drawImage(src, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

export function HdSkin({
  palette,
  sprite,
  skinId,
  size = 80,
}: {
  palette: Record<string, string>;
  sprite: SpriteKind;
  skinId?: SkinId;
  size?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const sheet = skinId ? HD_SKIN[skinId] : undefined;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const drawPixel = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#0c1408";
      ctx.fillRect(0, 0, size, size);
      const scale = Math.max(2, Math.floor(size / 20));
      ctx.save();
      ctx.scale(scale, scale);
      drawSprite(
        ctx,
        spriteRows(sprite, 0),
        ((size / scale - 16) / 2) | 0,
        ((size / scale - 16) / 2) | 0,
        false,
        palette
      );
      ctx.restore();
    };
    const drawHd = (hd: HTMLCanvasElement) => {
      ctx.imageSmoothingEnabled = true;
      ctx.fillStyle = "#0c1408";
      ctx.fillRect(0, 0, size, size);
      const pad = 4;
      const sc = Math.min((size - pad * 2) / hd.width, (size - pad * 2) / hd.height);
      const w = Math.max(1, (hd.width * sc) | 0);
      const h = Math.max(1, (hd.height * sc) | 0);
      ctx.drawImage(hd, ((size - w) / 2) | 0, ((size - h) / 2) | 0, w, h);
    };

    drawPixel();
    if (!sheet) return;
    const cached = painted.get(sheet);
    if (cached) {
      drawHd(cached);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const hd = paintFront(img);
      painted.set(sheet, hd);
      if (ref.current) drawHd(hd);
    };
    img.src = fpsAsset(SHEET[sheet]);
  }, [palette, sheet, size, sprite]);

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
