// El elenco de las pizzas de Bitcoin como tarjetas planas iluminadas en el mundo 3D (motor de la plantilla del puente: caché de
// dibujos por clave, tarjetas que miran a la cámara sombreadas por cardShade(), parpadeos, sombras de contacto) y
// encima la escena: multitud en el muelle, los seis conspiradores, los ocupantes de los coches, Princip, los gendarmes,
// los soldados de 1914 y los efectos (bomba, explosión, fogonazos, palomas, mapa).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxContact, fxShadow, fxPuff, fxStars, Outfit, Expr, FrontOpts, SideOpts, INK, SKINS } from "./toon";
import { FPS, D0, SHOTS, smooth, clamp01, lin, BACK_Z, BARCELONA, LISBOA, GB_X, DE_X, MESA_X, PLATO_X, MESA_Z } from "./story";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";
import { GARBO, INGLES, AGENTE, ALEMAN } from "./elenco";
import { fxHojas, fxCorazonUK, fxNo, fxContrato, fxCiudad, fxGuia, fxPlano, fxRevista, fxEspia, fxBillete, fxMorse, fxCanal, fxCruzHierro, fxMedallaGB, fxSigno, fxMaleta, fxX2 } from "./efectos";

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
// Garbo, 1941-1944
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
const W_G: Who = { i: 1, o: GARBO, okey: "garbo" };
const W_I: Who = { i: 2, o: INGLES, okey: "ingles" };
const W_A: Who = { i: 3, o: AGENTE, okey: "agente" };
const W_D: Who = { i: 4, o: ALEMAN, okey: "aleman" };
/** medallas en el pecho de Garbo (para el final y las entregas) */
const medallas = (out: Stage, cam: CamInfo, x: number, y: number, z: number, cruz: boolean, gb: boolean, s = 1) => {
  if (cruz) fxAt(out, cam, "cruz", 240, 300, fxCruzHierro, x - 0.11 * s, y, z, 0.15 * s, 0.19 * s, 0.12);
  if (gb) fxAt(out, cam, "medGB", 240, 300, fxMedallaGB, x + 0.11 * s, y, z, 0.15 * s, 0.19 * s, 0.12);
};

// ---------------- el escritorio de Lisboa (mirando a +z: +x a la izquierda) ----------------
const mesa = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), x = MESA_X, z = MESA_Z + 0.6;
  let expr: Expr = "smile";
  if (id === 1) expr = f < 87 ? "neutral" : f < 114 ? "smile" : "grin";
  if (id === 6) expr = f < 558 ? "smile" : "grin";
  if (id === 7) expr = f < 626 ? "smile" : "laugh";
  if (id === 10) expr = f < 953 ? "neutral" : "grin";
  sit(cam, out, W_G, x, z, { expr, blink: id === 1 && f >= 120 && f < 128 ? 1 : lidAt(t, 1) });
  if (id === 1 && f >= 40) { const u = q(((f - 40) / 40) % 1, 20); fxAt(out, cam, `hojas${u}`, 400, 400, (p) => fxHojas(p, u), x, D0 + 1.7, z - 0.6, 1.4, 1.4, 0.3); }
  if (id === 6) {
    icon(out, cam, f, 558, "guia", 300, 380, fxGuia, x + 0.62, D0 + 1.7, z - 0.9, 0.42, 0.12);
    icon(out, cam, f, 584, "plano", 360, 280, fxPlano, x, D0 + 2.35, z - 0.9, 0.55, -0.05);
    icon(out, cam, f, 596, "revista", 300, 380, fxRevista, x - 0.62, D0 + 1.7, z - 0.9, 0.42, -0.12);
  }
  if (id === 7) [[626, x + 0.65, 0], [640, x, 1], [655, x - 0.65, 2]].forEach(([f0, xx, k]) =>
    icon(out, cam, f, f0, `espia${k}`, 220, 260, (p) => fxEspia(p, k, false), xx, D0 + 2.4, BACK_Z - 0.05, 0.5, 0, 0.02));
  if (id === 10) { const u = q(((f - 903) / 30) % 1, 15); fxAt(out, cam, `morse${u}`, 420, 300, (p) => fxMorse(p, u), x - 0.6, D0 + 1.95, z - 0.7, 1.2, 0.86, 0.3); }
};

