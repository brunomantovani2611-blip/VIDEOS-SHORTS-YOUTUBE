// «El ejército de tanques inflables» (el Ejército Fantasma, 1944-1945). Línea de tiempo del short: tomas atadas a los
// cuadros de cada palabra de la voz (../../../../voz/palabras.json), cámaras con la gramática de la skill.
//
// Decorados repartidos por un mismo mundo de campo francés: el tanque de la presentación (x ≈ 0), la tropa (x ≈ 20),
// el tanque que se infla (x ≈ 30), los señuelos (x ≈ 50), el parque de tanques visto desde el aire (x ≈ -20), el camión
// de altavoces de noche (x ≈ 100), la carretera de los ciclistas (x ≈ 150), el pueblo (x ≈ -80) y el Rin (z ≈ 300-345,
// orilla alemana enfrente). Interiores abiertos lejos de todo, pared del fondo en z = -596 (se miran hacia +z): la radio
// (x ≈ 600), el archivo secreto (x ≈ 700), la ceremonia (x ≈ 800) y el plató del mapa (x ≈ 900).
//
// Cuadros clave de la voz (30 fps): Segunda@8 Estados@39 ejército@69 secreto@80 disparaba@104 tiro@125 llamaban@142
// Fantasma@167 mil@192 hombres@202 artistas@235 diseñadores@253 técnicos@272 sonido@286 arma@309 Tanques@324
// inflables@333 Hinchaban@354 goma@377 camiones@390 cañones@404 aire@444 parecía@450 división@467 noche@497
// altavoces@512 ruido@548 motores@566 soldados@579 radio@603 mensajes@620 pueblos@657 unidades@695 día@720 Francia@736
// hombres@756 bicicleta@766 imposible@788 cuatro@806 levantando@825 tanque@842 toneladas@861 soldado@887 explicó@902
// americanos@930 fuertes@957 1945@980 Rin@1037 engañaron@1049 alemanes@1067 cruzar@1113 verdad@1138 historia@1159
// secreta@1172 cincuenta@1191 años@1204 2024@1227 recibieron@1255 Medalla@1270 Oro@1282 Congreso@1291 (fin ~1305)
export const FPS = 30;
export const TOTAL = 1325;
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
export const HERO: V3 = [0, D0, -7];
export const TROPA_X = 20;
export const INFLA: V3 = [30, D0, -6];
export const SENUELOS_X = 50;
export const PARQUE: V3 = [-20, D0, -36];
export const ALTAVOZ: V3 = [100, D0, -7];
export const CARRETERA: V3 = [150, D0, -17];
export const LEVANTA: V3 = [148.6, D0, -25];
export const PUEBLO: V3 = [-80, D0, -10];
export const RIO_Z0 = 300, RIO_Z1 = 345;
export const RADIO_X = 600, ARCHIVO_X = 700, CEREMONIA_X = 800, MAPA_X = 900;

// ---------------- tomas ----------------
export type Light = "day" | "golden" | "night";
export type Scene = "hero" | "tropa" | "expertos" | "infla" | "senuelos" | "aire" | "noche" | "radio" | "pueblo"
  | "bicis" | "levanta" | "fuertes" | "rin" | "aleman" | "mapa" | "secreto" | "medalla";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene; sunAz?: number; sunEl?: number; fogFar?: number };
