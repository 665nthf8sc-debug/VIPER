import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";

/** Stylized PBR — smooth Fortnite lighting, not voxel / toon cubes. */
export function paint(
  color: string | number,
  extras: THREE.MeshStandardMaterialParameters = {}
) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.42,
    metalness: 0.06,
    ...extras,
  });
}

export function metal(
  color: string | number,
  extras: THREE.MeshStandardMaterialParameters = {}
) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.28,
    metalness: 0.62,
    ...extras,
  });
}

export function gloss(
  color: string | number,
  extras: THREE.MeshStandardMaterialParameters = {}
) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.18,
    metalness: 0.35,
    ...extras,
  });
}

/** Kept for older call sites; now a smooth Lambert stand-in, not Minecraft toon. */
export function toon(color: string | number) {
  return paint(color);
}

export function phong(
  color: string | number,
  extras: THREE.MeshPhongMaterialParameters = {}
) {
  return new THREE.MeshPhongMaterial({
    color,
    shininess: 48,
    specular: 0x88aacc,
    ...extras,
  });
}

export function markShadow(obj: THREE.Object3D, cast = true, receive = true) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = cast;
      child.receiveShadow = receive;
    }
  });
}

function cap(r: number, h: number, mat: THREE.Material, seg = 16) {
  return new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 8, seg), mat);
}

function ball(r: number, mat: THREE.Material, w = 24, h = 16) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, w, h), mat);
}

function bendBanana(geo: THREE.BufferGeometry) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = THREE.MathUtils.clamp((y + 0.15) / 2.2, 0, 1);
    const curve = Math.sin(t * Math.PI) * 0.28 + t * t * 0.22;
    pos.setZ(i, pos.getZ(i) - curve);
    const pinch = 1 - t * 0.12;
    pos.setX(i, pos.getX(i) * pinch);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function bananaMesh() {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    const r = 0.07 + Math.sin(t * Math.PI) * 0.4 + Math.sin(t * Math.PI * 2) * 0.02;
    pts.push(new THREE.Vector2(Math.max(0.05, r), t * 2.18));
  }
  const geo = new THREE.LatheGeometry(pts, 32);
  return new THREE.Mesh(bendBanana(geo), paint("#ffe14a", { roughness: 0.32 }));
}

function addFingers(hand: THREE.Object3D, mat: THREE.Material, dir: number) {
  for (let i = 0; i < 4; i++) {
    const f = cap(0.018, 0.09, mat, 8);
    f.position.set(dir * 0.04, -0.06, 0.04 + (i - 1.5) * 0.028);
    f.rotation.x = 0.35;
    hand.add(f);
  }
}

function attachFace(g: THREE.Group, y: number, z: number, scale = 1, mouthY = 0) {
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x161018 });
  const eyeL = ball(0.045 * scale, eyeMat, 12, 10);
  eyeL.position.set(-0.08 * scale, y, z);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.08 * scale;
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.055 * scale, 0.01 * scale, 8, 18, Math.PI),
    eyeMat
  );
  smile.rotation.set(Math.PI, 0, 0);
  smile.position.set(0, y + mouthY - 0.07 * scale, z + 0.01);
  g.add(eyeL, eyeR, smile);
}

export type FighterStyle = "fox" | "chief" | "jonesy" | "peely" | "bot";

