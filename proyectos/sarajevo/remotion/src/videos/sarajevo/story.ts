// «El chofer que se equivocó de calle» (Sarajevo, 28 de junio de 1914). Línea de tiempo del short:
// tomas atadas a los cuadros de cada palabra de la voz (../../../../voz/palabras.json), recorrido del coche, cámara
// lenta de la bomba, fichas de dominó, y la gramática de cámara de la skill (deslizamientos smootherstep, empujes lentos,
// cortes solo en saltos grandes, sacudidas que cambian de signo cada cuadro).
//
// Mundo: el río Miljacka corre a lo largo de x (orillas en z = ±30, altura D0). Muelle Appel (orilla norte):
// adoquines z -36.5..-30, fachadas en z = -36.5. Calle Francisco José: x -6..6, hacia -z desde el muelle.
// Puente Latino: x = 0, cruzando el río. Princip espera en la esquina (x ≈ 2.6, z ≈ -40).
//
// Cuadros clave de la voz (30 fps): calle@100 Sarajevo@114 1914@135 Francisco@202 descapotable@257 Entre@281
// seis@312 primero@349 segundo@381 lanza@395 bomba@408 rebota@425 explota@451 archiduque@485 furioso@504
// cambia@522 heridos@566 Pero@584 nadie@623 Gira@648 frena@689 parado@734 metros@749 chico@763 diecinueve@773
// Gavrilo@802 Dos@831 disparos@838 suerte@862 joven@902 muerte@928 desgracia@948 mes@983 guerra@1009 Fíjate@1023
// dominó@1081 Austria@1098 ataca@1108 Serbia@1118 Rusia@1134 Alemania@1168 Francia@1209 Bretaña@1233 semana@1275
// Europa@1296 guerra@1315 La@1329 error@1405 GPS@1414 Cuando@1436 GPS@1470 (fin de la voz 1485)
export const FPS = 30;
export const TOTAL = 1492;
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

// ---------------- tomas ----------------
export type Light = "day" | "golden";
/** quién sale en la toma: desfile (coche andando + multitud), parado (coche en el ayuntamiento), esquina (coche
 *  detenido junto a Princip), juicio, marcha (soldados 1914), domino */
export type Scene = "desfile" | "parado" | "giro" | "esquina" | "juicio" | "marcha" | "domino";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene; sunAz?: number; sunEl?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 114, light: "day", scene: "esquina" },        // gancho: el coche parado en la calle equivocada
  { id: 2, a: 114, b: 281, light: "day", scene: "desfile" },      // Sarajevo 1914, el archiduque desfila
  { id: 3, a: 281, b: 344, light: "day", scene: "desfile" },      // seis conspiradores entre la gente
  { id: 4, a: 344, b: 381, light: "day", scene: "desfile" },      // el primero no se atreve
  { id: 5, a: 381, b: 480, light: "day", scene: "desfile" },      // la bomba (cámara lenta)
  { id: 6, a: 480, b: 584, light: "day", scene: "parado" },       // furioso, cambia el plan
  { id: 7, a: 584, b: 648, light: "day", scene: "parado" },       // nadie avisa al chofer
  { id: 8, a: 648, b: 802, light: "day", scene: "giro" },         // gira mal, frena, se queda parado junto a Princip
  { id: 9, a: 802, b: 858, light: "day", scene: "esquina" },      // Gavrilo Princip. Dos disparos.
  { id: 10, a: 858, b: 944, light: "day", scene: "juicio" },      // demasiado joven para la pena de muerte
  { id: 11, a: 944, b: 1023, light: "golden", scene: "marcha" },  // un mes después empezó la guerra
  { id: 12, a: 1023, b: 1329, light: "golden", scene: "domino", sunAz: 150, sunEl: 16 }, // Fíjate: dominó (sol detrás de la cámara: banderas con su color)
  { id: 13, a: 1329, b: TOTAL, light: "day", scene: "esquina" },  // remate: error de GPS
];
/** fundidos (cuadros) al cambiar de lugar o de luz */
export const XFADE: Record<number, number> = { 6: 6, 10: 6, 11: 8, 12: 8, 13: 8 };
/** fogonazo blanco de 4 cuadros al salir del gancho */
export const FLASH_AT = 114;
/** cuadros en negro tras los disparos (sin mostrar violencia) */
export const BLACK: [number, number] = [842, 846];

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
  [135, 281, "28 de junio de 1914"],
  [312, 344, "6 conspiradores"],
  [773, 842, "19 años"],
  [983, 1023, "28 de julio de 1914"],
  [1275, 1329, "1 semana"],
];

