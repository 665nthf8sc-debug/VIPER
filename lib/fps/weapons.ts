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
};

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  pickaxe: {
    id: "pickaxe",
    name: "PICKAXE",
    dmg: 42,
    range: 1.35,
    cool: 22,
    spread: 0.22,
    pellets: 1,
    auto: false,
    slot: 0,
  },
  pump: {
    id: "pump",
    name: "PUMP",
    dmg: 28,
    range: 4.2,
    cool: 34,
    spread: 0.12,
    pellets: 8,
    auto: false,
    slot: 1,
  },
  scar: {
    id: "scar",
    name: "SCAR",
    dmg: 22,
    range: 9,
    cool: 7,
    spread: 0.04,
    pellets: 1,
    auto: true,
    slot: 2,
  },
  exotic: {
    id: "exotic",
    name: "EXOTIC SCAR",
    dmg: 26,
    range: 10,
    cool: 6,
    spread: 0.03,
    pellets: 1,
    auto: true,
    slot: 3,
  },
};

export function weaponFromPickup(
  kind: "pump" | "scar" | "exotic"
): WeaponId {
  return kind;
}