// ---------------- Barcelona ----------------
const barcelona = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), [bx, , bz] = BARCELONA;
  if (id === 2) {
    stand(cam, out, W_G, bx, bz + 1.0, { expr: f < 201 ? "smile" : "grin", blink: lidAt(t, 1) });
    icon(out, cam, f, 211, "corazonUK", 260, 240, fxCorazonUK, bx + 0.6, D0 + 2.3, bz + 1.0, 0.55);
  }
  if (id === 14) {
    stand(cam, out, W_G, bx, bz + 1.2, { expr: f < 1293 ? "grin" : "laugh", blink: f >= 1300 && f < 1310 ? 1 : lidAt(t, 1) });
    medallas(out, cam, bx, D0 + 1.12, bz + 1.2, true, true);
    icon(out, cam, f, 1293, "x2", 240, 200, fxX2, bx + 0.42, D0 + 2.05, bz + 1.2, 0.45);
  }
};

// ---------------- despachos ----------------
const gb = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), x = GB_X, zo = MESA_Z + 0.6, zg = MESA_Z - 0.9;
  if (id === 3) {
    const shake = f >= 283 && f < 300 ? 0.6 * Math.sin((f - 283) * 1.2) : 0;
    sit(cam, out, W_I, x, zo, { expr: f < 283 ? "neutral" : "stern", blink: lidAt(t, 2), look: shake });
    stand(cam, out, W_G, x + 0.65, zg, { expr: f < 298 ? "smile" : "pained", blink: lidAt(t, 1), look: -1 });
    icon(out, cam, f, 298, "no", 360, 240, fxNo, x - 0.15, D0 + 1.9, zg + 0.3, 0.9, 0, 0.3);
  }
  if (id === 8) {
    sit(cam, out, W_I, x, zo, { expr: f < 711 ? "neutral" : "shock", blink: lidAt(t, 2) });
    stand(cam, out, W_A, x - 0.85, zg + 0.2, { expr: f < 711 ? "smile" : f < 729 ? "shock" : "grin", blink: lidAt(t, 3), look: 1, wave: f >= 729 ? 1 : undefined });
    stand(cam, out, W_G, x + 0.85, zg, { expr: f < 711 ? "smile" : "grin", blink: lidAt(t, 1), look: -1 });
    signo(out, cam, f, 700, "!", x, D0 + 2.6, zo);
    icon(out, cam, f, 729, "contratoGB", 360, 460, (p) => fxContrato(p, true, "MI5"), x + 0.2, D0 + 1.05, zg - 0.1, 0.34, 0.06);
  }
  if (id === 13) {
    sit(cam, out, W_I, x, zo, { expr: "grin", blink: lidAt(t, 2) });
    stand(cam, out, W_G, x + 0.6, zg, { expr: f < 1225 ? "smile" : "grin", blink: lidAt(t, 1), look: -1 });
    const k = smooth((f - 1210) / 14), mx = x + 0.2 + (0.71 - 0.2) * k, my = D0 + 1.6 - (1.6 - 1.12) * k;
    if (f >= 1205) fxAt(out, cam, "medGB", 240, 300, fxMedallaGB, mx, my, zg, 0.15 * (1 + 0.6 * (1 - k)), 0.19 * (1 + 0.6 * (1 - k)), 0.14);
    medallas(out, cam, x + 0.6, D0 + 1.12, zg, true, false);
  }
};
const de = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), x = DE_X, zo = MESA_Z + 0.6, zg = MESA_Z - 0.9;
  if (id === 4) {
    sit(cam, out, W_D, x, zo, { expr: f < 362 ? "stern" : f < 384 ? "smile" : "grin", blink: lidAt(t, 4) });
    stand(cam, out, W_G, x + 0.65, zg, { expr: f < 332 ? "smile" : "grin", blink: lidAt(t, 1), look: -1 });
    icon(out, cam, f, 384, "contrato", 360, 460, (p) => fxContrato(p, f >= 400), x + 0.25, D0 + 1.05, zg + 0.1, 0.36, 0.05);
    icon(out, cam, f, 425, "londres", 420, 280, (p) => fxCiudad(p, "LONDRES", false), x + 0.1, D0 + 2.45, zo, 0.75);
  }
  if (id === 12) {
    sit(cam, out, W_D, x, zo, { expr: "grin", blink: lidAt(t, 4) });
    stand(cam, out, W_G, x + 0.6, zg, { expr: f < 1175 ? "smile" : "grin", blink: lidAt(t, 1), look: -1 });
    const k = smooth((f - 1160) / 14), mx = x + 0.2 + (0.49 - 0.2) * k, my = D0 + 1.6 - (1.6 - 1.12) * k;
    if (f >= 1155) fxAt(out, cam, "cruz", 240, 300, fxCruzHierro, mx, my, zg, 0.15 * (1 + 0.6 * (1 - k)), 0.19 * (1 + 0.6 * (1 - k)), 0.14);
  }
};

