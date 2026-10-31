import { readFileSync } from "node:fs";

import type { Page, Request } from "@playwright/test";

import { dataFile } from "@support/dataFile";
import { expect, test } from "@support/fixtures";
import {
  DOCKER_HUB_URL,
  FILE_MANIFEST_URL,
  FILE_MANIFEST_URL_2,
} from "@support/helpers/fixtureUrls";
import { idOf } from "@support/helpers/hrefs";
import type { PulpApi } from "@support/helpers/pulp-api";
import { uniqueName } from "@support/helpers/unique";

// Scenarios: e2e/specs/form-pages.md (edit-page behaviour, on the remote pages) and
// e2e/specs/remotes.md (edit).

const PROXY_URL = "http://proxy.example.com:3128";
// A self-signed certificate: Pulp parses the CA certificate it is given.
const CA_CERT = readFileSync(dataFile("test-ca.pem"), "utf8");

interface IRemoteRecord {
  url: string;
  ca_cert: string | null;
  download_concurrency: number | null;
  proxy_url: string | null;
  include_tags?: string[] | null;
  includes?: string[] | null;
  pulp_last_updated: string;
  hidden_fields: { name: string; is_set: boolean }[];
}

const isSet = (remote: IRemoteRecord | undefined, field: string) =>
  remote?.hidden_fields.find((item) => item.name === field)?.is_set;

const editPath = (type: string, href: string) =>
  `/content-management/default/remotes/${type}/${idOf(href)}/edit`;

/** Seed a file remote and return its href and name. */
const seedFileRemote = async (
  api: PulpApi,
  name: string,
  extra: Record<string, unknown> = {},
) => api.createRemote("file/file", { name, url: FILE_MANIFEST_URL, ...extra });

const fileRemote = (api: PulpApi, name: string) =>
  api.remote<IRemoteRecord>("file/file", name);

/** The edit page's PATCH to a file remote. */
const isRemotePatch = (request: Request) =>
  request.method() === "PATCH" && request.url().includes("/remotes/file/file/");

const heading403 = (page: Page) =>
  page.getByRole("heading", { name: "403: Access denied" });

