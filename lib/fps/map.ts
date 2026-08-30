import type { FloorTheme } from "@/lib/fps/textures";
import { wallThemeFor } from "@/lib/fps/textures";

/** Island outpost — outdoor border, indoor villas/cabins, industrial shacks. */
export const MAP_W = 32;
export const MAP_H = 32;
export const CELL = 1;

const RAW = `
44444444444444444444444444444444
4..............44..............4
4..2222................2222....4
4..2..2....3333........2..2....4
4..2..2....3..3........2..2....4
4..2222....3..3........2222....4
4..........3333................4
4..............................4
4....4444..........5555555.....4
4....4..4..........5.....5.....4
4....4..4..........5..5..5.....4
4....4444..........5.....5.....4
4..................5555555.....4
4..............................4
4..1111........................4
4..1..1..........2222222.......4
4..1..1..........2.....2.......4
4..1111..........2..2..2.......4
4................2.....2.......4
4................2222222.......4
4..............................4
4........3333..................4
4........3..3....4444..........4
4........3333....4..4..........4
4................4444..........4
4..............................4
4....55555.....................4
4....5...5....1111111..........4
4....5.5.5....1.....1..........4
4....5...5....1.....1..........4
4....55555....1111111..........4
44444444444444444444444444444444
`.trim();

export function buildMapGrid() {
  const lines = RAW.split("\n").map((l) => l.trim());
  const grid: number[][] = [];
  for (let y = 0; y < MAP_H; y++) {
    const row: number[] = [];
    for (let x = 0; x < MAP_W; x++) {
      const ch = lines[y]?.[x] ?? "4";
      row.push(ch === "." ? 0 : Number(ch));
    }
    grid.push(row);
  }
  return grid;
}

/** Classify empty cells: enclosed rooms inherit the surrounding wall theme. */
export function buildFloorThemes(grid: number[][]): FloorTheme[][] {
  const themes: FloorTheme[][] = Array.from({ length: MAP_H }, () =>
    Array<FloorTheme>(MAP_W).fill("outdoor")
  );
  const vis = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (grid[y][x] > 0 || vis[y][x]) continue;
      const cells: Array<[number, number]> = [];
      const wallHits = new Map<number, number>();
      const q: Array<[number, number]> = [[x, y]];
      vis[y][x] = true;
      for (let i = 0; i < q.length; i++) {
        const [cx, cy] = q[i];
        cells.push([cx, cy]);
        for (const [dx, dy] of dirs) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
          const cell = grid[ny][nx];
          if (cell > 0) {
            wallHits.set(cell, (wallHits.get(cell) ?? 0) + 1);
          } else if (!vis[ny][nx]) {
            vis[ny][nx] = true;
            q.push([nx, ny]);
          }
        }
      }
      if (cells.length > 48) continue;
      let best = 0;
      let bestN = 0;
      for (const [id, n] of wallHits) {
        if (n > bestN) {
          best = id;
          bestN = n;
        }
      }
      const theme = wallThemeFor(best);
      for (const [cx, cy] of cells) themes[cy][cx] = theme;
    }
  }
  return themes;
}

export const SPAWN = { x: 16.5, y: 16.5, angle: -Math.PI / 2 };

export const ENEMY_SPAWNS: Array<{
  kind: "peely" | "chief" | "viper" | "stormstep";
  x: number;
  y: number;
}> = [
  { kind: "peely", x: 8.5, y: 6.5 },
  { kind: "chief", x: 24.5, y: 7.5 },
  { kind: "stormstep", x: 6.5, y: 22.5 },
  { kind: "viper", x: 25.5, y: 20.5 },
  { kind: "peely", x: 16.5, y: 4.5 },
  { kind: "chief", x: 4.5, y: 14.5 },
  { kind: "stormstep", x: 27.5, y: 14.5 },
  { kind: "viper", x: 16.5, y: 27.5 },
];

export const PICKUP_SPAWNS: Array<{
  kind: "pump" | "scar" | "exotic" | "med" | "shield" | "llama" | "chest" | "ammo";
  x: number;
  y: number;
}> = [
  { kind: "pump", x: 10.5, y: 10.5 },
  { kind: "scar", x: 22.5, y: 11.5 },
  { kind: "exotic", x: 16.5, y: 8.5 },
  { kind: "med", x: 7.5, y: 17.5 },
  { kind: "shield", x: 24.5, y: 17.5 },
  { kind: "llama", x: 16.5, y: 22.5 },
  { kind: "chest", x: 12.5, y: 25.5 },
  { kind: "med", x: 20.5, y: 25.5 },
  { kind: "chest", x: 5.5, y: 10.5 },
  { kind: "shield", x: 27.5, y: 22.5 },
  { kind: "ammo", x: 14.5, y: 14.5 },
  { kind: "ammo", x: 19.5, y: 6.5 },
  { kind: "ammo", x: 8.5, y: 20.5 },
  { kind: "ammo", x: 26.5, y: 12.5 },
  { kind: "ammo", x: 4.5, y: 26.5 },
];
