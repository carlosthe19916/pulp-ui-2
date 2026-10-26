# E2E scenarios

High-level use cases the e2e suite must cover. **These files are the source of truth**: the
Playwright code under `e2e/tests/` is derived from them and may be rewritten at any time; a
scenario changes here first.

## Test layering

Tests live in **three layers**; these specs describe the e2e layer. Each scenario is covered by
exactly one layer (its ID appears in that layer's test title):

- **Component (Vitest)** — `client/src/app/**/*.test.tsx`: client-only behaviour with the data
  hooks mocked — form validation messages, modal defaults and submit wiring, confirm-dialog
  content/style/dismissal, the permission tag input, permission-gated disabling + tooltips, and
  the shared-component mechanics that used to be checked per surface in e2e (the `DataViewList`
  table's sort/paging/filter controls, the add-modal selection state, `DocumentTitle`).
- **API / contract (Playwright `api` project)** — `e2e/tests/api/*.api.spec.ts`: the server's own
  accept/reject rules over REST, no browser — duplicate / length / blank, password and email
  rules, locked-role 403, permission format, malformed policy JSON, membership no-op / unknown
  user, cascades. Fast and stable; the place to extend for every future entity.
- **E2E (this spec, Playwright `chromium`)** — only what needs the **real UI against the real
  backend**: create/edit/delete round-trips, **one** generic "the form shows a server error",
  RBAC and permission effects, cross-page sync, navigation/404s, and full workflows.

So a validation scenario's **server** rules live in the API layer and its **client** checks in the
component layer; e2e keeps the UI journey. Generic table/form/dialog behaviour is exercised against
one reference surface, not every screen. Cover the **main** cases, not every permutation: each
value of an independent dimension at least once (not the full cross-product), and one
representative per free-text equivalence class plus the boundaries.

Each entity has one spec, describing its own list, create/edit/delete, detail, tabs and
navigation end to end:

| File                                     | Prefix | Covers                                                                 |
| ---------------------------------------- | ------ | ---------------------------------------------------------------------- |
| [users.md](users.md)                     | `USR`  | Users list, create/edit/delete, detail, Groups tab, Roles tab, nav     |
| [groups.md](groups.md)                   | `GRP`  | Groups list, permissions, create/edit/delete, detail, Users/Roles tabs |
| [roles.md](roles.md)                     | `ROL`  | Roles list, locked roles, create/edit/delete, permission input         |
| [access-policies.md](access-policies.md) | `ACP`  | Access policy list, edit, reset, permissions, effect                   |

## Writing a scenario

```markdown
### EXAMPLE-01 Password length boundary

Given I open "Create user" and enter a valid username
When I enter the password <password> and submit
Then <outcome>

| password | outcome                                              |
| -------- | ---------------------------------------------------- |
| (empty)  | "Password is required"; the modal stays open         |
| 7 chars  | "Password must be at least 8 characters"; stays open |
| 8 chars  | the user is created                                  |
```

- **ID**: `<AREA>-<SECTION>-<NN>`. IDs are unique across all files and are never renumbered or
  reused; a retired scenario is deleted, not recycled.
- **Language**: what a user sees and does. Quote visible labels, titles, toasts and messages
  exactly. No selectors, component names, endpoints or code.
- **Permutations (main cases, not exhaustive)**: a scenario that varies over inputs carries one
  table; `<placeholders>` in the steps name its columns. For independent finite inputs
  (checkboxes, status transitions, optional fields), cover **each value at least once**, not the
  full cross-product; take the full combination only when the inputs interact (the outcome
  depends on the combination, e.g. a permission gate). For free text, keep one representative per
  equivalence class plus the boundaries (empty, whitespace only, max and max+1 length, duplicate)
  — and only the **server-side** rejections (client-side validation is a component test).
- **Generic mechanics** shared by every screen (a data table's sort/paging/filter controls, a
  modal's selection state) are a component test, not repeated per entity. e2e exercises the real
  backend journey on one reference surface per shape (the Users list, the User roles tab, the
  Add User modal), and each entity spec describes only its own behaviour.
- **Markers** (one line under the heading, only when they apply):
  - `Auth: second-user` — needs a non-admin user created for the test, logged in in a
    separate browser context (basic auth).
  - `Requires: domains` — only on a backend with domains enabled; skipped otherwise.
  - `Seed: <what>` — needs data created first (for example more rows than a page).
  - `Serial` — changes global server state; must not run in parallel with others.
  - `Manual` — not automatable without mocking the server; kept for manual checks.
- **`Open:`** marks a scenario whose expected behaviour is not decided yet (usually a likely
  bug found in the code). Decide it, update the scenario, and remove the marker before
  writing its test.
- **`UI gap:`** marks a scenario where the backend allows or requires something the UI does
  not do yet. The scenario states the backend behaviour (the backend rules); its test is
  expected to fail until the UI is fixed.

Expected outcomes follow the Pulp backend; where the UI disagrees, the backend wins.

## Terms

- **Admin**: the e2e login user (superuser).
- **Second user**: a non-admin user created by the test, holding only the permissions the
  scenario states.
- **Toast**: the alert that appears top-right; _success_ (green) or _danger_ (red).
- **In-form error**: the red alert at the top of a modal form.
