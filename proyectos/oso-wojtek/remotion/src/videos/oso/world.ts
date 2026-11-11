// El mundo del oso Wojtek como una sola escena three.js: cielo, la arena del campamento y de Irán con montañas, el muelle
// con el mar y el barco, Montecassino con la colina del monasterio, el zoo de Edimburgo, la estatua en un parque y la
// oficina de alistamiento (interior), más el elenco (cast.ts). update(id, f, cam) lo coloca todo para la toma id en el cuadro f.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Batch, boxGeo, V, lam, Kit, quad, tri } from "./build";
import { rep, ctex, stoneHD, grassHD, waterNear, waterFar, cloudHD, planksHD } from "./paint";
import { Pen } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, LFB, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import { fxEmblema } from "./efectos";
import { FPS, D0, SHOTS, camAt, V3, ShotDef, BACK_Z, DUCHA, CAMION, CAMINO, MUELLE_Z, CASCO_Z, CUBIERTA_Y, PASARELA, OFICINA_X, MESA_OF, CASSINO, COLINA, ZOO, ESTATUA, PEANA_H } from "./story";

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
const sandTex = () => ctex("sand", 512, 512, (g, r) => {
  g.fillStyle = "#e3c48c"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "rgba(200,160,100,.25)" : "rgba(250,230,190,.3)"; g.fillRect(r() * 512, r() * 512, 3 + r() * 6, 2 + r() * 3); }
  for (let i = 0; i < 6; i++) { g.strokeStyle = "rgba(190,150,90,.18)"; g.lineWidth = 6; g.beginPath(); g.moveTo(0, r() * 512); g.bezierCurveTo(170, r() * 512, 340, r() * 512, 512, r() * 512); g.stroke(); }
});
const dirtTex = () => ctex("dirt", 512, 512, (g, r) => {
  g.fillStyle = "#a8835a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? "rgba(120,90,60,.3)" : "rgba(200,170,130,.3)"; g.beginPath(); g.arc(r() * 512, r() * 512, 2 + r() * 5, 0, 7); g.fill(); }
});
const canvasTex = () => ctex("lona", 256, 256, (g) => {
  g.fillStyle = "#c2b07a"; g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 64) { g.fillStyle = "rgba(120,100,60,.18)"; g.fillRect(x, 0, 6, 256); }
});
const portholeTex = () => ctex("portholes", 512, 128, (g) => {
  g.fillStyle = "#5a6270"; g.fillRect(0, 0, 512, 128);
  for (let x = 32; x < 512; x += 64) { g.fillStyle = "#2a2e38"; g.beginPath(); g.arc(x, 44, 13, 0, 7); g.fill(); g.strokeStyle = "#c9ccd6"; g.lineWidth = 4; g.stroke(); }
  g.fillStyle = "#8a3a32"; g.fillRect(0, 100, 512, 28);
});
const poloniaTex = () => ctex("polonia", 256, 160, (g) => { g.fillStyle = "#f6f3ee"; g.fillRect(0, 0, 256, 80); g.fillStyle = "#d42a3c"; g.fillRect(0, 80, 256, 80); });
const emblemaTex = () => ctex("emblema", 520, 620, (g) => { fxEmblema(new Pen(g)); });
const placaTex = () => ctex("placa", 512, 160, (g) => {
  g.fillStyle = "#6a5030"; g.fillRect(0, 0, 512, 160); g.strokeStyle = "#c9a45a"; g.lineWidth = 10; g.strokeRect(8, 8, 496, 144);
  g.fillStyle = "#e8c47a"; g.font = '900 78px "DejaVu Sans", Arial, sans-serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("WOJTEK", 256, 84);
});

/** prisma triangular (tienda de campaña) con la cara triangular hacia +z: base en y0, ancho 2*hw, alto h, de z0 a z1 */
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

