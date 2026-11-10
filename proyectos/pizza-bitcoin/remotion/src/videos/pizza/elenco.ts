// Elenco de 2010 (caricaturas; sin copiar ninguna foto).
import { Outfit, SKINS, INK } from "./toon";

/** Laszlo: programador, camiseta verde, pelo castaño */
export const LASZLO_O: Outfit = { jacket: "#3f9a6a", pants: "#3b5b9a", boots: "#f4f1ea", hat: "hair", hair: "#5a3b2a", skin: SKINS[0] };
/** Jeremy, 19 años: sudadera roja, gorra */
export const JEREMY_O: Outfit = { jacket: "#e2453c", pants: "#2a2830", boots: "#f4f1ea", hat: "cap", cap: "#2f5f9a", skin: SKINS[1] };
/** repartidor de pizza: gorra y polo (sin marca) */
export const REPARTIDOR: Outfit = { jacket: "#2f6a43", pants: "#2a2830", boots: INK, hat: "cap", cap: "#c6363c", skin: SKINS[3], moustache: "#2a1d18" };
/** gente de la fiesta del 22 de mayo */
export const FIESTA = (v: number): Outfit => {
  const coats = ["#f2a900", "#3f9a8a", "#c25a7a", "#5a8fc2", "#7aa35a", "#f08a2c"];
  return { jacket: coats[v % 6], pants: v % 2 ? "#3b5b9a" : "#2a2830", boots: "#f4f1ea", hat: v % 3 ? "hair" : "cap", cap: "#2a2730", hair: ["#2a1d18", "#c9a26a", "#5a3b2a"][v % 3], skin: SKINS[v % 4] };
};