const IN = { sunAz: 160, sunEl: 50 };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 139, light: "day", scene: "hero", sunAz: 120, sunEl: 45 },          // un ejército que no disparaba
  { id: 2, a: 139, b: 230, light: "day", scene: "tropa", sunAz: 120, sunEl: 45 },        // el Ejército Fantasma: 1.100 hombres
  { id: 3, a: 230, b: 302, light: "day", scene: "expertos", sunAz: 120, sunEl: 45 },     // artistas, diseñadores, sonido
  { id: 4, a: 302, b: 354, light: "day", scene: "infla", sunAz: 120, sunEl: 45 },        // su arma: tanques inflables
  { id: 5, a: 354, b: 430, light: "day", scene: "senuelos", sunAz: 110, sunEl: 40 },     // tanques, camiones y cañones falsos
  { id: 6, a: 430, b: 494, light: "day", scene: "aire", sunAz: 120, sunEl: 55, fogFar: 600 }, // desde el aire: una división
  { id: 7, a: 494, b: 599, light: "night", scene: "noche", sunAz: 130, sunEl: 40 },      // altavoces de noche
  { id: 8, a: 599, b: 649, light: "day", scene: "radio", ...IN },                        // mensajes falsos por radio
  { id: 9, a: 649, b: 715, light: "day", scene: "pueblo", sunAz: 120, sunEl: 45 },       // se hacen pasar por otras unidades
  { id: 10, a: 715, b: 806, light: "day", scene: "bicis", sunAz: 110, sunEl: 40 },       // dos franceses en bicicleta
  { id: 11, a: 806, b: 884, light: "day", scene: "levanta", sunAz: 110, sunEl: 40 },     // cuatro soldados levantan un tanque
  { id: 12, a: 884, b: 976, light: "day", scene: "fuertes", sunAz: 110, sunEl: 40 },     // «somos muy fuertes»
  { id: 13, a: 976, b: 1049, light: "golden", scene: "rin", sunAz: 150, sunEl: 18, fogFar: 700 },    // 1945, el Rin
  { id: 14, a: 1049, b: 1110, light: "golden", scene: "aleman", sunAz: 150, sunEl: 18, fogFar: 700 }, // los alemanes miran
  { id: 15, a: 1110, b: 1155, light: "day", scene: "mapa", ...IN },                      // por dónde cruzaba el de verdad
  { id: 16, a: 1155, b: 1220, light: "day", scene: "secreto", ...IN },                   // secreto 50 años
  { id: 17, a: 1220, b: TOTAL, light: "day", scene: "medalla", ...IN },                  // Medalla de Oro del Congreso
];
export const XFADE: Record<number, number> = { 2: 8, 4: 8, 6: 8, 7: 10, 8: 10, 9: 8, 10: 8, 13: 10, 15: 8, 16: 8, 17: 8 };
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
  [190, 228, "1.100 hombres"],
  [853, 882, "30 toneladas"],
  [980, 1045, "1945 · río Rin"],
  [1191, 1218, "50 años"],
  [1224, 1262, "2024"],
];

