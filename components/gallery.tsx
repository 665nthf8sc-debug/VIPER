"use client";

import { PixelPanel } from "@/components/pixel-panel";
import { useEffect, useRef, useState } from "react";

const W = 160;
const H = 96;

function paintSkyline(
  ctx: CanvasRenderingContext2D,
  ruined: number
) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#1a0033";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#3d1466";
  ctx.fillRect(0, 70, W, 26);

  const towers = [
    { x: 8, w: 18, h: 40 },
    { x: 30, w: 24, h: 62 },
    { x: 58, w: 30, h: 78 },
    { x: 92, w: 22, h: 54 },
    { x: 118, w: 18, h: 36 },
    { x: 138, w: 16, h: 28 },
  ];

  for (const [i, t] of towers.entries()) {
    const melt = ruined * (0.35 + (i % 3) * 0.2);
    const h = Math.max(6, Math.floor(t.h * (1 - melt)));
    const y = 70 - h;
    ctx.fillStyle = ruined > 0.7 ? "#3a3038" : "#8a8a96";
    ctx.fillRect(t.x, y, t.w, h);
    ctx.fillStyle = ruined > 0.45 ? "#4a2010" : "#ffcc66";
    for (let wy = y + 4; wy < 66; wy += 6) {
      for (let wx = t.x + 3; wx < t.x + t.w - 3; wx += 5) {
        if (ruined > 0.6 && Math.random() < ruined) continue;
        ctx.fillRect(wx, wy, 2, 2);
      }
    }
    if (ruined > 0.4) {
      ctx.fillStyle = "#ff6a00";
      ctx.fillRect(t.x + 2, 70 - 4, t.w - 4, 4);
    }
  }

  if (ruined > 0.25) {
    ctx.fillStyle = "#2a1408";
    ctx.beginPath();
    ctx.ellipse(80, 78, 36 * ruined, 10 * ruined, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (ruined > 0.55) {
    ctx.fillStyle = "#ff6a00";
    for (let i = 0; i < 12; i++) {
      ctx.fillRect(70 + (i * 9) % 30, 64 - (i % 5) * 3, 2, 4);
    }
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(84, 58, 3, 3);
  }

  ctx.fillStyle = "#1a100c";
  ctx.fillRect(0, 78, W, 18);
}

export function Gallery() {
  const beforeRef = useRef<HTMLCanvasElement>(null);
  const afterRef = useRef<HTMLCanvasElement>(null);
  const mixRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const before = beforeRef.current?.getContext("2d");
    const after = afterRef.current?.getContext("2d");
    if (before) paintSkyline(before, 0);
    if (after) paintSkyline(after, 1);
  }, []);

  useEffect(() => {
    const canvas = mixRef.current;
    const before = beforeRef.current;
    const after = afterRef.current;
    if (!canvas || !before || !after) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(before, 0, 0);
    const src = after.getContext("2d");
    if (!src) return;
    const img = src.getImageData(0, 0, W, H);
    const dst = ctx.getImageData(0, 0, W, H);
    const threshold = progress;
    for (let i = 0; i < W * H; i++) {
      const x = i % W;
      const y = Math.floor(i / W);
      const noise = ((x * 13 + y * 31) % 17) / 17;
      if (noise < threshold) {
        const o = i * 4;
        dst.data[o] = img.data[o];
        dst.data[o + 1] = img.data[o + 1];
        dst.data[o + 2] = img.data[o + 2];
        dst.data[o + 3] = img.data[o + 3];
      }
    }
    ctx.putImageData(dst, 0, 0);
  }, [progress]);

  return (
    <section id="gallery" className="section-wrap py-16 sm:py-20">
      <PixelPanel title="MEMORY PAK  •  TILTED GALLERY">
        <p className="font-vt mb-6 text-xl text-[#c9a0ff] sm:text-2xl">
          Drag the meteor slider. Watch the city crumble one tile at a time.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <figure>
            <canvas
              ref={beforeRef}
              width={W}
              height={H}
              className="pixelated w-full bg-black pixel-border"
            />
            <figcaption className="font-press mt-2 text-center text-[10px] text-[#00e800]">
              BEFORE
            </figcaption>
          </figure>
          <figure>
            <canvas
              ref={mixRef}
              width={W}
              height={H}
              className="pixelated w-full bg-black pixel-border"
            />
            <figcaption className="font-press mt-2 text-center text-[10px] text-[#ffcc00]">
              PIXEL WIPE
            </figcaption>
          </figure>
          <figure>
            <canvas
              ref={afterRef}
              width={W}
              height={H}
              className="pixelated w-full bg-black pixel-border"
            />
            <figcaption className="font-press mt-2 text-center text-[10px] text-[#e02020]">
              AFTER
            </figcaption>
          </figure>
        </div>
        <label className="mt-6 flex flex-col gap-2">
          <span className="font-press text-[10px] text-[#ff6a00]">
            METEOR PROGRESS {Math.round(progress * 100)}%
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(progress * 100)}
            onChange={(e) => setProgress(Number(e.target.value) / 100)}
            className="h-4 w-full cursor-pointer appearance-none bg-[#3d1466] accent-[#ff6a00]"
          />
        </label>
      </PixelPanel>
    </section>
  );
}