// ---------------- reloj del mundo (cámara lenta de la bomba) ----------------
/** El reloj del mundo corre al 22 % entre los cuadros SLOW0 y SLOW1, con entrada y salida suaves (8 cuadros). La voz
 *  sigue a velocidad normal. W(f) = segundos de historia en el cuadro f. */
const SLOW0 = 408, SLOW1 = 448, SLOW_K = 0.22, EASE = 8;
const rate = (f: number) => {
  const inn = smooth((f - SLOW0) / EASE), out = smooth((f - (SLOW1 - EASE)) / EASE);
  return 1 - (1 - SLOW_K) * inn * (1 - out);
};
const WT: number[] = (() => { const w = [0]; for (let f = 1; f <= TOTAL + 60; f++) w.push(w[f - 1] + (rate(f - 1) + rate(f)) / 2 / FPS); return w; })();
export const worldT = (f: number) => { const i = Math.max(0, Math.min(WT.length - 2, Math.floor(f))), k = f - i; return WT[i] + (WT[i + 1] - WT[i]) * k; };

// ---------------- el coche del archiduque ----------------
/** pose del coche: posición del centro (en el suelo), rumbo (rad, 0 = mirando +z) y velocidad (m/s) */
export type CarPose = { x: number; z: number; yaw: number; v: number };
export const QUAY_Z = -33.4;
const YAW_W = -Math.PI / 2; // mirando -x
const YAW_N = Math.PI;      // mirando -z (calle Francisco José)
/** desfile: avanza hacia -x a 2.8 m/s; pasa por x = 50 justo cuando lanzan la bomba (cuadro 395) */
export const T_THROW = 395 / FPS;
export const paradeX = (w: number) => 50 - 2.8 * (w - T_THROW);
/** ayuntamiento (tomas 6-7): coche parado */
export const HALL_X = 30;
/** giro equivocado (toma 8): recta por el muelle desde x = 9.5, curva a la derecha de radio 4 (centro en x = 4,
 *  z = QUAY_Z - 4) hasta x = 0, recta hacia -z; 6 m/s hasta el frenazo (cuadro 690) y para en 1.8 s */
const R_TURN = 4, X_TURN = 4, S0 = 9.5 - X_TURN, ARC = (Math.PI / 2) * R_TURN, T_GO = 648 / FPS, T_BRAKE = 690 / FPS, BRAKE = 1.8, V0 = 6;
const sAt = (t: number) => {
  if (t < T_BRAKE) return V0 * (t - T_GO);
  const u = Math.min(BRAKE, t - T_BRAKE);
  return V0 * (T_BRAKE - T_GO) + V0 * u - (V0 / (2 * BRAKE)) * u * u;
};
export const S_STOP = sAt(T_BRAKE + BRAKE);
export const turnPose = (s: number, v: number): CarPose => {
  if (s < S0) return { x: X_TURN + (S0 - s), z: QUAY_Z, yaw: YAW_W, v };
  if (s < S0 + ARC) {
    const a = (s - S0) / R_TURN; // 0 .. PI/2
    return { x: X_TURN - R_TURN * Math.sin(a), z: QUAY_Z - R_TURN * (1 - Math.cos(a)), yaw: YAW_W - a, v };
  }
  return { x: 0, z: QUAY_Z - R_TURN - (s - S0 - ARC), yaw: YAW_N - 2 * Math.PI, v };
};
/** donde se queda parado, a ~1.7 m de Princip */
export const STOP = turnPose(S_STOP, 0);
export const PRINCIP_AT: V3 = [2.75, D0, STOP.z + 0.9];

