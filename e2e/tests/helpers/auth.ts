import { expect, type Page } from "@playwright/test";

export const E2E_USERNAME = process.env.E2E_USERNAME ?? "admin";
export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "password";

/**
 * Which of the app's three auth modes the suite is exercising. Must match the
 * `AUTH` the UI under test was built/started with — `playwright.config.ts` passes
 * it through to the dev server it spawns so the two stay in sync.
 */
export type AuthMode = "none" | "basic" | "oidc";
export const E2E_AUTH: AuthMode =
  (process.env.E2E_AUTH as AuthMode | undefined) ?? "basic";

/**
 * Land the page in an authenticated state for the configured auth mode, so the
 * setup project can persist a reusable `storageState`.
 *
 * - `none`  — no login exists; every request is treated as authenticated, so we
 *   just load the app (producing a valid, credential-free storage state).
 * - `basic` — the app's own `/login` form; credentials are kept in localStorage
 *   (see {@link loginBasic}) so `storageState` carries them into every spec.
 * - `oidc`  — a protected route redirects to the external IdP's login form; the
 *   IdP SSO cookie captured in `storageState` lets specs re-authenticate silently.
 */
export async function authenticate(page: Page): Promise<void> {
  switch (E2E_AUTH) {
    case "none":
      await page.goto("/");
      break;
    case "oidc":
      await loginOidc(page);
      break;
    case "basic":
      await loginBasic(page);
      break;
  }
  await expectAuthenticated(page);
}

async function loginBasic(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByRole("textbox", { name: /username/i }).fill(E2E_USERNAME);
  await page.getByRole("textbox", { name: /^password$/i }).fill(E2E_PASSWORD);
  // Playwright's storageState persists cookies + localStorage but NOT
  // sessionStorage; basic mode only writes credentials to localStorage when this
  // box is checked, so ticking it is what carries auth into the spec projects.
  await page
    .getByRole("checkbox", { name: /keep credentials in localstorage/i })
    .check();
  await page.getByRole("button", { name: /log in/i }).click();
}

async function loginOidc(page: Page): Promise<void> {
  // Any protected route redirects to the IdP when unauthenticated (see the
  // `_authenticated` route guard → `auth.login()`).
  await page.goto("/");
  // Keycloak's hosted login form uses these stable ids across its themes.
  await page.locator("#username").fill(E2E_USERNAME);
  await page.locator("#password").fill(E2E_PASSWORD);
  await page.locator("#kc-login").click();
}

async function expectAuthenticated(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
}
