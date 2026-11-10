"""Sonido del short de las pizzas de Bitcoin: música original y efectos sintetizados (sin bibliotecas con licencia), colocados en su
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
TOTAL = 1295
N = int(round(TOTAL / FPS * SR))
rng = np.random.default_rng(2010)
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


def suave(x):
    """pizzicato sin el ataque metálico: filtro paso bajo a 1.6 kHz y ataque de 8 ms"""
    y = lp(x, 1600)
    n = min(len(y), ns(0.008))
    y[:n] *= np.linspace(0, 1, n)
    return y


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
# Vals parisino original (motivo propio, no citado de ninguna obra), Fa mayor, 3/4 a 168 pulsos/min, con un timbre
# de acordeón suave (dos sierras desafinadas, filtradas) y un «um-pa-pa» de bajo y acorde. Siguiendo lo aprendido en
# Sarajevo: nada de notas agudas punzantes, percusión mínima y sin ruidos de fondo continuos bajo la voz.
BPM = 168
BEAT = 60 / BPM
F3 = 174.61
NOTE = lambda semis: F3 * 2 ** (semis / 12)


def reed(freq, dur, a=0.03, r=0.12):
    """acordeón: dos sierras desafinadas (musette) filtradas, ataque suave y caída corta"""
    n = ns(dur)
    t = np.arange(n) / SR
    x = sum(signal.sawtooth(2 * np.pi * freq * d * t) for d in (0.9965, 1.0035)) * 0.5
    x = lp(x, 2200, 2)
    e = np.minimum(1, t / a) * np.minimum(1, np.maximum(0, (dur - t) / r))
    return x * e


def chord(root, kind, dur):
    iv = {"M": (0, 4, 7), "7": (0, 4, 10), "m": (0, 3, 7)}[kind]
    return sum(reed(NOTE(root + 12 + i), dur, 0.01, 0.06) for i in iv) / 3


# 8 compases: [melodía (semitonos sobre Fa4, None = silencio) x 3 pulsos], acorde
MEL = [[12, 16, 19], [21, 19, 16], [17, 16, 14], [12, None, None], [14, 17, 21], [19, 17, 16], [14, 16, 17], [19, None, None],
       [12, 16, 19], [24, 21, 19], [17, 21, 17], [16, None, None], [14, 17, 16], [14, 12, 11], [12, 14, 16], [12, None, None]]
CHO = [(0, "M"), (0, "M"), (7, "7"), (0, "M"), (5, "M"), (0, "M"), (7, "7"), (7, "7"),
       (0, "M"), (5, "M"), (5, "M"), (0, "M"), (7, "7"), (7, "7"), (7, "7"), (0, "M")]


def vals(m, t0, t1, g=1.0, melody=True, bar0=0, tempo=1.0):
    beat = BEAT / tempo
    t, bar = t0, bar0
    while t + beat * 3 <= t1 + 1e-6:
        root, kind = CHO[bar % 16]
        put(m, pizz(NOTE(root - 12), 0.5), t, 0.75 * g, pan=-0.15)                       # um
        for k in (1, 2):
            put(m, chord(root, kind, beat * 0.55), t + k * beat, 0.32 * g, pan=0.15)     # pa-pa
        if melody:
            for k, s in enumerate(MEL[bar % 16]):
                if s is None:
                    continue
                dur = beat * (3 if k == 0 and MEL[bar % 16][1] is None else 1) * 0.95
                put(m, reed(NOTE(s), dur), t + k * beat, 0.30 * g, pan=0.1)
        t += beat * 3
        bar += 1
    return bar


def groove(m, t0, t1, g=1.0, bright=True, bpm=112):
    """ritmo actual y ligero: bajo pulsado a corcheas (Fa - Re m - Si b - Do), acordes cortos a contratiempo, sin agudos"""
    beat = 60 / bpm
    prog = [(0, "M"), (-3, "m"), (-7, "M"), (-5, "M")]
    t, k = t0, 0
    while t < t1:
        root, kind = prog[(k // 8) % 4]
        if k % 2 == 0 or k % 8 == 7:
            put(m, pizz(NOTE(root - 12), 0.28), t, 0.7 * g, pan=-0.1)
        if bright and k % 4 == 2:
            put(m, chord(root, kind, beat * 0.3), t, 0.28 * g, pan=0.15)
        if k % 4 == 0:
            put(m, lp(kick(0.25), 300), t, 0.12 * g)
        t += beat / 2
        k += 1


def musica():
    m = np.zeros((2, N))
    groove(m, 0.0, fr(488), 1.0)                                    # presentación y el mensaje del foro
    groove(m, fr(488), fr(544), 0.55, bright=False)                  # nadie le hace caso
    groove(m, fr(544), fr(870), 1.0)                                 # el trato y la cena
    # «y a subir… y a subir… y a subir»: tres escalones hacia arriba
    for k, (f0, s) in enumerate(((897, 0), (914, 4), (931, 7))):
        put(m, sum(reed(NOTE(s + i), 0.5, 0.01, 0.2) for i in (0, 4, 7)) / 3, fr(f0), 0.45 + 0.1 * k)
    groove(m, fr(870), fr(947), 0.6, bright=False, bpm=124)
    groove(m, fr(947), fr(1174), 1.0, bpm=118)                       # 2024 y la fiesta
    groove(m, fr(1174), fr(1268), 0.7)                               # Laszlo no se arrepiente
    put(m, pizz(NOTE(-12), 0.7), fr(1270), 0.9)
    put(m, chord(0, "M", 0.6), fr(1270), 0.6)
    return m


# ============================== efectos ==============================
def efectos(words):
    s = np.zeros((2, N))

    def thud(g, f0=120):
        x = (tone(f0, 0.3, (1, 0.5), 0.001, 0.08) + lp(noise(0.3), 600) * 0.8) * env(ns(0.3), 0.001, 0.08)
        return x * g

    def ding(freq, g, dur=1.0):
        return lp(tone(freq, dur, (1, 0.35, 0.12), 0.002, dur * 0.5), 3000) * g

    def swish(dur, g, lo=600, hi=2600):
        return bp(noise(dur), lo, hi) * np.hanning(ns(dur)) * g

    put(s, ding(880, 0.25) + ding(1320, 0.12), fr(46))                   # etiqueta del precio
    put(s, ding(1046, 0.2, 0.7) + ding(1568, 0.1, 0.7), fr(228))         # aparece el bitcoin
    t = fr(412)                                                          # teclado: tecleo suave
    while t < fr(476):
        put(s, bp(noise(0.02), 1500, 4000) * env(ns(0.02), 0.001, 0.01) * 0.12, t, pan=rng.uniform(-0.2, 0.2))
        t += rng.uniform(0.06, 0.12)
    t = fr(490)                                                          # tic-tac de la espera
    while t < fr(542):
        put(s, bp(noise(0.015), 2000, 5000) * 0.1, t)
        t += 0.5
    put(s, ding(784, 0.2) + ding(1175, 0.12), fr(617))                   # acepta
    for k in range(3):                                                   # tono de llamada
        put(s, lp(tone(440, 0.25, (1,), 0.01, 0.2) + tone(480, 0.25, (1,), 0.01, 0.2), 1500), fr(646) + k * 0.45, 0.08)
    put(s, ding(660, 0.25, 0.5), fr(700))
    put(s, ding(523, 0.25, 0.8), fr(700) + 0.35)          # timbre de la puerta
    put(s, swish(0.4, 0.2, 400, 2000), fr(733))                          # bocado
    for k in range(8):                                                   # monedas cayendo en el montón
        put(s, ding(1800 + 300 * (k % 3), 0.06, 0.25), fr(782) + k * 0.07, pan=rng.uniform(-0.4, 0.4))
    for k in range(12):                                                  # lluvia de monedas
        put(s, ding(1600 + 200 * (k % 4), 0.05, 0.25), fr(980 + k * 6) + 0.9, pan=rng.uniform(-0.5, 0.5))
    put(s, thud(0.5, 90), fr(1044))                                      # mil millones
    for k in range(6):                                                   # fiesta
        put(s, swish(0.15, 0.12, 2500, 6000), fr(1140) + k * 0.12, pan=rng.uniform(-0.6, 0.6))
    put(s, ding(784, 0.2) + ding(1175, 0.12), fr(1255))
    for f0 in (115, 254, 372, 488, 544, 687, 756, 870, 947, 1077, 1174):
        put(s, swish(0.5, 0.1, 500, 3000), fr(f0) - 0.25, pan=rng.uniform(-0.3, 0.3))
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
    m *= db(vr - 12 - rms_db(m))  # música ~12 dB por debajo de la voz (en Sarajevo, -9 dB resultó demasiado fuerte)
    s *= db(vr - 13 - rms_db(s))
    m *= duck(words)
    mix = v + m + s
    mix *= 0.9 / max(1e-9, np.max(np.abs(mix)))
    write(os.path.join(AQUI, "musica.wav"), m * 0.5)
    write(os.path.join(AQUI, "efectos.wav"), s * 0.5)
    write(os.path.join(AQUI, "mezcla.wav"), mix)
    bg = m + s
    print(f"voz {vr:.1f} dB RMS · fondo {rms_db(bg):.1f} dB RMS ({rms_db(bg) - vr:+.1f} dB) · {N / SR:.2f} s")


if __name__ == "__main__":
    main()
