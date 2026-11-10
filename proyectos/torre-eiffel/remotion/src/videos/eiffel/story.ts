// «El hombre que vendió la Torre Eiffel» (París, 1925). Línea de tiempo del short: tomas atadas a los cuadros de cada
// palabra de la voz (../../../../voz/palabras.json), cámaras con la gramática de la skill (deslizamientos smootherstep,
// empujes lentos, cortes en saltos grandes, sacudidas que cambian de signo cada cuadro).
//
// Mundo: el Sena corre a lo largo de x (orillas en z = ±30, altura D0). Muelle norte: adoquines z -36.5..-30, fachadas
// en z = -36.5. La torre se levanta en la orilla sur, en el Campo de Marte (centro x = 0, z = 140, escala 0.5).
// Interiores lejos del pueblo, sin techo (el sol entra desde arriba): el salón del Hôtel de Crillon con el despacho
// (x ≈ 600, z ≈ -600) y la celda de Alcatraz (x ≈ 700, z ≈ -600).
//
// Cuadros clave de la voz (30 fps): 1925@5 vendió@52 Eiffel@70 suya@98 Se@114 Lustig@135 estafador@157 Un@177
// periódico@197 oxidada@227 fortuna@277 Y@295 idea@312 Se@326 funcionario@359 falsifica@393 oficiales@418 cita@433
// cinco@444 chatarreros@452 hotel@474 París@493 Les@510 secreto@526 desmontar@571 chatarra@609 Siete@627
// toneladas@641 hierro@656 Uno@671 André@694 Poisson@702 anzuelo@726 Pero@743 sospecha@759 Entonces@779 genial@814
// pide@831 soborno@841 Y@859 tranquilo@881 Si@900 sobornos@911 funcionario@946 verdad@963 Le@979 paga@983 torre@993
// Y@1008 soborno@1015 Lustig@1033 Viena@1050 maleta@1066 billetes@1084 Y@1104 Poisson@1107 vergüenza@1139
// denunció@1165 Así@1184 según@1202 volvió@1235 París@1245 venderla@1264 vez@1282 La@1296 torre@1300 sitio@1320
// Lustig@1335 Alcatraz@1360 fabricar@1383 billetes@1394 falsos@1405 (fin de la voz ~1426)
export const FPS = 30;
export const TOTAL = 1450;
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
/** centro de la torre (x, z) en el Campo de Marte y su escala (1 = 300 m reales) */
export const TOWER_C: [number, number] = [0, 140];
export const TOWER_S = 0.5;
/** Lustig junto al cartel de SE VENDE en el muelle norte */
export const LUSTIG_Q: V3 = [-0.6, D0, -30.9];
export const CARTEL: V3 = [1.05, D0, -30.65];
/** café del muelle: Lustig sentado leyendo el periódico */
export const CAFE: V3 = [-18, D0, -32.4];
/** salón del hotel: mesa larga a lo largo de x; los cinco chatarreros detrás (lado +z), Lustig de pie a la izquierda */
export const SALON: V3 = [600, D0, -600];
export const MESA = { x0: 597.9, x1: 602.1, z0: -600.65, z1: -599.35, y: 0.78 };
export const CHATARREROS_X = [598.35, 599.2, 600.05, 600.9, 601.75];
export const POISSON_I = 3;
export const LUSTIG_S: V3 = [597.35, D0, -599.85];
export const ESPOSA: V3 = [601.25, D0, -598.55];
/** despacho: escritorio en la esquina del salón */
export const ESCRITORIO = { x: 604.6, z: -596.9, y: 0.78 };
export const LUSTIG_D: V3 = [604.6, D0, -596.2];
/** celda de Alcatraz */
export const CELDA: V3 = [700, D0, -600];
export const LUSTIG_C: V3 = [700.15, D0, -598.1];
export const REJA_Z = -599.3;