/** el coche del archiduque en la toma `id` y el cuadro f */
export const carAt = (id: number, f: number): CarPose => {
  const s = SHOTS[id - 1];
  if (s.scene === "desfile") return { x: paradeX(worldT(f)), z: QUAY_Z, yaw: YAW_W, v: 2.8 };
  if (s.scene === "parado") return { x: HALL_X, z: QUAY_Z, yaw: YAW_W, v: 0 };
  if (s.scene === "giro") {
    const t = f / FPS, v = t < T_BRAKE ? V0 : Math.max(0, V0 * (1 - (t - T_BRAKE) / BRAKE));
    return turnPose(Math.max(0, sAt(t)), v);
  }
  return { ...STOP };
};
/** el coche de escolta, 7 m detrás (sólo en el desfile) */
export const escortAt = (id: number, f: number): CarPose | null => {
  if (SHOTS[id - 1].scene !== "desfile") return null;
  const c = carAt(id, f);
  return { ...c, x: c.x + 7.5 };
};

// ---------------- la bomba ----------------
/** Čabrinović en la primera fila del lado del río; la bomba sale de su mano, rebota en la capota plegada (trasera
 *  del coche) y cae detrás, entre los dos coches; explota en el cuadro 451 ("explota"). */
export const THROWER: V3 = [52.2, D0, -31.15];
export const T_HIT = worldT(425), T_BOOM = worldT(451);
export const bombAt = (w: number): V3 | null => {
  if (w < T_THROW + 0.12 || w >= T_BOOM) return null;
  const hand: V3 = [THROWER[0] - 0.25, D0 + 1.9, THROWER[2] - 0.3];
  const tHitX = paradeX(T_HIT) + 1.75; // capota plegada, a 1.75 m del centro hacia atrás (+x)
  const hit: V3 = [tHitX, D0 + 1.55, QUAY_Z + 0.1];
  if (w < T_HIT) {
    const u = (w - T_THROW - 0.12) / (T_HIT - T_THROW - 0.12);
    return [hand[0] + (hit[0] - hand[0]) * u, hand[1] + (hit[1] - hand[1]) * u + 1.6 * 4 * u * (1 - u), hand[2] + (hit[2] - hand[2]) * u];
  }
  const u = (w - T_HIT) / (T_BOOM - T_HIT), land: V3 = [hit[0] + 2.4, D0 + 0.15, QUAY_Z - 0.3];
  return [hit[0] + (land[0] - hit[0]) * u, hit[1] + (land[1] - hit[1]) * u + 0.7 * 4 * u * (1 - u), hit[2] + (land[2] - hit[2]) * u];
};
export const boomAt = (): V3 => { const p = paradeX(T_HIT) + 1.75 + 2.4; return [p, D0, QUAY_Z - 0.3]; };

// ---------------- fichas de dominó ----------------
/** seis fichas en el muelle, de oeste a este; cada una empieza a caer en su palabra y cae hacia +x */
/** las caras (con bandera) miran a la cámara (-z); cada ficha gira sobre su esquina inferior derecha (+x) y se
 *  apoya en el canto izquierdo de la siguiente */
