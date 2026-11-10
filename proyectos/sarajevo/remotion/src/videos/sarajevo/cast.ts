// El elenco de Sarajevo como tarjetas planas iluminadas en el mundo 3D (motor de la plantilla del puente: caché de
// dibujos por clave, tarjetas que miran a la cámara sombreadas por cardShade(), parpadeos, sombras de contacto) y
// encima la escena: multitud en el muelle, los seis conspiradores, los ocupantes de los coches, Princip, los gendarmes,
// los soldados de 1914 y los efectos (bomba, explosión, fogonazos, palomas, mapa).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxContact, fxShadow, Outfit, Expr, FrontOpts, SideOpts, INK, SKINS } from "./toon";
import { FPS, D0, SHOTS, V3, smooth, clamp01, carAt, escortAt, carPt, SEAT, CarPose, PRINCIP_AT, THROWER, T_THROW, bombAt, boomAt, worldT, STOP } from "./story";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";
import { ARCHIDUQUE, SOFIA, CHOFER, POTIOREK, PRINCIP, CONSPIRADOR, GENDARME, VECINO } from "./elenco";
import { fxBomba, fxSudor, fxPaloma, fxMapa, fxPregunta, fxHumo } from "./efectos";

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
// Sarajevo
// ======================================================================================================
export type Stage = { places: Place[]; fx: FxPlace[] };
const T = (f: number) => f / FPS;
/** hablar: alterna boca abierta/cerrada cada ~4 cuadros */
const talk = (f: number, a: Expr, b: Expr, seed = 0) => ((Math.floor((f + seed * 3) / 4) + Math.floor(hh(seed, Math.floor((f + seed * 3) / 4)) * 2)) % 2 ? a : b);

// ---------------- la multitud del muelle Appel ----------------
/** primera fila junto al pretil (lado del río), segunda fila detrás, y una fila pegada a las fachadas */
type Spot = { x: number; z: number; i: number; o: Outfit; okey: string; kid?: boolean };
const CONSP_X = [56.0, 52.2, 49.0, 45.6, 42.4, 39.2]; // el primero (Mehmedbašić), Čabrinović, ... (Princip, el sexto)
const SPOTS: Spot[] = (() => {
  const out: Spot[] = [];
  let i = 0;
  for (const [z, x0, x1, step] of [[-31.25, 14, 82, 1.15], [-32.05, 14.5, 82, 1.3], [-36.0, 14, 82, 1.5]] as const)
    for (let x = x0; x <= x1; x += step) {
      const xx = x + (hh(i, 1) - 0.5) * 0.35;
      // despejar delante de los conspiradores; la fila de las fachadas sólo lejos de las cámaras de la bomba
      if (z !== -36.0 && CONSP_X.some((cx) => Math.abs(cx - xx) < (z === -31.25 ? 0.7 : 1.1))) { i++; continue; }
      if (z === -36.0 && xx > 34 && xx < 62) { i++; continue; }
      const kid = hh(i, 4) < 0.1 && z !== -36.0;
      const v = Math.floor(hh(i, 2) * 48);
      out.push({ x: xx, z: z + (hh(i, 3) - 0.5) * 0.25, i, o: kid ? { ...VECINO(v), build: "kid", hat: "cap", cap: "#b8232f" } : VECINO(v), okey: kid ? `k${v % 6}` : `v${v}`, kid });
      i++;
    }
  return out;
})();
const CONSPS: Spot[] = CONSP_X.map((x, k) => ({ x, z: -31.25, i: 500 + k, o: k === 5 ? PRINCIP : CONSPIRADOR(k), okey: k === 5 ? "princip" : `c${k}` }));

