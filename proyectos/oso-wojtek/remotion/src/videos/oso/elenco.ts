// Elenco del oso Wojtek (caricaturas; sin copiar ninguna foto).
import { Outfit, SKINS, INK } from "./toon";

const KHAKI = "#9a8a56", KHAKI_D = "#7e7044", GORRA = "#6e6a3a";
/** soldados polacos del II Cuerpo: uniforme caqui, gorra de cuartel */
export const SOLDADO = (v: number): Outfit => ({
  jacket: KHAKI, pants: KHAKI_D, boots: INK, hat: "cap", cap: GORRA, belt: "#5a4a2e", skin: SKINS[v % 3],
  moustache: v % 3 === 1 ? "#4a3426" : undefined,
});
/** oficial polaco que firma el alta */
export const OFICIAL_PL: Outfit = { jacket: KHAKI, pants: KHAKI_D, boots: INK, hat: "cap", cap: "#5a5630", buttons: "#e8c45a", belt: "#5a3a22", moustache: "#5a3b2a", skin: SKINS[0], build: "stout" };
/** oficial británico del puerto: bigote y gorra de plato marrón */
export const OFICIAL_GB: Outfit = { jacket: "#8a7a4e", pants: "#6e6240", boots: "#4a3020", hat: "cap", cap: "#5a3a22", buttons: "#e8c45a", belt: "#4a3020", moustache: "#c9a26a", skin: SKINS[0] };
/** el chico de Irán */
export const CHICO: Outfit = { jacket: "#d9b37a", pants: "#7a5a3a", boots: "#5a3a22", hat: "hair", hair: "#1e1414", skin: SKINS[3], build: "kid" };
/** veteranos polacos de visita en el zoo (años 50) */
export const VETERANO = (v: number): Outfit => ({
  jacket: ["#5a6070", "#6a5040", "#3f4a5a"][v % 3], pants: "#3a3a44", boots: INK, hat: v % 2 ? "bowler" : "cap", cap: "#4a4a52",
  moustache: "#c9c4b8", skin: SKINS[v % 3],
});
