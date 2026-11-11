// El mundo de Garbo como una sola escena three.js (calles de Barcelona y Lisboa, cuatro despachos, el plató): cielo, campo francés con setos y álamos, los señuelos de
// goma (instancias que se inflan, se levantan y se mueven por toma), el camión de altavoces, la carretera, el pueblo, el Rin
// con la orilla alemana y cuatro interiores abiertos, más el elenco (cast.ts). update(id, f, cam) coloca la toma id en el cuadro f.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Batch, boxGeo, V, lam, Kit, quad, tri } from "./build";
import { rep, ctex, stoneHD, grassHD, waterNear, waterFar, cloudHD, planksHD } from "./paint";
import { Pen } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, LFB, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, D0, SHOTS, camAt, V3, ShotDef, BACK_Z, Decoy, decoysAt, RIO_Z0, RIO_Z1, BARCELONA, LISBOA, GB_X, DE_X, MESA_X, PLATO_X, MESA_Z, tranviaX } from "./story";
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

// ---------------- texturas ----------------
const dirtTex = () => ctex("dirt", 512, 512, (g, r) => {
  g.fillStyle = "#a8835a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? "rgba(120,90,60,.3)" : "rgba(200,170,130,.3)"; g.beginPath(); g.arc(r() * 512, r() * 512, 2 + r() * 5, 0, 7); g.fill(); }
});
const canvasTex = () => ctex("lona", 256, 256, (g) => {
  g.fillStyle = "#b8b48a"; g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 64) { g.fillStyle = "rgba(110,100,60,.18)"; g.fillRect(x, 0, 6, 256); }
});
const estrellaTex = () => ctex("estrellaUS", 256, 256, (g) => {
  g.fillStyle = "#f4f1ea"; g.beginPath(); g.arc(128, 128, 112, 0, 7); g.fill();
  g.fillStyle = "#5f6b3a"; g.beginPath(); g.arc(128, 128, 96, 0, 7); g.fill();
  g.fillStyle = "#f4f1ea"; g.beginPath();
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 36 : 92; g.lineTo(128 + r * Math.cos(a), 128 + r * Math.sin(a)); }
  g.fill();
});
const fachadaTex = (key: string, wall: string, shutter: string) => ctex(key, 512, 512, (g) => {
  g.fillStyle = wall; g.fillRect(0, 0, 512, 512);
  for (const [x, y] of [[90, 120], [330, 120], [90, 330], [330, 330]] as const) {
    g.fillStyle = "#3a4a5a"; g.fillRect(x, y, 90, 110);
    g.fillStyle = shutter; g.fillRect(x - 34, y, 30, 110); g.fillRect(x + 94, y, 30, 110);
    g.strokeStyle = "#f4f1ea"; g.lineWidth = 6; g.strokeRect(x, y, 90, 110);
  }
});
const carteleraTex = () => ctex("pizarraMapa", 512, 512, (g) => {
  g.fillStyle = "#6a8aa8"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#7a9ab8";
  for (let y = 0; y < 512; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x < 512; x += 64) { g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill(); }
});

