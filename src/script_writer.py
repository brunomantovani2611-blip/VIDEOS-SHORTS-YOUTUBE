"""Genera la idea y el guion del video con Claude (salida JSON estructurada)."""
from __future__ import annotations

import json
from dataclasses import dataclass

import anthropic

SCHEMA = {
    "type": "object",
    "properties": {
        "topic": {"type": "string", "description": "Tema concreto del video (para evitar repetirlo)"},
        "title": {"type": "string", "description": "Título para YouTube, máx. 70 caracteres"},
        "description": {"type": "string", "description": "Descripción de YouTube, 2-4 párrafos con hashtags al final"},
        "tags": {"type": "array", "items": {"type": "string"}},
        "thumbnail_text": {"type": "string", "description": "2-4 palabras impactantes para la miniatura"},
        "segments": {
            "type": "array",
            "description": "Narración dividida en escenas, en orden",
            "items": {
                "type": "object",
                "properties": {
                    "narration": {"type": "string", "description": "Texto que dice el narrador en esta escena"},
                    "visual_query": {
                        "type": "string",
                        "description": "2-4 palabras EN INGLÉS para buscar video de stock en Pexels",
                    },
                },
                "required": ["narration", "visual_query"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["topic", "title", "description", "tags", "thumbnail_text", "segments"],
    "additionalProperties": False,
}

SYSTEM = """Eres un guionista experto en contenido viral de YouTube. Escribes guiones que
retienen a la audiencia hasta el final. Principios que aplicas:
- Gancho en la primera frase (menos de 2 segundos): una pregunta, una afirmación
  sorprendente o una promesa concreta. Nunca empieces con "Hola" ni presentaciones.
- Frases cortas, ritmo rápido, lenguaje hablado y natural.
- Bucles abiertos: anticipa lo que viene ("pero lo más raro llegó después...").
- Para shorts: el final debe enlazar con el inicio para que el video se repita en bucle.
- Para videos largos: estructura con mini-ganchos cada 30-60 segundos y una llamada a
  suscribirse a mitad del video, no al principio.
- Contenido VERÍDICO. No inventes datos, fechas ni cifras. Si algo es leyenda o está
  discutido, dilo así. Nada de clickbait engañoso: el título debe cumplir lo que promete.
- Título con curiosidad + palabra clave buscable. Sin MAYÚSCULAS completas ni emojis en exceso."""


@dataclass
class Script:
    topic: str
    title: str
    description: str
    tags: list[str]
    thumbnail_text: str
    segments: list[dict]

    @property
    def full_text(self) -> str:
        return " ".join(s["narration"] for s in self.segments)


def write_script(cfg: dict, fmt: str, history: list[str]) -> Script:
    ch = cfg["channel"]
    seconds = cfg["formats"][fmt]["target_seconds"]
    words = int(seconds * 2.6)  # ~2.6 palabras/segundo con la voz acelerada
    n_segments = max(5, seconds // 6) if fmt == "short" else max(20, seconds // 15)
    recent = "\n".join(f"- {t}" for t in history[-60:]) or "(ninguno todavía)"

    prompt = f"""Crea un {'YouTube Short vertical' if fmt == 'short' else 'video largo de YouTube'}.

Nicho del canal: {ch['niche']}
Audiencia: {ch['audience']}
Tono: {ch['tone']}
Idioma de la narración, título y descripción: {ch['language']}
Duración objetivo: {seconds} segundos (≈{words} palabras de narración en total).
Divide la narración en unas {n_segments} escenas; cada escena debe tener una imagen visual clara.

Elige un tema con alto potencial viral (curiosidad, sorpresa, emoción) que NO esté en esta
lista de temas ya publicados:
{recent}"""

    client = anthropic.Anthropic()
    with client.beta.messages.stream(
        model=cfg["llm"]["model"],
        max_tokens=32000,
        system=SYSTEM,
        messages=[{"role": "user", "content": prompt}],
        output_config={
            "effort": cfg["llm"].get("effort", "medium"),
            "format": {"type": "json_schema", "schema": SCHEMA},
        },
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
    ) as stream:
        response = stream.get_final_message()

    if response.stop_reason == "refusal":
        raise RuntimeError(f"El modelo rechazó la petición: {response.stop_details}")
    if response.stop_reason == "max_tokens":
        raise RuntimeError("Respuesta truncada (max_tokens)")

    text = next(b.text for b in response.content if b.type == "text")
    data = json.loads(text)
    data["title"] = data["title"][:100]
    if fmt == "short" and "#shorts" not in data["description"].lower():
        data["description"] += "\n\n#shorts"
    return Script(**data)
