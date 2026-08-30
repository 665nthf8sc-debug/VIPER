import {
  ENEMY_SPAWNS,
  isWalkableFloor,
  MAP_H,
  MAP_W,
  SPAWN,
} from "@/lib/fps/map";
import type { EnemyKind, RegularKind } from "@/lib/fps/sprites";

export const MIX: RegularKind[] = ["peely", "viper", "stormstep", "chief", "arc", "bush"];

/** Beach leans bush, Neon leans arc, Foundry is mixed. */
export function mixForLevel(id: number): RegularKind[] {
  if (id === 1) return ["bush", "bush", "peely", "viper", "bush", "chief", "stormstep"];
  if (id === 2) return ["arc", "arc", "stormstep", "viper", "arc", "peely", "chief"];
  return ["arc", "bush", "chief", "peely", "stormstep", "viper"];
}

export const SPAWN_WALL_R = 0.4;
export const SPAWN_PLAYER_R = 2.6;
export const SPAWN_ENEMY_R = 0.9;

export type SpawnPoint = { kind: EnemyKind; x: number; y: number };

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

function clearOf(
  x: number,
  y: number,
  others: Array<{ x: number; y: number }>,
  minR: number
) {
  return others.every((o) => Math.hypot(x - o.x, y - o.y) >= minR);
}

export function spawnFits(
  grid: number[][],
  x: number,
  y: number,
  opts: {
    px?: number;
    py?: number;
    others?: Array<{ x: number; y: number }>;
    wallR?: number;
    minPlayer?: number;
    minOther?: number;
  } = {}
) {
  const wallR = opts.wallR ?? SPAWN_WALL_R;
  if (!isWalkableFloor(grid, x, y, wallR)) return false;
  if (
    opts.px != null &&
    opts.py != null &&
    Math.hypot(x - opts.px, y - opts.py) < (opts.minPlayer ?? SPAWN_PLAYER_R)
  ) {
    return false;
  }
  if (opts.others && !clearOf(x, y, opts.others, opts.minOther ?? SPAWN_ENEMY_R)) {
    return false;
  }
  return true;
}

/** If the preferred point is blocked, search nearby open floor cells. */
export function findOpenSpawn(
  grid: number[][],
  preferX: number,
  preferY: number,
  opts: {
    px?: number;
    py?: number;
    others?: Array<{ x: number; y: number }>;
    wallR?: number;
    minPlayer?: number;
    minOther?: number;
  } = {}
): { x: number; y: number } | null {
  if (spawnFits(grid, preferX, preferY, opts)) {
    return { x: preferX, y: preferY };
  }
  const sx = Math.floor(preferX);
  const sy = Math.floor(preferY);
  const maxR = Math.max(MAP_W, MAP_H);
  for (let r = 1; r < maxR; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = sx + dx + 0.5;
        const y = sy + dy + 0.5;
        if (spawnFits(grid, x, y, opts)) return { x, y };
      }
    }
  }
  return null;
}

export function collectOpenCells(grid: number[][]) {
  const cells: Array<{ x: number; y: number }> = [];
  for (let y = 1; y < MAP_H - 1; y++) {
    for (let x = 1; x < MAP_W - 1; x++) {
      const cx = x + 0.5;
      const cy = y + 0.5;
      if (!isWalkableFloor(grid, cx, cy, SPAWN_WALL_R)) continue;
      if (Math.hypot(cx - SPAWN.x, cy - SPAWN.y) < SPAWN_PLAYER_R) continue;
      cells.push({ x: cx, y: cy });
    }
  }
  return cells;
}

export function pickRegularSpawns(
  grid: number[][],
  count: number,
  mix: RegularKind[] = MIX
): SpawnPoint[] {
  const roster = mix.length ? mix : MIX;
  const preferred = ENEMY_SPAWNS.map((s, i) => ({
    kind: roster[i % roster.length],
    x: s.x,
    y: s.y,
  }));
  const occupied: Array<{ x: number; y: number }> = [];
  const out: SpawnPoint[] = [];
  const tryPlace = (kind: EnemyKind, x: number, y: number) => {
    const at = findOpenSpawn(grid, x, y, {
      px: SPAWN.x,
      py: SPAWN.y,
      others: occupied,
    });
    if (!at) return false;
    out.push({ kind, x: at.x, y: at.y });
    occupied.push(at);
    return true;
  };

  for (const s of shuffle(preferred)) {
    if (out.length >= count) break;
    tryPlace(s.kind, s.x, s.y);
  }
  if (out.length < count) {
    for (const cell of shuffle(collectOpenCells(grid))) {
      if (out.length >= count) break;
      tryPlace(roster[out.length % roster.length], cell.x, cell.y);
    }
  }
  return out;
}

export function farOpenCell(
  grid: number[][],
  px: number,
  py: number,
  others: Array<{ x: number; y: number }> = []
) {
  const cells = collectOpenCells(grid).filter((c) =>
    spawnFits(grid, c.x, c.y, { px, py, others, minPlayer: 4.2 })
  );
  let best = cells[0] ?? { x: 8.5, y: 6.5 };
  let bestD = -1;
  for (const cell of cells) {
    const d = Math.hypot(cell.x - px, cell.y - py);
    if (d > bestD) {
      bestD = d;
      best = cell;
    }
  }
  return (
    findOpenSpawn(grid, best.x, best.y, { px, py, others, minPlayer: 3.2 }) ??
    best
  );
}
