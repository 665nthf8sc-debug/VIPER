import {
  applyHdWalls,
  buildSkyCanvas,
  buildSkyFromImage,
  buildThemeFloors,
  buildWallTextures,
  paintTitlePoster,
  type FloorSample,
  type FloorTheme,
  type WallTexId,
} from "@/lib/fps/textures";
import {
  angleFrame,
  loadBossSheets,
  loadFpsArt,
  loadLevelSkyImages,
  type AngleKind,
  type BossAngleKind,
} from "@/lib/fps/sprite-loader";
import {
  angleKindFor,
  buildEnemySprite,
  buildPickupSprite,
  buildWeaponView,
  isBossKind,
  PICKUP_LABEL,
  regularFor,
  type EnemyKind,
  type PickupKind,
} from "@/lib/fps/sprites";
import {
  buildMapGrid,
  MAP_H,
  MAP_W,
  PICKUP_SPAWNS,
  SPAWN,
} from "@/lib/fps/map";
import {
  farOpenCell,
  LEVELS,
  levelById,
  pickRegularSpawns,
  type LevelDef,
} from "@/lib/fps/levels";
import {
  formatAmmo,
  WEAPON_ORDER,
  WEAPONS,
  weaponFromPickup,
  type WeaponId,
} from "@/lib/fps/weapons";
import {
  hasLineOfSight,
  hitscanTarget,
  wallDistance,
} from "@/lib/fps/hitscan";
import { buildRadarWalls, drawMinimap } from "@/lib/fps/minimap";
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
  pumpAmmo: string;
  scarAmmo: string;
  exoticAmmo: string;
  level: number;
  levelName: string;
  remaining: number;
  bossLive: boolean;
  bossName: string;
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
  facing: number;
  boss: boolean;
  scale: number;
  speed: number;
  melee: number;
  rush: number;
  standIn: boolean;
};

type Pickup = {
  kind: PickupKind;
  x: number;
  y: number;
  taken: boolean;
  bob: number;
};

type GunAmmo = { mag: number; reserve: number };

const RENDER_W = 640;
const RENDER_H = 360;
const FOV = Math.PI / 2.8;
const MAX_DEPTH = 22;
const MOVE_SPEED = 3.4;
const SPRINT = 1.55;
const ROT_SPEED = 2.4;
const VIEW_GUN_W = 100;
const VIEW_GUN_H = 70;
const PICKUP_SCALE = 0.5;
const CHAR_SCALE = 1.15;
const PICKUP_REACH = 1.6;
const MELEE_REACH = 0.7;
const FLOOR_W = 640;
const FLOOR_H = 180;
const FLOOR_SCALE = 2.6;
type GunId = "pump" | "scar" | "exotic";

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

function emptyAmmo(): Record<GunId, GunAmmo> {
  return {
    pump: { mag: 0, reserve: 0 },
    scar: { mag: 0, reserve: 0 },
    exotic: { mag: 0, reserve: 0 },
  };
}

function ammoLine(owned: Set<WeaponId>, id: GunId, pack: GunAmmo) {
  if (!owned.has(id)) return "—";
  return formatAmmo(pack.mag, pack.reserve);
}

