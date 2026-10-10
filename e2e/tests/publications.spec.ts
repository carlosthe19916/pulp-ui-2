import { expect, test } from "./fixtures";

/**
 * Publications are immutable and require an existing repository (a typeahead
 * picker), so full create is covered manually. This smoke test verifies the page
 * and the generic create modal (with its repository field) are wired.
 */
test.describe("Publications", () => {
  test("list renders and the create modal offers a repository", async ({
    publicationsPage,
  }) => {
    await publicationsPage.goto();

    const dialog = await publicationsPage.openCreate();
    await expect(dialog.getByText("Repository", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toBeHidden();
  });
});
