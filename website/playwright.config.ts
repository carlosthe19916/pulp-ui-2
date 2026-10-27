import { defineConfig, devices } from "@playwright/test";

// The site is served under docusaurus.config.ts's baseUrl (`/pulp-ui-2/`), so
// every test navigates relative to that path.
// 3100, not Docusaurus's default 3000, so the suite doesn't collide with the
// app's own dev server (the client runs on :3000).
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}/pulp-ui-2/`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html"], ["list"]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // `docusaurus serve` needs a prior production build. In CI the build already
  // runs before this step; locally the build is triggered on demand so a single
  // `npm run test:e2e` just works.
  webServer: {
    command: process.env.CI
      ? `npm run serve -- --port ${PORT} --no-open`
      : `npm run build && npm run serve -- --port ${PORT} --no-open`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
