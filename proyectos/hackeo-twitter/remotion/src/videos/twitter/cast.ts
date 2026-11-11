// El elenco de las pizzas de Bitcoin como tarjetas planas iluminadas en el mundo 3D (motor de la plantilla del puente: caché de
// dibujos por clave, tarjetas que miran a la cámara sombreadas por cardShade(), parpadeos, sombras de contacto) y
// encima la escena: multitud en el muelle, los seis conspiradores, los ocupantes de los coches, Princip, los gendarmes,
// los soldados de 1914 y los efectos (bomba, explosión, fogonazos, palomas, mapa).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxContact, fxShadow, fxPuff, fxStars, Outfit, Expr, FrontOpts, SideOpts, INK, SKINS } from "./toon";
import { FPS, D0, SHOTS, smooth, clamp01, lin, BACK_Z, CALLE, CUARTO_X, OFICINA_X, PLATO_X, MESA_Z } from "./story";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";
import { CHICO, EMPLEADO, POLICIA, POLICIA2 } from "./elenco";
import { fxOndas, fxTelefono, fxBocadillo, fxSigno, fxTweet, fxSello, fxCelular, fxVirus, fxClave, fxPanel, fxBitcoin, fxCandado, fxCheck, fxRejas, fxCodigo, fxToc, fxPantallaPC } from "./efectos";

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
// El hackeo de Twitter, julio de 2020
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
const W_C: Who = { i: 1, o: CHICO, okey: "chico" };
const W_E: Who = { i: 2, o: EMPLEADO, okey: "empleado" };
const W_P: Who = { i: 3, o: POLICIA, okey: "poli" };
const W_P2: Who = { i: 4, o: POLICIA2, okey: "poli2" };

// ---------------- el plató de las pantallas (mirando a +z: +x a la izquierda del cuadro) ----------------
const TWEETS: [number, string, string, number, number][] = [
  // [cuadro, nombre, color del avatar, x, y]
  [97, "Elon Musk", "#8a8e96", 0.1, 1.0],
  [208, "Bill Gates", "#7a8aa0", -0.1, 0.5],
  [238, "Barack Obama", "#8a7a9a", 0.1, 0],
  [252, "Joe Biden", "#7a9a8a", -0.1, -0.5],
  [268, "Apple", "#9a8a7a", 0.1, -1.0],
];
const plato = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const x = PLATO_X, z = BACK_Z - 0.5;
  if (id === 1) {
    const u = q(((f / 24) % 1), 24);
    out.fx.push({ key: `celular${u}`, cw: 320, ch: 560, draw: (p) => fxCelular(p, u), x, y: D0 + 1.75, z, w: 1.25, h: 2.19 });
    signo(out, cam, f, 49, "!", x + 0.7, D0 + 2.75, z - 0.4, 0.36);
    signo(out, cam, f, 61, "!", x - 0.7, D0 + 2.45, z - 0.4, 0.36);
    signo(out, cam, f, 69, "?", x + 0.7, D0 + 0.8, z - 0.4, 0.3);
  }
  if (id >= 2 && id <= 4) {
    const list = id === 2 ? TWEETS.slice(0, 1) : TWEETS;
    for (const [f0, name, col, dx, dy] of list) {
      if (f < f0) continue;
      const big = id === 2, k = boing(f, f0) * (big ? 1.15 : 0.82);
      const yy = big ? D0 + 1.9 : D0 + 2.0 + dy * 1.05, xx = big ? x : x + dx;
      out.fx.push({ key: `tw|${name}`, cw: 640, ch: 320, draw: (p) => fxTweet(p, name, col), x: xx, y: yy, z: z + 0.1 - f0 * 0.0005, w: 1.6 * k, h: 0.8 * k });
    }
    if (id === 2 && f >= 172) for (let i = 0; i < 6; i++) {
      const f0 = 172 + i * 3, u = (f - f0) / FPS;
      if (u < 0) continue;
      out.fx.push({ key: "btc", cw: 200, ch: 200, draw: fxBitcoin, x: x + 0.9 - i * 0.36, y: D0 + 3.4 - 1.8 * u * u - 0.6 * u, z: z - 0.3, w: 0.26, h: 0.26 });
    }
    if (id === 4) {
      icon(out, cam, f, 331, "estafa", 520, 220, (p) => fxSello(p, "ESTAFA"), x, D0 + 2.0, z - 0.3, 1.9, 0, 0.05);
      signo(out, cam, f, 351, "?", x - 0.72, D0 + 0.6, z - 0.4, 0.36);
    }
  }
  if (id === 8) {
    const n = q(clamp01((f - 661) / 70), 35);
    out.fx.push({ key: `panel${n}|${f >= 731 ? 1 : 0}`, cw: 600, ch: 720, draw: (p) => fxPanel(p, n, f >= 731 ? "130 cuentas" : ""), x, y: D0 + 1.85, z, w: 1.75, h: 2.1 });
  }
  if (id === 10) {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const f0 = 845 + (r * 4 + c) * 1.5;
      if (f < f0) continue;
      const k = boing(f, f0);
      out.fx.push({ key: "check", cw: 200, ch: 200, draw: fxCheck, x: x + 0.75 - c * 0.5, y: D0 + 2.75 - r * 0.6, z, w: 0.4 * k, h: 0.4 * k });
    }
    icon(out, cam, f, 892, "candado", 360, 420, fxCandado, x, D0 + 2.0, z - 0.4, 1.05, 0, 0.05);
    icon(out, cam, f, 923, "bloqueado", 520, 220, (p) => fxSello(p, "BLOQUEADO"), x, D0 + 0.95, z - 0.6, 1.6, 0, 0.05);
  }
  if (id === 12) {
    stand(cam, out, W_C, x, BACK_Z - 1.6, { expr: f < 1047 ? "nervous" : "pained", blink: lidAt(T(f), 1) });
    const k = smooth((f - 1031) / 8);
    if (f >= 1031) out.fx.push({ key: "rejas", cw: 600, ch: 800, draw: fxRejas, x, y: D0 + 1.1 + 2.4 * (1 - k), z: BACK_Z - 2.4, w: 1.6, h: 2.13 });
  }
};

