import { expect, test } from "@support/fixtures";
import { uniqueName } from "@support/helpers/unique";

// Scenarios: e2e/specs/repositories.md (detail).

const SIGNING_SERVICE = "pulp-ui-dev-signing";

const idOf = (href: string) => href.split("/").filter(Boolean).pop() ?? "";

test.describe("Repository About", () => {
  /**
   * REP-DET-01 · About settings follow the form
   *
   * Summary: A repository's About card labels its settings the way its form does.
   *
   * Seed: an RPM repository with a remote, "pulp-ui-dev-signing" as metadata signing service and 3
   * retained versions
   *
   * When I open its Details tab
   * Then its settings use the form's labels ("Remote", "Retained versions", "Metadata signing
   * service", …), the remote links to the remote's page and the signing service shows its name
   * "pulp-ui-dev-signing"
   */
  test(
    "A repository's About card labels its settings the way its form does.",
    {
      tag: "@REP-DET-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/repositories.md#REP-DET-01",
      },
    },
    async ({ api, cleanup, page }) => {
      const { results } = await api.getJson<{
        results: { pulp_href: string }[];
      }>(api.hrefOf("signing-services"), { name: SIGNING_SERVICE });
      test.skip(
        results.length === 0,
        `the backend has no "${SIGNING_SERVICE}" signing service`,
      );

      const remoteName = cleanup.remote(uniqueName("remote"));
      const remote = await api.createRemote("rpm/rpm", {
        name: remoteName,
        url: "https://fixtures.pulpproject.org/rpm-signed/",
      });
      const name = cleanup.repository(uniqueName("repo"));
      const href = await api.createRepository("rpm/rpm", {
        name,
        remote,
        metadata_signing_service: results[0].pulp_href,
        retain_repo_versions: 3,
      });

      await page.goto(
        `/content-management/default/repositories/rpm.rpm/${idOf(href)}`,
      );
      await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
      const main = page.getByRole("main");
      for (const term of [
        "Remote",
        "Retained versions",
        "Metadata signing service",
      ]) {
        await expect(
          main.getByRole("term").filter({ hasText: term }),
        ).toBeVisible();
      }

      // A signing service has no page of its own: it is named, not linked.
      await expect(
        main.getByText(SIGNING_SERVICE, { exact: true }),
      ).toBeVisible();

      await main.getByRole("link", { name: remoteName }).click();
      await expect(
        page.getByRole("heading", { level: 1, name: remoteName }),
      ).toBeVisible();
      await expect(page).toHaveURL(/\/remotes\/rpm\.rpm\//);
    },
  );
});
