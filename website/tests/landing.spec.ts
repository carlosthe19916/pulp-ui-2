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

    const video = page.getByTestId("home-hero-video");
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute(
      "src",
      /\/videos\/home\/pulp-ui-next\.mp4$/,
    );
    await expect(video).toHaveAttribute(
      "poster",
      /\/videos\/home\/pulp-ui-next-poster\.jpg$/,
    );
    await expect(video).not.toHaveAttribute("autoplay");
    await expect(video.locator("track")).toHaveCount(0);

    await attachErrors(testInfo, errors);
    expect(errors, "landing page should log no runtime errors").toEqual([]);
  });
});
