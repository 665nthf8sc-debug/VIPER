export type Tower = { x: number; w: number; h: number; tone: string };

export type Poi = {
  id: string;
  name: string;
  tag: string;
  skyTop: string;
  skyBot: string;
  ground: string;
  dirt: string;
  accent: string;
  water?: boolean;
  towers: Tower[];
};

export const POIS: Poi[] = [
  {
    id: "tilted",
    name: "TILTED TOWERS",
    tag: "POI 01",
    skyTop: "#120024",
    skyBot: "#2a1030",
    ground: "#2a1a14",
    dirt: "#1a100c",
    accent: "#ffcc00",
    towers: [
      { x: 10, w: 28, h: 56, tone: "#6a6a78" },
      { x: 42, w: 36, h: 88, tone: "#7a7a88" },
      { x: 84, w: 44, h: 120, tone: "#8a8a96" },
      { x: 134, w: 36, h: 96, tone: "#747484" },
      { x: 176, w: 28, h: 64, tone: "#686878" },
      { x: 210, w: 32, h: 48, tone: "#5c5c6c" },
    ],
  },
  {
    id: "retail",
    name: "RETAIL ROW",
    tag: "POI 02",
    skyTop: "#102038",
    skyBot: "#243848",
    ground: "#3a3428",
    dirt: "#241e16",
    accent: "#3cdcff",
    towers: [
      { x: 8, w: 40, h: 36, tone: "#8a7060" },
      { x: 54, w: 48, h: 44, tone: "#c45a3a" },
      { x: 110, w: 52, h: 40, tone: "#6a88a0" },
      { x: 170, w: 40, h: 32, tone: "#d4b060" },
      { x: 216, w: 32, h: 28, tone: "#7a9080" },
    ],
  },
  {
    id: "salty",
    name: "SALTY SPRINGS",
    tag: "POI 03",
    skyTop: "#241818",
    skyBot: "#c47840",
    ground: "#c4a060",
    dirt: "#8a6840",
    accent: "#ff6a00",
    towers: [
      { x: 16, w: 28, h: 28, tone: "#e8d8c0" },
      { x: 52, w: 24, h: 22, tone: "#d4c4a8" },
      { x: 96, w: 32, h: 30, tone: "#f0e0c8" },
      { x: 148, w: 26, h: 24, tone: "#dcc8a8" },
      { x: 196, w: 30, h: 26, tone: "#e8d0b0" },
    ],
  },
  {
    id: "pleasant",
    name: "PLEASANT PARK",
    tag: "POI 04",
    skyTop: "#1a3048",
    skyBot: "#4a88c0",
    ground: "#3a6a28",
    dirt: "#244818",
    accent: "#00e800",
    towers: [
      { x: 12, w: 30, h: 26, tone: "#e8e0d0" },
      { x: 56, w: 36, h: 32, tone: "#f0e8d8" },
      { x: 112, w: 28, h: 24, tone: "#d8d0c0" },
      { x: 160, w: 34, h: 30, tone: "#ece4d4" },
      { x: 210, w: 28, h: 22, tone: "#c8d8b0" },
    ],
  },
  {
    id: "loot",
    name: "LOOT LAKE",
    tag: "POI 05",
    skyTop: "#081828",
    skyBot: "#184060",
    ground: "#1a3040",
    dirt: "#0c1820",
    accent: "#3cdcff",
    water: true,
    towers: [
      { x: 20, w: 36, h: 22, tone: "#8a7a60" },
      { x: 168, w: 40, h: 26, tone: "#6a8070" },
      { x: 214, w: 28, h: 18, tone: "#5a7060" },
    ],
  },
];
