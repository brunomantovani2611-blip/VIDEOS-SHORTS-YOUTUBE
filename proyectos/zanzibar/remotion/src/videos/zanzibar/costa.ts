// La costa de Zanzíbar, 1896, como geometría estática: el paseo de arena frente al mar, el palacio del sultán (blanco,
// galerías de madera y almenas), la Casa de las Maravillas (galerías de columnas de hierro en tres pisos y la torre del
// reloj), el puente entre los dos, el consulado alemán, la Ciudad de Piedra detrás (casas encaladas de colores, puertas
// talladas, un alminar), palmeras, barricadas de cajones y barriles. También el salón del trono del palacio (600).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "./build";
import { ctex, rep } from "./paint";
import { D0, PAL, MAR, RELOJ, CONS, BACK_Z, CUARTO_X, TRONO_Z } from "./story";

const at = (x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, s: [number, number, number] = [1, 1, 1]) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(...s));
const cyl = (r: number, h: number, n = 14) => new THREE.CylinderGeometry(r, r, h, n);
/** pared vertical que mira a +z */
const wallZ = (x0: number, x1: number, y0: number, y1: number, z: number, u = 1, v = 1) => quad(V(x0, y0, z), V(x1, y0, z), V(x1, y1, z), V(x0, y1, z), u, v);
/** pared vertical que mira a +x o -x */
const wallX = (x: number, z0: number, z1: number, y0: number, y1: number, dir: 1 | -1) =>
  dir > 0 ? quad(V(x, y0, z1), V(x, y0, z0), V(x, y1, z0), V(x, y1, z1)) : quad(V(x, y0, z0), V(x, y0, z1), V(x, y1, z1), V(x, y1, z0));
