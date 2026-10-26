import { type Locator, type Page } from "@playwright/test";

import { expect, test } from "@support/fixtures";
import { mockInFlightTask } from "@support/helpers/taskMock";
import { uniqueName } from "@support/helpers/unique";
import type { DataViewList } from "@support/pom/DataViewList";

/**
 * End-to-end coverage for the server-derived per-row task status on the content
 * list pages.
 *
 * The in-progress spinner only shows while a task is active AND the resource still
 * exists; in dev a real delete finishes in well under a second, so that window is
 * too small to observe deterministically. These tests therefore create the
 * resource for real (via REST) and intercept only the row-status task poll to hold
 * a single `running` task — exercising the real list render, the real PRN join, and
 * a real full-page reload, while making the timing deterministic. A second group
 * drives real deletes to prove the async-vs-sync contract end-to-end.
 */

/**
 * A row is in-progress when its dedicated Status cell shows the labelled spinner
 * ("Deleting…" / "Updating…"). The row keeps its kebab available throughout — the
 * redesign surfaces status in its own column rather than swapping out the actions —
 * so we assert the label shows, not that the actions disappear.
 */
async function expectRowInProgress(row: Locator, label: string): Promise<void> {
  await expect(row.getByText(label).first()).toBeVisible();
  await expect(row.getByRole("button", { name: "Kebab toggle" })).toBeVisible();
}

/**
 * Assert the row shows the in-progress status, then reload the whole document and
 * assert it still does — proving the status is reconstructed purely from the
 * server with no client-side state to lose. `goto()` performs a full navigation
 * (new JS context, empty React Query cache), the strongest form of "reload".
 */
async function expectStatusSurvivesReload(
  page: Page,
  list: DataViewList & { goto: () => Promise<void> },
  name: string,
  label: string,
): Promise<void> {
  await list.goto();
  await list.filterBy("Name", name);
  await expectRowInProgress(list.row(name), label);

  await list.goto();
  await list.filterBy("Name", name);
  await expectRowInProgress(list.row(name), label);
}

test.describe("Row task status — in-progress (server-derived, survives reload)", () => {
  test("repository delete shows Deleting… and survives reload", async ({
    page,
    repositoriesPage,
    api,
    cleanup,
  }) => {
    const name = cleanup.repository(uniqueName("repo"));
    const { prn } = await api.createFileRepository(name);
    await mockInFlightTask(page, prn, "delete");
    await expectStatusSurvivesReload(page, repositoriesPage, name, "Deleting…");
  });

  test("remote delete shows Deleting… and survives reload", async ({
    page,
    remotesPage,
    api,
    cleanup,
  }) => {
    const name = cleanup.remote(uniqueName("remote"));
    const { prn } = await api.createFileRemote(name);
    await mockInFlightTask(page, prn, "delete");
    await expectStatusSurvivesReload(page, remotesPage, name, "Deleting…");
  });

  test("distribution delete shows Deleting… and survives reload", async ({
    page,
    distributionsPage,
    api,
    cleanup,
  }) => {
    const name = cleanup.distribution(uniqueName("dist"));
    const { prn } = await api.createDistribution(name);
    await mockInFlightTask(page, prn, "delete");
    await expectStatusSurvivesReload(
      page,
      distributionsPage,
      name,
      "Deleting…",
    );
  });

  test("domain delete shows Deleting… and survives reload", async ({
    page,
    domainsPage,
    api,
    cleanup,
  }) => {
    test.skip(!api.domainEnabled, "domains feature is disabled");
    const name = cleanup.domain(uniqueName("domain").replace(/-/g, ""));
    const { prn } = await api.createDomain(name);
    await mockInFlightTask(page, prn, "delete");
    await expectStatusSurvivesReload(page, domainsPage, name, "Deleting…");
  });

  test("domain update shows Updating… and survives reload", async ({
    page,
    domainsPage,
    api,
    cleanup,
  }) => {
    test.skip(!api.domainEnabled, "domains feature is disabled");
    const name = cleanup.domain(uniqueName("domain").replace(/-/g, ""));
    const { prn } = await api.createDomain(name);
    await mockInFlightTask(page, prn, "update");
    await expectStatusSurvivesReload(page, domainsPage, name, "Updating…");
  });
});

