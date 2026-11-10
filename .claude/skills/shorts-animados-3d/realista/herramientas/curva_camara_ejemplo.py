# Cámara del short de puntadas, cuadro por cuadro (30 fps), con el método de la skill de Mr omi
# (herramientas/camara_fase.py). Su short solo se ve 9 s en el tutorial (10:56–11:05) y ahí su zoom es el
# mismo que el de Zack (1.84 contra 1.89 al asentarse): lo copió. Por eso los 31 s salen del archivo de Zack
# (930 cuadros, igual que el nuestro). Diferencia: tras acercarse, la suya se queda quieta y la de Zack sigue
# derivando ~0.3-0.8 px/cuadro; Luis pidió que nunca pare, así que va la de Zack completa.
import json, os, numpy as np
AQ = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(f'{AQ}/fase_zack_completo.json'))['por_cuadro']
TOTAL = 930
zoom = [1.0]; dx = [0.0]; dy = [0.0]
for r in d:
    zoom.append(zoom[-1] * (1 + r['zoom'] / 100)); dx.append(r['dx']); dy.append(r['dy'])
zoom = zoom[:TOTAL]; dx = dx[:TOTAL]; dy = dy[:TOTAL]
while len(zoom) < TOTAL: zoom.append(zoom[-1]); dx.append(0.0); dy.append(0.0)
json.dump(dict(fuente='zack_stitches.mp4 medido con camara_fase.py; px de 720x1280', TOTAL=TOTAL,
               zoom=[None] + [round(z, 5) for z in zoom], dx_px720=[0.0] + [round(x, 3) for x in dx], dy_px720=[0.0] + [round(y, 3) for y in dy]),
          open(f'{AQ}/camara_zack.json', 'w'))
z = np.array(zoom)
print('pico %.2f en f=%d, final %.2f' % (z.max(), z.argmax() + 1, z[-1]))
