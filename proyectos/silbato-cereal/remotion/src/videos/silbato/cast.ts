// El elenco de las pizzas de Bitcoin como tarjetas planas iluminadas en el mundo 3D (motor de la plantilla del puente: caché de
// dibujos por clave, tarjetas que miran a la cámara sombreadas por cardShade(), parpadeos, sombras de contacto) y
// encima la escena: multitud en el muelle, los seis conspiradores, los ocupantes de los coches, Princip, los gendarmes,
// los soldados de 1914 y los efectos (bomba, explosión, fogonazos, palomas, mapa).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxContact, fxShadow, fxPuff, fxStars, Outfit, Expr, FrontOpts, SideOpts, INK, SKINS } from "./toon";
import { FPS, D0, SHOTS, smooth, clamp01, lin, BACK_Z, CALIFORNIA, COCINA_X, CENTRAL_X, TALLER_X, PLATO_X, GARAJE_X, MESA_Z, TEL_COCINA } from "./story";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";
import { NENE, DRAPER, WOZ, JOBS, JOBS2 } from "./elenco";
import { fxCereal, fxSilbato, fxOndas, fxTelefono, fxHz, fxLinea, fxOperador, fxMundo, fxApodo, fxCajaAzul, fxNotas, fxRevista, fxNombre, fxVaticano, fxBocadillo, fxZzz, fxLuna, fxManzana, fxDolar, fxBillete, fxSigno } from "./efectos";

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
// El silbato de los cereales, 1960-1975
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
const W_N: Who = { i: 1, o: NENE, okey: "nene" };
const W_D: Who = { i: 2, o: DRAPER, okey: "draper" };
const W_W: Who = { i: 3, o: WOZ, okey: "woz" };
const W_J: Who = { i: 4, o: JOBS, okey: "jobs" };
const W_J2: Who = { i: 5, o: JOBS2, okey: "jobs2" };

// ---------------- la cocina (mirando a +z: +x a la izquierda del cuadro) ----------------
const cocina = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), x = COCINA_X, [tx, ty] = TEL_COCINA;
  if (id === 1) {
    sit(cam, out, W_N, x, MESA_Z + 0.6, { expr: f < 88 ? "smile" : "grin", blink: lidAt(t, 1) });
    icon(out, cam, f, 42, "cereal", 320, 420, fxCereal, x + 0.45, D0 + 1.02, MESA_Z - 0.1, 0.42, 0, 0.05);
    icon(out, cam, f, 88, "silbato", 360, 200, fxSilbato, x - 0.1, D0 + 2.05, MESA_Z + 0.2, 0.6, -0.15);
  }
  // el chico junto al teléfono de pared (a la derecha del cuadro)
  if (id === 2 || id === 4) {
    const kx = tx + 0.55, kz = BACK_Z - 0.75;
    let expr: Expr = "neutral";
    if (id === 2) expr = f < 135 ? "smile" : f < 164 ? "smile_closed" : f < 200 ? "whistle" : "shock";
    if (id === 4) expr = f < 425 ? "whistle" : f < 467 ? "grin" : "laugh";
    stand(cam, out, W_N, kx, kz, { expr, blink: lidAt(t, 1), look: -1 });
    const blow = id === 2 ? [173, 200] : [398, 425];
    if (f >= (id === 2 ? 164 : 395)) fxAt(out, cam, "silbatoMano", 360, 200, fxSilbato, kx - 0.22, D0 + 1.05, kz, 0.3, 0.17, 0.2, 0.3);
    ondas(out, cam, f, blow[0], blow[1], tx + 0.05, ty - 0.05, BACK_Z - 0.4, 0.55, Math.PI);
    if (id === 2) signo(out, cam, f, 200, "!", kx, D0 + 1.85, kz, 0.22);
    if (id === 4) {
      signo(out, cam, f, 433, "?", tx + 0.45, ty + 0.5, BACK_Z - 0.3, 0.26);
      icon(out, cam, f, 497, "operador", 420, 300, fxOperador, kx + 0.15, D0 + 2.05, kz, 0.6);
    }
  }
  if (id === 13) {
    stand(cam, out, W_N, x - 0.3, BACK_Z - 1.4, { expr: f < 1360 ? "whistle" : "laugh", blink: lidAt(t, 1) });
    fxAt(out, cam, "silbatoMano", 360, 200, fxSilbato, x - 0.52, D0 + 1.05, BACK_Z - 1.4, 0.3, 0.17, 0.2, 0.3);
    ondas(out, cam, f, 1338, 1358, x - 0.75, D0 + 1.05, BACK_Z - 1.4, 0.5, Math.PI);
    icon(out, cam, f, 1360, "cereal", 320, 420, fxCereal, x + 0.14, D0 + 1.02, MESA_Z - 0.1, 0.4, 0, 0.05);
    if (f >= 1372) { const u = q(((f - 1372) / 20) % 1, 20); fxAt(out, cam, `notas${u}`, 300, 300, (p) => fxNotas(p, u), x - 0.6, D0 + 1.7, BACK_Z - 1.4, 0.55, 0.55, 0.3); }
  }
};

