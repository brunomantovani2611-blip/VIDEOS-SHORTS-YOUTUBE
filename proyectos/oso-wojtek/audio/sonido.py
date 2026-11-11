"""Sonido del short del oso Wojtek: música original y efectos sintetizados (sin bibliotecas con licencia), colocados en su
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
TOTAL = 1280
N = int(round(TOTAL / FPS * SR))
rng = np.random.default_rng(1942)
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


def musica():
    m = np.zeros((2, N))
    marcha(m, 0.0, fr(547), 1.0)                                      # el ejército, Irán, Wojtek en el campamento
    marcha(m, fr(547), fr(640), 0.75, melody=False)                    # el barco
    triste(m, fr(640), fr(710), 0.9)                                   # no se admiten animales
    marcha(m, fr(712), fr(845), 1.0)                                   # ¡lo alistan!
    marcha(m, fr(845), fr(980), 0.8, melody=False, bpm=104)            # Montecassino: paso firme, sin melodía
    marcha(m, fr(980), fr(1075), 1.0, bpm=116)                         # el emblema
    tranquilo(m, fr(1075), fr(1206), 0.9)                              # el zoo
    marcha(m, fr(1206), fr(1262), 0.85)                                # las estatuas
    put(m, suave(pizz(NOTE(-12), 0.9)), fr(1262), 0.9)
    put(m, chord(0, "M", 0.9), fr(1262), 0.55)
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

    def boing(f0, g, dur=0.45):
        n = ns(dur); t = np.arange(n) / SR
        f = f0 * (1 + 0.6 * np.exp(-t * 8) * np.sin(2 * np.pi * 9 * t))
        return lp(np.sin(2 * np.pi * np.cumsum(f) / SR), 1800) * env(n, 0.002, dur * 0.6) * g

    def pop(g, f0=500):
        n = ns(0.12); t = np.arange(n) / SR
        return np.sin(2 * np.pi * np.cumsum(f0 + 900 * np.exp(-t * 40)) / SR) * env(n, 0.001, 0.04) * g

    put(s, boing(220, 0.35), fr(117))                                       # ¡era un oso!
    put(s, ding(880, 0.12, 0.6), fr(121))
    put(s, pop(0.25), fr(256))                                               # asoma el osezno
    for k, f0 in enumerate((303, 332, 346)):                                 # chocolate, lata, navaja
        put(s, ding(784 * 2 ** (k * 4 / 12), 0.18, 0.5), fr(f0))
    put(s, swish(0.35, 0.18, 400, 2000), fr(350))                            # el saco cambia de manos
    put(s, thud(0.25, 300, 0.15), fr(372))                                   # el cartel de madera
    n = ns(0.5); put(s, swish(0.5, 0.25, 300, 1800) * np.linspace(0.3, 1, n), fr(386))   # crece
    put(s, boing(150, 0.4, 0.5), fr(392))
    for k in range(4):                                                       # la lucha en broma
        put(s, thud(0.25, 110 + 20 * k), fr(420 + k * 9), pan=rng.uniform(-0.3, 0.3))
    for k in range(3):
        put(s, ding(1318 + 200 * k, 0.07, 0.4), fr(428) + k * 0.1, pan=0.2)
    put(s, bp(noise(fr(489 - 457)), 1500, 5000) * 0.05 * np.minimum(1, np.linspace(0, 6, ns(fr(489 - 457)))), fr(457))   # la ducha
    put(s, pop(0.3, 700), fr(520))                                           # la botella

    put(s, lp(tone(98, 1.6, (1, 0.6, 0.3), 0.15, 1.2) + tone(147, 1.6, (1, 0.4), 0.15, 1.2) * 0.6, 900), fr(562), 0.35)   # bocina del barco
    put(s, thud(0.3, 90), fr(650))                                           # el cartel
    put(s, swish(0.3, 0.15), fr(728))                                        # la hoja
    put(s, thud(0.55, 80, 0.35), fr(753))                                    # ¡sello!
    put(s, pop(0.3), fr(796))                                                # la gorra
    put(s, ding(988, 0.18, 0.6) + ding(1318, 0.08, 0.6), fr(825))            # las raciones
    t = fr(845)                                                              # pasos de Wojtek
    while t < fr(978):
        put(s, lp(thud(0.12, 70, 0.2), 400), t, pan=0.1)
        t += 0.42
    for f0 in (868, 921, 963):                                               # cañonazos lejanos, muy suaves
        put(s, lp(noise(1.2), 160) * env(ns(1.2), 0.01, 0.5) * 0.35, fr(f0))
    put(s, ding(784, 0.18) + ding(988, 0.12) + ding(1175, 0.08), fr(1034))   # el emblema
    for k in range(3):
        put(s, ding(1046 + 150 * k, 0.07, 0.5), fr(1188) + k * 0.15)         # corazones
    put(s, ding(784, 0.16, 0.7), fr(1229))                                   # Escocia
    put(s, ding(988, 0.16, 0.7), fr(1246))                                   # Polonia
    for f0 in (130, 283, 363, 418, 457, 489, 547, 640, 710, 845, 980, 1075, 1206):
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
