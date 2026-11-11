// Wojtek: un oso pardo de caricatura, propio, en el mismo lenguaje que el elenco (relleno plano, contorno de tinta,
// media luna de sombra del lado contrario a la luz). Espacio de diseño 600 x 1000 (las plantas en y = 975), como bodyFront.
import { Pen, INK, shade } from "./toon";

type P2 = [number, number];
export type OsoExpr = "smile" | "happy" | "laugh" | "neutral" | "sad" | "shock";
export type OsoArms = "down" | "salute" | "wave" | "hug" | "carry" | "bottle" | "shell" | "sad";
export type OsoOpts = { expr?: OsoExpr; arms?: OsoArms; cap?: boolean; blink?: number; light?: number; bronze?: boolean; look?: number; wet?: boolean };

type Pal = { fur: string; dark: string; muzzle: string; belly: string; ear: string; eye: string };
const FUR: Pal = { fur: "#8a5634", dark: "#6a3f24", muzzle: "#dcb589", belly: "#a87048", ear: "#c98f6a", eye: INK };
const BRONZE: Pal = { fur: "#9a7440", dark: "#76572e", muzzle: "#b88f55", belly: "#8a6638", ear: "#a88048", eye: "#4a3418" };
const CAP = "#7a7444";
const MOUTH = "#5a1e28";

const rad = (d: number) => (d * Math.PI) / 180;
const ellP = (cx: number, cy: number, rx: number, ry: number, rot = 0, n = 40): P2[] => {
  const pts: P2[] = [], r = rad(rot);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, x = rx * Math.cos(a), y = ry * Math.sin(a);
    pts.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return pts;
};
/** forma con relleno, media luna de sombra lejos de la luz y contorno */
const blobFill = (p: Pen, pts: P2[], col: string, light: number, ol = 12) => {
  p.gradFill(pts, col, shade(col, 0.72), light, 0.35);
  p.poly(pts, null, ol);
};
const bez = (a: P2, b: P2, c: P2, n = 12): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]]); }
  return out;
};
const limb = (p: Pen, a: P2, b: P2, c: P2, col: string, w = 74) => p.line(bez(a, b, c), col, w);
const paw = (p: Pen, x: number, y: number, P: Pal, r = 40) => p.ell(x, y, r, r * 0.92, P.dark, 10);

/** caja de munición de madera (centro x, arriba y0) */
export const caja = (p: Pen, x0: number, y0: number, x1: number, y1: number) => {
  p.poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], "#a87a44", 10);
  p.poly([[x0, y0], [x1, y0], [x1, y0 + 18], [x0, y0 + 18]], "#8a6034", 6);
  p.stroke([[x0 + 20, y1 - 14], [x1 - 20, y0 + 30]], 8, "#7a5430");
  p.g.save(); p.g.font = `900 ${Math.round((y1 - y0) * 0.32)}px "DejaVu Sans", Arial, sans-serif`; p.g.textAlign = "center"; p.g.textBaseline = "middle";
  p.g.fillStyle = "#3a2a1a"; p.g.fillText("25 PDR", (x0 + x1) / 2, (y0 + y1) / 2 + 6); p.g.restore();
};
/** proyectil de artillería tumbado (centro, largo) */
export const proyectil = (p: Pen, cx: number, cy: number, len: number, rot = 0) => {
  const h = len * 0.2, c = Math.cos(rot), s = Math.sin(rot);
  const T = (x: number, y: number): P2 => [cx + x * c - y * s, cy + x * s + y * c];
  const body: P2[] = [T(-len / 2, -h), T(len * 0.12, -h), T(len * 0.3, -h * 0.8), T(len / 2, 0), T(len * 0.3, h * 0.8), T(len * 0.12, h), T(-len / 2, h)];
  p.poly(body, "#d9a441", 9);
  p.poly([T(-len / 2, -h), T(-len * 0.36, -h), T(-len * 0.36, h), T(-len / 2, h)], "#b8862e", 7);
  p.stroke([T(len * 0.08, -h), T(len * 0.08, h)], 7, "#8a6020");
};