// ---------------- señuelos: tanques (y un camión y un cañón) inflables ----------------
export type Decoy = { kind: "tanque" | "camion" | "canon"; x: number; z: number; yaw: number; inflate: number; lift?: number; tilt?: number };
const inflateAt = (f: number, f0: number, n = 14) => {
  const u = (f - f0) / n;
  if (u <= 0) return 0.06;
  if (u >= 1.6) return 1;
  return Math.min(1.08, 0.06 + 0.94 * (1 - Math.exp(-4 * u)) + 0.08 * Math.sin(u * 9) * Math.exp(-2.5 * u));
};
const parque = (): Decoy[] => {
  const out: Decoy[] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) out.push({ kind: "tanque", x: PARQUE[0] - 12 + c * 8, z: PARQUE[2] + 10 - r * 9, yaw: 0.15, inflate: 1 });
  out.push({ kind: "camion", x: PARQUE[0] + 20, z: PARQUE[2] - 2, yaw: 0.1, inflate: 1 }, { kind: "camion", x: PARQUE[0] - 22, z: PARQUE[2] + 4, yaw: 0.1, inflate: 1 });
  return out;
};
const PARQUE_LIST = parque();
export const decoysAt = (id: number, f: number): Decoy[] => {
  switch (id) {
    case 1: return [{ kind: "tanque", x: HERO[0] + 0.4, z: HERO[2], yaw: 0.55, inflate: 1 }, { kind: "tanque", x: -9, z: -16, yaw: 0.3, inflate: 1 }, { kind: "tanque", x: 9, z: -18, yaw: 0.2, inflate: 1 }];
    case 2: case 3: return [{ kind: "tanque", x: TROPA_X - 6, z: -16, yaw: 0.3, inflate: 1 }, { kind: "tanque", x: TROPA_X + 6, z: -17, yaw: 0.2, inflate: 1 }];
    case 4: return [{ kind: "tanque", x: INFLA[0], z: INFLA[2], yaw: 0.45, inflate: inflateAt(f, 322, 18) }];
    case 5: return [
      { kind: "tanque", x: SENUELOS_X - 3.2, z: -10, yaw: 0.35, inflate: inflateAt(f, 366) },
      { kind: "camion", x: SENUELOS_X + 3.4, z: -11, yaw: 0.3, inflate: inflateAt(f, 388) },
      { kind: "canon", x: SENUELOS_X + 0.2, z: -6.5, yaw: 0.6, inflate: inflateAt(f, 402) },
    ];
    case 6: return PARQUE_LIST;
    case 11: case 12: {
      const up = id === 11 ? smooth((f - 818) / 16) : 1, wob = 0.04 * Math.sin(f * 0.35);
      return [{ kind: "tanque", x: LEVANTA[0], z: LEVANTA[2], yaw: 0.25, inflate: 1, lift: 1.55 * up + (up > 0.9 ? wob : 0), tilt: wob * 0.6 }];
    }
    case 13: case 14: {
      const out: Decoy[] = [];
      for (let k = 0; k < 6; k++) out.push({ kind: k === 2 ? "camion" : "tanque", x: -16 + k * 7, z: RIO_Z0 - 5 - (k % 2) * 3, yaw: 0.05, inflate: 1 });
      return out;
    }
    default: return [];
  }
};

// ---------------- movimientos ----------------
/** los ciclistas entran por la derecha por la carretera y frenan */
export const biciX = (f: number, k: number) => lin([[715, 156.6 + k * 1.6], [770, 151.6 + k * 1.2], [806, 151.6 + k * 1.2]], f);

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