function makePeely() {
  const g = new THREE.Group();
  const peel = paint("#ffe14a", { roughness: 0.3 });
  const brown = paint("#4a2a12", { roughness: 0.7 });
  const green = paint("#7cb342", { roughness: 0.45 });

  const body = bananaMesh();
  body.position.y = 0.12;
  g.add(body);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.07, 0.22, 12),
    brown
  );
  stem.position.set(0.06, 2.32, -0.38);
  stem.rotation.z = 0.35;
  stem.rotation.x = -0.4;
  const stemTip = ball(0.055, brown, 10, 8);
  stemTip.position.set(0.1, 2.44, -0.46);
  g.add(stem, stemTip);

  const greenRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.05, 8, 24),
    green
  );
  greenRing.position.set(0.02, 2.08, -0.22);
  greenRing.rotation.x = 1.05;
  g.add(greenRing);

  for (let i = 0; i < 3; i++) {
    const flap = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 12, 0, Math.PI * 2, 0, 1.4),
      peel
    );
    flap.scale.set(1.1, 0.55, 0.9);
    const a = (i - 1) * 0.7;
    flap.position.set(Math.sin(a) * 0.18, 2.05, -0.12 + Math.cos(a) * 0.08);
    flap.rotation.set(0.9, a, 0.15);
    g.add(flap);
  }

  attachFace(g, 1.62, 0.34, 1.05, -0.02);

  const armL = cap(0.07, 0.52, peel);
  armL.position.set(-0.48, 1.28, 0.06);
  armL.rotation.z = 0.28;
  const armR = cap(0.07, 0.52, peel);
  armR.position.set(0.48, 1.28, 0.06);
  armR.rotation.z = -0.28;
  const handL = ball(0.08, peel, 12, 10);
  handL.position.set(-0.58, 0.92, 0.12);
  const handR = ball(0.08, peel, 12, 10);
  handR.position.set(0.58, 0.92, 0.12);
  addFingers(handL, peel, -1);
  addFingers(handR, peel, 1);

  const legL = cap(0.09, 0.55, peel);
  legL.position.set(-0.16, 0.42, 0.08);
  const legR = cap(0.09, 0.55, peel);
  legR.position.set(0.16, 0.42, 0.08);
  const footL = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 14, 10),
    peel
  );
  footL.scale.set(1, 0.55, 1.35);
  footL.position.set(-0.16, 0.08, 0.14);
  const footR = footL.clone();
  footR.position.x = 0.16;
  const tipL = ball(0.055, brown, 10, 8);
  tipL.position.set(-0.16, 0.05, 0.26);
  const tipR = tipL.clone();
  tipR.position.x = 0.16;

  g.add(armL, armR, handL, handR, legL, legR, footL, footR, tipL, tipR);
  g.userData.armR = armR;
  g.userData.legL = legL;
  g.userData.legR = legR;
  markShadow(g);
  return g;
}

