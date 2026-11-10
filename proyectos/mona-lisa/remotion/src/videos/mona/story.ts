// «El robo que hizo famosa a la Mona Lisa» (París, 1911). Línea de tiempo del short: tomas atadas a los cuadros de
// cada palabra de la voz (../../../../voz/palabras.json), cámaras con la gramática de la skill.
//
// Mundo: el París del short de la Torre Eiffel (Sena a lo largo de x, muelle norte z -36.5..-30, torre en x 0, z 140).
// Interiores lejos del pueblo, sin techo: la sala del Louvre (x ≈ 600), la habitación de Peruggia (x ≈ 700), la
// comisaría (x ≈ 800) y la tienda del marchante en Florencia (x ≈ 900), todos con la pared del fondo en z = -596.
//
// Cuadros clave de la voz (30 fps): 1911@5 robó@44 Lisa@59 nadie@75 siguiente@113 Un@132 lunes@136 cerrado@166
// hombre@186 bata@197 empleados@218 descuelga@231 esconde@250 ropa@274 sale@290 puerta@304 Se@321 Vincenzo@334
// Peruggia@346 cuadro@385 él@399 cristal@440 Al@469 pintor@500 copiarla@521 cuatro@557 ganchos@564 pared@578
// París@593 Cierran@620 semana@646 Detienen@663 Apollinaire@685 interrogan@707 Picasso@737 Y@754 miles@778
// cola@806 hueco@832 vacío@839 Mientras@855 baúl@918 habitación@937 Dos@970 Florencia@1015 atrapan@1038
// Antes@1055 famoso@1096 Después@1113 convirtió@1142 famoso@1165 mundo@1179 (fin de la voz ~1196)
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
export const TOWER_C: [number, number] = [0, 140];
export const TOWER_S = 0.5;
export const BACK_Z = -596;
/** la Mona Lisa en la pared del fondo de la sala (centro del lienzo) y su tamaño de caricatura */
export const MONA: V3 = [600, D0 + 1.75, BACK_Z - 0.06];
export const MONA_W = 0.8, MONA_H = 1.16;
/** puerta de servicio en la pared del fondo */
export const PUERTA_X = 604.6;
/** Peruggia en la sala: entra por la izquierda de la cámara (+x es la izquierda mirando a +z) */
export const peruggiaX = (f: number) => lin([[132, 596.2], [224, 599.35], [288, 599.35], [321, 604.6]], f);
export const PERUGGIA_Z = -597.0;
/** Béroud y su caballete */
export const BEROUD: V3 = [600.75, D0, -598.3];
export const CABALLETE: V3 = [599.25, D0, -598.6];
/** la habitación de Peruggia y el baúl */
export const CUARTO: V3 = [700, D0, -600];
export const BAUL = { x: 700.35, z: -597.4, w: 1.1, d: 0.6, h: 0.55 };
/** comisaría */
export const COMISARIA: V3 = [800, D0, -600];
export const REJA_Z = -597.6;
/** la tienda del marchante en Florencia */
export const TIENDA: V3 = [900, D0, -600];
/** muelle de París: el vendedor de periódicos */
export const VOCEADOR: V3 = [0.15, D0, -31.0];

