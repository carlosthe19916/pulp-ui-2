import { expect, test } from "@support/fixtures";
import {
  detailPath as distributionDetailPath,
  seedDistribution,
  seedRepository,
} from "@support/helpers/distributions";
import { idOf } from "@support/helpers/hrefs";
import { publicationDetailPath } from "@support/helpers/publications";
import { ConfirmModal } from "@support/pom/ConfirmModal";

// Scenarios: e2e/specs/publications.md (detail page).

test.describe("Publication detail page", () => {
  /**
   * PUB-DET-02 · Details show its source, serving distributions and settings
   *
   * Summary: The Details tab shows the repository and version it was published from, the distributions serving it, its publishing settings and metadata.
   *
   * Seed: a file repository, a file publication of it, and a file distribution serving the publication
   *
   * When I open the publication's Details tab
   * Then the "Source" card shows the repository and its version as links, and the distribution's name
   * as a link
   * And the "Publishing" card shows the manifest file name "PULP_MANIFEST"
   * And the "Metadata" card shows its creation time and its PRN
   * When I click the distribution's name
   * Then the distribution's detail page opens, and its publication links back to this page
   */
  test(
    "The Details tab shows the repository and version it was published from, the distributions serving it, its publishing settings and metadata.",
    {
      tag: "@PUB-DET-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/publications.md#PUB-DET-02",
      },
    },
    async ({ api, cleanup, page }) => {
      const repository = await seedRepository(api, cleanup);
      const href = cleanup.href(
        await api.createViaTask("publications/file/file", {
          repository: repository.href,
        }),
      );
      const distribution = await seedDistribution(api, cleanup, {
        publication: href,
      });

      await page.goto(publicationDetailPath(href));
      const main = page.getByRole("main");
      for (const card of ["Source", "Publishing", "Metadata"]) {
        await expect(main.getByText(card, { exact: true })).toBeVisible();
      }
      await expect(
        main.getByRole("link", { name: repository.name, exact: true }),
      ).toBeVisible();
      await expect(
        main.getByRole("link", { name: `${repository.name} · Version 0` }),
      ).toBeVisible();
      await expect(main.getByText("PULP_MANIFEST")).toBeVisible();
      await expect(main.getByText("Created", { exact: true })).toBeVisible();
      await expect(main.getByText("PRN", { exact: true })).toBeVisible();

      await main
        .getByRole("link", { name: distribution.name, exact: true })
        .click();
      await expect(page).toHaveURL(
        new RegExp(`${distributionDetailPath(distribution.href)}$`),
      );
      await page
        .getByRole("main")
        .getByRole("link", { name: idOf(href), exact: true })
        .click();
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: `Publication ${idOf(href)}`,
        }),
      ).toBeVisible();
    },
  );

  /**
   * PUB-DET-03 · Delete from the detail page
   *
   * Summary: The detail page offers Delete and no Edit; deleting removes the publication and returns to the list.
   *
   * Seed: a file publication
   *
   * When I open its detail page's actions menu
   * Then there is "Delete" and no "Edit"
   * When I choose "Delete" and confirm "Delete Publication"
   * Then the toast "Publication "<id>" deleted" appears and the Publications list opens
   */
  test(
    "The detail page offers Delete and no Edit; deleting removes the publication and returns to the list.",
    {
      tag: "@PUB-DET-03",
      annotation: {
        type: "spec",
        description: "e2e/specs/publications.md#PUB-DET-03",
      },
    },
    async ({ publicationsPage, toasts, api, cleanup, page }) => {
      const repository = await seedRepository(api, cleanup);
      const href = cleanup.href(
        await api.createViaTask("publications/file/file", {
          repository: repository.href,
        }),
      );

      await page.goto(publicationDetailPath(href));
      await page.getByRole("button", { name: "Actions" }).click();
      await expect(
        page.getByRole("menuitem", { name: "Delete" }),
      ).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Edit" })).toHaveCount(0);

      await page.getByRole("menuitem", { name: "Delete" }).click();
      await new ConfirmModal(page, "Delete Publication").confirm("Delete");
      await expect(
        toasts.success(`Publication "${idOf(href)}" deleted`),
      ).toBeVisible();
      await expect(publicationsPage.heading).toBeVisible();
    },
  );
});
