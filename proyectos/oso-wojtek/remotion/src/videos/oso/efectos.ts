// Efectos 2D de caricatura para el oso Wojtek, dibujados con la Pen de toon.ts (planos, contorno de tinta).
import { Pen, INK } from "./toon";
import { cabeza, osoSide, proyectil } from "./wojtek";

type P2 = [number, number];
const G = (p: Pen) => p.g;
const FONT = '"DejaVu Sans", Arial, sans-serif';
const text = (p: Pen, s: string, x: number, y: number, size: number, col = INK, weight = 900, stroke = 0) => {
  const g = G(p); g.save(); g.font = `${weight} ${size}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
  if (stroke) { g.lineWidth = stroke; g.strokeStyle = INK; g.lineJoin = "round"; g.strokeText(s, x, y); }
  g.fillStyle = col; g.fillText(s, x, y); g.restore();
};

/** saco de arpillera con el osezno asomando (lienzo 360 x 420); peek 0..1 = cuánto asoma la cabeza */
export const fxSaco = (p: Pen, peek: number) => {
  const y = 250 - 120 * peek;
  if (peek > 0.02) G(p).save(), p.clip([[0, 0], [360, 0], [360, 214], [0, 214]], () => cabeza(p, 180, y, 0.62, { expr: peek > 0.8 ? "smile" : "neutral" })), G(p).restore();
  p.poly([[70, 200], [290, 200], [330, 330], [300, 400], [60, 400], [30, 330]], "#c9a66a", 10);
  p.poly([[60, 186], [300, 186], [306, 218], [54, 218]], "#b8925a", 9);
  for (const x of [110, 170, 230]) p.stroke([[x, 240], [x - 8, 380]], 4, "rgba(80,50,20,.35)");
};
/** tableta de chocolate (lienzo 260 x 180) */
export const fxChocolate = (p: Pen) => {
  p.poly([[20, 30], [240, 30], [240, 150], [20, 150]], "#6a3a22", 9);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) p.poly([[34 + i * 52, 44 + j * 52], [76 + i * 52, 44 + j * 52], [76 + i * 52, 86 + j * 52], [34 + i * 52, 86 + j * 52]], "#7e4a2c", 4);
  p.poly([[20, 100], [160, 30], [240, 30], [240, 150], [20, 150]], "#c6363c", 9);
  text(p, "CHOC", 150, 110, 40, "#ffffff", 900);
};
/** lata de carne (lienzo 220 x 200) */
export const fxLata = (p: Pen) => {
  p.poly([[30, 50], [190, 50], [190, 170], [30, 170]], "#b8bcc6", 9);
  p.ell(110, 50, 80, 22, "#d6dae2", 9);
  p.poly([[30, 84], [190, 84], [190, 140], [30, 140]], "#c6363c", 6);
  text(p, "CARNE", 110, 113, 34, "#ffffff", 900);
};
/** navaja (lienzo 300 x 140) */
export const fxNavaja = (p: Pen) => {
  p.poly([[30, 60], [170, 60], [180, 70], [180, 100], [30, 100]], "#c6363c", 9);
  p.poly([[170, 64], [280, 50], [270, 84], [178, 92]], "#d9dde4", 8);
  p.ell(60, 80, 12, 12, "#ffffff", 4);
};
/** cartel de madera con un nombre (lienzo 520 x 220) */
export const fxNombre = (p: Pen, s: string) => {
  p.poly([[20, 30], [500, 18], [508, 190], [14, 200]], "#d9b37a", 10);
  for (const y of [70, 130]) p.stroke([[30, y], [496, y - 6]], 4, "rgba(120,80,40,.3)");
  text(p, s, 262, 112, 104, "#5a3418", 900);
};
/** chorro de la ducha (lienzo 300 x 500), t = fase */
export const fxAgua = (p: Pen, t: number) => {
  G(p).save(); G(p).globalAlpha = 0.55;
  for (let i = 0; i < 9; i++) { const x = 70 + i * 20 + 6 * Math.sin(t * 20 + i); p.stroke([[150 + (x - 150) * 0.3, 0], [x, 500]], 6, "#cfeaff"); }
  G(p).restore();
  for (let i = 0; i < 30; i++) {
    const x = 40 + ((i * 53) % 220), y = ((i * 97 + t * 900) % 520) - 20, r = 11;
    p.poly([[x, y - 2.4 * r], [x + r, y], [x, y + r], [x - r, y]], "#9fd4f2", 4);
  }
};
/** cartel «NO SE ADMITEN ANIMALES» (lienzo 560 x 520) */
export const fxNoAnimales = (p: Pen) => {
  p.poly([[20, 20], [540, 20], [540, 500], [20, 500]], "#fbf7ee", 12);
  text(p, "NO SE ADMITEN", 280, 80, 52, "#c6363c", 900);
  text(p, "ANIMALES", 280, 140, 66, "#c6363c", 900);
  G(p).save(); G(p).translate(150, 210); G(p).scale(0.42, 0.28); cabeza(p, 300, 300, 1, { expr: "neutral" }); G(p).restore();
  p.ell(280, 340, 120, 120, null, 0);
  G(p).save(); G(p).beginPath(); G(p).arc(280, 340, 120, 0, 7); G(p).lineWidth = 26; G(p).strokeStyle = "#c6363c"; G(p).stroke();
  G(p).beginPath(); G(p).moveTo(195, 255); G(p).lineTo(365, 425); G(p).stroke(); G(p).restore();
};
/** hoja de alistamiento (lienzo 400 x 520); stamped = lleva el sello */
export const fxAlta = (p: Pen, stamped: boolean) => {
  p.poly([[20, 20], [380, 20], [380, 500], [20, 500]], "#fbf7ee", 10);
  p.poly([[20, 20], [380, 20], [380, 70], [20, 70]], "#ffffff", 0);
  p.poly([[20, 70], [380, 70], [380, 120], [20, 120]], "#c6363c", 0);
  p.poly([[20, 20], [380, 20], [380, 500], [20, 500]], null, 10);
  text(p, "ALTA", 200, 170, 54, INK, 900);
  text(p, "Soldado:", 200, 240, 34, "#5a5a6a", 700);
  text(p, "WOJTEK", 200, 290, 56, INK, 900);
  for (const y of [350, 380]) p.stroke([[60, y], [340, y]], 5, "#c9c0b0");
  if (stamped) {
    G(p).save(); G(p).translate(220, 430); G(p).rotate(-0.25);
    G(p).strokeStyle = "#c6363c"; G(p).lineWidth = 9; G(p).strokeRect(-120, -42, 240, 84);
    G(p).font = `900 44px ${FONT}`; G(p).textAlign = "center"; G(p).textBaseline = "middle"; G(p).fillStyle = "#c6363c"; G(p).fillText("APTO", 0, 2);
    G(p).restore();
  }
};
/** sello de goma (lienzo 200 x 260) */
export const fxSello = (p: Pen) => {
  p.ell(100, 50, 40, 40, "#6a3a22", 9);
  p.poly([[84, 80], [116, 80], [120, 180], [80, 180]], "#8a5a32", 8);
  p.poly([[30, 180], [170, 180], [170, 230], [30, 230]], "#c6363c", 9);
};
/** ración: pan y lata (lienzo 320 x 220) */
export const fxRacion = (p: Pen) => {
  p.ell(110, 120, 90, 60, "#d99a4a", 9);
  for (const x of [80, 110, 140]) p.stroke([[x - 10, 90], [x + 10, 150]], 6, "#b8782e");
  p.poly([[190, 70], [290, 70], [290, 190], [190, 190]], "#b8bcc6", 9);
  p.ell(240, 70, 50, 14, "#d6dae2", 8);
  p.poly([[190, 110], [290, 110], [290, 150], [190, 150]], "#3f7a4a", 0);
};
/** el emblema de la unidad: un oso que lleva un proyectil (lienzo 520 x 620) — dibujo propio */
export const fxEmblema = (p: Pen) => {
  p.poly([[40, 30], [480, 30], [480, 380], [260, 590], [40, 380]], "#f2ead2", 14);
  p.poly([[60, 50], [460, 50], [460, 372], [260, 562], [60, 372]], null, 5);
  G(p).save(); G(p).translate(84, 64); G(p).scale(0.56, 0.5);
  // silueta: oso de perfil caminando con un proyectil al hombro
  const g = G(p);
  g.save(); g.globalCompositeOperation = "source-over";
  osoSide(p, {}, 0.18);
  g.restore();
  G(p).restore();
  // tapamos la caja con el proyectil
  proyectil(p, 270, 120, 300, -0.12);
};
/** bandera ondeando en un mástil (lienzo 300 x 240): "escocia" (aspa blanca sobre azul) o "polonia" (blanco y rojo) */
export const fxBandera = (p: Pen, kind: "escocia" | "polonia", t: number) => {
  const pts = (y0: number, y1: number): P2[] => {
    const top: P2[] = [], bot: P2[] = [];
    for (let i = 0; i <= 10; i++) { const x = 40 + 24 * i, w = 8 * Math.sin(t * 6 + i * 0.7) * (i / 10); top.push([x, y0 + w]); bot.push([x, y1 + w]); }
    return [...top, ...bot.reverse()];
  };
  p.band([[34, 20], [34, 236]], "#8a6a4a", 10, 4);
  if (kind === "polonia") { p.poly(pts(30, 90), "#f6f3ee", 0); p.poly(pts(90, 150), "#d42a3c", 0); }
  else {
    p.poly(pts(30, 150), "#1f5fae", 0);
    G(p).save(); p.clip(pts(30, 150), () => { p.stroke([[40, 30], [280, 150]], 24, "#ffffff"); p.stroke([[40, 150], [280, 30]], 24, "#ffffff"); }); G(p).restore();
  }
  p.poly(pts(30, 150), null, 7);
};
/** nubecitas de humo (lienzo 300 x 300), t 0..1 */
export const fxHumo = (p: Pen, t: number) => {
  for (let i = 0; i < 5; i++) {
    const a = i * 1.3, r = (40 + 30 * (i % 2)) * (0.5 + 0.7 * t), x = 150 + Math.cos(a) * 50 * t, y = 210 - 120 * t - i * 14;
    p.ell(x, y, r, r * 0.85, `rgba(214,206,196,${(0.9 * (1 - t)).toFixed(3)})`, 0);
  }
};
/** corazones (lienzo 240 x 240), t 0..1 */
export const fxCorazon = (p: Pen, t: number) => {
  for (const [x, y, s] of [[80, 170, 1], [170, 120, 0.8]] as const) {
    const yy = y - 60 * t, r = 28 * s;
    p.poly([[x, yy + r * 1.3], [x - r * 1.2, yy], [x - r * 0.9, yy - r * 0.8], [x, yy - r * 0.3], [x + r * 0.9, yy - r * 0.8], [x + r * 1.2, yy]], "#e2453c", 6);
  }
};
/** signo de interrogación de tinta (lienzo 160 x 220) */
export const fxPregunta = (p: Pen) => {
  const g = G(p);
  g.save(); g.font = "900 200px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.lineWidth = 14; g.strokeStyle = INK; g.strokeText("?", 80, 112); g.fillStyle = "#ffd34d"; g.fillText("?", 80, 112); g.restore();
};
