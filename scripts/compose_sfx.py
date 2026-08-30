#!/usr/bin/env python3
"""Original one-shot BR / UI SFX for VIPER. Names match lib/sfx.ts methods."""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))

from viper_synth import (
    OUT_WAV,
    PUBLIC_SFX,
    SR,
    bandpass,
    encode_ogg,
    exp_env,
    highpass,
    lowpass,
    midi_hz,
    noise,
    normalize_peak,
    pinkish,
    render_osc,
    stereo_from_mono,
    sweep_whoosh,
    tanh_sat,
    time_axis,
    write_wav_stereo,
)

SFX_NAMES = [
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
]


def mix(parts: list[np.ndarray], n: int | None = None) -> np.ndarray:
    if n is None:
        n = max(len(p) for p in parts)
    out = np.zeros(n)
    for p in parts:
        out[: len(p)] += p
    return out


def place(buf: np.ndarray, sig: np.ndarray, t: float) -> None:
    i = int(t * SR)
    n = min(len(sig), len(buf) - i)
    if n > 0 and i >= 0:
        buf[i : i + n] += sig[:n]


def crack(dur: float, amp: float = 0.7) -> np.ndarray:
    n = max(int(dur * SR), 1)
    t = time_axis(n)
    snap = highpass(noise(n), 2500, taps=33) * np.exp(-t * 90.0)
    body = bandpass(pinkish(n), 400, 2800) * np.exp(-t * 38.0)
    return tanh_sat(snap * 0.9 + body * 0.7, 1.3) * amp


def boom(dur: float, f0: float = 90.0, f1: float = 38.0, amp: float = 0.8) -> np.ndarray:
    n = max(int(dur * SR), 1)
    t = time_axis(n)
    freq = f1 + (f0 - f1) * np.exp(-t * 22.0)
    phase = 2.0 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase) * np.exp(-t * 9.0)
    air = bandpass(noise(n), 120, 1400) * np.exp(-t * 12.0) * 0.45
    return tanh_sat(body + air, 1.25) * amp


def click(dur: float = 0.04, hp: float = 1800.0, amp: float = 0.5) -> np.ndarray:
    n = max(int(dur * SR), 1)
    t = time_axis(n)
    return highpass(noise(n), hp, taps=33) * np.exp(-t * 120.0) * amp


def sparkle(freqs: list[float], dur: float = 0.18, amp: float = 0.22) -> np.ndarray:
    n = max(int(dur * SR), 1)
    out = np.zeros(n)
    for i, f in enumerate(freqs):
        tone = render_osc(f, dur, "sine", amp=amp * (0.85**i), attack=0.004, decay=0.05, sustain=0.25, release=dur * 0.5)
        place(out, tone, i * 0.045)
    return out


def stereo_out(mono: np.ndarray, width: float = 0.16) -> np.ndarray:
    return normalize_peak(stereo_from_mono(mono, width), 0.92)


def sfx_coin() -> np.ndarray:
    return mix(
        [
            sparkle([midi_hz(81), midi_hz(88), midi_hz(93)], 0.22, 0.28),
            click(0.02, 4000, 0.15),
        ]
    )


def sfx_start() -> np.ndarray:
    buf = np.zeros(int(0.42 * SR))
    for i, m in enumerate([67, 71, 74]):
        place(buf, render_osc(midi_hz(m), 0.16, "tri", 0.22, 0.006, 0.05, 0.4, 0.1), i * 0.09)
    return buf


def sfx_hit() -> np.ndarray:
    return mix([boom(0.18, 140, 48, 0.7), crack(0.08, 0.55)])


def sfx_shoot() -> np.ndarray:
    return mix([crack(0.07, 0.65), boom(0.09, 160, 70, 0.4), click(0.025, 3200, 0.25)])


def sfx_punch() -> np.ndarray:
    return mix([boom(0.11, 180, 70, 0.55), click(0.03, 900, 0.4), crack(0.05, 0.25)])


