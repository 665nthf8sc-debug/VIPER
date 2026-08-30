"use client";

type FpsMusicMode = "off" | "title" | "game";

const SFX_NAMES = [
  "coin",
  "start",
  "hit",
  "shoot",
  "punch",
  "ko",
  "crunch",
  "gameOver",
  "move",
  "select",
  "jump",
  "drop",
  "pickup",
  "bus",
  "xp",
  "warp",
  "knock",
  "revive",
  "emote",
  "scarShot",
  "pumpShot",
  "exoticShot",
  "pickaxeSwing",
  "dryClick",
  "pickupGun",
  "pickupAmmo",
  "medkitUse",
  "shieldChug",
  "chestOpen",
  "llama",
  "playerHurt",
  "reload",
  "enemyShot",
  "enemyBossShot",
] as const;

type SfxName = (typeof SFX_NAMES)[number];

const MUSIC_URL = {
  title: "/audio/music/viper-title-theme.ogg",
  game: "/audio/music/viper-locker-theme.ogg",
} as const;

const MASTER_GAIN = 0.9;
const SFX_GAIN = 0.9;
const MUSIC_GAIN = 0.35;
const TITLE_LOOP_FADE = 0.05;
const MUSIC_STOP_FADE = 0.08;

function publicAsset(path: string) {
  if (typeof window === "undefined") return path;
  const prefix = window.location.pathname.startsWith("/VIPER") ? "/VIPER" : "";
  return `${prefix}${path}`;
}

type MusicNode = {
  src: AudioBufferSourceNode;
  gain: GainNode;
};

class SamplePlayer {
  private ctx: AudioContext | null = null;
  private offline: OfflineAudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private preloadStarted = false;
  private gestureBound = false;
  private musicMode: FpsMusicMode = "off";
  private musicNodes: MusicNode[] = [];
  private musicTimer: number | null = null;
  private musicGen = 0;
  muted = false;

  private audio() {
    if (this.ctx) return this.ctx;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : MASTER_GAIN;
    this.master.connect(this.ctx.destination);
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = SFX_GAIN;
    this.sfxBus.connect(this.master);
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = MUSIC_GAIN;
    this.musicBus.connect(this.master);
    return this.ctx;
  }

  private decoder() {
    if (this.ctx) return this.ctx;
    if (!this.offline) this.offline = new OfflineAudioContext(2, 1, 44100);
    return this.offline;
  }

  private gestureActive() {
    const nav = navigator as Navigator & {
      userActivation?: { isActive: boolean; hasBeenActive: boolean };
    };
    return Boolean(nav.userActivation?.isActive || nav.userActivation?.hasBeenActive);
  }

  private bindGesture() {
    if (this.gestureBound || typeof window === "undefined") return;
    this.gestureBound = true;
    const arm = () => this.unlock();
    window.addEventListener("pointerdown", arm, { capture: true, once: true });
    window.addEventListener("keydown", arm, { capture: true, once: true });
  }

  unlock() {
    if (typeof window === "undefined") return;
    this.bindGesture();
    this.kickPreload();
    if (!this.ctx && !this.gestureActive()) return;
    const ctx = this.audio();
    if (ctx.state === "suspended") void ctx.resume();
    this.maybeStartPendingMusic();
  }

  setMuted(next: boolean) {
    this.muted = next;
    if (!this.master || !this.ctx) return;
    this.master.gain.setTargetAtTime(
      next ? 0 : MASTER_GAIN,
      this.ctx.currentTime,
      0.04
    );
    if (next) this.stopFpsMusic();
  }

  private kickPreload() {
    if (this.preloadStarted || typeof window === "undefined") return;
    this.preloadStarted = true;
    void this.loadAll();
  }

