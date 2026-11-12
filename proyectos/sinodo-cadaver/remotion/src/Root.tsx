import React from "react";
import { Composition } from "remotion";
import { Short, FRAMES } from "./Short";
import { Ficha } from "./Ficha";
export const Root: React.FC = () => (
  <>
  <Composition id="Ficha" component={Ficha} durationInFrames={1} fps={30} width={1600} height={900} />
  <Composition id="Sinodo" component={Short} durationInFrames={FRAMES} fps={30} width={1080} height={1920} />
  </>
);
