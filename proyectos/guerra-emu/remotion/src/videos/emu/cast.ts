// El elenco de las pizzas de Bitcoin como tarjetas planas iluminadas en el mundo 3D (motor de la plantilla del puente: caché de
// dibujos por clave, tarjetas que miran a la cámara sombreadas por cardShade(), parpadeos, sombras de contacto) y
// encima la escena: multitud en el muelle, los seis conspiradores, los ocupantes de los coches, Princip, los gendarmes,
// los soldados de 1914 y los efectos (bomba, explosión, fogonazos, palomas, mapa).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxContact, fxShadow, fxPuff, fxStars, Outfit, Expr, FrontOpts, SideOpts, INK, SKINS } from "./toon";
import { FPS, D0, SHOTS, smooth, clamp01, lin, BACK_Z, CALLE, CUARTO_X, OFICINA_X, PLATO_X, MESA_Z, RZ, GUN6, EMU6, YAW6, truckX } from "./story";
import { MUZZLE } from "./figura3d";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";
import { MAYOR, SOLDADO, SOLDADO2, GRANJERO, EMU, EMU2, EMU3, EMU_REY } from "./elenco";
import { fxOndas, fxBocadillo, fxSigno, fxSello, fxNombreL, fxCartel, fxBala, fxFogonazo, fxMarcador } from "./efectos";

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
const W_M: Who = { i: 1, o: MAYOR, okey: "mayor" };
const W_S1: Who = { i: 2, o: SOLDADO, okey: "soldado" };
const W_S2: Who = { i: 3, o: SOLDADO2, okey: "soldado2" };
const W_G: Who = { i: 4, o: GRANJERO, okey: "granjero" };
const EMUS = [EMU, EMU2, EMU3];
const emuWho = (i: number): Who => ({ i: 20 + i, o: EMUS[i % 3], okey: "emu" + (i % 3) });
const W_REY: Who = { i: 60, o: EMU_REY, okey: "emurey" };
const L = (f: number, w: Who) => lidAt(T(f), w.i);

type EmuOpts = { mode: "stand" | "peck" | "run" | "walk" | "jump"; expr?: Expr; phase?: number; yaw?: number; look?: number; hat?: boolean; turn?: number };
/** un emú 3D: mode = quieto, picoteando, corriendo, caminando o saltando */
const emu = (cam: CamInfo, out: Stage, who: Who, x: number, z: number, f: number, o: EmuOpts, sc = 1, y = D0) => {
  const sp = o.mode === "run" ? 2.6 : o.mode === "walk" ? 1.5 : o.mode === "jump" ? 1.6 : o.mode === "peck" ? 0.7 : 0.4;
  const phase = o.phase ?? (T(f) * sp + hh(who.i, 3)) % 1;
  out.places.push({ key: "emu", draw: () => {}, x, y, z, scale: sc,
    fig: { o: who.o, okey: who.okey, mode: o.mode, expr: o.expr ?? "neutral", blink: L(f, who), look: o.look ?? 0, phase, yaw: o.yaw, hat: o.hat, turn: o.turn } });
  if (y <= D0 + 0.01) blob(out, x, D0, z, sc * 1.25);
};
/** una manada picoteando en el trigo: n emúes en [x0, x1] x [z0, z1] */
const manada = (cam: CamInfo, out: Stage, f: number, n: number, x0: number, x1: number, z0: number, z1: number, base = 0, skip: (x: number, z: number) => boolean = () => false) => {
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * hh(i + base, 1), z = z0 + (z1 - z0) * hh(i + base, 2);
    if (skip(x, z)) continue;
    emu(cam, out, emuWho(i + base), x, z, f, { mode: hh(i + base, 4) < 0.7 ? "peck" : "stand", yaw: hh(i + base, 5) < 0.4 ? undefined : hh(i + base, 6) * 6.28 });
  }
};
const fogonazo = (out: Stage, cam: CamInfo, f: number, gx: number, gz: number, yaw: number, s = 1) => {
  if (f % 3 === 2) return;
  const [mx, my, mz] = MUZZLE.lewis, u = q((f % 3) / 3, 3);
  fxAt(out, cam, `fog${u}`, 300, 300, (p) => fxFogonazo(p, u), gx + Math.sin(yaw) * mz + mx, D0 + my, gz + Math.cos(yaw) * mz, 0.62 * s, 0.62 * s, 0.05, f * 0.7);
};