const crowd = (id: number, f: number, cam: CamInfo, out: Stage, car: CarPose | null) => {
  const w = worldT(f), boom = id === 5 && f >= 451;
  for (const s of SPOTS) {
    const d = car ? Math.abs(s.x - car.x) : 99;
    const near = d < 9;
    let expr: Expr = (["smile", "grin", "smile_closed", "laugh"] as Expr[])[s.i % 4];
    if (boom && Math.abs(s.x - 54) < 14) expr = s.i % 3 ? "shock" : "nervous";
    const wave = near && !boom && s.i % 3 !== 1 ? q(Math.sin(w * 8 + s.i * 1.3), 20) : undefined;
    const hop = s.kid && near && !boom ? Math.max(0, Math.sin(w * 7 + s.i)) * 0.15 : 0;
    const sc = s.kid ? 0.72 : 1;
    out.places.push(person(cam, { i: s.i, o: s.o, okey: s.okey }, s.x, D0 + hop, s.z, { side: false, mirror: false },
      { mode: "stand", expr, wave, blink: lidAt(T(f), s.i), look: car ? Math.sign(car.x - s.x) * (d < 20 ? 1 : 0) : 0 }, {}, sc));
    blob(out, s.x, D0, s.z, sc, hop > 0 ? 0.6 : 1);
  }
  // los seis conspiradores: serios entre la gente
  CONSPS.forEach((s, k) => {
    let expr: Expr = "stern", wave: number | undefined;
    if (k === 0 && (id === 4 || id === 3)) expr = "nervous";
    if (k === 1 && id === 5) {
      // Čabrinović: brazo arriba y lanza (cuadros 386-400)
      expr = f < 386 ? "stern" : f < 410 ? "shout" : "shock";
      if (f >= 386 && f < 404) wave = q(1 - 2 * smooth((f - 395) / 6), 20);
    }
    if (boom && k > 1) expr = "nervous";
    out.places.push(person(cam, { i: s.i, o: s.o, okey: s.okey }, s.x, D0, s.z, { side: false, mirror: false },
      { mode: "stand", expr, wave, blink: lidAt(T(f), s.i), look: car && k !== 1 ? Math.sign(car.x - s.x) : 0 }, {}));
    blob(out, s.x, D0, s.z);
    // el primero suda (no se atreve)
    if (k === 0 && id === 4) {
      const u = q(((f - 344) / 40) % 1, 20);
      out.fx.push({ key: `sudor${u}`, cw: 220, ch: 160, draw: (p) => fxSudor(p, u), x: s.x + cam.right.x * 0.05, y: D0 + 2.05, z: s.z - 0.15, w: 0.55, h: 0.4 });
    }
  });
};

// ---------------- los coches y quién va dentro ----------------
/** alguien sentado en un asiento del coche: la tarjeta se apoya en el cojín (y = 0.62 m sobre el suelo) */
const seated = (cam: CamInfo, c: CarPose, k: keyof typeof SEAT, who: Who, fo: FrontOpts, out: Stage, lean = 0) => {
  const [x, , z] = carPt(c, SEAT[k][0], 0, SEAT[k][2] + lean);
  out.places.push(person(cam, who, x, D0 + 0.62, z, { side: false, mirror: false }, { mode: "sit", ...fo }, {}));
};
const OFICIAL = (v: number): Outfit => ({ jacket: "#9cbad8", pants: "#23212b", boots: INK, hat: "cap", cap: "#5a6f8a", buttons: "#e8c45a", moustache: v % 2 ? "#3a2618" : undefined, skin: SKINS[v % 4] });

