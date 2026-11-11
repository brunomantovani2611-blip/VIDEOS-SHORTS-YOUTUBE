// Elenco de Diógenes (caricaturas genéricas).
import { Outfit, SKINS } from "./toon";

/** Diógenes: túnica gastada marrón, pelo y barba canosos desordenados, descalzo */
export const DIOGENES: Outfit = { jacket: "#9a7a52", pants: "#9a7a52", boots: "#d9a878", hat: "hair", hair: "#b8b0a0", skin: SKINS[2], dress: "#9a7a52", beard: "#b8b0a0" };
/** Platón: túnica azul, barba blanca */
export const PLATON: Outfit = { jacket: "#3f6ab8", pants: "#3f6ab8", boots: "#8a5a34", hat: "hair", hair: "#e8e8ee", skin: SKINS[0], dress: "#3f6ab8", sash: "#f4f1ea", beard: "#e8e8ee", build: "stout" };
/** alumnos */
export const ALUMNO: Outfit = { jacket: "#f4f1ea", pants: "#f4f1ea", boots: "#8a5a34", hat: "hair", hair: "#3a2a20", skin: SKINS[1], dress: "#f4f1ea", sash: "#2f6ab8" };
export const ALUMNO2: Outfit = { ...ALUMNO, hair: "#141418", skin: SKINS[3], sash: "#c8763a" };
/** Alejandro Magno: casco dorado, capa morada, túnica roja */
export const ALEJANDRO: Outfit = { jacket: "#b8322f", pants: "#b8322f", boots: "#8a5a34", hat: "greek_gold", hair: "#c9a26a", skin: SKINS[0], cape: "#6a2a8a", belt: "#e8b84a" };
/** soldados macedonios */
export const SOLDADO: Outfit = { jacket: "#3f6ab8", pants: "#3f6ab8", boots: "#6a4a2a", hat: "greek", hair: "#2a1d18", skin: SKINS[1], shield: "#c9a24a", spear: true, belt: "#6a4a2a" };
export const SOLDADO2: Outfit = { ...SOLDADO, skin: SKINS[2], build: "stout" };
/** vecinos de Atenas */
export const VECINO: Outfit = { jacket: "#6a8a5a", pants: "#6a8a5a", boots: "#6a4a2a", hat: "hair", hair: "#141418", skin: SKINS[3], dress: "#6a8a5a" };
export const VECINA: Outfit = { jacket: "#c86a8a", pants: "#c86a8a", boots: "#6a4a2a", hat: "hair", hair: "#8a5a2a", skin: SKINS[0], dress: "#c86a8a" };
