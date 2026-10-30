/// <reference types="vitest/config" />

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vite";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import { viteStaticCopy } from "vite-plugin-static-copy";
import IstanbulPlugin from "vite-plugin-istanbul";

import {
  brandingStrings,
  PULP_ENV,
  encodeEnv,
  SERVER_ENV_KEYS,
  rewritePulpApiPath,
} from "@pulp-ui/common";

const require = createRequire(import.meta.url);
export const brandingAssetPath = () =>
  `${require
    .resolve("@pulp-ui/common/package.json")
    .replace(/(.)\/package.json$/, "$1")}/dist/branding`;

const brandingPath: string = brandingAssetPath();
const manifestPath = path.resolve(brandingPath, "manifest.json");
const faviconPath = path.resolve(brandingPath, "favicon.ico");

// https://vite.dev/config/
export default defineConfig({
  base: process.env.BASE_URL,
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    {
      name: "ignore-process-env",
      transform(code) {
        return code.replace(/process\.env/g, "({})");
      },
    },
    viteStaticCopy({
      targets: [
        {
          src: manifestPath,
          dest: ".",
        },
        {
          src: brandingPath,
          dest: ".",
        },
        {
          src: faviconPath,
          dest: ".",
        },
      ],
    }),
    ...(process.env.NODE_ENV === "development"
      ? [
          ViteEjsPlugin({
            _env: encodeEnv(PULP_ENV, SERVER_ENV_KEYS),
            branding: brandingStrings,
          }),
        ]
      : []),
    ...(process.env.NODE_ENV === "production"
      ? [
          {
            name: "copy-index",
            closeBundle: () => {
              const distDir = path.resolve(__dirname, "dist");
              const src = path.join(distDir, "index.html");
              const dest = path.join(distDir, "index.html.ejs");

              if (fs.existsSync(src)) {
                fs.renameSync(src, dest);
              }
            },
          },
        ]
      : []),
    ...(process.env.COVERAGE === "true"
      ? [
          IstanbulPlugin({
            include: "src/*",
            exclude: ["node_modules", "test/"],
            extension: [".js", ".jsx", ".ts", ".tsx"],
            requireEnv: false,
            checkProd: false,
            forceBuildInstrument: true,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "./src/app"),
      "@catalog": path.resolve(__dirname, "./src/catalog"),
    },
  },
  // Scan every source file for deps up front: coverage transforms untested files late,
  // and a dep found then makes Vite re-optimize mid-run and hang the browser tests.
  optimizeDeps: {
    entries: ["src/**/*.{ts,tsx}"],
  },
  build: {
    rollupOptions: {
      output: {
        // Group only modules already in the graph into stable vendor chunks.
        // The function form (vs. a list of package names) avoids force-resolving
        // a package's barrel, which would pull in tree-shaken-away optional deps.
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }
          if (id.includes("/react/") || id.includes("/react-dom/")) {
            return "react";
          }
          // Before the PatternFly rule: the code editor is only imported lazily, so leave it
          // to the lazy chunk instead of the eager one (a named chunk would cycle with react).
          if (
            id.includes("/monaco-editor/") ||
            id.includes("/@monaco-editor/") ||
            id.includes("/@patternfly/react-code-editor/")
          ) {
            return undefined;
          }
          // Topology stays in its lazy route chunk with d3 and mobx.
          if (
            id.includes("/@patternfly/") &&
            !id.includes("/@patternfly/react-topology/")
          ) {
            return "patternfly";
          }
          return undefined;
        },
      },
    },
    sourcemap: process.env.NODE_ENV === "development",
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        // Session cookies from the browser login flow are forwarded automatically.
        // Do not inject Basic Auth here — that fights cookie/session auth (ADR Decision 6).
        target: PULP_ENV.PULP_API_URL || "http://localhost:8080",
        rewrite: (path) =>
          rewritePulpApiPath(path, PULP_ENV.PULP_API_ROOT ?? ""),
        changeOrigin: true,
        cookieDomainRewrite: "",
      },
    },
  },
  test: {
    browser: {
      enabled: true,
      // Locally use the installed Google Chrome, as `e2e/playwright.local.ts` does
      // (Playwright's Chromium has no Fedora build); CI installs Playwright's Chromium.
      provider: playwright({
        launchOptions: process.env.CI ? {} : { channel: "chrome" },
      }),
      headless: true,
      instances: [{ browser: "chromium" }],
    },
    server: {
      deps: {
        inline: [
          "@patternfly/react-styles", // Ensures its CSS imports are ignored
          "@pulp-ui/common", // Required for vite.config.ts imports
        ],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/node_modules/**",
        "**/dist/**",
        "**/coverage/**",
        "**/*.d.ts",
        "**/vite.config.ts",
        "**/config/**",
        "**/types/**",
      ],
    },
  },
});
