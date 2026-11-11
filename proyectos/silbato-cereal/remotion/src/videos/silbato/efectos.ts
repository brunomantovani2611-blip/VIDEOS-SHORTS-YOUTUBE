// Efectos 2D de caricatura para el silbato de los cereales, dibujados con la Pen de toon.ts (planos, contorno de tinta).
import { Pen, INK } from "./toon";

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


/** caja de cereal genérica (lienzo 320 x 420): «CEREAL» con un tazón y la estrella del regalo */
export const fxCereal = (p: Pen) => {
  p.poly([[30, 30], [290, 30], [290, 400], [30, 400]], "#f2a23a", 10);
  p.poly([[30, 30], [290, 30], [290, 110], [30, 110]], "#d43f3f", 0);
  p.poly([[30, 30], [290, 30], [290, 400], [30, 400]], null, 10);
  text(p, "CEREAL", 160, 72, 52, "#fbf7ee", 900, 10);
  p.ell(160, 300, 100, 22, "#fbf7ee", 7);
  p.ell(160, 300, 100, 70, "#3f7ac9", 7, 0, 180);
  for (const [x, y] of [[110, 290], [150, 282], [190, 290], [130, 270], [175, 268], [210, 280]]) p.ell(x, y, 14, 10, "#f6d36a", 5);
  // estrella del regalo
  const st: P2[] = [];
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 26 : 62; st.push([225 + r * Math.cos(a), 175 + r * Math.sin(a)]); }
  p.poly(st, "#ffd34d", 7);
  text(p, "¡REGALO!", 225, 178, 22, "#d43f3f", 900, 0, -0.2);
};
/** silbato de juguete (lienzo 360 x 200): tubo con boquilla y bola */
export const fxSilbato = (p: Pen) => {
  p.poly([[40, 70], [250, 70], [250, 130], [40, 130]], "#e8eaf0", 8);
  p.ell(285, 100, 55, 55, "#e8eaf0", 8);
  p.ell(285, 100, 24, 24, "#b8bcc6", 6);
  p.poly([[20, 80], [60, 80], [60, 120], [20, 120]], "#d43f3f", 7);
  p.stroke([[90, 85], [200, 85]], 6, "#ffffff");
  text(p, "2600", 145, 103, 30, "#3f7ac9", 900);
};
/** ondas de sonido (lienzo 400 x 300) que salen desde la izquierda, t = fase 0..1 */
export const fxOndas = (p: Pen, t: number, col = "#ffd34d") => {
  for (let k = 0; k < 3; k++) {
    const r = 40 + ((k * 80 + t * 80) % 240);
    G(p).save(); G(p).globalAlpha = Math.max(0, 1 - r / 280);
    G(p).beginPath(); G(p).arc(20, 150, r, -0.9, 0.9); G(p).lineWidth = 22; G(p).strokeStyle = INK; G(p).stroke();
    G(p).beginPath(); G(p).arc(20, 150, r, -0.9, 0.9); G(p).lineWidth = 12; G(p).strokeStyle = col; G(p).stroke(); G(p).restore();
  }
};
/** teléfono negro de disco (lienzo 340 x 300) */
export const fxTelefono = (p: Pen, col = "#2a2730") => {
  p.poly([[50, 270], [290, 270], [250, 140], [90, 140]], col, 9);
  p.ell(170, 205, 52, 52, "#e8eaf0", 7);
  for (let k = 0; k < 10; k++) { const a = -2.2 + k * 0.45; p.ell(170 + 34 * Math.cos(a), 205 + 34 * Math.sin(a), 8, 8, col, 3); }
  p.line([[40, 110], [80, 70], [260, 70], [300, 110]], col, 46);
  p.ell(50, 115, 34, 22, col, 8); p.ell(290, 115, 34, 22, col, 8);
};
/** «2600 Hz» con su onda (lienzo 520 x 300) */
export const fxHz = (p: Pen) => {
  p.poly([[14, 14], [506, 14], [506, 286], [14, 286]], "#1e2a3a", 10);
  const pts: P2[] = [];
  for (let i = 0; i <= 80; i++) pts.push([40 + i * 5.5, 215 + 40 * Math.sin(i * 0.9)]);
  p.stroke(pts, 10, "#5aff8a");
  text(p, "2600 Hz", 260, 100, 96, "#ffd34d", 900, 12);
};
/** línea telefónica con su luz: libre (verde) o ocupada (lienzo 460 x 220) */
export const fxLinea = (p: Pen, libre: boolean) => {
  p.poly([[14, 14], [446, 14], [446, 206], [14, 206]], "#fbf7ee", 9);
  p.ell(80, 110, 46, 46, libre ? "#4ad46a" : "#d43f3f", 8);
  p.ell(66, 94, 12, 10, "#ffffff", 0);
  text(p, libre ? "LIBRE" : "OCUPADA", 270, 112, libre ? 80 : 60, libre ? "#2f9a4a" : "#d43f3f", 900);
};
/** auriculares de operador con cartel (lienzo 420 x 300) */
export const fxOperador = (p: Pen) => {
  p.arc(210, 150, 110, 110, 190, 350, 22, INK);
  p.arc(210, 150, 110, 110, 190, 350, 12, "#8a8e96");
  for (const s of [-1, 1]) p.ell(210 + s * 108, 160, 30, 42, "#2a2730", 7);
  p.stroke([[320, 190], [280, 240], [220, 250]], 8); p.ell(214, 250, 14, 12, "#2a2730", 5);
  p.poly([[60, 220], [360, 220], [360, 290], [60, 290]], "#3f7ac9", 7);
  text(p, "OPERADOR", 210, 256, 46, "#fbf7ee", 900);
};
/** mapa del mundo con llamadas que vuelan (lienzo 700 x 520): k = cuántos arcos (0..1), gratis = el sello */
export const fxMundo = (p: Pen, k: number, gratis: boolean) => {
  p.poly([[10, 10], [690, 10], [690, 510], [10, 510]], "#9fd0ea", 10);
  const land = "#cfe0b0";
  p.poly([[60, 90], [230, 70], [260, 150], [200, 230], [150, 250], [110, 190], [50, 160]], land, 7);   // América del Norte
  p.poly([[190, 270], [260, 280], [250, 380], [210, 460], [180, 380]], land, 7);                       // del Sur
  p.poly([[330, 80], [420, 70], [430, 140], [370, 160], [320, 140]], land, 7);                          // Europa
  p.poly([[340, 180], [440, 180], [450, 300], [400, 400], [360, 320], [330, 230]], land, 7);            // África
  p.poly([[440, 70], [640, 80], [650, 200], [560, 240], [470, 200], [440, 140]], land, 7);              // Asia
  p.poly([[560, 340], [650, 340], [640, 420], [570, 410]], land, 7);                                     // Oceanía
  const ends: [P2, P2][] = [[[140, 160], [380, 110]], [[140, 160], [600, 380]], [[140, 160], [400, 260]], [[140, 160], [560, 140]], [[140, 160], [220, 360]]];
  ends.forEach(([a, b], i) => {
    const u = Math.max(0, Math.min(1, k * 5 - i));
    if (u <= 0) return;
    const pts: P2[] = [];
    for (let s = 0; s <= 20 * u; s++) { const v = s / 20; pts.push([a[0] + (b[0] - a[0]) * v, a[1] + (b[1] - a[1]) * v - 120 * Math.sin(Math.PI * v)]); }
    G(p).save(); G(p).setLineDash([18, 12]); p.stroke(pts, 9, "#d43f3f"); G(p).restore();
    if (u >= 1) p.ell(b[0], b[1], 12, 12, "#ffd34d", 5);
  });
  p.ell(140, 160, 14, 14, "#d43f3f", 5);
  if (gratis) sello(p, "GRATIS", 350, 440, 300, 90, -0.12, "#2f9a4a");
};
/** cartel con un apodo (lienzo 520 x 220) */
export const fxApodo = (p: Pen, s: string) => {
  p.poly([[14, 30], [506, 14], [500, 196], [20, 206]], "#ffd34d", 10);
  text(p, s, 260, 112, s.length > 12 ? 50 : 62, "#d43f3f", 900, 10, -0.03);
};
/** la caja azul con su teclado (lienzo 360 x 300) */
export const fxCajaAzul = (p: Pen) => {
  p.poly([[30, 40], [330, 40], [330, 270], [30, 270]], "#2f6ad4", 10);
  p.poly([[30, 40], [330, 40], [300, 14], [60, 14]], "#5a8ae8", 8);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    const x = 110 + c * 70, y = 80 + r * 46;
    p.poly([[x - 24, y - 16], [x + 24, y - 16], [x + 24, y + 16], [x - 24, y + 16]], "#e8eaf0", 5);
    text(p, "123456789*0#"[r * 3 + c], x, y + 1, 24, INK, 900);
  }
  p.ell(60, 100, 12, 12, "#ffd34d", 4);
};
/** notas musicales (lienzo 300 x 300), t = fase */
export const fxNotas = (p: Pen, t: number) => {
  for (let i = 0; i < 3; i++) {
    const u = (t + i / 3) % 1, x = 60 + i * 90 + 20 * Math.sin(u * 6), y = 260 - 220 * u;
    G(p).save(); G(p).globalAlpha = Math.min(1, (1 - u) * 2);
    p.ell(x, y, 22, 16, "#ffd34d", 6, 0, 360, -0.4); p.stroke([[x + 20, y - 4], [x + 20, y - 70], [x + 44, y - 56]], 8);
    G(p).restore();
  }
};
/** revista de 1971 (lienzo 300 x 380) */
export const fxRevista = (p: Pen) => {
  p.poly([[30, 20], [270, 20], [270, 360], [30, 360]], "#1e1e24", 10);
  text(p, "REVISTA", 150, 66, 44, "#fbf7ee", 900);
  text(p, "1971", 150, 108, 30, "#ffd34d", 900);
  p.poly([[70, 140], [230, 140], [230, 320], [70, 320]], "#2f6ad4", 6);
  text(p, "LA CAJA", 150, 205, 30, "#fbf7ee", 900); text(p, "AZUL", 150, 250, 44, "#ffd34d", 900);
};
/** cartelito con un nombre (lienzo 360 x 120) */
export const fxNombre = (p: Pen, s: string) => {
  p.poly([[10, 14], [350, 14], [350, 106], [10, 106]], "#fbf7ee", 8);
  text(p, s, 180, 62, s.length > 8 ? 44 : 54, "#2f4a8a", 900);
};
/** la cúpula del Vaticano (lienzo 380 x 360) */
export const fxVaticano = (p: Pen) => {
  p.poly([[20, 260], [360, 260], [360, 340], [20, 340]], "#efe6d6", 8);
  for (let x = 50; x < 350; x += 50) p.poly([[x, 270], [x + 20, 270], [x + 20, 330], [x, 330]], "#d9cfbc", 4);
  p.poly([[80, 260], [300, 260], [300, 200], [80, 200]], "#efe6d6", 8);
  p.ell(190, 200, 100, 110, "#9ab8c8", 8, 180, 360);
  for (const dx of [-50, 0, 50]) p.stroke([[190 + dx * 0.4, 92], [190 + dx, 196]], 5, "#6a8a9a");
  p.poly([[176, 92], [204, 92], [200, 60], [180, 60]], "#efe6d6", 6);
  p.stroke([[190, 58], [190, 18]], 7); p.stroke([[176, 32], [204, 32]], 7);
};
/** bocadillo de diálogo (lienzo 520 x 260) */
export const fxBocadillo = (p: Pen, s: string, s2 = "") => {
  p.poly([[20, 20], [500, 20], [500, 190], [160, 190], [90, 250], [110, 190], [20, 190]], "#fbf7ee", 9);
  if (s2) { text(p, s, 260, 78, 46, INK, 900); text(p, s2, 260, 136, 46, "#d43f3f", 900); }
  else text(p, s, 260, 106, s.length > 14 ? 42 : 54, INK, 900);
};
/** «Zzz» (lienzo 300 x 300), t = fase */
export const fxZzz = (p: Pen, t: number) => {
  for (let i = 0; i < 3; i++) {
    const u = (t + i / 3) % 1;
    G(p).save(); G(p).globalAlpha = Math.min(1, (1 - u) * 2.2);
    text(p, "Z", 70 + i * 70 + 30 * u, 240 - 170 * u, 50 + i * 18, "#cfe3ff", 900, 10, -0.2);
    G(p).restore();
  }
};
/** luna con gorro de dormir (lienzo 300 x 300) */
export const fxLuna = (p: Pen) => {
  p.ell(150, 160, 110, 110, "#ffe9a0", 9);
  p.ell(200, 130, 90, 96, "#1e2a4a", 0);
  p.stroke([[80, 170], [100, 180]], 6); p.stroke([[100, 140], [104, 150]], 0);
};
/** manzana (fruta, lienzo 300 x 320) con brillo */
export const fxManzana = (p: Pen) => {
  p.poly([[150, 90], [210, 70], [270, 120], [270, 220], [220, 300], [180, 290], [150, 300], [120, 290], [80, 300], [30, 220], [30, 120], [90, 70]], "#d43f3f", 10);
  p.ell(95, 140, 18, 34, "#f08080", 0, 0, 360, 0.4);
  p.stroke([[150, 90], [160, 30]], 12, "#6a4a2a");
  p.poly([[165, 50], [230, 20], [250, 40], [190, 70]], "#4aa04a", 7);
};
/** prohibido sobre un dibujo (lienzo 300 x 300) */
export const fxProhibido = (p: Pen) => {
  p.arc(150, 150, 120, 120, 0, 360, 34, INK); p.arc(150, 150, 120, 120, 0, 360, 22, "#d43f3f");
  p.stroke([[66, 66], [234, 234]], 34); p.stroke([[66, 66], [234, 234]], 22, "#d43f3f");
};
/** signo de dinero (lienzo 200 x 240) */
export const fxDolar = (p: Pen) => text(p, "$", 100, 120, 200, "#5ac46a", 900, 14);

/** billete que cae (lienzo 300 x 150) */
export const fxBillete = (p: Pen) => {
  p.poly([[10, 10], [290, 10], [290, 140], [10, 140]], "#9ac48a", 7);
  p.ell(150, 75, 40, 44, "#7aa86a", 5);
  text(p, "100", 60, 40, 30, "#2f5a2a", 900); text(p, "100", 240, 110, 30, "#2f5a2a", 900);
};

/** signo de interrogación / exclamación de tinta (lienzo 160 x 220) */
export const fxSigno = (p: Pen, s: string) => {
  const g = G(p);
  g.save(); g.font = "900 200px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.lineWidth = 14; g.strokeStyle = INK; g.strokeText(s, 80, 112); g.fillStyle = "#ffd34d"; g.fillText(s, 80, 112); g.restore();
};
