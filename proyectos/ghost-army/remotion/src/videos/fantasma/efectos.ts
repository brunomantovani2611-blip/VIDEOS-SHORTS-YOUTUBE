// Efectos 2D de caricatura para el Ejército Fantasma, dibujados con la Pen de toon.ts (planos, contorno de tinta).
import { Pen, INK } from "./toon";

type P2 = [number, number];
const G = (p: Pen) => p.g;
const FONT = '"DejaVu Sans", Arial, sans-serif';
const text = (p: Pen, s: string, x: number, y: number, size: number, col = INK, weight = 900, stroke = 0, rot = 0) => {
  const g = G(p); g.save(); g.translate(x, y); g.rotate(rot); g.font = `${weight} ${size}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
  if (stroke) { g.lineWidth = stroke; g.strokeStyle = INK; g.lineJoin = "round"; g.strokeText(s, 0, 0); }
  g.fillStyle = col; g.fillText(s, 0, 0); g.restore();
};
const OLIVE = "#5f6b3a";
/** tanque de perfil, de juguete (para dibujos y mapas): centro, ancho */
const tanquito = (p: Pen, cx: number, cy: number, w: number, col = OLIVE, ol = 6) => {
  const h = w * 0.45;
  p.poly([[cx - w / 2, cy], [cx + w / 2, cy], [cx + w * 0.42, cy + h * 0.45], [cx - w * 0.42, cy + h * 0.45]], "#3a3a40", ol);
  p.poly([[cx - w * 0.45, cy - h * 0.35], [cx + w * 0.45, cy - h * 0.35], [cx + w / 2, cy], [cx - w / 2, cy]], col, ol);
  p.ell(cx - w * 0.05, cy - h * 0.5, w * 0.2, h * 0.25, col, ol);
  p.stroke([[cx + w * 0.1, cy - h * 0.55], [cx + w * 0.5, cy - h * 0.6]], ol * 1.6);
};

/** fusil tachado: «ni un tiro» (lienzo 360 x 260) */
export const fxSinTiros = (p: Pen) => {
  p.poly([[40, 150], [250, 110], [320, 98], [324, 112], [254, 126], [120, 160], [80, 196], [46, 190]], "#7a5a3a", 8);
  p.stroke([[250, 116], [330, 102]], 12);
  G(p).save(); G(p).lineCap = "round";
  G(p).beginPath(); G(p).arc(180, 140, 112, 0, 7); G(p).lineWidth = 22; G(p).strokeStyle = "#d42f2f"; G(p).stroke();
  G(p).beginPath(); G(p).moveTo(100, 60); G(p).lineTo(260, 220); G(p).stroke(); G(p).restore();
};
/** pincel con pintura (lienzo 300 x 120) */
export const fxPincel = (p: Pen) => {
  p.poly([[20, 52], [190, 52], [190, 68], [20, 68]], "#c98a4a", 6);
  p.poly([[190, 46], [222, 46], [222, 74], [190, 74]], "#c9ccd6", 6);
  p.poly([[222, 46], [280, 52], [290, 60], [280, 68], [222, 74]], "#3f7a4a", 6);
};
/** fantasma de caricatura con el título (lienzo 640 x 440) */
export const fxFantasma = (p: Pen, t: number) => {
  const y = 12 * Math.sin(t * Math.PI * 2);
  const body: P2[] = [];
  for (let i = 0; i <= 20; i++) { const a = Math.PI + (i / 20) * Math.PI; body.push([320 + 130 * Math.cos(a), 170 + y + 120 * Math.sin(a)]); }
  for (let i = 0; i <= 6; i++) body.push([450 - i * (260 / 6), 300 + y + (i % 2 ? -26 : 0)]);
  p.poly(body, "#f6f6fb", 12);
  p.ell(280, 150 + y, 18, 26, INK, 0); p.ell(360, 150 + y, 18, 26, INK, 0);
  p.ell(320, 215 + y, 22, 28, "#5a1e28", 6);
  text(p, "EJÉRCITO FANTASMA", 320, 390, 52, "#f6f6fb", 900, 12);
};
/** caballete con un cuadro de un tanque (lienzo 360 x 480) */
export const fxCaballete = (p: Pen) => {
  p.stroke([[100, 470], [180, 40]], 14, "#8a5a32"); p.stroke([[260, 470], [180, 40]], 14, "#8a5a32"); p.stroke([[180, 60], [180, 470]], 12, "#7a4a2a");
  p.poly([[60, 90], [300, 90], [300, 300], [60, 300]], "#f6f1e2", 9);
  G(p).fillStyle = "#bfe3f7"; G(p).fillRect(64, 94, 232, 120); G(p).fillStyle = "#8aa456"; G(p).fillRect(64, 214, 232, 82);
  tanquito(p, 180, 220, 160);
  p.poly([[50, 300], [310, 300], [310, 320], [50, 320]], "#8a5a32", 8);
};
/** tablero de dibujo con un plano (lienzo 360 x 300) */
export const fxPlano = (p: Pen) => {
  p.poly([[20, 30], [340, 30], [340, 280], [20, 280]], "#2f5f9a", 10);
  G(p).save(); G(p).globalAlpha = 0.85;
  tanquito(p, 180, 160, 220, "#2f5f9a", 5);
  G(p).restore();
  G(p).strokeStyle = "#e8f0ff"; G(p).lineWidth = 4;
  for (const [a, b] of [[[60, 230], [300, 230]], [[60, 220], [60, 240]], [[300, 220], [300, 240]]] as [P2, P2][]) { G(p).beginPath(); G(p).moveTo(...a); G(p).lineTo(...b); G(p).stroke(); }
  text(p, "6 m", 180, 252, 26, "#e8f0ff", 800);
};
/** auriculares (lienzo 300 x 240), para ponerlos sobre una cabeza */
export const fxAuriculares = (p: Pen) => {
  G(p).save(); G(p).beginPath(); G(p).arc(150, 150, 110, Math.PI, 0); G(p).lineWidth = 18; G(p).strokeStyle = INK; G(p).stroke(); G(p).restore();
  p.ell(40, 160, 30, 46, "#3a3a44", 8); p.ell(260, 160, 30, 46, "#3a3a44", 8);
};
/** altavoz con ondas (lienzo 320 x 260), t = fase */
export const fxAltavoz = (p: Pen, t: number) => {
  p.poly([[30, 90], [90, 90], [160, 30], [160, 230], [90, 170], [30, 170]], "#8a8e96", 9);
  for (let k = 0; k < 3; k++) {
    const r = 50 + ((k * 40 + t * 40) % 120);
    G(p).save(); G(p).globalAlpha = Math.max(0, 1 - r / 170);
    G(p).beginPath(); G(p).arc(160, 130, r, -0.7, 0.7); G(p).lineWidth = 12; G(p).strokeStyle = INK; G(p).lineCap = "round"; G(p).stroke(); G(p).restore();
  }
};
/** inflador de pie (lienzo 200 x 320); k 0..1 = émbolo */
export const fxInflador = (p: Pen, k: number) => {
  const y = 60 + 70 * k;
  p.stroke([[100, y], [100, 150]], 10);
  p.poly([[50, y - 14], [150, y - 14], [150, y + 4], [50, y + 4]], "#3a3a44", 7);
  p.poly([[70, 150], [130, 150], [130, 290], [70, 290]], "#c6363c", 8);
  p.poly([[40, 290], [160, 290], [160, 310], [40, 310]], "#3a3a44", 7);
  p.stroke([[130, 270], [190, 250]], 8);
};
/** avioneta de reconocimiento vista desde abajo/lado, con un piloto con prismáticos (lienzo 520 x 260) */
export const fxAvion = (p: Pen) => {
  p.poly([[40, 130], [420, 112], [480, 124], [480, 140], [420, 152], [40, 140]], "#8a8e96", 9);
  p.poly([[180, 128], [320, 128], [360, 30], [300, 30]], "#9aa0a8", 9);
  p.poly([[60, 130], [100, 130], [80, 70], [56, 70]], "#9aa0a8", 8);
  p.ell(300, 116, 34, 26, "#bfe3f7", 6);
  p.ell(300, 112, 16, 16, "#ffe2c2", 4);
  p.poly([[312, 104], [330, 104], [330, 118], [312, 118]], INK, 0);
  p.ell(484, 132, 8, 40, "rgba(80,80,90,.4)", 0);
};
/** ondas de sonido (lienzo 400 x 400), t = fase */
export const fxOndas = (p: Pen, t: number) => {
  for (let k = 0; k < 4; k++) {
    const r = 40 + ((k * 45 + t * 45) % 180);
    G(p).save(); G(p).globalAlpha = Math.max(0, 1 - r / 220) * 0.9;
    G(p).beginPath(); G(p).arc(200, 200, r, 0, 7); G(p).lineWidth = 10; G(p).strokeStyle = "#cfe3ff"; G(p).stroke(); G(p).restore();
  }
};
/** iconos: motor (engranaje) y botas (lienzo 240 x 240) */
export const fxMotor = (p: Pen) => {
  const pts: P2[] = [];
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, r = k % 2 ? 80 : 100; pts.push([120 + r * Math.cos(a), 120 + r * Math.sin(a)]); }
  p.poly(pts, "#c9ccd6", 9); p.ell(120, 120, 34, 34, "#3a3a44", 8);
  text(p, "BRRR", 120, 222, 40, "#ffd34d", 900, 9);
};
export const fxBotas = (p: Pen) => {
  for (const [x, y] of [[70, 120], [160, 90]] as const) { p.poly([[x - 26, y - 70], [x + 14, y - 70], [x + 14, y + 10], [x + 54, y + 20], [x + 54, y + 44], [x - 26, y + 44]], "#5a3a22", 8); }
  text(p, "PUM PUM", 120, 222, 36, "#ffd34d", 900, 9);
};
/** luna (lienzo 240 x 240) */
export const fxLuna = (p: Pen) => {
  p.ell(120, 120, 90, 90, "#f4f0d8", 0);
  p.ell(150, 100, 80, 80, "rgba(20,30,60,0)", 0);
  for (const [x, y, r] of [[90, 90, 14], [140, 150, 10], [150, 80, 8]] as const) p.ell(x, y, r, r, "#e2dcc0", 0);
};
/** radio: ondas con puntos y rayas (lienzo 420 x 300), t = fase */
export const fxMorse = (p: Pen, t: number) => {
  for (let k = 0; k < 3; k++) {
    const r = 50 + ((k * 50 + t * 50) % 150);
    G(p).save(); G(p).globalAlpha = Math.max(0, 1 - r / 200);
    G(p).beginPath(); G(p).arc(60, 240, r, -1.4, -0.1); G(p).lineWidth = 14; G(p).strokeStyle = INK; G(p).stroke(); G(p).restore();
  }
  const code = "·−·· −−− ·−", n = Math.floor(code.length * ((t * 2) % 1.2));
  text(p, code.slice(0, n), 240, 70, 64, "#ffd34d", 900, 12);
};
/** hoja de mensaje falso (lienzo 360 x 260) */
export const fxMensaje = (p: Pen) => {
  p.poly([[20, 20], [340, 20], [340, 240], [20, 240]], "#fbf7ee", 9);
  text(p, "MENSAJE", 180, 70, 44, INK, 900);
  for (const y of [120, 150, 180]) p.stroke([[50, y], [310, y]], 6, "#c9c0b0");
  text(p, "FALSO", 220, 190, 54, "#d42f2f", 900, 0, -0.25);
};
/** parche de hombro de una unidad (lienzo 220 x 260): k = 0 (el de verdad) o 1 (el falso) */
export const fxParche = (p: Pen, k: number) => {
  const cols = k ? ["#c6363c", "#f2c230"] : ["#2f5f9a", "#f4f1ea"];
  p.poly([[20, 20], [200, 20], [200, 170], [110, 240], [20, 170]], cols[0], 10);
  text(p, k ? "9" : "23", 110, 110, 96, cols[1], 900, 8);
};
/** bicicleta de perfil (lienzo 520 x 320) */
export const fxBici = (p: Pen, t: number) => {
  const wheel = (cx: number) => {
    p.ell(cx, 230, 78, 78, null, 12);
    for (let k = 0; k < 6; k++) { const a = t * 6 + (k * Math.PI) / 3; p.stroke([[cx, 230], [cx + 72 * Math.cos(a), 230 + 72 * Math.sin(a)]], 3); }
  };
  wheel(110); wheel(410);
  p.stroke([[110, 230], [240, 230], [210, 110], [110, 230]], 12, "#2f5f9a");
  p.stroke([[240, 230], [380, 120], [210, 120]], 12, "#2f5f9a");
  p.stroke([[380, 120], [410, 230]], 12, "#2f5f9a");
  p.stroke([[380, 120], [370, 80], [410, 74]], 10);
  p.poly([[180, 96], [240, 96], [236, 110], [184, 110]], INK, 0);
  p.ell(240, 230, 18, 18, INK, 0);
};
/** bíceps (lienzo 260 x 240) */
export const fxMusculo = (p: Pen) => {
  p.poly([[30, 200], [110, 200], [140, 150], [150, 70], [120, 30], [90, 40], [100, 90], [70, 140], [30, 150]], "#ffe2c2", 9);
  p.ell(128, 110, 52, 44, "#ffe2c2", 9);
  for (const [x, y, a] of [[200, 60, -0.6], [216, 110, 0], [200, 160, 0.6]] as const) p.stroke([[x, y], [x + 30 * Math.cos(a), y + 30 * Math.sin(a)]], 9);
};
/** prismáticos (lienzo 260 x 140) */
export const fxPrismaticos = (p: Pen) => {
  p.poly([[20, 30], [120, 30], [120, 120], [20, 120]], "#2a2730", 8);
  p.poly([[140, 30], [240, 30], [240, 120], [140, 120]], "#2a2730", 8);
  p.poly([[110, 50], [150, 50], [150, 90], [110, 90]], "#3a3a44", 6);
  p.ell(70, 75, 30, 30, "#6a8aa8", 5); p.ell(190, 75, 30, 30, "#6a8aa8", 5);
};
/** mapa del Rin con el cruce falso y el de verdad (lienzo 600 x 700); a, b 0..1 = cuánto se ha dibujado cada flecha */
export const fxMapa = (p: Pen, a: number, b: number) => {
  p.poly([[10, 10], [590, 10], [590, 690], [10, 690]], "#efe6c8", 12);
  const river: P2[] = [];
  for (let i = 0; i <= 20; i++) river.push([300 + 70 * Math.sin(i * 0.55), 20 + i * 33]);
  G(p).save(); G(p).lineCap = "round";
  p.stroke(river, 70, "#5aa0c8"); G(p).restore();
  text(p, "RIN", 300, 660, 40, "#2f5f9a", 900);
  // a la izquierda: el cruce falso (fantasmas)
  for (let k = 0; k < 3; k++) tanquito(p, 110, 160 + k * 70, 90, "#c9d4e0", 4);
  if (a > 0) {
    const n = Math.max(2, Math.round(10 * a)), pts: P2[] = [];
    for (let i = 0; i <= n; i++) pts.push([160 + (220 * i) / 10, 230 - (40 * i) / 10]);
    G(p).save(); G(p).setLineDash([22, 18]); p.stroke(pts, 14, "#8a8e96"); G(p).restore();
    text(p, "FALSO", 150, 90, 48, "#8a8e96", 900);
  }
  // abajo: el cruce de verdad
  for (let k = 0; k < 3; k++) tanquito(p, 100 + k * 70, 520, 80, OLIVE, 4);
  if (b > 0) {
    const n = Math.max(2, Math.round(10 * b)), pts: P2[] = [];
    for (let i = 0; i <= n; i++) pts.push([180 + (300 * i) / 10, 470 - (10 * i) / 10]);
    p.stroke(pts, 18, "#2f9a4a");
    if (b >= 1) { p.poly([[480, 440], [540, 465], [482, 494]], "#2f9a4a", 0); text(p, "DE VERDAD", 300, 600, 44, "#2f9a4a", 900); }
  }
};
/** carpeta de archivo «SECRETO» (lienzo 460 x 380); lock = con el candado y las cadenas */
export const fxCarpeta = (p: Pen, lock: boolean) => {
  p.poly([[30, 60], [170, 60], [190, 30], [430, 30], [430, 350], [30, 350]], "#d9b37a", 10);
  G(p).save(); G(p).translate(230, 200); G(p).rotate(-0.15);
  G(p).strokeStyle = "#d42f2f"; G(p).lineWidth = 10; G(p).strokeRect(-150, -48, 300, 96);
  G(p).font = `900 64px ${FONT}`; G(p).textAlign = "center"; G(p).textBaseline = "middle"; G(p).fillStyle = "#d42f2f"; G(p).fillText("SECRETO", 0, 4);
  G(p).restore();
  if (lock) {
    for (const [a, b] of [[[20, 120], [440, 280]], [[20, 280], [440, 120]]] as [P2, P2][]) {
      const n = 12;
      for (let i = 0; i < n; i++) { const u = i / n, x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u; p.ell(x, y, 20, 12, "#9aa0a8", 5, 0, 360, Math.atan2(b[1] - a[1], b[0] - a[0]) * 57.3); }
    }
    G(p).save(); G(p).beginPath(); G(p).arc(230, 190, 34, Math.PI, 0); G(p).lineWidth = 14; G(p).strokeStyle = INK; G(p).stroke(); G(p).restore();
    p.poly([[186, 190], [274, 190], [274, 260], [186, 260]], "#f2c230", 9);
    p.ell(230, 222, 9, 12, INK, 0);
  }
};
/** medalla de oro con cinta (lienzo 300 x 420) */
export const fxMedalla = (p: Pen) => {
  p.poly([[90, 10], [150, 10], [170, 200], [130, 200]], "#2f5f9a", 7);
  p.poly([[150, 10], [210, 10], [170, 200], [130, 200]], "#c6363c", 7);
  p.ell(150, 290, 110, 110, "#f2c230", 10);
  p.ell(150, 290, 84, 84, "#e0a92a", 5);
  const pts: P2[] = [];
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 26 : 62; pts.push([150 + r * Math.cos(a), 290 + r * Math.sin(a)]); }
  p.poly(pts, "#fff1a8", 5);
};
/** confeti (lienzo 400 x 400), t 0..1 */
export const fxConfeti = (p: Pen, t: number) => {
  const cols = ["#e2453c", "#f2a900", "#3f9a8a", "#5a8fc2", "#f4f1ea"];
  for (let i = 0; i < 26; i++) {
    const x = (i * 97) % 400, y = ((i * 53) % 200) + t * 220, a = i + t * 8;
    const c = Math.cos(a), s = Math.sin(a);
    p.poly([[x - 12 * c, y - 12 * s], [x + 12 * c, y + 12 * s], [x + 12 * c + 6 * s, y + 12 * s - 6 * c], [x - 12 * c + 6 * s, y - 12 * s - 6 * c]], cols[i % 5], 0);
  }
};
/** signo de interrogación / de exclamación de tinta (lienzo 160 x 220) */
export const fxSigno = (p: Pen, s: "?" | "!") => {
  const g = G(p);
  g.save(); g.font = "900 200px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.lineWidth = 14; g.strokeStyle = INK; g.strokeText(s, 80, 112); g.fillStyle = "#ffd34d"; g.fillText(s, 80, 112); g.restore();
};
/** bocadillo de diálogo con texto (lienzo 520 x 300) */
export const fxBocadillo = (p: Pen, lines: string[]) => {
  p.poly([[20, 20], [500, 20], [500, 220], [180, 220], [90, 290], [120, 220], [20, 220]], "#ffffff", 10);
  lines.forEach((l, i) => text(p, l, 260, 80 + i * 76 - (lines.length - 1) * 8, 50, INK, 900));
};
/** bandera de barras y estrellas ondeando en su mástil (lienzo 300 x 240), t = fase */
export const fxEEUU = (p: Pen, t: number) => {
  const pts = (y0: number, y1: number, x0 = 40, x1 = 280): P2[] => {
    const top: P2[] = [], bot: P2[] = [];
    for (let i = 0; i <= 10; i++) { const x = x0 + ((x1 - x0) * i) / 10, w = 8 * Math.sin(t + i * 0.7) * ((x - 40) / 240); top.push([x, y0 + w]); bot.push([x, y1 + w]); }
    return [...top, ...bot.reverse()];
  };
  p.band([[34, 20], [34, 236]], "#d9a441", 10, 4);
  for (let k = 0; k < 7; k++) p.poly(pts(30 + k * 18, 48 + k * 18), k % 2 ? "#f6f3ee" : "#c6363c", 0);
  p.poly(pts(30, 84, 40, 140), "#2f4a8a", 0);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) p.ell(56 + j * 24, 42 + i * 16, 4, 4, "#ffffff", 0);
  p.poly(pts(30, 156), null, 7);
};
