import type { Page } from "@playwright/test";

import { expect, test } from "@support/fixtures";
import type { PulpApi } from "@support/helpers/pulp-api";
import { uniqueName } from "@support/helpers/unique";
import type { EntityFormPage } from "@support/pom/EntityFormPage";

// Scenarios: e2e/specs/repositories.md (create).

const CREATE = "/content-management/default/repositories/create";
const SIGNING_SERVICE = "pulp-ui-dev-signing";

const openCreate = async (formPage: EntityFormPage, type: string) => {
  await formPage.goto(`${CREATE}?type=${type}`);
};

/** Open a resource picker, search it by name and return its menu. */
const searchPicker = async (page: Page, label: string, term: string) => {
  const toggle = page.getByRole("button", { name: label, exact: true });
  if ((await toggle.getAttribute("aria-expanded")) !== "true") {
    await toggle.click();
  }
  await page.getByRole("textbox", { name: `${label} filter` }).fill(term);
};

const pickResource = async (page: Page, label: string, name: string) => {
  await searchPicker(page, label, name);
  await page.getByRole("option", { name, exact: true }).click();
};

const signingServiceExists = async (api: PulpApi) => {
  const { count } = await api.getJson<{ count: number }>(
    api.hrefOf("signing-services"),
    { name: SIGNING_SERVICE },
  );
  return count > 0;
};