// ---------------- el cuarto del chico ----------------
const cuarto = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), x = CUARTO_X;
  if (id === 5 || id === 9) {
    let expr: Expr = "smile";
    if (id === 5) expr = f < 437 ? "smile" : "grin";
    if (id === 9) expr = f < 795 ? "grin" : "laugh";
    sit(cam, out, W_C, x, MESA_Z + 0.6, { expr, blink: lidAt(t, 1) });
    const u = q(((f / 20) % 1), 20);
    fxAt(out, cam, `pc${u}`, 400, 320, (p) => fxPantallaPC(p, u), x + 0.45, D0 + 1.05, MESA_Z - 0.15, 0.56, 0.45, 0.05);
    if (id === 5) icon(out, cam, f, 451, "virus", 300, 300, fxVirus, x - 0.1, D0 + 2.2, MESA_Z, 0.55);
    if (id === 9 && f >= 785) for (let i = 0; i < 12; i++) {
      const f0 = 785 + i * 3, u2 = (f - f0) / FPS;
      if (u2 < 0 || u2 > 1.4) continue;
      out.fx.push({ key: "btc", cw: 200, ch: 200, draw: fxBitcoin, x: x + 1.0 - ((i * 0.53) % 2.0), y: D0 + 3.0 - 2.0 * u2 * u2 - 0.6 * u2, z: MESA_Z - 0.6 - (i % 3) * 0.2, w: 0.26, h: 0.26 });
    }
  }
  if (id === 6) {
    const kx = x - 0.7, kz = BACK_Z - 1.6;
    stand(cam, out, W_C, kx, kz, { expr: f < 499 ? "smile" : "grin", blink: lidAt(t, 1) });
    fxAt(out, cam, "tel", 340, 300, (p) => fxTelefono(p, "#3a3e4a"), kx + 0.3, D0 + 1.45, kz, 0.3, 0.26, 0.15);
    ondas(out, cam, f, 482, 526, kx + 0.55, D0 + 1.6, kz, 0.5);
  }
  if (id === 13) {
    stand(cam, out, W_C, x, BACK_Z - 1.5, { expr: f < 1119 ? "smile" : f < 1176 ? "grin" : "laugh", blink: lidAt(t, 1) });
    icon(out, cam, f, 1112, `codigo${f >= 1138 ? 1 : 0}`, 360, 260, (p) => fxCodigo(p, f >= 1138), x + 0.45, D0 + 2.0, BACK_Z - 1.5, 0.38);
    icon(out, cam, f, 1176, "telFin", 340, 300, (p) => fxTelefono(p, "#d43f3f"), x - 0.45, D0 + 2.0, BACK_Z - 1.5, 0.38);
    ondas(out, cam, f, 1180, TOTAL_F, x - 0.62, D0 + 2.1, BACK_Z - 1.5, 0.3, Math.PI);
  }
};
const TOTAL_F = 9999;

// ---------------- la oficina ----------------
const oficina = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), x = OFICINA_X;
  sit(cam, out, W_E, x, MESA_Z + 0.6, { expr: f < 593 ? "neutral" : f < 620 ? "smile" : "grin", blink: lidAt(t, 2) });
  fxAt(out, cam, "telOf", 340, 300, (p) => fxTelefono(p), x - 0.55, D0 + 0.95, MESA_Z - 0.2, 0.32, 0.28, 0.05);
  icon(out, cam, f, 545, "bocaSoporte", 520, 260, (p) => fxBocadillo(p, "Hola, soy de", "SOPORTE TÉCNICO"), x - 0.05, D0 + 2.3, MESA_Z - 0.6, 0.9);
  if (f >= 620) {
    const k = smooth((f - 620) / 14);
    fxAt(out, cam, "clave", 460, 220, fxClave, x - 0.2 - 0.32 * k, D0 + 1.0 + 0.7 * k, MESA_Z - 0.6 - 0.6 * k, 0.4 + 0.1 * k, 0.19 + 0.05 * k, 0.05);
  }
};

// ---------------- la calle de Florida, de noche ----------------
const calle = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), [cx, , cz] = CALLE, z = cz + 1.2;
  stand(cam, out, W_P, cx - 0.5, z, { expr: "stern", blink: lidAt(t, 3), look: 1 });
  stand(cam, out, W_P2, cx + 0.5, z, { expr: "stern", blink: lidAt(t, 4), look: -1 });
  icon(out, cam, f, 1001, "toc", 420, 200, fxToc, cx, D0 + 2.45, z - 0.5, 0.9);
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
void bodyFront; void bodySide; void fxShadow; void NOINK; void fxBurst; void INK; void SKINS; void puff; void fxStars; void fxPuff; void lin; void walk; void fxOndas; void CALLE;
