// «La guerra del emú» (Australia, 1932). Tomas atadas a los cuadros de la voz (../../../../voz/palabras.json).
// Un campo de trigo con un camino de tierra (se mira hacia -z: +x a la DERECHA del cuadro) y el plató azul (900),
// que se mira hacia +z (+x a la IZQUIERDA).
//
// Cuadros clave: 1932@5 ejército@46 Australia@61 guerra@94 contra@107 pájaros@122 Unos@142 veinte@149 emúes@161
// destrozando@179 trigo@210 granjeros@224 Así@244 gobierno@257 mandó@268 mayor@280 dos@294 soldados@297 dos@317
// ametralladoras@323 Parecía@350 fácil@361 Pero@377 disparaban@395 emúes@417 separaban@426 corriendo@450 lados@476
// Probaron@492 camión@522 pero@537 emúes@546 rápidos@567 Y@585 peor@595 ametralladora@620 atascó@639 Después@656
// semanas@668 gastado@694 diez@711 balas@721 y@735 emúes@742 seguían@750 ahí@759 El@771 mayor@775 dijo@783 Si@796
// soldados@811 aguantaran@824 balas@841 pájaros@860 podríamos@877 enfrentar@889 cualquier@901 ejército@910 mundo@926
// El@940 ejército@945 retiró@961 Y@978 emúes@986 ganaron@1003 guerra@1015 (fin ~1032)
export const FPS = 30;
export const TOTAL = 1060;
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
  { id: 1, a: 0, b: 107, light: "day", scene: "calle", ...IN },     // el ejército sale a pelear una guerra
  { id: 2, a: 107, b: 142, light: "day", scene: "calle", ...IN },   // ...contra unos pájaros
  { id: 3, a: 142, b: 244, light: "day", scene: "calle", ...IN },   // 20.000 emúes en el trigo
  { id: 4, a: 244, b: 350, light: "day", scene: "plato", ...IN },   // un mayor, dos soldados, dos ametralladoras
  { id: 5, a: 350, b: 377, light: "day", scene: "calle", ...IN },   // parecía fácil
  { id: 6, a: 377, b: 492, light: "day", scene: "calle", ...IN },   // disparan: los emúes se separan y corren
  { id: 7, a: 492, b: 585, light: "day", scene: "calle", ...IN },   // el camión: los emúes son más rápidos
  { id: 8, a: 585, b: 656, light: "day", scene: "calle", ...IN },   // la ametralladora se atasca
  { id: 9, a: 656, b: 735, light: "day", scene: "plato", ...IN },   // casi diez mil balas
  { id: 10, a: 735, b: 771, light: "day", scene: "calle", ...IN },  // y los emúes seguían ahí
  { id: 11, a: 771, b: 940, light: "day", scene: "calle", ...IN },  // lo que dijo el mayor
  { id: 12, a: 940, b: 978, light: "day", scene: "calle", ...IN },  // el ejército se retira
  { id: 13, a: 978, b: TOTAL, light: "day", scene: "calle", ...IN }, // los emúes ganaron la guerra
];
export const XFADE: Record<number, number> = { 2: 6, 3: 8, 4: 8, 5: 6, 6: 6, 7: 8, 8: 8, 9: 8, 10: 6, 11: 8, 12: 8, 13: 8 };
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
  [12, 100, "Australia · 1932"],
  [668, 732, "semanas después"],
];

