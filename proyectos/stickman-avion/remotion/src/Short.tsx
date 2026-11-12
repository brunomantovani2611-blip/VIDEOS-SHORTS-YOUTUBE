import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import PAL from "./palabras.json";

export const FPS = 30;
export const FRAMES = 300;
const INK = "#15151a";
const FONT = "Impact, 'Arial Black', 'DejaVu Sans', sans-serif";

const E = Easing;
const ip = (t: number, a: number[], b: number[], e: any = E.inOut(E.quad)) =>
  interpolate(t, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
const rad = (d: number) => (d * Math.PI) / 180;
const seg = (x: number, y: number, a: number, l: number): [number, number] => [x + Math.sin(rad(a)) * l, y + Math.cos(rad(a)) * l];
const pop = (t: number, t0: number, d = 0.35) => (t < t0 ? 0 : ip(t - t0, [0, d * 0.6, d], [0, 1.15, 1], E.out(E.quad)));
const bump = (t: number, t0: number, d = 0.25) => (t < t0 || t > t0 + d ? 0 : Math.sin(((t - t0) / d) * Math.PI));

// ---- tiempos (segundos) compartidos con el audio ----
export const T = {
  planeIn: 0.15, gulp: 1.95, card: 2.7,
  chunks: [3.9, 4.4, 4.9, 5.35, 5.8, 6.2, 6.6, 7.0],
  fin: 8.15,
};

type Pose = {
  armL: [number, number]; armR: [number, number]; legL: [number, number]; legR: [number, number];
  mouth: number; smile: number; look: number; belly: number; tilt: number; brow: number;
};

const Stick: React.FC<{ x: number; y: number; s: number; p: Pose }> = ({ x, y, s, p }) => {
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
  const m = p.mouth;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} stroke={INK} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={leg(p.legL)} />
      <path d={leg(p.legR)} />
      <path d={`M0,-200 Q${p.belly * 70},-100 0,0`} />
      <path d={arm(p.armL)} />
      <path d={arm(p.armR)} />
      <g transform={`translate(0,-270) rotate(${p.tilt})`}>
        <circle cx={0} cy={0} r={70} fill="#fff" />
        {/* ojos */}
        <circle cx={-24} cy={-14} r={13} fill="#fff" strokeWidth={7} />
        <circle cx={24} cy={-14} r={13} fill="#fff" strokeWidth={7} />
        <circle cx={-24 + p.look * 6} cy={-14} r={5.5} fill={INK} stroke="none" />
        <circle cx={24 + p.look * 6} cy={-14} r={5.5} fill={INK} stroke="none" />
        <path d={`M-42,${-38 - p.brow * 8} L-8,${-32 + p.brow * 6}`} strokeWidth={8} />
        <path d={`M42,${-38 - p.brow * 8} L8,${-32 + p.brow * 6}`} strokeWidth={8} />
        {p.smile > 0 ? (
          <path d={`M-30,26 Q0,${26 + 46 * p.smile} 30,26`} strokeWidth={9} fill="none" />
        ) : (
          <g stroke="none">
            <ellipse cx={0} cy={30} rx={20 + m * 24} ry={4 + m * 36} fill={INK} />
            {m > 0.45 && <ellipse cx={0} cy={30 + m * 20} rx={14 + m * 10} ry={m * 11} fill="#ff5d73" />}
          </g>
        )}
      </g>
    </g>
  );
};

const Plane: React.FC<{ x: number; y: number; s: number; r: number; prop: number }> = ({ x, y, s, r, prop }) => (
  <g transform={`translate(${x},${y}) rotate(${r}) scale(${s})`} stroke={INK} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round">
    <path d="M-30,-20 L-85,-95 L-45,-95 L20,-20 Z" fill="#e8394a" />
    <path d="M-180,-5 Q-180,-55 -120,-55 L110,-55 Q190,-55 200,0 L200,40 Q190,70 120,70 L-120,70 Q-180,70 -180,30 Z" fill="#fff" />
    <path d="M-175,10 L195,10 L195,38 L-175,38 Z" fill="#e8394a" stroke="none" />
    <path d="M-210,-3 L-185,-3 L-230,-70 L-205,-70 Z" fill="#e8394a" />
    <path d="M60,-52 L150,-52 L172,-6 L60,-6 Z" fill="#7fd6ff" />
    <path d="M-90,20 L40,20 L10,130 L-60,130 Z" fill="#fff" />
    <circle cx={-40} cy={150} r={22} fill={INK} />
    <circle cx={90} cy={150} r={22} fill={INK} />
    <path d="M-40,110 L-40,140 M90,70 L90,140" />
    <ellipse cx={206} cy={20} rx={7} ry={20 + 50 * Math.abs(Math.sin(prop))} fill="#bbb" stroke="none" />
    <rect x={198} y={-6} width={16} height={52} rx={6} fill="#555" />
  </g>
);

