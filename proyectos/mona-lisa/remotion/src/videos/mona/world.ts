// París, 1925, como una sola escena three.js: cielo, el Sena, muelles, pueblo haussmanniano (build.ts), la Torre Eiffel
// de celosía (con la parte de arriba aparte para la fantasía de la grúa), la grúa, banderas francesas, el taxi de la
// la sala del Louvre con la Mona Lisa, la habitación de Peruggia, la comisaría, la tienda de Florencia y el elenco (cast.ts).
// update(id, f, cam) lo coloca todo para la toma id en el cuadro f.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Batch, boxGeo, V, lam, buildTown, Kit, Ray, quad } from "./build";
import { rep, ctex, stoneHD, cobbleHD, grassHD, waterNear, waterFar, cloudHD, bed, planksHD } from "./paint";
import { Pen } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, LFB, twoTone, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, D0, SHOTS, camAt, carAt, CarPose, V3, ShotDef, TOWER_C, TOWER_S, towerLift, BACK_Z, MONA, MONA_W, MONA_H, PUERTA_X, CABALLETE, CUARTO, BAUL, COMISARIA, REJA_Z, TIENDA, monaOnWall } from "./story";
import { drawMona } from "./cuadro";
import { FLAG } from "./banderas";

export const loadKit = () => Promise.resolve({} as Kit);

const sunDiscTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});
const smokeTex = () => ctex("smoke", 256, 256, (g) => {
  const p = new Pen(g);
  for (const [x, y, r, c] of [[90, 150, 60, "#8f8d96"], [150, 120, 70, "#a3a1aa"], [170, 165, 55, "#8f8d96"], [120, 100, 50, "#b4b2ba"]] as const) p.ell(x, y, r, r * 0.85, c, 0);
});

/** cada posición de lente mirando a su sujeto: las casas que taparían el centro o los lados se quitan */
const sightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS.filter((x) => ["muelle"].includes(x.scene))) for (let f = s.a - 8; f < s.b + 8; f += 2) {
    const c = camAt(s.id, Math.max(0, Math.min(s.b - 1, f))), o = V(...c.pos), look = V(...c.look);
    const fw = look.clone().sub(o), len = fw.length();
    fw.normalize();
    const rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
    const ty = Math.tan((c.fov * Math.PI) / 360), tx = ty * (9 / 16);
    // las cámaras altas (vistas aéreas) sólo despejan su eje: si no, el rayo de arriba borraría las fachadas del fondo
    const rays = c.pos[1] > D0 + 5 ? [[0, 0]] : [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4]];
    for (const [sx, sy] of rays)
      out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
  }
  return out;
};

