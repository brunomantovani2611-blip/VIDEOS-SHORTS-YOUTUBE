// «El día que subastaron el Imperio romano». Tomas atadas a los cuadros de la voz (../../../../voz/palabras.json).
// Una calle de Roma (se mira hacia -z, x ≈ -80) y tres interiores abiertos con la pared del fondo en z = -596 (se miran
// hacia +z: +x a la IZQUIERDA del cuadro): el palacio con el trono (600), el cuartel (700) y el plató morado (900).
//
// Cuadros clave: 193@13 guardia@48 emperador@60 increíble@96 Primero@115 mató@131 Y@161 puso@182 imperio@190
// venta@203 Así@218 subasta@260 El@278 dinero@301 soldado@316 trono@347 Dos@361 senadores@367 cuartel@410
// pujar@437 gritando@451 muro@489 Ganó@502 Didio@509 prometió@533 veinticinco@543 sestercios@562 Y@603 compró@624
// Imperio@635 Pero@662 pueblo@669 Lo@706 abucheaban@710 Tres@741 generales@747 rebelaron@763 partes@790
// Septimio@842 marchó@871 Roma@902 El@917 Senado@921 condenó@977 Didio@994 ejecutado@1018 palacio@1043 Había@1059
// sesenta@1091 días@1109 Pagó@1125 fortuna@1136 peor@1160 negocio@1166 historia@1181 (fin ~1201)
export const FPS = 30;
export const TOTAL = 1216;
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
  { id: 1, a: 0, b: 115, light: "day", scene: "cuarto", ...IN },       // 193: la guardia del emperador
  { id: 2, a: 115, b: 161, light: "day", scene: "plato", ...IN },      // primero mató al emperador (el trono vacío)
  { id: 3, a: 161, b: 278, light: "day", scene: "plato", ...IN },      // el imperio a la venta: una subasta
  { id: 4, a: 278, b: 361, light: "day", scene: "oficina", ...IN },    // más dinero a cada soldado
  { id: 5, a: 361, b: 502, light: "day", scene: "oficina", ...IN },    // dos senadores pujan frente al muro
  { id: 6, a: 502, b: 603, light: "day", scene: "plato", ...IN },      // ganó Didio Juliano: 25.000 sestercios
  { id: 7, a: 603, b: 662, light: "day", scene: "cuarto", ...IN },     // se compró el Imperio
  { id: 8, a: 662, b: 741, light: "day", scene: "calle", ...IN },      // el pueblo lo abuchea
  { id: 9, a: 741, b: 842, light: "day", scene: "plato", ...IN },      // tres generales se rebelan
  { id: 10, a: 842, b: 917, light: "day", scene: "plato", ...IN },     // Septimio Severo marcha hacia Roma
  { id: 11, a: 917, b: 994, light: "day", scene: "cuarto", ...IN },    // el Senado lo condena
  { id: 12, a: 994, b: 1059, light: "golden", scene: "cuarto", ...IN }, // ejecutado en su propio palacio
  { id: 13, a: 1059, b: 1125, light: "day", scene: "plato", ...IN },   // 66 días
  { id: 14, a: 1125, b: TOTAL, light: "day", scene: "plato", ...IN },  // el peor negocio de la historia
];
export const XFADE: Record<number, number> = { 2: 8, 4: 8, 6: 8, 7: 8, 8: 10, 9: 8, 11: 8, 12: 10, 13: 8, 14: 8 };
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
  [13, 110, "193 d. C."],
  [543, 600, "25.000 sestercios"],
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
  1: [{ f: 0, s: (f) => room(CUARTO_X, f, 0, 0.0022, 5.8, 0.005) }],
  2: [{ f: 115, s: (f) => plato(f, 115, 6.0, 0.003) }],
  3: [{ f: 161, s: (f) => plato(f, 161, 6.2, 0.002) }],
  4: [{ f: 278, s: (f) => room(OFICINA_X, f, 278, 0.0022, 5.8) }],
  5: [{ f: 361, s: (f) => room(OFICINA_X, f, 361, 0.0015, 6.0, 0.005) }],
  6: [{ f: 502, s: (f) => plato(f, 502, 6.0, 0.002) }],
  7: [{ f: 603, s: (f) => room(CUARTO_X, f, 603, 0.003, 5.4, 0.006) }],
  8: [{ f: 662, s: (f) => dolly([CALLE[0], D0 + 1.55, -2.4], [CALLE[0], D0 + 1.5, -11], pushK(f, 662, 0.002, 0.006, 22), { fov: 46 }) }],
  9: [{ f: 741, s: (f) => plato(f, 741, 6.2, 0.0015) }],
  10: [{ f: 842, s: (f) => plato(f, 842, 6.0, 0.002) }],
  11: [{ f: 917, s: (f) => room(CUARTO_X, f, 917, 0.002, 5.8, 0.005) }],
  12: [{ f: 994, s: (f) => room(CUARTO_X, f, 994, 0.004, 5.4, 0.006) }],
  13: [{ f: 1059, s: (f) => plato(f, 1059, 6.0, 0.003) }],
  14: [{ f: 1125, s: (f) => plato(f, 1125, 6.0, 0.003) }],
};

const KICKS: [number, number][] = [[131, 0.5], [260, 0.5], [503, 0.6], [710, 0.5], [977, 0.6], [1160, 0.5]];
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
  { f: 0, cInf: 8 }, { f: 115, cInf: 5 }, { f: 278, cInf: 8 }, { f: 502, cInf: 5 }, { f: 603, cInf: 8 }, { f: 662, cInf: 7 },
  { f: 741, cInf: 5 }, { f: 917, cInf: 8 }, { f: 1059, cInf: 5 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
