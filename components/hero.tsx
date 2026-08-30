"use client";

import { CountdownClock } from "@/components/countdown";
import { PixelIcon } from "@/components/pixel-panel";
import { Button } from "@/components/ui/button";
import { ViperSky } from "@/components/viper-sky";
import { sfx } from "@/lib/sfx";

export function Hero() {
  return (
    <section id="hero" className="relative isolate overflow-hidden">
      <ViperSky className="absolute inset-0 h-full w-full pixelated" />
      <div className="relative section-wrap flex min-h-[88vh] flex-col items-center justify-center gap-8 py-16 text-center">
        <p className="font-press blink-slow text-[10px] text-[#00e800]">
          ▼ BATTLE BUS INBOUND
        </p>
        <div>
          <p className="font-press mb-3 text-[10px] text-[#c9a0ff] sm:text-xs">
            NES-1985  •  CART: VIPER
          </p>
          <h1 className="font-press text-xl leading-relaxed text-[#00e800] drop-shadow-[4px_4px_0_#003300] sm:text-3xl md:text-5xl md:leading-relaxed">
            VIPER3384
            <br />
            DROP ZONE
          </h1>
          <p className="font-press mt-4 text-xs text-[#ffcc00] sm:text-sm">
            FORTNITE  •  8-BIT
          </p>
        </div>
        <p className="font-vt max-w-xl text-xl text-[#f8f0d8] sm:text-2xl">
          Ride the 8-bit bus or drop into 3D VIPER Royale. Farm the pass. Jump
          the spray. This cart is all VIPER.
        </p>
        <CountdownClock />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="pixel"
            className="h-12 px-5 text-[11px]"
            nativeButton={false}
            render={<a href="#game" onClick={() => sfx.coin()} />}
          >
            DROP IN
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
          <Button
            variant="arcade"
            className="h-12 px-5 text-[11px]"
            nativeButton={false}
            render={<a href="#map" onClick={() => sfx.start()} />}
          >
            TILTED MAP
          </Button>
          <Button
            variant="arcade"
            className="h-12 px-5 text-[11px]"
            nativeButton={false}
            render={<a href="#royale" onClick={() => sfx.start()} />}
          >
            3D ROYALE
          </Button>
        </div>
        <p className="blink font-press text-[10px] text-[#f8f0d8]">
          ▶ PRESS START TO CONTINUE
        </p>
      </div>
    </section>
  );
}