export const DOMINO = { H: 3.0, W: 1.7, T: 0.35, GAP: 3.2, Z: -33.2, X0: -7.2 };
export const NACIONES = ["austria", "serbia", "rusia", "alemania", "francia", "britania"] as const;
export const DOMINO_F = [1104, 1118, 1136, 1170, 1209, 1240];
const LEAN = Math.asin((DOMINO.GAP - DOMINO.W) / DOMINO.H); // apoyada en la siguiente
/** ángulo de cada ficha (rad, 0 = de pie, PI/2 = tumbada) */
export const dominoAngles = (f: number) => {
  const n = DOMINO_F.length, out = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    const k = smooth((f - DOMINO_F[i]) / 9) ** 1.6; // empieza lento, acelera
    const rest = i === n - 1 ? Math.PI / 2 - 0.02 : Math.min(Math.PI / 2 - 0.02, LEAN + out[i + 1] * 0.92);
    // tambaleo leve cuando la anterior se le apoya y aún no le toca caer
    const prevHit = i > 0 && f >= DOMINO_F[i - 1] + 8 && f < DOMINO_F[i] ? 0.035 * Math.sin((f - DOMINO_F[i - 1]) * 0.9) * Math.exp(-(f - DOMINO_F[i - 1] - 8) / 10) : 0;
    out[i] = k * rest + prevHit;
  }
  return out;
};
export const dominoX = (i: number) => DOMINO.X0 + i * DOMINO.GAP;

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
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** punto en el sistema del coche: dx a la derecha del conductor, dy arriba, dz hacia delante */
export const carPt = (c: CarPose, dx: number, dy: number, dz: number): V3 => {
  const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), rx = -fz, rz = fx; // derecha = adelante x arriba
  return [c.x + rx * dx + fx * dz, D0 + dy, c.z + rz * dx + fz * dz];
};
/** asientos (sistema del coche): conductor delante a la derecha, archiduque detrás a la derecha, Sofía detrás a la izquierda */
export const SEAT = { chofer: [0.42, 0, 0.35], acomp: [-0.42, 0, 0.35], archi: [0.42, 0, -0.95], sofia: [-0.42, 0, -0.95] } as const;
const seat = (c: CarPose, k: keyof typeof SEAT, dy = 1.5): V3 => carPt(c, SEAT[k][0], dy, SEAT[k][2]);

