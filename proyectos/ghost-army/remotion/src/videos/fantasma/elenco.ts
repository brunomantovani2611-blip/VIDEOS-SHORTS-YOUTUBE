// Elenco del Ejército Fantasma (caricaturas; sin copiar ninguna foto).
import { Outfit, SKINS, INK } from "./toon";

const OD = "#6b6a44", OD_D = "#55553a";
/** soldados estadounidenses: verde oliva, gorra de cuartel */
export const GI = (v: number): Outfit => ({
  jacket: OD, pants: OD_D, boots: "#4a3020", hat: "cap", cap: "#5a5a38", belt: "#8a7a4a", skin: SKINS[v % 4],
  moustache: v % 4 === 2 ? "#4a3426" : undefined,
});
/** el artista (boina) y el técnico de sonido */
export const ARTISTA: Outfit = { jacket: OD, pants: OD_D, boots: "#4a3020", hat: "cap", cap: "#2a2a3a", skin: SKINS[1], moustache: "#3a2618" };
export const DISENADOR: Outfit = { jacket: OD, pants: OD_D, boots: "#4a3020", hat: "hair", hair: "#c9a26a", skin: SKINS[0] };
/** los dos franceses en bicicleta */
export const FRANCES = (v: number): Outfit => ({
  jacket: v ? "#3f5f9a" : "#8a4a3a", pants: "#3a3a44", boots: INK, hat: "cap", cap: "#1e2030", skin: SKINS[v ? 0 : 2],
  moustache: v ? "#4a3020" : undefined,
});
/** vecinos del pueblo */
export const VECINO = (v: number): Outfit => (v % 2
  ? { jacket: "#8a6a4a", pants: "#3a3a44", boots: "#4a3020", hat: "bonnet", dress: "#5a8fc2", skin: SKINS[v % 3] }
  : { jacket: "#4a5a6a", pants: "#3a3a44", boots: INK, hat: "cap", cap: "#2a2a3a", skin: SKINS[v % 3], moustache: "#5a4030" });
/** el observador alemán de la otra orilla */
export const ALEMAN: Outfit = { jacket: "#6a6e66", pants: "#5a5e56", boots: INK, hat: "cap", cap: "#5a5e56", belt: "#3a3a30", skin: SKINS[0] };
/** veteranos en 2024 y quien entrega la medalla */
export const VETERANO = (v: number): Outfit => ({ jacket: v ? "#2f3a5a" : "#4a3a3a", pants: "#2a2a30", boots: INK, hat: "hair", hair: "#ece8e0", skin: SKINS[v % 2], moustache: v ? "#e0dcd2" : undefined });
export const AUTORIDAD: Outfit = { jacket: "#22283a", pants: "#22283a", boots: INK, hat: "hair", hair: "#5a4030", skin: SKINS[3] };
