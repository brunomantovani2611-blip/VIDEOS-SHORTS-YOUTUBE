// «Las pizzas de mil millones de dólares» (Florida y California, 2010). Línea de tiempo del short: tomas atadas a
// los cuadros de cada palabra de la voz (../../../../voz/palabras.json), cámaras con la gramática de la skill.
//
// Interiores lejos del pueblo, sin techo, con la pared del fondo en z = -596: el cuarto de Laszlo (x ≈ 600), el de
// Jeremy (x ≈ 700) y un plató de colores para los datos (x ≈ 800).
//
// Cuadros clave de la voz (30 fps): 2010@5 pagó@42 pizzas@54 fortuna@97 Se@115 Laszlo@129 Florida@161 bitcoins@232
// Entonces@254 experimento@289 internet@306 nada@358 Así@372 foro@403 Pago@416 diez@423 pizzas@470 Durante@488
// días@497 nadie@512 Hasta@544 chico@558 diecinueve@568 California@597 acepta@617 pide@644 teléfono@669 manda@697
// casa@709 Laszlo@724 cena@733 pizza@740 El@756 chico@761 bitcoins@791 valían@826 cuarenta@841 dólares@851 Pero@870
// subir@897 subir@914 subir@931 En@947 2024@952 valer@1022 mil@1038 millones@1044 dólares@1057 Hoy@1077
// 22 de mayo@1094 Pizza@1148 Bitcoin@1157 Y@1174 Laszlo@1178 arrepiente@1212 primero@1259 (fin de la voz ~1275)
export const FPS = 30;
export const TOTAL = 1295;
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
export const TOWER_C: [number, number] = [0, 140];
export const TOWER_S = 0.5;
export const BACK_Z = -596;
/** cuarto de Laszlo: escritorio con ordenador contra la pared del fondo, ventana con palmera, puerta */
export const LASZLO: V3 = [600.45, D0, -597.1];
export const MONITOR_L: V3 = [599.65, D0 + 1.2, -596.45];
export const PUERTA_X = 602.6;
/** cuarto de Jeremy */
export const JEREMY: V3 = [700.45, D0, -597.1];
export const MONITOR_J: V3 = [699.65, D0 + 1.2, -596.45];
/** plató de los datos: mesa con las dos cajas de pizza */
export const PLATO: V3 = [800, D0, -598];
export const MESA_Y = 0.8;

// ---------------- tomas ----------------
export type Light = "day" | "golden";
export type Scene = "plato" | "laszlo" | "jeremy";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene; sunAz?: number; sunEl?: number; fogFar?: number };
const IN = { sunAz: 160, sunEl: 50 };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 115, light: "day", scene: "plato", ...IN },        // gancho: dos pizzas y el precio
  { id: 2, a: 115, b: 254, light: "day", scene: "laszlo", ...IN },     // Laszlo, Florida, bitcoins
  { id: 3, a: 254, b: 372, light: "day", scene: "laszlo", ...IN },     // un experimento de internet, no se podía comprar nada
  { id: 4, a: 372, b: 488, light: "day", scene: "laszlo", ...IN },     // el mensaje del foro (pantalla)
  { id: 5, a: 488, b: 544, light: "day", scene: "laszlo", ...IN },     // durante días nadie le hace caso
  { id: 6, a: 544, b: 687, light: "golden", scene: "jeremy", sunAz: 160, sunEl: 30 }, // el chico de California acepta y llama
  { id: 7, a: 687, b: 756, light: "day", scene: "laszlo", ...IN },     // llega el repartidor; Laszlo cena pizza
  { id: 8, a: 756, b: 870, light: "golden", scene: "jeremy", sunAz: 160, sunEl: 30 }, // el chico y sus diez mil bitcoins
  { id: 9, a: 870, b: 947, light: "day", scene: "plato", ...IN },      // y a subir (gráfica)
  { id: 10, a: 947, b: 1077, light: "day", scene: "plato", ...IN },    // 2024: más de mil millones
  { id: 11, a: 1077, b: 1174, light: "day", scene: "plato", ...IN },   // 22 de mayo: el Día de la Pizza Bitcoin
  { id: 12, a: 1174, b: TOTAL, light: "day", scene: "laszlo", ...IN }, // no se arrepiente
];
export const XFADE: Record<number, number> = { 2: 8, 6: 8, 7: 8, 8: 8, 9: 8, 12: 8 };
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
  [8, 112, "2010"],
  [568, 612, "19 años"],
  [841, 868, "≈ 41 dólares"],
  [952, 1074, "2024"],
];

