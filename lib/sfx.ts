"use client";

type Wave = OscillatorType;
type FpsMusicMode = "off" | "title" | "game";

class ChipSynth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private musicMode: FpsMusicMode = "off";
  private musicStep = 0;
  muted = false;

  private audio() {
    if (this.ctx) return this.ctx;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.22;
    this.musicGain.connect(this.master);
    return this.ctx;
  }

  private dest() {
    this.audio();
    return this.master!;
  }

  unlock() {
    if (typeof window === "undefined") return;
    const ctx = this.audio();
    if (ctx.state === "suspended") void ctx.resume();
  }

  setMuted(next: boolean) {
    this.muted = next;
    if (!this.master || !this.ctx) return;
    this.master.gain.setTargetAtTime(next ? 0 : 0.9, this.ctx.currentTime, 0.04);
    if (next) this.stopFpsMusic();
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
    amp.connect(this.dest());
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  private noise(duration: number, gain: number, hp = 800, lp = 4000) {
    if (this.muted || typeof window === "undefined") return;
    const ctx = this.audio();
    if (ctx.state === "suspended") void ctx.resume();
    const buffer = ctx.createBuffer(1, Math.max(1, (ctx.sampleRate * duration) | 0), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = (hp + lp) / 2;
    filter.Q.value = 0.7;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(this.dest());
    src.start();
  }

  private musicTone(
    freq: number,
    duration: number,
    type: Wave,
    gain: number,
    slideTo?: number
  ) {
    if (this.muted || !this.ctx || !this.musicGain) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = type === "sawtooth" ? 720 : 1400;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 20), ctx.currentTime + duration);
    }
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(filter);
    filter.connect(amp);
    amp.connect(this.musicGain);
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

  shoot() {
    this.tone(880, 0.04, "square", 0.045);
    this.tone(220, 0.06, "sawtooth", 0.03, 80);
  }

  punch() {
    this.tone(520, 0.05, "square", 0.05);
    this.tone(180, 0.08, "square", 0.04, 90);
  }

  ko() {
    this.tone(260, 0.12, "square", 0.06, 120);
    this.noise(0.16, 0.04, 200, 900);
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

  jump() {
    this.tone(420, 0.08, "square", 0.04, 720);
  }

  drop() {
    this.tone(180, 0.22, "sawtooth", 0.05, 90);
    setTimeout(() => this.tone(140, 0.12, "square", 0.04), 120);
  }

  pickup() {
    this.tone(660, 0.06, "square", 0.045);
    setTimeout(() => this.tone(990, 0.1, "square", 0.04), 50);
  }

  bus() {
    this.tone(196, 0.1, "square", 0.04);
    setTimeout(() => this.tone(247, 0.1, "square", 0.04), 90);
    setTimeout(() => this.tone(330, 0.18, "square", 0.05), 180);
  }

  xp() {
    this.tone(660, 0.07, "square", 0.045);
    setTimeout(() => this.tone(880, 0.1, "square", 0.04), 70);
  }

  warp() {
    this.tone(520, 0.08, "square", 0.04, 880);
  }

  knock() {
    this.tone(140, 0.22, "square", 0.06, 70);
  }

  revive() {
    this.tone(392, 0.1, "square", 0.05);
    setTimeout(() => this.tone(523, 0.12, "square", 0.05), 90);
    setTimeout(() => this.tone(784, 0.16, "square", 0.05), 180);
  }

  emote() {
    this.tone(523, 0.08, "square", 0.05);
    setTimeout(() => this.tone(659, 0.1, "square", 0.05), 70);
    setTimeout(() => this.tone(784, 0.12, "square", 0.05), 140);
  }

  scarShot() {
    this.noise(0.045, 0.055, 1800, 7000);
    this.tone(620, 0.035, "square", 0.04, 180);
    this.tone(140, 0.05, "sawtooth", 0.03, 70);
  }

  pumpShot() {
    this.noise(0.12, 0.08, 200, 1800);
    this.tone(90, 0.18, "sine", 0.09, 36);
    this.tone(220, 0.08, "sawtooth", 0.04, 60);
  }

  exoticShot() {
    this.tone(880, 0.07, "sawtooth", 0.045, 1400);
    this.tone(440, 0.09, "triangle", 0.035, 90);
    this.noise(0.05, 0.03, 3000, 8000);
  }

  pickaxeSwing() {
    this.noise(0.08, 0.035, 400, 2200);
    this.tone(200, 0.1, "square", 0.04, 80);
  }

  dryClick() {
    this.tone(240, 0.04, "square", 0.035);
    this.tone(90, 0.05, "square", 0.02);
  }

  pickupGun() {
    this.tone(392, 0.06, "triangle", 0.05);
    setTimeout(() => this.tone(587, 0.08, "triangle", 0.045), 55);
    setTimeout(() => this.tone(784, 0.1, "square", 0.035), 110);
  }

  pickupAmmo() {
    this.tone(180, 0.04, "square", 0.04);
    setTimeout(() => this.tone(220, 0.05, "square", 0.035), 40);
    setTimeout(() => this.tone(160, 0.06, "triangle", 0.03), 80);
  }

  medkitUse() {
    this.tone(330, 0.1, "sine", 0.045);
    setTimeout(() => this.tone(415, 0.12, "sine", 0.04), 90);
    setTimeout(() => this.tone(554, 0.18, "triangle", 0.04), 180);
  }

  shieldChug() {
    this.tone(140, 0.1, "sine", 0.05, 90);
    setTimeout(() => this.tone(220, 0.12, "triangle", 0.04), 80);
    setTimeout(() => this.tone(880, 0.16, "sine", 0.03), 170);
  }

  chestOpen() {
    this.tone(160, 0.1, "sawtooth", 0.04, 90);
    setTimeout(() => this.tone(523, 0.08, "triangle", 0.04), 90);
    setTimeout(() => this.tone(784, 0.12, "square", 0.03), 160);
  }

  llama() {
    this.tone(330, 0.08, "square", 0.04, 440);
    setTimeout(() => this.tone(392, 0.08, "square", 0.04, 520), 70);
    setTimeout(() => this.tone(262, 0.14, "triangle", 0.045), 150);
  }

  playerHurt() {
    this.tone(110, 0.16, "sawtooth", 0.06, 50);
    this.noise(0.1, 0.035, 300, 1200);
  }

  reload() {
    this.tone(200, 0.05, "square", 0.03);
    setTimeout(() => this.tone(140, 0.06, "triangle", 0.03), 60);
  }

  playWeapon(id: "pickaxe" | "pump" | "scar" | "exotic") {
    if (id === "pickaxe") this.pickaxeSwing();
    else if (id === "pump") this.pumpShot();
    else if (id === "scar") this.scarShot();
    else this.exoticShot();
  }

  playFpsMusic(mode: Exclude<FpsMusicMode, "off">) {
    if (typeof window === "undefined") return;
    this.unlock();
    if (this.musicMode === mode && this.musicTimer != null) return;
    this.stopFpsMusic();
    if (this.muted) return;
    this.musicMode = mode;
    this.musicStep = 0;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(mode === "title" ? 0.24 : 0.14, this.ctx.currentTime, 0.08);
    }
    const period = mode === "title" ? 150 : 210;
    this.tickFpsMusic();
    this.musicTimer = window.setInterval(() => this.tickFpsMusic(), period);
  }

  stopFpsMusic() {
    if (this.musicTimer != null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.musicMode = "off";
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
    }
  }

  private tickFpsMusic() {
    if (this.muted || this.musicMode === "off") {
      this.musicStep = (this.musicStep + 1) % 32;
      return;
    }
    const s = this.musicStep % 32;
    this.musicStep += 1;
    const title = this.musicMode === "title";

    const bass = title
      ? [73.42, 73.42, 65.41, 87.31, 73.42, 55, 65.41, 49]
      : [55, 55, 49, 41.2, 55, 46.25, 49, 36.71];
    if (s % 4 === 0) {
      this.musicTone(bass[(s / 4) % bass.length], title ? 0.38 : 0.5, "sawtooth", title ? 0.055 : 0.04);
    }
    if (s % 8 === 4) {
      this.musicTone(bass[(s / 4) % bass.length] * 1.5, 0.16, "square", title ? 0.02 : 0.012);
    }

    if (title && (s === 4 || s === 12 || s === 20 || s === 28)) {
      const stab = s === 12 || s === 28 ? 349.23 : 293.66;
      this.musicTone(stab, 0.14, "square", 0.03);
      this.musicTone(stab * 1.25, 0.12, "triangle", 0.022);
      this.musicTone(stab * 1.5, 0.1, "sawtooth", 0.012);
    }

    if (title && s % 8 === 2) {
      const lead = [440, 523.25, 493.88, 392, 349.23, 440, 523.25, 587.33];
      this.musicTone(lead[(s / 8) % lead.length], 0.2, "triangle", 0.028);
    }

    if (!title && s % 8 === 0) {
      this.musicTone(82.41, 0.7, "sine", 0.03);
    }
    if (!title && s === 16) {
      this.musicTone(196, 0.22, "triangle", 0.018);
      this.musicTone(233.08, 0.18, "square", 0.01);
    }
  }
}

export const sfx = new ChipSynth();
