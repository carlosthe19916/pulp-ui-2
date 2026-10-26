import {
  defineConfig,
  devices,
  type PlaywrightTestConfig,
} from "@playwright/test";

const authFile = ".auth/user.json";
const isCI = !!process.env.CI;

/** The dev server + the suite must agree on which of the app's auth modes is in
 * play: `authenticate()` (helpers/auth.ts) reads `E2E_AUTH`, and the dev server
 * the config spawns is told the same value as `AUTH`. */
const authEnv = (authMode: string | undefined): Record<string, string> =>
  Object.fromEntries(
    Object.entries({
      AUTH: authMode,
      OIDC_CLIENT_ID: process.env.OIDC_CLIENT_ID,
      OIDC_SERVER_URL: process.env.OIDC_SERVER_URL,
      OIDC_SCOPE: process.env.OIDC_SCOPE,
    }).filter(([, value]) => value !== undefined),
  ) as Record<string, string>;

/** Options the local preset ([playwright.local.ts]) retargets; everything else is
 * identical between local and CI so it lives here, once. */
export interface IE2EConfigOptions {
  /** Pulp backend the dev server proxies to. CI: 8080; local oci-env: 5003. */
  pulpApiUrl?: string;
  /** App auth mode for the spawned dev server (kept in sync with `E2E_AUTH`). */
  authMode?: string;
  /** Browser channel: unset uses Playwright's bundled Chromium (CI); "chrome"
   * uses the system Chrome (local, so no `playwright install` is needed). */
  channel?: string;
  /** Reuse a dev server already listening on :3000 instead of spawning one. */
  reuseExistingServer?: boolean;
}

export const createE2EConfig = (
  options: IE2EConfigOptions = {},
): PlaywrightTestConfig => {
  const pulpApiUrl =
    options.pulpApiUrl ?? process.env.PULP_API_URL ?? "http://localhost:8080";
  const authMode = options.authMode ?? process.env.E2E_AUTH;
  const channel = options.channel ?? process.env.E2E_BROWSER_CHANNEL;

  const browserProject = {
    use: { ...devices["Desktop Chrome"], storageState: authFile },
  };

  return defineConfig({
    testDir: "./tests",
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 1 : 0,
    // One shared Pulp backend: the backend, not the CPU, is the bottleneck, so cap
    // workers rather than let Playwright default to ~half the cores. 8+ workers
    // oversaturate the single backend — responses crawl and the heaviest specs time
    // out. CI runners are small (2); a dev box gets 3. Override with `--workers=N`.
    workers: isCI ? 2 : 3,
    reporter: isCI ? [["github"], ["html", { open: "never" }]] : "html",
    use: {
      baseURL: "http://localhost:3000",
      trace: "on-first-retry",
      screenshot: "only-on-failure",
      // Cap navigations so a stuck page load fails with a clear navigation error
      // rather than hanging to the (tripled, for test.slow) test timeout.
      navigationTimeout: 30_000,
      ...(channel ? { channel } : {}),
    },
    projects: [
      {
        name: "setup",
        testMatch: /auth\.setup\.ts/,
      },
      {
        name: "chromium",
        ...browserProject,
        dependencies: ["setup"],
        testMatch: /.*\.spec\.ts/,
        // The access-policy suite changes server-wide behaviour (it edits and
        // resets policies, and tightens who may list tasks/repositories), so it is
        // its own serial project. The API/contract specs are browserless.
        testIgnore: [/access-policies\.spec\.ts/, /\.api\.spec\.ts$/],
      },
      {
        name: "access-policies",
        ...browserProject,
        // In CI it is its own sharded job, so it depends only on auth and never
        // pulls the main suite in behind it; locally one `playwright test` run does
        // the whole suite, so it waits for chromium to finish first.
        dependencies: isCI ? ["setup"] : ["chromium"],
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
      reuseExistingServer: options.reuseExistingServer ?? !isCI,
      timeout: 120_000,
      env: {
        PULP_API_URL: pulpApiUrl,
        ...authEnv(authMode),
      },
    },
  });
};

export default createE2EConfig();
