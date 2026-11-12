import React from "react";
import { Composition } from "remotion";
import { Mov, FRAMES } from "./Mov";
export const Root: React.FC = () => <Composition id="Mov" component={Mov} durationInFrames={FRAMES} fps={30} width={1080} height={1920} />;
