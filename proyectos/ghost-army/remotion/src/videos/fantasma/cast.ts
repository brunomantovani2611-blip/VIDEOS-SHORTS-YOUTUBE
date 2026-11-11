// El elenco de las pizzas de Bitcoin como tarjetas planas iluminadas en el mundo 3D (motor de la plantilla del puente: caché de
// dibujos por clave, tarjetas que miran a la cámara sombreadas por cardShade(), parpadeos, sombras de contacto) y
// encima la escena: multitud en el muelle, los seis conspiradores, los ocupantes de los coches, Princip, los gendarmes,
// los soldados de 1914 y los efectos (bomba, explosión, fogonazos, palomas, mapa).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxContact, fxShadow, fxPuff, fxStars, Outfit, Expr, FrontOpts, SideOpts, INK, SKINS } from "./toon";
import { FPS, D0, SHOTS, smooth, clamp01, lin, BACK_Z, TROPA_X, INFLA, SENUELOS_X, PARQUE, ALTAVOZ, CARRETERA, LEVANTA, PUEBLO, RIO_Z0, RIO_Z1, RADIO_X, ARCHIVO_X, CEREMONIA_X, MAPA_X, biciX } from "./story";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";
import { GI, ARTISTA, DISENADOR, FRANCES, VECINO, ALEMAN, VETERANO } from "./elenco";
import { fxSinTiros, fxPincel, fxFantasma, fxCaballete, fxPlano, fxAuriculares, fxAltavoz, fxInflador, fxAvion, fxOndas, fxMotor, fxBotas, fxLuna, fxMorse, fxMensaje, fxParche, fxBici, fxMusculo, fxPrismaticos, fxMapa, fxCarpeta, fxMedalla, fxConfeti, fxSigno, fxBocadillo, fxEEUU } from "./efectos";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
/** world roots that hold actors (to find the scene's sun when world.ts does not pass it) */
const ROOTS = new Set<THREE.Object3D>();

/** lit flat character: cardShade() material, receives shadows (dims to the bright floor only), casts its silhouette
 *  when world.ts says so (golden). Drawn after the contact blobs (renderOrder 1). */
export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    // rim width is in output pixels: tell the card shader the render height (1920 = 1080 x 1920 frame)
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
/** unlit effect card: hard cut-out (ink drawings), soft see-through (dust, mist) or a multiply ground blob */
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      // no mipmaps: at grazing views the mip chain averages the blob with its white surround and it fades out
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    }
    else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
/** sun = world direction TOWARD the sun (optional: when absent the scene's shadow-casting light is used) */
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
/** head-shape seed: 7 shapes, so marching soldiers in step still share canvases */
const seedOf = (i: number) => ((i * 5 + 3) % 7) + 1;
/** drawing resolution by distance: [canvas w, h, scale from the 600 x 1000 design]; sized for the 1440 x 2560 final */
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

// ---------------- light ----------------
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: "day" | "golden" | "night" = "day";
const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => { if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o; });
  return s as THREE.DirectionalLight | null;
};
/** the sun of the world that is calling: the attached root whose sun target sits on this camera's view axis */
const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null, err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos), e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) { err = e; best = s; }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};
/** canvas angle the sun comes FROM on an upright card facing the camera, in 45-degree steps (small texture cache) */
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

/** front / side view and mirroring for someone at (x, z) walking along (dx, dz); fs = foreshortening of the walk */
const viewOf = (cam: CamInfo, x: number, z: number, dx: number, dz: number) => {
  const tx = cam.pos.x - x, tz = cam.pos.z - z, tl = Math.hypot(tx, tz) || 1;
  const c = (tx * dx + tz * dz) / tl;
  return { side: c < 0.57, mirror: dx * cam.right.x + dz * cam.right.z < 0, fs: Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * 20) / 20 };
};

// ---------------- life: blinks and reaction timing ----------------
/** reference expression and action changes land 0-3 f before the word onset */
const LEAD = 2 / FPS;
/** eyelid 0 open .. 1 shut. Reference: gaps 0.5-2.3 s, 4-frame blink half / shut / shut / half, plus a blink across
 *  every expression swap (the shut frames hide the swap) */
const LID = [0.5, 1, 1, 0.5];
const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13)); // next blink 0.5-2.3 s later
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

