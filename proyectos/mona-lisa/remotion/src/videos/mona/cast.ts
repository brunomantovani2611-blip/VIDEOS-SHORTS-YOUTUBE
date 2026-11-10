// El elenco de la Mona Lisa como tarjetas planas iluminadas en el mundo 3D (motor de la plantilla del puente: caché de
// dibujos por clave, tarjetas que miran a la cámara sombreadas por cardShade(), parpadeos, sombras de contacto) y
// encima la escena: multitud en el muelle, los seis conspiradores, los ocupantes de los coches, Princip, los gendarmes,
// los soldados de 1914 y los efectos (bomba, explosión, fogonazos, palomas, mapa).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxContact, fxShadow, Outfit, Expr, FrontOpts, SideOpts, INK, SKINS } from "./toon";
import { FPS, D0, SHOTS, smooth, clamp01, lin, MONA, MONA_W, MONA_H, peruggiaX, PERUGGIA_Z, BEROUD, BAUL, COMISARIA, REJA_Z, TIENDA, VOCEADOR, BACK_Z } from "./story";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";
import { PERUGGIA, PERUGGIA_CALLE, BEROUD_O, APOLLINAIRE, PICASSO, GENDARME, MARCHANTE, VISITANTE, TURISTA } from "./elenco";
import { fxPeriodico, fxBrillo, fxLupa, fxCerrado, fxFlash, fxMovil, fxPregunta, fxSudor } from "./efectos";
import { fxPuff } from "./toon";
import { drawMona } from "./cuadro";

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
// París y Florencia, 1911-1913
// ======================================================================================================
export type Stage = { places: Place[]; fx: FxPlace[] };
const T = (f: number) => f / FPS;
const talk = (f: number, a: Expr, b: Expr, seed = 0) => ((Math.floor((f + seed * 3) / 4) + Math.floor(hh(seed, Math.floor((f + seed * 3) / 4)) * 2)) % 2 ? a : b);
const FRONT = { side: false, mirror: false };
const W_PER: Who = { i: 1, o: PERUGGIA, okey: "peruggia" };
const W_PER2: Who = { i: 1, o: PERUGGIA_CALLE, okey: "peruggia2" };
const SIT_Y = 0.45;
const stand = (cam: CamInfo, out: Stage, who: Who, x: number, z: number, fo: FrontOpts, sc = 1) => {
  out.places.push(person(cam, who, x, D0, z, FRONT, { mode: "stand", ...fo }, {}, sc));
  blob(out, x, D0, z, sc);
};
const sit = (cam: CamInfo, out: Stage, who: Who, x: number, z: number, fo: FrontOpts) =>
  out.places.push(person(cam, who, x, D0 + SIT_Y, z, FRONT, { mode: "sit", ...fo }, {}));
const walk = (cam: CamInfo, out: Stage, who: Who, x: number, z: number, dx: number, f: number, expr: Expr) => {
  const ph = q((T(f) * 1.7) % 1, 30), view = viewOf(cam, x, z, dx, 0);
  out.places.push(person(cam, who, x, D0, z, view, { mode: "stroll", phase: ph, expr, blink: lidAt(T(f), who.i) },
    { mode: "march", phase: ph, expr, stride: view.fs * 0.7, blink: lidAt(T(f), who.i) }));
  blob(out, x, D0, z);
};
const fxAt = (out: Stage, cam: CamInfo, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, toward = 0.12, rot = 0, soft = false) => {
  const dx = cam.pos.x - x, dz = cam.pos.z - z, d = Math.hypot(dx, dz) || 1;
  out.fx.push({ key, cw, ch, draw, x: x + (dx / d) * toward, y, z: z + (dz / d) * toward, w, h, rot, soft });
};
/** la Mona Lisa como tarjeta (la que se lleva Peruggia, la del baúl) */
const MONA_CARD = (p: Pen) => drawMona((p as unknown as { g: CanvasRenderingContext2D }).g);

