import { MAP_H, MAP_W } from "@/lib/fps/map";
import type { EnemyKind } from "@/lib/fps/sprites";

export const RADAR_SIZE = 104;
export const RADAR_MARGIN = 6;
export const RADAR_TOP = 26;

export const ENEMY_RADAR: Record<EnemyKind, { letter: string; color: string }> = {
  viper: { letter: "V", color: "#00e800" },
  chief: { letter: "C", color: "#d4af37" },
  peely: { letter: "P", color: "#ffcc00" },
  stormstep: { letter: "S", color: "#3cdcff" },
  jonesy: { letter: "J", color: "#7ec8f8" },
  fox: { letter: "F", color: "#ff6a00" },
};

export type RadarEnemy = {
  kind: EnemyKind;
  x: number;
  y: number;
  alive: boolean;
};

/** Pre-render wall cells so the HUD radar can rotate cheaply. */
export function buildRadarWalls(grid: number[][], cell = 4) {
  const canvas = document.createElement("canvas");
  canvas.width = MAP_W * cell;
  canvas.height = MAP_H * cell;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgba(12,0,24,0.35)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const id = grid[y][x];
      if (id <= 0) continue;
      if (id === 1 || id === 2 || id === 8) ctx.fillStyle = "#8a6238";
      else if (id === 3 || id === 6) ctx.fillStyle = "#5a5a6a";
      else ctx.fillStyle = "#3d6a40";
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }
  return canvas;
}

function worldToRadar(
  wx: number,
  wy: number,
  px: number,
  py: number,
  pa: number,
  cx: number,
  cy: number,
  scale: number
) {
  const dx = wx - px;
  const dy = wy - py;
  const fwd = dx * Math.cos(pa) + dy * Math.sin(pa);
  const right = -dx * Math.sin(pa) + dy * Math.cos(pa);
  return [cx + right * scale, cy - fwd * scale] as const;
}

/** Compact player-relative radar in the 640×360 game buffer (top-right). */
export function drawMinimap(
  ctx: CanvasRenderingContext2D,
  opts: {
    wallMap: HTMLCanvasElement;
    px: number;
    py: number;
    pa: number;
    fov: number;
    enemies: RadarEnemy[];
    viewW: number;
  }
) {
  const size = RADAR_SIZE;
  const x = opts.viewW - size - RADAR_MARGIN;
  const y = RADAR_TOP;
  const cx = x + size / 2;
  const cy = y + size / 2;
  const scale = (size * 0.9) / Math.max(MAP_W, MAP_H);

  ctx.save();
  ctx.fillStyle = "rgba(8,0,18,0.78)";
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = "rgba(255,204,0,0.75)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

  ctx.beginPath();
  ctx.rect(x + 1, y + 1, size - 2, size - 2);
  ctx.clip();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-opts.pa - Math.PI / 2);
  ctx.drawImage(
    opts.wallMap,
    -opts.px * scale,
    -opts.py * scale,
    MAP_W * scale,
    MAP_H * scale
  );
  ctx.restore();

  ctx.fillStyle = "rgba(255,204,0,0.14)";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, size * 0.4, -Math.PI / 2 - opts.fov / 2, -Math.PI / 2 + opts.fov / 2);
  ctx.closePath();
  ctx.fill();

  ctx.font = '7px "Press Start 2P", monospace';
  ctx.textBaseline = "middle";
  for (const e of opts.enemies) {
    if (!e.alive) continue;
    const [sx, sy] = worldToRadar(e.x, e.y, opts.px, opts.py, opts.pa, cx, cy, scale);
    if (sx < x - 4 || sy < y - 4 || sx > x + size + 4 || sy > y + size + 4) continue;
    const mark = ENEMY_RADAR[e.kind];
    ctx.fillStyle = mark.color;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = mark.color;
    ctx.fillText(mark.letter, sx + 4, sy);
  }

  ctx.fillStyle = "#f8f0d8";
  ctx.beginPath();
  ctx.moveTo(cx, cy - 5);
  ctx.lineTo(cx - 3.4, cy + 4);
  ctx.lineTo(cx + 3.4, cy + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#00e800";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}
