// «El silbato de los cereales» (phreaking, 1960-1975). Línea de tiempo del short: tomas atadas a los cuadros de cada
// palabra de la voz (../../../../voz/palabras.json).
//
// Una calle al aire libre (se mira hacia -z: +x a la derecha del cuadro): California (x ≈ -80). Cinco interiores abiertos
// lejos de todo, con la pared del fondo en z = -596 (se miran hacia +z: +x a la IZQUIERDA del cuadro): la cocina (600),
// la central telefónica (700), el cuarto de Draper (800), el plató del mapa (900) y el garaje (1000).
//
// Cuadros clave: cajas@42 silbato@88 Parecía@119 alguien@164 sopló@173 teléfono@195 El@213 2600@243 tono@293 línea@363
// libre@380 Lo@395 confundía@433 marcar@467 operador@497 Llamadas@516 gratis@527 Uno@576 John@631 apodo@664 Capitán@681
// cereal@713 Después@729 cajita@750 tonos@791 En@808 revista@849 dos@889 California@905 Steve@937 Wozniak@944 Jobs@965
// Armaron@982 cajas@1005 vendieron@1032 Wozniak@1050 Vaticano@1079 Henry@1116 Papa@1158 Le@1172 durmiendo@1196 Años@1216
// Jobs@1241 sin@1267 cajas@1275 no@1299 Apple@1325 Todo@1338 juguete@1360 cereal@1372 (fin de la voz ~1391)
export const FPS = 30;
export const TOTAL = 1405;
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
export const CALIFORNIA: V3 = [-80, D0, -10];
export const COCINA_X = 600, CENTRAL_X = 700, TALLER_X = 800, PLATO_X = 900, GARAJE_X = 1000;
/** mesas: quien está sentado va detrás (junto a la pared), la mesa delante */
export const MESA_Z = BACK_Z - 1.0;
/** el teléfono de pared de la cocina (a la derecha del cuadro) */
export const TEL_COCINA: V3 = [COCINA_X - 1.7, D0 + 1.45, BACK_Z - 0.12];
/** (heredado del mundo base: un río lejos de todo) */
export const RIO_Z0 = 300, RIO_Z1 = 345;

// ---------------- tomas ----------------
export type Light = "day" | "golden" | "night";
export type Scene = "cocina" | "central" | "taller" | "plato" | "garaje" | "california";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene; sunAz?: number; sunEl?: number; fogFar?: number };
const IN = { sunAz: 160, sunEl: 50 };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 119, light: "day", scene: "cocina", ...IN },          // cajas de cereales con un silbato de regalo
  { id: 2, a: 119, b: 213, light: "day", scene: "cocina", ...IN },        // lo sopla en el teléfono
  { id: 3, a: 213, b: 395, light: "day", scene: "central", ...IN },       // 2600 Hz = línea libre
  { id: 4, a: 395, b: 516, light: "day", scene: "cocina", ...IN },        // la central se confunde: operador
  { id: 5, a: 516, b: 576, light: "day", scene: "plato", ...IN },         // llamadas gratis a todo el mundo
  { id: 6, a: 576, b: 729, light: "day", scene: "taller", ...IN },        // John Draper, «Capitán Crunch»
  { id: 7, a: 729, b: 808, light: "night", scene: "taller", sunAz: 160, sunEl: 40 }, // la cajita azul
  { id: 8, a: 808, b: 982, light: "golden", scene: "california", sunAz: 150, sunEl: 25 }, // la revista, Woz y Jobs
  { id: 9, a: 982, b: 1050, light: "day", scene: "garaje", ...IN },       // arman y venden cajas azules
  { id: 10, a: 1050, b: 1172, light: "day", scene: "garaje", ...IN },     // llamada al Vaticano como Kissinger
  { id: 11, a: 1172, b: 1216, light: "night", scene: "plato", sunAz: 160, sunEl: 40 }, // el Papa duerme
  { id: 12, a: 1216, b: 1338, light: "day", scene: "garaje", ...IN },     // sin cajas azules no habría Apple
  { id: 13, a: 1338, b: TOTAL, light: "day", scene: "cocina", ...IN },    // todo empezó con un juguete
];
export const XFADE: Record<number, number> = { 3: 8, 5: 8, 6: 8, 8: 10, 9: 8, 11: 8, 12: 10, 13: 10 };
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
  [9, 60, "Años 60"],
  [812, 846, "1971"],
  [905, 936, "California"],
];