const carCast = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const c = carAt(id, f), sc = SHOTS[id - 1].scene, t = T(f);
  const passengers = !(id === 1 || id === 13);
  // chofer
  let cExpr: Expr = "neutral";
  if (id === 1) cExpr = "nervous";
  if (id === 7) cExpr = "whistle";
  if (id === 8) cExpr = f < 689 ? "neutral" : "shock";
  if (id === 13) cExpr = f < 1436 ? "nervous" : "whistle";
  if (id === 5 && f >= 451) cExpr = "shock";
  seated(cam, c, "chofer", { i: 600, o: CHOFER, okey: "chofer" }, { expr: cExpr, blink: cExpr === "whistle" ? 0 : lidAt(t, 600), look: id === 13 ? 0 : 0 }, out);
  if (id === 1) {
    const b = 0.04 * Math.sin(t * 5);
    const [x, , z] = carPt(c, SEAT.chofer[0] + 0.15, 0, SEAT.chofer[2]);
    out.fx.push({ key: "pregunta", cw: 160, ch: 220, draw: fxPregunta, x, y: D0 + 2.25 + b, z, w: 0.36, h: 0.5, rot: 0.15 });
  }
  if (id === 13 && f >= 1395) {
    // el mapa al revés, delante del pecho del chofer
    const k = smooth((f - 1395) / 8), [x, , z] = carPt(c, SEAT.chofer[0], 0, SEAT.chofer[2] + 0.35);
    out.fx.push({ key: "mapa", cw: 400, ch: 300, draw: fxMapa, x, y: D0 + 1.22, z, w: 0.6 * k, h: 0.44 * k, rot: Math.PI + 0.08 });
  }
  if (!passengers) return;
  // Potiorek delante, a la izquierda
  let pExpr: Expr = "stern";
  if (id === 7) pExpr = talk(f, "shout", "stern", 2);
  if (id === 8 && f >= 662 && f < 712) pExpr = "shout";
  if (id === 5 && f >= 451) pExpr = "shock";
  seated(cam, c, "acomp", { i: 601, o: POTIOREK, okey: "potiorek" }, { expr: pExpr, blink: lidAt(t, 601) }, out);
  // el archiduque y Sofía detrás
  let aExpr: Expr = "neutral", sExpr: Expr = "smile";
  if (id === 5) { aExpr = f < 425 ? "neutral" : "shock"; sExpr = f < 425 ? "smile" : "shock"; }
  if (id === 6) { aExpr = f < 500 ? "stern" : f < 540 ? "shout" : talk(f, "shout", "stern", 1); sExpr = "nervous"; }
  if (id === 7) { aExpr = talk(f + 2, "stern", "shout", 5); sExpr = "nervous"; }
  if (id === 8) { aExpr = f < 700 ? "stern" : "nervous"; sExpr = f < 700 ? "neutral" : "nervous"; }
  if (id === 9) { aExpr = "shock"; sExpr = "shock"; }
  seated(cam, c, "archi", { i: 602, o: ARCHIDUQUE, okey: "archi" }, { expr: aExpr, blink: lidAt(t, 602) }, out);
  seated(cam, c, "sofia", { i: 603, o: SOFIA, okey: "sofia" }, { expr: sExpr, blink: lidAt(t, 603) }, out);
  // escolta: dos oficiales
  const e = escortAt(id, f);
  if (e) {
    const dz = id === 5 && f >= 451;
    seated(cam, e, "chofer", { i: 610, o: OFICIAL(0), okey: "of0" }, { expr: dz ? "dazed" : "stern", blink: lidAt(t, 610) }, out);
    seated(cam, e, "archi", { i: 611, o: OFICIAL(1), okey: "of1" }, { expr: dz ? "shock" : "neutral", blink: lidAt(t, 611) }, out);
    seated(cam, e, "sofia", { i: 612, o: OFICIAL(2), okey: "of2" }, { expr: dz ? "dazed" : "neutral", blink: lidAt(t, 612) }, out);
  }
  void sc;
};

// ---------------- la bomba y la explosión ----------------
const bombFx = (f: number, out: Stage) => {
  const w = worldT(f), b = bombAt(w);
  if (b) out.fx.push({ key: `bomba${q(w % 1, 20)}`, cw: 200, ch: 200, draw: (p) => fxBomba(p, q(w % 1, 20)), x: b[0], y: b[1], z: b[2], w: 0.42, h: 0.42, rot: w * 9 });
  if (f >= 451 && f < 451 + 40) {
    const p0 = boomAt(), u = (f - 451) / 40;
    if (u < 0.35) { const v = q(u / 0.35, 30); out.fx.push({ key: `boom${v}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, v, "#ffd34d", 14, 60, 240), x: p0[0], y: D0 + 1.3, z: p0[2] - 0.6, w: 4.2, h: 4.2 }); }
    for (let k = 0; k < 3; k++) {
      const v = q(clamp01(u * 1.1 - k * 0.08), 30);
      out.fx.push({ key: `humo${k}|${v}`, cw: 400, ch: 400, draw: (p) => fxHumo(p, v, k), x: p0[0] + (k - 1) * 1.4, y: D0 + 1.6 + v * 2.2, z: p0[2] - 0.3 + k * 0.2, w: 3.6 + 2 * v, h: 3.6 + 2 * v, soft: true });
    }
  }
  if (f >= 491 || f < 451) return;
};

// ---------------- la esquina: Princip ----------------
const princip = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const [x, y, z] = PRINCIP_AT;
  const expr: Expr = id === 8 ? (f < 760 ? "neutral" : "stern") : "stern";
  out.places.push(person(cam, { i: 700, o: PRINCIP, okey: "princip" }, x, y, z, { side: false, mirror: false },
    { mode: "stand", expr, blink: lidAt(T(f), 700), look: -1, facing: -1 }, {}));
  blob(out, x, y, z);
  // dos fogonazos (sin mostrar el arma ni a las víctimas): destellos junto a su mano, del lado del coche
  for (const f0 of [831, 838]) if (f >= f0 && f < f0 + 5) {
    const u = q((f - f0) / 5, 30);
    out.fx.push({ key: `flash${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, "#fff3b0", 10, 40, 200), x: x - 0.75, y: D0 + 1.3, z: z - 0.35, w: 1.2, h: 1.2 });
  }
};
/** curiosos en la esquina (toma 8) */
const corner = (f: number, cam: CamInfo, out: Stage) => {
  ([[6.4, -37.4], [7.2, -38.6], [-6.6, -37.8], [-7.4, -39.2], [6.8, -40.4]] as const).forEach(([x, z], k) => {
    const v = 7 + k * 5, expr: Expr = f < 700 ? "smile" : "nervous";
    out.places.push(person(cam, { i: 720 + k, o: VECINO(v), okey: `v${v}` }, x, D0, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(T(f), 720 + k) }, {}));
    blob(out, x, D0, z);
  });
};
/** palomas que salen volando de los tejados tras los disparos */
const palomas = (f: number, out: Stage) => {
  if (f < 838) return;
  for (let k = 0; k < 9; k++) {
    const u = (f - 838) / FPS, x = -1.5 + k * 0.7 + u * (1.5 + k % 3), y = D0 + 4.2 + (k % 3) * 0.7 + u * (4 + (k % 2) * 2), z = -38.0 - (k % 4) * 0.6 - u * 1.5;
    const flap = q((f * 0.28 + k * 0.37) % 1, 8);
    out.fx.push({ key: `paloma${flap}`, cw: 260, ch: 160, draw: (p) => fxPaloma(p, flap), x, y, z, w: 0.75, h: 0.46, rot: 0.15 * Math.sin(k) });
  }
};

