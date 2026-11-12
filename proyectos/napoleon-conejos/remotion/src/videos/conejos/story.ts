// «Napoleón y los conejos» (Prusia, 1807). Tomas atadas a los cuadros de la voz (../../../../voz/palabras.json).
// Una pradera con un camino de tierra (se mira hacia -z: +x a la DERECHA del cuadro) y el plató azul (900),
// que se mira hacia +z (+x a la IZQUIERDA).
//
// Cuadros clave: 1807@5 Napoleón@36 firmar@59 paz@71 festejarlo@87 con@107 cacería@116 conejos@129 Su@149 mano@155
// general@181 Berthier@190 juntó@206 cientos@214 conejos@226 jaulas@240 Algunos@259 tres@288 mil@293 Pero@304
// abrieron@315 jaulas@326 conejos@346 no@358 escaparon@362 Corrieron@382 directo@393 Napoleón@407 El@425
// problema@430 No@449 salvajes@469 Berthier@490 comprado@511 granjeros@522 Eran@543 mansos@550 creyeron@568
// dar@594 comer@601 Los@616 soldados@620 espantarlos@644 látigos@663 pero@680 conejos@689 dividieron@701 dos@716
// grupos@721 rodearon@736 Se@755 subían@762 piernas@780 Napoleón@799 corriendo@829 carruaje@843 hasta@862
// metieron@878 El@896 hombre@900 temblar@916 Europa@933 perdió@950 ejército@969 conejos@984 (fin ~1006)
export const FPS = 30;
export const TOTAL = 1036;
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
/** el camino de tierra: centro en z = RZ, de RZ - 2 a RZ + 2 */
export const RZ = -8.6;
export const CUARTO_X = 600, OFICINA_X = 700, PLATO_X = 900;
/** mesas: quien está sentado va detrás (junto a la pared), la mesa delante */
export const MESA_Z = BACK_Z - 1.0;
/** (heredado del mundo base: un río lejos de todo) */
export const RIO_Z0 = 300, RIO_Z1 = 345;

// ---------------- tomas ----------------
export type Light = "day" | "golden" | "night";
export type Scene = "plato" | "cuarto" | "oficina" | "calle";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene; sunAz?: number; sunEl?: number; fogFar?: number };
const IN = { sunAz: 150, sunEl: 48 };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 107, light: "day", scene: "calle", ...IN },      // Napoleón firmó la paz y quiso festejarlo
  { id: 2, a: 107, b: 149, light: "day", scene: "calle", ...IN },    // ...con una cacería de conejos
  { id: 3, a: 149, b: 259, light: "day", scene: "plato", ...IN },    // Berthier junta cientos de conejos en jaulas
  { id: 4, a: 259, b: 304, light: "day", scene: "calle", ...IN },    // algunos dicen que eran tres mil
  { id: 5, a: 304, b: 382, light: "day", scene: "calle", ...IN },    // abren las jaulas: los conejos no escapan
  { id: 6, a: 382, b: 425, light: "day", scene: "calle", ...IN },    // corren directo hacia Napoleón
  { id: 7, a: 425, b: 566, light: "day", scene: "plato", ...IN },    // no eran salvajes: comprados a granjeros. Mansos
  { id: 8, a: 566, b: 616, light: "day", scene: "calle", ...IN },    // creyeron que les iban a dar de comer
  { id: 9, a: 616, b: 680, light: "day", scene: "calle", ...IN },    // los soldados con látigos
  { id: 10, a: 680, b: 755, light: "day", scene: "calle", ...IN },   // dos grupos que lo rodean
  { id: 11, a: 755, b: 799, light: "day", scene: "calle", ...IN },   // se le suben por las piernas
  { id: 12, a: 799, b: 896, light: "day", scene: "calle", ...IN },   // escapa al carruaje... y se le meten
  { id: 13, a: 896, b: 950, light: "day", scene: "plato", ...IN },   // el hombre que hizo temblar a Europa
  { id: 14, a: 950, b: TOTAL, light: "day", scene: "calle", ...IN }, // perdió contra un ejército de conejos
];
export const XFADE: Record<number, number> = { 2: 6, 3: 8, 4: 8, 5: 6, 6: 6, 7: 8, 8: 8, 9: 6, 10: 8, 11: 6, 12: 8, 13: 8, 14: 8 };
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
  [12, 100, "Prusia · 1807"],
];