function number117() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 128);
  ctx.fillStyle = "#f4f1ea";
  ctx.font = "800 92px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("117", 128, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeChief() {
  const g = new THREE.Group();
  const olive = paint("#5c6b38", { roughness: 0.48, metalness: 0.22 });
  const dark = paint("#2a3228", { roughness: 0.55 });
  const plate = metal("#6a7844", { roughness: 0.38 });
  const visor = gloss("#e8a318", {
    roughness: 0.08,
    metalness: 0.85,
    envMapIntensity: 1.4,
  });

  const hips = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 20, 14),
    olive
  );
  hips.scale.set(1.15, 0.7, 0.9);
  hips.position.y = 0.78;

  const torso = cap(0.28, 0.55, olive, 20);
  torso.position.y = 1.22;
  torso.scale.set(1.25, 1, 0.95);

  const chest = new THREE.Mesh(
    new RoundedBoxGeometry(0.62, 0.42, 0.38, 5, 0.1),
    plate
  );
  chest.position.set(0, 1.28, 0.08);

  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 0.1),
    new THREE.MeshStandardMaterial({
      map: number117(),
      transparent: true,
      roughness: 0.4,
      metalness: 0.1,
    })
  );
  badge.position.set(-0.16, 1.38, 0.28);

  const helm = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 28, 22),
    olive
  );
  helm.scale.set(1.05, 0.95, 1.12);
  helm.position.y = 1.82;

  const brow = new THREE.Mesh(
    new RoundedBoxGeometry(0.42, 0.1, 0.18, 3, 0.04),
    plate
  );
  brow.position.set(0, 1.88, 0.18);

  const vis = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 24, 16, 0, Math.PI * 2, 0.55, 0.72),
    visor
  );
  vis.scale.set(1.05, 0.85, 1.15);
  vis.position.set(0, 1.78, 0.05);

  const chin = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 16, 12),
    olive
  );
  chin.scale.set(1.2, 0.7, 1.1);
  chin.position.set(0, 1.62, 0.12);

  const pack = new THREE.Mesh(
    new RoundedBoxGeometry(0.4, 0.48, 0.2, 4, 0.06),
    dark
  );
  pack.position.set(0, 1.22, -0.3);

  const pauldronL = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 16, 12, 0, Math.PI, 0, Math.PI),
    plate
  );
  pauldronL.scale.set(1.15, 0.7, 1);
  pauldronL.position.set(-0.42, 1.48, 0);
  pauldronL.rotation.z = 0.4;
  const pauldronR = pauldronL.clone();
  pauldronR.position.x = 0.42;
  pauldronR.rotation.z = -0.4;

  const armL = cap(0.09, 0.42, olive);
  armL.position.set(-0.46, 1.12, 0);
  const armR = cap(0.09, 0.42, olive);
  armR.position.set(0.46, 1.12, 0);
  const gauntL = new THREE.Mesh(
    new RoundedBoxGeometry(0.16, 0.16, 0.2, 3, 0.04),
    plate
  );
  gauntL.position.set(-0.46, 0.86, 0.04);
  const gauntR = gauntL.clone();
  gauntR.position.x = 0.46;

  const thighL = cap(0.12, 0.38, dark);
  thighL.position.set(-0.16, 0.48, 0);
  const thighR = cap(0.12, 0.38, dark);
  thighR.position.set(0.16, 0.48, 0);
  const plateL = new THREE.Mesh(
    new RoundedBoxGeometry(0.2, 0.32, 0.18, 3, 0.05),
    plate
  );
  plateL.position.set(-0.16, 0.52, 0.06);
  const plateR = plateL.clone();
  plateR.position.x = 0.16;

  const bootL = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 14, 10),
    dark
  );
  bootL.scale.set(1, 0.55, 1.45);
  bootL.position.set(-0.16, 0.08, 0.06);
  const bootR = bootL.clone();
  bootR.position.x = 0.16;

  g.add(
    hips,
    torso,
    chest,
    badge,
    helm,
    brow,
    vis,
    chin,
    pack,
    pauldronL,
    pauldronR,
    armL,
    armR,
    gauntL,
    gauntR,
    thighL,
    thighR,
    plateL,
    plateR,
    bootL,
    bootR
  );
  g.userData.armR = armR;
  g.userData.legL = thighL;
  g.userData.legR = thighR;
  markShadow(g);
  return g;
}

