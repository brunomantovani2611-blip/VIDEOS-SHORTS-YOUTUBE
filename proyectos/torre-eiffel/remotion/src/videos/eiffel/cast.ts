// El elenco de la Torre Eiffel como tarjetas planas iluminadas en el mundo 3D (motor de la plantilla del puente: caché de
// dibujos por clave, tarjetas que miran a la cámara sombreadas por cardShade(), parpadeos, sombras de contacto) y
// encima la escena: multitud en el muelle, los seis conspiradores, los ocupantes de los coches, Princip, los gendarmes,
// los soldados de 1914 y los efectos (bomba, explosión, fogonazos, palomas, mapa).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxContact, fxShadow, Outfit, Expr, FrontOpts, SideOpts, INK, SKINS } from "./toon";
import { FPS, D0, SHOTS, smooth, clamp01, carAt, carPt, SEAT, CarPose, LUSTIG_Q, CARTEL, CAFE, LUSTIG_D, ESCRITORIO, LUSTIG_S, CHATARREROS_X, POISSON_I, ESPOSA, MESA,
  LUSTIG_C, TOWER_C, TOWER_S, towerLift, vueltaX, lin } from "./story";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";
import { LUSTIG, LUSTIG_PRESO, POISSON, ESPOSA_O, CHATARRERO, TAXISTA } from "./elenco";
import { fxSeVende, fxPeriodico, fxBombilla, fxPapel, fxSello, fxViga, fxAnzuelo, fxMoneda, fxBillete, fxSobre, fxViena, fxVisto, fxPregunta, fxSudor, fxRubor } from "./efectos";

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
// París, 1925
// ======================================================================================================
export type Stage = { places: Place[]; fx: FxPlace[] };
const T = (f: number) => f / FPS;
/** hablar: alterna boca abierta/cerrada cada ~4 cuadros */
const talk = (f: number, a: Expr, b: Expr, seed = 0) => ((Math.floor((f + seed * 3) / 4) + Math.floor(hh(seed, Math.floor((f + seed * 3) / 4)) * 2)) % 2 ? a : b);
const FRONT = { side: false, mirror: false };
const W_LUSTIG: Who = { i: 1, o: LUSTIG, okey: "lustig" };
const W_POISSON: Who = { i: 2, o: POISSON, okey: "poisson" };
const W_ESPOSA: Who = { i: 3, o: ESPOSA_O, okey: "esposa" };
const SIT_Y = 0.45; // tarjeta sentada en una silla (asiento a 0.45 m)

/** alguien de pie */
const stand = (cam: CamInfo, out: Stage, who: Who, x: number, z: number, fo: FrontOpts, sc = 1) => {
  out.places.push(person(cam, who, x, D0, z, FRONT, { mode: "stand", ...fo }, {}, sc));
  blob(out, x, D0, z, sc);
};
const sit = (cam: CamInfo, out: Stage, who: Who, x: number, z: number, fo: FrontOpts) =>
  out.places.push(person(cam, who, x, D0 + SIT_Y, z, FRONT, { mode: "sit", ...fo }, {}));
/** tarjeta de efecto delante de alguien (desplazada hacia la cámara) */
const fxAt = (out: Stage, cam: CamInfo, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, toward = 0.12, rot = 0, soft = false) => {
  const dx = cam.pos.x - x, dz = cam.pos.z - z, d = Math.hypot(dx, dz) || 1;
  out.fx.push({ key, cw, ch, draw, x: x + (dx / d) * toward, y, z: z + (dz / d) * toward, w, h, rot, soft });
};

// ---------------- el muelle: Lustig y el cartel ----------------
const cartel = (cam: CamInfo, out: Stage) =>
  out.fx.push({ key: "sevende", cw: 600, ch: 420, draw: fxSeVende, x: CARTEL[0], y: D0 + 1.85, z: CARTEL[2] - 0.08, w: 1.2, h: 0.84 });
