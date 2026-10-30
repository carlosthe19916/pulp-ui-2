import { expect, test } from "@support/fixtures";
import { uniqueName } from "@support/helpers/unique";

const CREATE_PATH = "/content-management/default/remotes/create";
const GALAXY_URL = "https://galaxy.ansible.com/api/";
const REQUIREMENTS = "collections:\n  - name: ansible.posix\n";

interface IRemoteRecord {
  requirements_file: string | null;
}

test.describe("Remote create page", () => {
  test("creates an Ansible collection remote with its requirements", async ({
    formPage,
    page,
    api,
    cleanup,
  }) => {
    await formPage.goto(CREATE_PATH);
    const name = cleanup.remote(uniqueName("remote"));

    // Name and URL typed under another type carry over the switch.
    await formPage.selectType("File");
    await formPage.fill({ Name: name, URL: GALAXY_URL });
    await formPage.selectType("Ansible collection");
    await expect(
      formPage.heading("Create Ansible collection remote"),
    ).toBeVisible();
    await expect(formPage.textbox("Name")).toHaveValue(name);

    // Syncing all of Galaxy is flagged until requirements narrow it down.
    const warning = page.getByText(/downloads every collection on Galaxy/);
    await expect(warning).toBeVisible();
    await formPage.fillCode("Requirements", REQUIREMENTS);
    await expect(warning).toBeHidden();

    await formPage.submit("Create");
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect
      .poll(async () =>
        (
          await api.remote<IRemoteRecord>("ansible/collection", name)
        )?.requirements_file?.trim(),
      )
      .toBe(REQUIREMENTS.trim());
  });

  test("asks before leaving a form with unsaved changes", async ({
    formPage,
    page,
  }) => {
    await formPage.goto(CREATE_PATH);
    await formPage.fill({ Name: uniqueName("remote") });
    const prompt = formPage.leavePrompt();

    await page.getByRole("link", { name: "Remotes" }).click();
    await prompt.button("Stay").click();
    await expect(prompt.dialog).toBeHidden();
    await expect(formPage.textbox("Name")).toBeVisible();

    await page.getByRole("link", { name: "Remotes" }).click();
    await prompt.confirm("Leave");
    await expect(
      page.getByRole("heading", { level: 1, name: "Remotes" }),
    ).toBeVisible();
  });
});