// ---------------- el coche (Gräf & Stift doble faetón, 1910) ----------------
/** coche descapotable en su propio grupo: delante = +z local, suelo en y = 0, ancho 1.75 m, largo 4.6 m */
class Car {
  g = new THREE.Group();
  wheels: THREE.Mesh[] = [];
  flags: THREE.Mesh[] = [];
  private dist = 0;
  constructor(parent: THREE.Object3D, body: string, standard: boolean) {
    const b = new Batch();
    const paint = twoTone(new THREE.MeshPhongMaterial({ color: body, specular: "#9a9aa4", shininess: 70 }), 0.2);
    const black = lam("carBlack", () => ({ color: "#1d1b22" }));
    const leather = lam("carLeather", () => ({ color: "#6b3a2a" }));
    const brass = twoTone(new THREE.MeshPhongMaterial({ color: "#d8b04a", specular: "#fff2c0", shininess: 90 }), 0.2);
    const canvas = lam("carTop", () => ({ color: "#3a3631" }));
    const W = 0.87;
    // chasis y caja: capó largo delante, cabina abierta, caja trasera
    b.add(boxGeo(V(-W, 0.42, -2.3), V(W, 0.56, 2.3)), black);                     // bastidor
    b.add(boxGeo(V(-0.55, 0.56, 0.95), V(0.55, 1.12, 2.3)), paint);               // capó
    b.add(boxGeo(V(-0.6, 0.5, 2.22), V(0.6, 1.16, 2.36)), lam("carGrill", () => ({ color: "#bfc4cc" }))); // radiador
    b.add(boxGeo(V(-W, 0.56, -2.15), V(W, 1.08, 0.95)), paint);                   // caja (lados bajos de la cabina abierta)
    b.add(boxGeo(V(-W + 0.08, 0.7, -1.55), V(W - 0.08, 1.12, 0.75)), leather);    // interior a la vista
    for (const z0 of [0.05, -1.35]) b.add(boxGeo(V(-W + 0.1, 0.7, z0 - 0.15), V(W - 0.1, 1.45, z0 + 0.05)), leather); // respaldos
    b.add(boxGeo(V(-0.7, 1.08, 0.9), V(0.7, 1.13, 0.98)), black);                 // salpicadero
    // parabrisas: marco de latón
    for (const x of [-0.7, 0.7]) b.add(boxGeo(V(x - 0.025, 1.08, 0.92), V(x + 0.025, 1.62, 0.97)), brass);
    b.add(boxGeo(V(-0.7, 1.6, 0.92), V(0.7, 1.64, 0.97)), brass);
    // capota plegada detrás
    const top = new THREE.CylinderGeometry(0.28, 0.28, 1.7, 14, 1, false, 0, Math.PI); top.rotateZ(Math.PI / 2); top.rotateX(-Math.PI / 2);
    b.add(top, canvas, new THREE.Matrix4().makeTranslation(0, 1.08, -2.0));
    // guardabarros y estribos
    for (const s of [-1, 1]) {
      b.add(boxGeo(V(s * W - (s > 0 ? 0.0 : 0.3), 0.36, -1.75), V(s * W + (s > 0 ? 0.3 : 0.0), 0.42, 1.2)), black);    // estribo
      for (const zc of [1.65, -1.55]) {
        const fender = new THREE.CylinderGeometry(0.52, 0.52, 0.3, 16, 1, true, -Math.PI / 2, Math.PI); fender.rotateZ(Math.PI / 2);
        b.add(fender, black, new THREE.Matrix4().makeTranslation(s * (W + 0.07), 0.45, zc));
      }
    }
    // faros de latón
    for (const s of [-1, 1]) {
      const lamp = new THREE.CylinderGeometry(0.13, 0.13, 0.18, 14); lamp.rotateX(Math.PI / 2);
      b.add(lamp, brass, new THREE.Matrix4().makeTranslation(s * 0.62, 1.0, 2.3));
    }
    // volante (lado derecho)
    const wheel = new THREE.TorusGeometry(0.19, 0.025, 6, 18); wheel.rotateX(-0.9);
    b.add(wheel, black, new THREE.Matrix4().makeTranslation(0.42, 1.35, 0.72));
    b.build(this.g);
    // ruedas de radios: neumático + llanta pintada
    const tyre = new THREE.CylinderGeometry(0.45, 0.45, 0.16, 22); tyre.rotateZ(Math.PI / 2);
    const tyreM = lam("tyre", () => ({ color: "#26232b" }));
    const spokeM = lam("spokes", () => ({ map: spokesTex(), transparent: false }));
    const disc = new THREE.CircleGeometry(0.34, 22); disc.rotateY(Math.PI / 2);
    for (const [x, z] of [[-W - 0.02, 1.65], [W + 0.02, 1.65], [-W - 0.02, -1.55], [W + 0.02, -1.55]]) {
      const w = new THREE.Mesh(tyre, tyreM);
      const d1 = new THREE.Mesh(disc, spokeM); d1.position.x = 0.085; const d2 = d1.clone(); d2.position.x = -0.085; d2.rotation.y = Math.PI;
      w.add(d1, d2);
      w.position.set(x, 0.45, z); w.castShadow = true;
      this.wheels.push(w); this.g.add(w);
    }
    // banderines en los guardabarros delanteros (estandarte imperial)
    if (standard) for (const s of [-1, 1]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6), brass); pole.position.set(s * 0.75, 1.15, 2.05);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.26, 6, 1), lam("pennantFr", () => ({ map: tricolor(), side: THREE.DoubleSide })));
      fl.position.set(s * 0.75 - 0.0, 1.27, 2.05 - 0.22); fl.rotation.y = Math.PI / 2;
      this.flags.push(fl); this.g.add(pole, fl);
    }
    this.g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    parent.add(this.g);
  }
  pose(c: CarPose | null, t: number) {
    this.g.visible = !!c;
    if (!c) return;
    this.g.position.set(c.x, D0, c.z); this.g.rotation.set(0, c.yaw, 0);
    // las ruedas giran con la distancia recorrida (aprox. por velocidad) y la bandera ondea con la marcha
    const spin = (c.v * t) / 0.45;
    for (const w of this.wheels) w.rotation.x = spin;
    for (const fl of this.flags) {
      const p = fl.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const u = (i % 7) / 6;
        p.setZ(i, (0.04 + 0.02 * c.v) * u * Math.sin(t * (4 + c.v) - u * 4));
      }
      p.needsUpdate = true;
    }
  }
}
const spokesTex = () => ctex("spokes", 128, 128, (g) => {
  g.fillStyle = "#e7dcc0"; g.beginPath(); g.arc(64, 64, 64, 0, 7); g.fill();
  g.strokeStyle = "#3b2e2a"; g.lineWidth = 7;
  for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + 60 * Math.cos(a), 64 + 60 * Math.sin(a)); g.stroke(); }
  g.fillStyle = "#3b2e2a"; g.beginPath(); g.arc(64, 64, 14, 0, 7); g.fill();
  g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.stroke();
});

const tricolor = () => ctex("tricolor", 256, 170, (g) => { FLAG.francia(g, 256, 170); g.fillStyle = "rgba(0,0,0,.08)"; g.fillRect(0, 160, 256, 10); });