/** utilería 3D (world.ts): la ametralladora Lewis y el camión; yaw: 0 = mira a +z */
export type Decoy = { kind: "lewis" | "camion"; x: number; z: number; yaw: number; y?: number; shake?: number; s?: number };
/** hacia dónde apunta la ametralladora en la toma de los disparos */
export const GUN6: V3 = [CALLE[0] - 0.25, D0, RZ + 0.2];
export const EMU6: [number, number] = [CALLE[0] + 1.9, -16.5];
export const YAW6 = Math.atan2(EMU6[0] - GUN6[0], EMU6[1] - GUN6[2]);
/** camión de la persecución: posición x en el cuadro f */
export const truckX = (f: number) => CALLE[0] - 9 + 3.3 * ((f - 492) / 30);
export const decoysAt = (id: number, f: number): Decoy[] => {
  const cx = CALLE[0];
  if (id === 4 && f >= 321) {
    const y = (f0: number) => 1.8 * (1 - clamp01((f - f0) / 7)) ** 2;
    return [
      { kind: "lewis", x: PLATO_X + 0.62, z: BACK_Z - 3.0, yaw: Math.PI / 2 + 0.25, y: y(321), s: 0.8 },
      { kind: "lewis", x: PLATO_X - 0.62, z: BACK_Z - 3.0, yaw: -Math.PI / 2 - 0.25, y: y(326), s: 0.8 },
    ];
  }
  if (id === 5) return [{ kind: "lewis", x: cx + 0.75, z: RZ - 0.2, yaw: YAW6 }];
  if (id === 6) return [{ kind: "lewis", x: GUN6[0], z: GUN6[2], yaw: YAW6, shake: (f >= 395 && f < 422) || (f >= 440 && f < 470) ? 1 : 0 }];
  if (id === 7) return [{ kind: "camion", x: truckX(f), z: RZ + 0.3, yaw: Math.PI / 2, y: Math.abs(Math.sin(f * 0.9)) * 0.03 }];
  if (id === 8) return [{ kind: "lewis", x: cx + 0.35, z: RZ - 0.2, yaw: YAW6, shake: f >= 600 && f < 638 ? 1 : 0 }];
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
const C = CALLE[0];
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: (f) => field(f, 0, [C - 1.95 + 0.026 * f, D0 + 1.8, RZ + 8.0], [C - 1.95 + 0.026 * f, D0 + 1.4, RZ - 1.2], 46, 0.001) }],
  2: [{ f: 107, s: (f) => field(f, 107, [C + 0.4, D0 + 1.35, -8.2], [C + 0.4, D0 + 1.3, -12.4], 40, 0.0025, 0.006) }],
  3: [{ f: 142, s: (f) => field(f, 142, [C, D0 + 3.4, RZ + 6.0], [C, D0 + 0.7, -20], 48, 0.0012) }],
  4: [{ f: 244, s: (f) => plato(f, 244, 6.0, 0.0015) }, { f: 312, dur: 26, s: (f) => plato(f, 312, 8.4, 0.001) }],
  5: [{ f: 350, s: (f) => field(f, 350, [C + 0.1, D0 + 1.55, RZ + 4.6], [C + 0.1, D0 + 1.3, RZ - 0.6], 42, 0.003, 0.008) }],
  6: [{ f: 377, s: (f) => field(f, 377, [C - 0.1, D0 + 2.4, RZ + 6.6], [C + 0.35, D0 + 0.8, -15], 50, 0.0012) }],
  7: [{ f: 492, s: (f) => { const x = truckX(f); return { pos: [x - 7.4, D0 + 3.6, RZ + 2.7], look: [x + 6.5, D0 + 0.5, RZ - 0.2], fov: 48 }; } }],
  8: [{ f: 585, s: (f) => field(f, 585, [C + 0.05, D0 + 1.7, RZ + 5.8], [C + 0.1, D0 + 1.25, RZ - 1.0], 42, 0.002, 0.007) }],
  9: [{ f: 656, s: (f) => plato(f, 656, 6.2, 0.002) }],
  10: [{ f: 735, s: (f) => field(f, 735, [C + 0.4, D0 + 1.5, -7.6], [C + 0.4, D0 + 1.25, -13.0], 42, 0.003) }],
  11: [{ f: 771, s: (f) => field(f, 771, [C, D0 + 1.75, RZ + 5.4], [C, D0 + 1.6, RZ - 0.6], 44, 0.0012) }],
  12: [{ f: 940, s: (f) => field(f, 940, [C + 1.1 - 0.03 * (f - 940), D0 + 1.8, RZ + 7.6], [C + 0.9 - 0.03 * (f - 940), D0 + 1.3, RZ - 1.0], 46, 0.001) }],
  13: [{ f: 978, s: (f) => field(f, 978, [C, D0 + 1.65, RZ + 6.9], [C, D0 + 1.55, RZ - 0.8], 44, 0.002, 0.006) }],
};

const KICKS: [number, number][] = [[107, 0.4], [161, 0.4], [323, 0.4], [395, 0.6], [440, 0.5], [639, 0.6], [721, 0.5], [1003, 0.6]];
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
  { f: 0, cInf: 6 }, { f: 107, cInf: 9 }, { f: 142, cInf: 3 }, { f: 244, cInf: 5 }, { f: 350, cInf: 7 }, { f: 377, cInf: 4 },
  { f: 492, cInf: 5 }, { f: 585, cInf: 8 }, { f: 656, cInf: 5 }, { f: 735, cInf: 9 }, { f: 771, cInf: 7 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
