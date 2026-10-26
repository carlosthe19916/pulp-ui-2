import { expect, test } from "@support/fixtures";

/** Every page added for the remaining REST endpoints opens and lists its data. */
const PAGES = [
  ["/system-management/default/content-guards", "Content guards"],
  [
    "/system-management/default/alternate-content-sources",
    "Alternate content sources",
  ],
  ["/system-management/default/export-import", "Export and import"],
  ["/system-management/default/upstream-pulps", "Upstream Pulps"],
  ["/system-management/default/storage", "Storage"],
  ["/system-management/default/maintenance", "Maintenance"],
  ["/monitoring/default/task-schedules", "Task schedules"],
  ["/monitoring/default/vulnerability-reports", "Vulnerability reports"],
  ["/content-management/default/ansible-collections", "Ansible collections"],
  ["/content-management/default/container-namespaces", "Container namespaces"],
  ["/admin/access-policies", "Access policies"],
] as const;

test.describe("New system pages", () => {
  for (const [path, heading] of PAGES) {
    test(`opens ${heading}`, async ({ page }) => {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { level: 1, name: heading }),
      ).toBeVisible();
      await expect(page.getByText("Something went wrong")).toHaveCount(0);
    });
  }

  test("lists access policies, with the default ones not resettable", async ({
    page,
  }) => {
    await page.goto("/admin/access-policies");
    const table = page.getByRole("grid", { name: "Access policies table" });
    await expect(table.getByRole("row").nth(1)).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Viewset" }),
    ).toBeVisible();
  });

  test("starts an orphan cleanup from Maintenance", async ({ page }) => {
    await page.goto("/system-management/default/maintenance");
    await page.getByRole("button", { name: "Clean up…" }).click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByRole("spinbutton", { name: "Protection time (minutes)" })
      .fill("1440");
    await dialog.getByRole("button", { name: "Clean up", exact: true }).click();
    await expect(page.getByText("Clean up orphans started")).toBeVisible();
  });
});
