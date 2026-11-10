"""Ejecútalo UNA vez en tu PC para obtener el refresh token de YouTube.

1. Descarga el JSON de credenciales OAuth (tipo "App de escritorio") de Google Cloud
   y guárdalo como client_secret.json en la raíz del proyecto.
2. python scripts/get_refresh_token.py
3. Inicia sesión con la cuenta del canal y copia los 3 valores que se imprimen.
"""
import json
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"]

flow = InstalledAppFlow.from_client_secrets_file("client_secret.json", SCOPES)
creds = flow.run_local_server(port=0, access_type="offline", prompt="consent")
info = json.loads(Path("client_secret.json").read_text())
info = info.get("installed") or info.get("web")
print("\nGuarda estos valores como secretos (GitHub > Settings > Secrets > Actions):\n")
print(f"YT_CLIENT_ID={info['client_id']}")
print(f"YT_CLIENT_SECRET={info['client_secret']}")
print(f"YT_REFRESH_TOKEN={creds.refresh_token}")
