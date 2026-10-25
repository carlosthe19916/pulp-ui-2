import { test } from "./fixtures";

// Starting point for the Playwright test agents (planner/generator in
// .claude/agents/e2e/): they run this test to get a logged-in page, then explore from it.
test.describe("Seed", () => {
  test("seed", async ({ page }) => {
    await page.goto("/");
  });
});
