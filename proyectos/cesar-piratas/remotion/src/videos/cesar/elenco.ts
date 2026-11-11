// Elenco de César y los piratas (caricaturas genéricas).
import { Outfit, SKINS } from "./toon";

/** César joven: túnica blanca con banda roja, corona de laurel */
export const CESAR: Outfit = { jacket: "#f4f1ea", pants: "#f4f1ea", boots: "#8a5a34", hat: "hair", hair: "#3a2a20", skin: SKINS[1], dress: "#f4f1ea", sash: "#b8322f", laurel: true };
/** piratas: camisa a rayas / chaleco, pañuelo en la cabeza, barba */
export const PIRATA: Outfit = { jacket: "#d43f3f", pants: "#3a3e4a", boots: "#2a2730", hat: "cap", cap: "#2a2730", skin: SKINS[2], beard: "#2a1d18", build: "stout" };
export const PIRATA2: Outfit = { jacket: "#3f7ac9", pants: "#5a4a3a", boots: "#2a2730", hat: "cap", cap: "#d43f3f", skin: SKINS[0], moustache: "#5a3a20" };
export const PIRATA3: Outfit = { jacket: "#e8c45a", pants: "#3a3e4a", boots: "#2a2730", hat: "hair", hair: "#141418", skin: SKINS[3], beard: "#141418" };
/** soldado romano: casco con cresta, túnica roja, escudo y lanza */
export const SOLDADO: Outfit = { jacket: "#b8322f", pants: "#b8322f", boots: "#6a4a2a", hat: "greek", hair: "#2a1d18", skin: SKINS[1], shield: "#b8322f", spear: true, belt: "#6a4a2a" };
