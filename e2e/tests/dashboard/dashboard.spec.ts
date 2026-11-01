import { expect, test } from "@support/fixtures";
import { uniqueName } from "@support/helpers/unique";

test.describe("Dashboard", () => {
  test("opens on the default domain with the instance and domain sections", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard\/default$/);

    await expect(
      page.getByRole("heading", { level: 2, name: "Pulp instance" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 3, name: "System health" }),
    ).toBeVisible();
    await expect(page.getByText("All services are running")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 3, name: "Task activity" }),
    ).toBeVisible();
  });

  test("lists a task this browser started under Your recent tasks", async ({
    page,
    api,
    cleanup,
    repositoriesPage,
  }) => {
    const name = cleanup.repository(uniqueName("dash-repo"));
    await api.createFileRepository(name);

    // Deleting a repository answers 202 with a task: the dashboard remembers it.
    await repositoriesPage.goto();
    await repositoriesPage.filterBy("Name", name);
    await repositoriesPage.delete(name);
    await repositoriesPage.expectRowGone(name);

    await page.goto("/");
    const recent = page.getByRole("list", { name: "Your recent tasks" });
    await expect(recent.getByRole("link", { name: /delete/ })).toBeVisible();
  });
});
