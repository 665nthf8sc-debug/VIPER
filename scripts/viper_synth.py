"""Shared DSP for original VIPER themes and one-shot SFX (numpy + ffmpeg)."""

from __future__ import annotations

import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 44100
BPM = 98.0
BEAT = 60.0 / BPM
BAR = BEAT * 4.0
RNG = np.random.default_rng(3384)

ROOT = Path(__file__).resolve().parents[1]
OUT_WAV = ROOT / "scripts" / "output"
PUBLIC_MUSIC = ROOT / "public" / "audio" / "music"
PUBLIC_SFX = ROOT / "public" / "audio" / "sfx"


def midi_hz(n: float) -> float:
    return 440.0 * (2.0 ** ((n - 69.0) / 12.0))


def time_axis(n: int) -> np.ndarray:
    return np.arange(n, dtype=np.float64) / SR


def adsr(n: int, attack: float, decay: float, sustain: float, release: float) -> np.ndarray:
    a = max(int(attack * SR), 1)
    d = max(int(decay * SR), 1)
    r = max(int(release * SR), 1)
    s = max(n - a - d - r, 0)
    env = np.concatenate(
        [
            np.linspace(0.0, 1.0, a, endpoint=False),
            np.linspace(1.0, sustain, d, endpoint=False),
            np.full(s, sustain, dtype=np.float64),
            np.linspace(sustain, 0.0, r),
        ]
    )
    if len(env) < n:
        env = np.pad(env, (0, n - len(env)))
    return env[:n]


def exp_env(n: int, decay: float, peak: float = 1.0) -> np.ndarray:
    t = time_axis(n)
    return peak * np.exp(-t / max(decay, 1e-4))


def sine(freq: np.ndarray | float, t: np.ndarray) -> np.ndarray:
    return np.sin(2.0 * np.pi * np.asarray(freq, dtype=np.float64) * t)


def saw(freq: float, t: np.ndarray) -> np.ndarray:
    return 2.0 * np.mod(t * freq, 1.0) - 1.0


def square(freq: float, t: np.ndarray, duty: float = 0.5) -> np.ndarray:
    return np.where(np.mod(t * freq, 1.0) < duty, 1.0, -1.0)


def tri(freq: float, t: np.ndarray) -> np.ndarray:
    return 2.0 * np.abs(2.0 * np.mod(t * freq, 1.0) - 1.0) - 1.0


def noise(n: int) -> np.ndarray:
    return RNG.uniform(-1.0, 1.0, n)


def pinkish(n: int) -> np.ndarray:
    w = noise(n)
    b = np.convolve(w, np.ones(12) / 12.0, mode="same")
    return 0.55 * w + 0.45 * b


def fir_lowpass(cutoff: float, taps: int = 97) -> np.ndarray:
    taps = taps | 1
    m = (taps - 1) / 2.0
    n = np.arange(taps) - m
    f = max(cutoff, 20.0) / SR
    h = np.sinc(2.0 * f * n) * np.hamming(taps)
    s = np.sum(h)
    return h / (s if s else 1.0)


