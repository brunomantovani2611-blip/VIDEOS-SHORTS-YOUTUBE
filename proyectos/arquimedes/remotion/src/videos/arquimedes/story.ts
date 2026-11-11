// «Arquímedes y el ¡Eureka!». Tomas atadas a los cuadros de la voz (../../../../voz/palabras.json).
// Una calle de Siracusa (se mira hacia -z: +x a la DERECHA del cuadro) y tres interiores abiertos (se miran hacia +z:
// +x a la IZQUIERDA): el salón del trono (600), el baño de azulejos (700) y el plató azul (900).
//
// Cuadros clave: rey@41 corona@79 orfebre@102 sospechó@156 oro@229 plata@263 La@278 pesaba@290 Así@348
// Arquímedes@412 sin@488 Arquímedes@520 días@552 bañera@604 subía@639 Y@655 volumen@712 La@747 plata@751
// trampa@824 Cuentan@869 corriendo@889 Eureka@947 Eureka@965 encontré@1009 Hizo@1027 subió@1063 El@1089
// trampa@1121 (fin ~1140)
export const FPS = 30;
export const TOTAL = 1155;
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
  { id: 1, a: 0, b: 119, light: "day", scene: "cuarto", ...IN },     // el rey encarga una corona de oro
  { id: 2, a: 119, b: 278, light: "day", scene: "cuarto", ...IN },   // sospecha: ¿oro mezclado con plata?
  { id: 3, a: 278, b: 348, light: "day", scene: "plato", ...IN },    // pesaba lo mismo
  { id: 4, a: 348, b: 520, light: "day", scene: "plato", ...IN },    // Arquímedes: sin romper la corona
  { id: 5, a: 520, b: 591, light: "day", scene: "oficina", ...IN },  // pensó durante días
  { id: 6, a: 591, b: 747, light: "day", scene: "oficina", ...IN },  // la bañera: el agua sube
  { id: 7, a: 747, b: 869, light: "day", scene: "plato", ...IN },    // la plata ocupa más lugar
  { id: 8, a: 869, b: 1027, light: "day", scene: "calle", ...IN },   // ¡Eureka!
  { id: 9, a: 1027, b: 1089, light: "day", scene: "plato", ...IN },  // la prueba: el agua subió de más
  { id: 10, a: 1089, b: TOTAL, light: "day", scene: "cuarto", ...IN }, // el orfebre hizo trampa
];
export const XFADE: Record<number, number> = { 3: 8, 4: 8, 5: 8, 6: 8, 7: 8, 8: 8, 9: 8, 10: 8 };
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
  [37, 112, "Siracusa · s. III a. C."],
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
const street = (f: number, f0: number, d = 8.6, rate = 0.002, punch = 0.006) =>
  dolly([CALLE[0], D0 + 1.55, -11 + d], [CALLE[0], D0 + 1.5, -11], pushK(f, f0, rate, punch, 22), { fov: 46 });
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: (f) => room(CUARTO_X, f, 0, 0.002, 6.0) }],
  2: [{ f: 119, s: (f) => room(CUARTO_X, f, 119, 0.0025, 5.6, 0.005) }],
  3: [{ f: 278, s: (f) => plato(f, 278, 6.2, 0.002) }],
  4: [{ f: 348, s: (f) => plato(f, 348, 6.2, 0.0015) }],
  5: [{ f: 520, s: (f) => room(OFICINA_X, f, 520, 0.003, 5.4) }],
  6: [{ f: 591, s: (f) => room(OFICINA_X, f, 591, 0.002, 5.8, 0.006) }],
  7: [{ f: 747, s: (f) => plato(f, 747, 6.2, 0.0015) }],
  8: [{ f: 869, s: (f) => street(f, 869, 8.2, 0.0015) }],
  9: [{ f: 1027, s: (f) => plato(f, 1027, 6.2, 0.002) }],
  10: [{ f: 1089, s: (f) => room(CUARTO_X, f, 1089, 0.003, 5.6, 0.006) }],
};

const KICKS: [number, number][] = [[156, 0.4], [655, 0.5], [947, 0.6], [965, 0.4], [1121, 0.6]];
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
  { f: 0, cInf: 8 }, { f: 278, cInf: 5 }, { f: 520, cInf: 8 }, { f: 747, cInf: 5 }, { f: 869, cInf: 7 }, { f: 1027, cInf: 5 }, { f: 1089, cInf: 8 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
