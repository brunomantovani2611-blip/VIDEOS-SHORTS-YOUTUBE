// Fotos sueltas de prueba (un solo empaquetado). Uso: node herramientas/fotos.mjs out/x_ 20,100,200 [escala=0.5]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [prefix, frames, scale = "0.5"] = process.argv.slice(2);
const chromiumOptions = { gl: process.platform === "linux" ? "swangle" : "angle" };
const inputProps = { post: { dpr: Number(scale) } };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "Fantasma", chromiumOptions, inputProps });
const onBrowserLog = (l) => { if (l.type === "error" && !l.text.includes("404")) console.log("[error]", l.text.slice(0, 400)); };
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${f}.jpg`, imageFormat: "jpeg", jpegQuality: 88, scale: Number(scale), chromiumOptions, inputProps, timeoutInMilliseconds: 240000, onBrowserLog });
  console.log("foto", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