type Who = { i: number; o: Outfit; okey: string };
/** one character drawing in the 600 x 1000 design space, sized by distance, lit from the scene's sun */
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, view: { side: boolean; mirror: boolean }, fo: FrontOpts, so: SideOpts, scale = 1): Place & { tierKey: string } => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const mirror = view.side && view.mirror, light = light2D(cam, mirror), seed = seedOf(who.i);
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = view.side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return {
    key, x, y, z, scale, mirror, tierKey: `${w}`,
    draw: (p) => (view.side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)),
    size: [w, h, k],
  };
};

/** ground shadow under a standing / sitting card (review rounds 2-4), multiply, blue-violet: a TIGHT contact pool right under
 *  the feet (~.5 on screen at the core) so nobody floats, plus by day (cards cast no real shadow) a lighter soft tail
 *  stretched AWAY from the sun, length ~1.6 m / tan(sun elevation), capped. Golden: world.ts casts real card shadows. */
const CONTACT: Record<"day" | "golden" | "night", [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33], night: [0.2, 0.21, 0.33] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  if (LNAME !== "golden") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h; // feet at v = .2 of the card
    const tc = hexOf(TAIL, k);
    out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c,
      w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc,
    w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};

// ======================================================================================================
// El Ejército Fantasma, 1944-1945
// ======================================================================================================
export type Stage = { places: Place[]; fx: FxPlace[] };
const T = (f: number) => f / FPS;
const FRONT = { side: false, mirror: false };
const SIT_Y = 0.45;
const stand = (cam: CamInfo, out: Stage, who: Who, x: number, z: number, fo: FrontOpts, sc = 1, y = D0) => {
  out.places.push(person(cam, who, x, y, z, FRONT, { mode: "stand", ...fo }, {}, sc));
  blob(out, x, y, z, sc);
};
const sit = (cam: CamInfo, out: Stage, who: Who, x: number, z: number, fo: FrontOpts) =>
  out.places.push(person(cam, who, x, D0 + SIT_Y, z, FRONT, { mode: "sit", ...fo }, {}));
const walk = (cam: CamInfo, out: Stage, who: Who, x: number, z: number, dx: number, f: number, expr: Expr, y = D0) => {
  const ph = q((T(f) * 1.7) % 1, 30), view = viewOf(cam, x, z, dx, 0);
  out.places.push(person(cam, who, x, y, z, view, { mode: "stroll", phase: ph, expr, blink: lidAt(T(f), who.i) },
    { mode: "march", phase: ph, expr, stride: view.fs * 0.7, blink: lidAt(T(f), who.i) }));
  blob(out, x, y, z);
};
const fxAt = (out: Stage, cam: CamInfo, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, toward = 0.12, rot = 0, soft = false) => {
  const dx = cam.pos.x - x, dz = cam.pos.z - z, d = Math.hypot(dx, dz) || 1;
  out.fx.push({ key, cw, ch, draw, x: x + (dx / d) * toward, y, z: z + (dz / d) * toward, w, h, rot, soft });
};
const pop = (f: number, f0: number, n = 6) => smooth((f - f0) / n);
/** rebote al aparecer: 0 -> 1.15 -> 1 */
const boing = (f: number, f0: number) => { const u = (f - f0) / 9; return u <= 0 ? 0 : u >= 1 ? 1 : Math.sin(u * Math.PI * 0.5) * (1 + 0.15 * Math.sin(u * Math.PI)); };
const puff = (out: Stage, cam: CamInfo, f: number, f0: number, x: number, y: number, z: number, s = 1) => {
  const u = (f - f0) / 14;
  if (u < 0 || u >= 1) return;
  fxAt(out, cam, `puff${q(u, 14)}`, 300, 300, (p) => fxPuff(p, q(u, 14)), x, y, z, 1.3 * s, 1.3 * s, 0.3, 0, true);
};


// ---------------- 1 · un ejército que no disparaba ----------------
const icon = (out: Stage, cam: CamInfo, f: number, f0: number, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, rot = 0, toward = 0.35) => {
  if (f < f0) return;
  const k = boing(f, f0);
  fxAt(out, cam, key, cw, ch, draw, x, y, z, w * k, w * (ch / cw) * k, toward, rot);
};
const signo = (out: Stage, cam: CamInfo, f: number, f0: number, s: "?" | "!", x: number, y: number, z: number, sz = 0.24) =>
  icon(out, cam, f, f0, "signo" + s, 160, 220, (p) => fxSigno(p, s), x, y, z, sz, 0.1);