const Chunk: React.FC<{ x: number; y: number; s: number; r: number; k: number }> = ({ x, y, s, r, k }) => {
  const shapes = [
    "M-40,-30 L30,-40 L48,10 L-10,38 L-46,12 Z",
    "M-45,-20 L40,-30 L35,25 L-40,30 Z",
    "M-30,-40 L40,-10 L20,38 L-38,20 Z",
  ];
  return (
    <g transform={`translate(${x},${y}) rotate(${r}) scale(${s})`} stroke={INK} strokeWidth={8} strokeLinejoin="round">
      <path d={shapes[k % 3]} fill={k % 2 ? "#b7bcc7" : "#e8394a"} />
      <path d="M-14,-10 L12,-14" strokeLinecap="round" stroke="#fff" strokeWidth={6} />
    </g>
  );
};

const Cloud: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} fill="#fff" opacity={0.9}>
    <ellipse cx={0} cy={0} rx={120} ry={46} />
    <ellipse cx={-50} cy={-30} rx={60} ry={44} />
    <ellipse cx={30} cy={-44} rx={70} ry={52} />
  </g>
);

const Star: React.FC<{ x: number; y: number; s: number; r: number; c?: string }> = ({ x, y, s, r, c = "#ffe14d" }) => (
  <path transform={`translate(${x},${y}) rotate(${r}) scale(${s})`} d="M0,-30 L9,-9 L32,-9 L14,6 L20,28 L0,15 L-20,28 L-14,6 L-32,-9 L-9,-9 Z" fill={c} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
);

// grupos de subtítulos
type W = { w: string; s: number; e: number };
const words = PAL as W[];
const groups: W[][] = [];
{
  let cur: W[] = [];
  for (const w of words) {
    cur.push(w);
    if (/[.,]$/.test(w.w) || cur.length >= 3) { groups.push(cur); cur = []; }
  }
  if (cur.length) groups.push(cur);
}

const Subs: React.FC<{ t: number }> = ({ t }) => {
  let gi = -1;
  for (let i = 0; i < groups.length; i++) if (t >= groups[i][0].s - 0.03) gi = i;
  if (gi < 0) return null;
  const g = groups[gi];
  const end = (groups[gi + 1]?.[0].s ?? 99) - 0.03;
  if (t > Math.min(end, g[g.length - 1].e + 0.35)) return null;
  const sc = 0.9 + 0.1 * pop(t, g[0].s, 0.18);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1650, textAlign: "center", whiteSpace: "nowrap", fontFamily: FONT, fontSize: 78, lineHeight: 1.05, letterSpacing: 2, transform: `scale(${sc})`, textTransform: "uppercase", WebkitTextStroke: "12px #15151a", paintOrder: "stroke fill" as any }}>
      {g.map((w, i) => {
        const on = t >= w.s - 0.02 && t <= w.e + 0.1;
        return <span key={i} style={{ color: on ? "#ffe14d" : "#fff", display: "inline-block", margin: "0 18px", transform: on ? "scale(1.12)" : "none" }}>{w.w.replace(/[.,]/g, "")}</span>;
      })}
    </div>
  );
};

