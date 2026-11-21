import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import run from "@rollup/plugin-run";
import typescript from "@rollup/plugin-typescript";

const buildAndRun = process.env?.ROLLUP_RUN === "true";

// The image ships without node_modules, so production bundles every package. In dev they are
// installed: leave them to Node, so the watcher only compiles our own files.
const isDev = process.env?.NODE_ENV === "development";
const isPackage = (id, importer) =>
  !!importer &&
  !id.startsWith(".") &&
  !id.startsWith("/") &&
  !id.startsWith("\0");

/** @type {import('rollup').RollupOptions} */
export default {
  strictDeprecations: true,

  input: "src/index.ts",
  external: isDev ? isPackage : undefined,
  output: {
    file: "dist/index.js",
    format: "esm",
    sourcemap: true,
    inlineDynamicImports: true,
  },
  watch: {
    clearScreen: false,
  },

  plugins: [
    typescript({ compilerOptions: { rootDir: "src", outDir: "dist" } }),
    nodeResolve({
      preferBuiltins: true,
      exportConditions: ["node"],
    }),
    commonjs(),
    json(),
    buildAndRun &&
      run({
        execArgv: ["--enable-source-maps"],
      }),
  ],
};
