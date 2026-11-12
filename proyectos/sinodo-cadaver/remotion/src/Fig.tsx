import React from "react";
export const INK = "#1b1a1f";
const rad = (d: number) => (d * Math.PI) / 180;
const seg = (x: number, y: number, a: number, l: number): [number, number] => [x + Math.sin(rad(a)) * l, y + Math.cos(rad(a)) * l];

export type Pose = { armL: [number, number]; armR: [number, number]; legL: [number, number]; legR: [number, number]; tilt: number; mouth: number; brow: number; sad: number; look: number };
export const P0: Pose = { armL: [-20, 10], armR: [20, -10], legL: [-8, 4], legR: [10, -4], tilt: 0, mouth: 0, brow: 0, sad: 0, look: 0 };
export type OutfitName = "pope" | "corpse" | "deacon" | "hoodie";

const OUT: Record<OutfitName, { top: string; shade: string; bottom: string; shoe: string; robe: boolean; hat: "mitre" | "tonsure" | "hair"; skull?: boolean; trim: string }> = {
  hoodie: { top: "#4f78b5", shade: "#3d5f93", bottom: "#2f3d5c", shoe: "#4f78b5", robe: false, hat: "hair", trim: "#4f78b5" },
  pope: { top: "#8a3a55", shade: "#6d2c43", bottom: "#8a3a55", shoe: "#2a2a30", robe: true, hat: "mitre", trim: "#d2a932" },
  corpse: { top: "#d9c98e", shade: "#bfae72", bottom: "#d9c98e", shoe: "#8a8a8a", robe: true, hat: "mitre", skull: true, trim: "#d2a932" },
  deacon: { top: "#7e8190", shade: "#666978", bottom: "#7e8190", shoe: "#2a2a30", robe: true, hat: "tonsure", trim: "#c9c9d4" },
};

const Thick: React.FC<{ d: string; c: string; w: number }> = ({ d, c, w }) => (
  <>
    <path d={d} stroke={INK} strokeWidth={w + 10} />
    <path d={d} stroke={c} strokeWidth={w} />
  </>
);