def fir_highpass(cutoff: float, taps: int = 97) -> np.ndarray:
    h = fir_lowpass(cutoff, taps)
    d = np.zeros_like(h)
    d[len(h) // 2] = 1.0
    return d - h


def apply_fir(x: np.ndarray, h: np.ndarray) -> np.ndarray:
    return np.convolve(x, h, mode="same")


def lowpass(x: np.ndarray, cutoff: float, taps: int = 97) -> np.ndarray:
    return apply_fir(x, fir_lowpass(cutoff, taps))


def highpass(x: np.ndarray, cutoff: float, taps: int = 97) -> np.ndarray:
    return apply_fir(x, fir_highpass(cutoff, taps))


def bandpass(x: np.ndarray, lo: float, hi: float) -> np.ndarray:
    return lowpass(highpass(x, lo), hi)


def tanh_sat(x: np.ndarray, drive: float = 1.2) -> np.ndarray:
    return np.tanh(x * drive)


def chorus(x: np.ndarray, depth: float = 0.0028, rate: float = 0.72) -> np.ndarray:
    t = time_axis(len(x))
    delay = (depth * SR * (0.55 + 0.45 * np.sin(2.0 * np.pi * rate * t))).astype(np.int32)
    idx = np.clip(np.arange(len(x)) - delay, 0, len(x) - 1)
    return 0.68 * x + 0.32 * x[idx]


def echoes(x: np.ndarray, delay_s: float, taps: int = 4, fb: float = 0.38, mix: float = 0.3) -> np.ndarray:
    wet = np.zeros_like(x)
    n = max(int(delay_s * SR), 1)
    for i in range(1, taps + 1):
        d = n * i
        if d >= len(x):
            break
        wet[d:] += x[:-d] * (fb ** (i - 1))
    return x * (1.0 - mix) + wet * mix


def reverb(x: np.ndarray, mix: float = 0.22) -> np.ndarray:
    wet = np.zeros_like(x)
    for delay, g in ((0.023, 0.42), (0.031, 0.36), (0.043, 0.3), (0.059, 0.24), (0.073, 0.18)):
        d = int(delay * SR)
        if d < len(x):
            wet[d:] += x[:-d] * g
    wet = lowpass(wet, 6200, taps=49)
    return x * (1.0 - mix) + wet * mix


def stereo_from_mono(x: np.ndarray, width: float = 0.18) -> np.ndarray:
    n = len(x)
    d = max(int(width * 0.0018 * SR), 1)
    left = x
    right = np.zeros(n)
    right[d:] = x[:-d]
    right = 0.92 * right + 0.08 * x
    return np.vstack([left, right])


def pan_mono(x: np.ndarray, pan: float = 0.0, gain: float = 1.0) -> np.ndarray:
    ang = (np.clip(pan, -1.0, 1.0) + 1.0) * 0.25 * np.pi
    g = gain * x
    return np.vstack([g * np.cos(ang), g * np.sin(ang)])


def mix_at(dest: np.ndarray, src: np.ndarray, t: float) -> None:
    i = int(t * SR)
    if src.ndim == 1:
        src = pan_mono(src, 0.0, 1.0)
    n = min(src.shape[1], dest.shape[1] - i)
    if i < 0 or n <= 0:
        return
    dest[:, i : i + n] += src[:, :n]


def normalize_peak(x: np.ndarray, peak: float = 0.89) -> np.ndarray:
    m = np.max(np.abs(x)) + 1e-9
    return x * (peak / m)


def render_osc(
    freq: float,
    dur: float,
    wave: str = "sine",
    amp: float = 0.2,
    attack: float = 0.01,
    decay: float = 0.08,
    sustain: float = 0.55,
    release: float = 0.12,
    slide: float | None = None,
) -> np.ndarray:
    n = max(int(dur * SR), 1)
    t = time_axis(n)
    if slide is None:
        f = freq
        tt = t
        if wave == "sine":
            sig = sine(f, tt)
        elif wave == "saw":
            sig = saw(f, tt)
        elif wave == "square":
            sig = square(f, tt)
        else:
            sig = tri(f, tt)
    else:
        f = freq * np.exp(-t / dur * np.log(max(freq, 20.0) / max(slide, 20.0)))
        phase = 2.0 * np.pi * np.cumsum(f) / SR
        if wave == "sine":
            sig = np.sin(phase)
        elif wave == "saw":
            sig = 2.0 * np.mod(phase / (2.0 * np.pi), 1.0) - 1.0
        elif wave == "square":
            sig = np.where(np.mod(phase / (2.0 * np.pi), 1.0) < 0.5, 1.0, -1.0)
        else:
            sig = 2.0 * np.abs(2.0 * np.mod(phase / (2.0 * np.pi), 1.0) - 1.0) - 1.0
    env = adsr(n, attack, decay, sustain, release)
    return sig * env * amp


def kick_808(dur: float = 0.72, start_f: float = 128.0, end_f: float = 36.0) -> np.ndarray:
    n = max(int(dur * SR), 1)
    t = time_axis(n)
    freq = end_f + (start_f - end_f) * np.exp(-t * 16.5)
    phase = 2.0 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase) * np.exp(-t * 2.8)
    click = highpass(noise(n), 1800, taps=33) * np.exp(-t * 70.0) * 0.22
    punch = np.sin(2.0 * np.pi * 68.0 * t) * np.exp(-t * 18.0) * 0.28
    return tanh_sat(body * 1.35 + punch + click, 1.15)


def snare(dur: float = 0.22) -> np.ndarray:
    n = max(int(dur * SR), 1)
    t = time_axis(n)
    tone = sine(186.0, t) * np.exp(-t * 14.0) * 0.35
    snap = bandpass(noise(n), 900, 7000) * np.exp(-t * 16.0)
    body = bandpass(pinkish(n), 200, 1600) * np.exp(-t * 10.0) * 0.7
    return tanh_sat(tone + snap * 0.85 + body, 1.05)


def hat(dur: float = 0.06, open_: bool = False) -> np.ndarray:
    n = max(int(dur * SR), 1)
    t = time_axis(n)
    decay = 0.11 if open_ else 0.028
    raw = highpass(noise(n), 6200, taps=49)
    return raw * np.exp(-t / decay) * (0.22 if open_ else 0.16)


def shaker(dur: float = 0.05) -> np.ndarray:
    n = max(int(dur * SR), 1)
    t = time_axis(n)
    return bandpass(noise(n), 4000, 12000) * np.exp(-t * 38.0) * 0.12