test.describe("Repository create page", () => {
  /**
   * REP-CRE-01 · Create a repository of each distinctive form
   *
   * Summary: Each repository form saves the fields that define its type, and the new repository's page shows them.
   *
   * Seed: a file remote, an RPM remote
   *
   * When I create a repository of type <type> with <values>
   * Then the toast "Repository "<name>" created" appears, its detail page opens, and the About card
   * on its Details tab shows <shown>
   *
   * | type      | values                                                                      | shown                                        |
   * | --------- | --------------------------------------------------------------------------- | -------------------------------------------- |
   * | File      | a description, the seeded file remote, Auto-publish on, 3 retained versions | the description, the remote, Auto-publish, 3 |
   * | RPM       | the seeded RPM remote and "pulp-ui-dev-signing" as Metadata signing service | the remote and a "Metadata signing service"  |
   * | Container | a description                                                               | the description                              |
   */
  test(
    "Each repository form saves the fields that define its type, and the new repository's page shows them.",
    {
      tag: "@REP-CRE-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/repositories.md#REP-CRE-01",
      },
    },
    async ({ formPage, toasts, api, cleanup, page }) => {
      test.slow();
      const fileRemote = cleanup.remote(uniqueName("remote"));
      const rpmRemote = cleanup.remote(uniqueName("remote"));
      await Promise.all([
        api.createRemote("file/file", {
          name: fileRemote,
          url: "https://fixtures.pulpproject.org/file/PULP_MANIFEST",
        }),
        api.createRemote("rpm/rpm", {
          name: rpmRemote,
          url: "https://fixtures.pulpproject.org/rpm-signed/",
        }),
      ]);
      const hasSigning = await signingServiceExists(api);

      const rows: {
        label: string;
        type: string;
        fill: () => Promise<void>;
        shown: string[];
        /** Settings shown by their form label (a signing service has no name link). */
        terms?: string[];
        skip?: string;
      }[] = [
        {
          label: "File",
          type: "file.file",
          fill: async () => {
            await formPage.fill({ Description: "Release files" });
            await pickResource(page, "Remote", fileRemote);
            // PatternFly hides the switch input under its track: toggle it by keyboard.
            const autopublish = page.getByRole("switch", {
              name: "Auto-publish",
            });
            await autopublish.focus();
            await page.keyboard.press("Space");
            await expect(autopublish).toBeChecked();
            await formPage.expandSection("Retention");
            await page
              .getByRole("spinbutton", { name: "Retained versions" })
              .fill("3");
          },
          shown: ["Release files", fileRemote, "Yes", "3"],
        },
        {
          label: "RPM",
          type: "rpm.rpm",
          fill: async () => {
            await pickResource(page, "Remote", rpmRemote);
            await formPage.expandSection("Signing");
            await pickResource(
              page,
              "Metadata signing service",
              SIGNING_SERVICE,
            );
          },
          shown: [rpmRemote],
          terms: ["Metadata signing service"],
          skip: hasSigning
            ? undefined
            : `the backend has no "${SIGNING_SERVICE}" signing service`,
        },
        {
          label: "Container",
          type: "container.container",
          fill: () => formPage.fill({ Description: "Base images" }),
          shown: ["Base images"],
        },
      ];

      for (const row of rows) {
        await test.step(row.label, async () => {
          if (row.skip) {
            test
              .info()
              .annotations.push({ type: "skip", description: row.skip });
            return;
          }
          const name = cleanup.repository(uniqueName("repo"));
          await openCreate(formPage, row.type);
          await formPage.fill({ Name: name });
          await row.fill();
          await formPage.submit("Create");

          await expect(
            toasts.success(`Repository "${name}" created`),
          ).toBeVisible();
          await expect(
            page.getByRole("heading", { level: 1, name }),
          ).toBeVisible();
          const main = page.getByRole("main");
          for (const text of row.shown) {
            await expect(
              main.getByText(text, { exact: true }).first(),
            ).toBeVisible();
          }
          for (const term of row.terms ?? []) {
            await expect(
              main.getByRole("term").filter({ hasText: term }),
            ).toBeVisible();
          }
        });
      }
    },
  );

  /**
   * REP-CRE-02 · The remote picker offers only compatible remotes
   *
   * Summary: A repository's Remote picker lists only remotes of the types that repository can sync from.
   *
   * Seed: a file remote, an RPM remote
   *
   * When I open the create page with Type "File" and open the Remote picker
   * Then the file remote is offered and the RPM remote is not
   * When I switch the Type to "RPM"
   * Then the RPM remote is offered and the file remote is not
   */
  test(
    "A repository's Remote picker lists only remotes of the types that repository can sync from.",
    {
      tag: "@REP-CRE-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/repositories.md#REP-CRE-02",
      },
    },
    async ({ formPage, api, cleanup, page }) => {
      const fileRemote = cleanup.remote(uniqueName("remote"));
      const rpmRemote = cleanup.remote(uniqueName("remote"));
      await Promise.all([
        api.createRemote("file/file", {
          name: fileRemote,
          url: "https://fixtures.pulpproject.org/file/PULP_MANIFEST",
        }),
        api.createRemote("rpm/rpm", {
          name: rpmRemote,
          url: "https://fixtures.pulpproject.org/rpm-signed/",
        }),
      ]);
      const option = (name: string) =>
        page.getByRole("option", { name, exact: true });
      const noMatches = page.getByRole("option", { name: "No matches" });

      await openCreate(formPage, "file.file");
      await searchPicker(page, "Remote", fileRemote);
      await expect(option(fileRemote)).toBeVisible();
      await searchPicker(page, "Remote", rpmRemote);
      await expect(noMatches).toBeVisible();
      await page.keyboard.press("Escape");

      await formPage.selectType("RPM");
      await expect(formPage.heading("Create RPM repository")).toBeVisible();
      await searchPicker(page, "Remote", rpmRemote);
      await expect(option(rpmRemote)).toBeVisible();
      await searchPicker(page, "Remote", fileRemote);
      await expect(noMatches).toBeVisible();
    },
  );

  /**
   * REP-CRE-03 · Push repositories can't be created
   *
   * Summary: Push-only repository types are not offered on the create page but can still be edited.
   *
   * Manual
   * Seed: a container push repository (only an image push creates one)
   *
   * When I open the Type select on the create page
   * Then it offers "Container" but no container push type
   * When I choose "Edit" on the push repository
   * Then its edit page opens and saving a new description persists it
   */
  test(
    "Push-only repository types are not offered on the create page but can still be edited.",
    {
      tag: "@REP-CRE-03",
      annotation: {
        type: "spec",
        description: "e2e/specs/repositories.md#REP-CRE-03",
      },
    },
    () => {
      test.skip(
        true,
        "Manual: a container push repository is created only by pushing an image",
      );
    },
  );
});
