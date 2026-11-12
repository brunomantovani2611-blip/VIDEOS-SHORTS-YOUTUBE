// El elenco de las pizzas de Bitcoin como tarjetas planas iluminadas en el mundo 3D (motor de la plantilla del puente: caché de
// dibujos por clave, tarjetas que miran a la cámara sombreadas por cardShade(), parpadeos, sombras de contacto) y
// encima la escena: multitud en el muelle, los seis conspiradores, los ocupantes de los coches, Princip, los gendarmes,
// los soldados de 1914 y los efectos (bomba, explosión, fogonazos, palomas, mapa).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxContact, fxShadow, fxPuff, fxStars, Outfit, Expr, FrontOpts, SideOpts, INK, SKINS } from "./toon";
import { FPS, D0, SHOTS, smooth, clamp01, lin, BACK_Z, CALLE, CUARTO_X, OFICINA_X, PLATO_X, MESA_Z, RZ, MX, MZ, TZ, TABLA, SHIP1, SHIP6, SHIP8, bob } from "./story";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";
import { GATO, ALEMAN, ALEMAN2, MARINERO, MARINERO2, OFICIAL } from "./elenco";
import { fxOndas, fxBocadillo, fxSigno, fxSello, fxNombreL, fxCartel, fxHumo, fxAgua, fxZzz } from "./efectos";
import { fxFogonazo } from "./efectos";

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
export type Fig = { o: Outfit; okey: string; mode: string; expr: Expr; blink: number; look: number; phase: number; dir?: number; yaw?: number; turn?: number; hat?: boolean };
export type Place = {
  fig?: Fig;
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
    fig: { o: who.o, okey: who.okey, mode: (view.side ? so.mode : fo.mode) ?? "stand", expr: (view.side ? so.expr : fo.expr) ?? "neutral",
      blink: Number((view.side ? so.blink : fo.blink) ?? 0), look: fo.look ?? 0, phase: (view.side ? so.phase : fo.phase) ?? 0 },
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
// El hackeo de Nasa, julio de 2020
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
  const pl = person(cam, who, x, y, z, view, { mode: "stroll", phase: ph, expr, blink: lidAt(T(f), who.i) },
    { mode: "march", phase: ph, expr, stride: view.fs * 0.7, blink: lidAt(T(f), who.i) });
  if (pl.fig) pl.fig.dir = dx;
  out.places.push(pl);
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


// ---------------- utilidades de esta short ----------------
const icon = (out: Stage, cam: CamInfo, f: number, f0: number, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, rot = 0, toward = 0.35) => {
  if (f < f0) return;
  const k = boing(f, f0);
  fxAt(out, cam, key, cw, ch, draw, x, y, z, w * k, w * (ch / cw) * k, toward, rot);
};
const signo = (out: Stage, cam: CamInfo, f: number, f0: number, s: string, x: number, y: number, z: number, sz = 0.24) =>
  icon(out, cam, f, f0, "signo" + s, 160, 220, (p) => fxSigno(p, s), x, y, z, sz, 0.1);
/** ondas que salen del silbato (o del teléfono) hacia un lado: dir = +1 hacia +x */
const ondas = (out: Stage, cam: CamInfo, f: number, f0: number, f1: number, x: number, y: number, z: number, w = 0.7, rot = 0) => {
  if (f < f0 || f >= f1) return;
  const u = q(((f - f0) / 18) % 1, 18);
  fxAt(out, cam, `ondas${u}`, 400, 300, (p) => fxOndas(p, u), x, y, z, w, w * 0.75, 0.3, rot);
};
const W_C: Who = { i: 1, o: GATO, okey: "gato" };
const W_A1: Who = { i: 2, o: ALEMAN, okey: "aleman" };
const W_A2: Who = { i: 3, o: ALEMAN2, okey: "aleman2" };
const W_M1: Who = { i: 4, o: MARINERO, okey: "marinero" };
const W_M2: Who = { i: 5, o: MARINERO2, okey: "marinero2" };
const W_O: Who = { i: 6, o: OFICIAL, okey: "oficial" };
const L = (f: number, w: Who) => lidAt(T(f), w.i);

type GatoOpts = { mode: "stand" | "angry" | "sleep" | "jump"; expr?: Expr; phase?: number; yaw?: number; look?: number; turn?: number };
/** el gato 3D: sentado, enojado (erizado), durmiendo o saltando */
const gato = (cam: CamInfo, out: Stage, f: number, x: number, z: number, o: GatoOpts, sc = 1, y = D0, shadow = true) => {
  const sp = o.mode === "angry" ? 1.0 : o.mode === "jump" ? 1.4 : o.mode === "sleep" ? 0.25 : 0.5;
  const phase = o.phase ?? (T(f) * sp) % 1;
  out.places.push({ key: "gato", draw: () => {}, x, y, z, scale: sc,
    fig: { o: W_C.o, okey: W_C.okey, mode: o.mode, expr: o.expr ?? "neutral", blink: o.mode === "sleep" ? 1 : L(f, W_C), look: o.look ?? 0, phase, yaw: o.yaw, turn: o.turn } });
  if (shadow) blob(out, x, y, z, sc * 0.7);
};
const persona = (cam: CamInfo, out: Stage, who: Who, x: number, z: number, f: number, mode: string, expr: Expr, o: { yaw?: number; look?: number; sp?: number; sc?: number; y?: number; shadow?: boolean } = {}) => {
  const sc = o.sc ?? 1, y = o.y ?? D0;
  out.places.push({ key: "persona", draw: () => {}, x, y, z, scale: sc,
    fig: { o: who.o, okey: who.okey, mode, expr, blink: L(f, who), look: o.look ?? 0, phase: (T(f) * (o.sp ?? 1.5) + hh(who.i, 3)) % 1, yaw: o.yaw } });
  if (o.shadow !== false) blob(out, x, y, z, sc);
};
/** humo negro que sube de un barco que se hunde */
const humo = (out: Stage, cam: CamInfo, f: number, f0: number, x: number, z: number, n = 10, s = 1, y0 = D0 + 3) => {
  for (let k = 0; k < n; k++) {
    const fk = f0 + k * 5, u = ((f - fk) / 40);
    if (u < 0) continue;
    const uu = u % 1, rep = Math.floor(u);
    if (rep > 3) continue;
    fxAt(out, cam, `humo${q(uu, 20)}`, 300, 300, (p) => fxHumo(p, q(uu, 20)), x + (hh(k, 3) - 0.5) * 3 * s + uu * 1.5 * s, y0 + uu * 7 * s, z + (hh(k, 4) - 0.5) * 2, 4.5 * s * (0.6 + uu), 4.5 * s * (0.6 + uu), 1, 0, true);
  }
};
/** explosión de torpedo: fogonazo naranja + columna de agua */
const torpedo = (out: Stage, cam: CamInfo, f: number, f0: number, x: number, z: number, s = 1) => {
  const u = (f - f0) / 24;
  if (u < 0 || u >= 1) return;
  if (f - f0 < 6) fxAt(out, cam, `fog${q((f - f0) / 6, 6)}`, 300, 300, (p) => fxFogonazo(p, q((f - f0) / 6, 6)), x, D0 + 1.5 * s, z, 5 * s, 5 * s, 2);
  fxAt(out, cam, `agua${q(u, 24)}`, 300, 400, (p) => fxAgua(p, q(u, 24)), x, D0 + 4.5 * s, z, 7 * s, 9.3 * s, 1.5, 0, true);
};
const yawTo = (x: number, z: number, tx: number, tz: number) => Math.atan2(tx - x, tz - z);

// ---------------- el plató azul (+x a la izquierda del cuadro) ----------------
const plato = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const x = PLATO_X, zc = BACK_Z - 1.6;
  if (id === 2) {
    if (f >= 128) stand(cam, out, W_A1, x + 0.75, zc + 0.2, { expr: f < 165 ? "neutral" : "nervous", blink: L(f, W_A1), look: -1 }, Math.max(0.01, boing(f, 128)));
    if (f >= 132) stand(cam, out, W_A2, x - 0.75, zc + 0.2, { expr: f < 165 ? "neutral" : "nervous", blink: L(f, W_A2), look: 1 }, Math.max(0.01, boing(f, 132)));
    const n1 = Math.round(2200 * smooth((f - 136) / 22));
    icon(out, cam, f, 134, `trip${n1}`, 560, 240, (p) => fxCartel(p, "TRIPULANTES", n1.toLocaleString("es-AR"), "#2f4a8a"), x, D0 + 2.75, zc - 0.3, 1.5, 0, 0.05);
    const n2 = Math.round(114 * smooth((f - 170) / 22));
    icon(out, cam, f, 166, `sobre${n2}`, 560, 240, (p) => fxCartel(p, "SOBREVIVIENTES", String(n2), "#b8322f"), x, D0 + 2.1, zc - 0.35, 1.5, 0, 0.05);
  }
  if (id === 5) {
    gato(cam, out, f, x, zc - 0.4, { mode: "stand", expr: f < 381 ? "neutral" : "smile_closed" }, 1.5);
    if (f >= 368) stand(cam, out, W_M1, x + 0.85, zc + 0.3, { expr: "grin", blink: L(f, W_M1), look: -1 }, Math.max(0.01, boing(f, 368)));
    if (f >= 371) stand(cam, out, W_M2, x - 0.85, zc + 0.3, { expr: "laugh", blink: L(f, W_M2), look: 1 }, Math.max(0.01, boing(f, 371)));
    icon(out, cam, f, 380, "oscar", 640, 200, (p) => fxNombreL(p, "OSCAR"), x, D0 + 1.45, zc - 0.5, 0.9, 0, 0.3);
  }
  if (id === 12) {
    gato(cam, out, f, x, zc - 0.3, { mode: f < 865 ? "stand" : "jump", expr: f < 865 ? "smile" : "laugh" }, 1.6);
    stand(cam, out, W_M1, x + 1.0, zc + 0.3, { expr: f < 860 ? "grin" : "laugh", blink: L(f, W_M1), look: -1 });
    stand(cam, out, W_O, x - 1.0, zc + 0.3, { expr: f < 860 ? "smile" : "grin", blink: L(f, W_O), look: 1 });
    icon(out, cam, f, 866, "nombreSam", 640, 200, (p) => fxNombreL(p, "SAM, EL INSUMERGIBLE"), x, D0 + 2.3, zc - 0.5, 1.6, 0, 0.3);
  }
};
const cuarto = (_id: number, _f: number, _cam: CamInfo, _out: Stage) => {};
const oficina = (_id: number, _f: number, _cam: CamInfo, _out: Stage) => {};

