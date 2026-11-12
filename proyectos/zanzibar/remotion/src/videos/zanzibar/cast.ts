// El elenco de las pizzas de Bitcoin como tarjetas planas iluminadas en el mundo 3D (motor de la plantilla del puente: caché de
// dibujos por clave, tarjetas que miran a la cámara sombreadas por cardShade(), parpadeos, sombras de contacto) y
// encima la escena: multitud en el muelle, los seis conspiradores, los ocupantes de los coches, Princip, los gendarmes,
// los soldados de 1914 y los efectos (bomba, explosión, fogonazos, palomas, mapa).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxContact, fxShadow, fxPuff, fxStars, Outfit, Expr, FrontOpts, SideOpts, INK, SKINS } from "./toon";
import { FPS, D0, SHOTS, smooth, clamp01, lin, BACK_Z, CALLE, CUARTO_X, OFICINA_X, PLATO_X, MESA_Z, RZ, PX, PAL, MAR, MASTIL, CONS, PASEO_Z, TRONO_Z, GLASGOW, FLOTA, CANONES, runX } from "./story";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";
import { KHALID, ASKARI, ASKARI2, ASKARI3, CONSUL, ALMIRANTE, MARINERO, MARINERO2 } from "./elenco";
import { fxOndas, fxBocadillo, fxSigno, fxSello, fxNombreL, fxCartel, fxHumo, fxAgua, fxFuego, fxCronometro, fxFactura, fxUltimatum, fxUnion } from "./efectos";
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
const W_K: Who = { i: 1, o: KHALID, okey: "khalid" };
const W_A: Who[] = [ASKARI, ASKARI2, ASKARI3].map((o, k) => ({ i: 10 + k, o, okey: "askari" + k }));
const W_C: Who = { i: 2, o: CONSUL, okey: "consul" };
const W_R: Who = { i: 3, o: ALMIRANTE, okey: "almirante" };
const W_M1: Who = { i: 4, o: MARINERO, okey: "marinero" };
const W_M2: Who = { i: 5, o: MARINERO2, okey: "marinero2" };
const L = (f: number, w: Who) => lidAt(T(f), w.i);
const persona = (cam: CamInfo, out: Stage, who: Who, x: number, z: number, f: number, mode: string, expr: Expr, o: { yaw?: number; look?: number; sp?: number; sc?: number; y?: number; shadow?: boolean; turn?: number; ph?: number } = {}) => {
  const sc = o.sc ?? 1, y = o.y ?? D0;
  out.places.push({ key: "persona", draw: () => {}, x, y, z, scale: sc,
    fig: { o: who.o, okey: who.okey, mode, expr, blink: L(f, who), look: o.look ?? 0, phase: o.ph ?? (T(f) * (o.sp ?? 1.5) + hh(who.i + x * 7, 3)) % 1, yaw: o.yaw, turn: o.turn } });
  if (o.shadow !== false) blob(out, x, y, z, sc);
};
/** columna de humo: bocanadas que suben y se abren (oscuro) */
const humo = (out: Stage, cam: CamInfo, f: number, f0: number, x: number, z: number, n = 10, s = 1, y0 = D0 + 3, drift = 1.5) => {
  for (let k = 0; k < n; k++) {
    const fk = f0 + k * 5, u = (f - fk) / 40;
    if (u < 0) continue;
    const uu = u % 1;
    fxAt(out, cam, `humo${q(uu, 20)}`, 300, 300, (p) => fxHumo(p, q(uu, 20)), x + (hh(k, 3) - 0.5) * 2 * s + uu * drift * s, y0 + uu * 7 * s, z + (hh(k, 4) - 0.5) * 2, 4.5 * s * (0.6 + uu), 4.5 * s * (0.6 + uu), 1, 0, true);
  }
};
/** llamas en bucle */
const fuego = (out: Stage, cam: CamInfo, f: number, f0: number, x: number, y: number, z: number, s = 1, k = 0) => {
  if (f < f0) return;
  const g = Math.min(1, (f - f0) / 8), u = q(((f / 16) + hh(k, 2)) % 1, 16);
  fxAt(out, cam, `fuego${u}`, 300, 400, (p) => fxFuego(p, u), x, y + 1.0 * s * g * 0.75, z, 1.5 * s * g, 2.0 * s * g, 0.5);
};
/** explosión: fogonazo, bocanada y (en el agua) columna */
const explota = (out: Stage, cam: CamInfo, f: number, f0: number, x: number, y: number, z: number, s = 1, agua = false) => {
  const n = f - f0;
  if (n < 0 || n >= 26) return;
  if (n < 7) fxAt(out, cam, `fog${q(n / 7, 7)}`, 300, 300, (p) => fxFogonazo(p, q(n / 7, 7)), x, y, z, 3.2 * s, 3.2 * s, 1.2);
  if (agua) { const u = q(n / 26, 26); fxAt(out, cam, `agua${u}`, 300, 400, (p) => fxAgua(p, u), x, y + 2.6 * s, z, 4.5 * s, 6 * s, 1.0, 0, true); }
  else if (n >= 2) { const u = q((n - 2) / 24, 24); fxAt(out, cam, `puff${u}`, 300, 300, (p) => fxPuff(p, u), x, y + 0.4 * s, z, 3.6 * s, 3.6 * s, 0.9, 0, true); }
};
/** cañonazo de un buque de costado: fogonazo y humo blanco de pólvora */
const andanada = (out: Stage, cam: CamInfo, f: number, f0: number, x: number, z: number, s: number) => {
  for (let k = 0; k < 3; k++) {
    const n = f - f0 - k * 2;
    if (n < 0 || n >= 40) continue;
    const gx = x + (k - 1) * 4.5 * s, gz = z - 2.2 * s;
    if (n < 6) fxAt(out, cam, `fog${q(n / 6, 6)}`, 300, 300, (p) => fxFogonazo(p, q(n / 6, 6)), gx, D0 + 1.5 * s, gz, 2.6 * s, 2.6 * s, 0.5);
    const u = q(n / 40, 40);
    fxAt(out, cam, `puff${u}`, 300, 300, (p) => fxPuff(p, u), gx + u * 1.5, D0 + 1.6 * s + u * 1.6, gz - 1.5 * u, (2.4 + 4 * u) * s, (2.4 + 4 * u) * s, 0.3, 0, true);
  }
};
/** el humo de las chimeneas de la flota */
const chimeneas = (out: Stage, cam: CamInfo, f: number) => {
  for (const [x, z, k, s] of FLOTA) for (const dz of k === "crucero" ? [1.3, -1.6] : [-0.5]) {
    for (let j = 0; j < 3; j++) {
      const u = ((f / 50) + j / 3 + hh(x, 1)) % 1, uq = q(u, 16);
      fxAt(out, cam, `humoC${uq}`, 300, 300, (p) => fxHumo(p, uq), x - dz * s + u * 2.2, D0 + (k === "crucero" ? 6.6 : 5.3) * s + u * 2.5, z, (1.2 + 2 * u) * s, (1.2 + 2 * u) * s, 0.4, 0, true);
    }
  }
};
/** fuegos del palacio después del bombardeo (tomas 13, 14 y 16) */
const FUEGOS: [number, number, number, number][] = [[PAL.x - 4.5, 3.6, 662, 1.8], [PAL.x + 2.0, 6.8, 668, 2.0], [PAL.x - 1.5, 0.6, 674, 1.6], [PAL.x + 5.0, 3.8, 678, 1.8], [PAL.x - 5.5, 6.9, 684, 1.7], [MAR.x - 5.8, 3.8, 688, 1.4], [PAL.x + 0.5, 9.2, 676, 2.2]];
const palacioArde = (out: Stage, cam: CamInfo, f: number, mul = 1) => {
  for (const [k, [x, y, f0, s]] of FUEGOS.entries()) fuego(out, cam, f, f0, x, D0 + y, PAL.z + 1.7, s * mul, k);
  humo(out, cam, f, 660, PAL.x - 2, PAL.z - 3, 12, 1.4, D0 + PAL.h, 2.5);
  humo(out, cam, f, 672, PAL.x + 4, PAL.z - 5, 10, 1.1, D0 + PAL.h, 2.0);
};