const hero = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), z = -2.6;
  [-1.05, 0.05, 1.15].forEach((x, i) => stand(cam, out, { i: 10 + i, o: GI(i), okey: `gi${i}` }, x, z - (i % 2) * 0.3, {
    expr: f < 101 ? "neutral" : i === 1 ? "grin" : "smile", blink: lidAt(t, 10 + i), look: i === 1 ? 0 : i ? -1 : 1, wave: i === 1 && f >= 104 ? 1 : undefined }));
  if (f >= 104) fxAt(out, cam, "pincel", 300, 120, fxPincel, 0.42, D0 + 1.95, z, 0.5, 0.2, 0.35, -0.9);
  icon(out, cam, f, 117, "sinTiros", 360, 260, fxSinTiros, -0.5, D0 + 2.6, z, 0.7);
};

// ---------------- 2 · el Ejército Fantasma: la tropa ----------------
const tropa = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const i = r * 4 + c, x = TROPA_X - 1.35 + c * 0.9 + (r % 2) * 0.45, z = -2.2 - r * 1.3;
    stand(cam, out, { i: 20 + i, o: GI(i), okey: `gi${i % 4}` }, x, z, { expr: f < 167 ? "neutral" : (i % 3 ? "grin" : "smile"), blink: lidAt(t, 20 + i), wave: f >= 196 && i % 3 === 0 ? 1 : undefined });
  }
  if (f >= 160) { const k = boing(f, 160), u = q((f / 45) % 1, 20); fxAt(out, cam, `fantasma${u}`, 640, 440, (p) => fxFantasma(p, u), TROPA_X, D0 + 3.55, -4, 2.3 * k, 1.58 * k, 0.5); }
};

// ---------------- 3 · artistas, diseñadores, técnicos de sonido ----------------
const expertos = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), z = -3;
  stand(cam, out, { i: 30, o: ARTISTA, okey: "artista" }, TROPA_X - 0.8, z, { expr: f >= 235 ? "grin" : "smile", blink: lidAt(t, 30), look: 1 });
  stand(cam, out, { i: 31, o: DISENADOR, okey: "disenador" }, TROPA_X + 0.05, z - 0.2, { expr: f >= 253 ? "grin" : "smile", blink: lidAt(t, 31) });
  stand(cam, out, { i: 32, o: GI(2), okey: "gi2" }, TROPA_X + 0.8, z, { expr: f >= 272 ? "laugh" : "smile", blink: lidAt(t, 32), look: -1 });
  icon(out, cam, f, 235, "caballete", 360, 480, fxCaballete, TROPA_X - 0.8, D0 + 2.4, z, 0.75);
  icon(out, cam, f, 253, "plano", 360, 300, fxPlano, TROPA_X + 0.05, D0 + 2.35, z - 0.2, 0.75);
  if (f >= 272) fxAt(out, cam, "auriculares", 300, 240, fxAuriculares, TROPA_X + 0.8, D0 + 1.86, z, 0.5, 0.4, 0.2);
  if (f >= 278) { const k = boing(f, 278), u = q(((f - 278) / 20) % 1, 10); fxAt(out, cam, `altavoz${u}`, 320, 260, (p) => fxAltavoz(p, u), TROPA_X + 0.8, D0 + 2.4, z, 0.75 * k, 0.61 * k, 0.35); }
};

// ---------------- 4 · el tanque que se infla ----------------
const infla = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), [x, , z] = INFLA;
  stand(cam, out, { i: 35, o: GI(1), okey: "gi1" }, x - 2.2, z + 4.0, { expr: f < 324 ? "nervous" : "grin", blink: lidAt(t, 35), look: 1 });
  const k = q(0.5 + 0.5 * Math.sin(f * 0.6), 8);
  if (f < 346) fxAt(out, cam, `inflador${k}`, 200, 320, (p) => fxInflador(p, k), x - 1.7, D0 + 0.55, z + 4.0, 0.42, 0.67, 0.1);
  signo(out, cam, f, 333, "!", x - 0.4, D0 + 3.4, z, 0.3);
};

