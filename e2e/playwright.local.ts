import { createE2EConfig } from "./playwright.config";

/**
 * Local preset for running against an oci-env Pulp backend (basic auth, on
 * http://localhost:5003) through the system Chrome, reusing a dev server you
 * already have running on :3000. Everything else is shared with
 * [playwright.config.ts]; use it with `npm run test:local`.
 */
export default createE2EConfig({
  pulpApiUrl: process.env.PULP_API_URL ?? "http://localhost:5003",
  authMode: "basic",
  channel: "chrome",
  reuseExistingServer: true,
});
