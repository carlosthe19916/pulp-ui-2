import { defineConfig, devices } from "@playwright/test";

const authFile = ".auth/user.json";

const pulpApiUrl = process.env.PULP_API_URL ?? "http://localhost:8080";

// Keep the auth mode the dev server is built with in sync with the mode the tests
// drive (see helpers/auth.ts). Only forwards keys that are set, so `basic`/`none`
// need nothing extra and `oidc` picks up whatever OIDC_* the environment provides.
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
  workers: process.env.CI ? 1 : undefined,
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
