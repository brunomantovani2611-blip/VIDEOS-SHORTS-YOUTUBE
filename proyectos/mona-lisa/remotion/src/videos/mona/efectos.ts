// Efectos 2D de caricatura para la Mona Lisa, dibujados con la Pen de toon.ts (planos, contorno de tinta).
import { Pen, INK } from "./toon";

type P2 = [number, number];
const G = (p: Pen) => (p as unknown as { g: CanvasRenderingContext2D }).g;
const FONT = '"DejaVu Sans", Arial, sans-serif';
const text = (p: Pen, s: string, x: number, y: number, size: number, col = INK, weight = 900, stroke = 0) => {
  const g = G(p); g.save(); g.font = `${weight} ${size}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
  if (stroke) { g.lineWidth = stroke; g.strokeStyle = INK; g.lineJoin = "round"; g.strokeText(s, x, y); }
  g.fillStyle = col; g.fillText(s, x, y); g.restore();
};
/** silueta de la torre (para carteles y periódico) dentro de la caja x0..x1, y0..y1 */
const torre = (p: Pen, cx: number, top: number, base: number, w: number, col = "#86643f") => {
  const h = base - top;
  p.poly([[cx, top], [cx + w * 0.1, top + h * 0.45], [cx + w * 0.5, base], [cx + w * 0.3, base], [cx, top + h * 0.72], [cx - w * 0.3, base], [cx - w * 0.5, base], [cx - w * 0.1, top + h * 0.45]], col, 5);
  p.poly([[cx - w * 0.16, top + h * 0.45], [cx + w * 0.16, top + h * 0.45], [cx + w * 0.17, top + h * 0.5], [cx - w * 0.17, top + h * 0.5]], col, 4);
  p.poly([[cx - w * 0.34, top + h * 0.72], [cx + w * 0.34, top + h * 0.72], [cx + w * 0.36, top + h * 0.77], [cx - w * 0.36, top + h * 0.77]], col, 4);
};

/** periódico (lienzo 520 x 400) con el titular del robo y el marco vacío */
export const fxPeriodico = (p: Pen) => {
  p.poly([[8, 10], [512, 4], [514, 392], [6, 396]], "#f3ecdc", 8);
  text(p, "LE PETIT PARISIEN", 260, 44, 38, INK, 900);
  G(p).fillStyle = INK; G(p).fillRect(30, 72, 460, 6);
  text(p, "¡ROBADA", 170, 125, 50, "#b2302a", 900);
  text(p, "LA MONA LISA!", 190, 178, 44, "#b2302a", 900);
  p.poly([[340, 210], [470, 210], [470, 370], [340, 370]], "#d8b04a", 7);
  p.poly([[360, 230], [450, 230], [450, 350], [360, 350]], "#f3ecdc", 5);
  text(p, "?", 405, 292, 70, INK, 900);
  for (let y = 225; y < 370; y += 22) p.stroke([[30, y], [310, y]], 7, "#b9b0a0");
};
/** brillo del cristal (lienzo 260 x 260), t 0..1 */
export const fxBrillo = (p: Pen, t: number) => {
  const k = Math.sin(Math.PI * Math.min(1, t));
  const r = 30 + 90 * k;
  p.poly([[130, 130 - r], [142, 118], [130 + r, 130], [142, 142], [130, 130 + r], [118, 142], [130 - r, 130], [118, 118]], "#ffffff", 5);
};
/** lupa del marchante (lienzo 240 x 320) */
export const fxLupa = (p: Pen) => {
  p.stroke([[150, 190], [215, 300]], 30, "#6a3a26");
  p.ell(110, 110, 88, 88, "rgba(200,230,255,0.55)", 12);
  p.ell(85, 80, 22, 14, "rgba(255,255,255,0.8)", 0);
};
/** cartel de CERRADO (lienzo 420 x 200) */
export const fxCerrado = (p: Pen) => {
  p.poly([[10, 20], [410, 10], [414, 184], [6, 190]], "#f6ecd2", 9);
  text(p, "FERMÉ", 210, 100, 96, "#c62f35", 900, 12);
};
/** flash de cámara (lienzo 300 x 300), t 0..1 */
export const fxFlash = (p: Pen, t: number) => {
  const k = 1 - t, r = 40 + 100 * t;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    p.stroke([[150 + 30 * Math.cos(a), 150 + 30 * Math.sin(a)], [150 + r * Math.cos(a), 150 + r * Math.sin(a)]], 10 * k + 2, "#fff6c8");
  }
  p.ell(150, 150, 34 * k + 6, 34 * k + 6, "#ffffff", 0);
};
/** teléfono móvil en alto (lienzo 140 x 240) */
export const fxMovil = (p: Pen) => {
  p.poly([[14, 10], [126, 10], [126, 230], [14, 230]], "#2a2730", 7);
  p.poly([[26, 26], [114, 26], [114, 206], [26, 206]], "#8fc3e6", 0);
  p.poly([[46, 60], [94, 60], [94, 170], [46, 170]], "#5b6e4a", 3);
  p.ell(70, 95, 14, 18, "#ecc79a", 3);
};
/** signo de interrogación de tinta (lienzo 160 x 220) */
export const fxPregunta = (p: Pen) => {
  const g = G(p);
  g.save(); g.font = "900 200px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.lineWidth = 14; g.strokeStyle = INK; g.strokeText("?", 80, 112); g.fillStyle = "#ffd34d"; g.fillText("?", 80, 112); g.restore();
};
/** gotas de sudor (lienzo 220 x 160), t = fase 0..1 */
export const fxSudor = (p: Pen, t: number) => {
  for (const [x, y, s, d] of [[40, 70, 1, 0], [180, 50, 0.8, 0.4]] as const) {
    const u = (t + d) % 1, yy = y + 70 * u * u;
    if (u > 0.9) continue;
    const r = 13 * s;
    p.poly([[x, yy - 2.2 * r], [x + r, yy], [x, yy + r], [x - r, yy]], "#9fd4f2", 4);
    p.ell(x, yy + 0.1 * r, r, r, "#9fd4f2", 4, 0, 180);
  }
};
void ({} as P2); void torre;
