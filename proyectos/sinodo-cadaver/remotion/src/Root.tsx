import React from "react";
import { Composition } from "remotion";
import { Short, FRAMES } from "./Short";
export const Root: React.FC = () => (
  <Composition id="Sinodo" component={Short} durationInFrames={FRAMES} fps={30} width={1080} height={1920} />
);
