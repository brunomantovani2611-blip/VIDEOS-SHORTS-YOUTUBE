"""Agrega al final de un short una tarjeta animada de "SUSCRIBITE" (YouTube Shorts).

Uso:
    python outro.py video_final.mp4
    python outro.py video_final.mp4 --frase "Suscribite para la parte 2" --usuario "SHORTS ANIMADOS"

Congela el ultimo cuadro del video, lo desenfoca y oscurece, y encima anima la frase,
un boton rojo de SUSCRIBITE y una campanita. El resultado se guarda junto al video
original como <nombre>_con_outro.mp4. Requiere ffmpeg (en el PATH o el de CapCut) y Pillow.
"""
import argparse
import glob
import math
import os
import shutil
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1080, 1920, 30
FRASE_DEFECTO = "Suscribite para más historias"
USUARIO_DEFECTO = "SHORTS ANIMADOS"
FUENTE = r"C:\Windows\Fonts\impact.ttf"
ROJO = (230, 33, 23, 255)
AMARILLO = (255, 221, 0, 255)


def buscar_ffmpeg():
    """Devuelve la ruta de ffmpeg: variable OUTRO_FFMPEG, PATH o el que trae CapCut."""
    candidatos = [os.environ.get("OUTRO_FFMPEG"), shutil.which("ffmpeg")]
    candidatos += sorted(glob.glob(os.path.expandvars(r"%LOCALAPPDATA%\CapCut\Apps\*\ffmpeg.exe")), reverse=True)
    for c in candidatos:
        if c and os.path.exists(c):
            return c
    sys.exit("No encuentro ffmpeg. Instalalo o defini la variable OUTRO_FFMPEG con su ruta.")


def correr(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"ffmpeg fallo:\n{r.stderr[-800:]}")
    return r


def ease_out_back(t):
    """Rebote suave con sobrepaso, t entre 0 y 1."""
    c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2


def progreso(t, inicio, fin):
    return min(1.0, max(0.0, (t - inicio) / (fin - inicio)))


def texto_centrado(img, texto, y, tam, color, stroke=8):
    """Escribe el texto centrado horizontalmente respecto del ancho de `img`."""
    fuente = ImageFont.truetype(FUENTE, tam)
    d = ImageDraw.Draw(img)
    d.text((img.width / 2, y), texto, font=fuente, fill=color, anchor="mm",
           stroke_width=stroke, stroke_fill=(0, 0, 0, 255))


def partir_frase(frase, maximo=18):
    """Parte la frase en lineas de hasta `maximo` letras."""
    lineas, actual = [], ""
    for palabra in frase.split():
        if actual and len(actual) + 1 + len(palabra) > maximo:
            lineas.append(actual)
            actual = palabra
        else:
            actual = f"{actual} {palabra}".strip()
    if actual:
        lineas.append(actual)
    return lineas


def dibujar_campana(tam):
    """Campanita blanca con borde negro, devuelve una imagen RGBA cuadrada."""
    s = tam * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = s / 2
    d.ellipse([cx - s * .06, s * .02, cx + s * .06, s * .14], fill="white", outline="black", width=int(s * .02))
    d.pieslice([cx - s * .30, s * .10, cx + s * .30, s * .70], 180, 360, fill="white", outline="black", width=int(s * .03))
    d.polygon([(cx - s * .30, s * .40), (cx + s * .30, s * .40), (cx + s * .40, s * .74), (cx - s * .40, s * .74)],
              fill="white", outline="black")
    d.rectangle([cx - s * .42, s * .72, cx + s * .42, s * .79], fill="white", outline="black", width=int(s * .02))
    d.ellipse([cx - s * .09, s * .78, cx + s * .09, s * .94], fill=(255, 190, 0, 255), outline="black", width=int(s * .02))
    return img.resize((tam, tam), Image.LANCZOS)


def construir_fondo(ultimo):
    """Devuelve el ultimo cuadro original y su version desenfocada y oscurecida, a 1080x1920."""
    base = Image.open(ultimo).convert("RGB").resize((W, H), Image.LANCZOS)
    desenfocado = base.filter(ImageFilter.GaussianBlur(22))
    oscuro = Image.new("RGB", (W, H), (0, 0, 0))
    return base, Image.blend(desenfocado, oscuro, 0.5)


