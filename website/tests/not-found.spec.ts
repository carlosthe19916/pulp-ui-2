import { expect, test } from "@playwright/test";

test("an unknown path renders the 404 page, not a crash", async ({ page }) => {
  // Relative path so it resolves under the site's baseUrl (/pulp-ui-2/), where
  // Docusaurus serves its themed 404 page.
  await page.goto("this-page-does-not-exist");

  // Docusaurus ships a themed NotFound page with a "Page Not Found" heading.
  await expect(
    page.getByRole("heading", { name: /page not found/i }),
  ).toBeVisible();
});
