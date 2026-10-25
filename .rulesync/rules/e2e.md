---
name: e2e
description: "Apply when writing or changing Playwright specs, page objects or helpers in e2e/: tests act like a user and stay stable, through fixtures and page objects, role-based locators, retrying assertions and API-backed data with cleanup."
root: false
targets: ["claudecode", "cursor"]
globs: ["e2e/**"]
---

# E2E conventions (Playwright, `e2e/`)

Run with `npm run test:e2e` (or `npm run test:local -w e2e` against a local Pulp). The `e2e`
workspace has no lint script, so nothing type-checks it for you: keep it strict by hand.

## Structure

- One spec per area in `e2e/tests/<area>.spec.ts`.
- Specs import `test` and `expect` from `./fixtures`, never from `@playwright/test`, so they
  get the page objects, `api` and `cleanup`. Page objects and helpers may import types and
  `expect` from `@playwright/test`.
- Page objects are classes in `tests/pom/`. List screens extend `DataViewList` (heading,
  grid, `filterBy`, `row`, `rowAction`) and add only their own modal-form helpers. A spec
  gets them as fixtures (`async ({ widgetsPage }) => …`), registered in `fixtures.ts`.
- Shared logic goes in `tests/helpers/`. Authentication happens once in `auth.setup.ts`.

```ts
// pom/WidgetsPage.ts
export class WidgetsPage extends DataViewList {
  constructor(page: Page) {
    super(page, "Widgets", "Widgets table"); // h1 name, grid aria-label
  }

  async goto(): Promise<void> {
    await this.page.goto("/inventory/widgets");
    await expect(this.heading).toBeVisible();
  }

  async create({ name }: { name: string }): Promise<void> {
    await this.page
      .getByRole("button", { name: "Create widget", exact: true })
      .click();
    const dialog = this.page.getByRole("dialog", { name: "Create Widget" });
    await dialog.getByLabel("Name").fill(name);
    await dialog.getByRole("button", { name: "Create", exact: true }).click();
    await expect(dialog).toBeHidden();
  }
}

// widgets.spec.ts
import { expect, test } from "./fixtures";
import { uniqueName } from "./helpers/unique";

test("creates a widget", async ({ widgetsPage, cleanup, api }) => {
  const name = cleanup.widget(uniqueName("widget"));
  await widgetsPage.goto();
  await widgetsPage.create({ name });
  await widgetsPage.filterBy("Name", name);
  await widgetsPage.expectRowVisible(name);
  // server-side state: poll the API instead of asserting once
  await expect.poll(() => api.widgetExists(name)).toBe(true);
});
```

## Locators and assertions

- Locate by role, label or text, as a user would:
  `getByRole("button", { name: "Create", exact: true })`, `getByLabel`, `getByPlaceholder`.
  The data-view table is `getByRole("grid", { name })`; narrow rows with
  `.filter({ hasText })`.
- No CSS, `#id`, `.pf-*` or XPath selectors.
- Use web-first assertions that retry: `await expect(locator).toBeVisible()`, never
  `expect(await locator.isVisible()).toBe(true)`.
- No `page.waitForTimeout`. Wait for a real event: `page.waitForResponse(...)`, a web-first
  assertion, or `expect.poll(() => api.…)` for server-side state.
- When a wait or assertion needs a reason (a debounce, a skeleton swap, a cached modal),
  explain it in a short comment.

## Data

- Names come from `uniqueName("widget")` and are registered with `cleanup.*(…)`, which deletes
  leftovers in teardown through the worker-scoped `PulpApi`.
- Set up or verify server state through `api` (`PulpApi`) when the UI path isn't what the
  test is about.
- Gate on backend capabilities with a reason:
  `test.skip(!api.domainEnabled, "domains are disabled on this backend")`.
- `page.route` is only for task-poll mocks (the task-mock helper); everything else runs
  against the real backend.

## Checklist

Pass/fail rubric for `/eval`. Check changed files under `e2e/`.

- [ ] Specs import `test` / `expect` from `./fixtures`; page objects come from fixtures.
- [ ] Locators are role / label / text based; no CSS, `#id` or `.pf-*` selectors.
- [ ] Web-first assertions; no `waitForTimeout`; waits target responses or `expect.poll`.
- [ ] Test data uses `uniqueName` + `cleanup`; capability gating uses `test.skip` with a
      reason; `page.route` only for task mocks.
