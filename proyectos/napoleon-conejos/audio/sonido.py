"""Sonido del short de Napoleón y los conejos: música original y efectos sintetizados (sin bibliotecas con licencia), colocados en su
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
TOTAL = 1036
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
    marcha(m, 0.0, fr(304), 0.95)                                      # la paz, la cacería, las jaulas
    sigilo(m, fr(304), fr(425), 0.9)                                   # se abren las jaulas... y vienen
    marcha(m, fr(425), fr(616), 0.75, drum=False)                      # conejos de granja, mansos
    sigilo(m, fr(616), fr(799), 0.95, bpm=144)                         # látigos, lo rodean, se le suben
    marcha(m, fr(799), fr(896), 0.9, bpm=140)                          # la huida al carruaje
    triste(m, fr(896), fr(950), 0.8)                                   # el terror de Europa...
    marcha(m, fr(950), fr(1010), 1.0)                                  # ...perdió contra los conejos
    put(m, suave(pizz(NOTE(-12), 0.9)), fr(1012), 0.9)
    put(m, chord(0, "M", 1.0), fr(1012), 0.5)
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

    def crack(g=0.12):
        return hp(noise(0.04), 1500) * env(ns(0.04), 0.0005, 0.012) * g

    def saltitos(f0, f1, step=2, g=0.03):
        f = f0
        while f < f1:
            put(s, thud(g, rng.uniform(260, 340), 0.06), fr(f), pan=rng.uniform(-0.4, 0.4))
            f += step * rng.uniform(0.7, 1.3)

    pasos(4, 60, 16, 0.05)
    put(s, thud(0.35, 90, 0.25), fr(70)); put(s, ding(784, 0.08, 0.5), fr(71))            # ¡paz!
    put(s, boing(0.16, 260), fr(110)); put(s, boing(0.12, 300), fr(131)); put(s, boing(0.12, 230), fr(137))
    put(s, ding(587, 0.08, 0.4), fr(129))
    put(s, pop(0.22), fr(181)); put(s, pop(0.18), fr(190))
    for f0 in (206, 209, 214, 218, 224, 228):                                  # caen las jaulas
        put(s, thud(0.3, 110, 0.2), fr(f0 + 7), pan=rng.uniform(-0.4, 0.4))
    put(s, pop(0.22), fr(280))
    for i in range(3):                                                         # se abren las puertas
        put(s, bp(noise(0.25), 400, 1400) * np.hanning(ns(0.25)) * 0.07, fr(318 + i * 2.5))
        put(s, thud(0.12, 160, 0.1), fr(325 + i * 2.5))
    saltitos(340, 356, 2, 0.03)
    put(s, ding(392, 0.05, 0.6), fr(360))
    saltitos(382, 425, 1.5, 0.035)
    put(s, ding(880, 0.08, 0.3), fr(396))
    put(s, pop(0.2), fr(430)); put(s, pop(0.2), fr(458)); put(s, pop(0.22), fr(490)); put(s, pop(0.22), fr(511))
    for k in range(4):
        put(s, ding(1568 + k * 120, 0.06, 0.4), fr(515 + k * 5 + 14))         # monedas
    put(s, thud(0.35, 90, 0.25), fr(550)); put(s, ding(784, 0.1) + ding(1046, 0.07), fr(551))
    put(s, pop(0.2), fr(587))
    for f0 in range(631, 680, 10):                                             # latigazos
        put(s, crack(0.13), fr(f0), pan=-0.3); put(s, crack(0.11), fr(f0 + 5), pan=0.3)
    saltitos(620, 680, 3, 0.025)
    saltitos(680, 745, 1.2, 0.03)
    put(s, ding(659, 0.07, 0.6), fr(736))
    for f0 in (757, 764, 776):
        put(s, bp(noise(0.3), 1500, 4000) * np.hanning(ns(0.3)) * 0.04, fr(f0))
    put(s, boing(0.12, 300), fr(780))
    pasos(800, 845, 5, 0.07)
    saltitos(805, 880, 2, 0.03)
    put(s, thud(0.3, 120, 0.2), fr(845))
    for i in range(12):
        put(s, boing(0.05, 280 + i * 8), fr(852 + i * 2.6))
    put(s, pop(0.2), fr(858))
    for f0 in (872, 878, 883):
        put(s, pop(0.15, 700), fr(f0))
    put(s, crack(0.12), fr(884))
    pasos(886, 900, 3, 0.06, 220)                                              # cascos
    put(s, motor(fr(884), 0.5, 0.0), fr(884))
    put(s, pop(0.22), fr(897)); put(s, pop(0.18), fr(902)); put(s, pop(0.18), fr(912)); put(s, pop(0.18), fr(915))
    put(s, thud(0.55, 60, 0.5), fr(916))                                       # temblar
    put(s, pop(0.2), fr(931))
    put(s, thud(0.4, 90, 0.3), fr(966)); put(s, ding(784, 0.12) + ding(1046, 0.08), fr(968)); put(s, ding(1318, 0.06), fr(968))
    for f0 in range(984, 1012, 3):
        put(s, boing(0.06, 240 + (f0 % 7) * 12), fr(f0), pan=rng.uniform(-0.4, 0.4))
    for f0 in (107, 149, 259, 304, 382, 425, 566, 616, 680, 755, 799, 896, 950):
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
