export type CampaignMission = {
  id: string;
  season: string;
  title: string;
  blurb: string;
  poi: number;
  kills: number;
  unlock?: "jonesy" | "peely";
  neo?: boolean;
};

export const MISSIONS: CampaignMission[] = [
  {
    id: "s1",
    season: "S1",
    title: "THE ISLAND AWAKENS",
    blurb: "First bus. First storm. Land Loot Lake and live.",
    poi: 4,
    kills: 3,
  },
  {
    id: "s2",
    season: "S2",
    title: "TILTED TOWERS RISES",
    blurb: "Never land Tilted. Land Tilted. Unlock Jonesy.",
    poi: 0,
    kills: 4,
    unlock: "jonesy",
  },
  {
    id: "s3",
    season: "S3",
    title: "A STAR FALLS",
    blurb: "Retail under a bad sky. Keep moving.",
    poi: 1,
    kills: 4,
  },
  {
    id: "s4",
    season: "S4",
    title: "IMPACT",
    blurb: "Crater dust. Salty still standing. You too.",
    poi: 2,
    kills: 5,
  },
  {
    id: "rocket",
    season: "S4",
    title: "ROCKET LAUNCH",
    blurb: "Visitor in the desert. Pleasant goes loud.",
    poi: 3,
    kills: 5,
  },
  {
    id: "cube",
    season: "S6",
    title: "THE CUBE",
    blurb: "Purple boss sprite. Peel the island. Unlock Peely.",
    poi: 4,
    kills: 5,
    unlock: "peely",
  },
  {
    id: "neo",
    season: "S9",
    title: "NEO TILTED",
    blurb: "Same towers. New chrome.",
    poi: 0,
    kills: 6,
    neo: true,
  },
  {
    id: "end",
    season: "SX",
    title: "THE END",
    blurb: "Black hole. Last circle. Victory Royale.",
    poi: 0,
    kills: 7,
  },
];