// ---------------- tomas ----------------
export type Light = "day" | "golden";
export type Scene = "muelle" | "cafe" | "despacho" | "salon" | "grua" | "huida" | "vuelta" | "torre" | "celda";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene; sunAz?: number; sunEl?: number; fogFar?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 114, light: "day", scene: "muelle", fogFar: 900 },        // gancho: Lustig y el cartel de SE VENDE, la torre detrás
  { id: 2, a: 114, b: 177, light: "day", scene: "muelle", fogFar: 900 },      // se llamaba Victor Lustig, estafador
  { id: 3, a: 177, b: 295, light: "day", scene: "cafe", fogFar: 900 },        // lee el periódico
  { id: 4, a: 295, b: 326, light: "day", scene: "cafe", fogFar: 900 },        // y tiene una idea
  { id: 5, a: 326, b: 433, light: "day", scene: "despacho", sunEl: 72 },      // falsifica papeles oficiales
  { id: 6, a: 433, b: 510, light: "day", scene: "salon", sunEl: 72 },         // cinco chatarreros en un hotel de lujo
  { id: 7, a: 510, b: 571, light: "day", scene: "salon", sunEl: 72 },         // les cuenta un secreto de Estado
  { id: 8, a: 571, b: 671, light: "day", scene: "grua", fogFar: 900 },        // la torre se desmonta (lo que imaginan)
  { id: 9, a: 671, b: 743, light: "day", scene: "salon", sunEl: 72 },         // André Poisson muerde el anzuelo
  { id: 10, a: 743, b: 779, light: "day", scene: "salon", sunEl: 72 },        // su esposa sospecha
  { id: 11, a: 779, b: 859, light: "day", scene: "salon", sunEl: 72 },        // le pide un soborno
  { id: 12, a: 859, b: 979, light: "day", scene: "salon", sunEl: 72 },        // Poisson se queda tranquilo
  { id: 13, a: 979, b: 1033, light: "day", scene: "salon", sunEl: 72 },       // le paga la torre y el soborno
  { id: 14, a: 1033, b: 1104, light: "golden", scene: "huida", sunAz: 150, sunEl: 12 }, // huye a Viena
  { id: 15, a: 1104, b: 1184, light: "day", scene: "salon", sunEl: 72 },      // la vergüenza de Poisson
  { id: 16, a: 1184, b: 1296, light: "day", scene: "vuelta", fogFar: 900 },   // volvió a París para venderla otra vez
  { id: 17, a: 1296, b: 1335, light: "golden", scene: "torre", fogFar: 900 }, // la torre sigue en su sitio
  { id: 18, a: 1335, b: TOTAL, light: "day", scene: "celda", sunEl: 75 },     // terminó en Alcatraz
];
/** fundidos (cuadros) al cambiar de lugar o de luz */
export const XFADE: Record<number, number> = { 3: 8, 5: 8, 8: 6, 9: 6, 14: 8, 15: 8, 16: 8, 17: 8, 18: 8 };
/** sin fogonazo ni negros en este short */
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
  [8, 110, "1925"],
  [444, 506, "5 chatarreros"],
  [627, 668, "7.000 toneladas"],
];

// ---------------- la torre en la fantasía de la grúa ----------------
/** la parte de arriba (desde el 2.º piso) sube colgada de la grúa: [subida m, inclinación rad] en el cuadro f */
export const towerLift = (id: number, f: number): [number, number] => {
  if (SHOTS[id - 1].scene !== "grua") return [0, 0];
  const k = smooth((f - 588) / 70);
  return [34 * k, 0.1 * k * Math.sin(Math.min(1, (f - 588) / 70) * Math.PI * 0.5)];
};

// ---------------- el coche de la huida ----------------
export type CarPose = { x: number; z: number; yaw: number; v: number };
export const QUAY_Z = -33.4;
/** toma 14: un taxi por el muelle hacia -x, de x = 10 a -24 */
export const carAt = (id: number, f: number): CarPose | null => {
  if (SHOTS[id - 1].scene !== "huida") return null;
  const t = (f - 1033) / FPS, v = 5.2;
  return { x: 9 - v * t, z: QUAY_Z, yaw: -Math.PI / 2, v };
};
/** punto en el sistema del coche: dx a la derecha del conductor, dy arriba, dz hacia delante */
export const carPt = (c: CarPose, dx: number, dy: number, dz: number): V3 => {
  const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), rx = -fz, rz = fx;
  return [c.x + rx * dx + fx * dz, D0 + dy, c.z + rz * dx + fz * dz];
};
export const SEAT = { chofer: [0.42, 0, 0.35], acomp: [-0.42, 0, 0.35], archi: [0.42, 0, -0.95], sofia: [-0.42, 0, -0.95] } as const;

