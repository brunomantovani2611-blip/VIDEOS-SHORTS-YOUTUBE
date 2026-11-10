// Elenco de París y Florencia, 1911-1913 (caricaturas; sin copiar ninguna foto).
import { Outfit, SKINS, INK } from "./toon";

/** Vincenzo Peruggia: bata blanca de los empleados del museo, bigote, gorra */
export const PERUGGIA: Outfit = { jacket: "#f1efe8", pants: "#3a3d45", boots: INK, hat: "cap", cap: "#4a4552", buttons: "#c9ccd2", moustache: "#2a1d18", skin: SKINS[1] };
/** Peruggia en su habitación y en Florencia: chaqueta de paño */
export const PERUGGIA_CALLE: Outfit = { ...PERUGGIA, jacket: "#5a4a3a", hat: "bowler" };
/** Louis Béroud, el pintor: barba, chaqueta marrón, bombín */
export const BEROUD_O: Outfit = { jacket: "#8a6038", pants: "#4a3a2e", boots: "#3a2a20", hat: "bowler", moustache: "#8a8478", skin: SKINS[0] };
/** Guillaume Apollinaire: corpulento, traje oscuro */
export const APOLLINAIRE: Outfit = { jacket: "#3a3f52", pants: "#2a2830", boots: INK, hat: "hair", hair: "#4a3426", build: "stout", skin: SKINS[0] };
/** Pablo Picasso, 29 años: pelo negro con flequillo, chaqueta azul */
export const PICASSO: Outfit = { jacket: "#2f5f9a", pants: "#2a2830", boots: INK, hat: "hair", hair: "#141012", skin: SKINS[3] };
/** gendarme francés: azul oscuro, quepis */
export const GENDARME: Outfit = { jacket: "#26304a", pants: "#3a4466", boots: INK, hat: "cap", cap: "#26304a", buttons: "#e8c45a", belt: "#2a2018", moustache: "#3a2618", skin: SKINS[1] };
/** el marchante de Florencia: traje gris, bigote blanco */
export const MARCHANTE: Outfit = { jacket: "#7d8490", pants: "#4a4f5a", boots: INK, hat: "hair", hair: "#cfcac0", moustache: "#e9e4da", build: "stout", skin: SKINS[0] };
/** visitantes del museo y gente de París */
export const VISITANTE = (v: number): Outfit => {
  const coats = ["#3f6fb5", "#8c3b4a", "#5d7a3a", "#b5653f", "#2f5f6a", "#7b5ac9", "#4a4552", "#a8843f"];
  const o: Outfit = { jacket: coats[v % 8], pants: "#3b3f52", boots: "#4a3426", skin: SKINS[v % 4] };
  switch (v % 5) {
    case 0: return { ...o, hat: "bowler", moustache: "#2a201a" };
    case 1: return { ...o, hat: "ladyhat", dress: coats[(v + 3) % 8] };
    case 2: return { ...o, hat: "tophat" };
    case 3: return { ...o, hat: "bonnet", dress: coats[(v + 5) % 8] };
    default: return { ...o, hat: "cap", cap: "#3b3a42", moustache: "#4a3426" };
  }
};
/** público actual (toma final): ropa de hoy, sin sombrero */
export const TURISTA = (v: number): Outfit => {
  const coats = ["#e2453c", "#3f9a8a", "#f2c230", "#5a8fc2", "#c25a7a", "#7aa35a", "#f08a2c"];
  return { jacket: coats[v % 7], pants: v % 2 ? "#3b5b9a" : "#2a2830", boots: "#f4f1ea", hat: "hair", hair: ["#2a1d18", "#c9a26a", "#5a3b2a", "#141012"][v % 4], skin: SKINS[v % 4] };
};
