// Elenco de Sam, el gato insumergible (1941): el gato blanco y negro, marineros alemanes y británicos y un oficial.
import { Outfit, SKINS } from "./toon";

/** el gato: negro con pecho, hocico y patas blancas */
export const GATO: Outfit = { jacket: "#26232a", pants: "#fbf7ee", boots: "#26232a", gato: true };
/** marineros alemanes del Bismarck: azul oscuro y gorra */
export const ALEMAN: Outfit = { jacket: "#22283a", pants: "#22283a", boots: "#1e1c22", hat: "cap", cap: "#22283a", hair: "#c9a26a", skin: SKINS[1], buttons: "#e8c45a" };
export const ALEMAN2: Outfit = { ...ALEMAN, hair: "#5a3a24", skin: SKINS[2], build: "stout" };
/** marineros británicos: azul marino, cuello blanco y gorrito blanco */
export const MARINERO: Outfit = { jacket: "#1e2a4a", pants: "#1e2a4a", boots: "#1e1c22", hat: "sailor", hair: "#8a5a2a", skin: SKINS[1], belt: "#fbf7ee", sash: "#fbf7ee" };
export const MARINERO2: Outfit = { ...MARINERO, hair: "#2a1d14", skin: SKINS[3], build: "stout" };
/** el oficial británico: gorra blanca, barba */
export const OFICIAL: Outfit = { jacket: "#1e2a4a", pants: "#1e2a4a", boots: "#1e1c22", hat: "cap", cap: "#fbf7ee", hair: "#7a6a5a", skin: SKINS[2], beard: "#7a6a5a", buttons: "#e8c45a" };
