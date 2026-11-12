# PROMPT PARA SESIÓN LOCAL — «El Sínodo del Cadáver» (Short vertical 30 s) con Google Flow en el navegador

Eres mi productor de videos. Trabajas en MI computadora, con acceso a MI navegador Chrome (extensión de Claude para Chrome) donde ya estoy logueado en Google Flow (https://labs.google/flow) con un plan de pago (AI Plus, 200 créditos/mes). Mi objetivo: que tú hagas TODO el proceso de generar imágenes y clips en Flow, revisarlos y armar el video final. Yo solo te doy la idea. Hablame en español rioplatense, breve y directo.

## Reglas
- Antes de empezar, clona o actualiza el repo: `git clone https://github.com/brunomantovani2611-blip/videos-shorts-youtube` y cambia a la rama `claude/lucid-feynman-mhna9r`. Todo lo del proyecto está en `proyectos/sinodo-palito/`.
- Cuidá mis créditos: máximo 3 intentos por escena. Si sospechas que se acaban, o algo falla 2 veces seguidas, frená y avisame. Nunca compres ni cambies de plan.
- Nunca publiques nada en ninguna red. Nunca compartas datos personales míos.
- Revisá CADA imagen y CADA clip (mirándolos de verdad) antes de seguir; si no cumplen, reintentá con una corrección precisa.
- Si una pantalla o botón de Flow no es como esperás, mirá la pantalla y adaptate; no inventes resultados.

## Ajustes de Flow (Agent settings o menú del modelo)
- Imágenes: Nano Banana 2.1, formato 9:16, cantidad x1.
- Video: Veo 3.1 - Lite, formato 9:16, x1, duración 8 s (es la única que ofrece; no cambies a Omni 1.2 Flash, rompe el estilo del personaje). Activá "return silent videos" si el audio falla (agregamos sonido en el montaje).
- Para animar una imagen: abrila desde la galería "Images" y tocá "Animar" (así el primer cuadro es seguro). No uses el chat del agente para eso (a veces arrastra otra imagen).

## El proyecto
Short vertical 9:16 de 30 s, narrado en español (voz George de ElevenLabs, ya generada en `voz/narracion.mp3`, 28,9 s; tiempos por palabra en `voz/palabras.json`). Tema real: en enero del año 897 en Roma, el papa Esteban VI mandó desenterrar a su antecesor Formoso y lo juzgó; un diácono respondió por el cadáver; lo declararon culpable y lo arrojaron al río Tíber; meses después Esteban VI acabó preso y murió en la cárcel. NO inventes datos (no menciones dedos cortados, no pongas citas inventadas).

Narración (ya grabada):
"Enero del año 897, Roma. Un papa ordena desenterrar a su antecesor, que lleva meses muerto. Lo viste con ropas papales, lo sienta en un trono y lo juzga. Un diácono tiene que responder por el cadáver. Veredicto: culpable. Arrojan el cuerpo al río Tíber. Pero la historia se vuelve contra el acusador: meses después, ese papa acaba preso, y muere en la cárcel."

## Personaje (BLOQUEADO): «Palito»
Estilo: ilustración 2D digital de dibujos animados, contornos negros gruesos y limpios, sombreado cel suave.
- Cabeza: grande, ovalada/redonda lisa, blanco crema, contorno negro grueso, SIN nariz, SIN orejas, SIN pelo.
- Cara: ojos pequeños oscuros con párpados pesados entrecerrados, cejas gruesas expresivas (neutra = plana, cansada, escéptica), boca fina como una línea. Cuello corto pálido.
- Ropa (Roma, siglo IX): túnica de lana marrón lisa hasta la rodilla con mangas anchas hasta las muñecas, cinturón de soga, calzas gris oscuro, zapatos de cuero marrón simples. SIN capucha, SIN buzo, SIN bolsillo, SIN cordones, SIN ropa moderna.
- Manos: simples, blanco crema, redondeadas, 4 dedos + pulgar.
- Proporciones: cabeza ~1/3 de la altura, piernas finas. Siempre UN solo muñeco en cuadro. Los demás elementos (esqueleto con mitra/ropa papal dorada pálida en el trono) son utilería estática, con cuencas vacías (SIN ojos brillantes).
- Escenario: basílica románica de piedra, arcos REDONDOS, columnas gruesas, antorchas con luz naranja, luz azul de luna por ventanas altas, trono simple de madera con respaldo liso (SIN pináculos ni elementos góticos).
- Errores ya vistos que hay que evitar: brazos/piernas de palitos negros finos, capucha en la túnica, cabeza alargada como huevo, nariz/orejas/piel realista, trono gótico, esqueleto con ojos brillantes, túnica roja en el esqueleto.

## Archivos de referencia (en `proyectos/sinodo-palito/`)
- `referencias/palito_hoja_tunica.png` — hoja oficial del personaje (subila a Flow y guardala como personaje «Palito»).
- `referencias/palito_hoja_capucha_original.png` — hoja original (solo para estilo de cara).
- `referencias/estilo_referencia_habitacion.png` — referencia de estilo/render.
- `referencias/escena1_vertical.png`, `referencias/escena2_vertical.png` — imágenes de las escenas 1 y 2 en 9:16 (aprobadas).
- `clips/C01_video.mp4`, `clips/C02_video.mp4` — clips YA APROBADOS de las escenas 1 y 2 (no los regeneres).
- `partes/fondo1_vacio.png` — fondo del salón sin personajes.
- `voz/narracion.mp3`, `voz/palabras.json`.

## Plan de escenas y tiempos (en el video final)
1. 0:00–8:00 — C01 (ya hecho)
2. 8:00–13:00 — C02 (ya hecho; usar sus primeros ~5 s)
3. 13:00–16:15 — «Un diácono tiene que responder por el cadáver»
4. 16:15–21:15 — «Veredicto: culpable. Arrojan el cuerpo al río Tíber»
5. 21:15–24:15 — «Pero la historia se vuelve contra el acusador»
6. 24:15–29:00 — «Meses después, ese papa acaba preso, y muere en la cárcel»

### Escena 3 — NO requiere imagen nueva: animar `escena1_vertical.png`
Animar en Flow (Veo 3.1 Lite, 9:16, x1, 8 s). Prompt:
```
Use the attached image as the first frame. 0–1.5 s: Palito's raised hands tremble and a sweat drop slides down his head. 1.5–3.2 s: his mouth opens and closes in short nervous speaking motions while he gestures once toward the skeleton with one hand. 3.2–5 s: he glances sideways toward the camera with a worried look. 5–8 s: he holds that worried look. The skeleton on the throne stays completely still with empty dark eye sockets; only Palito moves. Camera: slight slow push-in, no cuts. Do not add large blurry smoke or dust blobs. Keep Palito's design identical in every frame: round egg-shaped white head with no nose and no ears, brown wool tunic with rope belt, no hood; no morphing, no flicker, no extra characters, no text.
```

### Escena 4 — imagen nueva (río Tíber), luego animar
Imagen (adjuntar Palito + referencias de escenas; si Flow permite "Editar" una imagen existente, preferí ese camino para conservar el diseño):
```
Using the attached Palito character and the hall scene as style reference, create a vertical 9:16 scene in the same art style (polished 2D cartoon, thick black outlines, soft cel shading). Palito (egg-shaped white head, no nose, no ears, brown wool tunic with wide sleeves and rope belt, pale hands, dark-gray hose, brown shoes, no hood) stands on a rough stone embankment in the lower-left, side view facing right, leaning slightly forward, arms hanging, worried wide eyes, looking down at dark river water. The Tiber river in Rome at dusk, 897: stone ledge in the foreground, dark green-gray water in the lower third, far bank with low old stone buildings with round-arched windows, purple-orange dusk sky. A human skeleton prop in pale-gold papal vestments and papal cap lies on the very edge of the ledge about to slide into the water, with a rolled parchment with a red wax seal beside it. ONE stickman only. No text, no watermark.
```
Animación (8 s):
```
Use the attached image as the first frame. 0–2 s: the red-sealed parchment rolls slightly, the water ripples gently, Palito watches. 2–4 s: the skeleton prop slowly tips off the ledge and falls into the water with a splash and concentric ripples. 4–6 s: Palito flinches, then lowers his gaze with a small sad frown as the ripples fade. 6–8 s: he holds that pose. Camera: static with a very slow tilt down following the splash, no cuts. Do not add large blurry smoke or dust blobs. Keep Palito's design identical in every frame; no morphing, no flicker, no extra characters, no text.
```

### Escena 5 — imagen nueva (sala vacía), luego animar
Imagen:
```
Using the attached Palito character and the hall scene as style reference, create a vertical 9:16 scene in the same art style. Palito (egg-shaped white head, no nose, no ears, brown wool tunic with wide sleeves and rope belt, no hood, pale hands, dark-gray hose, brown shoes) stands centered in the lower half facing the camera, arms crossed, one eyebrow raised high, a thin half-smile that says "this will not end well". The same Romanesque stone hall, now deserted late at night: the simple dark-wood throne behind him is EMPTY with a pale-gold papal robe folded on its seat and a papal cap on the floor beside it; a heavy round-arched wooden door at the far end slightly ajar with a thin line of pale light; torches burned low; long dark shadows on the floor. ONE stickman only. No text, no watermark.
```
Animación (8 s):
```
Use the attached image as the first frame. 0–1.5 s: the torches shrink and flicker, the far door creaks open a little wider, a long shadow of a papal cap stretches along the wall. 1.5–3 s: Palito's raised eyebrow rises higher and his half-smile grows slightly, arms still crossed. 3–4 s: the torch flames drop lower and the room darkens, holding on his face. 4–8 s: he holds that look. Camera: slow push-in toward Palito, no cuts. Do not add large blurry smoke or dust blobs. Keep Palito's design identical in every frame; no morphing, no flicker, no extra characters, no text.
```

### Escena 6 — imagen nueva (calabozo), luego animar
Imagen:
```
Using the attached Palito character and the hall scene as style reference, create a vertical 9:16 scene in the same art style. Palito (egg-shaped white head, no nose, no ears, brown wool tunic with wide sleeves and rope belt, no hood, pale hands, dark-gray hose, brown shoes) stands outside a dungeon cell in the lower-left, one hand wrapped around an iron bar, head slightly bowed, sad eyes and eyebrows slanted up in the middle. An early-medieval stone dungeon in Rome: thick vertical iron bars in the foreground, a bare cell with a pile of straw, damp gray stone walls with a round-arched ceiling, a small barred window high up letting a thin ray of pale light fall on the straw; on the straw lie a papal cap and a dark-red robe (no body shown). ONE stickman only, nothing graphic. No text, no watermark.
```
Animación (8 s):
```
Use the attached image as the first frame. 0–2 s: a drop falls from the ceiling and the ray of light slowly shifts across the straw while Palito stays still holding the bar. 2–4 s: Palito slowly lowers his head and his hand slides down the iron bar. 4–6 s: he looks up at the camera with a quiet sad expression and holds as the light dims slightly. 6–8 s: he holds that pose. Camera: slow steady pull-back, no cuts. Do not add large blurry smoke or dust blobs. Keep Palito's design identical in every frame; no morphing, no flicker, no extra characters, no text.
```

## Checklist de revisión de cada imagen/clip
1. Vertical 9:16. 2. UN solo muñeco. 3. Cabeza lisa sin nariz ni orejas. 4. Túnica marrón con mangas anchas, SIN capucha. 5. Manos pálidas, calzas gris oscuro, zapatos marrones. 6. Esqueleto quieto, cuencas vacías. 7. Salón románico (arcos redondos, trono simple). 8. Sin texto/marca de agua. En clips: el primer cuadro es la imagen correcta y Palito no cambia de diseño durante el movimiento.

## Descarga
Bajá cada clip en la mejor resolución (1080p) a la carpeta `proyectos/sinodo-palito/clips/` con nombres `C03_video.mp4`, `C04_video.mp4`, `C05_video.mp4`, `C06_video.mp4`. Guardá también las imágenes aprobadas como `referencias/escena3_vertical.png`... etc.

## Montaje final (con ffmpeg y/o Remotion; el repo ya tiene `remotion/` como base de subtítulos)
- Video 1080x1920 a 30 fps, ~29–30 s. Cortá/recortá cada clip a su tramo de la tabla (si un clip es más corto que su tramo, congelá el último cuadro; si es más largo, recortá el final). Transiciones: cortes secos o fundidos de 0,2 s.
- Audio: voz `voz/narracion.mp3` (principal) + sonido ambiente suave (crepitar de antorchas, eco, viento; chapuzón en escena 4 ~16:35–17:00; puerta que cruje en escena 5; gotas en escena 6) a ~-22 dB bajo la voz, y música sutil opcional a ~-26 dB. Normalizá a -14 LUFS con limitador.
- Subtítulos quemados palabra por palabra con `voz/palabras.json`: letras blancas grandes, palabra actual en amarillo, contorno negro grueso, abajo en el tercio inferior (zona segura), máx. 3 palabras por línea.
- Revisá el resultado final mirando fotogramas de cada escena y comprobando duración y sincronía. Exportá `final/sinodo_palito_final.mp4`.

## Entregables
1. `final/sinodo_palito_final.mp4`.
2. `PUBLICAR.md` con: título (máx. 60 caracteres, con gancho), descripción corta para YouTube Shorts, hashtags, texto para TikTok (máx. 500 caracteres), comentario fijado, y las fuentes de los datos (Wikipedia «Cadaver Synod», National Geographic, Atlas Obscura, JSTOR Daily).
3. Commit en la rama `claude/lucid-feynman-mhna9r` y push (no crees pull request).

## Después
Cuando yo te pase una idea nueva, repetí el proceso completo: verificás datos con fuentes, guion de ~64–75 palabras para 30 s, voz, imágenes y clips en Flow con el mismo estilo de Palito (adaptando ropa y época si hace falta), revisión, montaje y texto de publicación.
