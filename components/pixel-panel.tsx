"use client";

import { cn } from "@/lib/utils";

export function PixelPanel({
  children,
  className,
  title,
  tone = "purple",
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  tone?: "purple" | "orange";
}) {
  return (
    <section
      className={cn(
        "relative bg-[#160028] p-4 sm:p-6",
        tone === "orange" ? "pixel-bevel-orange" : "pixel-bevel",
        className
      )}
    >
      {title ? (
        <h2 className="mb-4 bg-[#ff6a00] px-3 py-2 text-center text-[10px] text-[#1a0033] sm:text-xs">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

export function RpgDialog({
  speaker,
  children,
  className,
}: {
  speaker?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("dialog-box relative p-4 sm:p-5", className)}>
      {speaker ? (
        <span className="font-press absolute -top-3 left-4 bg-[#1a0033] px-2 text-[10px] text-[#ffcc00]">
          {speaker}
        </span>
      ) : null}
      <div className="font-vt text-xl leading-7 text-[#f8f0d8] sm:text-2xl">
        {children}
      </div>
      <span className="blink font-press absolute right-3 bottom-2 text-[10px] text-[#ffcc00]">
        ▼
      </span>
    </div>
  );
}

export function PixelIcon({
  name,
  className,
}: {
  name: "youtube" | "viper" | "heart" | "tower" | "game" | "map" | "bus";
  className?: string;
}) {
  const tiles: Record<string, string[]> = {
    youtube: [
      "00000000",
      "01111110",
      "01122110",
      "01122210",
      "01122110",
      "01111110",
      "00000000",
      "00000000",
    ],
    viper: [
      "00011000",
      "00122100",
      "01233210",
      "12333321",
      "01233210",
      "00122100",
      "00011000",
      "00011000",
    ],
    bus: [
      "00111100",
      "01122110",
      "11111111",
      "13333331",
      "11111111",
      "01011010",
      "00000000",
      "00000000",
    ],
    heart: [
      "00000000",
      "01100110",
      "11111111",
      "11111111",
      "01111110",
      "00111100",
      "00011000",
      "00000000",
    ],
    tower: [
      "00111100",
      "00100100",
      "01111110",
      "01011010",
      "01111110",
      "01011010",
      "01111110",
      "11111111",
    ],
    game: [
      "00000000",
      "01111110",
      "01011010",
      "01111110",
      "11100111",
      "10111101",
      "11100111",
      "00000000",
    ],
    map: [
      "01111110",
      "11011011",
      "10111101",
      "11100111",
      "10111101",
      "11011011",
      "01111110",
      "00000000",
    ],
  };

  const palette: Record<string, string> = {
    "0": "transparent",
    "1": name === "youtube" ? "#e02020" : name === "heart" ? "#e02020" : name === "viper" ? "#00e800" : "#f8f0d8",
    "2": name === "youtube" ? "#f8f0d8" : name === "viper" ? "#ffcc00" : "#ff6a00",
    "3": name === "viper" ? "#003300" : "#ffcc00",
  };

  return (
    <svg
      viewBox="0 0 8 8"
      className={cn("inline-block size-6 shrink-0", className)}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {tiles[name].flatMap((row, y) =>
        row.split("").map((cell, x) =>
          cell === "0" ? null : (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={palette[cell]}
            />
          )
        )
      )}
    </svg>
  );
}
