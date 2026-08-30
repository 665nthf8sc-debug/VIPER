"use client";

import { PixelIcon, PixelPanel, RpgDialog } from "@/components/pixel-panel";

const EVENTS = [
  {
    year: "JUL 2017",
    title: "THE ISLAND AWAKENS",
    map: "S1",
    text: "A strange island appears. One hundred souls drop from a blue bus. Nobody knows the storm is only the beginning.",
  },
  {
    year: "DEC 2017",
    title: "TILTED TOWERS RISES",
    map: "S2",
    text: "Glass and steel punch the sky. Tilted becomes the loudest POI on the cart. Every kid learns the same lesson: never land here... then lands here anyway.",
  },
  {
    year: "FEB 2018",
    title: "A STAR FALLS",
    map: "S3",
    text: "A rock hangs in the sky. VIPER clocks it, then lands anyway. The lesson is not the omen. The lesson is the drop.",
  },
  {
    year: "MAY 2018",
    title: "IMPACT",
    map: "S4",
    text: "Dusty Depot is gone. Hop rocks bloom in the crater. Tilted survives the strike, but the skyline never feels safe again.",
  },
  {
    year: "JUN 2018",
    title: "ROCKET LAUNCH",
    map: "S4",
    text: "A visitor builds a rocket in the desert. The sky rips open. For a moment the whole island is a loading screen.",
  },
  {
    year: "S6 2018",
    title: "THE CUBE",
    map: "S6",
    text: "A purple cube rolls like a boss sprite. It hums, it dances, it lifts an island. 8-bit magic with 2018 lighting.",
  },
  {
    year: "S9 2019",
    title: "NEO TILTED",
    map: "S9",
    text: "The towers are rebuilt as neon chrome. Same bones, new palette. Some called it progress. The memorial calls it a continue screen.",
  },
  {
    year: "OCT 2019",
    title: "THE END",
    map: "SX",
    text: "Black holes eat the map. Chapter 1 shuts off like a NES that lost power. The bus is still flying somewhere in the static.",
  },
];

function MapChip({ label }: { label: string }) {
  return (
    <div className="pixel-border relative h-16 w-16 shrink-0 bg-[#1a4a2a] p-1">
      <div className="grid h-full w-full grid-cols-4 grid-rows-4 gap-px bg-[#0a2010]">
        {Array.from({ length: 16 }).map((_, i) => (
          <span
            key={i}
            className="block"
            style={{
              background:
                i === 5 || i === 6 || i === 9
                  ? "#ff6a00"
                  : i % 3 === 0
                    ? "#2f7a43"
                    : "#245c34",
            }}
          />
        ))}
      </div>
      <span className="font-press absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#12001f] px-1 text-[8px] text-[#ffcc00]">
        {label}
      </span>
    </div>
  );
}

export function Timeline() {
  return (
    <section id="lore" className="section-wrap py-16 sm:py-20">
      <PixelPanel title="CHAPTER 1  •  QUEST LOG">
        <p className="font-vt mb-6 text-xl text-[#c9a0ff] sm:text-2xl">
          Talk to the villagers. Read the signs. This is how the island taught
          VIPER to drop.
        </p>
        <ol className="space-y-5">
          {EVENTS.map((event) => (
            <li
              key={event.title}
              className="flex flex-col gap-3 sm:flex-row sm:items-start"
            >
              <div className="flex items-center gap-3 sm:w-44 sm:shrink-0 sm:flex-col sm:items-start">
                <PixelIcon name="map" />
                <MapChip label={event.map} />
                <span className="font-press text-[9px] text-[#ff6a00]">
                  {event.year}
                </span>
              </div>
              <RpgDialog speaker={event.title} className="flex-1">
                {event.text}
              </RpgDialog>
            </li>
          ))}
        </ol>
      </PixelPanel>
    </section>
  );
}
