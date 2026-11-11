// «El oso que fue soldado» (Wojtek, 1942-1963). Línea de tiempo del short: tomas atadas a los cuadros de cada palabra
// de la voz (../../../../voz/palabras.json), cámaras con la gramática de la skill.
//
// Decorados al aire libre repartidos por un mismo mundo: el campamento polaco en la arena (x ≈ 0), el camino de Irán
// (x ≈ 80), el muelle con el barco (z ≈ 300, mar hacia +z), Montecassino con la colina del monasterio (x ≈ -400),
// el zoo de Edimburgo (x ≈ -700) y la estatua en un parque (x ≈ -450, z ≈ 100). La oficina de alistamiento es un
// interior abierto lejos de todo (x ≈ 600, pared del fondo en z = -596).
//
// Cuadros clave de la voz (30 fps): Segunda@8 polaco@55 soldado@75 especial@91 era@108 oso@117 Irán@130 1942@145
// soldados@194 chico@233 osezno@255 saco@269 cambian@291 chocolate@303 lata@332 navaja@346 llaman@367 Wojtek@375
// Crece@392 lucha@418 broma@427 duchas@474 según@490 cerveza@529 Pero@547 1944@554 embarcar@609 Italia@624 barcos@648
// británicos@656 animales@690 solución@714 Alistarlo@733 ejército@753 Wojtek@771 soldado@796 rango@817 raciones@825
// batalla@852 Montecassino@863 compañeros@891 cargaba@914 cajas@925 munición@935 uno@958 Tanto@980 emblema@1019
// oso@1038 proyectil@1056 terminar@1079 guerra@1092 vivir@1109 zoo@1119 Edimburgo@1127 veteranos@1154 visitarlo@1186
// Hoy@1206 estatuas@1216 Escocia@1229 Polonia@1246 (fin de la voz ~1258)
export const FPS = 30;
export const TOTAL = 1280;
export const D0 = 6.0;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const lin = (pts: [number, number][], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
};

// ---------------- lugares ----------------
export const TOWER_C: [number, number] = [0, 9999];
export const BACK_Z = -596;
/** campamento: fila de soldados en z = -3, la ducha a la derecha, el camión a la izquierda */
export const FILA_Z = -3;
export const FILA_X = [-2.4, -1.6, -0.8, 0, 0.8];
export const OSO_FILA_X = 1.7;
export const DUCHA: V3 = [6, D0, -4];
export const CAMION: V3 = [-15, D0, -2];
/** camino de Irán */
export const CAMINO: V3 = [80, D0, -60];
/** muelle: borde en z = 300, casco del barco de z = 302 a 314, pasarela a lo largo de x en z = 301.3 */
export const MUELLE_Z = 300;
export const CASCO_Z = 301.4;
export const CUBIERTA_Y = 2.4;
export const PASARELA: [number, number] = [5, 0]; // de x = 5 (en el muelle) a x = 0 (en la cubierta)
/** oficina de alistamiento (interior) */
export const OFICINA_X = 600;
export const MESA_OF: V3 = [599.5, D0, -597.6];
/** Montecassino */
export const CASSINO: V3 = [-400, D0, -100];
export const COLINA: V3 = [-400, D0 - 70, -330];
/** zoo de Edimburgo: barandilla en z = -98.3, muro de piedra al fondo */
export const ZOO: V3 = [-700, D0, -100];
/** la estatua */
export const ESTATUA: V3 = [-450, D0, 100];
export const PEANA_H = 1.0;