def pad_chord(freqs: list[float], dur: float, amp: float = 0.12) -> np.ndarray:
    n = max(int(dur * SR), 1)
    t = time_axis(n)
    sig = np.zeros(n)
    for i, f in enumerate(freqs):
        det = 1.0 + (i - 1.5) * 0.0016
        sig += sine(f * det, t)
        sig += 0.18 * sine(f * 2.0 * det, t)
        sig += 0.08 * tri(f * 0.5, t)
    sig /= max(len(freqs), 1)
    env = adsr(n, 0.35, 0.4, 0.72, min(1.1, dur * 0.35))
    return lowpass(chorus(sig * env * amp), 3400, taps=65)


def lead_tone(freq: float, dur: float, amp: float = 0.16) -> np.ndarray:
    n = max(int(dur * SR), 1)
    t = time_axis(n)
    a = saw(freq * 0.997, t)
    b = saw(freq * 1.004, t)
    c = 0.22 * square(freq * 0.5, t, duty=0.42)
    sig = lowpass(a + b + c, 2100, taps=81)
    env = adsr(n, 0.012, 0.09, 0.58, 0.16)
    return sig * env * amp


def bass_tone(freq: float, dur: float, amp: float = 0.22) -> np.ndarray:
    n = max(int(dur * SR), 1)
    t = time_axis(n)
    sig = 0.72 * sine(freq, t) + 0.22 * saw(freq, t) + 0.12 * sine(freq * 2.0, t)
    sig = lowpass(sig, 420, taps=65)
    env = adsr(n, 0.02, 0.12, 0.7, 0.18)
    return tanh_sat(sig * env * amp, 1.1)


def brass_stab(freq: float, dur: float = 0.18, amp: float = 0.14) -> np.ndarray:
    n = max(int(dur * SR), 1)
    t = time_axis(n)
    sig = 0.45 * saw(freq, t) + 0.3 * square(freq, t, 0.4) + 0.25 * saw(freq * 1.5, t)
    sig = lowpass(sig, 1600, taps=49)
    env = adsr(n, 0.008, 0.06, 0.28, 0.1)
    return sig * env * amp


def pluck(freq: float, dur: float = 0.42, amp: float = 0.12) -> np.ndarray:
    n = max(int(dur * SR), 1)
    period = max(int(SR / max(freq, 40.0)), 2)
    buf = RNG.uniform(-1.0, 1.0, period)
    out = np.empty(n)
    idx = 0
    for i in range(n):
        out[i] = buf[idx]
        nxt = (idx + 1) % period
        buf[idx] = 0.992 * 0.5 * (buf[idx] + buf[nxt])
        idx = nxt
    env = adsr(n, 0.002, 0.05, 0.35, 0.18)
    return lowpass(out * env * amp, 2600, taps=49)


def reverse_cymbal(dur: float = 1.4) -> np.ndarray:
    n = max(int(dur * SR), 1)
    t = time_axis(n)
    raw = highpass(noise(n), 2400, taps=49)
    env = (t / max(dur, 1e-4)) ** 2.4
    return raw * env * 0.16


def sweep_whoosh(dur: float, f0: float, f1: float, amp: float = 0.4) -> np.ndarray:
    n = max(int(dur * SR), 1)
    raw = noise(n)
    blocks = 24
    out = np.zeros(n)
    bs = n // blocks
    for i in range(blocks):
        f = f0 + (f1 - f0) * i / max(blocks - 1, 1)
        sl = slice(i * bs, n if i == blocks - 1 else (i + 1) * bs)
        out[sl] = bandpass(raw[sl], max(f * 0.45, 80.0), f * 1.8)
    t = time_axis(n)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.15
    return out * env * amp


def write_wav_stereo(path: Path, stereo: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = np.clip(stereo, -1.0, 1.0)
    interleaved = np.empty(pcm.shape[1] * 2, dtype=np.float64)
    interleaved[0::2] = pcm[0]
    interleaved[1::2] = pcm[1]
    frames = (interleaved * 32767.0).astype(np.int16).tobytes()
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(frames)


def encode_ogg(wav_path: Path, ogg_path: Path) -> None:
    ogg_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(wav_path),
            "-c:a",
            "libvorbis",
            "-q:a",
            "6",
            "-ar",
            str(SR),
            "-ac",
            "2",
            str(ogg_path),
        ],
        check=True,
        capture_output=True,
    )


def bake_loop_crossfade(stereo: np.ndarray, fade_s: float = 0.5) -> np.ndarray:
    n = int(fade_s * SR)
    n = min(n, stereo.shape[1] // 4)
    t = np.linspace(0.0, 1.0, n)
    fade_out = np.sqrt(1.0 - t)
    fade_in = np.sqrt(t)
    out = stereo.copy()
    out[:, -n:] = out[:, -n:] * fade_out + out[:, :n] * fade_in
    out[:, -1] = out[:, 0]
    return out
