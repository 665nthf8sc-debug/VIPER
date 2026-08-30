"use client";

/**
 * Original VIPER Royale score. Cinematic BR energy, not Epic's soundtrack.
 */
export class RoyaleScore {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private timer: number | null = null;
  private step = 0;
  muted = false;
  intensity: "idle" | "bus" | "play" | "storm" | "win" | "over" = "idle";

  private audio() {
    if (this.ctx) return this.ctx;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.16;
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 1800;
    this.filter.Q.value = 0.7;
    this.filter.connect(this.master);
    this.master.connect(this.ctx.destination);
    return this.ctx;
  }

  setMuted(next: boolean) {
    this.muted = next;
    if (this.master) {
      this.master.gain.setTargetAtTime(next ? 0 : 0.16, this.audio().currentTime, 0.05);
    }
  }

  setIntensity(next: RoyaleScore["intensity"]) {
    this.intensity = next;
    if (!this.filter) return;
    const ctx = this.audio();
    const freq =
      next === "storm" ? 2400 : next === "play" ? 1900 : next === "bus" ? 1400 : 900;
    this.filter.frequency.setTargetAtTime(freq, ctx.currentTime, 0.4);
  }

  start() {
    if (typeof window === "undefined") return;
    const ctx = this.audio();
    if (ctx.state === "suspended") void ctx.resume();
    if (this.timer != null) return;
    this.step = 0;
    this.tick();
    this.timer = window.setInterval(() => this.tick(), 187);
  }

  stop() {
    if (this.timer != null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
    }
  }

  private dest() {
    return this.filter ?? this.master!;
  }

  private osc(
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    slide?: number
  ) {
    if (this.muted || !this.ctx || !this.master) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const a = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slide) {
      o.frequency.exponentialRampToValueAtTime(
        Math.max(slide, 20),
        ctx.currentTime + dur
      );
    }
    a.gain.setValueAtTime(gain, ctx.currentTime);
    a.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(a);
    a.connect(this.dest());
    o.start();
    o.stop(ctx.currentTime + dur);
  }

  private noise(dur: number, gain: number) {
    if (this.muted || !this.ctx || !this.master) return;
    const ctx = this.ctx;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const a = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 4000;
    a.gain.setValueAtTime(gain, ctx.currentTime);
    a.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(f);
    f.connect(a);
    a.connect(this.dest());
    src.start();
  }

  private tick() {
    if (this.muted || this.intensity === "idle") {
      this.step = (this.step + 1) % 32;
      return;
    }
    const s = this.step % 32;
    const storm = this.intensity === "storm";
    const win = this.intensity === "win";
    const over = this.intensity === "over";
    const play = this.intensity === "play" || storm;

    if (!over && s % 4 === 0) this.osc(90, 0.18, "sine", 0.09, 38);
    if (play && s % 4 === 2) this.noise(0.05, storm ? 0.04 : 0.02);
    if (storm && s % 2 === 0) this.osc(70, 0.12, "sine", 0.05, 32);

    const bass = [146.83, 146.83, 110, 130.81, 174.61, 164.81, 146.83, 110];
    if (s % 4 === 0) {
      this.osc(bass[(s / 4) % bass.length], 0.42, "sawtooth", play ? 0.035 : 0.02);
    }

    const lead = win
      ? [587.33, 659.25, 783.99, 880, 987.77, 880, 783.99, 1174]
      : over
        ? [196, 185, 174.61, 146.83]
        : [293.66, 349.23, 392, 440, 523.25, 493.88, 440, 392];

    if (s % 2 === 0) {
      const n = lead[(s / 2) % lead.length];
      this.osc(n, 0.28, "triangle", win ? 0.07 : 0.04);
      this.osc(n / 2, 0.3, "sine", 0.025);
    }

    if (play && s === 0) this.osc(220, 0.8, "sawtooth", 0.02);
    if (win && s % 8 === 0) {
      this.osc(523.25, 0.4, "triangle", 0.06);
      this.osc(659.25, 0.45, "triangle", 0.05);
    }

    this.step += 1;
  }
}
