import { expect, test } from "@support/fixtures";
import {
  detailPath,
  seedDistribution,
  seedRepository,
} from "@support/helpers/distributions";
import { uniqueName } from "@support/helpers/unique";
import { ConfirmModal } from "@support/pom/ConfirmModal";

// Scenarios: e2e/specs/distributions.md (detail page).

test.describe("Distribution detail page", () => {
  /**
   * DST-DET-02 · Details show how it is served and its settings
   *
   * Summary: The Details tab shows the serving URL, client setup and source, then the settings grouped like the form, then metadata.
   *
   * Seed: a file repository, an RBAC content guard, and a file distribution serving the repository
   * with that content guard and the label "env=prod"
   *
   * When I open the distribution's Details tab
   * Then the "Serving" card shows its base URL, client setup and the repository as a link
   * And the "General" and "Access" cards show the base path and the content guard's name, with the form's
   * labels
   * And the "Metadata" card shows the label "env=prod", its creation time and its PRN
   */
  test(
    "The Details tab shows the serving URL, client setup and source, then the settings grouped like the form, then metadata.",
    {
      tag: "@DST-DET-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/distributions.md#DST-DET-02",
      },
    },
    async ({ api, cleanup, page }) => {
      const repository = await seedRepository(api, cleanup);
      const guardName = cleanup.contentGuard(uniqueName("guard"));
      const guard = await api.attemptCreate("contentguards/core/rbac", {
        name: guardName,
      });
      const guardHref = (guard.body as { pulp_href: string }).pulp_href;
      const { href, basePath } = await seedDistribution(api, cleanup, {
        repository: repository.href,
        content_guard: guardHref,
        pulp_labels: { env: "prod" },
      });

      await page.goto(detailPath(href));
      const main = page.getByRole("main");
      // "Access" also names a tab, so that card is checked through its fields below.
      for (const card of ["Serving", "General", "Metadata"]) {
        await expect(main.getByText(card, { exact: true })).toBeVisible();
      }
      // Serving: base URL, client setup and the repository as a link.
      await expect(
        main.getByRole("link", { name: new RegExp(`/${basePath}/$`) }),
      ).toBeVisible();
      await expect(
        main.getByText("Download a file by its relative path."),
      ).toBeVisible();
      await expect(
        main.getByRole("link", { name: repository.name }),
      ).toBeVisible();
      // Settings, with the form's labels.
      await expect(main.getByText("Base path", { exact: true })).toBeVisible();
      await expect(
        main.getByText("Content guard", { exact: true }),
      ).toBeVisible();
      // A content guard has no page of its own: it is named, not linked.
      await expect(main.getByText(guardName, { exact: true })).toBeVisible();
      await expect(main.getByText("Hidden", { exact: true })).toBeVisible();
      // Metadata.
      await expect(main.getByText("env=prod")).toBeVisible();
      await expect(main.getByText("Created", { exact: true })).toBeVisible();
      await expect(main.getByText("PRN", { exact: true })).toBeVisible();
    },
  );

  /**
   * DST-DET-03 · Edit and delete from the detail page
   *
   * Summary: The detail page's Edit opens the edit page, whose breadcrumb leads back; Delete removes the distribution and returns to the list.
   *
   * Seed: a file distribution
   *
   * When I choose "Edit" in its detail page's actions menu
   * Then "Edit file distribution" opens, and its breadcrumb's distribution name links back to the
   * detail page
   * When I choose "Cancel"
   * Then the detail page opens
   * When I choose "Delete" in the actions menu and confirm "Delete Distribution"
   * Then the toast "Distribution "<name>" deletion started" appears and the Distributions list opens
   */
  test(
    "The detail page's Edit opens the edit page, whose breadcrumb leads back; Delete removes the distribution and returns to the list.",
    {
      tag: "@DST-DET-03",
      annotation: {
        type: "spec",
        description: "e2e/specs/distributions.md#DST-DET-03",
      },
    },
    async ({ formPage, distributionsPage, toasts, api, cleanup, page }) => {
      const { name, href } = await seedDistribution(api, cleanup);
      const heading = page.getByRole("heading", { level: 1, name });

      await page.goto(detailPath(href));
      await page.getByRole("button", { name: "Actions" }).click();
      await page.getByRole("menuitem", { name: "Edit" }).click();
      await expect(formPage.heading("Edit file distribution")).toBeVisible();
      await expect(
        page
          .getByRole("navigation", { name: "Breadcrumb" })
          .getByRole("link", { name }),
      ).toBeVisible();

      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(heading).toBeVisible();

      await page.getByRole("button", { name: "Actions" }).click();
      await page.getByRole("menuitem", { name: "Delete" }).click();
      await new ConfirmModal(page, "Delete Distribution").confirm("Delete");
      await expect(
        toasts.info(`Distribution "${name}" deletion started`),
      ).toBeVisible();
      await expect(distributionsPage.heading).toBeVisible();
    },
  );

  /**
   * DST-DET-04 · A distribution's task history
   *
   * Summary: The Tasks tab lists the update tasks run on the distribution, their count in the tab title.
   *
   * Seed: a file distribution, edited once so an update task ran
   *
   * When I open its Tasks tab
   * Then the tab title counts one task and the update task is listed
   *
   * The create task isn't listed: it ran before the distribution existed, so it didn't reserve it.
   */
  test(
    "The Tasks tab lists the update tasks run on the distribution, their count in the tab title.",
    {
      tag: "@DST-DET-04",
      annotation: {
        type: "spec",
        description: "e2e/specs/distributions.md#DST-DET-04",
      },
    },
    async ({ api, cleanup, page }) => {
      const { href, basePath } = await seedDistribution(api, cleanup);
      const update = await api.attempt("patch", href, {
        base_path: `${basePath}-updated`,
      });
      const task = (update.body as { task: string }).task;
      await expect
        .poll(async () => (await api.getJson<{ state: string }>(task)).state)
        .toBe("completed");

      await page.goto(detailPath(href));
      const tasksTab = page.getByRole("tab", { name: /^Tasks/ });
      await expect(tasksTab).toHaveText("Tasks (1)");
      await tasksTab.click();
      await expect(
        page
          .getByRole("grid", { name: "Tasks table" })
          .getByText("ageneral_update"),
      ).toBeVisible();
    },
  );
});
