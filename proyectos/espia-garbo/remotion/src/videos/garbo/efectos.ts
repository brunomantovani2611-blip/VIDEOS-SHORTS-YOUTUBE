// Efectos 2D de caricatura para Garbo, dibujados con la Pen de toon.ts (planos, contorno de tinta).
import { Pen, INK } from "./toon";
import { FLAG } from "./banderas";

type P2 = [number, number];
const G = (p: Pen) => p.g;
const FONT = '"DejaVu Sans", Arial, sans-serif';
const text = (p: Pen, s: string, x: number, y: number, size: number, col = INK, weight = 900, stroke = 0, rot = 0) => {
  const g = G(p); g.save(); g.translate(x, y); g.rotate(rot); g.font = `${weight} ${size}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
  if (stroke) { g.lineWidth = stroke; g.strokeStyle = INK; g.lineJoin = "round"; g.strokeText(s, 0, 0); }
  g.fillStyle = col; g.fillText(s, 0, 0); g.restore();
};
const sello = (p: Pen, s: string, x: number, y: number, w: number, h: number, rot = -0.2, col = "#d42f2f", size = 0) => {
  const g = G(p); g.save(); g.translate(x, y); g.rotate(rot);
  g.strokeStyle = col; g.lineWidth = Math.max(5, h * 0.09); g.strokeRect(-w / 2, -h / 2, w, h);
  g.font = `900 ${size || h * 0.62}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = col; g.fillText(s, 0, h * 0.04);
  g.restore();
};

