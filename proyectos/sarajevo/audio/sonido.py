"""Sonido del short de Sarajevo: música original y efectos sintetizados (sin bibliotecas con licencia), colocados en su
cuadro exacto, y mezcla con la voz: voz al frente, música y efectos 5-10 dB por debajo, -14 LUFS al final.

Uso:  python sonido.py   ->  musica.wav, efectos.wav, mezcla.wav (48 kHz, estéreo)
La normalización final a -14 LUFS / -1.5 dBTP la hace ffmpeg (loudnorm en dos pasadas) en unir.sh.
"""
import json
import os
import wave

import numpy as np
from scipy import signal

AQUI = os.path.dirname(os.path.abspath(__file__))
SR = 48000
FPS = 30
TOTAL = 1492
N = int(round(TOTAL / FPS * SR))
rng = np.random.default_rng(1914)
fr = lambda f: f / FPS


def ns(t):
    return int(round(t * SR))


def env(n, a=0.005, r=0.1, curve=3.0):
    """envolvente ataque lineal + caída exponencial"""
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(r, 1e-4) * curve / 3)
    return e


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def lp(x, hi, order=2):
    return signal.sosfilt(signal.butter(order, hi, btype="low", fs=SR, output="sos"), x)


def hp(x, lo, order=2):
    return signal.sosfilt(signal.butter(order, lo, btype="high", fs=SR, output="sos"), x)


def put(buf, x, t, g=1.0, pan=0.0):
    i = ns(t)
    if i >= N:
        return
    x = x[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(x)] += x * g * l * 1.414
    buf[1, i:i + len(x)] += x * g * r * 1.414


def db(x):
    return 10 ** (x / 20)


# ============================== instrumentos ==============================
def pluck(freq, dur=0.5, bright=0.5):
    """cuerda pulsada (Karplus-Strong): pizzicato"""
    n = ns(dur)
    period = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, period)
    out = np.zeros(n)
    k = 0.5 + 0.49 * bright
    for i in range(n):
        out[i] = buf[i % period]
        buf[i % period] = k * buf[i % period] + (1 - k) * buf[(i + 1) % period]
        buf[i % period] *= 0.996
    return out * env(n, 0.002, dur * 0.6)


_pl_cache = {}


def pizz(freq, dur=0.45):
    key = (round(freq, 2), dur)
    if key not in _pl_cache:
        _pl_cache[key] = pluck(freq, dur, 0.35)
    return _pl_cache[key]


def tone(freq, dur, harm=(1, 0.5, 0.25), a=0.01, r=0.5):
    n = ns(dur)
    t = np.arange(n) / SR
    x = sum(h * np.sin(2 * np.pi * freq * (k + 1) * t) for k, h in enumerate(harm))
    return x * env(n, a, r)


def drone(freq, dur, g=1.0):
    n = ns(dur)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) + 0.5 * np.sin(2 * np.pi * freq * 2.003 * t) + 0.3 * np.sin(2 * np.pi * freq * 3.01 * t)
    fade = np.minimum(1, np.minimum(t / 0.6, (dur - t) / 0.8))
    return lp(x, 900) * fade * g


def kick(dur=0.4):
    n = ns(dur)
    t = np.arange(n) / SR
    f = 50 + 70 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.18)


def snare(dur=0.18):
    n = ns(dur)
    x = hp(rng.normal(0, 1, n), 1200) * env(n, 0.001, 0.07) + 0.4 * tone(190, dur, (1,), 0.001, 0.05)
    return x


def noise(dur):
    return rng.normal(0, 1, ns(dur))


# ============================== música ==============================
# Do menor, 104 pulsos/min. Desfile (0-15.9 s): ostinato de pizzicato misterioso con bajo; tensión (16-28 s): solo bajo y
# notas sueltas; tras los disparos: silencio; guerra (31.5-44 s): tambor militar + bajo grave; remate: vuelve el pizzicato.
BPM = 104
BEAT = 60 / BPM
C3 = 130.81
NOTE = lambda semis: C3 * 2 ** (semis / 12)


