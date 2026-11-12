// «La guerra de los 38 minutos» (Zanzíbar, 27 de agosto de 1896). Tomas atadas a los cuadros de la voz (../../../../voz/palabras.json).
// La costa de Zanzíbar: el mar (z > -200) frente al palacio y la Casa de las Maravillas con su torre del reloj (z < -200).
// Desde el mar se mira hacia -z (+x a la DERECHA del cuadro); desde la costa hacia +z (+x a la IZQUIERDA). El salón del
// trono (600) y el plató azul (900) miran hacia +z (+x a la IZQUIERDA).
//
// Cuadros clave: 27 de agosto@5 1896@32 empezó@67 guerra@78 más@85 corta@92 historia@105 En@122 Zanzíbar@126 murió@139
// sultán@147 y@163 primo@168 Khalid@175 encerró@186 palacio@200 y@212 declaró@217 nuevo@229 sultán@235 sin@252
// pedirle@257 permiso@268 británicos@284 Gran@307 Bretaña@313 dio@327 ultimátum@335 Tiene@354 hasta@360 nueve@370
// mañana@381 irse@397 Khalid@411 juntó@419 casi@428 tres@436 mil@442 hombres@446 unos@460 cañones@465 viejísimos@476
// y@493 un@495 solo@499 barco@506 A@521 nueve@529 y@535 dos@536 minutos@542 cinco@558 buques@566 británicos@574
// abrieron@589 fuego@599 El@614 barco@619 sultán@629 hundió@641 el@655 palacio@659 prendió@672 fuego@680 y@695
// Khalid@697 escapó@708 corriendo@718 consulado@730 alemán@743 Treinta@759 ocho@770 minutos@775 después@784
// guerra@804 terminado@819 Y@839 mejor@845 Después@862 británicos@883 mandaron@902 cuenta@913 cañonazos@936 (fin@961)
export const FPS = 30;
export const TOTAL = 1000;
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
/** la costa: el agua llega a z = -200 (muro del muelle); paseo de piedra de -200 a -206 */
export const PX = -80;
export const CALLE: V3 = [PX, D0, -212];
export const RZ = -8.6;
export const CUARTO_X = 600, OFICINA_X = 700, PLATO_X = 900;
export const MESA_Z = BACK_Z - 1.0;
export const RIO_Z0 = -200, RIO_Z1 = 900;
/** el palacio (centro x, frente z, ancho, fondo, alto) y la Casa de las Maravillas con la torre del reloj */
export const PAL = { x: PX - 10, z: -207.5, w: 14, d: 9, h: 9.6 };
export const MAR = { x: PX + 8, z: -208.5, w: 13, d: 13, h: 10.5, v: 1.6 };
/** la torre del reloj: centro de la esfera (mira a +z) */
export const RELOJ: V3 = [MAR.x, D0 + MAR.h + 3.4, MAR.z - 0.9];
/** el mástil de la bandera roja del sultán, sobre la terraza del palacio */
export const MASTIL: V3 = [PAL.x + 3.5, D0 + PAL.h, PAL.z - 2.5];
/** el consulado alemán, a la izquierda del palacio mirando desde el mar */
export const CONS = { x: PX - 33, z: -207, w: 9, h: 7 };
/** el paseo: z del camino por donde corre Khalid */
export const PASEO_Z = -203.2;
/** (heredado) */
export const TZ = -212;
/** el salón del trono: trono contra la pared del fondo */
export const TRONO_Z = BACK_Z - 0.75;

