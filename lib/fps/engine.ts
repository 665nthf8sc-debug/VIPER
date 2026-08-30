import {
  buildFloorStrip,
  buildWallTextures,
  type WallTexId,
} from "@/lib/fps/textures";
import {
  buildEnemySprite,
  buildPickupSprite,
  buildWeaponView,
  ENEMY_NAMES,
  PICKUP_LABEL,
  type EnemyKind,
  type PickupKind,
} from "@/lib/fps/sprites";
import {
  buildMapGrid,
  ENEMY_SPAWNS,
  MAP_H,
  MAP_W,
  PICKUP_SPAWNS,
  SPAWN,
} from "@/lib/fps/map";
import { WEAPONS, weaponFromPickup, type WeaponId } from "@/lib/fps/weapons";
import { sfx } from "@/lib/sfx";

export type FpsMode = "title" | "play" | "win" | "over";

export type FpsHud = {
  mode: FpsMode;
  hp: number;
  shield: number;
  weapon: WeaponId;
  ammo: string;
  elims: number;
  banner: string;
  hasPump: boolean;
  hasScar: boolean;
  hasExotic: boolean;
};

type Enemy = {
  kind: EnemyKind;
  x: number;
  y: number;
  hp: number;
  alive: boolean;
  flash: number;
  vx: number;
  vy: number;
};

type Pickup = {
  kind: PickupKind;
  x: number;
  y: number;
  taken: boolean;
  bob: number;
};

const RENDER_W = 480;
const RENDER_H = 270;
const FOV = Math.PI / 2.8;
const MAX_DEPTH = 22;
const MOVE_SPEED = 3.4;
const SPRINT = 1.55;
const ROT_SPEED = 2.4;

function wallAt(grid: number[][], x: number, y: number) {
  const gx = Math.floor(x);
  const gy = Math.floor(y);
  if (gx < 0 || gy < 0 || gx >= MAP_W || gy >= MAP_H) return 1;
  return grid[gy][gx];
}

function isBlocked(grid: number[][], x: number, y: number, r = 0.22) {
  return (
    wallAt(grid, x - r, y - r) > 0 ||
    wallAt(grid, x + r, y - r) > 0 ||
    wallAt(grid, x - r, y + r) > 0 ||
    wallAt(grid, x + r, y + r) > 0
  );
}