// ---------------- vuelta a París (toma 16): Lustig entra paseando hasta el cartel ----------------
export const vueltaX = (f: number) => lin([[1184, 4.2], [1262, -0.6]], f);

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

// 1 · gancho: cámara baja en el muelle; Lustig y el cartel abajo, la torre entera arriba; empuje lento
const S1a = (f: number): Shot => dolly([0.35, D0 + 0.5, -35.5], [0.3, D0 + 1.75, -30.5], pushK(f, 0, 0.0012), { fov: 60 });
// 2 · Victor Lustig: plano medio, la torre suave detrás
const S2a = (f: number): Shot => dolly([0.05, D0 + 1.45, -34.0], [-0.6, D0 + 1.85, -30.9], pushK(f, 114, 0.003, 0.006, 24), { fov: 38 });
// 3 · el café: Lustig lee; al decir «oxidada», inserto del periódico
const S3a = (f: number): Shot => dolly([-19.4, D0 + 1.35, -35.4], [-18.0, D0 + 1.45, -32.4], pushK(f, 177, 0.0025), { fov: 40 });
const S3b = (f: number): Shot => dolly([-18.1, D0 + 1.25, -33.9], [-18.0, D0 + 1.18, -32.75], pushK(f, 222, 0.002), { fov: 40 });
// 4 · la idea: primer plano con empuje rápido, bombilla encima
const S4a = (f: number): Shot => dolly([-18.5, D0 + 1.6, -34.9], [-18.0, D0 + 1.7, -32.4], pushK(f, 295, 0.004, 0.012, 14), { fov: 40 });
// 5 · despacho: los papeles y el sello sobre el escritorio
const S5a = (f: number): Shot => dolly([603.7, D0 + 1.75, -599.1], [604.6, D0 + 1.15, -596.6], pushK(f, 326, 0.0022), { fov: 40 });
const S5b = (f: number): Shot => dolly([604.6, D0 + 2.05, -598.55], [604.6, D0 + 1.05, -596.75], pushK(f, 390, 0.003), { fov: 48 });
// 6 · el salón: plano general de la mesa, los cinco chatarreros y Lustig de pie
const S6a = (f: number): Shot => dolly([598.9, D0 + 2.3, -605.4], [599.6, D0 + 1.25, -599.6], pushK(f, 433, 0.0015), { fov: 44 });
// 7 · el secreto: Lustig de cerca, los chatarreros escuchan detrás
const S7a = (f: number): Shot => dolly([598.3, D0 + 1.6, -603.2], [597.6, D0 + 1.75, -599.85], pushK(f, 510, 0.003, 0.007, 22), { fov: 40 });
// 8 · la grúa: vista ancha desde el muelle, mirando la torre entera
const S8a = (f: number): Shot => dolly([-12, D0 + 1.4, -35.4], TW(78), pushK(f, 571, 0.0008), { fov: 52 });
// 9 · Poisson: primer plano; el anzuelo baja delante de él
const PX = CHATARREROS_X[POISSON_I];
const S9a = (f: number): Shot => dolly([PX - 0.4, D0 + 1.45, -602.4], [PX, D0 + 1.42, -599.25], pushK(f, 671, 0.003, 0.007, 22), { fov: 36 });
// 10 · la esposa detrás de Poisson
const S10a = (f: number): Shot => dolly([PX + 0.25, D0 + 1.7, -602.7], [PX + 0.25, D0 + 1.7, -598.9], pushK(f, 743, 0.004, 0.008, 18), { fov: 38 });
// 11 · el soborno: Lustig se inclina hacia Poisson (plano a dos)
const S11a = (f: number): Shot => dolly([PX - 0.55, D0 + 1.6, -603.3], [PX - 0.55, D0 + 1.55, -599.4], pushK(f, 779, 0.0022), { fov: 42 });
// 12 · tranquilo: Poisson aliviado, empuje
const S12a = (f: number): Shot => dolly([PX - 0.15, D0 + 1.5, -602.5], [PX, D0 + 1.45, -599.25], pushK(f, 859, 0.0025, 0.005, 30), { fov: 38 });
// 13 · los dos sobres sobre la mesa (cámara alta)
const S13a = (f: number): Shot => dolly([PX - 0.5, D0 + 1.85, -602.1], [PX - 0.5, D0 + 1.0, -599.9], pushK(f, 979, 0.002), { fov: 46 });
// 14 · huida: el taxi pasa por el muelle a contraluz; la cámara lo sigue en paneo
const S14a = (f: number): Shot => dolly([-9.5, D0 + 2.3, -30.7], [2, D0 + 1.0, -31.8], pushK(f, 1033, 0.0015), { fov: 52 });
// 15 · la vergüenza: Poisson y su esposa
const S15a = (f: number): Shot => dolly([PX + 0.1, D0 + 1.6, -602.9], [PX + 0.15, D0 + 1.55, -599.1], pushK(f, 1104, 0.0025, 0.006, 26), { fov: 38 });
// 16 · vuelta: plano medio general en el muelle, Lustig entra paseando hasta el cartel
const S16a = (f: number): Shot => dolly([0.35, D0 + 0.75, -35.5], [0.3, D0 + 1.9, -30.6], pushK(f, 1184, 0.0015), { fov: 56 });
// 17 · la torre sigue en su sitio, al atardecer
const S17a = (f: number): Shot => dolly([-26, D0 + 1.0, -35.4], TW(70), pushK(f, 1296, 0.0015), { fov: 50, roll: 0.02 });
// 18 · celda: Lustig tras los barrotes; empuje lento
const S18a = (f: number): Shot => dolly([699.7, D0 + 1.6, -602.6], [700.15, D0 + 1.7, -598.1], pushK(f, 1335, 0.0022, 0.005, 30), { fov: 38 });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }],
  2: [{ f: 114, s: S2a }],
  3: [{ f: 177, s: S3a }, { f: 222, cut: true, s: S3b }],
  4: [{ f: 295, s: S4a }],
  5: [{ f: 326, s: S5a }, { f: 390, cut: true, s: S5b }],
  6: [{ f: 433, s: S6a }],
  7: [{ f: 510, s: S7a }],
  8: [{ f: 571, s: S8a }],
  9: [{ f: 671, s: S9a }],
  10: [{ f: 743, s: S10a }],
  11: [{ f: 779, s: S11a }],
  12: [{ f: 859, s: S12a }],
  13: [{ f: 979, s: S13a }],
  14: [{ f: 1033, s: S14a }],
  15: [{ f: 1104, s: S15a }],
  16: [{ f: 1184, s: S16a }],
  17: [{ f: 1296, s: S17a }],
  18: [{ f: 1335, s: S18a }],
};

/** sacudidas: los sellazos, las vigas que caen, los sobres */
const KICKS: [number, number][] = [[393, 0.6], [418, 0.6], [612, 0.5], [640, 0.5], [946, 0.4]];
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
  { f: 0, cInf: 3 },       // gancho: la torre se lee
  { f: 114, cInf: 9 },     // Lustig
  { f: 177, cInf: 8 },     // café
  { f: 222, cInf: 12 },    // periódico
  { f: 295, cInf: 12 },
  { f: 326, cInf: 10 },    // despacho
  { f: 433, cInf: 4 },     // salón general
  { f: 510, cInf: 10 },
  { f: 571, cInf: 0 },     // la grúa
  { f: 671, cInf: 12 },
  { f: 743, cInf: 8 },
  { f: 779, cInf: 8 },
  { f: 859, cInf: 12 },
  { f: 979, cInf: 6 },
  { f: 1033, cInf: 2 },
  { f: 1104, cInf: 9 },
  { f: 1184, cInf: 4 },
  { f: 1296, cInf: 0 },
  { f: 1335, cInf: 10, focus: () => [LUSTIG_C[0], D0 + 1.7, LUSTIG_C[2]] },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
