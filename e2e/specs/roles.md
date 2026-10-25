---
area: roles
routes: [/admin/roles]
---

# Roles and role assignments

Shared behaviour that also applies here:

- Table filter, sort, paging, empty states: [data-list.md](shared/data-list.md) — Roles, User
  roles, Group roles, Select roles.
- Create and edit modal lifecycle: [form-modal.md](shared/form-modal.md) — Create role, Edit
  role.
- Delete and remove dialogs: [confirm-dialog.md](shared/confirm-dialog.md) — Delete role,
  Remove role from user, Remove role from group.
- Add modals: [batch-add-modal.md](shared/batch-add-modal.md) — Add role to user, Add role to
  group.

Roles have no detail page.

## List

### ROL-LIST-01 Row content

Given a role named <name> with description <description>, <n> permissions and locked <locked>
When I find it in the Roles list
Then the row shows Name <name> (plain text), Plugin <plugin>, Description <cell>, Permissions
<n> and Locked <label>

Main cases (a locked built-in, a custom role with a description, a no-dot plugin, a long
description that truncates):

| name            | description    | n   | locked | plugin | cell                     | label |
| --------------- | -------------- | --- | ------ | ------ | ------------------------ | ----- |
| core.task_owner | (built-in)     | ≥1  | yes    | core   | the description, or —    | Yes   |
| custom.reader   | Reads things   | 1   | no     | custom | Reads things             | No    |
| reader          | (empty)        | 0   | no     | other  | —                        | No    |
| custom.long     | 500 characters | 0   | no     | custom | cut off with an ellipsis | No    |

### ROL-LIST-02 Locked filter

Given the Roles list
When I choose <option> in the Locked filter
Then <rows> are listed and the filter shows <option>

| option    | rows                       |
| --------- | -------------------------- |
| All roles | locked and unlocked roles  |
| Locked    | only roles with Locked Yes |
| Unlocked  | only roles with Locked No  |

### ROL-LIST-03 Locked filter combined with the name filter and sort

Seed: an unlocked role whose name shares a text with a built-in locked role (`e2e-match`
below); Pulp can't create locked roles, so the locked one is built in

When I choose Locked <option>, type <name filter> and sort by <sort>
Then the listed rows are exactly <rows>, in the sort order

Main cases (each Locked option once, combined with the name filter and sort; the generic
filter/sort behaviour is [data-list.md](shared/data-list.md)):

| option    | name filter | sort              | rows                      |
| --------- | ----------- | ----------------- | ------------------------- |
| All roles | (empty)     | Locked descending | every role, locked first  |
| Locked    | e2e-match   | Name ascending    | the seeded locked role    |
| Unlocked  | e2e-match   | Name ascending    | the seeded unlocked role  |
| Unlocked  | no-match    | Name ascending    | none — "No results found" |

### ROL-LIST-04 Clearing both filters

Given Locked is <option> and the name filter is <name filter>
When I click <clear>
Then the name filter is empty, Locked shows "All roles", page 1 shows every role

Main cases (clear from the toolbar, and clear from the empty state):

| option   | name filter | clear                                  |
| -------- | ----------- | -------------------------------------- |
| Unlocked | e2e-match   | "Clear filters" in the toolbar         |
| Unlocked | no-match    | "Clear all filters" in the empty state |

### ROL-LIST-05 Locked filter alone gives the filtered empty state

Given no unlocked roles match (for example with the name filter of a locked role)
When I choose Unlocked
Then "No results found" with "Clear all filters" shows

## Locked roles

### ROL-LOCK-01 Locked roles cannot be edited or deleted

When I open the row actions of a role with Locked <locked>
Then Edit is <edit> and Delete is <delete>

| locked | edit                                              | delete                                             |
| ------ | ------------------------------------------------- | -------------------------------------------------- |
| Yes    | disabled, tooltip "Locked roles cannot be edited" | disabled, tooltip "Locked roles cannot be deleted" |
| No     | enabled                                           | enabled                                            |

And clicking a disabled action opens nothing.
And Pulp itself refuses to change or delete a locked role ("The role is locked."), so the
disabled actions match the backend.

### ROL-LOCK-02 Locked roles can still be assigned

When I open "Add Role" for a user or group
Then locked roles are listed and selectable, and adding one succeeds

## Create

