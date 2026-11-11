// «Diógenes, el filósofo de la tinaja». Tomas atadas a los cuadros de la voz (../../../../voz/palabras.json).
// Una calle de Atenas (se mira hacia -z, x ≈ -80: +x a la DERECHA del cuadro) y dos interiores abiertos con la pared del
// fondo en z = -596 (se miran hacia +z: +x a la IZQUIERDA): la escuela de Platón (600) y el plató azul (900).
//
// Cuadros clave: Grecia@40 casa@95 Dormía@110 tinaja@126 Se@181 Diógenes@195 dinero@229 burlaba@277 Cuentan@312
// lámpara@363 preguntaban@403 Busco@447 honesto@464 Un@480 Platón@507 bípedo@555 plumas@569 Al@587 escuela@637
// pollo@653 gritó@675 Aquí@690 Pero@733 Alejandro@774 Alejandro@846 Pídeme@875 Y@906 sol@938 Apártate@970
// tapas@996 Dicen@1021 Si@1068 Diógenes@1113 (fin ~1136)
export const FPS = 30;
export const TOTAL = 1150;
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
  { id: 1, a: 0, b: 110, light: "day", scene: "calle", ...IN },     // un filósofo sin casa
  { id: 2, a: 110, b: 181, light: "day", scene: "calle", ...IN },   // dormía en una tinaja
  { id: 3, a: 181, b: 312, light: "day", scene: "plato", ...IN },   // Diógenes: sin dinero, se burlaba de todos
  { id: 4, a: 312, b: 480, light: "day", scene: "calle", ...IN },   // la lámpara: busco un hombre honesto
  { id: 5, a: 480, b: 587, light: "day", scene: "cuarto", ...IN },  // Platón: bípedo sin plumas
  { id: 6, a: 587, b: 733, light: "day", scene: "cuarto", ...IN },  // el pollo desplumado
  { id: 7, a: 733, b: 846, light: "day", scene: "calle", ...IN },   // llega Alejandro Magno
  { id: 8, a: 846, b: 906, light: "day", scene: "calle", ...IN },   // pídeme lo que quieras
  { id: 9, a: 906, b: 1021, light: "day", scene: "calle", ...IN },  // apártate, que me tapas el sol
  { id: 10, a: 1021, b: TOTAL, light: "day", scene: "plato", ...IN }, // si no fuera Alejandro…
];
export const XFADE: Record<number, number> = { 2: 8, 3: 8, 4: 8, 5: 8, 6: 8, 7: 8, 8: 8, 9: 8, 10: 8 };
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
  [37, 105, "Grecia · siglo IV a. C."],
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
  1: [{ f: 0, s: (f) => street(f, 0, 8.6, 0.002, 0) }],
  2: [{ f: 110, s: (f) => street(f, 110, 6.6, 0.003) }],
  3: [{ f: 181, s: (f) => plato(f, 181, 6.0, 0.002) }],
  4: [{ f: 312, s: (f) => street(f, 312, 7.6, 0.0015) }],
  5: [{ f: 480, s: (f) => room(CUARTO_X, f, 480, 0.002, 5.8) }],
  6: [{ f: 587, s: (f) => room(CUARTO_X, f, 587, 0.002, 5.8, 0.006) }],
  7: [{ f: 733, s: (f) => street(f, 733, 8.4, 0.0015) }],
  8: [{ f: 846, s: (f) => street(f, 846, 7.6, 0.002) }],
  9: [{ f: 906, s: (f) => street(f, 906, 7.4, 0.002, 0.006) }],
  10: [{ f: 1021, s: (f) => plato(f, 1021, 6.6, 0.002) }],
};

const KICKS: [number, number][] = [[277, 0.4], [653, 0.5], [690, 0.5], [970, 0.6], [1068, 0.4]];
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
  { f: 0, cInf: 7 }, { f: 181, cInf: 5 }, { f: 312, cInf: 7 }, { f: 480, cInf: 8 }, { f: 733, cInf: 7 }, { f: 1021, cInf: 5 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
