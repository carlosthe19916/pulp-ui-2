import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import virtual from "@rollup/plugin-virtual";
import ejs from "ejs";
import { defineConfig } from "tsdown";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const pathTo = (...relativePath) => path.resolve(__dirname, ...relativePath);

const baseBrandingPath = process.env.BRANDING ?? "./branding";
const brandingPath = pathTo("../", baseBrandingPath);
// strings.json holds EJS placeholders (`<%= brandingRoot %>`); a `.json` id loads as JSON, so the
// virtual module is the rendered JSON itself.
const stringsJson = ejs.render(
  readFileSync(path.resolve(brandingPath, "./strings.json"), "utf8"),
  { brandingRoot: "branding" },
);
JSON.parse(stringsJson); // fail the build early on invalid branding JSON

console.log("Using branding assets from:", brandingPath);

// tsdown (Rolldown) builds both formats and the declarations; isolatedDeclarations in tsconfig
// lets it write them with Oxc instead of tsc.
export default defineConfig({
  entry: "src/index.ts",
  format: ["esm", "cjs"],
  platform: "neutral",
  fixedExtension: true,
  sourcemap: true,
  dts: true,
  // Watch mode would empty dist while Vite reads dist/branding; `prebuild` cleans for builds.
  clean: false,
  // The branding folder, whatever its name, becomes dist/branding.
  copy: [{ from: brandingPath, to: "dist", rename: "branding" }],
  plugins: [virtual({ "@branding/strings.json": stringsJson })],
});