/** prisma triangular con la cara triangular hacia +z: base en y0, ancho 2*hw, alto h, de z0 a z1 */
const prism = (x: number, z0: number, z1: number, hw: number, h: number, y0 = D0) => {
  const A = (z: number) => V(x - hw, y0, z), B = (z: number) => V(x + hw, y0, z), C = (z: number) => V(x, y0 + h, z);
  return mergeGeometries([
    quad(A(z1), C(z1), C(z0), A(z0)), quad(B(z0), C(z0), C(z1), B(z1)),
    tri(A(z1), B(z1), C(z1)), tri(B(z0), A(z0), C(z0)),
  ].map((g) => g.index ? g.toNonIndexed() : g), false);
};
const cyl = (r: number, h: number, n = 16) => new THREE.CylinderGeometry(r, r, h, n);
const at = (x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, s: [number, number, number] = [1, 1, 1]) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(...s));
const room = (b: Batch, cx: number, w: number, h: number, wall: THREE.Material, floor: THREE.Material) => {
  const X0 = cx - w / 2, X1 = cx + w / 2, Z1 = BACK_Z, Z0 = BACK_Z - 10;
  b.add(boxGeo(V(X0 - 2, D0 - 0.2, Z0 - 2), V(X1 + 2, D0 + 0.015, Z1 + 2), 2), floor);
  for (const [a, c] of [[V(X0, D0, Z1), V(X1, D0 + h, Z1 + 0.3)], [V(X0 - 0.3, D0, Z0), V(X0, D0 + h, Z1)], [V(X1, D0, Z0), V(X1 + 0.3, D0 + h, Z1)]] as const) b.add(boxGeo(a, c, 0), wall);
};
const quadUpAt = (x0: number, x1: number, z0: number, z1: number, y: number, u = 1, v = 1) => quad(V(x1, y, z0), V(x0, y, z0), V(x0, y, z1), V(x1, y, z1), u, v);
/** pared vertical que mira a +z (visible desde +z), de x0 a x1 */
const wallZ = (x0: number, x1: number, y0: number, y1: number, z: number, u = 1, v = 1) => quad(V(x0, y0, z), V(x1, y0, z), V(x1, y1, z), V(x0, y1, z), u, v);

// ---------------- señuelos: geometría unida de un tanque, un camión y un cañón de goma (origen en el suelo) ----------------
const RUBBER = "#5f6b3a";
const decoyGeo = (kind: "tanque" | "camion" | "canon") => {
  const parts: { g: THREE.BufferGeometry; m: THREE.Matrix4 }[] = [];
  const add = (g: THREE.BufferGeometry, m = new THREE.Matrix4()) => parts.push({ g: g.index ? g.toNonIndexed() : g, m });
  if (kind === "tanque") {
    add(new THREE.BoxGeometry(5.8, 1.0, 2.6), at(0, 1.0, 0, 0, 0, 0));
    for (const s of [-1, 1]) add(new THREE.CapsuleGeometry(0.55, 5.0, 6, 12), at(0, 0.55, s * 1.4, 0, 0, Math.PI / 2));
    add(new THREE.BoxGeometry(4.6, 0.6, 2.3), at(-0.3, 1.75, 0));
    add(new THREE.SphereGeometry(1.0, 20, 12), at(-0.4, 2.2, 0, 0, 0, 0, [1.15, 0.6, 1.0]));
    add(new THREE.CylinderGeometry(0.12, 0.14, 3.0, 10), at(1.6, 2.35, 0, 0, 0, Math.PI / 2));
  } else if (kind === "camion") {
    add(new THREE.BoxGeometry(4.2, 2.0, 2.3), at(-0.9, 2.0, 0));
    add(new THREE.BoxGeometry(1.6, 1.6, 2.2), at(2.1, 1.75, 0));
    add(new THREE.BoxGeometry(1.0, 1.0, 2.0), at(3.3, 1.45, 0));
    for (const x of [-2.2, 0.2, 2.6]) for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 14), at(x, 0.5, s * 1.1, Math.PI / 2));
  } else {
    for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.6, 0.6, 0.25, 16), at(0, 0.6, s * 0.75, Math.PI / 2));
    add(new THREE.BoxGeometry(0.3, 1.1, 1.4), at(0.3, 1.0, 0));
    add(new THREE.CylinderGeometry(0.13, 0.17, 3.2, 10), at(1.4, 1.5, 0, 0, 0, -Math.PI / 2 + 0.35));
    add(new THREE.BoxGeometry(2.4, 0.25, 0.3), at(-1.2, 0.35, 0, 0, 0, 0.12));
  }
  const geos = parts.map(({ g, m }) => {
    const x = new THREE.BufferGeometry();
    x.setAttribute("position", g.attributes.position.clone()); x.setAttribute("normal", g.attributes.normal.clone()); x.setAttribute("uv", g.attributes.uv.clone());
    x.applyMatrix4(m); return x;
  });
  return mergeGeometries(geos, false);
};
type DecoyMesh = { grp: THREE.Group; kind: Decoy["kind"] };
const makeDecoy = (R: THREE.Object3D, kind: Decoy["kind"], geos: Record<string, THREE.BufferGeometry>) => {
  const grp = new THREE.Group();
  const body = new THREE.Mesh(geos[kind], lam("rubber", () => ({ color: RUBBER })));
  body.castShadow = true; body.receiveShadow = true; grp.add(body);
  if (kind === "tanque") for (const s of [-1, 1]) {
    const star = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), lam("estrella", () => ({ map: estrellaTex(), transparent: true, alphaTest: 0.5 })));
    star.position.set(-0.3, 1.75, s * 1.16); star.rotation.y = s > 0 ? 0 : Math.PI; grp.add(star);
  }
  grp.visible = false; R.add(grp);
  return { grp, kind };
};

