"use client";

import { CountdownClock } from "@/components/countdown";
import { MeteorSky } from "@/components/meteor-sky";
import { PixelIcon } from "@/components/pixel-panel";
import { Button } from "@/components/ui/button";
import { sfx } from "@/lib/sfx";

export function Hero() {
  return (
    <section id="hero" className="relative isolate overflow-hidden">
      <MeteorSky className="absolute inset-0 h-full w-full pixelated" />
      <div className="relative section-wrap flex min-h-[88vh] flex-col items-center justify-center gap-8 py-16 text-center">
        <p className="font-press blink-slow text-[10px] text-[#ffcc00]">
          ▼ PLAYER 1 READY
        </p>
        <div>
          <p className="font-press mb-3 text-[10px] text-[#c9a0ff] sm:text-xs">
            NES-1985  •  CART: CH.1
          </p>
          <h1 className="font-press text-xl leading-relaxed text-[#ffcc00] drop-shadow-[4px_4px_0_#3d0d00] sm:text-3xl md:text-5xl md:leading-relaxed">
            TILTED TOWERS
            <br />
            MEMORIAL
          </h1>
          <p className="font-press mt-4 text-xs text-[#ff6a00] sm:text-sm">
            VIPER3384
          </p>
        </div>
        <p className="font-vt max-w-xl text-xl text-[#f8f0d8] sm:text-2xl">
          A lost 8-bit cartridge that somehow knew the towers would fall.
          Dodge meteors. Fight the squad. Count down to the next season.
        </p>
        <CountdownClock />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="pixel"
            className="h-12 px-5 text-[11px]"
            nativeButton={false}
            render={<a href="#game" onClick={() => sfx.coin()} />}
          >
            INSERT COIN
          </Button>
          <Button
            variant="arcade"
            className="h-12 px-5 text-[11px]"
            nativeButton={false}
            render={<a href="#tv" onClick={() => sfx.select()} />}
          >
            <PixelIcon name="youtube" className="size-4" />
            WATCH TV
          </Button>
        </div>
        <p className="blink font-press text-[10px] text-[#f8f0d8]">
          ▶ PRESS START TO CONTINUE
        </p>
      </div>
    </section>
  );
}
