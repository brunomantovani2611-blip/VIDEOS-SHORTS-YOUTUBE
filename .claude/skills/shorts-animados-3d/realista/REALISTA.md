# Shorts 3D realistas en Blender, hechos con código

Parte de la skill de **Crea con LuisPa** para shorts que se ven **reales**: piel, heridas, puntadas, cuerpo humano.
Es 3D de verdad, renderizado en Blender (Cycles) con un script de Python, sin abrir la ventana y sin generadores de video con IA.

Ejemplos completos que vienen aquí:
- **Puntadas en el brazo** (`blender/puntadas_brazo/`, 9 s): una persona escaneada camina en su lugar sobre fondo azul. La cámara entra al antebrazo, un hilo cose la herida de arriba abajo, la cámara sale y sube al hombro.
- **Puntadas en la pierna** (`blender/puntadas_pierna/`, 31 s): pantorrilla caminando vista por detrás. El hilo cose en espiral, unas tijeras lo cortan y la cámara se acerca a la curación (hinchazón, capa amarilla, tejido rojo nuevo y cicatriz). Luego se quitan los puntos y la cámara se aleja hasta ver las piernas caminando.

## Lo que necesitas
- Blender 5.x. Las pruebas se hicieron con 5.2 en una Mac con GPU (Metal).
- Python 3 con `opencv-python` y `numpy` (para medir la cámara), y ffmpeg.
- Los recursos de `recursos/FUENTES.md`. Corre `recursos/bajar_recursos.sh`; a Nathan lo bajas a mano.

La selección de Cycles intenta Metal en Mac y OptiX, CUDA, HIP o OneAPI en otros sistemas, según los dispositivos que Blender detecte; si no encuentra GPU compatible, usa CPU y lo informa. La implementación se probó con dispositivos simulados, no con todas las tarjetas o versiones de Windows. Los scripts `render.sh` de ejemplo son para macOS/Linux: en Windows Claude debe preparar y probar un lanzador `.bat` adaptado al proyecto, como indica `SKILL.md`.

## Cómo se usa
```bash
cd realista/blender/puntadas_brazo
blender -b --python-exit-code 1 -P escena.py -- --foto 100,150   # fotos sueltas en fotos/ para revisar
blender -b --python-exit-code 1 -P escena.py -- --rapido --foto 100   # 25 % y 8 muestras: solo encuadre
BLENDER=/ruta/a/Blender ./render.sh                                # todos los cuadros → MP4
```
`--guardar` deja el `.blend` para abrirlo y mirar. La pierna tiene además `--desde N`, para retomar un render que se cortó.

## Proceso (pídeselo a Claude en este orden)
1. **Referencia primero.** Si recreas un short que ya existe, sácale cuadros a 4 por segundo y escribe una tabla:
   segundo → qué pasa → cuadro nuestro (a 30 fps). Así nada se inventa.
2. **Mide su cámara a 30 fps** con `herramientas/camara_fase.py <video o carpeta de cuadros> <salida.json>`.
   Compara cada cuadro con el anterior por correlación de fase en 9 bloques, y saca zoom, paneo y qué tan seguido se queda quieta.
   Luego pasa esa curva a un JSON por cuadro (ejemplo: `herramientas/curva_camara_ejemplo.py`). `escena.py` lo lee tal cual.
   **La cámara nunca se queda quieta.** Si la medida da tramos quietos de más de ~7 cuadros, agrega una deriva chiquita (0.3–0.8 px por cuadro).
3. **Arma la escena en código** (`escena.py`): persona, piel, herida, hilo, vello, luz, fondo y cámara.
4. **Fotos sueltas antes de renderizar todo.** Revisa 3–4 cuadros clave contra la referencia, lado a lado. Corrige y repite.
5. **Render de prueba** a la mitad de resolución (540x960, 64 muestras + denoise). El final va a 1080x1920.

