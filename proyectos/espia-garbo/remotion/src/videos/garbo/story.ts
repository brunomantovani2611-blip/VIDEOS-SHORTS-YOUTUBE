// «El espía que se lo inventó todo» (Juan Pujol, «Garbo», 1941-1944). Línea de tiempo del short: tomas atadas a los
// cuadros de cada palabra de la voz (../../../../voz/palabras.json), cámaras con la gramática de la skill.
//
// Dos calles al aire libre (se miran hacia -z: +x a la derecha del cuadro): Barcelona (x ≈ -80) y Lisboa con su tranvía
// (x ≈ 80). Cuatro interiores abiertos lejos de todo, con la pared del fondo en z = -596 (se miran hacia +z: +x a la
// IZQUIERDA del cuadro): la oficina inglesa (x ≈ 600), la alemana (x ≈ 700), el escritorio de Lisboa con azulejos
// (x ≈ 800) y el plató de los 27 espías y del mapa (x ≈ 900).
//
// Cuadros clave de la voz (30 fps): espías@49 importantes@64 español@94 inventaba@114 todo@127 Pujol@161 Barcelona@182
// ayudar@211 ingleses@225 ofreció@251 espía@264 dijeron@285 no@298 mejor@332 nazis@362 contrataron@384 Londres@432
// nunca@464 Londres@478 Lisboa@510 inventando@526 guía@558 viajes@567 mapas@584 revistas@596 inventó@626 espías@635
// ingleses@683 creer@711 contrataron@729 Juntos@750 veintisiete@782 espías@796 Todos@815 falsos@823 alemanes@849
// pagaban@865 sueldo@877 1944@907 mensajes@953 Hitler@981 desembarco@999 Normandía@1016 distracción@1040 verdad@1082
// Calais@1106 resultado@1128 alemanes@1151 Cruz@1175 Hierro@1182 ingleses@1204 medalla@1225 Británico@1249
// Condecorado@1269 dos@1293 bandos@1298 (fin de la voz ~1309)
export const FPS = 30;
export const TOTAL = 1330;
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
export const BARCELONA: V3 = [-80, D0, -10];
export const LISBOA: V3 = [80, D0, -10];
export const GB_X = 600, DE_X = 700, MESA_X = 800, PLATO_X = 900;
/** mesas de despacho: el oficial sentado detrás (junto a la pared), la mesa delante */
export const MESA_Z = BACK_Z - 1.0;
/** (heredado del mundo base: un río lejos de todo) */
export const RIO_Z0 = 300, RIO_Z1 = 345;

// ---------------- tomas ----------------
export type Light = "day" | "golden" | "night";
export type Scene = "mesa" | "barcelona" | "gb" | "de" | "lisboa" | "plato";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene; sunAz?: number; sunEl?: number; fogFar?: number };
const IN = { sunAz: 160, sunEl: 50 };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 141, light: "day", scene: "mesa", ...IN },                       // el espía que se lo inventaba todo
  { id: 2, a: 141, b: 246, light: "golden", scene: "barcelona", sunAz: 150, sunEl: 25 }, // Juan Pujol, de Barcelona
  { id: 3, a: 246, b: 310, light: "day", scene: "gb", ...IN },                         // los ingleses le dicen que no
  { id: 4, a: 310, b: 450, light: "day", scene: "de", ...IN },                         // se ofrece a los nazis
  { id: 5, a: 450, b: 526, light: "day", scene: "lisboa", sunAz: 120, sunEl: 45 },     // nunca fue a Londres: Lisboa
  { id: 6, a: 526, b: 616, light: "day", scene: "mesa", ...IN },                       // guía de viajes, mapas, revistas
  { id: 7, a: 616, b: 678, light: "day", scene: "mesa", ...IN },                       // se inventa espías
  { id: 8, a: 678, b: 750, light: "day", scene: "gb", ...IN },                         // los ingleses no lo pueden creer
  { id: 9, a: 750, b: 903, light: "day", scene: "plato", ...IN },                      // 27 espías, todos falsos, pagados
  { id: 10, a: 903, b: 997, light: "night", scene: "mesa", sunAz: 160, sunEl: 40 },    // 1944: sus mensajes
  { id: 11, a: 997, b: 1123, light: "day", scene: "plato", ...IN },                    // Normandía, Calais
  { id: 12, a: 1123, b: 1199, light: "day", scene: "de", ...IN },                      // la Cruz de Hierro
  { id: 13, a: 1199, b: 1269, light: "day", scene: "gb", ...IN },                      // la medalla británica
  { id: 14, a: 1269, b: TOTAL, light: "golden", scene: "barcelona", sunAz: 150, sunEl: 25 }, // condecorado por los dos bandos
];
export const XFADE: Record<number, number> = { 2: 8, 5: 8, 6: 8, 9: 8, 10: 10, 11: 10, 14: 10 };
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
  [182, 240, "Barcelona"],
  [505, 524, "Lisboa"],
  [782, 845, "27 espías"],
  [907, 950, "1944"],
];