// ---------------- tomas ----------------
export type Light = "day" | "golden";
export type Scene = "sala" | "muelle" | "cuarto" | "comisaria" | "tienda";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene; sunAz?: number; sunEl?: number; fogFar?: number };
const IN = { sunAz: 160, sunEl: 50 };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 132, light: "day", scene: "sala", ...IN },        // gancho: la Mona Lisa desaparece de la pared
  { id: 2, a: 132, b: 229, light: "day", scene: "sala", ...IN },      // un lunes, museo cerrado: entra el hombre de la bata
  { id: 3, a: 229, b: 321, light: "day", scene: "sala", ...IN },      // la descuelga, la esconde y sale por la puerta
  { id: 4, a: 321, b: 469, light: "day", scene: "sala", ...IN },      // Vincenzo Peruggia; él le puso el cristal
  { id: 5, a: 469, b: 593, light: "day", scene: "sala", ...IN },      // el pintor encuentra cuatro ganchos
  { id: 6, a: 593, b: 663, light: "day", scene: "muelle", fogFar: 900 }, // París enloquece; cierran el Louvre
  { id: 7, a: 663, b: 754, light: "day", scene: "comisaria", ...IN }, // Apollinaire detenido, Picasso interrogado
  { id: 8, a: 754, b: 855, light: "day", scene: "sala", ...IN },      // cola para ver el hueco vacío
  { id: 9, a: 855, b: 970, light: "golden", scene: "cuarto", sunAz: 165, sunEl: 35 }, // el baúl en la habitación
  { id: 10, a: 970, b: 1055, light: "day", scene: "tienda", ...IN },  // Florencia, 1913: lo atrapan
  { id: 11, a: 1055, b: 1113, light: "day", scene: "sala", ...IN },   // antes: un cuadro famoso
  { id: 12, a: 1113, b: TOTAL, light: "day", scene: "sala", ...IN },  // después: el más famoso del mundo
];
export const XFADE: Record<number, number> = { 6: 8, 7: 8, 8: 8, 9: 8, 10: 8, 11: 8 };
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
  [8, 128, "1911"],
  [557, 590, "4 ganchos"],
  [641, 660, "1 semana"],
  [976, 1052, "Florencia, 1913"],
];

/** ¿está la Mona Lisa colgada en la pared en la toma id, cuadro f? */
export const monaOnWall = (id: number, f: number) => {
  if (id === 1) return f < 46;
  if (id === 2) return true;
  if (id === 3) return f < 232;
  if (id === 4) return f >= 399; // recuerdo: el cristal
  return id >= 11;
};

