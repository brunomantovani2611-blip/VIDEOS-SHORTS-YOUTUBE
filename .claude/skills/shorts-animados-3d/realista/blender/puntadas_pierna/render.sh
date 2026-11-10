#!/bin/bash
# Render completo de la pierna (930 cuadros = 31 s a 30 fps, 540x960, 64 muestras) y MP4.
# BLENDER = ruta a tu Blender 5.x (en Mac: /Applications/Blender.app/Contents/MacOS/Blender)
cd "$(dirname "$0")" || exit 1
B=${BLENDER:-blender}
mkdir -p cuadros
nice -n 5 "$B" -b --python-exit-code 1 -P escena.py -- --anim > render.log 2>&1
ffmpeg -v error -y -framerate 30 -i cuadros/c_%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 18 puntadas_pierna.mp4
echo LISTO >> render.log
