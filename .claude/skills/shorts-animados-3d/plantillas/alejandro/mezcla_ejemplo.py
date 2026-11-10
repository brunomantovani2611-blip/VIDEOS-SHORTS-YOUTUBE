# Mezcla voz + efectos (Epidemic) para el short v5 (sin recuadros en los ejércitos). Cada efecto se coloca para que su pico caiga en su cuadro.
import subprocess, numpy as np, sys
SR = 48000; L = 9.84
S = "efectos/"  # tu carpeta de efectos de sonido (con licencia para usarlos)
def load(p):
    b = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(b, np.float32).reshape(-1, 2).copy()
def db(x): return 10 ** (x / 20)
out = np.zeros((int(SR * L), 2), np.float32)
def put(p, t_peak, peak, gain, fade_in=0.0, fade_out=0.25, max_len=None):
    a = load(S + p)
    st = t_peak - peak
    if st < 0: a = a[int(-st * SR):]; st = 0
    if max_len: a = a[:int(max_len * SR)]
    n = min(len(a), len(out) - int(st * SR))
    a = a[:n] * db(gain)
    if fade_in: k = int(fade_in * SR); a[:k] *= np.linspace(0, 1, k)[:, None]
    k = min(n, int(fade_out * SR)); a[n - k:] *= np.linspace(1, 0, k)[:, None]
    out[int(st * SR):int(st * SR) + n] += a
F = lambda f: f / 30
def put_slow(p, rate, t_peak, peak, gain, max_len=None):
    """the sound slowed down (and pitched down) by `rate`, peak `peak` measured on the slowed sound"""
    a = load(S + p); n = int(len(a) / rate); x = np.arange(n) * rate
    a = np.stack([np.interp(x, np.arange(len(a)), a[:, c]) for c in (0, 1)], 1).astype(np.float32)
    st = t_peak - peak
    if st < 0: a = a[int(-st * SR):]; st = 0
    if max_len: a = a[:int(max_len * SR)]
    n = min(len(a), len(out) - int(st * SR)); a = a[:n] * db(gain)
    k = min(n, int(0.3 * SR)); a[n - k:] *= np.linspace(1, 0, k)[:, None]
    out[int(st * SR):int(st * SR) + n] += a
# fire crackle under the whole short (the world is burning): sparse pops of filtered noise + low roar
rng = np.random.default_rng(7); N = len(out); fire = np.zeros(N, np.float32)
for t0 in np.sort(rng.uniform(0, L, 260)):
    i = int(t0 * SR); m = int(SR * rng.uniform(0.004, 0.03)); m = min(m, N - i)
    burst = rng.normal(0, 1, m) * np.exp(-np.arange(m) / (m / 4)); fire[i:i + m] += burst * rng.uniform(0.2, 1.0)
fire = np.convolve(fire, np.ones(3) / 3, "same")
roar = np.convolve(rng.normal(0, 1, N), np.ones(300) / 300, "same") * 6
bed = (fire * 0.5 + roar * 0.5).astype(np.float32); bed /= np.abs(bed).max()
env = np.ones(N, np.float32); fo = int(0.5 * SR); env[:fo] = np.linspace(0, 1, fo); env[-fo:] = np.linspace(1, 0, fo)
out += (bed * env * db(-27))[:, None] * np.array([1.0, 0.92], np.float32)
put("24_suspenso/Designed_Drone_Swell_Trailer_Drone_Sub_01.wav", 0, 0, -20, fade_in=0.3, fade_out=0.6)                 # cama oscura
put("28_stinger_dramatico/Musical_Stinger_Impact_Horns_Dramatic.wav", F(1), 0.12, -13, fade_out=1.0, max_len=3.0)    # cuernos de guerra: Alejandro
put("03_whoosh_cinematico/Swooshes_Whoosh_Classic_Dark_Medium_Cinematic.wav", F(28), 1.15, -17, max_len=2.0)          # pasamos frente a Alejandro
put("03_whoosh_cinematico/Swooshes_Whoosh_Deep_Crisp_Cinematic_02.wav", F(61), 3.19, -16, max_len=3.6)                 # subimos: su ejército
put("08_pop_burbuja/Cartoon_Pop_Small_Lid.wav", F(72), 0.08, -11)                                                   # 47,000
put("03_whoosh_cinematico/Swooshes_Whoosh_Deep_Low_Cinematic.wav", F(105), 0.8, -15)                                   # cambio: Darío
put("03_whoosh_cinematico/Swooshes_Whoosh_Classic_Airy_Cinematic.wav", F(125), 1.2, -17, max_len=2.0)                 # pasamos frente a Darío
put("03_whoosh_cinematico/Swooshes_Whoosh_Deep_Crisp_Cinematic_01.wav", F(152), 2.38, -15, max_len=3.2)                # subimos: nunca termina
put("04_impacto_cinematico/Hit_Big_Powerful_Cinematic_Variations_02.wav", F(168), 0.38, -12, fade_out=1.0, max_len=2.0)  # 100,000
put("01_whoosh_transicion/Designed_Whoosh_Medium_Transition.wav", F(187), 0.87, -16)                                  # bajamos con los elefantes
put("04_impacto_cinematico/Designed_Impact_Cinematic_Hit_Thud_Dark_Scary.wav", F(204), 0.16, -16, max_len=1.6)       # elefantes
put("05_golpe_bajo/Designed_Bass_Dive_Bass_Drop_Deep_Slight_Pitch_Down.wav", F(237), 0.05, -14, fade_out=0.8, max_len=2.2)  # entra la cámara lenta
put_slow("03_whoosh_cinematico/Swooshes_Whoosh_Classic_Medium_Cinematic_01.wav", 0.5, F(252), 0.92 / 0.5, -15, max_len=2.6)  # carros de guerra, lento y grave
put("07_reverse/Designed_Riser_Sharp_Cymbal_Short.wav", F(266), 0.9, -21, fade_in=0.1)                                    # sale de la cámara lenta
put("28_stinger_dramatico/Musical_Stinger_Rise_To_Impact_Horns_Dramatic_Hit_02.wav", F(282), 1.8, -14, fade_in=0.4, fade_out=0.35)  # caballería, cierre
voz = load(sys.argv[1]); out[:len(voz)] += voz[:len(out)] * db(0)
# ducking simple: bajar efectos cuando habla queda implícito por niveles; limitar picos
pk = np.abs(out).max(); out *= min(1, db(-1) / pk)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-af", "loudnorm=I=-14:TP=-1.5:LRA=9", "-ar", "48000", sys.argv[2]], input=out.tobytes())
print("ok", sys.argv[2])
