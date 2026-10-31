import { expect, test } from "@support/fixtures";
import { mockInFlightTask } from "@support/helpers/taskMock";
import { uniqueName } from "@support/helpers/unique";

// Scenarios: e2e/specs/repositories.md (edit).

interface IRepositoryRecord {
  prn: string;
  description: string | null;
  remote: string | null;
  retain_repo_versions: number | null;
}

const idOf = (href: string) => href.split("/").filter(Boolean).pop() ?? "";

const detailPath = (href: string) =>
  `/content-management/default/repositories/file.file/${idOf(href)}`;

test.describe("Repository edit page", () => {
  /**
   * REP-EDT-01 · Change and clear repository settings
   *
   * Summary: Editing a repository saves changed settings and clears the ones the user empties.
   *
   * Seed: a file repository with a description, a remote and 5 retained versions
   *
   * When I open its edit page, empty Description, remove the remote, set 2 retained versions and save
   * Then the toast "Repository "<name>" update started" appears (an edit runs as a task) and its
   * detail page opens
   * And once the task finishes, the server has no description (null: Pulp rejects a blank one), no
   * remote and 2 retained versions
   */
  test(
    "Editing a repository saves changed settings and clears the ones the user empties.",
    {
      tag: "@REP-EDT-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/repositories.md#REP-EDT-01",
      },
    },
    async ({ formPage, toasts, api, cleanup, page }) => {
      const remoteName = cleanup.remote(uniqueName("remote"));
      const remote = await api.createRemote("file/file", {
        name: remoteName,
        url: "https://fixtures.pulpproject.org/file/PULP_MANIFEST",
      });
      const name = cleanup.repository(uniqueName("repo"));
      const href = await api.createRepository("file/file", {
        name,
        description: "Release files",
        remote,
        retain_repo_versions: 5,
      });

      await formPage.goto(`${detailPath(href)}/edit`);
      await formPage.textbox("Description").fill("");
      await page.getByRole("button", { name: "Remote", exact: true }).click();
      await page.getByRole("option", { name: "No remote" }).click();
      await formPage.expandSection("Retention");
      await page
        .getByRole("spinbutton", { name: "Retained versions" })
        .fill("2");
      await formPage.submit("Save");

      await expect(
        toasts.info(`Repository "${name}" update started`),
      ).toBeVisible();
      await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
      await expect
        .poll(async () => {
          const repository = await api.getJson<IRepositoryRecord>(href);
          return [
            repository.description,
            repository.remote,
            repository.retain_repo_versions,
          ];
        })
        .toEqual([null, null, 2]);
    },
  );

  /**
   * REP-EDT-02 · Editing while a task runs
   *
   * Summary: While a task runs on a repository, Edit stays enabled and the edit page warns, and the saved update is applied after the task.
   *
   * Seed: a file repository with a remote and a sync running
   *
   * When I open its detail page's actions menu
   * Then "Sync" and "Delete" are disabled with the tooltip "Wait for the running task to finish", but
   * "Edit" is enabled
   * When I choose "Edit"
   * Then the alert "Sync in progress" says "You can still save: your changes are applied when the
   * task finishes." and links to the task
   * When I change the description and save
   * Then the toast "Repository "<name>" update started" appears and the detail page opens
   * And once the sync finishes, the server has the new description
   *
   * Pulp queues the update behind the repository's lock and runs it when the sync finishes.
   */
  test(
    "While a task runs on a repository, Edit stays enabled and the edit page warns, and the saved update is applied after the task.",
    {
      tag: "@REP-EDT-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/repositories.md#REP-EDT-02",
      },
    },
    async ({ formPage, toasts, api, cleanup, page }) => {
      const remote = await api.createRemote("file/file", {
        name: cleanup.remote(uniqueName("remote")),
        url: "https://fixtures.pulpproject.org/file/PULP_MANIFEST",
      });
      const name = cleanup.repository(uniqueName("repo"));
      const href = await api.createRepository("file/file", { name, remote });
      const { prn } = await api.getJson<IRepositoryRecord>(href);
      // A real sync finishes too fast to observe: report one running on this repository.
      await mockInFlightTask(page, prn, "sync");

      await page.goto(detailPath(href));
      await page.getByRole("button", { name: "Actions" }).click();
      for (const locked of ["Sync", "Delete"]) {
        const item = page.getByRole("menuitem", { name: locked });
        await expect(item).toHaveAttribute("aria-disabled", "true");
        await item.hover();
        await expect(page.getByRole("tooltip")).toHaveText(
          "Wait for the running task to finish",
        );
      }
      const edit = page.getByRole("menuitem", { name: "Edit" });
      await expect(edit).not.toHaveAttribute("aria-disabled", "true");
      await edit.click();

      await expect(formPage.heading("Edit file repository")).toBeVisible();
      await expect(page.getByText("Sync in progress")).toBeVisible();
      await expect(
        page.getByText(
          "You can still save: your changes are applied when the task finishes.",
        ),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "View task" }),
      ).toBeVisible();

      await formPage.fill({ Description: "Saved during a sync" });
      await formPage.submit("Save");
      await expect(
        toasts.info(`Repository "${name}" update started`),
      ).toBeVisible();
      await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
      await expect
        .poll(
          async () => (await api.getJson<IRepositoryRecord>(href)).description,
        )
        .toBe("Saved during a sync");
    },
  );
});