// ---------------- decorados ----------------
const azulejoTex = () => ctex("azulejo", 256, 256, (g) => {
  g.fillStyle = "#f4f1ea"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#2f5f9a"; g.lineWidth = 6;
  for (const [x, y] of [[0, 0], [128, 0], [0, 128], [128, 128]] as const) {
    g.strokeRect(x + 4, y + 4, 120, 120);
    g.beginPath(); g.arc(x + 64, y + 64, 30, 0, 7); g.stroke();
    g.fillStyle = "#2f5f9a"; for (const [dx, dy] of [[16, 16], [112, 16], [16, 112], [112, 112]]) { g.beginPath(); g.arc(x + dx, y + dy, 8, 0, 7); g.fill(); }
  }
});
const panelTex = () => ctex("panelGB", 512, 512, (g) => {
  g.fillStyle = "#e8dcc0"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#7a5034"; g.fillRect(0, 300, 512, 212);
  g.strokeStyle = "#5a3a24"; g.lineWidth = 8;
  for (let x = 16; x < 512; x += 128) g.strokeRect(x, 320, 96, 170);
  g.fillStyle = "#5a3a24"; g.fillRect(0, 292, 512, 14);
});
const ventanaLisboaTex = () => ctex("ventanaLisboa", 256, 320, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 320); gr.addColorStop(0, "#5aa8e8"); gr.addColorStop(1, "#cfe8f7");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 320);
  for (const [x, w, h, c] of [[0, 70, 150, "#f2c26a"], [60, 80, 190, "#e88a6a"], [130, 70, 130, "#f4f1ea"], [190, 70, 170, "#9fd0ea"]] as const) {
    g.fillStyle = c; g.fillRect(x, 320 - h, w, h); g.fillStyle = "#c6603a"; g.fillRect(x - 4, 320 - h - 14, w + 8, 14);
  }
  g.strokeStyle = "#f4f1ea"; g.lineWidth = 14; g.strokeRect(7, 7, 242, 306); g.lineWidth = 8; g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 320); g.moveTo(0, 160); g.lineTo(256, 160); g.stroke();
});
const ujTex = () => ctex("unionJack", 300, 180, (g) => FLAG.britania(g, 300, 180));
const retratoTex = () => ctex("retratoGB", 200, 260, (g) => {
  g.fillStyle = "#3a4a5a"; g.fillRect(0, 0, 200, 260);
  g.fillStyle = "#c9b48a"; g.beginPath(); g.ellipse(100, 110, 50, 62, 0, 0, 7); g.fill();
  g.fillStyle = "#2a2a30"; g.fillRect(40, 170, 120, 90);
  g.strokeStyle = "#c9a45a"; g.lineWidth = 16; g.strokeRect(8, 8, 184, 244);
});