// ---------------- el salón del trono (+x a la izquierda del cuadro) ----------------
const cuarto = (id: number, f: number, cam: CamInfo, out: Stage) => {
  if (id !== 3) return;
  const cx = CUARTO_X;
  for (const [k, s] of [[0, -1], [1, 1]] as [number, number][]) persona(cam, out, W_A[k], cx + s * 1.75, TRONO_Z - 0.6, f, "stand", f < 217 ? "neutral" : "grin", { look: -s });
  if (f < 197) {
    const x = cx - 2.9 + 2.9 * smooth((f - 165) / 32);
    persona(cam, out, W_K, x, TRONO_Z - 1.5, f, "stroll", "grin", { yaw: Math.PI / 2 - 0.5, sp: 1.6 });
  } else if (f < 210) {
    const u = smooth((f - 197) / 13);
    persona(cam, out, W_K, cx, TRONO_Z - 1.5 + 1.4 * u, f, "stand", "smile", { y: D0 + 0.25 * u, yaw: Math.PI * (1 - u) * 0.3, shadow: false });
  } else persona(cam, out, W_K, cx, TRONO_Z + 0.02, f, "sit", f < 229 ? "grin" : "laugh", { y: D0 + 0.8, shadow: false });
  icon(out, cam, f, 176, "nKhalid", 640, 200, (p) => fxNombreL(p, "KHALID"), cx - 0.05, D0 + 2.75, TRONO_Z - 1.0, 1.05, 0, 0.3);
  icon(out, cam, f, 229, "nuevoSultan", 520, 220, (p) => fxSello(p, "¡SULTÁN!", "#c9963a"), cx + 0.9, D0 + 1.55, TRONO_Z - 1.4, 0.95, 0, 0.3);
};
const oficina = (_id: number, _f: number, _cam: CamInfo, _out: Stage) => {};

