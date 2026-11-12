import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
export const RIG_FRAMES = 195;
const ip = (t: number, a: number[], b: number[]) => interpolate(t, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });

const Part: React.FC<{ src: string; w: number; h: number; x: number; y: number; px: number; py: number; rot?: number; z?: number; children?: React.ReactNode }> = ({ src, w, h, x, y, px, py, rot = 0, z = 0, children }) => (
  <div style={{ position: "absolute", left: x - px, top: y - py, width: w, height: h, transformOrigin: `${px}px ${py}px`, transform: `rotate(${rot}deg)`, zIndex: z }}>
    <Img src={staticFile(`partes/${src}.png`)} style={{ width: w, height: h, display: "block" }} />
    {children}
  </div>
);

export const Rig: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const wave = (k: number, p = 0) => Math.sin(t * k + p);
  // fases
  const shock = ip(t, [1.5, 2.0, 3.3, 3.8], [0, 1, 1, 0]);
  const worry = ip(t, [3.4, 3.9, 5.0, 5.4], [0, 1, 1, 0]);
  const talk = ip(t, [5.4, 5.8, 7.0, 7.4], [0, 1, 1, 0]);
  const face = t < 1.6 ? "cara1" : t < 3.5 ? "cara2" : t < 5.4 ? "cara3" : t < 7.2 ? (Math.sin(t * 13) > 0 ? "cara5" : "cara4") : "cara1";
  const rotL = 4 + wave(2.2) * 1.2 + shock * 30 + worry * 5 + talk * 8;
  const rotR = -4 - wave(2.2, 1) * 1.2 - shock * 30 + worry * 32 - talk * (22 + Math.sin(t * 5) * 10);
  const foreL = 3 + shock * 12 + worry * 6 - talk * 5;
  const foreR = -3 - shock * 12 + worry * 140 - talk * 18;
  const headTilt = wave(2.2, 0.4) * 1.2 - shock * 5 + worry * 4;
  const bob = Math.abs(wave(2.2)) * -1.6 - shock * 8;
  const step = shock * 14 - worry * 6;
  const S = 1.7;
  const footY = 1500, cx = 540;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#10131c, #1d2230 70%, #2a2a2c)" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: footY, height: 420, background: "#3b352c" }} />
      <div style={{ position: "absolute", left: cx - 72 * S, top: footY - 470 * S + bob * S, width: 144, height: 480, transformOrigin: "0 0", transform: `scale(${S})` }}>
        {/* piernas */}
        <Part src="piernaL" w={67} h={240} x={56 - step * 0.3} y={240} px={33} py={10} rot={-2 - step * 0.4} z={1} />
        <Part src="piernaR" w={67} h={240} x={90 + step * 0.3} y={240} px={33} py={10} rot={2 + step * 0.4} z={1} />
        {/* torso */}
        <Part src="torso" w={144} h={267} x={0} y={0} px={0} py={0} z={3} />
        {/* mangas con antebrazos */}
        <Part src="mangaL" w={90} h={185} x={28} y={45} px={80} py={14} rot={rotL} z={5}>
          <Part src="antebrazoL" w={50} h={163} x={50} y={176} px={25} py={6} rot={foreL} z={-1} />
        </Part>
        <Part src="mangaR" w={89} h={184} x={116} y={45} px={8} py={14} rot={rotR} z={5}>
          <Part src="antebrazoR" w={50} h={163} x={43} y={176} px={25} py={6} rot={foreR} z={-1} />
        </Part>
        {/* cabeza + cara */}
        <Part src="cabeza" w={129} h={129} x={72} y={-36} px={64.5} py={64.5} rot={headTilt} z={6}>
          <Part src={face} w={face === "cara1" ? 104 : face === "cara2" ? 102 : face === "cara3" ? 104 : face === "cara4" ? 102 : 98} h={72} x={64.5} y={68} px={face === "cara5" ? 49 : 51} py={36} z={1} />
        </Part>
      </div>
    </AbsoluteFill>
  );
};
