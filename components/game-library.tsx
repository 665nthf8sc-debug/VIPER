"use client";

import { PixelIcon, PixelPanel } from "@/components/pixel-panel";
import { Button } from "@/components/ui/button";
import { sfx } from "@/lib/sfx";

export function GameLibrary() {
  return (
    <section id="library" className="section-wrap py-16 sm:py-20">
      <PixelPanel title="VIPER LIBRARY  •  FOUR CABINETS">
        <p className="font-vt mb-6 text-xl text-[#c9a0ff] sm:text-2xl">
          Lobby, plaza, 3D drop, or raycast FPS on the island.
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <a
            href="#game"
            onClick={() => sfx.select()}
            className="pixel-border bg-[#05000a] p-5 transition hover:ring-4 hover:ring-[#ffcc00]"
          >
            <p className="font-press text-[10px] text-[#3cdcff]">01  NES CART</p>
            <h3 className="font-press mt-2 text-sm text-[#ffcc00]">VIPER DROP</h3>
            <p className="font-vt mt-3 text-xl text-[#f8f0d8]">
              Pre-game lobby, skins, emotes, 12-player Victory Royale.
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
              VIPER&apos;s map lore and a chill plaza to hang and emote.
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
              Smooth 3D Fortnite look. Free 360 camera.
            </p>
            <span className="mt-4 inline-flex items-center gap-2">
              <PixelIcon name="game" />
              <Button variant="pixel" className="pointer-events-none h-10">
                PLAY 3D
              </Button>
            </span>
          </a>
          <a
            href="#fps"
            onClick={() => sfx.coin()}
            className="pixel-border bg-[#05000a] p-5 transition hover:ring-4 hover:ring-[#e02020]"
          >
            <p className="font-press text-[10px] text-[#e02020]">04  RAYCAST</p>
            <h3 className="font-press mt-2 text-sm text-[#e02020]">VIPER FPS</h3>
            <p className="font-vt mt-3 text-xl text-[#f8f0d8]">
              Wolfenstein raycasting. VIPER 8-angle, storm sky, loot sheets.
            </p>
            <Button variant="arcade" className="pointer-events-none mt-4 h-10">
              ENTER FPS
            </Button>
          </a>
        </div>
      </PixelPanel>
    </section>
  );
}