// ---------------- la Torre Eiffel (1889; en 1925 pintada de marrón amarillento) ----------------
/** celosía recortada: marco y aspas sobre transparente (las caras de cada pata y los paños de la parte alta) */
const latticeTex = (key: string, col: string) => ctex(key, 256, 512, (g) => {
  g.clearRect(0, 0, 256, 512);
  g.strokeStyle = col; g.lineCap = "square";
  g.lineWidth = 26; g.strokeRect(13, -20, 230, 552);
  g.lineWidth = 15;
  for (let y = 0; y < 512; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y + 128); g.moveTo(256, y); g.lineTo(0, y + 128); g.stroke(); }
  g.lineWidth = 12; for (let y = 0; y <= 512; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
});
const TOWER_COL = "#86643f";
/** medio ancho de la torre (eje de las patas) y grosor de cada pata, en metros reales a la altura y */
const hwT = (y: number) => 4 + 58.5 * Math.exp(-y / 70);
const twT = (y: number) => 2.6 + 12.5 * Math.exp(-y / 55);
const SPLIT = 115; // 2.º piso: aquí se separa la parte de arriba para la grúa
/** prisma de cuatro caras entre dos cuadrados (centro c, medio lado h) a alturas y0, y1, con uv de celosía */
const frustum = (b: Batch, mat: THREE.Material, c0: [number, number], h0: number, y0: number, c1: [number, number], h1: number, y1: number, vRep: number, m?: THREE.Matrix4) => {
  const P = (c: [number, number], h: number, y: number, sx: number, sz: number) => V(c[0] + sx * h, y, c[1] + sz * h);
  const sides: [number, number, number, number][] = [[-1, 1, 1, 1], [1, 1, 1, -1], [1, -1, -1, -1], [-1, -1, -1, 1]];
  for (const [ax, az, bx, bz] of sides)
    b.add(quad(P(c0, h0, y0, ax, az), P(c0, h0, y0, bx, bz), P(c1, h1, y1, bx, bz), P(c1, h1, y1, ax, az), 1, vRep), mat, m);
};
const buildTower = (parent: THREE.Object3D) => {
  const grp = new THREE.Group(), upper = new THREE.Group();
  grp.position.set(TOWER_C[0], D0, TOWER_C[1]); grp.scale.setScalar(TOWER_S);
  upper.position.set(0, SPLIT, 0);
  const lat = lam("towerLattice", () => ({ map: latticeTex("towerLat", TOWER_COL), alphaTest: 0.5, side: THREE.DoubleSide }));
  const solid = lam("towerSolid", () => ({ color: TOWER_COL }));
  const deck = lam("towerDeck", () => ({ map: latticeTex("towerDeck", "#6f5233"), alphaTest: 0.5, side: THREE.DoubleSide }));
  const lo = new Batch(), up = new Batch();
  // patas: 4 prismas curvos de celosía, de 0 a 276 m
  const N = 30, YT = 276;
  for (let i = 0; i < N; i++) {
    const y0 = (YT * i) / N, y1 = (YT * (i + 1)) / N, b = y1 <= SPLIT + 0.01 ? lo : up, off = y1 <= SPLIT + 0.01 ? 0 : SPLIT;
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, -1], [-1, 1]]) {
      const c0: [number, number] = [sx * hwT(y0), sz * hwT(y0)], c1: [number, number] = [sx * hwT(y1), sz * hwT(y1)];
      frustum(b, lat, c0, twT(y0) / 2, y0 - off, c1, twT(y1) / 2, y1 - off, (y1 - y0) / (twT((y0 + y1) / 2) * 1.6));
    }
    // por encima del 2.º piso: paños de celosía entre las patas (la torre se lee como un solo fuste)
    if (y0 >= SPLIT) frustum(up, lat, [0, 0], hwT(y0), y0 - off, [0, 0], hwT(y1), y1 - off, (y1 - y0) / 9);
  }
  // pisos: plataformas con barandilla de celosía
  const floor = (b: Batch, y: number, h: number, t: number, off: number) => {
    b.add(boxGeo(V(-h, y - t - off, -h), V(h, y - t * 0.55 - off, h)), solid);
    frustum(b, deck, [0, 0], h, y - t * 0.55 - off, [0, 0], h, y + 1.2 - off, 0.25);
  };
  floor(lo, 57, hwT(57) + twT(57) / 2 + 3, 6, 0);
  floor(lo, SPLIT, hwT(SPLIT) + twT(SPLIT) / 2 + 2, 4.5, 0);
  // arcos decorativos bajo el primer piso, en las cuatro caras
  for (let k = 0; k < 4; k++) {
    const m = new THREE.Matrix4().makeRotationY((k * Math.PI) / 2);
    const A = hwT(18) - twT(18) * 0.35, B = 33, n = 18;
    for (let i = 0; i < n; i++) {
      const t0 = (Math.PI * i) / n, t1 = (Math.PI * (i + 1)) / n;
      const p0 = V(A * Math.cos(t0), 18 + B * Math.sin(t0), 0), p1 = V(A * Math.cos(t1), 18 + B * Math.sin(t1), 0);
      p0.z = hwT(p0.y); p1.z = hwT(p1.y);
      const mid = p0.clone().add(p1).multiplyScalar(0.5), len = p0.distanceTo(p1) + 0.6;
      const g = new THREE.BoxGeometry(len, 2.2, 1.6);
      const q = new THREE.Quaternion().setFromUnitVectors(V(1, 0, 0), p1.clone().sub(p0).normalize());
      lo.add(g, solid, m.clone().multiply(new THREE.Matrix4().compose(mid, q, V(1, 1, 1))));
    }
  }
  // remate: linterna, cúpula y antena
  up.add(boxGeo(V(-7, YT - SPLIT, -7), V(7, YT - SPLIT + 7, 7)), solid);
  up.add(new THREE.CylinderGeometry(3.2, 5.5, 8, 10), solid, new THREE.Matrix4().makeTranslation(0, YT - SPLIT + 11, 0));
  up.add(new THREE.CylinderGeometry(0.6, 1.0, 22, 8), solid, new THREE.Matrix4().makeTranslation(0, YT - SPLIT + 26, 0));
  lo.build(grp); up.build(upper);
  grp.add(upper);
  parent.add(grp);
  return { grp, upper };
};

