// El elenco de las pizzas de Bitcoin como tarjetas planas iluminadas en el mundo 3D (motor de la plantilla del puente: caché de
// dibujos por clave, tarjetas que miran a la cámara sombreadas por cardShade(), parpadeos, sombras de contacto) y
// encima la escena: multitud en el muelle, los seis conspiradores, los ocupantes de los coches, Princip, los gendarmes,
// los soldados de 1914 y los efectos (bomba, explosión, fogonazos, palomas, mapa).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxContact, fxShadow, fxPuff, fxStars, Outfit, Expr, FrontOpts, SideOpts, INK, SKINS } from "./toon";
import { FPS, D0, SHOTS, smooth, clamp01, lin, BACK_Z, FILA_X, FILA_Z, OSO_FILA_X, CAMINO, chicoX, crece, DUCHA, MUELLE_Z, subeX, pasarelaY, MESA_OF, OFICINA_X, CASSINO, osoCassinoX, CAMION, ZOO, ESTATUA, PEANA_H } from "./story";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";
import { SOLDADO, OFICIAL_PL, OFICIAL_GB, CHICO, VETERANO } from "./elenco";
import { osoFront, osoSide, caja, OsoOpts } from "./wojtek";
import { fxSaco, fxChocolate, fxLata, fxNavaja, fxNombre, fxAgua, fxNoAnimales, fxAlta, fxSello, fxRacion, fxEmblema, fxBandera, fxHumo, fxCorazon, fxPregunta } from "./efectos";

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
// Wojtek, 1942-1963
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

/** Wojtek: tarjeta de 600 x 1000 como el resto del elenco (o de perfil caminando con la caja) */
type OsoPose = OsoOpts & { side?: boolean; ph?: number; mirror?: boolean };
const oso = (cam: CamInfo, out: Stage, x: number, z: number, o: OsoPose, sc = 1, y = D0, shadow = true) => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.0 * sc, z)) / sc;
  const [w, h, k] = tier(d), light = light2D(cam, !!o.mirror);
  const oo: OsoOpts = { ...o, light };
  const ph = q(o.ph ?? 0, 24);
  delete (oo as OsoPose).side; delete (oo as OsoPose).ph; delete (oo as OsoPose).mirror;
  const key = `OSO|${o.side ? "S" + ph : "F"}|${fkey(oo)}`;
  out.places.push({ key, x, y, z, scale: sc, mirror: o.mirror, size: [w, h, k], draw: (p) => (o.side ? osoSide(p, oo, ph) : osoFront(p, oo)) });
  if (shadow) blob(out, x, y, z, sc * 1.25);
};
const lidOso = (f: number, i = 0) => lidAt(T(f), 40 + i);

// ---------------- 1 · la fila: soldados saludando... y un oso ----------------
const fila = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  FILA_X.forEach((x, i) => stand(cam, out, { i: 10 + i, o: SOLDADO(i), okey: `sol${i}` }, x, FILA_Z, {
    expr: f >= 117 && i >= 3 ? "grin" : "stern", blink: lidAt(T(f), 10 + i), wave: f >= 30 ? 1 : undefined, look: f >= 120 && i >= 3 ? 1 : 0 }));
  oso(cam, out, OSO_FILA_X, FILA_Z - 0.05, { arms: f >= 30 ? "salute" : "down", expr: f >= 117 ? "happy" : "neutral", cap: true, blink: lidOso(f) });
  if (f >= 120) { const k = boing(f, 120); fxAt(out, cam, "pregunta", 160, 220, fxPregunta, FILA_X[4], D0 + 2.25, FILA_Z, 0.22 * k, 0.3 * k, 0.3, 0.15); }
};