// ---------------- tomas ----------------
export type Light = "day" | "golden" | "night";
export type Scene = "plato" | "cuarto" | "oficina" | "calle";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene; sunAz?: number; sunEl?: number; fogFar?: number };
const IN = { sunAz: 140, sunEl: 40 };
const MA = { sunAz: -130, sunEl: 34 };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 122, light: "day", scene: "calle", ...IN },     // la costa de Zanzíbar: la guerra más corta
  { id: 2, a: 122, b: 163, light: "day", scene: "calle", ...IN },   // murió el sultán: la bandera a media asta
  { id: 3, a: 163, b: 252, light: "day", scene: "cuarto", ...IN },  // Khalid entra y se sienta en el trono
  { id: 4, a: 252, b: 307, light: "day", scene: "plato", ...IN },   // sin permiso de los británicos
  { id: 5, a: 307, b: 354, light: "day", scene: "plato", ...IN },   // el ultimátum
  { id: 6, a: 354, b: 411, light: "day", scene: "calle", ...MA },   // la torre del reloj: hasta las nueve
  { id: 7, a: 411, b: 460, light: "day", scene: "calle", ...MA },   // casi tres mil hombres
  { id: 8, a: 460, b: 493, light: "day", scene: "calle", ...MA },   // cañones viejísimos
  { id: 9, a: 493, b: 521, light: "day", scene: "calle", ...MA },   // un solo barco: el Glasgow
  { id: 10, a: 521, b: 558, light: "day", scene: "calle", ...MA },  // las nueve y dos
  { id: 11, a: 558, b: 614, light: "day", scene: "calle", ...MA },  // cinco buques abren fuego
  { id: 12, a: 614, b: 655, light: "day", scene: "calle", ...MA },  // el Glasgow se hunde
  { id: 13, a: 655, b: 695, light: "day", scene: "calle", ...MA },  // el palacio se prende fuego
  { id: 14, a: 695, b: 759, light: "day", scene: "calle", ...MA },  // Khalid corre al consulado alemán
  { id: 15, a: 759, b: 839, light: "day", scene: "plato", ...IN },  // 38 minutos: fin
  { id: 16, a: 839, b: TOTAL, light: "day", scene: "calle", ...MA }, // la cuenta por los cañonazos
];
export const XFADE: Record<number, number> = { 2: 8, 3: 8, 4: 8, 5: 6, 6: 8, 7: 6, 8: 6, 9: 6, 10: 6, 11: 6, 12: 4, 13: 4, 14: 6, 15: 8, 16: 8 };
export const FLASH_AT = 589;
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
  [8, 80, "Zanzíbar · 1896"],
  [358, 408, "27 de agosto"],
  [500, 519, "HHS Glasgow"],
  [536, 556, "9:02"],
  [730, 756, "Consulado alemán"],
];

/** la hora del reloj de la torre (minutos desde las 0:00) en cada cuadro */
export const horaAt = (f: number) => {
  if (f < 521) return 8 * 60 + 20 + 38 * smooth((f - 354) / 50) + (f > 404 ? 1.5 * (f - 404) / 7 : 0);
  return 9 * 60 + (f < 535 ? 0 : f < 539 ? 2 * smooth((f - 535) / 4) : 2);
};

