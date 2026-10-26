---
paths:
  - e2e/**
---

# E2E conventions (Playwright, `e2e/`)

**Tests act like a user and stay stable.** Run with `npm run test:e2e` (or
`npm run test:local -w e2e` against a local Pulp). The `e2e` workspace has **no lint
script** — nothing type-checks it for you, so keep it strict by hand.

## Layering

Put each scenario in the **cheapest layer that can prove it** (`e2e/specs/README.md`
→ Test layering is the source of truth):

- **Component (Vitest)** — client-only behaviour with data mocked (form validation,
  permission **gating** via `useObjectPermissions` / `GatedButton`).
- **API contract (`*.api.spec.ts`, browserless)** — server accept/reject rules,
  including RBAC **enforcement** via `api.attemptAs(...)`. The place to extend for
  every new entity.
- **E2E (`chromium`)** — only the real-UI-against-real-backend journey; keep **one
  representative e2e per surface**. A browser second-user login is the slowest test —
  add one only when the UI journey itself is the point, not to re-check a rule a
  component or api test owns.

## Scenario specs

Admin suites derive from the use cases in `e2e/specs/**/*.md`.

- **One test per scenario ID**, title starting with the ID (`USR-CRE-02 username`);
  the coverage check asserts every `### ID` appears in a title.
- Example-table rows are `test.step(row.label, …)` **inside** that one test, sharing a
  single page load; the report still pins failures to each step. Loop shared behaviour
  (lists, forms, dialogs) over one descriptor array, not a copy per screen.
- Markers map to `test.fixme` (`Open:`), `test.skip` (`Manual`, `Requires: domains`)
  and `test.fail` (`UI gap`, no endpoint); a superuser scenario is `Manual` (Pulp's
  API ignores `is_superuser`). Tag a core subset `@smoke`.

## Structure

- Specs mirror `client/src/app/pages/` to **area / entity / surface**, matching each
  folder's exact name: `content-management/remotes/remote-list/remotes.spec.ts`,
  `admin/users/user-details/user-details.spec.ts`. A test driving **both** list and
  detail goes in the `*-list` spec under one scenario ID.
- An entity's **contract** test (`*.api.spec.ts`) and an entity with no surface split
  (`domains`) sit at the **entity root**. A whole-area spec sits at the **area root**
  (`admin/admin-lists.spec.ts`); a cross-area spec (smoke sweep, seed) at the
  `tests/` root.
- Shared infra lives at the `tests/` root: `fixtures.ts`, `pom/`, `helpers/`,
  `data/`, `auth.setup.ts`. Helpers both surfaces of a split entity use go in
  `helpers/<entity>.ts`; single-surface helpers stay local to the spec.
- A spec imports `test` / `expect` from `fixtures` (never `@playwright/test`) with
  `../` matching its depth, so it gets the page objects, `api` and `cleanup`. Page
  objects are classes in `pom/`; list screens extend `DataViewList` and add only
  their own modal-form helpers.

```ts
// pom/WidgetsPage.ts
export class WidgetsPage extends DataViewList {
  constructor(page: Page) {
    super(page, "Widgets", "Widgets table"); // h1 name, grid aria-label
  }
}

// inventory/widgets/widget-list/widget-list.spec.ts — ../ matches folder depth
import { expect, test } from "../../../fixtures";

test("creates a widget", async ({ widgetsPage, cleanup, api }) => {
  const name = cleanup.widget(uniqueName("widget"));
  await widgetsPage.create({ name });
  await expect.poll(() => api.widgetExists(name)).toBe(true); // server state: poll, not a one-shot read
});
```

## Locators and assertions

- Locate by role, label or text, as a user would (`getByRole`, `getByLabel`,
  `getByPlaceholder`); the data-view table is `getByRole("grid", { name })`. No CSS,
  `#id`, `.pf-*` or XPath **in specs** — a page object may use a PatternFly OUIA hook
  when no role exists (as `DataViewList` does for toasts).
- A required field's label carries a `*`, so locate it as
  `getByRole("textbox", { name, exact: true })`, not `getByLabel`.
- Use web-first assertions that retry (`await expect(locator).toBeVisible()`), never
  `expect(await locator.isVisible()).toBe(true)`.
- No `page.waitForTimeout`. Wait on a real event: `page.waitForResponse`, a web-first
  assertion, or `expect.poll(() => api.…)` for server state. A list refetch can be
  served from the TanStack Query cache with **no** network request, so make such waits
  tolerant (race a timeout) and assert settled rows with a retrying `expect`. Comment
  any wait that needs a reason (debounce, skeleton swap, cached modal).

## Data

- Names come from `uniqueName("widget")`, registered with `cleanup.*(…)` which deletes
  leftovers in teardown via the worker-scoped `PulpApi`. Set up or verify server state
  through `api` when the UI path isn't what the test is about.
- Gate on backend capabilities with a reason:
  `test.skip(!api.domainEnabled, "domains are disabled on this backend")`.
- A non-admin is the `secondUser` fixture (basic-auth only), created through `api` with
  just the scenario's roles. Seed in parallel (`Promise.all`); mark a test
  `test.slow()` when it seeds a lot or logs in a second user.
- `page.route` is only for task-poll mocks and `delayApi` (delays real requests to
  observe loading states; never fakes a body); everything else hits the real backend.
  A spec that changes server-wide state runs as its own serial project that
  `dependencies` on `chromium` and restores state in teardown.

## Checklist

Pass/fail rubric for `/eval`. Check changed files under `e2e/`.

- [ ] Each scenario sits in the cheapest layer that can prove it (gating → component,
      enforcement → `*.api.spec.ts`, one representative e2e per surface).
- [ ] Specs mirror `pages/` to area/entity/surface (entity root for a contract test
      or unsplit entity, area root for a whole-area spec); a both-surfaces test is in
      the `*-list` spec; `test` / `expect` come from `fixtures`, page objects from
      fixtures extending `DataViewList`.
- [ ] An admin test's title starts with its `e2e/specs` ID; tables are looped as
      `test.step`, not copied; markers map to `fixme` / `skip` / `fail`.
- [ ] Locators are role / label / text based (no CSS / `#id` / `.pf-*` in specs;
      required fields via `getByRole("textbox", …)`); web-first assertions, no
      `waitForTimeout`, waits tolerant of a cache-served refetch.
- [ ] Test data uses `uniqueName` + `cleanup`; capability gating uses `test.skip`
      with a reason; non-admins use `secondUser`; `page.route` only for task mocks and
      `delayApi`.
