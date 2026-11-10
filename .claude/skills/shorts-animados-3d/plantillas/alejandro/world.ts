// The Gaugamela plain v2, one three.js world posed per frame (pure function of shot id + frame), built with the
// template's pieces: painted sky by elevation, two-tone world materials, painted grass, flat cartoon clouds, lit
// character cards with contact blobs, world ink. New here: snowy peaks, an instanced 100,000-man host, side-view
// cards for Bucephalus, elephants, scythed chariots and cavalry.
// Macedonians at z <= 0 (Alexander on Bucephalus at the origin), Persians from z ~ 25 (charge line) to z = 254.
import * as THREE from "three";
import { Pen, bodyFront, Outfit, Expr, SKINS, horse, ride, elephant, chariot, WG } from "./toon";
import { Pool, Actor, Fx, Stage, tier, tierW, light2D, blob, BODY, WIDE } from "./troop";
import { Crowd, atlas } from "./crowd";
import { NOINK } from "./ink";
import { LIGHTS, LOOK, LightPreset, WorldLook } from "./lights";
import { TONE, CHAR, twoTone, untone } from "./shade";
import { grassHD, cloudHD, rep, ctex } from "./paint";
import { horseFront, rideFront, chariotFront } from "./toon";
import { FPS, SHOTS, camAt, smooth, elephantZ, chariotZ, cavalryZ, gait, worldF } from "./story";

// ---------------- battle look: smoky orange day (Luis: "no un ambiente feliz") ----------------
const BL: LightPreset = { ...LIGHTS.golden, el: 26, lit: [1.38, 0.98, 0.66], shade: [0.2, 0.18, 0.28], lift: [0.05, 0.05, 0.1],
  charTint: [1.0, 0.86, 0.72], fog: "#b48a6a", sunCol: "#ffc68a", sunI: 3.2, sky: "#e0b090", ground: "#6a5048", hemiI: 0.5, actorShadow: false };
const BK: WorldLook = { ...LOOK.golden, sky: { c: ["#cf9a6e", "#c0835c", "#a3684c", "#7a4e44", "#4e3a3e"], e: [0, 4, 10, 20, 40] }, sat: 0.82 };
const SMOKY = { lit: "#e2b08a", mid: "#9a7466", shade: "#56454e" };

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const lam = (p: THREE.MeshLambertMaterialParameters) => twoTone(new THREE.MeshLambertMaterial(p));
const LIGHT = -2.1;

// ---------------- cast ----------------
const MACE_SKIN = [SKINS[0], SKINS[1], SKINS[2], SKINS[1]];
const macedonian = (v: number): Outfit => ({
  jacket: v % 3 === 2 ? "#efe3c8" : "#b8322f", pants: "#c98f3e", boots: "#6b4a2a", hat: "greek", spear: true,
  shield: "#c98f3e", skin: MACE_SKIN[v % 4], moustache: v % 4 === 1 ? "#4a3426" : undefined,
});
const PERS_COL = ["#6a3a96", "#d9a441", "#2f6fae", "#c0503a", "#3f8a5a", "#efe3c8"];
const PERS_CAP = ["#efe3c8", "#e8c45a", "#efe3c8", "#d9c27a", "#efe3c8", "#e8c45a"];
const persian = (v: number): Outfit => ({
  jacket: PERS_COL[v % 6], pants: v % 2 ? "#e8dcc0" : "#7a5a3a", boots: "#4a3426", hat: "persian", cap: PERS_CAP[(v * 5) % 6], spear: true,
  skin: [SKINS[1], SKINS[3], SKINS[2]][v % 3], beard: "#2a1d16",
});
const ALEXANDER: Outfit = { jacket: "#e9b949", pants: "#c98f3e", boots: "#6b4a2a", hat: "greek_gold", cape: "#b0262c", skin: SKINS[0], buttons: "#b0262c", hair: "#f4d98a" };
/** Darius III in his royal chariot, in front of his host */
const DARIUS: Outfit = { jacket: "#5b2a86", pants: "#e8c45a", boots: "#3a2a20", hat: "crown", beard: "#1a1410", skin: SKINS[2], buttons: "#e8c45a", cape: "#a8262c" };
const DARIUS_AT = { x: 0, z: 47 };
const BUCEPHALUS = { coat: "#2a2430", mane: "#141018", blaze: true, cloth: "#b0262c" };
const PCOATS = [{ coat: "#8a5a34", mane: "#2a1d16", cloth: "#6a3a96" }, { coat: "#c9b8a0", mane: "#5a4632", cloth: "#c0503a" }, { coat: "#f1ece2", mane: "#8a7a66", cloth: "#2f6fae" }, { coat: "#5a3a26", mane: "#1d140e", cloth: "#d9a441" }];