function makeHumanoid(
  style: Exclude<FighterStyle, "peely" | "chief">,
  body: string,
  skin: string,
  accent: string
) {
  const g = new THREE.Group();
  const suit = paint(body, { roughness: 0.4 });
  const flesh = paint(skin, { roughness: 0.48 });
  const trim = paint(accent, { roughness: 0.35 });
  const denim = paint(style === "jonesy" ? "#3a5a8c" : "#1c2430", {
    roughness: 0.55,
  });

  const hips = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 12), suit);
  hips.scale.set(1.2, 0.65, 0.95);
  hips.position.y = 0.74;

  const torso = cap(0.24, 0.52, suit, 20);
  torso.position.y = 1.2;
  torso.scale.set(1.2, 1, 0.9);

  const belt = new THREE.Mesh(
    new THREE.TorusGeometry(0.26, 0.035, 8, 20),
    trim
  );
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 0.92;

  const head = ball(0.22, flesh, 28, 20);
  head.position.y = 1.78;

  attachFace(g, 1.8, 0.2, 1, -0.01);

  if (style === "fox") {
    const earMat = suit;
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), earMat);
    ear.scale.set(0.7, 1.35, 0.5);
    ear.position.set(-0.14, 2.05, 0);
    ear.rotation.z = 0.35;
    const ear2 = ear.clone();
    ear2.position.x = 0.14;
    ear2.rotation.z = -0.35;
    const inner = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 10, 8),
      paint("#f4b6c8", { roughness: 0.5 })
    );
    inner.scale.set(0.6, 1.1, 0.3);
    inner.position.set(-0.14, 2.04, 0.04);
    const inner2 = inner.clone();
    inner2.position.x = 0.14;
    const muzzle = ball(0.1, paint("#f8f0d8"), 16, 12);
    muzzle.scale.set(1.1, 0.7, 1.2);
    muzzle.position.set(0, 1.68, 0.16);
    const nose = ball(0.035, paint("#1a1020"), 10, 8);
    nose.position.set(0, 1.7, 0.28);
    const tail = cap(0.09, 0.55, suit);
    tail.position.set(0, 0.85, -0.38);
    tail.rotation.x = 0.9;
    g.add(ear, ear2, inner, inner2, muzzle, nose, tail);
  }

  if (style === "jonesy" || style === "bot") {
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 20, 16),
      paint(style === "jonesy" ? "#5a3210" : "#241610")
    );
    hair.scale.set(1.08, 0.62, 1.12);
    hair.position.set(0, 1.96, -0.02);
    g.add(hair);
    if (style === "jonesy") {
      const tuft = ball(0.1, paint("#5a3210"), 12, 10);
      tuft.position.set(0, 2.08, 0.04);
      g.add(tuft);
    }
  }

  const pack = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.12, 0.28, 6, 12),
    paint("#2a3344")
  );
  pack.rotation.x = Math.PI / 2;
  pack.position.set(0, 1.22, -0.28);

  const armL = cap(0.075, 0.42, suit);
  armL.position.set(-0.42, 1.16, 0);
  const armR = cap(0.075, 0.42, suit);
  armR.position.set(0.42, 1.16, 0);
  const handL = ball(0.075, flesh, 12, 10);
  handL.position.set(-0.42, 0.86, 0.04);
  const handR = ball(0.075, flesh, 12, 10);
  handR.position.set(0.42, 0.86, 0.04);

  const legL = cap(0.1, 0.46, denim);
  legL.position.set(-0.15, 0.4, 0);
  const legR = cap(0.1, 0.46, denim);
  legR.position.set(0.15, 0.4, 0);
  const bootL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), paint("#141820"));
  bootL.scale.set(1, 0.5, 1.4);
  bootL.position.set(-0.15, 0.07, 0.05);
  const bootR = bootL.clone();
  bootR.position.x = 0.15;

  g.add(
    hips,
    torso,
    belt,
    head,
    pack,
    armL,
    armR,
    handL,
    handR,
    legL,
    legR,
    bootL,
    bootR
  );
  g.userData.armR = armR;
  g.userData.legL = legL;
  g.userData.legR = legR;
  markShadow(g);
  return g;
}

export function makeFighter(
  style: FighterStyle,
  body: string,
  skin: string,
  accent: string
) {
  if (style === "peely") return makePeely();
  if (style === "chief") return makeChief();
  return makeHumanoid(style, body, skin, accent);
}

export function makeRifle() {
  const g = new THREE.Group();
  const tan = paint("#c4a574", { roughness: 0.4 });
  const black = metal("#1a1c22", { roughness: 0.35 });
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.055, 0.62, 6, 12),
    tan
  );
  body.rotation.x = Math.PI / 2;
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.032, 0.55, 14),
    black
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0.62;
  const mag = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.03, 0.16, 4, 10),
    black
  );
  mag.position.set(0, -0.14, 0.04);
  const stock = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.04, 0.18, 4, 10),
    tan
  );
  stock.rotation.x = Math.PI / 2;
  stock.position.z = -0.48;
  const scope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.12, 12),
    black
  );
  scope.rotation.x = Math.PI / 2;
  scope.position.set(0, 0.08, 0.08);
  g.add(body, barrel, mag, stock, scope);
  g.position.set(0.42, 1.08, 0.46);
  markShadow(g, true, false);
  return g;
}

export function makeShotgun() {
  const g = new THREE.Group();
  const wood = paint("#6b3e22", { roughness: 0.55 });
  const steel = metal("#2a2a30");
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.06, 0.48, 6, 12),
    wood
  );
  body.rotation.x = Math.PI / 2;
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.038, 0.5, 14),
    steel
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0.5;
  g.add(body, barrel);
  g.position.set(0.42, 1.08, 0.4);
  markShadow(g, true, false);
  return g;
}

