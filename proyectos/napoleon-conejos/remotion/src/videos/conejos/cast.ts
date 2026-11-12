// El elenco de las pizzas de Bitcoin como tarjetas planas iluminadas en el mundo 3D (motor de la plantilla del puente: caché de
// dibujos por clave, tarjetas que miran a la cámara sombreadas por cardShade(), parpadeos, sombras de contacto) y
// encima la escena: multitud en el muelle, los seis conspiradores, los ocupantes de los coches, Princip, los gendarmes,
// los soldados de 1914 y los efectos (bomba, explosión, fogonazos, palomas, mapa).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxContact, fxShadow, fxPuff, fxStars, Outfit, Expr, FrontOpts, SideOpts, INK, SKINS } from "./toon";
import { FPS, D0, SHOTS, smooth, clamp01, lin, BACK_Z, CALLE, CUARTO_X, OFICINA_X, PLATO_X, MESA_Z, RZ, JAULAS3, FILA5, Z5, openAt, CARRO_X } from "./story";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";
import { NAPOLEON, BERTHIER, GRANADERO, GRANADERO2, GRANJERO, CONEJO, CONEJO2, CONEJO3, CONEJO4, CONEJO5, CONEJO_REY } from "./elenco";
import { fxOndas, fxBocadillo, fxSigno, fxSello, fxNombreL, fxCartel, fxMoneda, fxMarcador } from "./efectos";

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
const W_N: Who = { i: 1, o: NAPOLEON, okey: "napoleon" };
const W_B: Who = { i: 2, o: BERTHIER, okey: "berthier" };
const W_G1: Who = { i: 3, o: GRANADERO, okey: "granadero" };
const W_G2: Who = { i: 4, o: GRANADERO2, okey: "granadero2" };
const W_F: Who = { i: 5, o: GRANJERO, okey: "granjero" };
const CONEJOS = [CONEJO, CONEJO2, CONEJO3, CONEJO4, CONEJO5];
const cw = (i: number): Who => ({ i: 20 + i, o: CONEJOS[i % 5], okey: "conejo" + (i % 5) });
const W_REY: Who = { i: 90, o: CONEJO_REY, okey: "conejorey" };
const L = (f: number, w: Who) => lidAt(T(f), w.i);

type ConOpts = { mode: "stand" | "peck" | "run" | "jump" | "beg" | "climb"; expr?: Expr; phase?: number; yaw?: number; look?: number; hat?: boolean; turn?: number };
/** un conejo 3D: quieto, mordisqueando, saltando hacia adelante, saltando en el lugar, pidiendo o trepando */
const conejo = (cam: CamInfo, out: Stage, who: Who, x: number, z: number, f: number, o: ConOpts, sc = 1, y = D0) => {
  const sp = o.mode === "run" ? 2.6 : o.mode === "jump" ? 1.7 : o.mode === "peck" ? 0.9 : o.mode === "climb" ? 1.2 : 0.5;
  const phase = o.phase ?? (T(f) * sp + hh(who.i, 3)) % 1;
  out.places.push({ key: "conejo", draw: () => {}, x, y, z, scale: sc,
    fig: { o: who.o, okey: who.okey, mode: o.mode, expr: o.expr ?? "neutral", blink: L(f, who), look: o.look ?? 0, phase, yaw: o.yaw, hat: o.hat, turn: o.turn } });
  if (y <= D0 + 0.01) blob(out, x, D0, z, sc * 0.75);
};
/** una persona 3D en un modo cualquiera (run, whip, arms_up...), mirando a la cámara salvo yaw / dir */
const persona = (cam: CamInfo, out: Stage, who: Who, x: number, z: number, f: number, mode: string, expr: Expr, o: { dir?: number; yaw?: number; look?: number; sp?: number; sc?: number; y?: number } = {}) => {
  const sc = o.sc ?? 1, y = o.y ?? D0;
  out.places.push({ key: "persona", draw: () => {}, x, y, z, scale: sc,
    fig: { o: who.o, okey: who.okey, mode, expr, blink: L(f, who), look: o.look ?? 0, phase: (T(f) * (o.sp ?? 1.5) + hh(who.i, 3)) % 1, dir: o.dir, yaw: o.yaw } });
  if (y <= D0 + 0.01) blob(out, x, D0, z, sc);
};
const yawTo = (x: number, z: number, tx: number, tz: number) => Math.atan2(tx - x, tz - z);

