// Personajes 3D tipo caricatura (muñequitos de juguete) armados con primitivas a partir del mismo Outfit de toon.ts.
// Cabeza grande, cuerpo de botella, brazos y piernas de tubo, cara con expresiones (ojos, cejas, boca) y accesorios
// (pelo, barba, bigote, gorra, casco griego, corona, laurel, capa, escudo, lanza). Se miran a cámara como las tarjetas.
import * as THREE from "three";
import type { Outfit, Expr } from "./toon";

export type FigOpts = { mode: string; expr: Expr; blink: number; look: number; phase: number; hat?: boolean };

const mats = new Map<string, THREE.Material>();
const GRAD = (() => {
  const d = new Uint8Array([90, 170, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true;
  return t;
})();
/** material de juguete: toon de tres tonos */
export const M = (col: string) => {
  let m = mats.get(col);
  if (!m) { m = new THREE.MeshToonMaterial({ color: col, gradientMap: GRAD }); mats.set(col, m); }
  return m;
};
const INKC = "#2a1d24";
const SPH = new THREE.SphereGeometry(1, 28, 20);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 24);
const CAP = new THREE.CapsuleGeometry(1, 1, 6, 16);
const HALF = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
const TOR = new THREE.TorusGeometry(1, 0.16, 8, 24, Math.PI);
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CONE = new THREE.ConeGeometry(1, 1, 20);

type Face = { eye: "open" | "happy" | "shock" | "squint" | "spiral"; mouth: "smile" | "grin" | "o" | "O" | "frown" | "line" | "laugh" | "shout"; brow: number };
const FACES: Record<string, Face> = {
  neutral: { eye: "open", mouth: "line", brow: 0 }, stern: { eye: "squint", mouth: "frown", brow: 0.45 },
  grin: { eye: "happy", mouth: "grin", brow: -0.15 }, laugh: { eye: "happy", mouth: "laugh", brow: -0.2 },
  whistle: { eye: "open", mouth: "o", brow: 0 }, nervous: { eye: "open", mouth: "frown", brow: -0.4 },
  shock: { eye: "shock", mouth: "O", brow: -0.35 }, relief: { eye: "happy", mouth: "smile", brow: -0.2 },
  relief_open: { eye: "happy", mouth: "grin", brow: -0.2 }, dazed: { eye: "spiral", mouth: "line", brow: -0.1 },
  pained: { eye: "squint", mouth: "frown", brow: -0.45 }, smile: { eye: "open", mouth: "smile", brow: -0.1 },
  smile_closed: { eye: "happy", mouth: "smile", brow: -0.1 }, lick: { eye: "happy", mouth: "grin", brow: 0 },
  shout: { eye: "squint", mouth: "shout", brow: 0.5 },
};

const add = (g: THREE.Object3D, geo: THREE.BufferGeometry, col: string, p: [number, number, number], s: [number, number, number], r: [number, number, number] = [0, 0, 0]) => {
  const m = new THREE.Mesh(geo, M(col));
  m.position.set(...p); m.scale.set(...s); m.rotation.set(...r);
  m.castShadow = true; m.receiveShadow = true;
  g.add(m);
  return m;
};

/** un muñeco: se arma una vez por outfit; cara y pose se actualizan por cuadro */
export class Figura {
  root = new THREE.Group();
  private body = new THREE.Group();
  private head = new THREE.Group();
  private face = new THREE.Group();
  private legs: THREE.Group[] = [];
  private arms: THREE.Group[] = [];
  private faceKey = "";
  private emu = false;
  private neck = new THREE.Group();
  private hips: THREE.Group[] = [];
  private ankles: THREE.Group[] = [];
  private emuHat: THREE.Group | null = null;
  private conejo = false;
  private ears: THREE.Group[] = [];
  private paws: THREE.Group[] = [];
  private feet: THREE.Group[] = [];
  private lash: THREE.Group[] = [];
  private gato = false;
  private tail: THREE.Group[] = [];
  private furSpikes: THREE.Object3D[] = [];
  constructor(public o: Outfit, public key: string) {
    if (o.emu) { this.buildEmu(o); return; }
    if (o.conejo) { this.buildConejo(o); return; }
    if (o.gato) { this.buildGato(o); return; }
    const o2 = o, skin = o2.skin ?? "#f2c9a0", stout = o2.build === "stout";
    const bw = stout ? 1.12 : 1;
    this.root.add(this.body);
    this.body.scale.setScalar(0.88);
    // piernas
    for (const s of [-1, 1]) {
      const leg = new THREE.Group(); leg.position.set(s * 0.1, 0.45, 0);
      add(leg, CYL, o2.dress ? skin : o2.pants, [0, -0.2, 0], [0.065, 0.4, 0.065]);
      add(leg, SPH, o2.boots, [0, -0.42, 0.05], [0.09, 0.06, 0.13]);
      this.body.add(leg); this.legs.push(leg);
    }
    // tronco
    if (o2.dress) add(this.body, CYL, o2.dress, [0, 0.66, 0], [0.3 * bw, 1.1, 0.3 * bw]).geometry = new THREE.CylinderGeometry(0.85, 1.25, 1, 28);
    else add(this.body, CYL, o2.jacket, [0, 0.8, 0], [0.27 * bw, 0.74, 0.25 * bw]).geometry = new THREE.CylinderGeometry(0.95, 1.1, 1, 28);
    add(this.body, SPH, o2.dress ?? o2.jacket, [0, 1.15, 0], [0.27 * bw, 0.12, 0.25 * bw]);
    if (o2.sash) add(this.body, CYL, o2.sash, [0, 0.98, 0], [0.285 * bw, 0.07, 0.265 * bw], [0, 0, 0.25]);
    if (o2.belt) add(this.body, CYL, o2.belt, [0, 0.62, 0], [0.3 * bw, 0.06, 0.28 * bw]);
    if (o2.buttons && !o2.dress) for (let i = 0; i < 3; i++) add(this.body, SPH, o2.buttons, [0, 0.72 + i * 0.13, 0.27 * bw], [0.025, 0.025, 0.02]);
    if (o2.cape) add(this.body, BOX, o2.cape, [0, 0.7, -0.27 * bw], [0.6 * bw, 0.95, 0.03], [0.08, 0, 0]);
    // brazos
    for (const s of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(s * 0.3 * bw, 1.1, 0);
      add(arm, CAP, o2.dress ?? o2.jacket, [0, -0.24, 0], [0.06, 0.34, 0.06]);
      add(arm, SPH, skin, [0, -0.5, 0], [0.075, 0.075, 0.075]);
      arm.rotation.z = s * 0.18;
      this.body.add(arm); this.arms.push(arm);
    }
    if (o2.shield) {
      const sh = add(this.arms[1], CYL, o2.shield, [0.05, -0.38, 0.12], [0.26, 0.04, 0.26], [Math.PI / 2, 0, 0]);
      add(sh, TOR, "#f3d57a", [0, 0.6, 0], [0.85, 0.85, 0.85], [Math.PI / 2, 0, 0]);
      add(sh, SPH, "#f3d57a", [0, 0.7, 0], [0.18, 0.4, 0.18]);
    }
    if (o2.spear || o2.rifle) {
      add(this.arms[0], CYL, "#8a5a34", [0, -0.2, 0.08], [0.025, 2.2, 0.025]);
      add(this.arms[0], CONE, "#c9ccd6", [0, 0.95, 0.08], [0.06, 0.18, 0.06]);
    }
    if (o2.whip) {
      add(this.arms[1], CYL, "#6a4424", [0, -0.62, 0.0], [0.025, 0.24, 0.025]);
      let par: THREE.Object3D = this.arms[1], y0 = -0.74;
      for (let k = 0; k < 8; k++) {
        const seg = new THREE.Group(); seg.position.set(0, y0, 0); par.add(seg);
        add(seg, CYL, "#3a2a20", [0, -0.08, 0], [0.022 - k * 0.0018, 0.17, 0.022 - k * 0.0018]);
        this.lash.push(seg); par = seg; y0 = -0.14;
      }
    }
    // cabeza
    this.head.position.set(0, 1.62, 0);
    this.body.add(this.head);
    const hr = 0.38;
    add(this.head, SPH, skin, [0, 0, 0], [hr, hr * 1.04, hr * 0.95]);
    add(this.head, SPH, skin, [0, -0.04, hr * 0.93], [0.05, 0.045, 0.04]); // nariz
    for (const s of [-1, 1]) add(this.head, SPH, skin, [s * hr * 0.98, -0.02, 0], [0.06, 0.08, 0.05]); // orejas
    const hat = o2.hat ?? "hair";
    if (o2.hair && hat !== "crown" || hat === "hair") {
      const hc = o2.hair ?? "#3a2a20";
      add(this.head, HALF, hc, [0, 0.06, -0.02], [hr * 1.06, hr * 0.92, hr * 1.02], [-0.25, 0, 0]);
      add(this.head, SPH, hc, [0, 0.14, hr * 0.62], [hr * 0.7, hr * 0.22, hr * 0.32], [0.5, 0, 0]); // flequillo
    }
    if (hat === "crown") {
      add(this.head, HALF, o2.hair ?? "#5a3a20", [0, 0.06, -0.02], [hr * 1.04, hr * 0.88, hr * 1.0], [-0.25, 0, 0]);
      const cr = add(this.head, CYL, "#e8c45a", [0, hr * 0.85, 0], [hr * 0.78, hr * 0.42, hr * 0.78]);
      cr.geometry = new THREE.CylinderGeometry(1, 0.95, 1, 24, 1, true);
      (cr.material as THREE.Material).side = THREE.DoubleSide;
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; add(this.head, CONE, "#e8c45a", [Math.sin(a) * hr * 0.76, hr * 1.18, Math.cos(a) * hr * 0.76], [0.045, 0.1, 0.045]); }
      for (const a of [0, 1.2, -1.2]) add(this.head, SPH, a ? "#3f6ab8" : "#d8323a", [Math.sin(a) * hr * 0.8, hr * 0.85, Math.cos(a) * hr * 0.8], [0.04, 0.04, 0.03]);
    }
    if (hat === "cap") {
      add(this.head, HALF, o2.cap ?? "#2a2730", [0, 0.1, 0], [hr * 1.08, hr * 0.85, hr * 1.06]);
      add(this.head, CYL, o2.cap ?? "#2a2730", [0, 0.11, hr * 0.7], [hr * 0.7, 0.02, hr * 0.5]);
    }
    if (hat === "slouch") slouch(this.head, hr, o2.cap ?? "#9a8058", o2.band ?? "#4a3a28");
    if (hat === "sailor") {
      add(this.head, CYL, "#fbf7ee", [0, hr * 0.78, 0], [hr * 0.86, hr * 0.32, hr * 0.86]).geometry = new THREE.CylinderGeometry(1, 0.9, 1, 24);
      add(this.head, CYL, "#fbf7ee", [0, hr * 0.62, 0], [hr * 1.02, hr * 0.12, hr * 1.02]);
      add(this.head, CYL, "#1e2440", [0, hr * 0.68, 0], [hr * 0.9, hr * 0.08, hr * 0.9]);
    }
    if (hat === "bicorne") bicornio(this.head, hr, o2.cap ?? "#1e1c22", o2.plume);
    if (hat === "shako") {
      const sk = add(this.head, CYL, o2.cap ?? "#1e1c22", [0, hr * 0.98, 0], [hr * 0.78, hr * 0.95, hr * 0.78]);
      sk.geometry = new THREE.CylinderGeometry(1.08, 0.92, 1, 24);
      add(this.head, CYL, "#2a2730", [0, hr * 0.55, hr * 0.55], [hr * 0.6, 0.02, hr * 0.42]);
      add(this.head, SPH, "#e8c45a", [0, hr * 0.95, hr * 0.8], [0.07, 0.08, 0.02]);
      add(this.head, SPH, "#d8323a", [0, hr * 1.55, 0.02], [0.07, 0.08, 0.07]);
      add(this.head, CYL, "#fbf7ee", [0, hr * 1.4, 0], [hr * 0.86, 0.03, hr * 0.86]);
    }
    if (hat === "greek" || hat === "greek_gold") {
      const col = hat === "greek_gold" ? "#e9b949" : "#c98f3e";
      add(this.head, HALF, col, [0, 0.02, 0], [hr * 1.1, hr * 1.02, hr * 1.08]);
      add(this.head, CYL, col, [0, 0.02, 0], [hr * 1.12, 0.04, hr * 1.1]);
      for (const s of [-1, 1]) add(this.head, BOX, col, [s * hr * 0.92, -0.17, hr * 0.25], [0.05, 0.28, 0.2]);
      add(this.head, BOX, hat === "greek_gold" ? "#d8323a" : "#b8322f", [0, hr * 1.12, -0.02], [0.07, 0.24, hr * 1.7]);
    }
    if (o2.laurel) for (const s of [-1, 1]) for (let i = 0; i < 7; i++) {
      const a = -0.2 + (i / 6) * 1.7;
      add(this.head, SPH, i % 2 ? "#4a9a3a" : "#5ab04a", [s * Math.cos(a) * hr * 0.98, hr * 0.42 + Math.sin(a) * 0.05, Math.sin(a) * hr * 0.75 - 0.02], [0.09, 0.035, 0.05], [0, s * a, s * 0.6]);
    }
    if (o2.beard) add(this.head, SPH, o2.beard, [0, -hr * 0.62, hr * 0.42], [hr * 0.6, hr * 0.42, hr * 0.42]);
    if (o2.moustache) for (const s of [-1, 1]) add(this.head, CAP, o2.moustache, [s * 0.06, -0.11, hr * 0.92], [0.025, 0.06, 0.025], [0, 0, s * 1.2]);
    this.head.add(this.face);
  }
  // ---------------- el emú ----------------
  private buildEmu(o: Outfit) {
    this.emu = true;
    const F = o.jacket, F2 = shadeHex(F, 0.78), F3 = shadeHex(F, 1.18), SK = "#7d9cc4", LEG = "#8e8a96", BEAK = "#3a3034";
    this.root.add(this.body);
    this.body.scale.setScalar(0.92);
    // patas: cadera (muslo emplumado) -> tibia hacia atrás -> tarso hacia adelante -> tres dedos
    for (const s of [-1, 1]) {
      const hip = new THREE.Group(); hip.position.set(s * 0.13, 0.92, -0.02);
      add(hip, SPH, F2, [0, -0.06, 0], [0.11, 0.17, 0.13]);
      const knee = new THREE.Group(); knee.position.set(0, -0.2, 0); knee.rotation.x = 0.3; hip.add(knee);
      add(knee, CYL, LEG, [0, -0.18, 0], [0.036, 0.38, 0.036]);
      add(knee, SPH, LEG, [0, -0.37, 0], [0.045, 0.045, 0.045]);
      const ank = new THREE.Group(); ank.position.set(0, -0.37, 0); ank.rotation.x = -0.6; knee.add(ank);
      add(ank, CYL, LEG, [0, -0.17, 0], [0.03, 0.34, 0.03]);
      for (const a of [-0.45, 0, 0.45]) add(ank, CAP, LEG, [Math.sin(a) * 0.07, -0.34, 0.07 * Math.cos(a) + 0.02], [0.022, 0.05, 0.022], [Math.PI / 2 + 0.3, a, 0]);
      this.body.add(hip); this.hips.push(hip); this.ankles.push(ank);
    }
    // cuerpo: huevo peludo con un faldón de plumas
    const torso = new THREE.Group(); torso.position.set(0, 1.02, -0.04); this.body.add(torso); this.face.userData.torso = torso;
    add(torso, SPH, F, [0, 0, 0], [0.37, 0.33, 0.5]);
    add(torso, SPH, F3, [0, 0.16, -0.05], [0.3, 0.2, 0.4]);
    add(torso, SPH, F2, [0, 0.05, -0.46], [0.24, 0.24, 0.16]);
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      add(torso, CONE, k % 2 ? F2 : F, [Math.sin(a) * 0.31, -0.24, Math.cos(a) * 0.42 - 0.04], [0.09, 0.22, 0.09], [Math.PI + Math.cos(a) * 0.35, 0, -Math.sin(a) * 0.35]);
    }
    for (let k = 0; k < 9; k++) {
      const a = Math.PI * 0.55 + (k / 8) * Math.PI * 0.9;
      add(torso, CONE, k % 2 ? F2 : F3, [Math.sin(a) * 0.36, 0.08 - (k % 3) * 0.08, Math.cos(a) * 0.46], [0.07, 0.2, 0.07], [Math.cos(a) * 1.2, 0, -Math.sin(a) * 1.2]);
    }
    // cuello y cabeza
    this.neck.position.set(0, 1.14, 0.3); this.neck.rotation.x = 0.22; this.body.add(this.neck);
    add(this.neck, CYL, F, [0, 0.1, 0], [0.1, 0.26, 0.1]).geometry = new THREE.CylinderGeometry(0.75, 1, 1, 20);
    add(this.neck, CYL, SK, [0, 0.38, 0], [0.058, 0.36, 0.058]);
    this.head.position.set(0, 0.6, 0); this.head.rotation.x = -0.22; this.neck.add(this.head);
    add(this.head, SPH, "#5d6f8a", [0, 0, 0], [0.14, 0.13, 0.15]);
    add(this.head, SPH, F2, [0, 0.1, -0.03], [0.09, 0.06, 0.1]);
    add(this.head, SPH, BEAK, [0, -0.035, 0.15], [0.055, 0.032, 0.1]);
    add(this.head, SPH, BEAK, [0, -0.065, 0.12], [0.045, 0.02, 0.075]);
    this.head.add(this.face);
    if (o.hat === "slouch") { this.emuHat = new THREE.Group(); this.head.add(this.emuHat); slouch(this.emuHat, 0.15, o.cap ?? "#9a8058", o.band ?? "#4a3a28"); this.emuHat.position.y = 0.04; }
  }
  private emuFace(f: Face, blink: number, look: number) {
    const key = `E|${f.eye}|${f.mouth}|${f.brow}|${blink > 0.5 ? 1 : 0}|${look}`;
    if (key === this.faceKey) return;
    this.faceKey = key;
    for (const c of [...this.face.children]) this.face.remove(c);
    const z = 0.115, ey = 0.035;
    for (const s of [-1, 1]) {
      const x = s * 0.068;
      if (blink > 0.5 || f.eye === "happy") add(this.face, TOR, INKC, [x, ey - 0.005, z + 0.03], [0.035, 0.035, 0.035]);
      else if (f.eye === "spiral") { add(this.face, TOR, INKC, [x, ey, z + 0.03], [0.032, 0.032, 0.032]); add(this.face, TOR, INKC, [x, ey, z + 0.03], [0.032, 0.032, 0.032], [0, 0, Math.PI]); }
      else {
        const big = f.eye === "shock" ? 1.3 : 1, sq = f.eye === "squint" ? 0.55 : 1;
        add(this.face, SPH, "#ffffff", [x, ey, z], [0.05 * big, 0.058 * big * sq, 0.03]);
        add(this.face, SPH, "#e8a03a", [x + look * 0.014, ey - 0.004, z + 0.022], [0.032 * big, 0.038 * big * sq, 0.014]);
        add(this.face, SPH, INKC, [x + look * 0.016, ey - 0.004, z + 0.032], [0.018 * big, 0.022 * big * sq, 0.012]);
        add(this.face, SPH, "#ffffff", [x + look * 0.016 + 0.009, ey + 0.012, z + 0.04], [0.008, 0.008, 0.006]);
      }
      if (f.brow) add(this.face, BOX, INKC, [x, ey + 0.075, z + 0.01], [0.07, 0.016, 0.02], [0, 0, -s * f.brow]);
    }
    // pico abierto para gritos y risas
    if (f.mouth === "O" || f.mouth === "laugh" || f.mouth === "shout" || f.mouth === "grin")
      add(this.face, SPH, "#5a1e24", [0, -0.05, 0.19], [0.035, 0.022, 0.05]);
  }
  private updateEmu(op: FigOpts) {
    const f = FACES[op.expr] ?? FACES.neutral;
    this.emuFace(f, op.blink, Math.round(op.look));
    const P = op.phase * Math.PI * 2, torso = this.face.userData.torso as THREE.Group;
    let lean = 0, neck = 0.22, bob = 0, swing = 0, lift = [0, 0];
    if (op.mode === "run") {
      swing = Math.sin(P) * 0.75; lean = 0.18; neck = 0.75; bob = Math.abs(Math.cos(P)) * 0.07;
      lift = [Math.max(0, Math.sin(P)) * 0.7, Math.max(0, -Math.sin(P)) * 0.7];
    } else if (op.mode === "walk") {
      swing = Math.sin(P) * 0.4; neck = 0.4; bob = Math.abs(Math.cos(P)) * 0.03;
      lift = [Math.max(0, Math.sin(P)) * 0.4, Math.max(0, -Math.sin(P)) * 0.4];
    } else if (op.mode === "peck") {
      const u = op.phase % 1, k = u < 0.25 ? Math.sin((u / 0.25) * Math.PI) : 0;
      neck = 0.35 + 1.55 * k; lean = 0.12 * k;
    } else if (op.mode === "jump") {
      bob = Math.abs(Math.sin(P)) * 0.32; neck = 0.1 + Math.sin(P) * 0.15;
      lift = [Math.abs(Math.sin(P)) * 0.4, Math.abs(Math.sin(P)) * 0.4];
    } else neck = 0.22 + Math.sin(P) * 0.06;
    this.hips[0].rotation.x = -swing; this.hips[1].rotation.x = swing;
    this.ankles[0].rotation.x = -0.6 - lift[0]; this.ankles[1].rotation.x = -0.6 - lift[1];
    this.body.rotation.x = lean;
    this.body.position.y = bob;
    torso.rotation.z = op.mode === "run" ? Math.sin(P) * 0.05 : 0;
    this.neck.rotation.x = neck;
    this.head.rotation.x = -neck + (op.mode === "peck" ? 0.3 * Math.min(1, neck - 0.35) : 0);
    this.head.rotation.y = op.look * 0.35;
    this.head.rotation.z = op.mode === "stand" ? Math.sin(P * 0.5) * 0.08 : 0;
    if (this.emuHat) this.emuHat.visible = op.hat !== false;
  }
  // ---------------- el conejo ----------------
  private buildConejo(o: Outfit) {
    this.conejo = true;
    const F = o.jacket, F2 = shadeHex(F, 0.85), W = o.pants ?? "#fbf7ee", PINK = "#f4a6b4";
    this.root.add(this.body);
    this.body.scale.setScalar(1.05);
    const torso = new THREE.Group(); this.body.add(torso); this.face.userData.torso = torso;
    add(torso, SPH, F, [0, 0.22, -0.04], [0.2, 0.19, 0.25]);
    add(torso, SPH, W, [0, 0.24, 0.1], [0.14, 0.15, 0.13]);
    if (o.spots) { add(torso, SPH, o.spots, [0.08, 0.32, -0.1], [0.11, 0.08, 0.12]); add(torso, SPH, o.spots, [-0.1, 0.22, -0.16], [0.08, 0.09, 0.09]); }
    for (const s of [-1, 1]) {
      add(torso, SPH, F2, [s * 0.13, 0.15, -0.1], [0.09, 0.12, 0.15]);
      const ft = new THREE.Group(); ft.position.set(s * 0.13, 0.04, -0.06); torso.add(ft); this.feet.push(ft);
      add(ft, SPH, W, [0, 0, 0.09], [0.05, 0.035, 0.12]);
      const pw = new THREE.Group(); pw.position.set(s * 0.065, 0.2, 0.15); torso.add(pw); this.paws.push(pw);
      add(pw, CAP, W, [0, -0.08, 0.01], [0.032, 0.07, 0.032]);
    }
    add(torso, SPH, "#fbf7ee", [0, 0.25, -0.29], [0.075, 0.075, 0.07]);
    this.head.position.set(0, 0.44, 0.12); torso.add(this.head);
    add(this.head, SPH, F, [0, 0, 0], [0.155, 0.14, 0.145]);
    for (const s of [-1, 1]) add(this.head, SPH, W, [s * 0.04, -0.055, 0.105], [0.05, 0.042, 0.045]);
    add(this.head, SPH, PINK, [0, -0.02, 0.145], [0.024, 0.018, 0.016]);
    for (const s of [-1, 1]) {
      const ear = new THREE.Group(); ear.position.set(s * 0.065, 0.1, -0.03); this.head.add(ear); this.ears.push(ear);
      add(ear, CAP, F, [0, 0.17, 0], [0.042, 0.16, 0.022]);
      add(ear, CAP, PINK, [0, 0.17, 0.012], [0.024, 0.13, 0.012]);
      ear.rotation.z = -s * 0.12;
    }
    this.head.add(this.face);
    if (o.hat === "bicorne") { this.emuHat = new THREE.Group(); this.head.add(this.emuHat); bicornio(this.emuHat, 0.16, o.cap ?? "#1e1c22", o.plume); this.emuHat.position.y = 0.02; }
  }
  private conejoFace(f: Face, blink: number, look: number) {
    const key = `C|${f.eye}|${f.mouth}|${f.brow}|${blink > 0.5 ? 1 : 0}|${look}`;
    if (key === this.faceKey) return;
    this.faceKey = key;
    for (const c of [...this.face.children]) this.face.remove(c);
    const z = 0.118, ey = 0.025;
    for (const s of [-1, 1]) {
      const x = s * 0.066;
      if (blink > 0.5 || f.eye === "happy") add(this.face, TOR, INKC, [x, ey - 0.005, z + 0.02], [0.032, 0.032, 0.032]);
      else if (f.eye === "spiral") { add(this.face, TOR, INKC, [x, ey, z + 0.02], [0.03, 0.03, 0.03]); add(this.face, TOR, INKC, [x, ey, z + 0.02], [0.03, 0.03, 0.03], [0, 0, Math.PI]); }
      else {
        const big = f.eye === "shock" ? 1.3 : 1, sq = f.eye === "squint" ? 0.55 : 1;
        add(this.face, SPH, INKC, [x + look * 0.01, ey, z], [0.038 * big, 0.046 * big * sq, 0.03]);
        add(this.face, SPH, "#ffffff", [x + look * 0.01 + 0.012, ey + 0.016, z + 0.026], [0.012, 0.012, 0.008]);
        add(this.face, SPH, "#ffffff", [x + look * 0.01 - 0.01, ey - 0.014, z + 0.026], [0.006, 0.006, 0.005]);
      }
      if (f.brow) add(this.face, BOX, INKC, [x, ey + 0.065, z], [0.05, 0.012, 0.016], [0, 0, -s * f.brow]);
      add(this.face, SPH, "#f29a8a", [s * 0.1, -0.035, 0.09], [0.026, 0.016, 0.01]);
    }
    if (f.mouth === "O" || f.mouth === "laugh" || f.mouth === "shout" || f.mouth === "grin")
      add(this.face, SPH, "#5a1e24", [0, -0.095, 0.112], [0.03, f.mouth === "grin" ? 0.016 : 0.026, 0.02]);
    else add(this.face, BOX, INKC, [0, -0.065, 0.142], [0.004, 0.022, 0.004]);
  }
  private updateConejo(op: FigOpts) {
    const f = FACES[op.expr] ?? FACES.neutral;
    this.conejoFace(f, op.blink, Math.round(op.look));
    const P = op.phase * Math.PI * 2, torso = this.face.userData.torso as THREE.Group;
    let pitch = 0, bob = 0, head = 0, ear = 0.0, paw = 0, foot = 0;
    if (op.mode === "run" || op.mode === "jump") {
      const u = op.phase % 1, air = Math.sin(Math.min(1, u / 0.7) * Math.PI);
      bob = (op.mode === "jump" ? 0.38 : 0.2) * Math.max(0, air);
      pitch = op.mode === "jump" ? -0.25 * air : 0.35 * Math.cos(Math.min(1, u / 0.7) * Math.PI);
      foot = 0.9 * Math.max(0, air); paw = -0.6 * air; ear = -0.35 * air;
    } else if (op.mode === "peck") {
      const u = op.phase % 1, k = u < 0.4 ? Math.sin((u / 0.4) * Math.PI) : 0;
      pitch = 0.3 * k; head = 0.35 * k;
    } else if (op.mode === "beg") {
      pitch = -0.75 + Math.sin(P) * 0.04; head = 0.45; paw = -1.1 + Math.sin(P * 2) * 0.25; ear = 0.1;
    } else if (op.mode === "climb") {
      pitch = -1.35; head = 1.0; paw = -2.2 + Math.sin(P * 2) * 0.35; foot = -0.4 + Math.sin(P * 2 + 1) * 0.3; bob = 0;
    } else { head = Math.sin(P * 0.5) * 0.05; ear = Math.sin(P) * 0.06; }
    this.body.position.y = bob;
    torso.rotation.x = pitch;
    this.head.rotation.x = -pitch * 0.75 + head;
    this.head.rotation.y = op.look * 0.3;
    this.head.rotation.z = op.mode === "stand" ? Math.sin(P * 0.7) * 0.06 : 0;
    this.ears.forEach((e, i) => { e.rotation.x = ear + (op.mode === "stand" ? Math.sin(P * 1.3 + i) * 0.08 : 0); });
    this.paws.forEach((p) => { p.rotation.x = paw; });
    this.feet.forEach((p) => { p.rotation.x = foot; });
    if (this.emuHat) this.emuHat.visible = op.hat !== false;
  }
  // ---------------- el gato ----------------
  private buildGato(o: Outfit) {
    this.gato = true;
    const F = o.jacket, W = o.pants ?? "#fbf7ee", PINK = "#f4a6b4";
    this.root.add(this.body);
    const torso = new THREE.Group(); this.body.add(torso); this.face.userData.torso = torso;
    add(torso, SPH, F, [0, 0.21, -0.03], [0.16, 0.2, 0.2]);
    add(torso, SPH, W, [0, 0.25, 0.1], [0.1, 0.14, 0.08]);
    for (const s of [-1, 1]) {
      add(torso, SPH, F, [s * 0.1, 0.11, -0.06], [0.08, 0.1, 0.13]);
      const pw = new THREE.Group(); pw.position.set(s * 0.06, 0.2, 0.11); torso.add(pw); this.paws.push(pw);
      add(pw, CAP, F, [0, -0.09, 0.0], [0.034, 0.09, 0.034]);
      add(pw, SPH, W, [0, -0.19, 0.02], [0.04, 0.026, 0.05]);
    }
    // espinas de pelo erizado (sólo se ven enojado)
    for (let k = 0; k < 9; k++) {
      const a = -0.9 + (k / 8) * 1.8;
      const sp = add(torso, CONE, F, [Math.sin(a) * 0.12, 0.36 + Math.cos(a) * 0.04, -0.08 - Math.cos(a) * 0.05], [0.035, 0.1, 0.035], [-0.5, 0, -a * 0.8]);
      this.furSpikes.push(sp);
    }
    // cola: cadena de segmentos que se enrosca
    let par: THREE.Object3D = torso, pos: [number, number, number] = [0, 0.08, -0.2];
    for (let k = 0; k < 7; k++) {
      const seg = new THREE.Group(); seg.position.set(...pos); par.add(seg); this.tail.push(seg);
      add(seg, CAP, k === 6 ? W : F, [0, 0.05, 0], [0.032, 0.05, 0.032]);
      par = seg; pos = [0, 0.1, 0];
    }
    this.head.position.set(0, 0.44, 0.06); torso.add(this.head);
    add(this.head, SPH, F, [0, 0, 0], [0.155, 0.135, 0.135]);
    add(this.head, SPH, W, [0, -0.045, 0.095], [0.085, 0.055, 0.05]);
    add(this.head, SPH, W, [0, 0.04, 0.12], [0.025, 0.06, 0.01]);
    add(this.head, SPH, PINK, [0, -0.015, 0.14], [0.02, 0.014, 0.012]);
    for (const s of [-1, 1]) {
      const ear = new THREE.Group(); ear.position.set(s * 0.085, 0.1, -0.01); this.head.add(ear); this.ears.push(ear);
      add(ear, CONE, F, [0, 0.05, 0], [0.055, 0.11, 0.035]);
      add(ear, CONE, PINK, [0, 0.04, 0.015], [0.032, 0.07, 0.01]);
      ear.rotation.z = -s * 0.25;
      for (const k of [-1, 1]) add(this.head, BOX, "#fbf7ee", [s * 0.13, -0.04 + k * 0.012, 0.1], [0.13, 0.004, 0.004], [0, -s * 0.25, s * k * 0.12]);
    }
    this.head.add(this.face);
  }
  private gatoFace(f: Face, blink: number, look: number) {
    const key = `G|${f.eye}|${f.mouth}|${f.brow}|${blink > 0.5 ? 1 : 0}|${look}`;
    if (key === this.faceKey) return;
    this.faceKey = key;
    for (const c of [...this.face.children]) this.face.remove(c);
    const z = 0.112, ey = 0.028;
    for (const s of [-1, 1]) {
      const x = s * 0.066;
      if (blink > 0.5 || f.eye === "happy") add(this.face, TOR, INKC, [x, ey - 0.005, z + 0.02], [0.03, 0.03, 0.03]);
      else if (f.eye === "spiral") { add(this.face, TOR, INKC, [x, ey, z + 0.02], [0.03, 0.03, 0.03]); add(this.face, TOR, INKC, [x, ey, z + 0.02], [0.03, 0.03, 0.03], [0, 0, Math.PI]); }
      else {
        const big = f.eye === "shock" ? 1.3 : 1, sq = f.eye === "squint" ? 0.55 : 1;
        add(this.face, SPH, "#c9d84a", [x, ey, z], [0.042 * big, 0.046 * big * sq, 0.03]);
        add(this.face, SPH, INKC, [x + look * 0.01, ey, z + 0.022], [0.013 * big * (f.eye === "shock" ? 2 : 1), 0.04 * big * sq, 0.014]);
        add(this.face, SPH, "#ffffff", [x + look * 0.01 + 0.014, ey + 0.016, z + 0.03], [0.009, 0.009, 0.006]);
      }
      if (f.brow) add(this.face, BOX, "#fbf7ee", [x, ey + 0.062, z + 0.005], [0.05, 0.012, 0.016], [0, 0, -s * f.brow]);
    }
    if (f.mouth === "O" || f.mouth === "laugh" || f.mouth === "shout" || f.mouth === "grin") {
      add(this.face, SPH, "#5a1e24", [0, -0.085, 0.112], [0.032, f.mouth === "grin" ? 0.016 : 0.028, 0.02]);
      if (f.mouth === "shout") for (const s of [-1, 1]) add(this.face, CONE, "#ffffff", [s * 0.018, -0.068, 0.128], [0.008, 0.018, 0.008], [Math.PI, 0, 0]);
    } else for (const s of [-1, 1]) add(this.face, TOR, INKC, [s * 0.017, -0.055, 0.14], [0.017, 0.017, 0.017], [0, 0, Math.PI]);
  }
  private updateGato(op: FigOpts) {
    const f = FACES[op.expr] ?? FACES.neutral;
    this.gatoFace(f, op.blink, Math.round(op.look));
    const P = op.phase * Math.PI * 2, torso = this.face.userData.torso as THREE.Group;
    const angry = op.mode === "angry", sleep = op.mode === "sleep", jump = op.mode === "jump";
    torso.scale.set(1, angry ? 1.12 : sleep ? 0.62 : 1, sleep ? 1.25 : 1);
    torso.rotation.x = jump ? -0.3 * Math.sin(P) : 0;
    this.body.position.y = jump ? Math.max(0, Math.sin(P)) * 0.25 : angry ? Math.abs(Math.sin(P * 3)) * 0.02 : 0;
    this.head.position.set(0, sleep ? 0.3 : 0.44, sleep ? 0.14 : 0.06);
    this.head.rotation.x = sleep ? 0.35 : 0;
    this.head.rotation.y = op.look * 0.3;
    this.head.rotation.z = op.mode === "stand" ? Math.sin(P * 0.6) * 0.07 : 0;
    this.ears.forEach((e, i) => { e.rotation.x = angry ? -0.9 : sleep ? -0.3 : Math.sin(P * 1.1 + i) * 0.05; });
    this.furSpikes.forEach((s) => { s.visible = angry; });
    this.tail.forEach((t, k) => {
      if (angry) { t.rotation.x = k === 0 ? -1.3 : -0.08 + Math.sin(P * 4 + k) * 0.05; t.rotation.z = 0; t.scale.setScalar(1.25); }
      else if (sleep) { t.rotation.x = 0; t.rotation.z = k === 0 ? 1.4 : 0.42; t.scale.setScalar(1); }
      else { t.rotation.x = k === 0 ? -1.45 : 0.04; t.rotation.z = k === 0 ? 0 : 0.32 + Math.sin(P - k * 0.6) * 0.08; t.scale.setScalar(1); }
    });
    this.paws.forEach((p) => { p.rotation.x = jump ? -0.8 * Math.max(0, Math.sin(P)) : 0; });
  }
  private buildFace(f: Face, blink: number, look: number) {
    const key = `${f.eye}|${f.mouth}|${f.brow}|${blink > 0.5 ? 1 : 0}|${look}`;
    if (key === this.faceKey) return;
    this.faceKey = key;
    for (const c of [...this.face.children]) this.face.remove(c);
    const hr = 0.38, z = hr * 0.88, ey = 0.06, beard = !!this.o.beard;
    for (const s of [-1, 1]) {
      const x = s * 0.13;
      if (blink > 0.5 || f.eye === "happy") {
        add(this.face, TOR, INKC, [x, ey - 0.01, z + 0.03], [0.055, 0.055, 0.055], [0, 0, 0]);
      } else if (f.eye === "spiral") {
        add(this.face, TOR, INKC, [x, ey, z + 0.03], [0.05, 0.05, 0.05], [0, 0, 0]);
        add(this.face, TOR, INKC, [x, ey, z + 0.03], [0.05, 0.05, 0.05], [0, 0, Math.PI]);
      } else {
        const big = f.eye === "shock" ? 1.35 : 1, sq = f.eye === "squint" ? 0.55 : 1;
        add(this.face, SPH, "#ffffff", [x, ey, z], [0.075 * big, 0.085 * big * sq, 0.04]);
        add(this.face, SPH, INKC, [x + look * 0.025, ey - 0.005, z + 0.035], [0.038 * big, 0.045 * big * sq, 0.02]);
        add(this.face, SPH, "#ffffff", [x + look * 0.025 + 0.012, ey + 0.015, z + 0.05], [0.012, 0.012, 0.01]);
      }
      add(this.face, BOX, this.o.hair && this.o.hair !== "#f4f1ea" ? this.o.hair : INKC, [x, ey + 0.13, z + 0.02], [0.11, 0.025, 0.03], [0, 0, -s * f.brow]);
    }
    const my = beard ? -0.12 : -0.16, mz = beard ? hr * 1.0 : hr * 0.86;
    const dark = "#5a1e24";
    if (f.mouth === "smile") add(this.face, TOR, INKC, [0, my + 0.03, mz + 0.03], [0.08, 0.06, 0.06], [0, 0, Math.PI]);
    else if (f.mouth === "frown") add(this.face, TOR, INKC, [0, my - 0.03, mz + 0.03], [0.07, 0.05, 0.05]);
    else if (f.mouth === "line") add(this.face, BOX, INKC, [0, my, mz + 0.03], [0.1, 0.018, 0.02]);
    else if (f.mouth === "o") add(this.face, SPH, dark, [0, my, mz + 0.02], [0.035, 0.035, 0.02]);
    else {
      const w = f.mouth === "O" ? 0.07 : f.mouth === "shout" ? 0.1 : 0.11, h = f.mouth === "O" ? 0.08 : f.mouth === "grin" ? 0.05 : 0.075;
      const m = add(this.face, HALF, dark, [0, my + (f.mouth === "O" ? 0 : 0.02), mz], [w, h, 0.03], [Math.PI / 2 + (f.mouth === "O" ? 0 : Math.PI), 0, 0]);
      if (f.mouth === "O") m.geometry = SPH;
      if (f.mouth === "grin" || f.mouth === "laugh") add(this.face, BOX, "#ffffff", [0, my + 0.008, mz + 0.035], [w * 1.6, 0.02, 0.01]);
      if (f.mouth === "laugh" || f.mouth === "shout") add(this.face, SPH, "#e86a6a", [0, my - 0.03, mz + 0.03], [w * 0.5, 0.02, 0.01]);
    }
    // mejillas
    for (const s of [-1, 1]) add(this.face, SPH, "#f29a8a", [s * 0.22, -0.06, hr * 0.8], [0.045, 0.025, 0.01]);
  }
  update(op: FigOpts) {
    if (this.emu) { this.updateEmu(op); return; }
    if (this.conejo) { this.updateConejo(op); return; }
    if (this.gato) { this.updateGato(op); return; }
    const f = FACES[op.expr] ?? FACES.neutral;
    this.buildFace(f, op.blink, Math.round(op.look));
    const walk = op.mode === "stroll" || op.mode === "march" || op.mode === "run";
    const P = op.phase * Math.PI * 2, run = op.mode === "run";
    const sw = walk ? Math.sin(P) * (run ? 0.85 : 0.45) : 0;
    this.legs[0].rotation.x = sw; this.legs[1].rotation.x = -sw;
    this.arms[0].rotation.x = -sw * 0.8; this.arms[1].rotation.x = sw * 0.8;
    this.arms[0].rotation.z = -0.18; this.arms[1].rotation.z = 0.18;
    this.body.position.y = walk ? Math.abs(Math.cos(P)) * (run ? 0.08 : 0.03) : 0;
    this.body.rotation.x = run ? 0.18 : 0;
    if (op.mode === "arms_up") {
      this.arms[0].rotation.z = -2.5 - Math.sin(P * 3) * 0.25; this.arms[1].rotation.z = 2.5 + Math.sin(P * 3 + 1) * 0.25;
      this.legs[0].rotation.x = Math.sin(P * 4) * 0.25; this.legs[1].rotation.x = -Math.sin(P * 4) * 0.25;
      this.body.position.y = Math.abs(Math.sin(P * 4)) * 0.05;
    }
    if (run) { this.arms[0].rotation.z = -0.9; this.arms[1].rotation.z = 0.9; }
    if (op.mode === "whip") {
      this.arms[1].rotation.x = -0.5 - Math.sin(P) * 0.6; this.arms[1].rotation.z = 2.3 + Math.sin(P) * 0.45;
      this.arms[0].rotation.z = -0.5;
      this.lash.forEach((g, k) => { g.rotation.x = Math.sin(P - k * 0.75) * 0.5 + 0.15; g.rotation.z = Math.sin(P - k * 0.6 + 1) * 0.35; });
    } else this.lash.forEach((g) => { g.rotation.x = 0.12; });
    if (op.mode === "sit") {
      for (const l of this.legs) { l.rotation.x = -Math.PI / 2; l.position.z = 0.05; }
      this.body.position.y = -0.42;
    } else for (const l of this.legs) l.position.z = 0;
    this.head.rotation.y = op.look * 0.25;
    this.head.rotation.z = Math.sin(op.phase * Math.PI * 2) * (walk ? 0.04 : 0);
  }
}

