#!/usr/bin/env bash
# Render por tramos (si uno falla, sólo se repite ese) y unión sin recodificar. Uso: bash herramientas/render_tramos.sh
cd "$(dirname "$0")/.."
mkdir -p out/tramos
TOTAL=1186; PASO=300
for ((a=0; a<TOTAL; a+=PASO)); do
  b=$((a+PASO-1)); [ $b -ge $TOTAL ] && b=$((TOTAL-1))
  f=out/tramos/t_$(printf %04d $a).mp4
  [ -s "$f" ] && { echo "ya: $f"; continue; }
  for intento in 1 2; do
    echo "tramo $a-$b (intento $intento) $(date +%T)"
    npx remotion render src/index.ts Cesar "$f" --frames=$a-$b --codec h264 --crf 18 --concurrency=2 --timeout=240000 --log=error && break
    rm -f "$f"
  done
  [ -s "$f" ] || { echo "FALLO tramo $a-$b"; exit 1; }
done
ls out/tramos/t_*.mp4 | sed "s|out/tramos/|file '|; s|$|'|" > out/tramos/lista.txt
ffmpeg -y -hide_banner -loglevel error -f concat -safe 0 -i out/tramos/lista.txt -c copy out/cesar_mudo.mp4
echo "LISTO $(date +%T)"
