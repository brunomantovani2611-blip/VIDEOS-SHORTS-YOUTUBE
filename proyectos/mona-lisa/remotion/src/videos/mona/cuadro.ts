// La Mona Lisa en caricatura (dibujo propio, no una copia): retrato de medio cuerpo, pelo oscuro con raya al medio,
// vestido oscuro, manos cruzadas, la sonrisa leve, y un paisaje verdoso con un camino que serpentea detrás.
// Lienzo 400 x 580; sirve para la textura de la pared (world.ts) y para la tarjeta que lleva Peruggia (cast.ts).
const INK = "#241726";
export const drawMona = (g: CanvasRenderingContext2D, smile = 0) => {
  const W = 400, H = 580;
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#9fb58f"); sky.addColorStop(0.45, "#7d9a72"); sky.addColorStop(1, "#5b6e4a");
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // paisaje: montes azulados, camino y río sinuosos
  g.fillStyle = "#88a6a8"; g.beginPath(); g.moveTo(0, 210); g.quadraticCurveTo(80, 150, 150, 200); g.lineTo(150, 300); g.lineTo(0, 300); g.fill();
  g.beginPath(); g.moveTo(250, 200); g.quadraticCurveTo(330, 140, 400, 190); g.lineTo(400, 300); g.lineTo(250, 300); g.fill();
  g.strokeStyle = "#c9b27a"; g.lineWidth = 9; g.beginPath(); g.moveTo(20, 330); g.bezierCurveTo(60, 300, 40, 260, 90, 240); g.stroke();
  g.strokeStyle = "#a9c8c8"; g.lineWidth = 8; g.beginPath(); g.moveTo(330, 330); g.bezierCurveTo(360, 290, 320, 260, 370, 230); g.stroke();
  const fill = (path: () => void, col: string, w = 7) => { g.beginPath(); path(); g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = "round"; g.stroke(); };
  // cuerpo y vestido
  fill(() => { g.moveTo(70, H + 10); g.bezierCurveTo(70, 400, 120, 330, 200, 330); g.bezierCurveTo(280, 330, 330, 400, 330, H + 10); }, "#3a3324");
  fill(() => { g.moveTo(150, 340); g.quadraticCurveTo(200, 400, 250, 340); g.lineTo(240, 336); g.quadraticCurveTo(200, 370, 160, 336); }, "#e8c49a", 5);
  // pelo largo detrás de la cara
  fill(() => { g.moveTo(128, 340); g.bezierCurveTo(110, 220, 130, 120, 200, 112); g.bezierCurveTo(270, 120, 290, 220, 272, 340); g.lineTo(240, 330); g.lineTo(160, 330); }, "#2c2116");
  // cara
  fill(() => { g.ellipse(200, 222, 58, 74, 0, 0, Math.PI * 2); }, "#ecc79a", 7);
  // raya del pelo y velo
  g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(200, 150); g.lineTo(200, 118); g.stroke();
  g.fillStyle = "#2c2116"; g.beginPath(); g.moveTo(200, 150); g.quadraticCurveTo(160, 150, 146, 200); g.quadraticCurveTo(150, 140, 200, 140); g.fill();
  g.beginPath(); g.moveTo(200, 150); g.quadraticCurveTo(240, 150, 254, 200); g.quadraticCurveTo(250, 140, 200, 140); g.fill();
  // ojos tranquilos, mirada hacia nosotros
  for (const x of [178, 222]) { g.fillStyle = INK; g.beginPath(); g.ellipse(x, 214, 6, 5, 0, 0, Math.PI * 2); g.fill(); g.lineWidth = 4; g.beginPath(); g.moveTo(x - 12, 206); g.quadraticCurveTo(x, 200, x + 12, 206); g.stroke(); }
  g.lineWidth = 4; g.beginPath(); g.moveTo(200, 222); g.quadraticCurveTo(194, 244, 203, 248); g.stroke();
  // la sonrisa (smile 0..1 la acentúa un poco al final)
  g.lineWidth = 5; g.beginPath(); g.moveTo(184, 266 - smile * 2); g.quadraticCurveTo(200, 272 + smile * 6, 218, 262 - smile * 4); g.stroke();
  // manos cruzadas
  fill(() => { g.ellipse(170, 520, 52, 26, -0.15, 0, Math.PI * 2); }, "#ecc79a", 6);
  fill(() => { g.ellipse(232, 528, 56, 26, 0.12, 0, Math.PI * 2); }, "#ecc79a", 6);
  // pátina: viñeta oscura en los bordes
  const v = g.createRadialGradient(200, 280, 120, 200, 290, 360);
  v.addColorStop(0, "rgba(40,30,10,0)"); v.addColorStop(1, "rgba(40,30,10,0.45)");
  g.fillStyle = v; g.fillRect(0, 0, W, H);
};