// ---------------- la sala del Louvre ----------------
const sala = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f);
  if (id === 1 && f >= 42 && f < 70) {
    const u = q((f - 42) / 28, 20);
    out.fx.push({ key: `puff${u}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, u), x: MONA[0], y: MONA[1] - 0.2, z: MONA[2] - 0.15, w: 1.6, h: 1.6, soft: true });
  }
  if ((id === 1 && f >= 72) || (id === 5 && f >= 575)) {
    const k = smooth((f - (id === 1 ? 72 : 575)) / 6);
    out.fx.push({ key: "pregunta", cw: 160, ch: 220, draw: fxPregunta, x: MONA[0], y: MONA[1] + 0.05 * Math.sin(f * 0.2), z: MONA[2] - 0.2, w: 0.42 * k, h: 0.58 * k, rot: 0.1 });
  }
  if (id === 2 || id === 3) {
    const x = peruggiaX(f), moving = (f < 224) || (f >= 288 && f < 321);
    if (x < 604.3) {
      if (moving) walk(cam, out, W_PER, x, PERUGGIA_Z, 1, f, f < 224 ? "neutral" : "grin");
      else stand(cam, out, W_PER, x, PERUGGIA_Z, { expr: f < 250 ? "stern" : f < 270 ? "nervous" : "grin", blink: lidAt(t, 1), wave: f >= 229 && f < 250 ? q(smooth((f - 229) / 6), 20) : undefined });
    }
    // el cuadro pasa de la pared a sus manos y luego bajo la bata
    if (id === 3 && f >= 232 && f < 272) {
      const u = smooth((f - 232) / 14), hide = smooth((f - 252) / 18);
      const x0 = MONA[0], y0 = MONA[1], x1 = x + 0.05, y1 = D0 + 0.9;
      const k = 1 - hide;
      out.fx.push({ key: "monaCard", cw: 400, ch: 580, draw: MONA_CARD, x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u - 0.25 * hide, z: MONA[2] - 0.1 - (MONA[2] - 0.1 - (PERUGGIA_Z - 0.25)) * u,
        w: MONA_W * (1 - 0.25 * u) * k, h: MONA_H * (1 - 0.25 * u) * Math.max(0.05, k) });
    }
  }
  if (id === 4) {
    if (f < 399) stand(cam, out, W_PER, 599.35, PERUGGIA_Z, { expr: f < 385 ? "smile_closed" : "grin", blink: lidAt(t, 1) });
    else {
      stand(cam, out, W_PER, 600.85, -596.6, { expr: "smile", blink: lidAt(t, 1), look: 1, wave: q(0.6 + 0.4 * Math.sin(f * 0.5), 10) });
      for (const [f0, dx, dy] of [[436, -0.2, 0.3], [446, 0.22, -0.1], [456, -0.05, -0.35]] as const) if (f >= f0 && f < f0 + 12) {
        const u = q((f - f0) / 12, 12);
        out.fx.push({ key: `brillo${u}`, cw: 260, ch: 260, draw: (p) => fxBrillo(p, u), x: MONA[0] + dx, y: MONA[1] + dy, z: MONA[2] - 0.08, w: 0.35, h: 0.35 });
      }
    }
  }
  if (id === 5) {
    const expr: Expr = f < 552 ? "smile" : f < 580 ? "shock" : "dazed";
    stand(cam, out, { i: 2, o: BEROUD_O, okey: "beroud" }, BEROUD[0], BEROUD[2], { expr, blink: lidAt(t, 2), look: 1 });
  }
  if (id === 8) {
    for (let k = 0; k < 13; k++) {
      const x = 599.4 - k * 0.55, z = -597.9 - (k % 2) * 0.25, v = k * 3 + 2;
      const expr: Expr = (["neutral", "smile", "shock", "neutral", "relief_open"] as Expr[])[k % 5];
      stand(cam, out, { i: 40 + k, o: VISITANTE(v), okey: `vis${v}` }, x, z, { expr, blink: lidAt(t, 40 + k), look: 1 }, 1);
    }
  }
  if (id === 11) {
    for (const [x, z, v] of [[599.35, -598.4, 3], [600.85, -598.7, 6]] as const) stand(cam, out, { i: 60 + v, o: VISITANTE(v), okey: `vis${v}` }, x, z, { expr: "smile", blink: lidAt(t, 60 + v), look: x < 600 ? 1 : -1 });
  }
  if (id === 12) {
    for (let k = 0; k < 14; k++) {
      const side = k % 2 ? 1 : -1, x = 600 + side * (0.75 + (k >> 1) * 0.42 + (hh(k, 3) - 0.5) * 0.2), z = -598.2 - ((k >> 1) % 3) * 0.45;
      const who: Who = { i: 80 + k, o: TURISTA(k), okey: `tur${k}` };
      stand(cam, out, who, x, z, { expr: (["smile", "grin", "relief_open", "laugh"] as Expr[])[k % 4], blink: lidAt(t, 80 + k), look: side < 0 ? 1 : -1, wave: k % 3 === 0 ? 1 : undefined });
      if (k % 3 === 0) fxAt(out, cam, "movil", 140, 240, fxMovil, x - side * 0.18, D0 + 2.05, z, 0.14, 0.24, 0.3);
    }
    for (let k = 0; k < 10; k++) {
      const f0 = 1120 + k * 9 + Math.floor(hh(k, 7) * 5);
      if (f < f0 || f >= f0 + 5) continue;
      const u = q((f - f0) / 5, 10), side = k % 2 ? 1 : -1;
      out.fx.push({ key: `flash${u}`, cw: 300, ch: 300, draw: (p) => fxFlash(p, u), x: 600 + side * (0.9 + (k % 4) * 0.4), y: D0 + 2.05, z: -598.6, w: 0.6, h: 0.6 });
    }
  }
};

// ---------------- el muelle: París enloquece ----------------
const muelle = (f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), [x, , z] = VOCEADOR;
  stand(cam, out, { i: 5, o: { ...VISITANTE(4), build: "kid" }, okey: "voceador" }, x, z, { expr: talk(f, "shout", "grin", 2), blink: lidAt(t, 5), wave: q(0.7 + 0.3 * Math.sin(f * 0.4), 10) }, 0.9);
  fxAt(out, cam, "periodico", 520, 400, fxPeriodico, x - 0.22, D0 + 0.62, z, 0.46, 0.35, 0.3, 0.05);
  for (const [dx, dz, v, e] of [[-1.0, -0.3, 1, "shock"], [1.0, -0.5, 2, "shock"], [-1.7, 0.4, 5, "nervous"], [1.6, 0.3, 7, "shock"]] as const)
    stand(cam, out, { i: 10 + v, o: VISITANTE(v), okey: `vis${v}` }, x + dx, z + dz, { expr: e as Expr, blink: lidAt(t, 10 + v), look: dx < 0 ? 1 : -1 });
  if (f >= 620) {
    const k = smooth((f - 620) / 6);
    out.fx.push({ key: "cerrado", cw: 420, ch: 200, draw: fxCerrado, x: x + 0.15, y: D0 + 2.05 + 0.03 * Math.sin(f * 0.2), z: z - 0.3, w: 0.95 * k, h: 0.45 * k, rot: -0.06 });
  }
};

// ---------------- la comisaría ----------------
const comisaria = (f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), cx = COMISARIA[0];
  stand(cam, out, { i: 6, o: APOLLINAIRE, okey: "apollinaire" }, cx - 0.8, REJA_Z + 0.75, { expr: f < 690 ? "shock" : "pained", blink: lidAt(t, 6) });
  sit(cam, out, { i: 7, o: PICASSO, okey: "picasso" }, cx + 0.95, -598.65, { expr: f < 737 ? "nervous" : "shock", blink: lidAt(t, 7), look: 1 });
  stand(cam, out, { i: 8, o: GENDARME, okey: "gendarme" }, cx + 1.85, -598.35, { expr: f < 706 ? "stern" : talk(f, "shout", "stern", 4), blink: lidAt(t, 8), look: -1 });
  if (f >= 712) {
    const u = q(((f - 712) / 30) % 1, 20);
    fxAt(out, cam, `sudor${u}`, 220, 160, (p) => fxSudor(p, u), cx + 0.97, D0 + SIT_Y + 1.0, -598.65, 0.45, 0.33, 0.25);
  }
};

// ---------------- la habitación: el baúl ----------------
const cuarto = (f: number, cam: CamInfo, out: Stage) => {
  stand(cam, out, W_PER2, BAUL.x + 0.5, BAUL.z + 0.3, { expr: f < 895 ? "smile_closed" : f < 935 ? "grin" : "laugh", blink: lidAt(T(f), 1), look: 0 });
  if (f >= 884) out.fx.push({ key: "monaCard", cw: 400, ch: 580, draw: MONA_CARD, x: BAUL.x, y: D0 + BAUL.h + 0.012, z: BAUL.z - 0.02, w: 0.38, h: 0.55, flat: true, rot: Math.PI });
};

// ---------------- Florencia: lo atrapan ----------------
const tienda = (f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), cx = TIENDA[0];
  sit(cam, out, { i: 9, o: MARCHANTE, okey: "marchante" }, cx + 0.45, -596.55, { expr: f < 1000 ? "smile" : f < 1030 ? "stern" : "grin", blink: lidAt(t, 9), look: -1 });
  const caught = f >= 1036;
  stand(cam, out, W_PER2, cx - 0.6, -597.9, { expr: caught ? "shock" : "grin", blink: lidAt(t, 1, [1036].map(T)), look: caught ? 0 : -1 });
  if (!caught) fxAt(out, cam, "monaCard", 400, 580, MONA_CARD, cx - 0.1, D0 + 1.35, -597.9, 0.42, 0.6, 0.3, 0.04);
  if (f >= 1000 && f < 1034) fxAt(out, cam, "lupa", 240, 320, fxLupa, cx + 0.15, D0 + 1.55, -597.4, 0.26, 0.34, 0.5, -0.3);
  if (caught) for (const [dx, k] of [[-0.62, 0], [0.62, 1]] as const) {
    const sl = smooth((f - 1036) / 6);
    stand(cam, out, { i: 30 + k, o: GENDARME, okey: "gendarme" }, cx - 0.6 + dx * (0.9 - 0.25 * sl), -598.0, { expr: "stern", blink: lidAt(t, 30 + k), look: dx < 0 ? 1 : -1, facing: dx < 0 ? 1 : -1 });
  }
};

/** todo lo que tiene cara en la toma id, cuadro f */
export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  switch (s.scene) {
    case "sala": sala(id, f, cam, out); break;
    case "muelle": muelle(f, cam, out); break;
    case "comisaria": comisaria(f, cam, out); break;
    case "cuarto": cuarto(f, cam, out); break;
    case "tienda": tienda(f, cam, out); break;
  }
  return out;
};
void bodyFront; void bodySide; void fxShadow; void NOINK; void clamp01; void lin; void BACK_Z; void MONA_H;
