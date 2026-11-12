"""Sonido del short de la guerra de los 38 minutos (Zanzíbar, 1896): música original y efectos sintetizados (sin bibliotecas con licencia), colocados en su
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
TOTAL = 1000
N = int(round(TOTAL / FPS * SR))
rng = np.random.default_rng(1912)
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
# Marcha alegre original (motivo propio), Sol mayor, 2/4 a 116 pulsos/min: bajo «um» pulsado, acorde «pa» a contratiempo
# con timbre de acordeón suave, melodía de acordeón sin agudos punzantes. Percusión mínima, nada de ruido de fondo.
BPM = 116
BEAT = 60 / BPM
G3 = 196.0
NOTE = lambda semis: G3 * 2 ** (semis / 12)


def reed(freq, dur, a=0.03, r=0.12):
    """acordeón: dos sierras desafinadas (musette) filtradas, ataque suave y caída corta"""
    n = ns(dur)
    t = np.arange(n) / SR
    x = sum(signal.sawtooth(2 * np.pi * freq * d * t) for d in (0.9965, 1.0035)) * 0.5
    x = lp(x, 2000, 2)
    e = np.minimum(1, t / a) * np.minimum(1, np.maximum(0, (dur - t) / r))
    return x * e


def chord(root, kind, dur, octave=12):
    iv = {"M": (0, 4, 7), "7": (0, 4, 10), "m": (0, 3, 7)}[kind]
    return sum(reed(NOTE(root + octave + i), dur, 0.01, 0.06) for i in iv) / 3


# 8 compases de 2/4: melodía en corcheas (semitonos sobre Sol4, None = silencio) y acorde
MEL = [[7, 4, 0, 4], [7, None, 12, None], [11, 9, 7, 9], [11, None, None, None],
       [9, 7, 5, 7], [9, None, 14, None], [12, 11, 9, 11], [7, None, None, None]]
CHO = [(0, "M"), (0, "M"), (7, "7"), (7, "7"), (7, "7"), (7, "7"), (0, "M"), (0, "M")]


def marcha(m, t0, t1, g=1.0, melody=True, bpm=BPM, drum=True):
    beat = 60 / bpm
    t, bar = t0, 0
    while t + beat * 2 <= t1 + 1e-6:
        root, kind = CHO[bar % 8]
        put(m, suave(pizz(NOTE(root - 12), 0.4)), t, 0.8 * g, pan=-0.15)                 # um
        put(m, suave(pizz(NOTE(root - 5), 0.4)), t + beat, 0.7 * g, pan=-0.15)           # um (quinta)
        for k in (0.5, 1.5):
            put(m, chord(root, kind, beat * 0.3), t + k * beat, 0.3 * g, pan=0.15)      # pa
        if drum:
            put(m, lp(kick(0.25), 300), t, 0.12 * g)
        if melody:
            for k, s in enumerate(MEL[bar % 8]):
                if s is None:
                    continue
                long_ = k + 1 < 4 and MEL[bar % 8][k + 1] is None
                dur = beat * 0.5 * (2 if long_ else 1) * 0.95
                put(m, reed(NOTE(s + 12), dur), t + k * beat * 0.5, 0.26 * g, pan=0.1)
        t += beat * 2
        bar += 1


def triste(m, t0, t1, g=1.0):
    """el «no se admiten animales»: acordes menores lentos y una línea que baja"""
    beat = 60 / 70
    for k, (root, kind) in enumerate([(9, "m"), (5, "M"), (2, "m"), (7, "7")]):
        t = t0 + k * beat * 2
        if t >= t1:
            break
        put(m, chord(root, kind, beat * 2, 0), t, 0.35 * g)
        put(m, suave(pizz(NOTE(root - 12), 0.8)), t, 0.6 * g)
    for k, s in enumerate((16, 14, 12, 11)):
        put(m, reed(NOTE(s), beat * 0.9, 0.05, 0.3), t0 + k * beat, 0.2 * g)


def tranquilo(m, t0, t1, g=1.0):
    """el zoo: acordes largos y cálidos, bajo suave a negras, sin melodía"""
    beat = 60 / 96
    prog = [(0, "M"), (5, "M"), (9, "m"), (7, "M")]
    t, k = t0, 0
    while t < t1:
        root, kind = prog[(k // 4) % 4]
        if k % 4 == 0:
            put(m, chord(root, kind, beat * 4, 0) , t, 0.3 * g)
        put(m, suave(pizz(NOTE(root - 12 + (7 if k % 2 else 0)), 0.5)), t, 0.6 * g)
        t += beat
        k += 1


def sigilo(m, t0, t1, g=1.0, bpm=126):
    """paso de puntillas: bajo pulsado en Mi menor a corcheas que sube y baja, acordes cortos y apagados a contratiempo"""
    beat = 60 / bpm
    walk = [-8, -5, -1, -5, -8, -3, -1, -3]
    prog = [(-8, "m"), (-8, "m"), (-3, "m"), (-1, "7")]
    t, k = t0, 0
    while t < t1:
        root, kind = prog[(k // 8) % 4]
        put(m, suave(pizz(NOTE(root - 12 + walk[k % 8] - walk[0]), 0.3)), t, 0.75 * g, pan=-0.1)
        if k % 4 == 2:
            put(m, chord(root, kind, beat * 0.25, 12), t, 0.22 * g, pan=0.15)
        t += beat / 2
        k += 1


def nocturno(m, t0, t1, g=1.0):
    """la noche: acordes largos graves y un pulso lento"""
    beat = 60 / 80
    t, k = t0, 0
    while t < t1:
        root = [-8, -3][(k // 4) % 2]
        if k % 4 == 0:
            put(m, chord(root, "m", beat * 4, 0), t, 0.3 * g)
        put(m, suave(pizz(NOTE(root - 12), 0.6)), t, 0.55 * g)
        t += beat
        k += 1


def musica():
    m = np.zeros((2, N))
    marcha(m, 0.0, fr(122), 0.85, bpm=120)                             # la costa: la guerra más corta
    triste(m, fr(122), fr(163), 0.7)                                   # murió el sultán
    sigilo(m, fr(163), fr(354), 0.95, bpm=126)                         # Khalid se sienta; sin permiso; ultimátum
    nocturno(m, fr(354), fr(411), 0.8)                                 # el reloj avanza
    marcha(m, fr(411), fr(521), 0.8, bpm=126, melody=False)            # tres mil hombres, cañones, un solo barco
    sigilo(m, fr(558), fr(759), 1.0, bpm=150)                          # fuego, el barco, el palacio, la huida
    marcha(m, fr(759), fr(839), 0.9, bpm=132)                          # 38 minutos: fin
    sigilo(m, fr(839), fr(962), 0.85, bpm=120)                         # la cuenta
    put(m, suave(pizz(NOTE(-12), 0.9)), fr(966), 0.9)
    put(m, chord(0, "M", 1.0), fr(966), 0.5)
    return m


# ============================== efectos ==============================
def efectos(words):
    s = np.zeros((2, N))

    def thud(g, f0=120, dur=0.3):
        x = (tone(f0, dur, (1, 0.5), 0.001, 0.08) + lp(noise(dur), 600) * 0.8) * env(ns(dur), 0.001, 0.08)
        return x * g

    def ding(freq, g, dur=1.0):
        return lp(tone(freq, dur, (1, 0.35, 0.12), 0.002, dur * 0.5), 3000) * g

    def swish(dur, g, lo=600, hi=2600):
        return bp(noise(dur), lo, hi) * np.hanning(ns(dur)) * g

    def pop(g, f0=500):
        n = ns(0.12); t = np.arange(n) / SR
        return np.sin(2 * np.pi * np.cumsum(f0 + 900 * np.exp(-t * 40)) / SR) * env(n, 0.001, 0.04) * g

    def silbido(dur, g=0.035):
        # el tono del silbato, suave y corto (sin agudos punzantes: poco volumen y entrada/salida lentas)
        n = ns(dur); t = np.arange(n) / SR
        x = np.sin(2 * np.pi * 2600 * t + 0.3 * np.sin(2 * np.pi * 5 * t)) * env(n, 0.06, 0.12)
        return x * g

    def typing(t0, t1, g=0.1):
        t = t0
        while t < t1:
            put(s, bp(noise(0.02), 1200, 3500) * env(ns(0.02), 0.001, 0.01) * g, t, pan=rng.uniform(-0.2, 0.2))
            t += rng.uniform(0.07, 0.13)

    def tonos(t0, n=6, g=0.05):
        for k in range(n):
            put(s, lp(tone([700, 900, 1100, 1300, 1500, 1700][k % 6], 0.09, (1,), 0.005, 0.05), 2000) * g, t0 + k * 0.12)

    def ring(t0, g=0.06):
        for k in range(2):
            put(s, lp(tone(440, 0.35, (1, 0.3), 0.01, 0.1) + tone(480, 0.35, (1,), 0.01, 0.1), 1500) * g, t0 + k * 0.5)

    def bang(g):
        x = lp(noise(0.09), 2500) * env(ns(0.09), 0.0005, 0.05) + tone(70, 0.09, (1, 0.5), 0.0005, 0.05) * 0.8
        return x * g

    def rafaga(f0, f1, g=0.16):
        f = f0
        while f < f1:
            put(s, bang(g * rng.uniform(0.85, 1.1)), fr(f), pan=rng.uniform(-0.1, 0.1))
            f += 3

    def pasos(f0, f1, step, g=0.08, f0hz=150):
        f = f0
        while f < f1:
            put(s, thud(g, f0hz, 0.08), fr(f), pan=rng.uniform(-0.2, 0.2))
            f += step

    def motor(t0, dur, g=0.06):
        n = ns(dur); t = np.arange(n) / SR
        x = np.sign(np.sin(2 * np.pi * (48 + 4 * np.sin(2 * np.pi * 3 * t)) * t)) * 0.5 + lp(noise(dur), 300)
        return lp(x, 400) * env(n, 0.3, 0.4) * g

    def boing(g, f0=220):
        n = ns(0.35); t = np.arange(n) / SR
        return np.sin(2 * np.pi * np.cumsum(f0 + 260 * np.exp(-t * 9) * np.sin(2 * np.pi * 14 * t)) / SR) * env(n, 0.002, 0.2) * g

    def boom(g=0.5, dur=1.6):
        n = ns(dur)
        x = lp(noise(dur), 220) * 1.4 + tone(48, dur, (1, 0.6), 0.002, dur * 0.5) * 0.6
        return x * env(n, 0.003, dur * 0.45) * g

    def chapuzon(g=0.2, dur=1.2):
        return bp(noise(dur), 300, 2500) * env(ns(dur), 0.02, dur * 0.5) * g

    def gemido(g=0.12, dur=2.5):
        n = ns(dur); t = np.arange(n) / SR
        x = np.sin(2 * np.pi * np.cumsum(70 - 25 * t / dur + 4 * np.sin(2 * np.pi * 0.7 * t)) / SR)
        return lp(x + lp(noise(dur), 150) * 0.5, 300) * env(n, 0.4, dur * 0.6) * g

    def miau(g=0.12, dur=0.55):
        n = ns(dur); t = np.arange(n) / SR; u = t / dur
        f0 = 520 + 380 * np.sin(np.pi * np.minimum(1, u * 1.3)) - 120 * u
        x = signal.sawtooth(2 * np.pi * np.cumsum(f0) / SR)
        x = bp(x, 700, 2600) * 0.7 + bp(x, 2600, 3800) * 0.3
        return x * np.minimum(1, t / 0.04) * np.minimum(1, (dur - t) / 0.15) * g

    def ronroneo(dur, g=0.05):
        n = ns(dur); t = np.arange(n) / SR
        return lp(noise(dur), 300) * (0.5 + 0.5 * np.sin(2 * np.pi * 24 * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * t)) * env(n, 0.3, dur) * g

    def olas(t0, dur, g=0.03):
        n = ns(dur); t = np.arange(n) / SR
        x = lp(noise(dur), 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * t)) * np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.4)
        put(s, x * g, t0)

    def tic(g=0.05, hi=True):
        return bp(noise(0.03), 2500 if hi else 1500, 5000 if hi else 3200) * env(ns(0.03), 0.0005, 0.012) * g

    def campana(g=0.12, f0=330, dur=2.5):
        n = ns(dur); t = np.arange(n) / SR
        x = sum(h * np.sin(2 * np.pi * f0 * k * t) * np.exp(-t * (1.2 + k * 0.7)) for k, h in ((1, 1), (2.01, 0.5), (2.76, 0.35), (4.07, 0.2)))
        return lp(x, 3000) * np.minimum(1, t / 0.003) * g

    def cascote(g=0.1):
        return lp(noise(0.5), 1800) * env(ns(0.5), 0.002, 0.18) * g

    def fuego_crep(t0, dur, g=0.02):
        t = t0
        while t < t0 + dur:
            put(s, bp(noise(0.015), 1500, 5000) * env(ns(0.015), 0.0005, 0.006) * g * rng.uniform(0.4, 1.2), t, pan=rng.uniform(-0.4, 0.4))
            t += rng.uniform(0.02, 0.09)
        n = ns(dur); tt = np.arange(n) / SR
        put(s, lp(noise(dur), 400) * np.minimum(1, tt / 0.5) * np.minimum(1, (dur - tt) / 0.4) * g * 1.4, t0)

    def gaviota(t0, g=0.03):
        for k in range(2):
            n = ns(0.28); tt = np.arange(n) / SR
            f = 1600 - 700 * tt / 0.28
            put(s, bp(np.sin(2 * np.pi * np.cumsum(f) / SR), 900, 2400) * env(n, 0.03, 0.15) * g, t0 + k * 0.35, pan=0.4)

    # la costa
    olas(0, fr(163), 0.03)
    gaviota(fr(20)); gaviota(fr(70), 0.025)
    put(s, pop(0.22), fr(84)); put(s, ding(784, 0.08) + ding(1046, 0.05), fr(86))
    # murió el sultán: la bandera baja
    put(s, campana(0.07, 196, 3.0), fr(139))
    put(s, pop(0.18), fr(142))
    # el salón del trono
    pasos(167, 197, 8, 0.06, 180)
    put(s, pop(0.2), fr(176))
    put(s, thud(0.12, 110, 0.15), fr(210))
    put(s, thud(0.3, 90, 0.25), fr(229)); put(s, ding(784, 0.1) + ding(1046, 0.07), fr(230))
    # sin permiso, el ultimátum
    put(s, pop(0.2), fr(254)); put(s, pop(0.2), fr(258))
    put(s, thud(0.35, 90, 0.25), fr(268)); put(s, ding(392, 0.08), fr(269))
    put(s, swish(0.4, 0.08, 400, 2000), fr(330)); put(s, thud(0.25, 120, 0.2), fr(335))
    # el reloj: tic tac cada vez más rápido
    f = 356.0
    while f < 411:
        put(s, tic(0.07, int(f) % 2 == 0), fr(f))
        f += max(4.0, 15 - (f - 356) * 0.2)
    # el ejército y los cañones
    olas(fr(411), fr(558 - 411), 0.025)
    pasos(413, 455, 7, 0.07, 140)
    for f0 in range(430, 450, 3):
        put(s, ding(1100, 0.025, 0.08), fr(f0))
    put(s, pop(0.18), fr(465))
    put(s, thud(0.12, 160, 0.2), fr(476)); put(s, lp(noise(0.4), 900) * env(ns(0.4), 0.01, 0.15) * 0.08, fr(477))
    put(s, boing(0.07, 160), fr(479)); put(s, thud(0.08, 220, 0.08), fr(492))
    put(s, ding(587, 0.06, 0.4), fr(487))
    gaviota(fr(500), 0.03)
    # las nueve y dos
    for f0 in (521, 528):
        put(s, tic(0.07), fr(f0))
    put(s, campana(0.22, 262, 3.2), fr(536)); put(s, campana(0.16, 262, 2.5), fr(548))
    # cinco buques abren fuego
    for k in range(5):
        for f0 in (589 + (k % 2) * 4, 599 + ((k + 1) % 2) * 4):
            put(s, boom(0.4, 1.2), fr(f0 + k * 0.6), pan=-0.6 + k * 0.3)
    # el Glasgow
    for f0, w in ((616, True), (626, False), (634, True), (641, False), (648, True)):
        put(s, boom(0.45, 1.3), fr(f0)); put(s, chapuzon(0.14 if w else 0.06), fr(f0 + 2))
    put(s, gemido(0.14, 2.0), fr(628))
    # el palacio arde
    for f0 in (659, 664, 670, 676, 680, 686):
        put(s, boom(0.5, 1.4), fr(f0)); put(s, cascote(0.08), fr(f0 + 4))
    put(s, swish(0.6, 0.08, 300, 1500), fr(681)); put(s, thud(0.25, 80, 0.4), fr(692))
    fuego_crep(fr(662), fr(759 - 662), 0.025)
    # la huida
    pasos(699, 757, 5, 0.07, 200)
    for f0 in (702, 722, 741):
        put(s, boom(0.3, 1.0), fr(f0)); put(s, cascote(0.06), fr(f0 + 3))
    put(s, pop(0.18), fr(708)); put(s, pop(0.15), fr(730))
    # 38 minutos
    for f0 in range(762, 788, 2):
        put(s, tic(0.05), fr(f0))
    put(s, ding(1046, 0.1, 0.6), fr(788))
    put(s, thud(0.3, 90, 0.3), fr(819)); put(s, ding(784, 0.12) + ding(1046, 0.08), fr(820)); put(s, ding(1318, 0.06), fr(822))
    # la cuenta
    fuego_crep(fr(839), fr(1000 - 839), 0.015)
    put(s, pop(0.18), fr(841))
    put(s, bp(noise(0.9), 800, 4000) * np.linspace(1, 0.3, ns(0.9)) * 0.05, fr(902))
    put(s, thud(0.3, 90, 0.25), fr(936)); put(s, boing(0.08, 200), fr(937)); put(s, pop(0.18), fr(938))
    for f0 in (122, 163, 252, 307, 354, 411, 460, 493, 521, 558, 614, 655, 695, 759, 839):
        put(s, swish(0.5, 0.08, 500, 3000), fr(f0) - 0.25, pan=rng.uniform(-0.3, 0.3))
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
    m *= db(vr - 26 - rms_db(m))  # música ~26 dB por debajo de la voz (pedido: bajarla mucho; antes -18 y -12)
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
