// Hoja de personajes para revisar el vestuario (composición de prueba, no va en el short).
import React, { useEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen, bodyFront, Outfit, Expr } from "./toon";
import { ARCHIDUQUE, SOFIA, CHOFER, POTIOREK, PRINCIP, CONSPIRADOR, GENDARME, VECINO } from "./elenco";

const LIST: [string, Outfit, Expr][] = [
  ["Archiduque", ARCHIDUQUE, "stern"], ["Sofía", SOFIA, "smile"], ["Chofer", CHOFER, "nervous"], ["Potiorek", POTIOREK, "shout"],
  ["Princip", PRINCIP, "stern"], ["Consp. 1", CONSPIRADOR(0), "nervous"], ["Consp. 2", CONSPIRADOR(1), "stern"], ["Gendarme", GENDARME, "stern"],
  ["Vecino fez", VECINO(0), "grin"], ["Vecina", VECINO(1), "smile"], ["Bombín", VECINO(2), "laugh"], ["Copa", VECINO(5), "smile_closed"],
];

export const HojaElenco: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.fillStyle = "#cfe3f2"; g.fillRect(0, 0, 1080, 1920);
    LIST.forEach(([name, o, expr], i) => {
      const cx = (i % 3) * 360, cy = Math.floor(i / 3) * 480;
      g.save(); g.translate(cx + 30, cy + 10); g.scale(0.5, 0.42);
      bodyFront(new Pen(g), o, { mode: "stand", expr, seed: i + 1 });
      g.restore();
      g.fillStyle = "#241726"; g.font = "bold 30px sans-serif"; g.fillText(name, cx + 40, cy + 470);
    });
  }, []);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} /></AbsoluteFill>;
};