// ---------------- el plató azul (+x a la izquierda del cuadro) ----------------
const plato = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const x = PLATO_X, z = BACK_Z - 0.5, zc = BACK_Z - 1.6;
  if (id === 4) {
    if (f >= 268) stand(cam, out, W_M, x, zc, { expr: f < 300 ? "smile" : "grin", blink: L(f, W_M) }, Math.max(0.01, boing(f, 268)));
    icon(out, cam, f, 280, "nombreM", 640, 200, (p) => fxNombreL(p, "MAYOR MEREDITH"), x, D0 + 2.5, zc, 1.2, 0, 0.3);
    if (f >= 294) stand(cam, out, W_S1, x + 0.78, zc + 0.35, { expr: "stern", blink: L(f, W_S1), look: -1 }, Math.max(0.01, boing(f, 294)));
    if (f >= 298) stand(cam, out, W_S2, x - 0.78, zc + 0.35, { expr: "stern", blink: L(f, W_S2), look: 1 }, Math.max(0.01, boing(f, 298)));
  }
  if (id === 9) {
    const n = Math.round(9860 * smooth((f - 690) / 34));
    icon(out, cam, f, 684, `balas${n}`, 560, 240, (p) => fxCartel(p, "BALAS GASTADAS", n.toLocaleString("es-AR"), "#b8322f"), x, D0 + 2.3, z - 0.6, 1.5, 0, 0.05);
    for (let i = 0; i < 34; i++) {
      const f0 = 688 + i * 1.1, u = clamp01((f - f0) / 12);
      if (f < f0) continue;
      const px = x + (hh(i, 7) - 0.5) * 1.9, row = Math.floor(i / 9), py = D0 + 0.2 + row * 0.16 + hh(i, 8) * 0.05;
      out.fx.push({ key: "bala", cw: 120, ch: 300, draw: fxBala, x: px, y: D0 + 1.7 + (py - D0 - 1.7) * u * u, z: zc + 0.1 + hh(i, 9) * 0.4, w: 0.16, h: 0.4,
        rot: (u < 1 ? u * 5 : 0) + (hh(i, 10) - 0.5) * 2.6 + (u >= 1 ? Math.PI / 2 * (hh(i, 11) < 0.5 ? 1 : -1) : 0) });
    }
  }
};
const cuarto = (_id: number, _f: number, _cam: CamInfo, _out: Stage) => {};
const oficina = (_id: number, _f: number, _cam: CamInfo, _out: Stage) => {};