// ---------------- la grúa de la fantasía (toma 8), en coordenadas de la torre (metros reales) ----------------
const buildCrane = (parent: THREE.Object3D) => {
  const g = new THREE.Group();
  g.position.set(TOWER_C[0], D0, TOWER_C[1]); g.scale.setScalar(TOWER_S);
  const red = lam("craneLat", () => ({ map: latticeTex("craneLat", "#c2452f"), alphaTest: 0.5, side: THREE.DoubleSide }));
  const redS = lam("craneSolid", () => ({ color: "#c2452f" }));
  const b = new Batch(), MX = 95, MZ = -30, TOP = 360;
  frustum(b, red, [MX, MZ], 5, 0, [MX, MZ], 5, TOP, TOP / 14);                        // mástil
  frustum(b, red, [MX, MZ], 5.5, TOP, [MX, MZ], 3.5, TOP + 16, 1);                    // cabeza
  // pluma hacia la torre (-x) y contrapluma
  const jib = (x0: number, x1: number) => {
    for (const [y0, y1, z0, z1] of [[TOP - 4, TOP, -3, 3]]) {
      b.add(quad(V(x0, y0, z1), V(x1, y0, z1), V(x1, y1, z1), V(x0, y1, z1), Math.abs(x1 - x0) / 8, 0.5), red);
      b.add(quad(V(x1, y0, z0), V(x0, y0, z0), V(x0, y1, z0), V(x1, y1, z0), Math.abs(x1 - x0) / 8, 0.5), red);
      b.add(quad(V(x0, y0, z0), V(x1, y0, z0), V(x1, y0, z1), V(x0, y0, z1), Math.abs(x1 - x0) / 8, 0.5), red);
    }
  };
  jib(-14, MX); jib(MX, MX + 40);
  b.add(boxGeo(V(MX + 28, TOP - 14, -4), V(MX + 40, TOP - 4, 4)), lam("craneWeight", () => ({ color: "#5a5660" })));
  b.add(boxGeo(V(MX - 7, TOP - 18, -6), V(MX + 7, TOP - 6, 6)), redS);                 // cabina
  b.build(g);
  // cable + gancho (se mueven con la parte alta)
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 6), lam("cable", () => ({ color: "#2a2730" })));
  const hook = new THREE.Mesh(new THREE.BoxGeometry(5, 6, 5), lam("hook", () => ({ color: "#3a3640" })));
  g.add(cable, hook);
  parent.add(g);
  return { g, cable, hook, top: TOP };
};

