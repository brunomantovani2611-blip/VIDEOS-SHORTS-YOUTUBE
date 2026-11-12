// El mundo de Sam, el gato insumergible, como una sola escena three.js: el mar abierto, tierra firme con una casita,
// el plató azul, la utilería 3D (barcos, tabla, bote, periscopio, torpedo) y el elenco (cast.ts).
// update(id, f, cam) coloca la toma id en el cuadro f.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Batch, boxGeo, V, lam, Kit, quad, tri } from "./build";
import { rep, ctex, stoneHD, grassHD, waterNear, waterFar, cloudHD, planksHD } from "./paint";
import { Pen } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, LFB, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import { Figura, buildProp, animProp } from "./figura3d";
/** personajes como muñecos 3D (true) o como tarjetas dibujadas (false) */
export const FIG3D = true;
import { FPS, D0, SHOTS, camAt, V3, ShotDef, BACK_Z, Decoy, decoysAt, RIO_Z0, RIO_Z1, TZ, CALLE, CUARTO_X, OFICINA_X, PLATO_X, MESA_Z, RZ } from "./story";

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

type DecoyMesh = { grp: THREE.Group; kind: Decoy["kind"] };
const makeProp = (R: THREE.Object3D, kind: Decoy["kind"]): DecoyMesh => { const grp = buildProp(kind); grp.visible = false; R.add(grp); return { grp, kind }; };
// ---------------- decorados ----------------
const azulejoTex = () => ctex("azulejoCocina", 256, 256, (g) => {
  g.fillStyle = "#cfe8d8"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#f4f1ea"; g.lineWidth = 8;
  for (let k = 0; k <= 256; k += 64) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 256); g.moveTo(0, k); g.lineTo(256, k); g.stroke(); }
});
const ajedrezTex = () => ctex("pisoAjedrez", 256, 256, (g) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? "#2a2730" : "#f4f1ea"; g.fillRect(x * 64, y * 64, 64, 64); }
});
const ventanaTex = () => ctex("ventanaCocina", 256, 256, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#5aa8e8"); gr.addColorStop(1, "#cfe8f7");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#7ac46a"; g.beginPath(); g.arc(70, 260, 90, 0, 7); g.arc(200, 270, 80, 0, 7); g.fill();
  g.strokeStyle = "#f4f1ea"; g.lineWidth = 16; g.strokeRect(8, 8, 240, 240); g.lineWidth = 10;
  g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke();
  g.fillStyle = "#e86a6a"; for (let x = 0; x < 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 32, 0); g.lineTo(x + 16, 40); g.fill(); }
});
const centralTex = () => ctex("centralPanel", 512, 512, (g, r) => {
  g.fillStyle = "#3a3e4a"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) { g.fillStyle = "#2a2d36"; g.fillRect(0, y + 58, 512, 6); }
  for (let y = 18; y < 512; y += 32) for (let x = 16; x < 512; x += 32) {
    const v = r(); g.fillStyle = v < 0.12 ? "#ffd34d" : v < 0.2 ? "#5aff8a" : v < 0.25 ? "#ff6a5a" : "#1e1e24";
    g.beginPath(); g.arc(x, y, v < 0.25 ? 7 : 5, 0, 7); g.fill();
  }
  g.lineWidth = 6;
  for (let k = 0; k < 7; k++) {
    g.strokeStyle = ["#d43f3f", "#ffd34d", "#3f7ac9", "#f4f1ea"][k % 4];
    const x0 = 30 + r() * 450, x1 = 30 + r() * 450, y0 = 30 + r() * 200, y1 = 250 + r() * 230;
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + 80, x1, y1); g.stroke();
  }
});
const tallerTex = () => ctex("tallerPared", 512, 512, (g) => {
  g.fillStyle = "#d9c8a8"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#6a4a30"; g.fillRect(0, 320, 512, 192);
  g.strokeStyle = "#4a3020"; g.lineWidth = 6; for (let x = 0; x < 512; x += 64) { g.beginPath(); g.moveTo(x, 320); g.lineTo(x, 512); g.stroke(); }
  // pósteres
  g.fillStyle = "#3f7ac9"; g.fillRect(40, 60, 120, 170); g.fillStyle = "#ffd34d"; g.beginPath(); g.arc(100, 140, 36, 0, 7); g.fill();
  g.fillStyle = "#d43f3f"; g.fillRect(330, 80, 130, 150); g.strokeStyle = "#f4f1ea"; g.lineWidth = 8;
  g.beginPath(); for (let i = 0; i <= 20; i++) { const x = 340 + i * 5.5, y = 155 + 30 * Math.sin(i * 0.9); if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
});
const garajeTex = () => ctex("garajePuerta", 512, 512, (g) => {
  g.fillStyle = "#c9c0b0"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#e8e0cc"; g.fillRect(96, 90, 320, 422);
  for (let y = 110; y < 512; y += 46) { g.fillStyle = "#b8ae98"; g.fillRect(96, y, 320, 8); }
  g.fillStyle = "#8a8070"; g.fillRect(240, 470, 32, 12);
  // tablero de herramientas
  g.fillStyle = "#a8835a"; g.fillRect(430, 120, 82, 200); g.fillRect(0, 120, 82, 200);
  g.fillStyle = "#6a5a4a"; for (let y = 130; y < 320; y += 16) for (let x = 6; x < 512; x += 16) if (x < 82 || x > 430) { g.beginPath(); g.arc(x, y, 2.5, 0, 7); g.fill(); }
  g.fillStyle = "#2a2730"; g.fillRect(450, 150, 10, 70); g.fillRect(440, 150, 30, 14); g.fillRect(20, 160, 50, 12); g.fillRect(40, 200, 8, 80);
});

const calle = (b: Batch, cx: number, cz: number, pal: [string, string][], roof: string) => {
  b.add(quadUpAt(cx - 30, cx + 30, cz - 5, cz + 4, D0 - 0.01, 12, 3), lam("calle" + cx, () => ({ color: "#c9c0b0" })));
  for (let i = 0; i < 9; i++) {
    const x0 = cx - 18 + i * 4.2, h = 3.6 + (i % 3) * 0.9, [wc, sc] = pal[i % pal.length], key = `fach${cx}_${i % pal.length}`;
    b.add(boxGeo(V(x0, D0, cz - 9), V(x0 + 4.1, D0 + h, cz - 5)), lam("side" + key, () => ({ color: wc })));
    b.add(wallZ(x0 + 0.02, x0 + 4.08, D0, D0 + h, cz - 4.99), lam(key, () => ({ map: fachadaTex(key, wc, sc) })));
    b.add(prism(x0 + 2.05, cz - 9.2, cz - 4.8, 2.25, 1.0, D0 + h), lam("tejado" + roof, () => ({ color: roof })));
    b.add(boxGeo(V(x0 + 1.6, D0, cz - 5.02), V(x0 + 2.5, D0 + 2.0, cz - 4.96)), lam("puerta" + (i % 2), () => ({ color: i % 2 ? "#5a3a2a" : "#3f5a6a" })));
  }
  // cipreses
  for (const x of [cx - 8.5, cx - 3.2, cx + 3.4, cx + 9]) {
    b.add(cyl(0.12, 1.2, 8), lam("cipresTronco", () => ({ color: "#6a4a2a" })), at(x, D0 + 0.6, cz - 3.4));
    b.add(new THREE.ConeGeometry(0.7, 5.5, 12), lam("cipres", () => ({ color: "#2f5a3a" })), at(x, D0 + 3.6, cz - 3.4));
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
const wallPic = (o: Batch, x0: number, x1: number, y0: number, y1: number, m: THREE.Material) =>
  o.add(quad(V(x1, y0, BACK_Z - 0.02), V(x0, y0, BACK_Z - 0.02), V(x0, y1, BACK_Z - 0.02), V(x1, y1, BACK_Z - 0.02)), m);

/** ¿hay trono en el salón? (sólo en el corto de Arquímedes) */
export const TRONO = false;
const meandro = (g: CanvasRenderingContext2D, y: number, col: string) => {
  g.fillStyle = col; g.fillRect(0, y, 512, 36);
  g.strokeStyle = "#f8f4ea"; g.lineWidth = 5;
  for (let x = 0; x < 512; x += 36) { g.beginPath(); g.moveTo(x + 4, y + 30); g.lineTo(x + 4, y + 6); g.lineTo(x + 28, y + 6); g.lineTo(x + 28, y + 22); g.lineTo(x + 14, y + 22); g.lineTo(x + 14, y + 14); g.stroke(); }
};
/** salón griego: mármol blanco, columnas y una guarda de meandro azul */
const palacioTex = () => ctex("salonGriego", 512, 512, (g) => {
  g.fillStyle = "#f2ede2"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(160,150,130,.2)"; g.lineWidth = 3;
  for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(k * 70, 0); g.bezierCurveTo(k * 70 + 40, 150, k * 70 - 30, 300, k * 70 + 20, 512); g.stroke(); }
  for (const x of [40, 400]) {
    g.fillStyle = "#fbf8f0"; g.fillRect(x, 60, 72, 452);
    g.fillStyle = "#ddd5c4"; for (let k = 1; k < 5; k++) g.fillRect(x + k * 14, 80, 4, 410);
    g.fillStyle = "#e6dcc8"; g.fillRect(x - 12, 52, 96, 22); g.fillRect(x - 12, 490, 96, 22);
  }
  meandro(g, 0, "#2f6ab8");
});
/** patio de azulejos celestes (el baño de Arquímedes, la casa) */
const muroTex = () => ctex("azulejoGriego", 512, 512, (g) => {
  g.fillStyle = "#cfe6f2"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#f8f4ea"; g.lineWidth = 6;
  for (let k = 0; k <= 512; k += 64) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 512); g.moveTo(0, k); g.lineTo(512, k); g.stroke(); }
  meandro(g, 300, "#2f6ab8");
});
const pisoMarmolTex = () => ctex("pisoGriego", 256, 256, (g) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? "#9ab8d8" : "#f2ede2"; g.fillRect(x * 64, y * 64, 64, 64); }
});
const platoTex = () => ctex("platoAzul", 512, 512, (g) => {
  g.fillStyle = "#1e3a6a"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#2a4a80"; for (let y = 16; y < 512; y += 32) for (let x = 16; x < 512; x += 32) { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); }
});

