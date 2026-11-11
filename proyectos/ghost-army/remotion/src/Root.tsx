import React from "react";
import { Composition } from "remotion";
import { FantasmaShort, FANTASMA_FRAMES } from "./videos/fantasma/Fantasma";
export const Root: React.FC = () => (
  <>
    <Composition id="Fantasma" component={FantasmaShort} durationInFrames={FANTASMA_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
