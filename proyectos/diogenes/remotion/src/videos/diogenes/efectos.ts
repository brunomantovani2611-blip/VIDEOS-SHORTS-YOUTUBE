// Efectos 2D de caricatura para el hackeo de Nasa de 2020, dibujados con la Pen de toon.ts (planos, contorno de tinta).
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
  const fit = (t: string, max: number) => Math.min(max, Math.floor((t === t.toUpperCase() ? 700 : 800) / Math.max(1, t.length)));
  if (s2) { text(p, s, 260, 78, fit(s, 46), INK, 900); text(p, s2, 260, 136, fit(s2, 46), "#d43f3f", 900); }
  else text(p, s, 260, 106, fit(s, 54), INK, 900);
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

// ---------------- hackeo de Nasa, 2020 ----------------
/** tuit (lienzo 640 x 320): avatar gris con «?» (no dibujamos a nadie), nombre, tilde azul y el mensaje de la estafa */
export const fxTweet = (p: Pen, name: string, col = "#8a8e96") => {
  p.poly([[10, 10], [630, 10], [630, 310], [10, 310]], "#fbfbfd", 9);
  p.ell(78, 80, 46, 46, col, 6);
  text(p, "?", 78, 82, 52, "#fbfbfd", 900);
  const g = G(p); g.save(); g.font = `900 40px ${FONT}`; const w = g.measureText(name).width; g.restore();
  text(p, name, 140 + w / 2, 66, 40, INK, 900);
  p.ell(160 + w, 66, 17, 17, "#3f9ae8", 4); p.stroke([[151 + w, 66], [158 + w, 73], [170 + w, 58]], 5, "#ffffff");
  text(p, "Mándenme $1.000 en bitcoin", 320, 170, 33, INK, 800);
  text(p, "y les devuelvo $2.000", 320, 222, 35, "#d43f3f", 900);
  p.ell(580, 270, 24, 24, "#f2a23a", 5); text(p, "₿", 580, 272, 30, "#fbfbfd", 900);
};
/** sello genérico (lienzo 520 x 220) */
export const fxSello = (p: Pen, s: string, col = "#d42f2f") => sello(p, s, 260, 110, 470, 160, -0.15, col, s.length > 8 ? 72 : s.length > 6 ? 84 : 100);
/** celular con el feed enloquecido (lienzo 320 x 560) */
export const fxCelular = (p: Pen, t: number) => {
  p.poly([[20, 20], [300, 20], [300, 540], [20, 540]], "#2a2730", 10);
  p.poly([[40, 70], [280, 70], [280, 490], [40, 490]], "#e8f2fb", 0);
  for (let i = 0; i < 6; i++) {
    const y = 80 + ((i * 70 + t * 420) % 420);
    if (y > 440) continue;
    p.poly([[50, y], [270, y], [270, y + 56], [50, y + 56]], "#fbfbfd", 4);
    p.ell(72, y + 28, 14, 14, "#8a8e96", 3);
    p.stroke([[96, y + 20], [250, y + 20]], 6, "#c9ccd6"); p.stroke([[96, y + 38], [210, y + 38]], 6, i % 2 ? "#d43f3f" : "#c9ccd6");
  }
  p.ell(160, 515, 14, 14, "#3a3e4a", 0);
};
/** un bicho de virus tachado (lienzo 300 x 300) */
export const fxVirus = (p: Pen) => {
  p.ell(150, 160, 70, 60, "#6ac44a", 8);
  for (const s of [-1, 1]) for (const k of [-1, 0, 1]) p.stroke([[150 + s * 60, 160 + k * 25], [150 + s * 100, 150 + k * 40]], 8);
  p.ell(125, 145, 14, 14, "#fbfbfd", 4); p.ell(175, 145, 14, 14, "#fbfbfd", 4); p.dot(125, 147, 6); p.dot(175, 147, 6);
  p.arc(150, 150, 130, 130, 0, 360, 30, INK); p.arc(150, 150, 130, 130, 0, 360, 18, "#d43f3f");
  p.stroke([[60, 60], [240, 240]], 30); p.stroke([[60, 60], [240, 240]], 18, "#d43f3f");
};
/** tarjeta de contraseña (lienzo 460 x 220) */
export const fxClave = (p: Pen) => {
  p.poly([[14, 14], [446, 14], [446, 206], [14, 206]], "#fbf7ee", 9);
  text(p, "CONTRASEÑA", 230, 62, 40, "#2f4a8a", 900);
  p.poly([[44, 100], [416, 100], [416, 176], [44, 176]], "#e8eaf0", 6);
  for (let k = 0; k < 8; k++) p.ell(84 + k * 42, 138, 13, 13, INK, 0);
};
/** el panel interno (lienzo 600 x 720): filas de cuentas, n = cuántas marcadas (0..1), cifra = el contador */
export const fxPanel = (p: Pen, n: number, cifra: string) => {
  p.poly([[10, 10], [590, 10], [590, 710], [10, 710]], "#1e2a3a", 10);
  p.poly([[10, 10], [590, 10], [590, 90], [10, 90]], "#d43f3f", 0);
  text(p, "PANEL INTERNO", 300, 52, 46, "#fbfbfd", 900);
  for (let r = 0; r < 8; r++) {
    const y = 120 + r * 66, on = r < Math.round(n * 8);
    p.poly([[40, y], [560, y], [560, y + 50], [40, y + 50]], "#2f3e52", 0);
    p.ell(74, y + 25, 17, 17, "#8a8e96", 0);
    p.stroke([[106, y + 25], [330, y + 25]], 10, "#5a6a80");
    p.poly([[440, y + 10], [530, y + 10], [530, y + 40], [440, y + 40]], on ? "#d43f3f" : "#4a5a70", 0);
    p.ell(on ? 512 : 458, y + 25, 13, 13, "#fbfbfd", 0);
  }
  if (cifra) text(p, cifra, 300, 660, 60, "#ffd34d", 900, 10);
};
/** moneda de bitcoin (lienzo 200 x 200) */
export const fxBitcoin = (p: Pen) => { p.ell(100, 100, 84, 84, "#f2a23a", 8); p.ell(100, 100, 62, 62, "#f6c25a", 0); text(p, "₿", 100, 104, 96, "#fbfbfd", 900, 10); };
/** candado gigante sobre la tilde azul (lienzo 360 x 420) */
export const fxCandado = (p: Pen) => {
  p.arc(180, 170, 90, 100, 180, 360, 46, INK); p.arc(180, 170, 90, 100, 180, 360, 30, "#b8bcc6");
  p.poly([[50, 170], [310, 170], [310, 400], [50, 400]], "#f2c230", 10);
  p.ell(180, 270, 50, 50, "#3f9ae8", 6); p.stroke([[158, 270], [174, 288], [204, 252]], 12, "#ffffff");
};
/** tilde azul de cuenta verificada (lienzo 200 x 200) */
export const fxCheck = (p: Pen) => {
  const st: P2[] = [];
  for (let k = 0; k < 16; k++) { const a = (k * Math.PI) / 8, r = k % 2 ? 72 : 88; st.push([100 + r * Math.cos(a), 100 + r * Math.sin(a)]); }
  p.poly(st, "#3f9ae8", 7); p.stroke([[66, 102], [90, 128], [138, 74]], 18, "#ffffff");
};
/** rejas (lienzo 600 x 800) */
export const fxRejas = (p: Pen) => {
  for (let x = 40; x < 600; x += 90) { p.poly([[x, 10], [x + 26, 10], [x + 26, 790], [x, 790]], "#5a5e66", 6); }
  p.poly([[10, 60], [590, 60], [590, 96], [10, 96]], "#5a5e66", 6); p.poly([[10, 700], [590, 700], [590, 736], [10, 736]], "#5a5e66", 6);
};
/** «</>» del código, tachado (lienzo 360 x 260) */
export const fxCodigo = (p: Pen, tachado: boolean) => {
  p.poly([[10, 10], [350, 10], [350, 250], [10, 250]], "#1e2a3a", 9);
  text(p, "</>", 180, 130, 110, "#5aff8a", 900);
  if (tachado) { p.stroke([[30, 230], [330, 30]], 30); p.stroke([[30, 230], [330, 30]], 18, "#d43f3f"); }
};
/** «TOC TOC» (lienzo 420 x 200) */
export const fxToc = (p: Pen) => { text(p, "TOC", 120, 90, 90, "#ffd34d", 900, 14, -0.15); text(p, "TOC", 300, 120, 90, "#ffd34d", 900, 14, 0.12); };
/** monitor con código verde (lienzo 400 x 320), t = fase */
export const fxPantallaPC = (p: Pen, t: number) => {
  p.poly([[20, 20], [380, 20], [380, 250], [20, 250]], "#1e1e24", 10);
  for (let i = 0; i < 7; i++) { const w = 60 + ((i * 97 + Math.floor(t * 20) * 31) % 220); p.stroke([[50, 50 + i * 28], [50 + w, 50 + i * 28]], 8, "#5aff8a"); }
  p.poly([[170, 250], [230, 250], [240, 300], [160, 300]], "#3a3e4a", 6);
};