/** Alexander's few men as cards: 12 files x 7 ranks behind him; the rest of his army is the small instanced block */
const GUARD = (() => {
  const out: { x: number; z: number; v: number; i: number }[] = [];
  let i = 0;
  for (let r = 0; r < 7; r++) for (let c = 0; c < 12; c++) {
    out.push({ x: -6.05 + c * 1.1 + (hh(i, 1) - 0.5) * 0.2, z: -3.2 - r * 1.25 + (hh(i, 2) - 0.5) * 0.2, v: (i * 7 + (i >> 3)) % 12, i }); i++;
  }
  return out;
})();
const grid = (x0: number, x1: number, z0: number, z1: number, step: number, seed: number) => {
  const out: { x: number; z: number }[] = [];
  let i = 0;
  for (let z = z0; z <= z1; z += step) for (let x = x0; x <= x1; x += step) {
    out.push({ x: x + (hh(i, seed) - 0.5) * step * 0.6, z: z + (hh(i, seed + 1) - 0.5) * step * 0.6 }); i++;
  }
  return out;
};
/** Persian infantry cards just behind the charge (the ground shots need lit faces close by) */
const PERS_NEAR = grid(-26, 34, 49, 57, 1.6, 7).map((p, i) => ({ ...p, v: (i * 5 + 3) % 12, i }));
const ELEPHANTS = Array.from({ length: 15 }, (_, k) => ({ x: -112 + k * 16 + (hh(k, 3) - 0.5) * 3 + (k === 7 ? 9 : 0), dz: (k % 2) * 1.6 }));
const CHARIOTS = Array.from({ length: 200 }, (_, k) => ({ x: -150 + (k % 67) * 4.5 + (k / 67 | 0) * 1.5 + (hh(k, 4) - 0.5) * 1.2, dz: (k / 67 | 0) * 4 + (hh(k, 5) - 0.5) * 1.5 }));
const CAVALRY = [...grid(-170, -138, 44, 70, 3.2, 9), ...grid(16, 44, 46, 62, 3.4, 11), ...grid(138, 170, 44, 70, 3.2, 13)].map((p, i) => ({ ...p, v: i % 4, i }));

// ---------------- the battlefield: scorched ground, burning arrows, the fallen, broken chariots, smoke ----------------
const ARROWS = [...Array.from({ length: 220 }, (_, k) => ({ x: (hh(k, 60) - 0.5) * 70, z: -1 + hh(k, 61) * 30 })),
  ...Array.from({ length: 60 }, (_, k) => ({ x: -12 + hh(k, 62) * 26, z: 20 + hh(k, 63) * 24 }))].map((a, i) => ({ ...a, i, lean: (hh(i, 64) < 0.5 ? -1 : 1) * (0.3 + hh(i, 66) * 0.5), fire: hh(i, 65) < 0.55 }));
