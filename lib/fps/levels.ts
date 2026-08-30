import { ENEMY_SPAWNS, MAP_H, MAP_W, SPAWN } from "@/lib/fps/map";
import type { FloorTheme } from "@/lib/fps/textures";
import type { BossKind, RegularKind } from "@/lib/fps/sprites";

export type LevelDef = {
  id: 1 | 2 | 3;
  name: string;
  theme: FloorTheme;
  regulars: number;
  bossKind: BossKind;
  bossName: string;
  bossHp: number;
  bossScale: number;
  bossMelee: number;
  skyPath: string;
  skyFallback?: string;
};

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    name: "BEACH OUTPOST",
    theme: "outdoor",
    regulars: 5,
    bossKind: "bossPeely",
    bossName: "KING PEELY",
    bossHp: 220,
    bossScale: 1.7,
    bossMelee: 20,
    skyPath: "/fps/sprites/sky-level1-island.png",
    skyFallback: "/fps/sprites/sky-storm.png",
  },
  {
    id: 2,
    name: "NEON VILLA",
    theme: "indoor",
    regulars: 8,
    bossKind: "bossStorm",
    bossName: "STORM OVERLORD",
    bossHp: 320,
    bossScale: 1.85,
    bossMelee: 26,
    skyPath: "/fps/sprites/sky-level2-storm.png",
  },
  {
    id: 3,
    name: "HAZARD FOUNDRY",
    theme: "industrial",
    regulars: 12,
    bossKind: "bossChief",
    bossName: "IRON CHIEF",
    bossHp: 450,
    bossScale: 2,
    bossMelee: 32,
    skyPath: "/fps/sprites/sky-level3-foundry.png",
  },
];

export const MIX: RegularKind[] = ["peely", "viper", "stormstep", "chief"];

function shuffle<T>(list: T[]) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const t = out[i];
    out[i] = out[j];
    out[j] = t;
  }
  return out;
}

export function collectOpenCells(grid: number[][]) {
  const cells: Array<{ x: number; y: number }> = [];
  for (let y = 1; y < MAP_H - 1; y++) {
    for (let x = 1; x < MAP_W - 1; x++) {
      if (grid[y][x] > 0) continue;
      const cx = x + 0.5;
      const cy = y + 0.5;
      if (Math.hypot(cx - SPAWN.x, cy - SPAWN.y) < 3.2) continue;
      cells.push({ x: cx, y: cy });
    }
  }
  return cells;
}

export function pickRegularSpawns(grid: number[][], count: number) {
  const base = ENEMY_SPAWNS.map((s, i) => ({
    kind: MIX[i % MIX.length],
    x: s.x,
    y: s.y,
  }));
  const taken = shuffle(base);
  const out = taken.slice(0, Math.min(count, taken.length));
  if (out.length >= count) return out;
  const extras = shuffle(
    collectOpenCells(grid).filter(
      (c) => !out.some((s) => Math.hypot(s.x - c.x, s.y - c.y) < 1.4)
    )
  );
  for (const cell of extras) {
    if (out.length >= count) break;
    out.push({
      kind: MIX[out.length % MIX.length],
      x: cell.x,
      y: cell.y,
    });
  }
  return out;
}

export function farOpenCell(grid: number[][], px: number, py: number) {
  const cells = collectOpenCells(grid);
  let best = { x: 8.5, y: 6.5 };
  let bestD = -1;
  for (const cell of cells) {
    const d = Math.hypot(cell.x - px, cell.y - py);
    if (d > bestD) {
      bestD = d;
      best = cell;
    }
  }
  return best;
}

export function levelById(id: number) {
  return LEVELS[Math.max(0, Math.min(LEVELS.length, id) - 1)];
}
