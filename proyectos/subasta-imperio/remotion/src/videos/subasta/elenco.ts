// Elenco de la subasta del Imperio romano (caricaturas genéricas).
import { Outfit, SKINS } from "./toon";

/** Didio Juliano: senador rico, toga blanca con banda morada, canoso; con laurel cuando ya es emperador */
export const DIDIO: Outfit = { jacket: "#f4f1ea", pants: "#f4f1ea", boots: "#8a5a34", hat: "hair", hair: "#b8b8c0", skin: SKINS[0], dress: "#f4f1ea", sash: "#8a2a6a", build: "stout" };
export const DIDIO_EMP: Outfit = { ...DIDIO, laurel: true };
/** el otro senador */
export const SULPICIANO: Outfit = { jacket: "#efe6d6", pants: "#efe6d6", boots: "#8a5a34", hat: "hair", hair: "#5a4a3a", skin: SKINS[1], dress: "#efe6d6", sash: "#8a2a6a", beard: "#5a4a3a" };
export const SENADOR: Outfit = { ...SULPICIANO, hair: "#d8d8e0", beard: undefined, skin: SKINS[3] };
/** pretorianos: casco con cresta, túnica roja */
export const PRETORIANO: Outfit = { jacket: "#b8322f", pants: "#b8322f", boots: "#6a4a2a", hat: "greek", hair: "#2a1d18", skin: SKINS[1], shield: "#b8322f", spear: true, belt: "#6a4a2a" };
export const PRETORIANO2: Outfit = { ...PRETORIANO, skin: SKINS[2], build: "stout" };
/** Septimio Severo: general con casco dorado, capa y barba */
export const SEVERO: Outfit = { jacket: "#b8322f", pants: "#b8322f", boots: "#6a4a2a", hat: "greek_gold", hair: "#2a1d18", skin: SKINS[2], cape: "#8a2a6a", beard: "#2a1d18", belt: "#6a4a2a" };
/** el pueblo */
export const PUEBLO1: Outfit = { jacket: "#c9a26a", pants: "#c9a26a", boots: "#6a4a2a", hat: "hair", hair: "#3a2a20", skin: SKINS[1], dress: "#c9a26a" };
export const PUEBLO2: Outfit = { jacket: "#6a8a5a", pants: "#6a8a5a", boots: "#6a4a2a", hat: "hair", hair: "#141418", skin: SKINS[3], dress: "#6a8a5a" };
export const PUEBLO3: Outfit = { jacket: "#4a6a9a", pants: "#4a6a9a", boots: "#6a4a2a", hat: "hair", hair: "#8a5a2a", skin: SKINS[0], beard: "#8a5a2a" };
