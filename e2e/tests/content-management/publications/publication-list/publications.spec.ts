import { expect, test } from "@support/fixtures";
import { publicationId } from "@support/helpers/publications";
import { uniqueName } from "@support/helpers/unique";

// Scenarios: e2e/specs/publications.md (edit).

test.describe("Publications", () => {
  /**
   * PUB-EDT-01 · Publications can't be edited
   *
   * Summary: Publications offer no Edit action, since a publication is immutable.
   *
   * Seed: a file publication
   *
   * When I open its row actions
   * Then there is no "Edit" action
   *
   * Pulp itself allows only reading and deleting a publication.
   */
  test(
    "Publications offer no Edit action, since a publication is immutable.",
    {
      tag: "@PUB-EDT-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/publications.md#PUB-EDT-01",
      },
    },
    async ({ publicationsPage, api, cleanup, page }) => {
      const repoName = cleanup.repository(uniqueName("repo"));
      const repoHref = await api.createRepository("file/file", {
        name: repoName,
      });
      const href = cleanup.href(
        await api.createViaTask("publications/file/file", {
          repository: repoHref,
        }),
      );

      await publicationsPage.goto();
      const row = publicationsPage.row(`Publication ${publicationId(href)}`);
      await row.getByRole("button", { name: "Kebab toggle" }).click();
      await expect(
        page.getByRole("menuitem", { name: "Delete" }),
      ).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Edit" })).toHaveCount(0);
    },
  );
});
