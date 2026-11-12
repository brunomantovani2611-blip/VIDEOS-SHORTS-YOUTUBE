// Banderas de 1914 pintadas en canvas (las de la época, no las actuales).
import { ctex } from "./paint";

type G = CanvasRenderingContext2D;
const stripesH = (g: G, w: number, h: number, cols: string[]) => cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, (i * h) / cols.length, w, h / cols.length + 1); });
const stripesV = (g: G, w: number, h: number, cols: string[]) => cols.forEach((c, i) => { g.fillStyle = c; g.fillRect((i * w) / cols.length, 0, w / cols.length + 1, h); });
/** Union Jack (1801) simplificada pero correcta: aspas blancas, aspas rojas desplazadas, cruz blanca y roja */
const unionJack = (g: G, w: number, h: number) => {
  g.fillStyle = "#1f3f8c"; g.fillRect(0, 0, w, h);
  const diag = (lw: number, col: string) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke(); };
  diag(h * 0.2, "#ffffff");
  g.save(); g.beginPath(); g.rect(0, 0, w, h); g.clip();
  g.strokeStyle = "#c8102e"; g.lineWidth = h * 0.067;
  // aspa roja desplazada en molinillo: arriba a la izquierda por debajo de la diagonal, arriba a la derecha por encima, etc.
  const o = h * 0.033, cx = w / 2, cy = h / 2;
  for (const [x1, y1] of [[0, 0], [w, 0], [w, h], [0, h]]) {
    const L = Math.hypot(x1 - cx, y1 - cy), dx = (x1 - cx) / L, dy = (y1 - cy) / L, ox = dy * o, oy = -dx * o;
    g.beginPath(); g.moveTo(cx + ox, cy + oy); g.lineTo(x1 + ox, y1 + oy); g.stroke();
  }
  g.restore();
  g.fillStyle = "#ffffff"; g.fillRect(w / 2 - h * 0.17, 0, h * 0.34, h); g.fillRect(0, h / 2 - h * 0.17, w, h * 0.34);
  g.fillStyle = "#c8102e"; g.fillRect(w / 2 - h * 0.1, 0, h * 0.2, h); g.fillRect(0, h / 2 - h * 0.1, w, h * 0.2);
};

export const FLAG: Record<string, (g: G, w: number, h: number) => void> = {
  austria: (g, w, h) => stripesH(g, w, h, ["#141217", "#f2c230"]),             // negro-amarillo (Habsburgo)
  serbia: (g, w, h) => stripesH(g, w, h, ["#c6363c", "#1f4e9a", "#f4f1ea"]),   // rojo-azul-blanco
  rusia: (g, w, h) => stripesH(g, w, h, ["#f4f1ea", "#1f4e9a", "#c6363c"]),    // blanco-azul-rojo (1883/1896)
  alemania: (g, w, h) => stripesH(g, w, h, ["#141217", "#f4f1ea", "#c6363c"]), // negro-blanco-rojo (Imperio, 1871)
  francia: (g, w, h) => stripesV(g, w, h, ["#1f3f8c", "#f4f1ea", "#c6363c"]),
  britania: unionJack,
};
export const NOMBRE: Record<string, string> = {
  austria: "AUSTRIA-HUNGRÍA", serbia: "SERBIA", rusia: "RUSIA", alemania: "ALEMANIA", francia: "FRANCIA", britania: "GRAN BRETAÑA",
};

export const BANDERAS = {
  habsburgo: () => ctex("habsburgo", 256, 170, (g) => { FLAG.austria(g, 256, 170); g.fillStyle = "rgba(0,0,0,.08)"; g.fillRect(0, 160, 256, 10); }),
  /** ficha de dominó: crema con borde, bandera arriba, línea divisoria y nombre del país abajo */
  ficha: (n: string) => ctex("ficha_" + n, 512, 900, (g) => {
    g.fillStyle = "#f6f1e4"; g.fillRect(0, 0, 512, 900);
    g.strokeStyle = "#241726"; g.lineWidth = 18; g.strokeRect(9, 9, 494, 882);
    g.save(); g.translate(48, 60); FLAG[n](g, 416, 300); g.restore();
    g.lineWidth = 8; g.strokeRect(48, 60, 416, 300);
    g.fillStyle = "#241726"; g.fillRect(40, 440, 432, 12);
    g.textAlign = "center"; g.textBaseline = "middle";
    const name = NOMBRE[n], words = name.split("-");
    const size = name.length > 10 ? 66 : 84;
    g.font = `900 ${size}px "DejaVu Sans", Arial, sans-serif`;
    if (words.length > 1) { g.fillText(words[0] + "-", 256, 610); g.fillText(words[1], 256, 610 + size * 1.15); }
    else if (name.includes(" ")) { const [a, b] = name.split(" "); g.fillText(a, 256, 610); g.fillText(b, 256, 610 + size * 1.15); }
    else g.fillText(name, 256, 660);
  }),
};
