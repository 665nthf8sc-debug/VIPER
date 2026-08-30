"use client";

export type SquadSize = "solo" | "duo" | "trio";
export type Playlist = "br" | "campaign";
export type Fill = "bot" | "invite";

export type Pad = {
  left: boolean;
  right: boolean;
  jump: boolean;
  fire: boolean;
};

export const EMPTY_PAD: Pad = {
  left: false,
  right: false,
  jump: false,
  fire: false,
};

export function squadSeats(size: SquadSize) {
  if (size === "trio") return 3;
  if (size === "duo") return 2;
  return 1;
}

export function makeInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function padActive(pad: Pad) {
  return pad.left || pad.right || pad.jump || pad.fire;
}

export type JoinMsg = {
  t: "join";
  name: string;
  sprite: string;
  palette: Record<string, string>;
};
export type WelcomeMsg = {
  t: "welcome";
  seat: number;
  playlist: Playlist;
  squad: SquadSize;
};
export type PadsMsg = { t: "pads"; seat: number; pad: Pad };
export type StartMsg = { t: "start" };
export type SnapMsg = { t: "snap"; body: string };
export type ByeMsg = { t: "bye" };
export type NetMsg = JoinMsg | WelcomeMsg | PadsMsg | StartMsg | SnapMsg | ByeMsg;

export function openSquadChannel(code: string) {
  return new BroadcastChannel(`viper-drop-${code.trim().toUpperCase()}`);
}
