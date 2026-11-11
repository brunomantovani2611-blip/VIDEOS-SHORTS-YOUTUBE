import React from "react";
import { Composition } from "remotion";
import { OsoShort, OSO_FRAMES } from "./videos/oso/Oso";
export const Root: React.FC = () => (
  <>
    <Composition id="Oso" component={OsoShort} durationInFrames={OSO_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
