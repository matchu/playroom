import { build } from "esbuild";
import svg from "esbuild-plugin-svg";

// Build hydrogen-web's CSS files
await build({
  entryPoints: [
    "hydrogen-web/src/platform/web/ui/css/main.css",
    "hydrogen-web/src/platform/web/ui/css/themes/element/theme.css",
  ],
  bundle: true,
  external: [
    // TODO: Idk why doing this with a wildcard didn't work, esbuild says it
    //       supports them? But I tried a lot of variants and all failed…
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-Black.woff?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-Black.woff2?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-BlackItalic.woff?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-BlackItalic.woff2?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-Bold.woff?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-Bold.woff2?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-BoldItalic.woff?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-BoldItalic.woff2?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-ExtraBold.woff?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-ExtraBold.woff2?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-ExtraBoldItalic.woff?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-ExtraBoldItalic.woff2?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-ExtraLight.woff?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-ExtraLight.woff2?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-ExtraLightItalic.woff?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-ExtraLightItalic.woff2?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-Italic.woff?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-Italic.woff2?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-Light.woff?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-Light.woff2?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-LightItalic.woff?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-LightItalic.woff2?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-Medium.woff?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-Medium.woff2?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-MediumItalic.woff?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-MediumItalic.woff2?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-Regular.woff?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-Regular.woff2?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-SemiBold.woff?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-SemiBold.woff2?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-SemiBoldItalic.woff?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-SemiBoldItalic.woff2?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-Thin.woff?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-Thin.woff2?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-ThinItalic.woff?v=3.13",
    "./node_modules/hydrogen-web/src/platform/web/ui/css/themes/element/inter/Inter-ThinItalic.woff2?v=3.13",
  ],
  outdir: "../styles/lib/hydrogen-web",
  plugins: [svg()],
});
