import { expect, test } from "@support/fixtures";
import { seedRepository } from "@support/helpers/distributions";
import { idOf } from "@support/helpers/hrefs";
import { uniqueName } from "@support/helpers/unique";

// Scenarios: e2e/specs/publications.md (edit, detail page).

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
      const row = publicationsPage.row(idOf(href));
      await row.getByRole("button", { name: "Kebab toggle" }).click();
      await expect(
        page.getByRole("menuitem", { name: "Delete" }),
      ).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Edit" })).toHaveCount(0);
    },
  );

  /**
   * PUB-DET-01 · Open a publication's page from its name
   *
   * Summary: A publication's name links to its detail page from the Publications list and from its repository's Publications tab.
   *
   * Seed: a file publication of a file repository
   *
   * When I click the publication's id in the Publications list
   * Then its detail page opens with the title "Publication <id>", the label "plugin: file.file" and
   * the tabs Details and Access
   * When I go to the repository's Publications tab and click its id
   * Then the same detail page opens
   */
  test(
    "A publication's name links to its detail page from the Publications list and from its repository's Publications tab.",
    {
      tag: "@PUB-DET-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/publications.md#PUB-DET-01",
      },
    },
    async ({ publicationsPage, api, cleanup, page }) => {
      const repository = await seedRepository(api, cleanup);
      const href = cleanup.href(
        await api.createViaTask("publications/file/file", {
          repository: repository.href,
        }),
      );
      const id = idOf(href);

      const expectDetailPage = async () => {
        await expect(
          page.getByRole("heading", { level: 1, name: `Publication ${id}` }),
        ).toBeVisible();
        await expect(page.getByText("plugin: file.file")).toBeVisible();
        for (const tab of ["Details", "Access"]) {
          await expect(
            page.getByRole("tab", { name: tab, exact: true }),
          ).toBeVisible();
        }
      };

      await publicationsPage.goto();
      await publicationsPage.row(id).getByRole("link", { name: id }).click();
      await expectDetailPage();

      await page.goto(
        `/content-management/default/repositories/file.file/${idOf(repository.href)}`,
      );
      await page.getByRole("tab", { name: /^Publications/ }).click();
      await page
        .getByRole("grid", { name: "Repository publications table" })
        .getByRole("link", { name: id, exact: true })
        .click();
      await expectDetailPage();
    },
  );
});