// ---------------- 5 · tanques, camiones y cañones falsos ----------------
const senuelos = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f);
  for (const [i, x, z] of [[40, SENUELOS_X - 1.4, -4.5], [41, SENUELOS_X + 1.5, -4.0]] as const)
    stand(cam, out, { i, o: GI(i), okey: `gi${i % 4}` }, x, z, { expr: f < 366 ? "smile" : "laugh", blink: lidAt(t, i), wave: f >= 404 ? 1 : undefined, look: x < SENUELOS_X ? 1 : -1 });
  puff(out, cam, f, 366, SENUELOS_X - 3.2, D0 + 0.6, -10, 2.2);
  puff(out, cam, f, 388, SENUELOS_X + 3.4, D0 + 0.6, -11, 2.2);
  puff(out, cam, f, 402, SENUELOS_X + 0.2, D0 + 0.5, -6.5, 1.6);
};

// ---------------- 6 · desde el aire ----------------
const aire = (_id: number, f: number, _cam: CamInfo, out: Stage) => {
  const x = PARQUE[0] + 26 - (f - 430) * 0.55;
  out.fx.push({ key: "avion", cw: 520, ch: 260, draw: fxAvion, x, y: D0 + 26, z: PARQUE[2] + 14, w: 9, h: 4.5, rot: 0 });
  if (f >= 467) { const k = boing(f, 467); out.fx.push({ key: "signo!", cw: 160, ch: 220, draw: (p) => fxSigno(p, "!"), x: x + 1.5, y: D0 + 31, z: PARQUE[2] + 14, w: 2.2 * k, h: 3 * k }); }
};

// ---------------- 7 · los altavoces de noche ----------------
const noche = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), [ax, , az] = ALTAVOZ;
  out.fx.push({ key: "luna", cw: 240, ch: 240, draw: fxLuna, x: ax + 30, y: D0 + 70, z: az - 160, w: 24, h: 24 });
  stand(cam, out, { i: 45, o: GI(3), okey: "gi3" }, ax - 1.9, az + 2.6, { expr: f < 548 ? "smile" : "grin", blink: lidAt(t, 45), look: 1 });
  if (f >= 512) for (const dx of [-1.9, 0.3]) {
    const u = q(((f - 512) / 24) % 1, 12);
    fxAt(out, cam, `ondas${u}`, 400, 400, (p) => fxOndas(p, u), ax + dx, D0 + 3.1, az + 1.1, 2.6, 2.6, 0.3, 0, true);
  }
  icon(out, cam, f, 566, "motor", 240, 240, fxMotor, ax - 2.2, D0 + 4.6, az + 1.2, 0.95);
  icon(out, cam, f, 579, "botas", 240, 240, fxBotas, ax + 1.2, D0 + 4.7, az + 1.2, 0.95);
};

// ---------------- 8 · la radio (mirando a +z: +x a la izquierda) ----------------
const radio = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f);
  sit(cam, out, { i: 50, o: GI(0), okey: "gi0" }, RADIO_X + 0.2, BACK_Z - 1.25, { expr: f < 620 ? "smile" : "grin", blink: lidAt(t, 50), look: 1 });
  fxAt(out, cam, "auriculares", 300, 240, fxAuriculares, RADIO_X + 0.2, D0 + 1.4, BACK_Z - 1.25, 0.5, 0.4, 0.2);
  if (f >= 603) { const u = q(((f - 603) / 30) % 1, 15); fxAt(out, cam, `morse${u}`, 420, 300, (p) => fxMorse(p, u), RADIO_X - 0.5, D0 + 1.85, BACK_Z - 0.6, 1.25, 0.89, 0.3); }
  icon(out, cam, f, 622, "mensaje", 360, 260, fxMensaje, RADIO_X + 0.62, D0 + 2.1, BACK_Z - 1.1, 0.6, 0.1);
};

// ---------------- 9 · el pueblo: otras unidades ----------------
const pueblo = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), [px, , pz] = PUEBLO;
  stand(cam, out, { i: 55, o: GI(1), okey: "gi1" }, px - 0.35, pz - 1.2, { expr: f < 688 ? "smile" : "grin", blink: lidAt(t, 55), look: 1 });
  stand(cam, out, { i: 58, o: VECINO(0), okey: "vec0" }, px + 1.0, pz - 1.6, { expr: f < 688 ? "neutral" : "shock", blink: lidAt(t, 58), look: -1 });
  stand(cam, out, { i: 59, o: VECINO(1), okey: "vec1" }, px - 1.45, pz - 2.4, { expr: f < 688 ? "smile" : "shock", blink: lidAt(t, 59), look: 1 });
  const k = f < 688 ? 0 : 1;
  icon(out, cam, f, 657, `parche${k}`, 220, 260, (p) => fxParche(p, k), px + 0.25, D0 + 2.35, pz - 1.2, 0.48);
  puff(out, cam, f, 686, px + 0.25, D0 + 2.2, pz - 1.0, 0.7);
};

