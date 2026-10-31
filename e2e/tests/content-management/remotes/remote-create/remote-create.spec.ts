import { expect, test } from "@support/fixtures";
import {
  DOCKER_HUB_URL,
  FILE_MANIFEST_URL,
  GALAXY_URL,
} from "@support/helpers/fixtureUrls";
import { uniqueName } from "@support/helpers/unique";
import { EntityFormPage } from "@support/pom/EntityFormPage";

// Scenarios: e2e/specs/form-pages.md (create-page behaviour, on the remote pages) and
// e2e/specs/remotes.md (create).

const CREATE = "/content-management/default/remotes/create";
const REQUIREMENTS = "collections:\n  - name: ansible.posix\n";

/** Open the create page with a type preselected, as the Type select would. */
const openCreate = async (formPage: EntityFormPage, type?: string) => {
  await formPage.goto(type ? `${CREATE}?type=${type}` : CREATE);
};

test.describe("Remote create page", () => {
  // --- Type ---------------------------------------------------------------

  /**
   * FORM-TYPE-01 · The Type select lists installed types and swaps the form
   *
   * Summary: The create page's Type select lists only installed plugin types, and choosing one shows that type's own form.
   *
   * When I open "Create remote" from the Remotes list
   * Then the first field is "Type", listing the remote types of the installed plugins by name
   * ("File", "Ansible collection", "Container", …)
   * When I choose <type>
   * Then the title is <title> and the General section shows <field>, which the File form doesn't have
   *
   * | type               | title                              | field         |
   * | ------------------ | ---------------------------------- | ------------- |
   * | Ansible collection | "Create Ansible collection remote" | Requirements  |
   * | Container          | "Create container remote"          | Upstream name |
   */
  test(
    "The create page's Type select lists only installed plugin types, and choosing one shows that type's own form.",
    {
      tag: "@FORM-TYPE-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/form-pages.md#FORM-TYPE-01",
      },
    },
    async ({ remotesPage, formPage, page }) => {
      await remotesPage.goto();
      await page
        .getByRole("button", { name: "Create remote", exact: true })
        .click();
      const typeSelect = page.getByRole("combobox", { name: "Type" });
      await expect(typeSelect).toBeVisible();
      for (const label of ["File", "Ansible collection", "Container"]) {
        await expect(
          typeSelect.getByRole("option", { name: label, exact: true }),
        ).toBeAttached();
      }

      const rows = [
        {
          type: "Ansible collection",
          title: "Create Ansible collection remote",
          field: "Requirements",
        },
        {
          type: "Container",
          title: "Create container remote",
          field: "Upstream name",
        },
      ];
      for (const row of rows) {
        await test.step(row.type, async () => {
          await formPage.selectType(row.type);
          await expect(formPage.heading(row.title)).toBeVisible();
          await expect(formPage.textbox(row.field)).toBeAttached();
        });
      }
    },
  );

  /**
   * FORM-TYPE-02 · Switching type keeps the shared values
   *
   * Summary: Values both types' forms share survive a type switch; values only the old type has are dropped.
   *
   * Given I am creating a Container remote and entered a name, a URL, a password and the upstream
   * name "library/busybox"
   * When I switch the Type to "File"
   * Then the name, URL and password are still filled in
   * When I switch back to "Container"
   * Then the upstream name is empty
   */
  test(
    "Values both types' forms share survive a type switch; values only the old type has are dropped.",
    {
      tag: "@FORM-TYPE-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/form-pages.md#FORM-TYPE-02",
      },
    },
    async ({ formPage, page }) => {
      await openCreate(formPage, "container.container");
      await formPage.fill({
        Name: "carried",
        URL: DOCKER_HUB_URL,
        "Upstream name": "library/busybox",
      });
      await formPage.expandSection("Authentication");
      await formPage.setSecret({ label: "Password", value: "s3cret" });

      await formPage.selectType("File");
      await expect(formPage.heading("Create file remote")).toBeVisible();
      await expect(formPage.textbox("Name")).toHaveValue("carried");
      await expect(formPage.textbox("URL")).toHaveValue(DOCKER_HUB_URL);
      await formPage.expandSection("Authentication");
      await expect(page.getByLabel(/^Password/)).toHaveValue("s3cret");

      await formPage.selectType("Container");
      await expect(formPage.textbox("Upstream name")).toHaveValue("");
    },
  );

  /**
   * FORM-TYPE-03 · The selected type is part of the address
   *
   * Summary: The create page's address carries the selected type, so reloading or sharing it opens the same form.
   *
   * Given I chose "Ansible collection" on the create page
   * When I reload the page
   * Then the "Create Ansible collection remote" form is shown again
   * And opening a create address whose type isn't installed shows the first installed type's form
   */
  test(
    "The create page's address carries the selected type, so reloading or sharing it opens the same form.",
    {
      tag: "@FORM-TYPE-03",
      annotation: {
        type: "spec",
        description: "e2e/specs/form-pages.md#FORM-TYPE-03",
      },
    },
    async ({ formPage, page }) => {
      await openCreate(formPage);
      await formPage.selectType("Ansible collection");
      await expect(page).toHaveURL(/type=ansible\.collection/);

      await page.reload();
      await expect(
        formPage.heading("Create Ansible collection remote"),
      ).toBeVisible();

      await openCreate(formPage, "bogus.bogus");
      await expect(formPage.heading("Create file remote")).toBeVisible();
    },
  );

  // --- Saving -------------------------------------------------------------

  /**
   * FORM-SAVE-01 · Creating leaves for the new object
   *
   * Summary: A successful create shows a success toast and opens the new object's page, without asking to leave.
   *
   * When I create a file remote
   * Then the toast "Remote "<name>" created" appears and its detail page opens
   * And no "Leave without saving?" prompt appeared
   */
  test(
    "A successful create shows a success toast and opens the new object's page, without asking to leave.",
    {
      tag: "@FORM-SAVE-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/form-pages.md#FORM-SAVE-01",
      },
    },
    async ({ formPage, toasts, cleanup, page }) => {
      const name = cleanup.remote(uniqueName("remote"));
      await openCreate(formPage, "file.file");
      await formPage.fill({ Name: name, URL: FILE_MANIFEST_URL });
      await formPage.submit("Create");

      await expect(toasts.success(`Remote "${name}" created`)).toBeVisible();
      await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
      await expect(formPage.leavePrompt().dialog).toBeHidden();
    },
  );

  /**
   * FORM-SAVE-03 · A server error stays in the form
   *
   * Summary: When the server rejects a submit, the error shows at the top of the form and what was typed is kept.
   *
   * Seed: an RPM remote named "taken"
   *
   * When I create a file remote named "taken"
   * Then the in-form error "Failed to create remote" appears with the server's reason "This field
   * must be unique." (remote names are unique across every remote type)
   * And the page stays open with everything I typed
   */
  test(
    "When the server rejects a submit, the error shows at the top of the form and what was typed is kept.",
    {
      tag: "@FORM-SAVE-03",
      annotation: {
        type: "spec",
        description: "e2e/specs/form-pages.md#FORM-SAVE-03",
      },
    },
    async ({ formPage, api, cleanup, page }) => {
      const name = cleanup.remote(uniqueName("taken"));
      await api.createRemote("rpm/rpm", { name, url: "https://example.com/" });

      await openCreate(formPage, "file.file");
      await formPage.fill({ Name: name, URL: FILE_MANIFEST_URL });
      await formPage.submit("Create");

      await expect(
        formPage.submitError("Failed to create remote"),
      ).toBeVisible();
      await expect(page.getByText("This field must be unique.")).toBeVisible();
      await expect(formPage.heading("Create file remote")).toBeVisible();
      await expect(formPage.textbox("Name")).toHaveValue(name);
      await expect(formPage.textbox("URL")).toHaveValue(FILE_MANIFEST_URL);
    },
  );

  // --- Code editor --------------------------------------------------------

  /**
   * FORM-CODE-01 · Upload a file into a code field
   *
   * Summary: A code field accepts an uploaded file, and its content is what gets saved.
   *
   * When I create an Ansible collection remote and upload a requirements.yml file into Requirements
   * Then the editor shows the file's content
   * And after creating, the remote's requirements on the server equal the file's content
   */
  test(
    "A code field accepts an uploaded file, and its content is what gets saved.",
    {
      tag: "@FORM-CODE-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/form-pages.md#FORM-CODE-01",
      },
    },
    async ({ formPage, api, cleanup, page }) => {
      const name = cleanup.remote(uniqueName("remote"));
      await openCreate(formPage, "ansible.collection");
      await formPage.fill({ Name: name, URL: GALAXY_URL });

      const chooser = page.waitForEvent("filechooser");
      await page
        .getByRole("button", { name: "Upload requirements from a file" })
        .click();
      await (
        await chooser
      ).setFiles({
        name: "requirements.yml",
        mimeType: "text/yaml",
        buffer: Buffer.from(REQUIREMENTS),
      });
      await expect(page.getByText("ansible.posix")).toBeVisible();

      await formPage.submit("Create");
      await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
      await expect
        .poll(async () => {
          const remote = await api.remote<{ requirements_file: string | null }>(
            "ansible/collection",
            name,
          );
          return remote?.requirements_file?.trimEnd();
        })
        // The editor drops the file's trailing newline.
        .toBe(REQUIREMENTS.trimEnd());
    },
  );

  // --- Leaving ------------------------------------------------------------

  /**
   * FORM-LEAVE-01 · Leaving with unsaved changes asks first
   *
   * Summary: Navigating away from a form with unsaved changes asks for confirmation; staying keeps the input.
   *
   * Given I typed a name on the create page
   * When I click the "Remotes" breadcrumb
   * Then the "Leave without saving?" prompt opens
   * When I choose "Stay"
   * Then the prompt closes and the name is still there
   * When I click the breadcrumb again and choose "Leave"
   * Then the Remotes list opens
   */
  test(
    "Navigating away from a form with unsaved changes asks for confirmation; staying keeps the input.",
    {
      tag: "@FORM-LEAVE-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/form-pages.md#FORM-LEAVE-01",
      },
    },
    async ({ formPage, remotesPage, page }) => {
      await openCreate(formPage, "file.file");
      await formPage.fill({ Name: "unsaved" });

      const breadcrumb = page
        .getByRole("link", { name: "Remotes", exact: true })
        .last();
      await breadcrumb.click();
      const prompt = formPage.leavePrompt();
      await expect(prompt.dialog).toBeVisible();
      await prompt.button("Stay").click();
      await expect(prompt.dialog).toBeHidden();
      await expect(formPage.textbox("Name")).toHaveValue("unsaved");

      await breadcrumb.click();
      await prompt.button("Leave").click();
      await expect(remotesPage.heading).toBeVisible();
    },
  );

  /**
   * FORM-LEAVE-02 · Values carried over a type switch count as unsaved
   *
   * Summary: After a type switch carries values over, leaving still asks for confirmation.
   *
   * Given I typed a name, switched the Type and changed nothing else
   * When I click the "Remotes" breadcrumb
   * Then the "Leave without saving?" prompt opens
   */
  test(
    "After a type switch carries values over, leaving still asks for confirmation.",
    {
      tag: "@FORM-LEAVE-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/form-pages.md#FORM-LEAVE-02",
      },
    },
    async ({ formPage, page }) => {
      await openCreate(formPage, "file.file");
      await formPage.fill({ Name: "carried" });
      await formPage.selectType("Container");
      await expect(formPage.textbox("Name")).toHaveValue("carried");

      await page
        .getByRole("link", { name: "Remotes", exact: true })
        .last()
        .click();
      await expect(formPage.leavePrompt().dialog).toBeVisible();
    },
  );

  // --- Permissions --------------------------------------------------------

  /**
   * FORM-PERM-02 · Creating without create permission
   *
   * Summary: A user without create permission can open the create page, and the server's refusal shows in the form.
   *
   * Auth: second-user
   *
   * Given I am a second user with no roles
   * Then "Create remote" on the Remotes list is enabled (Pulp can't tell the UI who may create)
   * When I fill in a file remote and submit
   * Then the in-form error "Failed to create remote" shows the server's reason "You do not have
   * permission to perform this action.", and the page stays open
   */
  test(
    "A user without create permission can open the create page, and the server's refusal shows in the form.",
    {
      tag: "@FORM-PERM-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/form-pages.md#FORM-PERM-02",
      },
    },
    async ({ secondUser }) => {
      test.slow();
      const user = await secondUser.create();
      const page = await secondUser.login(user);

      await page.goto("/content-management/default/remotes");
      const create = page.getByRole("button", {
        name: "Create remote",
        exact: true,
      });
      await expect(create).toBeEnabled();
      await create.click();
      await page
        .getByRole("combobox", { name: "Type" })
        .selectOption({ label: "File" });
      await page
        .getByRole("textbox", { name: "Name", exact: true })
        .fill(uniqueName("denied"));
      await page
        .getByRole("textbox", { name: "URL", exact: true })
        .fill(FILE_MANIFEST_URL);
      await page.getByRole("button", { name: "Create", exact: true }).click();

      await expect(
        new EntityFormPage(page).submitError("Failed to create remote"),
      ).toBeVisible();
      await expect(
        page.getByText("You do not have permission to perform this action."),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: "Create file remote" }),
      ).toBeVisible();
    },
  );

  // --- Per-plugin create (remotes.md) -------------------------------------

  /**
   * RMT-CRE-01 · Create a remote of each distinctive form
   *
   * Summary: Each remote form saves the fields that define its type, and the new remote's page shows them.
   *
   * When I create a remote of type <type> with <values>
   * Then its detail page opens and shows <shown>
   *
   * | type               | values                                                                            | shown                                        |
   * | ------------------ | --------------------------------------------------------------------------------- | -------------------------------------------- |
   * | File               | a PULP_MANIFEST URL and the "On demand" download policy                           | the URL and policy "on_demand"               |
   * | Ansible collection | the Galaxy URL and requirements listing ansible.posix                             | the requirements                             |
   * | Container          | a registry URL, upstream name "library/busybox", include tags "latest" and "1.36" | the upstream name and both include tags      |
   * | APT                | a Debian URL, distributions "bookworm", components "main", architectures "amd64"  | the distributions, components, architectures |
   * | Python             | the PyPI URL, include project "django" and package type "Wheel (bdist_wheel)"     | the include and the package type             |
   * | RPM (ULN)          | a ULN channel URL and the ULN username and password                               | the URL, with username and password "Set"    |
   */
  test(
    "Each remote form saves the fields that define its type, and the new remote's page shows them.",
    {
      tag: "@RMT-CRE-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/remotes.md#RMT-CRE-01",
      },
    },
    async ({ formPage, cleanup, page }) => {
      test.slow();
      const rows: {
        label: string;
        type: string;
        fill: (name: string) => Promise<void>;
        shown: string[];
      }[] = [
        {
          label: "File",
          type: "file.file",
          fill: async (name) => {
            await formPage.fill({ Name: name, URL: FILE_MANIFEST_URL });
            await page.getByRole("radio", { name: "On demand" }).check();
          },
          shown: [FILE_MANIFEST_URL, "on_demand"],
        },
        {
          label: "Ansible collection",
          type: "ansible.collection",
          fill: async (name) => {
            await formPage.fill({ Name: name, URL: GALAXY_URL });
            await formPage.fillCode("Requirements", REQUIREMENTS);
          },
          shown: ["ansible.posix"],
        },
        {
          label: "Container",
          type: "container.container",
          fill: async (name) => {
            await formPage.fill({
              Name: name,
              URL: DOCKER_HUB_URL,
              "Upstream name": "library/busybox",
            });
            await formPage.addListItems("Include tags", ["latest", "1.36"]);
          },
          shown: ["library/busybox", "latest, 1.36"],
        },
        {
          label: "APT",
          type: "deb.apt-remote",
          fill: async (name) => {
            // Pulp takes these as space-separated text.
            await formPage.fill({
              Name: name,
              URL: "https://deb.debian.org/debian/",
              Distributions: "bookworm",
              Components: "main",
              Architectures: "amd64",
            });
          },
          shown: ["bookworm", "main", "amd64"],
        },
        {
          label: "Python",
          type: "python.python",
          fill: async (name) => {
            await formPage.fill({ Name: name, URL: "https://pypi.org/" });
            await formPage.addListItems("Include projects", ["django"]);
            await formPage.expandSection("Package selection");
            await page
              .getByRole("checkbox", { name: "Wheel (bdist_wheel)" })
              .check();
          },
          shown: ["django", "bdist_wheel"],
        },
        {
          label: "RPM (ULN)",
          type: "rpm.uln",
          fill: async (name) => {
            await formPage.fill({
              Name: name,
              URL: "uln://ol8_x86_64_baseos_latest",
            });
            await formPage.setSecret({
              label: "ULN username",
              value: "uln-user",
            });
            await formPage.setSecret({
              label: "ULN password",
              value: "uln-pass",
            });
          },
          shown: ["uln://ol8_x86_64_baseos_latest"],
        },
      ];

      for (const row of rows) {
        await test.step(row.label, async () => {
          const name = cleanup.remote(uniqueName("remote"));
          await openCreate(formPage, row.type);
          await row.fill(name);
          await formPage.submit("Create");

          await expect(
            page.getByRole("heading", { level: 1, name }),
          ).toBeVisible();
          const main = page.getByRole("main");
          for (const text of row.shown) {
            // Requirements render as one YAML block; every other value is its own text.
            const exact = text !== "ansible.posix";
            await expect(main.getByText(text, { exact }).first()).toBeVisible();
          }
          if (row.type === "rpm.uln") {
            await expect(main.getByText("Set", { exact: true })).toHaveCount(2);
          }
        });
      }
    },
  );
});