export function makePickaxe() {
  const g = new THREE.Group();
  const haft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.038, 1.05, 12),
    paint("#c9a06a", { roughness: 0.5 })
  );
  haft.position.y = 0.2;
  const head = ball(0.11, metal("#8ab4c8"), 16, 12);
  head.position.y = 0.72;
  const blade = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 12, 10),
    metal("#d0d8e0")
  );
  blade.scale.set(1.8, 0.45, 0.45);
  blade.position.set(0.2, 0.72, 0);
  g.add(haft, head, blade);
  g.position.set(0.42, 1.05, 0.2);
  g.rotation.z = -0.45;
  markShadow(g, true, false);
  return g;
}

function balloonTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const bands = ["#7ec8d8", "#f4f8fc", "#5ab3c6", "#ffffff", "#8fd4e0"];
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = bands[i % bands.length];
    ctx.fillRect(0, (i * 256) / 14, 512, 256 / 14 + 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function makeBus() {
  const g = new THREE.Group();
  const blue = paint("#2f6fe0", { roughness: 0.38 });
  const darkBlue = paint("#1e4dad", { roughness: 0.4 });
  const chrome = metal("#c5d0dc", { roughness: 0.22 });
  const steel = metal("#4a5360", { roughness: 0.35 });
  const glass = gloss("#9ad8ff", {
    roughness: 0.08,
    metalness: 0.4,
    transparent: true,
    opacity: 0.78,
  });

  const body = new THREE.Mesh(
    new RoundedBoxGeometry(5.6, 2.05, 2.25, 6, 0.22),
    blue
  );
  body.position.y = 1.15;

  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 24, 16, 0, Math.PI, 0.3, 2.2),
    blue
  );
  nose.scale.set(1.15, 0.95, 1.05);
  nose.rotation.y = Math.PI / 2;
  nose.position.set(2.55, 1.05, 0);

  const bumper = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.08, 8, 20, Math.PI),
    chrome
  );
  bumper.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  bumper.position.set(2.85, 0.55, 0);
  bumper.scale.set(1, 1.15, 1);

  const stripe = new THREE.Mesh(
    new RoundedBoxGeometry(5.4, 0.12, 2.28, 2, 0.04),
    paint("#f4f0e8")
  );
  stripe.position.y = 1.55;

  for (let i = 0; i < 6; i++) {
    const win = new THREE.Mesh(
      new RoundedBoxGeometry(0.55, 0.42, 0.06, 2, 0.04),
      glass
    );
    win.position.set(-2.1 + i * 0.78, 1.72, 1.12);
    const win2 = win.clone();
    win2.position.z = -1.12;
    g.add(win, win2);
  }
  const windshield = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 0.7),
    glass
  );
  windshield.position.set(2.72, 1.55, 0);
  windshield.rotation.y = Math.PI / 2;

  for (let i = 0; i < 2; i++) {
    const z = i === 0 ? 0.95 : -0.95;
    for (const x of [-1.7, 1.7]) {
      const tire = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.12, 10, 18),
        paint("#1a1a1a", { roughness: 0.8 })
      );
      tire.position.set(x, 0.32, z);
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12),
        chrome
      );
      hub.rotation.x = Math.PI / 2;
      hub.position.copy(tire.position);
      g.add(tire, hub);
    }
  }

  const arm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.09, 2.4, 10),
    steel
  );
  arm.position.set(0, 0.55, 1.28);
  arm.rotation.z = Math.PI / 2;
  const arm2 = arm.clone();
  arm2.position.z = -1.28;
  const brace = new THREE.Mesh(
    new RoundedBoxGeometry(0.18, 1.4, 2.6, 2, 0.04),
    steel
  );
  brace.position.set(-2.4, 0.7, 0);

  const roof = new THREE.Mesh(
    new RoundedBoxGeometry(3.2, 0.16, 1.6, 3, 0.05),
    darkBlue
  );
  roof.position.y = 2.25;

  const glow = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.06, 10, 28),
    paint("#7cf0ff", { emissive: "#3ad4ff", emissiveIntensity: 1.4, roughness: 0.2 })
  );
  glow.rotation.x = Math.PI / 2;
  glow.position.set(0, 2.38, 0);
  const core = ball(0.18, paint("#dff9ff", { emissive: "#9ef0ff", emissiveIntensity: 1.1 }));
  core.position.set(0, 2.42, 0);

  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 16, 12, 0, Math.PI * 2, 0, 1.2),
    chrome
  );
  dish.position.set(1.1, 2.55, 0.2);
  dish.rotation.x = -0.6;
  const dishArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.35, 8),
    steel
  );
  dishArm.position.set(1.1, 2.38, 0.05);

  const propHub = new THREE.Group();
  propHub.position.set(-1.15, 2.55, 0.45);
  const engine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.12, 0.28, 12),
    steel
  );
  engine.rotation.z = Math.PI / 2;
  const blade = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 10, 8),
    paint("#d8dde4")
  );
  blade.scale.set(0.28, 4.4, 0.7);
  const blade2 = blade.clone();
  blade2.rotation.z = Math.PI / 2;
  propHub.add(engine, blade, blade2);
  g.userData.propeller = propHub;

  const balloon = new THREE.Mesh(
    new THREE.SphereGeometry(2.15, 36, 28),
    new THREE.MeshStandardMaterial({
      map: balloonTexture(),
      roughness: 0.45,
      metalness: 0.04,
    })
  );
  balloon.position.y = 6.15;
  balloon.scale.set(1.15, 0.95, 1.05);

  const basketRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.7, 0.05, 8, 20),
    steel
  );
  basketRing.rotation.x = Math.PI / 2;
  basketRing.position.y = 2.7;

  const cableMat = paint("#f0d020", { roughness: 0.5 });
  for (const [x, z] of [
    [-1.4, 0.7],
    [1.4, 0.7],
    [-1.4, -0.7],
    [1.4, -0.7],
  ] as const) {
    const cable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 3.2, 8),
      cableMat
    );
    cable.position.set(x, 4.2, z);
    cable.lookAt(0, 6.1, 0);
    g.add(cable);
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.18, 8),
      paint("#1a1a1a")
    );
    band.position.set(x, 2.85, z);
    g.add(band);
  }

  g.add(
    body,
    nose,
    bumper,
    stripe,
    windshield,
    arm,
    arm2,
    brace,
    roof,
    glow,
    core,
    dish,
    dishArm,
    propHub,
    balloon,
    basketRing
  );
  markShadow(g);
  return g;
}

