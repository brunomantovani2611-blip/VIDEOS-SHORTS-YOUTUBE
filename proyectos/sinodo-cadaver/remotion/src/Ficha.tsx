import React from "react";
import { AbsoluteFill } from "remotion";
import { Fig, P0 } from "./Fig";
export const Ficha: React.FC = () => (
  <AbsoluteFill style={{ background: "#f1f1ee" }}>
    <svg width={1600} height={900} viewBox="0 0 1600 900">
      <rect y={800} width={1600} height={100} fill="#dcd8cc" />
      <Fig x={200} y={560} s={1.05} outfit="hoodie" p={{ ...P0, armL: [-30, 10], armR: [120, -80], legL: [-10, 6], legR: [14, -6], mouth: 0 }} />
      <Fig x={520} y={560} s={1.05} outfit="hoodie" p={{ ...P0, armL: [-60, 90], armR: [60, -90], sad: 0, mouth: 0.9, brow: 1, look: 1 }} />
      <Fig x={860} y={560} s={1.05} outfit="pope" p={{ ...P0, armR: [100, 0], mouth: 0.5, brow: 1 }} />
      <Fig x={1160} y={560} s={1.05} outfit="deacon" p={{ ...P0, armL: [-110, 20], armR: [30, -30], sad: 0.6, brow: -1 }} />
      <Fig x={1450} y={680} s={1.05} outfit="corpse" seated p={{ ...P0, legL: [-82, 82], legR: [-90, 90], armL: [-60, 5], armR: [58, -4] }} />
    </svg>
  </AbsoluteFill>
);
