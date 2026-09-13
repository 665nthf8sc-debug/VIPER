import { MACHINES, type MachineDef } from "@/lib/arcade/catalog";

export const WORLD_W = 5400;
export const MAIN_MAX_X = 4180;
export const SECRET_MAX_X = 5360;
export const Z_MIN = 16;
export const Z_MAX = 118;
export const PLAYER_R = 22;
export const SPEED = 280;
export const DEPTH_SPEED = 160;
export const INTERACT_RANGE = 92;

export type Vec = { x: number; z: number };

export function clampPlayer(pos: Vec, secret: boolean): Vec {
  const maxX = secret ? SECRET_MAX_X : MAIN_MAX_X;
  return {
    x: Math.max(80, Math.min(maxX, pos.x)),
    z: Math.max(Z_MIN, Math.min(Z_MAX, pos.z)),
  };
}

export function visibleMachines(secret: boolean) {
  return MACHINES.filter((m) => (secret ? true : !m.secret));
}

export function hitbox(m: MachineDef) {
  return {
    x: m.x - m.w / 2,
    z: m.z - m.d / 2,
    w: m.w,
    d: m.d,
  };
}

export function resolveCollision(pos: Vec, secret: boolean): Vec {
  let next = clampPlayer(pos, secret);
  for (const m of visibleMachines(secret)) {
    if (m.id === "secret-door" && secret) continue;
    const b = hitbox(m);
    const nearestX = Math.max(b.x, Math.min(next.x, b.x + b.w));
    const nearestZ = Math.max(b.z, Math.min(next.z, b.z + b.d));
    const dx = next.x - nearestX;
    const dz = next.z - nearestZ;
    const dist = Math.hypot(dx, dz);
    if (dist < PLAYER_R && dist > 0.0001) {
      const push = (PLAYER_R - dist) / dist;
      next = { x: next.x + dx * push, z: next.z + dz * push };
    } else if (dist === 0) {
      next = { x: next.x, z: next.z + PLAYER_R };
    }
  }
  return clampPlayer(next, secret);
}

export function nearestProp(pos: Vec, secret: boolean): MachineDef | null {
  let best: MachineDef | null = null;
  let bestD = INTERACT_RANGE;
  for (const m of visibleMachines(secret)) {
    const d = Math.hypot(pos.x - m.x, pos.z - m.z);
    if (d < bestD) {
      best = m;
      bestD = d;
    }
  }
  return best;
}

export function scaleForZ(z: number) {
  return 0.72 + (z / Z_MAX) * 0.5;
}

export function screenYForZ(z: number, height: number) {
  const ground = height * 0.62;
  return ground + z * 0.72;
}