const muelle = (id: number, f: number, cam: CamInfo, out: Stage) => {
  cartel(cam, out);
  let expr: Expr = "grin", wave: number | undefined;
  if (id === 1) { expr = f < 85 ? "grin" : f < 100 ? "smile_closed" : "laugh"; if (f >= 50 && f < 84) wave = q(smooth((f - 50) / 8) * (1 - smooth((f - 76) / 8)), 20); }
  if (id === 2) { expr = f < 150 ? "smile_closed" : "grin"; if (f >= 130 && f < 156) wave = q(smooth((f - 130) / 6) * (1 - smooth((f - 150) / 6)), 20); }
  stand(cam, out, W_LUSTIG, LUSTIG_Q[0], LUSTIG_Q[2], { expr, wave, blink: lidAt(T(f), 1, [85, 150].map(T)), look: id === 1 && f >= 50 && f < 84 ? 1 : 0 });
  paseantes(f, cam, out);
};
/** gente paseando por el muelle a lo lejos */
const paseantes = (f: number, cam: CamInfo, out: Stage) => {
  for (let k = 0; k < 6; k++) {
    const dir = k % 2 ? 1 : -1, x = (k % 2 ? -40 : 40) + dir * (T(f) * 1.1 + k * 9) % 60 * 1, z = -33.6 + (k % 3) * 0.9;
    const xx = ((x + 60) % 120) - 60;
    if (Math.abs(xx - LUSTIG_Q[0]) < 4) continue;
    const ph = q((T(f) * 1.6 + k * 0.3) % 1, 30), view = viewOf(cam, xx, z, dir, 0), v = k * 3 + 1;
    out.places.push(person(cam, { i: 40 + k, o: CHATARRERO(v), okey: `p${v}` }, xx, D0, z, view,
      { mode: "stroll", phase: ph, expr: "smile", blink: lidAt(T(f), 40 + k) }, { mode: "march", phase: ph, expr: "smile", stride: view.fs * 0.7, blink: lidAt(T(f), 40 + k) }));
    blob(out, xx, D0, z);
  }
};

// ---------------- el café ----------------
const cafe = (id: number, f: number, cam: CamInfo, out: Stage) => {
  let expr: Expr = "neutral";
  if (id === 3) expr = f < 222 ? "neutral" : f < 262 ? "shock" : "stern";
  if (id === 4) expr = f < 300 ? "stern" : "grin";
  sit(cam, out, W_LUSTIG, CAFE[0], CAFE[2], { expr, blink: lidAt(T(f), 1, [222, 300].map(T)), look: 0 });
  // el periódico abierto delante del pecho (en la toma 4 lo baja)
  const down = id === 4 ? smooth((f - 296) / 8) : 0;
  fxAt(out, cam, "periodico", 520, 400, fxPeriodico, CAFE[0], D0 + 1.12 - 0.35 * down, CAFE[2], 0.62, 0.48, 0.3, 0.04);
  if (id === 4 && f >= 300) {
    const k = smooth((f - 300) / 6), u = q(clamp01((f - 300) / 12), 12);
    out.fx.push({ key: `bombilla${u}`, cw: 260, ch: 340, draw: (p) => fxBombilla(p, u), x: CAFE[0] + 0.05, y: D0 + 2.25 + 0.05 * Math.sin(f * 0.3), z: CAFE[2], w: 0.42 * k, h: 0.55 * k });
  }
  paseantes(f, cam, out);
};