export function mountFps(
  canvas: HTMLCanvasElement,
  onHud: (h: FpsHud) => void
) {
  const ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.imageSmoothingEnabled = false;

  const grid = buildMapGrid();
  const wallTex = buildWallTextures();
  const floorTex = buildFloorStrip(256);
  const enemyTex = {
    peely: buildEnemySprite("peely"),
    chief: buildEnemySprite("chief"),
    jonesy: buildEnemySprite("jonesy"),
    fox: buildEnemySprite("fox"),
  };
  const pickupTex = {
    pump: buildPickupSprite("pump"),
    scar: buildPickupSprite("scar"),
    exotic: buildPickupSprite("exotic"),
    med: buildPickupSprite("med"),
    shield: buildPickupSprite("shield"),
    llama: buildPickupSprite("llama"),
  };

  let mode: FpsMode = "title";
  let px = SPAWN.x;
  let py = SPAWN.y;
  let pa = SPAWN.angle;
  let hp = 100;
  let shield = 50;
  let elims = 0;
  let weapon: WeaponId = "pickaxe";
  let owned = new Set<WeaponId>(["pickaxe"]);
  let cool = 0;
  let fireFrame = 0;
  let banner = "";
  let bannerT = 0;
  let hurtFlash = 0;
  let running = true;
  let raf = 0;
  let tick = 0;

  let enemies: Enemy[] = ENEMY_SPAWNS.map((s) => ({
    kind: s.kind,
    x: s.x,
    y: s.y,
    hp: s.kind === "chief" ? 120 : 90,
    alive: true,
    flash: 0,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
  }));

  let pickups: Pickup[] = PICKUP_SPAWNS.map((s) => ({
    kind: s.kind,
    x: s.x,
    y: s.y,
    taken: false,
    bob: Math.random() * Math.PI * 2,
  }));

  const keys = new Set<string>();
  let mouseDx = 0;
  let firing = false;
  let pointerLocked = false;

  const pushHud = () => {
    onHud({
      mode,
      hp,
      shield,
      weapon,
      ammo: weapon === "pickaxe" ? "MELEE" : "∞",
      elims,
      banner: bannerT > 0 ? banner : "",
      hasPump: owned.has("pump"),
      hasScar: owned.has("scar"),
      hasExotic: owned.has("exotic"),
    });
  };

  const reset = () => {
    px = SPAWN.x;
    py = SPAWN.y;
    pa = SPAWN.angle;
    hp = 100;
    shield = 50;
    elims = 0;
    weapon = "pickaxe";
    owned = new Set<WeaponId>(["pickaxe"]);
    cool = 0;
    fireFrame = 0;
    banner = "LOOT THE ISLAND";
    bannerT = 120;
    hurtFlash = 0;
    enemies = ENEMY_SPAWNS.map((s) => ({
      kind: s.kind,
      x: s.x,
      y: s.y,
      hp: s.kind === "chief" ? 120 : 90,
      alive: true,
      flash: 0,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
    }));
    pickups = PICKUP_SPAWNS.map((s) => ({
      kind: s.kind,
      x: s.x,
      y: s.y,
      taken: false,
      bob: Math.random() * Math.PI * 2,
    }));
    mode = "play";
    pushHud();
    sfx.start();
  };

  const finish = (win: boolean) => {
    mode = win ? "win" : "over";
    banner = win ? "VICTORY ROYALE" : "ELIMINATED";
    bannerT = 999;
    pushHud();
    sfx.gameOver();
    if (document.pointerLockElement === canvas) document.exitPointerLock();
  };

  const tryPickup = () => {
    for (const p of pickups) {
      if (p.taken) continue;
      const d = Math.hypot(p.x - px, p.y - py);
      if (d > 1.1) continue;
      if (p.kind === "pump" || p.kind === "scar" || p.kind === "exotic") {
        const w = weaponFromPickup(p.kind);
        owned.add(w);
        weapon = w;
        banner = PICKUP_LABEL[p.kind];
        bannerT = 90;
        p.taken = true;
        sfx.coin();
      } else if (p.kind === "med") {
        hp = Math.min(100, hp + 50);
        p.taken = true;
        banner = "MEDKIT +50";
        bannerT = 60;
        sfx.revive();
      } else if (p.kind === "shield") {
        shield = Math.min(100, shield + 35);
        p.taken = true;
        banner = "SHIELD +35";
        bannerT = 60;
        sfx.xp();
      } else if (p.kind === "llama") {
        shield = Math.min(100, shield + 25);
        hp = Math.min(100, hp + 25);
        owned.add("scar");
        weapon = "scar";
        p.taken = true;
        banner = "LLAMA LOOT";
        bannerT = 90;
        sfx.coin();
      }
      pushHud();
      return;
    }
  };

  const damageEnemy = (e: Enemy, dmg: number) => {
    e.hp -= dmg;
    e.flash = 8;
    if (e.hp <= 0) {
      e.alive = false;
      elims += 1;
      sfx.ko();
      if (enemies.every((x) => !x.alive)) finish(true);
    } else {
      sfx.hit();
    }
  };

  const shoot = () => {
    if (cool > 0 || mode !== "play") return;
    const w = WEAPONS[weapon];
    cool = w.cool;
    fireFrame = 6;
    sfx.shoot();

    for (let p = 0; p < w.pellets; p++) {
      const ang = pa + (Math.random() - 0.5) * w.spread;
      let best: Enemy | null = null;
      let bestDist = w.range;
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.x - px;
        const dy = e.y - py;
        const dist = Math.hypot(dx, dy);
        if (dist > w.range) continue;
        const ea = Math.atan2(dy, dx);
        let da = ea - ang;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        const aim = Math.abs(da) < 0.28 + (w.range - dist) * 0.02;
        if (aim && dist < bestDist) {
          best = e;
          bestDist = dist;
        }
      }
      if (best) damageEnemy(best, w.dmg);
    }
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const onKey = (e: KeyboardEvent, down: boolean) => {
    if (down) keys.add(e.code);
    else keys.delete(e.code);
    if (down && e.code === "Enter" && mode === "title") reset();
    if (down && e.code === "KeyE" && mode === "play") tryPickup();
    if (down && e.code === "Digit1" && owned.has("pickaxe")) weapon = "pickaxe";
    if (down && e.code === "Digit2" && owned.has("pump")) weapon = "pump";
    if (down && e.code === "Digit3" && owned.has("scar")) weapon = "scar";
    if (down && e.code === "Digit4" && owned.has("exotic")) weapon = "exotic";
    if (down && ["Digit1", "Digit2", "Digit3", "Digit4", "KeyE"].includes(e.code)) {
      sfx.select();
      pushHud();
    }
  };
  const down = (e: KeyboardEvent) => onKey(e, true);
  const up = (e: KeyboardEvent) => onKey(e, false);
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);

  const onMouseMove = (e: MouseEvent) => {
    if (pointerLocked) mouseDx += e.movementX;
  };
  window.addEventListener("mousemove", onMouseMove);

  const onClick = () => {
    if (mode === "win" || mode === "over") {
      reset();
      return;
    }
    if (mode === "title") {
      reset();
      return;
    }
    if (mode !== "play") return;
    if (!pointerLocked) canvas.requestPointerLock();
    else shoot();
  };
  canvas.addEventListener("click", onClick);

  const onPointer = () => {
    pointerLocked = document.pointerLockElement === canvas;
  };
  document.addEventListener("pointerlockchange", onPointer);

  const onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) firing = true;
  };
  const onMouseUp = () => {
    firing = false;
  };
  canvas.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);

  const castRays = (buf: ImageData) => {
    const w = RENDER_W;
    const h = RENDER_H;
    const halfH = h / 2;
    const zBuffer = new Float32Array(w);

    for (let col = 0; col < w; col++) {
      const camX = (2 * col) / w - 1;
      const rayAng = pa + Math.atan(camX * Math.tan(FOV / 2));
      const sin = Math.sin(rayAng);
      const cos = Math.cos(rayAng);

      let mapX = Math.floor(px);
      let mapY = Math.floor(py);
      const deltaDistX = Math.abs(1 / (cos || 1e-6));
      const deltaDistY = Math.abs(1 / (sin || 1e-6));

      let stepX = 0;
      let stepY = 0;
      let sideDistX = 0;
      let sideDistY = 0;

      if (cos < 0) {
        stepX = -1;
        sideDistX = (px - mapX) * deltaDistX;
      } else {
        stepX = 1;
        sideDistX = (mapX + 1 - px) * deltaDistX;
      }
      if (sin < 0) {
        stepY = -1;
        sideDistY = (py - mapY) * deltaDistY;
      } else {
        stepY = 1;
        sideDistY = (mapY + 1 - py) * deltaDistY;
      }

      let hit = 0;
      let side = 0;
      let dist = 0;

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
        hit = wallAt(grid, mapX, mapY);
        if (hit > 0) break;
      }

      if (side === 0) dist = (mapX - px + (1 - stepX) / 2) / (cos || 1e-6);
      else dist = (mapY - py + (1 - stepY) / 2) / (sin || 1e-6);
      dist = Math.max(0.001, Math.min(MAX_DEPTH, dist));
      zBuffer[col] = dist;

      const lineH = Math.min(h, Math.floor(h / dist));
      const y0 = Math.max(0, halfH - lineH / 2);
      const y1 = Math.min(h, halfH + lineH / 2);

      const ceilGrad = 1 - col / w;
      for (let y = 0; y < y0; y++) {
        const idx = (y * w + col) * 4;
        const t = y / halfH;
        buf.data[idx] = 26 + t * 40 + ceilGrad * 20;
        buf.data[idx + 1] = 80 + t * 90 + ceilGrad * 30;
        buf.data[idx + 2] = 136 + t * 60;
        buf.data[idx + 3] = 255;
      }

      let wallX: number;
      if (side === 0) wallX = py + dist * sin;
      else wallX = px + dist * cos;
      wallX -= Math.floor(wallX);
      const texId = hit as WallTexId;
      const tex = wallTex[texId] ?? wallTex[1];
      const u = side === 0 && cos > 0 ? 1 - wallX : wallX;
      const shadeAmt = Math.min(0.72, dist / MAX_DEPTH) + (side === 1 ? 0.08 : 0);

      for (let y = y0; y < y1; y++) {
        const v = (y - y0) / Math.max(1, y1 - y0);
        const ty = Math.floor(v * tex.height) % tex.height;
        const tx = Math.floor(u * tex.width) % tex.width;
        const tctx = tex.getContext("2d")!;
        const d = tctx.getImageData(tx, ty, 1, 1).data;
        const idx = (y * w + col) * 4;
        const dark = 1 - shadeAmt;
        buf.data[idx] = d[0] * dark;
        buf.data[idx + 1] = d[1] * dark;
        buf.data[idx + 2] = d[2] * dark;
        buf.data[idx + 3] = 255;
      }

      for (let y = y1; y < h; y++) {
        const idx = (y * w + col) * 4;
        const fy = y - y1;
        const fh = h - y1;
        const ft = fy / Math.max(1, fh);
        const fctx = floorTex.getContext("2d")!;
        const fty = Math.floor(ft * floorTex.height) % floorTex.height;
        const ftx = Math.floor(((col / w) + dist * 0.02) * floorTex.width) % floorTex.width;
        const fd = fctx.getImageData(ftx, fty, 1, 1).data;
        const dark = 0.55 + ft * 0.35;
        buf.data[idx] = fd[0] * dark * (1 - dist / MAX_DEPTH * 0.5);
        buf.data[idx + 1] = fd[1] * dark * (1 - dist / MAX_DEPTH * 0.5);
        buf.data[idx + 2] = fd[2] * dark * (1 - dist / MAX_DEPTH * 0.5);
        buf.data[idx + 3] = 255;
      }
    }

    return zBuffer;
  };

  type SpriteDraw = {
    dist: number;
    x: number;
    y: number;
    tex: HTMLCanvasElement;
    flash: boolean;
    label?: string;
  };

  const drawSprites = (
    buf: ImageData,
    zBuffer: Float32Array,
    list: SpriteDraw[]
  ) => {
    list.sort((a, b) => b.dist - a.dist);
    const w = RENDER_W;
    const h = RENDER_H;
    const halfTan = Math.tan(FOV / 2);
    for (const sp of list) {
      const dx = sp.x - px;
      const dy = sp.y - py;
      const dist = sp.dist;
      let rel = Math.atan2(dy, dx) - pa;
      while (rel > Math.PI) rel -= Math.PI * 2;
      while (rel < -Math.PI) rel += Math.PI * 2;
      if (Math.abs(rel) > FOV * 0.55) continue;

      const spriteScreenX = Math.floor(w / 2 * (1 + Math.tan(rel) / halfTan));
      const spriteH = Math.abs(Math.floor(h / dist));
      const spriteW = spriteH;
      const drawY0 = Math.max(0, Math.floor(-spriteH / 2 + h / 2));
      const drawY1 = Math.min(h, Math.floor(spriteH / 2 + h / 2));
      const drawX0 = Math.max(0, Math.floor(-spriteW / 2 + spriteScreenX));
      const drawX1 = Math.min(w, Math.floor(spriteW / 2 + spriteScreenX));

      const tex = sp.tex;
      for (let stripe = drawX0; stripe < drawX1; stripe++) {
        if (stripe < 0 || stripe >= w || dist >= zBuffer[stripe]) continue;
        const texX = Math.floor(
          ((stripe - drawX0) * tex.width) / Math.max(1, drawX1 - drawX0)
        );
        for (let y = drawY0; y < drawY1; y++) {
          const d = y - drawY0;
          const texY = Math.floor(
            (d * tex.height) / Math.max(1, drawY1 - drawY0)
          );
          const tctx = tex.getContext("2d")!;
          const pxData = tctx.getImageData(texX, texY, 1, 1).data;
          if (pxData[3] < 8 && pxData[0] === 0 && pxData[1] === 0 && pxData[2] === 0) {
            const lum = pxData[0] + pxData[1] + pxData[2];
            if (lum < 4) continue;
          }
          const idx = (y * w + stripe) * 4;
          const dark = Math.max(0.28, 1 - dist / MAX_DEPTH);
          buf.data[idx] = Math.min(255, pxData[0] * dark + (sp.flash ? 60 : 0));
          buf.data[idx + 1] = Math.min(255, pxData[1] * dark + (sp.flash ? 20 : 0));
          buf.data[idx + 2] = Math.min(255, pxData[2] * dark);
          buf.data[idx + 3] = 255;
        }
      }
    }
  };

  const off = document.createElement("canvas");
  off.width = RENDER_W;
  off.height = RENDER_H;
  const offCtx = off.getContext("2d")!;

  let last = performance.now();

  const loop = (now: number) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    tick += 1;

    if (mode === "play") {
      if (mouseDx !== 0) {
        pa += mouseDx * 0.0028;
        mouseDx = 0;
      }
      if (keys.has("ArrowLeft") || keys.has("KeyQ")) pa -= ROT_SPEED * dt;
      if (keys.has("ArrowRight")) pa += ROT_SPEED * dt;

      const sprint = keys.has("ShiftLeft") || keys.has("ShiftRight");
      const spd = MOVE_SPEED * dt * (sprint ? SPRINT : 1);
      let nx = px;
      let ny = py;
      if (keys.has("KeyW") || keys.has("ArrowUp")) {
        nx += Math.cos(pa) * spd;
        ny += Math.sin(pa) * spd;
      }
      if (keys.has("KeyS") || keys.has("ArrowDown")) {
        nx -= Math.cos(pa) * spd;
        ny -= Math.sin(pa) * spd;
      }
      if (keys.has("KeyA")) {
        nx += Math.cos(pa - Math.PI / 2) * spd;
        ny += Math.sin(pa - Math.PI / 2) * spd;
      }
      if (keys.has("KeyD")) {
        nx += Math.cos(pa + Math.PI / 2) * spd;
        ny += Math.sin(pa + Math.PI / 2) * spd;
      }
      if (!isBlocked(grid, nx, py)) px = nx;
      if (!isBlocked(grid, px, ny)) py = ny;

      if (firing && WEAPONS[weapon].auto) shoot();
      else if (firing && !WEAPONS[weapon].auto && cool <= 0) shoot();

      if (cool > 0) cool -= 1;
      if (fireFrame > 0) fireFrame -= 1;
      if (bannerT > 0) bannerT -= 1;
      if (hurtFlash > 0) hurtFlash -= 1;

      for (const e of enemies) {
        if (!e.alive) continue;
        if (e.flash > 0) e.flash -= 1;
        const d = Math.hypot(e.x - px, e.y - py);
        if (d < 8) {
          const ang = Math.atan2(py - e.y, px - e.x);
          e.x += Math.cos(ang) * dt * (e.kind === "chief" ? 1.5 : 1.1);
          e.y += Math.sin(ang) * dt * (e.kind === "chief" ? 1.5 : 1.1);
        } else {
          e.x += e.vx * dt;
          e.y += e.vy * dt;
          if (wallAt(grid, e.x, e.y) > 0) {
            e.vx *= -1;
            e.vy *= -1;
          }
        }
        if (d < 0.55 && tick % 30 === 0) {
          let dmg = 12;
          if (shield > 0) {
            const soak = Math.min(shield, dmg);
            shield -= soak;
            dmg -= soak;
          }
          hp -= dmg;
          hurtFlash = 10;
          sfx.hit();
          if (hp <= 0) finish(false);
          pushHud();
        }
      }

      for (const p of pickups) {
        if (!p.taken) p.bob += dt * 3;
      }

      if (tick % 12 === 0) pushHud();
    }

    const buf = offCtx.createImageData(RENDER_W, RENDER_H);

    if (mode === "title") {
      for (let i = 0; i < buf.data.length; i += 4) {
        buf.data[i] = 10;
        buf.data[i + 1] = 0;
        buf.data[i + 2] = 20;
        buf.data[i + 3] = 255;
      }
      offCtx.putImageData(buf, 0, 0);
      offCtx.fillStyle = "#00e800";
      offCtx.font = '24px "Press Start 2P", monospace';
      offCtx.fillText("VIPER FPS", 100, 90);
      offCtx.fillStyle = "#ffcc00";
      offCtx.font = '10px "Press Start 2P", monospace';
      offCtx.fillText("RAYCAST ISLAND", 140, 120);
      offCtx.fillText("PEELY · CHIEF · JONESY", 88, 150);
      if (Math.floor(tick / 30) % 2 === 0) {
        offCtx.fillStyle = "#ff6a00";
        offCtx.fillText("CLICK OR ENTER", 130, 200);
      }
    } else {
      const zBuffer = castRays(buf);
      const sprites: SpriteDraw[] = [];

      for (const e of enemies) {
        if (!e.alive) continue;
        sprites.push({
          dist: Math.hypot(e.x - px, e.y - py),
          x: e.x,
          y: e.y,
          tex: enemyTex[e.kind],
          flash: e.flash > 0,
          label: ENEMY_NAMES[e.kind],
        });
      }
      for (const p of pickups) {
        if (p.taken) continue;
        sprites.push({
          dist: Math.hypot(p.x - px, p.y - py),
          x: p.x,
          y: p.y,
          tex: pickupTex[p.kind],
          flash: false,
        });
      }
      drawSprites(buf, zBuffer, sprites);
      offCtx.putImageData(buf, 0, 0);

      const gun = buildWeaponView(weapon, fireFrame);
      offCtx.drawImage(gun, 0, RENDER_H - 120, RENDER_W, 120);

      if (hurtFlash > 0) {
        offCtx.fillStyle = `rgba(224,32,32,${hurtFlash * 0.06})`;
        offCtx.fillRect(0, 0, RENDER_W, RENDER_H);
      }

      offCtx.fillStyle = "#00e800";
      offCtx.font = '8px "Press Start 2P", monospace';
      offCtx.fillText(`${Math.ceil(hp)} HP`, 12, 18);
      offCtx.fillStyle = "#3cdcff";
      offCtx.fillText(`${Math.ceil(shield)} SHD`, 12, 32);
      offCtx.fillStyle = "#ffcc00";
      offCtx.fillText(WEAPONS[weapon].name, 12, 46);
      offCtx.fillText(`ELIMS ${elims}`, RENDER_W - 110, 18);

      offCtx.strokeStyle = "rgba(255,255,255,0.85)";
      offCtx.lineWidth = 1;
      offCtx.beginPath();
      offCtx.moveTo(RENDER_W / 2 - 8, RENDER_H / 2);
      offCtx.lineTo(RENDER_W / 2 + 8, RENDER_H / 2);
      offCtx.moveTo(RENDER_W / 2, RENDER_H / 2 - 8);
      offCtx.lineTo(RENDER_W / 2, RENDER_H / 2 + 8);
      offCtx.stroke();

      if (bannerT > 0 && banner) {
        offCtx.fillStyle = "rgba(10,0,20,0.75)";
        offCtx.fillRect(80, RENDER_H / 2 - 24, RENDER_W - 160, 28);
        offCtx.fillStyle = "#ffcc00";
        offCtx.font = '8px "Press Start 2P", monospace';
        offCtx.fillText(banner.slice(0, 22), 92, RENDER_H / 2 - 6);
      }

      if (mode === "win" || mode === "over") {
        offCtx.fillStyle = "rgba(10,0,20,0.72)";
        offCtx.fillRect(0, 0, RENDER_W, RENDER_H);
        offCtx.fillStyle = mode === "win" ? "#ffcc00" : "#e02020";
        offCtx.font = '16px "Press Start 2P", monospace';
        offCtx.fillText(mode === "win" ? "VICTORY" : "ELIMINATED", 120, RENDER_H / 2);
        offCtx.fillStyle = "#ffcc00";
        offCtx.font = '10px "Press Start 2P", monospace';
        offCtx.fillText("CLICK TO RETRY", 130, RENDER_H / 2 + 36);
      }
    }

    ctx.fillStyle = "#05000a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(off, 0, 0, canvas.width, canvas.height);

    raf = requestAnimationFrame(loop);
  };

  pushHud();
  raf = requestAnimationFrame(loop);

  return {
    start: reset,
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("pointerlockchange", onPointer);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    },
  };
}
