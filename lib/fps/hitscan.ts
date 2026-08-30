/** Wall-aware hitscan for the VIPER raycast FPS. */

export type HitscanEnemy = {
  x: number;
  y: number;
  alive: boolean;
};

export function wallDistance(
  blocked: (cellX: number, cellY: number) => boolean,
  px: number,
  py: number,
  ang: number,
  maxDepth: number
): number {
  const rayDirX = Math.cos(ang);
  const rayDirY = Math.sin(ang);
  let mapX = Math.floor(px);
  let mapY = Math.floor(py);
  const deltaDistX = Math.abs(1 / (rayDirX || 1e-8));
  const deltaDistY = Math.abs(1 / (rayDirY || 1e-8));

  let stepX = 0;
  let stepY = 0;
  let sideDistX = 0;
  let sideDistY = 0;
  let side = 0;

  if (rayDirX < 0) {
    stepX = -1;
    sideDistX = (px - mapX) * deltaDistX;
  } else {
    stepX = 1;
    sideDistX = (mapX + 1 - px) * deltaDistX;
  }
  if (rayDirY < 0) {
    stepY = -1;
    sideDistY = (py - mapY) * deltaDistY;
  } else {
    stepY = 1;
    sideDistY = (mapY + 1 - py) * deltaDistY;
  }

  for (let step = 0; step < 64; step++) {
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 1;
    }
    if (blocked(mapX, mapY)) {
      const perp =
        side === 0
          ? (mapX - px + (1 - stepX) / 2) / (rayDirX || 1e-8)
          : (mapY - py + (1 - stepY) / 2) / (rayDirY || 1e-8);
      return Math.max(0.05, Math.abs(perp));
    }
  }
  return maxDepth;
}

export function hasLineOfSight(
  blocked: (cellX: number, cellY: number) => boolean,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): boolean {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  if (dist < 0.08) return true;
  const ang = Math.atan2(y1 - y0, x1 - x0);
  return wallDistance(blocked, x0, y0, ang, dist + 1) > dist - 0.2;
}

/** Perpendicular distance from an aim ray to an enemy; scales with range so a
 * visible billboard under the crosshair counts as a hit. */
export function enemyHitRadius(along: number): number {
  return Math.max(0.38, 0.32 + along * 0.02);
}

export function hitscanTarget(
  px: number,
  py: number,
  ang: number,
  range: number,
  wallDist: number,
  enemies: HitscanEnemy[]
): { index: number; dist: number } | null {
  const dirX = Math.cos(ang);
  const dirY = Math.sin(ang);
  let bestI = -1;
  let bestDist = Math.min(range, wallDist);

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e.alive) continue;
    const dx = e.x - px;
    const dy = e.y - py;
    const along = dx * dirX + dy * dirY;
    if (along < 0.04 || along >= bestDist) continue;
    const perp = Math.abs(dirX * dy - dirY * dx);
    if (perp <= enemyHitRadius(along)) {
      bestI = i;
      bestDist = along;
    }
  }

  if (bestI < 0) return null;
  return { index: bestI, dist: bestDist };
}
