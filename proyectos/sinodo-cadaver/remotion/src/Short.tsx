import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import PAL from "./palabras.json";

export const FPS = 30;
export const FRAMES = 570;
const INK = "#1b1a1f";
const FONT = "Impact, 'Arial Black', 'DejaVu Sans', sans-serif";
const BG = "#f3ecda";
const E = Easing;
const ip = (t: number, a: number[], b: number[], e: any = E.inOut(E.quad)) =>
  interpolate(t, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
const rad = (d: number) => (d * Math.PI) / 180;
const seg = (x: number, y: number, a: number, l: number): [number, number] => [x + Math.sin(rad(a)) * l, y + Math.cos(rad(a)) * l];
const pop = (t: number, t0: number, d = 0.35) => (t < t0 ? 0 : ip(t - t0, [0, d * 0.6, d], [0, 1.15, 1], E.out(E.quad)));
const bump = (t: number, t0: number, d = 0.25) => (t < t0 || t > t0 + d ? 0 : Math.sin(((t - t0) / d) * Math.PI));

export const T = { knockA: 6.15, guilty: 11.15, splash: 13.45, jail: 14.2, end: 17.4 };
const GROUND = 1450;

type Pose = { armL: [number, number]; armR: [number, number]; legL: [number, number]; legR: [number, number]; tilt: number; mouth: number; brow: number; sad: number; look: number };
const P0: Pose = { armL: [-20, 10], armR: [20, -10], legL: [-8, 4], legR: [10, -4], tilt: 0, mouth: 0, brow: 0, sad: 0, look: 0 };

type Outfit = "pope" | "corpse" | "deacon";
const Fig: React.FC<{ x: number; y: number; s: number; flip?: boolean; rot?: number; outfit: Outfit; seated?: boolean; p: Pose }> = ({ x, y, s, flip, rot = 0, outfit, seated, p }) => {
  const S: [number, number] = [0, -190];
  const arm = (a: [number, number]) => {
    const e = seg(S[0], S[1], a[0], 105);
    const h = seg(e[0], e[1], a[0] + a[1], 95);
    return `M${S[0]},${S[1]} L${e[0]},${e[1]} L${h[0]},${h[1]}`;
  };
  const leg = (a: [number, number]) => {
    const k = seg(0, 0, a[0], 100);
    const f = seg(k[0], k[1], a[0] + a[1], 100);
    return `M0,0 L${k[0]},${k[1]} L${f[0]},${f[1]} L${f[0] + 34},${f[1]}`;
  };
  const robe = outfit === "pope" ? "#8a3a55" : outfit === "corpse" ? "#d9c98e" : "#7e8190";
  const trim = outfit === "deacon" ? "#c9c9d4" : "#d2a932";
  const hem = seated ? 0 : -8;
  const headFill = outfit === "corpse" ? "#e3e9d6" : "#fff";
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${flip ? -s : s},${s})`} stroke={INK} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={leg(p.legL)} />
      <path d={leg(p.legR)} />
      <path d={`M0,-200 Q0,-100 0,0`} />
      {/* túnica */}
      <path d={seated ? `M-36,-196 L36,-196 L52,0 L-52,0 Z` : `M-34,-196 L34,-196 L74,${hem - 40} L-74,${hem - 40} Z`} fill={robe} strokeWidth={14} />
      <path d={`M-10,-196 L10,-196 L${seated ? 12 : 16},${hem - 40} L${seated ? -12 : -16},${hem - 40} Z`} fill={trim} strokeWidth={8} />
      <path d={arm(p.armL)} />
      <path d={arm(p.armR)} />
      <g transform={`translate(0,-270) rotate(${p.tilt})`}>
        {outfit === "pope" || outfit === "corpse" ? (
          <>
            <path d="M-56,-40 L-30,-150 Q0,-172 30,-150 L56,-40 Z" fill={outfit === "corpse" ? "#efe3b0" : "#f2e2a8"} strokeWidth={12} />
            <path d="M-58,-44 L58,-44" strokeWidth={16} stroke={trim} />
            <path d="M0,-132 L0,-92 M-12,-114 L12,-114" strokeWidth={8} stroke="#b23a48" />
          </>
        ) : (
          <path d="M-46,-38 Q0,-100 46,-38 Z" fill="#4a4a55" strokeWidth={10} />
        )}
        <circle r={70} fill={headFill} />
        {outfit === "corpse" ? (
          <g strokeWidth={9}>
            <path d="M-38,-26 L-12,-4 M-12,-26 L-38,-4" />
            <path d="M12,-26 L38,-4 M38,-26 L12,-4" />
            <path d="M-4,8 L0,18 L4,8" strokeWidth={6} />
            <path d="M-34,38 L34,38 M-22,32 L-22,44 M-8,32 L-8,44 M8,32 L8,44 M22,32 L22,44" strokeWidth={6} />
          </g>
        ) : (
          <>
            <circle cx={-24 + p.look * 7} cy={-8} r={8} fill={INK} stroke="none" />
            <circle cx={24 + p.look * 7} cy={-8} r={8} fill={INK} stroke="none" />
            <path d={`M-42,${-30 + p.brow * -6 + p.sad * -8} L-8,${-26 + p.brow * 10 - p.sad * 6}`} strokeWidth={8} />
            <path d={`M42,${-30 + p.brow * -6 + p.sad * -8} L8,${-26 + p.brow * 10 - p.sad * 6}`} strokeWidth={8} />
            {p.sad > 0 ? (
              <path d={`M-26,${42} Q0,${42 - 22 * p.sad} 26,42`} strokeWidth={8} />
            ) : (
              <ellipse cx={0} cy={36} rx={18} ry={4 + p.mouth * 22} fill={INK} stroke="none" />
            )}
          </>
        )}
      </g>
    </g>
  );
};

const Throne: React.FC<{ x: number; seat: number }> = ({ x, seat }) => (
  <g stroke={INK} strokeWidth={14} strokeLinejoin="round">
    <path d={`M${x - 120},${seat + 10} L${x - 120},${seat - 560} Q${x},${seat - 640} ${x + 120},${seat - 560} L${x + 120},${seat + 10} Z`} fill="#a9824a" />
    <path d={`M${x - 70},${seat - 500} L${x + 70},${seat - 500}`} stroke="#d2a932" strokeWidth={10} />
    <rect x={x - 180} y={seat} width={300} height={30} rx={8} fill="#8a6836" />
    <rect x={x - 160} y={seat + 30} width={26} height={GROUND - seat - 30} fill="#8a6836" />
    <rect x={x + 90} y={seat + 30} width={26} height={GROUND - seat - 30} fill="#8a6836" />
  </g>
);

const Arches: React.FC = () => (
  <g stroke="#cfc4a6" strokeWidth={8} fill="none">
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M${60 + i * 340},${GROUND} L${60 + i * 340},760 Q${230 + i * 340},560 ${400 + i * 340},760 L${400 + i * 340},${GROUND}`} />
    ))}
  </g>
);

