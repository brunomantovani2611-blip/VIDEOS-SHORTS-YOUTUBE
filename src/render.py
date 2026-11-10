"""Montaje final con ffmpeg: clips + voz + música + subtítulos animados."""
from __future__ import annotations

import random
import subprocess
from pathlib import Path


def _run(cmd: list[str]) -> None:
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *cmd], check=True)


def _ts(t: float) -> str:
    h, rem = divmod(max(t, 0), 3600)
    m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def _escape(text: str) -> str:
    return text.replace("\\", "").replace("{", "(").replace("}", ")")


def build_subtitles(words: list[dict], cfg: dict, width: int, height: int, out: Path) -> Path:
    sub = cfg["subtitles"]
    n = sub["words_per_caption"]
    vertical = height > width
    size = int(width * (0.085 if vertical else 0.05))
    margin_v = int(height * (0.30 if vertical else 0.08))
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{sub['font']},{size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,{max(4, size // 12)},2,2,60,60,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
    hl = sub["highlight_color"]
    for g in range(0, len(words), n):
        group = words[g:g + n]
        for j, w in enumerate(group):
            end = group[j + 1]["start"] if j + 1 < len(group) else w["end"]
            parts = []
            for k, other in enumerate(group):
                txt = _escape(other["word"]).upper()
                parts.append(f"{{\\c{hl}\\fscx110\\fscy110}}{txt}{{\\r}}" if k == j else txt)
            lines.append(f"Dialogue: 0,{_ts(w['start'])},{_ts(end)},Default,,0,0,0,,{' '.join(parts)}")
    out.write_text(header + "\n".join(lines) + "\n", encoding="utf-8")
    return out


def _prepare_clip(src: Path, dur: float, w: int, h: int, out: Path) -> Path:
    # Recorta al formato, ligera animación de zoom (Ken Burns) para dar dinamismo.
    zoom = f"scale={w * 1.15:.0f}:{h * 1.15:.0f}:force_original_aspect_ratio=increase," \
           f"crop={w}:{h}:(iw-{w})/2+(iw-{w})/2*sin(t/3):(ih-{h})/2"
    _run(["-stream_loop", "-1", "-i", str(src), "-t", f"{dur:.3f}", "-an",
          "-vf", f"{zoom},fps=30,setsar=1,format=yuv420p",
          "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", str(out)])
    return out


def render(clips: list[Path], durations: list[float], voice: Path, words: list[dict],
           cfg: dict, fmt: str, workdir: Path, out: Path) -> Path:
    w, h = cfg["formats"][fmt]["width"], cfg["formats"][fmt]["height"]
    prepared = [_prepare_clip(c, d, w, h, workdir / f"prep_{i:03d}.mp4")
                for i, (c, d) in enumerate(zip(clips, durations))]
    listfile = workdir / "clips.txt"
    listfile.write_text("".join(f"file '{p.name}'\n" for p in prepared))
    silent = workdir / "silent.mp4"
    _run(["-f", "concat", "-safe", "0", "-i", str(listfile), "-c", "copy", str(silent)])

    subs = build_subtitles(words, cfg, w, h, workdir / "subs.ass")
    subs_arg = str(subs).replace("\\", "/").replace(":", "\\:")

    music = sorted(Path("assets/music").glob("*.mp3"))
    cmd = ["-i", str(silent), "-i", str(voice)]
    if music:
        cmd += ["-stream_loop", "-1", "-i", str(random.choice(music))]
        audio = f"[2:a]volume={cfg['music']['volume']}[m];[1:a][m]amix=inputs=2:duration=first:normalize=0[a]"
    else:
        audio = "[1:a]anull[a]"
    cmd += ["-filter_complex", f"[0:v]subtitles='{subs_arg}'[v];{audio}",
            "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
            "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(out)]
    _run(cmd)
    return out


def make_thumbnail(video: Path, text: str, out: Path) -> Path:
    safe = text.upper().replace("'", "").replace(":", "")
    _run(["-ss", "2", "-i", str(video), "-frames:v", "1", "-vf",
          "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,eq=saturation=1.4:contrast=1.15,"
          f"drawtext=text='{safe}':fontcolor=yellow:fontsize=110:borderw=8:bordercolor=black:"
          "x=(w-text_w)/2:y=h-text_h-60", str(out)])
    return out
