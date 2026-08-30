"use client";

import { toggleCrt } from "@/components/crt-overlay";
import { PixelIcon } from "@/components/pixel-panel";
import { Button } from "@/components/ui/button";
import { sfx } from "@/lib/sfx";
import { CHANNEL_HANDLE } from "@/lib/youtube";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "#hero", label: "START" },
  { href: "#tv", label: "TV" },
  { href: "#pass", label: "PASS" },
  { href: "#game", label: "LOBBY" },
  { href: "#map", label: "MAP" },
  { href: "#royale", label: "3D" },
  { href: "#fps", label: "FPS" },
  { href: "#locker", label: "LOCKER" },
  { href: "#about", label: "ABOUT" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const onFs = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
      sfx.select();
    } catch {
      sfx.hit();
    }
  };

  return (
    <header className="sticky top-0 z-[100] bg-[#0a0014]/95">
      <div className="section-wrap flex items-center justify-between gap-3 py-3">
        <a
          href="#hero"
          className="font-press flex items-center gap-2 text-[10px] text-[#00e800] sm:text-xs"
          onClick={() => sfx.select()}
        >
          <PixelIcon name="viper" className="size-5" />
          <span className="hidden sm:inline">VIPER3384</span>
          <span className="sm:hidden">VIPER</span>
        </a>
        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => sfx.select()}
              className="font-press pixel-link px-2 py-2 text-[9px] text-[#f8f0d8]"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button
            variant="arcade"
            size="sm"
            className="h-8 px-2"
            onClick={() => void toggleFull()}
          >
            {full ? "EXIT" : "FULL"}
          </Button>
          <Button
            variant="arcade"
            size="sm"
            className="h-8 px-2"
            onClick={() => {
              sfx.select();
              toggleCrt();
            }}
          >
            CRT
          </Button>
          <Button
            variant="pixel"
            size="sm"
            className="hidden h-8 px-2 sm:inline-flex"
            nativeButton={false}
            render={<a href="#tv" />}
          >
            {CHANNEL_HANDLE}
          </Button>
          <Button
            variant="arcade"
            size="sm"
            className="h-8 px-2 lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "CLOSE" : "MENU"}
          </Button>
        </div>
      </div>
      {open ? (
        <nav className="border-t-4 border-[#00e800] bg-[#12001f] lg:hidden">
          <div className="section-wrap grid grid-cols-2 gap-2 py-3">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => {
                  sfx.select();
                  setOpen(false);
                }}
                className="font-press pixel-bevel bg-[#1a0033] px-3 py-3 text-center text-[10px] text-[#00e800]"
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