// ---------------- interiores ----------------
const wallpaperTex = () => ctex("wallpaper", 512, 512, (g) => {
  g.fillStyle = "#9b2f36"; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 64) { g.fillStyle = "#87262d"; g.fillRect(x + 40, 0, 24, 512); }
  g.fillStyle = "rgba(240,200,120,.55)";
  for (let y = 32; y < 512; y += 96) for (let x = 20; x < 512; x += 64) {
    g.beginPath(); g.moveTo(x, y - 14); g.lineTo(x + 8, y); g.lineTo(x, y + 14); g.lineTo(x - 8, y); g.closePath(); g.fill();
  }
});
const concreteTex = () => ctex("concrete", 512, 512, (g, r) => {
  g.fillStyle = "#a7ada5"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) for (let x = (y / 64) % 2 ? -64 : 0; x < 512; x += 128) {
    g.fillStyle = `rgba(${90 + r() * 30},${96 + r() * 30},${92 + r() * 30},.18)`; g.fillRect(x + 3, y + 3, 122, 58);
  }
  g.strokeStyle = "rgba(60,64,60,.35)"; g.lineWidth = 4;
  for (let y = 0; y <= 512; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  for (let y = 0; y < 512; y += 64) for (let x = (y / 64) % 2 ? 64 : 0; x < 512; x += 128) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke(); }
});
/** cuadros de relleno para la sala (paisajes y retratos inventados) */
const fillerTex = (k: number) => ctex("filler" + k, 256, 320, (g) => {
  const pal = [["#c9b27a", "#6f8a5a", "#3a5a7a"], ["#7a5a3a", "#d9a441", "#3a2a1a"], ["#8fb0c8", "#e8d8b0", "#5a6b3a"], ["#5a3a4a", "#c98a6a", "#2a2018"]][k % 4];
  g.fillStyle = pal[0]; g.fillRect(0, 0, 256, 320);
  g.fillStyle = pal[1]; g.beginPath(); g.moveTo(0, 220); g.quadraticCurveTo(128, 120 + k * 20, 256, 210); g.lineTo(256, 320); g.lineTo(0, 320); g.fill();
  g.fillStyle = pal[2];
  if (k % 2) { g.beginPath(); g.ellipse(128, 150, 50, 64, 0, 0, 7); g.fill(); g.fillRect(70, 200, 116, 120); }
  else { g.beginPath(); g.arc(70 + k * 30, 80, 28, 0, 7); g.fill(); }
  const v = g.createRadialGradient(128, 160, 60, 128, 160, 220); v.addColorStop(0, "rgba(30,20,10,0)"); v.addColorStop(1, "rgba(30,20,10,.5)");
  g.fillStyle = v; g.fillRect(0, 0, 256, 320);
});
const monaTex = () => ctex("monaLisa", 400, 580, (g) => drawMona(g));
const papelTex = (key: string, base: string, stripe: string) => ctex(key, 512, 512, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 64) { g.fillStyle = stripe; g.fillRect(x + 44, 0, 14, 512); }
});
/** habitación abierta por delante y por arriba: suelo, pared del fondo en BACK_Z y dos laterales */
const room = (b: Batch, cx: number, w: number, h: number, wall: THREE.Material, floor: THREE.Material, trim?: THREE.Material) => {
  const X0 = cx - w / 2, X1 = cx + w / 2, Z1 = BACK_Z, Z0 = BACK_Z - 10;
  b.add(boxGeo(V(X0 - 2, D0 - 0.2, Z0 - 2), V(X1 + 2, D0 + 0.015, Z1 + 2), 2), floor);
  for (const [a, c] of [[V(X0, D0, Z1), V(X1, D0 + h, Z1 + 0.3)], [V(X0 - 0.3, D0, Z0), V(X0, D0 + h, Z1)], [V(X1, D0, Z0), V(X1 + 0.3, D0 + h, Z1)]] as const) b.add(boxGeo(a, c, 0), wall);
  if (trim) {
    b.add(boxGeo(V(X0, D0, Z1 - 0.06), V(X1, D0 + 1.0, Z1)), trim);
    for (const x of [X0, X1 - 0.06]) b.add(boxGeo(V(x, D0, Z0), V(x + 0.06, D0 + 1.0, Z1)), trim);
  }
};
const buildRooms = (R: THREE.Object3D) => {
  const b = new Batch();
  const floor = lam("parquet", () => ({ map: rep(planksHD(), 3, 3) }));
  const gold = lam("gilt", () => ({ color: "#b8913e" }));
  const wood = lam("mahogany", () => ({ color: "#6a3a26" }));
  const dark = lam("darkwood", () => ({ color: "#4a2c22" }));
  // ---- la sala del Louvre (paredes rojas, como el Salón Carré) ----
  room(b, 600, 15, 6, lam("wallpaper", () => ({ map: rep(wallpaperTex(), 6, 2) })), floor, dark);
  b.add(boxGeo(V(592.5, D0 + 5.6, BACK_Z - 0.14), V(607.5, D0 + 5.78, BACK_Z)), gold);
  // marco dorado de la Mona Lisa (siempre en la pared) y los cuatro ganchos
  const fx0 = MONA[0] - MONA_W / 2 - 0.09, fx1 = MONA[0] + MONA_W / 2 + 0.09, fy0 = MONA[1] - MONA_H / 2 - 0.09, fy1 = MONA[1] + MONA_H / 2 + 0.09;
  const iron = lam("hookIron", () => ({ color: "#2a2730" }));
  for (const [x, y] of [[fx0 + 0.12, fy0 + 0.15], [fx1 - 0.12, fy0 + 0.15], [fx0 + 0.12, fy1 - 0.15], [fx1 - 0.12, fy1 - 0.15]]) {
    b.add(boxGeo(V(x - 0.025, y - 0.025, BACK_Z - 0.055), V(x + 0.025, y + 0.025, BACK_Z)), iron);
    b.add(boxGeo(V(x - 0.025, y + 0.02, BACK_Z - 0.055), V(x + 0.025, y + 0.07, BACK_Z - 0.035)), iron);
  }
  // otros cuadros con marco
  ([[594.2, 2.1, 1.6, 1.2, 0], [596.9, 1.9, 1.1, 1.5, 1], [603.0, 2.0, 1.5, 1.1, 2], [606.4, 1.9, 0.9, 1.25, 3]] as const).forEach(([x, y, w, h, k]) => {
    if (Math.abs(x - PUERTA_X) < 1.4) return;
    b.add(boxGeo(V(x - w / 2 - 0.1, D0 + y - h / 2 - 0.1, BACK_Z - 0.08), V(x + w / 2 + 0.1, D0 + y + h / 2 + 0.1, BACK_Z)), gold);
    b.add(quad(V(x + w / 2, D0 + y - h / 2, BACK_Z - 0.09), V(x - w / 2, D0 + y - h / 2, BACK_Z - 0.09), V(x - w / 2, D0 + y + h / 2, BACK_Z - 0.09), V(x + w / 2, D0 + y + h / 2, BACK_Z - 0.09)), lam("filler" + k, () => ({ map: fillerTex(k) })));
  });
  // puerta de servicio
  b.add(boxGeo(V(PUERTA_X - 0.65, D0, BACK_Z - 0.1), V(PUERTA_X + 0.65, D0 + 2.6, BACK_Z)), dark);
  b.add(boxGeo(V(PUERTA_X - 0.75, D0 + 2.6, BACK_Z - 0.12), V(PUERTA_X + 0.75, D0 + 2.75, BACK_Z)), gold);
  b.add(boxGeo(V(PUERTA_X + 0.35, D0 + 1.1, BACK_Z - 0.16), V(PUERTA_X + 0.45, D0 + 1.2, BACK_Z - 0.1)), gold);
  // banqueta en medio de la sala y cordón delante del cuadro
  b.add(boxGeo(V(596.4, D0, -601.2), V(598.6, D0 + 0.45, -600.6)), lam("velvet", () => ({ color: "#2f5a4a" })));
  // ---- la habitación de Peruggia: papel pintado gastado, cama, ventana y el baúl ----
  room(b, CUARTO[0], 7, 4, lam("bedroomPaper", () => ({ map: rep(papelTex("bedroomPaper", "#d8c8a0", "#c4b088"), 3, 1.2) })), lam("boards", () => ({ map: rep(planksHD(), 2, 2) })));
  b.add(boxGeo(V(CUARTO[0] - 3.2, D0, BACK_Z - 2.0), V(CUARTO[0] - 1.3, D0 + 0.55, BACK_Z)), lam("bedSheet", () => ({ color: "#e9e2d0" })));
  b.add(boxGeo(V(CUARTO[0] - 3.25, D0, BACK_Z - 0.12), V(CUARTO[0] - 1.25, D0 + 1.1, BACK_Z)), wood);
  b.add(boxGeo(V(CUARTO[0] + 1.2, D0 + 1.4, BACK_Z - 0.06), V(CUARTO[0] + 2.4, D0 + 2.8, BACK_Z - 0.02)), lam("window", () => ({ color: "#ffd9a0" })));
  b.add(boxGeo(V(CUARTO[0] + 1.75, D0 + 1.4, BACK_Z - 0.09), V(CUARTO[0] + 1.85, D0 + 2.8, BACK_Z - 0.05)), wood);
  b.add(boxGeo(V(BAUL.x - BAUL.w / 2, D0, BAUL.z - BAUL.d / 2), V(BAUL.x + BAUL.w / 2, D0 + BAUL.h, BAUL.z + BAUL.d / 2)), lam("trunk", () => ({ color: "#7a4a2a" })));
  for (const dx of [-0.35, 0.35]) b.add(boxGeo(V(BAUL.x + dx - 0.04, D0 - 0.001, BAUL.z - BAUL.d / 2 - 0.01), V(BAUL.x + dx + 0.04, D0 + BAUL.h + 0.001, BAUL.z + BAUL.d / 2 + 0.01)), lam("brassBand", () => ({ color: "#b8923a" })));
  // ---- la comisaría: pared gris, calabozo con rejas, mesa de interrogatorio ----
  const cx = COMISARIA[0];
  room(b, cx, 7, 4, lam("concrete", () => ({ map: rep(concreteTex(), 2, 1.2) })), lam("cellFloor", () => ({ color: "#8a8f88" })));
  const bars = lam("barIron", () => ({ color: "#3d4048" }));
  for (let x = cx - 2.4; x <= cx - 0.2; x += 0.22) b.add(new THREE.CylinderGeometry(0.026, 0.026, 3.0, 8), bars, new THREE.Matrix4().makeTranslation(x, D0 + 1.5, REJA_Z));
  for (const y of [0.2, 2.2, 2.95]) b.add(boxGeo(V(cx - 2.45, D0 + y, REJA_Z - 0.03), V(cx - 0.15, D0 + y + 0.07, REJA_Z + 0.03)), bars);
  b.add(boxGeo(V(cx - 0.2, D0, REJA_Z - 0.03), V(cx - 0.1, D0 + 3.0, BACK_Z)), bars);
  b.add(boxGeo(V(cx + 0.3, D0 + 0.74, -599.6), V(cx + 1.7, D0 + 0.78, -598.9)), wood);
  for (const [x, z] of [[cx + 0.36, -599.54], [cx + 1.64, -599.54], [cx + 0.36, -598.96], [cx + 1.64, -598.96]]) b.add(boxGeo(V(x - 0.03, D0, z - 0.03), V(x + 0.03, D0 + 0.74, z + 0.03)), wood);
  b.add(new THREE.CylinderGeometry(0.02, 0.07, 0.4, 10), bars, new THREE.Matrix4().makeTranslation(cx + 1.5, D0 + 0.98, -599.3));
  b.add(new THREE.ConeGeometry(0.16, 0.14, 14, 1, true), lam("lampGreen", () => ({ color: "#2f8a5a", side: THREE.DoubleSide })), new THREE.Matrix4().makeTranslation(cx + 1.5, D0 + 1.2, -599.3));
  // ---- la tienda del marchante en Florencia: paredes verdes, escritorio, cuadros apoyados ----
  const tx = TIENDA[0];
  room(b, tx, 7, 4, lam("greenPaper", () => ({ map: rep(papelTex("greenPaper", "#4f7a5a", "#45704f"), 3, 1.2) })), floor, dark);
  b.add(boxGeo(V(tx - 0.9, D0 + 0.74, -597.5), V(tx + 0.9, D0 + 0.8, -596.8)), wood);
  b.add(boxGeo(V(tx - 0.88, D0, -597.48), V(tx + 0.88, D0 + 0.74, -597.42)), wood);
  ([[tx - 2.4, 1.0, 0.9, 1.2, 1], [tx + 2.2, 1.0, 1.2, 0.9, 2]] as const).forEach(([x, y, w, h, k]) => {
    b.add(boxGeo(V(x - w / 2 - 0.08, D0 + y - h / 2 - 0.08, BACK_Z - 0.3), V(x + w / 2 + 0.08, D0 + y + h / 2 + 0.08, BACK_Z - 0.22)), gold);
    b.add(quad(V(x + w / 2, D0 + y - h / 2, BACK_Z - 0.31), V(x - w / 2, D0 + y - h / 2, BACK_Z - 0.31), V(x - w / 2, D0 + y + h / 2, BACK_Z - 0.31), V(x + w / 2, D0 + y + h / 2, BACK_Z - 0.31)), lam("filler" + k, () => ({ map: fillerTex(k) })));
  });
  b.build(R, false);
  const easelG = new THREE.Group(), eb = new Batch();
  // caballete del pintor (tres patas y un lienzo en blanco)
  const C = CABALLETE;
  for (const [dx, dz] of [[-0.3, 0.12], [0.3, 0.12], [0, -0.35]]) {
    const top = V(C[0], D0 + 1.75, C[2]), foot = V(C[0] + dx, D0, C[2] + dz), mid = top.clone().add(foot).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), top.clone().sub(foot).normalize());
    eb.add(new THREE.BoxGeometry(0.05, top.distanceTo(foot), 0.05), wood, new THREE.Matrix4().compose(mid, q, V(1, 1, 1)));
  }
  eb.add(boxGeo(V(C[0] - 0.36, D0 + 0.95, C[2] - 0.04), V(C[0] + 0.36, D0 + 1.65, C[2] + 0.0)), lam("canvasBlank", () => ({ color: "#f3efe4" })));
  eb.build(easelG, false); R.add(easelG);
  // la Mona Lisa: lienzo aparte, para descolgarla
  const mona = new THREE.Mesh(new THREE.PlaneGeometry(MONA_W, MONA_H), lam("monaLisa", () => ({ map: monaTex() })));
  mona.position.set(MONA[0], MONA[1], BACK_Z - 0.075); mona.rotation.y = Math.PI;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(MONA_W + 0.18, MONA_H + 0.18, 0.06), gold);
  frame.position.set(MONA[0], MONA[1], BACK_Z - 0.03);
  mona.receiveShadow = frame.receiveShadow = false;
  R.add(mona, frame);
  // la tapa del baúl, con bisagra en el borde de atrás
  const lid = new THREE.Group();
  lid.position.set(BAUL.x, D0 + BAUL.h, BAUL.z + BAUL.d / 2);
  const lm = new THREE.Mesh(new THREE.BoxGeometry(BAUL.w + 0.04, 0.08, BAUL.d + 0.02), lam("trunkLid", () => ({ color: "#8a5632" })));
  lm.position.set(0, 0.04, -BAUL.d / 2); lid.add(lm); R.add(lid);
  return { mona, frame, lid, easel: easelG };
};

