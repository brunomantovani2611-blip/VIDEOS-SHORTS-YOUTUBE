import React from "react";
import { Composition } from "remotion";
import { SarajevoShort, SARAJEVO_FRAMES } from "./videos/sarajevo/Sarajevo";
import { HojaElenco } from "./videos/sarajevo/HojaElenco";
// Registra cada short nuevo aquí, con su propio id.
export const Root: React.FC = () => (
  <>
    <Composition id="Sarajevo" component={SarajevoShort} durationInFrames={SARAJEVO_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Elenco" component={HojaElenco} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