// ---------------- la central telefónica ----------------
const central = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const x = CENTRAL_X;
  icon(out, cam, f, 218, "silbatoGrande", 360, 200, fxSilbato, x + 0.7, D0 + 2.3, BACK_Z - 1.4, 0.7, -0.12);
  ondas(out, cam, f, 228, 290, x + 0.5, D0 + 2.0, BACK_Z - 1.2, 0.6);
  icon(out, cam, f, 243, "hz", 520, 300, fxHz, x - 0.35, D0 + 2.35, BACK_Z - 1.0, 1.15);
  if (f >= 363) icon(out, cam, f, 363, `linea${f >= 380 ? 1 : 0}`, 460, 220, (p) => fxLinea(p, f >= 380), x, D0 + 1.45, BACK_Z - 1.4, 1.1);
  if (f >= 293 && f < 363) icon(out, cam, f, 313, "telefonoC", 340, 300, (p) => fxTelefono(p), x, D0 + 1.4, BACK_Z - 1.4, 0.6);
};

// ---------------- el plató: el mapa del mundo / el Vaticano de noche ----------------
const plato = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const x = PLATO_X;
  if (id === 5) {
    const k = q(clamp01((f - 516) / 40), 40);
    out.fx.push({ key: `mundo${k}|${f >= 527 ? 1 : 0}`, cw: 700, ch: 520, draw: (p) => fxMundo(p, k, f >= 527), x, y: D0 + 2.3, z: BACK_Z - 0.4, w: 2.2, h: 1.63 });
    stand(cam, out, W_N, x - 0.3, BACK_Z - 2.2, { expr: f < 527 ? "grin" : "laugh", blink: lidAt(T(f), 1), look: 1 });
  }
  if (id === 11) {
    out.fx.push({ key: "vaticano", cw: 380, ch: 360, draw: fxVaticano, x, y: D0 + 1.2, z: BACK_Z - 0.4, w: 1.5, h: 1.42 });
    out.fx.push({ key: "luna", cw: 300, ch: 300, draw: fxLuna, x: x + 0.7, y: D0 + 3.0, z: BACK_Z - 0.3, w: 0.55, h: 0.55 });
    const u = q(((f - 1172) / 30) % 1, 15);
    fxAt(out, cam, `zzz${u}`, 300, 300, (p) => fxZzz(p, u), x - 0.6, D0 + 2.9, BACK_Z - 0.6, 0.6, 0.6, 0.2);
    icon(out, cam, f, 1176, "bocaDuerme", 520, 260, (p) => fxBocadillo(p, "Está durmiendo"), x, D0 + 2.3, BACK_Z - 1.2, 0.95);
  }
};

// ---------------- el cuarto de Draper ----------------
const taller = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), x = TALLER_X;
  if (id === 6) {
    stand(cam, out, W_D, x + 0.1, MESA_Z - 0.9, { expr: f < 664 ? "smile" : f < 681 ? "grin" : "laugh", blink: lidAt(t, 2) });
    icon(out, cam, f, 601, "telefonoD", 340, 300, (p) => fxTelefono(p), x + 0.55, D0 + 0.98, MESA_Z - 0.1, 0.36, 0, 0.05);
    if (f < 681) icon(out, cam, f, 631, "nombreDraper", 360, 120, (p) => fxNombre(p, "John Draper"), x + 0.1, D0 + 2.1, MESA_Z - 0.9, 0.75, 0, 0.2);
    else icon(out, cam, f, 681, "apodo", 520, 220, (p) => fxApodo(p, "CAPITÁN CRUNCH"), x - 0.02, D0 + 2.2, MESA_Z - 0.7, 1.0, 0, 0.2);
    icon(out, cam, f, 707, "cerealD", 320, 420, fxCereal, x - 0.6, D0 + 1.25, MESA_Z - 0.7, 0.36, 0.1);
  }
  if (id === 7) {
    sit(cam, out, W_D, x, MESA_Z + 0.6, { expr: f < 750 ? "smile" : "grin", blink: lidAt(t, 2) });
    icon(out, cam, f, 750, "cajaAzul", 360, 300, fxCajaAzul, x - 0.42, D0 + 0.97, MESA_Z - 0.3, 0.44, 0, 0.05);
    if (f >= 770) { const u = q(((f - 770) / 20) % 1, 20); fxAt(out, cam, `notas${u}`, 300, 300, (p) => fxNotas(p, u), x - 0.55, D0 + 1.5, MESA_Z - 0.4, 0.6, 0.6, 0.3); }
  }
};

