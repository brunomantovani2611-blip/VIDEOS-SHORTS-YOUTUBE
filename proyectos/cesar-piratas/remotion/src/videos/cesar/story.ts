// «Julio César secuestrado por piratas». Tomas atadas a los cuadros de la voz (../../../../voz/palabras.json).
// Tres interiores abiertos con la pared del fondo en z = -596 (se miran hacia +z: +x a la IZQUIERDA del cuadro):
// la cubierta del barco pirata (600), el camarote (700) y el plató del mar abierto (900).
//
// Cuadros clave: 75@13 joven@61 veinticinco@80 secuestrado@107 piratas@126 Se@146 Julio@160 Los@186 pidieron@202
// veinte@212 rescate@242 Y@260 se@280 rio@284 Les@298 poco@322 valía@342 cincuenta@363 Mandó@382 amigos@396
// treinta@440 días@455 barco@469 como@492 jefe@508 Cuando@522 dormir@536 hicieran@569 silencio@579 Les@597 leía@603
// poemas@616 aplaudían@642 ignorantes@673 Y@696 repetía@719 sonriendo@737 libre@772 castigarlos@797 todos@816
// Los@833 risa@862 Cuando@877 rescate@901 César@918 libre@933 Juntó@947 barcos@957 volvió@973 isla@986 atrapó@1000
// piratas@1024 recuperó@1044 plata@1059 Y@1074 cumplió@1087 promesa@1099 Exactamente@1117 dicho@1154 (fin ~1171)
export const FPS = 30;
export const TOTAL = 1186;
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
export const CALLE: V3 = [-80, D0, -10];
export const CUARTO_X = 600, OFICINA_X = 700, PLATO_X = 900;
/** mesas: quien está sentado va detrás (junto a la pared), la mesa delante */
export const MESA_Z = BACK_Z - 1.0;
/** (heredado del mundo base: un río lejos de todo) */
export const RIO_Z0 = 300, RIO_Z1 = 345;

// ---------------- tomas ----------------
export type Light = "day" | "golden" | "night";
export type Scene = "plato" | "cuarto" | "oficina" | "calle";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene; sunAz?: number; sunEl?: number; fogFar?: number };
const IN = { sunAz: 160, sunEl: 50 };
const NI = { sunAz: 160, sunEl: 40 };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 146, light: "day", scene: "plato", ...IN },       // 75 a. C.: el barco pirata
  { id: 2, a: 146, b: 186, light: "day", scene: "cuarto", ...IN },    // se llamaba Julio César
  { id: 3, a: 186, b: 260, light: "day", scene: "cuarto", ...IN },    // 20 talentos de rescate
  { id: 4, a: 260, b: 382, light: "day", scene: "cuarto", ...IN },    // se rio: vale 50
  { id: 5, a: 382, b: 522, light: "day", scene: "plato", ...IN },     // los amigos van por el dinero; 38 días
  { id: 6, a: 522, b: 597, light: "night", scene: "oficina", ...NI }, // ¡silencio, quiero dormir!
  { id: 7, a: 597, b: 696, light: "day", scene: "cuarto", ...IN },    // los poemas: ¡ignorantes!
  { id: 8, a: 696, b: 833, light: "day", scene: "cuarto", ...IN },    // «cuando sea libre, los castigaré»
  { id: 9, a: 833, b: 877, light: "day", scene: "cuarto", ...IN },    // los piratas se mueren de risa
  { id: 10, a: 877, b: 947, light: "day", scene: "plato", ...IN },    // llega el rescate: libre
  { id: 11, a: 947, b: 1000, light: "day", scene: "plato", ...IN },   // juntó barcos, volvió a la isla
  { id: 12, a: 1000, b: 1074, light: "day", scene: "cuarto", ...IN }, // atrapó a los piratas y recuperó su plata
  { id: 13, a: 1074, b: TOTAL, light: "golden", scene: "cuarto", ...IN }, // cumplió su promesa
];
export const XFADE: Record<number, number> = { 2: 8, 5: 8, 6: 8, 7: 8, 8: 8, 10: 8, 11: 8, 12: 8, 13: 10 };
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
  [13, 78, "75 a. C."],
  [80, 144, "25 años"],
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
const plato = (f: number, f0: number, d = 6.2, rate = 0.0018) =>
  dolly([PLATO_X, D0 + 1.8, BACK_Z - d], [PLATO_X, D0 + 1.8, BACK_Z - 0.6], pushK(f, f0, rate), { fov: 44 });
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: (f) => plato(f, 0, 6.2, 0.002) }],
  2: [{ f: 146, s: (f) => room(CUARTO_X, f, 146, 0.003, 4.6, 0.006) }],
  3: [{ f: 186, s: (f) => room(CUARTO_X, f, 186, 0.002, 5.6) }],
  4: [{ f: 260, s: (f) => room(CUARTO_X, f, 260, 0.002, 5.4, 0.006) }],
  5: [{ f: 382, s: (f) => plato(f, 382, 6.2, 0.0015) }],
  6: [{ f: 522, s: (f) => room(OFICINA_X, f, 522, 0.0025, 5.6, 0.006) }],
  7: [{ f: 597, s: (f) => room(CUARTO_X, f, 597, 0.002, 5.4) }],
  8: [{ f: 696, s: (f) => room(CUARTO_X, f, 696, 0.0025, 5.6, 0.006) }],
  9: [{ f: 833, s: (f) => room(CUARTO_X, f, 833, 0.003, 5.2, 0.006) }],
  10: [{ f: 877, s: (f) => plato(f, 877, 6.0, 0.002) }],
  11: [{ f: 947, s: (f) => plato(f, 947, 6.4, 0.0015) }],
  12: [{ f: 1000, s: (f) => room(CUARTO_X, f, 1000, 0.002, 5.6, 0.005) }],
  13: [{ f: 1074, s: (f) => room(CUARTO_X, f, 1074, 0.003, 5.6, 0.006) }],
};

const KICKS: [number, number][] = [[280, 0.5], [363, 0.5], [579, 0.5], [673, 0.5], [933, 0.4], [1012, 0.5], [1117, 0.5]];
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
  { f: 0, cInf: 5 }, { f: 146, cInf: 8 }, { f: 382, cInf: 5 }, { f: 522, cInf: 8 }, { f: 877, cInf: 5 }, { f: 1000, cInf: 8 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