def musica():
    m = np.zeros((2, N))
    # motivo propio (no citado de ninguna obra): do - mib - sol - fa# - sol - lab - sol - mib
    motif = [0, 3, 7, 6, 7, 8, 7, 3]
    bass = [-12, -12, -9, -9, -5, -5, -7, -7]

    def ostinato(t0, t1, g=1.0, oct=12):
        t, k = t0, 0
        while t < t1:
            put(m, pizz(NOTE(motif[k % 8] + oct)), t, 0.5 * g, pan=0.25)
            if k % 2 == 0:
                put(m, pizz(NOTE(bass[k % 8]), 0.6), t, 0.7 * g, pan=-0.2)
            t += BEAT / 2
            k += 1

    ostinato(0.0, fr(114) - 0.05, 0.8)
    ostinato(fr(118), fr(451), 1.0)
    # golpe de orquesta en la explosión: acorde grave + timbal
    put(m, sum(tone(NOTE(s - 12), 1.6, (1, 0.6, 0.3), 0.005, 1.2) for s in (0, 3, 7)), fr(451), 0.55)
    put(m, kick(0.9), fr(451), 0.9)
    # tensión: bajo a negras y notas sueltas
    t = fr(470)
    while t < fr(828):
        put(m, pizz(NOTE(-12), 0.7), t, 0.65, pan=-0.2)
        if int((t - fr(470)) / BEAT) % 4 == 3:
            put(m, pizz(NOTE(6), 0.5), t, 0.35, pan=0.3)
        t += BEAT
    # dron de suspenso desde el giro equivocado hasta los disparos
    put(m, drone(NOTE(-24), fr(831) - fr(648)), fr(648), 0.18)
    put(m, drone(NOTE(-18), fr(831) - fr(722)), fr(722), 0.10)
    # silencio tras los disparos; vuelve leve en el juicio
    t = fr(870)
    while t < fr(944):
        put(m, pizz(NOTE(-12), 0.8), t, 0.45)
        t += BEAT * 2
    # guerra: tambor militar + bajo + acorde grave sostenido
    put(m, drone(NOTE(-24), fr(1329) - fr(944)), fr(944), 0.22)
    t, k = fr(944), 0
    while t < fr(1325):
        put(m, snare(), t, 0.35 if k % 4 else 0.5, pan=0.15)
        if k % 2 == 0:
            put(m, kick(0.35), t, 0.5)
        if k % 8 == 0:
            put(m, pizz(NOTE(-17), 0.9), t, 0.6)
        t += BEAT / 2
        k += 1
    # remate: vuelve el ostinato, más ligero; acaba en seco en la última palabra con un pizzicato final
    ostinato(fr(1336), fr(1484), 0.7)
    put(m, pizz(NOTE(0), 0.6) + pizz(NOTE(-12), 0.6), fr(1486), 0.9)
    return m


