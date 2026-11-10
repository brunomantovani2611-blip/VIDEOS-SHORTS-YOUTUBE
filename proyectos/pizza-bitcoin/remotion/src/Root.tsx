import React from "react";
import { Composition } from "remotion";
import { PizzaShort, PIZZA_FRAMES } from "./videos/pizza/Pizza";
export const Root: React.FC = () => (
  <>
    <Composition id="Pizza" component={PizzaShort} durationInFrames={PIZZA_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
