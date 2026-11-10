import React from "react";
import { Composition } from "remotion";
import { MonaShort, MONA_FRAMES } from "./videos/mona/Mona";
export const Root: React.FC = () => (
  <>
    <Composition id="Mona" component={MonaShort} durationInFrames={MONA_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