// ---------------- el despacho: papeles y sello ----------------
const despacho = (f: number, cam: CamInfo, out: Stage) => {
  sit(cam, out, W_LUSTIG, LUSTIG_D[0], LUSTIG_D[2], { expr: f < 360 ? "smile_closed" : f < 395 ? "stern" : "grin", blink: lidAt(T(f), 1, [360, 395].map(T)) });
  const E = ESCRITORIO, y = D0 + E.y + 0.012;
  // dos papeles sobre el tapete; cada sellazo deja el sello rojo
  const hits = [393, 418];
  hits.forEach((h, k) => {
    const st = f >= h ? 1 : 0, px = E.x - 0.22 + k * 0.42;
    out.fx.push({ key: `papel${st}`, cw: 360, ch: 480, draw: (p) => fxPapel(p, st), x: px, y, z: E.z - 0.05, w: 0.3, h: 0.4, flat: true, rot: Math.PI + (k ? 0.08 : -0.06) });
  });
  // el sello sube y baja sobre el papel que toca
  const k = f < 405 ? 0 : 1, h = hits[k], u = (f - (h - 10)) / 10, px = E.x - 0.22 + k * 0.42;
  const lift = f < h - 10 ? 0.25 : f < h ? 0.25 * (1 - u * u) : 0.25 * smooth((f - h) / 8);
  out.fx.push({ key: "sello", cw: 200, ch: 260, draw: fxSello, x: px + 0.05, y: y + 0.13 + lift, z: E.z - 0.05, w: 0.2, h: 0.26 });
  for (const h2 of hits) if (f >= h2 && f < h2 + 6) {
    const v = q((f - h2) / 6, 12);
    out.fx.push({ key: `golpe${v}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, v, "#fff3b0", 10, 40, 200), x: E.x - 0.22 + hits.indexOf(h2) * 0.42, y: y + 0.08, z: E.z - 0.15, w: 0.6, h: 0.6 });
  }
};

// ---------------- el salón del hotel ----------------
const dealerExpr = (id: number, f: number, k: number): Expr => {
  if (id === 6) return (["smile", "neutral", "smile_closed", "neutral", "smile"] as Expr[])[k];
  if (id === 7) return f < 526 ? "neutral" : f < 556 ? (k % 2 ? "shock" : "relief_open") : "grin";
  return "neutral";
};
const salon = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f);
  // los cinco chatarreros sentados detrás de la mesa; Poisson es el cuarto
  CHATARREROS_X.forEach((x, k) => {
    const isP = k === POISSON_I;
    let expr = dealerExpr(id, f, k);
    if (isP) {
      if (id === 9) expr = f < 712 ? "grin" : "laugh";
      if (id === 10) expr = "grin";
      if (id === 11) expr = f < 841 ? "smile" : "shock";
      if (id === 12) expr = f < 900 ? "relief" : f < 946 ? "smile" : "grin";
      if (id === 13) expr = "grin";
      if (id === 15) expr = f < 1139 ? "nervous" : "pained";
    }
    const who: Who = isP ? W_POISSON : { i: 20 + k, o: CHATARRERO(k), okey: `ch${k}` };
    sit(cam, out, who, x, -599.15, { expr, blink: lidAt(t, who.i), look: id === 6 || id === 7 ? -1 : isP && (id === 11 || id === 12) ? -1 : 0 });
  });
  const PX = CHATARREROS_X[POISSON_I];
  // Lustig: de pie en la cabecera; en el soborno se inclina junto a Poisson
  if (id === 6 || id === 7) {
    const expr: Expr = id === 6 ? "smile_closed" : talk(f, "shout", "smile_closed", 1);
    const wave = id === 7 && f >= 560 ? q(smooth((f - 560) / 6), 20) : undefined;
    stand(cam, out, W_LUSTIG, LUSTIG_S[0], LUSTIG_S[2], { expr, wave, blink: lidAt(t, 1), look: 1 });
  }
  if (id === 11 || id === 12 || id === 13) {
    const lx = PX - 0.95, expr: Expr = id === 11 ? (f < 829 ? talk(f, "smile_closed", "nervous", 3) : "smile_closed") : id === 12 ? "smile_closed" : "grin";
    stand(cam, out, W_LUSTIG, lx, -599.45, { expr, blink: lidAt(t, 1), look: 1, tilt: id === 11 ? 0.12 : 0.05 });
    if (id === 11 && f >= 829) {
      const k = smooth((f - 829) / 6), u = q(((f - 829) / 24) % 1, 12);
      fxAt(out, cam, `moneda${u}`, 220, 220, (p) => fxMoneda(p, u), lx + 0.45, D0 + 1.95 + 0.04 * Math.sin(f * 0.2), -599.45, 0.24 * k, 0.24 * k, 0.4);
    }
    if (id === 12 && f >= 946) {
      const k = smooth((f - 946) / 6);
      fxAt(out, cam, "visto", 240, 240, fxVisto, PX + 0.05, D0 + 1.85, -599.15, 0.26 * k, 0.26 * k, 0.4);
    }
  }
  // la esposa de pie detrás de Poisson
  if (id === 10 || id === 15 || id === 9) {
    const expr: Expr = id === 15 ? "stern" : f < 759 ? "stern" : "stern";
    stand(cam, out, W_ESPOSA, ESPOSA[0], ESPOSA[2], { expr, blink: lidAt(t, 3), look: -1, facing: -1 });
    if (id === 10 && f >= 755) {
      const k = smooth((f - 755) / 6);
      out.fx.push({ key: "pregunta", cw: 160, ch: 220, draw: fxPregunta, x: ESPOSA[0] + 0.25, y: D0 + 2.3 + 0.04 * Math.sin(f * 0.25), z: ESPOSA[2], w: 0.3 * k, h: 0.42 * k, rot: 0.15 });
    }
  }
  // el anzuelo baja delante de Poisson
  if (id === 9 && f >= 706) {
    const y = lin([[706, 3.0], [728, 1.18], [742, 1.24]], f);
    fxAt(out, cam, "anzuelo", 240, 600, fxAnzuelo, PX + 0.3, D0 + y, -599.15, 0.3, 0.75, 0.35, 0.03 * Math.sin(f * 0.15));
  }
  // los dos sobres se deslizan por el mantel de Poisson a Lustig
  if (id === 13) for (const [f0, lab, dz] of [[983, "TORRE", 0.12], [1012, "EXTRA", -0.18]] as const) {
    if (f < f0) continue;
    const u = smooth((f - f0) / 16), x = PX - 0.05 - 0.75 * u;
    out.fx.push({ key: `sobre${lab}`, cw: 400, ch: 260, draw: (p) => fxSobre(p, lab), x, y: D0 + MESA.y + 0.01 + 0.004 * (dz > 0 ? 1 : 2), z: -600.1 + dz, w: 0.46, h: 0.3, flat: true, rot: Math.PI + 0.1 * (dz > 0 ? 1 : -1) });
  }
  // vergüenza: sudor y rubor
  if (id === 15) {
    const u = q(((f - 1104) / 36) % 1, 20);
    fxAt(out, cam, `sudor${u}`, 220, 160, (p) => fxSudor(p, u), PX + 0.03, D0 + SIT_Y + 1.0, -599.15, 0.5, 0.36, 0.25);
    if (f >= 1139) fxAt(out, cam, "rubor", 300, 120, fxRubor, PX, D0 + SIT_Y + 0.66, -599.15, 0.36 * smooth((f - 1139) / 8), 0.14, 0.18);
  }
};

// ---------------- la grúa: vigas que caen ----------------
const grua = (f: number, cam: CamInfo, out: Stage) => {
  const [lift] = towerLift(8, f);
  if (lift <= 0.5) return;
  for (let k = 0; k < 7; k++) {
    const f0 = 600 + k * 9, u = (f - f0) / FPS;
    if (u < 0) continue;
    const y = 115 * TOWER_S + 6 - 4.9 * u * u * 6, x = TOWER_C[0] + (k - 3) * 6 + u * (k % 2 ? 3 : -3);
    if (y < 2) continue;
    out.fx.push({ key: "viga", cw: 360, ch: 120, draw: fxViga, x, y: D0 + y, z: TOWER_C[1] - 18, w: 9, h: 3, rot: u * (k % 2 ? 2.4 : -2.0) + k });
  }
};

// ---------------- la huida: el taxi a Viena ----------------
const huida = (f: number, cam: CamInfo, out: Stage) => {
  const c = carAt(14, f)!;
  const seated = (k: keyof typeof SEAT, who: Who, fo: FrontOpts) => {
    const [x, , z] = carPt(c, SEAT[k][0], 0, SEAT[k][2]);
    out.places.push(person(cam, who, x, D0 + 0.62, z, FRONT, { mode: "sit", ...fo }, {}));
  };
  seated("chofer", { i: 60, o: TAXISTA, okey: "taxista" }, { expr: "neutral", blink: lidAt(T(f), 60) });
  seated("sofia", W_LUSTIG, { expr: f < 1060 ? "grin" : "laugh", blink: lidAt(T(f), 1), wave: q(0.5 + 0.5 * Math.sin(f * 0.35), 10) });
  // la maleta abierta suelta billetes que vuelan detrás del coche
  for (let k = 0; k < 10; k++) {
    const f0 = 1040 + k * 6, u = (f - f0) / FPS;
    if (u < 0 || u > 1.6) continue;
    const [x, , z] = carPt(c, SEAT.sofia[0] + 0.2, 0, SEAT.sofia[2] - 0.6);
    out.fx.push({ key: "billete", cw: 360, ch: 190, draw: (p) => fxBillete(p), x: x + 5.2 * u + u * 1.5, y: D0 + 1.5 + 1.4 * u - 0.6 * u * u, z: z - 0.3 * Math.sin(k), w: 0.5, h: 0.27, rot: u * (k % 2 ? 5 : -4) + k });
  }
  out.fx.push({ key: "viena", cw: 520, ch: 200, draw: fxViena, x: 0, y: D0 + 2.45, z: -30.4, w: 1.3, h: 0.5 });
};

// ---------------- vuelta: Lustig vuelve paseando al cartel; dos chatarreros nuevos esperan ----------------
const vuelta = (f: number, cam: CamInfo, out: Stage) => {
  cartel(cam, out);
  const x = vueltaX(f), walking = f < 1262, t = T(f);
  if (walking) {
    const ph = q((t * 1.7) % 1, 30), view = viewOf(cam, x, LUSTIG_Q[2], -1, 0);
    out.places.push(person(cam, W_LUSTIG, x, D0, LUSTIG_Q[2], view, { mode: "stroll", phase: ph, expr: "grin", blink: lidAt(t, 1) },
      { mode: "march", phase: ph, expr: "grin", stride: view.fs * 0.7, blink: lidAt(t, 1) }));
    blob(out, x, D0, LUSTIG_Q[2]);
  } else stand(cam, out, W_LUSTIG, x, LUSTIG_Q[2], { expr: f < 1282 ? "grin" : "laugh", blink: lidAt(t, 1), wave: f >= 1264 && f < 1290 ? q(smooth((f - 1264) / 6), 20) : undefined, look: 1 });
};

// ---------------- Alcatraz ----------------
const celda = (f: number, cam: CamInfo, out: Stage) => {
  const expr: Expr = f < 1360 ? "whistle" : f < 1394 ? "smile_closed" : "grin";
  stand(cam, out, { i: 1, o: LUSTIG_PRESO, okey: "preso" }, LUSTIG_C[0], LUSTIG_C[2], { expr, blink: expr === "whistle" ? 0 : lidAt(T(f), 1, [1360, 1394].map(T)), wave: f >= 1390 ? q(smooth((f - 1390) / 6), 20) : undefined });
  if (f >= 1392) {
    const k = smooth((f - 1392) / 6);
    fxAt(out, cam, "billeteFalso", 360, 190, (p) => fxBillete(p, 1), LUSTIG_C[0] + 0.5, D0 + 2.05, LUSTIG_C[2], 0.5 * k, 0.26 * k, 0.15, -0.12);
  }
};

/** todo lo que tiene cara en la toma id, cuadro f */
export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  switch (s.scene) {
    case "muelle": muelle(id, f, cam, out); break;
    case "cafe": cafe(id, f, cam, out); break;
    case "despacho": despacho(f, cam, out); break;
    case "salon": salon(id, f, cam, out); break;
    case "grua": grua(f, cam, out); break;
    case "huida": huida(f, cam, out); break;
    case "vuelta": vuelta(f, cam, out); break;
    case "torre": break;
    case "celda": celda(f, cam, out); break;
  }
  return out;
};
void bodyFront; void bodySide; void fxShadow; void NOINK;
export type { CarPose };
