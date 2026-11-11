import React from "react";
import { Composition } from "remotion";
import { SilbatoShort, SILBATO_FRAMES } from "./videos/silbato/Silbato";
export const Root: React.FC = () => (
  <>
    <Composition id="Silbato" component={SilbatoShort} durationInFrames={SILBATO_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
