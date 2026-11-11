import React from "react";
import { Composition } from "remotion";
import { TwitterShort, TWITTER_FRAMES } from "./videos/twitter/Twitter";
export const Root: React.FC = () => (
  <>
    <Composition id="Twitter" component={TwitterShort} durationInFrames={TWITTER_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