// mirando a -z: +x a la derecha del cuadro
const S1 = (f: number): Shot => dolly([0, D0 + 1.7, 6.0], [0, D0 + 1.7, HERO[2]], pushK(f, 0, 0.0018, 0.005, 30), { fov: 50 });
const S2 = (f: number): Shot => dolly([TROPA_X, D0 + 2.2, 4.0], [TROPA_X, D0 + 1.6, -5], pushK(f, 139, 0.0015), { fov: 48 });
const S3 = (f: number): Shot => dolly([TROPA_X, D0 + 1.5, 2.6], [TROPA_X, D0 + 1.3, -3], pushK(f, 230, 0.002), { fov: 46 });
const S4 = (f: number): Shot => dolly([INFLA[0] - 1.0, D0 + 1.9, 4.6], [INFLA[0] - 1.0, D0 + 1.3, INFLA[2]], pushK(f, 302, 0.002, 0.006, 22), { fov: 48 });
const S5 = (f: number): Shot => dolly([SENUELOS_X, D0 + 2.6, 5.5], [SENUELOS_X, D0 + 1.3, -9], pushK(f, 354, 0.0012), { fov: 50 });
const S6 = (f: number): Shot => ({ pos: [PARQUE[0] + 2 - (f - 430) * 0.02, D0 + 52, PARQUE[2] + 30], look: [PARQUE[0] - (f - 430) * 0.02, D0, PARQUE[2] - 2], fov: 46 });
const S7 = (f: number): Shot => dolly([ALTAVOZ[0] - 0.4, D0 + 1.8, 4.5], [ALTAVOZ[0] - 0.4, D0 + 2.0, ALTAVOZ[2]], pushK(f, 494, 0.0015), { fov: 48 });
// interiores: mirando a +z, +x a la IZQUIERDA del cuadro
const S8 = (f: number): Shot => dolly([RADIO_X, D0 + 1.5, -601.6], [RADIO_X, D0 + 1.2, -597.0], pushK(f, 599, 0.0025, 0.006, 22), { fov: 44 });
const S9 = (f: number): Shot => dolly([PUEBLO[0], D0 + 1.6, -3.8], [PUEBLO[0], D0 + 1.6, -13], pushK(f, 649, 0.0018), { fov: 46 });
const S10 = (f: number): Shot => dolly([152.5, D0 + 1.5, -11.0], [152.5, D0 + 1.3, CARRETERA[2]], pushK(f, 715, 0.0012), { fov: 46 });
const S11 = (f: number): Shot => dolly([150.9, D0 + 1.6, -11.2], [149.5, D0 + 2.3, LEVANTA[2]], pushK(f, 806, 0.0018, 0.005, 24), { fov: 50 });
const S12 = (f: number): Shot => dolly([151.65, D0 + 1.6, -12.6], [151.65, D0 + 1.5, -17.8], pushK(f, 884, 0.0025, 0.006, 22), { fov: 44 });
// el Rin: desde la orilla de los señuelos (mirando a +z, +x a la IZQUIERDA)...
const S13 = (f: number): Shot => dolly([3.2, D0 + 1.8, RIO_Z0 - 15.5], [0.2, D0 + 1.6, RIO_Z0 - 4], pushK(f, 976, 0.0012), { fov: 50 });
// ...y desde la orilla alemana (mirando a -z): el observador con prismáticos
const S14 = (f: number): Shot => dolly([1.4, D0 + 1.6, RIO_Z1 + 6.2], [0.4, D0 + 1.3, RIO_Z1 + 1.4], pushK(f, 1049, 0.002, 0.006, 22), { fov: 46 });
const S15 = (f: number): Shot => dolly([MAPA_X, D0 + 1.7, -601.8], [MAPA_X, D0 + 1.7, -597.4], pushK(f, 1110, 0.0018), { fov: 44 });
const S16 = (f: number): Shot => dolly([ARCHIVO_X, D0 + 1.6, -601.4], [ARCHIVO_X, D0 + 1.3, -597.2], pushK(f, 1155, 0.0025, 0.006, 22), { fov: 44 });
const S17 = (f: number): Shot => dolly([CEREMONIA_X, D0 + 1.65, -603.0], [CEREMONIA_X, D0 + 1.45, -597.4], pushK(f, 1220, 0.0018), { fov: 44 });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1 }], 2: [{ f: 139, s: S2 }], 3: [{ f: 230, s: S3 }], 4: [{ f: 302, s: S4 }], 5: [{ f: 354, s: S5 }], 6: [{ f: 430, s: S6 }],
  7: [{ f: 494, s: S7 }], 8: [{ f: 599, s: S8 }], 9: [{ f: 649, s: S9 }], 10: [{ f: 715, s: S10 }], 11: [{ f: 806, s: S11 }], 12: [{ f: 884, s: S12 }],
  13: [{ f: 976, s: S13 }], 14: [{ f: 1049, s: S14 }], 15: [{ f: 1110, s: S15 }], 16: [{ f: 1155, s: S16 }], 17: [{ f: 1220, s: S17 }],
};

const KICKS: [number, number][] = [[324, 0.4], [366, 0.3], [390, 0.3], [404, 0.3], [825, 0.5], [1172, 0.6], [1270, 0.4]];
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
  { f: 0, cInf: 6 }, { f: 139, cInf: 6 }, { f: 230, cInf: 8 }, { f: 302, cInf: 6 }, { f: 354, cInf: 4 }, { f: 430, cInf: 1 },
  { f: 494, cInf: 5 }, { f: 599, cInf: 8 }, { f: 649, cInf: 6 }, { f: 715, cInf: 6 }, { f: 806, cInf: 4 }, { f: 884, cInf: 9 },
  { f: 976, cInf: 3 }, { f: 1049, cInf: 6 }, { f: 1110, cInf: 5 }, { f: 1155, cInf: 8 }, { f: 1220, cInf: 7 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
