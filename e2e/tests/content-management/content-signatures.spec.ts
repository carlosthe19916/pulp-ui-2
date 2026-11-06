import { readFileSync } from "node:fs";

import type { Page } from "@playwright/test";

import { dataFile } from "@support/dataFile";
import { expect, test } from "@support/fixtures";
import { RPM_FIXTURE_URL } from "@support/helpers/fixtureUrls";
import { idOf } from "@support/helpers/hrefs";
import type { PulpApi } from "@support/helpers/pulp-api";
import {
  SIGNING_SERVICE,
  signingServiceHref,
} from "@support/helpers/signingService";
import { uniqueName } from "@support/helpers/unique";

// Scenarios: e2e/specs/content-signatures.md.

const COLLECTION = "pulpui-signed-1.0.0.tar.gz";
const WHEEL = "sampleproject-4.0.0-py3-none-any.whl";

const file = (name: string, mimeType = "application/octet-stream") => ({
  name,
  mimeType,
  buffer: readFileSync(dataFile(name)),
});

const contentHref = (created: string[]) =>
  created.find((href) => href.includes("/content/")) ?? "";

const openContentTab = async ({
  page,
  repositoryHref,
  pulpType,
}: {
  page: Page;
  repositoryHref: string;
  pulpType: string;
}) => {
  await page.goto(
    `/content-management/default/repositories/${pulpType}/${idOf(repositoryHref)}?tab=content`,
  );
};

/** An Ansible repository holding the sample collection version; returns both hrefs. */
const ansibleRepositoryWithCollection = async ({
  api,
  name,
}: {
  api: PulpApi;
  name: string;
}) => {
  const repositoryHref = await api.createRepository("ansible/ansible", {
    name,
  });
  const collectionHref = contentHref(
    await api.uploadContent("content/ansible/collection_versions", {
      file: file(COLLECTION),
      repository: repositoryHref,
    }),
  );
  return { repositoryHref, collectionHref };
};

