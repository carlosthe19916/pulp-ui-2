import run from "@rollup/plugin-run";
import { defineConfig } from "rolldown";

const buildAndRun = process.env?.RUN_SERVER === "true";

// The image ships without node_modules, so production bundles every package. In dev they are
// installed: leave them to Node, so the watcher only compiles our own files.
const isDev = process.env?.NODE_ENV === "development";
const isPackage = (id, importer) =>
  !!importer &&
  !id.startsWith(".") &&
  !id.startsWith("/") &&
  !id.startsWith("\0");

// TypeScript, Node resolution, CommonJS and JSON are built into Rolldown. Type checking stays
// with `npm run lint` (tsc).
export default defineConfig({
  input: "src/index.ts",
  platform: "node",
  external: isDev ? isPackage : undefined,
  output: {
    file: "dist/index.js",
    format: "esm",
    sourcemap: true,
    // One file: CopilotKit's dynamic imports are inlined, not split into chunks.
    codeSplitting: false,
  },
  watch: {
    clearScreen: false,
  },
  plugins: [
    buildAndRun &&
      run({
        execArgv: ["--enable-source-maps"],
      }),
  ],
});