const C = (id: number) => (f: number) => carAt(id, f);
// 1 · gancho: el coche detenido en la boca de la calle; cámara baja desde delante, empuje hacia el chofer
const S1a = (f: number): Shot => { const c = STOP, look = seat(c, "chofer", 1.55); return dolly(carPt(c, 3.6, 2.1, 2.4), look, pushK(f, 0, 0.0035), { fov: 40 }); };
// 2 · Sarajevo: grúa alta sobre el río mirando al muelle, el desfile entra; corte a plano medio de la pareja
const S2a = (f: number): Shot => { const c = C(2)(f); return dolly([c.x - 17, D0 + 15, -17], [c.x - 3, D0 + 0.5, QUAY_Z - 1], pushK(f, 114, 0.0018), { fov: 46 }); };
const S2b = (f: number): Shot => { const c = C(2)(f), look = carPt(c, 0.05, 1.55, -0.95); return dolly(carPt(c, 1.9, 2.55, 2.3), look, pushK(f, 202, 0.0025), { fov: 38 }); };
const S2c = (f: number): Shot => { const c = C(2)(f), look = carPt(c, 0, 1.0, -0.4); return dolly(carPt(c, 2.2, 3.4, 5.4), look, pushK(f, 249, 0.002), { fov: 42, roll: -0.03 }); };
// 3 · seis conspiradores: deslizamiento a la altura de los ojos por la primera fila (lado del río), desde la calle
const S3a = (f: number): Shot => { const x = 57 - (f - 281) * 0.12; return { pos: [x + 2.5, D0 + 5.2, -24.5], look: [x - 5, D0 + 1.2, -32.0], fov: 36 }; };
// 4 · el primero no se atreve: primer plano del conspirador 1 (x = 56), el coche pasa por delante
const S4a = (f: number): Shot => dolly([56.6, D0 + 1.7, -34.6], [56.0, D0 + 1.62, -31.2], pushK(f, 344, 0.003, 0.006, 20), { fov: 36 });
// 5 · la bomba: plano general desde las fachadas, el coche entra, la bomba vuela hacia nosotros; cámara lenta
const S5a = (f: number): Shot => dolly([47.0, D0 + 2.6, -35.6], [52.0, D0 + 1.4, -31.6], pushK(f, 381, 0.0018), { fov: 50 });
const S5b = (f: number): Shot => { const b = bombAt(worldT(f)) ?? boomAt(); return dolly([b[0] - 2.6, D0 + 1.35, -35.6], [b[0] + 0.3, Math.max(D0 + 0.8, b[1] - 0.2), b[2]], pushK(f, 418, 0.002), { fov: 42, roll: 0.035 }); };
const S5c = (f: number): Shot => { const p = boomAt(); return dolly([p[0] - 6.5, D0 + 2.8, -35.6], [p[0] - 2.0, D0 + 1.2, QUAY_Z + 0.5], pushK(f, 451, 0.0015), { fov: 50, roll: -0.02 }); };
// 6 · furioso: primer plano del archiduque en el coche parado, luego se abre a Potiorek señalando
const S6a = (f: number): Shot => { const c = C(6)(f), look = seat(c, "archi", 1.55); return dolly(carPt(c, 2.2, 1.65, 0.9), look, pushK(f, 480, 0.003, 0.007, 24), { fov: 36 }); };
const S6b = (f: number): Shot => { const c = C(6)(f), look = carPt(c, 0, 1.5, -0.35); return dolly(carPt(c, 2.2, 2.7, 3.0), look, pushK(f, 522, 0.002), { fov: 44, roll: 0.03 }); };
// 7 · nadie avisa al chofer: el chofer en primer término (silba), detrás hablan los generales
const S7a = (f: number): Shot => { const c = C(7)(f), look = seat(c, "chofer", 1.45); return dolly(carPt(c, 1.9, 1.5, 2.2), look, pushK(f, 584, 0.0025, 0.006, 30), { fov: 38 }); };
// 8 · gira mal: vista alta de la esquina; el coche entra en la calle; frenazo (sacudida); bajamos detrás de Princip
const S8a = (f: number): Shot => dolly([14, D0 + 9, -26], [2, D0 + 0.5, -37.5], pushK(f, 648, 0.0018), { fov: 44 });
const S8b = (f: number): Shot => { const p = PRINCIP_AT; return dolly([p[0] + 2.15, D0 + 1.8, p[2] + 1.1], [STOP.x + 0.2, D0 + 1.35, STOP.z + 0.3], pushK(f, 722, 0.0025, 0.006, 30), { fov: 42, roll: -0.03 }); };
// 9 · Gavrilo Princip: su cara de frente; dos fogonazos; palomas; negro
const S9a = (f: number): Shot => { const p = PRINCIP_AT; return dolly([p[0] - 1.9, D0 + 1.7, p[2] - 0.4], [p[0], D0 + 1.68, p[2]], pushK(f, 802, 0.003, 0.007, 26), { fov: 34 }); };
const S9b = (f: number): Shot => dolly([-2.0, D0 + 1.0, -46], [2.0, D0 + 5.0, -39], pushK(f, 846, 0.002), { fov: 50 });
// 10 · juicio: Princip entre dos gendarmes frente a una fachada, empuje lento
const S10a = (f: number): Shot => dolly([-14.5, D0 + 1.6, -29.4], [-14.5, D0 + 1.3, -35.3], pushK(f, 858, 0.0025, 0.005, 30), { fov: 40 });
// 11 · un mes después: soldados de 1914 marchando por el muelle a contraluz dorado
const S11a = (f: number): Shot => dolly([-8, D0 + 0.9, -31.0], [6, D0 + 1.5, -34.0], pushK(f, 944, 0.002), { fov: 42, roll: 0.03 });
// 12 · dominó: plano medio de la primera ficha, travelling a lo largo de la fila; al final, alto sobre las fichas caídas
const domFollow = (f: number) => {
  // la cámara sigue a la ficha que cae ahora
  const i = DOMINO_F.reduce((a, df, k) => (f >= df - 6 ? k : a), 0);
  const nx = i + 1 < DOMINO_F.length ? dominoX(i + 1) : dominoX(i) + 1;
  const u = i + 1 < DOMINO_F.length ? clamp01((f - DOMINO_F[i] + 6) / Math.max(10, DOMINO_F[i + 1] - DOMINO_F[i])) : 1;
  return dominoX(i) + (nx - dominoX(i)) * glide(u) - DOMINO.W / 2 + 0.6;
};
const S12a = (f: number): Shot => { const x = dominoX(0) - DOMINO.W / 2; return dolly([x + 0.6, D0 + 1.9, -27.0], [x + 0.2, D0 + 1.75, DOMINO.Z], pushK(f, 1023, 0.002), { fov: 40 }); };
const S12b = (f: number): Shot => { const x = domFollow(f); return { pos: [x + 0.6, D0 + 2.0, -26.6], look: [x + 0.2, D0 + 1.5, DOMINO.Z], fov: 44, roll: 0.02 }; };
const S12c = (f: number): Shot => dolly([2.0, D0 + 12, -26.5], [2.0, D0 + 0.4, DOMINO.Z - 0.5], pushK(f, 1267, 0.0018), { fov: 54 });
// 13 · remate: vuelta a la esquina, el chofer con el mapa al revés; empuje lento hasta la última palabra
const S13a = (f: number): Shot => { const c = STOP, look = seat(c, "chofer", 1.45); return dolly(carPt(c, 2.6, 1.85, 1.2), look, pushK(f, 1329, 0.0022, 0.005, 30), { fov: 38 }); };

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }],
  2: [{ f: 114, s: S2a }, { f: 202, cut: true, s: S2b }, { f: 249, dur: 30, s: S2c }],
  3: [{ f: 281, s: S3a }],
  4: [{ f: 344, s: S4a }],
  5: [{ f: 381, s: S5a }, { f: 418, cut: true, s: S5b }, { f: 451, cut: true, s: S5c }],
  6: [{ f: 480, s: S6a }, { f: 522, dur: 28, s: S6b }],
  7: [{ f: 584, s: S7a }],
  8: [{ f: 648, s: S8a }, { f: 722, cut: true, s: S8b }],
  9: [{ f: 802, s: S9a }, { f: 846, cut: true, s: S9b }],
  10: [{ f: 858, s: S10a }],
  11: [{ f: 944, s: S11a }],
  12: [{ f: 1023, s: S12a }, { f: 1090, dur: 26, s: S12b }, { f: 1267, cut: true, s: S12c }],
  13: [{ f: 1329, s: S13a }],
};