// ---------------- 2-3 · el camino de Irán ----------------
const camino = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const [, , z] = CAMINO, t = T(f);
  const sx = [79.4, 80.15];
  sx.forEach((x, i) => stand(cam, out, { i: 20 + i, o: SOLDADO(i + 1), okey: `solI${i}` }, x, z - 0.2 * i, {
    expr: f < 255 ? "neutral" : f < 291 ? "shock" : "grin", blink: lidAt(t, 20 + i), look: 1 }));
  const cx = id === 2 ? chicoX(f) : 81.3, moving = id === 2 && f < 232;
  const chico: Who = { i: 25, o: CHICO, okey: "chico" };
  if (moving) walk(cam, out, chico, cx, z + 0.1, -1, f, "smile");
  else stand(cam, out, chico, cx, z + 0.1, { expr: f < 291 ? "smile" : "grin", blink: lidAt(t, 25), look: -1 });
  // el saco con el osezno; tras el trueque pasa al soldado
  const peek = smooth((f - 255) / 10);
  const give = id === 3 ? smooth((f - 352) / 10) : 0;
  const bx = cx - 0.32 + (80.55 - (cx - 0.32)) * give, by = D0 + 0.62 + 0.15 * Math.sin(Math.min(1, give) * Math.PI);
  fxAt(out, cam, `saco${q(peek, 10)}`, 360, 420, (p) => fxSaco(p, peek), bx, by, z + 0.1, 0.5, 0.58, 0.3);
  if (id === 3) {
    const items: [number, string, number, number, (p: Pen) => void][] = [[303, "choc", 260, 180, fxChocolate], [332, "lata", 220, 200, fxLata], [346, "navaja", 300, 140, fxNavaja]];
    items.forEach(([f0, key, cw, ch, draw], i) => {
      if (f < f0) return;
      const k = boing(f, f0), w = 0.36 * (cw / 260);
      fxAt(out, cam, key, cw, ch, draw, 80.15 + i * 0.36, D0 + 2.05 + (i % 2) * 0.12, z, w * k, w * (ch / cw) * k, 0.35, (i - 1) * 0.12);
    });
  }
};

// ---------------- 4-7 · el campamento: nombre, crece, lucha, ducha, cerveza ----------------
const campo = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), z = FILA_Z;
  if (id === 4) {
    const sc = crece(f);
    stand(cam, out, { i: 30, o: SOLDADO(0), okey: "sol0" }, -0.6, z + 0.1, { expr: f < 392 ? "smile" : "shock", blink: lidAt(t, 30), look: 1 });
    oso(cam, out, 0.35, z, { arms: f < 392 ? "down" : "wave", expr: f < 392 ? "smile" : "happy", blink: lidOso(f) }, sc);
    if (f >= 372) { const k = boing(f, 372); fxAt(out, cam, "nombre", 520, 220, (p) => fxNombre(p, "WOJTEK"), 0.3, D0 + (f < 392 ? 1.55 : 2.35), z, 0.95 * k, 0.4 * k, 0.4, -0.04); }
    puff(out, cam, f, 392, 0.35, D0 + 0.5, z);
  }
  if (id === 5) {
    // lucha en broma: Wojtek y un soldado abrazados, polvo, otro se ríe
    const sway = 0.06 * Math.sin(f * 0.45);
    oso(cam, out, 0.2 + sway, z, { arms: "hug", expr: "laugh", blink: 0 });
    stand(cam, out, { i: 31, o: SOLDADO(1), okey: "sol1" }, -0.45 + sway, z + 0.25, { expr: f < 437 ? "nervous" : "laugh", blink: lidAt(t, 31), look: 1, tilt: -0.12 + sway });
    stand(cam, out, { i: 32, o: SOLDADO(2), okey: "sol2" }, -1.35, z - 0.4, { expr: "laugh", blink: lidAt(t, 32), look: 1, wave: 1 });
    const u = q(((f - 418) / 14) % 1, 14);
    fxAt(out, cam, `puff${u}`, 300, 300, (p) => fxPuff(p, u), -0.1, D0 + 0.25, z, 1.6, 1.6, 0.5, 0, true);
    if (f >= 427) { const k = boing(f, 427); fxAt(out, cam, "estrellas", 420, 210, (p) => fxStars(p, q((f / 30) % 1, 12)), -0.12, D0 + 2.3, z, 0.9 * k, 0.45 * k, 0.4); }
  }
  if (id === 6) {
    const [dx, , dz] = DUCHA;
    oso(cam, out, dx, dz - 0.05, { arms: "wave", expr: "happy", blink: 0, wet: true });
    const u = q(((f - 457) / 12) % 1, 12);
    fxAt(out, cam, `agua${u}`, 300, 500, (p) => fxAgua(p, u), dx, D0 + 1.25, dz - 0.25, 1.15, 1.95, 0.2, 0, true);
    stand(cam, out, { i: 33, o: SOLDADO(0), okey: "sol0" }, dx - 1.05, dz + 0.4, { expr: f < 466 ? "neutral" : "shock", blink: lidAt(t, 33), look: 1 });
    if (f >= 468) { const k = boing(f, 468); fxAt(out, cam, "pregunta", 160, 220, fxPregunta, dx - 1.05, D0 + 2.3, dz + 0.4, 0.22 * k, 0.3 * k, 0.3, -0.1); }
  }
  if (id === 7) {
    oso(cam, out, 0.35, z, { arms: f >= 520 ? "bottle" : "down", expr: f < 529 ? "smile" : "laugh", blink: lidOso(f) });
    stand(cam, out, { i: 34, o: SOLDADO(1), okey: "sol1" }, -0.55, z + 0.15, { expr: f < 529 ? "smile" : "laugh", blink: lidAt(t, 34), look: 1, wave: f >= 529 ? 1 : undefined });
    if (f >= 532) { const u = q(((f - 532) / 24) % 1, 12); fxAt(out, cam, `corazon${u}`, 240, 240, (p) => fxCorazon(p, u), 0.75, D0 + 2.1, z, 0.42, 0.42, 0.35); }
  }
};

