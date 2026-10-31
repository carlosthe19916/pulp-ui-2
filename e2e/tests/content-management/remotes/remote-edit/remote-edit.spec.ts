import { readFileSync } from "node:fs";

import { dataFile } from "@support/dataFile";
import { expect, test } from "@support/fixtures";
import { uniqueName } from "@support/helpers/unique";

const FILE_URL = "https://fixtures.pulpproject.org/file/PULP_MANIFEST";
const FILE_URL_2 = "https://fixtures.pulpproject.org/file2/PULP_MANIFEST";
// A self-signed certificate: Pulp parses the CA certificate it is given.
const CA_CERT = readFileSync(dataFile("test-ca.pem"), "utf8");

interface IRemoteRecord {
  url: string;
  ca_cert: string | null;
  hidden_fields: { name: string; is_set: boolean }[];
}

const isSet = (remote: IRemoteRecord | undefined, field: string) =>
  remote?.hidden_fields.find((item) => item.name === field)?.is_set;

test.describe("Remote edit page", () => {
  test("sends only what changed: clears a certificate and keeps the password", async ({
    formPage,
    page,
    api,
    cleanup,
  }) => {
    const name = cleanup.remote(uniqueName("remote"));
    const href = await api.createRemote("file/file", {
      name,
      url: FILE_URL,
      ca_cert: CA_CERT,
      password: "s3cret",
    });
    const id = href.split("/").filter(Boolean).pop();

    await formPage.goto(
      `/content-management/default/remotes/file.file/${id}/edit`,
    );
    await expect(formPage.heading("Edit file remote")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toBeDisabled();

    // Sections holding a value open by themselves.
    await expect(formPage.sectionToggle("TLS")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await formPage.fill({ URL: FILE_URL_2 });
    await formPage.fillCode("CA certificate", "");
    await formPage.submit("Save");
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();

    await expect
      .poll(async () => {
        const remote = await api.remote<IRemoteRecord>("file/file", name);
        return [remote?.url, remote?.ca_cert, isSet(remote, "password")];
      })
      .toEqual([FILE_URL_2, null, true]);

    // Clearing the password is explicit.
    await formPage.goto(
      `/content-management/default/remotes/file.file/${id}/edit`,
    );
    await formPage.expandSection("Authentication");
    await formPage.clearSecret("Password");
    await formPage.submit("Save");
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect
      .poll(async () =>
        isSet(await api.remote<IRemoteRecord>("file/file", name), "password"),
      )
      .toBe(false);
  });
});
