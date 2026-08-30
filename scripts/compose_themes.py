#!/usr/bin/env python3
"""Compose original VIPER title (~59s) and locker (~78s loop) themes.

D-dorian cinematic trap at 98 BPM. Tropical night / cobra / GTA-title swagger.
Lead hook: A4 C5 B4 G4 F4 A4 C5 D5
Bass wholes: D2 D2 C2 F2 D2 A1 C2 G1
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))

from viper_synth import (
    BAR,
    BEAT,
    BPM,
    OUT_WAV,
    PUBLIC_MUSIC,
    SR,
    bake_loop_crossfade,
    bass_tone,
    brass_stab,
    encode_ogg,
    echoes,
    hat,
    kick_808,
    lead_tone,
    midi_hz,
    mix_at,
    normalize_peak,
    pad_chord,
    pluck,
    reverb,
    reverse_cymbal,
    shaker,
    snare,
    stereo_from_mono,
    write_wav_stereo,
)

LEAD_MIDI = [69, 72, 71, 67, 65, 69, 72, 74]  # A4 C5 B4 G4 F4 A4 C5 D5
BASS_MIDI = [38, 38, 36, 41, 38, 33, 36, 31]  # D2 D2 C2 F2 D2 A1 C2 G1

CHORDS = [
    [50, 53, 57, 60],  # Dm7
    [50, 53, 57, 62],  # Dm add9
    [48, 52, 55, 59],  # Cmaj7
    [53, 57, 60, 64],  # Fmaj7
    [50, 53, 57, 60],  # Dm7
    [45, 48, 52, 55],  # Am7
    [48, 52, 55, 59],  # Cmaj7
    [43, 46, 50, 53],  # Gm7
]


def t_bar(bar: float, beat: float = 0.0) -> float:
    return bar * BAR + beat * BEAT


def bass_line(stereo: np.ndarray, bars: int, start_bar: int = 0) -> None:
    for bar in range(bars):
        midi = BASS_MIDI[(start_bar + bar) % 8]
        tone = bass_tone(midi_hz(midi), BAR * 0.96, amp=0.26)
        mix_at(stereo, stereo_from_mono(tone, 0.04), t_bar(start_bar + bar))


def pads(stereo: np.ndarray, bars: int, start_bar: int = 0, amp: float = 0.11) -> None:
    for bar in range(bars):
        chord = CHORDS[(start_bar + bar) % 8]
        freqs = [midi_hz(n) for n in chord]
        tone = pad_chord(freqs, BAR * 1.05, amp=amp)
        mix_at(stereo, stereo_from_mono(tone, 0.28), t_bar(start_bar + bar))


def hook_lead(stereo: np.ndarray, start_bar: int, repeats: int, amp: float = 0.15) -> None:
    for r in range(repeats):
        for i, midi in enumerate(LEAD_MIDI):
            bar = start_bar + r * 2 + (i // 4)
            beat = float(i % 4)
            note = lead_tone(midi_hz(midi), BEAT * 0.92, amp=amp)
            note = echoes(note, BEAT * 0.75, taps=3, fb=0.33, mix=0.28)
            mix_at(stereo, stereo_from_mono(note, 0.22 if i % 2 else -0.12), t_bar(bar, beat))
            if i in (0, 4):
                harm = lead_tone(midi_hz(midi - 3), BEAT * 0.7, amp=amp * 0.35)
                mix_at(stereo, stereo_from_mono(harm, 0.3), t_bar(bar, beat))


def plucks(stereo: np.ndarray, bars: int, start_bar: int = 0) -> None:
    offs = [1.0, 1.5, 3.0, 3.5]
    for bar in range(bars):
        chord = CHORDS[(start_bar + bar) % 8]
        for j, beat in enumerate(offs):
            f = midi_hz(chord[j % len(chord)] + 12)
            mix_at(
                stereo,
                stereo_from_mono(pluck(f, 0.38, amp=0.07), 0.35 if j % 2 else -0.3),
                t_bar(start_bar + bar, beat),
            )


def stabs(stereo: np.ndarray, start_bar: int, bars: int) -> None:
    for bar in range(bars):
        if bar % 2 == 0:
            f = midi_hz(65 if bar % 4 == 0 else 62)
            mix_at(stereo, stereo_from_mono(brass_stab(f, 0.16, 0.11), 0.08), t_bar(start_bar + bar, 1))
            mix_at(stereo, stereo_from_mono(brass_stab(f * 1.25, 0.12, 0.07), 0.12), t_bar(start_bar + bar, 1))


def add_drums(
    stereo: np.ndarray,
    start: int,
    bars: int,
    fill_every: int = 8,
    light: bool = False,
) -> None:
    for bar in range(bars):
        b = start + bar
        k_amp = 0.55 if light else 1.0
        mix_at(stereo, stereo_from_mono(kick_808(0.72) * k_amp, 0.05), t_bar(b, 0))
        if not light and bar % 2 == 1:
            mix_at(
                stereo,
                stereo_from_mono(kick_808(0.4, start_f=100, end_f=42) * 0.5, 0.04),
                t_bar(b, 2.5),
            )
        mix_at(stereo, stereo_from_mono(snare(0.22) * (0.55 if light else 1.0), 0.08), t_bar(b, 2))
        for eighth in range(8):
            open_ = (not light) and eighth % 4 == 3
            h = hat(0.085 if open_ else 0.045, open_=open_) * (0.7 if light else 1.0)
            mix_at(stereo, stereo_from_mono(h, 0.14), t_bar(b, eighth * 0.5))
            if eighth % 2 == 1 and not light:
                mix_at(stereo, stereo_from_mono(shaker(), 0.22), t_bar(b, eighth * 0.5))
        if fill_every and (bar + 1) % fill_every == 0:
            for k, g in ((3.0, 0.35), (3.25, 0.5), (3.5, 0.7), (3.75, 0.9)):
                mix_at(stereo, stereo_from_mono(snare(0.08) * g, 0.05), t_bar(b, k))


def compose_title() -> None:
    bars = 24
    dur = bars * BAR + 0.28
    n = int(dur * SR)
    stereo = np.zeros((2, n), dtype=np.float64)

    pads(stereo, 24, 0, amp=0.10)
    mix_at(stereo, stereo_from_mono(reverse_cymbal(1.6), 0.2), t_bar(3, 2.4))
    mix_at(stereo, stereo_from_mono(reverse_cymbal(1.2) * 0.7, 0.15), t_bar(7, 2.6))
    mix_at(stereo, stereo_from_mono(reverse_cymbal(1.8), 0.1), t_bar(19, 2.2))

    for bar in range(4):
        mix_at(stereo, stereo_from_mono(kick_808(0.9) * 0.7, 0.04), t_bar(bar, 0))
    bass_line(stereo, 4, 0)

    add_drums(stereo, start=4, bars=12, fill_every=8)
    bass_line(stereo, 12, 4)
    plucks(stereo, 12, 4)
    stabs(stereo, 4, 12)
    hook_lead(stereo, 8, repeats=4, amp=0.155)

    add_drums(stereo, start=16, bars=4, fill_every=4, light=True)
    bass_line(stereo, 4, 16)
    pads(stereo, 4, 16, amp=0.13)
    hook_lead(stereo, 16, repeats=1, amp=0.09)

    add_drums(stereo, start=20, bars=3, fill_every=0)
    bass_line(stereo, 4, 20)
    hook_lead(stereo, 20, repeats=1, amp=0.17)
    stabs(stereo, 20, 2)
    mix_at(stereo, stereo_from_mono(kick_808(1.1, start_f=140, end_f=32) * 0.85, 0.03), t_bar(23, 0))

    stereo[0] = reverb(stereo[0], mix=0.2)
    stereo[1] = reverb(stereo[1], mix=0.22)
    fade_n = int(1.6 * SR)
    stereo[:, -fade_n:] *= np.linspace(1.0, 0.0, fade_n)

    stereo = normalize_peak(stereo, 0.88)
    wav = OUT_WAV / "viper-title-theme.wav"
    ogg = PUBLIC_MUSIC / "viper-title-theme.ogg"
    write_wav_stereo(wav, stereo)
    encode_ogg(wav, ogg)
    print(f"title {stereo.shape[1] / SR:.2f}s -> {ogg}")


def compose_locker() -> None:
    bars = 32
    n = int(bars * BAR * SR)
    stereo = np.zeros((2, n), dtype=np.float64)

    pads(stereo, bars, 0, amp=0.09)
    add_drums(stereo, start=0, bars=bars, fill_every=8)
    bass_line(stereo, bars, 0)
    plucks(stereo, bars, 0)
    stabs(stereo, 0, bars)
    hook_lead(stereo, 4, repeats=4, amp=0.13)
    hook_lead(stereo, 16, repeats=2, amp=0.1)
    hook_lead(stereo, 24, repeats=4, amp=0.145)

    stereo[0] = reverb(stereo[0], mix=0.16)
    stereo[1] = reverb(stereo[1], mix=0.18)
    stereo = bake_loop_crossfade(normalize_peak(stereo, 0.86), 0.5)

    wav = OUT_WAV / "viper-locker-theme.wav"
    ogg = PUBLIC_MUSIC / "viper-locker-theme.ogg"
    write_wav_stereo(wav, stereo)
    encode_ogg(wav, ogg)
    print(f"locker {stereo.shape[1] / SR:.2f}s -> {ogg}")


def main() -> None:
    print(f"composing themes @ {BPM} BPM, SR={SR}")
    compose_title()
    compose_locker()


if __name__ == "__main__":
    main()