const calle = (b: Batch, cx: number, cz: number, pal: [string, string][], roof: string, tiles = false) => {
  b.add(quadUpAt(cx - 30, cx + 30, cz - 5, cz + 4, D0 - 0.01, 12, 3), lam("calle" + cx, () => ({ color: tiles ? "#d9cfbc" : "#c9b48a" })));
  for (let i = 0; i < 9; i++) {
    const x0 = cx - 18 + i * 4.2, h = 6.4 + (i % 3) * 1.4, [wc, sc] = pal[i % pal.length], key = `fach${cx}_${i % pal.length}`;
    b.add(boxGeo(V(x0, D0, cz - 9), V(x0 + 4.1, D0 + h, cz - 5)), lam("side" + key, () => ({ color: wc })));
    b.add(wallZ(x0 + 0.02, x0 + 4.08, D0, D0 + h, cz - 4.99), lam(key, () => ({ map: fachadaTex(key, wc, sc) })));
    b.add(prism(x0 + 2.05, cz - 9.2, cz - 4.8, 2.25, 1.6, D0 + h), lam("tejado" + roof, () => ({ color: roof })));
    b.add(boxGeo(V(x0 + 1.6, D0, cz - 5.02), V(x0 + 2.5, D0 + 2.0, cz - 4.96)), lam("puerta" + (i % 2), () => ({ color: i % 2 ? "#5a3a2a" : "#3f5a6a" })));
    if (tiles && i % 2) b.add(wallZ(x0 + 0.02, x0 + 4.08, D0, D0 + 1.2, cz - 4.97, 4, 1.2), lam("azulejoCalle", () => ({ map: rep(azulejoTex(), 4, 1.2) })));
  }
  // farolas
  for (const x of [cx - 6, cx + 6]) {
    b.add(cyl(0.06, 3.2, 8), lam("farola", () => ({ color: "#2a2730" })), at(x, D0 + 1.6, cz - 3.6));
    b.add(new THREE.SphereGeometry(0.22, 12, 10), lam("farolaLuz", () => ({ color: "#f6e7b0" })), at(x, D0 + 3.3, cz - 3.6));
  }
};

const despacho = (o: Batch, cx: number, wall: THREE.Material, floor: THREE.Material, desk: THREE.Material) => {
  room(o, cx, 8, 4.6, wall, floor);
  o.add(boxGeo(V(cx - 0.8, D0 + 0.72, MESA_Z - 0.35), V(cx + 0.8, D0 + 0.78, MESA_Z + 0.35)), desk);
  o.add(boxGeo(V(cx - 0.78, D0, MESA_Z - 0.36), V(cx + 0.78, D0 + 0.72, MESA_Z - 0.3)), desk);
  for (const s of [-1, 1]) o.add(boxGeo(V(cx + s * 0.75 - 0.03, D0, MESA_Z + 0.25), V(cx + s * 0.75 + 0.03, D0 + 0.72, MESA_Z + 0.31)), desk);
  const dark = lam("chairDark", () => ({ color: "#3a2a24" }));
  o.add(boxGeo(V(cx - 0.25, D0 + 0.42, MESA_Z + 0.5), V(cx + 0.25, D0 + 0.48, MESA_Z + 0.9)), dark);
  o.add(boxGeo(V(cx - 0.23, D0 + 0.48, MESA_Z + 0.85), V(cx + 0.23, D0 + 1.25, MESA_Z + 0.91)), dark);
};