def sfx_ko() -> np.ndarray:
    return mix([boom(0.28, 110, 32, 0.85), crack(0.14, 0.5), bandpass(pinkish(int(0.16 * SR)), 200, 900) * exp_env(int(0.16 * SR), 0.07) * 0.35])


def sfx_crunch() -> np.ndarray:
    n = int(0.12 * SR)
    grit = bandpass(noise(n), 300, 2200) * exp_env(n, 0.04)
    return mix([grit * 0.7, boom(0.09, 120, 55, 0.35)])


def sfx_gameOver() -> np.ndarray:
    buf = np.zeros(int(0.85 * SR))
    place(buf, render_osc(midi_hz(65), 0.22, "tri", 0.2, 0.01, 0.08, 0.35, 0.12, slide=midi_hz(60)), 0)
    place(buf, render_osc(midi_hz(60), 0.24, "tri", 0.2, 0.01, 0.08, 0.35, 0.14, slide=midi_hz(53)), 0.18)
    place(buf, render_osc(midi_hz(50), 0.42, "sine", 0.24, 0.02, 0.1, 0.4, 0.22, slide=midi_hz(38)), 0.38)
    place(buf, boom(0.3, 80, 30, 0.25), 0.4)
    return buf


def sfx_move() -> np.ndarray:
    return mix(
        [
            click(0.03, 2400, 0.28) * 0.7,
            render_osc(220, 0.035, "tri", 0.08, 0.001, 0.01, 0.2, 0.02),
        ]
    )


def sfx_select() -> np.ndarray:
    return mix([render_osc(740, 0.07, "sine", 0.18, 0.002, 0.02, 0.3, 0.04), click(0.02, 5000, 0.12)])


def sfx_jump() -> np.ndarray:
    return render_osc(320, 0.14, "sine", 0.22, 0.004, 0.04, 0.3, 0.06, slide=720)


def sfx_drop() -> np.ndarray:
    wind = sweep_whoosh(0.62, 400, 1800, amp=0.55)
    fall = render_osc(180, 0.4, "sine", 0.16, 0.02, 0.12, 0.4, 0.18, slide=70)
    return mix([wind, fall])


def sfx_pickup() -> np.ndarray:
    return sparkle([midi_hz(76), midi_hz(83)], 0.16, 0.24)


def sfx_bus() -> np.ndarray:
    n = int(1.05 * SR)
    t = time_axis(n)
    # engine rumble with doppler (approach then recede)
    freq = 92.0 * (1.25 - 0.55 * t / 1.05)
    rumble = np.sin(2.0 * np.pi * np.cumsum(freq) / SR)
    rumble += 0.35 * np.sin(2.0 * np.pi * np.cumsum(freq * 0.5) / SR)
    env = np.sin(np.pi * np.clip(t / 1.05, 0, 1)) ** 1.05
    whoosh = sweep_whoosh(1.0, 200, 900, amp=0.35)
    return tanh_sat(mix([rumble * env * 0.45, whoosh * 0.7]), 1.1)


def sfx_xp() -> np.ndarray:
    return sparkle([midi_hz(76), midi_hz(81), midi_hz(88)], 0.22, 0.22)


def sfx_warp() -> np.ndarray:
    up = render_osc(240, 0.18, "saw", 0.12, 0.01, 0.05, 0.4, 0.08, slide=980)
    swirl = sweep_whoosh(0.2, 600, 4000, amp=0.3)
    return mix([lowpass(up, 1800, taps=49), swirl])


def sfx_knock() -> np.ndarray:
    return mix([boom(0.26, 95, 32, 0.8), bandpass(pinkish(int(0.18 * SR)), 80, 500) * exp_env(int(0.18 * SR), 0.08) * 0.5])


def sfx_revive() -> np.ndarray:
    buf = np.zeros(int(0.46 * SR))
    for i, m in enumerate([67, 71, 79]):
        place(buf, render_osc(midi_hz(m), 0.16, "sine", 0.2, 0.008, 0.05, 0.4, 0.08), i * 0.09)
    return buf


def sfx_emote() -> np.ndarray:
    buf = np.zeros(int(0.38 * SR))
    for i, m in enumerate([72, 76, 79]):
        place(buf, render_osc(midi_hz(m), 0.14, "tri", 0.18, 0.006, 0.04, 0.35, 0.07), i * 0.07)
    return buf