  private async loadAll() {
    const jobs: Promise<void>[] = SFX_NAMES.map((name) =>
      this.loadBuffer(`/audio/sfx/${name}.ogg`, name)
    );
    jobs.push(this.loadBuffer(MUSIC_URL.title, "music:title"));
    jobs.push(this.loadBuffer(MUSIC_URL.game, "music:game"));
    await Promise.all(jobs);
    this.maybeStartPendingMusic();
  }

  private async loadBuffer(path: string, key: string) {
    try {
      const res = await fetch(publicAsset(path));
      if (!res.ok) return;
      const data = await res.arrayBuffer();
      const buf = await this.decoder().decodeAudioData(data.slice(0));
      this.buffers.set(key, buf);
    } catch {
      /* missing / decode failure: skip */
    }
  }

  private maybeStartPendingMusic() {
    if (this.muted) return;
    if (this.musicMode !== "title" && this.musicMode !== "game") return;
    if (this.musicNodes.length > 0 || this.musicTimer != null) return;
    if (!this.ctx) return;
    this.startMusic(this.musicMode, this.musicGen);
  }

  private oneshot(name: SfxName) {
    if (this.muted || typeof window === "undefined") return;
    this.unlock();
    const ctx = this.ctx;
    const bus = this.sfxBus;
    const buf = this.buffers.get(name);
    if (!ctx || !bus || !buf) return;
    if (ctx.state === "suspended") void ctx.resume();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(bus);
    src.start();
  }

