// «Arístides, al que echaron por ser demasiado justo». Tomas atadas a los cuadros de la voz (../../../../voz/palabras.json).
// Una calle de Atenas (se mira hacia -z: +x a la DERECHA del cuadro) y dos interiores abiertos (se miran hacia +z:
// +x a la IZQUIERDA): el salón de mármol (600) y el plató azul (900).
//
// Cuadros clave: Atenas@16 votación@37 Una@72 echar@122 diez@160 Solo@183 nombre@216 cerámica@241 A@261
// Arístides@297 Justo@312 honesto@358 El@374 campesino@407 escribir@436 acercó@452 sin@467 Le@495 pedazo@506
// pidió@535 Me@549 Arístides@580 Arístides@601 sorprendido@621 Y@664 hombre@686 Y@700 Nada@739 conozco@770
// Pero@787 harto@798 Justo@842 Arístides@858 Tomó@898 escribió@922 nombre@945 devolvió@968 Ese@986 echaron@1008
// Pero@1037 años@1048 después@1054 vuelta@1104 pelear@1124 persas@1145 (fin ~1166)
export const FPS = 30;
export const TOTAL = 1180;
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
  { id: 1, a: 0, b: 72, light: "day", scene: "calle", ...IN },      // Atenas: una votación curiosa
  { id: 2, a: 72, b: 183, light: "day", scene: "plato", ...IN },    // echar a alguien diez años
  { id: 3, a: 183, b: 261, light: "day", scene: "plato", ...IN },   // el nombre en un pedazo de cerámica
  { id: 4, a: 261, b: 374, light: "day", scene: "cuarto", ...IN },  // Arístides el Justo
  { id: 5, a: 374, b: 495, light: "day", scene: "calle", ...IN },   // el campesino que no sabía escribir
  { id: 6, a: 495, b: 601, light: "day", scene: "calle", ...IN },   // ¿me escribe el nombre de Arístides?
  { id: 7, a: 601, b: 700, light: "day", scene: "calle", ...IN },   // ¿y qué le hizo ese hombre?
  { id: 8, a: 700, b: 858, light: "day", scene: "calle", ...IN },   // nada: estoy harto de «el Justo»
  { id: 9, a: 858, b: 986, light: "day", scene: "plato", ...IN },   // escribió su propio nombre
  { id: 10, a: 986, b: 1037, light: "day", scene: "plato", ...IN }, // lo echaron de Atenas
  { id: 11, a: 1037, b: 1119, light: "day", scene: "plato", ...IN }, // dos años después lo llaman de vuelta
  { id: 12, a: 1119, b: TOTAL, light: "day", scene: "cuarto", ...IN }, // a pelear contra los persas
];
export const XFADE: Record<number, number> = { 2: 8, 3: 8, 4: 8, 5: 8, 6: 8, 7: 8, 8: 8, 9: 8, 10: 8, 11: 10, 12: 8 };
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
  [16, 70, "Atenas · 482 a. C."],
  [1048, 1117, "2 años después"],
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
  2: [{ f: 72, s: (f) => plato(f, 72, 6.2, 0.002) }],
  3: [{ f: 183, s: (f) => plato(f, 183, 6.0, 0.003) }],
  4: [{ f: 261, s: (f) => room(CUARTO_X, f, 261, 0.0025, 5.6, 0.005) }],
  5: [{ f: 374, s: (f) => street(f, 374, 8.0, 0.0015) }],
  6: [{ f: 495, s: (f) => street(f, 495, 7.4, 0.002) }],
  7: [{ f: 601, s: (f) => street(f, 601, 7.4, 0.002, 0.005) }],
  8: [{ f: 700, s: (f) => street(f, 700, 7.4, 0.0015) }],
  9: [{ f: 858, s: (f) => plato(f, 858, 6.0, 0.002) }],
  10: [{ f: 986, s: (f) => plato(f, 986, 6.0, 0.003) }],
  11: [{ f: 1037, s: (f) => plato(f, 1037, 6.2, 0.002) }],
  12: [{ f: 1119, s: (f) => room(CUARTO_X, f, 1119, 0.003, 6.0, 0.005) }],
};

const KICKS: [number, number][] = [[160, 0.4], [580, 0.5], [739, 0.4], [798, 0.5], [1008, 0.6], [1124, 0.5]];
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
  { f: 0, cInf: 7 }, { f: 72, cInf: 5 }, { f: 261, cInf: 8 }, { f: 374, cInf: 7 }, { f: 858, cInf: 5 }, { f: 1119, cInf: 8 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
