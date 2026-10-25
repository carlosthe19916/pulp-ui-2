# E2E scenarios

High-level use cases the e2e suite must cover. **These files are the source of truth**: the
Playwright code under `e2e/tests/` is derived from them and may be rewritten at any time; a
scenario changes here first.

## Test layering

These specs describe **e2e** (real-backend) behaviour only. Pure client-side behaviour is
covered by faster, isolated **Vitest component tests** colocated with the components
(`client/src/app/**/*.test.tsx`), not here. The split:

- **Component test (Vitest):** form validation messages, modal defaults and submit wiring,
  confirm-dialog content/style/dismissal, the permission tag input, and permission-gated
  disabling + tooltips. These mock the data hooks and need no server.
- **E2E (this spec):** anything that needs the real backend — create/edit/delete round-trips,
  the server's own validation (duplicate, password/email rules, length), RBAC and permission
  effects, cross-page sync, navigation/404s, and full workflows.

So a validation scenario keeps only its **server** rows here (the client-side rows live in the
component test), and generic table/form/dialog behaviour is exercised against one reference
surface rather than every screen. Cover the **main** cases, not every permutation: each value
of an independent dimension at least once (not the full cross-product), and one representative
per free-text equivalence class plus the boundaries.

| File                                                   | Prefix               | Covers                                                  |
| ------------------------------------------------------ | -------------------- | ------------------------------------------------------- |
| [shared/navigation.md](shared/navigation.md)           | `NAV`                | Administration nav, titles, breadcrumbs, route errors   |
| [shared/data-list.md](shared/data-list.md)             | `LIST`               | Filter, sort, pagination and body states of every table |
| [shared/form-modal.md](shared/form-modal.md)           | `FORM`               | Create / edit modal lifecycle                           |
| [shared/confirm-dialog.md](shared/confirm-dialog.md)   | `CONF`               | Delete, remove and reset confirmations                  |
| [shared/batch-add-modal.md](shared/batch-add-modal.md) | `BATCH`              | Multi-select "Add" modals                               |
| [users.md](users.md)                                   | `USR`                | Users list, form, detail, Groups tab                    |
| [groups.md](groups.md)                                 | `GRP`                | Groups list, form, detail, Users tab, permissions       |
| [roles.md](roles.md)                                   | `ROL`, `ROLE-ASSIGN` | Roles list, form, locked roles, role assignments        |
| [access-policies.md](access-policies.md)               | `ACP`                | Access policy list, edit, reset, effect                 |

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

- **ID**: `<AREA>-<SECTION>-<NN>` (shared files: `<AREA>-<NN>`). IDs are unique across all
  files and are never renumbered or reused; a retired scenario is deleted, not recycled.
- **Language**: what a user sees and does. Quote visible labels, titles, toasts and messages
  exactly. No selectors, component names, endpoints or code.
- **Permutations (main cases, not exhaustive)**: a scenario that varies over inputs carries one
  table; `<placeholders>` in the steps name its columns. For independent finite inputs
  (checkboxes, status transitions, optional fields), cover **each value at least once**, not the
  full cross-product; take the full combination only when the inputs interact (the outcome
  depends on the combination, e.g. a permission gate). For free text, keep one representative per
  equivalence class plus the boundaries (empty, whitespace only, max and max+1 length, duplicate)
  — and only the **server-side** rejections (client-side validation is a component test).
- **Shared behaviour** is written once in `shared/` with a table naming every screen it
  applies to, instead of being repeated per area. An area file points to it rather than
  restating it.
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
