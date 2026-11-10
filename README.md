# Automatización de Shorts y videos para YouTube con IA

Pipeline que, sin intervención manual, crea y publica videos en tu canal:

```
Idea + guion (Claude)  →  Voz (edge-tts)  →  Clips de stock (Pexels)
      →  Montaje con subtítulos animados (ffmpeg)  →  Subida a YouTube (API oficial)
```

- **Shorts** verticales 1080×1920 (~45 s) con subtítulos palabra a palabra resaltada.
- **Videos largos** horizontales 1920×1080 (~8 min) con miniatura generada.
- Guiones con gancho en el primer segundo, bucles abiertos y final en bucle (para Shorts).
- Recuerda los temas ya publicados (`data/history.json`) para no repetirse.
- Se ejecuta solo con **GitHub Actions** (2 Shorts al día + 1 video largo los sábados).

## 1. Claves que necesitas

| Secreto | Dónde se consigue | Coste |
|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | ~céntimos por guion |
| `PEXELS_API_KEY` | pexels.com/api | Gratis |
| `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN` | Ver paso 2 | Gratis |

La voz (edge-tts) es gratuita y no necesita clave.

## 2. Conectar tu canal de YouTube (una sola vez)

1. Entra en console.cloud.google.com y crea un proyecto.
2. En «APIs y servicios», activa **YouTube Data API v3**.
3. En «Pantalla de consentimiento OAuth», elige el tipo *Externo*, añade tu correo como usuario de prueba y **publica la app** (en modo «Prueba» el token caduca a los 7 días).
4. En «Credenciales», crea un **ID de cliente OAuth** de tipo *App de escritorio*, descarga el JSON y guárdalo como `client_secret.json` en esta carpeta.
5. En tu PC, ejecuta:
   ```bash
   pip install -r requirements.txt
   ```
   ```bash
   python scripts/get_refresh_token.py
   ```
   Inicia sesión con la cuenta del canal y copia los 3 valores que se imprimen.

> ⚠️ Mientras Google no audite tu proyecto, los videos subidos por API pueden quedar **privados** de forma forzosa. Para publicarlos como públicos, solicita la auditoría («YouTube API Services – Audit and Quota Extension Form»). Hasta entonces, puedes cambiarlos a público a mano desde YouTube Studio.

## 3. Ponerlo en automático (GitHub Actions)

1. En GitHub, ve a **Settings → Secrets and variables → Actions** y crea los 5 secretos de la tabla.
2. Revisa los horarios en `.github/workflows/publish.yml`. Están en UTC.
3. Para probarlo ya, ve a **Actions → «Publicar videos automáticamente» → Run workflow**.

Cada ejecución sube el video generado como *artefacto*, para que lo puedas descargar y revisar, y guarda el tema en el historial.

## 4. Usarlo en tu PC

Requisitos: Python 3.11+ y ffmpeg.

```bash
pip install -r requirements.txt
```
```bash
cp .env.example .env   # rellena las claves y expórtalas en tu terminal
```
```bash
python main.py --format short --no-upload       # genera un Short para revisarlo
```
```bash
python main.py --format short                   # genera y sube
```
```bash
python main.py --format long --publish-at 2026-11-15T18:00:00Z   # programa la publicación
```

Los videos quedan en `output/<fecha>-<formato>-<título>/` junto con `script.json`.

## 5. Personalizar (`config.yaml`)

- `channel.niche`: **lo más importante**. Un nicho concreto rinde mucho más que uno genérico.
- `voice.name`: voz de edge-tts. Puedes ver todas con `edge-tts --list-voices`.
- `formats.*.target_seconds`: duración objetivo.
- `music`: pon MP3 libres de derechos en `assets/music/` y se mezclarán de fondo.

## Sobre la viralidad y las normas de YouTube (léelo)

Nadie puede garantizar que un video se haga viral. Este sistema aplica lo que mejor funciona: gancho inmediato, ritmo, subtítulos grandes, títulos con curiosidad y publicación constante. Para que el canal crezca y **no lo desmonetice YouTube**:

- **Contenido repetitivo o producido en masa:** la política de *contenido no auténtico* de YouTube penaliza los canales que publican videos casi iguales, hechos con plantilla y sin aportar valor. Revisa los videos antes de publicar, varía los formatos y no subas más de 2-3 al día.
- **Declarar el contenido sintético:** `contains_synthetic_media: true` marca el video como alterado o sintético. Es obligatorio cuando el contenido realista está generado con IA.
- **Veracidad:** el guionista tiene instrucciones de no inventar datos, pero la IA puede equivocarse. Revisa los hechos, sobre todo en temas históricos o científicos.
- **Cuota de la API:** cada subida consume 1600 de las 10 000 unidades diarias gratuitas, lo que da unas 6 subidas al día.
- **Créditos:** los clips de Pexels son de uso libre. Si añades música, asegúrate de que su licencia lo permita y pon el crédito si te lo exige.

Lo que más mueve la aguja es mirar las analíticas (retención en los primeros 3 segundos y porcentaje de vistas completas) y ajustar `niche` y `tone` según lo que funcione.

## Estructura

```
main.py                    Orquestador (CLI)
config.yaml                Configuración del canal
src/script_writer.py       Idea + guion + título + descripción (Claude, salida JSON)
src/voice.py               Narración y tiempos por palabra (edge-tts)
src/visuals.py             Clips de stock por escena (Pexels)
src/render.py              Montaje, subtítulos ASS animados y miniatura (ffmpeg)
src/uploader.py            Subida a YouTube (Data API v3)
scripts/get_refresh_token.py   Obtener el token OAuth una vez
.github/workflows/publish.yml  Publicación programada
```
