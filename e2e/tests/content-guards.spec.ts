import { expect, test } from "./fixtures";
import { uniqueName } from "./helpers/unique";

test.describe("Content guards", () => {
  test("creates, edits and deletes a header guard", async ({
    page,
    cleanup,
  }) => {
    const name = cleanup.contentGuard(uniqueName("guard"));
    await page.goto("/system-management/default/content-guards");

    await page.getByRole("button", { name: "Create content guard" }).click();
    let dialog = page.getByRole("dialog");
    await dialog.getByLabel("Type").selectOption({ label: "Header" });
    await dialog.getByRole("textbox", { name: "Name", exact: true }).fill(name);
    await dialog.getByRole("textbox", { name: "Header name" }).fill("X-Token");
    await dialog.getByRole("textbox", { name: "Header value" }).fill("secret");
    await dialog.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page.getByText(`Guard "${name}" created`)).toBeVisible();

    const table = page.getByRole("grid", { name: "Content guards table" });
    await page.getByPlaceholder("Filter by Name").fill(name);
    const row = table.getByRole("row", { name: new RegExp(name) });
    await expect(row).toBeVisible();
    await expect(row.getByText("Header", { exact: true })).toBeVisible();

    await row.getByRole("button", { name: "Kebab toggle" }).click();
    await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
    dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("textbox", { name: "Header name" }),
    ).toHaveValue("X-Token");
    await dialog.getByRole("textbox", { name: "Header value" }).fill("rotated");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText(`Guard "${name}" saved`)).toBeVisible();

    await row.getByRole("button", { name: "Kebab toggle" }).click();
    await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await expect(page.getByText(`Guard "${name}" deleted`)).toBeVisible();
    await expect(row).toHaveCount(0);
  });
});
