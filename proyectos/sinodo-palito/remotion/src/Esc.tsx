import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import PAL from "./palabras.json";
import { Palito } from "./Rig";
export const ESC_FRAMES = 396;
const FONT = "Impact, 'Arial Black', 'DejaVu Sans', sans-serif";
const ip = (t: number, a: number[], b: number[], e: any = Easing.inOut(Easing.sin)) => interpolate(t, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
const rnd = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

type W = { w: string; s: number; e: number };
const words = PAL as W[];
const groups: W[][] = [];
{ let cur: W[] = []; for (const w of words) { cur.push(w); if (/[.,:]$/.test(w.w) || cur.length >= 3) { groups.push(cur); cur = []; } } if (cur.length) groups.push(cur); }
const Subs: React.FC<{ t: number }> = ({ t }) => {
  let gi = -1;
  for (let i = 0; i < groups.length; i++) if (t >= groups[i][0].s - 0.03) gi = i;
  if (gi < 0) return null;
  const g = groups[gi];
  const end = (groups[gi + 1]?.[0].s ?? 99) - 0.03;
  if (t > Math.min(end, g[g.length - 1].e + 0.4)) return null;
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1640, textAlign: "center", whiteSpace: "nowrap", fontFamily: FONT, fontSize: 74, textTransform: "uppercase", WebkitTextStroke: "12px #0b0b10", paintOrder: "stroke fill" as any }}>
      {g.map((w, i) => {
        const on = t >= w.s - 0.02 && t <= w.e + 0.1;
        return <span key={i} style={{ color: on ? "#ffe14d" : "#fff", display: "inline-block", margin: "0 14px", transform: on ? "scale(1.1)" : "none" }}>{w.w.replace(/[.,:]/g, "")}</span>;
      })}
    </div>
  );
};

export const Esc: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  // cámara: plano abierto con empuje hacia el trono → plano cerrado en Palito + trono
  const z = t < 8 ? ip(t, [0, 8], [1.0, 1.12]) : ip(t, [8, 8.5, 13.2], [1.12, 1.28, 1.36]);
  const cx = t < 8 ? ip(t, [0, 8], [50, 62]) : ip(t, [8, 8.5], [62, 46]);
  const cy = t < 8 ? ip(t, [0, 8], [60, 62]) : ip(t, [8, 8.5], [62, 66]);
  const shock = ip(t, [0.9, 1.4, 6.0, 6.5], [0, 1, 1, 0]);
  const worry = ip(t, [6.4, 6.9], [0, 1]);
  const face = t < 0.9 ? "cara1" : t < 6.4 ? "cara2" : t < 8.0 ? "cara3" : "cara1";
  return (
    <AbsoluteFill style={{ background: "#05060a" }}>
      <Audio src={staticFile("mezcla_prueba.mp3")} />
      <AbsoluteFill style={{ transform: `scale(${z}) translate(${Math.sin(t * 1.2) * 3}px,${Math.cos(t * 1.0) * 3}px)`, transformOrigin: `${cx}% ${cy}%` }}>
        <Img src={staticFile("fondo1.png")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }} />
        <AbsoluteFill style={{ mixBlendMode: "screen", background: `radial-gradient(ellipse 40% 18% at 6% 38%, rgba(255,150,40,${0.18 + 0.09 * Math.sin(t * 27) + 0.06 * Math.sin(t * 69)}), transparent 70%), radial-gradient(ellipse 34% 14% at 82% 41%, rgba(255,150,40,${0.16 + 0.08 * Math.sin(t * 31 + 1)}), transparent 70%)` }} />
        <Palito t={t} x={330} footY={1640} S={1.5} shock={shock} worry={worry} talk={0} face={face} />
      </AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, mixBlendMode: "screen", pointerEvents: "none" }}>
        {Array.from({ length: 40 }).map((_, i) => {
          const x = (rnd(i + 9) * 1200 + t * (8 + rnd(i) * 22)) % 1180 - 50;
          const y = (rnd(i + 17) * 2000 - t * (6 + rnd(i + 5) * 16) + 4000) % 2000;
          return <circle key={i} cx={x} cy={y} r={1.5 + rnd(i + 31) * 3} fill="#ffe3b0" opacity={0.15 + 0.3 * rnd(i + 41)} />;
        })}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.5) 100%)" }} />
      <Subs t={t} />
    </AbsoluteFill>
  );
};
