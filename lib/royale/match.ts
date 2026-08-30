import * as THREE from "three";
import { equippedSkin, grantPlayXp } from "@/lib/pass";
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

function lambert(color: string | number) {
  return new THREE.MeshLambertMaterial({ color });
}

function makeFighter(body: string, skin: string, accent: string) {
  const g = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.88, 0.42), lambert(body));
  torso.position.y = 1.08;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.44), lambert(skin));
  head.position.y = 1.68;
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.08), lambert(accent));
  visor.position.set(0, 1.7, 0.22);
  const hip = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.4), lambert(body));
  hip.position.y = 0.58;
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.58, 0.3), lambert("#1a1a28"));
  legL.position.set(-0.18, 0.28, 0);
  const legR = legL.clone();
  legR.position.x = 0.18;
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.22), lambert(body));
  armL.position.set(-0.5, 1.05, 0);
  const armR = armL.clone();
  armR.position.x = 0.5;
  g.add(torso, head, visor, hip, legL, legR, armL, armR);
  g.userData.armR = armR;
  return g;
}

function makeBus() {
  const g = new THREE.Group();
  const balloon = new THREE.Mesh(new THREE.SphereGeometry(2.4, 12, 10), lambert("#ffcc00"));
  balloon.position.y = 5.2;
  balloon.scale.set(1.4, 0.85, 1);
  const rope = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.2, 0.08), lambert("#f8f0d8"));
  rope.position.y = 3.2;
  const body = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.8, 2.2), lambert("#3d7cff"));
  body.position.y = 0.9;
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.25, 2.3), lambert("#ff6a00"));
  stripe.position.y = 1.35;
  g.add(balloon, rope, body, stripe);
  return g;
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

function dist2(ax: number, az: number, bx: number, bz: number) {
  const dx = ax - bx;
  const dz = az - bz;
  return Math.hypot(dx, dz);
}

