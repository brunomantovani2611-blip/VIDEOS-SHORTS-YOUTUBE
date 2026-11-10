#!/bin/bash
# Baja los recursos libres que usan los shorts realistas. Fuente y licencia de cada uno en FUENTES.md.
# Nathan (RenderPeople) NO se puede redistribuir ni bajar por script: ver FUENTES.md.
# MPFB (extensión de Blender) se instala desde Blender: Edit > Preferences > Get Extensions > «MPFB».
cd "$(dirname "$0")"
get(){ [ -s "$2" ] && { echo "ya: $2"; return; }; mkdir -p "$(dirname "$2")"
  curl -m 1800 -sSL --retry 3 -A "Mozilla/5.0" -o "$2.part" "$1" && mv "$2.part" "$2" && echo "ok: $2" || echo "FALLO: $1"; }
while read -r name url; do get "$url" "mpfb/packs/$(basename $url)"; done < mpfb/urls_packs.txt
for s in Sponge001 Sponge002 Sponge003; do get "https://ambientcg.com/get?file=${s}_2K-JPG.zip" ambientcg/${s}_2K-JPG.zip; done
( cd ambientcg && for z in *.zip; do d="${z%_2K-JPG.zip}"; [ -d "$d" ] || unzip -q -o "$z" -d "$d"; done )
echo "terminado $(date)"
