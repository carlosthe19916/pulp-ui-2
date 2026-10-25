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

## Scenario specs

The admin suites derive from the use cases in `e2e/specs/**/*.md` (the source of truth).
**One test per scenario ID**, its title starting with the ID so it greps back to the spec
(`USR-CRE-02 username`); the coverage check asserts every `### ID` appears in a test title.
The example-table rows are `test.step(row.label, …)` **inside** that one test, sharing a single
page load (and, for read-only scenarios, a single seed) — this is far faster than a test per
row and the report still shows and pins failures to each step. Split rows into separate tests
only when a row must mutate global list state in isolation. Markers map to: `Open:` →
`test.fixme(true, …)`, `Manual` → `test.skip`, `Requires: domains` →
`test.skip(!api.domainEnabled, …)`, `UI gap` → fix the UI (or `test.fail` when no endpoint can
support it). Shared behaviour (lists, forms, dialogs, batch-add) iterates over one descriptor
array, not a copy per screen. Tag a small core subset `@smoke`
(`test(title, { tag: "@smoke" }, …)`) for the reduced CI leg.

Put each scenario in the **cheapest layer that can prove it** (see `e2e/specs/README.md` → Test
layering). RBAC especially: permission **gating** (which actions are enabled/disabled and the
tooltip, per permission combo) is a **component test** on `useObjectPermissions` / `GatedButton`,
not a second-user browser test; backend **enforcement and effect** (a non-superuser is denied; an
assignment or policy change takes effect) is an **api contract test** that acts as the user via
`api.attemptAs(...)`; keep only **one representative e2e per surface** for the real UI journey.
Logging a second user into the browser is the slowest kind of test — add one only when the UI
journey itself is the point, never to re-check a rule a component or api test already owns.

## Structure

- Specs mirror `client/src/app/pages/` all the way down — area, then entity, then the entity's
  surface folder (`<entity>-list`, `<entity>-detail(s)`, …), matching each folder's exact name
  (`user-details` but `content-detail`). A UI spec sits at
  `e2e/tests/<area>/<entity>/<surface>/<spec>.spec.ts`, e.g.
  `content-management/remotes/remote-list/remotes.spec.ts`,
  `admin/users/user-list/user-list.spec.ts`, `admin/users/user-details/user-details.spec.ts`.
  Put a test in the surface it drives; a test that acts from **both** the list and the detail
  page (edit/delete "from each entry point") goes in the `*-list` spec, with its single scenario
  ID. Where the app gives an entity no surface split (e.g. `domains`), the spec stays at the
  entity root.
- The entity's **contract** test (`*.api.spec.ts`, browserless) has no UI surface, so it sits at
  the entity root (`admin/users/users.api.spec.ts`).
- A spec that genuinely spans a whole area rather than one entity sits at the **area root**
  (`admin/admin-lists.spec.ts`, `content-management/creation-forms.spec.ts`); one that spans
  **every** area (a smoke sweep, the seed) sits at the `tests/` root.
- Helpers a split entity's list and detail specs both use are extracted to a per-entity module
  in `tests/helpers/` (`helpers/users.ts`, `helpers/groups.ts`); helpers only one surface uses
  stay local to that spec.
- Shared infra lives at the `tests/` root, not inside an area: `fixtures.ts`, `pom/`,
  `helpers/`, `data/` and `auth.setup.ts`.
- A spec imports `test` and `expect` from `fixtures`, never from `@playwright/test`, so it gets
  the page objects, `api` and `cleanup`. The number of `../` segments matches how deep the spec
  sits below `tests/`: `../../../fixtures` for a surface spec (three folders deep), `../../` for
  an entity-root spec, `../` at the area root. Page objects and helpers may import types and
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

// inventory/widgets/widget-list/widget-list.spec.ts
import { expect, test } from "../../../fixtures";
import { uniqueName } from "../../../helpers/unique";

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
- A required field's label carries a `*`, so an exact `getByLabel("Name")` misses it; locate
  it as `getByRole("textbox", { name: "Name", exact: true })`.
- Playwright treats `aria-disabled="true"` as disabled, so to prove a disabled action does
  nothing, click it with `{ force: true }`.
- Use web-first assertions that retry: `await expect(locator).toBeVisible()`, never
  `expect(await locator.isVisible()).toBe(true)`.
- No `page.waitForTimeout`. Wait for a real event: `page.waitForResponse(...)`, a web-first
  assertion, or `expect.poll(() => api.…)` for server-side state.
- A list refetch can be served from the React Query cache with **no** network request
  (clearing a filter, or sorting a column back to its default), so a bare `waitForResponse`
  hangs. Make such waits tolerant (race a timeout) and assert the settled rows with a
  retrying `expect`/`expect.poll`, never a one-shot read right after the filter helper
  returns. Compare JSON from the API after parsing it (Pulp's jsonb reorders object keys),
  and for "nothing is sent" count requests with `page.on("request")`.
- When a wait or assertion needs a reason (a debounce, a skeleton swap, a cached modal),
  explain it in a short comment.

## Data

- Names come from `uniqueName("widget")` and are registered with `cleanup.*(…)`, which deletes
  leftovers in teardown through the worker-scoped `PulpApi`.
- Set up or verify server state through `api` (`PulpApi`) when the UI path isn't what the
  test is about.
- Gate on backend capabilities with a reason:
  `test.skip(!api.domainEnabled, "domains are disabled on this backend")`.
- A non-admin is the `secondUser` fixture (basic-auth only; it skips other auth modes): it
  creates the user through `api` with just the roles the scenario states and logs it in in its
  own browser context, leaving the admin `page` signed in. Pulp's API can't make a superuser
  (`is_superuser` is ignored), so a scenario needing one is `Manual`.
- `page.route` is for task-poll mocks (the task-mock helper) and `delayApi` (holds real
  requests to observe loading states, spinners and double-submit guards — it delays, never
  fakes a body); everything else runs against the real backend.
- A group's members have no guaranteed order; never assert their row order.
- A spec that changes server-wide state for everyone (the access-policy suite edits and resets
  policies and tightens who may list a resource) runs as its own Playwright project that
  `dependencies` on the main `chromium` project, so it runs after all other specs instead of in
  parallel with them. Mark its describe blocks serial and always restore state in teardown.
- Seed in parallel (`Promise.all`) and mark a test `test.slow()` when it seeds a lot or logs
  in a second user; the first page load needs longer than the default 5s.

## Checklist

Pass/fail rubric for `/eval`. Check changed files under `e2e/`.

- [ ] Specs live under `tests/<area>/<entity>/<surface>/` mirroring `pages/` (entity root for a
      contract test or an unsplit entity, area root for a whole-area spec); a both-surfaces test
      is in the `*-list` spec; shared helpers of a split entity are in `helpers/<entity>.ts`;
      they import `test` / `expect` from `fixtures` with `../` segments matching their depth,
      never `@playwright/test`; page objects come from fixtures.
- [ ] An admin scenario test's title starts with its `e2e/specs` ID; tables are looped, not
      copied; markers map to `fixme` / `skip` / `fail`.
- [ ] Locators are role / label / text based; no CSS, `#id` or `.pf-*` selectors; required
      fields via `getByRole("textbox", …)`.
- [ ] Web-first assertions; no `waitForTimeout`; waits target responses or `expect.poll`, and
      stay tolerant of a cache-served refetch (no network request) rather than hanging.
- [ ] Test data uses `uniqueName` + `cleanup`; capability gating uses `test.skip` with a
      reason; `page.route` only for task mocks and `delayApi`; non-admins use the `secondUser`
      fixture; no assertion on group-member order.