const box = (b: Batch, m: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => b.add(boxGeo(V(x0, y0, z0), V(x1, y1, z1)), m);

// ---------------- texturas ----------------
const FONT = '"DejaVu Sans", Arial, sans-serif';
export const arenaTex = () => ctex("arenaZanzibar", 512, 512, (g, r) => {
  g.fillStyle = "#e2cfa2"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1600; i++) { g.fillStyle = r() < 0.5 ? "rgba(190,160,110,.28)" : "rgba(250,236,200,.35)"; g.beginPath(); g.arc(r() * 512, r() * 512, 1 + r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(170,140,95,.18)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 40, 6 + r() * 10, r() * 3, 0, 7); g.fill(); }
});
const paseoTex = () => ctex("paseoPiedra", 512, 512, (g, r) => {
  g.fillStyle = "#cbb894"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) for (let x = (y / 64) % 2 ? -48 : 0; x < 512; x += 96) {
    const c = 196 + Math.floor(r() * 30); g.fillStyle = `rgb(${c},${c - 16},${c - 48})`; g.fillRect(x + 3, y + 3, 90, 58);
  }
});
/** fachada del palacio: tres pisos de ventanas con arco y celosía verde; arcos en planta baja (lienzo 1024 x 704) */
const palacioTex = () => ctex("palacioFachada", 1024, 704, (g, r) => {
  g.fillStyle = "#f6f1e4"; g.fillRect(0, 0, 1024, 704);
  for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(200,185,150,.12)"; g.beginPath(); g.ellipse(r() * 1024, r() * 704, 30 + r() * 80, 10 + r() * 40, 0, 0, 7); g.fill(); }
  const cols = 8, cw = 1024 / cols;
  for (let fl = 0; fl < 3; fl++) for (let c = 0; c < cols; c++) {
    const x = c * cw + cw / 2, yb = 704 - fl * 234 - 24, h = fl === 0 ? 170 : 140, w = fl === 0 ? 74 : 56;
    g.fillStyle = fl === 0 ? "#3a2c26" : "#2e4a3e";
    g.beginPath(); g.moveTo(x - w / 2, yb); g.lineTo(x - w / 2, yb - h + w / 2); g.arc(x, yb - h + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w / 2, yb); g.closePath(); g.fill();
    g.strokeStyle = "#d8ccb0"; g.lineWidth = 8; g.stroke();
    if (fl) { g.strokeStyle = "rgba(160,200,170,.55)"; g.lineWidth = 3; for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(x - w / 2 + 4, yb - k * 26); g.lineTo(x + w / 2 - 4, yb - k * 26); g.stroke(); } }
  }
  g.fillStyle = "#e6dcc4"; for (const y of [228, 462]) g.fillRect(0, y, 1024, 12);
});
/** fachada del núcleo de la Casa de las Maravillas: puertas altas con arco (lienzo 1024 x 1024) */
const maravillasTex = () => ctex("maravillasFachada", 1024, 1024, (g) => {
  g.fillStyle = "#f8f4ea"; g.fillRect(0, 0, 1024, 1024);
  const cols = 7, cw = 1024 / cols;
  for (let fl = 0; fl < 3; fl++) for (let c = 0; c < cols; c++) {
    const x = c * cw + cw / 2, yb = 1024 - fl * 341 - 10, h = 250, w = 74;
    g.fillStyle = "#5a3a26"; g.beginPath(); g.moveTo(x - w / 2, yb); g.lineTo(x - w / 2, yb - h + w / 2); g.arc(x, yb - h + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w / 2, yb); g.closePath(); g.fill();
    g.strokeStyle = "#c9a24a"; g.lineWidth = 6; g.stroke();
    g.fillStyle = "#7a5432"; g.fillRect(x - 3, yb - h + 50, 6, h - 50);
    g.fillStyle = "#e8c45a"; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(x - 20, yb - 30 - k * 30, 4, 0, 7); g.arc(x + 20, yb - 30 - k * 30, 4, 0, 7); g.fill(); }
  }
});
/** la esfera del reloj: blanca con números romanos (lienzo 512 x 512) */
const esferaTex = () => ctex("esferaReloj", 512, 512, (g) => {
  g.clearRect(0, 0, 512, 512);
  g.fillStyle = "#c9a24a"; g.beginPath(); g.arc(256, 256, 254, 0, 7); g.fill();
  g.fillStyle = "#fbf8ee"; g.beginPath(); g.arc(256, 256, 226, 0, 7); g.fill();
  g.strokeStyle = "#2a1d24"; g.lineWidth = 6; g.beginPath(); g.arc(256, 256, 214, 0, 7); g.stroke();
  const R = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
  g.fillStyle = "#2a1d24"; g.textAlign = "center"; g.textBaseline = "middle";
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2 - Math.PI / 2;
    g.save(); g.translate(256 + Math.cos(a) * 170, 256 + Math.sin(a) * 170); g.rotate(a + Math.PI / 2);
    g.font = `900 ${k % 3 ? 40 : 50}px ${FONT}`; g.fillText(R[k], 0, 0); g.restore();
  }
  for (let k = 0; k < 60; k++) { const a = (k / 60) * Math.PI * 2; g.lineWidth = k % 5 ? 3 : 7; g.beginPath(); g.moveTo(256 + Math.cos(a) * 200, 256 + Math.sin(a) * 200); g.lineTo(256 + Math.cos(a) * 214, 256 + Math.sin(a) * 214); g.stroke(); }
});
/** casa de la Ciudad de Piedra: revoque de color, ventanas con celosía y la puerta tallada con tachas de bronce (512 x 512) */
const casaTex = (k: number) => ctex("casaZanzibar" + k, 512, 512, (g, r) => {
  const wall = ["#f4ecd8", "#ead8b4", "#f2e2c8", "#e2d4c0", "#f6efe0", "#dccab0"][k], sh = ["#3f7a6a", "#7a4a2a", "#3f5a8a", "#6a4a3a", "#2f6a5a", "#8a5a3a"][k];
  g.fillStyle = wall; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(150,130,100,.12)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 50, 6 + r() * 30, 0, 0, 7); g.fill(); }
  g.fillStyle = "rgba(120,100,80,.25)"; g.fillRect(0, 470, 512, 42);
  for (const [x, y] of [[96, 130], [256, 130], [416, 130], [96, 290], [416, 290]] as const) {
    g.fillStyle = "#2e2a2c"; g.fillRect(x - 34, y - 50, 68, 100);
    g.fillStyle = sh; g.fillRect(x - 34, y - 50, 68, 100);
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 3; for (let j = 1; j < 6; j++) { g.beginPath(); g.moveTo(x - 30, y - 50 + j * 17); g.lineTo(x + 30, y - 50 + j * 17); g.stroke(); }
    g.strokeStyle = "#fbf7ee"; g.lineWidth = 6; g.strokeRect(x - 34, y - 50, 68, 100);
  }
  // la puerta tallada
  g.fillStyle = "#5a3a22"; g.fillRect(206, 300, 100, 190);
  g.fillStyle = "#7a5432"; g.beginPath(); g.moveTo(196, 300); g.lineTo(316, 300); g.lineTo(316, 286); g.quadraticCurveTo(256, 236, 196, 286); g.closePath(); g.fill();
  g.strokeStyle = "#3a2414"; g.lineWidth = 4; g.beginPath(); g.moveTo(256, 300); g.lineTo(256, 490); g.stroke();
  g.fillStyle = "#e8c45a"; for (let j = 0; j < 5; j++) for (const x of [226, 286]) { g.beginPath(); g.arc(x, 330 + j * 34, 5, 0, 7); g.fill(); }
});
const consuladoTex = () => ctex("consuladoFachada", 512, 512, (g) => {
  g.fillStyle = "#efe2b8"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#d8c690"; g.fillRect(0, 240, 512, 14);
  for (const y of [70, 310]) for (let x = 40; x < 512; x += 96) { g.fillStyle = "#3a4a5a"; g.fillRect(x, y, 52, 110); g.strokeStyle = "#fbf7ee"; g.lineWidth = 6; g.strokeRect(x, y, 52, 110); g.fillStyle = "#4a6a4a"; g.fillRect(x - 16, y, 14, 110); g.fillRect(x + 54, y, 14, 110); }
  g.fillStyle = "#2a2730"; g.font = `900 34px ${FONT}`; g.textAlign = "center"; g.fillText("KAISERLICHES KONSULAT", 256, 470);
});
/** el salón del trono: muro crema con arcos de herradura, guarda de azulejos azules (lienzo 1024 x 512) */
const salonTex = () => ctex("salonTrono", 1024, 512, (g) => {
  g.fillStyle = "#f4ead4"; g.fillRect(0, 0, 1024, 512);
  for (let x = 0; x < 1024; x += 32) { g.fillStyle = (x / 32) % 2 ? "#2f6ab8" : "#f4f1ea"; g.fillRect(x, 400, 32, 32); g.fillStyle = (x / 32) % 2 ? "#e8c45a" : "#2f6ab8"; g.fillRect(x, 432, 32, 16); }
  g.fillStyle = "#8a3a2a"; g.fillRect(0, 448, 1024, 64);
  for (let c = 0; c < 4; c++) {
    const x = 128 + c * 256;
    g.fillStyle = "#e6d6b4"; g.beginPath(); g.moveTo(x - 82, 400); g.lineTo(x - 82, 180); g.arc(x, 180, 82, Math.PI, 0); g.lineTo(x + 82, 400); g.closePath(); g.fill();
    g.fillStyle = "#2f5a7a"; g.beginPath(); g.moveTo(x - 66, 400); g.lineTo(x - 66, 190); g.arc(x, 190, 66, Math.PI * 0.95, Math.PI * 0.05); g.lineTo(x + 66, 400); g.closePath(); g.fill();
    g.strokeStyle = "#c9a24a"; g.lineWidth = 8; g.stroke();
    g.strokeStyle = "rgba(244,234,212,.5)"; g.lineWidth = 4;
    for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(x + k * 24, 400); g.lineTo(x + k * 24, 170); g.stroke(); }
    for (let y = 220; y < 400; y += 30) { g.beginPath(); g.moveTo(x - 64, y); g.lineTo(x + 64, y); g.stroke(); }
  }
  g.fillStyle = "#c9a24a"; g.fillRect(0, 40, 1024, 10); g.fillRect(0, 60, 1024, 4);
});
const alfombraTex = () => ctex("alfombraTrono", 512, 512, (g) => {
  g.fillStyle = "#9a2a2a"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#e8c45a"; g.lineWidth = 14; g.strokeRect(30, 30, 452, 452);
  g.strokeStyle = "#1e3a6a"; g.lineWidth = 10; g.strokeRect(60, 60, 392, 392);
  g.fillStyle = "#e8c45a"; g.beginPath(); g.moveTo(256, 120); g.lineTo(392, 256); g.lineTo(256, 392); g.lineTo(120, 256); g.closePath(); g.fill();
  g.fillStyle = "#1e3a6a"; g.beginPath(); g.moveTo(256, 170); g.lineTo(342, 256); g.lineTo(256, 342); g.lineTo(170, 256); g.closePath(); g.fill();
  for (const [x, y] of [[110, 110], [402, 110], [110, 402], [402, 402]]) { g.fillStyle = "#e8c45a"; g.beginPath(); g.arc(x, y, 20, 0, 7); g.fill(); }
});

