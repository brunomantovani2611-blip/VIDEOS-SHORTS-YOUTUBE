"""Sube videos a YouTube con la YouTube Data API v3 (OAuth con refresh token)."""
from __future__ import annotations

import os
from pathlib import Path

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"]


def _client():
    creds = Credentials(
        token=None,
        refresh_token=os.environ["YT_REFRESH_TOKEN"],
        client_id=os.environ["YT_CLIENT_ID"],
        client_secret=os.environ["YT_CLIENT_SECRET"],
        token_uri="https://oauth2.googleapis.com/token",
        scopes=SCOPES,
    )
    return build("youtube", "v3", credentials=creds, cache_discovery=False)


def upload(video: Path, title: str, description: str, tags: list[str], cfg: dict,
           thumbnail: Path | None = None, publish_at: str | None = None) -> str:
    yt_cfg = cfg["youtube"]
    status = {
        "privacyStatus": "private" if publish_at else yt_cfg["privacy"],
        "selfDeclaredMadeForKids": yt_cfg["made_for_kids"],
        "containsSyntheticMedia": yt_cfg["contains_synthetic_media"],
    }
    if publish_at:  # ISO 8601, p. ej. 2026-11-11T18:00:00Z
        status["publishAt"] = publish_at
    body = {
        "snippet": {
            "title": title,
            "description": description,
            "tags": tags[:30],
            "categoryId": yt_cfg["category_id"],
            "defaultLanguage": cfg["channel"]["language"],
            "defaultAudioLanguage": cfg["channel"]["language"],
        },
        "status": status,
    }
    yt = _client()
    req = yt.videos().insert(
        part="snippet,status", body=body,
        media_body=MediaFileUpload(str(video), chunksize=8 << 20, resumable=True, mimetype="video/mp4"),
    )
    response = None
    while response is None:
        _, response = req.next_chunk()
    video_id = response["id"]

    if thumbnail and thumbnail.exists():
        try:
            yt.thumbnails().set(videoId=video_id, media_body=MediaFileUpload(str(thumbnail))).execute()
        except HttpError as e:  # requiere canal verificado por teléfono
            print(f"[aviso] No se pudo poner la miniatura: {e}")
    return video_id
