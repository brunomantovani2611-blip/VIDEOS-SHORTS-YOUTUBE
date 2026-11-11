// Elenco de la guerra del emú (Australia, 1932): soldados con sombrero de ala levantada, el mayor, un granjero y los emúes.
import { Outfit, SKINS } from "./toon";

const KAKI = "#a08a58";
/** el mayor: gorra de oficial, bigote, cinturón de cuero cruzado */
export const MAYOR: Outfit = { jacket: "#8f7c4c", pants: "#8f7c4c", boots: "#5a3a24", hat: "cap", cap: "#7a6a40", hair: "#5a3a24", skin: SKINS[1], moustache: "#5a3a24", belt: "#6a4424", buttons: "#d8b84a", sash: "#6a4424" };
export const SOLDADO: Outfit = { jacket: KAKI, pants: KAKI, boots: "#5a3a24", hat: "slouch", cap: "#9a8058", band: "#4a3a28", hair: "#3a2a20", skin: SKINS[1], belt: "#6a4424", buttons: "#c9a24a" };
export const SOLDADO2: Outfit = { ...SOLDADO, skin: SKINS[2], hair: "#c9a26a", build: "stout" };
export const GRANJERO: Outfit = { jacket: "#4a6a9a", pants: "#7a5a3a", boots: "#5a3a24", hat: "slouch", cap: "#c9b080", band: "#7a5a3a", hair: "#8a5a2a", skin: SKINS[3], beard: "#8a5a2a", belt: "#5a3a24" };
/** emúes: plumas pardas en tres tonos */
export const EMU: Outfit = { jacket: "#5e4a3a", pants: "#5e4a3a", boots: "#5e4a3a", emu: true };
export const EMU2: Outfit = { ...EMU, jacket: "#504034" };
export const EMU3: Outfit = { ...EMU, jacket: "#6a5644" };
/** el emú ganador, con el sombrero del ejército */
export const EMU_REY: Outfit = { ...EMU, hat: "slouch", cap: "#9a8058", band: "#4a3a28" };
