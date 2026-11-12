import React from "react";
import { Composition } from "remotion";
import { Mov, FRAMES } from "./Mov";
import { Rig, RIG_FRAMES } from "./Rig";
import { Esc, ESC_FRAMES } from "./Esc";
export const Root: React.FC = () => (
  <>
    <Composition id="Mov" component={Mov} durationInFrames={FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Esc" component={Esc} durationInFrames={ESC_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Rig" component={Rig} durationInFrames={RIG_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
