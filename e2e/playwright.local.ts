import { defineConfig, devices } from "@playwright/test";

const authFile = ".auth/user.json";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  // One shared Pulp backend: the backend, not the CPU, is the bottleneck, so cap
  // local workers. Left to Playwright's default (~half the cores) a many-core dev
  // box runs 8+ workers that oversaturate the single backend — responses slow to
  // a crawl and the heaviest specs blow their timeout. Four keeps the backend
  // responsive (measurably faster per test, and no saturation failures). Bump it
  // with `--workers=N` on a beefier backend.
  workers: 4,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    channel: "chrome",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
      dependencies: ["setup"],
      testMatch: /.*\.spec\.ts/,
      // The access-policy suite changes server-wide behaviour, so it runs on its
      // own after everything else (see playwright.config.ts). The API/contract
      // specs are a browserless project of their own.
      testIgnore: [/access-policies\.spec\.ts/, /\.api\.spec\.ts$/],
    },
    {
      name: "access-policies",
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
      dependencies: ["chromium"],
      testMatch: /access-policies\.spec\.ts/,
    },
    {
      // Browserless contract tests for the backend's accept/reject rules.
      name: "api",
      testMatch: /\.api\.spec\.ts$/,
    },
  ],
  webServer: {
    command: "npm run start:dev",
    cwd: "..",
    port: 3000,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      AUTH: "basic",
    },
  },
});