test.describe("Row task status — multiple tasks (count toggle + sub-table)", () => {
  /** The Status cell's compound-expand toggle for a row with 2+ in-flight tasks. */
  function countToggle(row: Locator, count: number): Locator {
    return row.getByRole("button", { name: new RegExp(`\\b${count}\\b`) });
  }

  test("repository with 2 tasks shows a count toggle that expands the task list", async ({
    page,
    repositoriesPage,
    api,
    cleanup,
  }) => {
    const name = cleanup.repository(uniqueName("repo"));
    const { prn } = await api.createFileRepository(name);
    await mockInFlightTask(page, prn, "delete", 2);

    // With 2 tasks the Status cell collapses to a count toggle — not the single
    // "Deleting…" label — and survives a full reload like the single-task case.
    await repositoriesPage.goto();
    await repositoriesPage.filterBy("Name", name);
    await expect(repositoriesPage.row(name).getByText("Deleting…")).toHaveCount(
      0,
    );
    await expect(countToggle(repositoriesPage.row(name), 2)).toBeVisible();

    await repositoriesPage.goto();
    await repositoriesPage.filterBy("Name", name);
    await expect(countToggle(repositoriesPage.row(name), 2)).toBeVisible();

    // Expanding reveals the paginated per-resource task sub-table, one row per task.
    await countToggle(repositoriesPage.row(name), 2).click();
    const subTable = page.getByRole("grid", { name: "Resource tasks table" });
    await expect(subTable).toBeVisible();
    await expect(
      subTable.getByRole("row").filter({ hasText: "Delete" }),
    ).toHaveCount(2);
  });
});

test.describe("Delete async-vs-sync contract (real backend)", () => {
  test("repository delete dispatches a task", async ({
    page,
    repositoriesPage,
    api,
    cleanup,
  }) => {
    const name = cleanup.repository(uniqueName("repo"));
    await api.createFileRepository(name);

    await repositoriesPage.goto();
    await repositoriesPage.filterBy("Name", name);
    await repositoriesPage.expectRowVisible(name);

    await repositoriesPage.delete(name);
    await expect(
      page.getByText(`Repository "${name}" deletion started`),
    ).toBeVisible();

    await repositoriesPage.goto();
    await repositoriesPage.filterBy("Name", name);
    await repositoriesPage.expectRowGone(name);
  });

  test("remote delete dispatches a task", async ({
    page,
    remotesPage,
    api,
    cleanup,
  }) => {
    const name = cleanup.remote(uniqueName("remote"));
    await api.createFileRemote(name);

    await remotesPage.goto();
    await remotesPage.filterBy("Name", name);
    await remotesPage.expectRowVisible(name);

    await remotesPage.delete(name);
    await expect(
      page.getByText(`Remote "${name}" deletion started`),
    ).toBeVisible();

    await remotesPage.goto();
    await remotesPage.filterBy("Name", name);
    await remotesPage.expectRowGone(name);
  });

  test("distribution delete dispatches a task", async ({
    page,
    distributionsPage,
    api,
    cleanup,
  }) => {
    const name = cleanup.distribution(uniqueName("dist"));
    await api.createDistribution(name);

    await distributionsPage.goto();
    await distributionsPage.filterBy("Name", name);
    await distributionsPage.expectRowVisible(name);

    await distributionsPage.delete(name);
    await expect(
      page.getByText(`Distribution "${name}" deletion started`),
    ).toBeVisible();

    await distributionsPage.goto();
    await distributionsPage.filterBy("Name", name);
    await distributionsPage.expectRowGone(name);
  });

  test("domain delete dispatches a task", async ({
    page,
    domainsPage,
    api,
    cleanup,
  }) => {
    test.skip(!api.domainEnabled, "domains feature is disabled");
    const name = cleanup.domain(uniqueName("domain").replace(/-/g, ""));
    await api.createDomain(name);

    await domainsPage.goto();
    await domainsPage.filterBy("Name", name);
    await domainsPage.expectRowVisible(name);

    await domainsPage.delete(name);
    await expect(
      page.getByText(`Domain "${name}" deletion started`),
    ).toBeVisible();

    await domainsPage.goto();
    await domainsPage.filterBy("Name", name);
    await domainsPage.expectRowGone(name);
  });

  test("publication delete is synchronous — no task toast, no status", async ({
    page,
    publicationsPage,
    api,
    cleanup,
  }) => {
    const repoName = cleanup.repository(uniqueName("repo"));
    const repo = await api.createFileRepository(repoName);
    const publication = await api.createPublication(repo.pulp_href);
    cleanup.href(publication.pulp_href);
    const pubId = publication.pulp_href.split("/").filter(Boolean).pop() ?? "";

    await publicationsPage.goto();
    // Publications list is newest-first, so a fresh one is on the first page.
    await publicationsPage.expectRowVisible(pubId);

    await publicationsPage.delete(pubId);

    // Synchronous (204): a plain "deleted" success toast, never a task toast.
    await expect(
      page.getByText(`Publication "${pubId}" deleted`),
    ).toBeVisible();
    await expect(page.getByText(/deletion started/)).toHaveCount(0);

    await publicationsPage.goto();
    await publicationsPage.expectRowGone(pubId);
  });
});
