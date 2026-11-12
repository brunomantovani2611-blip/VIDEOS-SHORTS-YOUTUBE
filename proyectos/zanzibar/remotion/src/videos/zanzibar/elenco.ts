// Elenco de la guerra de los 38 minutos (Zanzíbar, 1896): Khalid, sus askaris, el cónsul y el almirante británicos.
import { Outfit, SKINS } from "./toon";

/** Khalid bin Barghash: kanzu blanco, bisht negro con ribete dorado, turbante, daga khanjar y barba negra */
export const KHALID: Outfit = { jacket: "#fbf7ee", pants: "#fbf7ee", boots: "#5a3a22", dress: "#fbf7ee", bisht: "#262228", hat: "turban", turban: "#f2e6c8", hair: "#1e1814", beard: "#1e1814", skin: "#b88660", khanjar: true };
/** askaris del sultán: túnica blanca, faja roja, fez rojo y fusil */
export const ASKARI: Outfit = { jacket: "#f2ede0", pants: "#f2ede0", boots: "#3a2a20", hat: "fez", cap: "#b8282e", belt: "#b8282e", rifle: true, skin: "#8a5a3a", hair: "#1e1814" };
export const ASKARI2: Outfit = { ...ASKARI, skin: "#6e4430", moustache: "#1e1814" };
export const ASKARI3: Outfit = { ...ASKARI, skin: "#9a6a48", build: "stout" };
/** el cónsul británico: traje blanco, salacot y bigote */
export const CONSUL: Outfit = { jacket: "#f4efe2", pants: "#f4efe2", boots: "#5a3a22", hat: "pith", cap: "#f4efe2", band: "#2f4a8a", buttons: "#c9a24a", moustache: "#8a5a2a", hair: "#8a5a2a", skin: SKINS[1] };
/** el almirante: levita azul marino, bicornio negro sin escarapela, charreteras doradas, barba blanca */
export const ALMIRANTE: Outfit = { jacket: "#1e2440", pants: "#1e2440", boots: "#1e1c22", hat: "bicorne", cap: "#1e1c22", cockade: "#1e1c22", buttons: "#e8c45a", sash: "#e8c45a", beard: "#e8e2d8", hair: "#e8e2d8", skin: SKINS[2], build: "stout" };
/** marineros británicos */
export const MARINERO: Outfit = { jacket: "#1e2a4a", pants: "#1e2a4a", boots: "#1e1c22", hat: "sailor", hair: "#8a5a2a", skin: SKINS[1], belt: "#fbf7ee", sash: "#fbf7ee" };
export const MARINERO2: Outfit = { ...MARINERO, hair: "#2a1d14", skin: SKINS[3], build: "stout" };