// ---------------- 10-12 · los ciclistas, el tanque levantado, «somos muy fuertes» ----------------
const bici = (out: Stage, cam: CamInfo, f: number, k: number, x: number, z: number, riding: boolean, expr: Expr) => {
  const who: Who = { i: 60 + k, o: FRANCES(k), okey: `fr${k}` };
  if (riding) {
    const u = q((x * 1.3) % 6.28, 12);
    out.places.push(person(cam, who, x + 0.1, D0 + 0.42, z - 0.05, FRONT, { mode: "sit", expr, blink: lidAt(T(f), 60 + k) }, {}));
    blob(out, x, D0, z);
    fxAt(out, cam, `bici${u}`, 520, 320, (p) => { p.g.translate(520, 0); p.g.scale(-1, 1); fxBici(p, u); }, x, D0 + 0.62, z, 1.6, 0.98, 0.25);
  } else {
    stand(cam, out, who, x + 0.55, z, { expr, blink: lidAt(T(f), 60 + k), look: -1 });
    fxAt(out, cam, "bici0", 520, 320, (p) => { p.g.translate(520, 0); p.g.scale(-1, 1); fxBici(p, 0); }, x - 0.25, D0 + 0.62, z + 0.05, 1.6, 0.98, 0.1);
  }
};
const bicis = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const riding = f < 772, expr: Expr = f < 779 ? "smile" : "shock";
  bici(out, cam, f, 0, biciX(f, 0), CARRETERA[2] - 0.3, riding, expr);
  bici(out, cam, f, 1, biciX(f, 1), CARRETERA[2] + 0.6, riding, expr);
  signo(out, cam, f, 784, "!", biciX(f, 0) + 0.55, D0 + 2.3, CARRETERA[2] - 0.3);
  signo(out, cam, f, 790, "!", biciX(f, 1) + 0.55, D0 + 2.3, CARRETERA[2] + 0.6);
};
const levanta = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), [lx, , lz] = LEVANTA;
  [-1.6, -0.55, 0.5, 1.55].forEach((dx, i) => stand(cam, out, { i: 65 + i, o: GI(i), okey: `gi${i}` }, lx + dx, lz + 1.55 - (i % 2) * 0.25, {
    expr: f < 825 ? "neutral" : i % 2 ? "grin" : "smile", blink: lidAt(t, 65 + i), wave: f >= 818 ? 1 : undefined, look: dx < 0 ? 1 : -1 }));
  stand(cam, out, { i: 60, o: FRANCES(0), okey: "fr0" }, 151.75, -17.6, { expr: "shock", blink: 0, look: -1 });
  stand(cam, out, { i: 61, o: FRANCES(1), okey: "fr1" }, 152.3, -17.0, { expr: "shock", blink: 0, look: -1 });
};
const fuertes = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f);
  stand(cam, out, { i: 70, o: GI(0), okey: "gi0" }, 151.05, -18.2, { expr: f < 919 ? "smile" : "grin", blink: f >= 950 && f < 960 ? 1 : lidAt(t, 70), look: 1, wave: f >= 944 ? 1 : undefined });
  stand(cam, out, { i: 60, o: FRANCES(0), okey: "fr0" }, 152.0, -17.7, { expr: f < 944 ? "shock" : "dazed", blink: 0, look: -1 });
  stand(cam, out, { i: 61, o: FRANCES(1), okey: "fr1" }, 152.6, -18.4, { expr: f < 944 ? "shock" : "dazed", blink: 0, look: -1 });
  icon(out, cam, f, 917, "bocadillo", 520, 300, (p) => fxBocadillo(p, ["¡Somos", "muy fuertes!"]), 151.15, D0 + 2.55, -18.2, 0.95);
  icon(out, cam, f, 946, "musculo", 260, 240, fxMusculo, 150.55, D0 + 1.75, -18.2, 0.36);
};

