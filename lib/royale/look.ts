import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";

let ramp: THREE.DataTexture | null = null;

function toonRamp() {
  if (ramp) return ramp;
  const data = new Uint8Array([
    28, 28, 36, 255, 110, 110, 120, 255, 210, 210, 220, 255, 255, 255, 255, 255,
  ]);
  ramp = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  ramp.minFilter = THREE.NearestFilter;
  ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  return ramp;
}

export function toon(color: string | number) {
  const mat = new THREE.MeshToonMaterial({ color });
  mat.gradientMap = toonRamp();
  return mat;
}

export function phong(color: string | number, extras: THREE.MeshPhongMaterialParameters = {}) {
  return new THREE.MeshPhongMaterial({
    color,
    shininess: 28,
    specular: 0x335544,
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

export type FighterStyle = "fox" | "chief" | "jonesy" | "peely" | "bot";

export function makeFighter(
  style: FighterStyle,
  body: string,
  skin: string,
  accent: string
) {
  const g = new THREE.Group();
  const isPeely = style === "peely";
  const isChief = style === "chief";
  const suit = isPeely ? "#ffe14a" : body;
  const flesh = isPeely ? "#ffe14a" : isChief ? "#6b8f3c" : skin;

  const hip = new THREE.Mesh(
    new RoundedBoxGeometry(0.62, 0.28, 0.38, 3, 0.08),
    toon(suit)
  );
  hip.position.y = 0.72;
  const belt = new THREE.Mesh(
    new RoundedBoxGeometry(0.66, 0.08, 0.42, 2, 0.03),
    toon(accent)
  );
  belt.position.y = 0.88;

  const torso = new THREE.Mesh(
    new RoundedBoxGeometry(0.7, 0.78, 0.42, 4, 0.1),
    toon(suit)
  );
  torso.position.y = 1.22;

  const head = new THREE.Mesh(
    isPeely
      ? new THREE.CapsuleGeometry(0.2, 0.42, 6, 12)
      : new THREE.SphereGeometry(0.23, 16, 12),
    toon(flesh)
  );
  head.position.y = isPeely ? 1.95 : 1.78;
  if (isPeely) head.scale.set(1.05, 1.15, 0.85);

  const eyeL = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 8, 8),
    new THREE.MeshBasicMaterial({ color: isChief ? "#ffcc00" : "#1a1020" })
  );
  eyeL.position.set(-0.07, isPeely ? 2.02 : 1.8, 0.18);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.07;

  if (isChief) {
    const helm = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 16, 12),
      toon("#556b2f")
    );
    helm.scale.set(1, 0.95, 1.05);
    helm.position.y = 1.8;
    const visor = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0.7, 0.55),
      phong("#ffcc00", { shininess: 90, specular: 0xffee88 })
    );
    visor.position.set(0, 1.78, 0.04);
    g.add(helm, visor);
  }

  if (style === "fox") {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 8), toon(suit));
    ear.position.set(-0.14, 2.02, 0);
    ear.rotation.z = 0.35;
    const ear2 = ear.clone();
    ear2.position.x = 0.14;
    ear2.rotation.z = -0.35;
    const muzzle = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 10, 8),
      toon("#f8f0d8")
    );
    muzzle.position.set(0, 1.7, 0.16);
    g.add(ear, ear2, muzzle);
  }

  if (style === "jonesy" || style === "bot") {
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 12, 10),
      toon(style === "jonesy" ? "#5a3210" : "#2a1a10")
    );
    hair.scale.set(1.05, 0.55, 1.1);
    hair.position.set(0, 1.94, -0.02);
    g.add(hair);
  }

  const pack = new THREE.Mesh(
    new RoundedBoxGeometry(0.42, 0.5, 0.22, 2, 0.06),
    toon(isPeely ? "#e8c020" : "#2a3344")
  );
  pack.position.set(0, 1.22, -0.28);

  const legL = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.11, 0.42, 4, 8),
    toon(isChief ? "#4a5c28" : "#1c2430")
  );
  legL.position.set(-0.16, 0.38, 0);
  const legR = legL.clone();
  legR.position.x = 0.16;

  const bootL = new THREE.Mesh(
    new RoundedBoxGeometry(0.2, 0.14, 0.28, 2, 0.04),
    toon("#141820")
  );
  bootL.position.set(-0.16, 0.08, 0.04);
  const bootR = bootL.clone();
  bootR.position.x = 0.16;

  const armL = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.08, 0.38, 4, 8),
    toon(suit)
  );
  armL.position.set(-0.42, 1.18, 0);
  const armR = armL.clone();
  armR.position.x = 0.42;

  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), toon(flesh));
  handL.position.set(-0.42, 0.88, 0.04);
  const handR = handL.clone();
  handR.position.x = 0.42;

  g.add(
    hip,
    belt,
    torso,
    head,
    eyeL,
    eyeR,
    pack,
    legL,
    legR,
    bootL,
    bootR,
    armL,
    armR,
    handL,
    handR
  );
  g.userData.armR = armR;
  g.userData.legL = legL;
  g.userData.legR = legR;
  markShadow(g);
  return g;
}

