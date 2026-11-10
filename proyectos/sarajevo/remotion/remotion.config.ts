import { Config } from "@remotion/cli/config";
// Sin tarjeta gráfica en Linux: SwiftShader por software. En Mac/Windows con GPU: angle.
Config.setChromiumOpenGlRenderer(process.platform === "linux" ? "swangle" : "angle");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setDelayRenderTimeoutInMilliseconds(300000);