// ---------------- Jonathan James, 1999 ----------------
/** cartel con un nombre largo (lienzo 640 x 200) */
export const fxNombreL = (p: Pen, s: string) => {
  p.poly([[14, 30], [626, 30], [626, 170], [14, 170]], "#fbf7ee", 9);
  text(p, s, 320, 102, s.length > 14 ? 52 : s.length > 12 ? 62 : 74, "#2f4a8a", 900);
};
/** cartel de dos líneas (lienzo 560 x 240) */
export const fxCartel = (p: Pen, s: string, s2: string, col = "#2f4a8a") => {
  p.poly([[14, 14], [546, 14], [546, 226], [14, 226]], "#fbf7ee", 9);
  p.poly([[14, 14], [546, 14], [546, 40], [14, 40]], col, 0);
  text(p, s, 280, 100, 52, col, 900); text(p, s2, 280, 170, 52, col, 900);
};
/** sobre con sello «SECRETO» (lienzo 300 x 200) */
export const fxCorreo = (p: Pen) => {
  p.poly([[14, 14], [286, 14], [286, 186], [14, 186]], "#fbf7ee", 8);
  p.stroke([[14, 14], [150, 110], [286, 14]], 8);
  sello(p, "SECRETO", 150, 140, 190, 52, -0.12, "#d42f2f", 34);
};
/** logo genérico: círculo azul con «NASA» y estrellas (lienzo 400 x 400) */
export const fxNasa = (p: Pen) => {
  p.ell(200, 200, 180, 180, "#2f5ab8", 10);
  for (const [x, y, r] of [[110, 110, 6], [290, 90, 5], [300, 300, 6], [90, 280, 5], [200, 70, 4], [250, 320, 4]]) p.ell(x, y, r, r, "#fbfbfd", 0);
  G(p).save(); G(p).strokeStyle = "#d43f3f"; G(p).lineWidth = 12; G(p).beginPath(); G(p).ellipse(200, 210, 160, 50, -0.35, 0, Math.PI * 2); G(p).stroke(); G(p).restore();
  text(p, "NASA", 200, 205, 100, "#fbfbfd", 900, 12);
};
/** barra de descarga (lienzo 600 x 260), k = 0..1 */
export const fxDescarga = (p: Pen, k: number) => {
  p.poly([[10, 10], [590, 10], [590, 250], [10, 250]], "#1e2a3a", 10);
  text(p, k >= 1 ? "¡DESCARGADO!" : "DESCARGANDO...", 300, 70, 50, k >= 1 ? "#5aff8a" : "#fbfbfd", 900);
  p.poly([[50, 130], [550, 130], [550, 200], [50, 200]], "#2f3e52", 6);
  if (k > 0) p.poly([[56, 136], [56 + 488 * k, 136], [56 + 488 * k, 194], [56, 194]], "#5aff8a", 0);
  text(p, `${Math.round(k * 100)}%`, 300, 166, 40, "#fbfbfd", 900, 8);
};
/** estación espacial de caricatura (lienzo 700 x 420) */
export const fxEstacion = (p: Pen) => {
  p.poly([[20, 200], [680, 200], [680, 222], [20, 222]], "#b8bcc6", 7);
  for (const x of [40, 520]) for (const y of [60, 240]) {
    p.poly([[x, y], [x + 140, y], [x + 140, y + 120], [x, y + 120]], "#3f6ab8", 7);
    for (let k = 1; k < 4; k++) p.stroke([[x + k * 35, y], [x + k * 35, y + 120]], 4, "#2a4a8a");
    p.stroke([[x, y + 60], [x + 140, y + 60]], 4, "#2a4a8a");
  }
  p.poly([[250, 160], [450, 160], [450, 262], [250, 262]], "#e8eaf0", 8);
  p.ell(300, 160, 30, 50, "#e8eaf0", 7); p.ell(400, 262, 30, 40, "#e8eaf0", 7);
  p.ell(350, 211, 26, 26, "#9fd0ea", 6); p.ell(290, 211, 16, 16, "#9fd0ea", 5); p.ell(410, 211, 16, 16, "#9fd0ea", 5);
};
/** icono con etiqueta (lienzo 340 x 300): kind = termo | gota | aire */
export const fxVital = (p: Pen, kind: string) => {
  p.poly([[14, 14], [326, 14], [326, 286], [14, 286]], "#fbf7ee", 8);
  if (kind === "termo") {
    p.poly([[150, 40], [190, 40], [190, 170], [150, 170]], "#fbfbfd", 7); p.ell(170, 190, 34, 34, "#d43f3f", 7);
    p.poly([[160, 100], [180, 100], [180, 180], [160, 180]], "#d43f3f", 0);
  } else if (kind === "gota") {
    p.poly([[170, 36], [215, 120], [222, 160], [200, 200], [170, 212], [140, 200], [118, 160], [125, 120]], "#3f9ae8", 7);
  } else {
    for (let k = 0; k < 3; k++) { const y = 70 + k * 50; p.stroke([[70, y], [220, y]], 10, "#5ab0c8"); p.arc(230, y - 18, 20, 18, -90, 160, 10, "#5ab0c8"); }
  }
  const s = kind === "termo" ? "TEMPERATURA" : kind === "gota" ? "HUMEDAD" : "AIRE";
  text(p, s, 170, 252, s.length > 8 ? 36 : 44, "#2f4a8a", 900);
};
/** disquete con «PROGRAMA» (lienzo 300 x 300) */
export const fxDisco = (p: Pen) => {
  p.poly([[20, 20], [250, 20], [280, 50], [280, 280], [20, 280]], "#3a3e4a", 9);
  p.poly([[70, 20], [220, 20], [220, 100], [70, 100]], "#b8bcc6", 6);
  p.poly([[170, 34], [200, 34], [200, 88], [170, 88]], "#3a3e4a", 0);
  p.poly([[50, 150], [250, 150], [250, 270], [50, 270]], "#fbf7ee", 6);
  text(p, "NASA", 150, 190, 40, "#2f5ab8", 900); text(p, "PROGRAMA", 150, 238, 32, "#d43f3f", 900);
};
/** monitor apagado con el símbolo de encendido (lienzo 400 x 320) */
export const fxPantallaOff = (p: Pen) => {
  p.poly([[20, 20], [380, 20], [380, 250], [20, 250]], "#141418", 10);
  p.arc(200, 140, 50, 50, -60, 240, 12, "#d43f3f"); p.stroke([[200, 75], [200, 135]], 12, "#d43f3f");
  p.poly([[170, 250], [230, 250], [240, 300], [160, 300]], "#3a3e4a", 6);
};
/** lupa sobre código con bichos (lienzo 420 x 360) */
export const fxLupa = (p: Pen) => {
  p.poly([[10, 10], [330, 10], [330, 250], [10, 250]], "#1e2a3a", 9);
  for (let i = 0; i < 6; i++) p.stroke([[40, 45 + i * 34], [40 + 80 + ((i * 67) % 180), 45 + i * 34]], 9, i % 2 ? "#d43f3f" : "#5aff8a");
  p.stroke([[280, 230], [390, 340]], 30, "#6a4a2a");
  p.ell(230, 170, 95, 95, "#cfe3ff", 10);
  for (const [x, y] of [[200, 150], [255, 195]]) { p.ell(x, y, 18, 14, "#6ac44a", 5); p.stroke([[x - 22, y - 8], [x + 22, y + 8]], 4); p.stroke([[x - 22, y + 8], [x + 22, y - 8]], 4); }
};