## Las piezas (cómo se ve real)
- **Persona.** Para el brazo, un escaneo (Nathan de RenderPeople) caminando, pero casi congelado (velocidad 0.02): el brazo cuelga y se mece apenas.
  Para la pierna, MPFB (hombre joven, short gris, tenis blancos), con la caminata hecha a mano en el esqueleto.
- **Piel.** Usa la textura del modelo (color, brillo, normales) más subsuperficie (SSS ~0.25).
  La piel de MPFB se ve de videojuego. Hazla propia: su textura, un poco más morena, con poros (Voronoi + ruido) y manchitas.
- **Herida.** Es una copia de los mismos triángulos de la piel, 0.25 mm arriba y con el mismo esqueleto, así que nunca se despega.
  La forma de ojal va en el material, con una «abertura» que se anima.
  - Bordes irregulares: dientes en la orilla y ancho que cambia a lo largo, con manchas oscuras.
  - Adentro va esponja escaneada teñida de carne, con capa brillante de mojado.
  - Profundidad: relieve en V (fondo oscuro, paredes que agarran luz) y labios hinchados con desplazamiento de verdad (subdivisión 3, `displacement_method='BOTH'`).
- **Hilo.** Es un tubo continuo de 0.42 mm de radio, y el material esconde lo que falta por coser (así «se dibuja solo»).
  Arriba cruza en diagonal; por abajo regresa a 4.5–7 mm dentro de la piel.
  Cada punto del hilo copia los pesos de la piel más cercana, así se mueve con el cuerpo.
- **Vello.** Son pelos propios en metros reales: de 3 a 7.5 mm, acostados hacia la muñeca y pegados a la piel igual que el hilo, y ninguno dentro del corte.
  En el brazo van 2,600 y en la pierna 9,000.
- **Luz y fondo.** La luz principal va arriba a la izquierda, cálida, con contraluz fría a la derecha.
  El fondo es azul liso (la cámara ve el azul y la escena recibe una luz azul suave: `fondo_azul()` en `comun.py`).
  Desenfoque de movimiento 0.5. Transformación de color «Khronos PBR Neutral».

## Errores que ya salieron (no los repitas)
1. **El FBX de RenderPeople trae escala 0.01 y rotación**, así que las colas de los huesos no sirven. Usa la cabeza de `hand_r` como muñeca.
2. **`bm.transform()` no recalcula normales.** Sin `bm.normal_update()`, lo que va «debajo de la piel» se desliza encima y salen rulos.
3. **Un hilo pegado a un solo hueso flota**, porque la piel mezcla dos huesos. Copia los pesos de la piel.
4. **Las piezas pegadas a un hueso viven en coordenadas de reposo** (pose en T). Pasa las direcciones de cámara a reposo.
5. **Pelo de partículas con escala 0.01 sale de 3–5 cm.** Haz pelos propios en metros.
6. **MPFB trae «mallas guía» alrededor de las piernas** que estorban al rayo que pega el hilo a la piel. Bórralas y subdivide 2 veces.
7. **Una herida 1.5 mm abajo de la piel no se ve.** Déjala a −0.2 mm.

## Que el render no tarde horas
- **Cycles en GPU** (Metal en Mac, CUDA/OptiX en PC) con todos los dispositivos prendidos (`render_vertical()` en `comun.py`).
- **64 muestras + denoise** se ven limpias en piel. Más muestras casi no cambian nada y tardan el doble.
- **Mide antes de renderizar todo.** Renderiza 3 cuadros, toma el tiempo de cada uno y multiplica. Si un cuadro tarda mucho, pídele a Claude que busque qué se lo come.
  - Lo más caro casi siempre son los volúmenes (neblina, nubes, humo) y las luces que se multiplican.
  - Un volumen que también cuenta como luz obliga a revisar todo otra vez en cada cuadro.
- **Dos Blender a la vez**, cada uno con la mitad de los cuadros, si tu GPU aguanta.
- **Si se corta**, retoma desde el último cuadro (`--desde N`) en vez de empezar de cero.