export function makeRifle() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(0.12, 0.14, 0.9, 2, 0.03),
    toon("#2b3038")
  );
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.035, 0.55, 8),
    phong("#1a1c22", { shininess: 60 })
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0.65;
  const mag = new THREE.Mesh(new RoundedBoxGeometry(0.08, 0.22, 0.12, 2, 0.02), toon("#1a1c22"));
  mag.position.set(0, -0.14, 0.05);
  const stock = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.12, 0.28, 2, 0.03), toon("#3a4048"));
  stock.position.z = -0.5;
  g.add(body, barrel, mag, stock);
  g.position.set(0.38, 1.12, 0.42);
  markShadow(g, true, false);
  return g;
}

export function makeShotgun() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(0.14, 0.16, 0.7, 2, 0.03),
    toon("#4a3020")
  );
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.04, 0.5, 8),
    phong("#2a2a30", { shininess: 50 })
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0.5;
  g.add(body, barrel);
  g.position.set(0.38, 1.12, 0.38);
  markShadow(g, true, false);
  return g;
}

export function makePickaxe() {
  const g = new THREE.Group();
  const haft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.04, 1.05, 8),
    toon("#c9a06a")
  );
  haft.position.y = 0.2;
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 10, 8),
    phong("#8ab4c8", { shininess: 80 })
  );
  head.position.y = 0.72;
  const blade = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.38, 8), toon("#d0d8e0"));
  blade.rotation.z = Math.PI / 2;
  blade.position.set(0.2, 0.72, 0);
  g.add(haft, head, blade);
  g.position.set(0.42, 1.05, 0.2);
  g.rotation.z = -0.45;
  markShadow(g, true, false);
  return g;
}

export function makeBus() {
  const g = new THREE.Group();
  const balloon = new THREE.Mesh(
    new THREE.SphereGeometry(2.6, 24, 16),
    toon("#ffcc33")
  );
  balloon.position.y = 5.6;
  balloon.scale.set(1.55, 0.9, 1.15);
  const stripe = new THREE.Mesh(
    new THREE.TorusGeometry(1.7, 0.12, 8, 24),
    toon("#ff7a00")
  );
  stripe.position.y = 5.5;
  stripe.rotation.x = Math.PI / 2;
  const gondola = new THREE.Mesh(
    new RoundedBoxGeometry(5.4, 2.0, 2.3, 4, 0.18),
    toon("#3d7cff")
  );
  gondola.position.y = 1.0;
  const windowBand = new THREE.Mesh(
    new RoundedBoxGeometry(5.0, 0.55, 2.32, 2, 0.05),
    phong("#9ad8ff", { shininess: 90, transparent: true, opacity: 0.85 })
  );
  windowBand.position.y = 1.35;
  const ropeL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.4, 6), toon("#f4f0e0"));
  ropeL.position.set(-1.4, 3.2, 0);
  const ropeR = ropeL.clone();
  ropeR.position.x = 1.4;
  g.add(balloon, stripe, gondola, windowBand, ropeL, ropeR);
  markShadow(g);
  return g;
}