// ---------------- el mar y la tierra firme (+x a la derecha del cuadro) ----------------
const enTabla = (cam: CamInfo, out: Stage, f: number, o: GatoOpts, sc = 1) =>
  gato(cam, out, f, TABLA[0] + 0.05, TABLA[1] + 0.02, { yaw: undefined, ...o }, sc, D0 + 0.06 + bob(f), false);
const calle = (id: number, f: number, cam: CamInfo, out: Stage) => {
  if (id === 1) {
    humo(out, cam, f, 20, SHIP1[0], SHIP1[1], 14, 1.2);
    for (const [f0, dx] of [[30, -3], [52, 4], [83, 0]] as [number, number][]) torpedo(out, cam, f, f0, SHIP1[0] + dx, SHIP1[1] + 1.5, 0.8);
  }
  if (id === 3 || id === 7 || id === 11) {
    // humo del naufragio a lo lejos
    humo(out, cam, f, id === 3 ? 180 : id === 7 ? 470 : 700, MX + 4, MZ - 60, 8, 1.3, D0);
  }
  if (id === 3) {
    enTabla(cam, out, f, { mode: "stand", expr: f < 232 ? "dazed" : f < 269 ? "neutral" : "stern", look: f < 232 ? 0 : Math.round(Math.sin(f * 0.07)) });
    if (f >= 216) signo(out, cam, f, 216, "?", TABLA[0] + 0.35, D0 + 0.95, TABLA[1], 0.2);
  }
  if (id === 4) {
    const bx = MX + Math.max(1.75, 4.6 - 0.07 * (f - 283)), by = D0 + 0.45 + bob(f, 2) * 0.6, bz = TABLA[1] + 0.3;
    persona(cam, out, W_M1, bx - 0.15, bz, f, "sit", f < 340 ? "smile" : "grin", { y: by - 0.58, look: -1, shadow: false });
    persona(cam, out, W_M2, bx + 0.75, bz - 0.1, f, "sit", "grin", { y: by - 0.58, look: -1, shadow: false });
    if (f < 345) enTabla(cam, out, f, { mode: "stand", expr: f < 330 ? "nervous" : "smile", look: 1 });
    else {
      const u = clamp01((f - 345) / 10), x = TABLA[0] + (bx - 0.8 - TABLA[0]) * u, y = D0 + 0.06 + (by - D0 + 0.0) * u + Math.sin(u * Math.PI) * 0.6;
      gato(cam, out, f, x, TABLA[1] + 0.15 * u, { mode: u < 1 ? "jump" : "stand", expr: "smile_closed", phase: u < 1 ? 0.25 : undefined, look: 0 }, 1, y, false);
    }
  }
  if (id === 6) {
    if (f >= 455) humo(out, cam, f, 456, SHIP6[0], SHIP6[1], 12, 0.9, D0 + 2);
    torpedo(out, cam, f, 455, SHIP6[0] + 0.5, SHIP6[1] + 1.2, 0.8);
  }
  if (id === 7) {
    enTabla(cam, out, f, { mode: "stand", expr: f < 506 ? "neutral" : "smile_closed", look: 0 });
    icon(out, cam, f, 508, "otravez", 520, 220, (p) => fxSello(p, "¡OTRA VEZ!", "#2f9a4a"), TABLA[0] + 0.05, D0 + 0.98, TABLA[1] + 0.2, 0.6, 0, 0.3);
  }
  if (id === 9) {
    const dz = MZ - 12 + 0.6, dy = D0 + 3.66;
    gato(cam, out, f, MX + 0.1, dz + 1.4, { mode: "stand", expr: f < 628 ? "smile" : f < 649 ? "neutral" : "shock", look: f < 628 ? 0 : 1 }, 1.1, dy);
    persona(cam, out, W_O, MX + 1.0, dz + 0.2, f, "stand", f < 640 ? "grin" : "laugh", { y: dy, look: -1 });
    icon(out, cam, f, 640, "bismarck", 560, 240, (p) => fxCartel(p, "HUNDIÓ AL", "BISMARCK", "#b8322f"), MX + 0.1, dy + 1.25, dz + 1.0, 1.0, 0, 0.05);
  }
  if (id === 10) {
    if (f >= 714) humo(out, cam, f, 715, SHIP8[0], SHIP8[1], 12, 1.0, D0 + 3);
    torpedo(out, cam, f, 714, SHIP8[0] - 0.8, SHIP8[1] + 1.8, 0.9);
  }
  if (id === 11) {
    const mad = f >= 800;
    enTabla(cam, out, f, { mode: mad ? "angry" : "stand", expr: f < 760 ? "neutral" : f < 800 ? "stern" : f < 818 ? "shout" : "stern", look: 0 });
    if (f >= 802) icon(out, cam, f, 802, "miau", 520, 260, (p) => fxBocadillo(p, "¡MIAU!"), TABLA[0] + 0.12, D0 + 1.02, TABLA[1] + 0.1, 0.5, 0, 0.3);
    if (f >= 820) icon(out, cam, f, 820, "sano", 520, 220, (p) => fxSello(p, "SANO", "#2f9a4a"), TABLA[0] - 0.2, D0 + 0.62, TABLA[1] + 0.35, 0.5, 0, 0.3);
  }
  if (id === 13) {
    const z = TZ - 0.4;
    gato(cam, out, f, MX, z, { mode: f < 921 ? "stand" : "sleep", expr: f < 921 ? "smile" : "smile_closed" }, 1.1, D0 + 0.12);
    if (f >= 925) { const u = q(((f - 925) / 40) % 1, 20); fxAt(out, cam, `zzz${u}`, 300, 300, (p) => fxZzz(p, u), MX + 0.35, D0 + 0.85, z, 0.6, 0.6, 0.3); }
    icon(out, cam, f, 937, "tierra", 560, 240, (p) => fxCartel(p, "TIERRA", "FIRME", "#2f9a4a"), MX - 0.05, D0 + 1.9, z - 1.2, 1.1, 0, 0.05);
  }
};

/** todo lo que tiene cara en la toma id, cuadro f */
export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  const fn = { plato, cuarto, oficina, calle }[s.scene];
  fn(id, f, cam, out);
  return out;
};
void bodyFront; void bodySide; void sit; void walk; void ondas; void yawTo; void RZ; void CALLE; void fxShadow; void NOINK; void fxBurst; void INK; void SKINS; void puff; void fxStars; void fxPuff; void lin; void fxOndas; void CALLE; void ondas; void boing; void fxSello; void CUARTO_X; void OFICINA_X; void MESA_Z;