/** habitación abierta por delante y por arriba: suelo, pared del fondo en BACK_Z y dos laterales */
const room = (b: Batch, cx: number, w: number, h: number, wall: THREE.Material, floor: THREE.Material) => {
  const X0 = cx - w / 2, X1 = cx + w / 2, Z1 = BACK_Z, Z0 = BACK_Z - 10;
  b.add(boxGeo(V(X0 - 2, D0 - 0.2, Z0 - 2), V(X1 + 2, D0 + 0.015, Z1 + 2), 2), floor);
  for (const [a, c] of [[V(X0, D0, Z1), V(X1, D0 + h, Z1 + 0.3)], [V(X0 - 0.3, D0, Z0), V(X0, D0 + h, Z1)], [V(X1, D0, Z0), V(X1 + 0.3, D0 + h, Z1)]] as const) b.add(boxGeo(a, c, 0), wall);
};
const quadUpAt = (x0: number, x1: number, z0: number, z1: number, y: number, u = 1, v = 1) => quad(V(x1, y, z0), V(x0, y, z0), V(x0, y, z1), V(x1, y, z1), u, v);

// ---------------- decorados ----------------
const buildSets = (R: THREE.Object3D, flags: THREE.Mesh[]) => {
  const b = new Batch();
  const sand = lam("sand", () => ({ map: rep(sandTex(), 120, 138) }));
  const dirt = lam("dirt", () => ({ map: rep(dirtTex(), 8, 8) }));
  const lona = lam("lona", () => ({ map: rep(canvasTex(), 2, 2) }));
  const khakiTruck = lam("truckGreen", () => ({ color: "#6f7a4a" }));
  const dark = lam("darkTyre", () => ({ color: "#2a2730" }));
  const wood = lam("crateWood", () => ({ color: "#a87a44" }));
  const pole = lam("poleWood", () => ({ color: "#8a6a4a" }));
  const rock = lam("rockGrey", () => ({ color: "#a39e94" }));
  const mountain = lam("mountain", () => ({ color: "#c79a62" }));
  const mountain2 = lam("mountain2", () => ({ color: "#b48a58" }));

  // ---- arena del campamento y de Irán ----
  b.add(quadUpAt(-300, 300, -400, 288, D0 - 0.02, 120, 138), sand);
  for (let i = 0; i < 16; i++) {
    const x = -260 + i * 36 + ((i * 17) % 13), z = -290 - ((i * 37) % 80), r = 55 + ((i * 29) % 40), h = 30 + ((i * 41) % 40);
    b.add(new THREE.ConeGeometry(r, h, 7), i % 2 ? mountain : mountain2, at(x, D0 - 1 + h / 2, z, 0, i, 0));
  }
  // ---- campamento: tiendas, mástil, cajas, ducha, camión ----
  for (const [x, z] of [[-4.5, -10], [1.2, -11], [6.5, -10.5], [-10, -8], [12, -9], [-1.5, -18], [5, -19], [-8, -16]] as const) {
    b.add(prism(x, z - 4, z, 1.8, 2.3), lona);
    b.add(tri(V(x - 0.55, D0, z + 0.01), V(x + 0.55, D0, z + 0.01), V(x, D0 + 1.4, z + 0.01)), dark);
  }
  b.add(boxGeo(V(-6.55, D0, -7.05), V(-6.45, D0 + 4.6, -6.95)), pole);
  for (const [x, z, n] of [[2.8, -6.2, 3], [-6.4, -4.6, 2], [9, -6, 2]] as const) for (let k = 0; k < n; k++)
    b.add(boxGeo(V(x - 0.4 + k * 0.05, D0 + k * 0.42, z - 0.3), V(x + 0.4 + k * 0.05, D0 + 0.42 + k * 0.42, z + 0.3)), wood);
  // ducha: dos postes, travesaño, bidón, tubo y alcachofa, tarima
  const [dx, , dz] = DUCHA;
  for (const s of [-1, 1]) b.add(boxGeo(V(dx + s * 0.7 - 0.06, D0, dz - 0.56), V(dx + s * 0.7 + 0.06, D0 + 2.7, dz - 0.44)), pole);
  b.add(boxGeo(V(dx - 0.8, D0 + 2.6, dz - 0.58), V(dx + 0.8, D0 + 2.72, dz - 0.42)), pole);
  b.add(cyl(0.38, 0.8), lam("barrel", () => ({ color: "#5a6a4a" })), at(dx, D0 + 3.12, dz - 0.5));
  b.add(cyl(0.025, 0.4, 8), dark, at(dx, D0 + 2.45, dz - 0.4));
  b.add(new THREE.ConeGeometry(0.13, 0.12, 12), dark, at(dx, D0 + 2.22, dz - 0.35, Math.PI));
  b.add(boxGeo(V(dx - 0.6, D0, dz - 0.4), V(dx + 0.6, D0 + 0.08, dz + 0.5)), wood);
  // camión del ejército, de lado (la caja de carga mira a +z con el emblema)
  const [cx, , cz] = CAMION;
  b.add(boxGeo(V(cx - 3, D0 + 0.9, cz - 1.1), V(cx + 2, D0 + 3.1, cz + 1.1)), khakiTruck);
  b.add(boxGeo(V(cx + 2, D0 + 0.9, cz - 1.05), V(cx + 3.7, D0 + 2.6, cz + 1.05)), lam("truckCab", () => ({ color: "#5f6a3e" })));
  b.add(boxGeo(V(cx + 3.7, D0 + 0.9, cz - 0.95), V(cx + 4.6, D0 + 1.9, cz + 0.95)), lam("truckCab", () => ({ color: "#5f6a3e" })));
  b.add(quad(V(cx + 2.2, D0 + 1.75, cz + 1.06), V(cx + 3.5, D0 + 1.75, cz + 1.06), V(cx + 3.5, D0 + 2.45, cz + 1.06), V(cx + 2.2, D0 + 2.45, cz + 1.06)), lam("glass", () => ({ color: "#9cc4dc" })));
  b.add(boxGeo(V(cx - 3, D0 + 0.6, cz - 1.1), V(cx + 4.6, D0 + 0.9, cz + 1.1)), dark);
  for (const wx of [cx - 2, cx + 0.5, cx + 3.6]) for (const s of [-1, 1]) b.add(cyl(0.52, 0.34), dark, at(wx, D0 + 0.52, cz + s * 1.0, Math.PI / 2));
  b.add(quad(V(cx - 1.35, D0 + 1.12, cz + 1.12), V(cx - 0.25, D0 + 1.12, cz + 1.12), V(cx - 0.25, D0 + 2.43, cz + 1.12), V(cx - 1.35, D0 + 2.43, cz + 1.12)),
    lam("emblema", () => ({ map: emblemaTex(), transparent: true, alphaTest: 0.5 })));
  // ---- camino de Irán: franja de tierra, piedras, matorrales ----
  b.add(quadUpAt(40, 120, CAMINO[2] - 1.2, CAMINO[2] + 1.0, D0 - 0.008, 8, 1), dirt);
  for (const [x, z, s] of [[77.6, -62.5, 0.5], [83.8, -63, 0.7], [78.2, -66, 0.9], [86, -61.8, 0.4], [74, -64, 0.8]] as const)
    b.add(new THREE.DodecahedronGeometry(s, 0), rock, at(x, D0 + s * 0.3, z, 0.3, x, 0, [1.3, 0.7, 1]));
  for (const [x, z] of [[79, -63.2], [82.6, -64.5], [85, -63.5]] as const) b.add(new THREE.SphereGeometry(0.35, 10, 8), lam("bush", () => ({ color: "#8a8a4a" })), at(x, D0 + 0.2, z, 0, 0, 0, [1.3, 0.7, 1]));

  // ---- muelle, mar y barco ----
  b.add(quadUpAt(-60, 60, 286, MUELLE_Z, D0 + 0.012, 30, 4), lam("concrete", () => ({ color: "#9a968c" })));
  b.add(boxGeo(V(-60, D0, MUELLE_Z - 0.3), V(60, D0 + 0.14, MUELLE_Z)), lam("cope", () => ({ color: "#d6d2c6" })));
  for (const x of [-6, 3, 9]) b.add(cyl(0.18, 0.4, 12), dark, at(x, D0 + 0.2, MUELLE_Z - 0.6));
  const hull = lam("hull", () => ({ map: rep(portholeTex(), 12, 1) }));
  const C0 = CASCO_Z, Dk = D0 + CUBIERTA_Y;
  b.add(quad(V(30, 0, C0), V(-30, 0, C0), V(-30, Dk, C0), V(30, Dk, C0), 12, 1), hull);
  b.add(boxGeo(V(-30, 0, C0 + 0.01), V(30, Dk, C0 + 12)), lam("hullSide", () => ({ color: "#5a6270" })));
  b.add(boxGeo(V(-30, Dk, C0), V(30, Dk + 0.9, C0 + 0.12)), lam("rail", () => ({ color: "#e8e6e0" })));
  b.add(boxGeo(V(-9, Dk, C0 + 4), V(9, Dk + 3.6, C0 + 11)), lam("super", () => ({ color: "#efece4" })));
  b.add(boxGeo(V(-4, Dk + 3.6, C0 + 5), V(4, Dk + 5.6, C0 + 10)), lam("super", () => ({ color: "#efece4" })));
  for (let x = -8; x <= 8; x += 1.6) b.add(quad(V(x + 0.3, Dk + 2.0, C0 + 3.99), V(x - 0.3, Dk + 2.0, C0 + 3.99), V(x - 0.3, Dk + 2.6, C0 + 3.99), V(x + 0.3, Dk + 2.6, C0 + 3.99)), lam("window", () => ({ color: "#3a4a5a" })));
  b.add(cyl(1.5, 4.5), lam("funnel", () => ({ color: "#c9a441" })), at(10.5, Dk + 5.6, C0 + 6));
  b.add(cyl(1.52, 1.0), dark, at(10.5, Dk + 7.4, C0 + 6));
  for (const x of [-20, 20]) b.add(boxGeo(V(x - 0.12, Dk, C0 + 5.9), V(x + 0.12, Dk + 12, C0 + 6.1)), lam("mast", () => ({ color: "#6a5a4a" })));
  // pasarela a lo largo del casco, de x = 5 (muelle) a x = 0 (cubierta)
  const [p0, p1] = PASARELA, gz0 = MUELLE_Z + 0.15, gz1 = C0 - 0.08;
  b.add(quad(V(p1, Dk, gz1), V(p0, D0 + 0.05, gz1), V(p0, D0 + 0.05, gz0), V(p1, Dk, gz0)), lam("gangway", () => ({ color: "#9a8a72", side: THREE.DoubleSide })));
  b.add(boxGeo(V(p0 - 0.02, D0, MUELLE_Z - 0.4), V(p0 + 1.0, D0 + 0.05, gz1)), lam("gangway", () => ({ color: "#9a8a72", side: THREE.DoubleSide })));
  for (let k = 0; k <= 5; k++) { const x = p0 + (p1 - p0) * (k / 5), y = D0 + 0.05 + (Dk - D0 - 0.05) * (k / 5); b.add(boxGeo(V(x - 0.03, y, gz0 - 0.03), V(x + 0.03, y + 0.95, gz0 + 0.03)), dark); }

  // ---- Montecassino: colinas, el monasterio en lo alto, camino, cajas, un cañón ----
  const hill = lam("hillGreen", () => ({ color: "#8aa456" })), hill2 = lam("hillGreen2", () => ({ color: "#7a9650" }));
  b.add(new THREE.SphereGeometry(1, 40, 20), hill, at(COLINA[0], COLINA[1], COLINA[2], 0, 0, 0, [130, 100, 110]));
  for (const [x, z, r, h] of [[-560, -420, 150, 70], [-260, -440, 140, 60], [-470, -560, 200, 110], [-330, -560, 160, 90]] as const)
    b.add(new THREE.SphereGeometry(1, 32, 16), hill2, at(x, D0 - h * 0.55, z, 0, 0, 0, [r, h, r * 0.8]));
  const white = lam("monastery", () => ({ color: "#ece6d6" })), roofR = lam("roofRed", () => ({ color: "#b8604a" }));
  const top = COLINA[1] + 100;
  b.add(boxGeo(V(-424, top - 6, -342), V(-376, top + 5, -320)), white);
  b.add(prism(-400, -342, -320, 24, 5, top + 5), roofR);
  b.add(boxGeo(V(-388, top + 5, -330), V(-382, top + 16, -324)), white);
  b.add(new THREE.ConeGeometry(4.5, 5, 4), roofR, at(-385, top + 18.5, -327, 0, Math.PI / 4));
  for (let i = 0; i < 9; i++) b.add(quad(V(-421 + i * 5.2, top - 2, -319.9), V(-419 + i * 5.2, top - 2, -319.9), V(-419 + i * 5.2, top + 1.5, -319.9), V(-421 + i * 5.2, top + 1.5, -319.9)), lam("window", () => ({ color: "#3a4a5a" })));
  const [kx, , kz] = CASSINO;
  b.add(quadUpAt(kx - 30, kx + 30, kz - 1.3, kz + 0.9, D0 - 0.015, 10, 1), dirt);
  for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++)
    b.add(boxGeo(V(kx - 3.6 + j * 0.62, D0, kz - 2.4 + k * 0.5), V(kx - 3.05 + j * 0.62, D0 + 0.4, kz - 2.0 + k * 0.5)), wood);
  for (let j = 0; j < 2; j++) b.add(boxGeo(V(kx - 3.4 + j * 0.62, D0 + 0.4, kz - 2.3), V(kx - 2.85 + j * 0.62, D0 + 0.8, kz - 1.9)), wood);
  // cañón: ruedas, escudo, tubo apuntando a la colina
  const gun = lam("gunGreen", () => ({ color: "#5a6a42" }));
  const gx = kx + 3.2, gz = kz - 3.2;
  for (const s of [-1, 1]) b.add(cyl(0.55, 0.2), dark, at(gx + s * 0.75, D0 + 0.55, gz, 0, 0, Math.PI / 2));
  b.add(boxGeo(V(gx - 0.7, D0 + 0.4, gz - 0.1), V(gx + 0.7, D0 + 1.4, gz + 0.05)), gun);
  b.add(cyl(0.11, 3.2, 12), gun, at(gx, D0 + 1.25, gz - 1.3, -1.25));
  b.add(boxGeo(V(gx - 0.12, D0, gz + 0.1), V(gx + 0.12, D0 + 0.6, gz + 2.0)), gun);
  for (let i = 0; i < 7; i++) b.add(new THREE.SphereGeometry(0.3, 10, 8), lam("sandbag", () => ({ color: "#c9b48a" })), at(gx - 1.8 + i * 0.6, D0 + 0.18, gz - 0.9, 0, 0, 0, [1.2, 0.6, 0.8]));
  for (const [x, z, s] of [[kx - 9, kz - 8, 1], [kx + 8, kz - 10, 1.3], [kx - 14, kz - 14, 1.2], [kx + 15, kz - 6, 0.9], [kx - 5, kz - 18, 1.1]] as const) {
    b.add(cyl(0.12 * s, 1.2 * s, 6), pole, at(x, D0 + 0.6 * s, z));
    b.add(new THREE.ConeGeometry(0.9 * s, 3.2 * s, 8), lam("cypress", () => ({ color: "#4f7a3a" })), at(x, D0 + 2.6 * s, z));
  }

  // ---- zoo de Edimburgo: muro de piedra, rocas, estanque, barandilla, árboles ----
  const [zx, , zz] = ZOO;
  const stoneM = lam("zooStone", () => ({ map: rep(stoneHD("zooStone", ["#b8b2a6", "#aaa498", "#c4beb2", "#a09a8e"], "#8a8478"), 3, 1) }));
  b.add(boxGeo(V(zx - 7, D0, zz - 6.5), V(zx + 7, D0 + 2.4, zz - 6.0), 2), stoneM);
  for (const s of [-1, 1]) b.add(boxGeo(V(zx + s * 7 - 0.25, D0, zz - 6.5), V(zx + s * 7 + 0.25, D0 + 2.4, zz + 1.4), 2), stoneM);
  b.add(quadUpAt(zx - 7, zx + 7, zz - 6, zz + 1.6, D0 - 0.01, 3, 2), dirt);
  for (const [x, z, s] of [[zx - 2.6, zz - 4.8, 1.1], [zx + 2.2, zz - 5.0, 1.4], [zx + 4.6, zz - 3.6, 0.9], [zx - 4.8, zz - 3.2, 1.0]] as const)
    b.add(new THREE.DodecahedronGeometry(s, 0), rock, at(x, D0 + s * 0.45, z, 0.4, x, 0.2, [1.4, 0.9, 1]));
  b.add(quadUpAt(zx + 1.2, zx + 4.4, zz - 2.6, zz - 0.8, D0 + 0.005, 1, 1), lam("pool", () => ({ color: "#5aa0c8" })));
  const rail = lam("railGreen", () => ({ color: "#2f4a3a" })), rz = zz + 1.7;
  for (const y of [0.55, 1.0]) b.add(boxGeo(V(zx - 7, D0 + y, rz - 0.03), V(zx + 7, D0 + y + 0.06, rz + 0.03)), rail);
  for (let x = zx - 7; x <= zx + 7.01; x += 0.7) b.add(boxGeo(V(x - 0.025, D0, rz - 0.025), V(x + 0.025, D0 + 1.06, rz + 0.025)), rail);
  b.add(quadUpAt(zx - 20, zx + 20, rz, zz + 12, D0 - 0.012, 10, 4), lam("gravel", () => ({ color: "#c9c0ac" })));
  for (const [x, z, s] of [[zx - 5, zz - 9, 1.2], [zx + 1, zz - 10, 1.5], [zx + 6, zz - 8.5, 1.1], [zx - 9, zz - 3, 1.3], [zx + 9.5, zz - 2, 1.2]] as const) {
    b.add(cyl(0.18 * s, 2 * s, 8), pole, at(x, D0 + s, z));
    b.add(new THREE.SphereGeometry(1.5 * s, 12, 10), lam("treeGreen", () => ({ color: "#5a8a46" })), at(x, D0 + 2.6 * s, z));
  }

  // ---- la estatua: plaza, peana con placa, setos, árboles ----
  const [sx, , sz] = ESTATUA;
  b.add(quadUpAt(sx - 5, sx + 5, sz - 5, sz + 7, D0 + 0.01, 5, 6), lam("paving", () => ({ color: "#cfc6b4" })));
  b.add(boxGeo(V(sx - 0.75, D0, sz - 0.6), V(sx + 0.75, D0 + PEANA_H, sz + 0.6)), lam("granite", () => ({ color: "#8e8e96" })));
  b.add(boxGeo(V(sx - 0.85, D0 + PEANA_H, sz - 0.7), V(sx + 0.85, D0 + PEANA_H + 0.08, sz + 0.7)), lam("granite2", () => ({ color: "#a2a2aa" })));
  b.add(quad(V(sx - 0.5, D0 + 0.35, sz + 0.61), V(sx + 0.5, D0 + 0.35, sz + 0.61), V(sx + 0.5, D0 + 0.66, sz + 0.61), V(sx - 0.5, D0 + 0.66, sz + 0.61)), lam("placa", () => ({ map: placaTex() })));
  for (const s of [-1, 1]) b.add(boxGeo(V(sx + s * 3.2 - 1.2, D0, sz - 1.5), V(sx + s * 3.2 + 1.2, D0 + 0.8, sz - 0.7)), lam("hedge", () => ({ color: "#4f7a3a" })));
  for (const [x, z, s] of [[sx - 4.5, sz - 4, 1.3], [sx + 4.2, sz - 4.5, 1.5], [sx - 1.5, sz - 7, 1.2], [sx + 1.8, sz - 8, 1.4]] as const) {
    b.add(cyl(0.2 * s, 2 * s, 8), pole, at(x, D0 + s, z));
    b.add(new THREE.SphereGeometry(1.6 * s, 12, 10), lam("treeGreen", () => ({ color: "#5a8a46" })), at(x, D0 + 2.7 * s, z));
  }
  b.build(R);

  // ---- interior: la oficina de alistamiento (sin sombras) ----
  const o = new Batch();
  room(o, OFICINA_X, 8, 3.2, lam("officeCanvas", () => ({ map: rep(canvasTex(), 4, 2) })), lam("officeFloor", () => ({ map: rep(planksHD(), 3, 3) })));
  const [mx, , mz] = MESA_OF, desk = lam("deskWood", () => ({ color: "#8a5e3a" }));
  o.add(boxGeo(V(mx - 0.7, D0 + 0.72, mz - 0.35), V(mx + 0.7, D0 + 0.77, mz + 0.35)), desk);
  for (const ex of [-0.65, 0.65]) for (const ez of [-0.3, 0.3]) o.add(boxGeo(V(mx + ex - 0.03, D0, mz + ez - 0.03), V(mx + ex + 0.03, D0 + 0.72, mz + ez + 0.03)), desk);
  o.add(boxGeo(V(mx - 0.68, D0 + 0.3, mz - 0.33), V(mx + 0.68, D0 + 0.72, mz - 0.3)), desk);
  o.add(quad(V(OFICINA_X - 2.1, D0 + 1.5, BACK_Z - 0.02), V(OFICINA_X - 0.9, D0 + 1.5, BACK_Z - 0.02), V(OFICINA_X - 0.9, D0 + 2.25, BACK_Z - 0.02), V(OFICINA_X - 2.1, D0 + 2.25, BACK_Z - 0.02)), lam("poloniaWall", () => ({ map: poloniaTex() })));
  o.add(boxGeo(V(mx - 0.25, D0 + 0.42, mz + 0.45), V(mx + 0.25, D0 + 0.48, mz + 0.85)), dark);
  o.add(boxGeo(V(mx - 0.23, D0 + 0.48, mz + 0.8), V(mx + 0.23, D0 + 1.15, mz + 0.86)), dark);
  o.add(cyl(0.12, 0.3), lam("lampGreen", () => ({ color: "#3f6a4a" })), at(mx + 0.45, D0 + 0.92, mz - 0.1));
  o.build(R, false);

  // bandera polaca en el mástil del campamento
  const flagM = lam("flagPl", () => ({ map: poloniaTex(), side: THREE.DoubleSide }));
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.95, 12, 1), flagM);
  fl.position.set(-6.5, D0 + 4.1, -7.0); fl.castShadow = true; fl.frustumCulled = false;
  flags.push(fl); R.add(fl);
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
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private flags: THREE.Mesh[] = [];
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
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
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
    b.add(quadUp(-900, 900, -900, MUELLE_Z, 450, 300, -0.04), lam("grassHD", () => ({ map: grassHD() })));
    b.add(wallQuad(900, -900, MUELLE_Z, 1), lam("quayWall", () => ({ map: stoneHD("quayWall", ["#b4aea2", "#aaa498", "#bfb9ad", "#a39d91"], "#8a8478") })));
    b.build(R);
    buildSets(R, this.flags);

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
    const wm = new THREE.Mesh(quadUp(-900, 900, MUELLE_Z, 1100, 1, 1, -D0), waterM);
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
    // bandera ondeando
    for (const fl of this.flags) {
      const p = fl.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const u = (i % 13) / 12, y = i < 13 ? 0.475 : -0.475;
        p.setXYZ(i, u * 1.5, y + 0.05 * u * Math.sin(t * 4 - u * 3), 0.2 * u * Math.sin(t * 5.5 - u * 5 + fl.position.x));
      }
      p.needsUpdate = true;
    }

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