const FALLEN = Array.from({ length: 46 }, (_, k) => ({ x: (hh(k, 70) - 0.5) * 60, z: 1 + hh(k, 71) * 40, rot: hh(k, 72) * 6.28, v: k }));
const WRECKS = [[-7, 9], [9, 14], [-3, 31], [5, 22], [-16, 18], [20, 27], [-28, 12], [30, 8]].map(([x, z], i) => ({ x, z, i }));
const SMOKE = [[-30, 22], [24, 12], [14, 44], [-46, 52], [50, 40], [70, 90], [-80, 120], [26, 170], [-34, 270], [110, 230]].map(([x, z], i) => ({ x, z, i }));
const SCORCH = Array.from({ length: 70 }, (_, k) => ({ x: (hh(k, 80) - 0.5) * 120, z: -10 + hh(k, 81) * 70, w: 5 + hh(k, 82) * 12, rot: hh(k, 83) * 6.28 }));
const flame = (p: Pen, v: number, cx: number, by: number, s: number) => {
  const j = [0, 1, 2].map((k) => Math.sin(v * 2.1 + k * 1.7) * 0.18);
  p.poly([[cx - 26 * s, by], [cx - 30 * s, by - 50 * s], [cx - 8 * s, by - (110 + 30 * j[0]) * s], [cx + 6 * s, by - 60 * s], [cx + 18 * s, by - (95 + 30 * j[1]) * s], [cx + 30 * s, by - 40 * s], [cx + 26 * s, by]], "#ff7a1a", 0);
  p.poly([[cx - 14 * s, by], [cx - 14 * s, by - 40 * s], [cx, by - (75 + 25 * j[2]) * s], [cx + 14 * s, by - 38 * s], [cx + 14 * s, by]], "#ffd84a", 0);
};
const arrowDraw = (fire: boolean, v: number) => (p: Pen) => { // 128 x 256 card, tip in the ground at the bottom
  p.band([[64, 256], [64, 70]], "#3a2618", 4, 1.5, "butt");
  for (const s of [-1, 1]) p.poly([[64, 70], [64 + s * 16, 52], [64 + s * 16, 92], [64, 104]], fire ? "#2a201c" : "#e9e2d0", 2);
  if (fire) flame(p, v, 64, 236, 0.5);
};
const smokeDraw = (p: Pen) => {
  const g = p.g;
  for (const [x, y, r, a, c] of [[128, 140, 110, 0.62, "58,48,48"], [96, 120, 70, 0.45, "84,72,70"], [160, 110, 76, 0.45, "70,60,60"], [128, 90, 60, 0.4, "104,92,88"]] as const) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(0.6, `rgba(${c},${a * 0.6})`); gr.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  }
};
const scorchDraw = (p: Pen) => {
  const g = p.g;
  for (let k = 0; k < 6; k++) {
    const x = 128 + Math.cos(k * 2.1) * 50, y = 128 + Math.sin(k * 1.3) * 46, r = 70 - k * 6;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(28,22,20,0.42)"); gr.addColorStop(0.6, "rgba(40,32,28,0.22)"); gr.addColorStop(1, "rgba(40,32,28,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  }
  for (let k = 0; k < 14; k++) { g.fillStyle = "rgba(255,120,40,0.7)"; g.beginPath(); g.arc(128 + Math.cos(k * 3.7) * 50, 128 + Math.sin(k * 2.3) * 44, 2.5, 0, 6.3); g.fill(); } // embers
};
const wreckDraw = (p: Pen) => { // broken chariot on its side, a loose wheel, the snapped pole
  const G = WG;
  p.g.save(); p.g.translate(900, G - 120); p.g.rotate(-0.42);
  p.poly([[-180, -230], [170, -230], [190, 0], [-190, 0]], "#6e4a2e", 10); p.band([[-185, -205], [175, -205]], "#b8963a", 18, 4);
  p.g.restore();
  p.ell(1260, G - 40, 150, 46, null, 16); p.ell(1260, G - 40, 130, 38, null, 10);
  for (let k = 0; k < 6; k++) { const q = (k * Math.PI) / 3; p.stroke([[1260, G - 40], [1260 + 140 * Math.cos(q), G - 40 + 42 * Math.sin(q)]], 9, "#4a3020"); }
  p.band([[520, G - 60], [760, G - 150]], "#5a3a22", 16, 4); p.band([[1500, G - 30], [1700, G - 80]], "#5a3a22", 16, 4);
  flame(p, 1, 960, G - 150, 2.2);
};

// ---------------- embers: points in a box that wraps around the camera, rising and swirling ----------------
const EMB = { n: 7500, b: 30, h: 9 };
const EMBER_VS = `
attribute vec4 aSeed; uniform float uT; uniform vec3 uCam; uniform float uPx; varying float vA; varying float vHot;
void main() {
  float B = ${EMB.b.toFixed(1)}, H = ${EMB.h.toFixed(1)};
  vec3 p = position;
  p.y = mod(p.y + uT * (0.35 + 0.9 * aSeed.x), H);
  p.x += sin(uT * (0.6 + aSeed.y) + aSeed.z * 30.0) * 0.6 + uT * 0.45;
  p.z += cos(uT * (0.5 + aSeed.z) + aSeed.w * 30.0) * 0.6;
  p.xz = uCam.xz + mod(p.xz - uCam.xz + 0.5 * B, B) - 0.5 * B;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float big = step(0.8, aSeed.w);
  float sz = mix(0.03, 0.06, aSeed.y) + big * 0.1;
  gl_PointSize = clamp(sz * uPx / max(0.1, -mv.z), 2.0, 90.0);
  float life = p.y / H;
  vA = smoothstep(0.0, 0.06, life) * (1.0 - smoothstep(0.6, 1.0, life)) * (0.6 + 0.4 * sin(uT * (5.0 + 6.0 * aSeed.x) + aSeed.z * 50.0));
  vA *= smoothstep(0.35, 1.0, -mv.z);
  vHot = aSeed.x;
  gl_Position = projectionMatrix * mv;
}`;
const EMBER_FS = `
uniform float uFade; varying float vA; varying float vHot;
void main() {
  vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0;
  if (r > 1.0) discard;
  float core = exp(-r * r * 4.0) + 0.6 * exp(-r * r * 30.0);
  vec3 c = mix(vec3(1.0, 0.32, 0.05), vec3(1.0, 0.72, 0.28), vHot);
  gl_FragColor = vec4(c * core * vA * uFade * 3.4, 1.0);
}`;

// ---------------- world ----------------
export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private skyMat: THREE.ShaderMaterial; private sky: THREE.Mesh;
  private fog = new THREE.Fog("#bccbec", 120, 1500);
  private clouds: THREE.Mesh[] = [];
  private host: Crowd; private host2: Crowd; private army: Crowd;
  private embers = { uT: { value: 0 }, uCam: { value: new THREE.Vector3() }, uPx: { value: 1000 }, uFade: { value: 1 } };
  private sunCache = new Map<number, THREE.Vector3>();
  private frustum = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private sph = new THREE.Sphere(); private v = new THREE.Vector3();

  constructor() {
    const R = this.root;
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el)); gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(2400, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
    R.add(this.hemi, this.sun, this.sun.target);
    // clouds: a ring around the horizon, some low ones between the peaks, and a few the camera rises past
    const cm = [0, 1, 2, 3].map((k) => cloudHD(k, SMOKY));
    const cloud = (x: number, y: number, z: number, w: number, k: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cm[k % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      m.position.set(x, y, z); m.scale.set(w, w / 2, 1); m.layers.set(NOINK); this.clouds.push(m); R.add(m);
    };
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + hh(i, 20), d = 700 + hh(i, 21) * 600;
      cloud(Math.cos(a) * d, 140 + hh(i, 22) * 300, Math.sin(a) * d, 160 + hh(i, 23) * 140, i);
    }
    for (const [x, y, z, w] of [[-150, 210, -40, 170], [160, 300, -80, 190], [-190, 420, -120, 220], [175, 480, -10, 200], [-120, 330, 60, 160], [140, 150, 120, 150]]) cloud(x, y, z, w, x > 0 ? 1 : 2);

    // ground: painted grass; trampled dirt under both armies
    const burnt = ctex("burntHD", 512, 512, (g, r) => {
      g.fillStyle = "#8a7254"; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 260; i++) { const x = r() * 512, y = r() * 512, rr = 6 + r() * 40, gr = g.createRadialGradient(x, y, 0, x, y, rr);
        const c = r() < 0.55 ? "40,32,28" : r() < 0.7 ? "120,104,80" : "86,70,52"; gr.addColorStop(0, `rgba(${c},0.5)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(x - rr, y - rr, 2 * rr, 2 * rr); }
      g.strokeStyle = "rgba(30,24,20,0.45)"; g.lineWidth = 1.5;
      for (let i = 0; i < 40; i++) { let x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 40; y += (r() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
    });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000).rotateX(-Math.PI / 2), lam({ map: rep(burnt, 900, 900), color: "#ffffff" }));
    ground.receiveShadow = true; R.add(ground);
    const dirtTex = ctex("dirtHD", 512, 512, (g, r) => {
      g.fillStyle = "#9c8466"; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "rgba(90,72,56,0.4)" : "rgba(160,140,112,0.3)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 2 + r() * 7, 1 + r() * 3, 0, 0, 6.3); g.fill(); }
    });
    for (const [x0, x1, z0, z1] of [] as number[][]) {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2), lam({ map: rep(dirtTex, (x1 - x0) / 8, (z1 - z0) / 8) }));
      d.position.set((x0 + x1) / 2, 0.01, (z0 + z1) / 2); d.receiveShadow = true; R.add(d);
    }
    // rolling hills, then a ring of very high snowy peaks
    const hillM = lam({ map: rep(burnt, 30, 10), color: "#c8b8a8" });
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2 + hh(k, 7), d = 420 + hh(k, 8) * 160;
      if (Math.sin(a) > -0.3) continue;
      const h = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), hillM);
      h.position.set(Math.cos(a) * d, -2, Math.sin(a) * d); h.scale.set(110 + hh(k, 9) * 80, 22 + hh(k, 10) * 22, 70 + hh(k, 11) * 40);
      h.receiveShadow = true; R.add(h);
    }
    const peakM = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false });
    const ROCK = [new THREE.Color("#5e5566"), new THREE.Color("#544b5c")], SNOW = new THREE.Color("#fbf6f2"), HAZE = new THREE.Color("#b88e74"), SUNL = new THREE.Vector3(0.55, 0.6, -0.58).normalize(), nv = new THREE.Vector3();
    for (let k = 0; k < 34; k++) {
      const a = (k / 34) * Math.PI * 2 + hh(k, 30) * 0.12, d = 1500 + hh(k, 31) * 500, h = 300 + hh(k, 32) * 330, r = h * (0.5 + hh(k, 33) * 0.22);
      const geo = new THREE.ConeGeometry(r, h, 22, 10).toNonIndexed(), pos = geo.attributes.position, col: number[] = [];
      for (let i = 0; i < pos.count; i++) { // ridges: radius wobbles around the peak and with height, apex kept sharp
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), q = Math.atan2(z, x), up = (y + h / 2) / h;
        const n = 1 + 0.22 * Math.sin(q * 5 + k) * Math.sin(up * 9 + q * 3) + 0.12 * Math.sin(q * 11 + up * 17);
        pos.setXYZ(i, x * n, y + Math.sin(q * 7 + k) * h * 0.03 * (1 - up), z * n);
      }
      geo.computeVertexNormals();
      for (let i = 0; i < pos.count; i += 3) { // per face: snow above the line (ragged), rock below, a touch of haze
        const up = ((pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3 + h / 2) / h, q = Math.atan2(pos.getZ(i), pos.getX(i));
        nv.set(geo.attributes.normal.getX(i), geo.attributes.normal.getY(i), geo.attributes.normal.getZ(i)).applyAxisAngle(new THREE.Vector3(0, 1, 0), hh(k, 34) * 6.28);
        const lit = nv.dot(SUNL) > 0.05 ? 1 : 0.62; // two-tone, like the rest of the world
        const snow = up > 0.6 + 0.08 * Math.sin(q * 6 + k) + 0.05 * Math.sin(q * 19);
        const c = (snow ? SNOW : ROCK[0]).clone().multiplyScalar(snow ? (lit ? 1 : 0.78) : lit ? 1.25 : 0.8).lerp(HAZE, 0.28 + 0.12 * (d - 1500) / 500);
        for (let j = 0; j < 3; j++) col.push(c.r, c.g, c.b);
      }
      geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
      const m = new THREE.Mesh(geo, peakM);
      m.position.set(Math.cos(a) * d, h / 2 - 6, Math.sin(a) * d); m.rotation.y = hh(k, 34) * 6.28;
      R.add(m);
    }
    // the two hosts as instanced crowds: ~100,000 Persians, a small block of Macedonians
    const pAt = atlas(Array.from({ length: 12 }, (_, i) => persian(i)), LIGHT);
    const mAt = atlas(Array.from({ length: 8 }, (_, i) => (i % 2 ? macedonian(i) : { ...macedonian(i), spear: false })), LIGHT,
      (i) => (i % 2 ? { raise: 1, expr: "shout" } : { prop: ["sword", 0], expr: "shout" }));
    this.host = new Crowd(R, pAt, grid(-132, 132, 59, 253, 0.74, 40), 1.7);
    // ...and it never ends: a sparser host all the way to the horizon, wider than any frame
    this.host2 = new Crowd(R, pAt, [...grid(-300, 300, 59, 520, 0.74, 44).filter((q) => q.z > 254 || Math.abs(q.x) > 133), ...grid(-460, 460, 59, 1100, 1.25, 45).filter((q) => q.z > 520 || Math.abs(q.x) > 300)], 3.1);
    this.army = new Crowd(R, mAt, grid(-16, 16, -48, -13, 1.05, 50), 2.3);
    // the world is burning: glowing embers drifting up all around the camera (Luis v4)
    {
      const N = EMB.n, pos = new Float32Array(N * 3), sd = new Float32Array(N * 4);
      for (let i = 0; i < N; i++) {
        pos.set([hh(i, 90) * EMB.b, hh(i, 91) * EMB.h, hh(i, 92) * EMB.b], i * 3);
        sd.set([hh(i, 93), hh(i, 94), hh(i, 95), hh(i, 96)], i * 4);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("aSeed", new THREE.BufferAttribute(sd, 4));
      const mat = new THREE.ShaderMaterial({ uniforms: this.embers, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: EMBER_VS, fragmentShader: EMBER_FS });
      const pts = new THREE.Points(geo, mat);
      pts.frustumCulled = false; pts.layers.set(NOINK); pts.renderOrder = 5;
      const u = this.embers.uPx;
      pts.onBeforeRender = (r, _s, c) => { const rt = r.getRenderTarget(), h = rt ? rt.height : r.domElement.height; u.value = h / (2 * Math.tan(THREE.MathUtils.degToRad((c as THREE.PerspectiveCamera).fov) / 2)); };
      R.add(pts);
    }
  }

  /** camera-relative sun frozen per shot: az from the shot's mean view direction */
  private shotSun(id: number) {
    let v = this.sunCache.get(id);
    if (v) return v;
    const s = SHOTS[id - 1], L = BL;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) { const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1; fx += x / n; fz += z / n; }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(id === 1 ? 70 : id === 2 ? 110 : -65), el = THREE.MathUtils.degToRad(L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }
  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const fw = worldF(f), fi0 = Math.floor(fw), t = fw / FPS, L = BL, K = BK, S = SHOTS[id - 1];
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look);
    cam.fov = c.fov; cam.near = c.pos[1] > 30 ? 1 : 0.2; cam.far = 5000; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = V(...c.look), dist = cam.position.distanceTo(focus), sunDir = this.shotSun(id);
    // light rig
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 120);
    this.sun.position.copy(focus).addScaledVector(sunDir, 300); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 700; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce);
    TONE.uSat.value = 0.8; // the reference measures saturation .49-.66 at 30 fps; the painted grass alone gave .70
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // sky + fog (the aerial shot clears the haze as it climbs)
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color);
    const up = smooth((c.pos[1] - 5) / 300);
    this.fog.near = THREE.MathUtils.lerp(70, S.fog[0], up); this.fog.far = THREE.MathUtils.lerp(1100, S.fog[1], up);
    scene.fog = this.fog; scene.background = null;
    for (const m of this.clouds) m.quaternion.copy(cam.quaternion);
    this.embers.uT.value = t; this.embers.uCam.value.copy(cam.position);
    this.embers.uFade.value = 1 - smooth((c.pos[1] - 8) / 22);
    // the host marches slowly forward once the charge starts
    this.host.shift.value.set(0, 0, -0.9 * Math.max(0, t - 6.2)); this.host2.shift.value.copy(this.host.shift.value);

    // ---- cast ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const light = light2D(sunDir, right);
    const st: Stage = { places: [], fx: [] };
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const lidAt = (i: number) => { // 4-frame blinks every 0.5-2.3 s
      let s = Math.round(-60 * hh(i, 9));
      for (let n = 0; s <= f && n < 80; n++) { const k = f - s; if (k >= 0 && k < 4) return [0.5, 1, 1, 0.5][k]; s += Math.round(15 + 54 * hh(i * 31 + n, 13)); }
      return 0;
    };
    const visible = (x: number, y: number, z: number, r: number) => this.frustum.intersectsSphere(this.sph.set(this.v.set(x, y, z), r));
    const person = (who: string, o: Outfit, x: number, y: number, z: number, opts: Parameters<typeof bodyFront>[2], i: number, contact = true) => {
      if (!visible(x, y + 1.1, z, 3.5)) return;
      const d = cam.position.distanceTo(this.v.set(x, y + 1.2, z)), [w, h, k] = tier(d), near = d < 16;
      const o2 = { ...opts, light, seed: (i * 5 + 3) % 7 + 1, blink: near ? lidAt(i) : 0 };
      if (!near) o2.expr = "neutral";
      st.places.push({ key: `${who}|${JSON.stringify(o2)}`, x, y, z, size: [w, h, k], draw: (p) => bodyFront(p, o, o2) });
      if (contact && d < 60) blob(st, sunDir, x, y, z);
    };
    /** side-view card moving along -z: mirrored when -z runs to screen-left */
    const side = (key: string, x: number, z: number, scale: number, draw: (p: Pen) => void, dir = -1) => {
      if (!visible(x, 1.5 * scale, z, 5 * scale)) return;
      const d = cam.position.distanceTo(this.v.set(x, 1.4 * scale, z)) / scale, [w, h, k] = tierW(d);
      const mirror = dir !== 0 && dir * right.z < 0; // dir 0: front view, never mirrored
      st.places.push({ key: `${key}|${w}`, x, y: 0, z, size: [w, h, k], wide: true, scale, mirror, draw });
      if (d * scale < 80) { blob(st, sunDir, x - 1.0 * scale, 0, z, 1.6 * scale); blob(st, sunDir, x + 1.0 * scale, 0, z, 1.6 * scale); }
    };
    const pOpts = (i: number) => ({ mode: "march" as const, phase: gait(t, 1.05), expr: (i % 4 === 0 ? "stern" : "neutral") as Expr, facing: 0 as const, lift: 40 });

    {
      // Alexander on Bucephalus, sword raised on the first beat
      // Bucephalus rears on the first beat (as in the painting Luis sent), holds, comes down as the camera pulls back
      const rear = Math.round(22 * (smooth(f / 14) - smooth((f - 34) / 16)));
      const ao = { expr: "stern" as Expr, light, seed: 3, blink: lidAt(1), look: 0 };
      side(`alexF|${rear}|${JSON.stringify(ao)}`, 0, 0, 1, (p) => { horseFront(p, BUCEPHALUS, 1000, () => rideFront(p, ALEXANDER, 1000, rear, ao, 1.1, true), rear, -1); }, 0);
      // his men raise their weapons and shout as we pass him, front rank first (Luis v4)
      for (const s of GUARD) {
        const r0 = 6 + ((-3.2 - s.z) / 1.25) * 2.2 + hh(s.i, 21) * 7;
        const up = Math.round(6 * smooth((f - r0) / 9)) / 6;
        const ex2: Expr = up > 0.5 ? "shout" : s.i % 3 === 0 ? "neutral" : "stern";
        if (s.i % 2 === 0) { // sword drawn low, then thrust up
          const o = { ...macedonian(s.v), spear: false };
          person(`ms${s.v}`, o, s.x, 0, s.z, { mode: "stand", expr: ex2, facing: 0, prop: ["sword", 1 - up] as ["sword", number] }, s.i + 10);
        } else person(`m${s.v}`, macedonian(s.v), s.x, 0, s.z, { mode: "stand", expr: ex2, facing: 0, raise: up }, s.i + 10);
      }
    }
    if (id >= 2) {
      const ph = gait(t, 1.6), eph = gait(t, 0.7), cph = gait(t, 2.4);
      const dao = { expr: "stern" as Expr, light, seed: 6, blink: lidAt(3), look: 0, prop: ["sword", 0.15] as ["sword", number] };
      side(`darius|${JSON.stringify(dao)}`, DARIUS_AT.x, DARIUS_AT.z, 1, (p) => chariotFront(p, DARIUS, dao), 0);
      for (const [k, e] of ELEPHANTS.entries()) {
        const z = elephantZ(t) + e.dz, q = (eph + (k % 2) * 0.5) % 1;
        side(`el|${q}|${light}|${k % 3}`, e.x, z, 1.7, (p) => elephant(p, q, persian(k % 3 + 2), light));
      }
      for (const [k, ch] of CHARIOTS.entries()) {
        const z = chariotZ(t) + ch.dz, q = (cph + (k % 3) * 0.33) % 1;
        side(`ch|${q}|${light}|${k % 3}|${Math.round(fw) % 6}`, ch.x, z, 1.0, (p) => chariot(p, q, persian(k % 3), light, t));
      }
      for (const cv of CAVALRY) {
        const z = cavalryZ(t) + (cv.z - 46), q = (ph + (cv.i % 2) * 0.5) % 1;
        side(`cav|${cv.v}|${q}|${light}`, cv.x, z, 1.0, (p) => { horse(p, PCOATS[cv.v], 1000, q, () => ride(p, persian(cv.v + 1), [1000, WG - 585], { expr: "stern", light, seed: 5 })); });
      }
      for (const s of PERS_NEAR) person(`p${s.v}`, persian(s.v), s.x, 0, s.z - 0.9 * Math.max(0, t - 6.2), pOpts(s.i), s.i + 1000, false);
    }

    // the battlefield
    for (const a of ARROWS) {
      const da = cam.position.distanceTo(this.v.set(a.x, 0.4, a.z));
      if (da > 45 || da < 2.5) continue;
      const v = a.fire ? (fi0 + a.i) % 4 : 0;
      st.fx.push({ key: `arrow|${a.fire}|${v}`, cw: 128, ch: 256, draw: arrowDraw(a.fire, v), x: a.x, y: 0, z: a.z, w: 0.34, h: 0.68, lean: a.lean });
    }
    for (const b of FALLEN) {
      const o = b.v % 3 ? persian(b.v) : macedonian(b.v);
      st.fx.push({ key: `fallen|${b.v % 6}`, cw: 300, ch: 500, draw: (p) => { p.g.scale(0.5, 0.5); bodyFront(p, o, { mode: "fall", expr: "dazed", light: LIGHT, seed: (b.v % 7) + 1 }); }, x: b.x, y: 0.03, z: b.z, w: 1.3, h: 2.16, flat: true, rot: b.rot });
    }
    for (const sc2 of SCORCH) st.fx.push({ key: "scorch", cw: 256, ch: 256, draw: scorchDraw, x: sc2.x, y: 0.03, z: sc2.z, w: sc2.w, h: sc2.w * 0.8, flat: true, rot: sc2.rot, soft: true });
    for (const w of WRECKS) side(`wreck|${(fi0 >> 1) % 4}`, w.x, w.z, 1.0, wreckDraw);
    for (const sm of SMOKE) for (let k = 0; k < 6; k++) {
      const u = (t * 0.09 + k / 6 + sm.i * 0.13) % 1, sz = 4 + u * 16;
      if (cam.position.distanceTo(this.v.set(sm.x - u * 14, 2 + u * 34, sm.z + u * 4)) < sz * 1.6) continue;
      st.fx.push({ key: "smoke", cw: 256, ch: 256, draw: smokeDraw, x: sm.x - u * 14, y: 2 + u * 34, z: sm.z + u * 4, w: sz, h: sz, soft: true });
    }

    let ai = 0;
    for (const p of st.places) {
      const a = this.actor(ai++), [w, h, k] = p.size, s = p.scale ?? 1;
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.geometry = p.wide ? WIDE : BODY;
      a.mesh.visible = true; a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), 0);
      a.mesh.scale.set(p.mirror ? -s : s, s, s);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    for (const p of st.fx) {
      if (!visible(p.x, p.y, p.z, Math.max(p.w, p.h))) continue;
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft); e.mesh.visible = true; e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else {
        const yaw = Math.atan2(cam.position.x - p.x, cam.position.z - p.z);
        e.mesh.rotation.order = "YXZ"; e.mesh.rotation.set(0, yaw, p.lean ?? 0);
        if (p.soft) e.mesh.quaternion.copy(cam.quaternion);
        if (p.lean !== undefined) { // stuck in the ground at an angle: the tip stays at (x, 0, z)
          const hl = p.h / 2, o = -Math.sin(p.lean) * hl;
          e.mesh.position.set(p.x + o * Math.cos(yaw), Math.cos(p.lean) * hl, p.z - o * Math.sin(yaw));
        }
      }
      e.mesh.scale.set(p.w, p.h, 1);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (let i = 0; i < ai; i++) this.actors[i].bind();
    for (let i = 0; i < fi; i++) this.fxs[i].bind();
    return focus;
  }
}