/** utilería 3D (figura3d.ts); yaw: 0 = la proa mira a +z */
export type Decoy = { kind: "crucero" | "canonero" | "glasgow" | "dhow" | "canon" | "bandera" | "reloj" | "bala" | "mastil"; x: number; z: number; yaw: number; y?: number; shake?: number; s?: number; open?: number; moving?: boolean; rx?: number; rz?: number; t?: number };
const hund = (f: number, f0: number, n: number) => smooth((f - f0) / n);
export const bob = (f: number, k = 0) => Math.sin(f * 0.07 + k) * 0.05;
/** el yate del sultán, fondeado de costado frente al palacio */
export const GLASGOW: [number, number] = [PAL.x + 4, -168];
/** la flota británica: cinco buques de costado, mirando la costa [x, z, tipo, escala] */
export const FLOTA: [number, number, "crucero" | "canonero", number][] = [
  [PX - 40, -121, "crucero", 0.9], [PX - 18, -124, "canonero", 1], [PX + 4, -118, "crucero", 1.1], [PX + 26, -123, "canonero", 1], [PX + 46, -119, "crucero", 0.95],
];
/** dhows anclados cerca de la costa */
const DHOWS: [number, number, number][] = [[PX - 26, -186, 0.4], [PX + 22, -182, -0.5], [PX - 48, -180, 1.2], [PX + 40, -190, 2.0], [PX + 14, -192, -1.1]];
/** cañones de Khalid en la playa, delante del palacio */
export const CANONES: [number, number][] = [[PAL.x - 4.5, -202.6], [PAL.x + 1.5, -202.5], [PAL.x + 6.5, -202.7]];
const SIDE = Math.PI / 2;
export const decoysAt = (id: number, f: number): Decoy[] => {
  const out: Decoy[] = [];
  if (id === 3 || id === 4 || id === 5 || id === 15) return out;
  // la bandera del sultán: a media asta desde la muerte del sultán; el mástil cae con el bombardeo
  const caido = id === 13 ? smooth((f - 680) / 10) : id >= 14 ? 1 : 0;
  const media = id === 1 ? 0 : id === 2 ? smooth((f - 139) / 16) * 0.45 : 0.45;
  if (!(id === 13 && f >= 690) && id < 14) out.push({ kind: "mastil", x: MASTIL[0], z: MASTIL[2], y: PAL.h, yaw: 0.3, open: id >= 3 ? 0 : media, t: f, rz: -1.45 * caido ** 1.6 });
  // la bandera imperial alemana del consulado
  out.push({ kind: "bandera", x: CONS.x + 3.2, z: CONS.z - 1.0, y: CONS.h, yaw: 0.25, t: f });
  // el reloj de la torre
  out.push({ kind: "reloj", x: RELOJ[0], z: RELOJ[2] + 1.06, y: RELOJ[1] - D0, yaw: 0, open: horaAt(f), shake: id === 10 && f >= 536 && f < 546 ? 1 : 0 });
  // dhows
  for (const [x, z, yw] of DHOWS) out.push({ kind: "dhow", x, z, yaw: yw, y: bob(f, x), rz: Math.sin(f * 0.06 + x) * 0.03 });
  // el Glasgow
  const gu = id === 12 ? hund(f, 628, 26) : id >= 13 ? 1 : 0;
  out.push({ kind: "glasgow", x: GLASGOW[0], z: GLASGOW[1], yaw: SIDE, y: -3.1 * gu + bob(f, 1) * (1 - gu), rz: 0.22 * gu, rx: -0.05 * gu, shake: id === 12 && f >= 616 && f < 634 ? 1 : 0, t: f });
  // la flota (fuera de la toma 9, que es el Glasgow solo)
  if (id !== 9) for (const [x, z, k, s] of FLOTA) out.push({ kind: k, x, z, yaw: -SIDE, s, y: bob(f, z), rz: id === 11 && f >= 589 ? Math.sin((f - 589) * 0.3) * 0.02 * Math.exp(-(f - 589) / 20) : 0, t: f });
  // cañones de la playa
  for (const [i, [x, z]] of CANONES.entries()) out.push({ kind: "canon", x, z, yaw: 0.15 * (i - 1), shake: id === 8 && i === 1 && f >= 476 && f < 484 ? 1 : 0 });
  // la bala que sale rodando del cañón viejo
  if (id === 8 && f >= 478) { const u = clamp01((f - 478) / 14); out.push({ kind: "bala", x: CANONES[1][0] + 0.03, z: CANONES[1][1] + 0.85 + 0.55 * u, yaw: 0, y: 0.62 * (1 - u) ** 2 + 0.11 }); }
  return out;
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

const plato = (f: number, f0: number, d = 6.2, rate = 0.0018, y = 1.8) =>
  dolly([PLATO_X, D0 + y, BACK_Z - d], [PLATO_X, D0 + y, BACK_Z - 0.6], pushK(f, f0, rate), { fov: 44 });
const field = (f: number, f0: number, pos: V3, look: V3, fov = 46, rate = 0.0015, punch = 0) =>
  dolly(pos, look, pushK(f, f0, rate, punch, 22), { fov });
const PALC: V3 = [PAL.x + 7, D0 + 7.5, PAL.z - 3];
const CAMS: Record<number, Key[]> = {
  // gran plano desde el mar: el yate en primer plano, el palacio y la torre detrás; sube despacio
  1: [{ f: 0, s: (f) => { const u = glide(f / 122); return { pos: [PX + 6 - 4 * u, D0 + 4.0 + 2.5 * u, -132 - 8 * u], look: [PX - 2, D0 + 6.0 + 0.5 * u, -207], fov: 44 }; } }],
  // la bandera roja sobre la terraza del palacio, desde abajo
  2: [{ f: 122, s: (f) => field(f, 122, [MASTIL[0] - 1.5, D0 + 6.5, -190], [MASTIL[0] - 0.3, D0 + PAL.h + 3.0, MASTIL[2]], 40, 0.0025) }],
  // el salón del trono
  3: [{ f: 163, s: (f) => dolly([CUARTO_X - 0.4, D0 + 1.7, BACK_Z - 6.4], [CUARTO_X - 0.1, D0 + 1.25, BACK_Z - 0.8], pushK(f, 163, 0.0022), { fov: 44 }) },
      { f: 212, dur: 30, s: (f) => dolly([CUARTO_X, D0 + 1.75, BACK_Z - 6.3], [CUARTO_X, D0 + 1.55, BACK_Z - 0.8], pushK(f, 212, 0.002, 0.005), { fov: 44 }) }],
  4: [{ f: 252, s: (f) => plato(f, 252, 7.6, 0.002, 1.55) }],
  5: [{ f: 307, s: (f) => plato(f, 307, 6.0, 0.003, 1.4) }],
  // la torre del reloj de cerca
  6: [{ f: 354, s: (f) => field(f, 354, [RELOJ[0] + 1.2, RELOJ[1] - 1.6, RELOJ[2] + 13], [RELOJ[0], RELOJ[1] - 0.6, RELOJ[2]], 40, 0.004) }],
  // el ejército de Khalid en la playa, frente al palacio
  7: [{ f: 411, s: (f) => field(f, 411, [PAL.x + 0.6, D0 + 2.2, -191.5], [PAL.x + 0.2, D0 + 1.6, -203.8], 44, 0.003) }],
  // el cañón viejo
  8: [{ f: 460, s: (f) => field(f, 460, [CANONES[1][0] + 1.9, D0 + 1.15, CANONES[1][1] + 4.4], [CANONES[1][0] - 0.35, D0 + 0.8, CANONES[1][1] + 0.2], 40, 0.003, 0.007) }],
  // el yate solo
  9: [{ f: 493, s: (f) => field(f, 493, [GLASGOW[0] + 22, D0 + 4.5, GLASGOW[1] + 30], [GLASGOW[0] - 1, D0 + 4.0, GLASGOW[1]], 40, 0.002) }],
  10: [{ f: 521, s: (f) => field(f, 521, [RELOJ[0] - 0.8, RELOJ[1] - 1.0, RELOJ[2] + 9], [RELOJ[0], RELOJ[1] - 0.2, RELOJ[2]], 40, 0.003, 0.01) }],
  // la flota desde la costa (+x a la izquierda): la línea de buques de costado
  11: [{ f: 558, s: (f) => field(f, 558, [PX + 62, D0 + 3.4, -150], [PX - 6, D0 + 2.6, -118], 36, 0.0018, 0.0) }],
  // el Glasgow se hunde, visto desde el mar
  12: [{ f: 614, s: (f) => field(f, 614, [GLASGOW[0] - 18, D0 + 4.5, GLASGOW[1] + 26], [GLASGOW[0] + 1, D0 + 2.5, GLASGOW[1]], 40, 0.0015) }],
  // el palacio en llamas
  13: [{ f: 655, s: (f) => field(f, 655, [PAL.x + 5, D0 + 4.5, -172], [PAL.x + 3, D0 + 6.5, PAL.z], 44, 0.002) }],
  // Khalid corre por el paseo hacia el consulado (la cámara lo sigue)
  14: [{ f: 695, s: (f) => { const x = runX(f); return { pos: [x + 0.9, D0 + 1.55, PASEO_Z + 6.2], look: [x - 0.7, D0 + 1.25, PASEO_Z - 1.0], fov: 46 }; } }],
  15: [{ f: 759, s: (f) => plato(f, 759, 7.2, 0.0018, 1.75) }],
  // la cuenta, frente al palacio humeante
  16: [{ f: 839, s: (f) => field(f, 839, [PAL.x - 0.5, D0 + 1.75, -194.4], [PAL.x - 0.5, D0 + 1.4, -202.0], 44, 0.0022) }],
};
/** x de Khalid corriendo hacia el consulado en la toma 14 */
export const runX = (f: number) => PAL.x - 1 - 0.27 * Math.max(0, f - 699) - 0.4 * smooth((f - 695) / 6);

const KICKS: [number, number][] = [[139, 0.2], [217, 0.35], [268, 0.4], [335, 0.4], [536, 0.6], [589, 1.0], [599, 0.8], [616, 0.9], [641, 0.7], [662, 0.8], [672, 0.8], [680, 0.9], [819, 0.4], [936, 0.6]];
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
  { f: 0, cInf: 2 }, { f: 122, cInf: 3 }, { f: 163, cInf: 6 }, { f: 252, cInf: 5 }, { f: 307, cInf: 6 }, { f: 354, cInf: 3 }, { f: 411, cInf: 5 },
  { f: 460, cInf: 8 }, { f: 493, cInf: 3 }, { f: 521, cInf: 3 }, { f: 558, cInf: 2 }, { f: 614, cInf: 2 }, { f: 655, cInf: 2 }, { f: 695, cInf: 5 },
  { f: 759, cInf: 6 }, { f: 839, cInf: 6 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
