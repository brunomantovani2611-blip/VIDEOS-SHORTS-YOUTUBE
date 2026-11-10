// El elenco de las pizzas de Bitcoin como tarjetas planas iluminadas en el mundo 3D (motor de la plantilla del puente: caché de
// dibujos por clave, tarjetas que miran a la cámara sombreadas por cardShade(), parpadeos, sombras de contacto) y
// encima la escena: multitud en el muelle, los seis conspiradores, los ocupantes de los coches, Princip, los gendarmes,
// los soldados de 1914 y los efectos (bomba, explosión, fogonazos, palomas, mapa).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxContact, fxShadow, Outfit, Expr, FrontOpts, SideOpts, INK, SKINS } from "./toon";
import { FPS, D0, SHOTS, smooth, clamp01, lin, LASZLO, JEREMY, MONITOR_L, MONITOR_J, PUERTA_X, PLATO, MESA_Y, BACK_Z } from "./story";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";
import { LASZLO_O, JEREMY_O, REPARTIDOR, FIESTA } from "./elenco";
import { fxBitcoin, fxMonton, fxPrecio, fxForo, fxPorcion, fxTelefono, fxGrafica, fxCalendario, fxConfeti, fxReloj, fxVisto, fxPregunta } from "./efectos";

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
let LNAME: "day" | "golden" = "day";
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
const CONTACT: Record<"day" | "golden", [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  if (LNAME === "day") {
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
// Florida y California, 2010
// ======================================================================================================
export type Stage = { places: Place[]; fx: FxPlace[] };
const T = (f: number) => f / FPS;
const FRONT = { side: false, mirror: false };
const W_L: Who = { i: 1, o: LASZLO_O, okey: "laszlo" };
const W_J: Who = { i: 2, o: JEREMY_O, okey: "jeremy" };
const SIT_Y = 0.45;
const stand = (cam: CamInfo, out: Stage, who: Who, x: number, z: number, fo: FrontOpts, sc = 1) => {
  out.places.push(person(cam, who, x, D0, z, FRONT, { mode: "stand", ...fo }, {}, sc));
  blob(out, x, D0, z, sc);
};
const sit = (cam: CamInfo, out: Stage, who: Who, x: number, z: number, fo: FrontOpts) =>
  out.places.push(person(cam, who, x, D0 + SIT_Y, z, FRONT, { mode: "sit", ...fo }, {}));
const fxAt = (out: Stage, cam: CamInfo, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, toward = 0.12, rot = 0, soft = false) => {
  const dx = cam.pos.x - x, dz = cam.pos.z - z, d = Math.hypot(dx, dz) || 1;
  out.fx.push({ key, cw, ch, draw, x: x + (dx / d) * toward, y, z: z + (dz / d) * toward, w, h, rot, soft });
};
const pop = (f: number, f0: number, n = 6) => smooth((f - f0) / n);
const coin = (out: Stage, cam: CamInfo, f: number, x: number, y: number, z: number, s: number, f0: number) => {
  const u = q(((f - f0) / 30) % 1, 12), k = pop(f, f0);
  fxAt(out, cam, `btc${u}`, 220, 220, (p) => fxBitcoin(p, u), x, y + 0.03 * Math.sin(f * 0.2), z, s * k, s * k, 0.35);
};

// ---------------- el cuarto de Laszlo ----------------
const laszlo = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), [x, , z] = LASZLO;
  let expr: Expr = "smile";
  if (id === 2) expr = f < 161 ? "smile_closed" : "grin";
  if (id === 3) expr = f < 333 ? "grin" : "nervous";
  if (id === 4) expr = "grin";
  if (id === 5) expr = f < 512 ? "neutral" : "dazed";
  if (id === 7) expr = f < 733 ? "relief_open" : "laugh";
  if (id === 12) expr = f < 1231 ? "smile_closed" : "grin";
  if (id !== 7) sit(cam, out, W_L, x, z, { expr, blink: lidAt(t, 1), look: id === 4 ? 1 : 0 });
  else stand(cam, out, W_L, 601.75, z - 0.25, { expr, blink: lidAt(t, 1), look: 1, wave: f >= 733 ? 1 : undefined });
  if (id === 2 && f >= 228) coin(out, cam, f, x + 0.35, D0 + 2.2, z, 0.34, 228);
  if (id === 3) {
    if (f < 330) coin(out, cam, f, MONITOR_L[0], MONITOR_L[1] + 0.55, MONITOR_L[2], 0.3, 262);
    if (f >= 336) { const k = pop(f, 336); out.fx.push({ key: "pregunta", cw: 160, ch: 220, draw: fxPregunta, x, y: D0 + 1.95, z, w: 0.26 * k, h: 0.36 * k, rot: 0.12 }); }
  }
  if (id === 4) {
    const k = clamp01((f - 412) / 64);
    out.fx.push({ key: `foro${q(k, 40)}`, cw: 640, ch: 440, draw: (p) => fxForo(p, k), x: MONITOR_L[0], y: MONITOR_L[1] + 0.025, z: MONITOR_L[2] - 0.05, w: 0.6, h: 0.41 });
  }
  if (id === 5) {
    const u = q(((f - 488) / 56) % 1, 30);
    out.fx.push({ key: `reloj${u}`, cw: 240, ch: 240, draw: (p) => fxReloj(p, (f - 488) / 56), x: 599.8, y: D0 + 2.15, z: BACK_Z - 0.05, w: 0.4, h: 0.4 });
  }
  if (id === 7) {
    // el repartidor en la puerta con las dos cajas
    const k = smooth((f - 687) / 10);
    stand(cam, out, { i: 3, o: REPARTIDOR, okey: "repartidor" }, PUERTA_X - 0.05, BACK_Z - 0.35 - 0.3 * k, { expr: "smile", blink: lidAt(t, 3), look: -1 });
    if (f < 733) {
      out.fx.push({ key: "cajas", cw: 400, ch: 240, draw: (p) => { p.poly([[20, 120], [380, 120], [380, 220], [20, 220]], "#d8b47a", 7); p.poly([[30, 30], [370, 30], [370, 120], [30, 120]], "#e9d2a6", 7); p.ell(200, 75, 60, 26, "#c6363c", 0); }, x: PUERTA_X - 0.1, y: D0 + 1.12, z: BACK_Z - 0.75 - 0.3 * k, w: 0.55, h: 0.33 });
    } else fxAt(out, cam, "porcion", 240, 280, fxPorcion, 601.75 + 0.32, D0 + 1.85, z - 0.25, 0.26, 0.3, 0.25, -0.5);
  }
  if (id === 12 && f >= 1180) fxAt(out, cam, "porcion", 240, 280, fxPorcion, x + 0.38, D0 + 1.45, z, 0.24, 0.28, 0.3, -0.3);
  if (id === 12 && f >= 1255) { const k = pop(f, 1255); fxAt(out, cam, "visto", 240, 240, fxVisto, x - 0.4, D0 + 1.95, z, 0.26 * k, 0.26 * k, 0.3); }
};

