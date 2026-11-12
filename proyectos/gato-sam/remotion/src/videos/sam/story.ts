// «Sam, el gato insumergible» (1941). Tomas atadas a los cuadros de la voz (../../../../voz/palabras.json).
// El mar abierto alrededor de MAR (se mira hacia -z: +x a la DERECHA del cuadro), tierra firme (z < -200) y el plató
// azul (900), que se mira hacia +z (+x a la IZQUIERDA).
//
// Cuadros clave: 1941@5 acorazado@47 Bismarck@69 hundió@83 Atlántico@104 De@124 dos@135 mil@140 tripulantes@144
// sobrevivieron@165 cien@196 y@209 gato@215 encontraron@232 flotando@247 tabla@269 y@283 marineros@290 Cossack@330
// rescataron@345 llamaron@370 Oscar@381 Cinco@396 submarino@432 torpedeó@445 Cossack@460 hundió@482 Oscar@497
// sobrevivió@506 vez@526 Entonces@541 portaaviones@570 Ark@585 justo@603 ayudado@628 hundir@639 Bismarck@649
// Tres@666 después@681 Ark@702 también@714 hundió@726 Y@741 adivinen@744 apareció@760 flotando@771 tabla@788
// enojado@802 sano@818 Desde@833 llamaron@854 Sam@865 insumergible@880 Y@903 mandaron@909 vivir@921 tierra@937 firme@945
export const FPS = 30;
export const TOTAL = 990;
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
export const CALLE: V3 = [-80, D0, -212];
/** el camino de tierra: centro en z = RZ, de RZ - 2 a RZ + 2 */
export const RZ = -8.6;
export const CUARTO_X = 600, OFICINA_X = 700, PLATO_X = 900;
/** mesas: quien está sentado va detrás (junto a la pared), la mesa delante */
export const MESA_Z = BACK_Z - 1.0;
/** (heredado del mundo base: un río lejos de todo) */
export const RIO_Z0 = -200, RIO_Z1 = 900;

// ---------------- tomas ----------------
export type Light = "day" | "golden" | "night";
export type Scene = "plato" | "cuarto" | "oficina" | "calle";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene; sunAz?: number; sunEl?: number; fogFar?: number };
const IN = { sunAz: 150, sunEl: 48 };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 124, light: "day", scene: "calle", ...IN },      // el Bismarck se hunde
  { id: 2, a: 124, b: 209, light: "day", scene: "plato", ...IN },    // 2.200 tripulantes, poco más de cien
  { id: 3, a: 209, b: 283, light: "day", scene: "calle", ...IN },    // ...y un gato, flotando en una tabla
  { id: 4, a: 283, b: 366, light: "day", scene: "calle", ...IN },    // los del Cossack lo rescatan
  { id: 5, a: 366, b: 396, light: "day", scene: "plato", ...IN },    // lo llamaron Oscar
  { id: 6, a: 396, b: 497, light: "day", scene: "calle", ...IN },    // el submarino torpedea al Cossack
  { id: 7, a: 497, b: 541, light: "day", scene: "calle", ...IN },    // Oscar sobrevive otra vez
  { id: 8, a: 541, b: 603, light: "day", scene: "calle", ...IN },    // el portaaviones Ark Royal
  { id: 9, a: 603, b: 666, light: "day", scene: "calle", ...IN },    // el que hundió al Bismarck
  { id: 10, a: 666, b: 741, light: "day", scene: "calle", ...IN },   // tres semanas después: se hunde
  { id: 11, a: 741, b: 833, light: "day", scene: "calle", ...IN },   // flotando, enojado pero sano
  { id: 12, a: 833, b: 903, light: "day", scene: "plato", ...IN },   // Sam, el insumergible
  { id: 13, a: 903, b: TOTAL, light: "day", scene: "calle", ...IN }, // a vivir en tierra firme
];
export const XFADE: Record<number, number> = { 2: 8, 3: 8, 4: 8, 5: 6, 6: 8, 7: 8, 8: 8, 9: 6, 10: 8, 11: 8, 12: 8, 13: 10 };
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
  [10, 120, "Atlántico · 1941"],
  [322, 362, "HMS Cossack"],
  [400, 440, "5 meses después"],
  [582, 600, "HMS Ark Royal"],
  [668, 706, "3 semanas después"],
  [906, 940, "Belfast"],
];

