"use client";

import { PixelIcon, PixelPanel } from "@/components/pixel-panel";
import { Button } from "@/components/ui/button";
import { sfx } from "@/lib/sfx";

export function GameLibrary() {
  return (
    <section id="library" className="section-wrap py-16 sm:py-20">
      <PixelPanel title="VIPER LIBRARY  •  TWO CABINETS">
        <p className="font-vt mb-6 text-xl text-[#c9a0ff] sm:text-2xl">
          Same island energy. Two carts. 8-bit drop or 3D Royale.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <a
            href="#game"
            onClick={() => sfx.select()}
            className="pixel-border bg-[#05000a] p-5 transition hover:ring-4 hover:ring-[#ffcc00]"
          >
            <p className="font-press text-[10px] text-[#3cdcff]">01  NES CART</p>
            <h3 className="font-press mt-2 text-sm text-[#ffcc00]">VIPER DROP</h3>
            <p className="font-vt mt-3 text-xl text-[#f8f0d8]">
              Side-scrolling 8-bit Fortnite. Squads, knocks, Chapter 1 campaign,
              Peely and Jonesy.
            </p>
            <Button variant="arcade" className="pointer-events-none mt-4 h-10">
              PLAY 8-BIT
            </Button>
          </a>
          <a
            href="#royale"
            onClick={() => sfx.coin()}
            className="pixel-border bg-[#05000a] p-5 transition hover:ring-4 hover:ring-[#00e800]"
          >
            <p className="font-press text-[10px] text-[#00e800]">02  3D MATCH</p>
            <h3 className="font-press mt-2 text-sm text-[#00e800]">
              VIPER ROYALE
            </h3>
            <p className="font-vt mt-3 text-xl text-[#f8f0d8]">
              Third-person Battle Royale. Battle bus, storm circle, pickaxe,
              AR, pump, walls and ramps. Looks like Fortnite.
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