export function makeTree() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.32, 2.5, 12),
    paint("#6b3e18", { roughness: 0.75 })
  );
  trunk.position.y = 1.25;
  const leaf = paint("#2f9a3c", { roughness: 0.55 });
  const canopy = ball(1.35, leaf, 20, 16);
  canopy.position.y = 3.15;
  canopy.scale.set(1.25, 1.0, 1.2);
  const canopy2 = ball(0.95, paint("#3cb34a", { roughness: 0.55 }), 16, 12);
  canopy2.position.set(0.5, 3.45, 0.15);
  const canopy3 = ball(0.75, leaf, 14, 12);
  canopy3.position.set(-0.45, 3.2, 0.25);
  g.add(trunk, canopy, canopy2, canopy3);
  markShadow(g);
  return g;
}

export function makeBuilding(
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
  color: string,
  roof = "#5a3040"
) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(w, h, d, 4, Math.min(0.28, Math.min(w, d) * 0.06)),
    paint(color, { roughness: 0.52 })
  );
  body.position.y = h / 2;
  const top = new THREE.Mesh(
    new THREE.SphereGeometry(Math.max(w, d) * 0.42, 16, 10, 0, Math.PI * 2, 0, 1.1),
    paint(roof, { roughness: 0.48 })
  );
  top.position.y = h + 0.15;
  top.scale.set(1.15, 0.45, 1.15);
  const door = new THREE.Mesh(
    new RoundedBoxGeometry(Math.min(1.4, w * 0.28), Math.min(2.2, h * 0.28), 0.1, 3, 0.04),
    paint("#2a1c14")
  );
  door.position.set(0, Math.min(1.2, h * 0.16), d / 2 + 0.02);
  g.add(body, top, door);
  const cols = Math.max(2, Math.floor(w / 3));
  const rows = Math.max(2, Math.floor(h / 3.2));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const win = new THREE.Mesh(
        new RoundedBoxGeometry(0.7, 0.9, 0.08, 2, 0.04),
        paint("#ffe08a", { emissive: "#c9a040", emissiveIntensity: 0.28, roughness: 0.2 })
      );
      win.position.set(
        -w / 2 + (c + 0.7) * (w / (cols + 0.4)),
        2.2 + r * 2.4,
        d / 2 + 0.04
      );
      g.add(win);
    }
  }
  g.position.set(x, 0, z);
  markShadow(g);
  return g;
}

