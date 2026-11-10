"""Narración con edge-tts (gratis) + tiempos por palabra para subtítulos."""
from __future__ import annotations

import asyncio
import os
import subprocess
from pathlib import Path

import edge_tts


async def _synth(text: str, voice: str, rate: str, out: Path) -> list[dict]:
    words: list[dict] = []
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    comm = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary", proxy=proxy)
    with open(out, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 1e7  # unidades de 100 ns -> segundos
                words.append({"word": chunk["text"], "start": start, "end": start + chunk["duration"] / 1e7})
    return words


def audio_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def narrate(segments: list[dict], cfg: dict, workdir: Path) -> tuple[Path, list[dict], list[float]]:
    """Sintetiza cada escena por separado y las une.

    Devuelve (audio_final, palabras_con_tiempos_globales, duración_de_cada_escena)."""
    voice, rate = cfg["voice"]["name"], cfg["voice"]["rate"]
    parts, all_words, durations = [], [], []
    offset = 0.0
    for i, seg in enumerate(segments):
        part = workdir / f"voice_{i:03d}.mp3"
        words = asyncio.run(_synth(seg["narration"], voice, rate, part))
        dur = audio_duration(part)
        for w in words:
            all_words.append({**w, "start": w["start"] + offset, "end": w["end"] + offset})
        durations.append(dur)
        parts.append(part)
        offset += dur

    listfile = workdir / "voice_list.txt"
    listfile.write_text("".join(f"file '{p.name}'\n" for p in parts))
    final = workdir / "voice.mp3"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(listfile),
         "-c", "copy", str(final)],
        check=True,
    )
    return final, all_words, durations