// ---------------- la pradera de Prusia, 1807 ----------------
const pastoTex = () => ctex("pastoSuelo", 512, 512, (g, r) => {
  g.fillStyle = "#7fb04e"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? "rgba(70,120,40,.18)" : "rgba(170,210,110,.2)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 10 + r() * 30, 6 + r() * 16, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 1400; i++) { g.fillStyle = r() < 0.5 ? "rgba(60,110,35,.35)" : "rgba(190,230,130,.35)"; g.fillRect(r() * 512, r() * 512, 2, 5 + r() * 6); }
  for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? "#fbf7ee" : "#f6d84a"; g.beginPath(); g.arc(r() * 512, r() * 512, 3, 0, 7); g.fill(); }
});
const tierraTex = () => ctex("tierraCamino", 512, 512, (g, r) => {
  g.fillStyle = "#b8925e"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "rgba(120,90,55,.3)" : "rgba(220,190,140,.3)"; g.beginPath(); g.arc(r() * 512, r() * 512, 1.5 + r() * 4, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(110,80,50,.35)"; g.lineWidth = 10;
  for (const y of [150, 360]) { g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x / 40) * 6); g.stroke(); }
});
const lonaTex = () => ctex("lonaCarpa", 256, 256, (g) => {
  g.fillStyle = "#f2ead8"; g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 32) { g.fillStyle = "rgba(170,150,120,.25)"; g.fillRect(x, 0, 4, 256); }
});
const banderaTex = () => ctex("banderaFR", 256, 170, (g) => {
  for (const [i, c] of ["#2f4a9a", "#fbf7ee", "#d8323a"].entries()) { g.fillStyle = c; g.fillRect(i * 86, 0, 86, 170); }
});
/** matas de pasto con florcitas sobre fondo transparente (lienzo 512 x 384) */
const matasTex = (k: number) => ctex("matas" + k, 512, 384, (g, r) => {
  g.clearRect(0, 0, 512, 384);
  const cols = [["#6aa040", "#4e8a30", "#8cc05a"], ["#5e9838", "#468028", "#80b850"], ["#76aa48", "#5a9036", "#98c868"]][k];
  for (let i = 0; i < 60; i++) {
    const x0 = 20 + r() * 472, top = 120 + r() * 200, lean = (r() - 0.5) * 90;
    g.strokeStyle = cols[i % 3]; g.lineWidth = 9 + r() * 5; g.lineCap = "round";
    g.beginPath(); g.moveTo(x0, 384); g.quadraticCurveTo(x0 + lean * 0.2, (384 + top) / 2, x0 + lean, top); g.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const x = 40 + r() * 432, y = 150 + r() * 120, c = ["#fbf7ee", "#f6d84a", "#e88ab0"][i % 3];
    g.fillStyle = c; for (let j = 0; j < 5; j++) { const a = (j / 5) * 6.28; g.beginPath(); g.arc(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 8, 0, 7); g.fill(); }
    g.fillStyle = "#e8a83a"; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill();
  }
});
/** tierra firme (z < -200): una casita blanca de techo rojo con un almohadón en la puerta, pasto con flores, cerca y árboles */
const campo = (b: Batch, wb: Batch, cx: number) => {
  const tz = TZ;
  let seed = 7; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const card = new THREE.PlaneGeometry(1, 1); card.translate(0, 0.5, 0);
  const mats = [0, 1, 2].map((k) => lam("pastoCard" + k, () => ({ map: matasTex(k), alphaTest: 0.45, side: THREE.DoubleSide })));
  const mata = (x: number, z: number, big = 1) => {
    const h = (0.28 + r() * 0.16) * big, w = 0.7 * big, m = mats[Math.floor(r() * 3)], a = r() * 3.14;
    wb.add(card, m, at(x, D0 - 0.02, z, 0, a, 0, [w, h, 1]));
    wb.add(card, m, at(x, D0 - 0.02, z, 0, a + Math.PI / 2, 0, [w, h, 1]));
  };
  for (let z = tz + 1.5; z > tz - 40; z -= 0.9) for (let x = cx - 25; x < cx + 25; x += 1.0) {
    if (Math.abs(x - cx) < 3.6 && z > tz - 9.5 && z < tz + 0.6) continue;
    if (Math.abs(x - cx) < 1.0 && z > tz - 0.2) continue;
    if (r() < 0.55) mata(x + (r() - 0.5) * 0.8, z + (r() - 0.5) * 0.6, 1);
  }
  // la casita
  const pared = lam("casaBlanca", () => ({ color: "#f4efe2" })), techo = lam("tejas", () => ({ color: "#b8463a" })), madera = lam("maderaPuerta", () => ({ color: "#5a6a8a" }));
  const hz = tz - 5.2;
  b.add(boxGeo(V(cx - 3.2, D0, hz - 4), V(cx + 3.2, D0 + 2.8, hz)), pared);
  b.add(prism(cx, hz - 4.4, hz + 0.45, 3.6, 1.9, D0 + 2.8), techo);
  b.add(boxGeo(V(cx - 0.55, D0, hz), V(cx + 0.55, D0 + 1.95, hz + 0.06)), madera);
  b.add(cyl(0.05, 0.1, 8), lam("oro", () => ({ color: "#e8b84a" })), at(cx + 0.38, D0 + 1.0, hz + 0.1, Math.PI / 2));
  for (const sx of [-1, 1]) {
    b.add(boxGeo(V(cx + sx * 2.0 - 0.6, D0 + 1.0, hz), V(cx + sx * 2.0 + 0.6, D0 + 2.1, hz + 0.05)), lam("vidrio", () => ({ color: "#5a7aa8" })));
    b.add(boxGeo(V(cx + sx * 2.0 - 0.7, D0 + 0.95, hz + 0.05), V(cx + sx * 2.0 + 0.7, D0 + 1.02, hz + 0.18)), lam("alfeizar", () => ({ color: "#e8e2d2" })));
    for (const dx of [-0.75, 0.75]) b.add(boxGeo(V(cx + sx * 2.0 + dx - 0.12, D0 + 1.0, hz), V(cx + sx * 2.0 + dx + 0.12, D0 + 2.1, hz + 0.07)), lam("postigo", () => ({ color: "#3f7a5a" })));
    for (let k = 0; k < 5; k++) b.add(new THREE.SphereGeometry(0.13, 8, 6), lam(k % 2 ? "florR" : "florA", () => ({ color: k % 2 ? "#e8506a" : "#f6d84a" })), at(cx + sx * 2.0 - 0.5 + k * 0.25, D0 + 1.12, hz + 0.14));
  }
  b.add(cyl(0.18, 1.4, 10), lam("chimenea", () => ({ color: "#9a5a44" })), at(cx + 1.8, D0 + 4.4, hz - 2.4));
  // almohadón en la puerta y escalón
  b.add(boxGeo(V(cx - 0.9, D0, hz), V(cx + 0.9, D0 + 0.12, hz + 0.7)), lam("escalon", () => ({ color: "#b8b0a0" })));
  b.add(cyl(0.42, 0.12, 20), lam("almohadon", () => ({ color: "#c8323a" })), at(cx, D0 + 0.06, tz - 0.4));
  // cerca baja y árboles
  const palo = lam("cerca", () => ({ color: "#f4efe2" }));
  for (let x = cx - 9; x <= cx + 9; x += 0.6) if (Math.abs(x - cx) > 1.4) b.add(boxGeo(V(x - 0.04, D0, tz + 2.0), V(x + 0.04, D0 + 0.7, tz + 2.08)), palo);
  for (const y of [0.25, 0.55]) for (const sx of [-1, 1]) b.add(boxGeo(V(sx > 0 ? cx + 1.4 : cx - 9, D0 + y, tz + 2.08), V(sx > 0 ? cx + 9 : cx - 1.4, D0 + y + 0.07, tz + 2.12)), palo);
  const tronco = lam("robleTronco", () => ({ color: "#6a4a32" })), copas = [lam("robleA", () => ({ color: "#4f8a3c" })), lam("robleB", () => ({ color: "#3f7a34" })), lam("robleC", () => ({ color: "#62a048" }))];
  for (let i = 0; i < 40; i++) {
    const x = cx - 50 + r() * 100, z = tz - 8 - r() * 40;
    if (Math.abs(x - cx) < 6 && z > tz - 16) continue;
    const h = 3 + r() * 2.5;
    b.add(cyl(0.3, h, 8), tronco, at(x, D0 + h / 2, z, 0, 0, (r() - 0.5) * 0.12));
    for (let k = 0; k < 5; k++) { const sz = 1.7 + r() * 1.3; b.add(new THREE.SphereGeometry(1, 12, 9), copas[k % 3], at(x + (r() - 0.5) * 3, D0 + h + 0.8 + (r() - 0.3) * 1.6, z + (r() - 0.5) * 2.4, 0, 0, 0, [sz, sz * 0.85, sz])); }
  }
};

