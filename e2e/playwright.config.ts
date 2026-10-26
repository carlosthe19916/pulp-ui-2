import { defineConfig, devices } from "@playwright/test";

const authFile = ".auth/user.json";

const pulpApiUrl = process.env.PULP_API_URL ?? "http://localhost:8080";

const authEnv = Object.fromEntries(
  Object.entries({
    AUTH: process.env.E2E_AUTH,
    OIDC_CLIENT_ID: process.env.OIDC_CLIENT_ID,
    OIDC_SERVER_URL: process.env.OIDC_SERVER_URL,
    OIDC_SCOPE: process.env.OIDC_SCOPE,
  }).filter(([, value]) => value !== undefined),
) as Record<string, string>;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // One shared Pulp backend on a 4-vCPU runner: a few workers speed the large
  // suite up without the contention flakiness that more would bring. Locally the
  // backend (not the CPU) is still the bottleneck, so cap workers rather than let
  // Playwright default to ~half the cores — 8+ workers oversaturate the single
  // backend and make the heaviest specs time out. Override with `--workers=N`.
  workers: process.env.CI ? 2 : 4,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
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
      // The access-policy suite changes server-wide behaviour (it edits and
      // resets policies, and tightens who may list tasks/repositories), so it
      // runs on its own after everything else, never in parallel with them.
      // The API/contract specs are a browserless project of their own.
      testIgnore: [/access-policies\.spec\.ts/, /\.api\.spec\.ts$/],
    },
    {
      name: "access-policies",
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
      // Locally it runs after the whole suite (one `npx playwright test` command).
      // In CI it is its own sharded job, so it depends only on auth and never
      // pulls the main suite in behind it.
      dependencies: process.env.CI ? ["setup"] : ["chromium"],
      testMatch: /access-policies\.spec\.ts/,
    },
    {
      // Contract tests for the backend's accept/reject rules: no browser or auth
      // storage, just the REST client (`api` fixture) talking to Pulp directly.
      name: "api",
      testMatch: /\.api\.spec\.ts$/,
    },
  ],
  webServer: {
    command: "npm run start:dev",
    cwd: "..",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PULP_API_URL: pulpApiUrl,
      ...authEnv,
    },
  },
});
