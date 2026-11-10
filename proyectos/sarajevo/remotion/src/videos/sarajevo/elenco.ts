// Elenco de Sarajevo, 28 de junio de 1914. Vestuario aproximado a las fotos del día (sin copiar a nadie).
import { Outfit, SKINS, INK } from "./toon";

/** Archiduque Francisco Fernando: uniforme de general azul claro, pantalón negro con franja roja, sombrero con plumas verdes */
export const ARCHIDUQUE: Outfit = {
  jacket: "#9cbad8", pants: "#23212b", boots: INK, hat: "plume", buttons: "#e8c45a", sash: "#d8b04a",
  moustache: "#3a2618", build: "stout", skin: SKINS[0],
};
/** Sofía: vestido blanco de verano, sombrero de ala ancha con flores */
export const SOFIA: Outfit = {
  jacket: "#f4f0e8", pants: "#f4f0e8", boots: "#e9e2d4", hat: "ladyhat", dress: "#f4f0e8", skin: SKINS[0],
};
/** Chofer (Leopold Lojka, según la mayoría de fuentes): abrigo gris, gorra de chofer */
export const CHOFER: Outfit = {
  jacket: "#5b5f68", pants: "#3a3d45", boots: INK, hat: "cap", cap: "#2e3038", buttons: "#c9ccd2", moustache: "#4a3020", skin: SKINS[1],
};
/** Gobernador Potiorek: general, azul claro, plumas verdes */
export const POTIOREK: Outfit = {
  jacket: "#9cbad8", pants: "#23212b", boots: INK, hat: "plume", buttons: "#e8c45a", moustache: "#cfcac0", skin: SKINS[2],
};
/** Gavrilo Princip, 19 años: traje oscuro, sin sombrero, pelo negro, sin bigote, delgado */
export const PRINCIP: Outfit = {
  jacket: "#34323b", pants: "#2a2830", boots: INK, hat: "hair", hair: "#1c1715", skin: SKINS[2],
};
/** los otros conspiradores: jóvenes con traje, gorra, bombín o pelo */
export const CONSPIRADOR = (v: number): Outfit => {
  const coats = ["#3a3f52", "#4a3b34", "#34323b", "#3d4a40", "#46404f"];
  const hats: Outfit["hat"][] = ["bowler", "cap", "hair", "fez", "bowler"];
  return { jacket: coats[v % 5], pants: "#2a2830", boots: INK, hat: hats[v % 5], cap: hats[v % 5] === "cap" ? "#3b3a42" : undefined,
    hair: "#1c1715", skin: SKINS[(v + 1) % 4], moustache: v % 3 === 1 ? "#2a201a" : undefined };
};
/** gendarme austrohúngaro (toma del juicio) */
export const GENDARME: Outfit = { jacket: "#3b4a6b", pants: "#23212b", boots: INK, hat: "cap", cap: "#2b3550", buttons: "#e8c45a", belt: "#2a2018", moustache: "#3a2618", skin: SKINS[1] };

/** gente de Sarajevo en la acera: fez, bombín, pañuelo, sombrero de copa; ropa de domingo */
export const VECINO = (v: number): Outfit => {
  const coats = ["#3f6fb5", "#8c3b4a", "#5d7a3a", "#b5653f", "#2f5f6a", "#7b5ac9", "#4a4552", "#a8843f"];
  const o: Outfit = { jacket: coats[v % 8], pants: "#3b3f52", boots: "#4a3426", skin: SKINS[v % 4] };
  switch (v % 6) {
    case 0: return { ...o, hat: "fez", moustache: "#2a201a" };
    case 1: return { ...o, hat: "bonnet", dress: ["#d9a441", "#c25a7a", "#5a8fc2"][v % 3] };
    case 2: return { ...o, hat: "bowler" };
    case 3: return { ...o, hat: "fez", cap: "#9e1f2b" };
    case 4: return { ...o, hat: "bonnet", dress: ["#5a8fc2", "#d9a441", "#7aa35a"][v % 3] };
    default: return { ...o, hat: "tophat", moustache: "#4a3426" };
  }
};