const shadeHex = (c: string, k: number) => {
  const n = parseInt(c.slice(1), 16), ch = (v: number) => Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
};
/** sombrero australiano de ala ancha con el lado izquierdo levantado */
const slouch = (g: THREE.Object3D, hr: number, col: string, band: string) => {
  add(g, CYL, col, [0, hr * 0.78, -0.01], [hr * 0.8, hr * 0.62, hr * 0.8]).geometry = new THREE.CylinderGeometry(0.8, 1, 1, 24);
  add(g, CYL, band, [0, hr * 0.58, -0.01], [hr * 0.82, hr * 0.16, hr * 0.82]);
  add(g, BOX, shadeHex(col, 0.8), [0, hr * 1.1, -0.01], [hr * 0.12, hr * 0.06, hr * 1.1]);
  add(g, CYL, col, [-hr * 0.3, hr * 0.48, 0], [hr * 1.22, hr * 0.06, hr * 1.45]);
  // ala izquierda (+x, la izquierda del personaje) levantada contra la copa
  const up = add(g, CYL, col, [hr * 0.78, hr * 0.5, 0], [hr * 0.75, hr * 0.06, hr * 1.2], [0, 0, 1.3]);
  up.geometry = new THREE.CylinderGeometry(1, 1, 1, 32, 1, false, 0, Math.PI);
  add(g, SPH, "#c9a24a", [hr * 0.86, hr * 0.78, 0.0], [0.035, 0.035, 0.035]);
};