/** en esta short no hay señuelos de goma */
export type Decoy = { kind: "tanque" | "camion" | "canon"; x: number; z: number; yaw: number; inflate: number; lift?: number; tilt?: number };
export const decoysAt = (_id: number, _f: number): Decoy[] => [];

/** el tranvía de Lisboa cruza la calle */
export const tranviaX = (f: number) => LISBOA[0] + 7 - (f - 450) * 0.12;

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
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: (f) => room(MESA_X, f, 0, 0.003, 5.4, 0.006) }],
  2: [{ f: 141, s: (f) => dolly([BARCELONA[0], D0 + 1.6, -3.4], [BARCELONA[0], D0 + 1.6, -12], pushK(f, 141, 0.0018), { fov: 46 }) }],
  3: [{ f: 246, s: (f) => room(GB_X + 0.15, f, 246, 0.0025, 6.0, 0.006) }],
  4: [{ f: 310, s: (f) => room(DE_X + 0.15, f, 310, 0.0015, 6.2) }],
  5: [{ f: 450, s: (f) => dolly([LISBOA[0], D0 + 1.7, -2.6], [LISBOA[0], D0 + 1.8, -12], pushK(f, 450, 0.0015), { fov: 48 }) }],
  6: [{ f: 526, s: (f) => room(MESA_X, f, 526, 0.0025, 5.6) }],
  7: [{ f: 616, s: (f) => room(MESA_X, f, 616, 0.002, 5.6) }],
  8: [{ f: 678, s: (f) => room(GB_X, f, 678, 0.002, 6.4, 0.006) }],
  9: [{ f: 750, s: (f) => dolly([PLATO_X, D0 + 1.8, BACK_Z - 6.4], [PLATO_X, D0 + 1.8, BACK_Z - 0.6], pushK(f, 750, 0.0015), { fov: 44 }) }],
  10: [{ f: 903, s: (f) => room(MESA_X, f, 903, 0.003, 4.4) }],
  11: [{ f: 997, s: (f) => dolly([PLATO_X, D0 + 1.8, BACK_Z - 6.0], [PLATO_X, D0 + 1.8, BACK_Z - 0.6], pushK(f, 997, 0.0015), { fov: 44 }) }],
  12: [{ f: 1123, s: (f) => room(DE_X + 0.2, f, 1123, 0.0025, 5.2, 0.006) }],
  13: [{ f: 1199, s: (f) => room(GB_X + 0.2, f, 1199, 0.0025, 5.2, 0.006) }],
  14: [{ f: 1269, s: (f) => dolly([BARCELONA[0], D0 + 1.55, -5.6], [BARCELONA[0], D0 + 1.45, -11], pushK(f, 1269, 0.003, 0.007, 22), { fov: 44 }) }],
};

const KICKS: [number, number][] = [[298, 0.6], [384, 0.4], [711, 0.4], [823, 0.5], [1175, 0.4], [1225, 0.4]];
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
  { f: 0, cInf: 8 }, { f: 141, cInf: 6 }, { f: 246, cInf: 8 }, { f: 310, cInf: 8 }, { f: 450, cInf: 6 }, { f: 526, cInf: 8 },
  { f: 616, cInf: 8 }, { f: 678, cInf: 8 }, { f: 750, cInf: 5 }, { f: 903, cInf: 9 }, { f: 997, cInf: 5 }, { f: 1123, cInf: 9 },
  { f: 1199, cInf: 9 }, { f: 1269, cInf: 8 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