/** la cabeza (centro cx, cy; s = escala) */
export const cabeza = (p: Pen, cx: number, cy: number, s: number, o: OsoOpts) => {
  const P = o.bronze ? BRONZE : FUR, light = o.light ?? rad(-120), expr = o.expr ?? "smile", lid = o.blink ?? 0;
  const X = (v: number) => cx + v * s, Y = (v: number) => cy + v * s;
  for (const sx of [-1, 1]) { p.ell(X(sx * 118), Y(-105), 44 * s, 44 * s, P.fur, 11 * s); p.ell(X(sx * 118), Y(-102), 23 * s, 23 * s, P.ear, 0); }
  blobFill(p, ellP(X(0), Y(0), 142 * s, 126 * s), P.fur, light, 12 * s);
  p.ell(X(0), Y(58), 74 * s, 54 * s, P.muzzle, 9 * s);
  const look = (o.look ?? 0) * 6 * s;
  // ojos
  const ey = Y(-12);
  for (const sx of [-1, 1]) {
    const x = X(sx * 52);
    const closed = lid >= 1 || expr === "happy" || expr === "laugh";
    if (expr === "laugh") p.stroke([[x + sx * 14 * s, ey - 12 * s], [x - sx * 12 * s, ey], [x + sx * 14 * s, ey + 12 * s]], 9 * s);
    else if (expr === "happy") p.arc(x, ey + 8 * s, 19 * s, 14 * s, 200, 340, 9 * s);
    else if (closed) p.stroke([[x - 17 * s, ey], [x + 17 * s, ey]], 9 * s);
    else if (expr === "shock") { p.ell(x, ey, 25 * s, 25 * s, "#ffffff", 6 * s); p.dot(x + look, ey + 3 * s, 8 * s, P.eye); }
    else p.ell(x + look, ey, 10 * s, (lid > 0 ? 6 : 13) * s, P.eye, 0);
    // cejas
    const by = ey - 36 * s;
    if (expr === "sad") p.stroke([[x - sx * 18 * s, by - 6 * s], [x + sx * 16 * s, by + 8 * s]], 8 * s);
    else if (expr === "shock") p.arc(x, by - 4 * s, 20 * s, 8 * s, 200, 340, 8 * s);
    else p.stroke([[x - 16 * s, by + 2 * s], [x + 16 * s, by - 2 * s * sx * sx]], 7 * s);
  }
  // nariz y boca
  p.ell(X(0), Y(34), 29 * s, 20 * s, INK, 0);
  p.ell(X(-8), Y(28), 9 * s, 5 * s, "rgba(255,255,255,.35)", 0);
  const my = Y(64);
  p.stroke([[X(0), Y(50)], [X(0), my]], 7 * s);
  switch (expr) {
    case "happy": case "laugh": {
      const w = expr === "laugh" ? 40 : 30, h = expr === "laugh" ? 34 : 24;
      p.ell(X(0), my, w * s, h * s, MOUTH, 7 * s, 0, 180);
      p.ell(X(4), my + h * 0.55 * s, w * 0.45 * s, h * 0.3 * s, "#e86e78", 0);
      break;
    }
    case "sad": p.arc(X(0), my + 14 * s, 26 * s, 12 * s, 200, 340, 7 * s); break;
    case "shock": p.ell(X(0), my + 10 * s, 16 * s, 20 * s, MOUTH, 7 * s); break;
    case "neutral": p.stroke([[X(-18), my + 2 * s], [X(18), my + 2 * s]], 7 * s); break;
    default: p.arc(X(0), my - 6 * s, 28 * s, 16 * s, 20, 160, 7 * s);
  }
  if (o.cap) { // gorra de cuartel caqui, ladeada
    const g: P2[] = [[X(-112), Y(-88)], [X(96), Y(-122)], [X(118), Y(-150)], [X(70), Y(-178)], [X(-80), Y(-158)], [X(-120), Y(-118)]];
    p.poly(g, CAP, 10 * s);
    p.stroke([[X(-110), Y(-100)], [X(104), Y(-132)]], 6 * s, shade(CAP, 0.7));
    p.ell(X(-60), Y(-118), 12 * s, 12 * s, "#e8c45a", 5 * s);
  }
  if (o.wet) for (const [dx, dy] of [[-150, -40], [160, 10], [120, -150]] as P2[]) {
    const x = X(dx), y = Y(dy), r = 12 * s;
    p.poly([[x, y - 2.2 * r], [x + r, y], [x, y + r], [x - r, y]], "#9fd4f2", 4 * s);
  }
};