  private haltMusic(fadeSec: number) {
    this.musicGen += 1;
    if (this.musicTimer != null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    const ctx = this.ctx;
    const nodes = this.musicNodes;
    this.musicNodes = [];
    if (!ctx || nodes.length === 0) return;
    const t = ctx.currentTime;
    for (const node of nodes) {
      try {
        node.gain.gain.cancelScheduledValues(t);
        const cur = Math.max(node.gain.gain.value, 0.0001);
        node.gain.gain.setValueAtTime(cur, t);
        node.gain.gain.linearRampToValueAtTime(0.0001, t + fadeSec);
        node.src.stop(t + fadeSec + 0.02);
      } catch {
        /* already stopped */
      }
    }
  }

  private startMusic(mode: Exclude<FpsMusicMode, "off">, gen: number) {
    if (this.muted || this.musicGen !== gen) return;
    const ctx = this.ctx;
    const bus = this.musicBus;
    if (!ctx || !bus) return;
    if (ctx.state === "suspended") void ctx.resume();
    const buf = this.buffers.get(mode === "title" ? "music:title" : "music:game");
    if (!buf) return;

    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setTargetAtTime(MUSIC_GAIN, ctx.currentTime, 0.02);

    if (mode === "game") {
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      src.buffer = buf;
      src.loop = true;
      src.loopStart = 0;
      src.loopEnd = buf.duration;
      gain.gain.value = 1;
      src.connect(gain);
      gain.connect(bus);
      src.start();
      this.musicNodes.push({ src, gain });
      return;
    }

    this.playTitleSlice(buf, ctx.currentTime, true, gen);
  }

  private playTitleSlice(
    buf: AudioBuffer,
    when: number,
    fromStart: boolean,
    gen: number
  ) {
    if (this.musicMode !== "title" || this.musicGen !== gen || this.muted) return;
    const ctx = this.ctx;
    const bus = this.musicBus;
    if (!ctx || !bus) return;

    const fade = TITLE_LOOP_FADE;
    const offset = fromStart ? 0 : buf.duration / 3;
    const playDur = buf.duration - offset;
    if (playDur <= fade * 2) return;

    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buf;
    src.connect(gain);
    gain.connect(bus);

    const startGain = fromStart ? 1 : 0.0001;
    gain.gain.setValueAtTime(startGain, when);
    if (!fromStart) {
      gain.gain.linearRampToValueAtTime(1, when + fade);
    }
    const fadeOutAt = when + playDur - fade;
    gain.gain.setValueAtTime(1, fadeOutAt);
    gain.gain.linearRampToValueAtTime(0.0001, when + playDur);

    src.start(when, offset);
    src.stop(when + playDur + 0.02);
    this.musicNodes.push({ src, gain });
    src.onended = () => {
      this.musicNodes = this.musicNodes.filter((n) => n.src !== src);
    };

    const nextAt = when + playDur - fade;
    const waitMs = Math.max(0, (nextAt - ctx.currentTime) * 1000 - 40);
    this.musicTimer = window.setTimeout(() => {
      if (this.musicGen !== gen || this.musicMode !== "title") return;
      this.playTitleSlice(buf, Math.max(ctx.currentTime, nextAt), false, gen);
    }, waitMs);
  }

  coin() {
    this.oneshot("coin");
  }
  start() {
    this.oneshot("start");
  }
  hit() {
    this.oneshot("hit");
  }
  shoot() {
    this.oneshot("shoot");
  }
  punch() {
    this.oneshot("punch");
  }
  ko() {
    this.oneshot("ko");
  }
  crunch() {
    this.oneshot("crunch");
  }
  gameOver() {
    this.oneshot("gameOver");
  }
  move() {
    this.oneshot("move");
  }
  select() {
    this.oneshot("select");
  }
  jump() {
    this.oneshot("jump");
  }
  drop() {
    this.oneshot("drop");
  }
  pickup() {
    this.oneshot("pickup");
  }
  bus() {
    this.oneshot("bus");
  }
  xp() {
    this.oneshot("xp");
  }
  warp() {
    this.oneshot("warp");
  }
  knock() {
    this.oneshot("knock");
  }
  revive() {
    this.oneshot("revive");
  }
  emote() {
    this.oneshot("emote");
  }
  scarShot() {
    this.oneshot("scarShot");
  }
  pumpShot() {
    this.oneshot("pumpShot");
  }
  exoticShot() {
    this.oneshot("exoticShot");
  }
  pickaxeSwing() {
    this.oneshot("pickaxeSwing");
  }
  dryClick() {
    this.oneshot("dryClick");
  }
  pickupGun() {
    this.oneshot("pickupGun");
  }
  pickupAmmo() {
    this.oneshot("pickupAmmo");
  }
  medkitUse() {
    this.oneshot("medkitUse");
  }
  shieldChug() {
    this.oneshot("shieldChug");
  }
  chestOpen() {
    this.oneshot("chestOpen");
  }
  llama() {
    this.oneshot("llama");
  }
  playerHurt() {
    this.oneshot("playerHurt");
  }
  reload() {
    this.oneshot("reload");
  }
  enemyShot() {
    this.oneshot("enemyShot");
  }
  enemyBossShot() {
    this.oneshot("enemyBossShot");
  }

  playWeapon(id: "pickaxe" | "pump" | "scar" | "exotic") {
    if (id === "pickaxe") this.pickaxeSwing();
    else if (id === "pump") this.pumpShot();
    else if (id === "scar") this.scarShot();
    else this.exoticShot();
  }

  playEnemyGun(boss: boolean) {
    if (boss) this.enemyBossShot();
    else this.enemyShot();
  }

  playFpsMusic(mode: Exclude<FpsMusicMode, "off">) {
    if (typeof window === "undefined") return;
    this.unlock();
    const live = this.musicNodes.length > 0 || this.musicTimer != null;
    if (this.musicMode === mode) {
      if (live) return;
      if (!this.muted) this.startMusic(mode, this.musicGen);
      return;
    }
    this.haltMusic(MUSIC_STOP_FADE);
    this.musicMode = mode;
    if (this.muted) return;
    this.startMusic(mode, this.musicGen);
  }

  stopFpsMusic() {
    this.haltMusic(MUSIC_STOP_FADE);
    this.musicMode = "off";
  }

  bossSting() {
    this.start();
  }

  levelClear() {
    this.xp();
  }
}

export const sfx = new SamplePlayer();
