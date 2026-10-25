# E2E scenarios

High-level use cases the e2e suite must cover. **These files are the source of truth**: the
Playwright code under `e2e/tests/` is derived from them and may be rewritten at any time; a
scenario changes here first.

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
- **Permutations**: a scenario that varies over inputs carries one table, one row per
  permutation; `<placeholders>` in the steps name its columns. Finite inputs (checkboxes,
  sort column × direction, filter options, permissions, entry points) list **every**
  combination. Free-text inputs list every equivalence class and boundary (empty, whitespace
  only, boundary length, invalid format, duplicate, special characters, very long).
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
