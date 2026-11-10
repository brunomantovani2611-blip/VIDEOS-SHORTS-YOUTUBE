"""Descarga clips de stock de Pexels (API gratuita) para cada escena."""
from __future__ import annotations

import os
import random
from pathlib import Path

import requests

PEXELS_URL = "https://api.pexels.com/videos/search"


def _search(query: str, orientation: str) -> list[dict]:
    r = requests.get(
        PEXELS_URL,
        headers={"Authorization": os.environ["PEXELS_API_KEY"]},
        params={"query": query, "orientation": orientation, "per_page": 15, "size": "medium"},
        timeout=30,
    )
    r.raise_for_status()
    return r.json().get("videos", [])


def _best_file(video: dict, min_height: int) -> str | None:
    files = [f for f in video.get("video_files", []) if f.get("file_type") == "video/mp4" and f.get("height")]
    if not files:
        return None
    good = sorted((f for f in files if f["height"] >= min_height), key=lambda f: f["height"])
    return (good[0] if good else max(files, key=lambda f: f["height"]))["link"]


def fetch_clips(segments: list[dict], durations: list[float], fmt: str, workdir: Path) -> list[Path]:
    orientation = "portrait" if fmt == "short" else "landscape"
    min_h = 1280 if fmt == "short" else 720
    used: set[int] = set()
    clips: list[Path] = []
    for i, (seg, dur) in enumerate(zip(segments, durations)):
        candidates: list[dict] = []
        for q in (seg["visual_query"], " ".join(seg["visual_query"].split()[:2]), "cinematic abstract"):
            candidates = [v for v in _search(q, orientation) if v["id"] not in used]
            # preferimos clips que duren al menos lo que la escena
            long_enough = [v for v in candidates if v.get("duration", 0) >= dur]
            if long_enough:
                candidates = long_enough
            if candidates:
                break
        if not candidates:
            raise RuntimeError(f"Sin clips para la escena {i}: {seg['visual_query']}")
        video = random.choice(candidates[:5])
        used.add(video["id"])
        url = _best_file(video, min_h)
        path = workdir / f"clip_{i:03d}.mp4"
        with requests.get(url, stream=True, timeout=120) as r:
            r.raise_for_status()
            with open(path, "wb") as f:
                for chunk in r.iter_content(1 << 20):
                    f.write(chunk)
        clips.append(path)
    return clips
