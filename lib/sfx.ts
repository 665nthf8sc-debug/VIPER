"use client";

type Wave = OscillatorType;

class ChipSynth {
  private ctx: AudioContext | null = null;
  muted = false;

  private audio() {
    if (this.ctx) return this.ctx;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new Ctx();
    return this.ctx;
  }

  setMuted(next: boolean) {
    this.muted = next;
  }

  tone(
    freq: number,
    duration = 0.12,
    type: Wave = "square",
    gain = 0.05,
    slideTo?: number
  ) {
    if (this.muted || typeof window === "undefined") return;
    const ctx = this.audio();
    if (ctx.state === "suspended") void ctx.resume();
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(slideTo, 20),
        ctx.currentTime + duration
      );
    }
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  coin() {
    this.tone(880, 0.08, "square", 0.06);
    setTimeout(() => this.tone(1320, 0.12, "square", 0.05), 80);
  }

  start() {
    this.tone(392, 0.1, "square", 0.05);
    setTimeout(() => this.tone(523, 0.1, "square", 0.05), 100);
    setTimeout(() => this.tone(659, 0.16, "square", 0.05), 200);
  }

  hit() {
    this.tone(180, 0.18, "square", 0.07, 60);
  }

  crunch() {
    this.tone(140, 0.08, "sawtooth", 0.04, 70);
  }

  gameOver() {
    this.tone(330, 0.18, "square", 0.06, 200);
    setTimeout(() => this.tone(247, 0.22, "square", 0.06, 140), 180);
    setTimeout(() => this.tone(165, 0.4, "square", 0.07, 70), 380);
  }

  move() {
    this.tone(220, 0.03, "square", 0.02);
  }

  select() {
    this.tone(740, 0.06, "square", 0.04);
  }
}

export const sfx = new ChipSynth();