export const Fig: React.FC<{ x: number; y: number; s: number; flip?: boolean; rot?: number; outfit: OutfitName; seated?: boolean; p: Pose }> = ({ x, y, s, flip, rot = 0, outfit, seated, p }) => {
  const o = OUT[outfit];
  const SL: [number, number] = [-44, -184], SR: [number, number] = [44, -184];
  const armPts = (sh: [number, number], a: [number, number]) => {
    const e = seg(sh[0], sh[1], a[0], 100);
    const h = seg(e[0], e[1], a[0] + a[1], 92);
    return { e, h };
  };
  const aL = armPts(SL, p.armL), aR = armPts(SR, p.armR);
  const legPts = (hx: number, a: [number, number]) => {
    const k = seg(hx, 0, a[0], 104);
    const f = seg(k[0], k[1], a[0] + a[1], 100);
    return { k, f, d: `M${hx},0 L${k[0]},${k[1]} L${f[0]},${f[1]}` };
  };
  const lL = legPts(-22, p.legL), lR = legPts(22, p.legR);
  const shoe = (f: [number, number]) => (
    <g transform={`translate(${f[0] + 14},${f[1] + 6})`} strokeWidth={6}>
      <ellipse cx={0} cy={0} rx={34} ry={18} fill={o.shoe} />
      <path d="M-30,10 L34,10" stroke="#fff" strokeWidth={9} />
    </g>
  );
  const sleeve = (sh: [number, number], a: { e: [number, number]; h: [number, number] }) => (
    <g>
      <Thick d={`M${sh[0]},${sh[1]} L${a.e[0]},${a.e[1]}`} c={o.top} w={34} />
      {o.robe ? <Thick d={`M${a.e[0]},${a.e[1]} L${a.h[0]},${a.h[1]}`} c={o.top} w={30} /> : <path d={`M${a.e[0]},${a.e[1]} L${a.h[0]},${a.h[1]}`} stroke={INK} strokeWidth={13} />}
      <circle cx={a.h[0]} cy={a.h[1]} r={o.robe ? 15 : 14} fill={o.robe ? "#fff" : INK} strokeWidth={o.robe ? 6 : 0} />
    </g>
  );
  const torso = o.robe
    ? seated ? "M-48,-198 Q0,-216 48,-198 L56,0 L-56,0 Z" : "M-48,-198 Q0,-216 48,-198 L92,-26 Q0,-4 -92,-26 Z"
    : "M-50,-198 Q0,-216 50,-198 L52,-14 Q0,0 -52,-14 Z";
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${flip ? -s : s},${s})`} strokeLinecap="round" strokeLinejoin="round" fill="none" stroke={INK} strokeWidth={6}>
      {/* piernas */}
      {!o.robe || seated ? (
        <g>
          <Thick d={lL.d} c={o.bottom} w={34} />
          <Thick d={lR.d} c={o.bottom} w={34} />
        </g>
      ) : (
        <g>
          <path d={`M-22,-20 L${lL.f[0]},${lL.f[1]}`} strokeWidth={14} />
          <path d={`M22,-20 L${lR.f[0]},${lR.f[1]}`} strokeWidth={14} />
        </g>
      )}
      {shoe(lL.f)}
      {shoe(lR.f)}
      {/* torso */}
      <path d={torso} fill={o.top} strokeWidth={7} />
      <path d={o.robe ? (seated ? "M-48,-60 L-56,0 L-20,0 Z" : "M-70,-60 L-92,-26 Q-40,-12 -10,-12 Z") : "M-50,-60 L-52,-14 Q-20,-4 -8,-8 Z"} fill={o.shade} stroke="none" opacity={0.55} />
      {o.robe ? (
        <path d={`M-12,-204 L12,-204 L${seated ? 14 : 22},${seated ? -2 : -22} L${seated ? -14 : -22},${seated ? -2 : -22} Z`} fill={o.trim} strokeWidth={5} />
      ) : (
        <g>
          <path d="M-34,-200 Q0,-170 34,-200" strokeWidth={6} />
          <path d="M-30,-70 L30,-70 M-30,-70 L-24,-30 M30,-70 L24,-30" strokeWidth={5} />
        </g>
      )}
      {/* brazos */}
      {sleeve(SL, aL)}
      {sleeve(SR, aR)}
      {/* cabeza */}
      <g transform={`translate(0,-290) rotate(${p.tilt})`}>
        <circle r={76} fill={o.skull ? "#e3e9d6" : "#fff"} strokeWidth={7} />
        {o.hat === "hair" && (
          <path d="M-74,-14 L-80,-58 L-52,-46 L-42,-96 L-14,-62 L6,-104 L26,-64 L54,-92 L58,-52 L84,-58 L76,-12 Q50,-44 0,-40 Q-48,-44 -74,-14 Z" fill="#5a3d2e" strokeWidth={6} />
        )}
        {o.hat === "mitre" && (
          <g>
            <path d="M-58,-34 L-32,-156 Q0,-182 32,-156 L58,-34 Z" fill={o.skull ? "#efe3b0" : "#f2e2a8"} strokeWidth={7} />
            <path d="M-60,-38 L60,-38" strokeWidth={14} stroke={o.trim} />
            <path d="M0,-138 L0,-96 M-12,-118 L12,-118" strokeWidth={7} stroke="#b23a48" />
          </g>
        )}
        {o.hat === "tonsure" && <path d="M-44,-34 Q0,-104 44,-34 Z" fill="#4a4a55" strokeWidth={6} />}
        {o.skull ? (
          <g strokeWidth={8}>
            <path d="M-38,-22 L-14,2 M-14,-22 L-38,2" />
            <path d="M14,-22 L38,2 M38,-22 L14,2" />
            <path d="M-4,12 L0,22 L4,12" strokeWidth={6} />
            <path d="M-34,42 L34,42 M-22,36 L-22,48 M-8,36 L-8,48 M8,36 L8,48 M22,36 L22,48" strokeWidth={6} />
          </g>
        ) : (
          <g>
            <circle cx={-26 + p.look * 6} cy={-4} r={8} fill={INK} stroke="none" />
            <circle cx={26 + p.look * 6} cy={-4} r={8} fill={INK} stroke="none" />
            <path d={`M-42,${-24 - p.brow * 4 - p.sad * 6} L-12,${-20 + p.brow * 10 - p.sad * 8}`} strokeWidth={6} />
            <path d={`M42,${-24 - p.brow * 4 - p.sad * 6} L12,${-20 + p.brow * 10 - p.sad * 8}`} strokeWidth={6} />
            {p.sad > 0 ? (
              <path d="M-20,46 Q0,30 20,46" strokeWidth={6} />
            ) : p.mouth > 0.05 ? (
              <ellipse cx={0} cy={38} rx={16 + p.mouth * 4} ry={4 + p.mouth * 22} fill={INK} stroke="none" />
            ) : (
              <path d="M-16,34 Q0,46 16,34" strokeWidth={6} />
            )}
          </g>
        )}
      </g>
    </g>
  );
};
