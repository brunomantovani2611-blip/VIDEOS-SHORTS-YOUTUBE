// Elenco de Jonathan James (caricaturas genéricas: el chico no es un retrato de nadie).
import { Outfit, SKINS } from "./toon";

/** el chico de 15 años: remera verde, pelo castaño */
export const CHICO: Outfit = { jacket: "#3f8a5a", pants: "#3a4a6a", boots: "#e8eaf0", hat: "hair", hair: "#3a2a20", skin: SKINS[1] };
/** el empleado del Departamento de Defensa */
export const EMPLEADO: Outfit = { jacket: "#5a7a9a", pants: "#3a3e4a", boots: "#2a2730", hat: "hair", hair: "#c9a26a", skin: SKINS[0] };
/** el técnico de la NASA */
export const TECNICO: Outfit = { jacket: "#e8eaf0", pants: "#3a3e4a", boots: "#2a2730", hat: "hair", hair: "#2a1d18", skin: SKINS[3], moustache: "#2a1d18" };
/** agentes federales: traje oscuro */
export const AGENTE: Outfit = { jacket: "#24262e", pants: "#24262e", boots: "#141418", hat: "hair", hair: "#2a1d18", skin: SKINS[0], belt: "#141418" };
export const AGENTE2: Outfit = { ...AGENTE, skin: SKINS[2], hair: "#141418", build: "stout" };