export function makeChest() {
  const g = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 20, 14),
    paint("#e8b020", { roughness: 0.35, metalness: 0.25 })
  );
  box.scale.set(1.2, 0.7, 0.9);
  box.position.y = 0.32;
  const lid = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 18, 12, 0, Math.PI * 2, 0, 1.2),
    paint("#f0c840", { roughness: 0.32, metalness: 0.28 })
  );
  lid.scale.set(1.18, 0.45, 0.88);
  lid.position.y = 0.52;
  const glow = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.025, 8, 20),
    paint("#7cf0ff", { emissive: "#5af0ff", emissiveIntensity: 1.2 })
  );
  glow.position.set(0, 0.42, 0.28);
  g.add(box, lid, glow);
  markShadow(g);
  return g;
}

export function makeCloud(x: number, y: number, z: number, s = 1) {
  const g = new THREE.Group();
  const mat = paint("#ffffff", { roughness: 0.95, transparent: true, opacity: 0.9 });
  const a = ball(2.2 * s, mat, 20, 16);
  const b = ball(1.6 * s, mat, 16, 12);
  b.position.set(2.1 * s, 0.2 * s, 0.4 * s);
  const c = ball(1.4 * s, mat, 16, 12);
  c.position.set(-1.8 * s, -0.1 * s, 0.2 * s);
  const d = ball(1.2 * s, mat, 14, 12);
  d.position.set(0.4 * s, 0.5 * s, -0.6 * s);
  g.add(a, b, c, d);
  g.position.set(x, y, z);
  return g;
}

export function addFortniteSky(scene: THREE.Scene) {
  const sky = new Sky();
  sky.scale.setScalar(450);
  scene.add(sky);
  const uniforms = sky.material.uniforms;
  uniforms.turbidity.value = 4.8;
  uniforms.rayleigh.value = 1.15;
  uniforms.mieCoefficient.value = 0.0035;
  uniforms.mieDirectionalG.value = 0.82;
  const sun = new THREE.Vector3();
  sun.setFromSphericalCoords(1, Math.PI / 2 - 0.48, 0.28);
  uniforms.sunPosition.value.copy(sun);
  scene.fog = new THREE.Fog(0x9fd4f5, 70, 240);
  scene.background = new THREE.Color(0x7ec8f8);
  return sun;
}

export function makeGrassField(count = 160) {
  const geo = new THREE.SphereGeometry(0.16, 8, 6);
  geo.scale(0.45, 1.6, 0.45);
  const mesh = new THREE.InstancedMesh(
    geo,
    paint("#3dcc4a", { roughness: 0.7 }),
    count
  );
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 8 + Math.random() * 58;
    dummy.position.set(Math.cos(a) * r, 0.18, Math.sin(a) * r);
    dummy.rotation.y = Math.random() * Math.PI;
    dummy.scale.setScalar(0.7 + Math.random() * 0.8);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.receiveShadow = true;
  return mesh;
}
