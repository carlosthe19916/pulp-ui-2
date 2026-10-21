import { expect, test } from "./fixtures";
import { uniqueName } from "./helpers/unique";

/**
 * The global Content page is a read-only, cross-type list over the aggregate
 * `/content/` endpoint (no create/edit/delete). The list is sparse, so rows are
 * identified by the content href id, not relative_path.
 */
test.describe("Content", () => {
  test("renders the list and filters by type via the multi-select", async ({
    contentPage,
  }) => {
    await contentPage.goto();
    await expect(contentPage.table).toBeVisible();

    // Type is a closed server-side enum, so it's a searchable multi-select sent as
    // pulp_type__in — free text would 400. Options are raw pulp_types.
    await contentPage.page.locator("#pulp_type-filter-toggle").click();
    // Options are grouped by owning app — the "rpm" group heading renders.
    await expect(
      contentPage.page.getByRole("heading", { name: "rpm", exact: true }),
    ).toBeVisible();
    // Exercise the in-menu search, then pick the narrowed option (checkbox options
    // render as role="menuitem").
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
    await expect(contentPage.table).toBeVisible();
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
    // The list filters down to this one unit by its unique label, and the Labels
    // column renders `e2e=<label>` — a stable row identifier. (The PRN column shows
    // only a truncated short id, so the full href uuid never appears as row text.)
    const rowText = `e2e=${label}`;

    await contentPage.goto();
    // Switch the filter attribute from the default (Type) to Label. The attribute
    // selector is the first toggle in the filter group (the second "Type"-labelled
    // button is the Type multi-select, so scope + first disambiguates).
    await contentPage.page
      .locator('[data-ouia-component-id="DataViewFilters"]')
      .getByRole("button")
      .first()
      .click();
    await contentPage.page
      .getByRole("menuitem", { name: "Label", exact: true })
      .click();
    // Filter by the unique label so the shared list shows only this unit. The
    // value contains "=", which axios and encodeURIComponent encode differently,
    // so match the filtered GET on the encoding-safe label token.
    await Promise.all([
      contentPage.page.waitForResponse(
        (response) =>
          response.request().method() === "GET" &&
          response.url().includes(label),
      ),
      contentPage.page.getByPlaceholder("Filter by Label").fill(`e2e=${label}`),
    ]);
    await contentPage.expectRowVisible(rowText);

    // Expand the row → the artifacts panel lists each artifact (relative_path →
    // artifact href) from the row's own data, with no extra per-unit GET. The full
    // per-unit detail (checksums, etc.) lives on the dedicated Content detail page.
    await contentPage.expandRow(rowText);
    await expect(contentPage.page.getByText(relativePath)).toBeVisible();
    await expect(
      contentPage.page.getByText("/artifacts/").first(),
    ).toBeVisible();
  });
});