// ---------------- 8-9 · el muelle ----------------
const muelle = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), gz = MUELLE_Z + 0.72;
  if (id === 8) {
    for (let k = 0; k < 4; k++) {
      const x = subeX(f, k);
      if (x < -0.4 || x > 7) continue;
      walk(cam, out, { i: 50 + k, o: SOLDADO(k), okey: `sol${k % 3}` }, x, gz, -1, f, "smile", D0 + pasarelaY(x) + 0.03);
    }
    oso(cam, out, -1.5, MUELLE_Z - 1.6, { arms: f < 610 ? "wave" : "down", expr: f < 620 ? "happy" : "smile", cap: false, blink: lidOso(f) });
  }
  if (id === 9) {
    const shake = f >= 690 ? 0.05 * Math.sin((f - 690) * 1.4) * Math.exp(-(f - 690) / 10) : 0;
    stand(cam, out, { i: 55, o: OFICIAL_GB, okey: "oficialGB" }, -1.05, MUELLE_Z - 0.8, { expr: "stern", blink: lidAt(t, 55), look: -1 });
    const k = boing(f, 650);
    if (f >= 650) fxAt(out, cam, "noAnimales", 560, 520, fxNoAnimales, -1.05 + shake, D0 + 0.98, MUELLE_Z - 0.8, 0.6 * k, 0.56 * k, 0.35, shake * 2);
    oso(cam, out, -2.3, MUELLE_Z - 1.4, { arms: f < 672 ? "down" : "sad", expr: f < 672 ? "smile" : "sad", blink: lidOso(f) });
  }
};

// ---------------- 10 · la oficina: el alta ----------------
const oficina = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), [mx, , mz] = MESA_OF;
  sit(cam, out, { i: 60, o: OFICIAL_PL, okey: "oficialPL" }, mx, mz + 0.62, { expr: f < 733 ? "neutral" : f < 771 ? "stern" : "grin", blink: lidAt(t, 60), look: 1 });
  const cap = f >= 796;
  oso(cam, out, 600.62, mz - 0.75, { arms: f >= 800 && f < 830 ? "salute" : "down", expr: f < 714 ? "sad" : f < 771 ? "neutral" : "happy", cap, blink: lidOso(f) });
  if (f >= 796) puff(out, cam, f, 796, 600.62, D0 + 1.65, mz - 0.75, 0.7);
  // la hoja del alta sobre la mesa y el sello
  if (f >= 728) {
    const k = boing(f, 728), stamped = f >= 753;
    fxAt(out, cam, `alta${stamped ? 1 : 0}`, 400, 520, (p) => fxAlta(p, stamped), 600.05, D0 + 1.7, mz - 0.5, 0.5 * k, 0.65 * k, 0.45, -0.05);
  }
  if (f >= 742 && f < 762) {
    const u = clamp01((f - 742) / 11), y = D0 + 1.95 - 0.35 * Math.sin(Math.min(1, u) * Math.PI * 0.5) + (f >= 753 ? 0.3 * smooth((f - 755) / 7) : 0);
    fxAt(out, cam, "sello", 200, 260, fxSello, 600.1, y + 0.35, mz - 0.5, 0.24, 0.31, 0.6);
  }
  if (f >= 825) { const k = boing(f, 825); fxAt(out, cam, "racion", 320, 220, fxRacion, 600.62, D0 + 2.15, mz - 0.75, 0.55 * k, 0.38 * k, 0.4); }
};