// ---------------- piezas ----------------
const M = (key: string, col: string) => lam(key, () => ({ color: col }));
/** palmera: tronco curvo en segmentos, penacho de hojas caídas y cocos */
const palmera = (b: Batch, x: number, z: number, h: number, lean: number, yaw: number) => {
  const tr = M("palmaTronco", "#9a7a54"), tr2 = M("palmaAnillo", "#7a5e3e"), hojas = [M("palmaHojaA", "#4f9a3c"), M("palmaHojaB", "#3f8434"), M("palmaHojaC", "#6ab04a")];
  let px = x, pz = z, py = D0;
  const n = 7, dx = Math.sin(yaw), dz = Math.cos(yaw);
  for (let k = 0; k < n; k++) {
    const u = (k + 0.5) / n, a = lean * u * 1.3, seg = h / n;
    const nx = px + dx * Math.sin(a) * seg, nz = pz + dz * Math.sin(a) * seg, ny = py + Math.cos(a) * seg;
    b.add(cyl(0.2 - 0.07 * u, seg * 1.08, 10), k % 2 ? tr : tr2, at((px + nx) / 2, (py + ny) / 2, (pz + nz) / 2, dz * a, 0, -dx * a));
    px = nx; pz = nz; py = ny;
  }
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + yaw, droop = 0.55 + (k % 3) * 0.18, L = 1.9 + (k % 2) * 0.4;
    b.add(new THREE.SphereGeometry(1, 10, 6), hojas[k % 3], at(px + Math.sin(a) * L * 0.55, py - droop * 0.5, pz + Math.cos(a) * L * 0.55, 0, a, 0, [0.28, 0.06, L * 0.6]).multiply(at(0, 0, 0, droop, 0, 0)));
  }
  for (let k = 0; k < 4; k++) b.add(new THREE.SphereGeometry(0.15, 8, 6), M("coco", "#6a5a2a"), at(px + Math.sin(k * 1.6) * 0.22, py - 0.25, pz + Math.cos(k * 1.6) * 0.22));
};
/** baranda de galería a lo largo de x */
const baranda = (b: Batch, m: THREE.Material, x0: number, x1: number, y: number, z: number) => {
  box(b, m, x0, y + 0.86, z - 0.05, x1, y + 0.94, z + 0.05);
  box(b, m, x0, y + 0.1, z - 0.04, x1, y + 0.16, z + 0.04);
  for (let x = x0 + 0.15; x < x1; x += 0.28) box(b, m, x - 0.025, y + 0.16, z - 0.025, x + 0.025, y + 0.86, z + 0.025);
};
const barandaZ = (b: Batch, m: THREE.Material, z0: number, z1: number, y: number, x: number) => {
  box(b, m, x - 0.05, y + 0.86, z0, x + 0.05, y + 0.94, z1);
  for (let z = z0 + 0.15; z < z1; z += 0.28) box(b, m, x - 0.025, y + 0.16, z - 0.025, x + 0.025, y + 0.86, z + 0.025);
};
/** almenas escalonadas sobre un borde a lo largo de x (o de z) */
const almenas = (b: Batch, m: THREE.Material, x0: number, x1: number, y: number, z: number, alongZ = false) => {
  const L = x1 - x0;
  box(b, m, alongZ ? z - 0.15 : x0, y, alongZ ? x0 : z - 0.15, alongZ ? z + 0.15 : x1, y + 0.35, alongZ ? x1 : z + 0.15);
  for (let s = 0.2; s < L; s += 0.75) {
    const a = x0 + s;
    if (alongZ) { box(b, m, z - 0.15, y + 0.35, a, z + 0.15, y + 0.7, a + 0.38); box(b, m, z - 0.1, y + 0.7, a + 0.09, z + 0.1, y + 0.85, a + 0.29); }
    else { box(b, m, a, y + 0.35, z - 0.15, a + 0.38, y + 0.7, z + 0.15); box(b, m, a + 0.09, y + 0.7, z - 0.1, a + 0.29, y + 0.85, z + 0.1); }
  }
};

