// Elenco de Garbo (caricaturas; sin copiar ninguna foto).
import { Outfit, SKINS, INK } from "./toon";

/** Juan Pujol: gabardina, bombín y bigotito */
export const GARBO: Outfit = { jacket: "#b89a6a", pants: "#4a4a52", boots: "#3a2a20", hat: "bowler", cap: "#4a3a2e", moustache: "#2a1d18", skin: SKINS[1] };
/** el oficial inglés de la entrevista */
export const INGLES: Outfit = { jacket: "#8a7a4e", pants: "#6e6240", boots: "#4a3020", hat: "cap", cap: "#5a3a22", buttons: "#e8c45a", belt: "#4a3020", moustache: "#c9a26a", skin: SKINS[0] };
/** el agente inglés de paisano que lo recluta */
export const AGENTE: Outfit = { jacket: "#3a3e4a", pants: "#3a3e4a", boots: INK, hat: "hair", hair: "#3a2a20", skin: SKINS[0] };
/** el oficial alemán (gris, sin insignias) */
export const ALEMAN: Outfit = { jacket: "#6a6e66", pants: "#5a5e56", boots: INK, hat: "cap", cap: "#4a4e46", belt: "#3a3a30", buttons: "#c9ccd6", skin: SKINS[0], build: "stout" };