// ---------------- la subasta del Imperio ----------------
/** trono dorado (lienzo 400 x 480), con cartel «SE VENDE» opcional */
export const fxTrono = (p: Pen, venta: boolean) => {
  p.poly([[90, 40], [310, 40], [310, 300], [90, 300]], "#e8b84a", 9);
  p.poly([[60, 260], [340, 260], [340, 340], [60, 340]], "#b8322f", 9);
  p.poly([[60, 340], [340, 340], [330, 460], [70, 460]], "#e8b84a", 9);
  p.ell(200, 120, 50, 50, "#f6d36a", 6);
  if (venta) {
    p.stroke([[150, 200], [200, 150], [250, 200]], 6, "#6a4a2a");
    p.poly([[30, 200], [370, 200], [370, 300], [30, 300]], "#fbf7ee", 8);
    text(p, "SE VENDE", 200, 252, 50, "#d43f3f", 900);
  }
};
/** corona de laurel suelta (lienzo 300 x 200) */
export const fxLaurel = (p: Pen) => {
  for (const s of [-1, 1]) for (let i = 0; i < 7; i++) {
    const a = (Math.PI * (0.15 + 0.7 * (i / 6))), x = 150 + s * 110 * Math.cos(a), y = 150 - 90 * Math.sin(a) * 0.9;
    p.ell(x, y, 24, 11, i % 2 ? "#4a9a3a" : "#5ab04a", 4, 0, 360, s * (20 + 60 * (i / 6)));
  }
  p.ell(150, 168, 14, 10, "#d43f3f", 4);
};
/** martillo de subasta con «¡VENDIDO!» (lienzo 520 x 360) */
export const fxMartillo = (p: Pen, vendido: boolean) => {
  p.stroke([[150, 300], [320, 140]], 22, "#8a5a34");
  p.poly([[260, 60], [420, 200], [380, 240], [220, 100]], "#6a4024", 9);
  p.poly([[40, 300], [260, 300], [260, 340], [40, 340]], "#6a4024", 8);
  if (vendido) sello(p, "¡VENDIDO!", 300, 290, 400, 110, -0.12, "#d42f2f", 54);
};
/** moneda de oro (lienzo 200 x 200) */
export const fxMoneda = (p: Pen) => { p.ell(100, 100, 84, 84, "#e8b84a", 8); p.ell(100, 100, 60, 60, "#f6d36a", 0); p.ell(100, 92, 26, 30, "#d9a838", 5); p.stroke([[80, 140], [120, 140]], 8, "#d9a838"); };
/** mapa del imperio con puntos rebeldes (lienzo 640 x 480), n = cuántos */
export const fxMapa = (p: Pen, n: number) => {
  p.poly([[10, 10], [630, 10], [630, 470], [10, 470]], "#9fd0ea", 10);
  p.poly([[40, 60], [260, 40], [300, 120], [250, 200], [160, 230], [80, 180]], "#e8d29a", 7);           // Hispania, Galia, Britania
  p.poly([[290, 140], [340, 130], [360, 230], [400, 300], [370, 310], [320, 220]], "#e8d29a", 7);       // Italia
  p.poly([[380, 100], [600, 80], [610, 260], [480, 260], [420, 200]], "#e8d29a", 7);                   // Oriente
  p.poly([[60, 340], [600, 330], [610, 450], [60, 450]], "#e8d29a", 7);                                 // África
  p.ell(345, 210, 14, 14, "#8a2a6a", 5); text(p, "ROMA", 345, 250, 28, "#8a2a6a", 900);
  const pts: [number, number][] = [[130, 120], [530, 170], [470, 370]];
  pts.slice(0, n).forEach(([x, y]) => { p.ell(x, y, 30, 30, "#d43f3f", 7); text(p, "!", x, y + 2, 40, "#fbfbfd", 900); });
};
/** flecha con texto (lienzo 520 x 200) */
export const fxFlecha = (p: Pen, s: string) => {
  p.poly([[20, 70], [360, 70], [360, 20], [500, 100], [360, 180], [360, 130], [20, 130]], "#ffd34d", 9);
  text(p, s, 190, 102, 52, "#8a2a6a", 900);
};
/** «¡BUUU!» (lienzo 420 x 200) */
export const fxBuu = (p: Pen) => text(p, "¡BUUU!", 210, 100, 100, "#ffd34d", 900, 14, -0.08);
/** calendario con cifra (lienzo 300 x 320) */
export const fxCalendario = (p: Pen, n: string) => {
  p.poly([[20, 40], [280, 40], [280, 300], [20, 300]], "#fbf7ee", 9);
  p.poly([[20, 40], [280, 40], [280, 110], [20, 110]], "#d43f3f", 0); p.poly([[20, 40], [280, 40], [280, 300], [20, 300]], null, 9);
  text(p, "DÍAS", 150, 76, 44, "#fbfbfd", 900);
  text(p, n, 150, 210, 120, INK, 900);
};
/** sello con texto largo (lienzo 520 x 220) */
export const fxSelloL = (p: Pen, s: string, col = "#d42f2f") => sello(p, s, 260, 110, 490, 150, -0.12, col, 50);