/** sacudidas: explosión, frenazo, disparos, cada ficha que cae */
const KICKS: [number, number][] = [[451, 1.4], [690, 0.6], [831, 0.8], [838, 0.8], ...DOMINO_F.map((df) => [df + 9, 0.5] as [number, number])];
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
  { f: 0, cInf: 12 },                    // gancho: el chofer nítido, la calle suave
  { f: 114, cInf: 0 },                   // vista general
  { f: 202, cInf: 13 },                  // la pareja
  { f: 249, dur: 30, cInf: 6 },
  { f: 281, cInf: 8 },                   // la fila de gente
  { f: 344, cInf: 15 },                  // primer plano del conspirador
  { f: 381, cInf: 0 },                   // la bomba: todo legible
  { f: 480, cInf: 14 },                  // archiduque
  { f: 522, dur: 28, cInf: 8 },
  { f: 584, cInf: 14 },                  // chofer
  { f: 648, cInf: 0 },                   // vista alta de la esquina
  { f: 722, cInf: 12, focus: () => [STOP.x + 0.3, D0 + 1.35, STOP.z - 0.6] }, // el coche nítido, Princip de espaldas borroso
  { f: 802, cInf: 15 },                  // Princip
  { f: 846, cInf: 0 },
  { f: 858, cInf: 9 },
  { f: 944, cInf: 6 },
  { f: 1023, cInf: 10 },
  { f: 1267, cInf: 0 },
  { f: 1329, cInf: 12 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
