import * as THREE from "three";
import { equippedSkin, grantPlayXp, recordDrop, recordElims, recordWin } from "@/lib/pass";
import {
  addFortniteSky,
  makeBuilding,
  makeBus,
  makeChest,
  makeCloud,
  makeFighter,
  makeGrassField,
  makePickaxe,
  makeRifle,
  makeShotgun,
  makeTree,
  markShadow,
  phong,
  toon,
  type FighterStyle,
} from "@/lib/royale/look";
import { RoyaleScore } from "@/lib/royale/score";
import { sfx } from "@/lib/sfx";

export type RoyaleMode = "title" | "bus" | "drop" | "play" | "over" | "win";
export type RoyaleWeapon = "pickaxe" | "ar" | "shotgun";

export type RoyaleHud = {
  mode: RoyaleMode;
  hp: number;
  shield: number;
  mats: number;
  weapon: RoyaleWeapon;
  playersLeft: number;
  elims: number;
  stormR: number;
  banner: string;
  grounded: boolean;
};

const ISLAND_R = 72;
const GRAVITY = 28;
const JUMP = 9.2;

type BoxCol = { minX: number; maxX: number; minZ: number; maxZ: number };

type Bot = {
  mesh: THREE.Group;
  hp: number;
  yaw: number;
  cool: number;
  vx: number;
  vz: number;
  wander: number;
  alive: boolean;
};

type Tree = {
  mesh: THREE.Group;
  x: number;
  z: number;
  hp: number;
};

function dist2(ax: number, az: number, bx: number, bz: number) {
  const dx = ax - bx;
  const dz = az - bz;
  return Math.hypot(dx, dz);
}

function fighterStyle(): FighterStyle {
  const id = equippedSkin().sprite;
  if (id === "peely" || id === "chief" || id === "jonesy") return id;
  return "fox";
}

function swingLegs(group: THREE.Group, moving: boolean, t: number) {
  const l = group.userData.legL as THREE.Mesh | undefined;
  const r = group.userData.legR as THREE.Mesh | undefined;
  if (!l || !r) return;
  const a = moving ? Math.sin(t * 10) * 0.55 : 0;
  l.rotation.x = a;
  r.rotation.x = -a;
}

function collide(x: number, z: number, boxes: BoxCol[], rad = 0.42) {
  for (const b of boxes) {
    const nx = Math.max(b.minX, Math.min(x, b.maxX));
    const nz = Math.max(b.minZ, Math.min(z, b.maxZ));
    const dx = x - nx;
    const dz = z - nz;
    if (dx * dx + dz * dz < rad * rad) return true;
  }
  return false;
}

