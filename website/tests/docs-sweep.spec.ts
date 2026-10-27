import { expect, test } from "@playwright/test";

import { attachErrors, isIgnoredConsoleError } from "./support";

/**
 * Visit every page the build generated (from sitemap.xml) and assert each one
 * returns OK, renders an <h1>, and logs no runtime errors. Driving this off the
 * sitemap means new docs are swept automatically, and it covers pages the
 * collapsed sidebar wouldn't expose.
 */
test("every generated page renders cleanly", async ({ page }, testInfo) => {
  const errors: string[] = [];
  let currentUrl = "/";

  page.on("pageerror", (error) => {
    errors.push(`${currentUrl} — pageerror: ${error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (isIgnoredConsoleError(message)) return;
    errors.push(`${currentUrl} — console.error: ${message.text()}`);
  });

  // Relative path so it resolves under the site's baseUrl (/pulp-ui-2/).
  const sitemap = await page.request.get("sitemap.xml");
  expect(sitemap.ok(), "sitemap.xml should be served").toBeTruthy();

  const xml = await sitemap.text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => new URL(match[1]).pathname,
  );

  expect(paths.length, "sitemap should list pages").toBeGreaterThan(0);

  for (const path of paths) {
    currentUrl = path;
    const response = await page.goto(path);
    expect(response, `no response for ${path}`).not.toBeNull();
    expect(response?.status(), `${path} should return OK`).toBeLessThan(400);
    await expect(
      page.locator("h1").first(),
      `${path} should render an <h1>`,
    ).toBeVisible();
  }

  await attachErrors(testInfo, errors);
  expect(errors, "pages should log no runtime errors").toEqual([]);
});
