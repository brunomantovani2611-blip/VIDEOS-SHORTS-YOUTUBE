import React from "react";
import { Composition } from "remotion";
import { EiffelShort, EIFFEL_FRAMES } from "./videos/eiffel/Eiffel";
export const Root: React.FC = () => (
  <>
    <Composition id="Eiffel" component={EiffelShort} durationInFrames={EIFFEL_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