// ---------------- el plató azul (+x a la izquierda del cuadro) ----------------
const plato = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const x = PLATO_X, zc = BACK_Z - 1.6;
  if (id === 3) {
    if (f >= 181) stand(cam, out, W_B, x, zc, { expr: f < 206 ? "smile" : "grin", blink: L(f, W_B) }, Math.max(0.01, boing(f, 181)));
    icon(out, cam, f, 190, "nombreB", 640, 200, (p) => fxNombreL(p, "MARISCAL BERTHIER"), x, D0 + 2.5, zc, 1.75, 0, 0.3);
    JAULAS3.forEach(([jx, jz, y0, f0], i) => {
      if (f < f0) return;
      const y = y0 + 2.2 * (1 - clamp01((f - f0) / 7)) ** 2;
      conejo(cam, out, cw(i), jx, jz, f, { mode: i % 3 === 0 ? "peck" : "stand", expr: f < f0 + 10 ? "shock" : i % 2 ? "smile" : "neutral", look: i % 2 ? 1 : -1 }, 0.62, D0 + y + 0.08);
    });
  }
  if (id === 7) {
    const big = f < 486;
    void big;
    conejo(cam, out, cw(3), x, zc + (big ? 0 : 0.3), f, { mode: f >= 550 ? "jump" : "stand", expr: f < 449 ? "neutral" : f < 550 ? "smile" : "laugh" }, big ? 1.45 : 1.3);
    if (f < 449) signo(out, cam, f, 430, "?", x - 0.35, D0 + 1.65, zc - 0.2, 0.3);
    if (f >= 455 && f < 486) icon(out, cam, f, 458, "granja", 640, 200, (p) => fxNombreL(p, "CONEJO DE GRANJA"), x, D0 + 1.85, zc - 0.2, 1.3, 0, 0.3);
    if (f >= 490) stand(cam, out, W_B, x + 1.25, zc + 0.1, { expr: f < 511 ? "smile" : "grin", blink: L(f, W_B), look: -1 }, Math.max(0.01, boing(f, 490)));
    if (f >= 511) stand(cam, out, W_F, x - 1.25, zc + 0.1, { expr: f < 520 ? "smile" : "laugh", blink: L(f, W_F), look: 1 }, Math.max(0.01, boing(f, 511)));
    for (let k = 0; k < 4; k++) {
      const f0 = 515 + k * 5, u = (f - f0) / 14;
      if (u < 0 || u > 1) continue;
      fxAt(out, cam, "moneda", 200, 200, fxMoneda, x + 1.0 - 2.0 * u, D0 + 1.3 + Math.sin(u * Math.PI) * 0.9, zc - 0.1, 0.28, 0.28, 0.3);
    }
    if (f >= 550) icon(out, cam, f, 550, "mansos", 520, 220, (p) => fxSello(p, "MANSOS", "#2f9a4a"), x, D0 + 2.3, zc - 0.3, 1.2, 0, 0.3);
  }
  if (id === 13) {
    stand(cam, out, W_N, x, zc, { expr: f < 916 ? "grin" : "stern", blink: L(f, W_N) }, Math.max(0.01, boing(f, 897)));
    if (f < 931) icon(out, cam, f, 902, "nombreN", 640, 200, (p) => fxNombreL(p, "NAPOLEÓN BONAPARTE"), x, D0 + 2.6, zc, 1.3, 0, 0.3);
    if (f >= 912) stand(cam, out, W_G1, x + 0.85, zc + 0.4, { expr: "stern", blink: L(f, W_G1), look: -1 }, Math.max(0.01, boing(f, 912)));
    if (f >= 915) stand(cam, out, W_G2, x - 0.85, zc + 0.4, { expr: "stern", blink: L(f, W_G2), look: 1 }, Math.max(0.01, boing(f, 915)));
    icon(out, cam, f, 931, "europa", 560, 240, (p) => fxCartel(p, "EL TERROR", "DE EUROPA", "#2f4a8a"), x, D0 + 2.65, zc, 1.45, 0, 0.3);
  }
};
const cuarto = (_id: number, _f: number, _cam: CamInfo, _out: Stage) => {};
const oficina = (_id: number, _f: number, _cam: CamInfo, _out: Stage) => {};

