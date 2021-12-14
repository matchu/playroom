import fs from "fs";
import * as path from "path";

import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import typescript from "@rollup/plugin-typescript";

// Read the current version of hydrogen-web from its package.json file.
// hydrogen-web expects this to be injected as a global named `DEFINE_VERSION`.
const hydrogenVersion = JSON.parse(
  fs.readFileSync(path.join("node_modules/hydrogen-web/package.json"), "utf8")
).version;

export default [
  {
    input: "node_modules/hydrogen-web/src/lib.ts",
    external: [/^fake-indexeddb\b/, /^node-html-parser\b/],
    output: {
      file: "../scripts/lib/hydrogen-web.js",
      format: "es",
      compact: true,
      sourcemap: true,
      banner: `var DEFINE_VERSION = ${JSON.stringify(hydrogenVersion)};`,
    },
    plugins: [
      commonjs(),
      nodeResolve({ browser: true, preferBuiltins: false }),
      typescript({ tsconfig: "node_modules/hydrogen-web/tsconfig.json" }),
      terser(),
    ],
    onwarn: (message) => {
      // hydrogen-web contains a lot of circular dependencies, and that's not
      // something we can address. Hide the warnings.
      if (
        message.code === "CIRCULAR_DEPENDENCY" &&
        message.cycle.every((path) =>
          path.match(/^node_modules\/hydrogen-web\//)
        )
      ) {
        return;
      }
      console.error(message);
    },
  },
];
