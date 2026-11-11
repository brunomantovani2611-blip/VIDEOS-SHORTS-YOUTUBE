// «El hackeo de Twitter de 2020». Línea de tiempo del short: tomas atadas a los cuadros de cada palabra de la voz
// (../../../../voz/palabras.json).
//
// Una calle de Florida de noche (se mira hacia -z: +x a la derecha del cuadro, x ≈ -80). Tres interiores abiertos lejos de
// todo, con la pared del fondo en z = -596 (se miran hacia +z: +x a la IZQUIERDA del cuadro): el cuarto del chico (600),
// la oficina (700) y el plató de las pantallas (900).
//
// Cuadros clave: 15@5 Twitter@49 loco@69 La@83 Elon@97 Mándenme@126 devuelvo@172 Después@197 Bill@208 Obama@238 Biden@252
// Apple@268 todos@281 Era@321 estafa@331 quién@351 Un@383 chico@386 17@396 Florida@420 No@437 virus@459 Llamó@475
// empleados@499 se@526 soporte@558 convenció@593 contraseñas@620 Con@644 panel@661 Atacó@716 130@731 En@755 mandó@795
// cien@811 Twitter@841 bloquear@892 verificadas@923 Dos@955 policía@989 tocó@1001 puerta@1012 Lo@1028 tres@1047
// El@1079 código@1138 Se@1155 llamada@1176 (fin de la voz ~1195)
export const FPS = 30;
export const TOTAL = 1215;
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
  { id: 1, a: 0, b: 83, light: "day", scene: "plato", ...IN },        // 15 de julio de 2020: Twitter se vuelve loco
  { id: 2, a: 83, b: 197, light: "day", scene: "plato", ...IN },      // el tuit de Elon Musk
  { id: 3, a: 197, b: 321, light: "day", scene: "plato", ...IN },     // Bill Gates, Obama, Biden, Apple
  { id: 4, a: 321, b: 383, light: "day", scene: "plato", ...IN },     // era una estafa
  { id: 5, a: 383, b: 475, light: "night", scene: "cuarto", ...NI },  // un chico de 17 años de Florida; sin virus
  { id: 6, a: 475, b: 526, light: "night", scene: "cuarto", ...NI },  // llama por teléfono
  { id: 7, a: 526, b: 644, light: "day", scene: "oficina", ...IN },   // «soy de soporte técnico»: las contraseñas
  { id: 8, a: 644, b: 755, light: "day", scene: "plato", ...IN },     // el panel interno: 130 cuentas
  { id: 9, a: 755, b: 841, light: "night", scene: "cuarto", ...NI },  // más de cien mil dólares
  { id: 10, a: 841, b: 955, light: "day", scene: "plato", ...IN },    // bloquear todas las cuentas verificadas
  { id: 11, a: 955, b: 1028, light: "night", scene: "calle", ...NI }, // la policía toca su puerta
  { id: 12, a: 1028, b: 1079, light: "day", scene: "plato", ...IN },  // tres años de prisión
  { id: 13, a: 1079, b: TOTAL, light: "day", scene: "cuarto", ...IN }, // no fue código: fue una llamada
];
export const XFADE: Record<number, number> = { 5: 8, 7: 8, 8: 8, 9: 8, 10: 8, 11: 10, 12: 8, 13: 10 };
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
  [5, 66, "15/07/2020"],
  [396, 450, "17 años · Florida"],
  [811, 840, "+ $100.000"],
  [1047, 1078, "3 años"],
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
  1: [{ f: 0, s: (f) => plato(f, 0, 6.0, 0.003) }],
  2: [{ f: 83, s: (f) => plato(f, 83, 5.6) }],
  3: [{ f: 197, s: (f) => plato(f, 197, 6.4, 0.0012) }],
  4: [{ f: 321, s: (f) => plato(f, 321, 6.2, 0.003) }],
  5: [{ f: 383, s: (f) => room(CUARTO_X, f, 383, 0.0025, 5.2, 0.006) }],
  6: [{ f: 475, s: (f) => room(CUARTO_X - 0.7, f, 475, 0.003, 4.6) }],
  7: [{ f: 526, s: (f) => room(OFICINA_X, f, 526, 0.0025, 5.6, 0.006) }],
  8: [{ f: 644, s: (f) => plato(f, 644, 6.0) }],
  9: [{ f: 755, s: (f) => room(CUARTO_X, f, 755, 0.003, 5.0, 0.006) }],
  10: [{ f: 841, s: (f) => plato(f, 841, 6.0, 0.002) }],
  11: [{ f: 955, s: (f) => dolly([CALLE[0], D0 + 1.55, -2.4], [CALLE[0], D0 + 1.5, -11], pushK(f, 955, 0.002, 0.006, 22), { fov: 46 }) }],
  12: [{ f: 1028, s: (f) => plato(f, 1028, 5.4, 0.003) }],
  13: [{ f: 1079, s: (f) => room(CUARTO_X, f, 1079, 0.003, 5.2, 0.007) }],
};

const KICKS: [number, number][] = [[69, 0.5], [331, 0.6], [620, 0.4], [892, 0.5], [1001, 0.5], [1176, 0.5]];
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
  { f: 0, cInf: 5 }, { f: 383, cInf: 8 }, { f: 526, cInf: 8 }, { f: 644, cInf: 5 }, { f: 755, cInf: 8 }, { f: 841, cInf: 5 },
  { f: 955, cInf: 7 }, { f: 1028, cInf: 5 }, { f: 1079, cInf: 8 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