def sfx_scarShot() -> np.ndarray:
    n = int(0.11 * SR)
    crackle = crack(0.055, 0.85)
    body = boom(0.08, 210, 85, 0.42)
    mech = click(0.018, 2800, 0.35)
    tail = bandpass(noise(n), 1800, 7000) * exp_env(n, 0.025) * 0.28
    return mix([crackle, body, mech, tail])


def sfx_pumpShot() -> np.ndarray:
    n = int(0.3 * SR)
    body = boom(0.28, 78, 28, 1.0)
    blast = bandpass(pinkish(n), 180, 2200) * exp_env(n, 0.07) * 0.85
    crackle = crack(0.09, 0.55)
    shell = click(0.04, 1400, 0.3)
    buf = mix([body, blast, crackle])
    place(buf, shell, 0.12)
    return buf


def sfx_exoticShot() -> np.ndarray:
    zap = render_osc(520, 0.12, "saw", 0.16, 0.002, 0.03, 0.25, 0.06, slide=1480)
    core = render_osc(330, 0.14, "tri", 0.14, 0.004, 0.04, 0.3, 0.07, slide=90)
    fizz = highpass(noise(int(0.1 * SR)), 4000, taps=33) * exp_env(int(0.1 * SR), 0.04) * 0.35
    return mix([lowpass(zap, 2400, taps=49), core, fizz])


def sfx_pickaxeSwing() -> np.ndarray:
    whoosh = sweep_whoosh(0.18, 350, 2400, amp=0.7)
    thunk = boom(0.08, 160, 60, 0.25)
    buf = mix([whoosh])
    place(buf, thunk, 0.09)
    return buf


def sfx_dryClick() -> np.ndarray:
    buf = np.zeros(int(0.08 * SR))
    place(buf, click(0.025, 2200, 0.55), 0)
    place(buf, click(0.02, 900, 0.28), 0.018)
    return buf


def sfx_pickupGun() -> np.ndarray:
    buf = np.zeros(int(0.28 * SR))
    place(buf, click(0.03, 1600, 0.35), 0)
    place(buf, render_osc(midi_hz(67), 0.08, "tri", 0.16, 0.004, 0.03, 0.3, 0.04), 0.03)
    place(buf, render_osc(midi_hz(74), 0.1, "tri", 0.16, 0.004, 0.03, 0.3, 0.05), 0.09)
    place(buf, render_osc(midi_hz(79), 0.12, "sine", 0.14, 0.004, 0.04, 0.3, 0.06), 0.16)
    return buf


def sfx_pickupAmmo() -> np.ndarray:
    buf = np.zeros(int(0.16 * SR))
    place(buf, click(0.025, 1800, 0.4), 0)
    place(buf, click(0.03, 1400, 0.32), 0.04)
    place(buf, click(0.035, 1100, 0.28), 0.085)
    return buf


def sfx_medkitUse() -> np.ndarray:
    n = int(0.48 * SR)
    t = time_axis(n)
    spray = bandpass(noise(n), 2500, 9000) * (0.55 + 0.45 * np.sin(2 * np.pi * 28 * t)) * exp_env(n, 0.22)
    heal = sparkle([midi_hz(64), midi_hz(68), midi_hz(73)], 0.28, 0.16)
    buf = spray * 0.55
    place(buf, heal, 0.12)
    return buf


def sfx_shieldChug() -> np.ndarray:
    n = int(0.5 * SR)
    t = time_axis(n)
    glug = np.sin(2 * np.pi * (90 + 40 * np.sin(2 * np.pi * 6 * t)) * t)
    glug *= 0.35 + 0.2 * np.sin(2 * np.pi * 4.5 * t)
    env = np.sin(np.pi * np.clip(t / 0.5, 0, 1)) ** 0.8
    liquid = bandpass(pinkish(n), 200, 1600) * env * 0.4
    chime = render_osc(880, 0.22, "sine", 0.1, 0.01, 0.06, 0.3, 0.12)
    buf = tanh_sat(glug * env * 0.5 + liquid, 1.05)
    place(buf, chime, 0.22)
    return buf


