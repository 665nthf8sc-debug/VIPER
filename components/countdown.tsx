"use client";

import { useEffect, useState } from "react";

const TARGET = new Date("2026-10-01T00:00:00");

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function splitMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds, done: ms <= 0 };
}

export function CountdownClock() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const t = splitMs(TARGET.getTime() - now);
  const cells = [
    { label: "DAYS", value: pad(t.days) },
    { label: "HRS", value: pad(t.hours) },
    { label: "MIN", value: pad(t.minutes) },
    { label: "SEC", value: pad(t.seconds) },
  ];

  return (
    <div className="pixel-bevel mx-auto w-full max-w-xl bg-[#05000a] p-3 sm:p-4">
      <p className="font-press mb-3 text-center text-[9px] text-[#ff6a00] sm:text-[10px]">
        {t.done ? "THE METEOR HAS LANDED" : "METEOR IMPACT CLOCK  OCT 1"}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {cells.map((cell) => (
          <div
            key={cell.label}
            className="bg-[#001a00] px-1 py-2 text-center shadow-[inset_3px_3px_0_#003300,inset_-3px_-3px_0_#000]"
          >
            <div className="hud-digits text-lg sm:text-2xl md:text-3xl">
              {cell.value}
            </div>
            <div className="font-press mt-1 text-[8px] text-[#00e800]/70">
              {cell.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
