// Elenco del hackeo de Twitter (caricaturas genéricas; no dibujamos a ninguna persona real).
import { Outfit, SKINS } from "./toon";

/** el chico de 17 años: buzo con capucha gris */
export const CHICO: Outfit = { jacket: "#4a5060", pants: "#3a4a6a", boots: "#e8eaf0", hat: "hair", hair: "#3a2a20", skin: SKINS[1] };
/** el empleado que atiende el teléfono */
export const EMPLEADO: Outfit = { jacket: "#5a9ad4", pants: "#3a3e4a", boots: "#2a2730", hat: "hair", hair: "#c9a26a", skin: SKINS[0] };
/** policías */
export const POLICIA: Outfit = { jacket: "#2f3e5a", pants: "#2a3448", boots: "#1e1e24", hat: "cap", cap: "#1e2a40", buttons: "#e8c45a", belt: "#1e1e24", skin: SKINS[0] };
export const POLICIA2: Outfit = { ...POLICIA, skin: SKINS[3], moustache: "#2a1d18", build: "stout" };
