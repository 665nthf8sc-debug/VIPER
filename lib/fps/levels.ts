import type { FloorTheme } from "@/lib/fps/textures";
import type { BossKind } from "@/lib/fps/sprites";

export { collectOpenCells, farOpenCell, findOpenSpawn, mixForLevel, pickRegularSpawns, MIX } from "@/lib/fps/spawn";

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
  bossGun: number;
  bossGunCool: number;
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
    bossScale: 2,
    bossMelee: 20,
    bossGun: 18,
    bossGunCool: 88,
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
    bossGun: 24,
    bossGunCool: 100,
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
    bossGun: 28,
    bossGunCool: 110,
    skyPath: "/fps/sprites/sky-level3-foundry.png",
  },
];

export function levelById(id: number) {
  return LEVELS[Math.max(0, Math.min(LEVELS.length, id) - 1)];
}
