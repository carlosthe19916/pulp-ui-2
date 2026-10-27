import { expect, test } from "@playwright/test";

import { attachErrors, collectPageErrors } from "./support";

// Each home section carries a stable data-testid (see src/components/home/*).
const HOME_SECTIONS = [
  "home-hero",
  "home-content-types",
  "home-features",
  "home-how-it-works",
  "home-quick-start",
  "home-cta",
];

test.describe("landing page", () => {
  test("renders every home section without runtime errors", async ({
    page,
  }, testInfo) => {
    const errors = collectPageErrors(page);

    await page.goto("/");

    for (const section of HOME_SECTIONS) {
      await expect(
        page.getByTestId(section),
        `section "${section}" should render`,
      ).toBeVisible();
    }

    await attachErrors(testInfo, errors);
    expect(errors, "landing page should log no runtime errors").toEqual([]);
  });
});