// ---------------- California, 1971 ----------------
const california = (_id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), [cx, , cz] = CALIFORNIA, z = cz + 1.0;
  stand(cam, out, W_W, cx - 0.55, z, { expr: f < 870 ? "neutral" : f < 921 ? "shock" : "grin", blink: lidAt(t, 3), look: 1 });
  stand(cam, out, W_J, cx + 0.55, z, { expr: f < 870 ? "neutral" : f < 921 ? "shock" : "grin", blink: lidAt(t, 4), look: -1 });
  icon(out, cam, f, 840, "revista", 300, 380, fxRevista, cx, D0 + 1.15, z + 0.2, 0.42, 0, 0.1);
  icon(out, cam, f, 940, "nWoz", 360, 120, (p) => fxNombre(p, "Wozniak"), cx - 0.55, D0 + 2.15, z, 0.6, -0.05, 0.15);
  icon(out, cam, f, 962, "nJobs", 360, 120, (p) => fxNombre(p, "Jobs"), cx + 0.55, D0 + 2.15, z, 0.6, 0.05, 0.15);
};

// ---------------- el garaje ----------------
const garaje = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), x = GARAJE_X, zg = MESA_Z - 0.9;
  if (id === 9) {
    stand(cam, out, W_W, x + 0.6, zg, { expr: f < 1005 ? "smile" : "grin", blink: lidAt(t, 3), look: -1 });
    stand(cam, out, W_J, x - 0.6, zg, { expr: f < 1032 ? "smile" : "laugh", blink: lidAt(t, 4), look: 1 });
    [[1000, x + 0.35], [1008, x], [1016, x - 0.35]].forEach(([f0, xx], k) =>
      icon(out, cam, f, f0, `cajaAzul`, 360, 300, fxCajaAzul, xx, D0 + 1.0, MESA_Z - 0.25 - k * 0.01, 0.34, 0, 0.05));
    icon(out, cam, f, 1032, "dolar", 200, 240, fxDolar, x, D0 + 2.3, zg + 0.3, 0.45);
    if (f >= 1034) for (let k = 0; k < 8; k++) {
      const f0 = 1034 + k * 2.5, u = (f - f0) / FPS;
      if (u < 0 || u > 1.2) continue;
      out.fx.push({ key: "billete", cw: 300, ch: 150, draw: fxBillete, x: x + 1.0 - ((k * 0.53) % 2.0), y: D0 + 3.0 - 2.0 * u * u - u, z: zg + 0.2 - (k % 3) * 0.2, w: 0.36, h: 0.18, rot: Math.sin(k + u * 6) * 0.6 });
    }
  }
  if (id === 10) {
    const wx = x + 0.35;
    stand(cam, out, W_W, wx, zg, { expr: f < 1103 ? "grin" : f < 1158 ? "smile_closed" : "grin", blink: lidAt(t, 3) });
    fxAt(out, cam, "telefonoW", 340, 300, (p) => fxTelefono(p), wx + 0.3, D0 + 1.0, zg, 0.32, 0.28, 0.15);
    icon(out, cam, f, 1079, "vaticanoP", 380, 360, fxVaticano, x - 0.25, D0 + 1.35, zg + 0.3, 0.6);
    icon(out, cam, f, 1112, "bocaKiss", 520, 260, (p) => fxBocadillo(p, "Habla Henry", "KISSINGER"), wx - 0.05, D0 + 2.3, zg, 0.9);
  }
  if (id === 12) {
    stand(cam, out, W_J2, x, zg, { expr: f < 1250 ? "smile" : f < 1299 ? "neutral" : "grin", blink: lidAt(t, 5) });
    icon(out, cam, f, 1270, "cajaAzul12", 360, 300, fxCajaAzul, x + 0.43, D0 + 1.9, zg - 0.05, 0.36);
    icon(out, cam, f, 1322, "manzana", 300, 320, fxManzana, x - 0.43, D0 + 1.9, zg - 0.05, 0.34);

  }
};

/** todo lo que tiene cara en la toma id, cuadro f */
export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  const fn = { cocina, central, taller, plato, garaje, california }[s.scene];
  fn(id, f, cam, out);
  return out;
};
void bodyFront; void bodySide; void fxShadow; void NOINK; void fxBurst; void INK; void SKINS; void puff; void fxStars; void fxPuff; void lin; void smooth; void walk; void CENTRAL_X; void fxBocadillo;