// ---------------- la pradera (+x a la derecha del cuadro) ----------------
const calle = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const cx = CALLE[0], z = RZ;
  if (id === 1) {
    stand(cam, out, W_N, cx + 0.2, z + 0.3, { expr: f < 71 ? "smile" : f < 87 ? "grin" : "laugh", blink: L(f, W_N) });
    stand(cam, out, W_G1, cx - 1.05, z - 0.7, { expr: "stern", blink: L(f, W_G1), look: 1 });
    stand(cam, out, W_G2, cx + 1.45, z - 0.7, { expr: f < 87 ? "stern" : "smile", blink: L(f, W_G2), look: -1 });
    icon(out, cam, f, 70, "paz", 520, 220, (p) => fxSello(p, "¡PAZ!", "#2f9a4a"), cx + 0.2, D0 + 2.65, z, 1.0, 0, 0.3);
  }
  if (id === 2) {
    const rise = (f0: number) => D0 - 0.75 * (1 - boing(f, f0));
    conejo(cam, out, cw(0), cx + 0.4, -12.4, f, { mode: "stand", expr: f < 129 ? "neutral" : "smile", look: f < 124 ? 0 : 1 }, 1, rise(110));
    if (f >= 129) signo(out, cam, f, 129, "?", cx + 0.62, D0 + 0.95, -12.4, 0.18);
    conejo(cam, out, cw(1), cx - 0.25, -13.1, f, { mode: "stand", expr: "neutral", look: 1 }, 1, rise(131));
    conejo(cam, out, cw(2), cx + 1.0, -13.3, f, { mode: "stand", expr: "shock", look: -1 }, 1, rise(137));
  }
  if (id === 4) {
    for (let k = -6; k <= 6; k++) conejo(cam, out, cw(k + 6), cx + k * 1.25, z - 1.6, f, { mode: (k + 6) % 3 ? "stand" : "peck", look: (k % 3) - 1 }, 0.62, D0 + 0.08);
    for (let k = -5; k <= 5; k++) conejo(cam, out, cw(k + 30), cx + k * 1.25 + 0.3, z - 1.6, f, { mode: "stand", expr: k % 2 ? "smile" : "neutral" }, 0.62, D0 + 0.84);
    icon(out, cam, f, 280, "tresmil", 560, 240, (p) => fxCartel(p, "¿3.000", "CONEJOS?", "#b8322f"), cx + 0.2, D0 + 3.0, z - 3.2, 2.1, 0, 0.05);
  }
  if (id === 5) {
    FILA5.forEach((jx, j) => {
      for (const s of [-1, 1]) {
        const i = j * 2 + (s > 0 ? 1 : 0), f0 = 340 + i * 2.2;
        const u = smooth((f - f0) / 12), x = jx + s * 0.22, zz = Z5 + u * (0.9 + hh(i, 4) * 0.8);
        const out2 = f >= f0 && f < f0 + 12;
        conejo(cam, out, cw(i), x, zz, f, { mode: out2 ? "run" : f > 372 + i ? "beg" : "stand", expr: f < 358 ? "neutral" : "smile", look: f < 358 ? (i % 3) - 1 : 0, yaw: out2 ? 0 : undefined,
          phase: out2 ? clamp01((f - f0) / 12) * 0.99 : undefined }, 0.62, f < f0 ? D0 + 0.08 : D0);
      }
    });
    void openAt;
  }
  if (id === 6) {
    stand(cam, out, W_N, cx + 0.1, z - 0.5, { expr: f < 393 ? "neutral" : "shock", blink: L(f, W_N) });
    if (f >= 396) signo(out, cam, f, 396, "!", cx + 0.55, D0 + 2.25, z - 0.5, 0.26);
    for (let i = 0; i < 14; i++) {
      const x0 = cx + (hh(i, 5) - 0.5) * 2.6, z0 = z + 2.2 + hh(i, 6) * 1.8, sp = 0.075 + hh(i, 7) * 0.03;
      const zz = Math.max(z + 0.15 + hh(i, 8) * 0.6, z0 - sp * (f - 382)), xx = cx + 0.1 + (x0 - cx) * clamp01((zz - z) / (z0 - z)) * 0.8 + (hh(i, 9) - 0.5) * 0.9 * (1 - clamp01((zz - z) / (z0 - z)));
      conejo(cam, out, cw(i), xx, zz, f, { mode: zz > z + 0.8 ? "run" : "beg", yaw: zz > z + 0.8 ? Math.PI : undefined, expr: "smile" }, 0.72);
    }
  }
  if (id === 8) {
    stand(cam, out, W_N, cx + 0.1, z - 0.4, { expr: f < 594 ? "nervous" : "shock", blink: L(f, W_N) });
    const R = [[-1.25, 0.75], [-0.75, 0.62], [0.75, 0.6], [1.25, 0.7], [-0.4, 0.95], [0.45, 1.0], [-1.1, 0.25], [1.15, 0.3]];
    R.forEach(([a, r], i) => {
      const x = cx + 0.1 + Math.sin(a) * r, zz = z - 0.4 + Math.cos(a) * r;
      conejo(cam, out, cw(i), x, zz, f, { mode: "beg", expr: i % 2 ? "smile" : "smile_closed", yaw: i === 4 || i === 5 ? undefined : yawTo(x, zz, cx + 0.1, z - 0.4) }, 0.95);
    });
    icon(out, cam, f, 587, "comida", 520, 260, (p) => fxBocadillo(p, "¿Y LA COMIDA?"), cx + 0.55, D0 + 2.15, z - 0.2, 0.9, 0, 0.3);
  }
  if (id === 9) {
    const wh = f >= 631;
    persona(cam, out, W_G1, cx - 0.85, z - 0.3, f, wh ? "whip" : "stand", wh ? "shout" : "stern", { look: 1, sp: 1.6 });
    persona(cam, out, W_G2, cx + 0.95, z - 0.5, f, wh ? "whip" : "stand", f < 663 ? "shout" : "shock", { look: -1, sp: 1.4 });
    for (let i = 0; i < 11; i++) {
      const x = cx + 0.05 + (hh(i, 10) - 0.5) * 3.0, zz = z + 0.3 + hh(i, 11) * 1.5;
      conejo(cam, out, cw(i + 3), x, zz, f, { mode: i % 3 === 2 ? "beg" : "jump", expr: i % 2 ? "laugh" : "smile_closed" }, 0.95);
    }
  }
  if (id === 10) {
    stand(cam, out, W_N, cx, z, { expr: f < 701 ? "nervous" : "shock", blink: L(f, W_N), look: Math.round(Math.sin(f * 0.15)) });
    const n = 40;
    for (let i = 0; i < n; i++) {
      const s = i % 2 ? 1 : -1, k = Math.floor(i / 2), rf = 1.1 + (k % 3) * 0.42, pf = s * (0.12 + 0.88 * (k / (n / 2 - 1))) * Math.PI * 0.97;
      const r0 = 4.6 + hh(i, 12) * 1.6, p0 = (hh(i, 13) - 0.5) * 0.55, d0 = hh(i, 14) * 6;
      const pos = (ff: number) => {
        const u = smooth((ff - 701 - d0) / 32);
        const r = ff < 701 ? r0 + 0.6 - 0.6 * clamp01((ff - 680) / 21) : r0 + (rf - r0) * u, ph = p0 + (pf - p0) * u;
        return [cx + Math.sin(ph) * r, z - Math.cos(ph) * r, u] as const;
      };
      const [x, zz, u] = pos(f), [x2, z2] = pos(f + 1);
      const moving = f < 701 || u < 0.97;
      conejo(cam, out, cw(i), x, zz, f, { mode: moving ? "run" : "beg", expr: "smile", yaw: moving ? Math.atan2(x2 - x, z2 - zz) : yawTo(x, zz, cx, z) }, 0.9);
    }
  }
  if (id === 11) {
    const nz = z - 0.3;
    persona(cam, out, W_N, cx + 0.05, nz, f, "arms_up", "shock", { sp: 1.2 });
    const climb = (i: number, side: number, f0: number, top: number) => {
      const u = smooth((f - f0) / 26), y = D0 + 0.05 + u * top;
      conejo(cam, out, cw(i), cx + 0.05 + side * 0.27, nz + 0.05, f, { mode: "climb", expr: "smile_closed", yaw: -side * Math.PI / 2 }, 0.75, y);
    };
    climb(0, -1, 757, 0.55); climb(1, 1, 764, 0.75); climb(2, -1, 776, 0.15);
    if (f >= 780) conejo(cam, out, cw(3), cx + 0.05, nz - 0.05, f, { mode: "stand", expr: "laugh" }, 0.6, D0 + 1.74 + 0.5 * (1 - boing(f, 780)));
    const R = [[-0.9, 0.7], [0.9, 0.75], [-0.3, 0.85], [0.35, 0.8], [-1.4, 0.6], [1.4, 0.6]];
    R.forEach(([a, r], i) => {
      const x = cx + 0.05 + Math.sin(a) * r, zz = nz + Math.cos(a) * r;
      conejo(cam, out, cw(i + 4), x, zz, f, { mode: i % 2 ? "jump" : "beg", expr: "smile", yaw: i < 2 ? yawTo(x, zz, cx, nz) : undefined }, 0.85);
    });
  }
  if (id === 12) {
    const door = CARRO_X(f) - 0.2, dz = z + 0.5, dx0 = CARRO_X(f) - CARRO_X(843);
    if (f < 845) {
      const x = Math.min(door, cx - 3.6 + 0.135 * (f - 799));
      persona(cam, out, W_N, x, dz, f, "run", "shock", { dir: 1, sp: 2.6 });
    }
    puff(out, cam, f, 844, door, D0 + 0.9, dz + 0.1, 1);
    for (let i = 0; i < 12; i++) {
      const lag = 0.55 + i * 0.17 + hh(i, 15) * 0.15, zz = dz + (hh(i, 16) - 0.5) * 0.7;
      const fin = 852 + i * 2.6;
      let x = Math.min(cx - 3.6 + 0.135 * (f - 799) - lag, door - 0.1);
      if (f >= fin + 6) continue;
      const jumping = f >= fin;
      if (jumping) x = door;
      conejo(cam, out, cw(i), x, jumping ? dz + 0.1 : zz, f, { mode: "run", yaw: Math.PI / 2, expr: "smile" }, 0.9, jumping ? D0 + 0.15 * (f - fin) : D0);
    }
    if (f >= 870) for (const [k, ox, f0] of [[4, -0.32, 872], [6, 0.05, 878], [8, 0.4, 883]] as [number, number, number][])
      if (f >= f0) conejo(cam, out, cw(k), CARRO_X(843) - 0.2 + ox + dx0, z + 0.22, f, { mode: "stand", expr: "laugh", look: 0 }, 0.5 * Math.max(0.01, boing(f, f0)), D0 + 1.36);
    if (f >= 856 && f < 884) icon(out, cam, f, 858, "mondieu", 520, 260, (p) => fxBocadillo(p, "¡MON DIEU!"), CARRO_X(843) - 0.7, D0 + 2.75, z + 0.1, 1.45, 0, 0.3);
    for (let k = 0; k < 8; k++) { const f0 = 884 + k * 2; puff(out, cam, f, f0, CARRO_X(f0) - 1.3, D0 + 0.35, z - 0.6 + (k % 2 ? 0.5 : -0.5), 0.9); }
  }
  if (id === 14) {
    const jumpOn = f >= 984;
    conejo(cam, out, W_REY, cx, z + 0.3, f, { mode: jumpOn ? "jump" : "stand", expr: f < 966 ? "smile_closed" : "laugh" }, 1.25);
    for (let r = 0; r < 3; r++) for (let k = -3; k <= 3; k++) {
      if (r === 0 && k === 0) continue;
      const i = r * 7 + k + 3, x = cx + k * 0.62 + (r % 2) * 0.31, zz = z + 0.3 - r * 0.85 - Math.abs(k) * 0.08;
      conejo(cam, out, cw(i), x, zz, f, { mode: jumpOn && f >= 984 + (i % 5) * 2 ? "jump" : "stand", expr: "laugh", look: k < 0 ? 1 : k > 0 ? -1 : 0, phase: undefined }, 0.95);
    }
    icon(out, cam, f, 966, "marcador", 600, 300, (p) => fxMarcador(p, "1", "0", "CONEJOS", "NAPOLEÓN"), cx, D0 + 2.45, z - 0.9, 1.25, 0, 0.3);
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
void bodyFront; void bodySide; void sit; void walk; void ondas; void fxShadow; void NOINK; void fxBurst; void INK; void SKINS; void puff; void fxStars; void fxPuff; void lin; void fxOndas; void CALLE; void ondas; void boing; void fxSello; void CUARTO_X; void OFICINA_X; void MESA_Z;
