# Shorts animados 3D con Claude

## Empieza aquí: elige tu estilo

**Un solo paquete, dos formas de crear videos:**

1. **Realista con Blender:** animaciones con modelos y materiales 3D, como una explicación visual de anatomía. [Ver imagen](ejemplos/animacion-realista.png) · [Ver video de puntadas](ejemplos/video-blender-puntadas.mp4) (vista previa de 9 segundos, sin audio; muestra una herida).
2. **Caricatura animada:** personajes de caricatura en un mundo 3D de colores. [Ver imagen](ejemplos/animacion-caricatura.jpg) · [Ver video de Alejandro Magno](ejemplos/video-alejandro-caricatura.mp4) (9,8 segundos, con audio).

No necesitas descargar carpetas por separado. La descarga por sí sola no abre Claude ni instala la skill:

1. En esta página, pulsa el botón verde **Code** y luego **Download ZIP**.
2. Abre el ZIP descargado. En Mac, haz doble clic; en Windows, haz clic derecho y elige **Extraer todo**. Conserva junta toda la carpeta extraída.
3. Abre **Claude Code** y selecciona la carpeta extraída como carpeta de trabajo. Si necesitas ayuda para encontrar esa opción, dile a Claude qué computadora tienes y pídele instrucciones paso a paso.
4. En la conversación de Claude Code pega:

> Lee el archivo SKILL.md de esta carpeta. Soy principiante: muéstrame los dos ejemplos y explícame las dos opciones con palabras sencillas. Ayúdame a escoger y después guíame paso a paso, una pregunta a la vez.

El ejemplo realista incluye una representación de una herida con puntadas. Si Claude no puede mostrar los ejemplos en el chat, abre la carpeta `ejemplos` y pulsa cada imagen o video para verlo.

La skill ayuda a preparar el guion, la voz, las escenas y el render, pero requiere herramientas y recursos que dependen del estilo, además de revisar y ajustar los avances. Descargarla no genera un video por sí solo. Algunas opciones de voz pueden tener costo.

La skill gratuita del video **«Cómo hacer shorts animados virales con Claude»** de Crea con LuisPa. En español.

Hace shorts verticales de historia en el estilo «personajes 2D en un mundo 3D de colores»: personajes planos con
contorno, mundo 3D pintado con líneas de tinta, fondo desenfocado, cámara que se desliza y nunca se queda quieta,
voz narrando y efectos de sonido. Todo se hace con código (three.js dentro de Remotion) en tu propia computadora,
sin generadores de video con IA.

Probada en **Alejandro Magno en Gaugamela** (47 mil contra 100 mil, con 100,000 soldados dibujados uno por uno) y en
**El puente que se cayó por una canción**.

**Nuevo (noviembre 2026): shorts 3D realistas en Blender**, del video «Cómo hacer shorts 3D ultra realistas con Claude»:
puntadas en el brazo y en la pierna, con piel, herida, hilo y vello que se ven reales. Todo en `realista/`.

## Qué trae
| Carpeta | Qué es |
|---|---|
| `SKILL.md` | La skill: el proceso completo, cada regla, cada arreglo y los valores finales del look |
| `plantillas/alejandro/` | El código completo del short de Alejandro: mundo de batalla, multitudes, cámara lenta, brasas, guion y mezcla de ejemplo |
| `plantillas/puente/` | El código completo del short del puente (de Mr omi): pueblo, personajes, tinta, desenfoque, color |
| `plantillas/audio/` | Sonido sintetizado: efectos, música, mezcla con la voz y volumen final |
| `plantillas/scripts/` | Fotos sueltas, hojas lado a lado, unir el trabajo de los agentes y revisión cuadro por cuadro |
| `realista/` | Shorts 3D realistas en Blender: guía (`REALISTA.md`), dos escenas completas (brazo y pierna con puntadas), medición de cámara y recursos con su licencia |
| `herramientas/medir_30fps.py` | Mide cualquier short a 30 cuadros por segundo: hojas, cortes, movimiento de cámara, color |
| `referencias/BIBLIA_DE_ESTILO.md` | La fórmula del guion y de la imagen medida en 20 shorts de referencia |
| `referencias/reportes_en/` | Siete reportes con medidas: movimiento, profundidad, texturas, personajes, luz, contornos, color (en inglés) |
| `referencias/hojas/` y `referencias/cuadros/` | 20 hojas de 60 cuadros (1,200 cuadros) y 38 cuadros completos para comparar |

## Herramientas e instalación

Pídele primero a Claude que revise qué tienes instalado y que te explique cada paso. No necesitas instalar las herramientas de los dos estilos si solo vas a usar uno.

- **Caricatura:** Node, Python 3, ffmpeg y un proyecto de [Remotion](https://www.remotion.dev/) con `@remotion/three`. El archivo `plantillas/alejandro/package_ejemplo.json` es una referencia de dependencias; no es un proyecto listo para ejecutar.
- **Realista:** Blender 5.x y los recursos que requiera la escena; consulta `realista/recursos/FUENTES.md`. Algunos recursos se descargan por separado. Los scripts de ejemplo renderizan imagen a MP4, pero la voz y la música requieren pasos adicionales.

Para que Claude encuentre la skill en otras conversaciones, pídele que te ayude a instalar la carpeta completa en el directorio de skills de tu sistema. En macOS/Linux, el README anterior indicaba `~/.claude/skills/shorts-animados-3d/`; en Windows pídele que compruebe la ruta para tu instalación. Primero puedes usar el mensaje de arriba desde la carpeta extraída, sin mover archivos.

Claude sigue `SKILL.md`: tema y datos, guion, voz, plan de tomas en `story.ts`, fotos de prueba, medición y render.

## Notas
- Pon `TEMP`/`TMP` en un disco grande: cada render de Remotion copia la carpeta `public/` a la carpeta temporal.
- La historia, los personajes y la voz siempre deben ser tuyos. Las referencias son para el look, no para el contenido.
- La mezcla de Alejandro usa efectos de una biblioteca con licencia que no vienen aquí: usa los tuyos o la
  opción sintetizada de `plantillas/audio/`.

## Créditos y licencia
Basada en [claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts) de Mr omi.
El código y los documentos son MIT (ver `LICENSE`). Los cuadros de referencia vienen solo para estudiar el estilo.
