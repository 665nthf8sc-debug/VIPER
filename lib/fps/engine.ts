import {
  buildFloorCanvas,
  buildSkyCanvas,
  buildWallTextures,
  type WallTexId,
} from "@/lib/fps/textures";
import { loadHdEnemySprites } from "@/lib/fps/sprite-loader";
import {
  buildEnemySprite,
  buildPickupSprite,
  buildWeaponView,
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

const RENDER_W = 640;
const RENDER_H = 360;
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
  const skyCanvas = buildSkyCanvas(RENDER_W, RENDER_H);
  const floorCanvas = buildFloorCanvas(RENDER_W, RENDER_H);
  let enemyTex = {
    peely: buildEnemySprite("peely"),
    chief: buildEnemySprite("chief"),
    jonesy: buildEnemySprite("jonesy"),
    fox: buildEnemySprite("fox"),
  };
  void loadHdEnemySprites(enemyTex).then((loaded) => {
    enemyTex = loaded;
  });
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
    if (rect.width < 2 || rect.height < 2) return;
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

  type SpriteDraw = {
    dist: number;
    x: number;
    y: number;
    tex: HTMLCanvasElement;
    flash: boolean;
  };

  /** Classic Wolfenstein DDA + canvas column strips (no ImageData gaps). */
  const renderWorld = (offCtx: CanvasRenderingContext2D) => {
    const w = RENDER_W;
    const h = RENDER_H;
    const half = (h / 2) | 0;
    const zBuffer = new Float32Array(w);

    offCtx.imageSmoothingEnabled = false;
    offCtx.drawImage(skyCanvas, 0, 0, w, half, 0, 0, w, half);
    offCtx.drawImage(floorCanvas, 0, 0, w, half, 0, half, w, h - half);

    const planeX = Math.cos(pa + Math.PI / 2);
    const planeY = Math.sin(pa + Math.PI / 2);

    for (let col = 0; col < w; col++) {
      const camX = (2 * col) / w - 1;
      const rayDirX = Math.cos(pa) + planeX * camX * Math.tan(FOV / 2);
      const rayDirY = Math.sin(pa) + planeY * camX * Math.tan(FOV / 2);

      let mapX = Math.floor(px);
      let mapY = Math.floor(py);
      const deltaDistX = Math.abs(1 / (rayDirX || 1e-8));
      const deltaDistY = Math.abs(1 / (rayDirY || 1e-8));

      let stepX = 0;
      let stepY = 0;
      let sideDistX = 0;
      let sideDistY = 0;

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

      let hit = 0;
      let side = 0;

      for (let step = 0; step < 48; step++) {
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

      let perpWallDist: number;
      if (side === 0) {
        perpWallDist = (mapX - px + (1 - stepX) / 2) / (rayDirX || 1e-8);
      } else {
        perpWallDist = (mapY - py + (1 - stepY) / 2) / (rayDirY || 1e-8);
      }
      perpWallDist = Math.abs(perpWallDist);
      if (perpWallDist < 0.05) perpWallDist = 0.05;
      zBuffer[col] = perpWallDist;

      const lineH = Math.min(h, (h / perpWallDist) | 0);
      const drawStart = Math.max(0, ((h - lineH) / 2) | 0);
      const drawEnd = Math.min(h, drawStart + lineH);

      let wallX: number;
      if (side === 0) wallX = py + perpWallDist * rayDirY;
      else wallX = px + perpWallDist * rayDirX;
      wallX -= Math.floor(wallX);
      if (side === 0 && rayDirX > 0) wallX = 1 - wallX;
      if (side === 1 && rayDirY < 0) wallX = 1 - wallX;

      const texId = (hit || 1) as WallTexId;
      const tex = wallTex[texId] ?? wallTex[1];
      const texX = Math.min(tex.width - 1, (wallX * tex.width) | 0);

      offCtx.drawImage(tex, texX, 0, 1, tex.height, col, drawStart, 1, drawEnd - drawStart);

      const shade = Math.min(0.7, perpWallDist / MAX_DEPTH) + (side === 1 ? 0.06 : 0);
      if (shade > 0.02) {
        offCtx.fillStyle = `rgba(0,0,10,${shade})`;
        offCtx.fillRect(col, drawStart, 1, drawEnd - drawStart);
      }
    }

    return zBuffer;
  };

  const drawSprites = (
    offCtx: CanvasRenderingContext2D,
    zBuffer: Float32Array,
    list: SpriteDraw[]
  ) => {
    list.sort((a, b) => b.dist - a.dist);
    const w = RENDER_W;
    const h = RENDER_H;
    const halfTan = Math.tan(FOV / 2);
    offCtx.imageSmoothingEnabled = false;

    for (const sp of list) {
      const dx = sp.x - px;
      const dy = sp.y - py;
      const dist = Math.max(0.4, sp.dist);
      let rel = Math.atan2(dy, dx) - pa;
      while (rel > Math.PI) rel -= Math.PI * 2;
      while (rel < -Math.PI) rel += Math.PI * 2;
      if (Math.abs(rel) > FOV * 0.58) continue;

      const tex = sp.tex;
      const aspect = tex.width / Math.max(1, tex.height);
      const spriteH = Math.abs((h / dist) | 0);
      const spriteW = Math.abs((spriteH * aspect) | 0);
      const spriteScreenX = ((w / 2) * (1 + Math.tan(rel) / halfTan)) | 0;
      const drawStartY = Math.max(0, ((h - spriteH) / 2) | 0);
      const drawEndY = Math.min(h, drawStartY + spriteH);
      const drawStartX = Math.max(0, spriteScreenX - (spriteW >> 1));
      const drawEndX = Math.min(w, spriteScreenX + (spriteW >> 1));
      const dark = Math.max(0.35, 1 - dist / MAX_DEPTH);

      for (let stripe = drawStartX; stripe < drawEndX; stripe++) {
        if (dist >= zBuffer[stripe]) continue;
        const texX = Math.min(
          tex.width - 1,
          (((stripe - drawStartX) * tex.width) / Math.max(1, drawEndX - drawStartX)) | 0
        );
        offCtx.save();
        offCtx.globalAlpha = dark;
        offCtx.globalCompositeOperation = "source-over";
        if (sp.flash) {
          offCtx.filter = "brightness(1.45) saturate(1.2)";
        }
        offCtx.drawImage(
          tex,
          texX,
          0,
          1,
          tex.height,
          stripe,
          drawStartY,
          1,
          drawEndY - drawStartY
        );
        offCtx.restore();
      }
    }
  };

  const off = document.createElement("canvas");
  off.width = RENDER_W;
  off.height = RENDER_H;
  const offCtx = off.getContext("2d", { alpha: false })!;
  offCtx.imageSmoothingEnabled = false;

  let gunCanvas = buildWeaponView("pickaxe", 0);
  let gunWeapon: WeaponId = "pickaxe";
  let gunFrame = -1;

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

    if (mode === "title") {
      offCtx.fillStyle = "#05000a";
      offCtx.fillRect(0, 0, RENDER_W, RENDER_H);
      offCtx.fillStyle = "#00e800";
      offCtx.font = '28px "Press Start 2P", monospace';
      offCtx.fillText("VIPER FPS", 150, 100);
      offCtx.fillStyle = "#ffcc00";
      offCtx.font = '11px "Press Start 2P", monospace';
      offCtx.fillText("RAYCAST ISLAND", 200, 140);
      offCtx.fillText("PEELY · CHIEF · JONESY", 130, 175);
      if (Math.floor(tick / 30) % 2 === 0) {
        offCtx.fillStyle = "#ff6a00";
        offCtx.fillText("CLICK OR ENTER", 190, 230);
      }
    } else {
      const zBuffer = renderWorld(offCtx);
      const sprites: SpriteDraw[] = [];

      for (const e of enemies) {
        if (!e.alive) continue;
        sprites.push({
          dist: Math.hypot(e.x - px, e.y - py),
          x: e.x,
          y: e.y,
          tex: enemyTex[e.kind],
          flash: e.flash > 0,
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
      drawSprites(offCtx, zBuffer, sprites);

      if (weapon !== gunWeapon || fireFrame !== gunFrame) {
        gunCanvas = buildWeaponView(weapon, fireFrame);
        gunWeapon = weapon;
        gunFrame = fireFrame;
      }
      offCtx.drawImage(gunCanvas, 0, RENDER_H - 140, RENDER_W, 140);

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

    ctx.imageSmoothingEnabled = false;
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
