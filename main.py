"""Pipeline completo: idea -> guion -> voz -> clips -> montaje -> subida a YouTube.

Uso:
    python main.py --format short            # genera un Short y lo sube
    python main.py --format long --no-upload # genera un video largo sin subirlo
    python main.py --format short --count 3  # genera y sube 3 Shorts
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path

import yaml

from src.render import make_thumbnail, render
from src.script_writer import write_script
from src.uploader import upload
from src.visuals import fetch_clips
from src.voice import narrate

HISTORY = Path("data/history.json")


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:50] or "video"


def run_once(cfg: dict, fmt: str, do_upload: bool, publish_at: str | None) -> None:
    history = json.loads(HISTORY.read_text()) if HISTORY.exists() else []
    topics = [h["topic"] for h in history]

    print(f"[1/5] Escribiendo guion ({fmt})...")
    script = write_script(cfg, fmt, topics)
    print(f"      Tema: {script.topic}\n      Título: {script.title}")

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    outdir = Path("output") / f"{stamp}-{fmt}-{slug(script.title)}"
    work = outdir / "work"
    work.mkdir(parents=True, exist_ok=True)
    (outdir / "script.json").write_text(json.dumps(script.__dict__, ensure_ascii=False, indent=2))

    print("[2/5] Generando narración...")
    voice, words, durations = narrate(script.segments, cfg, work)
    total = sum(durations)
    print(f"      Duración: {total:.1f}s")
    if fmt == "short" and total > 59:
        print("      [aviso] Supera 59 s: puede no clasificarse como Short.")

    print("[3/5] Descargando clips...")
    clips = fetch_clips(script.segments, durations, fmt, work)

    print("[4/5] Montando video...")
    video = render(clips, durations, voice, words, cfg, fmt, work, outdir / "video.mp4")
    thumb = make_thumbnail(video, script.thumbnail_text, outdir / "thumbnail.jpg") if fmt == "long" else None
    shutil.rmtree(work, ignore_errors=True)
    print(f"      Listo: {video}")

    entry = {"date": stamp, "format": fmt, "topic": script.topic, "title": script.title}
    if do_upload:
        print("[5/5] Subiendo a YouTube...")
        video_id = upload(video, script.title, script.description, script.tags, cfg, thumb, publish_at)
        entry["video_id"] = video_id
        print(f"      https://youtube.com/watch?v={video_id}")
    else:
        print("[5/5] Subida omitida (--no-upload)")

    history.append(entry)
    HISTORY.parent.mkdir(exist_ok=True)
    HISTORY.write_text(json.dumps(history, ensure_ascii=False, indent=2))


def main() -> None:
    p = argparse.ArgumentParser(description="Automatización de Shorts y videos para YouTube con IA")
    p.add_argument("--format", choices=["short", "long"], default="short")
    p.add_argument("--count", type=int, default=1)
    p.add_argument("--no-upload", action="store_true")
    p.add_argument("--publish-at", help="Programar publicación (ISO 8601 UTC, ej. 2026-11-11T18:00:00Z)")
    p.add_argument("--config", default="config.yaml")
    args = p.parse_args()

    cfg = yaml.safe_load(Path(args.config).read_text())
    for i in range(args.count):
        print(f"\n===== Video {i + 1}/{args.count} =====")
        run_once(cfg, args.format, not args.no_upload, args.publish_at)


if __name__ == "__main__":
    main()