function canCreateWebGL() {
  try {
    const probe = document.createElement("canvas");
    return Boolean(
      probe.getContext("webgl2") ||
        probe.getContext("webgl") ||
        probe.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

const NOOP_API = {
  start() {},
  stop() {},
  setMusicMuted(_m: boolean) {},
  unsupported: true as const,
};

export function mountRoyale(
  canvas: HTMLCanvasElement,
  onHud: (hud: RoyaleHud) => void
) {
  if (!canCreateWebGL()) return NOOP_API;

  const skin = equippedSkin();
  const body = skin.palette.O || "#ff6a00";
  const skinTone = skin.palette.W || "#f8f0d8";
  const accent = skin.palette.y || "#ffcc00";

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      failIfMajorPerformanceCaveat: false,
    });
  } catch {
    return NOOP_API;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x7ec8f8, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(68, 16 / 9, 0.1, 500);
  addFortniteSky(scene);

  scene.add(new THREE.HemisphereLight(0xfff4d6, 0x3d8a48, 1.15));
  scene.add(new THREE.AmbientLight(0xb8d4ff, 0.28));
  const sun = new THREE.DirectionalLight(0xfff1d0, 1.55);
  sun.position.set(48, 70, 22);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 180;
  sun.shadow.camera.left = -80;
  sun.shadow.camera.right = 80;
  sun.shadow.camera.top = 80;
  sun.shadow.camera.bottom = -80;
  scene.add(sun);

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(160, 64),
    phong("#1a88b8", { shininess: 90, specular: 0x88ddff })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.5;
  water.receiveShadow = true;
  scene.add(water);

  const islandGeo = new THREE.CircleGeometry(ISLAND_R, 96);
  const islandPos = islandGeo.attributes.position;
  for (let i = 0; i < islandPos.count; i++) {
    const x = islandPos.getX(i);
    const y = islandPos.getY(i);
    const r = Math.hypot(x, y);
    islandPos.setZ(
      i,
      Math.sin(x * 0.09) * Math.cos(y * 0.08) * (1 - r / ISLAND_R) * 1.4
    );
  }
  islandGeo.computeVertexNormals();
  const island = new THREE.Mesh(islandGeo, toon("#48c45c"));
  island.rotation.x = -Math.PI / 2;
  island.receiveShadow = true;
  scene.add(island);

  const sand = new THREE.Mesh(
    new THREE.RingGeometry(ISLAND_R - 7, ISLAND_R + 0.4, 72),
    toon("#e8c888")
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.y = 0.03;
  sand.receiveShadow = true;
  scene.add(sand);
  scene.add(makeGrassField(180));
  scene.add(makeCloud(-40, 28, -30, 2.4));
  scene.add(makeCloud(50, 32, 10, 2.8));
  scene.add(makeCloud(10, 36, -55, 3.1));
  scene.add(makeCloud(-20, 30, 48, 2.2));
  scene.add(makeCloud(35, 26, 40, 1.8));
  scene.add(makeCloud(-55, 34, 8, 2.6));
  scene.add(makeCloud(18, 40, 22, 3.4));

  const boxes: BoxCol[] = [];
  const addBuilding = (
    x: number,
    z: number,
    w: number,
    d: number,
    h: number,
    color: string,
    roof?: string
  ) => {
    scene.add(makeBuilding(x, z, w, d, h, color, roof));
    boxes.push({
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2,
    });
  };

  addBuilding(-18, -8, 10, 10, 14, "#9aa3b0", "#5a6270");
  addBuilding(-6, -10, 12, 10, 18, "#b8c0cc", "#6a7380");
  addBuilding(8, -8, 10, 10, 12, "#8e97a6", "#4a5360");
  addBuilding(20, -6, 8, 8, 9, "#7d8794", "#3d4550");
  addBuilding(22, 18, 14, 8, 5, "#d45a3c", "#8a2818");
  addBuilding(8, 22, 10, 8, 4.5, "#e0b24a", "#8a5a18");
  addBuilding(-28, 16, 8, 8, 4, "#f0e2cc", "#8a5040");
  addBuilding(-38, 10, 7, 7, 3.5, "#f7ead8", "#7a4030");

  const lake = new THREE.Mesh(
    new THREE.CircleGeometry(14, 32),
    phong("#2eb0d8", { shininess: 80, specular: 0xa0eeff })
  );
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(-8, 0.06, 28);
  scene.add(lake);

  const trees: Tree[] = [];
  for (let i = 0; i < 26; i++) {
    const ang = (i / 26) * Math.PI * 2;
    const r = 26 + (i % 6) * 6.5;
    const tx = Math.cos(ang) * r;
    const tz = Math.sin(ang) * r;
    if (dist2(tx, tz, -8, 28) < 16) continue;
    const g = makeTree();
    g.position.set(tx, 0, tz);
    scene.add(g);
    trees.push({ mesh: g, x: tx, z: tz, hp: 40 });
    boxes.push({
      minX: tx - 0.55,
      maxX: tx + 0.55,
      minZ: tz - 0.55,
      maxZ: tz + 0.55,
    });
  }

  const loot: Array<{
    mesh: THREE.Object3D;
    x: number;
    z: number;
    live: boolean;
  }> = [];
  const lootSpots = [
    [0, 0],
    [16, 12],
    [-22, 4],
    [30, -12],
    [-12, 32],
    [4, -22],
  ];
  for (const [lx, lz] of lootSpots) {
    const chest = makeChest();
    chest.position.set(lx, 0, lz);
    scene.add(chest);
    loot.push({ mesh: chest, x: lx, z: lz, live: true });
  }

  const player = makeFighter(fighterStyle(), body, skinTone, accent);
  scene.add(player);

  const lobbyPeely = makeFighter("peely", "#ffe14a", "#ffe14a", "#4a2a12");
  lobbyPeely.position.set(8.2, 0, 8.4);
  lobbyPeely.rotation.y = -0.6;
  scene.add(lobbyPeely);
  const lobbyChief = makeFighter("chief", "#5c6b38", "#6b8f3c", "#e8a318");
  lobbyChief.position.set(3.6, 0, 8.6);
  lobbyChief.rotation.y = 0.85;
  scene.add(lobbyChief);

  const rifle = makeRifle();
  const shotgun = makeShotgun();
  const pick = makePickaxe();
  player.add(rifle, shotgun, pick);

  const bus = makeBus();
  scene.add(bus);
  const score = new RoyaleScore();

  const stormWall = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 32, 64, 1, true),
    new THREE.MeshPhongMaterial({
      color: 0xa060ff,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      emissive: 0x4a2088,
      emissiveIntensity: 0.25,
    })
  );
  stormWall.position.y = 14;
  scene.add(stormWall);
  const stormRing = new THREE.Mesh(
    new THREE.RingGeometry(0.92, 1.02, 48),
    new THREE.MeshBasicMaterial({
      color: 0xc89cff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    })
  );
  stormRing.rotation.x = -Math.PI / 2;
  stormRing.position.y = 0.08;
  scene.add(stormRing);

  const bots: Bot[] = [];
  const botColors = ["#3d7cff", "#22c55e", "#ff4dae", "#3cdcff", "#ffcc00", "#c45a3a"];
  const botLooks: FighterStyle[] = [
    "peely",
    "chief",
    "jonesy",
    "bot",
    "fox",
    "jonesy",
    "bot",
    "peely",
    "fox",
    "chief",
  ];
  for (let i = 0; i < 10; i++) {
    const ang = Math.random() * Math.PI * 2;
    const r = 18 + Math.random() * 40;
    const mesh = makeFighter(
      botLooks[i],
      botColors[i % botColors.length],
      "#f0d8c0",
      "#ffffff"
    );
    mesh.position.set(Math.cos(ang) * r, 0, Math.sin(ang) * r);
    scene.add(mesh);
    bots.push({
      mesh,
      hp: 100,
      yaw: Math.random() * Math.PI * 2,
      cool: 1 + Math.random(),
      vx: 0,
      vz: 0,
      wander: Math.random() * 3,
      alive: true,
    });
  }

  let mode: RoyaleMode = "title";
  let hp = 100;
  let shield = 50;
  let mats = 0;
  let weapon: RoyaleWeapon = "pickaxe";
  let elims = 0;
  let yaw = 0.85;
  let pitch = 0.22;
  let lookTouched = false;
  let px = 0;
  let py = 0;
  let pz = 0;
  let vy = 0;
  let grounded = true;
  let inv = 0;
  let fireCool = 0;
  let swing = 0;
  let banner = "CLICK DROP IN";
  let bannerT = 2;
  let stormR = 78;
  let stormT = 0;
  let busT = 0;
  let gliding = false;
  let ended = false;
  let hudAcc = 0;

  const keys: Record<string, boolean> = {};
  const look = { dx: 0, dy: 0 };
  let dragging = false;
  let lastMx = 0;
  let lastMy = 0;

  const hud = (): RoyaleHud => ({
    mode,
    hp: Math.max(0, hp),
    shield: Math.max(0, shield),
    mats,
    weapon,
    playersLeft: 1 + bots.filter((b) => b.alive).length,
    elims,
    stormR,
    banner,
    grounded,
  });

  const pushHud = () => onHud(hud());

  const setBanner = (text: string, t = 2.4) => {
    banner = text;
    bannerT = t;
  };

  const hurtPlayer = (dmg: number) => {
    if (inv > 0 || mode === "over" || mode === "win" || mode === "title") return;
    let left = dmg;
    if (shield > 0) {
      const soak = Math.min(shield, left);
      shield -= soak;
      left -= soak;
    }
    hp -= left;
    inv = 0.45;
    sfx.hit();
    if (hp <= 0) {
      hp = 0;
      finish(false);
    }
  };

  const finish = (win: boolean) => {
    if (ended) return;
    ended = true;
    mode = win ? "win" : "over";
    setBanner(win ? "VICTORY ROYALE" : "ELIMINATED", 8);
    grantPlayXp(elims * 20, elims, win);
    recordElims(elims);
    if (win) recordWin();
    sfx.gameOver();
    score.setIntensity(win ? "win" : "over");
    if (document.pointerLockElement) document.exitPointerLock();
    pushHud();
  };

  const tryMove = (nx: number, nz: number) => {
    const r = Math.hypot(nx, nz);
    if (r > ISLAND_R - 1.2) return;
    if (collide(nx, nz, boxes)) return;
    px = nx;
    pz = nz;
  };

  const forward = () => {
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    return { fx, fz };
  };

  const harvestOrHit = () => {
    const { fx, fz } = forward();
    const reach = weapon === "pickaxe" ? 3.2 : weapon === "shotgun" ? 14 : 70;
    const ox = px + fx * 0.6;
    const oz = pz + fz * 0.6;
    let hit = false;
    if (weapon === "pickaxe") {
      for (const tree of trees) {
        if (tree.hp <= 0) continue;
        if (dist2(ox + fx * 1.6, oz + fz * 1.6, tree.x, tree.z) < 2.2) {
          tree.hp -= 20;
          mats = Math.min(500, mats + 18);
          sfx.crunch();
          tree.mesh.scale.y *= 0.85;
          if (tree.hp <= 0) tree.mesh.visible = false;
          hit = true;
          break;
        }
      }
    }
    const dmg = weapon === "shotgun" ? 58 : weapon === "ar" ? 26 : 22;
    for (const bot of bots) {
      if (!bot.alive) continue;
      const bx = bot.mesh.position.x;
      const bz = bot.mesh.position.z;
      const toBot = { x: bx - px, z: bz - pz };
      const along = toBot.x * fx + toBot.z * fz;
      if (along < 0.4 || along > reach) continue;
      const perp = Math.abs(toBot.x * fz - toBot.z * fx);
      const spread = weapon === "ar" ? 1.1 : weapon === "shotgun" ? 1.6 : 0.9;
      if (perp > spread) continue;
      bot.hp -= dmg;
      sfx.ko();
      hit = true;
      if (bot.hp <= 0) {
        bot.alive = false;
        bot.mesh.visible = false;
        elims += 1;
        setBanner("ELIMINATED");
        if (bots.every((b) => !b.alive)) finish(true);
      }
      if (weapon !== "ar") break;
    }
    if (!hit && weapon !== "pickaxe") sfx.shoot();
    else if (weapon !== "pickaxe") sfx.shoot();
  };

  const placeBuild = (kind: "wall" | "ramp") => {
    if (mats < 10 || mode !== "play") return;
    const { fx, fz } = forward();
    const x = px + fx * 2.6;
    const z = pz + fz * 2.6;
    const gx = Math.round(x / 4) * 4;
    const gz = Math.round(z / 4) * 4;
    mats -= 10;
    if (kind === "wall") {
      const alongX = Math.abs(fx) > Math.abs(fz);
      const w = alongX ? 0.35 : 4;
      const d = alongX ? 4 : 0.35;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, 3.2, d),
        toon("#c4a06a")
      );
      mesh.position.set(gx, 1.6, gz);
      markShadow(mesh);
      scene.add(mesh);
      boxes.push({
        minX: gx - w / 2,
        maxX: gx + w / 2,
        minZ: gz - d / 2,
        maxZ: gz + d / 2,
      });
    } else {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 0.28, 4), toon("#c4a06a"));
      mesh.position.set(gx, 1.1, gz);
      mesh.rotation.x = -0.55;
      mesh.rotation.y = yaw;
      markShadow(mesh);
      scene.add(mesh);
    }
    sfx.select();
  };

  const reset = () => {
    ended = false;
    hp = 100;
    shield = 50;
    mats = 0;
    weapon = "pickaxe";
    elims = 0;
    yaw = 0;
    pitch = 0.25;
    vy = 0;
    inv = 0;
    fireCool = 0;
    stormR = 78;
    stormT = 0;
    busT = 0;
    gliding = false;
    grounded = false;
    py = 38;
    mode = "bus";
    setBanner("BATTLE BUS  •  JUMP", 4);
    for (const bot of bots) {
      bot.alive = true;
      bot.hp = 100;
      bot.mesh.visible = true;
      const ang = Math.random() * Math.PI * 2;
      const r = 18 + Math.random() * 40;
      bot.mesh.position.set(Math.cos(ang) * r, 0, Math.sin(ang) * r);
    }
    for (const drop of loot) {
      drop.live = true;
      drop.mesh.visible = true;
    }
    player.visible = true;
    canvas.requestPointerLock?.();
    recordDrop();
    score.start();
    score.setIntensity("bus");
    pushHud();
    sfx.bus();
  };

  const onKey = (e: KeyboardEvent, down: boolean) => {
    keys[e.code] = down;
    if (!down) return;
    if (e.code === "Digit1") weapon = "pickaxe";
    if (e.code === "Digit2") weapon = "ar";
    if (e.code === "Digit3") weapon = "shotgun";
    if (e.code === "KeyQ") placeBuild("wall");
    if (e.code === "KeyC" || e.code === "KeyE") placeBuild("ramp");
      if (e.code === "Space" && mode === "bus") {
        mode = "drop";
      setBanner("SKYDIVING");
      sfx.drop();
    }
    if (e.code === "Enter" && mode === "title") reset();
    if (mode === "play" || mode === "drop" || mode === "bus") {
      if (["Space", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) e.preventDefault();
    }
  };
  const down = (e: KeyboardEvent) => onKey(e, true);
  const up = (e: KeyboardEvent) => onKey(e, false);
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);

  const onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement === canvas) {
      look.dx += e.movementX;
      look.dy += e.movementY;
    } else if (dragging) {
      look.dx += e.clientX - lastMx;
      look.dy += e.clientY - lastMy;
      lastMx = e.clientX;
      lastMy = e.clientY;
    }
  };
  const onDown = (e: PointerEvent) => {
    dragging = true;
    lastMx = e.clientX;
    lastMy = e.clientY;
    if (e.button === 0 && mode === "bus") {
      mode = "drop";
      setBanner("SKYDIVING");
      sfx.drop();
    } else if (e.button === 0 && mode === "play") {
      keys.Mouse0 = true;
    }
    if (mode === "play" || mode === "drop" || mode === "bus") {
      canvas.requestPointerLock?.();
    }
  };
  const onUp = () => {
    dragging = false;
    keys.Mouse0 = false;
  };
  window.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);

  const resize = () => {
    const w = canvas.clientWidth || 960;
    const h = canvas.clientHeight || 540;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  let raf = 0;
  let running = true;
  let last = performance.now();

  const loop = (now: number) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (look.dx !== 0 || look.dy !== 0) lookTouched = true;
    yaw -= look.dx * 0.0026;
    pitch -= look.dy * 0.0022;
    pitch = Math.max(-1.25, Math.min(1.35, pitch));
    look.dx = 0;
    look.dy = 0;

    const orbitCam = (tx: number, ty: number, tz: number, dist: number, height = 1.4) => {
      const lookY = ty + height;
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const cx = tx + Math.sin(yaw) * cp * dist;
      const cy = Math.max(0.45, lookY + sp * dist);
      const cz = tz + Math.cos(yaw) * cp * dist;
      camera.position.set(cx, cy, cz);
      camera.lookAt(tx, lookY, tz);
    };

    const prop = bus.userData.propeller as THREE.Object3D | undefined;
    if (prop) prop.rotation.x += dt * 22;

    if (bannerT > 0) bannerT -= dt;
    if (inv > 0) inv -= dt;
    if (fireCool > 0) fireCool -= dt;
    if (swing > 0) swing -= dt;

    const { fx, fz } = forward();
    const rx = Math.cos(yaw);
    const rz = -Math.sin(yaw);

    busT += dt * 0.35;
    bus.position.set(Math.cos(busT) * 58, 36, Math.sin(busT) * 58);
    bus.lookAt(0, 36, 0);

    if (mode === "title") {
      player.visible = true;
      lobbyPeely.visible = true;
      lobbyChief.visible = true;
      player.position.set(6, 0, 10);
      player.rotation.y = 0.55;
      if (!lookTouched) yaw -= dt * 0.18;
      orbitCam(6, 0.4, 10, 14, 1.25);
    } else {
      lobbyPeely.visible = false;
      lobbyChief.visible = false;
    }

    if (mode === "bus") {
      player.visible = true;
      px = bus.position.x;
      py = bus.position.y - 0.4;
      pz = bus.position.z;
      player.position.set(px, py, pz);
      player.rotation.y = yaw;
      orbitCam(px, py, pz, 12, 1.1);
    }

    if (mode === "drop") {
      const speed = gliding ? 18 : 12;
      let mx = 0;
      let mz = 0;
      if (keys.KeyW) {
        mx += fx;
        mz += fz;
      }
      if (keys.KeyS) {
        mx -= fx;
        mz -= fz;
      }
      if (keys.KeyA) {
        mx -= rx;
        mz -= rz;
      }
      if (keys.KeyD) {
        mx += rx;
        mz += rz;
      }
      const len = Math.hypot(mx, mz) || 1;
      px += (mx / len) * speed * dt;
      pz += (mz / len) * speed * dt;
      py -= (gliding ? 7 : 22) * dt;
      if (py < 11) gliding = true;
      if (py <= 0) {
        py = 0;
        grounded = true;
        mode = "play";
        setBanner("WELCOME TO THE ISLAND");
        sfx.start();
        score.setIntensity("play");
      }
      player.position.set(px, py, pz);
      player.rotation.y = yaw;
      orbitCam(px, py, pz, 10, 1.25);
    }

    if (mode === "play") {
      stormT += dt;
      if (stormT < 18) stormR = 78;
      else if (stormT < 70) stormR = 78 - ((stormT - 18) / 52) * 48;
      else stormR = Math.max(8, 30 - (stormT - 70) * 0.18);

      let mx = 0;
      let mz = 0;
      if (keys.KeyW) {
        mx += fx;
        mz += fz;
      }
      if (keys.KeyS) {
        mx -= fx;
        mz -= fz;
      }
      if (keys.KeyA) {
        mx -= rx;
        mz -= rz;
      }
      if (keys.KeyD) {
        mx += rx;
        mz += rz;
      }
      const sprint = keys.ShiftLeft || keys.ShiftRight ? 1.45 : 1;
      const len = Math.hypot(mx, mz);
      if (len > 0) {
        tryMove(px + (mx / len) * 11 * sprint * dt, pz + (mz / len) * 11 * sprint * dt);
      }
      if (keys.Space && grounded) {
        vy = JUMP;
        grounded = false;
        sfx.jump();
        keys.Space = false;
      }
      vy -= GRAVITY * dt;
      py += vy * dt;
      if (py <= 0) {
        py = 0;
        vy = 0;
        grounded = true;
      }

      if (Math.hypot(px, pz) > stormR - 0.5) {
        hurtPlayer(8 * dt);
      }

      for (const drop of loot) {
        if (!drop.live) continue;
        if (dist2(px, pz, drop.x, drop.z) < 1.4) {
          drop.live = false;
          drop.mesh.visible = false;
          shield = Math.min(100, shield + 50);
          mats = Math.min(500, mats + 30);
          sfx.pickup();
          setBanner("SHIELD + MATS");
        }
      }

      const rate = weapon === "ar" ? 0.14 : weapon === "shotgun" ? 0.72 : 0.38;
      if (keys.Mouse0 && fireCool <= 0) {
        fireCool = rate;
        swing = 0.2;
        harvestOrHit();
      }

      player.position.set(px, py, pz);
      player.rotation.y = yaw;
      orbitCam(px, py, pz, 6.8, 1.45);
    }

    if (mode === "over" || mode === "win") {
      orbitCam(px, py, pz, 8.5, 1.3);
    }

    rifle.visible = weapon === "ar";
    shotgun.visible = weapon === "shotgun";
    pick.visible = weapon === "pickaxe";
    const arm = player.userData.armR as THREE.Mesh;
    if (arm) arm.rotation.x = swing > 0 ? -1.1 : 0;

    const moving =
      Boolean(keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD) &&
      (mode === "play" || mode === "drop");
    swingLegs(player, moving && grounded, now / 1000);

    if (mode === "play" && stormR < 36 && score.intensity !== "storm") {
      score.setIntensity("storm");
    }

    stormWall.scale.set(stormR, 1, stormR);
    stormRing.scale.set(stormR, stormR, 1);

    for (const bot of bots) {
      if (!bot.alive || mode === "title") continue;
      bot.cool -= dt;
      bot.wander -= dt;
      const bx = bot.mesh.position.x;
      const bz = bot.mesh.position.z;
      const inStorm = Math.hypot(bx, bz) < stormR - 2;
      let tx = 0;
      let tz = 0;
      if (!inStorm) {
        tx = -bx;
        tz = -bz;
      } else {
        const toP = dist2(bx, bz, px, pz);
        if (mode === "play" && toP < 26 && toP > 4) {
          tx = px - bx;
          tz = pz - bz;
          if (bot.cool <= 0 && toP < 20) {
            bot.cool = 0.9 + Math.random() * 0.5;
            if (Math.random() > 0.42) hurtPlayer(11);
            sfx.shoot();
          }
        } else if (bot.wander <= 0) {
          bot.yaw = Math.random() * Math.PI * 2;
          bot.wander = 1.4 + Math.random() * 2;
        }
      }
      if (tx !== 0 || tz !== 0) bot.yaw = Math.atan2(-tx, -tz);
      const spd = 5.5;
      const nx = bx - Math.sin(bot.yaw) * spd * dt;
      const nz = bz - Math.cos(bot.yaw) * spd * dt;
      if (!collide(nx, nz, boxes, 0.5) && Math.hypot(nx, nz) < ISLAND_R - 2) {
        bot.mesh.position.x = nx;
        bot.mesh.position.z = nz;
      }
      bot.mesh.rotation.y = bot.yaw;
      swingLegs(bot.mesh, true, now / 1000 + bot.mesh.id);
      if (Math.hypot(bx, bz) > stormR) {
        bot.hp -= 10 * dt;
        if (bot.hp <= 0) {
          bot.alive = false;
          bot.mesh.visible = false;
        }
      }
    }

    if (mode === "play" && bots.every((b) => !b.alive)) finish(true);

    hudAcc += dt;
    if (hudAcc > 0.12) {
      hudAcc = 0;
      if (bannerT <= 0 && mode === "play") banner = "";
      pushHud();
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };

  pushHud();
  raf = requestAnimationFrame(loop);

  return {
    start: reset,
    setMusicMuted: (m: boolean) => score.setMuted(m),
    unsupported: false as const,
    stop() {
      running = false;
      score.stop();
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      ro.disconnect();
      renderer.dispose();
      if (document.pointerLockElement) document.exitPointerLock();
    },
  };
}