/** hojas volando (lienzo 400 x 400), t = fase */
export const fxHojas = (p: Pen, t: number) => {
  for (let i = 0; i < 5; i++) {
    const u = (t + i * 0.2) % 1, x = 200 + 150 * Math.sin(i * 2.1 + u * 3), y = 360 - 330 * u, a = u * 4 + i;
    const c = Math.cos(a) * 34, s = Math.sin(a) * 34;
    p.poly([[x - c + s * 0.7, y - s - c * 0.7], [x + c + s * 0.7, y + s - c * 0.7], [x + c - s * 0.7, y + s + c * 0.7], [x - c - s * 0.7, y - s + c * 0.7]], "#fbf7ee", 5);
    if (i % 2) text(p, "?", x, y, 34, "#d42f2f", 900, 0, a);
  }
};
/** corazón con la bandera británica (lienzo 260 x 240) */
export const fxCorazonUK = (p: Pen) => {
  const h: P2[] = [];
  for (let i = 0; i <= 40; i++) { const t = (i / 40) * Math.PI * 2, x = 16 * Math.sin(t) ** 3, y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)); h.push([130 + x * 7, 115 + y * 7]); }
  G(p).save(); p.clip(h, () => { G(p).save(); G(p).translate(10, 10); FLAG.britania(G(p), 240, 220); G(p).restore(); }); G(p).restore();
  p.poly(h, null, 10);
};
/** sello «NO» (lienzo 360 x 240) */
export const fxNo = (p: Pen) => sello(p, "NO", 180, 120, 300, 180, -0.18);
/** contrato con firma (lienzo 360 x 460); stamped = con sello */
export const fxContrato = (p: Pen, stamped: boolean, label = "CONTRATO") => {
  p.poly([[20, 20], [340, 20], [340, 440], [20, 440]], "#fbf7ee", 9);
  text(p, label, 180, 80, 40, INK, 900);
  for (const y of [140, 175, 210, 245, 280]) p.stroke([[50, y], [310, y]], 6, "#c9c0b0");
  p.stroke([[60, 370], [110, 340], [150, 380], [200, 345], [250, 375], [300, 350]], 6, "#2f4a8a");
  if (stamped) sello(p, "OK", 250, 300, 150, 90, -0.25, "#2f9a4a");
};
/** destino: chincheta sobre un cartel con la ciudad (lienzo 420 x 280); crossed = tachado */
export const fxCiudad = (p: Pen, s: string, crossed: boolean) => {
  p.poly([[20, 60], [400, 60], [400, 240], [20, 240]], "#fbf7ee", 10);
  text(p, s, 210, 152, 72, "#2f4a8a", 900);
  p.ell(210, 46, 22, 22, "#d42f2f", 6); p.stroke([[210, 68], [210, 96]], 6);
  if (crossed) { p.stroke([[40, 230], [380, 70]], 26, "#ffffff"); p.stroke([[40, 230], [380, 70]], 16, "#d42f2f"); }
};
/** guía de viajes (lienzo 300 x 380) */
export const fxGuia = (p: Pen) => {
  p.poly([[30, 20], [270, 20], [270, 360], [30, 360]], "#2f5f9a", 10);
  p.poly([[30, 20], [60, 20], [60, 360], [30, 360]], "#24487a", 0);
  text(p, "GUÍA", 165, 110, 58, "#fbf7ee", 900); text(p, "DE", 165, 170, 36, "#fbf7ee", 800); text(p, "INGLATERRA", 165, 225, 34, "#f2c230", 900);
  p.poly([[30, 20], [270, 20], [270, 360], [30, 360]], null, 10);
};
/** mapa plegado (lienzo 360 x 280) */
export const fxPlano = (p: Pen) => {
  const cols = ["#e8dcb0", "#dccf9e", "#e8dcb0"];
  for (let k = 0; k < 3; k++) p.poly([[20 + k * 107, 30 + (k % 2) * 14], [127 + k * 107, 30 + ((k + 1) % 2) * 14], [127 + k * 107, 250 + ((k + 1) % 2) * 14], [20 + k * 107, 250 + (k % 2) * 14]], cols[k], 7);
  p.stroke([[60, 200], [140, 150], [220, 170], [300, 90]], 8, "#d42f2f");
  p.ell(300, 90, 14, 14, "#d42f2f", 5);
  p.stroke([[40, 100], [120, 80], [200, 110]], 10, "#5aa0c8");
};
/** revista (lienzo 300 x 380) */
export const fxRevista = (p: Pen) => {
  p.poly([[30, 20], [270, 20], [270, 360], [30, 360]], "#d42f2f", 10);
  text(p, "NEWS", 150, 70, 54, "#fbf7ee", 900);
  p.poly([[60, 110], [240, 110], [240, 300], [60, 300]], "#e8dcc0", 6);
  p.ell(150, 180, 40, 46, "#c9a26a", 5); p.poly([[95, 300], [205, 300], [195, 240], [105, 240]], "#3a3e4a", 5);
};
/** retrato de un espía inventado (lienzo 220 x 260): k = variante, falso = lleva el sello */
export const fxEspia = (p: Pen, k: number, falso: boolean) => {
  const bg = ["#e8dcc0", "#d9e6f2", "#f2e0d0", "#e0ecd9", "#efe6d6"][k % 5];
  p.poly([[10, 10], [210, 10], [210, 250], [10, 250]], bg, 8);
  const skin = ["#ffe2c2", "#f5c9a0", "#ecd0b6", "#c99067"][k % 4], coat = ["#3a3e4a", "#6a4a3a", "#2f4a6a", "#4a5a3a", "#7a3a3a"][(k * 3) % 5];
  p.poly([[40, 250], [180, 250], [170, 190], [50, 190]], coat, 6);
  p.ell(110, 130, 46, 54, skin, 6);
  const hat = k % 4;
  if (hat === 0) { p.ell(110, 86, 70, 12, "#2a2730", 5); p.ell(110, 72, 40, 26, "#2a2730", 5, 180, 360); }
  else if (hat === 1) p.ell(110, 84, 48, 26, "#5a3a22", 5, 180, 360);
  else if (hat === 2) p.ell(110, 90, 52, 18, "#2a1d18", 0, 180, 360);
  p.dot(94, 128, 5); p.dot(126, 128, 5);
  if (k % 3 === 0) p.stroke([[94, 152], [126, 152]], 6, "#3a2a20");
  else p.stroke([[98, 156], [122, 156]], 4);
  if (k % 5 === 2) p.poly([[70, 110], [150, 110], [150, 134], [70, 134]], "#1e1e24", 0);
  if (falso) sello(p, "FALSO", 110, 140, 180, 60, -0.3);
};
/** billete que cae (lienzo 300 x 150) */
export const fxBillete = (p: Pen) => {
  p.poly([[10, 10], [290, 10], [290, 140], [10, 140]], "#9ac48a", 7);
  p.ell(150, 75, 40, 44, "#7aa86a", 5);
  text(p, "100", 60, 40, 30, "#2f5a2a", 900); text(p, "100", 240, 110, 30, "#2f5a2a", 900);
};
/** radio: ondas con puntos y rayas (lienzo 420 x 300), t = fase */
export const fxMorse = (p: Pen, t: number) => {
  for (let k = 0; k < 3; k++) {
    const r = 50 + ((k * 50 + t * 50) % 150);
    G(p).save(); G(p).globalAlpha = Math.max(0, 1 - r / 200);
    G(p).beginPath(); G(p).arc(60, 240, r, -1.4, -0.1); G(p).lineWidth = 14; G(p).strokeStyle = "#cfe3ff"; G(p).stroke(); G(p).restore();
  }
  const code = "·−·· −−− ·−", n = Math.floor(code.length * ((t * 2) % 1.2));
  text(p, code.slice(0, n), 240, 70, 64, "#ffd34d", 900, 12);
};
/** el Canal de la Mancha (lienzo 640 x 760): a = la etiqueta de Normandía, b = la flecha grande a Calais */
export const fxCanal = (p: Pen, a: number, b: number) => {
  p.poly([[10, 10], [630, 10], [630, 750], [10, 750]], "#9fd0ea", 12);
  p.poly([[10, 10], [630, 10], [630, 200], [520, 250], [380, 230], [240, 270], [120, 250], [10, 280]], "#cfe0b0", 9);
  text(p, "INGLATERRA", 320, 110, 44, "#3f5a2a", 900);
  p.poly([[10, 750], [10, 520], [140, 500], [230, 540], [330, 520], [400, 470], [520, 420], [630, 380], [630, 750]], "#e8d8a8", 9);
  text(p, "FRANCIA", 330, 680, 44, "#7a5a2a", 900);
  p.ell(540, 405, 12, 12, INK, 0); text(p, "Calais", 548, 450, 34, INK, 800);
  p.ell(200, 520, 12, 12, INK, 0); text(p, "Normandía", 200, 570, 34, INK, 800);
  if (a > 0) {
    G(p).save(); G(p).globalAlpha = a; G(p).setLineDash([20, 16]);
    p.stroke([[190, 290], [200, 490]], 14, "#8a8e96"); G(p).restore();
    text(p, "¿DISTRACCIÓN?", 200, 360, 40, "#8a8e96", 900, 8, -0.05);
  }
  if (b > 0) {
    const n = Math.max(2, Math.round(10 * b)), pts: P2[] = [];
    for (let i = 0; i <= n; i++) pts.push([470 + (60 * i) / 10, 220 + (150 * i) / 10]);
    p.stroke(pts, 30, "#d42f2f");
    if (b >= 1) p.poly([[505, 365], [570, 365], [540, 410]], "#d42f2f", 0);
  }
};
/** cruz (lienzo 240 x 300): la Cruz de Hierro (negra con borde plateado, sin nada en el centro) colgando de su cinta */
export const fxCruzHierro = (p: Pen) => {
  p.poly([[96, 10], [144, 10], [140, 90], [100, 90]], "#d42f2f", 5);
  p.poly([[108, 10], [132, 10], [130, 90], [110, 90]], "#fbf7ee", 0);
  p.poly([[114, 10], [126, 10], [125, 90], [115, 90]], "#1e1e24", 0);
  const cross = (s: number, col: string, ol: number) => {
    const c = 190, P = (x: number, y: number): P2 => [120 + x * s, c + y * s];
    p.poly([P(-18, -18), P(-30, -82), P(30, -82), P(18, -18), P(82, -30), P(82, 30), P(18, 18), P(30, 82), P(-30, 82), P(-18, 18), P(-82, 30), P(-82, -30)], col, ol);
  };
  cross(1.12, "#c9ccd6", 8); cross(0.92, "#1e1e24", 0);
};
/** medalla británica (lienzo 240 x 300): cruz plateada sobre cinta rosa con bordes grises */
export const fxMedallaGB = (p: Pen) => {
  p.poly([[90, 10], [150, 10], [146, 90], [94, 90]], "#d98aa0", 5);
  p.poly([[90, 10], [100, 10], [100, 90], [94, 90]], "#b8bcc6", 0); p.poly([[140, 10], [150, 10], [146, 90], [140, 90]], "#b8bcc6", 0);
  const c = 190, P = (x: number, y: number): P2 => [120 + x, c + y];
  p.poly([P(-14, -14), P(-34, -80), P(34, -80), P(14, -14), P(80, -34), P(80, 34), P(14, 14), P(34, 80), P(-34, 80), P(-14, 14), P(-80, 34), P(-80, -34)], "#e2e4ea", 8);
  p.ell(120, 190, 30, 30, "#d9a441", 6);
};
/** signo de interrogación / exclamación de tinta (lienzo 160 x 220) */
export const fxSigno = (p: Pen, s: string) => {
  const g = G(p);
  g.save(); g.font = "900 200px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.lineWidth = 14; g.strokeStyle = INK; g.strokeText(s, 80, 112); g.fillStyle = "#ffd34d"; g.fillText(s, 80, 112); g.restore();
};
/** maleta (lienzo 260 x 200) */
export const fxMaleta = (p: Pen) => {
  p.poly([[20, 50], [240, 50], [240, 190], [20, 190]], "#8a5a32", 9);
  p.stroke([[100, 50], [100, 20], [160, 20], [160, 50]], 10);
  p.stroke([[20, 120], [240, 120]], 6, "#5a3a22");
};
/** «x2» (lienzo 240 x 200) */
export const fxX2 = (p: Pen) => text(p, "x2", 120, 100, 150, "#ffd34d", 900, 16, -0.12);