export function mountRoyale(
  canvas: HTMLCanvasElement,
  onHud: (hud: RoyaleHud) => void
) {
  const skin = equippedSkin();
  const body = skin.palette.O || "#ff6a00";
  const skinTone = skin.palette.W || "#f8f0d8";
  const accent = skin.palette.y || "#ffcc00";

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x7ec8f8, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x9ad4ff, 48, 170);
  scene.background = new THREE.Color(0x7ec8f8);

  const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.1, 400);

  scene.add(new THREE.HemisphereLight(0xfff6d8, 0x3d8a44, 1.15));
  const sun = new THREE.DirectionalLight(0xffffff, 1.05);
  sun.position.set(40, 70, 20);
  scene.add(sun);

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(140, 48),
    lambert("#1a7aaa")
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.45;
  scene.add(water);

  const island = new THREE.Mesh(
    new THREE.CircleGeometry(ISLAND_R, 64),
    lambert("#4cbf5a")
  );
  island.rotation.x = -Math.PI / 2;
  island.position.y = 0;
  scene.add(island);

  const sand = new THREE.Mesh(
    new THREE.RingGeometry(ISLAND_R - 6, ISLAND_R, 64),
    lambert("#e2c07a")
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.y = 0.02;
  scene.add(sand);

  const boxes: BoxCol[] = [];
  const addBuilding = (
    x: number,
    z: number,
    w: number,
    d: number,
    h: number,
    color: string
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lambert(color));
    mesh.position.set(x, h / 2, z);
    scene.add(mesh);
    boxes.push({
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2,
    });
    const win = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.7, h * 0.35, 0.08),
      lambert("#ffcc66")
    );
    win.position.set(x, h * 0.55, z + d / 2 + 0.02);
    scene.add(win);
  };

  addBuilding(-18, -8, 10, 10, 14, "#8a8a96");
  addBuilding(-6, -10, 12, 10, 18, "#9a9aa8");
  addBuilding(8, -8, 10, 10, 12, "#7a7a88");
  addBuilding(20, -6, 8, 8, 9, "#6a6a78");
  addBuilding(22, 18, 14, 8, 5, "#c45a3a");
  addBuilding(8, 22, 10, 8, 4.5, "#d4b060");
  addBuilding(-28, 16, 8, 8, 4, "#e8d8c0");
  addBuilding(-38, 10, 7, 7, 3.5, "#f0e0c8");

  const lake = new THREE.Mesh(
    new THREE.CircleGeometry(14, 24),
    lambert("#2aa0d0")
  );
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(-8, 0.04, 28);
  scene.add(lake);

  const trees: Tree[] = [];
  for (let i = 0; i < 22; i++) {
    const ang = (i / 22) * Math.PI * 2;
    const r = 28 + (i % 5) * 7;
    const tx = Math.cos(ang) * r;
    const tz = Math.sin(ang) * r;
    if (dist2(tx, tz, -8, 28) < 16) continue;
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.38, 2.2, 6),
      lambert("#6a3a18")
    );
    trunk.position.y = 1.1;
    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(1.6, 2.8, 7),
      lambert("#2f9a3a")
    );
    leaves.position.y = 3.1;
    g.add(trunk, leaves);
    g.position.set(tx, 0, tz);
    scene.add(g);
    trees.push({ mesh: g, x: tx, z: tz, hp: 40 });
    boxes.push({
      minX: tx - 0.5,
      maxX: tx + 0.5,
      minZ: tz - 0.5,
      maxZ: tz + 0.5,
    });
  }

  const loot: Array<{ mesh: THREE.Mesh; x: number; z: number; live: boolean }> =
    [];
  const lootSpots = [
    [0, 0],
    [16, 12],
    [-22, 4],
    [30, -12],
    [-12, 32],
    [4, -22],
  ];
  for (const [lx, lz] of lootSpots) {
    const chest = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.55, 0.7),
      lambert("#e8b020")
    );
    chest.position.set(lx, 0.3, lz);
    scene.add(chest);
    loot.push({ mesh: chest, x: lx, z: lz, live: true });
  }

  const player = makeFighter(body, skinTone, accent);
  scene.add(player);

  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 1.1), lambert("#2a2a38"));
  gun.position.set(0.42, 1.15, 0.55);
  player.add(gun);
  const pick = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.9, 0.12),
    lambert("#c9a06a")
  );
  pick.position.set(0.5, 1.35, 0.3);
  pick.rotation.z = -0.5;
  const pickHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.18, 0.18),
    lambert("#8a8a96")
  );
  pickHead.position.set(0.5, 1.75, 0.15);
  player.add(pick, pickHead);

  const bus = makeBus();
  scene.add(bus);

  const stormWall = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 28, 48, 1, true),
    new THREE.MeshLambertMaterial({
      color: 0xa060ff,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
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
  for (let i = 0; i < 10; i++) {
    const ang = Math.random() * Math.PI * 2;
    const r = 18 + Math.random() * 40;
    const mesh = makeFighter(
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
  let yaw = 0;
  let pitch = 0.18;
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
    grantPlayXp(win ? 400 : 80 + elims * 40, elims);
    sfx.gameOver();
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
        lambert("#c4a06a")
      );
      mesh.position.set(gx, 1.6, gz);
      scene.add(mesh);
      boxes.push({
        minX: gx - w / 2,
        maxX: gx + w / 2,
        minZ: gz - d / 2,
        maxZ: gz + d / 2,
      });
    } else {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 0.28, 4), lambert("#c4a06a"));
      mesh.position.set(gx, 1.1, gz);
      mesh.rotation.x = -0.55;
      mesh.rotation.y = yaw;
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
    if (mode === "title") return;
    if (e.button === 0) {
      if (mode === "bus") {
        mode = "drop";
        setBanner("SKYDIVING");
        sfx.drop();
      } else if (mode === "play") {
        keys.Mouse0 = true;
      }
    }
    dragging = true;
    lastMx = e.clientX;
    lastMy = e.clientY;
    if (mode === "play" || mode === "drop") {
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

    yaw -= look.dx * 0.0024;
    pitch -= look.dy * 0.002;
    pitch = Math.max(-0.9, Math.min(1.15, pitch));
    look.dx = 0;
    look.dy = 0;

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
      camera.position.set(
        Math.cos(now / 4000) * 90,
        28,
        Math.sin(now / 4000) * 90
      );
      camera.lookAt(0, 4, 0);
      player.visible = false;
    }

    if (mode === "bus") {
      player.visible = true;
      px = bus.position.x;
      py = bus.position.y - 0.4;
      pz = bus.position.z;
      player.position.set(px, py, pz);
      player.rotation.y = yaw;
      camera.position.set(px - fx * 10, py + 4, pz - fz * 10);
      camera.lookAt(px, py + 1, pz);
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
        mx += rx;
        mz += rz;
      }
      if (keys.KeyD) {
        mx -= rx;
        mz -= rz;
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
      }
      player.position.set(px, py, pz);
      player.rotation.y = yaw;
      camera.position.set(px - fx * 9, py + 5, pz - fz * 9);
      camera.lookAt(px, py + 1.4, pz);
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
        mx += rx;
        mz += rz;
      }
      if (keys.KeyD) {
        mx -= rx;
        mz -= rz;
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
      const camDist = 7.2;
      const camH = 2.1 + Math.sin(pitch) * 1.2;
      const cx = px - fx * Math.cos(pitch) * camDist;
      const cy = py + camH + Math.max(0, -pitch) * 2;
      const cz = pz - fz * Math.cos(pitch) * camDist;
      camera.position.set(cx, cy, cz);
      camera.lookAt(px, py + 1.45, pz);
    }

    gun.visible = weapon !== "pickaxe";
    pick.visible = weapon === "pickaxe";
    pickHead.visible = weapon === "pickaxe";
    const arm = player.userData.armR as THREE.Mesh;
    arm.rotation.x = swing > 0 ? -1.1 : 0;

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
    stop() {
      running = false;
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
