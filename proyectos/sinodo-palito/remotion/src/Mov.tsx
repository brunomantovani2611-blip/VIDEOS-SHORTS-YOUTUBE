import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import PAL from "./palabras.json";
export const FPS = 30;
export const FRAMES = 396; // 13,2 s
const FONT = "Impact, 'Arial Black', 'DejaVu Sans', sans-serif";
const ip = (t: number, a: number[], b: number[], e: any = Easing.inOut(Easing.quad)) => interpolate(t, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
const rnd = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

// escenas: imagen, inicio, fin, cámara (zoom inicial→final, centro de enfoque inicial→final, en %)
const SC = [
  { img: "e1.png", a: 0, b: 8.4, z: [1.0, 1.16], from: [30, 70], to: [60, 55] },
  { img: "e2.png", a: 8.0, b: 13.2, z: [1.14, 1.0], from: [32, 62], to: [50, 55] },
];

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
    <div style={{ position: "absolute", left: 40, right: 40, top: 1560, textAlign: "center", whiteSpace: "nowrap", fontFamily: FONT, fontSize: 74, textTransform: "uppercase", WebkitTextStroke: "12px #0b0b10", paintOrder: "stroke fill" as any }}>
      {g.map((w, i) => {
        const on = t >= w.s - 0.02 && t <= w.e + 0.1;
        return <span key={i} style={{ color: on ? "#ffe14d" : "#fff", display: "inline-block", margin: "0 14px", transform: on ? "scale(1.1)" : "none" }}>{w.w.replace(/[.,:]/g, "")}</span>;
      })}
    </div>
  );
};

export const Mov: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  return (
    <AbsoluteFill style={{ background: "#05060a" }}>
      <Audio src={staticFile("mezcla_prueba.mp3")} />
      {SC.map((s, i) => {
        if (t < s.a || t > s.b) return null;
        const u = (t - s.a) / (s.b - s.a);
        const z = ip(u, [0, 1], s.z, Easing.inOut(Easing.sin));
        const cx = ip(u, [0, 1], [s.from[0], s.to[0]]), cy = ip(u, [0, 1], [s.from[1], s.to[1]]);
        const op = i === 0 ? ip(t, [s.b - 0.5, s.b], [1, 0]) : ip(t, [s.a, s.a + 0.5], [0, 1]);
        const sway = Math.sin(t * 1.3 + i) * 5;
        return (
          <AbsoluteFill key={i} style={{ opacity: op, transform: `translate(${sway}px,${Math.cos(t * 1.1) * 4}px) scale(${z})`, transformOrigin: `${cx}% ${cy}%` }}>
            <Img src={staticFile(s.img)} style={{ width: 1080, height: 1920 }} />
          </AbsoluteFill>
        );
      })}
      {/* luz de antorchas parpadeante */}
      <AbsoluteFill style={{ mixBlendMode: "screen", background: `radial-gradient(ellipse 70% 40% at 0% 55%, rgba(255,150,40,${0.20 + 0.10 * Math.sin(f * 0.9) + 0.07 * Math.sin(f * 2.3 + 1)}), transparent 70%), radial-gradient(ellipse 60% 35% at 100% 60%, rgba(255,140,40,${0.12 + 0.08 * Math.sin(f * 1.1 + 2) + 0.05 * Math.sin(f * 2.9)}), transparent 70%)` }} />
      {/* polvo flotando */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>
        {Array.from({ length: 46 }).map((_, i) => {
          const sp = 8 + rnd(i) * 24;
          const x = (rnd(i + 9) * 1200 + t * sp * (rnd(i + 3) > 0.5 ? 1 : -0.6)) % 1180 - 50;
          const y = (rnd(i + 17) * 2000 - t * (6 + rnd(i + 5) * 18) + 4000) % 2000;
          return <circle key={i} cx={x} cy={y} r={1.5 + rnd(i + 31) * 3.2} fill="#ffe3b0" opacity={0.15 + 0.35 * rnd(i + 41) * (0.6 + 0.4 * Math.sin(t * 2 + i))} />;
        })}
      </svg>
      {/* viñeta */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
      <Subs t={t} />
    </AbsoluteFill>
  );
};
