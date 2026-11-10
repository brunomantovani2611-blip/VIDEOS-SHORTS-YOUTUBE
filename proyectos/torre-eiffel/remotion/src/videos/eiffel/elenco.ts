// Elenco de París, 1925 (caricaturas; sin copiar ninguna foto).
import { Outfit, SKINS, INK } from "./toon";

/** Victor Lustig, el «conde»: frac oscuro, chistera, bigote fino */
export const LUSTIG: Outfit = { jacket: "#2b2a35", pants: "#24222b", boots: INK, hat: "tophat", buttons: "#d8b04a", moustache: "#2a1d18", skin: SKINS[1] };
/** Lustig en Alcatraz: uniforme gris azulado, sin sombrero */
export const LUSTIG_PRESO: Outfit = { jacket: "#8d96a3", pants: "#7d8693", boots: INK, hat: "hair", hair: "#2a1d18", buttons: "#c9ccd2", moustache: "#2a1d18", skin: SKINS[1] };
/** André Poisson: empresario robusto e inseguro, traje marrón y bombín */
export const POISSON: Outfit = { jacket: "#8a6038", pants: "#4a3a2e", boots: "#3a2a20", hat: "bowler", moustache: "#5a3a26", build: "stout", skin: SKINS[0] };
/** la señora Poisson: vestido morado, sombrero de ala */
export const ESPOSA_O: Outfit = { jacket: "#6e4fb0", pants: "#6e4fb0", boots: "#3a2a20", hat: "ladyhat", dress: "#6e4fb0", skin: SKINS[0] };
/** chatarreros: ropa de trabajo buena para la ocasión */
export const CHATARRERO = (v: number): Outfit => {
  const coats = ["#3f5a7a", "#5d6b3a", "#6b4a3a", "#4a4552", "#7a5a2e"];
  const hats: Outfit["hat"][] = ["cap", "bowler", "hair", "cap", "bowler"];
  return { jacket: coats[v % 5], pants: "#34323b", boots: INK, hat: hats[v % 5], cap: "#3b3a42", hair: "#4a3426", skin: SKINS[(v + 2) % 4],
    moustache: v % 2 ? "#3a2618" : undefined, build: v === 2 ? "stout" : undefined };
};
/** taxista de la huida */
export const TAXISTA: Outfit = { jacket: "#4a4f5a", pants: "#33363f", boots: INK, hat: "cap", cap: "#2e3038", moustache: "#4a3020", skin: SKINS[2] };