const buildSets = (R: THREE.Object3D) => {
  const b = new Batch(), wb = new Batch();
  campo(b, wb, CALLE[0]);
  b.build(R); wb.build(R, false);
  void calle;

  const o = new Batch();
  const oro = lam("oro", () => ({ color: "#e8b84a" })), rojo = lam("rojoTrono", () => ({ color: "#2f6ab8" }));
  room(o, CUARTO_X, 8, 4.6, lam("salonGriego", () => ({ map: rep(palacioTex(), 2, 1) })), lam("pisoGriego", () => ({ map: rep(pisoMarmolTex(), 4, 4) })));
  if (TRONO) {
    o.add(boxGeo(V(CUARTO_X - 0.6, D0, BACK_Z - 0.9), V(CUARTO_X + 0.6, D0 + 0.25, BACK_Z - 0.2)), oro);
    o.add(boxGeo(V(CUARTO_X - 0.42, D0 + 0.25, BACK_Z - 0.75), V(CUARTO_X + 0.42, D0 + 0.62, BACK_Z - 0.3)), rojo);
    o.add(boxGeo(V(CUARTO_X - 0.45, D0 + 0.25, BACK_Z - 0.32), V(CUARTO_X + 0.45, D0 + 1.9, BACK_Z - 0.22)), oro);
    for (const sx of [-1, 1]) o.add(boxGeo(V(CUARTO_X + sx * 0.45 - 0.06, D0 + 0.25, BACK_Z - 0.75), V(CUARTO_X + sx * 0.45 + 0.06, D0 + 0.95, BACK_Z - 0.3)), oro);
  }
  room(o, OFICINA_X, 8, 4.6, lam("azulejoGriego", () => ({ map: rep(muroTex(), 2, 1) })), lam("pisoPiedra", () => ({ color: "#d9cfbc" })));
  room(o, PLATO_X, 8, 4, lam("platoAzul", () => ({ map: rep(platoTex(), 3, 1.5) })), lam("platoPiso", () => ({ color: "#14284a" })));
  o.build(R, false);
};

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private figs = new Map<string, Figura>();
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
    b.add(quadUp(-900, 900, -900, RIO_Z0, 450, 300, -0.04), lam("grassHD", () => ({ map: grassHD(), color: "#b4d47e" })));
    b.add(wallQuad(900, -900, RIO_Z0, 1), lam("quayWall", () => ({ map: stoneHD("quayWall", ["#b4aea2", "#aaa498", "#bfb9ad", "#a39d91"], "#8a8478") })));
    b.build(R);
    buildSets(R);

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
    const wm = new THREE.Mesh(quadUp(-900, 900, RIO_Z0, RIO_Z1, 1, 1, -0.03), waterM);
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
    // ---- señuelos de goma de esta toma ----
    const list = decoysAt(id, f), used0 = new Set<DecoyMesh>();
    for (const d of list) {
      let m = this.decoys.find((x) => x.kind === d.kind && !used0.has(x));
      if (!m) { m = makeProp(this.root, d.kind); this.decoys.push(m); }
      used0.add(m);
      const sh = d.shake ? Math.sin(f * 2.7) * 0.012 : 0;
      m.grp.visible = true;
      m.grp.position.set(d.x + sh * 6, D0 + (d.y ?? 0), d.z);
      m.grp.rotation.order = "YXZ";
      m.grp.rotation.set((d.rx ?? 0) + (d.shake ? Math.sin(f * 3.1) * 0.02 : 0), d.yaw, d.rz ?? 0);
      m.grp.scale.setScalar(d.s ?? 1);
      animProp(m.grp, d.kind, d.open ?? 0, f, !!d.moving);
    }
    for (const m of this.decoys) if (!used0.has(m)) m.grp.visible = false;

    // ---- elenco + efectos ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, f, { pos: cam.position, right, sun: sunDir });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    const figUsed = new Set<Figura>(), figCount = new Map<string, number>();
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (FIG3D && p.fig) {
        const n = figCount.get(p.fig.okey) ?? 0; figCount.set(p.fig.okey, n + 1);
        const k2 = `${p.fig.okey}#${n}`;
        let fg = this.figs.get(k2);
        if (!fg) { fg = new Figura(p.fig.o, k2); this.figs.set(k2, fg); this.root.add(fg.root); }
        figUsed.add(fg);
        fg.root.visible = true;
        fg.root.position.set(p.x, p.y, p.z);
        const toCam = Math.atan2(cam.position.x - p.x, cam.position.z - p.z);
        const dirYaw = p.fig.dir !== undefined ? Math.atan2(p.fig.dir, 0) : toCam;
        fg.root.rotation.set(0, p.fig.yaw !== undefined ? p.fig.yaw : p.fig.dir !== undefined ? toCam + 0.55 * Math.sign(Math.sin(dirYaw - toCam)) : toCam + (p.fig.turn ?? 0), 0);
        fg.root.scale.setScalar(sc2);
        fg.update(p.fig);
        continue;
      }
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
    for (const fg of this.figs.values()) if (!figUsed.has(fg)) fg.root.visible = false;
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