export function makeTree() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.38, 2.4, 8),
    toon("#6b3e18")
  );
  trunk.position.y = 1.2;
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.45, 12, 10), toon("#2f9a3c"));
  canopy.position.y = 3.1;
  canopy.scale.set(1.2, 0.95, 1.15);
  const canopy2 = new THREE.Mesh(new THREE.SphereGeometry(1.05, 10, 8), toon("#3cb34a"));
  canopy2.position.set(0.45, 3.35, 0.2);
  g.add(trunk, canopy, canopy2);
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
    new RoundedBoxGeometry(w, h, d, 2, 0.12),
    toon(color)
  );
  body.position.y = h / 2;
  const top = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(w, d) * 0.72, Math.min(3.2, h * 0.28), 4),
    toon(roof)
  );
  top.position.y = h + Math.min(1.4, h * 0.12);
  top.rotation.y = Math.PI / 4;
  const door = new THREE.Mesh(
    new RoundedBoxGeometry(Math.min(1.4, w * 0.28), Math.min(2.2, h * 0.28), 0.08, 2, 0.04),
    toon("#2a1c14")
  );
  door.position.set(0, Math.min(1.2, h * 0.16), d / 2 + 0.02);
  g.add(body, top, door);
  const cols = Math.max(2, Math.floor(w / 3));
  const rows = Math.max(2, Math.floor(h / 3.2));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 0.9),
        phong("#ffe08a", { emissive: "#c9a040", emissiveIntensity: 0.35 })
      );
      win.position.set(
        -w / 2 + (c + 0.7) * (w / (cols + 0.4)),
        2.2 + r * 2.4,
        d / 2 + 0.03
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
    new RoundedBoxGeometry(0.95, 0.55, 0.7, 3, 0.08),
    toon("#e8b020")
  );
  box.position.y = 0.3;
  const lid = new THREE.Mesh(
    new RoundedBoxGeometry(0.95, 0.16, 0.7, 3, 0.08),
    toon("#f0c840")
  );
  lid.position.y = 0.58;
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.08),
    new THREE.MeshBasicMaterial({ color: "#7cf0ff" })
  );
  glow.position.set(0, 0.42, 0.36);
  g.add(box, lid, glow);
  markShadow(g);
  return g;
}

export function makeCloud(x: number, y: number, z: number, s = 1) {
  const g = new THREE.Group();
  const mat = toon("#ffffff");
  mat.transparent = true;
  mat.opacity = 0.92;
  const a = new THREE.Mesh(new THREE.SphereGeometry(2.2 * s, 12, 10), mat);
  const b = new THREE.Mesh(new THREE.SphereGeometry(1.6 * s, 10, 8), mat);
  b.position.set(2.1 * s, 0.2 * s, 0.4 * s);
  const c = new THREE.Mesh(new THREE.SphereGeometry(1.4 * s, 10, 8), mat);
  c.position.set(-1.8 * s, -0.1 * s, 0.2 * s);
  g.add(a, b, c);
  g.position.set(x, y, z);
  return g;
}

export function addFortniteSky(scene: THREE.Scene) {
  const sky = new Sky();
  sky.scale.setScalar(450);
  scene.add(sky);
  const uniforms = sky.material.uniforms;
  uniforms.turbidity.value = 6.5;
  uniforms.rayleigh.value = 1.35;
  uniforms.mieCoefficient.value = 0.004;
  uniforms.mieDirectionalG.value = 0.8;
  const sun = new THREE.Vector3();
  sun.setFromSphericalCoords(1, Math.PI / 2 - 0.42, 0.35);
  uniforms.sunPosition.value.copy(sun);
  scene.fog = new THREE.Fog(0xa8d8ff, 55, 210);
  scene.background = new THREE.Color(0x7ec8f8);
  return sun;
}

export function makeGrassField(count = 160) {
  const geo = new THREE.ConeGeometry(0.12, 0.45, 5);
  const mesh = new THREE.InstancedMesh(geo, toon("#3dcc4a"), count);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 8 + Math.random() * 58;
    dummy.position.set(Math.cos(a) * r, 0.2, Math.sin(a) * r);
    dummy.rotation.y = Math.random() * Math.PI;
    dummy.scale.setScalar(0.7 + Math.random() * 0.8);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.receiveShadow = true;
  return mesh;
}