const Splash: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => {
  if (t < 0) return null;
  return (
    <g stroke={INK} strokeWidth={6} fill="#9cc3d5">
      <ellipse cx={x} cy={y} rx={ip(t, [0, 1], [30, 220], E.out(E.quad))} ry={ip(t, [0, 1], [8, 38], E.out(E.quad))} fill="none" opacity={1 - t} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const a = -30 - i * 20;
        const d = ip(t, [0, 0.8], [0, 180 + (i % 3) * 40], E.out(E.quad));
        return <circle key={i} cx={x + Math.cos(rad(a)) * d * 0.9 * (i % 2 ? -1 : 1)} cy={y + Math.sin(rad(a)) * d + ip(t, [0, 1], [0, 160], E.in(E.quad))} r={14 * (1 - t * 0.5)} opacity={1 - t} />;
      })}
    </g>
  );
};

type W = { w: string; s: number; e: number };
const words = PAL as W[];
const groups: W[][] = [];
{
  let cur: W[] = [];
  for (const w of words) { cur.push(w); if (/[.,]$/.test(w.w) || cur.length >= 3) { groups.push(cur); cur = []; } }
  if (cur.length) groups.push(cur);
}
const Subs: React.FC<{ t: number }> = ({ t }) => {
  let gi = -1;
  for (let i = 0; i < groups.length; i++) if (t >= groups[i][0].s - 0.03) gi = i;
  if (gi < 0) return null;
  const g = groups[gi];
  const end = (groups[gi + 1]?.[0].s ?? 99) - 0.03;
  if (t > Math.min(end, g[g.length - 1].e + 0.35)) return null;
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1640, textAlign: "center", whiteSpace: "nowrap", fontFamily: FONT, fontSize: 66, textTransform: "uppercase", WebkitTextStroke: "12px #1b1a1f", paintOrder: "stroke fill" as any, transform: `scale(${0.92 + 0.08 * pop(t, g[0].s, 0.18)})` }}>
      {g.map((w, i) => {
        const on = t >= w.s - 0.02 && t <= w.e + 0.1;
        return <span key={i} style={{ color: on ? "#ffe14d" : "#fff", display: "inline-block", margin: "0 16px", transform: on ? "scale(1.1)" : "none" }}>{w.w.replace(/[.,]/g, "")}</span>;
      })}
    </div>
  );
};

