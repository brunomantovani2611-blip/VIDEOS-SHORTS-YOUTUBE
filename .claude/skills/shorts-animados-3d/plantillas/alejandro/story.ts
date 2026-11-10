// Timeline of the Alexander short v2 (9.8 s), timed to public/voz/voz2_final.wav (palabras2.json).
// Camera grammar from the 30 fps study: the camera never stops (slow push-in creep on holds), moves are symmetric
// smootherstep glides of 18-46 frames, a change of place is a 6-frame crossfade.
export const FPS = 30;
export const TOTAL = 295;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
const smoother = (x: number) => { const u = clamp01(x); return u * u * u * (u * (6 * u - 15) + 10); };

// words (frames): Alejandro 0 · Magno 16 · llegó 28 · con 37 · 47,000 46 · hombres 85 · Enfrente 106 · lo 119 ·
// esperaban 132 · 100,000 148 · persas 169 · con 191 · elefantes 203 · carros 233 · de 242 · guerra 246 · y 256 · caballería 260-284

type Key = { f: number; pos: V3; look: V3; fov: number; glide?: boolean };
export type ShotDef = { id: number; a: number; b: number; keys: Key[]; fog: [number, number] };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 110, fog: [120, 1500], keys: [
    { f: 0, pos: [0.25, 2.0, 4.9], look: [0, 2.3, 0], fov: 40 }, // Alexander face on, his men behind him
    { f: 14, pos: [0.2, 2.0, 4.5], look: [0, 2.3, 0], fov: 40 },
    { f: 42, pos: [-2.7, 2.3, -1.3], look: [0.5, 1.8, -9], fov: 44, glide: true }, // we pass in front of him, into his ranks
    { f: 80, pos: [0, 44, 12], look: [0, 0, -30], fov: 56, glide: true }, // up: all 47,000 of them
    { f: 110, pos: [0, 45, 13], look: [0, 0, -30], fov: 56 },
  ] },
  { id: 2, a: 104, b: 192, fog: [260, 1100], keys: [
    { f: 104, pos: [0.4, 2.3, 40.5], look: [0, 2.5, 47], fov: 40 }, // Darius in his chariot, face on, his host behind
    { f: 114, pos: [0.35, 2.3, 41.1], look: [0, 2.5, 47], fov: 40 },
    { f: 136, pos: [3.3, 3.0, 49.8], look: [-1, 2.2, 63], fov: 46, glide: true }, // past him, into the host
    { f: 168, pos: [0, 60, -110], look: [0, 0, 90], fov: 58, glide: true }, // up and back: it never ends
    { f: 192, pos: [0, 61.5, -113], look: [0, 0, 90], fov: 58 },
  ] },
  { id: 3, a: 186, b: TOTAL, fog: [120, 1500], keys: [
    { f: 186, pos: [-15, 2.3, 37], look: [0, 3.0, 38], fov: 40 }, // side on: the elephants walk past
    { f: 226, pos: [-14, 2.25, 36], look: [0, 3.0, 37], fov: 40 },
    { f: 244, pos: [-9, 1.35, 26], look: [0, 1.5, 25], fov: 38, glide: true }, // down to the scythed chariots
    { f: 256, pos: [-8.6, 1.35, 25.2], look: [0, 1.5, 24.4], fov: 38 },
    { f: 276, pos: [-34, 10, 8], look: [6, 1.5, 36], fov: 46, glide: true }, // wide: cavalry, elephants, the host
    { f: TOTAL, pos: [-35, 10.6, 6.8], look: [6, 1.5, 36], fov: 46 },
  ] },
];
export const XFADE = 6;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const camAt = (id: number, f: number) => {
  const k = SHOTS[id - 1].keys;
  if (f <= k[0].f) return { pos: k[0].pos, look: k[0].look, fov: k[0].fov };
  for (let i = 1; i < k.length; i++) if (f <= k[i].f) {
    const u = (f - k[i - 1].f) / (k[i].f - k[i - 1].f), t = k[i].glide ? smoother(u) : u;
    return { pos: lerp3(k[i - 1].pos, k[i].pos, t), look: lerp3(k[i - 1].look, k[i].look, t), fov: lerp(k[i - 1].fov, k[i].fov, t) };
  }
  const l = k[k.length - 1];
  return { pos: l.pos, look: l.look, fov: l.fov };
};

/** one or two layers: each next shot fades in over the previous one for XFADE frames */
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (let i = SHOTS.length - 1; i > 0; i--) {
    const a = SHOTS[i].a;
    if (f >= a + XFADE) return [{ id: i + 1, alpha: 1 }];
    if (f >= a) return [{ id: i, alpha: 1 }, { id: i + 1, alpha: (f - a + 1) / (XFADE + 1) }];
  }
  return [{ id: 1, alpha: 1 }];
};

// ---- slow motion as the camera reaches the scythed chariots (Luis v4): the world clock runs at 22 % ----
const SLOW = { in0: 236, in1: 243, out0: 260, out1: 270, rate: 0.22 };
const rateAt = (f: number) => 1 - (1 - SLOW.rate) * (smooth((f - SLOW.in0) / (SLOW.in1 - SLOW.in0)) - smooth((f - SLOW.out0) / (SLOW.out1 - SLOW.out0)));
const WF = (() => { const a = [0]; for (let f = 1; f <= TOTAL + 2; f++) a.push(a[f - 1] + rateAt(f - 0.5)); return a; })();
/** world-clock frame (fractional) for an output frame */
export const worldF = (f: number) => { const i = Math.max(0, Math.min(TOTAL + 1, Math.floor(f))); return WF[i] + (WF[i + 1] - WF[i]) * (f - i); };

/** thin-lens depth of field: cInf = blur at infinity (px at 1080p); focus point (default = camera look) */
export const dofAt = (id: number, f: number): { cInf: number; focus?: V3 } => {
  if (id === 1) return f < 16 ? { cInf: 14, focus: [0, 2.35, 0] } : { cInf: lerp(10, 0, smooth((f - 30) / 30)) };
  if (id === 2) return f < 116 ? { cInf: 12, focus: [0, 2.4, 47] } : { cInf: lerp(9, 0, smooth((f - 130) / 26)) };
  if (f < 226) return { cInf: 9, focus: [0, 3, elephantZ(worldF(f) / FPS)] };
  if (f < 256) return { cInf: 8 };
  return { cInf: lerp(8, 0, smooth((f - 256) / 20)) };
};

// ---- the Persian charge (side-view cards move toward -z) ----
export const elephantZ = (t: number) => 41 - 1.7 * (t - 6.2);
export const chariotZ = (t: number) => 25 - 7.5 * (t - 8.0);
export const cavalryZ = (t: number) => 46 - 3.2 * (t - 6.2);
export const gait = (t: number, hz: number) => Math.floor(((((t * hz) % 1) + 1) % 1) * 8) / 8;

// ---- aerial markers (screen overlay in Alex.tsx) ----
export const MARKS = [
  { shot: 1, a: 62, b: 104, label: "47,000", sub: "de Alejandro", rect: [-17, -49, 17, -12] as [number, number, number, number], col: "#ffffff" },
  { shot: 2, a: 158, b: 190, label: "100,000", sub: "persas", rect: [-133, 44, 133, 254] as [number, number, number, number], col: "#ffd23f" },
];