// ---------------- tomas ----------------
export type Light = "day" | "golden";
export type Scene = "fila" | "camino" | "campo" | "muelle" | "oficina" | "cassino" | "camion" | "zoo" | "estatua";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene; sunAz?: number; sunEl?: number; fogFar?: number };
const IN = { sunAz: 160, sunEl: 50 };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 130, light: "day", scene: "fila", sunAz: 120, sunEl: 45 },          // la fila de soldados... y un oso
  { id: 2, a: 130, b: 283, light: "day", scene: "camino", sunAz: 120, sunEl: 40, fogFar: 650 }, // Irán, 1942: el chico del saco
  { id: 3, a: 283, b: 363, light: "day", scene: "camino", sunAz: 120, sunEl: 40, fogFar: 650 }, // el trueque
  { id: 4, a: 363, b: 418, light: "day", scene: "campo", sunAz: 120, sunEl: 45 },       // se llama Wojtek y crece
  { id: 5, a: 418, b: 457, light: "day", scene: "campo", sunAz: 120, sunEl: 45 },       // lucha en broma
  { id: 6, a: 457, b: 489, light: "day", scene: "campo", sunAz: 120, sunEl: 45 },       // la ducha
  { id: 7, a: 489, b: 547, light: "day", scene: "campo", sunAz: 120, sunEl: 45 },       // la cerveza
  { id: 8, a: 547, b: 640, light: "day", scene: "muelle", sunAz: 110, sunEl: 40 },      // 1944: embarcan hacia Italia
  { id: 9, a: 640, b: 710, light: "day", scene: "muelle", sunAz: 110, sunEl: 40 },      // no se admiten animales
  { id: 10, a: 710, b: 845, light: "day", scene: "oficina", ...IN },                    // lo alistan
  { id: 11, a: 845, b: 980, light: "day", scene: "cassino", sunAz: 100, sunEl: 35, fogFar: 900 }, // Montecassino
  { id: 12, a: 980, b: 1075, light: "day", scene: "camion", sunAz: 120, sunEl: 45 },    // el emblema
  { id: 13, a: 1075, b: 1206, light: "day", scene: "zoo", sunAz: 120, sunEl: 45 },      // el zoo de Edimburgo
  { id: 14, a: 1206, b: TOTAL, light: "golden", scene: "estatua", sunAz: 150, sunEl: 22 }, // las estatuas
];
export const XFADE: Record<number, number> = { 2: 10, 4: 8, 8: 8, 10: 8, 11: 8, 12: 8, 13: 10, 14: 10 };
export const FLASH_AT = -100;
export const BLACK: [number, number] = [-10, -10];

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

/** cifras discretas arriba del cuadro [desde, hasta, texto] */
export const CIFRAS: [number, number, string][] = [
  [135, 200, "Irán, 1942"],
  [554, 606, "1944"],
  [863, 935, "Montecassino"],
  [1127, 1185, "Edimburgo"],
];

// ---------------- movimientos ----------------
/** el chico del saco entra por la derecha y se para */
export const chicoX = (f: number) => lin([[130, 84.2], [232, 81.3]], f);
/** el osezno crece de golpe al decir «Crece» */
export const crece = (f: number) => (f < 392 ? 0.5 : 0.5 + 0.5 * smooth((f - 392) / 12));
/** soldados subiendo por la pasarela (x de 5 a 0, sube a la cubierta) */
export const subeX = (f: number, k: number) => 3.4 - (f - 547 - k * 26) * 0.03;
export const pasarelaY = (x: number) => (x >= PASARELA[0] ? 0 : x <= PASARELA[1] ? CUBIERTA_Y : CUBIERTA_Y * (PASARELA[0] - x) / (PASARELA[0] - PASARELA[1]));
/** Wojtek cargando cajas en Montecassino */
export const osoCassinoX = (f: number) => lin([[845, -401.9], [980, -399.0]], f);

// ---------------- cámara ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
const mixC = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mixC(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
/** factor de empuje desde f0 (el sujeto crece ~rate por cuadro), con "punch" en las primeras n */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });

// 1 · la fila de soldados (mirando a -z: +x a la derecha del cuadro); paneo hasta el oso
const S1a = (f: number): Shot => dolly([-1.25, D0 + 1.5, 3.4], [-1.25, D0 + 1.3, FILA_Z], pushK(f, 0, 0.0012), { fov: 44 });
const S1b = (f: number): Shot => dolly([1.15, D0 + 1.45, 2.6], [1.15, D0 + 1.25, FILA_Z], pushK(f, 105, 0.0025, 0.007, 24), { fov: 44 });
// 2 · el camino de Irán: los dos soldados a la izquierda, el chico entra por la derecha
const S2a = (f: number): Shot => dolly([80.7, D0 + 1.55, -53.2], [80.7, D0 + 1.3, CAMINO[2]], pushK(f, 130, 0.0012), { fov: 44 });
// 3 · el trueque, más cerca
const S3a = (f: number): Shot => dolly([80.8, D0 + 1.45, -55.6], [80.8, D0 + 1.3, CAMINO[2]], pushK(f, 283, 0.0022, 0.006, 24), { fov: 42 });
// 4 · el osezno con su nombre; al crecer, la cámara retrocede un poco
const S4a = (f: number): Shot => dolly([0.05, D0 + 1.15, 0.9], [0.05, D0 + 0.95, FILA_Z], pushK(f, 363, 0.002), { fov: 42 });
const S4b = (f: number): Shot => dolly([0.05, D0 + 1.4, 2.3], [0.05, D0 + 1.15, FILA_Z], pushK(f, 392, 0.0015), { fov: 42 });
// 5 · lucha en broma
const S5a = (f: number): Shot => dolly([-0.2, D0 + 1.45, 2.4], [-0.2, D0 + 1.2, FILA_Z], pushK(f, 418, 0.003, 0.007, 20), { fov: 42 });
// 6 · la ducha
const S6a = (f: number): Shot => dolly([DUCHA[0] - 0.45, D0 + 1.5, 1.6], [DUCHA[0] - 0.45, D0 + 1.35, DUCHA[2]], pushK(f, 457, 0.003, 0.007, 20), { fov: 42 });
// 7 · la cerveza
const S7a = (f: number): Shot => dolly([0.0, D0 + 1.45, 1.9], [0.0, D0 + 1.3, FILA_Z], pushK(f, 489, 0.003, 0.006, 24), { fov: 40 });
// 8 · el muelle (mirando a +z: +x a la IZQUIERDA del cuadro): el barco, la pasarela, Wojtek esperando
const S8a = (f: number): Shot => dolly([0.5, D0 + 1.7, 286.8], [0.5, D0 + 2.7, CASCO_Z], pushK(f, 547, 0.0012), { fov: 50 });
// 9 · el oficial con el cartel
const S9a = (f: number): Shot => dolly([-1.65, D0 + 1.45, 293.0], [-1.65, D0 + 1.3, 299.2], pushK(f, 640, 0.0025, 0.007, 24), { fov: 42 });
// 10 · la oficina (mirando a +z, hacia la pared del fondo: +x a la IZQUIERDA): el oficial en la mesa, Wojtek delante
const S10a = (f: number): Shot => dolly([600.05, D0 + 1.6, -603.3], [600.05, D0 + 1.2, -597.3], pushK(f, 710, 0.0016), { fov: 44 });
// 11 · Montecassino: la colina del monasterio al fondo, Wojtek con la caja
const S11a = (f: number): Shot => ({ pos: [osoCassinoX(f) + 0.4, D0 + 1.4, -92.2], look: [osoCassinoX(f) + 0.4, D0 + 1.75, -110], fov: 46 });
// 12 · el camión con el emblema
const S12a = (f: number): Shot => dolly([CAMION[0] - 0.1, D0 + 1.6, 5.8], [CAMION[0] - 0.1, D0 + 1.35, CAMION[2]], pushK(f, 980, 0.0018), { fov: 44 });
// 13 · el zoo: los veteranos en la barandilla, Wojtek dentro
const S13a = (f: number): Shot => dolly([ZOO[0], D0 + 1.6, -92.4], [ZOO[0], D0 + 1.2, -100.5], pushK(f, 1075, 0.0015), { fov: 44 });
// 14 · la estatua al atardecer
const S14a = (f: number): Shot => dolly([ESTATUA[0], D0 + 1.5, ESTATUA[2] + 5.6], [ESTATUA[0], D0 + 1.75, ESTATUA[2]], pushK(f, 1206, 0.0025, 0.006, 24), { fov: 44 });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 100, dur: 22, s: S1b }], 2: [{ f: 130, s: S2a }], 3: [{ f: 283, s: S3a }],
  4: [{ f: 363, s: S4a }, { f: 392, dur: 16, s: S4b }], 5: [{ f: 418, s: S5a }], 6: [{ f: 457, s: S6a }], 7: [{ f: 489, s: S7a }],
  8: [{ f: 547, s: S8a }], 9: [{ f: 640, s: S9a }], 10: [{ f: 710, s: S10a }], 11: [{ f: 845, s: S11a }], 12: [{ f: 980, s: S12a }],
  13: [{ f: 1075, s: S13a }], 14: [{ f: 1206, s: S14a }],
};

/** sacudidas: crece, el cartel, el sello, la ración */
const KICKS: [number, number][] = [[393, 0.5], [690, 0.4], [753, 0.6], [1034, 0.4]];
export const kickAt = (f: number) => {
  let a = 0;
  for (const [f0, g] of KICKS) {
    const n = Math.floor(f - f0);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(f);
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- desenfoque ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 8 }, { f: 130, cInf: 6 }, { f: 283, cInf: 8 }, { f: 363, cInf: 10 }, { f: 418, cInf: 9 }, { f: 457, cInf: 9 },
  { f: 489, cInf: 10 }, { f: 547, cInf: 4 }, { f: 640, cInf: 9 }, { f: 710, cInf: 7 }, { f: 845, cInf: 4 }, { f: 980, cInf: 7 },
  { f: 1075, cInf: 6 }, { f: 1206, cInf: 8 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