// ---------------- sin coche ni grúa en este short ----------------
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
// 1 · gancho: la Mona Lisa en la pared; empuje; desaparece (puf)
const S1a = (f: number): Shot => dolly([600, D0 + 1.7, -600.6], [600, D0 + 1.72, MZ], pushK(f, 0, 0.003, 0.006, 30), { fov: 40 });
// 2 · plano general de la sala; Peruggia entra con la bata blanca
const S2a = (f: number): Shot => dolly([598.4, D0 + 1.9, -603.6], [598.6, D0 + 1.5, MZ], pushK(f, 132, 0.0015), { fov: 46 });
// 3 · plano medio: la descuelga y la esconde; corte a la puerta
const S3a = (f: number): Shot => dolly([599.6, D0 + 1.55, -600.2], [599.4, D0 + 1.45, PERUGGIA_Z], pushK(f, 229, 0.0025), { fov: 42 });
const S3b = (f: number): Shot => dolly([601.6, D0 + 1.7, -602.6], [603.6, D0 + 1.5, MZ], pushK(f, 288, 0.0015), { fov: 46 });
// 4 · Peruggia de cerca; recuerdo: limpia el cristal del cuadro
const S4a = (f: number): Shot => dolly([599.0, D0 + 1.6, -599.3], [599.35, D0 + 1.7, PERUGGIA_Z], pushK(f, 321, 0.003, 0.007, 24), { fov: 38 });
const S4b = (f: number): Shot => dolly([600.55, D0 + 1.7, -600.1], [600.4, D0 + 1.6, MZ], pushK(f, 399, 0.0025), { fov: 42 });
// 5 · Béroud con el caballete; inserto de los cuatro ganchos
const S5a = (f: number): Shot => dolly([601.2, D0 + 1.65, -601.6], [600.3, D0 + 1.6, -597.8], pushK(f, 469, 0.002, 0.005, 24), { fov: 44 });
const S5b = (f: number): Shot => dolly([600, D0 + 1.75, -598.9], [600, D0 + 1.75, MZ], pushK(f, 541, 0.004, 0.009, 18), { fov: 40 });
// 6 · el muelle: el voceador con el periódico, la torre detrás
const S6a = (f: number): Shot => dolly([0.35, D0 + 1.0, -35.4], [0.0, D0 + 2.2, -30.6], pushK(f, 593, 0.0025), { fov: 54 });
// 7 · comisaría: Apollinaire tras las rejas, luego Picasso en la mesa
const S7a = (f: number): Shot => dolly([799.4, D0 + 1.6, -600.6], [799.2, D0 + 1.7, -596.9], pushK(f, 663, 0.003, 0.007, 22), { fov: 40 });
const S7b = (f: number): Shot => dolly([801.0, D0 + 1.45, -601.6], [800.9, D0 + 1.35, -598.6], pushK(f, 706, 0.003, 0.007, 22), { fov: 40 });
// 8 · la cola: vista lateral a lo largo de la fila, hacia la pared con los ganchos
const S8a = (f: number): Shot => dolly([593.2, D0 + 1.8, -601.8], [599.4, D0 + 1.55, -597.6], pushK(f, 754, 0.0018), { fov: 46 });
// 9 · la habitación: el baúl se abre
const S9a = (f: number): Shot => dolly([700.45, D0 + 1.9, -600.9], [700.55, D0 + 1.0, -597.3], pushK(f, 855, 0.0025, 0.005, 30), { fov: 48 });
// 10 · Florencia: Peruggia enseña el cuadro al marchante; lo atrapan
const S10a = (f: number): Shot => dolly([900.0, D0 + 1.65, -601.4], [900.0, D0 + 1.45, -597.6], pushK(f, 970, 0.0022), { fov: 44 });
const S10b = (f: number): Shot => dolly([899.4, D0 + 1.6, -601.0], [899.4, D0 + 1.55, -598.0], pushK(f, 1035, 0.004, 0.01, 14), { fov: 46 });
// 11 · antes: la sala tranquila, el cuadro en la pared
const S11a = (f: number): Shot => dolly([600.6, D0 + 1.8, -602.4], [600, D0 + 1.6, MZ], pushK(f, 1055, 0.0018), { fov: 44 });
// 12 · después: la multitud y los flashes; empuje hasta su sonrisa
const S12a = (f: number): Shot => dolly([600, D0 + 1.9, -603.6], [600, D0 + 1.75, MZ], pushK(f, 1113, 0.0045, 0.008, 30), { fov: 44 });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }],
  2: [{ f: 132, s: S2a }],
  3: [{ f: 229, s: S3a }, { f: 288, cut: true, s: S3b }],
  4: [{ f: 321, s: S4a }, { f: 399, cut: true, s: S4b }],
  5: [{ f: 469, s: S5a }, { f: 541, cut: true, s: S5b }],
  6: [{ f: 593, s: S6a }],
  7: [{ f: 663, s: S7a }, { f: 706, cut: true, s: S7b }],
  8: [{ f: 754, s: S8a }],
  9: [{ f: 855, s: S9a }],
  10: [{ f: 970, s: S10a }, { f: 1035, cut: true, s: S10b }],
  11: [{ f: 1055, s: S11a }],
  12: [{ f: 1113, s: S12a }],
};

/** sacudidas: los sellazos, las vigas que caen, los sobres */
const KICKS: [number, number][] = [[44, 0.5], [557, 0.5], [1038, 0.8]];
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
  { f: 0, cInf: 8 }, { f: 132, cInf: 4 }, { f: 229, cInf: 9 }, { f: 288, cInf: 4 }, { f: 321, cInf: 12 }, { f: 399, cInf: 9 },
  { f: 469, cInf: 6 }, { f: 541, cInf: 10 }, { f: 593, cInf: 5 }, { f: 663, cInf: 10 }, { f: 706, cInf: 10 }, { f: 754, cInf: 5 },
  { f: 855, cInf: 9 }, { f: 970, cInf: 7 }, { f: 1035, cInf: 11 }, { f: 1055, cInf: 5 }, { f: 1113, cInf: 7 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
