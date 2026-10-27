import { expect, test } from "@support/fixtures";
import { uniqueName } from "@support/helpers/unique";

test.describe("Content guards", () => {
  test("creates, edits and deletes a header guard", async ({
    contentGuardsPage,
    cleanup,
  }) => {
    const name = cleanup.contentGuard(uniqueName("guard"));
    await contentGuardsPage.goto();

    await contentGuardsPage.createHeaderGuard({
      name,
      headerName: "X-Token",
      headerValue: "secret",
    });
    await expect(
      contentGuardsPage.page.getByText(`Guard "${name}" created`),
    ).toBeVisible();

    // filterBy waits for the debounced server-side fetch, so the filtered rows are
    // mounted before we open the kebab (otherwise the key-change refetch swaps the
    // body to a skeleton and detaches the open menu).
    await contentGuardsPage.filterBy("Name", name);
    await contentGuardsPage.expectRowVisible(name);
    await expect(
      contentGuardsPage.row(name).getByText("Header", { exact: true }),
    ).toBeVisible();

    await contentGuardsPage.editHeaderValue({
      name,
      headerName: "X-Token",
      value: "rotated",
    });
    await expect(
      contentGuardsPage.page.getByText(`Guard "${name}" saved`),
    ).toBeVisible();

    await contentGuardsPage.deleteGuard(name);
    await expect(
      contentGuardsPage.page.getByText(`Guard "${name}" deleted`),
    ).toBeVisible();
    await contentGuardsPage.expectRowGone(name);
  });
});