const Tag: React.FC<{ t: number; t0: number; t1: number; top: number; big: string; small?: string; rot?: number }> = ({ t, t0, t1, top, big, small, rot = -2 }) => {
  if (t < t0 || t > t1) return null;
  const sc = pop(t, t0, 0.3) * ip(t, [t1 - 0.2, t1], [1, 0]);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", transform: `scale(${sc}) rotate(${rot}deg)` }}>
      <div style={{ display: "inline-block", background: "#fff", border: "10px solid #1b1a1f", borderRadius: 26, padding: "14px 40px", boxShadow: "0 12px 0 #1b1a1f", fontFamily: FONT, color: INK }}>
        <div style={{ fontSize: 96, lineHeight: 1.05 }}>{big}</div>
        {small && <div style={{ fontSize: 46, color: "#b23a48" }}>{small}</div>}
      </div>
    </div>
  );
};

export const Short: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const scene = t < 12.0 ? (t < 7.3 ? "A" : t < 10.35 ? "C" : "D") : t < T.jail - 0.1 ? "R" : "J";
  const cam = 1 + ip(t, [0, 19], [0, 0.04], E.linear) + 0.05 * (bump(t, T.knockA, 0.25) + bump(t, T.guilty, 0.3) + bump(t, T.splash, 0.3));
  const shake = (bump(t, T.knockA, 0.25) + bump(t, T.guilty, 0.3) + bump(t, T.splash, 0.35)) * 8;
  const sx = Math.sin(f * 2.3) * shake, sy = Math.cos(f * 3.1) * shake;

  // ---------- poses ----------
  const bob = Math.sin(t * 5) * 0.6;
  const seatY = GROUND - 170;
  const throneX = 760;
  // papa Esteban
  const popeX = t < 7.0 ? ip(t, [2.6, 3.5], [-200, 300], E.out(E.cubic)) : ip(t, [7.0, 7.7], [300, -260], E.in(E.quad));
  const pointing = t > 5.2;
  const pope: Pose = {
    ...P0,
    armR: pointing ? [ip(t, [5.2, 5.6], [20, 100], E.out(E.back(2))), 0] : [20 + bob * 4, -10],
    armL: t > T.knockA ? [-20, 10] : [-25 + bob * 3, 8],
    mouth: t > 5.2 && t < 7.2 ? 0.5 + 0.4 * Math.abs(Math.sin(t * 14)) : 0,
    brow: 1,
  };
  const corpse: Pose = { ...P0, armL: [-60, 5], armR: [58, -4], legL: [-82, 82], legR: [-90, 90], tilt: t > 7.4 && t < 10.3 ? ip(t, [7.6, 9.0], [0, 24]) : t > 10.3 ? 14 : -2 };
  // diácono
  const deaconX = 320;
  const trem = Math.sin(t * 40) * 1.6;
  const deacon: Pose = { ...P0, armL: [-110 + trem, 20], armR: [30 + trem, -30], brow: -1, sad: 0.6, tilt: trem, look: 1 };
  // preso
  const jailT = t - T.jail;
  const lying = t > T.end;
  const prisoner: Pose = { ...P0, armL: [-10, 6], armR: [10, -6], sad: 1, tilt: lying ? 0 : ip(t, [15.5, 17], [0, 14]) };

  const showAD = scene === "A" || scene === "C" || scene === "D";
  const bg = scene === "R" ? "#e6eef0" : scene === "J" ? "#e8e4d8" : BG;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Audio src={staticFile("mezcla.mp3")} />
      <AbsoluteFill style={{ transform: `translate(${sx}px,${sy}px) scale(${cam})`, transformOrigin: "50% 62%" }}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
          {showAD && (
            <g>
              <Arches />
              <rect x={0} y={GROUND} width={1080} height={800} fill="#d9cdb0" />
              <rect x={0} y={GROUND} width={1080} height={14} fill="#b9a98a" />
              <Throne x={throneX} seat={seatY} />
              {/* cadáver sentado */}
              <Fig x={throneX - 20} y={seatY} s={1.7} flip outfit="corpse" seated p={corpse} />
              {/* papa */}
              {t > 2.6 && t < 7.8 && <Fig x={popeX} y={GROUND - 340} s={1.7} outfit="pope" p={pope} />}
              {/* diácono */}
              {t >= 7.3 && <Fig x={ip(t, [7.3, 7.9], [-120, deaconX], E.out(E.cubic))} y={GROUND - 340} s={1.7} outfit="deacon" p={deacon} />}
              {/* gotas de sudor */}
              {t > 8.0 && t < 10.4 && [0, 1, 2].map((i) => {
                const u = ((t * 1.6 + i / 3) % 1);
                return <path key={i} d="M0,-14 Q10,2 0,10 Q-10,2 0,-14" transform={`translate(${deaconX + 80 + i * 22},${GROUND - 330 - 280 + u * 90})`} fill="#7fc2e8" stroke={INK} strokeWidth={4} opacity={1 - u} />;
              })}
            </g>
          )}

          {scene === "R" && (
            <g>
              <rect x={0} y={1180} width={1080} height={740} fill="#8fbcd0" />
              {[0, 1, 2, 3, 4].map((i) => (
                <path key={i} d={`M${-40 + ((t * 40 + i * 230) % 1200)},${1260 + i * 110} q40,-26 80,0 t80,0 t80,0`} stroke="#fff" strokeWidth={8} fill="none" opacity={0.8} />
              ))}
              <path d="M0,1180 Q300,1150 560,1190 L1080,1180" stroke={INK} strokeWidth={10} fill="none" />
              <rect x={0} y={900} width={1080} height={280} fill="#d9cdb0" />
              <path d="M0,900 L1080,900" stroke="#b9a98a" strokeWidth={10} />
              {/* cadáver cayendo */}
              {t < T.splash && (() => {
                const u = ip(t, [12.05, T.splash], [0, 1], E.in(E.quad));
                const cx = ip(u, [0, 1], [1150, 480]);
                const cy = ip(u, [0, 1], [800, 1250]) - Math.sin(u * Math.PI) * 340;
                return <Fig x={cx} y={cy} s={1.3} outfit="corpse" rot={u * 540} p={{ ...P0, armL: [-120, 20], armR: [120, -20], legL: [-60, 20], legR: [60, -20] }} />;
              })()}
              <Splash x={480} y={1250} t={(t - T.splash) / 1.1} />
              {/* orilla con ladrillos */}
              <path d="M0,980 L1080,980 M0,1060 L1080,1060" stroke="#cfc4a6" strokeWidth={6} />
            </g>
          )}

          {scene === "J" && (
            <g>
              <rect x={0} y={GROUND} width={1080} height={800} fill="#bdb49e" />
              <rect x={0} y={GROUND} width={1080} height={14} fill="#9a917b" />
              <g stroke="#cfc4a6" strokeWidth={8} fill="none"><path d="M0,900 L1080,900 M0,1180 L1080,1180" /></g>
              <Fig x={lying ? 300 : 540} y={lying ? GROUND - 20 : GROUND - 250} s={1.7} rot={lying ? ip(t, [T.end, T.end + 0.5], [0, 90]) : 0} outfit="pope" seated={!lying} p={lying ? { ...P0, sad: 1 } : { ...prisoner, legL: [-84, 84], legR: [84, -84] }} />
              {/* barrotes */}
              <g stroke="#3b3b44" strokeWidth={22}>
                {[0, 1, 2, 3, 4, 5, 6].map((i) => <path key={i} d={`M${90 + i * 150},520 L${90 + i * 150},${GROUND + 30}`} />)}
                <path d={`M0,560 L1080,560 M0,${GROUND - 140} L1080,${GROUND - 140}`} strokeWidth={26} />
              </g>
            </g>
          )}
        </svg>

        <Tag t={t} t0={0.1} t1={2.7} top={190} big="ENERO · AÑO 897" small="ROMA" />
        <Tag t={t} t0={14.0} t1={16.3} top={190} big="MESES DESPUÉS" rot={2} />
        <Tag t={t} t0={12.9} t1={14.0} top={190} big="RÍO TÍBER" rot={-2} />
        {t >= T.guilty && t < 12.0 && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", transform: `scale(${pop(t, T.guilty, 0.2) * 1.0}) rotate(-8deg)` }}>
            <span style={{ display: "inline-block", fontFamily: FONT, fontSize: 190, color: "#c92f45", border: "16px solid #c92f45", borderRadius: 20, padding: "0 30px", background: "rgba(255,255,255,0.8)" }}>CULPABLE</span>
          </div>
        )}
      </AbsoluteFill>
      <Subs t={t} />
    </AbsoluteFill>
  );
};
