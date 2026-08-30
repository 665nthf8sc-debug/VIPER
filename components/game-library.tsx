"use client";

import { PixelIcon, PixelPanel } from "@/components/pixel-panel";
import { Button } from "@/components/ui/button";
import { sfx } from "@/lib/sfx";

export function GameLibrary() {
  return (
    <section id="library" className="section-wrap py-16 sm:py-20">
      <PixelPanel title="VIPER LIBRARY  •  THREE CABINETS">
        <p className="font-vt mb-6 text-xl text-[#c9a0ff] sm:text-2xl">
          Lobby, drop, or hang on VIPER&apos;s Tilted meteor map.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <a
            href="#game"
            onClick={() => sfx.select()}
            className="pixel-border bg-[#05000a] p-5 transition hover:ring-4 hover:ring-[#ffcc00]"
          >
            <p className="font-press text-[10px] text-[#3cdcff]">01  NES CART</p>
            <h3 className="font-press mt-2 text-sm text-[#ffcc00]">VIPER DROP</h3>
            <p className="font-vt mt-3 text-xl text-[#f8f0d8]">
              Pre-game lobby, skins, emotes, pets, squads, knocks, Chapter 1.
            </p>
            <Button variant="arcade" className="pointer-events-none mt-4 h-10">
              ENTER LOBBY
            </Button>
          </a>
          <a
            href="#map"
            onClick={() => sfx.coin()}
            className="pixel-border bg-[#05000a] p-5 transition hover:ring-4 hover:ring-[#ff6a00]"
          >
            <p className="font-press text-[10px] text-[#ff6a00]">02  CREATIVE</p>
            <h3 className="font-press mt-2 text-sm text-[#ff6a00]">
              TILTED + METEOR
            </h3>
            <p className="font-vt mt-3 text-xl text-[#f8f0d8]">
              VIPER&apos;s Creative map: Tilted, a giant meteor, secrets. Chill
              plaza to walk and emote. Short coming soon.
            </p>
            <Button variant="arcade" className="pointer-events-none mt-4 h-10">
              OPEN MAP
            </Button>
          </a>
          <a
            href="#royale"
            onClick={() => sfx.coin()}
            className="pixel-border bg-[#05000a] p-5 transition hover:ring-4 hover:ring-[#00e800]"
          >
            <p className="font-press text-[10px] text-[#00e800]">03  3D MATCH</p>
            <h3 className="font-press mt-2 text-sm text-[#00e800]">
              ISLAND DROP
            </h3>
            <p className="font-vt mt-3 text-xl text-[#f8f0d8]">
              Smooth 3D Fortnite look. Free 360 camera. Not the 8-bit cart.
            </p>
            <span className="mt-4 inline-flex items-center gap-2">
              <PixelIcon name="game" />
              <Button variant="pixel" className="pointer-events-none h-10">
                PLAY 3D
              </Button>
            </span>
          </a>
        </div>
      </PixelPanel>
    </section>
  );
}