// ---------------- la costa ----------------
export const costa = (b: Batch, wb: Batch) => {
  let seed = 11; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const blanco = M("calBlanca", "#f6f1e4"), blanco2 = M("calSombra", "#ebe3d0"), madera = M("galeriaVerde", "#3f6a54"), madera2 = M("maderaOscura", "#6a4a30");
  const hierro = M("hierroBlanco", "#e8e4dc"), gris = M("piedraGris", "#cfc4ae");
  // el paseo de piedra frente al agua
  b.add(quad(V(-220, D0 - 0.02, -200.0), V(80, D0 - 0.02, -200.0), V(80, D0 - 0.02, -206.0), V(-220, D0 - 0.02, -206.0), 75, 1.5), lam("paseoPiedra", () => ({ map: paseoTex() })));
  // escalinata al agua frente al palacio
  for (let k = 0; k < 4; k++) box(b, gris, PAL.x - 2.5, D0 - 0.6 - k * 0.2, -200 + k * 0.45, PAL.x + 2.5, D0 - 0.4 - k * 0.2, -199.55 + k * 0.45);

  // ---- el palacio ----
  const P = PAL, x0 = P.x - P.w / 2, x1 = P.x + P.w / 2, zf = P.z, zb = P.z - P.d;
  box(b, blanco2, x0, D0, zb, x1, D0 + P.h, zf - 0.02);
  b.add(wallZ(x0, x1, D0, D0 + P.h, zf, 1, 1), lam("palacioFachada", () => ({ map: palacioTex() })));
  for (const [y, h] of [[3.2, 3.2], [6.4, 3.2]] as [number, number][]) {
    // galería de madera verde: piso, columnas, baranda y alero
    box(b, madera2, x0 - 0.3, D0 + y - 0.18, zf, x1 + 0.3, D0 + y, zf + 1.5);
    for (let x = x0 - 0.2; x <= x1 + 0.25; x += 1.75) box(b, madera, x - 0.08, D0 + y, zf + 1.36, x + 0.08, D0 + y + h - 0.1, zf + 1.48);
    baranda(b, madera, x0 - 0.3, x1 + 0.3, D0 + y, zf + 1.42);
    for (let x = x0 - 0.2; x < x1; x += 1.75) for (let k = 0; k < 5; k++) box(b, madera, x + 0.08 + k * 0.33, D0 + y + h - 0.5, zf + 1.4, x + 0.2 + k * 0.33, D0 + y + h - 0.1, zf + 1.46);
  }
  box(b, madera2, x0 - 0.5, D0 + 9.5, zf - 0.2, x1 + 0.5, D0 + 9.66, zf + 1.7);
  box(b, madera, x0 - 0.5, D0 + 9.3, zf + 1.6, x1 + 0.5, D0 + 9.5, zf + 1.72);
  // planta baja: arcada blanca
  for (let x = x0 + 0.9; x < x1; x += 1.75) { box(b, blanco, x - 0.22, D0, zf + 0.0, x + 0.22, D0 + 2.6, zf + 0.35); }
  almenas(b, blanco, x0, x1, D0 + P.h, zb + 0.15); almenas(b, blanco, zb, zf, D0 + P.h, x0 + 0.15, true); almenas(b, blanco, zb, zf, D0 + P.h, x1 - 0.15, true);
  // el gran portón y su escalinata
  box(b, madera2, P.x - 0.9, D0, zf + 0.36, P.x + 0.9, D0 + 2.4, zf + 0.42);
  box(b, M("oroPuerta", "#e0b44a"), P.x - 1.05, D0 + 2.4, zf + 0.36, P.x + 1.05, D0 + 2.6, zf + 0.44);
  for (let k = 0; k < 3; k++) box(b, gris, P.x - 1.6 + k * 0.15, D0 - 0.02 + k * 0.0, zf + 0.42 + k * 0.0, P.x + 1.6 - k * 0.15, D0 + 0.08 + k * 0.1, zf + 1.2 - k * 0.25);

  // ---- el puente cubierto entre el palacio y la Casa de las Maravillas ----
  const mx0 = MAR.x - MAR.w / 2 - MAR.v;
  box(b, madera2, x1, D0 + 4.2, zf - 3.6, mx0, D0 + 4.4, zf - 1.8);
  box(b, madera, x1, D0 + 4.4, zf - 1.9, mx0, D0 + 5.3, zf - 1.8);
  box(b, madera, x1, D0 + 6.0, zf - 3.7, mx0, D0 + 6.15, zf - 1.7);

  // ---- la Casa de las Maravillas ----
  const W = MAR, cx0 = W.x - W.w / 2, cx1 = W.x + W.w / 2, czf = W.z, czb = W.z - W.d, v = W.v;
  box(b, blanco2, cx0, D0, czb, cx1, D0 + W.h, czf - 0.02);
  b.add(wallZ(cx0, cx1, D0, D0 + W.h, czf, 1, 1), lam("maravillasFachada", () => ({ map: maravillasTex() })));
  for (const x of [cx0, cx1]) b.add(wallX(x + (x === cx0 ? -0.01 : 0.01), czb, czf, D0, D0 + W.h, x === cx0 ? -1 : 1), lam("maravillasFachada", () => ({ map: maravillasTex() })));
  for (let fl = 0; fl < 3; fl++) {
    const y = D0 + fl * 3.5;
    // losas de las galerías (frente y costados)
    if (fl) {
      box(b, blanco, cx0 - v, y - 0.2, czf, cx1 + v, y, czf + v);
      for (const s of [-1, 1]) box(b, blanco, s < 0 ? cx0 - v : cx1, y - 0.2, czb, s < 0 ? cx0 : cx1 + v, y, czf);
      baranda(b, hierro, cx0 - v, cx1 + v, y, czf + v - 0.08);
      for (const s of [-1, 1]) barandaZ(b, hierro, czb, czf + v, y, s < 0 ? cx0 - v + 0.08 : cx1 + v - 0.08);
    }
    // columnas de hierro
    for (let x = cx0 - v + 0.12; x <= cx1 + v; x += (W.w + 2 * v - 0.24) / 8) {
      b.add(cyl(0.11, 3.5, 10), hierro, at(x, y + 1.75, czf + v - 0.12));
      b.add(cyl(0.2, 0.18, 10), hierro, at(x, y + 3.32, czf + v - 0.12));
    }
    for (const s of [-1, 1]) for (let z = czb + 0.6; z < czf + v; z += 2.2) b.add(cyl(0.11, 3.5, 10), hierro, at(s < 0 ? cx0 - v + 0.12 : cx1 + v - 0.12, y + 1.75, z));
  }
  box(b, blanco, cx0 - v - 0.2, D0 + W.h - 0.2, czb - 0.2, cx1 + v + 0.2, D0 + W.h + 0.1, czf + v + 0.2);
  almenas(b, blanco, cx0 - v - 0.2, cx1 + v + 0.2, D0 + W.h + 0.1, czf + v + 0.05);
  // la torre del reloj
  const tx0 = RELOJ[0] - 1.5, tx1 = RELOJ[0] + 1.5, tzf = RELOJ[2] + 1.0, tzb = tzf - 3.0, ty0 = D0 + W.h + 0.1;
  box(b, blanco, tx0, ty0, tzb, tx1, ty0 + 5.6, tzf);
  box(b, blanco2, tx0 - 0.15, ty0 + 1.4, tzb - 0.15, tx1 + 0.15, ty0 + 1.55, tzf + 0.15);
  box(b, blanco2, tx0 - 0.2, ty0 + 5.6, tzb - 0.2, tx1 + 0.2, ty0 + 5.8, tzf + 0.2);
  b.add(new THREE.CircleGeometry(1.32, 48), lam("esferaReloj", () => ({ map: esferaTex(), transparent: true, alphaTest: 0.5 })), at(RELOJ[0], RELOJ[1], tzf + 0.02));
  for (const s of [-1, 1]) b.add(new THREE.CircleGeometry(1.32, 48), lam("esferaReloj", () => ({ map: esferaTex(), transparent: true, alphaTest: 0.5 })), at(s < 0 ? tx0 - 0.02 : tx1 + 0.02, RELOJ[1], tzf - 1.5, 0, s * Math.PI / 2, 0));
  // linterna con arcos y cúpula
  const ly = ty0 + 5.8;
  for (const [x, z] of [[tx0 + 0.25, tzb + 0.25], [tx1 - 0.25, tzb + 0.25], [tx0 + 0.25, tzf - 0.25], [tx1 - 0.25, tzf - 0.25]]) box(b, blanco, x - 0.2, ly, z - 0.2, x + 0.2, ly + 1.6, z + 0.2);
  box(b, blanco2, tx0 - 0.1, ly + 1.6, tzb - 0.1, tx1 + 0.1, ly + 1.8, tzf + 0.1);
  b.add(new THREE.SphereGeometry(1.25, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), M("cupulaVerde", "#5a9a7a"), at(RELOJ[0], ly + 1.8, tzf - 1.5));
  b.add(cyl(0.05, 1.0, 6), M("oroPunta", "#e0b44a"), at(RELOJ[0], ly + 3.4, tzf - 1.5));
  b.add(new THREE.SphereGeometry(0.14, 10, 8), M("oroPunta", "#e0b44a"), at(RELOJ[0], ly + 3.0, tzf - 1.5));
  // la campana dentro de la linterna
  b.add(new THREE.CylinderGeometry(0.25, 0.5, 0.6, 14), M("bronceCampana", "#b8863a"), at(RELOJ[0], ly + 1.1, tzf - 1.5));

  // ---- el consulado alemán ----
  const C = CONS, kx0 = C.x - C.w / 2, kx1 = C.x + C.w / 2;
  box(b, M("consuladoLado", "#e2d4a8"), kx0, D0, C.z - 8, kx1, D0 + C.h, C.z - 0.02);
  b.add(wallZ(kx0, kx1, D0, D0 + C.h, C.z, 1, 1), lam("consuladoFachada", () => ({ map: consuladoTex() })));
  b.add(new THREE.ConeGeometry(C.w * 0.78, 2.2, 4, 1), M("tejaRoja", "#b8463a"), at(C.x, D0 + C.h + 1.1, C.z - 4, 0, Math.PI / 4, 0, [1, 1, 0.9]));
  box(b, M("consuladoLado", "#e2d4a8"), kx0 - 0.2, D0 + 3.4, C.z, kx1 + 0.2, D0 + 3.6, C.z + 1.5);
  for (let x = kx0; x <= kx1 + 0.01; x += C.w / 4) b.add(cyl(0.12, 3.4, 10), blanco, at(x, D0 + 1.7, C.z + 1.35));
  baranda(b, blanco, kx0 - 0.2, kx1 + 0.2, D0 + 3.6, C.z + 1.42);

  // ---- la Ciudad de Piedra ----
  const casas: [number, number, number, number, number][] = [];
  const libre = (x0: number, x1: number, zf: number, zb: number) => {
    const occ: [number, number, number, number][] = [[PAL.x - PAL.w / 2 - 1, PAL.x + PAL.w / 2 + 1, PAL.z + 2, PAL.z - PAL.d - 1], [MAR.x - MAR.w / 2 - MAR.v - 1, MAR.x + MAR.w / 2 + MAR.v + 1, MAR.z + MAR.v + 1, MAR.z - MAR.d - 1], [CONS.x - CONS.w / 2 - 1, CONS.x + CONS.w / 2 + 1, CONS.z + 2, CONS.z - 9]];
    return occ.every(([a, b2, f, k]) => x1 < a || x0 > b2 || zb > f || zf < k);
  };
  for (let row = 0; row < 7; row++) {
    const zf0 = -207 - row * 9.5;
    for (let x = -190; x < 60;) {
      const w = 5 + r() * 5, d = 6 + r() * 3, h = 5 + r() * 6 + (row > 1 ? 2 : 0), zf = zf0 - r() * 1.5;
      if (libre(x, x + w, zf, zf - d)) casas.push([x, zf, w, d, h]);
      x += w + 0.3 + r() * 1.2;
    }
  }
  for (const [i, [x, zf, w, d, h]] of casas.entries()) {
    const k = i % 6, wall = ["#f4ecd8", "#ead8b4", "#f2e2c8", "#e2d4c0", "#f6efe0", "#dccab0"][k];
    box(b, M("casaLado" + k, wall), x, D0, zf - d, x + w, D0 + h, zf - 0.02);
    b.add(wallZ(x, x + w, D0, D0 + h, zf, Math.max(1, Math.round(w / 5)), Math.max(1, Math.round(h / 5))), lam("casaZanzibar" + k, () => ({ map: casaTex(k) })));
    box(b, M("casaPretil" + k, wall), x - 0.05, D0 + h, zf - d, x + w + 0.05, D0 + h + 0.45, zf);
    if (i % 3 === 0) { // balcón de madera
      box(b, madera2, x + w * 0.2, D0 + h * 0.55, zf, x + w * 0.8, D0 + h * 0.55 + 0.12, zf + 0.9);
      baranda(b, madera2, x + w * 0.2, x + w * 0.8, D0 + h * 0.55, zf + 0.85);
      box(b, madera2, x + w * 0.2, D0 + h * 0.55 + 1.9, zf, x + w * 0.8, D0 + h * 0.55 + 2.0, zf + 1.0);
    }
    if (i % 5 === 2) box(b, M("toldo" + (i % 2), i % 2 ? "#c84a3a" : "#2f6ab8"), x + 0.3, D0 + 2.4, zf, x + w - 0.3, D0 + 2.5, zf + 1.3);
  }
  // alminar y una cúpula de mezquita
  for (const [x, z] of [[PX0 + 40, -238], [PX0 - 60, -246]] as [number, number][]) {
    b.add(cyl(1.0, 18, 16), blanco, at(x, D0 + 9, z));
    b.add(cyl(1.4, 0.4, 16), blanco2, at(x, D0 + 14, z));
    b.add(cyl(0.8, 3, 16), blanco, at(x, D0 + 19.5, z));
    b.add(new THREE.ConeGeometry(0.95, 2.2, 16), M("cupulaVerde", "#5a9a7a"), at(x, D0 + 22.1, z));
    b.add(new THREE.SphereGeometry(4, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), blanco, at(x + 7, D0 + 6, z - 2));
    box(b, blanco2, x + 2.5, D0, z - 6.5, x + 11.5, D0 + 6, z + 2.5);
  }
  // palmeras a lo largo del paseo y detrás de la ciudad
  for (let x = -200; x < 70; x += 5 + r() * 4) {
    const z = -205.2 - r() * 0.6;
    if (!libre(x - 1.2, x + 1.2, z + 1, z - 1)) continue;
    if (Math.abs(x - PAL.x) < 9) continue;
    palmera(b, x, z, 6 + r() * 3, 0.15 + r() * 0.25, (r() - 0.5) * 1.2 + Math.PI);
  }
  for (let i = 0; i < 70; i++) {
    const x = -220 + r() * 300, z = -270 - r() * 60;
    palmera(b, x, z, 8 + r() * 5, 0.1 + r() * 0.3, r() * 6.28);
  }
  // barricadas de Khalid en la playa: cajones, barriles y bolsas
  const cajon = M("cajon", "#a87a4a"), barril = M("barril", "#7a5432");
  for (let k = 0; k < 9; k++) {
    const x = PAL.x - 7.5 + k * 1.9 + r() * 0.3, z = -203.6 - r() * 0.4;
    if (k % 3 === 1) b.add(cyl(0.32, 0.85, 12), barril, at(x, D0 + 0.42, z));
    else box(b, cajon, x - 0.4, D0, z - 0.35, x + 0.4, D0 + 0.7, z + 0.35);
  }
  void wb;
};
const PX0 = -80;

