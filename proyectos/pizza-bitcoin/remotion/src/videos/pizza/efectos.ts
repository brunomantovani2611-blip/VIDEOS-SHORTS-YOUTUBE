// Efectos 2D de caricatura para las pizzas de Bitcoin, dibujados con la Pen de toon.ts (planos, contorno de tinta).
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

const BTC = "#f2a900";
/** moneda de bitcoin (lienzo 220 x 220), t 0..1 = giro */
export const fxBitcoin = (p: Pen, t = 0) => {
  const sx = Math.max(0.2, Math.abs(Math.cos(t * Math.PI * 2)));
  p.ell(110, 110, 92 * sx, 92, BTC, 9);
  p.ell(110, 110, 70 * sx, 70, null, 5);
  if (sx > 0.5) text(p, "B", 110, 116, 96, "#ffffff", 900, 10);
};
/** montaña de monedas (lienzo 420 x 300) */
export const fxMonton = (p: Pen) => {
  const rows = [[60, 360, 250], [100, 320, 200], [140, 280, 150], [180, 240, 100]];
  rows.forEach(([x0, x1, y]) => { for (let x = x0; x <= x1; x += 40) { p.ell(x, y, 34, 22, BTC, 6); p.ell(x, y - 4, 22, 12, "#ffcf4a", 0); } });
  text(p, "10.000", 210, 40, 46, INK, 900);
};
/** etiqueta de precio colgando (lienzo 520 x 260) */
export const fxPrecio = (p: Pen, label: string) => {
  p.poly([[60, 30], [500, 30], [500, 230], [60, 230], [10, 130]], "#fbf7ee", 9);
  p.ell(60, 130, 14, 14, "#c9c0b0", 5);
  text(p, label, 285, 132, label.length > 9 ? 64 : 84, "#2f7a3a", 900);
};
/** mensaje del foro en la pantalla (lienzo 640 x 440); k 0..1 = cuánto se ha escrito */
export const fxForo = (p: Pen, k: number) => {
  p.poly([[0, 0], [640, 0], [640, 440], [0, 440]], "#eef2f7", 0);
  G(p).fillStyle = "#3f6fb5"; G(p).fillRect(0, 0, 640, 60);
  text(p, "FORO DE BITCOIN", 320, 32, 32, "#ffffff", 900);
  const lines = ["Pago 10.000 bitcoins", "a quien me traiga", "dos pizzas grandes."];
  const total = lines.join("").length; let left = Math.floor(total * k);
  const g = G(p); g.save(); g.font = `800 46px ${FONT}`; g.fillStyle = INK; g.textAlign = "left"; g.textBaseline = "middle";
  lines.forEach((l, i) => { const s = l.slice(0, Math.max(0, left)); left -= l.length; g.fillText(s, 36, 140 + i * 82); });
  g.restore();
};
/** porción de pizza (lienzo 240 x 280) */
export const fxPorcion = (p: Pen) => {
  p.poly([[20, 40], [220, 40], [120, 270]], "#f6d36b", 8);
  p.poly([[14, 20], [226, 20], [222, 56], [18, 56]], "#d89a4a", 8);
  for (const [x, y] of [[80, 90], [150, 100], [118, 160], [100, 215]]) p.ell(x, y, 18, 16, "#c6363c", 4);
};
/** teléfono móvil de 2010 (lienzo 140 x 240) */
export const fxTelefono = (p: Pen) => {
  p.poly([[14, 10], [126, 10], [126, 230], [14, 230]], "#2a2730", 7);
  p.poly([[26, 30], [114, 30], [114, 150], [26, 150]], "#8fc3e6", 0);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) p.ell(42 + c * 28, 170 + r * 20, 9, 6, "#c9ccd6", 0);
};
/** gráfica que sube (lienzo 600 x 600); k 0..1 = hasta dónde llega la línea */
export const fxGrafica = (p: Pen, k: number) => {
  p.poly([[10, 10], [590, 10], [590, 590], [10, 590]], "#fbf7ee", 10);
  const g = G(p); g.strokeStyle = "#c9c0b0"; g.lineWidth = 4;
  for (let y = 100; y < 560; y += 90) { g.beginPath(); g.moveTo(60, y); g.lineTo(560, y); g.stroke(); }
  p.stroke([[60, 540], [560, 540]], 8); p.stroke([[60, 540], [60, 60]], 8);
  const pts: [number, number][] = [];
  const n = 60, m = Math.max(2, Math.floor(n * k));
  for (let i = 0; i <= m; i++) {
    const u = i / n, x = 60 + 500 * u;
    const y = 530 - 460 * Math.pow(u, 3.2) - 18 * Math.sin(u * 40) * u;
    pts.push([x, Math.max(60, y)]);
  }
  p.stroke(pts, 14, "#2f9a4a");
  const [lx, ly] = pts[pts.length - 1];
  p.ell(lx, ly, 18, 18, "#2f9a4a", 6);
  text(p, "2010", 90, 570, 30, INK, 800); text(p, "2024", 530, 570, 30, INK, 800);
};
/** hoja de calendario (lienzo 420 x 460) */
export const fxCalendario = (p: Pen) => {
  p.poly([[20, 40], [400, 40], [400, 440], [20, 440]], "#fbf7ee", 10);
  p.poly([[20, 40], [400, 40], [400, 140], [20, 140]], "#c6363c", 10);
  text(p, "MAYO", 210, 92, 64, "#ffffff", 900);
  text(p, "22", 210, 290, 190, INK, 900);
  for (const x of [110, 310]) p.ell(x, 40, 16, 24, "#9aa8b8", 6);
};
/** confeti (lienzo 400 x 400), t 0..1 */
export const fxConfeti = (p: Pen, t: number) => {
  const cols = ["#e2453c", "#f2a900", "#3f9a8a", "#5a8fc2", "#c25a7a"];
  for (let i = 0; i < 26; i++) {
    const x = (i * 97) % 400, y = ((i * 53) % 200) + t * 220, a = i + t * 8;
    const c = Math.cos(a), s = Math.sin(a);
    p.poly([[x - 12 * c, y - 12 * s], [x + 12 * c, y + 12 * s], [x + 12 * c + 6 * s, y + 12 * s - 6 * c], [x - 12 * c + 6 * s, y - 12 * s - 6 * c]], cols[i % 5], 0);
  }
};
/** reloj de pared que corre (lienzo 240 x 240), t 0..1 */
export const fxReloj = (p: Pen, t: number) => {
  p.ell(120, 120, 100, 100, "#fbf7ee", 10);
  const a = t * Math.PI * 2 * 6 - Math.PI / 2, b = t * Math.PI * 2 - Math.PI / 2;
  p.stroke([[120, 120], [120 + 70 * Math.cos(a), 120 + 70 * Math.sin(a)]], 9);
  p.stroke([[120, 120], [120 + 45 * Math.cos(b), 120 + 45 * Math.sin(b)]], 12);
};
/** visto bueno (lienzo 240 x 240) */
export const fxVisto = (p: Pen) => {
  p.ell(120, 120, 104, 104, "#3f9a4a", 9);
  p.stroke([[66, 124], [106, 164], [178, 80]], 26, "#ffffff");
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
