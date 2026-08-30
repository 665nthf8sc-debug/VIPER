import { About } from "@/components/about";
import { CrtOverlay } from "@/components/crt-overlay";
import { Gallery } from "@/components/gallery";
import { Hero } from "@/components/hero";
import { MeteorGame } from "@/components/meteor-game";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { Timeline } from "@/components/timeline";
import { YoutubeTv } from "@/components/youtube-tv";

export default function Home() {
  return (
    <>
      <CrtOverlay />
      <SiteNav />
      <main className="flex flex-1 flex-col">
        <Hero />
        <YoutubeTv />
        <MeteorGame />
        <Timeline />
        <Gallery />
        <About />
      </main>
      <SiteFooter />
    </>
  );
}
