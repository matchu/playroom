import * as fs from "fs";
import * as path from "path";
import { build, analyzeMetafile } from "esbuild";
import svg from "esbuild-plugin-svg";

// Build hydrogen-web's JS files
await buildFilesAndPrintSummary({
  entryPoints: ["node_modules/hydrogen-web/src/lib.ts"],
  bundle: true,
  format: "esm",
  external: [
    "node-html-parser",
    "fake-indexeddb/lib/FDBFactory.js",
    "fake-indexeddb/lib/FDBKeyRange.js",
  ],
  define: {
    DEFINE_VERSION: JSON.stringify(
      JSON.parse(
        fs.readFileSync(
          path.join("node_modules/hydrogen-web/package.json"),
          "utf8"
        )
      ).version
    ),
  },
  outfile: "scripts/lib/hydrogen-web.js",
});

// Build hydrogen-web's CSS files
await buildFilesAndPrintSummary({
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
  outdir: "styles/lib/hydrogen",
  plugins: [svg()],
});

async function buildFilesAndPrintSummary(options) {
  const result = await build({ ...options, metafile: true });

  // Print a summary of the files and their sizes.
  const { outputs } = result.metafile;
  for (const [filename, result] of Object.entries(outputs)) {
    console.log(`${filename}: ${formatBytes(result.bytes)}`);
  }

  // If we ran `ANALYZE=1 npm run build`, explain the file size a bit more.
  if (process.env["ANALYZE"]) {
    console.log(await analyzeMetafile(result.metafile));
  }
}

// https://stackoverflow.com/a/18650828/107415
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
