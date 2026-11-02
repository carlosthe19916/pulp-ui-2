import { expect, test } from "@support/fixtures";
import { idOf } from "@support/helpers/hrefs";
import { uniqueName } from "@support/helpers/unique";

// Scenarios: e2e/specs/repositories.md (detail).

test.describe("Repository Tasks tab", () => {
  /**
   * REP-DET-02 · A repository's task history
   *
   * Summary: The Tasks tab lists the tasks run on the repository, their count in the tab title, and its help says what it lists.
   *
   * Seed: a file repository, edited once so an update task ran
   *
   * When I open its Tasks tab
   * Then the tab title counts one task and the update task is listed
   * And its help button opens the "Task history" popover
   */
  test(
    "The Tasks tab lists the tasks run on the repository, their count in the tab title, and its help says what it lists.",
    {
      tag: "@REP-DET-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/repositories.md#REP-DET-02",
      },
    },
    async ({ api, cleanup, page }) => {
      const name = cleanup.repository(uniqueName("repo"));
      const href = await api.createRepository("file/file", { name });
      const update = await api.attempt("patch", href, {
        description: "edited",
      });
      const task = (update.body as { task: string }).task;
      await expect
        .poll(async () => (await api.getJson<{ state: string }>(task)).state)
        .toBe("completed");

      await page.goto(
        `/content-management/default/repositories/file.file/${idOf(href)}`,
      );
      const tasksTab = page.getByRole("tab", { name: /^Tasks/ });
      await expect(tasksTab).toHaveText("Tasks (1)");
      await tasksTab.click();
      await expect(
        page
          .getByRole("grid", { name: "Tasks table" })
          .getByText("ageneral_update"),
      ).toBeVisible();

      await page
        .getByRole("button", { name: "More information about Tasks" })
        .click();
      await expect(page.getByRole("dialog")).toContainText("Task history");
    },
  );
});
