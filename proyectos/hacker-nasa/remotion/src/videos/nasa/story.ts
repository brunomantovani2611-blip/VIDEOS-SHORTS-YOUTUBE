// «Jonathan James, 1999». Línea de tiempo del short: tomas atadas a los cuadros de cada palabra de la voz
// (../../../../voz/palabras.json).
//
// Una calle de Miami de noche (se mira hacia -z, x ≈ -80). Tres interiores abiertos con la pared del fondo en z = -596
// (se miran hacia +z: +x a la IZQUIERDA del cuadro): el cuarto del chico (600), la oficina (700) y el plató (900).
//
// Cuadros clave: 1999@5 chico@47 metió@75 computadoras@87 cuarto@153 Miami@171 Se@188 Jonathan@202 Primero@230
// agencia@251 Defensa@282 leer@308 tres@324 correos@335 Pero@365 Después@396 NASA@417 bajó@437 vida@476 astronautas@487
// Estación@507 temperatura@536 humedad@559 aire@578 Un@591 millón@620 dólares@648 Cuando@667 cuenta@690 apagar@713
// computadoras@726 tres@751 semanas@757 Un@776 agentes@795 tocaron@818 puerta@829 Y@858 dieciséis@867 Jonathan@893
// primer@924 menor@931 prisión@970 hackear@984 Cuando@1000 preguntaron@1008 programa@1038 NASA@1052 respondió@1066
// Estaba@1085 mal@1100 hecho@1105 valía@1120 dinero@1135 Todo@1151 computadora@1172 cuarto@1193 (fin de la voz ~1211)
export const FPS = 30;
export const TOTAL = 1228;
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
  { id: 1, a: 0, b: 188, light: "night", scene: "cuarto", ...NI },    // 1999: un chico de 15 años desde su cuarto en Miami
  { id: 2, a: 188, b: 230, light: "day", scene: "plato", ...IN },      // se llamaba Jonathan James
  { id: 3, a: 230, b: 365, light: "day", scene: "oficina", ...IN },    // la agencia de Defensa: 3.000 correos secretos
  { id: 4, a: 365, b: 396, light: "night", scene: "cuarto", ...NI },   // pero no se detuvo ahí
  { id: 5, a: 396, b: 487, light: "day", scene: "plato", ...IN },      // entró a la NASA y se bajó el programa
  { id: 6, a: 487, b: 591, light: "day", scene: "plato", ...IN },      // la estación espacial: temperatura, humedad, aire
  { id: 7, a: 591, b: 667, light: "day", scene: "plato", ...IN },      // 1.700.000 dólares
  { id: 8, a: 667, b: 776, light: "day", scene: "oficina", ...IN },    // la NASA apaga sus computadoras tres semanas
  { id: 9, a: 776, b: 858, light: "night", scene: "calle", ...NI },    // los agentes federales tocan la puerta
  { id: 10, a: 858, b: 1000, light: "day", scene: "plato", ...IN },    // primer menor enviado a prisión por hackear
  { id: 11, a: 1000, b: 1085, light: "day", scene: "plato", ...IN },   // le preguntaron por el programa
  { id: 12, a: 1085, b: 1151, light: "day", scene: "plato", ...IN },   // «estaba muy mal hecho, no valía ese dinero»
  { id: 13, a: 1151, b: TOTAL, light: "night", scene: "cuarto", ...NI }, // todo desde la computadora de su cuarto
];
export const XFADE: Record<number, number> = { 2: 8, 3: 8, 4: 8, 5: 8, 6: 8, 7: 8, 8: 8, 9: 10, 10: 8, 11: 8, 13: 10 };
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
  [5, 70, "1999"],
  [57, 186, "15 años · Miami"],
  [324, 362, "+ 3.000 correos"],
  [620, 665, "$ 1.700.000"],
  [751, 774, "3 semanas"],
  [867, 925, "16 años"],
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
  1: [{ f: 0, s: (f) => room(CUARTO_X, f, 0, 0.0025, 5.6, 0.005) }],
  2: [{ f: 188, s: (f) => plato(f, 188, 5.6, 0.003) }],
  3: [{ f: 230, s: (f) => room(OFICINA_X, f, 230, 0.0022, 5.6, 0.005) }],
  4: [{ f: 365, s: (f) => room(CUARTO_X, f, 365, 0.004, 4.4, 0.008) }],
  5: [{ f: 396, s: (f) => plato(f, 396, 6.0, 0.002) }],
  6: [{ f: 487, s: (f) => plato(f, 487, 6.2, 0.0016) }],
  7: [{ f: 591, s: (f) => plato(f, 591, 6.0, 0.003) }],
  8: [{ f: 667, s: (f) => room(OFICINA_X, f, 667, 0.0025, 5.4, 0.006) }],
  9: [{ f: 776, s: (f) => dolly([CALLE[0], D0 + 1.55, -2.4], [CALLE[0], D0 + 1.5, -11], pushK(f, 776, 0.002, 0.006, 22), { fov: 46 }) }],
  10: [{ f: 858, s: (f) => plato(f, 858, 5.6, 0.002) }],
  11: [{ f: 1000, s: (f) => plato(f, 1000, 5.6, 0.002) }],
  12: [{ f: 1085, s: (f) => plato(f, 1085, 5.4, 0.003) }],
  13: [{ f: 1151, s: (f) => room(CUARTO_X, f, 1151, 0.003, 5.4, 0.006) }],
};

const KICKS: [number, number][] = [[417, 0.5], [690, 0.5], [818, 0.5], [970, 0.6], [1100, 0.4]];
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
  { f: 0, cInf: 8 }, { f: 188, cInf: 5 }, { f: 230, cInf: 8 }, { f: 365, cInf: 8 }, { f: 396, cInf: 5 }, { f: 667, cInf: 8 },
  { f: 776, cInf: 7 }, { f: 858, cInf: 5 }, { f: 1151, cInf: 8 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