> **Layering:** form fields/defaults and client-side validation (the "required" and format
> rows) are component tests (see the form modal's `*.test.tsx`). The rows below keep only the
> **server** outcomes and the **main** cases, not every permutation.

### ROL-CRE-01 Form

When I click "Create Role"
Then the "Create Role" modal shows Name (required), Description and Permissions (an input
with the hint "Type a permission (e.g. core.view_task) and press Enter")

### ROL-CRE-02 Name

The server's name rules (plugin prefix, no length limit, blank, unique across custom and locked)
are an **api contract** test (`roles.api.spec.ts`); the client "required" check is a component
test. The e2e create journey is ROL-CRE-05, and the generic server-rejection surface is
[FORM-09](shared/form-modal.md#form-09-server-rejection-shows-in-the-form). Description display
(including the list ellipsis) is covered by [ROL-LIST-01](#rol-list-01-row-content).

### ROL-CRE-04 Permissions on create

The server's permission rules (unknown codename, missing-dot format) are an **api contract** test
(`roles.api.spec.ts`); the tag input itself is a component test
(`.../RoleModal/PermissionInput.test.tsx`). That a role is created with its permissions is part
of the ROL-CRE-05 journey.

### ROL-CRE-05 The new role appears

When I create a role
Then the toast `Role "<name>" created` appears and the role is in the Roles list, Locked No

## Permission input

> **Layering:** the tag input's own behaviour (ROL-PERM-01/02/03 — adding on Enter, trimming,
> dedupe, sorting, removing with × or Backspace, and folding past 10 behind "N more") is a
> component test (`.../RoleModal/PermissionInput.test.tsx`). e2e keeps only the parts that need
> the server: the case-sensitive permission that saves with an error, and the Open decision
> below.

### ROL-PERM-01 A permission that saves with a server error

The tag input's own behaviour (adding on Enter, trimming, dedupe, sorting, removing with × or
Backspace, folding past 10 behind "N more") is a component test
(`.../RoleModal/PermissionInput.test.tsx`). Only the part that needs the server stays here.

Given the role form
When I add `core.view_task`, then `Core.view_task`, and save
Then both are sent as two tags and the save fails with "Permission 'Core.view_task' does not
exist." (Pulp matches codenames exactly)

## Edit

The edit modal's form (fields, the disabled Name, saved values) is a component test
(`.../RoleModal/*.test.tsx`), so ROL-EDT-01 is not an e2e scenario.

### ROL-EDT-02 Changing description and permissions

Given an unlocked role with a description and permissions `a.x`, `b.x`
When I <description change>, <add change> and <remove change> and save
Then the toast `Role "<name>" updated` appears and the saved role matches

Main cases (change description, add, and remove — each at least once), not the full grid (use
real permission codenames, e.g. `core.view_task`):

| description change   | add change  | remove change  |
| -------------------- | ----------- | -------------- |
| keep the description | add `c.x`   | remove `a.x`   |
| change it            | add nothing | remove nothing |
| keep the description | add nothing | remove both    |

### ROL-EDT-03 Clearing the description

The server rule (Pulp clears a description only on null, rejecting empty text) is an **api
contract** test (`roles.api.spec.ts`). The UI gap — the form leaves an empty field out of the
update, so the old text is kept — is the same gap kept once as
[USR-EDT-05](users.md#usr-edt-05-clearing-a-text-field).

### ROL-EDT-04 Invalid permission on edit

The server rejection of an unknown permission on edit is covered generically by
[FORM-09](shared/form-modal.md#form-09-server-rejection-shows-in-the-form) (Edit role) and the
rule by the api contract test (`roles.api.spec.ts`).

### ROL-EDT-05 Changes reach the assignments

Given role R is assigned to a user and a group
When I add a permission to R
Then the Permissions count of R increases in the Roles list, the user's Roles tab and the
group's Roles tab

## Delete

### ROL-DEL-01 Delete

Given an unlocked role <assigned>
When I delete it from the Roles list
Then <outcome>

Main cases (unassigned, and assigned — the assignment cascades):

| assigned               | outcome                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------- |
| not assigned to anyone | the role is gone ([CONF-03](shared/confirm-dialog.md#conf-03-confirming))           |
| assigned to a user     | the role is gone, and so is the assignment: the user's Roles tab no longer lists it |

Pulp deletes a role's assignments with it, without warning. The holders lose the permissions
the role gave them.

## Role assignments (user and group Roles tabs)

These scenarios run for owner = user (user detail › Roles) and owner = group (group detail ›
Roles).

### ROLE-ASSIGN-01 Row content

Given the <owner> has role R assigned <scope>
When I open the <owner>'s Roles tab
Then a row shows Role R, its Description (or "—"), its Permissions count and a formatted
Created date

Main cases (user global, group on an object, one domain scope):

| owner | scope                             |
| ----- | --------------------------------- |
| user  | globally                          |
| group | on one repository                 |
| user  | in one domain (Requires: domains) |

Open: Pulp returns which object or domain each assignment is for, but the row does not show
it, so a role assigned twice (globally and on an object) shows as two identical-looking rows;
decide whether the UI should show the scope.

### ROLE-ASSIGN-02 Add roles

When I add roles with "Add Role" ([BATCH-07](shared/batch-add-modal.md#batch-07-every-outcome-of-an-add))
Then the toast "<n> role(s) added to <owner> "<name>"" appears and they are listed with a
new Created date

Run for owner = user (the group Roles tab uses the same tab and modal, so it is not retested).

### ROLE-ASSIGN-03 Remove one assignment of a role assigned twice

Given the user has role R globally and on one repository
When I remove one of the R rows
Then only that assignment is gone; the other R row stays

### ROLE-ASSIGN-04 Only superusers can read or change role assignments

Auth: second-user

Pulp lets only superusers list, add or remove a user's or group's role assignments. A user's
detail page is already superuser-only ([NAV-08](shared/navigation.md#nav-08-detail-pages-without-view-permission)); a group's is not.

Given a second user who may view group G but is not a superuser
When they open G's detail page
Then the tab reads "Roles (0)" and the Roles tab table shows "403: Access denied"
And "Add Role" is enabled, but its modal table shows "403: Access denied" too

### ROLE-ASSIGN-05 A role takes effect

That assigning (and removing) a role changes a second user's effective permissions through the UI
is covered by the one representative RBAC-effect e2e,
[GRP-USR-06](groups.md#grp-usr-06-adding-a-user-grants-the-groups-roles); the direct and
object-scoped variations use the same `my_permissions/` mechanism and are not tested separately.
UI gap: `my_permissions/` only returns roles held on one object, so a global role is not seen and
those actions stay disabled.
