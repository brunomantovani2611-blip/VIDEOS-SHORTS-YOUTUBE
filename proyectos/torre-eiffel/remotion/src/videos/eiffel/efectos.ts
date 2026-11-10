// Efectos 2D de caricatura para la Torre Eiffel, dibujados con la Pen de toon.ts (planos, contorno de tinta).
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

/** cartel de SE VENDE (lienzo 600 x 420) */
export const fxSeVende = (p: Pen) => {
  p.poly([[14, 20], [586, 12], [590, 404], [10, 410]], "#f6ecd2", 12);
  text(p, "SE VENDE", 300, 120, 110, "#d42f2f", 900, 14);
  torre(p, 300, 190, 380, 150);
  text(p, "¡GANGA!", 470, 330, 44, INK, 900);
};
/** periódico (lienzo 520 x 400): cabecera inventada, titular y la torre con manchas de óxido */
export const fxPeriodico = (p: Pen) => {
  p.poly([[8, 10], [512, 4], [514, 392], [6, 396]], "#f3ecdc", 8);
  text(p, "LE PETIT PARISIEN", 260, 44, 38, INK, 900);
  G(p).fillStyle = INK; G(p).fillRect(30, 72, 460, 6);
  text(p, "¿LA TORRE,", 170, 120, 46, "#b2302a", 900);
  text(p, "EN RUINAS?", 170, 172, 46, "#b2302a", 900);
  torre(p, 400, 100, 360, 140);
  for (const [x, y] of [[392, 200], [420, 260], [370, 300], [430, 330], [405, 150]]) p.ell(x, y, 9, 7, "#d2662b", 0);
  for (let y = 220; y < 370; y += 22) p.stroke([[30, y], [300, y]], 7, "#b9b0a0");
};
/** bombilla de la idea (lienzo 260 x 340), t 0..1 = brillo */
export const fxBombilla = (p: Pen, t: number) => {
  const k = Math.min(1, t * 2);
  for (let i = 0; i < 9; i++) {
    const a = ((i * 40 - 160) * Math.PI) / 180, r0 = 110, r1 = 110 + 40 * k;
    if (k > 0.2) p.stroke([[130 + r0 * Math.cos(a), 140 + r0 * Math.sin(a)], [130 + r1 * Math.cos(a), 140 + r1 * Math.sin(a)]], 12, "#ffd34d");
  }
  p.ell(130, 140, 80, 82, k > 0.3 ? "#fff3a0" : "#f4f1ea", 9);
  p.poly([[96, 210], [164, 210], [158, 262], [102, 262]], "#a8a8b0", 8);
  p.stroke([[104, 230], [156, 230]], 6); p.stroke([[106, 248], [154, 248]], 6);
};
/** papel oficial con membrete (lienzo 360 x 480); stamped = lleva el sello rojo */
export const fxPapel = (p: Pen, stamped: number) => {
  p.poly([[8, 8], [352, 8], [352, 472], [8, 472]], "#fbf7ee", 7);
  text(p, "RÉPUBLIQUE FRANÇAISE", 180, 50, 24, "#1f3f8c", 900);
  text(p, "Ministère des Postes", 180, 84, 22, INK, 700);
  text(p, "et Télégraphes", 180, 110, 22, INK, 700);
  for (let y = 160; y < 400; y += 26) p.stroke([[40, y], [y > 360 ? 200 : 320, y]], 6, "#c9c0b0");
  if (stamped > 0) {
    const g = G(p); g.save(); g.globalAlpha = Math.min(1, stamped); g.translate(250, 400); g.rotate(-0.25);
    g.strokeStyle = "#c62f35"; g.lineWidth = 9; g.beginPath(); g.ellipse(0, 0, 88, 52, 0, 0, 7); g.stroke();
    g.font = `900 34px ${FONT}`; g.fillStyle = "#c62f35"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("OFICIAL", 0, 2); g.restore();
  }
};
/** sello de goma (lienzo 200 x 260) */
export const fxSello = (p: Pen) => {
  p.ell(100, 50, 42, 42, "#6a3a26", 8);
  p.poly([[86, 80], [114, 80], [118, 170], [82, 170]], "#6a3a26", 8);
  p.poly([[40, 170], [160, 170], [164, 230], [36, 230]], "#3a3640", 8);
  p.poly([[44, 230], [156, 230], [156, 248], [44, 248]], "#c62f35", 6);
};
/** viga de hierro que cae (lienzo 360 x 120) */
export const fxViga = (p: Pen) => {
  p.poly([[10, 20], [350, 20], [350, 100], [10, 100]], "#86643f", 8);
  for (let x = 30; x < 340; x += 60) { p.stroke([[x, 26], [x + 50, 94]], 6, "#5f4428"); p.stroke([[x + 50, 26], [x, 94]], 6, "#5f4428"); }
  for (let x = 40; x < 340; x += 60) p.dot(x, 60, 5, "#5f4428");
};
/** anzuelo con el contrato colgando (lienzo 240 x 600) */
export const fxAnzuelo = (p: Pen) => {
  p.stroke([[120, 0], [120, 330]], 5, "#5a5660");
  const g = G(p); g.save(); g.strokeStyle = INK; g.lineWidth = 22; g.lineCap = "round";
  g.beginPath(); g.moveTo(120, 320); g.lineTo(120, 420); g.arc(90, 420, 30, 0, Math.PI, false); g.lineTo(60, 395); g.stroke();
  g.strokeStyle = "#c9ccd6"; g.lineWidth = 12; g.beginPath(); g.moveTo(120, 320); g.lineTo(120, 420); g.arc(90, 420, 30, 0, Math.PI, false); g.lineTo(60, 395); g.stroke(); g.restore();
  p.poly([[60, 440], [210, 440], [210, 590], [60, 590]], "#fbf7ee", 7);
  text(p, "CONTRATO", 135, 470, 22, INK, 900);
  torre(p, 135, 490, 575, 60);
};
/** moneda de franco que gira (lienzo 220 x 220), t 0..1 */
export const fxMoneda = (p: Pen, t: number) => {
  const sx = Math.max(0.15, Math.abs(Math.cos(t * Math.PI * 2)));
  p.ell(110, 110, 90 * sx, 90, "#f2c230", 9);
  p.ell(110, 110, 66 * sx, 66, null, 5);
  if (sx > 0.5) text(p, "F", 110, 114, 80, "#a57a12", 900);
};
/** billete de 100 francos (lienzo 360 x 190); falso = con «FALSO» cruzado */
export const fxBillete = (p: Pen, falso = 0) => {
  p.poly([[6, 6], [354, 6], [354, 184], [6, 184]], "#cfe3c0", 6);
  p.poly([[24, 24], [336, 24], [336, 166], [24, 166]], null, 4);
  p.ell(180, 95, 46, 52, "#e9f1df", 4);
  text(p, "100", 70, 60, 40, "#3d6b3a", 900);
  text(p, "100", 290, 132, 40, "#3d6b3a", 900);
  text(p, "F", 180, 98, 54, "#3d6b3a", 900);
  if (falso) { const g = G(p); g.save(); g.translate(180, 95); g.rotate(-0.3); g.font = `900 64px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
    g.lineWidth = 12; g.strokeStyle = "#fbf7ee"; g.strokeText("FALSO", 0, 0); g.fillStyle = "#c62f35"; g.fillText("FALSO", 0, 0); g.restore(); }
};
/** sobre gordo de billetes (lienzo 400 x 260) */
export const fxSobre = (p: Pen, label: string) => {
  p.poly([[40, 30], [120, 6], [90, 60]], "#cfe3c0", 5);
  p.poly([[150, 26], [240, 0], [220, 56]], "#cfe3c0", 5);
  p.poly([[10, 40], [390, 40], [384, 250], [16, 254]], "#e8d3a6", 8);
  p.poly([[10, 40], [200, 150], [390, 40]], "#dcc28e", 7);
  text(p, label, 200, 210, 34, INK, 900);
};
/** cartel de carretera esmaltado (lienzo 520 x 200) */
export const fxViena = (p: Pen) => {
  p.poly([[10, 20], [420, 20], [510, 100], [420, 180], [10, 180]], "#1f4e9a", 10);
  p.poly([[28, 38], [410, 38], [482, 100], [410, 162], [28, 162]], null, 5);
  G(p).strokeStyle = "#f4f1ea";
  text(p, "VIENA", 220, 102, 80, "#f4f1ea", 900);
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
/** rubor de vergüenza (lienzo 300 x 120): dos manchas rosas con rayitas */
export const fxRubor = (p: Pen) => {
  for (const x of [70, 230]) {
    p.ell(x, 60, 50, 30, "rgba(232,92,110,0.75)", 0);
    for (const dx of [-20, 0, 20]) p.stroke([[x + dx - 6, 72], [x + dx + 6, 48]], 5, "#c23a52");
  }
};
void ({} as P2);
