import { expect, test } from "@support/fixtures";

/**
 * The OpenShift-style domain context selector is shown on content pages only when
 * the backend has domains enabled, and hidden otherwise. Gated on the backend's
 * reported `domain_enabled` so both CI matrix modes are covered.
 */
test.describe("Domain context selector", () => {
  test("is shown on content pages when domains are enabled", async ({
    remotesPage,
    page,
    api,
  }) => {
    test.skip(!api.domainEnabled, "domains are disabled");
    await remotesPage.goto();
    await expect(
      page.getByRole("button", { name: "Select domain" }),
    ).toBeVisible();
  });

  test("is hidden on content pages when domains are disabled", async ({
    remotesPage,
    page,
    api,
  }) => {
    test.skip(api.domainEnabled, "domains are enabled");
    await remotesPage.goto();
    await expect(
      page.getByRole("button", { name: "Select domain" }),
    ).toBeHidden();
  });

  test("scopes content routes by a domain path segment (not storage)", async ({
    remotesPage,
    page,
  }) => {
    await remotesPage.goto();
    // The selected domain lives in the URL path, e.g. /content-management/default/remotes.
    await expect(page).toHaveURL(/\/content-management\/[^/]+\/remotes$/);
  });
});
