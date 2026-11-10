// Efectos 2D de caricatura para Sarajevo, dibujados con la Pen de toon.ts (planos, contorno de tinta).
import { Pen, INK } from "./toon";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;

/** bomba de mano (lienzo 200 x 200): cuerpo oscuro, mecha encendida con chispa */
export const fxBomba = (p: Pen, t: number) => {
  p.ell(100, 120, 52, 52, "#2b2a31", 8);
  p.ell(82, 102, 14, 10, "#5a5966", 0);
  p.poly([[92, 70], [108, 70], [110, 58], [90, 58]], "#4a4552", 6);
  p.stroke([[100, 58], [108, 40], [122, 32]], 5, "#c9a26a");
  const k = 0.7 + 0.3 * Math.sin(t * 40);
  for (let i = 0; i < 8; i++) {
    const a = rad(i * 45 + t * 300), r = (i % 2 ? 16 : 26) * k;
    p.stroke([[124, 30], [124 + r * Math.cos(a), 30 + r * Math.sin(a)]], 4, i % 2 ? "#ffd34d" : "#ff8a3d");
  }
};

/** gotas de sudor (lienzo 220 x 160), t = fase 0..1 */
export const fxSudor = (p: Pen, t: number) => {
  for (const [x, y, s, d] of [[40, 70, 1, 0], [180, 50, 0.8, 0.4]] as const) {
    const u = (t + d) % 1, yy = y + 70 * u * u, a = u < 0.8 ? 1 : (1 - u) / 0.2;
    if (a <= 0.05) continue;
    const r = 13 * s;
    p.poly([[x, yy - 2.2 * r], [x + r, yy], [x, yy + r], [x - r, yy]], "#9fd4f2", 4);
    p.ell(x, yy + 0.1 * r, r, r, "#9fd4f2", 4, 0, 180);
  }
};

/** paloma volando (lienzo 260 x 160), aleteo 0..1 */
export const fxPaloma = (p: Pen, flap: number) => {
  const w = Math.sin(flap * Math.PI * 2), body = "#c9ccd6", wing = "#aeb2c0";
  const tip = 80 - 70 * w;
  p.poly([[130, 85], [40, tip], [70, 95]], wing, 5);
  p.ell(130, 92, 46, 20, body, 5);
  p.ell(178, 80, 15, 14, body, 5);
  p.poly([[191, 78], [206, 82], [191, 86]], "#e5a14a", 3);
  p.dot(181, 76, 3, INK);
  p.poly([[86, 90], [56, 82], [60, 104]], body, 5);
  p.poly([[130, 85], [220, tip], [175, 95]], wing, 5);
};

/** mapa de papel al revés (lienzo 400 x 300): calles, río y la rosa de los vientos con la N hacia abajo */
export const fxMapa = (p: Pen) => {
  p.poly([[10, 20], [390, 10], [395, 290], [5, 285]], "#f3e6c4", 7);
  p.stroke([[30, 210], [120, 190], [250, 205], [380, 180]], 26, "#8fc3e6");                 // río
  for (const pts of [[[60, 30], [70, 270]], [[200, 20], [190, 280]], [[300, 25], [320, 275]], [[20, 110], [380, 95]]] as P2[][])
    p.stroke(pts, 10, "#c9a26a");
  for (const [x, y] of [[110, 60], [250, 60], [130, 140], [250, 140], [350, 60]]) p.poly([[x - 26, y - 18], [x + 26, y - 18], [x + 26, y + 18], [x - 26, y + 18]], "#e0b48a", 4);
  // rosa de los vientos al revés
  p.ell(340, 240, 30, 30, "#ffffff", 5);
  p.poly([[340, 270], [330, 240], [350, 240]], "#c6363c", 3);
  p.poly([[340, 210], [330, 240], [350, 240]], "#241726", 3);
  const g = (p as unknown as { g: CanvasRenderingContext2D }).g;
  g.save(); g.translate(340, 292); g.rotate(Math.PI); g.fillStyle = "#241726"; g.font = "900 26px sans-serif"; g.textAlign = "center"; g.fillText("N", 0, 0); g.restore();
};

/** signo de interrogación de tinta (lienzo 160 x 220) */
export const fxPregunta = (p: Pen) => {
  const g = (p as unknown as { g: CanvasRenderingContext2D }).g;
  g.save(); g.font = "900 200px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.lineWidth = 14; g.strokeStyle = INK; g.strokeText("?", 80, 112); g.fillStyle = "#ffd34d"; g.fillText("?", 80, 112); g.restore();
};

/** nube de humo de la explosión (lienzo 400 x 400), t 0..1: crece, se oscurece y se deshace */
export const fxHumo = (p: Pen, t: number, seed = 0) => {
  const n = 7, a = Math.max(0, 1 - t) ** 0.8;
  for (let i = 0; i < n; i++) {
    const ang = rad(i * (360 / n) + seed * 37), d = 40 + 110 * t, r = (60 + 20 * ((i + seed) % 3)) * (0.6 + 0.6 * t);
    const c = t < 0.2 ? `rgba(255,200,120,${a.toFixed(3)})` : `rgba(${110 + 40 * (i % 2)},${105 + 40 * (i % 2)},${115 + 40 * (i % 2)},${(0.9 * a).toFixed(3)})`;
    p.ell(200 + d * Math.cos(ang), 230 + d * 0.6 * Math.sin(ang) - 60 * t, r, r * 0.85, c, 0);
  }
};