export function mountFps(
  canvas: HTMLCanvasElement,
  onHud: (h: FpsHud) => void
) {
  const ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.imageSmoothingEnabled = false;

  const grid = buildMapGrid();
  const wallTex = buildWallTextures();
  const themeWalls: Record<FloorTheme, HTMLCanvasElement> = {
    outdoor: wallTex[4],
    indoor: wallTex[2],
    industrial: wallTex[3],
  };
  let skyCanvas = buildSkyCanvas(RENDER_W, RENDER_H);
  let stormSky = skyCanvas;
  let floorTiles = buildThemeFloors([], []);
  let themeFloors = floorTiles;
  let titleArt: HTMLCanvasElement | null = null;
  let radarWalls = buildRadarWalls(grid, "outdoor");
  let levelTheme: FloorTheme = "outdoor";
  let levelSkies: Partial<Record<1 | 2 | 3, HTMLCanvasElement>> = {};
  let bossAngles: Partial<Record<BossAngleKind, HTMLCanvasElement[]>> = {};
  const enemyFlat: Record<"peely" | "chief" | "viper" | "stormstep" | "jonesy" | "fox", HTMLCanvasElement> = {
    peely: buildEnemySprite("peely"),
    chief: buildEnemySprite("chief"),
    viper: buildEnemySprite("viper"),
    stormstep: buildEnemySprite("stormstep"),
    jonesy: buildEnemySprite("jonesy"),
    fox: buildEnemySprite("fox"),
  };
  let enemyAngles: Partial<Record<AngleKind, HTMLCanvasElement[]>> = {};
  const pickupTex: Record<PickupKind, HTMLCanvasElement> = {
    pump: buildPickupSprite("pump"),
    scar: buildPickupSprite("scar"),
    exotic: buildPickupSprite("exotic"),
    med: buildPickupSprite("med"),
    shield: buildPickupSprite("shield"),
    llama: buildPickupSprite("llama"),
    chest: buildPickupSprite("chest"),
    ammo: buildPickupSprite("ammo"),
  };
  const gunHd: Partial<Record<WeaponId, HTMLCanvasElement>> = {};
  let level = 1;
  let bossLive = false;
  let pendingAdvance = 0;
  const applyArt = (art: Awaited<ReturnType<typeof loadFpsArt>>) => {
    enemyAngles = art.angles;
    if (art.angles.chief?.[0]) enemyFlat.chief = art.angles.chief[0];
    if (art.angles.peely?.[0]) enemyFlat.peely = art.angles.peely[0];
    if (art.angles.viper?.[0]) {
      enemyFlat.viper = art.angles.viper[0];
      enemyFlat.fox = art.angles.viper[0];
    }
    if (art.angles.stormstep?.[0]) {
      enemyFlat.stormstep = art.angles.stormstep[0];
      enemyFlat.jonesy = art.angles.stormstep[0];
    }
    const wpn = art.items.weapons;
    if (wpn?.[0]) pickupTex.scar = wpn[0];
    if (wpn?.[1]) pickupTex.pump = wpn[1];
    if (wpn?.[3]) pickupTex.exotic = wpn[3];
    if (wpn?.[7]) gunHd.pickaxe = wpn[7];
    if (wpn?.[1]) gunHd.pump = wpn[1];
    if (wpn?.[0]) gunHd.scar = wpn[0];
    if (wpn?.[3]) gunHd.exotic = wpn[3];
    if (art.items.heals?.[0]) pickupTex.med = art.items.heals[0];
    if (art.items.shields?.[0]) pickupTex.shield = art.items.shields[0];
    if (art.items.chests?.[6]) pickupTex.llama = art.items.chests[6];
    if (art.items.chests?.[0]) pickupTex.chest = art.items.chests[0];
    if (art.items.chests?.[3]) pickupTex.ammo = art.items.chests[3];
    applyHdWalls(wallTex, art.env.interiors, art.env.surfaces, art.env.walls);
    themeWalls.outdoor = wallTex[4];
    themeWalls.indoor = wallTex[2];
    themeWalls.industrial = wallTex[3];
    if (art.env.sky) {
      stormSky = buildSkyFromImage(art.env.sky, RENDER_W, RENDER_H);
    }
    floorTiles = buildThemeFloors(art.env.surfaces, art.env.interiors, art.env.floors);
    themeFloors = floorTiles;
    titleArt = art.env.title;
    paintLevelTheme(levelById(level));
  };
  const paintLevelTheme = (def: LevelDef) => {
    levelTheme = def.theme;
    const wall = themeWalls[def.theme];
    ([1, 2, 3, 4, 5, 6, 7, 8] as WallTexId[]).forEach((id) => {
      wallTex[id] = wall;
    });
    const floor = themeFloors[def.theme];
    floorTiles = { outdoor: floor, indoor: floor, industrial: floor };
    skyCanvas = levelSkies[def.id] ?? stormSky;
    radarWalls = buildRadarWalls(grid, def.theme);
  };
  const bootOptionalArt = () => {
    void loadBossSheets()
      .then((sheets) => {
        bossAngles = { ...bossAngles, ...sheets };
      })
      .catch(() => {
        /* stand-in regulars */
      });
    void loadLevelSkyImages()
      .then((skies) => {
        levelSkies = { ...levelSkies, ...skies };
        if (mode === "play") paintLevelTheme(levelById(level));
      })
      .catch(() => {
        /* keep storm sky */
      });
  };
  const bootArt = () => {
    void loadFpsArt({
      chief: enemyFlat.chief,
      peely: enemyFlat.peely,
      jonesy: enemyFlat.jonesy,
      fox: enemyFlat.fox,
    })
      .then(applyArt)
      .catch(() => {
        /* keep procedural fallbacks */
      });
    bootOptionalArt();
  };

  const enemyTexFor = (e: Enemy) => {
    const bossSheet = e.boss && isBossKind(e.kind) ? bossAngles[e.kind] : undefined;
    const sheet = bossSheet ?? enemyAngles[angleKindFor(e.kind)];
    if (sheet && sheet.length === 8) {
      const idx = angleFrame(e.facing, px, py, e.x, e.y);
      return sheet[idx] ?? sheet[0];
    }
    return enemyFlat[regularFor(e.kind)];
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
  let ammo = emptyAmmo();
  let cool = 0;
  let fireFrame = 0;
  let banner = "";
  let bannerT = 0;
  let hurtFlash = 0;
  let hurtFrom = 0;
  let shotTrace = 0;
  let shotHit = false;
  let running = true;
  let raf = 0;
  let tick = 0;
  let musicArmed = false;
  let spawnGuard = 0;

  const spawnRegular = (s: { kind: EnemyKind; x: number; y: number }): Enemy => {
    const vx = (Math.random() - 0.5) * 0.6;
    const vy = (Math.random() - 0.5) * 0.6;
    return {
      kind: s.kind,
      x: s.x,
      y: s.y,
      hp: s.kind === "chief" ? 120 : 90,
      alive: true,
      flash: 0,
      vx,
      vy,
      facing: Math.atan2(vy, vx),
      boss: false,
      scale: CHAR_SCALE,
      speed: s.kind === "chief" ? 1.5 : 1.1,
      melee: 12,
      rush: 0,
      standIn: false,
    };
  };

  let enemies: Enemy[] = [];

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
  let dragging = false;
  let pointerLocked = false;
  let inputArmed = false;
  const fpsSection = canvas.closest("#fps") ?? canvas.parentElement ?? canvas;

  const canvasHasKeys = () =>
    inputArmed ||
    document.activeElement === canvas ||
    document.pointerLockElement === canvas;

  const isLookKey = (code: string) =>
    code === "ArrowLeft" ||
    code === "ArrowRight" ||
    code === "KeyQ" ||
    code === "KeyE" ||
    code === "Comma" ||
    code === "Period";

  const isMoveKey = (code: string) =>
    code === "KeyW" ||
    code === "KeyA" ||
    code === "KeyS" ||
    code === "KeyD" ||
    code === "ArrowUp" ||
    code === "ArrowDown" ||
    code === "ShiftLeft" ||
    code === "ShiftRight";

  const isFireKey = (code: string) =>
    code === "Space" || code === "ControlLeft" || code === "ControlRight";

  const isInvKey = (code: string) =>
    code === "Digit1" ||
    code === "Digit2" ||
    code === "Digit3" ||
    code === "Digit4" ||
    code === "BracketLeft" ||
    code === "BracketRight" ||
    code === "KeyR";

  const shouldHandleKey = (e: KeyboardEvent) => {
    if (!canvasHasKeys()) return false;
    return (
      isFireKey(e.code) ||
      isLookKey(e.code) ||
      isMoveKey(e.code) ||
      isInvKey(e.code) ||
      e.code === "KeyM" ||
      e.code === "Enter"
    );
  };

  const weaponAmmo = () => {
    if (weapon === "pickaxe") return "MELEE";
    return formatAmmo(ammo[weapon].mag, ammo[weapon].reserve);
  };

  const pushHud = () => {
    onHud({
      mode,
      hp: Math.max(0, hp),
      shield: Math.max(0, shield),
      weapon,
      ammo: weaponAmmo(),
      elims,
      banner: bannerT > 0 ? banner : "",
      hasPump: owned.has("pump"),
      hasScar: owned.has("scar"),
      hasExotic: owned.has("exotic"),
      pumpAmmo: ammoLine(owned, "pump", ammo.pump),
      scarAmmo: ammoLine(owned, "scar", ammo.scar),
      exoticAmmo: ammoLine(owned, "exotic", ammo.exotic),
      level,
      levelName: levelById(level).name,
      remaining: enemies.filter((e) => e.alive && !e.boss).length,
      bossLive,
      bossName: bossLive ? levelById(level).bossName : "",
    });
  };

  const armMusic = (next: "title" | "game") => {
    sfx.unlock();
    musicArmed = true;
    sfx.playFpsMusic(next);
  };

  const addReserve = (id: GunId, amount: number) => {
    const cap = WEAPONS[id].reserveMax;
    ammo[id].reserve = Math.min(cap, ammo[id].reserve + amount);
  };

  const grantGun = (id: GunId, extra = 0) => {
    if (owned.has(id)) {
      addReserve(id, WEAPONS[id].pickupReserve + extra);
      return false;
    }
    owned.add(id);
    ammo[id].mag = WEAPONS[id].startMag;
    addReserve(id, WEAPONS[id].startReserve + extra);
    weapon = id;
    return true;
  };

  const grantChestAmmo = () => {
    addReserve("pump", 6);
    addReserve("scar", 20);
    addReserve("exotic", 10);
  };

  const cycleWeapon = (dir: 1 | -1) => {
    const have = WEAPON_ORDER.filter((id) => owned.has(id));
    if (have.length < 2) return;
    const i = have.indexOf(weapon);
    weapon = have[(i + dir + have.length) % have.length];
    sfx.select();
    pushHud();
  };

  const reload = () => {
    if (weapon === "pickaxe" || mode !== "play") return;
    const pack = ammo[weapon];
    const need = WEAPONS[weapon].magSize - pack.mag;
    if (need <= 0 || pack.reserve <= 0) return;
    const take = Math.min(need, pack.reserve);
    pack.reserve -= take;
    pack.mag += take;
    cool = Math.max(cool, 16);
    sfx.reload();
    banner = "RELOAD";
    bannerT = 40;
    pushHud();
  };

  const requestLock = () => {
    if (document.pointerLockElement === canvas) return;
    try {
      const req = canvas.requestPointerLock();
      if (req && typeof req.catch === "function") void req.catch(() => {});
    } catch {
      /* drag-look remains as fallback */
    }
  };

  const resetPickups = () => {
    pickups = PICKUP_SPAWNS.map((s) => ({
      kind: s.kind,
      x: s.x,
      y: s.y,
      taken: false,
      bob: Math.random() * Math.PI * 2,
    }));
  };

  const spawnBoss = (def: LevelDef) => {
    const at = farOpenCell(grid, px, py);
    const standIn = !bossAngles[def.bossKind];
    enemies.push({
      kind: def.bossKind,
      x: at.x,
      y: at.y,
      hp: def.bossHp,
      alive: true,
      flash: 0,
      vx: 0,
      vy: 0,
      facing: Math.atan2(py - at.y, px - at.x),
      boss: true,
      scale: def.bossScale,
      speed: 0.68,
      melee: def.bossMelee,
      rush: 0,
      standIn,
    });
    bossLive = true;
    banner = def.bossName;
    bannerT = 110;
    spawnGuard = 40;
    sfx.bossSting();
    pushHud();
  };

  const startLevel = (id: number, keepLoadout: boolean) => {
    const def = levelById(id);
    level = def.id;
    bossLive = false;
    pendingAdvance = 0;
    bootArt();
    paintLevelTheme(def);
    px = SPAWN.x;
    py = SPAWN.y;
    pa = SPAWN.angle;
    hp = 100;
    shield = 50;
    if (!keepLoadout) {
      elims = 0;
      weapon = "pickaxe";
      owned = new Set<WeaponId>(["pickaxe"]);
      ammo = emptyAmmo();
    }
    cool = 0;
    fireFrame = 0;
    banner = `LEVEL ${def.id}`;
    bannerT = 100;
    hurtFlash = 0;
    hurtFrom = 0;
    shotTrace = 0;
    shotHit = false;
    spawnGuard = 180;
    enemies = pickRegularSpawns(grid, def.regulars).map(spawnRegular);
    resetPickups();
    mode = "play";
    inputArmed = true;
    firing = false;
    dragging = false;
    mouseDx = 0;
    keys.delete("Space");
    keys.delete("ControlLeft");
    keys.delete("ControlRight");
    pushHud();
    sfx.start();
    armMusic("game");
    requestLock();
  };

  const beginRun = () => startLevel(1, false);

  const continuePlay = () => {
    if (mode === "over") startLevel(level, true);
    else beginRun();
  };

  const finish = (win: boolean) => {
    mode = win ? "win" : "over";
    banner = win ? "VICTORY ROYALE" : "ELIMINATED";
    bannerT = 999;
    pushHud();
    sfx.gameOver();
    sfx.stopFpsMusic();
    if (document.pointerLockElement === canvas) document.exitPointerLock();
  };

  const tryPickup = () => {
    for (const p of pickups) {
      if (p.taken) continue;
      const d = Math.hypot(p.x - px, p.y - py);
      if (d > PICKUP_REACH) continue;
      if (p.kind === "pump" || p.kind === "scar" || p.kind === "exotic") {
        const w = weaponFromPickup(p.kind);
        const fresh = grantGun(w);
        banner = fresh ? PICKUP_LABEL[p.kind] : `${WEAPONS[w].name} +AMMO`;
        bannerT = 90;
        p.taken = true;
        sfx.pickupGun();
      } else if (p.kind === "med") {
        hp = Math.min(100, hp + 50);
        p.taken = true;
        banner = "MEDKIT +50";
        bannerT = 60;
        sfx.medkitUse();
      } else if (p.kind === "shield") {
        shield = Math.min(100, shield + 35);
        p.taken = true;
        banner = "SHIELD +35";
        bannerT = 60;
        sfx.shieldChug();
      } else if (p.kind === "ammo") {
        grantChestAmmo();
        addReserve("scar", 10);
        p.taken = true;
        banner = "AMMO BOX";
        bannerT = 70;
        sfx.pickupAmmo();
      } else if (p.kind === "llama") {
        shield = Math.min(100, shield + 25);
        hp = Math.min(100, hp + 25);
        grantGun("scar", 20);
        grantChestAmmo();
        p.taken = true;
        banner = "LLAMA LOOT";
        bannerT = 90;
        sfx.llama();
      } else if (p.kind === "chest") {
        shield = Math.min(100, shield + 15);
        hp = Math.min(100, hp + 20);
        const fresh = grantGun("pump");
        grantChestAmmo();
        if (weapon === "pickaxe" && owned.has("pump")) weapon = "pump";
        p.taken = true;
        banner = fresh ? "CHEST LOOT" : "CHEST +AMMO";
        bannerT = 90;
        sfx.chestOpen();
      }
      pushHud();
      return;
    }
  };

  const cellBlocked = (cx: number, cy: number) => wallAt(grid, cx, cy) > 0;

  const damageEnemy = (e: Enemy, dmg: number) => {
    e.hp -= dmg;
    e.flash = 8;
    if (e.hp <= 0) {
      e.alive = false;
      elims += 1;
      sfx.ko();
      if (e.boss) {
        bossLive = false;
        if (level >= LEVELS.length) {
          finish(true);
        } else {
          banner = `LEVEL ${level + 1}`;
          bannerT = 90;
          pendingAdvance = level + 1;
          sfx.levelClear();
        }
      } else if (!bossLive && !pendingAdvance && enemies.every((x) => !x.alive || x.boss)) {
        spawnBoss(levelById(level));
      }
      pushHud();
    } else {
      sfx.hit();
    }
  };

  const applyPlayerDamage = (amount: number, fromAng: number) => {
    let dmg = amount;
    if (shield > 0) {
      const soak = Math.min(shield, dmg);
      shield = Math.max(0, shield - soak);
      dmg -= soak;
    }
    hp = Math.max(0, hp - dmg);
    hurtFlash = 10;
    hurtFrom = fromAng;
    sfx.playerHurt();
    pushHud();
    if (hp <= 0) finish(false);
  };

  const shoot = () => {
    if (cool > 0 || mode !== "play") return;
    const w = WEAPONS[weapon];
    if (weapon !== "pickaxe") {
      const pack = ammo[weapon];
      if (pack.mag <= 0) {
        cool = 10;
        sfx.dryClick();
        banner = pack.reserve > 0 ? "RELOAD [R]" : "NO AMMO";
        bannerT = 40;
        pushHud();
        return;
      }
      pack.mag -= 1;
    }
    cool = w.cool;
    fireFrame = 6;
    shotTrace = 5;
    shotHit = false;
    sfx.playWeapon(weapon);
    pushHud();

    for (let p = 0; p < w.pellets; p++) {
      const ang = pa + (Math.random() - 0.5) * w.spread;
      const wallDist = wallDistance(cellBlocked, px, py, ang, MAX_DEPTH);
      const hit = hitscanTarget(px, py, ang, w.range, wallDist, enemies);
      if (hit) {
        shotHit = true;
        damageEnemy(enemies[hit.index], w.dmg);
      }
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
    if (!shouldHandleKey(e)) return;
    e.preventDefault();
    if (down) keys.add(e.code);
    else keys.delete(e.code);
    if (down && !musicArmed) armMusic(mode === "play" ? "game" : "title");
    if (
      down &&
      (e.code === "Enter" || e.code === "Space") &&
      (mode === "title" || mode === "win" || mode === "over")
    ) {
      continuePlay();
      return;
    }
    if (down && e.code === "KeyM" && mode === "play") {
      if (pointerLocked) document.exitPointerLock();
      else requestLock();
      return;
    }
    if (down && e.code === "KeyR" && mode === "play") reload();
    if (down && e.code === "BracketLeft" && mode === "play") cycleWeapon(-1);
    if (down && e.code === "BracketRight" && mode === "play") cycleWeapon(1);
    if (down && e.code === "Digit1" && owned.has("pickaxe")) weapon = "pickaxe";
    if (down && e.code === "Digit2" && owned.has("pump")) weapon = "pump";
    if (down && e.code === "Digit3" && owned.has("scar")) weapon = "scar";
    if (down && e.code === "Digit4" && owned.has("exotic")) weapon = "exotic";
    if (down && ["Digit1", "Digit2", "Digit3", "Digit4"].includes(e.code)) {
      sfx.select();
      pushHud();
    }
  };
  const down = (e: KeyboardEvent) => onKey(e, true);
  const up = (e: KeyboardEvent) => onKey(e, false);
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);

  const onMouseMove = (e: MouseEvent) => {
    if (pointerLocked || dragging) mouseDx += e.movementX;
  };
  window.addEventListener("mousemove", onMouseMove);

  const onWheel = (e: WheelEvent) => {
    if (mode !== "play") return;
    if (!canvasHasKeys() && e.target !== canvas) return;
    e.preventDefault();
    cycleWeapon(e.deltaY > 0 ? 1 : -1);
  };
  canvas.addEventListener("wheel", onWheel, { passive: false });

  const onClick = () => {
    canvas.focus();
    inputArmed = true;
    if (!musicArmed) armMusic(mode === "play" ? "game" : "title");
    if (mode === "win" || mode === "over" || mode === "title") {
      continuePlay();
      requestLock();
      return;
    }
    if (mode === "play") {
      requestLock();
      shoot();
    }
  };
  canvas.addEventListener("click", onClick);

  const onPointer = () => {
    pointerLocked = document.pointerLockElement === canvas;
    if (pointerLocked) canvas.focus();
  };
  document.addEventListener("pointerlockchange", onPointer);

  const onMouseDown = (e: MouseEvent) => {
    canvas.focus();
    inputArmed = true;
    if (!musicArmed) armMusic(mode === "play" ? "game" : "title");
    if (e.button === 2) {
      e.preventDefault();
      if (mode === "play" && !pointerLocked) requestLock();
      dragging = true;
      return;
    }
    if (e.button === 0) {
      firing = true;
      dragging = !pointerLocked;
      if (mode === "play") requestLock();
    }
  };
  const onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) firing = false;
    if (e.button === 0 || e.button === 2) dragging = false;
  };
  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };
  const onBlur = () => {
    if (document.pointerLockElement === canvas || inputArmed) return;
    keys.clear();
    firing = false;
    dragging = false;
  };
  const onDocPointerDown = (e: PointerEvent) => {
    const t = e.target;
    if (t instanceof Node && fpsSection.contains(t)) {
      if (!musicArmed) armMusic(mode === "play" ? "game" : "title");
      return;
    }
    inputArmed = false;
    if (document.activeElement !== canvas) {
      keys.clear();
      firing = false;
      dragging = false;
    }
  };
  canvas.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);
  canvas.addEventListener("contextmenu", onContextMenu);
  canvas.addEventListener("blur", onBlur);
  document.addEventListener("pointerdown", onDocPointerDown, true);

  type SpriteDraw = {
    dist: number;
    x: number;
    y: number;
    tex: HTMLCanvasElement;
    flash: boolean;
    scale: number;
    smooth?: boolean;
    tint?: string;
  };

  const scaleCache = new WeakMap<HTMLCanvasElement, Map<string, HTMLCanvasElement>>();
  const scaledSprite = (tex: HTMLCanvasElement, w: number, h: number) => {
    const key = `${w}x${h}`;
    let bucket = scaleCache.get(tex);
    if (!bucket) {
      bucket = new Map();
      scaleCache.set(tex, bucket);
    }
    const hit = bucket.get(key);
    if (hit) return hit;
    if (bucket.size > 20) bucket.clear();
    const out = document.createElement("canvas");
    out.width = Math.max(1, w);
    out.height = Math.max(1, h);
    const sctx = out.getContext("2d")!;
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(tex, 0, 0, out.width, out.height);
    bucket.set(key, out);
    return out;
  };

  const floorBuf = document.createElement("canvas");
  floorBuf.width = FLOOR_W;
  floorBuf.height = FLOOR_H;
  const floorCtx = floorBuf.getContext("2d", { willReadFrequently: true })!;
  const floorImg = floorCtx.createImageData(FLOOR_W, FLOOR_H);
  const floorPix = floorImg.data;

  const themeAt = (): FloorTheme => levelTheme;

  const sampleFloor = (tile: FloorSample, u: number, v: number, shade: number, di: number) => {
    const mask = tile.size - 1;
    const tx = (u * tile.size) & mask;
    const ty = (v * tile.size) & mask;
    const si = (ty * tile.size + tx) * 4;
    floorPix[di] = tile.data[si] * shade;
    floorPix[di + 1] = tile.data[si + 1] * shade;
    floorPix[di + 2] = tile.data[si + 2] * shade;
    floorPix[di + 3] = 255;
  };

  const renderFloor = () => {
    const dirX = Math.cos(pa);
    const dirY = Math.sin(pa);
    const planeScale = Math.tan(FOV / 2);
    const planeX = Math.cos(pa + Math.PI / 2) * planeScale;
    const planeY = Math.sin(pa + Math.PI / 2) * planeScale;
    const posZ = FLOOR_H / 2;
    for (let y = 0; y < FLOOR_H; y++) {
      const rowDist = posZ / (y + 0.5);
      const stepX = (rowDist * (dirX + planeX - (dirX - planeX))) / FLOOR_W;
      const stepY = (rowDist * (dirY + planeY - (dirY - planeY))) / FLOOR_W;
      let floorX = px + rowDist * (dirX - planeX);
      let floorY = py + rowDist * (dirY - planeY);
      const dim = Math.max(0.32, 1 - rowDist / MAX_DEPTH);
      for (let x = 0; x < FLOOR_W; x++) {
        let u = floorX * FLOOR_SCALE;
        let v = floorY * FLOOR_SCALE;
        u -= Math.floor(u);
        v -= Math.floor(v);
        if (u < 0) u += 1;
        if (v < 0) v += 1;
        const tile = floorTiles[themeAt()];
        sampleFloor(tile, u, v, dim, (y * FLOOR_W + x) * 4);
        floorX += stepX;
        floorY += stepY;
      }
    }
    floorCtx.putImageData(floorImg, 0, 0);
  };

  /** Classic Wolfenstein DDA + canvas column strips (no ImageData gaps). */
  const renderWorld = (offCtx: CanvasRenderingContext2D) => {
    const w = RENDER_W;
    const h = RENDER_H;
    const half = (h / 2) | 0;
    const zBuffer = new Float32Array(w);

    offCtx.imageSmoothingEnabled = false;
    const skyShift = ((pa / (Math.PI * 2)) * w + w * 8) % w;
    offCtx.drawImage(skyCanvas, 0, 0, w, half, -skyShift, 0, w, half);
    offCtx.drawImage(skyCanvas, 0, 0, w, half, w - skyShift, 0, w, half);
    renderFloor();
    offCtx.drawImage(floorBuf, 0, 0, FLOOR_W, FLOOR_H, 0, half, w, h - half);

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

      const viewTheme = themeAt();
      const tex =
        viewTheme === "indoor"
          ? wallTex[2]
          : viewTheme === "industrial"
            ? wallTex[3]
            : wallTex[4];
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

    for (const sp of list) {
      const dx = sp.x - px;
      const dy = sp.y - py;
      const dist = Math.max(0.4, sp.dist);
      let rel = Math.atan2(dy, dx) - pa;
      while (rel > Math.PI) rel -= Math.PI * 2;
      while (rel < -Math.PI) rel += Math.PI * 2;
      if (Math.abs(rel) > FOV * 0.72) continue;

      const tex = sp.tex;
      const aspect = tex.width / Math.max(1, tex.height);
      const wallH = Math.max(8, Math.abs((h / dist) | 0));
      const spriteH = Math.max(8, Math.abs((wallH * sp.scale) | 0));
      const spriteW = Math.max(2, Math.abs((spriteH * aspect) | 0));
      const spriteScreenX = ((w / 2) * (1 + Math.tan(rel) / halfTan)) | 0;
      const floorY = Math.min(h, ((h + wallH) / 2) | 0);
      const drawStartY = floorY - spriteH;
      const drawStartX = spriteScreenX - (spriteW >> 1);
      const clipStartX = Math.max(0, drawStartX);
      const clipEndX = Math.min(w, drawStartX + spriteW);
      if (clipEndX <= clipStartX) continue;
      const dark = Math.max(0.35, 1 - dist / MAX_DEPTH);

      let hidden = 0;
      for (let stripe = clipStartX; stripe < clipEndX; stripe++) {
        if (dist >= zBuffer[stripe]) hidden += 1;
      }
      if (hidden >= clipEndX - clipStartX) continue;
      const occluded = hidden > 0;

      offCtx.save();
      offCtx.globalAlpha = dark;
      offCtx.globalCompositeOperation = "source-over";
      if (sp.flash) offCtx.globalAlpha = Math.min(1, dark + 0.28);

      if (sp.smooth && !occluded) {
        offCtx.imageSmoothingEnabled = true;
        offCtx.imageSmoothingQuality = "high";
        offCtx.drawImage(tex, 0, 0, tex.width, tex.height, drawStartX, drawStartY, spriteW, spriteH);
      } else if (sp.smooth) {
        const scaled = scaledSprite(tex, spriteW, spriteH);
        offCtx.imageSmoothingEnabled = false;
        for (let stripe = clipStartX; stripe < clipEndX; stripe++) {
          if (dist >= zBuffer[stripe]) continue;
          const sx = stripe - drawStartX;
          offCtx.drawImage(scaled, sx, 0, 1, scaled.height, stripe, drawStartY, 1, spriteH);
        }
      } else {
        offCtx.imageSmoothingEnabled = false;
        for (let stripe = clipStartX; stripe < clipEndX; stripe++) {
          if (dist >= zBuffer[stripe]) continue;
          const texX = Math.min(
            tex.width - 1,
            (((stripe - drawStartX) * tex.width) / Math.max(1, spriteW)) | 0
          );
          offCtx.drawImage(tex, texX, 0, 1, tex.height, stripe, drawStartY, 1, spriteH);
        }
      }
      if (sp.tint) {
        offCtx.globalCompositeOperation = "overlay";
        offCtx.globalAlpha = 0.45;
        offCtx.fillStyle = sp.tint;
        offCtx.fillRect(clipStartX, Math.max(0, drawStartY), clipEndX - clipStartX, spriteH);
      }
      offCtx.restore();
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
      if (keys.has("ArrowLeft") || keys.has("KeyQ") || keys.has("Comma")) {
        pa -= ROT_SPEED * dt;
      }
      if (keys.has("ArrowRight") || keys.has("KeyE") || keys.has("Period")) {
        pa += ROT_SPEED * dt;
      }

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
      tryPickup();

      const keyFire =
        keys.has("Space") || keys.has("ControlLeft") || keys.has("ControlRight");
      const wantFire = firing || keyFire;
      if (wantFire && WEAPONS[weapon].auto) shoot();
      else if (wantFire && !WEAPONS[weapon].auto && cool <= 0) shoot();

      if (cool > 0) cool -= 1;
      if (fireFrame > 0) fireFrame -= 1;
      if (bannerT > 0) bannerT -= 1;
      if (hurtFlash > 0) hurtFlash -= 1;
      if (shotTrace > 0) shotTrace -= 1;
      if (spawnGuard > 0) spawnGuard -= 1;
      if (pendingAdvance && bannerT <= 0) {
        const next = pendingAdvance;
        pendingAdvance = 0;
        startLevel(next, true);
      }

      let meleeAttacker: Enemy | null = null;
      let meleeDist = MELEE_REACH;
      for (const e of enemies) {
        if (!e.alive) continue;
        if (e.flash > 0) e.flash -= 1;
        const d = Math.hypot(e.x - px, e.y - py);
        if (e.boss) {
          if (e.rush > 0) e.rush -= 1;
          else if (tick % 160 === 0) e.rush = 48;
          if (e.standIn && tick % 22 < 9) e.flash = Math.max(e.flash, 3);
        }
        if (d < (e.boss ? 11 : 8) && d > 0.58) {
          const ang = Math.atan2(py - e.y, px - e.x);
          e.facing = ang;
          const step = dt * (e.rush > 0 ? e.speed * 2.6 : e.speed);
          const nx = e.x + Math.cos(ang) * step;
          const ny = e.y + Math.sin(ang) * step;
          if (!isBlocked(grid, nx, e.y, 0.18)) e.x = nx;
          if (!isBlocked(grid, e.x, ny, 0.18)) e.y = ny;
        } else if (d >= (e.boss ? 11 : 8)) {
          const nx = e.x + e.vx * dt;
          const ny = e.y + e.vy * dt;
          if (!isBlocked(grid, nx, e.y, 0.18)) e.x = nx;
          else e.vx *= -1;
          if (!isBlocked(grid, e.x, ny, 0.18)) e.y = ny;
          else e.vy *= -1;
          if (Math.abs(e.vx) + Math.abs(e.vy) > 0.01) e.facing = Math.atan2(e.vy, e.vx);
        }
        if (
          spawnGuard <= 0 &&
          d < meleeDist &&
          hasLineOfSight(cellBlocked, e.x, e.y, px, py)
        ) {
          meleeAttacker = e;
          meleeDist = d;
        }
      }
      if (meleeAttacker && tick % (meleeAttacker.boss ? 26 : 36) === 0) {
        applyPlayerDamage(
          meleeAttacker.melee,
          Math.atan2(meleeAttacker.y - py, meleeAttacker.x - px)
        );
      }

      for (let i = 0; i < enemies.length; i++) {
        const a = enemies[i];
        if (!a.alive) continue;
        for (let j = i + 1; j < enemies.length; j++) {
          const b = enemies[j];
          if (!b.alive) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const sep = Math.hypot(dx, dy);
          if (sep >= 0.55 || sep < 0.01) continue;
          const push = ((0.55 - sep) / sep) * 0.5;
          const ax = a.x - dx * push;
          const ay = a.y - dy * push;
          const bx = b.x + dx * push;
          const by = b.y + dy * push;
          if (!isBlocked(grid, ax, a.y, 0.18)) a.x = ax;
          if (!isBlocked(grid, a.x, ay, 0.18)) a.y = ay;
          if (!isBlocked(grid, bx, b.y, 0.18)) b.x = bx;
          if (!isBlocked(grid, b.x, by, 0.18)) b.y = by;
        }
      }

      for (const p of pickups) {
        if (!p.taken) p.bob += dt * 3;
      }

      if (tick % 12 === 0) pushHud();
    }

    if (mode === "title") {
      paintTitlePoster(offCtx, RENDER_W, RENDER_H, tick, titleArt);
    } else {
      const zBuffer = renderWorld(offCtx);
      const sprites: SpriteDraw[] = [];

      for (const e of enemies) {
        if (!e.alive) continue;
        sprites.push({
          dist: Math.hypot(e.x - px, e.y - py),
          x: e.x,
          y: e.y,
          tex: enemyTexFor(e),
          flash: e.flash > 0,
          scale: e.scale,
          smooth: true,
          tint: e.standIn
            ? e.kind === "bossPeely"
              ? "#ffe14a"
              : e.kind === "bossStorm"
                ? "#3cdcff"
                : "#d4af37"
            : undefined,
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
          scale: PICKUP_SCALE,
        });
      }
      drawSprites(offCtx, zBuffer, sprites);

      const kick = fireFrame > 0 ? fireFrame * 2 : 0;
      const hdGun = gunHd[weapon];
      const gx = RENDER_W - VIEW_GUN_W - 16;
      const gy = RENDER_H - VIEW_GUN_H - 8 + kick;
      if (hdGun) {
        offCtx.drawImage(hdGun, gx, gy, VIEW_GUN_W, VIEW_GUN_H);
      } else {
        if (weapon !== gunWeapon || fireFrame !== gunFrame) {
          gunCanvas = buildWeaponView(weapon, fireFrame);
          gunWeapon = weapon;
          gunFrame = fireFrame;
        }
        offCtx.drawImage(gunCanvas, gx, gy, VIEW_GUN_W, VIEW_GUN_H);
      }
      if (fireFrame > 0) {
        offCtx.fillStyle = `rgba(255,210,90,${0.28 + fireFrame * 0.08})`;
        offCtx.fillRect(RENDER_W - 40, RENDER_H - 52 + kick, 18, 10);
        offCtx.fillStyle = `rgba(255,255,200,${fireFrame * 0.1})`;
        offCtx.fillRect(RENDER_W - 34, RENDER_H - 56 + kick, 8, 6);
      }
      if (shotTrace > 0) {
        offCtx.strokeStyle = shotHit
          ? `rgba(255,220,80,${0.25 + shotTrace * 0.12})`
          : `rgba(255,255,255,${0.12 + shotTrace * 0.06})`;
        offCtx.lineWidth = 1;
        offCtx.beginPath();
        offCtx.moveTo(RENDER_W - 32, RENDER_H - 46 + kick);
        offCtx.lineTo(RENDER_W / 2 + (shotHit ? 0 : 2), RENDER_H / 2);
        offCtx.stroke();
        if (shotHit) {
          const cx = RENDER_W / 2;
          const cy = RENDER_H / 2;
          offCtx.strokeStyle = "#ffcc00";
          offCtx.beginPath();
          offCtx.moveTo(cx - 7, cy - 7);
          offCtx.lineTo(cx - 2, cy - 2);
          offCtx.moveTo(cx + 7, cy - 7);
          offCtx.lineTo(cx + 2, cy - 2);
          offCtx.moveTo(cx - 7, cy + 7);
          offCtx.lineTo(cx - 2, cy + 2);
          offCtx.moveTo(cx + 7, cy + 7);
          offCtx.lineTo(cx + 2, cy + 2);
          offCtx.stroke();
        }
      }

      if (hurtFlash > 0) {
        offCtx.fillStyle = `rgba(224,32,32,${hurtFlash * 0.025})`;
        offCtx.fillRect(0, 0, RENDER_W, RENDER_H);
        let rel = hurtFrom - pa;
        while (rel > Math.PI) rel -= Math.PI * 2;
        while (rel < -Math.PI) rel += Math.PI * 2;
        const edge = `rgba(255,48,32,${hurtFlash * 0.09})`;
        offCtx.fillStyle = edge;
        if (rel > 0.45) offCtx.fillRect(RENDER_W - 16, 0, 16, RENDER_H);
        else if (rel < -0.45) offCtx.fillRect(0, 0, 16, RENDER_H);
        else if (Math.abs(rel) > 2.1) {
          offCtx.fillRect(0, 0, RENDER_W, 16);
          offCtx.fillStyle = "#ffcc00";
          offCtx.font = '8px "Press Start 2P", monospace';
          offCtx.fillText("HIT BEHIND", RENDER_W / 2 - 52, 28);
        } else offCtx.fillRect(0, RENDER_H - 16, RENDER_W, 16);
      }

      offCtx.fillStyle = "#00e800";
      offCtx.font = '8px "Press Start 2P", monospace';
      offCtx.fillText(`${Math.max(0, Math.ceil(hp))} HP`, 12, 18);
      offCtx.fillStyle = "#3cdcff";
      offCtx.fillText(`${Math.max(0, Math.ceil(shield))} SHD`, 12, 32);
      offCtx.fillStyle = "#ffcc00";
      offCtx.fillText(WEAPONS[weapon].name, 12, 46);
      offCtx.fillStyle = "#f8f0d8";
      offCtx.fillText(weaponAmmo(), 12, 60);
      offCtx.fillStyle = "#ffcc00";
      offCtx.fillText(`LEVEL ${level}`, 12, 74);
      offCtx.fillStyle = bossLive ? "#ff2a6a" : "#f8f0d8";
      offCtx.fillText(
        bossLive ? "BOSS" : `REMAIN ${enemies.filter((e) => e.alive && !e.boss).length}`,
        12,
        88
      );
      offCtx.fillStyle = "#ffcc00";
      offCtx.fillText(`ELIMS ${elims}`, RENDER_W - 110, 18);
      drawMinimap(offCtx, {
        wallMap: radarWalls,
        px,
        py,
        pa,
        fov: FOV,
        enemies,
        viewW: RENDER_W,
      });

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
        offCtx.fillText(
          mode === "over" ? "RETRY LEVEL" : "ENTER / SPACE / CLICK",
          mode === "over" ? 200 : 118,
          RENDER_H / 2 + 36
        );
      }
    }

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#05000a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(off, 0, 0, canvas.width, canvas.height);

    raf = requestAnimationFrame(loop);
  };

  pushHud();
  bootArt();
  raf = requestAnimationFrame(loop);

  return {
    start: continuePlay,
    lockPointer: requestLock,
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      sfx.stopFpsMusic();
      ro.disconnect();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("contextmenu", onContextMenu);
      canvas.removeEventListener("blur", onBlur);
      document.removeEventListener("pointerdown", onDocPointerDown, true);
      document.removeEventListener("pointerlockchange", onPointer);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    },
  };
}