const buildSets = (R: THREE.Object3D) => {
  const b = new Batch();
  calle(b, BARCELONA[0], BARCELONA[2], [["#e8c99a", "#3f7a4a"], ["#d9a878", "#3f6a8a"], ["#f0dcb8", "#8a3a32"]], "#b8604a");
  calle(b, LISBOA[0], LISBOA[2], [["#f2c26a", "#3f6a8a"], ["#e88a8a", "#f4f1ea"], ["#9fd0ea", "#f4f1ea"], ["#f4f1ea", "#2f5f9a"]], "#c6603a", true);
  // raíles del tranvía
  for (const dz of [-0.55, 0.55]) b.add(boxGeo(V(LISBOA[0] - 30, D0 - 0.005, LISBOA[2] - 1.6 + dz - 0.03), V(LISBOA[0] + 30, D0 + 0.01, LISBOA[2] - 1.6 + dz + 0.03)), lam("rail", () => ({ color: "#8a8e96" })));
  b.build(R);

  const o = new Batch();
  const planks = lam("officeFloor", () => ({ map: rep(planksHD(), 3, 3) })), wood = lam("deskWood", () => ({ color: "#7a4e30" }));
  // oficina inglesa: madera y crema, retrato y bandera
  despacho(o, GB_X, lam("panelGB", () => ({ map: rep(panelTex(), 3, 1) })), planks, wood);
  o.add(quad(V(GB_X + 1.9, D0 + 1.5, BACK_Z - 0.02), V(GB_X + 1.1, D0 + 1.5, BACK_Z - 0.02), V(GB_X + 1.1, D0 + 2.55, BACK_Z - 0.02), V(GB_X + 1.9, D0 + 2.55, BACK_Z - 0.02)).applyMatrix4(new THREE.Matrix4()), lam("retratoGB", () => ({ map: retratoTex() })));
  o.add(quad(V(GB_X - 1.0, D0 + 1.7, BACK_Z - 0.02), V(GB_X - 2.2, D0 + 1.7, BACK_Z - 0.02), V(GB_X - 2.2, D0 + 2.42, BACK_Z - 0.02), V(GB_X - 1.0, D0 + 2.42, BACK_Z - 0.02)), lam("ujWall", () => ({ map: ujTex() })));
  // oficina alemana: gris, archivadores, sin símbolos
  despacho(o, DE_X, lam("wallDE", () => ({ color: "#8e9298" })), planks, lam("deskDE", () => ({ color: "#5a4a3e" })));
  for (const s of [-1, 1]) {
    o.add(boxGeo(V(DE_X + s * 2.1 - 0.4, D0, BACK_Z - 0.6), V(DE_X + s * 2.1 + 0.4, D0 + 1.9, BACK_Z)), lam("cabinetDE", () => ({ color: "#5f6670" })));
    for (let d = 0; d < 4; d++) o.add(boxGeo(V(DE_X + s * 2.1 - 0.1, D0 + 0.35 + d * 0.42, BACK_Z - 0.62), V(DE_X + s * 2.1 + 0.1, D0 + 0.4 + d * 0.42, BACK_Z - 0.6)), lam("darkTyre", () => ({ color: "#2a2730" })));
  }
  // el escritorio de Lisboa: azulejos, ventana, máquina de escribir
  despacho(o, MESA_X, lam("azulejoWall", () => ({ map: rep(azulejoTex(), 8, 4.6) })), planks, wood);
  o.add(quad(V(MESA_X - 0.9, D0 + 1.3, BACK_Z - 0.02), V(MESA_X - 2.1, D0 + 1.3, BACK_Z - 0.02), V(MESA_X - 2.1, D0 + 2.8, BACK_Z - 0.02), V(MESA_X - 0.9, D0 + 2.8, BACK_Z - 0.02)), lam("ventanaLisboa", () => ({ map: ventanaLisboaTex() })));
  o.add(boxGeo(V(MESA_X - 0.25, D0 + 0.78, MESA_Z - 0.25), V(MESA_X + 0.25, D0 + 0.92, MESA_Z + 0.1)), lam("typewriter", () => ({ color: "#2a2730" })));
  o.add(cyl(0.05, 0.56, 12), lam("typeRoll", () => ({ color: "#3a3a44" })), at(MESA_X, D0 + 0.98, MESA_Z + 0.08, 0, 0, Math.PI / 2));
  o.add(cyl(0.12, 0.3), lam("lampGreen", () => ({ color: "#3f6a4a" })), at(MESA_X + 0.6, D0 + 0.93, MESA_Z));
  // el plató: pared azul de lunares
  room(o, PLATO_X, 8, 4, lam("mapaWall", () => ({ map: rep(carteleraTex(), 3, 1.5) })), lam("mapaFloor", () => ({ color: "#3f5f7a" })));
  o.build(R, false);

  // el tranvía amarillo (se mueve)
  const tb = new Batch(), tram = new THREE.Group();
  const yellow = lam("tramYellow", () => ({ color: "#f2c230" })), white = lam("tramWhite", () => ({ color: "#f4f1ea" }));
  tb.add(boxGeo(V(-3.2, 0.35, -1.1), V(3.2, 1.3, 1.1)), yellow);
  tb.add(boxGeo(V(-3.2, 1.3, -1.1), V(3.2, 2.4, 1.1)), white);
  tb.add(boxGeo(V(-3.3, 2.4, -1.15), V(3.3, 2.6, 1.15)), lam("tramRoof", () => ({ color: "#8a8e96" })));
  for (let x = -2.7; x <= 2.7; x += 1.08) tb.add(wallZ(x - 0.38, x + 0.38, 1.45, 2.25, 1.105), lam("window", () => ({ color: "#3a4a5a" })));
  for (const x of [-2, 2]) for (const s of [-1, 1]) tb.add(cyl(0.35, 0.2), lam("darkTyre", () => ({ color: "#2a2730" })), at(x, 0.35, s * 0.55, Math.PI / 2));
  tb.add(cyl(0.03, 1.4, 6), lam("darkTyre", () => ({ color: "#2a2730" })), at(0, 3.2, 0, 0, 0, 0.5));
  tb.build(tram);
  tram.position.set(LISBOA[0], D0, LISBOA[2] - 1.6);
  R.add(tram);
  return tram;
};

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
  private cloudMaps: Record<"day" | "golden" | "night", THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private decoys: DecoyMesh[] = [];
  private tram!: THREE.Group;
  private decoyGeos: Record<string, THREE.BufferGeometry> = { tanque: decoyGeo("tanque"), camion: decoyGeo("camion"), canon: decoyGeo("canon") };
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(_kit: Kit) {
    const R = this.root;
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
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)), night: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.night.cloud)) };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- hierba en todo el mundo hasta el muelle, pared del muelle, fondo del mar ----
    const b = new Batch();
    b.add(quadUp(-900, 900, -900, RIO_Z0, 450, 300, -0.04), lam("grassHD", () => ({ map: grassHD() })));
    b.add(wallQuad(900, -900, RIO_Z0, 1), lam("quayWall", () => ({ map: stoneHD("quayWall", ["#b4aea2", "#aaa498", "#bfb9ad", "#a39d91"], "#8a8478") })));
    b.build(R);
    this.tram = buildSets(R);

    // ---- el mar ----
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
    waterM.customProgramCacheKey = () => "sea1";
    const wm = new THREE.Mesh(quadUp(-900, 900, RIO_Z0, RIO_Z1, 1, 1, -D0), waterM);
    wm.receiveShadow = true;
    R.add(wm);
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
    this.tram.position.x = id === 5 ? tranviaX(f) : LISBOA[0] + 40;
    // ---- señuelos de goma de esta toma ----
    const list = decoysAt(id, f), used0 = new Set<DecoyMesh>();
    for (const d of list) {
      let m = this.decoys.find((x) => x.kind === d.kind && !used0.has(x));
      if (!m) { m = makeDecoy(this.root, d.kind, this.decoyGeos); this.decoys.push(m); }
      used0.add(m);
      const k = d.inflate, sq = 1 + 0.25 * (1 - Math.min(1, k));
      m.grp.visible = true;
      m.grp.position.set(d.x, D0 + (d.lift ?? 0), d.z);
      m.grp.rotation.set(d.tilt ?? 0, d.yaw, 0);
      m.grp.scale.set(sq, Math.max(0.05, k), sq);
    }
    for (const m of this.decoys) if (!used0.has(m)) m.grp.visible = false;

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
