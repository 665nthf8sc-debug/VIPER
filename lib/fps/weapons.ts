export type WeaponId = "pickaxe" | "pump" | "scar" | "exotic";

export type WeaponDef = {
  id: WeaponId;
  name: string;
  dmg: number;
  range: number;
  cool: number;
  spread: number;
  pellets: number;
  auto: boolean;
  slot: number;
  magSize: number;
  reserveMax: number;
  startMag: number;
  startReserve: number;
  pickupReserve: number;
};

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  pickaxe: {
    id: "pickaxe",
    name: "PICKAXE",
    dmg: 42,
    range: 1.7,
    cool: 22,
    spread: 0.18,
    pellets: 1,
    auto: false,
    slot: 0,
    magSize: 0,
    reserveMax: 0,
    startMag: 0,
    startReserve: 0,
    pickupReserve: 0,
  },
  pump: {
    id: "pump",
    name: "PUMP",
    dmg: 28,
    range: 14,
    cool: 34,
    spread: 0.09,
    pellets: 8,
    auto: false,
    slot: 1,
    magSize: 5,
    reserveMax: 40,
    startMag: 5,
    startReserve: 15,
    pickupReserve: 10,
  },
  scar: {
    id: "scar",
    name: "SCAR",
    dmg: 22,
    range: 20,
    cool: 7,
    spread: 0.03,
    pellets: 1,
    auto: true,
    slot: 2,
    magSize: 30,
    reserveMax: 210,
    startMag: 30,
    startReserve: 90,
    pickupReserve: 30,
  },
  exotic: {
    id: "exotic",
    name: "EXOTIC SCAR",
    dmg: 26,
    range: 22,
    cool: 6,
    spread: 0.025,
    pellets: 1,
    auto: true,
    slot: 3,
    magSize: 25,
    reserveMax: 175,
    startMag: 25,
    startReserve: 75,
    pickupReserve: 25,
  },
};

export const WEAPON_ORDER: WeaponId[] = ["pickaxe", "pump", "scar", "exotic"];

export function weaponFromPickup(kind: "pump" | "scar" | "exotic") {
  return kind;
}

export function formatAmmo(mag: number, reserve: number) {
  return `${mag}/${reserve}`;
}
