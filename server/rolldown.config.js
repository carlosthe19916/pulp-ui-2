import run from "@rollup/plugin-run";
import { defineConfig } from "rolldown";

const buildAndRun = process.env?.RUN_SERVER === "true";

// TypeScript, Node resolution, CommonJS and JSON are built into Rolldown. Type checking stays
// with `npm run lint` (tsc).
export default defineConfig({
  input: "src/index.ts",
  platform: "node",
  output: {
    file: "dist/index.js",
    format: "esm",
    sourcemap: true,
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
