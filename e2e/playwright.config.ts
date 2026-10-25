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
  // suite up without the contention flakiness that more would bring.
  workers: process.env.CI ? 3 : undefined,
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
      testIgnore: /access-policies\.spec\.ts/,
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
