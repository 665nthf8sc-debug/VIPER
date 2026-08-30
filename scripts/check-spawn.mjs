/** Verify spawn helper: wall cells relocate, open cells stay. */
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../lib/fps/map.ts", import.meta.url), "utf8");
const raw = src.match(/const RAW = `([\s\S]*?)`\.trim\(\)/)?.[1];
if (!raw) {
  console.error("could not read RAW map");
  process.exit(1);
}
const lines = raw.trim().split("\n").map((l) => l.trim());
const MAP_W = 32;
const MAP_H = 32;
const grid = [];
for (let y = 0; y < MAP_H; y++) {
  const row = [];
  for (let x = 0; x < MAP_W; x++) {
    const ch = lines[y]?.[x] ?? "4";
    row.push(ch === "." ? 0 : Number(ch));
  }
  grid.push(row);
}

function wallAt(x, y) {
  const gx = Math.floor(x);
  const gy = Math.floor(y);
  if (gx < 0 || gy < 0 || gx >= MAP_W || gy >= MAP_H) return 1;
  return grid[gy][gx];
}
function isBlocked(x, y, r = 0.22) {
  return (
    wallAt(x - r, y - r) > 0 ||
    wallAt(x + r, y - r) > 0 ||
    wallAt(x - r, y + r) > 0 ||
    wallAt(x + r, y + r) > 0
  );
}
function isWalkableFloor(x, y, r = 0.4) {
  const gx = Math.floor(x);
  const gy = Math.floor(y);
  if (grid[gy]?.[gx] !== 0) return false;
  return !isBlocked(x, y, r);
}

function findOpenSpawn(preferX, preferY) {
  if (isWalkableFloor(preferX, preferY, 0.4)) return { x: preferX, y: preferY };
  const sx = Math.floor(preferX);
  const sy = Math.floor(preferY);
  for (let r = 1; r < 32; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = sx + dx + 0.5;
        const y = sy + dy + 0.5;
        if (isWalkableFloor(x, y, 0.4)) return { x, y };
      }
    }
  }
  return null;
}

const stuck = { x: 4.5, y: 14.5 };
const open = { x: 16.5, y: 16.5 };
const moved = findOpenSpawn(stuck.x, stuck.y);
const kept = findOpenSpawn(open.x, open.y);

let fail = 0;
if (isWalkableFloor(stuck.x, stuck.y, 0.4)) {
  console.error("expected 4.5,14.5 to be blocked");
  fail++;
}
if (!moved || !isWalkableFloor(moved.x, moved.y, 0.4)) {
  console.error("blocked spawn did not relocate to walkable floor", moved);
  fail++;
}
if (!kept || kept.x !== open.x || kept.y !== open.y) {
  console.error("open spawn should stay put", kept);
  fail++;
}
if (isBlocked(moved.x, moved.y, 0.4)) {
  console.error("relocated spawn still within 0.4 of a wall", moved);
  fail++;
}

if (fail) {
  console.error(`FAIL ${fail}`);
  process.exit(1);
}
console.log("ok spawn relocate", stuck, "->", moved);
console.log("ok spawn keep", kept);
