import { About } from "@/components/about";
import { BattlePass } from "@/components/battle-pass";
import { CrtOverlay } from "@/components/crt-overlay";
import { GameLibrary } from "@/components/game-library";
import { Hero } from "@/components/hero";
import { Locker } from "@/components/locker";
import { MeteorMap } from "@/components/meteor-map";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { Timeline } from "@/components/timeline";
import { ViperDrop } from "@/components/viper-drop";
import { ViperFps } from "@/components/viper-fps";
import { ViperRoyale } from "@/components/viper-royale";
import { YoutubeTv } from "@/components/youtube-tv";

export default function Home() {
  return (
    <>
      <CrtOverlay />
      <SiteNav />
      <main className="flex flex-1 flex-col">
        <Hero />
        <YoutubeTv />
        <BattlePass />
        <GameLibrary />
        <ViperDrop />
        <MeteorMap />
        <ViperRoyale />
        <ViperFps />
        <Timeline />
        <Locker />
        <About />
      </main>
      <SiteFooter />
    </>
  );
}
