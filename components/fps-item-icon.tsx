"use client";

import { canvasFromImage, fpsAsset, loadImage, sliceGrid } from "@/lib/fps/sprite-loader";
import { useEffect, useRef } from "react";

type IconId = "pickaxe" | "pump" | "scar" | "exotic";

const INDEX: Record<IconId, number> = {
  scar: 0,
  pump: 1,
  exotic: 3,
  pickaxe: 7,
};

let weaponPromise: Promise<HTMLCanvasElement[]> | null = null;

function loadWeaponCells() {
  if (!weaponPromise) {
    weaponPromise = loadImage(fpsAsset("/fps/sprites/items-weapons.png"))
      .then((img) =>
        sliceGrid(canvasFromImage(img), 4, 2, {
          chroma: true,
          crop: true,
          maxHeight: 128,
        })
      )
      .catch(() => []);
  }
  return weaponPromise;
}

export function FpsItemIcon({ id, dim = false }: { id: IconId; dim?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    void loadWeaponCells().then((cells) => {
      const canvas = ref.current;
      const src = cells[INDEX[id]];
      if (!live || !canvas || !src) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, 48, 48);
      ctx.drawImage(src, 0, 0, 48, 48);
    });
    return () => {
      live = false;
    };
  }, [id]);

  return (
    <canvas
      ref={ref}
      width={48}
      height={48}
      className={`pixelated mx-auto block h-12 w-12 ${dim ? "opacity-40" : ""}`}
    />
  );
}