/** utilería 3D (world.ts): jaulas y el carruaje; yaw: 0 = mira a +z; open = puerta de la jaula 0..1 */
export type Decoy = { kind: "jaula" | "carruaje"; x: number; z: number; yaw: number; y?: number; shake?: number; s?: number; open?: number; moving?: boolean };
const C = CALLE[0];
/** el plató: jaulas que caen (x, z, y de apoyo, cuadro de caída) */
export const JAULAS3: [number, number, number, number][] = [
  [PLATO_X + 1.25, BACK_Z - 1.2, 0, 206], [PLATO_X - 1.25, BACK_Z - 1.2, 0, 209], [PLATO_X + 1.25, BACK_Z - 1.2, 0.76, 214],
  [PLATO_X - 1.25, BACK_Z - 1.2, 0.76, 218], [PLATO_X + 2.35, BACK_Z - 1.5, 0, 224], [PLATO_X - 2.35, BACK_Z - 1.5, 0, 228],
];
/** la fila de jaulas en la pradera (toma 5) */
export const FILA5 = [-1.25, 0, 1.25].map((dx) => C + dx);
export const Z5 = RZ - 1.6;
export const openAt = (f: number, i: number) => smooth((f - 318 - i * 2.5) / 7);
/** el carruaje: x de la caja en el cuadro f (arranca a la derecha en 884) */
export const CARRO_X = (f: number) => C + 2.4 + (f < 884 ? 0 : 0.006 * (f - 884) ** 2);
export const decoysAt = (id: number, f: number): Decoy[] => {
  if (id === 3) return JAULAS3.filter(([, , , f0]) => f >= f0).map(([x, z, y0, f0]) => ({ kind: "jaula", x, z, yaw: Math.PI, y: y0 + 2.2 * (1 - clamp01((f - f0) / 7)) ** 2 }));
  if (id === 4) {
    const out: Decoy[] = [];
    for (let r = 0; r < 4; r++) for (let k = -6; k <= 6; k++) out.push({ kind: "jaula", x: C + k * 1.25 + (r % 2) * 0.6, z: RZ - 1.6 - r * 1.3, yaw: 0 });
    for (let k = -5; k <= 5; k++) out.push({ kind: "jaula", x: C + k * 1.25 + 0.3, z: RZ - 1.6, yaw: 0, y: 0.76 });
    return out;
  }
  if (id === 5) return FILA5.map((x, i) => ({ kind: "jaula", x, z: Z5, yaw: 0, open: openAt(f, i) }));
  if (id === 6) return FILA5.map((x) => ({ kind: "jaula", x: x + 0.6, z: RZ - 9, yaw: 0, open: 1 }));
  if (id === 12) {
    const mv = f >= 884;
    return [{ kind: "carruaje", x: CARRO_X(f), z: RZ - 0.6, yaw: Math.PI / 2, moving: mv, y: mv ? Math.abs(Math.sin(f * 0.8)) * 0.03 : 0, shake: f >= 860 ? 1 : 0 }];
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
  1: [{ f: 0, s: (f) => field(f, 0, [C + 0.2, D0 + 1.7, RZ + 5.6], [C + 0.2, D0 + 1.45, RZ - 1.0], 44, 0.0018) }],
  2: [{ f: 107, s: (f) => field(f, 107, [C + 0.4, D0 + 0.8, -10.2], [C + 0.4, D0 + 0.5, -12.6], 40, 0.0025, 0.006) }],
  3: [{ f: 149, s: (f) => plato(f, 149, 6.2, 0.0015) }, { f: 203, dur: 22, s: (f) => plato(f, 203, 8.6, 0.001) }],
  4: [{ f: 259, s: (f) => field(f, 259, [C + 0.4 - 0.01 * (f - 259), D0 + 4.6, RZ + 5.5], [C + 0.4 - 0.01 * (f - 259), D0 + 0.4, RZ - 6], 52, 0.001) }],
  5: [{ f: 304, s: (f) => field(f, 304, [C, D0 + 1.2, RZ + 4.6], [C, D0 + 0.5, Z5], 50, 0.0012) }],
  6: [{ f: 382, s: (f) => field(f, 382, [C + 0.1, D0 + 1.55, RZ + 5.0], [C + 0.1, D0 + 0.9, RZ - 0.5], 46, 0.002, 0.006) }],
  7: [{ f: 425, s: (f) => dolly([PLATO_X, D0 + 1.3, BACK_Z - 6.0], [PLATO_X, D0 + 1.15, BACK_Z - 0.6], pushK(f, 425, 0.002), { fov: 44 }) }, { f: 486, dur: 20, s: (f) => plato(f, 486, 7.2, 0.0012) }],
  8: [{ f: 566, s: (f) => field(f, 566, [C + 0.1, D0 + 1.25, RZ + 4.0], [C + 0.1, D0 + 0.85, RZ - 0.4], 46, 0.0018) }],
  9: [{ f: 616, s: (f) => field(f, 616, [C + 0.3, D0 + 1.7, RZ + 6.2], [C + 0.3, D0 + 0.9, RZ - 1.0], 46, 0.0012) }],
  10: [{ f: 680, s: (f) => field(f, 680, [C, D0 + 7.4, RZ + 6.0], [C, D0 + 0.2, RZ - 1.2], 50, 0.0015) }],
  11: [{ f: 755, s: (f) => field(f, 755, [C + 0.05, D0 + 1.35, RZ + 4.3], [C + 0.05, D0 + 1.15, RZ - 0.3], 44, 0.002, 0.006) }],
  12: [{ f: 799, s: (f) => { const x = Math.min(CARRO_X(f) - 0.6, C - 3.3 + 0.135 * (f - 799)); return { pos: [x - 1.0, D0 + 1.9, RZ + 6.6], look: [x, D0 + 1.2, RZ - 0.6], fov: 48 }; } }],
  13: [{ f: 896, s: (f) => plato(f, 896, 7.0, 0.0025) }],
  14: [{ f: 950, s: (f) => field(f, 950, [C, D0 + 1.5, RZ + 5.6], [C, D0 + 1.05, RZ - 1.0], 46, 0.0018, 0.006) }],
};

const KICKS: [number, number][] = [[129, 0.4], [206, 0.4], [326, 0.4], [393, 0.5], [550, 0.6], [701, 0.4], [736, 0.5], [878, 0.5], [916, 0.8], [984, 0.6]];
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
  { f: 0, cInf: 6 }, { f: 107, cInf: 9 }, { f: 149, cInf: 5 }, { f: 259, cInf: 3 }, { f: 304, cInf: 5 }, { f: 382, cInf: 7 },
  { f: 425, cInf: 5 }, { f: 566, cInf: 8 }, { f: 616, cInf: 5 }, { f: 680, cInf: 3 }, { f: 755, cInf: 8 }, { f: 799, cInf: 6 },
  { f: 896, cInf: 5 }, { f: 950, cInf: 6 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
