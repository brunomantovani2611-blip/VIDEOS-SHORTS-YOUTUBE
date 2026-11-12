"""Música de fondo original y efectos para «¿Qué pasaría si la Luna desapareciera?» (53.6 s).
Pads espaciales, un arpegio de celesta y golpes suaves en los cortes. Salida: fondo.wav (48 kHz estéreo)."""
import numpy as np, wave
from scipy import signal
SR = 48000; DUR = 53.6; N = int(SR * DUR)
rng = np.random.default_rng(7)
out = np.zeros((2, N))
def put(x, t, g=1.0, pan=0.0):
    i = int(t * SR); x = x[: max(0, N - i)]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    out[0, i:i + len(x)] += x * g * l * 1.414; out[1, i:i + len(x)] += x * g * r * 1.414
def lp(x, f): return signal.sosfilt(signal.butter(2, f, "low", fs=SR, output="sos"), x)
def bp(x, a, b): return signal.sosfilt(signal.butter(2, [a, b], "band", fs=SR, output="sos"), x)
def pad(freqs, dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * d * t) for f in freqs for d in (0.997, 1.003)) / len(freqs)
    return lp(x, 1400) * np.minimum(1, np.minimum(t / 1.2, (dur - t) / 1.2)) * g
def cel(f, dur=0.9):
    n = int(dur * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 8)) * np.exp(-t * 4) * np.minimum(1, t / 0.004)
def whoosh(dur=0.6, g=1.0):
    n = int(dur * SR); return bp(rng.normal(0, 1, n), 400, 3000) * np.hanning(n) * g
def poof():
    n = int(0.5 * SR); t = np.arange(n) / SR
    return (bp(rng.normal(0, 1, n), 300, 2500) * np.exp(-t * 9) + np.sin(2 * np.pi * np.cumsum(900 - 700 * t / 0.5) / SR) * np.exp(-t * 7) * 0.6)
def rumble(dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    return lp(rng.normal(0, 1, n), 120) * np.minimum(1, t / 1.5) * np.minimum(1, (dur - t) / 1.0) * g
A = 220.0; S = lambda s: A * 2 ** (s / 12)
prog = [(0, 3, 7), (-4, 0, 3), (-7, -3, 0), (-2, 2, 5)]   # La menor, Fa, Re menor, Sol
t = 0.0; k = 0
while t < DUR - 1:
    c = prog[k % 4]
    put(pad([S(s) for s in c] + [S(c[0] - 12)], 4.6), t, 0.5)
    for j in range(8):
        put(cel(S(c[j % 3] + 12 + (12 if j % 4 == 3 else 0))), t + j * 0.5, 0.12, pan=0.3 * np.sin(j))
    t += 4.0; k += 1
put(rumble(16.0, 0.9), 31.0)                         # el tambaleo
for tc in (5.8, 10.9, 16.7, 22.8, 27.4, 31.0, 39.45, 47.3): put(whoosh(0.6, 0.35), tc - 0.3, pan=rng.uniform(-0.4, 0.4))
put(poof(), 2.35, 0.6)                                # la Luna desaparece
put(cel(S(24), 1.6), 49.0, 0.35); put(cel(S(19), 1.6), 49.2, 0.3)   # la Luna vuelve
fade = np.ones(N); fade[-int(1.5 * SR):] = np.linspace(1, 0, int(1.5 * SR))
out *= fade
out *= 0.5 / np.max(np.abs(out))
with wave.open("fondo.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out.T * 32767).astype(np.int16).tobytes())
print("ok", DUR)