// ---------------- el campo de trigo (+x a la derecha del cuadro) ----------------
const calle = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const cx = CALLE[0], z = RZ;
  if (id === 1) {
    const sq = [W_M, W_S1, W_S2];
    sq.forEach((w, i) => walk(cam, out, w, cx - 1.0 - i * 0.95 + 0.026 * f, z + (i === 1 ? -0.35 : 0.25), 1, f, i ? "stern" : "grin"));
    manada(cam, out, f, 10, cx - 6, cx + 8, -16, -28);
  }
  if (id === 2) {
    const rise = (f0: number) => D0 - 1.45 * (1 - boing(f, f0));
    emu(cam, out, emuWho(0), cx + 0.4, -12.4, f, { mode: "stand", expr: f < 122 ? "neutral" : "smile", look: f < 118 ? 0 : 1, turn: 0 }, 1, rise(108));
    if (f >= 122) signo(out, cam, f, 122, "?", cx + 0.75, D0 + 2.05, -12.4, 0.3);
    emu(cam, out, emuWho(1), cx - 0.75, -13.6, f, { mode: "stand", expr: "neutral", look: 1 }, 1, rise(124));
    emu(cam, out, emuWho(2), cx + 1.6, -14.2, f, { mode: "stand", expr: "shock", look: -1 }, 1, rise(129));
  }
  if (id === 3) {
    manada(cam, out, f, 34, cx - 7, cx + 7, -12.0, -26, 3);
    stand(cam, out, W_G, cx - 0.7, z - 0.4, { expr: f < 224 ? "stern" : "shout", blink: L(f, W_G), look: 1 });
    icon(out, cam, f, 156, "veintemil", 560, 240, (p) => fxCartel(p, "20.000", "EMÚES", "#b8322f"), cx + 0.3, D0 + 3.2, -9.5, 1.5, 0, 0.05);
  }
  if (id === 5) {
    stand(cam, out, W_M, cx - 0.35, z + 0.2, { expr: f < 360 ? "smile" : "grin", blink: L(f, W_M), look: 1 });
    manada(cam, out, f, 8, cx - 3, cx + 5, -15, -24, 40);
  }
  if (id === 6) {
    const fire = (f >= 395 && f < 422) || (f >= 440 && f < 470);
    stand(cam, out, W_S1, GUN6[0] - 0.6, z + 0.6, { expr: fire ? "shout" : f < 395 ? "stern" : "shock", blink: L(f, W_S1), look: 1 });
    if (fire) fogonazo(out, cam, f, GUN6[0], GUN6[2], YAW6);
    for (let i = 0; i < 16; i++) {
      const a = hh(i, 12) * Math.PI * 2, r0 = 0.4 + 2.2 * Math.sqrt(hh(i, 13));
      const ex = EMU6[0] + Math.sin(a) * r0, ez = EMU6[1] + Math.cos(a) * r0, f0 = 424 + Math.floor(hh(i, 14) * 6);
      if (f < f0) emu(cam, out, emuWho(i), ex, ez, f, { mode: f < 398 ? "peck" : "stand", expr: f < 398 ? "neutral" : "shock", yaw: f < 398 ? a + 2 : undefined, look: Math.round(Math.sin(a)) });
      else {
        const d = Math.min(14, 0.17 * (f - f0)) ;
        emu(cam, out, emuWho(i), ex + Math.sin(a) * d, ez + Math.cos(a) * d, f, { mode: "run", expr: "shock", yaw: a });
      }
    }
    for (let k = 0; k < 16; k++) {
      const f0 = 398 + k * 4.5;
      if (f0 > 468) break;
      puff(out, cam, f, f0, EMU6[0] + (hh(k, 15) - 0.5) * 5, D0 + 0.25, EMU6[1] + (hh(k, 16) - 0.5) * 4, 0.6);
    }
  }
  if (id === 7) {
    const tx = truckX(f);
    stand(cam, out, W_S1, tx - 0.4, z + 0.75, { expr: f < 546 ? "shout" : "shock", blink: L(f, W_S1), look: 1 }, 1, D0 + 1.02);
    stand(cam, out, W_S2, tx - 1.3, z - 0.15, { expr: f < 546 ? "stern" : "pained", blink: L(f, W_S2), look: 1 }, 1, D0 + 1.02);
    for (let i = 0; i < 6; i++) {
      const ex = truckX(492) + 3.6 + i * 1.1 + hh(i, 17) * 0.6 + 0.2 * (f - 492);
      emu(cam, out, emuWho(i + 3), ex, z + (hh(i, 18) - 0.5) * 2.6, f, { mode: "run", expr: f > 550 && i < 2 ? "grin" : "neutral", yaw: Math.PI / 2 });
    }
    for (let k = 0; k < 18; k++) { const f0 = 490 + k * 5; puff(out, cam, f, f0, truckX(f0) - 2.3, D0 + 0.35, z + 0.3 + (k % 2 ? 0.5 : -0.5), 0.9); }
  }
  if (id === 8) {
    const fire = f >= 600 && f < 638, jam = f >= 639;
    stand(cam, out, W_S1, cx - 0.35, z + 0.3, { expr: jam ? "shock" : fire ? "shout" : "stern", blink: L(f, W_S1), look: 1 });
    if (fire) fogonazo(out, cam, f, cx + 0.35, z - 0.2, YAW6, 0.8);
    if (jam) {
      puff(out, cam, f, 640, cx + 0.45, D0 + 1.05, z - 0.1, 0.8);
      icon(out, cam, f, 640, "clic", 520, 260, (p) => fxBocadillo(p, "¡CLIC!"), cx + 0.3, D0 + 2.3, z - 0.4, 1.0, 0, 0.3);
    }
    emu(cam, out, emuWho(5), cx + 1.75, -13.8, f, { mode: f < 640 ? "peck" : "stand", expr: f < 645 ? "neutral" : "laugh", look: -1 });
  }
  if (id === 10) {
    emu(cam, out, emuWho(0), cx + 0.4, -12.4, f, { mode: f < 750 ? "peck" : "stand", expr: f < 750 ? "neutral" : f < 759 ? "stern" : "smile_closed" });
    manada(cam, out, f, 12, cx - 4, cx + 5, -13.4, -22, 50, (x, z2) => Math.abs(x - cx - 0.4) < 1.7 && z2 > -21);
  }
  if (id === 11) {
    stand(cam, out, W_M, cx - 0.6, z + 0.15, { expr: f < 841 ? "neutral" : f < 889 ? "shock" : "grin", blink: L(f, W_M), look: 1 });
    emu(cam, out, emuWho(1), cx + 0.6, z - 0.1, f, { mode: "stand", expr: f < 860 ? "neutral" : "smile_closed", look: -1 });
    manada(cam, out, f, 8, cx - 5, cx + 6, -14, -24, 60);
    if (f < 877) icon(out, cam, f, 794, "quote1", 520, 260, (p) => fxBocadillo(p, "«Con soldados como", "ESTOS PÁJAROS…"), cx - 0.2, D0 + 2.55, z - 0.2, 1.35, 0, 0.3);
    else icon(out, cam, f, 877, "quote2", 520, 260, (p) => fxBocadillo(p, "…podríamos enfrentar", "A CUALQUIER EJÉRCITO»"), cx - 0.2, D0 + 2.55, z - 0.2, 1.35, 0, 0.3);
  }
  if (id === 12) {
    const sq = [W_M, W_S1, W_S2];
    sq.forEach((w, i) => walk(cam, out, w, cx + 0.2 + i * 0.85 - 0.03 * (f - 940), z + (i === 1 ? -0.35 : 0.25), -1, f, "pained"));
    manada(cam, out, f, 10, cx - 5, cx + 5, -13, -22, 70);
  }
  if (id === 13) {
    emu(cam, out, W_REY, cx, z - 0.2, f, { mode: f < 986 ? "stand" : "jump", expr: f < 986 ? "smile_closed" : "laugh" });
    emu(cam, out, emuWho(1), cx + 0.8, z + 0.1, f, { mode: f < 990 ? "stand" : "jump", expr: "laugh", look: -1, phase: f < 990 ? undefined : (T(f) * 1.6 + 0.4) % 1 });
    emu(cam, out, emuWho(2), cx - 0.8, z + 0.1, f, { mode: f < 994 ? "stand" : "jump", expr: "laugh", look: 1, phase: f < 994 ? undefined : (T(f) * 1.6 + 0.7) % 1 });
    manada(cam, out, f, 8, cx - 5, cx + 6, -14, -24, 80);
    icon(out, cam, f, 1003, "marcador", 600, 300, (p) => fxMarcador(p, "1", "0"), cx, D0 + 2.75, z - 0.9, 1.25, 0, 0.3);
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
void bodyFront; void bodySide; void fxShadow; void NOINK; void fxBurst; void INK; void SKINS; void puff; void fxStars; void fxPuff; void lin; void fxOndas; void CALLE; void ondas; void boing; void fxSello; void CUARTO_X; void OFICINA_X; void MESA_Z;
