#!/usr/bin/env bash
# Une el render mudo de Remotion con la mezcla y deja el volumen final a -14 LUFS / -1.5 dBTP (dos pasadas de loudnorm).
# Uso: bash unir.sh   ->  final/pizzas_bitcoin_2010.mp4
set -e
cd "$(dirname "$0")"
python3 audio/sonido.py
mkdir -p final
M=$(ffmpeg -hide_banner -i audio/mezcla.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
mi=$(echo "$M" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_i'])")
mtp=$(echo "$M" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_tp'])")
mlra=$(echo "$M" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_lra'])")
mth=$(echo "$M" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_thresh'])")
ffmpeg -y -hide_banner -loglevel error -i remotion/out/pizza_mudo.mp4 -i audio/mezcla.wav \
  -filter_complex "[1:a]loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$mi:measured_TP=$mtp:measured_LRA=$mlra:measured_thresh=$mth:linear=true,aresample=48000[a]" \
  -map 0:v:0 -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart final/pizzas_bitcoin_2010.mp4
ffmpeg -hide_banner -i final/pizzas_bitcoin_2010.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