/** bicornio «en bataille» (las puntas a los lados) con escarapela tricolor y pluma opcional */
const bicornio = (g: THREE.Object3D, hr: number, col: string, plume?: string) => {
  const h = add(g, HALF, col, [0, hr * 0.62, -0.02], [hr * 1.75, hr * 0.95, hr * 0.42]);
  h.geometry = new THREE.SphereGeometry(1, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  add(g, CYL, col, [0, hr * 0.68, -0.02], [hr * 0.86, hr * 0.32, hr * 0.8]);
  add(g, BOX, "#c9a24a", [0, hr * 0.64, hr * 0.38], [hr * 3.2, hr * 0.06, 0.01]);
  for (const [c, r] of [["#2f4a9a", 0.17], ["#fbf7ee", 0.12], ["#d8323a", 0.07]] as [string, number][]) add(g, SPH, c, [hr * 0.75, hr * 1.05, hr * 0.38 + (0.17 - r) * 0.1], [hr * r, hr * r, 0.012]);
  if (plume) add(g, SPH, plume, [0, hr * 1.55, -0.02], [hr * 1.2, hr * 0.22, hr * 0.3]);
};

// ---------------- utilería 3D: ametralladora Lewis y camión del ejército (adelante = +z, origen en el suelo) ----------------
export const MUZZLE: Record<string, [number, number, number]> = { lewis: [0, 0.93, 0.95] };
export const buildProp = (kind: string) => {
  const g = new THREE.Group();
  if (kind === "lewis") {
    const MET = "#34343c", MET2 = "#4a4a54", WOOD = "#8a5a34";
    for (const a of [0, 2.1, -2.1]) {
      const leg = add(g, CYL, MET2, [Math.sin(a) * 0.22, 0.38, Math.cos(a) * 0.22 + 0.1], [0.022, 0.8, 0.022]);
      leg.rotation.set(Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3);
    }
    add(g, SPH, MET2, [0, 0.78, 0.1], [0.05, 0.05, 0.05]);
    add(g, CYL, MET, [0, 0.9, 0.35], [0.075, 0.75, 0.075], [Math.PI / 2, 0, 0]);
    for (let k = 0; k < 5; k++) add(g, CYL, MET2, [0, 0.9, 0.08 + k * 0.14], [0.082, 0.025, 0.082], [Math.PI / 2, 0, 0]);
    add(g, CYL, MET, [0, 0.9, 0.82], [0.03, 0.22, 0.03], [Math.PI / 2, 0, 0]);
    add(g, CYL, MET2, [0, 1.0, 0.0], [0.17, 0.05, 0.17]);
    add(g, CYL, MET, [0, 1.03, 0.0], [0.05, 0.03, 0.05]);
    add(g, BOX, MET, [0, 0.88, -0.12], [0.1, 0.14, 0.3]);
    add(g, BOX, WOOD, [0, 0.84, -0.42], [0.07, 0.14, 0.38], [0.15, 0, 0]);
    add(g, BOX, WOOD, [0, 0.78, -0.16], [0.05, 0.14, 0.05], [0.3, 0, 0]);
  } else if (kind === "camion") {
    const OL = "#6e7240", OL2 = "#5a5e34", TIRE = "#2a2730", WOOD = "#8a6a44";
    add(g, BOX, OL2, [0, 0.62, 0], [1.5, 0.16, 4.0]);
    // caja de carga abierta (atrás)
    add(g, BOX, WOOD, [0, 0.98, -0.75], [1.9, 0.08, 2.4]);
    for (const s of [-1, 1]) add(g, BOX, OL, [s * 0.92, 1.18, -0.75], [0.07, 0.36, 2.4]);
    add(g, BOX, OL, [0, 1.18, -1.92], [1.9, 0.36, 0.07]);
    // cabina y capó
    add(g, BOX, OL, [0, 1.35, 0.95], [1.7, 1.15, 0.95]);
    add(g, BOX, "#3a4a5a", [0, 1.62, 1.43], [1.4, 0.42, 0.03]);
    add(g, BOX, OL, [0, 1.9, 0.9], [1.8, 0.07, 1.15]);
    add(g, BOX, OL, [0, 1.05, 1.85], [1.3, 0.75, 0.9]);
    add(g, BOX, "#2a2a30", [0, 1.05, 2.31], [1.1, 0.6, 0.04]);
    for (const s of [-1, 1]) {
      add(g, SPH, "#f4ecc8", [s * 0.5, 1.3, 2.33], [0.11, 0.11, 0.05]);
      add(g, CYL, OL2, [s * 0.88, 0.75, 1.55], [0.35, 0.06, 0.6], [0, 0, Math.PI / 2]);
      for (const z of [1.5, -1.3]) {
        add(g, CYL, TIRE, [s * 0.85, 0.48, z], [0.48, 0.28, 0.48], [0, 0, Math.PI / 2]);
        add(g, CYL, "#c9b070", [s * 1.0, 0.48, z], [0.2, 0.02, 0.2], [0, 0, Math.PI / 2]);
      }
    }
  } else if (kind === "jaula") {
    // jaula de madera 1.0 x 0.7 x 0.7 con barrotes y puerta al frente (+z) que se levanta (grupo "door")
    const WOOD = "#9a6a3a", WOOD2 = "#7a4e2a", BAR = "#5a5e66";
    add(g, BOX, WOOD2, [0, 0.04, 0], [1.0, 0.08, 0.7]);
    add(g, BOX, WOOD, [0, 0.72, 0], [1.04, 0.07, 0.74]);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(g, BOX, WOOD, [sx * 0.48, 0.38, sz * 0.32], [0.07, 0.68, 0.07]);
    for (const sx of [-1, 1]) for (let k = 1; k < 5; k++) add(g, CYL, BAR, [sx * 0.48, 0.38, -0.32 + k * 0.128], [0.012, 0.62, 0.012]);
    for (let k = 1; k < 7; k++) add(g, CYL, BAR, [-0.48 + k * 0.137, 0.38, -0.32], [0.012, 0.62, 0.012]);
    const door = new THREE.Group(); door.name = "door"; door.position.set(0, 0.7, 0.34); g.add(door);
    add(door, BOX, WOOD, [0, -0.04, 0], [0.96, 0.06, 0.05]);
    add(door, BOX, WOOD, [0, -0.62, 0], [0.96, 0.06, 0.05]);
    for (let k = 0; k < 8; k++) add(door, CYL, BAR, [-0.42 + k * 0.12, -0.33, 0], [0.013, 0.58, 0.013]);
  } else if (kind === "carruaje") {
    // carruaje imperial: caja verde oscuro con filetes dorados, cuatro ruedas, pescante y dos caballos (adelante = +z)
    const VE = "#1f4a3c", ORO = "#e0b44a", RU = "#b8322f", NEG = "#2a2730";
    add(g, BOX, VE, [0, 1.45, -0.2], [1.5, 1.2, 2.0]);
    add(g, BOX, VE, [0, 2.1, -0.2], [1.62, 0.1, 2.15]);
    add(g, BOX, ORO, [0, 2.17, -0.2], [1.3, 0.05, 1.8]);
    for (const sx of [-1, 1]) {
      add(g, BOX, NEG, [sx * 0.755, 1.62, -0.2], [0.02, 0.5, 0.75]);
      add(g, BOX, ORO, [sx * 0.76, 1.62, -0.2], [0.012, 0.58, 0.83]);
      add(g, BOX, NEG, [sx * 0.755, 1.62, -0.2], [0.025, 0.46, 0.71]);
      add(g, BOX, ORO, [sx * 0.76, 0.9, -0.2], [0.02, 0.06, 2.0]);
      add(g, BOX, ORO, [sx * 0.76, 2.0, -0.2], [0.02, 0.06, 2.0]);
      add(g, SPH, "#2f4a9a", [sx * 0.77, 1.15, -0.2], [0.012, 0.13, 0.13]);
      for (const [z, r] of [[-0.95, 0.62], [0.75, 0.48]]) {
        const w = new THREE.Group(); w.name = "wheel"; w.position.set(sx * 0.86, r, z); g.add(w);
        add(w, TOR, RU, [0, 0, 0], [r * 0.92, r * 0.92, r * 0.9], [0, Math.PI / 2, 0]).geometry = new THREE.TorusGeometry(1, 0.07, 8, 32);
        add(w, CYL, RU, [0, 0, 0], [0.09, 0.12, 0.09], [0, 0, Math.PI / 2]);
        for (let k = 0; k < 6; k++) add(w, BOX, RU, [0, 0, 0], [0.03, r * 1.8, 0.04], [k * Math.PI / 6, 0, 0]);
      }
    }
    add(g, BOX, NEG, [0, 0.62, 0], [0.12, 0.1, 2.6]);
    add(g, BOX, VE, [0, 1.25, 1.0], [1.2, 0.18, 0.6]);
    add(g, BOX, NEG, [0, 1.0, 1.0], [0.1, 0.5, 0.1]);
    for (const sx of [-1, 1]) add(g, BOX, "#7a4e2a", [sx * 0.42, 0.95, 2.1], [0.05, 0.05, 2.0]);
    // caballos
    for (const sx of [-1, 1]) {
      const h = new THREE.Group(); h.name = "horse"; h.position.set(sx * 0.42, 0, 2.6); g.add(h);
      const C = sx < 0 ? "#6a4428" : "#4a2e1c", C2 = "#2a1d14";
      add(h, CAP, C, [0, 1.15, 0], [0.24, 0.55, 0.24], [Math.PI / 2, 0, 0]);
      add(h, CAP, C, [0, 1.5, 0.48], [0.13, 0.28, 0.15], [-0.6, 0, 0]);
      add(h, BOX, C, [0, 1.72, 0.7], [0.17, 0.2, 0.42], [0.35, 0, 0]);
      add(h, BOX, C2, [0, 1.75, 0.45], [0.05, 0.38, 0.22], [-0.5, 0, 0]);
      for (const ex of [-1, 1]) add(h, CONE, C, [ex * 0.06, 1.92, 0.62], [0.04, 0.1, 0.04]);
      add(h, CAP, C2, [0, 1.05, -0.62], [0.06, 0.25, 0.06], [0.5, 0, 0]);
      for (const [lx, lz] of [[-0.12, 0.38], [0.12, 0.38], [-0.12, -0.38], [0.12, -0.38]]) {
        const lg = new THREE.Group(); lg.name = "leg"; lg.position.set(lx, 1.0, lz); h.add(lg);
        add(lg, CYL, C, [0, -0.45, 0], [0.06, 0.9, 0.06]);
        add(lg, CYL, C2, [0, -0.93, 0], [0.075, 0.1, 0.075]);
      }
    }
  } else if (kind === "acorazado" || kind === "destructor" || kind === "portaaviones") barco(g, kind);
  else if (kind === "tabla") {
    add(g, BOX, "#8a5a34", [0, 0.02, 0], [1.15, 0.08, 0.42]);
    add(g, BOX, "#6a4424", [0.3, 0.065, 0], [0.04, 0.01, 0.42]);
    add(g, BOX, "#6a4424", [-0.25, 0.065, 0], [0.04, 0.01, 0.42]);
  } else if (kind === "bote") {
    const sh = new THREE.Shape(); sh.moveTo(-0.55, -1.2); sh.lineTo(0.55, -1.2); sh.lineTo(0.62, 0.4); sh.quadraticCurveTo(0.4, 1.1, 0, 1.4); sh.quadraticCurveTo(-0.4, 1.1, -0.62, 0.4); sh.closePath();
    const hull = new THREE.ExtrudeGeometry(sh, { depth: 0.75, bevelEnabled: false }); hull.rotateX(Math.PI / 2); hull.translate(0, 0.45, 0);
    const hm = new THREE.Mesh(hull, M("#f4f1ea")); hm.castShadow = hm.receiveShadow = true; g.add(hm);
    add(g, BOX, "#8a5a34", [0, 0.42, 0], [1.1, 0.05, 2.3]);
    add(g, BOX, "#2f4a8a", [0, 0.36, 0], [1.28, 0.08, 2.5]).scale.set(1.26, 0.08, 2.45);
    for (const z of [-0.6, 0.5]) add(g, BOX, "#a87a4a", [0, 0.25, z], [1.15, 0.05, 0.25]);
    add(g, CYL, "#a87a4a", [0.68, 0.48, 0.1], [0.03, 1.3, 0.03], [0.4, 0, 1.2]);
  } else if (kind === "periscopio") {
    add(g, CYL, "#5a6068", [0, 0.8, 0], [0.06, 1.6, 0.06]);
    add(g, BOX, "#5a6068", [0, 1.62, 0.05], [0.12, 0.12, 0.2]);
    add(g, CYL, "#fbf7ee", [0, 0.01, 0], [0.35, 0.02, 0.35]);
  } else if (kind === "estela") {
    add(g, BOX, "#fbf7ee", [0, 0.01, -2.0], [0.28, 0.02, 4.0]);
    add(g, BOX, "#e8f4fa", [0, 0.012, -2.0], [0.45, 0.015, 3.6]);
    add(g, CAP, "#3a4048", [0, -0.05, 0.15], [0.09, 0.3, 0.09], [Math.PI / 2, 0, 0]);
  }
  return g;
};
/** barcos de juguete: casco en punta (adelante = +z), línea de flotación en y = 0 (el casco sigue 2 m bajo el agua) */
const casco = (g: THREE.Group, L: number, B: number, H: number, col: string, deck: string, keel = "#7a2a2a") => {
  const sh = new THREE.Shape();
  sh.moveTo(-B * 0.42, L / 2); sh.lineTo(B * 0.42, L / 2); sh.lineTo(B / 2, L * 0.2); sh.quadraticCurveTo(B * 0.35, -L * 0.38, 0, -L / 2); sh.quadraticCurveTo(-B * 0.35, -L * 0.38, -B / 2, L * 0.2); sh.closePath();
  const geo = (h: number, y0: number) => { const e = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false }); e.rotateX(-Math.PI / 2); e.translate(0, y0, 0); return e; };
  const m1 = new THREE.Mesh(geo(H, 0), M(col)), m2 = new THREE.Mesh(geo(2.2, -2.2), M(keel)), m3 = new THREE.Mesh(geo(0.06, H), M(deck));
  for (const m of [m1, m2, m3]) { m.castShadow = m.receiveShadow = true; g.add(m); }
  add(g, BOX, "#2a2730", [0, 0.04, 0], [B * 1.005, 0.12, L * 0.62]);
};
const torreta = (g: THREE.Group, z: number, y: number, r: number, col: string, dir = 1, n = 2) => {
  add(g, CYL, col, [0, y + r * 0.35, z], [r, r * 0.7, r]);
  add(g, BOX, col, [0, y + r * 0.6, z + dir * r * 0.2], [r * 1.5, r * 0.55, r * 1.3]);
  for (let k = 0; k < n; k++) add(g, CYL, col, [(k - (n - 1) / 2) * r * 0.5, y + r * 0.6, z + dir * r * 1.7], [r * 0.12, r * 2.2, r * 0.12], [Math.PI / 2, 0, 0]);
};
const barco = (g: THREE.Group, kind: string) => {
  if (kind === "acorazado") {
    const C = "#8c939c", C2 = "#767d86", DK = "#b8a47e";
    casco(g, 22, 4.2, 2.0, C, DK);
    torreta(g, 6.5, 2.0, 0.85, C2, 1); torreta(g, 4.3, 2.6, 0.85, C2, 1);
    torreta(g, -6.5, 2.0, 0.85, C2, -1); torreta(g, -4.3, 2.6, 0.85, C2, -1);
    add(g, BOX, C, [0, 2.6, 0.6], [2.4, 1.2, 5.5]);
    add(g, BOX, C, [0, 3.7, 1.8], [1.6, 1.4, 2.0]);
    add(g, BOX, C2, [0, 4.8, 2.0], [1.0, 1.0, 1.2]);
    add(g, CYL, C2, [0, 5.6, 2.0], [0.55, 0.3, 0.55]);
    add(g, CYL, C, [0, 4.0, -0.6], [0.75, 2.2, 1.0]);
    add(g, CYL, "#3a3a40", [0, 5.15, -0.6], [0.7, 0.12, 0.95]);
    add(g, CYL, C2, [0, 6.5, 2.2], [0.06, 3.0, 0.06]);
    add(g, CYL, C2, [0, 4.5, -3.0], [0.06, 2.4, 0.06]);
    for (const sx of [-1, 1]) for (const z of [-1.5, 0.2, 1.6]) add(g, CYL, C2, [sx * 1.25, 2.55, z], [0.18, 0.3, 0.18]);
  } else if (kind === "destructor") {
    const C = "#a6aeb6", C2 = "#8a929a", DK = "#9a9488";
    casco(g, 16, 2.6, 1.6, C, DK);
    torreta(g, 5.0, 1.6, 0.5, C2, 1, 2); torreta(g, 3.4, 2.0, 0.5, C2, 1, 2); torreta(g, -5.3, 1.6, 0.5, C2, -1, 2);
    add(g, BOX, C, [0, 2.3, 1.8], [1.5, 1.4, 1.8]);
    add(g, BOX, "#2a3a4a", [0, 2.75, 2.71], [1.2, 0.3, 0.03]);
    add(g, CYL, C, [0, 2.9, -0.3], [0.45, 2.6, 0.6]);
    add(g, CYL, C, [0, 2.7, -2.2], [0.45, 2.2, 0.6]);
    for (const z of [-0.3, -2.2]) add(g, CYL, "#2a2730", [0, z === -0.3 ? 4.2 : 3.8, z], [0.42, 0.1, 0.57]);
    add(g, CYL, C2, [0, 4.6, 1.5], [0.05, 3.0, 0.05]);
    add(g, BOX, "#fbf7ee", [0.0, 5.6, 1.2], [0.02, 0.4, 0.6]);
    add(g, BOX, "#d8323a", [0.0, 5.6, 1.2], [0.025, 0.4, 0.08]);
    add(g, BOX, "#d8323a", [0.0, 5.6, 1.2], [0.025, 0.08, 0.6]);
  } else {
    const C = "#868d96", C2 = "#6e757e", DK = "#5a5e66";
    casco(g, 26, 4.4, 2.2, C, DK);
    add(g, BOX, C, [0, 2.9, -0.5], [5.4, 1.4, 25]);
    add(g, BOX, DK, [0, 3.62, -0.5], [5.6, 0.06, 25.4]);
    for (let k = 0; k < 9; k++) add(g, BOX, "#e8e4d8", [0, 3.66, -11 + k * 2.6], [0.12, 0.01, 1.2]);
    add(g, BOX, C, [-2.3, 4.6, 1.5], [0.8, 2.0, 4.0]);
    add(g, BOX, C2, [-2.3, 5.9, 2.0], [0.7, 0.7, 1.8]);
    add(g, CYL, C2, [-2.3, 6.4, 0.6], [0.4, 1.2, 0.55]);
    add(g, CYL, C2, [-2.3, 7.6, 2.4], [0.05, 2.6, 0.05]);
    add(g, BOX, "#2a3a4a", [-1.88, 5.0, 1.5], [0.02, 0.4, 3.0]);
  }
};
/** animación de la utilería: puerta de la jaula (open 0..1), ruedas y patas de los caballos (t = cuadro, moving) */
export const animProp = (g: THREE.Object3D, kind: string, open: number, t: number, moving: boolean) => {
  if (kind === "jaula") { const d = g.getObjectByName("door"); if (d) d.rotation.x = -open * 1.9; }
  if (kind === "carruaje") {
    let i = 0;
    g.traverse((o) => {
      if (o.name === "wheel" && moving) o.rotation.x = t * 0.25;
      if (o.name === "leg") { o.rotation.x = moving ? Math.sin(t * 0.55 + (i % 4) * 1.6) * 0.55 : 0; i++; }
    });
  }
};
