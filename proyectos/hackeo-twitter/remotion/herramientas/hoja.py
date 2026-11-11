# Une fotos en una hoja: python herramientas/hoja.py salida.jpg a.jpg b.jpg ...  (máx. 3 por fila, a media escala)
import sys
from PIL import Image
out, files = sys.argv[1], sys.argv[2:]
ims = [Image.open(f) for f in files]
w, h = ims[0].size
s = 0.75
W, H = int(w * s), int(h * s)
cols = min(3, len(ims)); rows = (len(ims) + cols - 1) // cols
c = Image.new("RGB", (cols * W + (cols - 1) * 8, rows * H + (rows - 1) * 8), "white")
for i, im in enumerate(ims):
    c.paste(im.resize((W, H)), ((i % cols) * (W + 8), (i // cols) * (H + 8)))
c.save(out, quality=82)
