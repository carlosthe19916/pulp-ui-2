import { expect, test } from "./fixtures";
import { uniqueName } from "./helpers/unique";

/**
 * The global Content page is a read-only, cross-type list rendered as a PatternFly DataList
 * (role="list") over the aggregate `/content/` endpoint. The response is sparse and uniform, so
 * rows show the full PRN, type, artifact count, labels, and created time; each row expands to its
 * artifacts. Filters (type, label, orphaned, repository-version) narrow the aggregate query.
 */
test.describe("Content", () => {
  test("renders the list and filters by type via the multi-select", async ({
    contentPage,
  }) => {
    await contentPage.goto();
    await expect(contentPage.list).toBeVisible();

    // Type is a closed server-side enum, so it's a searchable multi-select sent as
    // pulp_type__in. Options are raw pulp_types grouped by owning app.
    await contentPage.page.locator("#pulp_type-filter-toggle").click();
    await expect(
      contentPage.page.getByRole("heading", { name: "rpm", exact: true }),
    ).toBeVisible();
    await contentPage.page.getByPlaceholder("Search types…").fill("file.file");
    const option = contentPage.page.getByRole("menuitem", {
      name: "file.file",
      exact: true,
    });
    await option.waitFor({ state: "visible" });
    await Promise.all([
      contentPage.page.waitForResponse(
        (response) =>
          response.request().method() === "GET" &&
          response.url().includes("file.file"),
      ),
      option.click(),
    ]);
    await expect(contentPage.list).toBeVisible();
  });

  test("filters by orphaned age", async ({ contentPage }) => {
    await contentPage.goto();
    await expect(contentPage.list).toBeVisible();

    // Switch the filter attribute to "Orphaned (minutes)" (the first toggle in the filter group
    // is the attribute selector) and enter a value → sent as orphaned_for.
    await contentPage.page
      .locator('[data-ouia-component-id="DataViewFilters"]')
      .getByRole("button")
      .first()
      .click();
    await contentPage.page
      .getByRole("menuitem", { name: "Orphaned (minutes)", exact: true })
      .click();
    await Promise.all([
      contentPage.page.waitForResponse(
        (response) =>
          response.request().method() === "GET" &&
          response.url().includes("orphaned_for=10"),
      ),
      contentPage.page
        .getByPlaceholder("Filter by Orphaned (minutes)")
        .fill("10"),
    ]);
  });

  test("shows an uploaded file content unit", async ({
    contentPage,
    cleanup,
    api,
  }) => {
    // Label the unit so we can filter the shared list down to exactly this one.
    const label = uniqueName("content");
    const relativePath = `e2e/${label}.txt`;
    const contentHref = await api.createFileContent(relativePath, {
      e2e: label,
    });
    cleanup.href(contentHref);
    // The Labels cell renders `e2e=<label>`, a stable row identifier; the full PRN is shown
    // (no 8-char truncation).
    const rowText = `e2e=${label}`;

    await contentPage.goto();
    // Switch the filter attribute from the default (Type) to Label. The attribute selector is
    // the first toggle in the filter group.
    await contentPage.page
      .locator('[data-ouia-component-id="DataViewFilters"]')
      .getByRole("button")
      .first()
      .click();
    await contentPage.page
      .getByRole("menuitem", { name: "Label", exact: true })
      .click();
    // Filter by the unique label so the shared list shows only this unit. The value contains
    // "=", which axios and encodeURIComponent encode differently, so match the filtered GET on
    // the encoding-safe label token.
    await Promise.all([
      contentPage.page.waitForResponse(
        (response) =>
          response.request().method() === "GET" &&
          response.url().includes(label),
      ),
      contentPage.page.getByPlaceholder("Filter by Label").fill(`e2e=${label}`),
    ]);
    await contentPage.expectRowVisible(rowText);

    // Expand the row → the artifacts panel lists each artifact (relative path → artifact href)
    // from the row's own data, with no extra per-unit GET.
    await contentPage.expandRow(rowText);
    await expect(contentPage.page.getByText(relativePath)).toBeVisible();
    await expect(
      contentPage.page.getByText("/artifacts/").first(),
    ).toBeVisible();
  });
});

/**
 * Content-side writes: upload without a repository from the global list, and add a
 * unit to / remove it from a repository from its detail page.
 */
test.describe("Content writes", () => {
  test("uploads content without a repository", async ({ contentPage }) => {
    await contentPage.goto();
    const page = contentPage.page;

    await page.getByRole("button", { name: "Upload content" }).click();
    const dialog = page.getByRole("dialog", { name: /Upload content/ });
    await expect(dialog.getByText("No repository")).toBeVisible();
    const name = `${uniqueName("upload")}.txt`;
    await dialog.locator('input[type="file"]').setInputFiles({
      name,
      mimeType: "text/plain",
      buffer: Buffer.from(`e2e upload ${name}\n`),
    });
    await dialog.getByRole("button", { name: "Upload", exact: true }).click();

    await expect(page.getByText("1 content unit created")).toBeVisible();
    await expect(dialog).toBeHidden();
  });

  test("adds a unit to a repository and removes it again", async ({
    page,
    cleanup,
    api,
  }) => {
    const repository = cleanup.repository(uniqueName("repo"));
    await api.createFileRepository(repository);
    const contentHref = await api.createFileContent(
      `${uniqueName("unit")}.txt`,
    );
    const id = contentHref.split("/").filter(Boolean).pop() ?? "";
    await page.goto(`/content-management/default/content/file.file/${id}`);

    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Add to repository…" }).click();
    const dialog = page.getByRole("dialog", { name: /Add 1 unit/ });
    await dialog.getByRole("button", { name: "Repository" }).click();
    await page
      .getByRole("textbox", { name: "Repository filter" })
      .fill(repository);
    await page.getByRole("option", { name: repository }).click();
    await dialog.getByRole("button", { name: "Add", exact: true }).click();
    await expect(
      page.getByText(`Version 1 of "${repository}" created`),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Repositories" }).click();
    const row = page.getByRole("row", { name: new RegExp(repository) });
    await row.getByRole("button", { name: "Kebab toggle" }).click();
    await page
      .getByRole("menuitem", { name: "Remove from this repository" })
      .click();
    await page
      .getByRole("dialog", { name: /Remove 1 unit from/ })
      .getByRole("button", { name: "Remove", exact: true })
      .click();
    await expect(
      page.getByText(`Version 2 of "${repository}" created`),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Not in any repository" }),
    ).toBeVisible();
  });
});
