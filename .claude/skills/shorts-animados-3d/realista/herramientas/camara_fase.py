"""Mide la cámara como dice la skill de Mr omi (claude-animated-shorts/references/reports/motion.md, «cam2.py»):
cada cuadro contra el anterior, ajuste de similitud (traslación, zoom, giro) con correlación de fase sub-pixel
en 9 bloques a 360x640; bandas de alto 3-29 %, 29-56 % y 80-97 %; bloques raros se descartan.
Se integra el camino, se suaviza con gaussiana sigma = 1.2 cuadros.
Velocidad = traslación + |zoom| x 734 px (radio de la esquina), en px de 720x1280.
Clases: quieta < 0.3 px/f, deriva < 2, movimiento >= 2.
Uso: python3 camara_fase.py <carpeta con cuadros o video> <salida.json> [primero último]
"""
import cv2, numpy as np, sys, json, glob, os, subprocess

W, H = 360, 640
BANDAS = [(0.03, 0.29), (0.29, 0.56), (0.80, 0.97)]
COLS = [(0.0, 1/3), (1/3, 2/3), (2/3, 1.0)]

def leer(fuente, a=None, b=None):
    if os.path.isdir(fuente):
        fs = sorted(glob.glob(fuente + '/*.png') + glob.glob(fuente + '/*.jpg'))
        if a: fs = fs[a-1:b]
        for fn in fs:
            yield cv2.cvtColor(cv2.resize(cv2.imread(fn), (W, H), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
    else:
        p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', fuente, '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], stdout=subprocess.PIPE)
        while True:
            x = p.stdout.read(W*H)
            if len(x) < W*H: break
            yield np.frombuffer(x, np.uint8).reshape(H, W)

def bloques():
    for y0, y1 in BANDAS:
        for x0, x1 in COLS:
            yield int(x0*W), int(x1*W), int(y0*H), int(y1*H)

def ajuste(a, b):
    pts, dsp, pes = [], [], []
    for x0, x1, y0, y1 in bloques():
        ta = a[y0:y1, x0:x1].astype(np.float32); tb = b[y0:y1, x0:x1].astype(np.float32)
        if ta.std() < 2.0: continue                     # bloque liso (cielo azul): no dice nada
        win = cv2.createHanningWindow(ta.shape[::-1], cv2.CV_32F)
        (dx, dy), resp = cv2.phaseCorrelate(ta, tb, win)
        if resp < 0.05: continue
        pts.append(((x0+x1)/2 - W/2, (y0+y1)/2 - H/2)); dsp.append((dx, dy)); pes.append(resp)
    if len(pts) < 3: return None
    P = np.array(pts); D = np.array(dsp); w = np.array(pes)
    usar = np.ones(len(P), bool)
    for _ in range(2):
        # p' = p + d = s R p + t  ->  d = (k p + r p_perp) + t,  k = s cos - 1, r = s sin
        A = []; y = []
        for (px, py), (dx, dy), u in zip(P[usar], D[usar], w[usar]):
            A.append([px*u, -py*u, u, 0]); y.append(dx*u)
            A.append([py*u,  px*u, 0, u]); y.append(dy*u)
        k, r, tx, ty = np.linalg.lstsq(np.array(A), np.array(y), rcond=None)[0]
        pred = np.stack([k*P[:,0] - r*P[:,1] + tx, k*P[:,1] + r*P[:,0] + ty], 1)
        err = np.linalg.norm(pred - D, axis=1)
        nuevo = err < max(1.0, 2.5*np.median(err[usar]))
        if nuevo.sum() < 3 or (nuevo == usar).all(): break
        usar = nuevo
    s = np.hypot(1+k, r); giro = np.degrees(np.arctan2(r, 1+k))
    return float(tx*2), float(ty*2), float(s - 1), float(giro), int(usar.sum())   # px de 720x1280

def main():
    fuente, salida = sys.argv[1], sys.argv[2]
    a = int(sys.argv[3]) if len(sys.argv) > 3 else None; b = int(sys.argv[4]) if len(sys.argv) > 4 else None
    prev = None; filas = []
    for g in leer(fuente, a, b):
        if prev is not None:
            r = ajuste(prev, g)
            filas.append(r if r else (0.0, 0.0, 0.0, 0.0, 0))
        prev = g
    M = np.array([f[:4] for f in filas])
    # camino integrado y suavizado (sigma 1.2 cuadros), luego de vuelta a pasos
    cam = np.cumsum(M, 0)
    k = np.exp(-0.5*(np.arange(-4, 5)/1.2)**2); k /= k.sum()
    pad = np.pad(cam, ((4, 4), (0, 0)), mode='edge')
    suave = np.stack([np.convolve(pad[:, j], k, mode='valid') for j in range(4)], 1)
    paso = np.diff(np.vstack([suave[:1], suave]), axis=0)
    vel = np.hypot(paso[:, 0], paso[:, 1]) + np.abs(paso[:, 2]) * 734
    clase = np.where(vel < 0.3, 'quieta', np.where(vel < 2, 'deriva', 'mueve'))
    n = len(vel)
    res = dict(cuadros=n + 1,
               quieta=round(float(100*np.mean(clase == 'quieta')), 1), deriva=round(float(100*np.mean(clase == 'deriva')), 1),
               mueve=round(float(100*np.mean(clase == 'mueve')), 1),
               vel_mediana=round(float(np.median(vel)), 2), vel_p90=round(float(np.percentile(vel, 90)), 2),
               tramo_quieto_mas_largo=int(max((len(x) for x in ''.join('q' if c == 'quieta' else '.' for c in clase).split('.')), default=0)),
               por_cuadro=[dict(f=i+2, dx=round(float(paso[i,0]),3), dy=round(float(paso[i,1]),3), zoom=round(float(paso[i,2])*100,4),
                                giro=round(float(paso[i,3]),4), vel=round(float(vel[i]),3), clase=str(clase[i]), bloques=filas[i][4]) for i in range(n)])
    json.dump(res, open(salida, 'w'), indent=0)
    print({k_: v for k_, v in res.items() if k_ != 'por_cuadro'})

if __name__ == '__main__':
    main()