// ---------------- 13-14 · el Rin ----------------
const rin = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f);
  stand(cam, out, { i: 75, o: GI(1), okey: "gi1" }, 2.6, RIO_Z0 - 9.2, { expr: "grin", blink: lidAt(t, 75), look: -1 });
  stand(cam, out, { i: 76, o: GI(3), okey: "gi3" }, 0.9, RIO_Z0 - 10.4, { expr: "smile", blink: lidAt(t, 76), look: 1, wave: f >= 1037 ? 1 : undefined });
};
const aleman = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), x = 0.55, z = RIO_Z1 + 1.5;
  stand(cam, out, { i: 78, o: ALEMAN, okey: "aleman" }, x, z, { expr: f < 1062 ? "neutral" : "shock", blink: lidAt(t, 78) });
  if (f < 1086) fxAt(out, cam, "prismaticos", 260, 140, fxPrismaticos, x, D0 + 1.52, z, 0.36, 0.2, 0.22);
  signo(out, cam, f, 1067, "?", x + 0.45, D0 + 2.25, z);
};

// ---------------- 15 · el mapa ----------------
const mapa = (_id: number, f: number, _cam: CamInfo, out: Stage) => {
  const a = q(clamp01((f - 1113) / 14), 14), b = q(clamp01((f - 1126) / 16), 16);
  out.fx.push({ key: `mapa${a}|${b}`, cw: 600, ch: 700, draw: (p) => fxMapa(p, a, b), x: MAPA_X, y: D0 + 1.7, z: BACK_Z - 0.6, w: 1.5, h: 1.75 });
};

// ---------------- 16 · secreto durante 50 años ----------------
const secreto = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), lock = f >= 1172;
  stand(cam, out, { i: 80, o: GI(2), okey: "gi2" }, ARCHIVO_X + 0.78, BACK_Z - 1.0, { expr: f < 1172 ? "whistle" : "smile", blink: lidAt(t, 80), look: -1 });
  const k = boing(f, 1158);
  fxAt(out, cam, `carpeta${lock ? 1 : 0}`, 460, 380, (p) => fxCarpeta(p, lock), ARCHIVO_X - 0.15, D0 + 1.45, BACK_Z - 1.6, 1.05 * k, 0.87 * k, 0.3, -0.04);
  puff(out, cam, f, 1172, ARCHIVO_X - 0.15, D0 + 1.4, BACK_Z - 1.5, 1.0);
};

// ---------------- 17 · la Medalla de Oro del Congreso ----------------
const medalla = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), y = D0 + 0.2, z = BACK_Z - 1.2;
  stand(cam, out, { i: 85, o: VETERANO(0), okey: "vet0" }, CEREMONIA_X + 0.5, z, { expr: f < 1255 ? "smile" : "grin", blink: lidAt(t, 85), look: -1 }, 1, y);
  stand(cam, out, { i: 86, o: VETERANO(1), okey: "vet1" }, CEREMONIA_X - 0.45, z - 0.2, { expr: f < 1270 ? "smile" : "laugh", blink: lidAt(t, 86), look: 1, wave: f >= 1282 ? 1 : undefined }, 1, y);
  for (const s of [-1, 1]) { const u = q(((f + (s > 0 ? 20 : 0)) / 40) % 1, 20); fxAt(out, cam, `eeuu${u}${s}`, 300, 240, (p) => { if (s > 0) { p.g.translate(300, 0); p.g.scale(-1, 1); } fxEEUU(p, u * 6.28); }, CEREMONIA_X + s * 1.12, D0 + 2.45, BACK_Z - 0.45, 0.7, 0.56, 0.05); }
  icon(out, cam, f, 1268, "medalla", 300, 420, fxMedalla, CEREMONIA_X + 0.02, D0 + 2.45, z, 0.5, 0, 0.45);
  if (f >= 1282) { const u = q(((f - 1282) / 30) % 1, 15); fxAt(out, cam, `confeti${u}`, 400, 400, (p) => fxConfeti(p, u), CEREMONIA_X, D0 + 2.6, BACK_Z - 0.5, 2.6, 2.0, 0); }
};

/** todo lo que tiene cara en la toma id, cuadro f */
export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  const fn = { hero, tropa, expertos, infla, senuelos, aire, noche, radio, pueblo, bicis, levanta, fuertes, rin, aleman, mapa, secreto, medalla }[s.scene];
  fn(id, f, cam, out);
  return out;
};
void bodyFront; void bodySide; void fxShadow; void NOINK; void fxBurst; void INK; void SKINS; void lin; void walk; void sit; void CEREMONIA_X;
