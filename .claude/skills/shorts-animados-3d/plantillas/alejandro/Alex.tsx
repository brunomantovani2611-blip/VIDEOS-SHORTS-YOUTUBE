// "Alejandro Magno" test short (6.8 s) in the flat-characters-in-a-3D-toon-world style, with the template's post
// chain: InkPass -> lens blur pre + main -> bloom -> NEUTRAL tone map -> grade, MSAA 4. Shot changes crossfade by
// stacking a second canvas. Captions and voice are added afterwards with ffmpeg (one word at a time).
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, getInputProps } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import { BlendFunction, BloomEffect, EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World } from "./world";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur } from "./lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "./grade";
import { layersAt, dofAt, camAt, MARKS, smooth } from "./story";

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const Inner: React.FC<{ id: number }> = ({ id }) => {
  const f = useCurrentFrame();
  const { camera, scene, gl, size } = useThree();
  const world = useMemo(() => new World(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  // the R3F <EffectComposer> (3.2.x) rendered blank under Remotion here: drive postprocessing's composer by hand
  const composer = useMemo(() => {
    const c = new EffectComposer(gl, { multisampling: 4, frameBufferType: THREE.HalfFloatType });
    c.addPass(new RenderPass(scene, camera));
    c.addPass(fx.ink);
    c.addPass(new EffectPass(camera, fx.lens.pre));
    c.addPass(new EffectPass(camera, fx.lens.main));
    c.addPass(new EffectPass(camera, fx.bloom, fx.tone, fx.grade));
    return c;
  }, [gl, scene, camera, fx]);
  useEffect(() => { composer.setSize(size.width, size.height); }, [composer, size.width, size.height]);
  useFrame(() => { composer.render(); }, 1);
  const cam = camera as THREE.PerspectiveCamera;
  const target = world.update(id, f, cam, scene);
  noInkFallback(world.root);
  const d = dofAt(id, f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus); else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  gradeFor(fx.grade, "golden");
  return <primitive object={world.root} dispose={null} />;
};

const dprOverride = () => (getInputProps() as { dpr?: number }).dpr;
const ShotView: React.FC<{ id: number; alpha: number }> = ({ id, alpha }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={1080} height={1920} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows
      gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.2, far: 1500 }}>
      <Inner id={id} />
    </ThreeCanvas>
  </AbsoluteFill>
);

// ---- aerial markers: the ground rectangle of each army is traced like a pen stroke, then its number pops in ----
const pc = new THREE.PerspectiveCamera(56, 1080 / 1920, 1, 5000), pv = new THREE.Vector3();
const toScreen = (x: number, z: number) => { pv.set(x, 0, z).project(pc); return [(pv.x + 1) * 540, (1 - pv.y) * 960] as const; };
const Marks: React.FC<{ f: number }> = ({ f }) => {
  const live = MARKS.filter((m) => f >= m.a && f <= m.b);
  if (!live.length) return null;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}>
        {live.map((m) => {
          const c = camAt(m.shot, f);
          pc.position.set(...c.pos); pc.fov = c.fov; pc.updateProjectionMatrix(); pc.lookAt(...c.look); pc.updateMatrixWorld();
          const u = smooth((f - m.a) / 14), pop = smooth((f - m.a - 10) / 6), out = 1 - smooth((f - (m.b - 6)) / 6);
          const [x0, z0, x1, z1] = m.rect;
          const pts = [toScreen(x0, z0), toScreen(x1, z0), toScreen(x1, z1), toScreen(x0, z1)];
          const d = `M${pts.map((q) => q.join(",")).join("L")}Z`;
          let per = 0; for (let i = 0; i < 4; i++) { const a = pts[i], b = pts[(i + 1) % 4]; per += Math.hypot(b[0] - a[0], b[1] - a[1]); }
          const cx = (pts[0][0] + pts[1][0] + pts[2][0] + pts[3][0]) / 4, top = Math.min(...pts.map((q) => q[1]));
                    // Luis v5: no box around the armies, the number sits quietly at the top of the frame, not on the army
          void per; void cx; void top; void d; void u;
          return (
            <g key={m.label} opacity={out}>
              <g transform={`translate(540,300) scale(${0.85 + 0.15 * pop})`} opacity={pop}>
                <text textAnchor="middle" y={0} fontFamily="Arial Rounded MT Bold" fontSize={88} fill={m.col}
                  stroke="#1a1010" strokeWidth={8} paintOrder="stroke">{m.label}</text>
                <text textAnchor="middle" y={52} fontFamily="Arial Rounded MT Bold" fontSize={42} fill="#fff"
                  stroke="#1a1010" strokeWidth={7} paintOrder="stroke">{m.sub}</text>
              </g>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const AlexShort: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#b48a6a" }}>
      {layersAt(f).map((l) => <ShotView key={`shot${l.id}`} id={l.id} alpha={l.alpha} />)}
      <Marks f={f} />
      {!(getInputProps() as { mute?: boolean }).mute && <Audio src={staticFile("voz/voz2_final.wav")} />}
    </AbsoluteFill>
  );
};