// ---------------- el plató azul (+x a la izquierda del cuadro) ----------------
const plato = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const x = PLATO_X, zc = BACK_Z - 1.6;
  if (id === 4 || id === 5) fxAt(out, cam, "union", 600, 360, (p) => fxUnion(p), x, D0 + 2.9, BACK_Z - 0.3, 2.3, 1.38, 0);
  if (id === 4) {
    if (f >= 254) persona(cam, out, W_C, x + 0.85, zc + 0.2, f, f < 268 ? "stand" : "point", f < 257 ? "neutral" : "stern", { sc: Math.max(0.01, boing(f, 254)), look: -1 });
    if (f >= 258) persona(cam, out, W_R, x - 0.85, zc + 0.2, f, f < 268 ? "stand" : "fist", f < 268 ? "stern" : "shout", { sc: Math.max(0.01, boing(f, 258)), look: 1 });
    icon(out, cam, f, 268, "sinPermiso", 520, 220, (p) => fxSello(p, "SIN PERMISO", "#d42f2f"), x, D0 + 1.85, zc - 0.6, 1.1, 0, 0.3);
  }
  if (id === 5) {
    persona(cam, out, W_R, x - 0.55, zc + 0.3, f, "hold", "stern", { look: 1 });
    persona(cam, out, W_C, x + 0.75, zc + 0.3, f, f < 333 ? "stand" : "point", "stern", { look: -1 });
    icon(out, cam, f, 333, "ultimatum", 460, 560, (p) => fxUltimatum(p), x - 0.5, D0 + 1.0, zc - 0.25, 0.72, 0.05, 0.3);
  }
  if (id === 15) {
    const m = 38 * smooth((f - 762) / 26);
    const mq = Math.round(m);
    icon(out, cam, f, 760, `crono${mq}`, 400, 460, (p) => fxCronometro(p, mq), x, D0 + 2.45, zc - 0.2, 1.55, 0, 0.05);
    const yay = f >= 816;
    persona(cam, out, W_R, x, zc + 0.5, f, yay ? "arms_up" : "stand", yay ? "laugh" : "smile", { sp: 1.2 });
    persona(cam, out, W_M1, x + 1.05, zc + 0.3, f, yay ? "arms_up" : "stand", yay ? "laugh" : "grin", { look: -1, sp: 1.3 });
    persona(cam, out, W_M2, x - 1.05, zc + 0.3, f, yay ? "arms_up" : "stand", yay ? "laugh" : "grin", { look: 1, sp: 1.1 });
    icon(out, cam, f, 819, "fin", 520, 220, (p) => fxSello(p, "¡FIN!", "#2f9a4a"), x - 0.75, D0 + 1.35, zc - 0.7, 0.9, 0, 0.3);
  }
};