def cuadro(t, original, fondo, campana, frase_lineas, usuario):
    """Dibuja el cuadro del outro en el segundo t."""
    # fundido del cuadro original al fondo oscuro
    img = Image.blend(original, fondo, progreso(t, 0.0, 0.35)).convert("RGBA")

    # frase: aparece subiendo y con fundido
    p = progreso(t, 0.25, 0.7)
    capa = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    base_y = 560 + (1 - p) * 40
    for i, linea in enumerate(frase_lineas):
        texto_centrado(capa, linea.upper(), base_y + i * 105, 96, (255, 255, 255, 255))
    capa.putalpha(capa.getchannel("A").point(lambda a: int(a * p)))
    img = Image.alpha_composite(img, capa)

    # boton rojo con rebote y luego pulso
    pb = progreso(t, 0.6, 1.1)
    escala = ease_out_back(pb) if pb < 1 else 1 + 0.035 * math.sin((t - 1.1) * 6)
    bw, bh = int(700 * max(escala, 0.01)), int(190 * max(escala, 0.01))
    if pb > 0:
        boton = Image.new("RGBA", (700, 190), (0, 0, 0, 0))
        db = ImageDraw.Draw(boton)
        db.rounded_rectangle([0, 0, 699, 189], radius=95, fill=ROJO, outline=(0, 0, 0, 255), width=8)
        texto_centrado(boton, "SUSCRIBITE", 95, 100, (255, 255, 255, 255), stroke=6)
        boton = boton.resize((bw, bh), Image.LANCZOS)
        img.alpha_composite(boton, (int(W / 2 - bw / 2), int(1040 - bh / 2)))

    # campanita que suena desde 1.0 s
    if t > 1.0:
        ang = 22 * math.sin((t - 1.0) * 22) * (1 - progreso(t, 1.0, 2.4))
        giro = campana.rotate(ang, resample=Image.BICUBIC, center=(campana.width // 2, 10))
        img.alpha_composite(giro, (int(W / 2 - giro.width / 2), 1180))

    # nombre del canal
    pu = progreso(t, 1.2, 1.7)
    capa2 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    texto_centrado(capa2, usuario.upper(), 1520, 78, AMARILLO)
    capa2.putalpha(capa2.getchannel("A").point(lambda a: int(a * pu)))
    return Image.alpha_composite(img, capa2).convert("RGB")


def codificar(ff, args_antes, args_despues):
    """Prueba h264_nvenc y, si falla, libx264. Devuelve el resultado del que funcione."""
    ultimo = None
    for codec in ("h264_nvenc", "libx264"):
        r = subprocess.run([ff, "-y", "-loglevel", "error", *args_antes, "-c:v", codec, *args_despues],
                           capture_output=True, text=True)
        if r.returncode == 0:
            return r
        ultimo = r
    sys.exit(f"No pude codificar:\n{ultimo.stderr[-800:]}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video", help="video final (mp4)")
    ap.add_argument("--salida", help="archivo de salida (por defecto <video>_con_outro.mp4)")
    ap.add_argument("--usuario", default=USUARIO_DEFECTO)
    ap.add_argument("--frase", default=FRASE_DEFECTO)
    ap.add_argument("--duracion", type=float, default=3.0, help="segundos del outro")
    a = ap.parse_args()

    if not os.path.isfile(a.video):
        sys.exit(f"No existe el video: {a.video}")
    if a.duracion < 1.5:
        sys.exit("La duracion minima es 1.5 segundos.")
    ff = buscar_ffmpeg()
    salida = a.salida or os.path.splitext(a.video)[0] + "_con_outro.mp4"

    with tempfile.TemporaryDirectory() as tmp:
        ultimo = os.path.join(tmp, "ultimo.png")
        correr([ff, "-y", "-loglevel", "error", "-sseof", "-0.2", "-i", a.video, "-update", "1",
                "-frames:v", "1", ultimo])
        original, fondo = construir_fondo(ultimo)
        campana = dibujar_campana(190)
        lineas = partir_frase(a.frase)
        for i in range(int(a.duracion * FPS)):
            cuadro(i / FPS, original, fondo, campana, lineas, a.usuario).save(os.path.join(tmp, f"f_{i:04d}.png"))

        # outro: cuadros + sonido corto de "ding" cuando aparece el boton
        outro = os.path.join(tmp, "outro.mp4")
        sonido = (f"[1:a]afade=t=out:st=0.08:d=0.1,volume=0.35,adelay=800|800,"
                  f"apad=whole_dur={a.duracion},aformat=channel_layouts=stereo,aresample=48000[a]")
        codificar(ff,
                  ["-framerate", str(FPS), "-i", os.path.join(tmp, "f_%04d.png"),
                   "-f", "lavfi", "-i", "sine=frequency=1320:duration=0.18", "-filter_complex", sonido,
                   "-map", "0:v", "-map", "[a]", "-t", str(a.duracion)],
                  ["-b:v", "10M", "-pix_fmt", "yuv420p", "-c:a", "aac", "-ar", "48000", outro])

        # une el video original con el outro
        fc = ("[0:v]scale=1080:1920,fps=30,setsar=1,format=yuv420p[v0];"
              "[0:a]aresample=48000,aformat=channel_layouts=stereo[a0];"
              "[1:v]fps=30,setsar=1,format=yuv420p[v1];"
              "[1:a]aresample=48000,aformat=channel_layouts=stereo[a1];"
              "[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]")
        codificar(ff,
                  ["-i", a.video, "-i", outro, "-filter_complex", fc, "-map", "[v]", "-map", "[a]"],
                  ["-b:v", "10M", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
                   "-movflags", "+faststart", salida])
    print(f"Listo: {salida}")


if __name__ == "__main__":
    main()