// ---------------- el cuarto de Jeremy ----------------
const jeremy = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), [x, , z] = JEREMY;
  let expr: Expr = "neutral";
  if (id === 6) expr = f < 597 ? "neutral" : f < 617 ? "smile" : f < 644 ? "grin" : "laugh";
  if (id === 8) expr = f < 826 ? "grin" : "laugh";
  sit(cam, out, W_J, x, z, { expr, blink: lidAt(t, 2), look: id === 6 && f < 617 ? 1 : 0, wave: id === 6 && f >= 644 ? 1 : undefined });
  if (id === 6 && f >= 617 && f < 644) { const k = pop(f, 617); fxAt(out, cam, "visto", 240, 240, fxVisto, MONITOR_J[0], MONITOR_J[1] + 0.55, MONITOR_J[2], 0.3 * k, 0.3 * k, 0.3); }
  if (id === 6 && f >= 644) fxAt(out, cam, "telefono", 140, 240, fxTelefono, x - 0.3, D0 + 1.9, z, 0.13, 0.22, 0.3, 0.2);
  if (id === 8) {
    const k = pop(f, 780, 10);
    fxAt(out, cam, "monton", 420, 300, fxMonton, x - 0.65, D0 + 1.0, z, 0.9 * k, 0.64 * k, 0.4);
  }
};

// ---------------- el plató ----------------
const plato = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const [x, , z] = PLATO;
  const tag = (label: string, f0: number, key: string) => {
    const k = pop(f, f0, 8), sw = 0.06 * Math.sin((f - f0) * 0.12) * Math.exp(-(f - f0) / 60);
    out.fx.push({ key, cw: 520, ch: 260, draw: (p) => fxPrecio(p, label), x, y: D0 + MESA_Y + 0.65, z: z - 0.3, w: 0.8 * k, h: 0.4 * k, rot: sw });
  };
  if (id === 1 && f >= 46) tag("¿ $ ?", 46, "precio1");
  if (id === 10 && f >= 1030) tag("1.000 M$", 1030, "precio2");
  if (id === 9) {
    const k = lin([[870, 0.05], [897, 0.35], [911, 0.4], [914, 0.65], [928, 0.7], [931, 1.0], [947, 1.0]], f);
    out.fx.push({ key: `grafica${q(k, 60)}`, cw: 600, ch: 600, draw: (p) => fxGrafica(p, k), x, y: D0 + 1.85, z: z - 0.5, w: 1.45, h: 1.45 });
  }
  if (id === 10) for (let k = 0; k < 12; k++) {
    const f0 = 980 + k * 6, u = (f - f0) / FPS;
    if (u < 0 || u > 1.4) continue;
    const s = q(((f - f0) / 20) % 1, 10);
    out.fx.push({ key: `btc${s}`, cw: 220, ch: 220, draw: (p) => fxBitcoin(p, s), x: x - 0.9 + ((k * 0.37) % 1.8), y: D0 + 2.9 - 2.0 * u * u, z: z - 0.2 - (k % 3) * 0.2, w: 0.22, h: 0.22 });
  }
  if (id === 11) {
    const k = pop(f, 1090, 8);
    out.fx.push({ key: "calendario", cw: 420, ch: 460, draw: fxCalendario, x: x + 0.05, y: D0 + 1.95, z: z - 0.2, w: 0.9 * k, h: 0.98 * k, rot: -0.04 });
    if (f >= 1140) { const u = q(((f - 1140) / 30) % 1, 15); out.fx.push({ key: `confeti${u}`, cw: 400, ch: 400, draw: (p) => fxConfeti(p, u), x, y: D0 + 2.2, z: z - 0.8, w: 2.2, h: 2.2 }); }
    for (const [dx, v] of [[-0.62, 1], [0.62, 4]] as const) stand(cam, out, { i: 20 + v, o: FIESTA(v), okey: `fi${v}` }, x + dx, z - 1.0, { expr: f < 1148 ? "smile" : "laugh", blink: lidAt(T(f), 20 + v), wave: f >= 1148 ? 1 : undefined, look: dx < 0 ? 1 : -1 });
  }
};

/** todo lo que tiene cara en la toma id, cuadro f */
export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  switch (s.scene) {
    case "plato": plato(id, f, cam, out); break;
    case "laszlo": laszlo(id, f, cam, out); break;
    case "jeremy": jeremy(id, f, cam, out); break;
  }
  return out;
};
void bodyFront; void bodySide; void fxShadow; void NOINK; void viewOf; void MONITOR_J;
