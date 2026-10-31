import { expect, test } from "@support/fixtures";
import {
  pickOption,
  publicationId,
  publicationOf,
} from "@support/helpers/publications";
import { uniqueName } from "@support/helpers/unique";

// Scenarios: e2e/specs/publications.md (create).

const CREATE = "/content-management/default/publications/create";

test.describe("Publication create page", () => {
  /**
   * PUB-CRE-01 · Create a publication of a repository
   *
   * Summary: Publishing a repository's latest version creates a publication listed after its task finishes.
   *
   * Seed: a file repository with content
   *
   * When I click "Create publication", choose Type "File", pick the repository and choose "Create"
   * Then the Publications list opens with the toast "Publication creation started"
   * And when the task finishes, a publication of the repository's latest version is listed
   */
  test(
    "Publishing a repository's latest version creates a publication listed after its task finishes.",
    {
      tag: "@PUB-CRE-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/publications.md#PUB-CRE-01",
      },
    },
    async ({ publicationsPage, formPage, toasts, api, cleanup, page }) => {
      const repoName = cleanup.repository(uniqueName("repo"));
      const repoHref = await api.createRepository("file/file", {
        name: repoName,
      });
      await api.addFileContent(repoHref, "hello.txt");

      await publicationsPage.goto();
      await page
        .getByRole("button", { name: "Create publication", exact: true })
        .click();
      await formPage.selectType("File");
      await expect(formPage.heading("Create file publication")).toBeVisible();
      await pickOption(page, { label: "Repository", option: repoName });
      await formPage.submit("Create");

      await expect(toasts.info("Publication creation started")).toBeVisible();
      await expect(publicationsPage.heading).toBeVisible();
      const href = cleanup.href(await publicationOf(api, repoHref));
      const publication = await api.getJson<{ repository_version: string }>(
        href,
      );
      expect(publication.repository_version).toBe(`${repoHref}versions/1/`);
      await publicationsPage.expectRowVisible(
        `Publication ${publicationId(href)}`,
      );
    },
  );

  /**
   * PUB-CRE-02 · Publish a specific repository version
   *
   * Summary: A publication can be made from an older repository version instead of the latest.
   *
   * Seed: a file repository with two versions
   *
   * When I create a file publication of the repository's version 1
   * Then the new publication is of version 1, not the latest
   */
  test(
    "A publication can be made from an older repository version instead of the latest.",
    {
      tag: "@PUB-CRE-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/publications.md#PUB-CRE-02",
      },
    },
    async ({ formPage, api, cleanup, page }) => {
      const repoName = cleanup.repository(uniqueName("repo"));
      const repoHref = await api.createRepository("file/file", {
        name: repoName,
      });
      await api.addFileContent(repoHref, "one.txt");
      await api.addFileContent(repoHref, "two.txt");

      await formPage.goto(`${CREATE}?type=file.file`);
      await page.getByRole("radio", { name: "A specific version" }).check();
      await pickOption(page, { label: "Repository", option: repoName });
      await pickOption(page, { label: "Version", option: "Version 1" });
      await formPage.submit("Create");

      const href = cleanup.href(await publicationOf(api, repoHref));
      const publication = await api.getJson<{ repository_version: string }>(
        href,
      );
      expect(publication.repository_version).toBe(`${repoHref}versions/1/`);
    },
  );

  /**
   * PUB-CRE-03 · The repository picker offers only repositories that can publish
   *
   * Summary: The create page's Repository picker lists only repositories whose type can be published as the chosen type.
   *
   * Seed: a file repository, a container repository
   *
   * When I choose Type "File" and open the Repository picker
   * Then the file repository is offered and the container repository is not
   *
   * The picker is the only guard: Pulp accepts a file publication of a container repository and the
   * task completes, producing a publication no client can use.
   */
  test(
    "The create page's Repository picker lists only repositories whose type can be published as the chosen type.",
    {
      tag: "@PUB-CRE-03",
      annotation: {
        type: "spec",
        description: "e2e/specs/publications.md#PUB-CRE-03",
      },
    },
    async ({ formPage, api, cleanup, page }) => {
      const fileRepo = cleanup.repository(uniqueName("repo-file"));
      const containerRepo = cleanup.repository(uniqueName("repo-container"));
      await Promise.all([
        api.createRepository("file/file", { name: fileRepo }),
        api.createRepository("container/container", { name: containerRepo }),
      ]);

      await formPage.goto(`${CREATE}?type=file.file`);
      await page
        .getByRole("button", { name: "Repository", exact: true })
        .click();
      const filter = page.getByLabel("Repository filter");

      await filter.fill(fileRepo);
      await expect(
        page.getByRole("option", { name: fileRepo, exact: true }),
      ).toBeVisible();
      await filter.fill(containerRepo);
      await expect(
        page.getByRole("option", { name: "No matches" }),
      ).toBeVisible();
      await expect(
        page.getByRole("option", { name: containerRepo, exact: true }),
      ).toHaveCount(0);
    },
  );

  /**
   * PUB-CRE-04 · APT publications by structure
   *
   * Summary: An APT repository can be published as a structured APT publication or as a verbatim copy.
   *
   * Seed: an APT repository
   *
   * When I create a publication of Type <type> with <options>
   * Then once its task finishes, the list shows it with the type <listed>
   * And the server has <stored>
   *
   * | type           | options       | listed                   | stored           |
   * | -------------- | ------------- | ------------------------ | ---------------- |
   * | APT            | Structured on | deb.apt-publication      | structured: true |
   * | APT (verbatim) | (none)        | deb.verbatim-publication | —                |
   *
   * Signing an APT publication is a manual check: the e2e backend has no APT release signing
   * service.
   */
  test(
    "An APT repository can be published as a structured APT publication or as a verbatim copy.",
    {
      tag: "@PUB-CRE-04",
      annotation: {
        type: "spec",
        description: "e2e/specs/publications.md#PUB-CRE-04",
      },
    },
    async ({ publicationsPage, formPage, api, cleanup, page }) => {
      const rows = [
        { type: "APT", listed: "deb.apt-publication", structured: true },
        {
          type: "APT (verbatim)",
          listed: "deb.verbatim-publication",
          structured: undefined,
        },
      ];
      for (const row of rows) {
        await test.step(row.type, async () => {
          // Publishing an empty APT repository completes, so no sync is needed.
          const repoName = cleanup.repository(uniqueName("repo-apt"));
          const repoHref = await api.createRepository("deb/apt", {
            name: repoName,
          });

          await formPage.goto(CREATE);
          await formPage.selectType(row.type);
          await pickOption(page, { label: "Repository", option: repoName });
          if (row.structured) {
            await expect(
              page.getByRole("switch", { name: "Structured" }),
            ).toBeChecked();
          }
          await formPage.submit("Create");

          await expect(publicationsPage.heading).toBeVisible();
          const href = cleanup.href(await publicationOf(api, repoHref));
          await expect(
            publicationsPage.row(`Publication ${publicationId(href)}`),
          ).toContainText(row.listed);
          const publication = await api.getJson<{ structured?: boolean }>(href);
          expect(publication.structured).toBe(row.structured);
        });
      }
    },
  );
});