export const towerLift = (_id: number, _f: number): [number, number] => [0, 0];
export type CarPose = { x: number; z: number; yaw: number; v: number };
export const carAt = (_id: number, _f: number): CarPose | null => null;

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
const TW = (y: number): V3 => [TOWER_C[0], D0 + y, TOWER_C[1]];

const MZ = BACK_Z;
const P = PLATO;
// 1 · gancho: las dos cajas de pizza sobre la mesa del plató y la etiqueta del precio; empuje
const S1a = (f: number): Shot => dolly([P[0], D0 + 1.75, -601.6], [P[0], D0 + 1.25, P[2]], pushK(f, 0, 0.0035, 0.007, 30), { fov: 44 });
// 2 · Laszlo en su escritorio, la ventana con la palmera
const S2a = (f: number): Shot => dolly([600.45, D0 + 1.55, -600.7], [600.2, D0 + 1.4, -597.0], pushK(f, 115, 0.0022, 0.005, 26), { fov: 44 });
// 3 · plano medio de Laszlo y su ordenador
const S3a = (f: number): Shot => dolly([600.25, D0 + 1.5, -600.3], [600.15, D0 + 1.35, -596.9], pushK(f, 254, 0.0025), { fov: 42 });
// 4 · la pantalla: el mensaje del foro
const S4a = (f: number): Shot => dolly([599.65, D0 + 1.25, -598.5], [599.65, D0 + 1.22, MZ], pushK(f, 372, 0.002), { fov: 40 });
// 5 · esperando: Laszlo aburrido, empuje lento
const S5a = (f: number): Shot => dolly([600.35, D0 + 1.5, -599.9], [600.25, D0 + 1.45, -597.1], pushK(f, 488, 0.003), { fov: 40 });
// 6 · Jeremy en su cuarto, al atardecer
const S6a = (f: number): Shot => dolly([700.4, D0 + 1.5, -600.5], [700.2, D0 + 1.4, -597.0], pushK(f, 544, 0.0025, 0.006, 24), { fov: 42 });
// 7 · la puerta de Laszlo: el repartidor; Laszlo con la porción
const S7a = (f: number): Shot => dolly([602.2, D0 + 1.5, -600.7], [602.2, D0 + 1.4, -597.0], pushK(f, 687, 0.002), { fov: 46 });
// 8 · Jeremy con la montaña de monedas
const S8a = (f: number): Shot => dolly([700.25, D0 + 1.55, -600.3], [700.15, D0 + 1.45, -597.2], pushK(f, 756, 0.0025, 0.006, 24), { fov: 42 });
// 9 · la gráfica que sube, delante del plató
const S9a = (f: number): Shot => dolly([P[0], D0 + 1.8, -601.8], [P[0], D0 + 1.8, P[2]], pushK(f, 870, 0.0025), { fov: 44 });
// 10 · las pizzas otra vez, ahora con el precio de 2024
const S10a = (f: number): Shot => dolly([P[0], D0 + 1.7, -601.2], [P[0], D0 + 1.3, P[2]], pushK(f, 947, 0.003, 0.007, 24), { fov: 44 });
// 11 · el calendario del 22 de mayo
const S11a = (f: number): Shot => dolly([P[0] - 0.2, D0 + 1.8, -601.5], [P[0], D0 + 1.7, P[2]], pushK(f, 1077, 0.0025), { fov: 44 });
// 12 · Laszlo, sin arrepentirse
const S12a = (f: number): Shot => dolly([600.4, D0 + 1.55, -600.3], [600.3, D0 + 1.45, -597.1], pushK(f, 1174, 0.003, 0.006, 26), { fov: 40 });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }], 2: [{ f: 115, s: S2a }], 3: [{ f: 254, s: S3a }], 4: [{ f: 372, s: S4a }], 5: [{ f: 488, s: S5a }],
  6: [{ f: 544, s: S6a }], 7: [{ f: 687, s: S7a }], 8: [{ f: 756, s: S8a }], 9: [{ f: 870, s: S9a }], 10: [{ f: 947, s: S10a }],
  11: [{ f: 1077, s: S11a }], 12: [{ f: 1174, s: S12a }],
};

/** sacudidas: los sellazos, las vigas que caen, los sobres */
const KICKS: [number, number][] = [[617, 0.5], [897, 0.4], [914, 0.5], [931, 0.6], [1044, 0.7]];
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
  { f: 0, cInf: 8 }, { f: 115, cInf: 8 }, { f: 254, cInf: 9 }, { f: 372, cInf: 6 }, { f: 488, cInf: 10 }, { f: 544, cInf: 9 },
  { f: 687, cInf: 6 }, { f: 756, cInf: 9 }, { f: 870, cInf: 6 }, { f: 947, cInf: 8 }, { f: 1077, cInf: 6 }, { f: 1174, cInf: 11 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