type Mats = Record<string, THREE.Material>;

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private WU: Record<string, THREE.IUniform>;
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private flags: THREE.Mesh[] = [];
  private car: Car;
  private tower: { grp: THREE.Group; upper: THREE.Group };
  private rooms: { mona: THREE.Mesh; frame: THREE.Mesh; lid: THREE.Group; easel: THREE.Group };
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root, M: Mats = {};
    // ---- cielo + luz ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunDiscTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true,
      transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- suelo, río, muelles ----
    const b = new Batch();
    M.grass = lam("grassHD", () => ({ map: grassHD() }));
    M.cobble = lam("cobbleHD", () => ({ map: cobbleHD() }));
    M.wall = lam("wallHD", () => ({ map: stoneHD("wallHD", ["#c9bcaa", "#bfb19f", "#d1c5b4", "#b8aa97"], "#958776") }));
    M.cope = lam("copeHD", () => ({ map: stoneHD("copeHD", ["#e6dccd", "#ddd3c3", "#ece4d6", "#d6cbba"], "#aea293") }));
    M.bridge = lam("bridgeHD", () => ({ map: stoneHD("bridgeHD", ["#d9cdb7", "#cfc2aa", "#e2d7c3", "#c6b9a2"], "#9d907c") }));
    M.bed = lam("bed", () => ({ map: bed() }));
    M.wood = lam("poleWood", () => ({ color: "#6b4a34" }));
    for (const s of [-1, 1]) {
      const zn = s * 30, zf = s * 900;
      b.add(s < 0 ? quadUp(-900, 900, zf, zn, 450, 217.5, -0.04) : quadUp(-900, 900, zn, zf, 450, 217.5, -0.04), M.grass);
      b.add(s < 0 ? quadUp(-160, 160, -36.5, -30, 80, 1.625, 0.012) : quadUp(-160, 160, 30, 36.5, 80, 1.625, 0.012), M.cobble);
      b.add(s < 0 ? quadUp(-6, 6, -170, -36.5, 3, 33.375, 0.012) : quadUp(-6, 6, 36.5, 170, 3, 33.375, 0.012), M.cobble);
      // plaza adoquinada en la esquina del muelle con la calle (sin parches de césped entre fachadas)
      if (s < 0) b.add(quadUp(-20, 20, -47, -36.5, 10, 2.625, 0.011), M.cobble);
      b.add(s < 0 ? wallQuad(-900, 900, -30, 1) : wallQuad(900, -900, 30, -1), M.wall);
      for (const [x0, x1] of [[-600, -2.8], [2.8, 600]]) b.add(boxGeo(V(x0, D0, s < 0 ? -30.5 : 30), V(x1, D0 + 0.75, s < 0 ? -30 : 30.5), 2), M.cope);
      b.add(boxGeo(V(-600, D0 - 0.05, s < 0 ? -30.6 : 29.4), V(600, D0 + 0.02, s < 0 ? -29.4 : 30.6), 2), M.cope);
    }
    b.add(quadUp(-900, 900, -30, 30, 225, 7.5, -0.6 - D0), M.bed);
    // mástiles con banderas francesas a lo largo del muelle norte, sobre el pretil
    const flagXs = [-34, -24, 16, 26, 36, 48, 60, 72, 84];
    for (const x of flagXs) b.add(boxGeo(V(x - 0.05, D0 + 0.75, -30.3), V(x + 0.05, D0 + 6.2, -30.2)), M.wood);
    b.build(R);
    buildTown(R, kit, sightLines());
    const flagM = lam("flagFr", () => ({ map: tricolor(), side: THREE.DoubleSide }));
    for (const x of flagXs) {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0, 12, 1), flagM);
      f.position.set(x, D0 + 5.6, -30.25); f.castShadow = true; f.frustumCulled = false;
      this.flags.push(f); R.add(f);
    }

    // ---- agua ----
    const wNear = waterNear(), wFar = waterFar();
    for (const t of [wNear, wFar]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; }
    this.WU = {
      wNearC: { value: new THREE.Color() }, wMidC: { value: new THREE.Color() }, wFarC: { value: new THREE.Color() },
      wCrest: { value: new THREE.Color() }, wTrough: { value: new THREE.Color() }, wGlint: { value: new THREE.Color() },
      wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) }, wNearTex: { value: wNear }, wFarTex: { value: wFar }, wTime: { value: 0 },
    };
    const waterM = new THREE.MeshLambertMaterial({ color: 0xffffff });
    waterM.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.WU);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", WATER_DECL)
        .replace("#include <map_fragment>", WATER_COL)
        .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
        .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n  reflectedLight.directDiffuse = diffuseColor.rgb * mix(wShade, vec3(1.0), sunVis);\n  reflectedLight.indirectDiffuse = vec3(0.0);");
    };
    waterM.customProgramCacheKey = () => "river1";
    const wm = new THREE.Mesh(quadUp(-900, 900, -30, 30, 1, 1, -D0), waterM);
    wm.receiveShadow = true;
    R.add(wm);

    // ---- la torre, la grúa, los interiores, el taxi ----
    this.tower = buildTower(R);
    this.rooms = buildRooms(R);
    this.car = new Car(R, "#b8432f", false);
  }

  /** sol relativo a la cámara, fijo por toma */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s.sunAz ?? L.az), el = THREE.MathUtils.degToRad(s.sunEl ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light];
    // ---- cámara ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.15; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- luz ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- cielo, niebla, sol, nubes ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = s.fogFar ? L.fogNear * 2 : L.fogNear; this.fog.far = s.fogFar ?? L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    const W = this.WU, wc = K.water;
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade); W.wTime.value = t;
    // banderas ondeando
    for (const fl of this.flags) {
      const p = fl.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const u = (i % 13) / 12, y = i < 13 ? 0.5 : -0.5;
        p.setXYZ(i, u * 1.5, y + 0.05 * u * Math.sin(t * 4 - u * 3), 0.2 * u * Math.sin(t * 5.5 - u * 5 + fl.position.x));
      }
      p.needsUpdate = true;
    }
    // ---- el taxi, la torre y la grúa ----
    this.car.pose(carAt(id, f), t);
    const [lift, tilt] = towerLift(id, f);
    this.tower.upper.position.y = 115 + lift / TOWER_S; this.tower.upper.rotation.z = tilt;
    // la Mona Lisa en la pared (o no) y la tapa del baúl
    this.rooms.easel.visible = id === 5;
    this.rooms.mona.visible = this.rooms.frame.visible = s.scene === "sala" && monaOnWall(id, f);
    this.rooms.lid.rotation.x = s.scene === "cuarto" && f >= 880 ? 1.75 * Math.min(1, (f - 880) / 22) ** 0.7 : 0;
    void tilt;

    // ---- elenco + efectos ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, f, { pos: cam.position, right, sun: sunDir });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e2 = this.fx(fi++);
      e2.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e2.use(!!p.soft);
      e2.mesh.visible = true;
      e2.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e2.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e2.mesh.quaternion.copy(cam.quaternion); e2.mesh.rotateZ(p.rot ?? 0); }
      e2.mesh.scale.set(p.w, p.h, 1);
      fused.push(e2);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e3 of fused) e3.bind();
    return focus;
  }
}
void mergeGeometries; void buildCrane; void TOWER_C; void TOWER_S; void stoneHD; void Pen; void smokeTex; void sunDiscTex;

const WATER_DECL = `#include <common>
varying vec3 vWP;
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;`;
const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(0.35 * wTime, 0.0);
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;

function quadUp(x0: number, x1: number, z0: number, z1: number, u: number, v: number, dy = 0) {
  const y = D0 + dy, g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}
function wallQuad(x0: number, x1: number, z: number, dir: number) {
  const g = new THREE.BufferGeometry(), y0 = -0.6, y1 = D0;
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y0, z, x1, y0, z, x1, y1, z, x0, y0, z, x1, y1, z, x0, y1, z], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(Array(6).fill([0, 0, dir]).flat(), 3));
  const u = Math.abs(x1 - x0) / 4, v = (y1 - y0) / 4;
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}