/** en esta short no hay señuelos de goma */
export type Decoy = { kind: "tanque" | "camion" | "canon"; x: number; z: number; yaw: number; inflate: number; lift?: number; tilt?: number };
export const decoysAt = (_id: number, _f: number): Decoy[] => [];

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
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });

// interiores: mirando a +z
const room = (x: number, f: number, f0: number, rate = 0.002, d = 5.2, punch = 0) =>
  dolly([x, D0 + 1.6, BACK_Z - d - 0.8], [x, D0 + 1.35, BACK_Z - 0.8], pushK(f, f0, rate, punch, 24), { fov: 44 });
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: (f) => room(COCINA_X, f, 0, 0.003, 5.4, 0.006) }],
  2: [{ f: 119, s: (f) => room(COCINA_X - 1.0, f, 119, 0.003, 4.6, 0.007) }],
  3: [{ f: 213, s: (f) => room(CENTRAL_X, f, 213, 0.0025, 6.6, 0.006) }],
  4: [{ f: 395, s: (f) => room(COCINA_X - 1.0, f, 395, 0.003, 4.2, 0.006) }],
  5: [{ f: 516, s: (f) => dolly([PLATO_X, D0 + 1.8, BACK_Z - 6.2], [PLATO_X, D0 + 1.8, BACK_Z - 0.6], pushK(f, 516, 0.002), { fov: 44 }) }],
  6: [{ f: 576, s: (f) => room(TALLER_X, f, 576, 0.002, 5.6, 0.006) }],
  7: [{ f: 729, s: (f) => room(TALLER_X, f, 729, 0.003, 4.4) }],
  8: [{ f: 808, s: (f) => dolly([CALIFORNIA[0], D0 + 1.55, -2.4], [CALIFORNIA[0], D0 + 1.45, -11], pushK(f, 808, 0.0018, 0.005, 22), { fov: 46 }) }],
  9: [{ f: 982, s: (f) => room(GARAJE_X, f, 982, 0.0025, 6.4, 0.006) }],
  10: [{ f: 1050, s: (f) => room(GARAJE_X + 0.15, f, 1050, 0.0025, 6.0, 0.006) }],
  11: [{ f: 1172, s: (f) => dolly([PLATO_X, D0 + 1.8, BACK_Z - 6.0], [PLATO_X, D0 + 1.8, BACK_Z - 0.6], pushK(f, 1172, 0.003), { fov: 44 }) }],
  12: [{ f: 1216, s: (f) => room(GARAJE_X, f, 1216, 0.0025, 5.8, 0.006) }],
  13: [{ f: 1338, s: (f) => room(COCINA_X - 0.5, f, 1338, 0.003, 4.8, 0.007) }],
};

const KICKS: [number, number][] = [[173, 0.5], [433, 0.5], [527, 0.4], [681, 0.5], [1122, 0.4], [1325, 0.5]];
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
  { f: 0, cInf: 8 }, { f: 119, cInf: 8 }, { f: 213, cInf: 8 }, { f: 395, cInf: 8 }, { f: 516, cInf: 5 }, { f: 576, cInf: 8 },
  { f: 729, cInf: 9 }, { f: 808, cInf: 7 }, { f: 982, cInf: 8 }, { f: 1050, cInf: 8 }, { f: 1172, cInf: 5 }, { f: 1216, cInf: 8 },
  { f: 1338, cInf: 8 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
