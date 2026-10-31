import type { Page } from "@playwright/test";

import { expect, test } from "@support/fixtures";
import {
  DISTRIBUTIONS,
  expandedRow,
  expectCreated,
  fileDistribution,
  idOf,
  pickResource,
  seedDistribution,
  seedPublication,
  seedRepository,
  uniqueBasePath,
} from "@support/helpers/distributions";
import { uniqueName } from "@support/helpers/unique";
import type { EntityFormPage } from "@support/pom/EntityFormPage";

// Scenarios: e2e/specs/distributions.md (create).

const CREATE = `${DISTRIBUTIONS}/create?type=file.file`;

const inFormError = (page: Page, title: string) =>
  page.getByRole("heading", {
    name: new RegExp(`^Danger alert:\\s*${title}$`),
  });

/** Open the create page and fill the identity every distribution needs. */
const startCreate = async (formPage: EntityFormPage, name: string) => {
  await formPage.goto(CREATE);
  await expect(formPage.heading("Create file distribution")).toBeVisible();
  await formPage.fill({ Name: name, "Base path": uniqueBasePath(name) });
};

test.describe("Distribution create page", () => {
  /**
   * DST-CRE-01 · Create a distribution serving each kind of source
   *
   * Summary: A distribution can serve a repository's latest version, one repository version or a publication.
   *
   * Seed: a file repository with two versions and a publication of version 1
   *
   * When I create a file distribution with a base path and choose <source>
   * Then the Distributions list opens with the toast "Distribution "<name>" creation started"
   * And when the task finishes, the row expanded shows <serves>
   *
   * | source                                  | serves                      |
   * | --------------------------------------- | --------------------------- |
   * | "Repository" and pick the repository    | the repository (latest)     |
   * | "Repository version" and pick version 1 | version 1 of the repository |
   * | "Publication" and pick the publication  | the publication             |
   */
  test(
    "A distribution can serve a repository's latest version, one repository version or a publication.",
    {
      tag: "@DST-CRE-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/distributions.md#DST-CRE-01",
      },
    },
    async ({ formPage, distributionsPage, toasts, api, cleanup, page }) => {
      test.slow();
      const repository = await seedRepository(api, cleanup);
      await api.addFileContent(repository.href, "one.txt");
      await api.addFileContent(repository.href, "two.txt");
      const version1 = `${repository.href}versions/1/`;
      const publication = await seedPublication(api, cleanup, version1);

      const rows: {
        source: string;
        choose: () => Promise<void>;
        serves: string;
        stored: (
          record: Awaited<ReturnType<typeof fileDistribution>>,
        ) => unknown;
        expected: unknown;
      }[] = [
        {
          source: "Repository",
          choose: () =>
            pickResource(page, {
              label: "Repository",
              filter: repository.name,
              option: repository.name,
            }),
          serves: repository.name,
          stored: (record) => [record?.repository, record?.repository_version],
          expected: [repository.href, null],
        },
        {
          source: "Repository version",
          choose: async () => {
            await pickResource(page, {
              label: "Repository",
              filter: repository.name,
              option: repository.name,
            });
            await page
              .getByRole("button", { name: "Version", exact: true })
              .click();
            await page
              .getByRole("option", { name: "Version 1", exact: true })
              .click();
          },
          serves: `${repository.name} · Version 1`,
          stored: (record) => record?.repository_version,
          expected: version1,
        },
        {
          source: "Publication",
          choose: () =>
            pickResource(page, {
              label: "Publication",
              filter: idOf(publication),
              option: `Publication ${idOf(publication)}`,
            }),
          serves: publication,
          stored: (record) => record?.publication,
          expected: publication,
        },
      ];

      for (const row of rows) {
        await test.step(row.source, async () => {
          const name = cleanup.distribution(uniqueName("dist"));
          await startCreate(formPage, name);
          await page
            .getByRole("radio", { name: row.source, exact: true })
            .check();
          await row.choose();
          await formPage.submit("Create");

          await expect(
            toasts.info(`Distribution "${name}" creation started`),
          ).toBeVisible();
          await expect(distributionsPage.heading).toBeVisible();
          await expectCreated(api, name);
          await expect
            .poll(async () => row.stored(await fileDistribution(api, name)))
            .toEqual(row.expected);

          await distributionsPage.filterBy("Name", name);
          await distributionsPage.expectRowVisible(name);
          await distributionsPage.expandRow(name);
          await expect(
            expandedRow(page).getByText(row.serves).first(),
          ).toBeVisible();
        });
      }
    },
  );

  /**
   * DST-CRE-02 · A base path in use is rejected in the form
   *
   * Summary: Although a distribution is created by a task, a taken base path is refused at submit and shown in the form.
   *
   * Seed: a file distribution with base path "files/stable"
   *
   * When I create another file distribution with base path "files/stable"
   * Then the in-form error "Failed to create distribution" shows the server's reason "This field
   * must be unique.", no task starts, and the page stays open with what I typed
   */
  test(
    "Although a distribution is created by a task, a taken base path is refused at submit and shown in the form.",
    {
      tag: "@DST-CRE-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/distributions.md#DST-CRE-02",
      },
    },
    async ({ formPage, toasts, api, cleanup, page }) => {
      const taken = await seedDistribution(api, cleanup);

      const name = cleanup.distribution(uniqueName("dist"));
      await formPage.goto(CREATE);
      await formPage.fill({ Name: name, "Base path": taken.basePath });
      await formPage.submit("Create");

      await expect(
        inFormError(page, "Failed to create distribution"),
      ).toBeVisible();
      await expect(page.getByText("This field must be unique.")).toBeVisible();
      await expect(toasts.info(/creation started/)).toHaveCount(0);
      await expect(formPage.heading("Create file distribution")).toBeVisible();
      await expect(formPage.textbox("Name")).toHaveValue(name);
      await expect(formPage.textbox("Base path")).toHaveValue(taken.basePath);
    },
  );

  /**
   * DST-CRE-03 · A content guard protects a distribution
   *
   * Summary: A distribution can be created with a content guard, and its row shows the guard.
   *
   * Seed: a file repository, an RBAC content guard
   *
   * When I create a file distribution serving the repository with that content guard
   * Then the row expanded shows the content guard
   */
  test(
    "A distribution can be created with a content guard, and its row shows the guard.",
    {
      tag: "@DST-CRE-03",
      annotation: {
        type: "spec",
        description: "e2e/specs/distributions.md#DST-CRE-03",
      },
    },
    async ({ formPage, distributionsPage, api, cleanup, page }) => {
      const repository = await seedRepository(api, cleanup);
      const guardName = cleanup.contentGuard(uniqueName("guard"));
      const guard = await api.attemptCreate("contentguards/core/rbac", {
        name: guardName,
      });
      const guardHref = (guard.body as { pulp_href: string }).pulp_href;

      const name = cleanup.distribution(uniqueName("dist"));
      await startCreate(formPage, name);
      await pickResource(page, {
        label: "Repository",
        filter: repository.name,
        option: repository.name,
      });
      await formPage.expandSection("Access");
      await pickResource(page, {
        label: "Content guard",
        filter: guardName,
        option: guardName,
      });
      await formPage.submit("Create");

      await expect(distributionsPage.heading).toBeVisible();
      await expectCreated(api, name);
      await expect
        .poll(async () => (await fileDistribution(api, name))?.content_guard)
        .toBe(guardHref);

      await distributionsPage.filterBy("Name", name);
      await distributionsPage.expandRow(name);
      await expect(expandedRow(page).getByText(guardHref)).toBeVisible();
    },
  );
});