export const Short: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;

  // ---- cámara ----
  const punch = 0.05 * (bump(t, T.gulp, 0.3) + bump(t, T.fin, 0.35)) + 0.025 * bump(t, T.card, 0.25);
  const cam = 1 + punch + ip(t, [0, 10], [0, 0.03], E.linear);
  const shake = bump(t, T.gulp, 0.35) * 9 + bump(t, T.fin, 0.3) * 6;
  const sx = Math.sin(f * 2.3) * shake, sy = Math.cos(f * 3.1) * shake;

  // ---- stickman base ----
  const X0 = 400, Y0 = 1130, SC = 2.0;
  const idle = Math.sin(t * 5) * 0.5;
  const chunkIdx = T.chunks.filter((c) => t >= c + 0.45).length;
  const belly = Math.min(1.1, 0.25 + (t > T.gulp ? 0.35 : 0) + chunkIdx * 0.09);
  // boca: abierta al llegar el avión / cuando entran pedazos / mastica
  let mouth = 0;
  if (t < 0.7) mouth = ip(t, [0.2, 0.7], [0, 0.5]);
  else if (t < T.gulp) mouth = ip(t, [0.7, 1.3], [0.5, 1]);
  else if (t < T.gulp + 0.25) mouth = ip(t, [T.gulp, T.gulp + 0.2], [1, 0], E.out(E.quad));
  let chewing = false;
  for (const c of T.chunks) {
    if (t >= c - 0.3 && t < c + 0.45) mouth = ip(t, [c - 0.3, c + 0.2], [0.2, 1]);
    if (t >= c + 0.45 && t < c + 0.8) { chewing = true; mouth = 0.15 + 0.35 * Math.abs(Math.sin((t - c) * 16)); }
  }
  if (t >= T.fin - 0.2) mouth = 0;
  const smile = t >= T.fin - 0.2 ? ip(t, [T.fin - 0.2, T.fin + 0.2], [0, 1]) : 0;

  const done = t >= T.fin;
  const pose: Pose = {
    armL: done ? [ip(t, [T.fin, T.fin + 0.3], [-20, -35]) , 0] : [-22 + idle * 4, 14],
    armR: done
      ? [ip(t, [T.fin, T.fin + 0.35], [20, 155], E.out(E.back(2))), ip(t, [T.fin, T.fin + 0.35], [0, -60])]
      : [22 - idle * 4, -14],
    legL: [-10, 6], legR: [12, -6],
    mouth, smile, look: t < T.gulp ? 1 : 0, belly, tilt: Math.sin(t * 6) * (chewing ? 4 : 1.5),
    brow: t < T.gulp ? 1 : 0,
  };
  // palmadas a la panza al final
  if (done) {
    const pat = Math.sin((t - T.fin) * 14) * 8;
    pose.armL = [-40 + pat * 0.5, 100 + pat];
  }
  const bobY = done ? -Math.abs(Math.sin((t - T.fin) * 7)) * 22 : Math.abs(Math.sin(t * 5)) * -4;
  const mouthX = X0, mouthY = Y0 - 240 * SC + bobY;

  // ---- avión del gancho ----
  const pt = ip(t, [T.planeIn, T.gulp - 0.05], [0, 1], E.in(E.quad));
  const px = ip(pt, [0, 1], [1150, mouthX + 40]);
  const py = ip(pt, [0, 1], [420, mouthY - 10]) + Math.sin(t * 6) * 14 * (1 - pt);
  const ps = ip(pt, [0, 0.7, 1], [1.7, 1.3, 0.05], E.out(E.quad));
  const pr = ip(pt, [0, 1], [-4, -28]) + 180 - 180; // inclina hacia la boca
  const showPlane = t >= T.planeIn && t < T.gulp;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(#5ec9f5,#c8f0ff)" }}>
      <Audio src={staticFile("mezcla.mp3")} />
      <AbsoluteFill style={{ transform: `translate(${sx}px,${sy}px) scale(${cam})`, transformOrigin: "50% 60%" }}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
          {/* sol y nubes */}
          <circle cx={900} cy={250} r={90} fill="#ffe14d" />
          <Cloud x={((t * 25) % 1500) - 200} y={420} s={1.1} />
          <Cloud x={((t * 15 + 800) % 1500) - 200} y={760} s={0.8} />
          {/* suelo */}
          <rect x={0} y={Y0 + 400} width={1080} height={700} fill="#4cb963" />
          <rect x={0} y={Y0 + 400} width={1080} height={18} fill="#2f8f45" />
          <ellipse cx={X0 + 20} cy={Y0 + 410} rx={170} ry={20} fill="#1d6b34" opacity={0.5} />

          <g transform={`translate(0,${bobY})`}>
            <Stick x={X0} y={Y0} s={SC} p={pose} />
          </g>

          {showPlane && <Plane x={px} y={py} s={ps} r={pr} prop={t * 40} />}

          {/* pedazos de metal */}
          {T.chunks.map((c, i) => {
            const u = (t - (c - 0.3)) / 0.7;
            if (u < 0 || u > 1) return null;
            const e = E.in(E.quad)(u);
            const sx0 = 1130, sy0 = 780 + ((i * 137) % 5) * 70;
            const cx = ip(e, [0, 1], [sx0, mouthX + 36]);
            const cy = ip(e, [0, 1], [sy0, mouthY + 12]) - Math.sin(e * Math.PI) * 140;
            return <Chunk key={i} x={cx} y={cy} s={ip(e, [0, 1], [2.0, 0.35])} r={e * 540} k={i} />;
          })}

          {/* destellos del final */}
          {done && [0, 1, 2, 3, 4].map((i) => {
            const a = i * 72 + (t - T.fin) * 50;
            const rr = 380 + 40 * Math.sin(t * 4 + i);
            return <Star key={i} x={X0 + 280 + Math.cos(rad(a)) * rr * 0.55} y={Y0 - 520 + Math.sin(rad(a)) * rr * 0.55} s={pop(t, T.fin + 0.1 + i * 0.07) * 0.9} r={a} />;
          })}

          {/* ¡GLUP! */}
          {t >= T.gulp && t < T.gulp + 0.9 && (
            <g transform={`translate(${X0 + 170},${Y0 - 600}) rotate(-10) scale(${pop(t, T.gulp, 0.25) * ip(t, [T.gulp + 0.6, T.gulp + 0.9], [1, 0])})`}>
              <text textAnchor="middle" fontFamily={FONT} fontSize={110} fill="#ffe14d" stroke={INK} strokeWidth={14} paintOrder="stroke" letterSpacing={2}>¡GLUP!</text>
            </g>
          )}
        </svg>

        {/* gancho */}
        {t < T.card - 0.1 && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 130, textAlign: "center", fontFamily: FONT, fontSize: 150, lineHeight: 1.0, color: "#fff", WebkitTextStroke: "16px #15151a", paintOrder: "stroke fill" as any, transform: `scale(${pop(t, 0.1, 0.35) * ip(t, [T.card - 0.25, T.card - 0.1], [1, 0])}) rotate(-3deg)` }}>
            SE COMIÓ<br />UN AVIÓN
          </div>
        )}
        {/* tarjeta de nombre */}
        {t >= T.card && !done && (
          <div style={{ position: "absolute", left: 0, right: 0, top: ip(t, [T.card, T.card + 0.35], [-300, 120], E.out(E.back(1.6))), textAlign: "center" }}>
            <div style={{ display: "inline-block", background: "#fff", border: "10px solid #15151a", borderRadius: 28, padding: "18px 44px", boxShadow: "0 14px 0 #15151a", fontFamily: FONT, color: INK }}>
              <div style={{ fontSize: 100, lineHeight: 1 }}>MICHEL LOTITO</div>
              <div style={{ fontSize: 48, color: "#e8394a", marginTop: 6 }}>«MONSIEUR MANGETOUT»</div>
            </div>
          </div>
        )}
        {/* contador de días */}
        {t >= 3.7 && !done && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", transform: `scale(${pop(t, 3.7, 0.3)})` }}>
            <div style={{ display: "inline-block", background: "#15151a", borderRadius: 22, padding: "10px 36px", fontFamily: FONT, fontSize: 84, color: "#ffe14d" }}>
              DÍA {Math.round(ip(t, [3.9, 7.6], [1, 730], E.linear))}
            </div>
          </div>
        )}
        {/* final */}
        {done && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: FONT, fontSize: 140, lineHeight: 1.0, color: "#7dffa0", WebkitTextStroke: "16px #15151a", paintOrder: "stroke fill" as any, transform: `scale(${pop(t, T.fin + 0.05, 0.4)}) rotate(2deg)` }}>
            ¡NUNCA SE<br />ENFERMÓ!
          </div>
        )}
      </AbsoluteFill>
      <Subs t={t} />
    </AbsoluteFill>
  );
};
