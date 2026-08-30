"use client";

import { PixelPanel, RpgDialog } from "@/components/pixel-panel";
import { useEffect, useState } from "react";

const LINES = [
  "PLAYER 1: VIPER3384",
  "CLASS: FOX / BUILDER / CHAOS",
  "HOME WORLD: CHAPTER 1",
  "FAVORITE POI: TILTED TOWERS",
  "CHANNEL: @COOLFOX3384",
  "",
  "This cart was found behind a dusty CRT,",
  "labeled in marker: DO NOT LAND TILTED.",
  "Somebody landed anyway.",
  "",
  "If you grew up dropping into those towers,",
  "hearing the meteor siren, and screaming",
  "at a pump shotgun... this memorial is for you.",
  "",
  "No guilds. No quests to fill out.",
  "Just a fox, a skyline, and a rock in the sky.",
];

export function About() {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setShown((n) => (n < LINES.length ? n + 1 : n));
    }, 420);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section id="about" className="section-wrap py-16 sm:py-20">
      <PixelPanel title="PLAYER 1  •  STATUS">
        <div className="grid gap-6 md:grid-cols-[160px_minmax(0,1fr)] md:items-start">
          <div className="mx-auto w-40">
            <div className="pixel-bevel-orange bg-[#1a0033] p-3">
              <svg
                viewBox="0 0 16 16"
                className="h-full w-full"
                shapeRendering="crispEdges"
                aria-label="8-bit VIPER avatar"
              >
                <rect width="16" height="16" fill="#12001f" />
                <rect x="5" y="1" width="6" height="1" fill="#140008" />
                <rect x="4" y="2" width="8" height="5" fill="#f8f0d8" />
                <rect x="3" y="3" width="10" height="3" fill="#f8f0d8" />
                <rect x="5" y="4" width="2" height="2" fill="#140008" />
                <rect x="9" y="4" width="2" height="2" fill="#140008" />
                <rect x="4" y="7" width="8" height="1" fill="#140008" />
                <rect x="3" y="8" width="10" height="5" fill="#ff6a00" />
                <rect x="2" y="9" width="12" height="3" fill="#ff6a00" />
                <rect x="4" y="13" width="3" height="2" fill="#140008" />
                <rect x="9" y="13" width="3" height="2" fill="#140008" />
                <rect x="4" y="15" width="3" height="1" fill="#ffcc00" />
                <rect x="9" y="15" width="3" height="1" fill="#ffcc00" />
              </svg>
            </div>
            <p className="font-press mt-3 text-center text-[10px] text-[#ffcc00]">
              VIPER
            </p>
            <p className="font-press text-center text-[8px] text-[#c9a0ff]">
              LV 38
            </p>
          </div>
          <RpgDialog speaker="STAFF CREDITS">
            <div className="min-h-[220px] font-vt text-lg leading-7 sm:text-xl">
              {LINES.slice(0, shown).map((line, i) => (
                <p key={`${line}-${i}`} className={line ? "" : "h-4"}>
                  {line}
                  {i === shown - 1 && line ? (
                    <span className="blink">█</span>
                  ) : null}
                </p>
              ))}
            </div>
          </RpgDialog>
        </div>
      </PixelPanel>
    </section>
  );
}
