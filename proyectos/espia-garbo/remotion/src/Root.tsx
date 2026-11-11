import React from "react";
import { Composition } from "remotion";
import { GarboShort, GARBO_FRAMES } from "./videos/garbo/Garbo";
export const Root: React.FC = () => (
  <>
    <Composition id="Garbo" component={GarboShort} durationInFrames={GARBO_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