def sfx_chestOpen() -> np.ndarray:
    buf = np.zeros(int(0.52 * SR))
    latch = mix([click(0.04, 1200, 0.55), boom(0.08, 140, 70, 0.3)])
    wood = bandpass(noise(int(0.08 * SR)), 400, 1800) * exp_env(int(0.08 * SR), 0.03) * 0.4
    place(buf, latch, 0)
    place(buf, wood, 0.03)
    place(buf, sparkle([midi_hz(72), midi_hz(79), midi_hz(84)], 0.28, 0.2), 0.14)
    return buf


def sfx_llama() -> np.ndarray:
    buf = np.zeros(int(0.42 * SR))
    place(buf, render_osc(330, 0.1, "tri", 0.14, 0.004, 0.03, 0.25, 0.04, slide=440), 0)
    place(buf, render_osc(392, 0.1, "tri", 0.14, 0.004, 0.03, 0.25, 0.04, slide=520), 0.08)
    place(buf, render_osc(262, 0.16, "tri", 0.16, 0.006, 0.04, 0.35, 0.08), 0.17)
    place(buf, sparkle([midi_hz(79), midi_hz(83)], 0.14, 0.12), 0.22)
    return lowpass(buf, 3200, taps=49)


def sfx_playerHurt() -> np.ndarray:
    return mix(
        [
            boom(0.16, 100, 40, 0.7),
            bandpass(pinkish(int(0.12 * SR)), 250, 1400) * exp_env(int(0.12 * SR), 0.05) * 0.45,
        ]
    )


def sfx_reload() -> np.ndarray:
    buf = np.zeros(int(0.2 * SR))
    place(buf, click(0.03, 1600, 0.45), 0)
    place(buf, click(0.04, 900, 0.35), 0.055)
    place(buf, render_osc(180, 0.05, "tri", 0.1, 0.002, 0.015, 0.2, 0.02), 0.1)
    place(buf, click(0.025, 2200, 0.3), 0.12)
    return buf


BUILDERS = {
    "coin": sfx_coin,
    "start": sfx_start,
    "hit": sfx_hit,
    "shoot": sfx_shoot,
    "punch": sfx_punch,
    "ko": sfx_ko,
    "crunch": sfx_crunch,
    "gameOver": sfx_gameOver,
    "move": sfx_move,
    "select": sfx_select,
    "jump": sfx_jump,
    "drop": sfx_drop,
    "pickup": sfx_pickup,
    "bus": sfx_bus,
    "xp": sfx_xp,
    "warp": sfx_warp,
    "knock": sfx_knock,
    "revive": sfx_revive,
    "emote": sfx_emote,
    "scarShot": sfx_scarShot,
    "pumpShot": sfx_pumpShot,
    "exoticShot": sfx_exoticShot,
    "pickaxeSwing": sfx_pickaxeSwing,
    "dryClick": sfx_dryClick,
    "pickupGun": sfx_pickupGun,
    "pickupAmmo": sfx_pickupAmmo,
    "medkitUse": sfx_medkitUse,
    "shieldChug": sfx_shieldChug,
    "chestOpen": sfx_chestOpen,
    "llama": sfx_llama,
    "playerHurt": sfx_playerHurt,
    "reload": sfx_reload,
}


def main() -> None:
    assert set(BUILDERS) == set(SFX_NAMES)
    PUBLIC_SFX.mkdir(parents=True, exist_ok=True)
    OUT_WAV.mkdir(parents=True, exist_ok=True)
    for name in SFX_NAMES:
        mono = BUILDERS[name]()
        stereo = stereo_out(mono)
        wav = OUT_WAV / f"{name}.wav"
        ogg = PUBLIC_SFX / f"{name}.ogg"
        write_wav_stereo(wav, stereo)
        encode_ogg(wav, ogg)
        print(f"sfx {name:14s} {stereo.shape[1] / SR:.3f}s")


if __name__ == "__main__":
    main()
