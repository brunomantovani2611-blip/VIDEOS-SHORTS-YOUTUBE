// Elenco de Arístides (caricaturas genéricas).
import { Outfit, SKINS } from "./toon";

/** Arístides: túnica blanca con banda azul, barba oscura */
export const ARISTIDES: Outfit = { jacket: "#f4f1ea", pants: "#f4f1ea", boots: "#8a5a34", hat: "hair", hair: "#3a2a20", skin: SKINS[1], dress: "#f4f1ea", sash: "#2f6ab8", beard: "#3a2a20" };
/** el campesino que no sabía escribir */
export const CAMPESINO: Outfit = { jacket: "#9a7a52", pants: "#9a7a52", boots: "#6a4a2a", hat: "hair", hair: "#c9a26a", skin: SKINS[2], dress: "#9a7a52", moustache: "#c9a26a", build: "stout" };
export const VECINO: Outfit = { jacket: "#6a8a5a", pants: "#6a8a5a", boots: "#6a4a2a", hat: "hair", hair: "#141418", skin: SKINS[3], dress: "#6a8a5a" };
export const VECINA: Outfit = { jacket: "#c86a8a", pants: "#c86a8a", boots: "#6a4a2a", hat: "hair", hair: "#8a5a2a", skin: SKINS[0], dress: "#c86a8a" };
export const VECINO2: Outfit = { jacket: "#4a6a9a", pants: "#4a6a9a", boots: "#6a4a2a", hat: "hair", hair: "#d8d8e0", skin: SKINS[1], dress: "#4a6a9a", beard: "#d8d8e0" };
/** hoplitas atenienses */
export const HOPLITA: Outfit = { jacket: "#b8322f", pants: "#b8322f", boots: "#6a4a2a", hat: "greek", hair: "#2a1d18", skin: SKINS[1], shield: "#c9a24a", spear: true, belt: "#6a4a2a" };
export const HOPLITA2: Outfit = { ...HOPLITA, skin: SKINS[2], build: "stout" };
