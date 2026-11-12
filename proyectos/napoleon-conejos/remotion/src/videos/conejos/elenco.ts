// Elenco de Napoleón y los conejos (Prusia, 1807): Napoleón con bicornio, Berthier con pluma, granaderos con chacó y
// látigo, un granjero y los conejos (blancos, grises, pardos y manchados).
import { Outfit, SKINS } from "./toon";

const AZUL = "#2a3f7a";
/** Napoleón: levita azul, chaleco y pantalón blancos, botas negras, bicornio negro con escarapela */
export const NAPOLEON: Outfit = { jacket: AZUL, pants: "#f4f1ea", boots: "#1e1c22", hat: "bicorne", cap: "#1e1c22", hair: "#3a2a20", skin: SKINS[1], buttons: "#e8c45a", belt: "#f4f1ea", build: "stout" };
/** Berthier: el mariscal, banda roja y pluma blanca en el bicornio */
export const BERTHIER: Outfit = { jacket: "#24346a", pants: "#f4f1ea", boots: "#1e1c22", hat: "bicorne", cap: "#1e1c22", plume: "#fbf7ee", hair: "#7a6a5a", skin: SKINS[2], buttons: "#e8c45a", sash: "#c8323a", moustache: "#7a6a5a" };
export const GRANADERO: Outfit = { jacket: AZUL, pants: "#f4f1ea", boots: "#1e1c22", hat: "shako", cap: "#1e1c22", hair: "#3a2a20", skin: SKINS[1], belt: "#f4f1ea", buttons: "#e8c45a", moustache: "#3a2a20", whip: true };
export const GRANADERO2: Outfit = { ...GRANADERO, skin: SKINS[3], hair: "#1e1c22", moustache: "#1e1c22", build: "stout" };
export const GRANJERO: Outfit = { jacket: "#8a5a3a", pants: "#5a4a3a", boots: "#4a3020", hat: "hair", hair: "#c98a4a", skin: SKINS[2], beard: "#c98a4a", belt: "#4a3020" };
/** conejos de granja: pelaje (jacket), panza y patas (pants), manchas (spots) */
export const CONEJO: Outfit = { jacket: "#f4f1ea", pants: "#fbf7ee", boots: "#f4f1ea", conejo: true };
export const CONEJO2: Outfit = { jacket: "#a8a4ae", pants: "#ece8f0", boots: "#a8a4ae", conejo: true };
export const CONEJO3: Outfit = { jacket: "#a87a52", pants: "#f0e2cc", boots: "#a87a52", conejo: true };
export const CONEJO4: Outfit = { jacket: "#f4f1ea", pants: "#fbf7ee", boots: "#f4f1ea", conejo: true, spots: "#5a4a44" };
export const CONEJO5: Outfit = { jacket: "#6a5a52", pants: "#d8ccc0", boots: "#6a5a52", conejo: true };
/** el conejo ganador, con el bicornio de Napoleón */
export const CONEJO_REY: Outfit = { ...CONEJO, hat: "bicorne", cap: "#1e1c22" };