test.describe("Content signatures", () => {
  /**
   * SIG-RPM-01 · A package shows the key it was signed with
   *
   * Summary: An uploaded signed RPM shows the key ID and fingerprint of the key Pulp recorded for it.
   *
   * Seed: an RPM repository with one package uploaded from the signed RPM fixtures
   *
   * When I open the repository's Content tab and select the package
   * Then the drawer's "Signatures" section shows the key ID and fingerprint of the key Pulp
   * recorded for it
   */
  test(
    "An uploaded signed RPM shows the key ID and fingerprint of the key Pulp recorded for it.",
    {
      tag: "@SIG-RPM-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/content-signatures.md#SIG-RPM-01",
      },
    },
    async ({ page, api, cleanup }) => {
      const repositoryHref = await api.createRepository("rpm/rpm", {
        name: cleanup.repository(uniqueName("signed-rpm")),
      });
      const packageHref = contentHref(
        await api.uploadContent("content/rpm/packages", {
          file_url: `${RPM_FIXTURE_URL}camel-0.1-1.noarch.rpm`,
          relative_path: "camel-0.1-1.noarch.rpm",
          repository: repositoryHref,
        }),
      );
      const { signing_keys: keys } = await api.getJson<{
        signing_keys: string[];
      }>(packageHref);
      const fingerprint = keys[0].split(":").pop() ?? "";

      await openContentTab({ page, repositoryHref, pulpType: "rpm.rpm" });
      await page
        .getByRole("grid", { name: "Packages" })
        .getByRole("row", { name: /camel/ })
        .click();

      const signature = page.getByLabel("Signature");
      await expect(signature).toContainText(fingerprint.slice(-16));
      await expect(signature).toContainText(fingerprint.slice(0, 4));
    },
  );

  /**
   * SIG-ANS-01 · Signing a collection shows its signature
   *
   * Summary: After "Sign collections" with a signing service, the collection version is marked "Signed", its signature names the service, and the signature links back to it.
   *
   * Seed: an Ansible repository with an uploaded collection version
   *
   * When I run "Sign collections" on the repository with "pulp-ui-dev-signing" and the task finishes
   * Then the collection's row in Browse shows "Signed"
   * And its drawer's "Signatures" section shows "Signed by" "pulp-ui-dev-signing"
   * When I choose "View signature"
   * Then the signature's page opens, and its "Signs" link opens the collection version's page
   */
  test(
    'After "Sign collections" with a signing service, the collection version is marked "Signed", its signature names the service, and the signature links back to it.',
    {
      tag: "@SIG-ANS-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/content-signatures.md#SIG-ANS-01",
      },
    },
    async ({ page, api, cleanup }) => {
      test.slow(); // uploads, then a signing task
      test.skip(
        !(await signingServiceHref(api)),
        `the backend has no "${SIGNING_SERVICE}" signing service`,
      );
      const { repositoryHref } = await ansibleRepositoryWithCollection({
        api,
        name: cleanup.repository(uniqueName("signed-collection")),
      });

      await openContentTab({
        page,
        repositoryHref,
        pulpType: "ansible.ansible",
      });
      await page.getByRole("button", { name: "Actions", exact: true }).click();
      await page.getByRole("menuitem", { name: "Sign collections" }).click();
      const dialog = page.getByRole("dialog", { name: /Sign collections/ });
      await dialog.getByRole("button", { name: "Signing service" }).click();
      await page
        .getByRole("textbox", { name: "Signing service filter" })
        .fill(SIGNING_SERVICE);
      await page.getByRole("option", { name: SIGNING_SERVICE }).click();
      await dialog
        .getByRole("textbox", { name: "Search by name" })
        .fill("signed");
      await dialog
        .getByRole("row", { name: /pulpui\.signed-1\.0\.0/ })
        .getByRole("checkbox")
        .check();
      await dialog
        .getByRole("button", { name: "Sign collections", exact: true })
        .click();

      // Signing adds the signature in a new version; the Content tab follows the latest.
      const row = page
        .getByRole("list", { name: "Collections" })
        .getByRole("listitem")
        .filter({ hasText: "pulpui.signed" });
      await expect(row).toContainText("Signed", { timeout: 30_000 });
      await row.getByText("pulpui.signed", { exact: true }).click();

      const signature = page.getByLabel("Signature");
      await expect(signature).toContainText(SIGNING_SERVICE);
      await signature.getByRole("link", { name: "View signature" }).click();
      await expect(page).toHaveURL(/content\/ansible\.collection_signature\//);
      await page.getByRole("link", { name: "pulpui.signed-1.0.0" }).click();
      await expect(page).toHaveURL(/content\/ansible\.collection_version\//);
    },
  );

  /**
   * SIG-ANS-02 · Signatures are looked up where the details are shown
   *
   * Summary: The drawer shows only signatures in the repository's version, while the content page shows every signature in the domain.
   *
   * Seed: the same collection version in two Ansible repositories, signed in the first only
   *
   * When I open the collection version's details from <where>
   * Then the "Signatures" section shows <shown>
   *
   * | where                               | shown                                      |
   * | ----------------------------------- | ------------------------------------------ |
   * | the first repository's Content tab  | the signature                              |
   * | the second repository's Content tab | "No signatures in this repository version" |
   * | its content page                    | the signature                              |
   */
  test(
    "The drawer shows only signatures in the repository's version, while the content page shows every signature in the domain.",
    {
      tag: "@SIG-ANS-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/content-signatures.md#SIG-ANS-02",
      },
    },
    async ({ page, api, cleanup }) => {
      test.slow(); // two uploads, then a signing task
      const service = await signingServiceHref(api);
      test.skip(
        !service,
        `the backend has no "${SIGNING_SERVICE}" signing service`,
      );
      const signed = await ansibleRepositoryWithCollection({
        api,
        name: cleanup.repository(uniqueName("signed-collection")),
      });
      const unsigned = await ansibleRepositoryWithCollection({
        api,
        name: cleanup.repository(uniqueName("unsigned-collection")),
      });
      await api.runAction(`${signed.repositoryHref}sign/`, {
        content_units: [signed.collectionHref],
        signing_service: service,
      });

      const openDrawer = async (repositoryHref: string) => {
        await openContentTab({
          page,
          repositoryHref,
          pulpType: "ansible.ansible",
        });
        await page
          .getByRole("list", { name: "Collections" })
          .getByText("pulpui.signed", { exact: true })
          .click();
      };

      await test.step("the signed repository's Content tab", async () => {
        await openDrawer(signed.repositoryHref);
        await expect(page.getByLabel("Signature")).toContainText(
          SIGNING_SERVICE,
        );
      });

      await test.step("the unsigned repository's Content tab", async () => {
        await openDrawer(unsigned.repositoryHref);
        await expect(
          page.getByText("No signatures in this repository version"),
        ).toBeVisible();
      });

      await test.step("its content page", async () => {
        await page.goto(
          `/content-management/default/content/ansible.collection_version/${idOf(signed.collectionHref)}`,
        );
        await expect(page.getByLabel("Signature").first()).toContainText(
          SIGNING_SERVICE,
        );
      });
    },
  );

  /**
   * SIG-PY-01 · A package shows its provenance
   *
   * Summary: A Python package with a PEP 740 provenance is marked in Browse, shows its publisher, and the provenance page links back to the package.
   *
   * Seed: a Python repository holding the uploaded sampleproject 4.0.0 wheel and its PyPI provenance
   *
   * When I open the repository's Content tab
   * Then the package's row in Browse shows "Provenance"
   * When I select the package
   * Then the drawer's "Provenance" section shows "Publisher" "GitHub" and a "Repository" link
   * "pypa/sampleproject" to its GitHub page
   * When I choose "View provenance"
   * Then the provenance's page opens, and its "For" link opens the package's page
   */
  test(
    "A Python package with a PEP 740 provenance is marked in Browse, shows its publisher, and the provenance page links back to the package.",
    {
      tag: "@SIG-PY-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/content-signatures.md#SIG-PY-01",
      },
    },
    async ({ page, api, cleanup }) => {
      const repositoryHref = await api.createRepository("python/python", {
        name: cleanup.repository(uniqueName("attested")),
      });
      const packageHref = contentHref(
        await api.uploadContent("content/python/packages", {
          file: file(WHEEL),
          relative_path: WHEEL,
          repository: repositoryHref,
        }),
      );
      await api.uploadContent("content/python/provenance", {
        file: file(`${WHEEL}.provenance.json`, "application/json"),
        package: packageHref,
        repository: repositoryHref,
      });

      await openContentTab({ page, repositoryHref, pulpType: "python.python" });
      const row = page
        .getByRole("grid", { name: "Packages" })
        .getByRole("row", { name: /sampleproject/ });
      await expect(row).toContainText("Provenance");
      await row.click();

      const provenance = page.getByLabel("Provenance", { exact: true });
      await expect(provenance).toContainText("GitHub");
      await expect(
        provenance.getByRole("link", { name: "pypa/sampleproject" }),
      ).toHaveAttribute("href", "https://github.com/pypa/sampleproject");
      await provenance.getByRole("link", { name: "View provenance" }).click();
      await expect(page).toHaveURL(/content\/python\.provenance\//);
      await page
        .getByRole("link", { name: /sampleproject/ })
        .first()
        .click();
      await expect(page).toHaveURL(/content\/python\.python\//);
    },
  );
});
