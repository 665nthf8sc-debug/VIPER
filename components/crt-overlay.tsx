"use client";

import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getCrt() {
  return window.localStorage.getItem("tilted-crt") !== "off";
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function CrtOverlay() {
  const on = useSyncExternalStore(subscribe, getCrt, () => true);
  if (!on) return null;
  return (
    <>
      <div className="scanlines" />
      <div className="crt-vignette" />
    </>
  );
}

export function toggleCrt() {
  const next = window.localStorage.getItem("tilted-crt") === "off";
  window.localStorage.setItem("tilted-crt", next ? "on" : "off");
  emit();
}