/** el salón del trono del palacio (en CUARTO_X): muro de arcos, alfombra, trono dorado bajo dosel, lámparas */
export const salonTrono = (o: Batch) => {
  const cx = CUARTO_X, X0 = cx - 4, X1 = cx + 4, Z1 = BACK_Z, Z0 = BACK_Z - 10, h = 4.6;
  o.add(boxGeo(V(X0 - 2, D0 - 0.2, Z0 - 2), V(X1 + 2, D0 + 0.015, Z1 + 2), 2), lam("pisoSalon", () => ({ color: "#d8c8a8" })));
  const muro = lam("salonTrono", () => ({ map: rep(salonTex(), 1, 1) }));
  o.add(quad(V(X1, D0, Z1 - 0.01), V(X0, D0, Z1 - 0.01), V(X0, D0 + h, Z1 - 0.01), V(X1, D0 + h, Z1 - 0.01), 1, 1), muro);
  for (const [x, d] of [[X0, 1], [X1, -1]] as [number, number][]) o.add(wallX(x, Z0, Z1, D0, D0 + h, d as 1 | -1), muro);
  // alfombra
  o.add(quad(V(cx + 1.6, D0 + 0.02, Z1 - 0.4), V(cx - 1.6, D0 + 0.02, Z1 - 0.4), V(cx - 1.6, D0 + 0.02, Z1 - 7), V(cx + 1.6, D0 + 0.02, Z1 - 7)), lam("alfombraTrono", () => ({ map: alfombraTex() })));
  // tarima, trono y dosel (el frente del trono mira a -z, hacia la cámara)
  const oro = M("oroTrono", "#e0b44a"), rojo = M("terciopelo", "#b8282e"), oro2 = M("oroOscuro", "#c9963a");
  o.add(boxGeo(V(cx - 1.3, D0, TRONO_Z - 0.9), V(cx + 1.3, D0 + 0.25, TRONO_Z + 0.7)), oro2);
  o.add(boxGeo(V(cx - 0.55, D0 + 0.25, TRONO_Z - 0.4), V(cx + 0.55, D0 + 0.66, TRONO_Z + 0.35)), oro);
  o.add(boxGeo(V(cx - 0.5, D0 + 0.66, TRONO_Z - 0.36), V(cx + 0.5, D0 + 0.78, TRONO_Z + 0.3)), rojo);
  o.add(boxGeo(V(cx - 0.6, D0 + 0.25, TRONO_Z + 0.3), V(cx + 0.6, D0 + 2.2, TRONO_Z + 0.45)), oro);
  o.add(boxGeo(V(cx - 0.48, D0 + 0.8, TRONO_Z + 0.26), V(cx + 0.48, D0 + 2.05, TRONO_Z + 0.32)), rojo);
  o.add(new THREE.SphereGeometry(0.6, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), oro, at(cx, D0 + 2.2, TRONO_Z + 0.38, 0, 0, 0, [1, 0.6, 0.2]));
  for (const s of [-1, 1]) {
    o.add(boxGeo(V(cx + s * 0.6 - 0.08, D0 + 0.25, TRONO_Z - 0.4), V(cx + s * 0.6 + 0.08, D0 + 1.05, TRONO_Z + 0.35)), oro);
    o.add(new THREE.SphereGeometry(0.12, 10, 8), oro, at(cx + s * 0.6, D0 + 1.12, TRONO_Z - 0.36));
    o.add(cyl(0.06, 3.6, 10), oro2, at(cx + s * 1.15, D0 + 1.8, TRONO_Z - 0.75));
  }
  o.add(boxGeo(V(cx - 1.3, D0 + 3.55, TRONO_Z - 0.95), V(cx + 1.3, D0 + 3.7, TRONO_Z + 0.5)), rojo);
  for (let k = 0; k < 9; k++) o.add(new THREE.ConeGeometry(0.12, 0.3, 8), oro, at(cx - 1.2 + k * 0.3, D0 + 3.42, TRONO_Z - 0.95, Math.PI, 0, 0));
  // lámparas colgantes de bronce
  for (const x of [cx - 2.6, cx + 2.6]) {
    o.add(cyl(0.015, 1.2, 4), M("cadena", "#5a4a3a"), at(x, D0 + 4.0, Z1 - 2.5));
    o.add(new THREE.SphereGeometry(0.28, 14, 10), M("bronceLampara", "#c9963a"), at(x, D0 + 3.3, Z1 - 2.5, 0, 0, 0, [1, 0.8, 1]));
    o.add(new THREE.ConeGeometry(0.2, 0.3, 10), M("bronceLampara", "#c9963a"), at(x, D0 + 3.62, Z1 - 2.5));
  }
  // macetas con palmeras enanas
  for (const x of [cx - 2.4, cx + 2.4]) {
    o.add(new THREE.CylinderGeometry(0.32, 0.24, 0.6, 14), M("maceta", "#2f6ab8"), at(x, D0 + 0.3, Z1 - 0.9));
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; o.add(new THREE.SphereGeometry(1, 8, 6), M("palmaHojaA", "#4f9a3c"), at(x + Math.sin(a) * 0.35, D0 + 1.1, Z1 - 0.9 + Math.cos(a) * 0.35, 0, a, 0, [0.12, 0.04, 0.55]).multiply(at(0, 0, 0, 0.6, 0, 0))); }
  }
};