// ---------------- 11 · Montecassino ----------------
const cassino = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), [, , kz] = CASSINO, x = osoCassinoX(f);
  oso(cam, out, x, kz, { side: true, ph: (t * 1.3) % 1, cap: true });
  const sx = x - 1.35;
  out.places.push(person(cam, { i: 70, o: SOLDADO(1), okey: "sol1" }, sx, D0, kz + 0.3, viewOf(cam, sx, kz + 0.3, 1, 0),
    { mode: "stroll", phase: q((t * 1.7) % 1, 30), expr: "grin" }, { mode: "march", phase: q((t * 1.7) % 1, 30), expr: f < 958 ? "neutral" : "grin", stride: 0.6, blink: lidAt(t, 70) }));
  blob(out, sx, D0, kz + 0.3);
  fxAt(out, cam, "cajaMano", 300, 200, (p) => caja(p, 20, 30, 280, 170), sx + 0.12, D0 + 1.12, kz + 0.3, 0.42, 0.28, 0.25);
  stand(cam, out, { i: 71, o: SOLDADO(2), okey: "sol2" }, x + 1.7, kz - 1.0, { expr: f < 950 ? "shock" : "grin", blink: lidAt(t, 71), look: -1, wave: f >= 958 ? 1 : undefined });
  // humo lejano sobre la colina
  for (let i = 0; i < 3; i++) {
    const u = q(((f - 845 + i * 40) / 120) % 1, 30);
    fxAt(out, cam, `humo${u}`, 300, 300, (p) => fxHumo(p, u), -400 + (i - 1) * 28, D0 + 26 + i * 4, -250, 30, 30, 0, 0, true);
  }
};

// ---------------- 12 · el camión con el emblema ----------------
const camion = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const [cx, , cz] = CAMION;
  oso(cam, out, cx + 0.55, cz + 2.0, { arms: f < 1038 ? "salute" : "shell", expr: f < 1019 ? "smile" : "happy", cap: true, blink: lidOso(f) });
  if (f >= 1034) {
    const k = boing(f, 1034);
    fxAt(out, cam, "emblemaGrande", 520, 620, fxEmblema, cx - 0.8, D0 + 1.85, cz + 1.4, 1.15 * k, 1.37 * k, 0.4);
  }
};

// ---------------- 13 · el zoo ----------------
const zoo = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), [zx, , zz] = ZOO;
  oso(cam, out, zx, zz - 1.2, { arms: f >= 1150 ? "wave" : "down", expr: f < 1150 ? "smile" : "happy", blink: lidOso(f) });
  for (const [k, x] of [[0, zx - 0.98], [1, zx + 0.98]] as const)
    stand(cam, out, { i: 80 + k, o: VETERANO(k), okey: `vet${k}` }, x, zz + 2.4, { expr: f < 1154 ? "smile" : "grin", blink: lidAt(t, 80 + k), look: k ? -1 : 1, wave: f >= 1160 && k === 0 ? 1 : undefined });
  if (f >= 1186) { const u = q(((f - 1186) / 24) % 1, 12); fxAt(out, cam, `corazon${u}`, 240, 240, (p) => fxCorazon(p, u), zx + 0.3, D0 + 2.2, zz - 1.2, 0.45, 0.45, 0.35); }
};

// ---------------- 14 · la estatua ----------------
const estatua = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const [sx, , sz] = ESTATUA;
  oso(cam, out, sx, sz, { arms: "shell", expr: "smile", bronze: true }, 1, D0 + PEANA_H + 0.08, false);
  const u = q((f / 40) % 1, 20);
  if (f >= 1229) { const k = boing(f, 1229); fxAt(out, cam, `bandEsc${u}`, 300, 240, (p) => fxBandera(p, "escocia", u * 6.28), sx - 0.98, D0 + 2.35, sz, 0.7 * k, 0.56 * k, 0.4); }
  if (f >= 1246) { const k = boing(f, 1246); fxAt(out, cam, `bandPol${u}`, 300, 240, (p) => fxBandera(p, "polonia", u * 6.28 + 1), sx + 0.98, D0 + 2.35, sz, 0.7 * k, 0.56 * k, 0.4); }
};

/** todo lo que tiene cara en la toma id, cuadro f */
export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  switch (s.scene) {
    case "fila": fila(id, f, cam, out); break;
    case "camino": camino(id, f, cam, out); break;
    case "campo": campo(id, f, cam, out); break;
    case "muelle": muelle(id, f, cam, out); break;
    case "oficina": oficina(id, f, cam, out); break;
    case "cassino": cassino(id, f, cam, out); break;
    case "camion": camion(id, f, cam, out); break;
    case "zoo": zoo(id, f, cam, out); break;
    case "estatua": estatua(id, f, cam, out); break;
  }
  return out;
};
void bodyFront; void bodySide; void fxShadow; void NOINK; void fxBurst; void INK; void SKINS; void lin; void SIT_Y; void BACK_Z; void OFICINA_X;
