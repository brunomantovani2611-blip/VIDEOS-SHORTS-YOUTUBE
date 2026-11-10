// «Las pizzas de mil millones de dólares»: short vertical de ~43 s en el estilo «personajes 2D en un mundo 3D».
// Un mundo three.js (world.ts) colocado cuadro a cuadro desde la línea de tiempo (story.ts). Cadena de post de la
// plantilla: tinta -> desenfoque -> bloom -> mapeo NEUTRAL -> corrección de color (MSAA 4). Encima, en HTML, las
// cifras discretas arriba del cuadro, el fogonazo del gancho y los cuadros en negro tras los disparos.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World, loadKit } from "./world";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur } from "./lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "./grade";
import { Kit } from "./build";
import { TOTAL, FLASH_AT, BLACK, SHOTS, CIFRAS, layersAt, dofAt } from "./story";

export const PIZZA_FRAMES = TOTAL;

type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean };
const toggles = (): PostToggles => ({ ink: true, lens: true, pre: true, bloom: true, grade: true, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("pizza kit"));
  useEffect(() => { loadKit().then((k) => { setKit(k); continueRender(handle); }); }, [handle]);
  return kit;
};

const Inner: React.FC<{ id: number; kit: Kit }> = ({ id, kit }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(kit), [kit]);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [camera, scene]);
  useEffect(() => () => { try { (fx.ink as unknown as { dispose?: () => void }).dispose?.(); } catch { /* ya liberado */ } }, [fx]);
  const post = useMemo(() => {
    const kids: JSX.Element[] = [];
    if (on.ink) kids.push(<primitive key="ink" object={fx.ink} dispose={null} />);
    if (on.lens && on.pre) kids.push(<primitive key="pre" object={fx.lens.pre} dispose={null} />);
    if (on.lens) kids.push(<primitive key="lens" object={fx.lens.main} dispose={null} />);
    if (on.bloom) kids.push(<primitive key="bloom" object={fx.bloom} dispose={null} />);
    kids.push(<primitive key="tone" object={fx.tone} dispose={null} />);
    if (on.grade) kids.push(<primitive key="grade" object={fx.grade} dispose={null} />);
    return <EffectComposer multisampling={4}>{kids}</EffectComposer>;
  }, [fx, on]);
  const cam = camera as THREE.PerspectiveCamera;
  const target = world.update(id, f, cam, scene);
  noInkFallback(world.root);
  const d = dofAt(f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f)); else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  gradeFor(fx.grade, SHOTS[id - 1].light);
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
const ShotView: React.FC<{ id: number; kit: Kit; alpha: number }> = ({ id, kit, alpha }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={1080} height={1920} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 40, near: 0.15, far: 1500 }}>
      <Inner id={id} kit={kit} />
    </ThreeCanvas>
  </AbsoluteFill>
);

/** cifra discreta arriba del cuadro: entra con un pequeño golpe de escala, sin tapar a nadie */
const Cifra: React.FC<{ f: number }> = ({ f }) => {
  const c = CIFRAS.find(([a, b]) => f >= a && f < b);
  if (!c) return null;
  const [a, b, txt] = c;
  const sIn = interpolate(f - a, [0, 4, 7], [0.6, 1.08, 1], { extrapolateRight: "clamp" });
  const op = interpolate(f, [a, a + 3, b - 4, b], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 210 }}>
      <div style={{ transform: `scale(${sIn})`, opacity: op, fontFamily: '"DejaVu Sans", Arial, sans-serif', fontWeight: 900, fontSize: 84,
        color: "#fff7e6", letterSpacing: 1, WebkitTextStroke: "10px #241726", paintOrder: "stroke fill", textShadow: "0 6px 0 rgba(36,23,38,.35)" }}>
        {txt}
      </div>
    </AbsoluteFill>
  );
};

export const PizzaShort: React.FC = () => {
  const f = useCurrentFrame();
  const kit = useKit();
  if (!kit) return null;
  const flash = f >= FLASH_AT && f < FLASH_AT + 4 ? [1, 0.75, 0.45, 0.2][f - FLASH_AT] : 0;
  const black = f >= BLACK[0] && f < BLACK[1];
  return (
    <AbsoluteFill style={{ background: "#cfe3f2" }}>
      {layersAt(f).map((l, i) => <ShotView key={i ? "over" : "base"} id={l.id} kit={kit} alpha={l.alpha} />)}
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      {black && <AbsoluteFill style={{ background: "#0b0910" }} />}
      <Cifra f={f} />
    </AbsoluteFill>
  );
};
