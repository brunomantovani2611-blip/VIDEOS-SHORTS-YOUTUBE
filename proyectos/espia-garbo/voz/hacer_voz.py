"""Genera voz.wav + palabras.json con edge-tts, acortando las pausas largas.

Uso: python hacer_voz.py [--rate +45%] [--pausa 0.15]
"""
import argparse
import asyncio
import json
import os
import subprocess
import wave
from pathlib import Path

import edge_tts

AQUI = Path(__file__).parent
SR = 48000


async def sintetizar(texto, voz, rate, salida):
    palabras = []
    proxy = os.environ.get("HTTPS_PROXY") or None
    c = edge_tts.Communicate(texto, voz, rate=rate, boundary="WordBoundary", proxy=proxy)
    with open(salida, "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                ini = ch["offset"] / 1e7
                palabras.append({"w": ch["text"], "a": ini, "b": ini + ch["duration"] / 1e7})
    return palabras


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voz", default="es-MX-JorgeNeural")
    ap.add_argument("--rate", default="+45%")
    ap.add_argument("--pausa", type=float, default=0.15, help="pausa máxima entre palabras (s)")
    args = ap.parse_args()

    texto = (AQUI / "texto.txt").read_text().strip()
    mp3 = AQUI / "bruto.mp3"
    palabras = asyncio.run(sintetizar(texto, args.voz, args.rate, mp3))

    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp3), "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    n = len(raw) // 2
    smp = lambda t: max(0, min(n, int(round(t * SR))))

    # tramos a conservar: desde el inicio de la voz, cada palabra + hasta `pausa` de silencio después
    trozos, nuevas, t_out = [], [], 0.0
    inicio = max(0.0, palabras[0]["a"] - 0.03)  # la voz entra en el cuadro 1
    for i, p in enumerate(palabras):
        a = inicio if i == 0 else p["a"]
        sig = palabras[i + 1]["a"] if i + 1 < len(palabras) else p["b"] + 0.25
        fin = min(sig, p["b"] + args.pausa) if i + 1 < len(palabras) else sig
        # si el hueco es corto lo dejamos entero (es coarticulación, no pausa)
        if sig - p["b"] <= args.pausa:
            fin = sig
        nuevas.append({"w": p["w"], "a": round(t_out + (p["a"] - a), 3), "b": round(t_out + (p["b"] - a), 3)})
        trozos.append(raw[smp(a) * 2: smp(fin) * 2])
        t_out += (smp(fin) - smp(a)) / SR

    # micro-fundidos de 5 ms en cada unión para evitar clics
    import array
    out = array.array("h")
    fade = int(0.005 * SR)
    for tz in trozos:
        a = array.array("h"); a.frombytes(tz)
        for k in range(min(fade, len(a) // 2)):
            g = k / fade
            a[k] = int(a[k] * g); a[-1 - k] = int(a[-1 - k] * g)
        out.extend(a)

    with wave.open(str(AQUI / "voz.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
    dur = len(out) / SR
    (AQUI / "palabras.json").write_text(json.dumps({"duracion": round(dur, 3), "fps": 30, "palabras": [
        {**p, "fa": int(p["a"] * 30), "fb": int(p["b"] * 30)} for p in nuevas]}, ensure_ascii=False, indent=1))
    print(f"{len(nuevas)} palabras, {dur:.2f} s, {len(nuevas) / dur:.2f} palabras/s")


if __name__ == "__main__":
    main()