# ============================== efectos ==============================
def efectos(words):
    s = np.zeros((2, N))
    # --- ambiente de multitud del desfile (murmullo + vítores cuando pasa el coche)
    def murmur(dur, g):
        x = bp(noise(dur), 300, 1800, 2)
        am = lp(np.abs(rng.normal(0, 1, ns(dur))), 6) * 6
        return x * (0.5 + am) * g

    put(s, murmur(fr(281) - fr(114), 0.10), fr(114), pan=-0.1)
    put(s, murmur(fr(480) - fr(281), 0.12), fr(281), pan=0.1)
    for t0 in (fr(150), fr(250)):  # vítores
        put(s, bp(noise(1.6), 600, 3500) * env(ns(1.6), 0.3, 1.0) * 0.25, t0)
    # --- motor del coche (pulsos graves) en el desfile y el giro
    def motor(dur, rpm_hz, g):
        n = ns(dur)
        t = np.arange(n) / SR
        x = lp(np.sign(np.sin(2 * np.pi * rpm_hz * t)) * (1 + 0.3 * rng.normal(0, 1, n)), 400)
        return x * g

    put(s, motor(fr(281) - fr(202), 14, 0.05), fr(202))
    put(s, motor(fr(690) - fr(648), 22, 0.07), fr(648))
    # --- frenazo (barrido de ruido filtrado) en "frena"
    n = ns(1.1)
    sweep = bp(noise(1.1), 1800, 4200) * env(n, 0.02, 0.8)
    put(s, sweep * 0.45, fr(690), pan=0.2)
    # --- mecha de la bomba y explosión
    put(s, hp(noise(fr(451) - fr(397)), 3000) * 0.06, fr(397), pan=0.3)
    put(s, (lp(noise(2.2), 300) * 1.4 + bp(noise(2.2), 300, 2000) * 0.6) * env(ns(2.2), 0.003, 0.9), fr(451), 0.9)
    put(s, bp(noise(0.25), 2000, 6000) * env(ns(0.25), 0.001, 0.1), fr(425), 0.35)  # el "clonc" del rebote
    put(s, tone(420, 0.25, (1, 0.7, 0.5), 0.001, 0.08), fr(425), 0.25)
    # gritos tras la explosión (multitud asustada)
    put(s, bp(noise(1.2), 500, 2500) * env(ns(1.2), 0.05, 0.6) * 0.25, fr(455))
    # --- dos estallidos secos (sin eco largo) en "Dos" y "disparos"
    for f0 in (831, 838):
        x = (bp(noise(0.35), 800, 5000) * 1.2 + lp(noise(0.35), 250) * 1.5) * env(ns(0.35), 0.0005, 0.12)
        put(s, x, fr(f0), 0.8)
    # --- palomas: aleteos
    for k in range(14):
        t0 = fr(840) + k * 0.06 + rng.uniform(0, 0.05)
        put(s, bp(noise(0.08), 400, 2500) * env(ns(0.08), 0.005, 0.05) * 0.25, t0, pan=rng.uniform(-0.6, 0.6))
    # --- marcha de los soldados: pasos a 2 por segundo
    t = fr(944)
    while t < fr(1023):
        put(s, lp(noise(0.12), 500) * env(ns(0.12), 0.002, 0.06) * 0.35, t)
        t += 0.5
    # --- fichas de dominó: un golpe de madera al chocar cada una
    for f0 in (1104, 1118, 1136, 1170, 1209, 1240):
        x = (tone(220, 0.3, (1, 0.4, 0.2), 0.001, 0.08) + bp(noise(0.3), 300, 1500) * 0.6) * env(ns(0.3), 0.001, 0.12)
        put(s, x, fr(f0 + 9), 0.6)
    put(s, lp(noise(1.2), 200) * env(ns(1.2), 0.002, 0.7) * 0.6, fr(1249))  # la última cae al suelo
    # --- whoosh en cada corte y movimiento grande de cámara (pico en el cuadro del corte)
    for f0 in (114, 202, 281, 344, 381, 418, 451, 480, 584, 648, 722, 802, 858, 944, 1023, 1267, 1329):
        n = ns(0.5)
        x = bp(noise(0.5), 500, 3000) * np.hanning(n)
        put(s, x * 0.12, fr(f0) - 0.25, pan=rng.uniform(-0.3, 0.3))
    # --- remate: "boing" seco cuando aparece el mapa
    t = np.arange(ns(0.5)) / SR
    boing = np.sin(2 * np.pi * np.cumsum(300 + 200 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 6)) / SR) * env(ns(0.5), 0.002, 0.3)
    put(s, boing, fr(1397), 0.2)
    return s


# ============================== mezcla ==============================
def read_voice():
    with wave.open(os.path.join(AQUI, "..", "voz", "voz.wav")) as w:
        sr, n = w.getframerate(), w.getnframes()
        x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64) / 32768
    if sr != SR:
        x = signal.resample_poly(x, SR, sr)
    v = np.zeros((2, N))
    m = min(N, len(x))
    v[:, :m] = x[:m]
    return v


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


def duck(words, depth_db=-3.0):
    """la música baja 3 dB mientras habla la voz (con rampas suaves)"""
    g = np.ones(N)
    for p in words:
        a, b = ns(p["a"] - 0.08), ns(p["b"] + 0.12)
        g[max(0, a):min(N, b)] = db(depth_db)
    return lp(g, 4, 1)


def write(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x.T * 32767).astype(np.int16).tobytes())


def main():
    words = json.load(open(os.path.join(AQUI, "..", "voz", "palabras.json")))["palabras"]
    v = read_voice()
    m = musica()
    s = efectos(words)
    vr = rms_db(v[:, v[0] != 0]) if np.any(v) else -20
    # música ~9 dB y efectos ~8 dB por debajo de la voz (medido en RMS sobre toda la pieza)
    m *= db(vr - 9 - rms_db(m[:, np.any(m != 0, axis=0)]))
    s *= db(vr - 8 - rms_db(s[:, np.any(s != 0, axis=0)]))
    m *= duck(words)
    mix = v + m + s
    mix *= 0.9 / max(1e-9, np.max(np.abs(mix)))
    write(os.path.join(AQUI, "musica.wav"), m * 0.5)
    write(os.path.join(AQUI, "efectos.wav"), s * 0.5)
    write(os.path.join(AQUI, "mezcla.wav"), mix)
    print(f"voz {vr:.1f} dB RMS · duración {N / SR:.2f} s · escrito mezcla.wav")


if __name__ == "__main__":
    main()
