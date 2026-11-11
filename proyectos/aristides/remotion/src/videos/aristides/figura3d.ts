// Personajes 3D tipo caricatura (muñequitos de juguete) armados con primitivas a partir del mismo Outfit de toon.ts.
// Cabeza grande, cuerpo de botella, brazos y piernas de tubo, cara con expresiones (ojos, cejas, boca) y accesorios
// (pelo, barba, bigote, gorra, casco griego, corona, laurel, capa, escudo, lanza). Se miran a cámara como las tarjetas.
import * as THREE from "three";
import type { Outfit, Expr } from "./toon";

export type FigOpts = { mode: string; expr: Expr; blink: number; look: number; phase: number };

const mats = new Map<string, THREE.Material>();
const GRAD = (() => {
  const d = new Uint8Array([90, 170, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true;
  return t;
})();
/** material de juguete: toon de tres tonos */
const M = (col: string) => {
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
  constructor(public o: Outfit, public key: string) {
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
    const f = FACES[op.expr] ?? FACES.neutral;
    this.buildFace(f, op.blink, Math.round(op.look));
    const walk = op.mode === "stroll" || op.mode === "march";
    const sw = walk ? Math.sin(op.phase * Math.PI * 2) * 0.45 : 0;
    this.legs[0].rotation.x = sw; this.legs[1].rotation.x = -sw;
    this.arms[0].rotation.x = -sw * 0.8; this.arms[1].rotation.x = sw * 0.8;
    this.body.position.y = walk ? Math.abs(Math.cos(op.phase * Math.PI * 2)) * 0.03 : 0;
    if (op.mode === "sit") {
      for (const l of this.legs) { l.rotation.x = -Math.PI / 2; l.position.z = 0.05; }
      this.body.position.y = -0.42;
    } else for (const l of this.legs) l.position.z = 0;
    this.head.rotation.y = op.look * 0.25;
    this.head.rotation.z = Math.sin(op.phase * Math.PI * 2) * (walk ? 0.04 : 0);
  }
}
