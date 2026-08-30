"use client";

import { PixelIcon, PixelPanel, RpgDialog } from "@/components/pixel-panel";
import { Button } from "@/components/ui/button";
import { grantWatchXp } from "@/lib/pass";
import { sfx } from "@/lib/sfx";
import {
  CHANNEL_HANDLE,
  CHANNEL_NAME,
  CHANNEL_URL,
  FEATURED_VIDEOS,
  SUBSCRIBE_URL,
} from "@/lib/youtube";
import { useState } from "react";

export function YoutubeTv() {
  const [active, setActive] = useState<string>(FEATURED_VIDEOS[0].id);
  const [xpNote, setXpNote] = useState("");
  const current =
    FEATURED_VIDEOS.find((v) => v.id === active) ?? FEATURED_VIDEOS[0];

  const playTape = (id: string) => {
    sfx.select();
    setActive(id);
    const reward = grantWatchXp(id);
    if (reward.gained > 0) {
      sfx.xp();
      setXpNote(`+${reward.gained} BATTLE PASS XP`);
    } else {
      setXpNote("ALREADY BANKED THIS TAPE");
    }
  };

  return (
    <section id="tv" className="section-wrap py-16 sm:py-20">
      <PixelPanel title="CHANNEL 3384  •  NOW BROADCASTING">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <div className="tv-bezel p-3 sm:p-4">
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <span className="font-press text-[8px] text-[#00e800] sm:text-[10px]">
                  CH-04  VIPER TV
                </span>
                <span className="font-press blink text-[8px] text-[#00e800] sm:text-[10px]">
                  ● LIVE
                </span>
              </div>
              <div className="relative aspect-video overflow-hidden bg-black shadow-[inset_0_0_0_4px_#050008]">
                <iframe
                  key={active}
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube.com/embed/${active}?rel=0`}
                  title={current.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <span
                      key={i}
                      className="h-2 w-2"
                      style={{
                        background: i < 5 ? "#00e800" : i < 7 ? "#ffcc00" : "#e02020",
                      }}
                    />
                  ))}
                </div>
                <span className="font-press text-[8px] text-[#c9a0ff]">
                  VOL ████░░
                </span>
              </div>
            </div>
            <p className="font-vt mt-3 text-lg text-[#c9a0ff]">
              Now playing: {current.title}
            </p>
            {xpNote ? (
              <p className="font-press mt-1 text-[10px] text-[#00e800]">
                {xpNote}
              </p>
            ) : (
              <p className="font-press mt-1 text-[10px] text-[#ffcc00]">
                FIRST WATCH = +50 XP
              </p>
            )}
            <Button
              variant="arcade"
              className="mt-3 h-10 px-4 text-[10px]"
              onClick={() => playTape(active)}
            >
              BANK WATCH XP
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            <RpgDialog speaker={CHANNEL_NAME}>
              Drop into {CHANNEL_HANDLE}. Watch a tape, bank Battle Pass XP,
              then take that skin onto the island.
            </RpgDialog>
            <Button
              variant="pixel"
              className="h-14 w-full gap-3 text-[11px] transition hover:brightness-110"
              nativeButton={false}
              render={
                <a
                  href={SUBSCRIBE_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => sfx.coin()}
                />
              }
            >
              <PixelIcon name="youtube" />
              SUBSCRIBE
            </Button>
            <a
              href={CHANNEL_URL}
              target="_blank"
              rel="noreferrer"
              className="font-press text-center text-[10px] text-[#3cdcff] underline decoration-4 underline-offset-4"
            >
              OPEN {CHANNEL_HANDLE}
            </a>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
              {FEATURED_VIDEOS.map((video) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => playTape(video.id)}
                  className={`pixel-border overflow-hidden bg-[#05000a] text-left ${
                    active === video.id ? "ring-4 ring-[#ffcc00]" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                    alt={video.title}
                    className="pixelated h-16 w-full object-cover sm:h-20"
                  />
                  <span className="font-press block truncate px-2 py-2 text-[8px] text-[#ffcc00]">
                    {video.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </PixelPanel>
    </section>
  );
}
