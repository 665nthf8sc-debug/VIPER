"use client";

import { arcadeAsset } from "@/lib/arcade/asset";
import { useEffect, useRef } from "react";

/** Knock a sampled corner backdrop so HD portraits stand as Paper Mario billboards. */
export function SkinBillboard({
  src,
  className,
  alt = "",
}: {
  src: string;
  className?: string;
  alt?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || 512;
      const h = img.naturalHeight || 512;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const frame = ctx.getImageData(0, 0, w, h);
      const d = frame.data;
      const idx = (x: number, y: number) => (y * w + x) * 4;
      const samples = [
        idx(2, 2),
        idx(w - 3, 2),
        idx(Math.floor(w / 2), 2),
        idx(2, Math.floor(h * 0.12)),
      ];
      let r0 = 0;
      let g0 = 0;
      let b0 = 0;
      for (const i of samples) {
        r0 += d[i];
        g0 += d[i + 1];
        b0 += d[i + 2];
      }
      r0 /= samples.length;
      g0 /= samples.length;
      b0 /= samples.length;
      const thresh = 62;
      const t2 = thresh * thresh * 3;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = idx(x, y);
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          const dr = r - r0;
          const dg = g - g0;
          const db = b - b0;
          const skyish =
            (r > 80 && b > 80 && g < 140) ||
            (r > 160 && g > 70 && g < 180 && b < 120) ||
            (b > 90 && r > 40 && g < b);
          const edge = y < h * 0.42 || x < w * 0.12 || x > w * 0.88;
          if (edge && skyish && dr * dr + dg * dg + db * db < t2 * 1.8) {
            d[i + 3] = 0;
          }
        }
      }
      ctx.putImageData(frame, 0, 0);
    };
    img.src = arcadeAsset(src);
  }, [src]);

  return <canvas ref={ref} className={className} aria-label={alt} style={{ width: "100%", height: "auto" }} />;
}