/** Wojtek de pie, de frente */
export const osoFront = (p: Pen, o: OsoOpts) => {
  const P = o.bronze ? BRONZE : FUR, light = o.light ?? rad(-120), arms = o.arms ?? "down";
  // piernas y pies
  for (const sx of [-1, 1]) {
    blobFill(p, ellP(300 + sx * 66, 872, 68, 92), P.fur, light);
    p.ell(300 + sx * 74, 952, 66, 26, P.dark, 10);
  }
  // brazo de atrás (los que van por detrás del cuerpo no hay: todos se dibujan encima)
  blobFill(p, ellP(300, 660, 168, 232), P.fur, light);
  p.ell(300, 712, 100, 150, P.belly, 0);
  const L: P2 = [152, 520], R: P2 = [448, 520];
  const HEAD_Y = 330;
  // objetos que van detrás de las patas
  if (arms === "carry") caja(p, 110, 40, 490, 178);
  // brazos
  const two = (a: [P2, P2], b: [P2, P2]) => { limb(p, L, a[0], a[1], P.fur); limb(p, R, b[0], b[1], P.fur); };
  switch (arms) {
    case "down": two([[118, 640], [146, 760]], [[482, 640], [454, 760]]); break;
    case "sad": two([[150, 660], [196, 790]], [[450, 660], [404, 790]]); break;
    case "salute": two([[118, 640], [146, 760]], [[530, 420], [420, 236]]); break;
    case "wave": two([[118, 640], [146, 760]], [[540, 420], [540, 250]]); break;
    case "hug": two([[60, 520], [40, 400]], [[540, 520], [560, 400]]); break;
    case "carry": two([[96, 330], [150, 150]], [[504, 330], [450, 150]]); break;
    case "bottle": two([[118, 640], [146, 760]], [[530, 470], [478, 340]]); break;
    case "shell": two([[110, 620], [190, 650]], [[490, 620], [410, 650]]); break;
  }
  cabeza(p, 300, HEAD_Y, 1, o);
  // patas y objetos delante
  const ends: Record<OsoArms, [P2, P2]> = {
    down: [[146, 760], [454, 760]], sad: [[196, 790], [404, 790]], salute: [[146, 760], [420, 236]], wave: [[146, 760], [540, 250]],
    hug: [[40, 400], [560, 400]], carry: [[150, 150], [450, 150]], bottle: [[146, 760], [478, 340]], shell: [[190, 650], [410, 650]],
  };
  if (arms === "shell") proyectil(p, 300, 640, 330, 0);
  if (arms === "bottle") {
    const bx = 482, by = 300;
    p.poly([[bx - 22, by + 60], [bx + 22, by + 60], [bx + 22, by - 20], [bx + 10, by - 50], [bx + 10, by - 92], [bx - 10, by - 92], [bx - 10, by - 50], [bx - 22, by - 20]], "#7a4a1e", 8);
    p.poly([[bx - 22, by - 6], [bx + 22, by - 6], [bx + 22, by + 30], [bx - 22, by + 30]], "#f2e2b0", 0);
    p.ell(bx, by - 104, 22, 16, "#fbf3dc", 6);
  }
  for (const e of ends[arms]) paw(p, e[0], e[1], P);
};

/** Wojtek de perfil (mirando a la derecha del lienzo) caminando con una caja sobre la cabeza; ph = fase del paso 0..1 */
export const osoSide = (p: Pen, o: OsoOpts, ph: number) => {
  const P = o.bronze ? BRONZE : FUR, light = o.light ?? rad(-120);
  const sw = Math.sin(ph * Math.PI * 2), bob = 10 * Math.abs(Math.cos(ph * Math.PI * 2));
  const leg = (x: number, k: number, col: string) => {
    const s = sw * k;
    p.line([[x, 800 - bob], [x + 40 * s, 890], [x + 70 * s, 950]], col, 78);
    p.ell(x + 70 * s + 18, 956, 56, 22, P.dark, 9);
  };
  leg(300, -1, shade(P.fur, 0.8));
  // los dos brazos suben por detrás de la cabeza hasta la caja
  p.line([[290, 520 - bob], [250, 330 - bob], [230, 165 - bob]], shade(P.fur, 0.8), 70);
  p.line([[330, 520 - bob], [380, 330 - bob], [400, 165 - bob]], P.fur, 74);
  caja(p, 120, 40 - bob, 470, 170 - bob);
  paw(p, 230, 160 - bob, P); paw(p, 400, 160 - bob, P);
  blobFill(p, ellP(300, 650 - bob, 150, 225, -6), P.fur, light);
  p.ell(318, 700 - bob, 80, 140, P.belly, 0);
  leg(290, 1, P.fur);
  // cabeza de perfil
  const hx = 320, hy = 340 - bob;
  p.ell(hx - 62, hy - 98, 40, 40, P.fur, 11); p.ell(hx - 62, hy - 95, 21, 21, P.ear, 0);
  blobFill(p, ellP(hx, hy, 122, 110), P.fur, light);
  p.ell(hx + 100, hy + 40, 74, 47, P.muzzle, 9);
  p.ell(hx + 165, hy + 22, 22, 18, INK, 0);
  p.ell(hx + 42, hy - 16, 10, 13, P.eye, 0);
  p.stroke([[hx + 24, hy - 50], [hx + 60, hy - 54]], 7);
  p.arc(hx + 122, hy + 54, 24, 13, 30, 150, 7);
  if (o.cap) p.poly([[hx - 104, hy - 64], [hx + 60, hy - 100], [hx + 72, hy - 128], [hx - 64, hy - 140], [hx - 112, hy - 94]], CAP, 10);
};
