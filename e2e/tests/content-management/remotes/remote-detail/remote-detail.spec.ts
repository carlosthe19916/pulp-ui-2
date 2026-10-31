import { expect, test } from "@support/fixtures";
import { uniqueName } from "@support/helpers/unique";

// Scenarios: e2e/specs/remotes.md (detail).

const CARDS = [
  "General",
  "Authentication",
  "Signatures",
  "TLS",
  "Proxy",
  "Downloads",
  "Timeouts",
  "Metadata",
];

test.describe("Remote detail page", () => {
  /**
   * RMT-DET-01 · Settings are grouped like the form
   *
   * Summary: A remote's Details tab groups and labels its settings the way its form does, secrets as Set or Not set.
   *
   * Seed: a container remote with an upstream name, a password, a sigstore URL and a proxy URL
   *
   * When I open its Details tab
   * Then the settings are in cards titled, in order, "General", "Authentication", "Signatures",
   * "TLS", "Proxy", "Downloads", "Timeouts" and "Metadata"
   * And the cards use the form's labels ("Upstream name", "Include tags", "Sigstore URL", …)
   * And Password shows "Set" and Username "Not set", never a value
   * And labels appear in the Metadata card, not as a form setting
   */
  test(
    "A remote's Details tab groups and labels its settings the way its form does, secrets as Set or Not set.",
    {
      tag: "@RMT-DET-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/remotes.md#RMT-DET-01",
      },
    },
    async ({ api, cleanup, page }) => {
      const name = cleanup.remote(uniqueName("remote"));
      const href = await api.createRemote("container/container", {
        name,
        url: "https://registry-1.docker.io",
        upstream_name: "library/busybox",
        password: "s3cret",
        sigstore: "https://sigstore.example.com/",
        proxy_url: "http://proxy.example.com:3128",
        pulp_labels: { env: "prod" },
      });
      const id = href.split("/").filter(Boolean).pop();

      await page.goto(
        `/content-management/default/remotes/container.container/${id}`,
      );
      await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
      const panel = page.getByRole("tabpanel", { name: "Details" });

      // Cards in the form's section order, then Metadata.
      for (const card of CARDS) {
        await expect(
          panel.getByText(card, { exact: true }).first(),
        ).toBeVisible();
      }
      const text = await panel.innerText();
      const positions = CARDS.map((card) => text.indexOf(`${card}\n`));
      expect(positions.every((position) => position >= 0)).toBe(true);
      expect(positions).toEqual([...positions].sort((a, b) => a - b));

      for (const label of ["Upstream name", "Include tags", "Sigstore URL"]) {
        await expect(panel.getByText(label, { exact: true })).toBeVisible();
      }
      await expect(
        panel.getByText("library/busybox", { exact: true }),
      ).toBeVisible();
      await expect(panel.getByText("s3cret")).toHaveCount(0);

      // Secrets show whether they are set, never their value.
      expect(text).toMatch(/Password\s*\n\s*Set\b/);
      expect(text).toMatch(/Username\s*\n\s*Not set\b/);
      // Labels sit in the Metadata card only, not among the form's settings.
      expect(text.indexOf("prod")).toBeGreaterThan(text.indexOf("Metadata\n"));
      await expect(panel.getByText("Labels", { exact: true })).toHaveCount(1);
    },
  );
});
