// Elenco de Arquímedes (caricaturas genéricas).
import { Outfit, SKINS } from "./toon";

/** el rey de Siracusa: corona, túnica morada, barba */
export const REY: Outfit = { jacket: "#6a2a8a", pants: "#6a2a8a", boots: "#8a5a34", hat: "crown", hair: "#5a3a20", skin: SKINS[1], dress: "#6a2a8a", sash: "#e8b84a", beard: "#5a3a20", build: "stout" };
/** el orfebre: delantal de cuero */
export const ORFEBRE: Outfit = { jacket: "#8a6a4a", pants: "#8a6a4a", boots: "#5a3a20", hat: "hair", hair: "#141418", skin: SKINS[3], dress: "#8a6a4a", moustache: "#141418" };
/** Arquímedes: túnica blanca, barba gris */
export const ARQUIMEDES: Outfit = { jacket: "#f4f1ea", pants: "#f4f1ea", boots: "#8a5a34", hat: "hair", hair: "#a8a8b0", skin: SKINS[0], dress: "#f4f1ea", sash: "#3f8ac8", beard: "#a8a8b0" };
/** Arquímedes corriendo «desnudo»: sólo una toalla */
export const ARQ_TOALLA: Outfit = { ...ARQUIMEDES, jacket: SKINS[0], pants: SKINS[0], boots: SKINS[0], dress: undefined, sash: "#f4f1ea", buttons: SKINS[0] };
export const VECINO: Outfit = { jacket: "#6a8a5a", pants: "#6a8a5a", boots: "#6a4a2a", hat: "hair", hair: "#141418", skin: SKINS[3], dress: "#6a8a5a" };
export const VECINA: Outfit = { jacket: "#c86a8a", pants: "#c86a8a", boots: "#6a4a2a", hat: "hair", hair: "#8a5a2a", skin: SKINS[0], dress: "#c86a8a" };