/** el mar: punto de referencia de las tomas en el agua; tierra firme del final */
export const MX = -80, MZ = 400, TZ = -212;
/** utilería 3D (world.ts): barcos, tabla, bote, periscopio, estela de torpedo; yaw: 0 = mira a +z */
export type Decoy = { kind: "acorazado" | "destructor" | "portaaviones" | "tabla" | "bote" | "periscopio" | "estela"; x: number; z: number; yaw: number; y?: number; shake?: number; s?: number; open?: number; moving?: boolean; rx?: number; rz?: number };
/** hundimiento: u 0..1 desde el cuadro f0 en n cuadros */
const hund = (f: number, f0: number, n: number) => smooth((f - f0) / n);
/** la tabla flotando: balanceo */
export const bob = (f: number, k = 0) => Math.sin(f * 0.11 + k) * 0.05;
export const TABLA: [number, number] = [MX, MZ - 4];
/** barcos de las tomas anchas */
export const SHIP1: [number, number] = [MX + 2, MZ - 42];
export const SHIP6: [number, number] = [MX + 0.5, MZ - 40];
export const SHIP8: [number, number] = [MX, MZ - 48];
const Y_DIAG = 1.05;
export const decoysAt = (id: number, f: number): Decoy[] => {
  if (id === 1) {
    const u = hund(f, 78, 70);
    return [{ kind: "acorazado", x: SHIP1[0], z: SHIP1[1], yaw: Y_DIAG, y: -9 * u ** 1.6 + Math.sin(f * 0.05) * 0.05, rx: -0.32 * u, rz: 0.4 * u }];
  }
  if (id === 3 || id === 7 || id === 11) return [{ kind: "tabla", x: TABLA[0], z: TABLA[1], yaw: 0.25, y: bob(f), rx: Math.sin(f * 0.09) * 0.04, rz: Math.sin(f * 0.07 + 1) * 0.05 }];
  if (id === 4) {
    const bx = MX + Math.max(1.75, 4.6 - 0.07 * (f - 283));
    return [
      { kind: "tabla", x: TABLA[0], z: TABLA[1], yaw: 0.25, y: bob(f), rz: Math.sin(f * 0.07 + 1) * 0.05 },
      { kind: "bote", x: bx, z: TABLA[1] + 0.3, yaw: -Math.PI / 2, y: bob(f, 2) * 0.6, rz: Math.sin(f * 0.08) * 0.03 },
      { kind: "destructor", x: MX + 12, z: MZ - 34, yaw: -0.9 + Math.PI, y: Math.sin(f * 0.05) * 0.05 },
    ];
  }
  if (id === 6) {
    const u = hund(f, 470, 60), out: Decoy[] = [{ kind: "destructor", x: SHIP6[0], z: SHIP6[1], yaw: Y_DIAG, y: -6 * u ** 1.5 + Math.sin(f * 0.05) * 0.05, rx: 0.3 * u, rz: -0.3 * u, shake: f >= 455 && f < 470 ? 1 : 0 }];
    if (f >= 418 && f < 452) out.push({ kind: "periscopio", x: MX + 7, z: MZ - 30, yaw: 0, y: -1.6 * (1 - smooth((f - 418) / 8)) });
    if (f >= 438 && f < 456) { const v = clamp01((f - 438) / 17); out.push({ kind: "estela", x: MX + 7 + (SHIP6[0] - MX - 7) * v, z: MZ - 30 + (SHIP6[1] - MZ + 30) * v, yaw: Math.atan2(SHIP6[0] - MX - 7, SHIP6[1] - MZ + 30) }); }
    return out;
  }
  if (id === 8) return [{ kind: "portaaviones", x: SHIP8[0] - 0.02 * (f - 541), z: SHIP8[1], yaw: Y_DIAG + Math.PI, y: Math.sin(f * 0.05) * 0.05 }];
  if (id === 9) return [{ kind: "portaaviones", x: MX + 2.5, z: MZ - 12, yaw: Math.PI / 2, y: Math.sin(f * 0.05) * 0.03 }];
  if (id === 10) {
    const u = hund(f, 722, 70), out: Decoy[] = [{ kind: "portaaviones", x: SHIP8[0], z: SHIP8[1], yaw: Y_DIAG + Math.PI, y: -5 * u ** 1.8 + Math.sin(f * 0.05) * 0.05, rz: 0.55 * smooth((f - 716) / 30), rx: 0.1 * u, shake: f >= 714 && f < 726 ? 1 : 0 }];
    if (f >= 694 && f < 715) { const v = clamp01((f - 694) / 20); out.push({ kind: "estela", x: MX - 9 + (SHIP8[0] - MX + 9) * v, z: MZ - 30 + (SHIP8[1] - MZ + 30) * v, yaw: Math.atan2(SHIP8[0] - MX + 9, SHIP8[1] - MZ + 30) }); }
    return out;
  }
  return [];
};

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
/** campo: cámara en (x, alto, z) mirando a (lx, ly, lz), con empuje lento */
const field = (f: number, f0: number, pos: V3, look: V3, fov = 46, rate = 0.0015, punch = 0) =>
  dolly(pos, look, pushK(f, f0, rate, punch, 22), { fov });
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: (f) => field(f, 0, [MX - 1.5, D0 + 5.5, MZ], [SHIP1[0] + 2.5, D0 + 3.0, SHIP1[1]], 40, 0.0015) }],
  2: [{ f: 124, s: (f) => plato(f, 124, 6.2, 0.0018) }],
  3: [{ f: 209, s: (f) => field(f, 209, [MX + 0.15, D0 + 0.8, MZ - 1.0], [MX, D0 + 0.35, TABLA[1]], 40, 0.002, 0.006) }],
  4: [{ f: 283, s: (f) => field(f, 283, [MX + 1.3, D0 + 2.4, MZ + 2.8], [MX + 1.3, D0 + 0.4, TABLA[1]], 46, 0.0012) }],
  5: [{ f: 366, s: (f) => dolly([PLATO_X, D0 + 1.2, BACK_Z - 5.6], [PLATO_X, D0 + 0.95, BACK_Z - 0.6], pushK(f, 366, 0.003, 0.008), { fov: 44 }) }],
  6: [{ f: 396, s: (f) => field(f, 396, [MX - 1.5, D0 + 4.5, MZ], [SHIP6[0] + 2, D0 + 2.4, SHIP6[1]], 40, 0.0015) }],
  7: [{ f: 497, s: (f) => field(f, 497, [MX - 0.1, D0 + 0.85, MZ - 1.1], [MX, D0 + 0.35, TABLA[1]], 40, 0.0025, 0.006) }],
  8: [{ f: 541, s: (f) => field(f, 541, [MX - 1.5, D0 + 6.0, MZ], [SHIP8[0] - 0.6 * ((f - 541) / 30), D0 + 3.5, SHIP8[1]], 40, 0.0012) }],
  9: [{ f: 603, s: (f) => field(f, 603, [MX + 0.1, D0 + 4.3, MZ - 6.6], [MX + 0.1, D0 + 3.9, MZ - 10.4], 44, 0.002) }],
  10: [{ f: 666, s: (f) => field(f, 666, [MX - 1.5, D0 + 6.0, MZ], [SHIP8[0], D0 + 3.0, SHIP8[1]], 40, 0.0015) }],
  11: [{ f: 741, s: (f) => field(f, 741, [MX + 0.1, D0 + 0.85, MZ - 1.1], [MX, D0 + 0.4, TABLA[1]], 40, 0.0022, 0.007) }],
  12: [{ f: 833, s: (f) => dolly([PLATO_X, D0 + 1.4, BACK_Z - 6.6], [PLATO_X, D0 + 1.25, BACK_Z - 0.6], pushK(f, 833, 0.002), { fov: 44 }) }],
  13: [{ f: 903, s: (f) => field(f, 903, [MX, D0 + 1.0, TZ + 3.6], [MX, D0 + 0.7, TZ - 0.5], 44, 0.002) }],
};

const KICKS: [number, number][] = [[83, 0.5], [215, 0.3], [345, 0.4], [455, 0.8], [482, 0.4], [506, 0.4], [649, 0.4], [714, 0.8], [802, 0.6], [865, 0.5], [945, 0.3]];
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
  { f: 0, cInf: 2 }, { f: 124, cInf: 5 }, { f: 209, cInf: 9 }, { f: 283, cInf: 5 }, { f: 366, cInf: 7 }, { f: 396, cInf: 2 },
  { f: 497, cInf: 9 }, { f: 541, cInf: 2 }, { f: 603, cInf: 6 }, { f: 666, cInf: 2 }, { f: 741, cInf: 9 }, { f: 833, cInf: 6 }, { f: 903, cInf: 8 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