// ---------------- el juicio (toma 10) ----------------
const juicio = (f: number, cam: CamInfo, out: Stage) => {
  const base: V3 = [-14.5, D0, -35.2];
  out.places.push(person(cam, { i: 700, o: PRINCIP, okey: "princip" }, base[0], D0, base[2], { side: false, mirror: false }, { mode: "stand", expr: f < 900 ? "neutral" : "smile_closed", blink: lidAt(T(f), 700) }, {}));
  blob(out, base[0], D0, base[2]);
  for (const [dx, k] of [[-0.85, 0], [0.85, 1]] as const) {
    out.places.push(person(cam, { i: 730 + k, o: GENDARME, okey: "gend" }, base[0] + dx, D0, base[2] - 0.2, { side: false, mirror: false }, { mode: "stand", expr: "stern", blink: lidAt(T(f), 730 + k), facing: k ? -1 : 1 }, {}));
    blob(out, base[0] + dx, D0, base[2] - 0.2);
  }
};

// ---------------- un mes después: soldados de 1914 (toma 11) ----------------
const SOLDADO = (v: number): Outfit => ({ jacket: "#8e969b", pants: "#7d858a", boots: INK, hat: "cap", cap: "#7d858a", belt: "#4a3a2a", buttons: "#c9ccd2", rifle: true,
  moustache: v % 3 === 1 ? "#4a3426" : undefined, skin: SKINS[v % 4] });
const marcha = (f: number, cam: CamInfo, out: Stage) => {
  const t = T(f), files = [-34.6, -33.8, -33.0, -32.2];
  for (let i = 0; i < 44; i++) {
    const row = i >> 2, z = files[i & 3] + (hh(i) - 0.5) * 0.08;
    const x = 2 + row * 1.3 + (t - 944 / FPS) * 1.4 * 0 - (t - 31.47) * 1.6; // hacia -x, hacia la cámara
    const ph = q((((t * 2) % 1) + 1) % 1, 30), v = (i * 7 + (i >> 2)) % 4;
    const view = viewOf(cam, x, z, -1, 0);
    out.places.push(person(cam, { i: 800 + i, o: SOLDADO(v), okey: `sold${v}` }, x, D0, z, view,
      { mode: "march", phase: ph, expr: "stern", blink: lidAt(t, 800 + i) }, { mode: "march", phase: ph, expr: "stern", stride: view.fs, blink: lidAt(t, 800 + i) }));
    blob(out, x, D0, z);
  }
};

/** todo lo que tiene cara en la toma id, cuadro f */
export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  switch (s.scene) {
    case "desfile": crowd(id, f, cam, out, carAt(id, f)); carCast(id, f, cam, out); if (id === 5) bombFx(f, out); break;
    case "parado": carCast(id, f, cam, out); break;
    case "giro": carCast(id, f, cam, out); princip(id, f, cam, out); corner(f, cam, out); break;
    case "esquina": carCast(id, f, cam, out); if (id === 9) { princip(id, f, cam, out); palomas(f, out); } break;
    case "juicio": juicio(f, cam, out); break;
    case "marcha": marcha(f, cam, out); break;
    case "domino": break;
  }
  return out;
};
void STOP; void THROWER; void T_THROW; void bodyFront; void bodySide; void fxShadow; void NOINK;