test.describe("Remote edit page", () => {
  // --- Sections -----------------------------------------------------------

  /**
   * FORM-SEC-01 · Sections holding a value open on edit
   *
   * Summary: An edit page opens the sections whose fields hold a value and keeps the others collapsed with a summary.
   *
   * Seed: a file remote with a password, a CA certificate and TLS verification turned off
   *
   * When I open its edit page
   * Then the Authentication and TLS sections are expanded and Proxy, Downloads and Timeouts are
   * collapsed
   * And collapsing TLS shows the summary "Verify off" next to its title
   */
  test(
    "An edit page opens the sections whose fields hold a value and keeps the others collapsed with a summary.",
    {
      tag: "@FORM-SEC-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/form-pages.md#FORM-SEC-01",
      },
    },
    async ({ formPage, api, cleanup }) => {
      const name = cleanup.remote(uniqueName("remote"));
      const href = await seedFileRemote(api, name, {
        password: "s3cret",
        ca_cert: CA_CERT,
        tls_validation: false,
      });

      await formPage.goto(editPath("file.file", href));
      for (const open of ["Authentication", "TLS"]) {
        await expect(formPage.sectionToggle(open)).toHaveAttribute(
          "aria-expanded",
          "true",
        );
      }
      for (const closed of ["Proxy", "Downloads", "Timeouts"]) {
        await expect(formPage.sectionToggle(closed)).toHaveAttribute(
          "aria-expanded",
          "false",
        );
      }
      await formPage.sectionToggle("TLS").click();
      await expect(formPage.sectionToggle("TLS")).toContainText("Verify off");
    },
  );

  // --- Saving -------------------------------------------------------------

  /**
   * FORM-SAVE-02 · Editing sends only what changed
   *
   * Summary: Saving an edit changes only the edited fields; a field emptied by the user is cleared on the server.
   *
   * Seed: a file remote with a URL, a CA certificate, a download concurrency of 5 and a password
   *
   * When I open its edit page, change the URL, empty the CA certificate and Download concurrency, and
   * save
   * Then the toast "Remote "<name>" update started" appears (an edit runs as a task) and its detail
   * page opens
   * And once the task finishes, the server has the new URL, no CA certificate and no download
   * concurrency, and every other setting unchanged
   */
  test(
    "Saving an edit changes only the edited fields; a field emptied by the user is cleared on the server.",
    {
      tag: "@FORM-SAVE-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/form-pages.md#FORM-SAVE-02",
      },
    },
    async ({ formPage, toasts, api, cleanup, page }) => {
      const name = cleanup.remote(uniqueName("remote"));
      const href = await seedFileRemote(api, name, {
        ca_cert: CA_CERT,
        download_concurrency: 5,
        password: "s3cret",
      });

      await formPage.goto(editPath("file.file", href));
      await expect(page.getByRole("button", { name: "Save" })).toBeDisabled();
      await formPage.fill({ URL: FILE_MANIFEST_URL_2 });
      await formPage.fillCode("CA certificate", "");
      await formPage.expandSection("Downloads");
      await page
        .getByRole("spinbutton", { name: "Download concurrency" })
        .fill("");
      const patch = page.waitForRequest(isRemotePatch);
      await formPage.submit("Save");

      expect((await patch).postDataJSON()).toEqual({
        url: FILE_MANIFEST_URL_2,
        ca_cert: null,
        download_concurrency: null,
      });
      await expect(
        toasts.info(`Remote "${name}" update started`),
      ).toBeVisible();
      await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
      await expect
        .poll(async () => {
          const remote = await fileRemote(api, name);
          return [remote?.url, remote?.ca_cert, remote?.download_concurrency];
        })
        .toEqual([FILE_MANIFEST_URL_2, null, null]);
    },
  );

  // --- Secrets ------------------------------------------------------------

  /**
   * FORM-SECRET-01 · Passwords and tokens are never shown
   *
   * Summary: An edit page shows only whether a write-only value is set, and saving without touching it keeps it.
   *
   * Seed: a file remote with a password and no username
   *
   * When I open its edit page and expand Authentication
   * Then Password shows "Set" with "Change" and "Clear", and Username shows "Not set" with "Set"
   * And no field shows the password's value
   * When I change the URL and save
   * Then the password is still set on the server
   */
  test(
    "An edit page shows only whether a write-only value is set, and saving without touching it keeps it.",
    {
      tag: "@FORM-SECRET-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/form-pages.md#FORM-SECRET-01",
      },
    },
    async ({ formPage, api, cleanup, page }) => {
      const name = cleanup.remote(uniqueName("remote"));
      const href = await seedFileRemote(api, name, { password: "s3cret" });

      await formPage.goto(editPath("file.file", href));
      await formPage.expandSection("Authentication");
      await expect(
        page.getByRole("button", { name: "Change Password" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Clear Password" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Set Username" }),
      ).toBeVisible();
      // In order: Username's status and its "Set" button, then Password's status.
      await expect(
        page.getByText(/^(Set|Not set)$/).filter({ visible: true }),
      ).toHaveText(["Not set", "Set", "Set"]);
      await expect(page.getByText("s3cret")).toHaveCount(0);

      await formPage.fill({ URL: FILE_MANIFEST_URL_2 });
      const patch = page.waitForRequest(isRemotePatch);
      await formPage.submit("Save");
      expect((await patch).postDataJSON()).toEqual({
        url: FILE_MANIFEST_URL_2,
      });
      await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
      await expect
        .poll(async () => {
          const remote = await fileRemote(api, name);
          return [remote?.url, isSet(remote, "password")];
        })
        .toEqual([FILE_MANIFEST_URL_2, true]);
    },
  );

  /**
   * FORM-SECRET-02 · Changing and clearing a secret
   *
   * Summary: A changed secret is replaced and cleared secrets are removed on the server.
   *
   * Seed: a file remote with a password, a proxy URL, a proxy username and a proxy password
   *
   * When I open its edit page, choose "Change" on Password and enter a new value, choose "Clear" on
   * Proxy username and on Proxy password, and save
   * Then the server reports the password still set (it can't be read back) and neither proxy
   * credential set, while the proxy URL is unchanged
   *
   * Both proxy credentials are cleared because Pulp accepts them only as a pair.
   */
  test(
    "A changed secret is replaced and cleared secrets are removed on the server.",
    {
      tag: "@FORM-SECRET-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/form-pages.md#FORM-SECRET-02",
      },
    },
    async ({ formPage, api, cleanup, page }) => {
      const name = cleanup.remote(uniqueName("remote"));
      const href = await seedFileRemote(api, name, {
        password: "s3cret",
        proxy_url: PROXY_URL,
        proxy_username: "proxy-user",
        proxy_password: "proxy-pass",
      });

      await formPage.goto(editPath("file.file", href));
      await formPage.expandSection("Authentication");
      await formPage.setSecret({ label: "Password", value: "n3w-s3cret" });
      await formPage.expandSection("Proxy");
      await page.getByRole("button", { name: "Clear Proxy username" }).click();
      await page.getByRole("button", { name: "Clear Proxy password" }).click();
      await formPage.submit("Save");

      await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
      await expect
        .poll(async () => {
          const remote = await fileRemote(api, name);
          return [
            isSet(remote, "password"),
            isSet(remote, "proxy_username"),
            isSet(remote, "proxy_password"),
            remote?.proxy_url,
          ];
        })
        .toEqual([true, false, false, PROXY_URL]);
    },
  );

  // --- Permissions --------------------------------------------------------

  /**
   * FORM-PERM-01 · Editing without change permission
   *
   * Summary: A user who can view a remote but not change it sees Edit disabled, and its edit address shows the access-denied state.
   *
   * Auth: second-user
   * Seed: a file remote; a second user with the "file.fileremote_viewer" role on it
   *
   * Given I am the second user
   * When I open the remote's row actions in the Remotes list and the actions menu on its detail page
   * Then "Edit" is disabled with the tooltip "You don't have permission to change this."
   * When I open the remote's edit address directly
   * Then "403: Access denied" is shown, saying I don't have permission to change the remote, and no
   * form fields are shown
   */
  test(
    "A user who can view a remote but not change it sees Edit disabled, and its edit address shows the access-denied state.",
    {
      tag: "@FORM-PERM-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/form-pages.md#FORM-PERM-01",
      },
    },
    async ({ api, cleanup, secondUser }) => {
      test.slow();
      const name = cleanup.remote(uniqueName("remote"));
      const href = await seedFileRemote(api, name);
      const user = await secondUser.create();
      await api.assignRole(
        { user: user.username },
        { role: "file.fileremote_viewer", contentObject: href },
      );
      const page = await secondUser.login(user);

      await page.goto("/content-management/default/remotes");
      const row = page.getByRole("row", { name: new RegExp(name) });
      await row.getByRole("button", { name: "Kebab toggle" }).click();
      const rowEdit = page.getByRole("menuitem", { name: "Edit" });
      await expect(rowEdit).toHaveAttribute("aria-disabled", "true");
      await rowEdit.hover();
      await expect(page.getByRole("tooltip")).toHaveText(
        "You don't have permission to change this.",
      );
      await page.keyboard.press("Escape");

      await row.getByRole("link", { name }).click();
      await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
      await page.getByRole("button", { name: "Actions" }).click();
      await expect(
        page.getByRole("menuitem", { name: "Edit" }),
      ).toHaveAttribute("aria-disabled", "true");
      await page.keyboard.press("Escape");

      await page.goto(editPath("file.file", href));
      await expect(heading403(page)).toBeVisible();
      await expect(page.getByText(/permission to change remote/)).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: "URL", exact: true }),
      ).toHaveCount(0);
    },
  );

  // --- Addresses ----------------------------------------------------------

  /**
   * FORM-ROUTE-01 · Edit addresses that don't resolve
   *
   * Summary: An edit address for an unknown remote, a remote I can't view, or an unknown type shows an error state instead of the form.
   *
   * Auth: second-user (the "can't view" row)
   * Seed: a file remote; a second user with no roles
   *
   * When I open the edit address of <target>
   * Then <outcome>
   *
   * | target                                | outcome                         |
   * | ------------------------------------- | ------------------------------- |
   * | a remote id that doesn't exist        | "404: That page does not exist" |
   * | the seeded remote, as the second user | "404: That page does not exist" |
   * | a type the UI doesn't know            | "Unable to load resource"       |
   *
   * Pulp answers "not found", not "forbidden", for an object the user can't view.
   */
  test(
    "An edit address for an unknown remote, a remote I can't view, or an unknown type shows an error state instead of the form.",
    {
      tag: "@FORM-ROUTE-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/form-pages.md#FORM-ROUTE-01",
      },
    },
    async ({ api, cleanup, secondUser, page }) => {
      test.slow();
      const name = cleanup.remote(uniqueName("remote"));
      const href = await seedFileRemote(api, name);
      const notFound = page.getByRole("heading", {
        name: "404: That page does not exist",
      });

      await test.step("a remote id that doesn't exist", async () => {
        await page.goto(
          "/content-management/default/remotes/file.file/00000000-0000-7000-8000-000000000000/edit",
        );
        await expect(notFound).toBeVisible();
      });

      await test.step("a type the UI doesn't know", async () => {
        await page.goto(
          `/content-management/default/remotes/bogus.bogus/${idOf(href)}/edit`,
        );
        await expect(
          page.getByRole("heading", { name: "Unable to load resource" }),
        ).toBeVisible();
      });

      await test.step("the seeded remote, as the second user", async () => {
        const user = await secondUser.create();
        const other = await secondUser.login(user);
        await other.goto(editPath("file.file", href));
        await expect(
          other.getByRole("heading", { name: "404: That page does not exist" }),
        ).toBeVisible();
      });
    },
  );

  // --- Remote edit journeys (remotes.md) ------------------------------------

  /**
   * RMT-EDT-01 · Edit from the detail page
   *
   * Summary: Editing a remote from its detail page saves the change and returns to the detail page.
   *
   * Seed: a container remote with include tag "latest"
   *
   * When I open its detail page and choose "Edit" in the actions menu
   * Then "Edit container remote" opens
   * When I add the include tag "stable", remove "latest" and save
   * Then the toast "Remote "<name>" update started" appears and the detail page opens
   * And once the update task finishes, its include tags are only "stable"
   */
  test(
    "Editing a remote from its detail page saves the change and returns to the detail page.",
    {
      tag: "@RMT-EDT-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/remotes.md#RMT-EDT-01",
      },
    },
    async ({ formPage, toasts, api, cleanup, page }) => {
      const name = cleanup.remote(uniqueName("remote"));
      const href = await api.createRemote("container/container", {
        name,
        url: DOCKER_HUB_URL,
        upstream_name: "library/busybox",
        includes: ["latest"],
      });

      await page.goto(
        `/content-management/default/remotes/container.container/${idOf(href)}`,
      );
      await page.getByRole("button", { name: "Actions" }).click();
      await page.getByRole("menuitem", { name: "Edit" }).click();
      await expect(formPage.heading("Edit container remote")).toBeVisible();

      await formPage.addListItems("Include tags", ["stable"]);
      await formPage.removeListItem("latest");
      await formPage.submit("Save");

      await expect(
        toasts.info(`Remote "${name}" update started`),
      ).toBeVisible();
      await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
      await expect
        .poll(async () => {
          const remote = await api.remote<IRemoteRecord>(
            "container/container",
            name,
          );
          return remote?.includes;
        })
        .toEqual(["stable"]);
    },
  );

  /**
   * RMT-EDT-02 · Cancel leaves without saving
   *
   * Summary: Cancel on an unchanged edit page returns to the remote's page without changing it.
   *
   * Seed: a file remote
   *
   * When I open its edit page and choose "Cancel"
   * Then its detail page opens, with no prompt and no change on the server
   */
  test(
    "Cancel on an unchanged edit page returns to the remote's page without changing it.",
    {
      tag: "@RMT-EDT-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/remotes.md#RMT-EDT-02",
      },
    },
    async ({ formPage, api, cleanup, page }) => {
      const name = cleanup.remote(uniqueName("remote"));
      const href = await seedFileRemote(api, name);
      const before = (await fileRemote(api, name))?.pulp_last_updated;

      await formPage.goto(editPath("file.file", href));
      await page.getByRole("button", { name: "Cancel" }).click();

      await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
      await expect(formPage.leavePrompt().dialog).toBeHidden();
      expect((await fileRemote(api, name))?.pulp_last_updated).toBe(before);
    },
  );
});