// ---------------- Grecia ----------------
/** tinaja de barro (lienzo 420 x 420): la boca arriba, de costado en el suelo no; parada */
export const fxTinaja = (p: Pen) => {
  p.poly([[60, 120], [360, 120], [400, 220], [370, 340], [300, 400], [120, 400], [50, 340], [20, 220]], "#c8763a", 10);
  p.ell(210, 120, 150, 30, "#a85a2a", 9);
  p.ell(210, 120, 120, 20, "#3a2010", 0);
  p.stroke([[40, 250], [380, 250]], 8, "#a85a2a"); p.stroke([[50, 300], [370, 300]], 6, "#a85a2a");
};
/** lámpara de aceite encendida (lienzo 260 x 260) */
export const fxLampara = (p: Pen) => {
  p.poly([[40, 170], [200, 170], [230, 140], [200, 210], [60, 210]], "#c8763a", 8);
  p.ell(120, 170, 80, 18, "#a85a2a", 7);
  p.poly([[225, 140], [212, 100], [228, 50], [246, 100], [238, 140]], "#ffb43a", 5);
  p.poly([[229, 130], [222, 105], [230, 78], [238, 105], [234, 130]], "#ffe46a", 0);
};
/** pizarra con dos líneas (lienzo 600 x 360) */
export const fxPizarra = (p: Pen, s: string, s2: string) => {
  p.poly([[14, 14], [586, 14], [586, 300], [14, 300]], "#2f4a3a", 12);
  p.poly([[14, 14], [586, 14], [586, 300], [14, 300]], null, 10);
  text(p, s, 300, 110, Math.min(56, Math.floor(820 / s.length)), "#f4f1ea", 800);
  text(p, s2, 300, 200, Math.min(56, Math.floor(820 / s2.length)), "#ffd34d", 800);
  p.stroke([[150, 300], [120, 350]], 12, "#6a4a2a"); p.stroke([[450, 300], [480, 350]], 12, "#6a4a2a");
};
/** pollo desplumado (lienzo 360 x 360) */
export const fxPollo = (p: Pen) => {
  p.ell(170, 190, 110, 85, "#f6c8b0", 9);
  p.ell(270, 110, 40, 40, "#f6c8b0", 8);
  p.poly([[300, 100], [345, 112], [302, 124]], "#f2a23a", 6);
  p.dot(280, 100, 7);
  p.poly([[262, 72], [272, 50], [282, 72]], "#d43f3f", 5);
  for (const x of [140, 200]) { p.stroke([[x, 265], [x, 330]], 9, "#f2a23a"); p.stroke([[x - 20, 335], [x + 20, 335]], 8, "#f2a23a"); }
  for (const [x, y] of [[120, 170], [160, 210], [200, 160], [110, 220], [210, 230]]) p.dot(x, y, 4, "#d9a088");
};
/** sol con rayos (lienzo 320 x 320) */
export const fxSol = (p: Pen) => {
  for (let k = 0; k < 12; k++) { const a = (k * Math.PI) / 6; p.stroke([[160 + 95 * Math.cos(a), 160 + 95 * Math.sin(a)], [160 + 145 * Math.cos(a), 160 + 145 * Math.sin(a)]], 14, "#ffb43a"); }
  p.ell(160, 160, 80, 80, "#ffd34d", 9);
};
