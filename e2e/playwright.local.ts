import { defineConfig, devices } from "@playwright/test";

const authFile = ".auth/user.json";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
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
      // own after everything else (see playwright.config.ts).
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
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      AUTH: "basic",
    },
  },
});