// ---------------- Lisboa ----------------
const lisboa = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const [lx, , lz] = LISBOA, x = lin([[450, lx + 1.6], [505, lx - 0.1], [526, lx - 0.1]], f), moving = f < 505;
  if (moving) walk(cam, out, W_G, x, lz + 2.2, -1, f, "smile");
  else stand(cam, out, W_G, x, lz + 2.2, { expr: "grin", blink: lidAt(T(f), 1) });
  fxAt(out, cam, "maleta", 260, 200, fxMaleta, x + 0.32, D0 + 0.45, lz + 2.3, 0.4, 0.31, 0.1);
  icon(out, cam, f, 462, `londresX${f >= 478 ? 1 : 0}`, 420, 280, (p) => fxCiudad(p, "LONDRES", f >= 478), lx, D0 + 3.0, lz + 1.6, 1.1);
};

// ---------------- el plató: los 27 espías y el mapa (mirando a +z: +x a la izquierda) ----------------
const plato = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), x = PLATO_X;
  if (id === 9) {
    const falso = f >= 823;
    for (let i = 0; i < 27; i++) {
      const r = Math.floor(i / 5), c = i % 5, f0 = 770 + i * 1.2;
      if (f < f0) continue;
      const k = boing(f, f0);
      out.fx.push({ key: `espia${i % 9}|${falso ? 1 : 0}`, cw: 220, ch: 260, draw: (p) => fxEspia(p, i % 9, falso), x: x + 1.0 - c * 0.5, y: D0 + 3.45 - r * 0.55, z: BACK_Z - 0.06, w: 0.42 * k, h: 0.5 * k });
    }
    if (f >= 849) for (let k = 0; k < 14; k++) {
      const f0 = 849 + k * 3.5, u = (f - f0) / FPS;
      if (u < 0 || u > 1.6) continue;
      out.fx.push({ key: "billete", cw: 300, ch: 150, draw: fxBillete, x: x + 1.1 - ((k * 0.43) % 2.2), y: D0 + 3.6 - 2.2 * u * u - u, z: BACK_Z - 0.6 - (k % 3) * 0.3, w: 0.4, h: 0.2, rot: Math.sin(k + u * 6) * 0.6 });
    }
    stand(cam, out, W_G, x - 0.75, BACK_Z - 2.6, { expr: f < 815 ? "grin" : "laugh", blink: lidAt(t, 1), wave: f >= 865 ? 1 : undefined });
  }
  if (id === 11) {
    const a = q(clamp01((f - 1036) / 10), 10), b = q(clamp01((f - 1082) / 22), 22);
    out.fx.push({ key: `canal${a}|${b}`, cw: 640, ch: 760, draw: (p) => fxCanal(p, a, b), x: x + 0.25, y: D0 + 2.25, z: BACK_Z - 0.4, w: 1.6, h: 1.9 });
    stand(cam, out, W_D, x - 0.85, BACK_Z - 1.9, { expr: f < 1040 ? "neutral" : f < 1106 ? "nervous" : "shock", blink: lidAt(t, 4), look: 1 });
    signo(out, cam, f, 1106, "!", x - 0.85, D0 + 2.35, BACK_Z - 1.9);
  }
};

/** todo lo que tiene cara en la toma id, cuadro f */
export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  const fn = { mesa, barcelona, gb, de, lisboa, plato }[s.scene];
  fn(id, f, cam, out);
  return out;
};
void bodyFront; void bodySide; void fxShadow; void NOINK; void fxBurst; void INK; void SKINS; void puff; void fxStars; void fxPuff;