// ---------------- la costa de Zanzíbar ----------------
const calle = (id: number, f: number, cam: CamInfo, out: Stage) => {
  if (id === 1 || id === 11) chimeneas(out, cam, f);
  if (id === 1) icon(out, cam, f, 84, "masCorta", 560, 240, (p) => fxCartel(p, "LA GUERRA", "MÁS CORTA", "#b8322f"), PX + 2.5, D0 + 8.9, -166, 5.2, 0, 0.05);
  if (id === 2) icon(out, cam, f, 142, "hamad", 560, 240, (p) => fxCartel(p, "SULTÁN HAMAD", "1857 – 1896", "#2a2730"), MASTIL[0] - 0.6, D0 + 8.3, -199, 3.0, 0, 0.05);
  if (id === 7) {
    persona(cam, out, W_K, PAL.x + 0.25, -200.0, f, f < 419 ? "stand" : "fist", f < 419 ? "stern" : "shout", { look: 0 });
    for (let k = 0; k < 5; k++) persona(cam, out, W_A[k % 3], PAL.x - 2.3 + k * 1.15 + (k > 1 ? 0.3 : 0) - (k === 2 ? 1.0 : 0) * 0, -200.9 - (k === 2 ? 0.5 : 0), f, "stand", f < 436 ? "stern" : "grin", { look: k < 2 ? 1 : -1 });
    for (let k = 0; k < 6; k++) persona(cam, out, W_A[(k + 1) % 3], PAL.x - 2.9 + k * 1.15, -201.9, f, "stand", "stern", {});
    for (let k = 0; k < 7; k++) persona(cam, out, W_A[(k + 2) % 3], PAL.x - 3.4 + k * 1.15, -203.0, f, "stand", "neutral", { shadow: false });
    const n = Math.round(2800 * smooth((f - 428) / 20) / 10) * 10;
    icon(out, cam, f, 428, `hombres${n}`, 560, 240, (p) => fxCartel(p, "HOMBRES", n.toLocaleString("es-AR"), "#b8322f"), PAL.x + 0.2, D0 + 3.55, -201.5, 2.2, 0, 0.05);
  }
  if (id === 8) {
    const [cx, cz] = CANONES[1];
    persona(cam, out, W_A[1], cx - 0.9, cz + 0.3, f, f < 474 ? "stand" : f < 480 ? "point" : "stand", f < 476 ? "grin" : f < 486 ? "shock" : "nervous", { yaw: f < 474 ? undefined : 0.9 });
    icon(out, cam, f, 465, "sigloXVII", 560, 240, (p) => fxCartel(p, "CAÑÓN DEL", "SIGLO XVII", "#8a5a2a"), cx + 0.2, D0 + 1.9, cz - 0.4, 1.3, 0, 0.05);
    if (f >= 476 && f < 496) { const u = q((f - 476) / 20, 20); fxAt(out, cam, `puff${u}`, 300, 300, (p) => fxPuff(p, u), cx + 0.05, D0 + 0.7, cz + 1.05 + u * 0.3, 0.7, 0.7, 0.2, 0, true); }
    if (f >= 487) signo(out, cam, f, 487, "?", cx - 0.6, D0 + 1.95, cz + 0.3, 0.26);
  }
  if (id === 11) for (const [k, [x, z, , s]] of FLOTA.entries()) { andanada(out, cam, f, 589 + (k % 2) * 4, x, z, s); andanada(out, cam, f, 599 + ((k + 1) % 2) * 4, x, z, s); }
  if (id === 12) {
    const [gx, gz] = GLASGOW;
    for (const [f0, dx, w] of [[616, -3, true], [626, 2.5, false], [634, -1, true], [641, 4, false], [648, -5, true]] as [number, number, boolean][])
      explota(out, cam, f, f0, gx + dx, D0 + (w ? 0.2 : 2.2), gz + 1.6, 1.0, w);
    humo(out, cam, f, 627, gx, gz, 10, 0.9, D0 + 2, 2);
  }
  if (id === 13) {
    for (const [f0, x, y] of [[659, PAL.x - 3, 5.0], [664, PAL.x + 3.5, 2.0], [670, PAL.x - 5.5, 8.0], [676, PAL.x + 1, 7.8], [680, MASTIL[0], 10.5], [686, MAR.x - 4, 6.5]] as [number, number, number][])
      explota(out, cam, f, f0, x, D0 + y, PAL.z + 2.2, 1.5);
    palacioArde(out, cam, f);
  }
  if (id === 14) {
    palacioArde(out, cam, f);
    const x = runX(f);
    persona(cam, out, W_K, x, PASEO_Z, f, "run", f < 735 ? "shock" : "nervous", { yaw: -Math.PI / 2 + 0.95, sp: 2.6 });
    for (const [f0, dx] of [[702, 4.5], [722, 6.5], [741, 3.0]] as [number, number][]) explota(out, cam, f, f0, x + dx, D0 + 0.4, PASEO_Z - 1.6, 0.8);
    if (f >= 708) signo(out, cam, f, 708, "!", x - 0.2, D0 + 2.35, PASEO_Z, 0.3);
  }
  if (id === 16) {
    palacioArde(out, cam, f, 0.75);
    const bx = PAL.x - 0.3;
    persona(cam, out, W_C, bx + 0.6, -201.2, f, f < 900 ? "stand" : "hold", f < 862 ? "smile" : f < 902 ? "grin" : "smile", { look: 1, turn: 0.35 });
    persona(cam, out, W_A[0], bx - 0.55, -201.6, f, "stand", f < 936 ? "neutral" : "shock", { look: -1, turn: -0.25 });
    persona(cam, out, W_A[2], bx - 1.45, -201.9, f, "stand", f < 938 ? "nervous" : "shock", { look: -1, turn: -0.2 });
    if (f >= 841 && f < 900) signo(out, cam, f, 841, "!", bx + 0.75, D0 + 2.15, -201.2, 0.22);
    if (f >= 902) {
      const k = q(smooth((f - 902) / 26), 20);
      fxAt(out, cam, `factura${k}`, 420, 760, (p) => fxFactura(p, k), bx + 0.05, D0 + 0.74, -200.85, 0.78, 1.41, 0.2);
    }
    if (f >= 937) { signo(out, cam, f, 937, "!", bx - 0.55, D0 + 2.15, -201.6, 0.22); signo(out, cam, f, 939, "!", bx - 1.45, D0 + 2.15, -201.9, 0.22); }
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
void bodyFront; void bodySide; void sit; void walk; void RZ; void CALLE; void fxShadow; void NOINK; void fxBurst; void INK; void SKINS; void puff; void fxStars;
void lin; void fxOndas; void CUARTO_X; void OFICINA_X; void MESA_Z; void clamp01; void fxBocadillo; void fxSigno; void CONS; void stand; void smooth;
